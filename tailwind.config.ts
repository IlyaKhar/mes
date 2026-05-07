import type { Config } from "tailwindcss";
import { neosTheme } from "./theme.config";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: neosTheme.colors.background,
        surface: neosTheme.colors.surface,
        "surface-muted": neosTheme.colors.surfaceMuted,
        foreground: neosTheme.colors.ink,
        border: neosTheme.colors.divider,
        input: neosTheme.colors.divider,
        ring: neosTheme.colors.accent,
        primary: {
          DEFAULT: neosTheme.colors.accent,
          foreground: neosTheme.colors.surface
        },
        muted: {
          DEFAULT: neosTheme.colors.accentSoft,
          foreground: neosTheme.colors.muted
        },
        destructive: {
          DEFAULT: neosTheme.colors.danger,
          foreground: neosTheme.colors.surface
        },
        neos: neosTheme.colors
      },
      borderRadius: {
        DEFAULT: neosTheme.radius.DEFAULT,
        lg: neosTheme.radius.DEFAULT,
        md: "14px",
        sm: "12px"
      },
      boxShadow: {
        card: neosTheme.shadow.card,
        float: neosTheme.shadow.float
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
