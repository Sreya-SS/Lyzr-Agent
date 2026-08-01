// Screen 6 — Level complete. Uses the level's completion copy + badges. For the
// "Build Your First Agent" track it also shows a live playground so the learner
// can actually talk to the agent they just configured.
"use client";

import { advanceFromLevelComplete, useStore } from "@/lib/store";
import type { MissionsLevel } from "@/content";
import { Cta } from "@/components/ui/primitives";
import { AgentPlayground } from "@/components/mission/AgentPlayground";

export function LevelComplete({ level }: { level: MissionsLevel }) {
  const campaignId = useStore((s) => s.campaignId);
  const completion = level.completion;
  const title = completion?.title ?? `Level ${level.index} complete`;
  const subtitle = completion?.subtitle ?? "";
  const badges = completion?.badges ?? [];
  // Only the agent-building track has a runnable agent to try.
  const showPlayground = campaignId === "lyzr-agent";

  return (
    <div className="rounded-panel border border-border bg-panel px-5 py-[36px] text-center">
      <h2 className="mb-[10px] font-disp text-[26px]">{title}</h2>
      {subtitle ? (
        <p className="mb-5 text-[13.5px] text-text-dim">{subtitle}</p>
      ) : null}
      {badges.length ? (
        <div className="my-[20px] flex justify-center gap-[14px]">
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

      {showPlayground && <AgentPlayground />}

      <div className="mt-6">
        <Cta onClick={advanceFromLevelComplete}>Finish campaign →</Cta>
      </div>
    </div>
  );
}
