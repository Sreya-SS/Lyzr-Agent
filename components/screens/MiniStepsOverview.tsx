// Screen 4 — Mission mini-steps overview. The "shape of what's coming" before
// the editor, rendered from mission.miniSteps.
"use client";

import { useStore } from "@/lib/store";
import type { Mission, MissionsLevel } from "@/content";
import { Panel, Crumb, MissionTitle, MissionDesc, Cta, ContinueRow } from "@/components/ui/primitives";

export function MiniStepsOverview({
  mission,
  level,
  missionIndex,
}: {
  mission: Mission;
  level: MissionsLevel;
  missionIndex: number;
}) {
  const goTo = useStore((s) => s.goTo);

  return (
    <Panel>
      <Crumb lead={`Level ${level.index}`}>
        {` · Mission ${missionIndex + 1} of ${level.missions.length}`}
      </Crumb>
      <MissionTitle>{mission.title}</MissionTitle>
      <MissionDesc>{mission.description}</MissionDesc>

      <div className="my-[18px] flex flex-col">
        {mission.miniSteps.map((step, i) => (
          <div key={step.id} className="relative flex gap-[14px] px-1 py-[14px]">
            {i < mission.miniSteps.length - 1 ? (
              <span className="absolute left-[15px] top-[38px] -bottom-1 w-[2px] bg-border" />
            ) : null}
            <div className="z-[1] flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-panel-2 font-mono text-[12px] text-text-dim">
              {i + 1}
            </div>
            <div>
              <b className="mb-[2px] block text-[13px]">{step.label}</b>
              <span className="text-[11.5px] text-text-mute">{step.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <ContinueRow note={`+${mission.reward} XP on completion`}>
        <Cta onClick={() => goTo("editor")}>Begin mission →</Cta>
      </ContinueRow>
    </Panel>
  );
}
