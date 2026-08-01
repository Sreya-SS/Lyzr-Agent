// Screen 5 — the editor. Three-column layout: file tree · mission editor +
// checklist · assist panel. The Continue button gates on real validation.
"use client";

import { useStore, useMissionComplete, EMPTY_ANSWERS } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Mission, MissionsLevel } from "@/content";
import { Panel, Crumb, MissionTitle, MissionDesc, Cta, ContinueRow } from "@/components/ui/primitives";
import { FileTree } from "@/components/mission/FileTree";
import { MissionEditor } from "@/components/mission/MissionEditor";
import { MiniTracker } from "@/components/mission/MiniTracker";
import { Checklist } from "@/components/mission/Checklist";
import { AssistPanel } from "@/components/mission/AssistPanel";
import { checklistStatus } from "@/content";

export function MissionEditorScreen({
  mission,
  level,
  missionIndex,
}: {
  mission: Mission;
  level: MissionsLevel;
  missionIndex: number;
}) {
  const complete = useMissionComplete();
  const completeCurrentMission = useStore((s) => s.completeCurrentMission);
  const answers = useStore((s) => s.answers[mission.id]) ?? EMPTY_ANSWERS;
  const showToast = useToast((s) => s.show);

  const isLast = missionIndex >= level.missions.length - 1;
  const status = checklistStatus(mission, answers);
  const doneCount = Object.values(status).filter(Boolean).length;

  function onContinue() {
    const result = completeCurrentMission();
    if (result) {
      showToast(
        result.awarded > 0
          ? `+${result.awarded} XP · Mission complete`
          : "Mission complete",
      );
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[220px_1fr_250px]">
      <FileTree mission={mission} />

      <div>
        <Panel>
          <Crumb lead={`Level ${level.index}`}>
            {` · Mission ${missionIndex + 1} of ${level.missions.length} · Editor`}
          </Crumb>

          <MiniTracker mission={mission} />

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-[20px] border border-[rgba(139,92,246,.3)] bg-panel-2 px-[10px] py-[5px] font-mono text-[11px] text-purple-light">
              +{mission.reward} XP
            </span>
            <span className="rounded-[20px] border border-[rgba(251,188,5,.25)] bg-panel-2 px-[10px] py-[5px] font-mono text-[11px] text-g-yellow">
              Difficulty: {mission.difficulty}
            </span>
            <span className="rounded-[20px] border border-border bg-panel-2 px-[10px] py-[5px] font-mono text-[11px] text-text-dim">
              ~{mission.estMinutes} min
            </span>
          </div>

          <MissionTitle>{mission.title}</MissionTitle>
          <MissionDesc>{mission.description}</MissionDesc>

          <MissionEditor mission={mission} />
          <Checklist mission={mission} />

          <ContinueRow note={`${doneCount} / ${mission.checklist.length} complete`}>
            <Cta ready={complete} onClick={onContinue}>
              {isLast ? "Complete level →" : "Continue →"}
            </Cta>
          </ContinueRow>
        </Panel>
      </div>

      <AssistPanel mission={mission} />
    </div>
  );
}
