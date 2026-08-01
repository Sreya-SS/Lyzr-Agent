// AssistPanel — the "Mission assistant" tabs (Trade-offs / Common mistakes /
// Docs), rendered from structured AssistBlock content (never raw HTML).
"use client";

import { useState } from "react";
import type { AssistBlock, AssistTab, Mission } from "@/content";

export function AssistPanel({ mission }: { mission: Mission }) {
  const [activeId, setActiveId] = useState(mission.assist[0]?.id);
  const active = mission.assist.find((t) => t.id === activeId) ?? mission.assist[0];

  return (
    <div className="rounded-panel border border-border bg-panel p-[22px]">
      <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-text-mute">
        Mission assistant
      </div>
      {mission.assist.map((tab: AssistTab) => (
        <div
          key={tab.id}
          onClick={() => setActiveId(tab.id)}
          className={`mb-[2px] cursor-pointer rounded-lg border px-[10px] py-2 text-[11.5px] ${
            tab.id === active.id
              ? "border-[rgba(139,92,246,.25)] bg-purple-dim text-purple-light"
              : "border-transparent text-text-dim"
          }`}
        >
          {tab.label}
        </div>
      ))}
      <div className="mt-[10px] border-t border-border pt-[10px] text-[12px] leading-[1.6] text-text-dim">
        {active.blocks.map((block, i) => (
          <AssistBlockView key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function AssistBlockView({ block }: { block: AssistBlock }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className="mt-[10px] first:mt-0">
          {block.strongLead ? (
            <b className="text-text">{block.strongLead} </b>
          ) : null}
          {block.text}
        </p>
      );
    case "tradeoff":
      return (
        <div className="mt-[10px] flex gap-2">
          {block.columns.map((col, i) => (
            <div key={i} className="flex-1 rounded-lg bg-panel-2 p-[10px] text-[11.5px]">
              <b className="mb-[5px] block font-mono text-[11px] text-text">
                {col.title}
              </b>
              {col.points.map((p, j) => (
                <div key={j}>{p}</div>
              ))}
            </div>
          ))}
        </div>
      );
    case "callout": {
      const tone =
        block.tone === "warning"
          ? "border-g-yellow/40 text-g-yellow"
          : block.tone === "success"
            ? "border-g-green/40 text-g-green"
            : "border-purple/40 text-purple-light";
      return (
        <div className={`mt-[10px] rounded-lg border ${tone} bg-panel-2 p-[10px]`}>
          {block.title ? <b className="block">{block.title}</b> : null}
          <span className="text-text-dim">{block.text}</span>
        </div>
      );
    }
    case "docLink":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="mt-[10px] block rounded-lg bg-panel-2 p-[10px] transition-colors hover:bg-border"
        >
          <b className="block text-purple-light">{block.label} ↗</b>
          {block.description ? (
            <span className="text-[11.5px] text-text-mute">{block.description}</span>
          ) : null}
        </a>
      );
  }
}
