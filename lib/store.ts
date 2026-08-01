// Zustand store — all client-side session state: which screen we're on, the
// user's position (campaign/level/mission), xp, timer, setup choice, and the
// in-progress (unsubmitted) slot values per mission. This is the single source
// of truth the screens read from; persistence (Phase 3) snapshots/hydrates it.
"use client";

import { create } from "zustand";
import {
  getCampaign,
  isMissionsLevel,
  isMissionComplete,
  type Campaign,
  type Level,
  type Mission,
} from "@/content";

/**
 * Shared frozen empty map. Zustand selectors must return a STABLE reference —
 * `s.answers[id] ?? {}` inside a selector creates a new object every render and
 * causes an infinite update loop. Read the raw value in the selector and fall
 * back to this constant OUTSIDE the selector.
 */
export const EMPTY_ANSWERS: Readonly<Record<string, string>> = Object.freeze({});

/** The reference screens, as a router key. "landing" is the intro/hero. */
export type Screen =
  | "landing"
  | "campaign"
  | "setup"
  | "levelintro"
  | "ministeps"
  | "editor"
  | "levelcomplete"
  | "summary";

/** Serializable slice that gets persisted to / hydrated from the server. */
export interface ProgressSnapshot {
  screen: Screen;
  campaignId: string | null;
  levelIndex: number;
  missionIndex: number;
  xp: number;
  elapsedSeconds: number;
  setupChoice: string;
  /** answers[missionId][slotId] = current value. */
  answers: Record<string, Record<string, string>>;
  completedMissions: string[];
}

interface StoreState extends ProgressSnapshot {
  /** True once we've loaded any server-side progress (gates first render). */
  hydrated: boolean;

  // ---- selectors (computed from content + position) ----
  currentCampaign: () => Campaign | null;
  currentLevel: () => Level | null;
  currentMission: () => Mission | null;
  missionAnswers: (missionId: string) => Record<string, string>;

  // ---- actions ----
  goTo: (screen: Screen) => void;
  goHome: () => void;
  back: () => void;
  selectCampaign: (campaignId: string) => void;
  setSetupChoice: (choice: string) => void;
  startLevel: () => void;
  setSlotValue: (missionId: string, slotId: string, value: string) => void;
  completeCurrentMission: () => { awarded: number; nextScreen: Screen } | null;
  tick: () => void;
  hydrate: (snapshot: Partial<ProgressSnapshot>) => void;
  snapshot: () => ProgressSnapshot;
  reset: () => void;
}

const initial: ProgressSnapshot = {
  screen: "landing",
  campaignId: null,
  levelIndex: 0,
  missionIndex: 0,
  xp: 0,
  elapsedSeconds: 0,
  setupChoice: "clone",
  answers: {},
  completedMissions: [],
};

/** Index of the first `missions` level in a campaign (Level 0 is setup). */
function firstMissionsLevelIndex(campaign: Campaign): number {
  const idx = campaign.levels.findIndex(isMissionsLevel);
  return idx === -1 ? 0 : idx;
}

/** Index of the next `missions` level after `from`, or -1 if none. */
function nextMissionsLevelIndex(campaign: Campaign, from: number): number {
  for (let i = from + 1; i < campaign.levels.length; i++) {
    if (isMissionsLevel(campaign.levels[i])) return i;
  }
  return -1;
}

export const useStore = create<StoreState>((set, get) => ({
  ...initial,
  hydrated: false,

  currentCampaign: () => {
    const { campaignId } = get();
    return campaignId ? getCampaign(campaignId) : null;
  },
  currentLevel: () => {
    const campaign = get().currentCampaign();
    return campaign ? (campaign.levels[get().levelIndex] ?? null) : null;
  },
  currentMission: () => {
    const level = get().currentLevel();
    if (!level || !isMissionsLevel(level)) return null;
    return level.missions[get().missionIndex] ?? null;
  },
  missionAnswers: (missionId) => get().answers[missionId] ?? {},

  goTo: (screen) => set({ screen }),

  // Escape hatch back to the intro/landing (keeps XP/answers so you resume).
  goHome: () => set({ screen: "landing" }),

  // Step back one screen in the natural flow.
  back: () => {
    const state = get();
    const campaign = state.currentCampaign();
    const hasSetup = campaign?.levels.some((l) => l.kind === "setup") ?? false;
    switch (state.screen) {
      case "campaign":
        set({ screen: "landing" });
        break;
      case "setup":
        set({ screen: "campaign" });
        break;
      case "levelintro":
        set({ screen: hasSetup ? "setup" : "campaign" });
        break;
      case "ministeps":
        set({ screen: "levelintro" });
        break;
      case "editor":
        set({ screen: "ministeps" });
        break;
      case "levelcomplete":
        set({ screen: "ministeps" });
        break;
      case "summary":
        set({ screen: "campaign" });
        break;
      default:
        break;
    }
  },

  selectCampaign: (campaignId) => {
    const campaign = getCampaign(campaignId);
    if (campaign.locked) return;
    // Start at Level 0 (setup) if present, else the first missions level.
    const hasSetup = campaign.levels.some((l) => l.kind === "setup");
    set({
      campaignId,
      levelIndex: 0,
      missionIndex: 0,
      screen: hasSetup ? "setup" : "levelintro",
    });
    if (!hasSetup) set({ levelIndex: firstMissionsLevelIndex(campaign) });
  },

  setSetupChoice: (choice) => set({ setupChoice: choice }),

  // Called from Project Setup "Next" — advance to the first missions level.
  startLevel: () => {
    const campaign = get().currentCampaign();
    if (!campaign) return;
    set({
      levelIndex: firstMissionsLevelIndex(campaign),
      missionIndex: 0,
      screen: "levelintro",
    });
  },

  setSlotValue: (missionId, slotId, value) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [missionId]: { ...(s.answers[missionId] ?? {}), [slotId]: value },
      },
    })),

  completeCurrentMission: () => {
    const state = get();
    const campaign = state.currentCampaign();
    const mission = state.currentMission();
    const level = state.currentLevel();
    if (!campaign || !mission || !level || !isMissionsLevel(level)) return null;

    // Guard: award XP only once per mission (survives refresh / re-click).
    const already = state.completedMissions.includes(mission.id);
    const awarded = already ? 0 : mission.reward;

    const isLastInLevel = state.missionIndex >= level.missions.length - 1;
    let nextScreen: Screen;
    const patch: Partial<StoreState> = {
      xp: state.xp + awarded,
      completedMissions: already
        ? state.completedMissions
        : [...state.completedMissions, mission.id],
    };

    if (!isLastInLevel) {
      patch.missionIndex = state.missionIndex + 1;
      nextScreen = "ministeps";
    } else {
      nextScreen = "levelcomplete";
    }
    patch.screen = nextScreen;
    set(patch);
    return { awarded, nextScreen };
  },

  tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  hydrate: (snapshot) =>
    set((s) => ({ ...s, ...snapshot, hydrated: true })),

  snapshot: () => {
    const s = get();
    return {
      screen: s.screen,
      campaignId: s.campaignId,
      levelIndex: s.levelIndex,
      missionIndex: s.missionIndex,
      xp: s.xp,
      elapsedSeconds: s.elapsedSeconds,
      setupChoice: s.setupChoice,
      answers: s.answers,
      completedMissions: s.completedMissions,
    };
  },

  reset: () => set({ ...initial, hydrated: true }),
}));

/** Advance from the Level Complete screen to the next level, or the summary. */
export function advanceFromLevelComplete() {
  const state = useStore.getState();
  const campaign = state.currentCampaign();
  if (!campaign) return;
  const next = nextMissionsLevelIndex(campaign, state.levelIndex);
  if (next === -1) {
    useStore.setState({ screen: "summary" });
  } else {
    useStore.setState({
      levelIndex: next,
      missionIndex: 0,
      screen: "levelintro",
    });
  }
}

/** Whether the active mission's checklist is fully satisfied. */
export function useMissionComplete(): boolean {
  return useStore((s) => {
    const mission = s.currentMission();
    if (!mission) return false;
    return isMissionComplete(mission, s.answers[mission.id] ?? {});
  });
}
