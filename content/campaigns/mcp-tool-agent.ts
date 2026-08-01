// Locked catalog stub — the "MCP Tool Agent" campaign shown greyed-out on the
// campaign-select screen. No levels yet; `locked: true` skips the level check.
import type { CampaignInput } from "../schema";

export const mcpToolAgentCampaign: CampaignInput = {
  id: "mcp-tool-agent",
  title: "MCP Tool Agent",
  subtitle: "Season 1 — AI Agent Odyssey",
  badge: "Google ADK",
  description: "Wire an agent to external tools over MCP.",
  tags: ["MCP", "Google ADK"],
  estMinutes: 45,
  locked: true,
  levels: [],
};
