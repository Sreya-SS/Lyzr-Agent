// Upstash Redis implementation of ProgressStore — used in production (Vercel),
// where the local JSON file store can't persist on a serverless filesystem.
// The client is created lazily so importing this module never throws when the
// UPSTASH_* env vars are absent (e.g. local dev falling back to the JSON store).
import { Redis } from "@upstash/redis";
import {
  ProgressRecordSchema,
  type ProgressRecord,
  type ProgressStore,
} from "./types";

let client: Redis | null = null;
function redis(): Redis {
  // Redis.fromEnv() reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
  if (!client) client = Redis.fromEnv();
  return client;
}

const key = (sessionId: string) => `progress:${sessionId}`;

class RedisProgressStore implements ProgressStore {
  async load(sessionId: string): Promise<ProgressRecord | null> {
    const raw = await redis().get(key(sessionId)); // auto-deserialized
    if (!raw) return null;
    const parsed = ProgressRecordSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async save(sessionId: string, record: ProgressRecord): Promise<void> {
    await redis().set(key(sessionId), record); // auto-serialized to JSON
  }
}

export const redisProgressStore: ProgressStore = new RedisProgressStore();
