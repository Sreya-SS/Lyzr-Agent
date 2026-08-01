// Shared presentational primitives matching the reference's panel/crumb/CTA
// styling. Kept dumb (no state) so screens compose them freely.
"use client";

import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-panel border border-border bg-panel p-[22px] ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-text-mute">
      {children}
    </div>
  );
}

/** Breadcrumb line — supports a bold lead segment via `lead`. */
export function Crumb({ lead, children }: { lead?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 font-mono text-[11px] text-text-mute">
      {lead ? <b className="text-purple-light">{lead}</b> : null}
      {children}
    </div>
  );
}

export function MissionTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-[6px] font-disp text-[22px] font-semibold">{children}</h1>
  );
}

export function MissionDesc({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 max-w-[64ch] text-[13px] leading-[1.55] text-text-dim">
      {children}
    </p>
  );
}

/** Primary CTA. When `ready` is false it renders the muted/disabled style. */
export function Cta({
  children,
  onClick,
  ready = true,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  ready?: boolean;
  disabled?: boolean;
}) {
  const isReady = ready && !disabled;
  return (
    <button
      onClick={isReady ? onClick : undefined}
      disabled={!isReady}
      className={`rounded-[9px] px-[22px] py-[11px] font-body text-[13.5px] font-semibold transition-all duration-[250ms] ${
        isReady
          ? "cursor-pointer bg-purple text-white hover:bg-purple-light"
          : "cursor-not-allowed bg-text-mute text-bg"
      }`}
    >
      {children}
    </button>
  );
}

export function CtaOutline({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-[9px] border-[1.5px] border-purple bg-transparent px-5 py-[10px] font-body text-[13px] font-semibold text-purple-light transition-all duration-200 hover:bg-purple-dim"
    >
      {children}
    </button>
  );
}

/** The reference's row with a left progress note and a right-aligned CTA. */
export function ContinueRow({
  note,
  children,
}: {
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-[6px] flex items-center justify-between">
      <span className="font-mono text-[11.5px] text-text-mute">{note}</span>
      {children}
    </div>
  );
}
