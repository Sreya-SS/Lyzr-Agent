// Persistence contract. The store interface is deliberately backend-agnostic:
// today it's a local JSON file (jsonStore.ts); swapping to Postgres/Prisma later
// means implementing this same interface, with no API-route or client changes.
import { z } from "zod";

/** The persisted per-session progress record (mirrors the store's snapshot). */
export const ProgressRecordSchema = z.object({
  screen: z.enum([
    "landing",
    "campaign",
    "setup",
    "levelintro",
    "ministeps",
    "editor",
    "levelcomplete",
    "summary",
  ]),
  campaignId: z.string().nullable(),
  levelIndex: z.number().int().min(0),
  missionIndex: z.number().int().min(0),
  xp: z.number().int().min(0),
  elapsedSeconds: z.number().int().min(0),
  setupChoice: z.string(),
  answers: z.record(z.string(), z.record(z.string(), z.string())),
  completedMissions: z.array(z.string()),
});
export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;

export interface ProgressStore {
  /** Load a session's progress, or null if none saved yet. */
  load(sessionId: string): Promise<ProgressRecord | null>;
  /** Persist a session's progress (upsert). */
  save(sessionId: string, record: ProgressRecord): Promise<void>;
}
