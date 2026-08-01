// Content for the "Build Your First Agent" campaign — teaches a learner to build
// and ship an AI agent on Lyzr, step by step, using the Lyzr ADK. Data only:
// conforms to CampaignSchema, rendered generically by the existing screens.
import type { CampaignInput } from "../schema";

const t = (text: string, token?: "plain" | "kw" | "fn" | "cmt" | "str" | "num") =>
  ({ kind: "text" as const, text, ...(token ? { token } : {}) });
const slot = (slotId: string) => ({ kind: "slot" as const, slotId });

export const lyzrAgentCampaign: CampaignInput = {
  id: "lyzr-agent",
  title: "Build Your First Agent",
  subtitle: "Season 1 — AI Agent Odyssey",
  badge: "Lyzr Studio",
  description:
    "Build and deploy a working AI agent on Lyzr — choose a model, give it a role and a job, and ship a live endpoint.",
  tags: ["Lyzr", "Agents", "No-config"],
  estMinutes: 20,
  completion: {
    title: "Agent shipped. 🚀",
    subtitle: "You built an AI agent on Lyzr, end to end.",
  },
  levels: [
    /* ---------------- Level 0 — Get set up ---------------- */
    {
      kind: "setup",
      id: "lz-level-0-setup",
      index: 0,
      title: "Get your Lyzr workspace ready",
      subtitle: "Project Setup",
      crumbLabel: "Level 0 · Project Setup",
      setup: {
        intro:
          "You build agents on Lyzr. Grab an API key (no-code Studio or the Python SDK) and you're ready.",
        options: [
          {
            id: "studio",
            title: "Studio (no-code)",
            subtitle: "Build agents in the browser",
            terminal: [
              "# 1. Go to https://studio.lyzr.ai and sign in",
              "# 2. Open  Account  >  API Keys",
              "# 3. Create a key — you'll use it to call your agent",
            ],
          },
          {
            id: "sdk",
            title: "Python SDK (ADK)",
            subtitle: "Build agents in code",
            terminal: [
              "pip install lyzr-adk",
              "# grab your API key from Studio > Account > API Keys",
              "export LYZR_API_KEY=your_key_here",
            ],
          },
        ],
        note: "Everything runs on Lyzr's platform — we can't verify your key here, so once you have it, click Next.",
        verified: false,
      },
    },

    /* ---------------- Level 1 — Build the agent ---------------- */
    {
      kind: "missions",
      id: "lz-level-1-build",
      index: 1,
      title: "Build the Agent",
      subtitle: "Give your agent an identity, then a job — and run it.",
      crumbLabel: "Level 1 · Build the Agent",
      completion: {
        title: "Level 1 complete",
        subtitle: "Your Lyzr agent is defined, deployed, and answering.",
        badges: ["🤖", "⚡", "🚀"],
      },
      missions: [
        /* ===== Mission 1 — Give your agent an identity ===== */
        {
          id: "lz-m1-identity",
          file: "build_agent.py",
          title: "Mission 1 — Give your agent an identity",
          shortTitle: "Give your agent an identity",
          description:
            "Every agent needs a name, a brain (the model), and a role. Fill these in and Lyzr does the heavy lifting — no infra to manage.",
          reward: 40,
          difficulty: "Easy",
          estMinutes: 8,
          miniSteps: [
            {
              id: "ms-name",
              label: "Name your agent",
              sub: "How you'll identify it in Studio",
            },
            {
              id: "ms-provider",
              label: "Pick the model",
              sub: "The LLM that powers your agent — a real cost/quality call",
            },
            {
              id: "ms-role",
              label: "Define the role",
              sub: "Who the agent is, in one line",
            },
          ],
          checklist: [
            { id: "chk-name", label: "Agent named" },
            { id: "chk-provider", label: "Model selected" },
            { id: "chk-role", label: "Role defined" },
          ],
          slots: [
            {
              id: "lz-name",
              checklistId: "chk-name",
              kind: "text",
              placeholder: '"Support Bot"',
              validation: { required: true, minLength: 3 },
              criteria: "A short, human-readable name for the agent.",
              exemplar: '"Support Bot"',
            },
            {
              id: "lz-provider",
              checklistId: "chk-provider",
              kind: "select",
              options: [
                { value: "gpt-4o-mini", label: '"gpt-4o-mini"' },
                { value: "gpt-4o", label: '"gpt-4o"' },
              ],
              validation: {
                required: true,
                allowedValues: ["gpt-4o-mini", "gpt-4o"],
              },
              criteria:
                "gpt-4o-mini is cheaper/faster and great to start with; gpt-4o is stronger for complex reasoning.",
            },
            {
              id: "lz-role",
              checklistId: "chk-role",
              kind: "text",
              placeholder: '"Customer support agent"',
              validation: { required: true, minLength: 10 },
              criteria:
                "One line describing who the agent is — e.g. 'Customer support agent for billing questions'.",
              exemplar: '"Customer support agent for billing and account issues"',
            },
          ],
          codeLines: [
            { segments: [t("# Build an AI agent on Lyzr — a few lines, a live endpoint", "cmt")] },
            {
              segments: [
                t("from", "kw"),
                t(" lyzr_adk "),
                t("import", "kw"),
                t(" "),
                t("Studio", "fn"),
              ],
            },
            {
              segments: [
                t("studio = "),
                t("Studio", "fn"),
                t("(api_key="),
                t('"<YOUR_API_KEY>"', "str"),
                t(")"),
              ],
            },
            { segments: [] },
            {
              segments: [
                t("agent = studio."),
                t("create_agent", "fn"),
                t("("),
              ],
            },
            { indent: 1, segments: [t("name="), slot("lz-name"), t(",")] },
            { indent: 1, segments: [t("provider="), slot("lz-provider"), t(",")] },
            { indent: 1, segments: [t("role="), slot("lz-role"), t(",")] },
            {
              indent: 1,
              segments: [
                t("goal="),
                t('"…"', "str"),
                t(",  "),
                t("# you'll set this next", "cmt"),
              ],
            },
            {
              indent: 1,
              segments: [
                t("instructions="),
                t('"…"', "str"),
                t(",  "),
                t("# and this", "cmt"),
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
                      title: "gpt-4o-mini",
                      points: ["Cheaper", "Faster", "Great default to start"],
                    },
                    {
                      title: "gpt-4o",
                      points: [
                        "Stronger reasoning",
                        "Pricier",
                        "For complex/ambiguous tasks",
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
                  title: "Keep the role tight",
                  text: "A vague role ('assistant') gives a vague agent. Say exactly who it is and what domain it covers.",
                },
              ],
            },
            {
              id: "docs",
              label: "Docs",
              blocks: [
                {
                  kind: "docLink",
                  label: "Lyzr — Quickstart (ADK)",
                  url: "https://docs.lyzr.ai/",
                  description: "create_agent parameters and the SDK reference.",
                },
              ],
            },
          ],
        },

        /* ===== Mission 2 — Give it a job, then run it ===== */
        {
          id: "lz-m2-job",
          file: "build_agent.py",
          title: "Mission 2 — Give it a job, then run it",
          shortTitle: "Give it a job & run it",
          description:
            "Identity done. Now the important part: a clear goal and precise instructions. Then call agent.run() and your agent is live.",
          reward: 35,
          difficulty: "Easy",
          estMinutes: 9,
          miniSteps: [
            {
              id: "ms-goal",
              label: "Set the goal",
              sub: "What success looks like for this agent",
            },
            {
              id: "ms-instr",
              label: "Write the instructions",
              sub: "The rules it follows on every message",
            },
          ],
          checklist: [
            { id: "chk-goal", label: "Goal set" },
            { id: "chk-instr", label: "Instructions written" },
          ],
          slots: [
            // Carried over from Mission 1 (locked / display-only).
            {
              id: "name-locked",
              kind: "text",
              state: "locked",
              lockedValue: '"Support Bot"',
            },
            {
              id: "provider-locked",
              kind: "select",
              options: [{ value: "gpt-4o-mini", label: "gpt-4o-mini" }],
              state: "locked",
              lockedValue: '"gpt-4o-mini"',
            },
            {
              id: "role-locked",
              kind: "text",
              state: "locked",
              lockedValue: '"Customer support agent"',
            },
            // Editable this mission.
            {
              id: "lz-goal",
              checklistId: "chk-goal",
              kind: "text",
              placeholder: '"Resolve billing questions"',
              validation: { required: true, minLength: 10 },
              criteria:
                "A concrete objective — what the agent is meant to accomplish, e.g. 'Resolve customer inquiries about billing and accounts'.",
              exemplar: '"Resolve customer inquiries about billing and account issues"',
            },
            {
              id: "lz-instr",
              checklistId: "chk-instr",
              kind: "text",
              placeholder: '"Be concise; ask for the account ID first"',
              validation: { required: true, minLength: 15 },
              criteria:
                "Specific behavior rules: tone, what to ask for, what to avoid. e.g. 'Be concise. Always ask for the account ID before looking up details.'",
              exemplar:
                '"Be concise. Always ask for the account ID before looking up details."',
            },
          ],
          codeLines: [
            { segments: [t("# — grown from Mission 1 —", "cmt")] },
            {
              segments: [
                t("agent = studio."),
                t("create_agent", "fn"),
                t("("),
              ],
            },
            { indent: 1, segments: [t("name="), slot("name-locked"), t(",")] },
            {
              indent: 1,
              segments: [t("provider="), slot("provider-locked"), t(",")],
            },
            { indent: 1, segments: [t("role="), slot("role-locked"), t(",")] },
            {
              indent: 1,
              highlight: true,
              segments: [t("goal="), slot("lz-goal"), t(",")],
            },
            {
              indent: 1,
              highlight: true,
              segments: [t("instructions="), slot("lz-instr"), t(",")],
            },
            { segments: [t(")")] },
            { segments: [] },
            {
              highlight: true,
              segments: [t("# Deployed! Now talk to your agent:", "cmt")],
            },
            {
              highlight: true,
              segments: [
                t("response = agent."),
                t("run", "fn"),
                t("("),
                t('"My invoice shows the wrong amount"', "str"),
                t(")"),
              ],
            },
            {
              highlight: true,
              segments: [t("print", "fn"), t("(response.response)")],
            },
          ],
          assist: [
            {
              id: "mistakes",
              label: "Common mistakes",
              blocks: [
                {
                  kind: "paragraph",
                  strongLead: "Common mistake:",
                  text: "Instructions that are too generic ('be helpful') let the agent wander. Concrete rules ('always ask for the account ID first') make it reliable.",
                },
              ],
            },
            {
              id: "tradeoffs",
              label: "Goal vs Instructions",
              blocks: [
                {
                  kind: "tradeoff",
                  columns: [
                    {
                      title: "goal",
                      points: ["The WHAT", "The outcome to reach"],
                    },
                    {
                      title: "instructions",
                      points: ["The HOW", "Rules followed every turn"],
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
                  label: "Lyzr — Agent Studio",
                  url: "https://docs.lyzr.ai/",
                  description: "Deploy, test, and get your agent's live endpoint.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
