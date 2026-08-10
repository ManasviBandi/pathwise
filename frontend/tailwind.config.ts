import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1120",
          panel: "#111827",
          elevated: "#151c2c",
          border: "#1F2937",
          hover: "#1a2336",
        },
        mist: {
          DEFAULT: "#F3F4F6",
          muted: "#94A3B8",
          dim: "#64748B",
        },
        gain: "#34D399",
        loss: "#F87171",
        warn: "#FBBF24",
        accent: "#60A5FA",
        accent2: "#A78BFA",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.35)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;