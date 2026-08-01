// CodeSlot — renders one interactive TODO hole embedded in the fake editor.
// Locked slots show a static green value; editable slots are a <select> or
// <input> bound to the store, with valid/invalid styling driven by evaluateSlot.
"use client";

import { evaluateSlot, type Slot } from "@/content";

export function CodeSlot({
  slot,
  value,
  onChange,
}: {
  slot: Slot;
  value: string;
  onChange: (value: string) => void;
}) {
  // Locked (carried-over) slot — display-only, styled as a completed slot.
  if (slot.state === "locked") {
    return (
      <span className="mx-[2px] inline-flex items-center rounded-[6px] border border-[rgba(52,168,83,.4)] bg-[rgba(52,168,83,.1)] px-2 py-[2px] opacity-60">
        <span className="font-mono text-[13px] text-g-green">
          {slot.lockedValue}
        </span>
      </span>
    );
  }

  const result = evaluateSlot(slot, value);
  const filled = value.trim().length > 0 && result.valid;

  const wrapClass = `mx-[2px] inline-flex items-center rounded-[6px] px-2 py-[2px] ${
    filled
      ? "border border-solid border-[rgba(52,168,83,.4)] bg-[rgba(52,168,83,.1)]"
      : "border border-dashed border-[rgba(139,92,246,.5)] bg-purple-dim"
  }`;
  const controlClass = `border-none bg-transparent font-mono text-[13px] outline-none ${
    filled ? "text-g-green" : "text-purple-light"
  }`;

  return (
    <span
      className={wrapClass}
      title={!result.valid && value.trim() ? result.message : undefined}
    >
      {slot.kind === "select" ? (
        <select
          className={`${controlClass} cursor-pointer`}
          data-slot={slot.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">choose…</option>
          {slot.options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-panel text-text">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={`${controlClass} min-w-[60px] placeholder:text-[rgba(167,139,250,.5)]`}
          data-slot={slot.id}
          value={value}
          placeholder={slot.placeholder}
          onChange={(e) => onChange(e.target.value)}
          size={Math.max((slot.placeholder?.length ?? 8) + 2, 8)}
        />
      )}
    </span>
  );
}
