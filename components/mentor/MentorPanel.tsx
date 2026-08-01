// Mentor panel — the slide-out chat that talks to the real tool-calling Mentor
// agent (/api/mentor). Shows the live screen context, streams the conversation,
// and exposes the tool-use trace in a collapsible dev panel so you can verify
// the agent is genuinely calling tools (not faking canned text).
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

interface ToolTraceStep {
  tool: string;
  input: unknown;
  result: unknown;
}
interface ChatTurn {
  role: "user" | "mentor";
  text: string;
  trace?: ToolTraceStep[];
}

/** Human-readable "Currently: …" label derived live from store position. */
function useScreenContext(): string {
  return useStore((s) => {
    const screen = s.screen;
    const level = s.currentLevel();
    const mission = s.currentMission();
    switch (screen) {
      case "landing":
        return "Getting started";
      case "campaign":
        return "Choosing a track";
      case "setup":
        return level ? `Level ${level.index} · Project Setup` : "Project Setup";
      case "levelintro":
        return level ? `Level ${level.index} · ${level.title}` : "Level intro";
      case "ministeps":
        return mission ? `${mission.title} · overview` : "Mission overview";
      case "editor":
        return mission ? `In mission — ${mission.shortTitle}` : "In mission";
      case "levelcomplete":
        return "Level complete";
      case "summary":
        return "Campaign complete";
    }
  });
}

export function MentorPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [showTrace, setShowTrace] = useState<number | null>(null);

  const context = useScreenContext();

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = [...turns, { role: "user" as const, text }];
    setTurns(history);
    setLoading(true);
    // Read position + current answers lazily (avoids an unstable-selector loop).
    const s = useStore.getState();
    const mission = s.currentMission();
    const mentorContext = {
      screen: s.screen,
      campaignId: s.campaignId,
      levelIndex: s.levelIndex,
      missionIndex: s.missionIndex,
      missionId: mission?.id ?? null,
      answers: mission ? (s.answers[mission.id] ?? {}) : {},
    };
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: turns.map((t) => ({
            role: t.role === "mentor" ? "assistant" : "user",
            content: t.text,
          })),
          context: mentorContext,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTurns([
          ...history,
          {
            role: "mentor",
            text:
              data.error ??
              "Something went wrong reaching the mentor. Check the server logs.",
          },
        ]);
      } else {
        setTurns([
          ...history,
          { role: "mentor", text: data.reply, trace: data.trace },
        ]);
      }
    } catch {
      setTurns([
        ...history,
        { role: "mentor", text: "Network error reaching the mentor endpoint." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-[26px] right-[26px] z-[60] flex items-center gap-[9px] rounded-[30px] bg-gradient-to-br from-purple to-[#5b3fd6] px-[18px] py-[13px] font-body text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,.35)] transition-transform hover:-translate-y-[2px]"
      >
        <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_0_3px_rgba(74,222,128,.25)]" />
        Ask Mentor
      </button>

      <div
        className={`fixed bottom-0 right-0 top-0 z-[70] flex w-[340px] max-w-[92vw] flex-col border-l border-border bg-panel transition-transform duration-[350ms] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(.4,0,.2,1)" }}
      >
        <div className="flex items-center justify-between border-b border-border p-[18px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-purple to-[#5b3fd6] text-[15px]">
              🧭
            </div>
            <div>
              <b className="block text-[13px]">Mentor Agent</b>
              <span className="font-mono text-[10.5px] text-g-green">
                ● tool-calling
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="border-none bg-none text-[18px] text-text-mute"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[18px] text-[12.5px] leading-[1.6] text-text-dim">
          <div className="mb-[14px] rounded-lg bg-purple-dim px-[10px] py-2 font-mono text-[10.5px] text-purple-light">
            Currently: {context}
          </div>

          {turns.length === 0 ? (
            <div className="rounded-[10px] border border-border bg-panel-2 px-[14px] py-3">
              <b className="mb-1 block text-[11.5px] text-text">Mentor</b>
              Stuck on a slot? Ask me — I&apos;ll nudge you toward the trade-off,
              and only spell out more if you&apos;re still stuck. I can see what
              you&apos;ve typed so far.
            </div>
          ) : null}

          {turns.map((turn, i) => (
            <div key={i} className="mb-3">
              <div
                className={`rounded-[10px] border px-[14px] py-3 ${
                  turn.role === "user"
                    ? "border-[rgba(139,92,246,.3)] bg-purple-dim/40 text-text"
                    : "border-border bg-panel-2"
                }`}
              >
                <b className="mb-1 block text-[11.5px] text-text">
                  {turn.role === "user" ? "You" : "Mentor"}
                </b>
                <span className="whitespace-pre-wrap">{turn.text}</span>
              </div>
              {turn.trace && turn.trace.length > 0 ? (
                <button
                  onClick={() => setShowTrace(showTrace === i ? null : i)}
                  className="mt-1 font-mono text-[10px] text-purple-light/80 hover:text-purple-light"
                >
                  {showTrace === i ? "▾" : "▸"} tool trace ({turn.trace.length}{" "}
                  call{turn.trace.length > 1 ? "s" : ""})
                </button>
              ) : null}
              {turn.trace && showTrace === i ? (
                <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-code-bg p-[10px] font-mono text-[10px] leading-[1.5] text-text-dim">
                  {JSON.stringify(turn.trace, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}

          {loading ? (
            <div className="font-mono text-[11px] text-text-mute">
              Mentor is thinking…
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-border p-[14px]">
          <input
            className="flex-1 rounded-lg border border-border bg-panel-2 px-3 py-[10px] font-body text-[12.5px] text-text outline-none"
            placeholder="Ask about this step…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={loading}
            className="cursor-pointer rounded-lg border-none bg-purple px-[14px] text-[13px] text-white disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
