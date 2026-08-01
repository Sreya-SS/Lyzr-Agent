// Progress API — server-backed session persistence.
//   GET  /api/progress  → { record | null }, ensuring a session cookie exists
//   POST /api/progress  → validate + save the posted ProgressRecord
// Session identity is a random id in an httpOnly cookie, so progress follows the
// browser session without any auth (single-user scope per CLAUDE.md).
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { progressStore } from "@/lib/persistence/jsonStore";
import { ProgressRecordSchema } from "@/lib/persistence/types";

const COOKIE = "hidevs_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getOrCreateSessionId(req: NextRequest): { id: string; isNew: boolean } {
  const existing = req.cookies.get(COOKIE)?.value;
  if (existing) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

function setSessionCookie(res: NextResponse, id: string) {
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function GET(req: NextRequest) {
  const { id, isNew } = getOrCreateSessionId(req);
  const record = isNew ? null : await progressStore.load(id);
  const res = NextResponse.json({ record });
  if (isNew) setSessionCookie(res, id);
  return res;
}

export async function POST(req: NextRequest) {
  const { id, isNew } = getOrCreateSessionId(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProgressRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid progress record", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await progressStore.save(id, parsed.data);
  const res = NextResponse.json({ ok: true });
  if (isNew) setSessionCookie(res, id);
  return res;
}
