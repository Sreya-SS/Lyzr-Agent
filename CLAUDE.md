# CLAUDE.md — HiDevs Agent Engineering Campaign (Next.js Rebuild)

## What this project is

A gamified, hands-on learning platform that teaches developers to build real AI agents
(starting with a Retriever/RAG agent using LangChain + Qdrant) through a campaign →
level → mission → mini-step progression. Users make real engineering decisions
(model choice, instructions, temperature, retrieval config) inside a code-editor-style
UI, earn XP, and get help from a context-aware "Mentor Agent."

A reference HTML file (single-page prototype, no backend, hardcoded data, stubbed
mentor) exists and defines the UX/flow/visual language. It is NOT the target
architecture — it's a wireframe. We are rebuilding this properly in Next.js with:
- Real data-driven mission content (not hardcoded JS arrays)
- A real agentic Mentor (tool-calling, not a canned string)
- Real persistence
- Ideally: real execution of the user's final agent config against a live retrieval backend

This is a competitive/internship-evaluation project — code quality, architecture
decisions, and the depth of the "agent" implementation matter more than visual polish.
Do not just port the reference screen-for-screen. Treat it as a spec for UX, not for
engineering approach.

## Tech stack (fixed)

- Next.js (App Router), TypeScript
- Tailwind CSS for styling (recreate the reference's dark/purple theme via Tailwind
  config + CSS variables, don't hand-roll a separate CSS file)
- Zustand (or React Context + useReducer if you prefer — pick one and be consistent)
  for client-side state (xp, timer, current mission, checklist state)
- API routes (`app/api/*`) for anything touching an LLM or a database — never call
  the Anthropic/OpenAI API directly from the client
- Anthropic API (`@anthropic-ai/sdk`) for the Mentor Agent, using tool use
- A lightweight persistence layer — start with a local SQLite (via Prisma) or even a
  JSON file store for hackathon speed; design the interface so it could swap to
  Postgres later. Do not use localStorage as the only persistence — it should be
  server-backed so progress isn't tied to one browser.
- Optional stretch: Qdrant (can run via Docker or Qdrant Cloud free tier) for the
  "real execution" stretch goal in Mission flow

## Non-negotiable architectural decisions

1. **Mission content is data, not code.** All campaign/level/mission/mini-step/
   checklist/code-template content lives in typed JSON/TS config files under
   `content/`, validated with a Zod schema. Screens render generically from this
   schema — adding a new mission should never require touching component code.

2. **The Mentor Agent is a real agent, not a prompt-in-string-out wrapper.**
   It must:
   - Receive the user's *current* in-progress answers for the active mission
     (their TODO-slot values) as context, not just a static screen label
   - Have at least one real tool (e.g., `get_user_progress`, `evaluate_answer_quality`,
     `get_mission_spec`) it can call via Claude's tool-use API
   - Escalate hints progressively (nudge → stronger hint → partial example →
     full answer) rather than giving the full answer immediately
   - Never write the user's answer into the input field for them — it explains,
     it doesn't do the mission

3. **Verification, where possible, should be real.** Level 0 project setup in the
   reference is "trust me, click Next" — if time allows, replace with either a
   downloadable verification script or a WebContainer-based in-browser check.
   If not feasible in the time available, keep it honest (labeled as unverified)
   rather than faking a check.

4. **State that must persist across reload:** xp, elapsed time, current campaign/
   level/mission index, checklist/slot completion, and in-progress (unsubmitted)
   field values. A user closing the tab mid-mission should resume exactly where
   they left off.

## Code style / conventions

- TypeScript strict mode on. No `any` unless truly unavoidable (and comment why).
- Components: functional, colocate small pieces, but split by screen
  (`components/screens/CampaignSelect.tsx`, etc.) mirroring the reference's screen
  names for traceability.
- Keep the fake-editor rendering (syntax-highlighted code with embedded input/select
  "TODO slots") as a dedicated component (`components/mission/MissionEditor.tsx`)
  driven entirely by the mission schema's `codeLines` — don't inline raw HTML strings
  like the reference does.
- API routes should validate input with Zod and return typed responses.
- Every new file should have a one-line comment at the top stating its purpose.
- Prefer explicit over clever. This code will be read/reviewed by evaluators.

## What NOT to do

- Don't hardcode mission content directly in components.
- Don't fake the Mentor Agent with a switch statement of canned responses — if the
  Anthropic API key isn't available in dev, stub it clearly with a `TODO: requires
  ANTHROPIC_API_KEY` comment, don't silently fall back to fake text.
- Don't skip the Zod schema step "to save time" — the data-driven architecture is
  a core differentiator of this solution, not a nice-to-have.
- Don't add authentication/multi-user support unless explicitly asked — out of scope
  for now, single-user local state is fine (but server-backed, not just localStorage).

## Environment / secrets

- `.env.local` for `ANTHROPIC_API_KEY` (and `QDRANT_URL` / `QDRANT_API_KEY` if the
  stretch goal is attempted). Never commit `.env.local`. Add a `.env.example`.

## Definition of done for each work session

Before saying a feature is complete:
- It renders correctly at each relevant screen state (loading, empty, filled, error)
- TypeScript compiles with no errors
- If it touches mission content, it works by editing the JSON/config, not the code
- If it touches the Mentor, it demonstrably uses tool-calling (show the tool_use
  block in a console log or dev panel during testing)
