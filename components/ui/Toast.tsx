// Toast — fixed, animated notification pill (XP awards, mission complete).
"use client";

import { useToast } from "@/lib/toast";

export function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div
      className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-[10px] border border-g-green bg-panel px-5 py-3 font-mono text-[13px] text-g-green shadow-[0_10px_30px_rgba(0,0,0,.4)] transition-transform duration-[400ms] ${
        message ? "translate-y-0" : "-translate-y-[140%]"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      role="status"
      aria-live="polite"
    >
      {message ?? ""}
    </div>
  );
}
