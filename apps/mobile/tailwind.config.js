/** @type {import('tailwindcss').Config} */
// Scrap-it Paper design system — token source of truth:
// packages/design-tokens/src/index.ts (values duplicated here because
// NativeWind resolves this config in a context where workspace TS
// packages may not be requireable; keep in sync with the package).
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Body text — Hind. `semibold`/`bold` keep their historical names
        // (RN needs one family per weight, so weights are families here).
        sans: ["Hind_400Regular"],
        light: ["Hind_300Light"],
        medium: ["Hind_500Medium"],
        semibold: ["Hind_600SemiBold"],
        bold: ["Hind_700Bold"],
        // Display — Rozha One (headlines, prices, counters).
        display: ["RozhaOne_400Regular"],
        // Data — IBM Plex Mono (labels, timestamps, weights, ₹ values).
        mono: ["IBMPlexMono_400Regular"],
        "mono-medium": ["IBMPlexMono_500Medium"],
        "mono-semibold": ["IBMPlexMono_600SemiBold"],
        "mono-bold": ["IBMPlexMono_700Bold"],
      },
      colors: {
        // The nine Scrap-it Paper tokens
        paper: "#F3EEDF",
        "paper-2": "#EAE4D2",
        ink: "#1A1918",
        "ink-soft": "#4A4744",
        rust: "#B84E1C",
        "rust-dark": "#8F3D15",
        cash: "#1D5E3E",
        signal: "#EDBB33",
        rule: "#C9C1AB",
        // Semantic aliases
        ok: "#1D5E3E",
        warn: "#B84E1C",
        "delta-up": "#6AC37B",
        "delta-down": "#E07A5A",
        // shadcn-style semantic mapping (existing screens keep working)
        border: "#C9C1AB",
        input: "#C9C1AB",
        ring: "#B84E1C",
        background: "#F3EEDF",
        foreground: "#1A1918",
        muted: {
          DEFAULT: "#EAE4D2",
          foreground: "#4A4744",
        },
        card: {
          DEFAULT: "#EAE4D2",
          foreground: "#1A1918",
        },
        primary: {
          DEFAULT: "#B84E1C",
          foreground: "#F3EEDF",
        },
        secondary: {
          DEFAULT: "#EAE4D2",
          foreground: "#1A1918",
        },
        destructive: {
          DEFAULT: "#8F3D15",
          foreground: "#F3EEDF",
        },
        accent: {
          DEFAULT: "#EDBB33",
          foreground: "#1A1918",
        },
      },
      borderRadius: {
        // Ledger aesthetic: hard cap at 8px — no soft-modern rounding
        lg: "6px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
      },
    },
  },
  plugins: [],
};
