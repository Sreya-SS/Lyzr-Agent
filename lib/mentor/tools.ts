// Mentor tools — the real, executable tools the Mentor agent calls via Claude's
// tool-use API. They run server-side against the validated mission content and
// the user's current in-progress answers (passed as context), so the Mentor's
// feedback is grounded in what the user has ACTUALLY typed, not a static label.
import Anthropic from "@anthropic-ai/sdk";
import {
  getCampaign,
  getMission,
  evaluateSlot,
  checklistStatus,
  isMissionComplete,
  type Mission,
} from "@/content";

/** Context the client sends with each mentor turn. */
export interface MentorContext {
  campaignId: string | null;
  levelIndex: number;
  missionIndex: number;
  missionId: string | null;
  /** answers[slotId] = current value for the active mission. */
  answers: Record<string, string>;
}

/** Resolve the active mission from the context (or null if not in one). */
export function resolveMission(ctx: MentorContext): Mission | null {
  if (!ctx.campaignId) return null;
  const campaign = getCampaign(ctx.campaignId);
  return getMission(campaign, ctx.levelIndex, ctx.missionIndex) ?? null;
}

/** Tool schemas advertised to Claude. */
export const MENTOR_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_mission_spec",
    description:
      "Get the active mission's goal, mini-steps, checklist, and the per-slot success criteria. Use this first to understand what the user is trying to accomplish. Does NOT include example answers.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_user_progress",
    description:
      "Read the user's CURRENT in-progress answers for the active mission, plus per-slot validity and which checklist items are satisfied. Call this to give specific feedback on what they've actually typed.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "evaluate_answer_quality",
    description:
      "Evaluate one slot's current value against its success criteria. Returns whether it's valid, why, the criteria, and — only for late-stage help — an example answer. Use the exemplar sparingly: never paste it verbatim unless the user is truly stuck after several hints.",
    input_schema: {
      type: "object",
      properties: {
        slotId: {
          type: "string",
          description: "The slot id to evaluate (from get_mission_spec).",
        },
      },
      required: ["slotId"],
      additionalProperties: false,
    },
  },
];

/** Execute a tool call locally and return a JSON-serializable result. */
export function executeMentorTool(
  name: string,
  input: unknown,
  ctx: MentorContext,
): unknown {
  const mission = resolveMission(ctx);
  if (!mission) {
    return { error: "The user isn't inside a mission right now." };
  }

  switch (name) {
    case "get_mission_spec":
      return {
        title: mission.title,
        description: mission.description,
        miniSteps: mission.miniSteps.map((s) => ({ label: s.label, sub: s.sub })),
        checklist: mission.checklist.map((c) => ({ id: c.id, label: c.label })),
        slots: mission.slots
          .filter((s) => s.state === "editable")
          .map((s) => ({
            id: s.id,
            checklistId: s.checklistId,
            kind: s.kind,
            options: s.options?.map((o) => o.value),
            criteria: s.criteria ?? null,
          })),
      };

    case "get_user_progress": {
      const status = checklistStatus(mission, ctx.answers);
      return {
        answers: ctx.answers,
        slotStatus: mission.slots
          .filter((s) => s.state === "editable")
          .map((s) => {
            const result = evaluateSlot(s, ctx.answers[s.id]);
            return {
              slotId: s.id,
              value: ctx.answers[s.id] ?? "",
              valid: result.valid,
              message: result.message ?? null,
            };
          }),
        checklist: mission.checklist.map((c) => ({
          id: c.id,
          satisfied: status[c.id] ?? false,
        })),
        missionComplete: isMissionComplete(mission, ctx.answers),
      };
    }

    case "evaluate_answer_quality": {
      const slotId = (input as { slotId?: string })?.slotId;
      const slot = mission.slots.find((s) => s.id === slotId);
      if (!slot) return { error: `No slot with id "${slotId}".` };
      const result = evaluateSlot(slot, ctx.answers[slot.id]);
      return {
        slotId: slot.id,
        value: ctx.answers[slot.id] ?? "",
        valid: result.valid,
        message: result.message ?? null,
        criteria: slot.criteria ?? null,
        // Provided for LATE-STAGE escalation only — the system prompt forbids
        // handing this over unprompted.
        exemplar: slot.exemplar ?? null,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
