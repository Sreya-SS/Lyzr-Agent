// Persistence selector — the API routes import `progressStore` from here.
// Uses Upstash Redis when its env vars are present (production / Vercel), and
// falls back to the local JSON file store for local dev. Swapping backends is
// this single decision; nothing else in the app changes.
import type { ProgressStore } from "./types";
import { progressStore as jsonProgressStore } from "./jsonStore";
import { redisProgressStore } from "./redisStore";

const useRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const progressStore: ProgressStore = useRedis
  ? redisProgressStore
  : jsonProgressStore;

export * from "./types";
