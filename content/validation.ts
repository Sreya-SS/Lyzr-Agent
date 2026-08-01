// Shared slot-validation logic. One implementation drives BOTH the UI checklist
// (Phase 2) and the Mentor's evaluate_answer_quality tool (Phase 4), so the
// "is this answer good?" question always has a single source of truth.
import type { Mission, Slot } from "./schema";

export interface SlotResult {
  valid: boolean;
  /** Present when invalid — a human-readable reason. */
  message?: string;
}

/** Evaluate one slot's current value against its declared validation rules. */
export function evaluateSlot(slot: Slot, rawValue: string | undefined): SlotResult {
  // Locked slots are always considered satisfied (carried over from earlier).
  if (slot.state === "locked") return { valid: true };

  const value = (rawValue ?? "").trim();
  const v = slot.validation;

  if (value.length === 0) {
    return v.required
      ? { valid: false, message: "This still needs a value." }
      : { valid: true };
  }

  if (v.allowedValues && !v.allowedValues.includes(value)) {
    return {
      valid: false,
      message: `"${value}" isn't one of the allowed options.`,
    };
  }

  if (v.minLength !== undefined && value.length < v.minLength) {
    return {
      valid: false,
      message: `Needs at least ${v.minLength} characters — say a bit more.`,
    };
  }

  if (v.number) {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return { valid: false, message: `"${value}" isn't a number.` };
    }
    if (v.number.integer && !Number.isInteger(num)) {
      return { valid: false, message: "Needs to be a whole number." };
    }
    if (v.number.min !== undefined && num < v.number.min) {
      return { valid: false, message: `Must be ≥ ${v.number.min}.` };
    }
    if (v.number.max !== undefined && num > v.number.max) {
      return { valid: false, message: `Must be ≤ ${v.number.max}.` };
    }
  }

  if (v.pattern) {
    let re: RegExp | null = null;
    try {
      re = new RegExp(v.pattern);
    } catch {
      re = null; // A bad pattern in content shouldn't hard-fail the user.
    }
    if (re && !re.test(value)) {
      return {
        valid: false,
        message: v.patternMessage ?? "That doesn't look quite right.",
      };
    }
  }

  return { valid: true };
}

/**
 * A checklist item is satisfied when every EDITABLE slot bound to it is valid
 * (and at least one such slot exists). Locked slots don't gate completion.
 */
export function isChecklistItemSatisfied(
  mission: Mission,
  checklistId: string,
  values: Record<string, string>,
): boolean {
  const slots = mission.slots.filter(
    (s) => s.checklistId === checklistId && s.state === "editable",
  );
  if (slots.length === 0) return false;
  return slots.every((s) => evaluateSlot(s, values[s.id]).valid);
}

/** Whether all of a mission's checklist items are satisfied. */
export function isMissionComplete(
  mission: Mission,
  values: Record<string, string>,
): boolean {
  return mission.checklist.every((item) =>
    isChecklistItemSatisfied(mission, item.id, values),
  );
}

/** Map of checklistId → satisfied, for rendering the checklist + tracker. */
export function checklistStatus(
  mission: Mission,
  values: Record<string, string>,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const item of mission.checklist) {
    out[item.id] = isChecklistItemSatisfied(mission, item.id, values);
  }
  return out;
}
