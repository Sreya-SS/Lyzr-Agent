// Run-agent API — lets the learner actually TALK to the agent they just built.
// Takes the config they filled in (name / model / role / goal / instructions) and
// runs it as a live agent: primary via Lyzr Agent Studio, fallback via Groq.
// This is the "see how your agent works" payoff at the end of the build track.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const LYZR_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const RequestSchema = z.object({
  message: z.string().min(1),
  config: z.object({
    name: z.string().default("Your Agent"),
    provider: z.string().default("gpt-4o-mini"),
    role: z.string().default(""),
    goal: z.string().default(""),
    instructions: z.string().default(""),
  }),
});

/** Turn the learner's build into a system persona for the live agent. */
function personaFrom(config: z.infer<typeof RequestSchema>["config"]): string {
  return `You are "${config.name}"${config.role ? `, ${config.role}` : ""}.
Your goal: ${config.goal || "help the user"}.
Follow these instructions on every message: ${
    config.instructions || "Be helpful and concise."
  }
Stay fully in character as this agent. Answer the user directly.`;
}

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
  const { message, config } = parsed.data;
  const persona = personaFrom(config);

  const lyzrKey = process.env.LYZR_API_KEY;
  const lyzrAgent = process.env.LYZR_AGENT_ID;
  const groqKey = process.env.GROQ_API_KEY;

  try {
    // Primary: run it through Lyzr.
    if (lyzrKey && lyzrAgent) {
      const res = await fetch(LYZR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": lyzrKey },
        body: JSON.stringify({
          user_id: "hidevs-learner",
          agent_id: lyzrAgent,
          session_id: `hidevs-run-${config.name}`,
          // Reframe the hosted agent as the learner's built agent for this turn.
          message: `${persona}\n\n---\nUser: ${message}`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        const reply =
          (data.response as string) ||
          (data.message as string) ||
          (data.answer as string) ||
          "(no response)";
        return NextResponse.json({ reply: String(reply).trim(), via: "Lyzr" });
      }
      // fall through to Groq on Lyzr error
    }

    // Fallback: Groq with the persona as the system prompt.
    if (groqKey) {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 512,
          temperature: 0.5,
          messages: [
            { role: "system", content: persona },
            { role: "user", content: message },
          ],
        }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return NextResponse.json(
          { error: `Agent run error: ${data.error?.message ?? res.status}` },
          { status: 200 },
        );
      }
      const reply = data.choices?.[0]?.message?.content?.trim() || "(no response)";
      return NextResponse.json({ reply, via: "Groq" });
    }

    return NextResponse.json(
      {
        error:
          "Agent runner is offline: set LYZR_API_KEY + LYZR_AGENT_ID (or GROQ_API_KEY) in .env.local.",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "The agent runner hit a network error." },
      { status: 200 },
    );
  }
}
