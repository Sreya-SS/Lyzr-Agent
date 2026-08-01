// FileTree — the left "Project files" list. The mission's own file is active;
// boilerplate files are shown as given. Derived from mission content, not a
// separate hardcoded list.
"use client";

import type { Mission } from "@/content";

interface FileRow {
  name: string;
  tag: "given" | "yours";
  active: boolean;
}

export function FileTree({ mission }: { mission: Mission }) {
  // Boilerplate files are constant for this campaign; the mission's file is the
  // active/"yours" one. (Kept minimal — could move into content later.)
  const files: FileRow[] = [
    { name: "requirements.txt", tag: "given", active: false },
    { name: "qdrant_setup.py", tag: "given", active: false },
    { name: mission.file, tag: "yours", active: true },
  ];

  return (
    <div className="rounded-panel border border-border bg-panel p-[22px]">
      <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-text-mute">
        Project files
      </div>
      {files.map((f) => (
        <div
          key={f.name}
          className={`mb-[3px] flex items-center gap-[9px] rounded-lg px-[9px] py-2 font-mono text-[12.5px] ${
            f.active ? "bg-purple-dim text-purple-light" : "text-text-dim"
          }`}
        >
          <span className="w-[14px] text-center text-[12px]">
            {f.active ? "●" : "✓"}
          </span>
          {f.name}
          <span
            className={`ml-auto rounded-[4px] px-[5px] py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.05em] ${
              f.tag === "yours"
                ? "bg-purple-dim text-purple-light"
                : "bg-[rgba(66,133,244,.15)] text-g-blue"
            }`}
          >
            {f.tag}
          </span>
        </div>
      ))}
    </div>
  );
}
