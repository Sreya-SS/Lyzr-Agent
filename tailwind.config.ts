// Tailwind theme — mirrors the reference prototype's :root palette + fonts.
// Colors are exposed as CSS variables (see app/globals.css) so they stay the
// single source of truth and could be re-themed without touching components.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        border: "var(--border)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-mute": "var(--text-mute)",
        purple: "var(--purple)",
        "purple-light": "var(--purple-light)",
        "purple-dim": "var(--purple-dim)",
        "g-blue": "var(--g-blue)",
        "g-green": "var(--g-green)",
        "g-yellow": "var(--g-yellow)",
        "g-red": "var(--g-red)",
        "code-bg": "var(--code-bg)",
        // Syntax-highlight token colors (from the reference .kw/.fn/.cmt rules).
        "syntax-kw": "#c586c0",
        "syntax-fn": "#dcdcaa",
        "syntax-cmt": "#6a9955",
        "syntax-str": "#ce9178",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        disp: ["var(--font-disp)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      borderRadius: {
        panel: "14px",
      },
      keyframes: {
        fadein: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        unlockPulse: {
          "0%": { background: "transparent" },
          "30%": { background: "rgba(52,168,83,.25)" },
          "100%": { background: "transparent" },
        },
      },
      animation: {
        fadein: "fadein .35s ease",
        unlockPulse: "unlockPulse 1s ease",
      },
    },
  },
  plugins: [],
};

export default config;
