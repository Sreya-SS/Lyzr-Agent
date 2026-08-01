// JSON-file implementation of ProgressStore. Hackathon-speed persistence: all
// sessions live in one file under /data, keyed by sessionId. Writes are
// serialized through an in-process promise chain to avoid interleaved writes.
// Single-user local scope (per CLAUDE.md) — swap for Prisma/Postgres later.
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ProgressRecordSchema,
  type ProgressRecord,
  type ProgressStore,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "progress.json");

type FileShape = Record<string, ProgressRecord>;

async function readAll(): Promise<FileShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Validate each record; drop anything malformed rather than crash.
    const out: FileShape = {};
    for (const [sid, rec] of Object.entries(parsed)) {
      const result = ProgressRecordSchema.safeParse(rec);
      if (result.success) out[sid] = result.data;
    }
    return out;
  } catch {
    return {}; // Missing/empty/corrupt file → start fresh.
  }
}

// Serialize all writes so concurrent saves don't clobber each other.
let writeChain: Promise<void> = Promise.resolve();

class JsonProgressStore implements ProgressStore {
  async load(sessionId: string): Promise<ProgressRecord | null> {
    const all = await readAll();
    return all[sessionId] ?? null;
  }

  async save(sessionId: string, record: ProgressRecord): Promise<void> {
    writeChain = writeChain.then(async () => {
      const all = await readAll();
      all[sessionId] = record;
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
    });
    return writeChain;
  }
}

/** Singleton store used by the API routes. */
export const progressStore: ProgressStore = new JsonProgressStore();
