// Screen 1 — Choose campaign. The catalog landing (home). Cards are the main
// call to action, so they get icons, a glow on hover, and a clear "Start".
"use client";

import { listCampaigns, campaignTotalXp } from "@/content";
import { useStore } from "@/lib/store";

// Simple per-campaign icon lookup (falls back to a generic one).
const ICONS: Record<string, string> = {
  "retriever-agent": "🔍",
  "mcp-tool-agent": "🔌",
};

export function CampaignSelect() {
  const campaigns = listCampaigns();
  const selectCampaign = useStore((s) => s.selectCampaign);
  const completedCount = useStore((s) => s.completedMissions.length);
  const xp = useStore((s) => s.xp);

  return (
    <div>
      {/* header */}
      <div className="mb-6">
        <h1 className="font-disp text-[26px] font-bold leading-tight">
          Choose your{" "}
          <span className="bg-gradient-to-r from-purple-light to-[#7aa2ff] bg-clip-text text-transparent">
            track
          </span>
        </h1>
        <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed text-text-dim">
          Each track is a campaign of hands-on missions. Pick one to begin.
          {(completedCount > 0 || xp > 0) && (
            <>
              {" "}
              <span className="text-text-mute">
                You&apos;re at{" "}
                <span className="text-purple-light">{xp} XP</span> ·{" "}
                {completedCount} done.
              </span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {campaigns.map((c) => {
          const levelCount = c.levels.length;
          const totalXp = campaignTotalXp(c);
          const icon = ICONS[c.id] ?? "🧩";
          return (
            <button
              key={c.id}
              onClick={() => !c.locked && selectCampaign(c.id)}
              disabled={c.locked}
              className={`group relative overflow-hidden rounded-[16px] border bg-panel p-5 text-left transition-all duration-300 ${
                c.locked
                  ? "cursor-not-allowed border-border opacity-40"
                  : "cursor-pointer border-border hover:-translate-y-1 hover:border-purple hover:shadow-[0_12px_40px_-12px_rgba(139,92,246,.5)]"
              }`}
            >
              {/* glow */}
              {!c.locked && (
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[rgba(139,92,246,0.12)] blur-3xl transition-all duration-300 group-hover:bg-[rgba(139,92,246,0.24)]" />
              )}
              <div className="relative">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-dim text-[22px]">
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-disp text-[17px] font-semibold">
                        {c.title}
                      </h3>
                      {c.badge && (
                        <span className="font-mono text-[10.5px] text-text-mute">
                          {c.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.locked && (
                    <span className="rounded-full bg-panel-2 px-2.5 py-1 font-mono text-[10px] text-text-mute">
                      🔒 Locked
                    </span>
                  )}
                </div>

                <p className="mb-4 min-h-[36px] text-[13px] leading-[1.5] text-text-dim">
                  {c.description}
                </p>

                {c.locked ? (
                  <div className="font-mono text-[11px] text-text-mute">
                    Coming soon
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Pill>{levelCount} levels</Pill>
                      <Pill>~{c.estMinutes} min</Pill>
                      <Pill accent>✦ {totalXp} XP</Pill>
                    </div>
                    <span className="font-body text-[13px] font-semibold text-purple-light opacity-0 transition-opacity group-hover:opacity-100">
                      Start →
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pill({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] ${
        accent
          ? "border-[rgba(139,92,246,.3)] bg-purple-dim text-purple-light"
          : "border-border bg-panel-2 text-text-mute"
      }`}
    >
      {children}
    </span>
  );
}
