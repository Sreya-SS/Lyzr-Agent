// Screen 2 — Project Setup (Level 0). Renders the setup level's options +
// terminal block. Honest: no fake verification (level.setup.verified === false).
"use client";

import { useStore } from "@/lib/store";
import type { SetupLevel } from "@/content";
import { Panel, Crumb, MissionTitle, MissionDesc, Cta, ContinueRow } from "@/components/ui/primitives";

export function ProjectSetup({ level }: { level: SetupLevel }) {
  const setupChoice = useStore((s) => s.setupChoice);
  const setSetupChoice = useStore((s) => s.setSetupChoice);
  const startLevel = useStore((s) => s.startLevel);

  const active =
    level.setup.options.find((o) => o.id === setupChoice) ?? level.setup.options[0];

  return (
    <Panel>
      <Crumb lead={level.crumbLabel?.split(" · ")[0] ?? `Level ${level.index}`}>
        {level.crumbLabel ? ` · ${level.crumbLabel.split(" · ").slice(1).join(" · ")}` : ""}
      </Crumb>
      <MissionTitle>{level.title}</MissionTitle>
      {level.setup.intro ? <MissionDesc>{level.setup.intro}</MissionDesc> : null}

      <div className="mb-[18px] flex gap-[10px]">
        {level.setup.options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setSetupChoice(opt.id)}
            className={`flex-1 cursor-pointer rounded-[10px] border-[1.5px] p-[14px] text-center transition-all duration-200 ${
              opt.id === active.id
                ? "border-purple bg-purple-dim"
                : "border-border"
            }`}
          >
            <b className="mb-[3px] block font-disp text-[13.5px]">{opt.title}</b>
            <span className="text-[11px] text-text-dim">{opt.subtitle}</span>
          </div>
        ))}
      </div>

      <div className="mb-[14px] rounded-[10px] border border-border bg-code-bg px-[18px] py-4 font-mono text-[12.5px] leading-[2] text-[#9de89d]">
        {active.terminal.map((line, i) => (
          <div key={i}>
            <span className="text-text-mute">$</span> {line}
          </div>
        ))}
      </div>

      {level.setup.note ? (
        <p className="mb-[18px] text-[11.5px] italic text-text-mute">
          {level.setup.note}
        </p>
      ) : null}

      <ContinueRow
        note={
          level.setup.verified ? "Level 0 · verified" : "Level 0 · no XP, no verification"
        }
      >
        <Cta onClick={startLevel}>Next →</Cta>
      </ContinueRow>
    </Panel>
  );
}
