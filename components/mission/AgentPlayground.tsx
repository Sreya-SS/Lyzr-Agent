// AgentPlayground — the "see how your agent works" chat, shown after the build
// track. It reads the config the learner filled in (name/model/role/goal/
// instructions across the missions) and runs it live via /api/run-agent.
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

// slot ids used by the "Build Your First Agent" campaign.
const SLOTS = {
  name: "lz-name",
  provider: "lz-provider",
  role: "lz-role",
  goal: "lz-goal",
  instr: "lz-instr",
} as const;

/** Strip surrounding quotes a learner may have typed. */
const clean = (v: string | undefined) =>
  (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

interface Turn {
  role: "user" | "agent";
  text: string;
}

export function AgentPlayground() {
  const answers = useStore((s) => s.answers);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  // Merge answers from every mission in the campaign into one config.
  const merged: Record<string, string> = Object.assign({}, ...Object.values(answers));
  const config = {
    name: clean(merged[SLOTS.name]) || "Your Agent",
    provider: clean(merged[SLOTS.provider]) || "gpt-4o-mini",
    role: clean(merged[SLOTS.role]),
    goal: clean(merged[SLOTS.goal]),
    instructions: clean(merged[SLOTS.instr]),
  };

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, config }),
      });
      const data = await res.json();
      setTurns((t) => [
        ...t,
        { role: "agent", text: data.reply ?? data.error ?? "(no response)" },
      ]);
    } catch {
      setTurns((t) => [...t, { role: "agent", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-2 max-w-[560px] rounded-panel border border-border bg-panel-2 p-5 text-left">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[18px]">🤖</span>
        <b className="font-disp text-[15px]">{config.name}</b>
        <span className="ml-auto rounded-full bg-purple-dim px-2 py-0.5 font-mono text-[10px] text-purple-light">
          live · {config.provider}
        </span>
      </div>
      <p className="mb-3 text-[11.5px] text-text-mute">
        {config.role || "your agent"} — talk to the agent you just built 👇
      </p>

      <div className="mb-3 max-h-[240px] min-h-[80px] overflow-y-auto rounded-lg border border-border bg-code-bg p-3">
        {turns.length === 0 ? (
          <p className="text-[12px] italic text-text-mute">
            Try: &quot;My invoice shows the wrong amount&quot;
          </p>
        ) : (
          turns.map((t, i) => (
            <div
              key={i}
              className={`mb-2 text-[12.5px] leading-relaxed ${
                t.role === "user" ? "text-text" : "text-text-dim"
              }`}
            >
              <b className={t.role === "user" ? "text-purple-light" : "text-g-green"}>
                {t.role === "user" ? "You" : config.name}:
              </b>{" "}
              <span className="whitespace-pre-wrap">{t.text}</span>
            </div>
          ))
        )}
        {loading && (
          <p className="font-mono text-[11px] text-text-mute">thinking…</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-[12.5px] text-text outline-none focus:border-purple"
          placeholder="Ask your agent something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-purple px-4 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
