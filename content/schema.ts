// Zod schema for all campaign content. This is the single contract every screen
// renders from — adding a mission means editing content files, never components.
//
// Hierarchy:  Campaign → Level (setup | missions) → Mission → MiniStep
//   + CodeLine (structured tokens for the fake editor)
//   + Slot     (interactive TODO holes embedded in code, with rich validation)
//   + ChecklistItem, AssistTab/AssistBlock (trade-offs / mistakes / docs tabs)
//
// Design notes:
//   - Code is NOT raw HTML (unlike the reference). Each line is an ordered list
//     of typed segments; a segment is either styled text or a reference to a Slot.
//   - "Code evolution" across missions is modeled as per-mission full snapshots;
//     slots carried over from an earlier mission are `state: "locked"` with a
//     `lockedValue`, so no cross-mission diff engine is needed.
//   - Slot validation lives in the schema so the checklist reflects CORRECTNESS,
//     not merely "filled", and the Mentor's evaluate tool has real criteria.
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Code editor primitives                                             */
/* ------------------------------------------------------------------ */

/** Syntax-highlight class for a run of plain text in the fake editor. */
export const CodeTokenSchema = z.enum([
  "plain",
  "kw", // keyword (from/import/def…)
  "fn", // function/callable name
  "cmt", // comment
  "str", // string literal
  "num", // numeric literal
]);
export type CodeToken = z.infer<typeof CodeTokenSchema>;

/** A styled run of literal text within a code line. */
export const TextSegmentSchema = z.object({
  kind: z.literal("text"),
  text: z.string(),
  token: CodeTokenSchema.default("plain"),
});

/** A reference to a Slot rendered inline as an interactive TODO hole. */
export const SlotSegmentSchema = z.object({
  kind: z.literal("slot"),
  slotId: z.string().min(1),
});

export const CodeSegmentSchema = z.discriminatedUnion("kind", [
  TextSegmentSchema,
  SlotSegmentSchema,
]);
export type CodeSegment = z.infer<typeof CodeSegmentSchema>;

/**
 * One line in the fake editor. `segments: []` renders as a blank line (no line
 * number). `highlight` paints the green "new this mission" background.
 */
export const CodeLineSchema = z.object({
  indent: z.number().int().min(0).default(0),
  highlight: z.boolean().default(false),
  segments: z.array(CodeSegmentSchema).default([]),
});
export type CodeLine = z.infer<typeof CodeLineSchema>;

/* ------------------------------------------------------------------ */
/* Slots + validation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Declarative validation for a slot's value. Rules are ANDed together; an empty
 * object with `required: true` means "any non-empty value passes". Evaluated by
 * content/validation.ts (shared by the UI checklist and the Mentor's tools).
 */
export const SlotValidationSchema = z.object({
  required: z.boolean().default(true),
  /** Value must be exactly one of these (used for dropdowns / enums). */
  allowedValues: z.array(z.string()).optional(),
  /** Minimum trimmed length (used for free-text like the instruction). */
  minLength: z.number().int().positive().optional(),
  /** Parse as a number and range-check it (temperature, top_k…). */
  number: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      integer: z.boolean().default(false),
    })
    .optional(),
  /** Regex the (trimmed) value must match. `pattern` is a RegExp source string. */
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
});
export type SlotValidation = z.infer<typeof SlotValidationSchema>;

export const SlotOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const SlotSchema = z
  .object({
    id: z.string().min(1),
    /**
     * Which checklist item this slot satisfies. Required for editable slots;
     * omitted for locked (carried-over) slots that are display-only.
     */
    checklistId: z.string().min(1).optional(),
    /** Dropdown vs free-text input. */
    kind: z.enum(["select", "text"]),
    placeholder: z.string().optional(),
    /** Options for a `select` slot. */
    options: z.array(SlotOptionSchema).optional(),
    /**
     * "editable" = the user fills it this mission.
     * "locked"   = carried over pre-filled from an earlier mission (read-only).
     */
    state: z.enum(["editable", "locked"]).default("editable"),
    /** Display value shown when `state: "locked"`. */
    lockedValue: z.string().optional(),
    validation: SlotValidationSchema.default({}),
    /** Human description of what a good answer looks like (fuels the Mentor). */
    criteria: z.string().optional(),
    /** An example correct answer — used for the Mentor's late-stage escalation. */
    exemplar: z.string().optional(),
  })
  .superRefine((slot, ctx) => {
    if (slot.kind === "select" && (!slot.options || slot.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Select slot "${slot.id}" must define options.`,
      });
    }
    if (slot.state === "locked" && !slot.lockedValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Locked slot "${slot.id}" must define a lockedValue.`,
      });
    }
    if (slot.state === "editable" && !slot.checklistId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Editable slot "${slot.id}" must define a checklistId.`,
      });
    }
  });
export type Slot = z.infer<typeof SlotSchema>;
export type SlotOption = z.infer<typeof SlotOptionSchema>;

/* ------------------------------------------------------------------ */
/* Checklist, mini-steps, assist panel                                */
/* ------------------------------------------------------------------ */

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const MiniStepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sub: z.string().default(""),
});
export type MiniStep = z.infer<typeof MiniStepSchema>;

// Assist panel content — structured blocks, never raw HTML.
const ParagraphBlockSchema = z.object({
  kind: z.literal("paragraph"),
  text: z.string(),
  /** Optional bold lead-in rendered before the text (e.g. "Common mistake:"). */
  strongLead: z.string().optional(),
});
const TradeoffColumnSchema = z.object({
  title: z.string(),
  points: z.array(z.string()),
});
const TradeoffBlockSchema = z.object({
  kind: z.literal("tradeoff"),
  columns: z.array(TradeoffColumnSchema).min(2),
});
const CalloutBlockSchema = z.object({
  kind: z.literal("callout"),
  tone: z.enum(["info", "warning", "success"]).default("info"),
  title: z.string().optional(),
  text: z.string(),
});
const DocLinkBlockSchema = z.object({
  kind: z.literal("docLink"),
  label: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
});
export const AssistBlockSchema = z.discriminatedUnion("kind", [
  ParagraphBlockSchema,
  TradeoffBlockSchema,
  CalloutBlockSchema,
  DocLinkBlockSchema,
]);
export type AssistBlock = z.infer<typeof AssistBlockSchema>;

export const AssistTabSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  blocks: z.array(AssistBlockSchema).min(1),
});
export type AssistTab = z.infer<typeof AssistTabSchema>;

/* ------------------------------------------------------------------ */
/* Mission                                                            */
/* ------------------------------------------------------------------ */

export const DifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

export const MissionSchema = z
  .object({
    id: z.string().min(1),
    /** File shown in the editor tab (e.g. "agent.py"). */
    file: z.string().min(1),
    title: z.string().min(1),
    /** Short label for the level's mission list (no "Mission N —" prefix). */
    shortTitle: z.string().min(1),
    description: z.string().min(1),
    reward: z.number().int().min(0),
    difficulty: DifficultySchema,
    estMinutes: z.number().int().positive(),
    miniSteps: z.array(MiniStepSchema).min(1),
    checklist: z.array(ChecklistItemSchema).min(1),
    slots: z.array(SlotSchema).default([]),
    codeLines: z.array(CodeLineSchema).min(1),
    assist: z.array(AssistTabSchema).min(1),
  })
  .superRefine((mission, ctx) => {
    const checklistIds = new Set(mission.checklist.map((c) => c.id));
    const slotIds = new Set(mission.slots.map((s) => s.id));

    // Every editable slot must point at a real checklist item. (Locked slots
    // are display-only and may omit checklistId.)
    for (const slot of mission.slots) {
      if (
        slot.state === "editable" &&
        slot.checklistId &&
        !checklistIds.has(slot.checklistId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Slot "${slot.id}" references unknown checklistId "${slot.checklistId}".`,
        });
      }
    }
    // Every inline slot reference in the code must resolve to a defined slot.
    mission.codeLines.forEach((line, li) => {
      line.segments.forEach((seg) => {
        if (seg.kind === "slot" && !slotIds.has(seg.slotId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `codeLines[${li}] references unknown slotId "${seg.slotId}".`,
          });
        }
      });
    });
    // Every EDITABLE checklist item should be satisfiable by at least one
    // editable slot (otherwise it can never be completed by the user).
    const editableChecklistTargets = new Set(
      mission.slots
        .filter((s) => s.state === "editable")
        .map((s) => s.checklistId),
    );
    for (const item of mission.checklist) {
      if (!editableChecklistTargets.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Checklist item "${item.id}" has no editable slot to satisfy it.`,
        });
      }
    }
  });
export type Mission = z.infer<typeof MissionSchema>;

/* ------------------------------------------------------------------ */
/* Levels (discriminated union: setup vs missions)                    */
/* ------------------------------------------------------------------ */

/** Level 0 — local project setup. No XP, honestly labeled as unverified. */
export const SetupLevelSchema = z.object({
  kind: z.literal("setup"),
  id: z.string().min(1),
  index: z.number().int().min(0),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  crumbLabel: z.string().optional(),
  setup: z.object({
    intro: z.string().optional(),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          subtitle: z.string().default(""),
          /** Terminal lines shown for this setup path. */
          terminal: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    note: z.string().optional(),
    /** Honest flag — the reference cannot verify a local machine. */
    verified: z.boolean().default(false),
  }),
});
export type SetupLevel = z.infer<typeof SetupLevelSchema>;

/** A level made of hands-on missions. */
export const MissionsLevelSchema = z.object({
  kind: z.literal("missions"),
  id: z.string().min(1),
  index: z.number().int().min(0),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  crumbLabel: z.string().optional(),
  missions: z.array(MissionSchema).min(1),
  completion: z
    .object({
      title: z.string(),
      subtitle: z.string(),
      badges: z.array(z.string()).default([]),
    })
    .optional(),
});
export type MissionsLevel = z.infer<typeof MissionsLevelSchema>;

export const LevelSchema = z.discriminatedUnion("kind", [
  SetupLevelSchema,
  MissionsLevelSchema,
]);
export type Level = z.infer<typeof LevelSchema>;

/* ------------------------------------------------------------------ */
/* Campaign                                                           */
/* ------------------------------------------------------------------ */

export const CampaignSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    /** Season / series line shown in the top bar. */
    subtitle: z.string().default(""),
    /** Short tech badge on the campaign card (e.g. "LangChain · Qdrant"). */
    badge: z.string().optional(),
    description: z.string().min(1),
    tags: z.array(z.string()).default([]),
    estMinutes: z.number().int().positive(),
    /** Locked campaigns appear greyed-out in the catalog with no levels. */
    locked: z.boolean().default(false),
    levels: z.array(LevelSchema).default([]),
    /** Copy for the final Campaign Summary screen. */
    completion: z
      .object({
        title: z.string(),
        subtitle: z.string(),
      })
      .optional(),
  })
  .superRefine((campaign, ctx) => {
    if (!campaign.locked && campaign.levels.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unlocked campaign "${campaign.id}" must define at least one level.`,
      });
    }
  });
export type Campaign = z.infer<typeof CampaignSchema>;

/** The catalog is just an ordered list of campaigns (full + locked stubs). */
export const CampaignCatalogSchema = z.array(CampaignSchema).min(1);
export type CampaignCatalog = z.infer<typeof CampaignCatalogSchema>;

/**
 * Authoring type for content files — the schema INPUT (pre-parse), so fields
 * with `.default()` (indent, highlight, token, validation, …) are optional to
 * write. content/index.ts parses these into the fully-defaulted output types.
 */
export type CampaignInput = z.input<typeof CampaignSchema>;
