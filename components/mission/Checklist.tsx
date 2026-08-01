// Mission checklist — ticks each item when its editable slots validate.
"use client";

import { useStore, EMPTY_ANSWERS } from "@/lib/store";
import { checklistStatus, type Mission } from "@/content";

export function Checklist({ mission }: { mission: Mission }) {
  const answers = useStore((s) => s.answers[mission.id]) ?? EMPTY_ANSWERS;
  const status = checklistStatus(mission, answers);
  const doneCount = Object.values(status).filter(Boolean).length;

  return (
    <div className="mb-4 rounded-panel border border-border bg-panel-2 p-[22px]">
      <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-text-mute">
        Mission checklist
      </div>
      <div>
        {mission.checklist.map((item) => {
          const done = status[item.id];
          return (
            <div
              key={item.id}
              className="flex items-center gap-[10px] border-b border-border py-2 text-[13px] text-text-dim last:border-b-0"
            >
              <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-[10px] transition-all duration-[250ms] ${
                  done
                    ? "border-g-green bg-g-green text-[#06140c]"
                    : "border-text-mute"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              {item.label}
            </div>
          );
        })}
      </div>
      <div className="mt-3 font-mono text-[11.5px] text-text-mute">
        {doneCount} / {mission.checklist.length} complete
      </div>
    </div>
  );
}
