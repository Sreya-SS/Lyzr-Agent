// Screen 6 — Level complete. Uses the level's completion copy + badges.
"use client";

import { advanceFromLevelComplete } from "@/lib/store";
import type { MissionsLevel } from "@/content";
import { Cta } from "@/components/ui/primitives";

export function LevelComplete({ level }: { level: MissionsLevel }) {
  const completion = level.completion;
  const title = completion?.title ?? `Level ${level.index} complete`;
  const subtitle = completion?.subtitle ?? "";
  const badges = completion?.badges ?? [];

  return (
    <div className="rounded-panel border border-border bg-panel px-5 py-[44px] text-center">
      <h2 className="mb-[10px] font-disp text-[26px]">{title}</h2>
      {subtitle ? (
        <p className="mb-5 text-[13.5px] text-text-dim">{subtitle}</p>
      ) : null}
      {badges.length ? (
        <div className="my-[22px] flex justify-center gap-[14px]">
          {badges.map((b, i) => (
            <div
              key={i}
              className="flex h-[56px] w-[56px] items-center justify-center rounded-[14px] border border-[rgba(139,92,246,.35)] bg-purple-dim text-[22px]"
            >
              {b}
            </div>
          ))}
        </div>
      ) : null}
      <Cta onClick={advanceFromLevelComplete}>Finish campaign →</Cta>
    </div>
  );
}
