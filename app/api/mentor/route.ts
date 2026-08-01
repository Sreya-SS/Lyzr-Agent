// Mentor API — the tool-grounded Mentor agent.
//
// Backend priority:
//   1. LYZR   (Lyzr Agent Studio)  — when LYZR_API_KEY + LYZR_AGENT_ID are set
//   2. GROQ   (Llama 3.3 tool-use) — when GROQ_API_KEY is set
//   3. offline (clear labeled error)
//
// In BOTH real backends the Mentor is grounded in the user's actual in-progress
// answers via the tools in lib/mentor/tools.ts. The Lyzr path runs those tools
// server-side to build the grounding context, then delegates the reasoning to the
// hosted Lyzr agent; the Groq path lets the model call the tools itself.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  MENTOR_TOOLS,
  executeMentorTool,
  resolveMission,
  type MentorContext,
} from "@/lib/mentor/tools";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const LYZR_BASE = "https://agent-prod.studio.lyzr.ai/v3";

const RequestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .default([]),
  context: z.object({
    campaignId: z.string().nullable(),
    levelIndex: z.number().int().min(0),
    missionIndex: z.number().int().min(0),
    missionId: z.string().nullable(),
    answers: z.record(z.string(), z.string()),
  }),
});

const MENTOR_RULES = `You are the Mentor Agent for "HiDevs — Agent Engineering Campaign".
Help the learner reason through the engineering decision in front of them — never do it
for them. Escalate help across the conversation: nudge -> stronger hint -> partial
example -> fuller example. Never paste the exact answer on a first request. Never write
the value into their editor for them. Be concise and warm, and reference their actual
current values.`;

/* ------------------------------------------------------------------ */
/* Shared: build grounding from the real tools                        */
/* ------------------------------------------------------------------ */
function buildGrounding(ctx: MentorContext) {
  const spec = executeMentorTool("get_mission_spec", {}, ctx);
  const progress = executeMentorTool("get_user_progress", {}, ctx);
  const trace = [
    { tool: "get_mission_spec", input: {}, result: spec },
    { tool: "get_user_progress", input: {}, result: progress },
  ];
  return { spec, progress, trace };
}

/* ------------------------------------------------------------------ */
/* Backend: Lyzr Agent Studio                                         */
/* ------------------------------------------------------------------ */
async function mentorViaLyzr(
  apiKey: string,
  agentId: string,
  message: string,
  ctx: MentorContext,
) {
  const { spec, progress, trace } = buildGrounding(ctx);

  // Feed the hosted agent the learner's real state as context.
  const composed = `${MENTOR_RULES}

MISSION SPEC:
${JSON.stringify(spec, null, 2)}

LEARNER'S CURRENT ANSWERS & VALIDITY:
${JSON.stringify(progress, null, 2)}

LEARNER'S QUESTION:
${message}`;

  const res = await fetch(`${LYZR_BASE}/inference/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      user_id: "hidevs-learner",
      agent_id: agentId,
      session_id: `hidevs-${ctx.missionId ?? "general"}`,
      message: composed,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "Lyzr rejected the request — check LYZR_API_KEY / LYZR_AGENT_ID." },
        { status: 200 },
      );
    }
    const m = (data as { message?: string }).message ?? JSON.stringify(data);
    return NextResponse.json(
      { error: `Lyzr API error (${res.status}): ${m}` },
      { status: 200 },
    );
  }

  const reply =
    (data.response as string) ||
    (data.message as string) ||
    (data.answer as string) ||
    (typeof data === "string" ? data : "") ||
    "(the mentor had nothing to add)";

  return NextResponse.json({ reply: String(reply).trim(), trace });
}

/* ------------------------------------------------------------------ */
/* Backend: Groq (native tool-calling loop)                           */
/* ------------------------------------------------------------------ */
const GROQ_TOOLS = MENTOR_TOOLS.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

interface GroqToolCall {
  id: string;
  function: { name: string; arguments: string };
}
interface GroqMessage {
  role: string;
  content: string | null;
  tool_calls?: GroqToolCall[];
}
interface GroqResponse {
  choices?: { message: GroqMessage }[];
  error?: { message?: string };
}

async function mentorViaGroq(
  apiKey: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  ctx: MentorContext,
  screenNote: string,
) {
  const system = `${MENTOR_RULES}

TOOLS — use them; do not guess:
- get_mission_spec: mission goal + per-slot success criteria.
- get_user_progress: the learner's ACTUAL typed values and which are valid. Call this
  before commenting so your feedback is specific.
- evaluate_answer_quality: judge one slot's value.

Current context: ${screenNote}. Respond with your final answer only.`;

  const messages: Record<string, unknown>[] = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];
  const trace: { tool: string; input: unknown; result: unknown }[] = [];

  for (let turn = 0; turn < 6; turn++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        temperature: 0.4,
        tools: GROQ_TOOLS,
        tool_choice: "auto",
        messages,
      }),
    });
    const data = (await res.json()) as GroqResponse;
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mentor API error (${res.status}): ${data.error?.message ?? ""}` },
        { status: 200 },
      );
    }
    const msg = data.choices?.[0]?.message;
    if (!msg) {
      return NextResponse.json({ error: "Empty mentor response." }, { status: 200 });
    }
    if (msg.tool_calls?.length) {
      messages.push(msg as unknown as Record<string, unknown>);
      for (const tc of msg.tool_calls) {
        let args: unknown = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = {};
        }
        const result = executeMentorTool(tc.function.name, args, ctx);
        trace.push({ tool: tc.function.name, input: args, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }
    return NextResponse.json({
      reply: (msg.content ?? "").trim() || "(the mentor had nothing to add)",
      trace,
    });
  }
  return NextResponse.json({
    reply: "Ask me again and I'll get straight to the point.",
    trace,
  });
}

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { message, history, context } = parsed.data;
  const ctx: MentorContext = context;
  const mission = resolveMission(ctx);
  const screenNote = mission
    ? `In the editor for "${mission.title}"`
    : "Not currently in a mission";

  const lyzrKey = process.env.LYZR_API_KEY;
  const lyzrAgent = process.env.LYZR_AGENT_ID;
  const groqKey = process.env.GROQ_API_KEY;

  try {
    if (lyzrKey && lyzrAgent) {
      return await mentorViaLyzr(lyzrKey, lyzrAgent, message, ctx);
    }
    if (groqKey) {
      return await mentorViaGroq(groqKey, message, history, ctx, screenNote);
    }
    return NextResponse.json(
      {
        error:
          "Mentor is offline: set LYZR_API_KEY + LYZR_AGENT_ID (or GROQ_API_KEY) in .env.local and restart.",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "The mentor hit a network error. Check the server logs." },
      { status: 200 },
    );
  }
}
