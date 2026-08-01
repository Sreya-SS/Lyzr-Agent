// MissionEditor — the fake code editor. Renders entirely from mission.codeLines
// (structured token segments), interleaving styled text with interactive slots.
// No raw HTML strings; adding a new mission needs zero changes here.
"use client";

import { useStore, EMPTY_ANSWERS } from "@/lib/store";
import type { CodeLine, CodeToken, Mission, Slot } from "@/content";
import { CodeSlot } from "./CodeSlot";

const TOKEN_CLASS: Record<CodeToken, string> = {
  plain: "text-[#c9c9d6]",
  kw: "text-syntax-kw",
  fn: "text-syntax-fn",
  cmt: "text-syntax-cmt",
  str: "text-syntax-str",
  num: "text-syntax-str",
};

export function MissionEditor({ mission }: { mission: Mission }) {
  const answers = useStore((s) => s.answers[mission.id]) ?? EMPTY_ANSWERS;
  const setSlotValue = useStore((s) => s.setSlotValue);

  const slotById = new Map<string, Slot>(mission.slots.map((s) => [s.id, s]));

  // Line numbers skip blank lines, matching the reference.
  let lineNo = 0;

  return (
    <div className="mb-4 overflow-hidden rounded-[12px] border border-border bg-code-bg">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-panel-2 px-[14px] py-[10px]">
        <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
        <span className="ml-[6px] font-mono text-[11.5px] text-text-dim">
          {mission.file}
        </span>
      </div>

      {/* code */}
      <div className="overflow-x-auto py-[18px] font-mono text-[13px] leading-[1.9]">
        {mission.codeLines.map((line, i) => {
          const isBlank = line.segments.length === 0;
          if (!isBlank) lineNo += 1;
          return (
            <div
              key={i}
              className={`flex ${line.highlight ? "bg-[rgba(52,168,83,.08)]" : ""}`}
            >
              <span
                className={`w-[34px] flex-shrink-0 select-none pr-[14px] text-right ${
                  line.highlight ? "text-g-green" : "text-text-mute"
                }`}
              >
                {isBlank ? "" : lineNo}
              </span>
              <span
                className="whitespace-pre text-[#c9c9d6]"
                style={{ paddingLeft: `${line.indent * 22}px` }}
              >
                {renderSegments(line, slotById, answers, (slotId, value) =>
                  setSlotValue(mission.id, slotId, value),
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderSegments(
  line: CodeLine,
  slotById: Map<string, Slot>,
  answers: Record<string, string>,
  onChange: (slotId: string, value: string) => void,
) {
  return line.segments.map((seg, i) => {
    if (seg.kind === "text") {
      return (
        <span key={i} className={TOKEN_CLASS[seg.token]}>
          {seg.text}
        </span>
      );
    }
    const slot = slotById.get(seg.slotId);
    if (!slot) return null; // schema guarantees this won't happen at runtime
    return (
      <CodeSlot
        key={i}
        slot={slot}
        value={answers[slot.id] ?? ""}
        onChange={(v) => onChange(slot.id, v)}
      />
    );
  });
}
