// Screen 7 — Campaign summary. Final build time + XP earned.
"use client";

import { useStore } from "@/lib/store";
import { formatTime } from "@/components/ui/format";
import type { Campaign } from "@/content";

export function CampaignSummary({ campaign }: { campaign: Campaign }) {
  const xp = useStore((s) => s.xp);
  const elapsed = useStore((s) => s.elapsedSeconds);
  const completion = campaign.completion;

  return (
    <div className="rounded-panel border border-border bg-panel px-5 py-[44px] text-center">
      <h2 className="mb-[10px] font-disp text-[26px]">
        {completion?.title ?? "Campaign complete"}
      </h2>
      {completion?.subtitle ? (
        <p className="mb-5 text-[13.5px] text-text-dim">{completion.subtitle}</p>
      ) : null}
      <div className="font-mono text-[40px] font-semibold text-g-green">
        {formatTime(elapsed)}
      </div>
      <p className="mt-[6px]">
        total build time · <span className="text-purple-light">{xp}</span> XP earned
      </p>
    </div>
  );
}
