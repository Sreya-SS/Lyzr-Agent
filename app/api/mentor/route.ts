// Mentor API — the real, tool-calling Mentor agent, backed by Groq's free API
// (OpenAI-compatible, Llama 3.3 70B, native function-calling). Runs a manual
// agentic loop so we can (a) execute tools against live mission content + the
// user's in-progress answers, and (b) return the full tool-use trace to the UI.
//
// The tool EXECUTORS (lib/mentor/tools.ts) are provider-agnostic — only the LLM
// call format differs from the Anthropic version. If GROQ_API_KEY is unset we
// return a clearly-labeled error (never fake mentor text).
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

const RequestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
  context: z.object({
    campaignId: z.string().nullable(),
    levelIndex: z.number().int().min(0),
    missionIndex: z.number().int().min(0),
    missionId: z.string().nullable(),
    answers: z.record(z.string(), z.string()),
  }),
});

// Convert our tool defs (Anthropic shape) to OpenAI/Groq function-calling shape.
const GROQ_TOOLS = MENTOR_TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

/** Progressive-escalation system prompt — the pedagogy lives here, not in code. */
function buildSystemPrompt(ctx: MentorContext, screenNote: string): string {
  return `You are the Mentor Agent inside "HiDevs — Agent Engineering Campaign", a hands-on
platform where developers build a real Retriever/RAG agent (LangChain + Qdrant) by
filling in TODO slots in a fake code editor.

Your job is to help the user reason through the engineering decision in front of them
— NOT to do it for them. You are a mentor, not an autocomplete.

TOOLS — use them; do not guess:
- get_mission_spec: what the current mission is and the success criteria per slot.
- get_user_progress: what the user has ACTUALLY typed so far (their in-progress slot
  values) and which slots are valid. ALWAYS call this before commenting on their work,
  so your feedback is specific ("your temperature of 0.9 is high for a factual RAG
  agent") rather than generic.
- evaluate_answer_quality: judge one slot's value against its criteria.

PROGRESSIVE ESCALATION — escalate help across the conversation, never skip ahead:
  1. First ask -> a nudge: restate the trade-off / point at what to consider.
  2. Still stuck -> a stronger hint: narrow it down, give the shape of the answer.
  3. Still stuck -> a partial example: show the pattern with a gap they fill.
  4. Only if they're clearly stuck after the above -> a fuller worked example.
Never paste the exemplar answer verbatim on a first or second request. Never write the
value into their editor for them — explain, and let them type it.

Be concise and warm. Reference their actual current values when relevant. If they're
already correct, confirm it and explain WHY it's a good choice.

Current context: ${screenNote}. The user's active mission id is ${
    ctx.missionId ?? "(none — they're not in a mission)"
  }.
Respond with your final answer only — do not narrate your tool calls.`;
}

// Minimal shape of the Groq/OpenAI chat-completions response we rely on.
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

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // TODO: requires GROQ_API_KEY — get a free key at console.groq.com.
    return NextResponse.json(
      {
        error:
          "Mentor is offline: GROQ_API_KEY is not set. Get a free key at console.groq.com and add it to .env.local (then restart the dev server).",
      },
      { status: 200 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { message, history, context } = parsed.data;
  const ctx: MentorContext = context;
  const mission = resolveMission(ctx);
  const screenNote = mission
    ? `In the editor for "${mission.title}"`
    : "Not currently in a mission";

  // OpenAI/Groq message list. `tool` messages carry results back by id.
  const messages: Record<string, unknown>[] = [
    { role: "system", content: buildSystemPrompt(ctx, screenNote) },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const trace: { tool: string; input: unknown; result: unknown }[] = [];
  const MAX_TURNS = 6;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
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
        const m = (data.error?.message ?? "").toLowerCase();
        if (res.status === 401) {
          return NextResponse.json(
            {
              error:
                "The GROQ_API_KEY looks invalid. Check it in .env.local and restart the dev server.",
            },
            { status: 200 },
          );
        }
        if (res.status === 429) {
          return NextResponse.json(
            { error: "Rate limited by Groq — wait a few seconds and try again." },
            { status: 200 },
          );
        }
        return NextResponse.json(
          { error: `Mentor API error (${res.status}): ${data.error?.message ?? m}` },
          { status: 200 },
        );
      }

      const choiceMsg = data.choices?.[0]?.message;
      if (!choiceMsg) {
        return NextResponse.json(
          { error: "The mentor got an empty response — try again." },
          { status: 200 },
        );
      }

      if (choiceMsg.tool_calls && choiceMsg.tool_calls.length > 0) {
        // Echo the assistant's tool-call message, then append each result.
        messages.push(choiceMsg as unknown as Record<string, unknown>);
        for (const tc of choiceMsg.tool_calls) {
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
        continue; // let the model react to the tool results
      }

      // Final answer.
      const reply = (choiceMsg.content ?? "").trim();
      return NextResponse.json({
        reply: reply || "(the mentor had nothing to add)",
        trace,
      });
    }

    return NextResponse.json({
      reply:
        "I dug into your progress but ran long — ask me again and I'll get straight to the point.",
      trace,
    });
  } catch {
    return NextResponse.json(
      { error: "The mentor hit a network error reaching Groq. Check the server logs." },
      { status: 200 },
    );
  }
}
