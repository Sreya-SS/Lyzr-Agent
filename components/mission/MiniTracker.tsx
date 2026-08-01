// MiniTracker — the pill row showing per-checklist-item progress (active/done),
// labeled by the aligned mini-step where available.
"use client";

import { useStore, EMPTY_ANSWERS } from "@/lib/store";
import { checklistStatus, type Mission } from "@/content";

export function MiniTracker({ mission }: { mission: Mission }) {
  const answers = useStore((s) => s.answers[mission.id]) ?? EMPTY_ANSWERS;
  const status = checklistStatus(mission, answers);
  const done = mission.checklist.map((item) => status[item.id] ?? false);

  return (
    <div className="mb-4 flex gap-[6px]">
      {mission.checklist.map((item, i) => {
        // "active" = first not-yet-done item (all earlier ones done).
        const active = !done[i] && done.slice(0, i).every(Boolean);
        const label = mission.miniSteps[i]?.label ?? item.label;
        return (
          <div
            key={item.id}
            className={`flex-1 rounded-lg border px-[10px] py-2 text-center font-mono text-[10.5px] transition-all duration-300 ${
              done[i]
                ? "border-g-green bg-panel-2 text-g-green"
                : active
                  ? "border-purple bg-purple-dim text-purple-light"
                  : "border-border bg-panel-2 text-text-mute"
            }`}
          >
            {i + 1}. {label}
          </div>
        );
      })}
    </div>
  );
}
