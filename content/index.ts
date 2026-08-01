// Content loader — validates every campaign through the Zod schema at module
// load, so malformed content fails fast (in dev/build) instead of at render.
// Screens import ONLY from here; they never touch raw content objects.
import {
  CampaignCatalogSchema,
  type Campaign,
  type Mission,
  type MissionsLevel,
} from "./schema";
import { retrieverAgentCampaign } from "./campaigns/retriever-agent";
import { mcpToolAgentCampaign } from "./campaigns/mcp-tool-agent";

// Parse (not just cast) so defaults are applied and referential integrity holds.
export const campaigns: Campaign[] = CampaignCatalogSchema.parse([
  retrieverAgentCampaign,
  mcpToolAgentCampaign,
]);

/** All campaigns (full + locked) for the catalog screen. */
export function listCampaigns(): Campaign[] {
  return campaigns;
}

/** Look up a campaign by id; throws if missing (ids come from our own content). */
export function getCampaign(id: string): Campaign {
  const found = campaigns.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown campaign id: ${id}`);
  return found;
}

/** Total XP available in a campaign (sum of all mission rewards). */
export function campaignTotalXp(campaign: Campaign): number {
  return campaign.levels.reduce(
    (sum, lvl) =>
      lvl.kind === "missions"
        ? sum + lvl.missions.reduce((s, m) => s + m.reward, 0)
        : sum,
    0,
  );
}

/** Convenience: pull a mission out by level/mission index within a campaign. */
export function getMission(
  campaign: Campaign,
  levelIndex: number,
  missionIndex: number,
): Mission | undefined {
  const level = campaign.levels[levelIndex];
  if (!level || level.kind !== "missions") return undefined;
  return level.missions[missionIndex];
}

/** Type guard used by screens to narrow a level to its missions variant. */
export function isMissionsLevel(
  level: Campaign["levels"][number],
): level is MissionsLevel {
  return level.kind === "missions";
}

export * from "./schema";
export {
  evaluateSlot,
  isChecklistItemSatisfied,
  isMissionComplete,
  checklistStatus,
} from "./validation";
