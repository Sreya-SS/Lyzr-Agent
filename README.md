# HiDevs Agent Engineering Campaign

A gamified, hands-on learning platform for building real AI agents. Instead of
watching tutorials or filling in trivial blanks, learners make actual engineering
decisions — model choice, system instructions, temperature, retrieval config —
inside a code-editor-style mission flow, with an AI Mentor Agent available for
context-aware guidance at every step.

This repo is a from-scratch Next.js rebuild of an initial HTML/JS prototype,
redesigned around a data-driven content schema and a genuinely agentic Mentor
(tool-calling, not canned responses).

## Why this exists

Most coding tutorials are either passive (video/reading) or trivially automated
(fill-in-the-blank with no real judgment involved). This project's bet: people
learn agent engineering better when they make real trade-off decisions, see
immediate consequences, and can ask a mentor "why" — not just "what" — without
the mentor doing the work for them.

## Current status

> Update this section as you go — keep it honest about what's real vs. stubbed.

- [ ] Campaign → Level → Mission → Mini-step flow
- [ ] Data-driven mission content (Zod-validated JSON, not hardcoded)
- [ ] Mission editor (fake code editor with embedded TODO slots)
- [ ] Server-backed persistence (resume mid-mission after reload)
- [ ] Mentor Agent with real tool-calling (Anthropic API)
- [ ] Progressive hint escalation (nudge → hint → partial → full)
- [ ] Stretch: live execution of the user's final agent config against Qdrant

## Tech stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (client-side session state)
- **Persistence:** Prisma + SQLite (server-backed progress storage)
- **Validation:** Zod (content schema + API input validation)
- **AI:** Anthropic API (`@anthropic-ai/sdk`) with tool use for the Mentor Agent
- **Stretch:** Qdrant (vector DB) for real retrieval execution at level completion

## Architecture overview

```
content/
  schema.ts              # Zod schema: Campaign, Level, Mission, MiniStep, CodeLine, etc.
  campaigns/
    retriever-agent.json # Mission content — editable without touching component code

app/
  (screens)/             # CampaignSelect, ProjectSetup, LevelIntro, MiniSteps,
                          # MissionEditor, LevelComplete, CampaignSummary
  api/
    progress/             # GET/POST — load/save persisted session state
    mentor/                # POST — Mentor Agent endpoint (tool-calling)

components/
  screens/                # One component per screen, rendered generically from content/
  mission/
    MissionEditor.tsx      # Fake editor + TODO-slot mechanic, driven by CodeLine schema

lib/
  store.ts                # Zustand store: xp, timer, current position, checklist state
  prisma.ts               # DB client
```

**Core design decision:** mission content is data, not code. Adding a new mission
means editing a JSON file under `content/campaigns/`, not touching any component.
This is the main structural difference from the original prototype, where mission
content was hardcoded in JS arrays.

**Mentor Agent:** unlike a simple prompt-in/string-out chatbot, the Mentor endpoint
gives Claude access to the user's live in-progress answers via tool calls, and is
prompted to escalate help gradually rather than handing out full answers. See
`app/api/mentor/route.ts` for the tool definitions and system prompt.

## Getting started

### Prerequisites

- Node.js 18+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- (Optional, for stretch goal) A Qdrant instance — local via Docker or
  [Qdrant Cloud](https://cloud.qdrant.io) free tier

### Setup

```bash
git clone <this-repo>
cd <this-repo>
npm install
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY (and QDRANT_URL / QDRANT_API_KEY if using the stretch goal)
npx prisma migrate dev
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

| Variable            | Required | Purpose                                   |
|---------------------|----------|--------------------------------------------|
| `ANTHROPIC_API_KEY` | Yes      | Powers the Mentor Agent                    |
| `DATABASE_URL`      | Yes      | SQLite file path for Prisma (default provided) |
| `QDRANT_URL`        | No       | Only needed for the live-execution stretch goal |
| `QDRANT_API_KEY`    | No       | Only needed for the live-execution stretch goal |

## Adding a new mission

1. Add an entry to `content/campaigns/<campaign>.json` following the shape in
   `content/schema.ts` (Zod will throw a clear validation error if something's
   malformed).
2. No component code changes needed — screens render generically from content.
3. Run `npm run validate:content` (or equivalent) to check the file against the schema.

## Mentor Agent design notes

The Mentor is intentionally restrained: it can see what the learner has filled in
so far and explain trade-offs, but it does not write answers into the mission for
them. Hint escalation follows four levels:

1. **Nudge** — a pointed question ("what does a higher temperature do to
   determinism?")
2. **Stronger hint** — names the concept directly without the specific value
3. **Partial example** — shows a similar-but-different example
4. **Full answer** — only after the learner explicitly asks for it

This is implemented via the system prompt in `app/api/mentor/route.ts` plus a
`hint_level` parameter tracked per mission in the Mentor's tool context.

## Known limitations / honest gaps

- Level 0 (local project setup) is currently unverified — the app cannot confirm
  a user actually ran the setup commands on their machine. This is called out in
  the UI rather than faked.
- [Add anything else that's genuinely incomplete — evaluators notice fabricated
  "done" checkmarks faster than honest TODOs.]

## License

TBD
