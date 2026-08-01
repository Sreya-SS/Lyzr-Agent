// Screen 0 — Landing / hero. The motivating first impression; "Start Learning"
// drops the user into the track (campaign) catalog. Full-bleed, no HUD.
"use client";

import { useStore } from "@/lib/store";
import { listCampaigns } from "@/content";

export function Landing() {
  const goTo = useStore((s) => s.goTo);
  const xp = useStore((s) => s.xp);
  const completed = useStore((s) => s.completedMissions.length);
  const returning = xp > 0 || completed > 0;
  const trackCount = listCampaigns().filter((c) => !c.locked).length;

  return (
    <div className="flex min-h-[78vh] flex-col items-center justify-center text-center">
      {/* brand mark */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-purple to-[#5b3fd6] font-disp text-[17px] font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,.45)]">
          H
        </div>
        <span className="font-disp text-[15px] font-semibold tracking-wide">
          HiDevs
        </span>
      </div>

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,.3)] bg-purple-dim px-3.5 py-1.5 font-mono text-[11px] text-purple-light">
        ✦ Season 1 — AI Agent Odyssey
      </div>

      {/* catchy headline */}
      <h1 className="max-w-[18ch] font-disp text-[40px] font-bold leading-[1.08] sm:text-[52px]">
        Stop watching tutorials.{" "}
        <span className="bg-gradient-to-r from-purple-light via-[#8b9dff] to-[#7aa2ff] bg-clip-text text-transparent">
          Start shipping agents.
        </span>
      </h1>

      <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-text-dim sm:text-[16px]">
        Learn to build real AI agents the only way that sticks — by building one.
        Make the actual engineering calls inside a live editor, earn XP, and level
        up with an AI mentor that knows exactly where you&apos;re stuck.
      </p>

      {/* CTA */}
      <div className="mt-9 flex flex-col items-center gap-3">
        <button
          onClick={() => goTo("campaign")}
          className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-[#6d4bd6] px-8 py-4 font-disp text-[16px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(139,92,246,.75)]"
        >
          {returning ? "Continue Learning" : "Start Learning"}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        {returning && (
          <span className="font-mono text-[12px] text-text-mute">
            Welcome back — {xp} XP · {completed} mission
            {completed === 1 ? "" : "s"} done
          </span>
        )}
      </div>

      {/* feature strip */}
      <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
        <Feature icon="🎯" title="Hands-on missions" sub="Real code decisions" />
        <Feature icon="🧭" title="AI Mentor" sub="Context-aware hints" />
        <Feature icon="⚡" title="Earn XP" sub="Progress that sticks" />
        <Feature icon="📚" title={`${trackCount} track${trackCount === 1 ? "" : "s"}`} sub="More coming" />
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-panel/60 px-4 py-3 backdrop-blur">
      <span className="text-[20px]">{icon}</span>
      <div className="text-left">
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] text-text-mute">{sub}</div>
      </div>
    </div>
  );
}
