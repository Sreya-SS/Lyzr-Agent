// Top bar — clickable brand (→ home), campaign progress bar, and the live
// XP / elapsed-time cluster. Designed to feel like a game HUD.
"use client";

import { useStore } from "@/lib/store";
import { isMissionsLevel } from "@/content";
import { formatTime } from "@/components/ui/format";

export function TopBar() {
  const xp = useStore((s) => s.xp);
  const elapsed = useStore((s) => s.elapsedSeconds);
  const screen = useStore((s) => s.screen);
  const campaign = useStore((s) => s.currentCampaign());
  const completedCount = useStore((s) => s.completedMissions.length);
  const goHome = useStore((s) => s.goHome);

  const sub = campaign?.subtitle || "Season 1 — AI Agent Odyssey";
  const totalMissions =
    campaign?.levels.reduce(
      (n, l) => n + (isMissionsLevel(l) ? l.missions.length : 0),
      0,
    ) ?? 0;
  const pct =
    totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 0;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <button
        onClick={goHome}
        className="group flex items-center gap-[10px] rounded-lg p-1 transition-opacity hover:opacity-90"
        title="Back to campaigns"
      >
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-purple to-[#5b3fd6] font-disp text-[16px] font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,.4)] transition-transform group-hover:scale-105">
          H
        </div>
        <div className="text-left">
          <div className="font-disp text-[15px] font-semibold group-hover:text-purple-light">
            HiDevs
          </div>
          <div className="mt-px text-[11px] text-text-mute">{sub}</div>
        </div>
      </button>

      <div className="flex items-center gap-5">
        {/* campaign progress — only once inside a campaign */}
        {campaign && screen !== "campaign" && totalMissions > 0 ? (
          <div className="hidden w-[160px] sm:block">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.08em] text-text-mute">
              <span>Progress</span>
              <span className="font-mono text-purple-light">
                {completedCount}/{totalMissions}
              </span>
            </div>
            <div className="h-[6px] overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple to-purple-light transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.08em] text-text-mute">
            ⏱ Elapsed
          </span>
          <span className="font-mono text-[15px] font-semibold text-g-green">
            {formatTime(elapsed)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.08em] text-text-mute">
            ✦ XP
          </span>
          <span className="font-mono text-[15px] font-semibold text-purple-light">
            {xp}
          </span>
        </div>
      </div>
    </div>
  );
}
