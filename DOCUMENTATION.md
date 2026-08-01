# HiDevs — Agent Engineering Campaign

A gamified, hands-on platform that teaches developers to build **real AI agents** —
starting with a Retriever / RAG agent (LangChain + Qdrant) — through a
`campaign → level → mission → mini-step` progression. Learners make genuine
engineering decisions (model choice, system instruction, temperature, retrieval
config) inside a code-editor-style UI, earn XP, and get help from a context-aware
**Mentor Agent** that actually inspects their work.

---

## 1. Purpose — the problem this solves

Most "learn AI" content is passive: you watch a video or read docs, then stare at a
blank file. The knowledge doesn't stick because you never made the decisions
yourself.

**This project flips that.** Instead of explaining what `temperature` or `top_k`
does, it drops you into a realistic `agent.py` with the boring parts pre-wired and
makes *you* fill in the decisions that matter — then validates them and coaches you
through the trade-offs. You learn by building a working agent, not by reading about
one.

**Who it's for:** developers new to agent/RAG engineering who learn best by doing.

**What makes it different (the three pillars):**

1. **Mission content is data, not code** — every mission is a typed, validated
   config file. Screens render generically from it.
2. **The Mentor is a real agent** — it uses live tool-calling to read your
   in-progress answers and give specific, escalating hints, not canned text.
3. **Progress is server-backed** — close the tab mid-mission and resume exactly
   where you left off.

---

## 2. What the user experiences (the flow)

```
Landing (hero + "Start Learning")
   → Choose your track (campaign catalog)
      → Project Setup (Level 0 — clone/scratch, run commands locally)
         → Level Intro (missions overview + XP available)
            → Mission mini-steps (the shape of what's coming)
               → Editor (fill the TODO slots in fake agent.py)  ←── Ask Mentor here
                  → Level Complete (badges)
                     → Campaign Summary (total time + XP)
```

- **The editor** is the core mechanic: syntax-highlighted `agent.py` with embedded
  dropdowns/inputs ("TODO slots"). Pick `gemini-2.5-flash` vs `pro`, write the system
  instruction, set temperature 0–1, name the Qdrant collection, set `top_k`.
- **Validation is real:** the checklist ticks only when an answer is actually valid
  (e.g. `temperature=banana` fails; `top_k` must be an integer 1–10). It reflects
  *correctness*, not just "filled in".
- **XP, an elapsed timer, and a progress bar** give it game feel.
- **Ask Mentor** opens a side panel where an AI mentor answers questions grounded in
  what you've typed so far.

---

## 3. Architecture at a glance

```
┌─────────────────────────────────────────────────────────────────┐
│  content/  (DATA)                                                 │
│    schema.ts        Zod schema: Campaign→Level→Mission→…          │
│    campaigns/*.ts   The actual mission content (validated data)   │
│    validation.ts    Shared "is this answer correct?" logic        │
└───────────────┬─────────────────────────────────────────────────┘
                │ (validated at load)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/  (generic renderers — no hardcoded mission text)     │
│    screens/*        one component per screen                      │
│    mission/*        MissionEditor, CodeSlot, Checklist, …         │
│    CampaignApp.tsx  orchestrator: hydrate, timer, save, route     │
└───────────────┬─────────────────────────────────────────────────┘
                │ reads/writes
                ▼
┌───────────────────────────┐     ┌─────────────────────────────────┐
│  lib/store.ts (Zustand)   │     │  app/api/  (server)             │
│   xp, timer, position,    │◄───►│   /progress  save/load          │
│   answers, screen         │     │   /mentor    tool-calling agent │
└───────────────────────────┘     └───────────────┬─────────────────┘
                                                   │
                          ┌────────────────────────┴───────────┐
                          ▼                                     ▼
                 lib/persistence/                       lib/mentor/tools.ts
                 (Redis or JSON file)                   (3 real tools + executor)
                                                                │
                                                                ▼
                                                        Groq API (Llama 3.3)
```

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router)** + **React 19** | Server + client in one repo; API routes keep secrets off the client |
| Language | **TypeScript (strict)** | Type safety across content ↔ screens ↔ API |
| Styling | **Tailwind CSS v3** + CSS variables | Dark/purple theme defined once in `tailwind.config.ts` + `globals.css` |
| Client state | **Zustand** | Minimal, no boilerplate; single store for the whole session |
| Content validation | **Zod** | The schema is the contract; invalid content fails at build time |
| Mentor LLM | **Groq** (`llama-3.3-70b-versatile`) | Free, fast, native function-calling |
| Persistence | **Upstash Redis** (prod) / **JSON file** (local) | Swappable behind one interface |

---

## 5. The three pillars in detail

### Pillar 1 — Mission content is DATA (`content/`)

Everything a mission contains — its title, the code lines, the fill-in slots, the
checklist, the assist-panel hints — lives in `content/campaigns/retriever-agent.ts`
as a plain object, and is validated by a **Zod schema** in `content/schema.ts`.

Key schema pieces:

- **`Campaign → Level → Mission → MiniStep`** hierarchy. `Level` is a discriminated
  union: a `setup` level (Level 0) vs a `missions` level.
- **`CodeLine`** — a line of the fake editor is an array of **structured token
  segments**, not an HTML string. A segment is either styled text (`kw`/`fn`/`cmt`/
  `str`) or a reference to a **`Slot`**. This is what lets `MissionEditor` render any
  mission generically.
- **`Slot`** — an interactive TODO hole. Carries its input type (`select`/`text`),
  options, a `state` (`editable` or `locked` for values carried over from an earlier
  mission), rich **validation rules** (allowed values, numeric range, regex,
  min-length), plus `criteria` and an `exemplar` used by the Mentor.
- **`ChecklistItem`, `AssistTab`/`AssistBlock`** (trade-offs / common-mistakes /
  docs tabs — structured blocks, never raw HTML).

**Referential integrity is enforced at load** via Zod `superRefine`: every slot
points at a real checklist item, every inline slot reference resolves, and every
checklist item is satisfiable. Malformed content throws before it can render.

> **Payoff:** adding a whole new mission means editing a data file — zero component
> changes.

### Pillar 2 — The Mentor is a REAL agent (`app/api/mentor` + `lib/mentor/tools.ts`)

The Mentor is **not** a prompt-in-string-out wrapper. It runs a manual tool-calling
loop against the Groq API and has three real tools:

| Tool | What it does |
|---|---|
| `get_mission_spec` | Returns the mission goal + per-slot success criteria (no answers) |
| `get_user_progress` | Reads the user's **current in-progress answers** and reports which are valid |
| `evaluate_answer_quality` | Judges one slot's value against its criteria |

**How a turn works:**

1. The browser sends the user's question **+ their current typed answers** to
   `/api/mentor`.
2. The server calls the LLM with the tool schemas. The model decides which tools to
   call.
3. The server **executes those tools locally** against the validated mission content
   and the user's answers, feeds the results back, and loops until the model produces
   a final answer.
4. It returns the reply **plus the full tool-use trace**, which the UI shows in a
   collapsible viewer — so you can verify it genuinely called tools.

**Progressive escalation:** the system prompt makes the Mentor escalate help across a
conversation — nudge → stronger hint → partial example → full example — and it never
writes the answer into your editor for you.

> **Example (real trace):** a user with `temperature = 0.9` asks "is this ok?". The
> Mentor calls `get_user_progress` (sees `0.9`), then `get_mission_spec` (reads the
> criteria), then replies: *"0.9 is high for a factual RAG agent — you want
> ~0.0–0.3…"* — grounded in the actual value, without handing over the answer.

### Pillar 3 — Server-backed persistence (`lib/persistence/` + `app/api/progress`)

A tiny **`ProgressStore` interface** (`load`/`save`) with two implementations:

- **`jsonStore.ts`** — writes `data/progress.json` (local dev).
- **`redisStore.ts`** — Upstash Redis (production/Vercel, where the filesystem is
  ephemeral).

`lib/persistence/index.ts` picks Redis automatically when `UPSTASH_*` env vars are
present, else the JSON file. A random session id in an httpOnly cookie identifies the
browser (no login — single-user scope by design).

The client (`CampaignApp.tsx`) **hydrates** from `/api/progress` on mount and
**debounce-saves** the snapshot (xp, timer, position, checklist/slot values, screen)
on every meaningful change. Result: refresh or close the tab and you resume exactly
where you left off.

---

## 6. Project structure

```
Lyzr Agent/
├── content/                      # DATA layer (the differentiator)
│   ├── schema.ts                 # Zod schema — the single contract
│   ├── validation.ts             # shared slot-correctness logic
│   ├── index.ts                  # validated loader + helpers
│   └── campaigns/
│       ├── retriever-agent.ts    # the real 2-mission campaign
│       └── mcp-tool-agent.ts     # locked "coming soon" stub
│
├── lib/
│   ├── store.ts                  # Zustand store (session state)
│   ├── toast.ts                  # toast notifications
│   ├── mentor/tools.ts           # Mentor's 3 tools + executor
│   └── persistence/
│       ├── types.ts              # ProgressStore interface + Zod record
│       ├── jsonStore.ts          # local JSON-file backend
│       ├── redisStore.ts         # Upstash Redis backend
│       └── index.ts              # auto-selects backend
│
├── app/
│   ├── layout.tsx / globals.css  # fonts + theme (ported palette)
│   ├── page.tsx                  # mounts <CampaignApp/>
│   └── api/
│       ├── progress/route.ts     # GET/POST save-load (Zod-validated)
│       └── mentor/route.ts       # tool-calling Mentor (Groq)
│
├── components/
│   ├── CampaignApp.tsx           # orchestrator: hydrate/timer/save/route
│   ├── layout/TopBar.tsx         # HUD: logo(→home), progress bar, XP, timer
│   ├── ui/                       # Panel, Cta, Toast, primitives
│   ├── screens/                  # Landing, CampaignSelect, ProjectSetup,
│   │                             #   LevelIntro, MiniStepsOverview,
│   │                             #   MissionEditorScreen, LevelComplete,
│   │                             #   CampaignSummary
│   └── mission/                  # MissionEditor, CodeSlot, Checklist,
│                                 #   MiniTracker, AssistPanel, FileTree
│
├── tailwind.config.ts            # theme tokens → CSS variables
├── .env.example                  # env var template (no real secrets)
└── DOCUMENTATION.md              # this file
```

---

## 7. Notable design decisions & trade-offs

- **Structured code tokens over HTML strings.** The reference prototype inlined raw
  HTML for the editor. We model each code line as typed segments so a generic
  renderer + real `<input>`/`<select>` controls can be driven purely by data.
- **Validation lives in the schema, shared by UI and Mentor.** One
  `evaluateSlot()` implementation powers both the checklist and the Mentor's
  `evaluate_answer_quality` tool — a single source of truth for "is this correct?".
- **Per-mission code snapshots with `locked` slots** instead of a diff engine.
  Mission 2 ships its own full `agent.py` with Mission-1 values shown pre-filled/
  locked — simpler to author, no cross-mission patching.
- **Swappable persistence interface.** Started with a JSON file for speed; Redis
  drops in for production with a one-line selector change and no app-code changes.
- **Honest degradation.** No Mentor key → a clearly labeled "offline" message, never
  fake text. Level 0 setup is labeled "unverified" rather than faking a check.
- **Provider swap (Anthropic → Groq).** The Mentor was first built on Anthropic
  (Claude tool-use). Because the tool *executors* are provider-agnostic, moving to
  Groq's free function-calling API only touched the single LLM-call file.

---

## 8. Running it locally

```bash
npm install
# create .env.local with at least:
#   GROQ_API_KEY=gsk_...            (free from console.groq.com — enables Mentor)
# (Upstash vars optional locally; without them it uses a JSON file store)
npm run dev
# open http://localhost:3000
```

- Without `GROQ_API_KEY`: everything works except the Mentor, which shows an offline
  message.
- `npm run build` / `npx tsc --noEmit` — production build + typecheck.

---

## 9. Deployment (Vercel)

1. Push to GitHub (ensure **no real secrets** are committed — `.env.local` is
   gitignored; keep `.env.example` blank).
2. Import the repo on **vercel.com** (auto-detects Next.js).
3. Set environment variables in Vercel:
   - `GROQ_API_KEY` — the Mentor.
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — persistence
     (create a free Upstash Redis DB, or use Vercel's Upstash integration which
     injects these automatically).
4. Deploy. The persistence layer auto-switches to Redis because the env vars are
   present.

---

## 10. Status & scope

**Done:** data-driven content + schema, all screens, navigation, Zustand state,
server-backed persistence (JSON + Redis), and the real tool-calling Mentor with
progressive hints and a visible trace.

**Intentionally out of scope:** authentication/multi-user (single-user by design).

**Future / stretch (not built):** *real execution* of the user's final `agent.py`
config against a live or mocked Qdrant collection at Level Complete — showing an
actual retrieved answer instead of a checkmark. The content schema already carries
the retrieval config needed to support it.
