// Content for the "Retriever Agent" campaign — a LangChain + Qdrant RAG agent.
// This is DATA that conforms to CampaignSchema (validated at load in content/index.ts).
// Nothing here is rendered as raw HTML; code is expressed as structured segments.
//
// Authored against the schema types so mistakes surface at compile time; the
// runtime Zod parse in the index applies defaults and enforces referential
// integrity (slot ↔ checklist ↔ codeLines).
import type { CampaignInput } from "../schema";

/* Small helpers to keep codeLines readable without inventing a whole DSL. */
const t = (text: string, token?: "plain" | "kw" | "fn" | "cmt" | "str" | "num") =>
  ({ kind: "text" as const, text, ...(token ? { token } : {}) });
const slot = (slotId: string) => ({ kind: "slot" as const, slotId });

export const retrieverAgentCampaign: CampaignInput = {
  id: "retriever-agent",
  title: "Retriever Agent",
  subtitle: "Season 1 — AI Agent Odyssey",
  badge: "LangChain · Qdrant",
  description:
    "Build a simple agent that answers from your own documents using vector retrieval.",
  tags: ["LangChain", "Qdrant", "RAG"],
  estMinutes: 40,
  completion: {
    title: "Simple agent — built.",
    subtitle: "LangChain agent wired to Qdrant retrieval, running locally.",
  },
  levels: [
    /* ---------------- Level 0 — Project Setup ---------------- */
    {
      kind: "setup",
      id: "level-0-setup",
      index: 0,
      title: "Get your project on disk",
      subtitle: "Project Setup",
      crumbLabel: "Level 0 · Project Setup",
      setup: {
        intro:
          "Everything from here runs locally on your machine — HiDevs never hosts or executes your agent.",
        options: [
          {
            id: "clone",
            title: "Clone Template",
            subtitle: "Pre-wired boilerplate + folders",
            terminal: [
              "git clone https://github.com/hidevs/retriever-agent-template",
              "cd retriever-agent-template",
              "python -m venv .venv && source .venv/bin/activate",
              "pip install -r requirements.txt",
            ],
          },
          {
            id: "scratch",
            title: "Start from Scratch",
            subtitle: "Empty repo, you build structure",
            terminal: [
              "mkdir retriever-agent && cd retriever-agent",
              "python -m venv .venv && source .venv/bin/activate",
              "pip install langchain qdrant-client",
              "touch agent.py qdrant_setup.py",
            ],
          },
        ],
        note: "We can't verify your local machine — once you've run these, just click Next.",
        verified: false,
      },
    },

    /* ---------------- Level 1 — Root Agent ---------------- */
    {
      kind: "missions",
      id: "level-1-root-agent",
      index: 1,
      title: "Root Agent",
      subtitle: "Bring agent.py to life and wire it to retrieval.",
      crumbLabel: "Level 1 · Root Agent",
      completion: {
        title: "Level 1 complete",
        subtitle:
          "agent.py is fully wired — model, instructions, and retrieval all yours.",
        badges: ["🏆", "⚡", "🔓"],
      },
      missions: [
        /* ===== Mission 1 — Bring the agent to life ===== */
        {
          id: "m1-bring-to-life",
          file: "agent.py",
          title: "Mission 1 — Bring the agent to life",
          shortTitle: "Bring the agent to life",
          description:
            "The Qdrant boilerplate is already wired up in qdrant_setup.py — you don't touch that. Your job: pick the model and write the instruction it runs on.",
          reward: 40,
          difficulty: "Easy",
          estMinutes: 12,
          miniSteps: [
            {
              id: "ms-model",
              label: "Choose your model",
              sub: "Flash vs Pro — a real trade-off, not a formality",
            },
            {
              id: "ms-instr",
              label: "Write the instruction",
              sub: "What the agent is told to do on every call",
            },
            {
              id: "ms-temp",
              label: "Set the temperature",
              sub: "Controls how deterministic answers are",
            },
          ],
          checklist: [
            { id: "chk-model", label: "Model selected" },
            { id: "chk-instr", label: "Instruction written" },
            { id: "chk-temp", label: "Temperature set" },
          ],
          slots: [
            {
              id: "model",
              checklistId: "chk-model",
              kind: "select",
              options: [
                { value: "gemini-2.5-flash", label: '"gemini-2.5-flash"' },
                { value: "gemini-2.5-pro", label: '"gemini-2.5-pro"' },
              ],
              validation: {
                required: true,
                allowedValues: ["gemini-2.5-flash", "gemini-2.5-pro"],
              },
              criteria:
                "Either model is defensible. Flash = faster/cheaper, good for tool-routing; Pro = stronger reasoning for ambiguous queries.",
            },
            {
              id: "instr",
              checklistId: "chk-instr",
              kind: "text",
              placeholder: "write agent instruction…",
              validation: { required: true, minLength: 15 },
              criteria:
                "A clear system instruction telling the agent to answer strictly from retrieved documents, cite/ground its answers, and say it doesn't know when retrieval returns nothing.",
              exemplar:
                "You are a helpful assistant. Answer the user's question using ONLY the retrieved context. If the context doesn't contain the answer, say you don't know rather than guessing.",
            },
            {
              id: "temp",
              checklistId: "chk-temp",
              kind: "text",
              placeholder: "0.0–1.0",
              validation: {
                required: true,
                number: { min: 0, max: 1 },
              },
              criteria:
                "For a factual RAG agent you want low temperature (~0.0–0.3) so answers stay grounded and deterministic.",
              exemplar: "0.3",
            },
          ],
          codeLines: [
            {
              segments: [
                t(
                  "# imports + Qdrant client are pre-wired in qdrant_setup.py",
                  "cmt",
                ),
              ],
            },
            {
              segments: [
                t("from", "kw"),
                t(" qdrant_setup "),
                t("import", "kw"),
                t(" retriever"),
              ],
            },
            {
              segments: [
                t("from", "kw"),
                t(" langchain.agents "),
                t("import", "kw"),
                t(" "),
                t("create_agent", "fn"),
              ],
            },
            { segments: [] },
            {
              segments: [
                t("root_agent = "),
                t("create_agent", "fn"),
                t("("),
              ],
            },
            { indent: 1, segments: [t("model="), slot("model"), t(",")] },
            {
              indent: 1,
              segments: [t("instructions="), slot("instr"), t(",")],
            },
            {
              indent: 1,
              segments: [t("temperature="), slot("temp"), t(",")],
            },
            {
              indent: 1,
              segments: [
                t("retriever=retriever  "),
                t("# ← from boilerplate, already connected", "cmt"),
              ],
            },
            { segments: [t(")")] },
          ],
          assist: [
            {
              id: "tradeoffs",
              label: "Trade-offs",
              blocks: [
                {
                  kind: "tradeoff",
                  columns: [
                    {
                      title: "gemini-2.5-flash",
                      points: ["Faster", "Cheaper", "Good for tool-routing"],
                    },
                    {
                      title: "gemini-2.5-pro",
                      points: [
                        "Stronger reasoning",
                        "Slower",
                        "Better for ambiguous queries",
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: "mistakes",
              label: "Common mistakes",
              blocks: [
                {
                  kind: "callout",
                  tone: "warning",
                  title: "Watch out",
                  text: "Leaving temperature high (0.7+) on a factual RAG agent makes it improvise beyond the retrieved context. Keep it low so answers stay grounded.",
                },
                {
                  kind: "paragraph",
                  strongLead: "Instruction tip:",
                  text: "Tell the agent explicitly to answer only from retrieved context and to admit when it doesn't know — otherwise it will happily hallucinate.",
                },
              ],
            },
            {
              id: "docs",
              label: "Docs",
              blocks: [
                {
                  kind: "docLink",
                  label: "LangChain — create_agent",
                  url: "https://python.langchain.com/docs/how_to/",
                  description: "Reference for constructing an agent runnable.",
                },
              ],
            },
          ],
        },

        /* ===== Mission 2 — Wire the retriever behavior ===== */
        {
          id: "m2-wire-retriever",
          file: "agent.py",
          title: "Mission 2 — Wire the retriever behavior",
          shortTitle: "Wire the retriever behavior",
          description:
            "Your agent already talks to Qdrant through the boilerplate client. Now decide how it searches: which collection, and how many chunks it pulls back per query.",
          reward: 35,
          difficulty: "Easy",
          estMinutes: 10,
          miniSteps: [
            {
              id: "ms-coll",
              label: "Name the collection",
              sub: "Which Qdrant collection this agent searches",
            },
            {
              id: "ms-topk",
              label: "Configure top_k",
              sub: "How many chunks come back per query",
            },
          ],
          checklist: [
            { id: "chk-coll", label: "Collection name set" },
            { id: "chk-topk", label: "top_k configured" },
          ],
          slots: [
            // Carried over from Mission 1 — display-only, locked.
            {
              id: "model-locked",
              kind: "select",
              options: [{ value: "gemini-2.5-flash", label: "gemini-2.5-flash" }],
              state: "locked",
              lockedValue: '"gemini-2.5-flash"',
            },
            {
              id: "instr-locked",
              kind: "text",
              state: "locked",
              lockedValue: '"…"',
            },
            {
              id: "temp-locked",
              kind: "text",
              state: "locked",
              lockedValue: "0.3",
            },
            // Editable this mission.
            {
              id: "coll",
              checklistId: "chk-coll",
              kind: "text",
              placeholder: "collection name",
              validation: {
                required: true,
                pattern: "^[A-Za-z0-9_-]{2,}$",
                patternMessage:
                  "Use a simple identifier (letters, numbers, _ or -).",
              },
              criteria:
                "The name of the Qdrant collection the documents were embedded into — a plain identifier string, e.g. 'company_docs'.",
              exemplar: "company_docs",
            },
            {
              id: "topk",
              checklistId: "chk-topk",
              kind: "text",
              placeholder: "3–5",
              validation: {
                required: true,
                number: { min: 1, max: 10, integer: true },
              },
              criteria:
                "How many chunks to retrieve per query. 3–5 is the sweet spot; too high floods the context and hurts answer quality.",
              exemplar: "4",
            },
          ],
          codeLines: [
            { segments: [t("# — grown from Mission 1 —", "cmt")] },
            {
              segments: [
                t("from", "kw"),
                t(" qdrant_setup "),
                t("import", "kw"),
                t(" retriever"),
              ],
            },
            {
              segments: [
                t("from", "kw"),
                t(" langchain.agents "),
                t("import", "kw"),
                t(" "),
                t("create_agent", "fn"),
              ],
            },
            { segments: [] },
            {
              segments: [
                t("root_agent = "),
                t("create_agent", "fn"),
                t("("),
              ],
            },
            {
              indent: 1,
              segments: [t("model="), slot("model-locked"), t(",")],
            },
            {
              indent: 1,
              segments: [t("instructions="), slot("instr-locked"), t(",")],
            },
            {
              indent: 1,
              segments: [t("temperature="), slot("temp-locked"), t(",")],
            },
            { indent: 1, segments: [t("retriever=retriever,")] },
            { indent: 1, highlight: true, segments: [t("search_kwargs={")] },
            {
              indent: 2,
              highlight: true,
              segments: [t('"collection": '), slot("coll"), t(",")],
            },
            {
              indent: 2,
              highlight: true,
              segments: [t('"top_k": '), slot("topk")],
            },
            { indent: 1, highlight: true, segments: [t("}")] },
            { segments: [t(")")] },
          ],
          assist: [
            {
              id: "mistakes",
              label: "Common mistakes",
              blocks: [
                {
                  kind: "paragraph",
                  strongLead: "Common mistake:",
                  text: "Setting top_k too high (10+) floods context and hurts answer quality. Most single-topic knowledge bases work well at 3–5.",
                },
              ],
            },
            {
              id: "tradeoffs",
              label: "Trade-offs",
              blocks: [
                {
                  kind: "tradeoff",
                  columns: [
                    {
                      title: "Low top_k (2–3)",
                      points: [
                        "Tight, focused context",
                        "Risks missing relevant chunks",
                      ],
                    },
                    {
                      title: "High top_k (8+)",
                      points: [
                        "Broader recall",
                        "Noisier context, slower, worse answers",
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: "docs",
              label: "Docs",
              blocks: [
                {
                  kind: "docLink",
                  label: "Qdrant — Search / collections",
                  url: "https://qdrant.tech/documentation/concepts/search/",
                  description: "How collections and top-k search work in Qdrant.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
