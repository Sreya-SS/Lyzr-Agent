// Screen 3 — Level intro. Lists the level's missions and total XP available.
"use client";

import { useStore } from "@/lib/store";
import type { MissionsLevel } from "@/content";
import { Panel, Crumb, Cta, ContinueRow } from "@/components/ui/primitives";

export function LevelIntro({ level }: { level: MissionsLevel }) {
  const goTo = useStore((s) => s.goTo);
  const totalXp = level.missions.reduce((n, m) => n + m.reward, 0);
  const [lead, ...rest] = (level.crumbLabel ?? `Level ${level.index} · ${level.title}`).split(" · ");

  return (
    <Panel>
      <Crumb lead={lead}>{rest.length ? ` · ${rest.join(" · ")}` : ""}</Crumb>
      <div className="mb-[18px] flex items-center gap-[14px]">
        <div className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[12px] bg-purple-dim font-disp text-[18px] font-bold text-purple-light">
          {String(level.index).padStart(2, "0")}
        </div>
        <div>
          <h1 className="mb-[2px] font-disp text-[22px] font-semibold">{level.title}</h1>
          {level.subtitle ? (
            <p className="text-[13px] text-text-dim">{level.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-1">
        {level.missions.map((m, i) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border-b border-border py-3 text-[13px] last:border-b-0"
          >
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border border-border bg-panel-2 font-mono text-[10.5px] text-text-mute">
              {i + 1}
            </span>
            <span className="flex-1">{m.shortTitle}</span>
            <span className="font-mono text-[11px] text-purple-light">+{m.reward} XP</span>
          </div>
        ))}
      </div>

      <ContinueRow note={`${totalXp} XP available`}>
        <Cta onClick={() => goTo("ministeps")}>Start level →</Cta>
      </ContinueRow>
    </Panel>
  );
}
