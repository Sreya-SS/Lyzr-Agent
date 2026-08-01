// CampaignApp — the client orchestrator. Hydrates progress from the server on
// mount, runs the elapsed-time clock, debounce-saves on meaningful changes, and
// routes to the active screen. Everything below reads from the Zustand store.
"use client";

import { useEffect, useRef } from "react";
import { useStore, type ProgressSnapshot } from "@/lib/store";
import { isMissionsLevel } from "@/content";
import { TopBar } from "@/components/layout/TopBar";
import { Toast } from "@/components/ui/Toast";
import { MentorPanel } from "@/components/mentor/MentorPanel";
import { Landing } from "@/components/screens/Landing";
import { CampaignSelect } from "@/components/screens/CampaignSelect";
import { ProjectSetup } from "@/components/screens/ProjectSetup";
import { LevelIntro } from "@/components/screens/LevelIntro";
import { MiniStepsOverview } from "@/components/screens/MiniStepsOverview";
import { MissionEditorScreen } from "@/components/screens/MissionEditorScreen";
import { LevelComplete } from "@/components/screens/LevelComplete";
import { CampaignSummary } from "@/components/screens/CampaignSummary";

export function CampaignApp() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);

  // ---- 1. Hydrate from the server once, on mount. ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/progress");
        const data = await res.json();
        if (!cancelled) {
          hydrate((data.record as Partial<ProgressSnapshot>) ?? {});
        }
      } catch {
        if (!cancelled) hydrate({}); // Offline → start fresh but usable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return hydrated ? <HydratedApp /> : <LoadingShell />;
}

function LoadingShell() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-[90px] pt-6">
      <div className="animate-pulse font-mono text-[12px] text-text-mute">
        Loading your progress…
      </div>
    </div>
  );
}

function HydratedApp() {
  const screen = useStore((s) => s.screen);

  // ---- 2. Elapsed-time clock (real seconds; freezes on campaign/summary). ----
  const tick = useStore((s) => s.tick);
  useEffect(() => {
    if (screen === "landing" || screen === "campaign" || screen === "summary")
      return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [screen, tick]);

  // ---- 3. Debounced save on meaningful state changes. ----
  // Serialize the persisted slice; the effect re-fires only when it changes.
  const snapshotKey = useStore((s) => JSON.stringify(s.snapshot()));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: snapshotKey, // already the JSON snapshot
      }).catch(() => {});
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [snapshotKey]);

  const isLanding = screen === "landing";
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-[90px] pt-6">
      {!isLanding && <TopBar />}
      {!isLanding && <NavBar />}
      <div className="animate-fadein" key={screen}>
        <ScreenRouter />
      </div>
      {!isLanding && <MentorPanel />}
      <Toast />
    </div>
  );
}

/** Global Back / Home controls — visible on every screen except the catalog. */
function NavBar() {
  const screen = useStore((s) => s.screen);
  const back = useStore((s) => s.back);
  const goHome = useStore((s) => s.goHome);
  if (screen === "landing") return null;
  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        onClick={back}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-[12.5px] font-medium text-text-dim transition-colors hover:border-purple hover:text-purple-light"
      >
        ← Back
      </button>
      <button
        onClick={goHome}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-[12.5px] font-medium text-text-dim transition-colors hover:border-purple hover:text-purple-light"
      >
        ⌂ Home
      </button>
    </div>
  );
}

function ScreenRouter() {
  const screen = useStore((s) => s.screen);
  const campaign = useStore((s) => s.currentCampaign());
  const level = useStore((s) => s.currentLevel());
  const mission = useStore((s) => s.currentMission());
  const missionIndex = useStore((s) => s.missionIndex);

  if (screen === "landing") return <Landing />;
  if (screen === "campaign" || !campaign) return <CampaignSelect />;

  if (screen === "setup") {
    return level && level.kind === "setup" ? (
      <ProjectSetup level={level} />
    ) : (
      <CampaignSelect />
    );
  }

  if (screen === "summary") return <CampaignSummary campaign={campaign} />;

  // Remaining screens require a missions level.
  if (!level || !isMissionsLevel(level)) return <CampaignSelect />;

  switch (screen) {
    case "levelintro":
      return <LevelIntro level={level} />;
    case "levelcomplete":
      return <LevelComplete level={level} />;
    case "ministeps":
      return mission ? (
        <MiniStepsOverview
          mission={mission}
          level={level}
          missionIndex={missionIndex}
        />
      ) : (
        <LevelIntro level={level} />
      );
    case "editor":
      return mission ? (
        <MissionEditorScreen
          mission={mission}
          level={level}
          missionIndex={missionIndex}
        />
      ) : (
        <LevelIntro level={level} />
      );
    default:
      return <CampaignSelect />;
  }
}
