import type { Config } from "tailwindcss";

/**
 * Colours resolve through CSS custom properties defined in app/globals.css, so
 * the light and dark palettes swap in one place and component files keep using
 * plain utilities like `bg-white` or `text-slate-500`.
 *
 * Two palettes deliberately do NOT follow the theme:
 *   `paper` — always white, for text sitting on a coloured button.
 *   `ink`   — always dark, for the marketing panels and modal scrims that are
 *             dark by design in both themes.
 */
const themed = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: themed("white"),
        paper: "#ffffff",
        ink: {
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        slate: {
          50: themed("slate-50"),
          100: themed("slate-100"),
          200: themed("slate-200"),
          300: themed("slate-300"),
          400: themed("slate-400"),
          500: themed("slate-500"),
          600: themed("slate-600"),
          700: themed("slate-700"),
          800: themed("slate-800"),
          900: themed("slate-900"),
        },
        brand: {
          50: themed("brand-50"),
          100: themed("brand-100"),
          200: themed("brand-200"),
          300: themed("brand-300"),
          400: themed("brand-400"),
          500: themed("brand-500"),
          600: themed("brand-600"),
          700: themed("brand-700"),
          800: themed("brand-800"),
        },
        emerald: {
          50: themed("emerald-50"),
          200: themed("emerald-200"),
          400: themed("emerald-400"),
          500: themed("emerald-500"),
          600: themed("emerald-600"),
          700: themed("emerald-700"),
        },
        rose: {
          50: themed("rose-50"),
          200: themed("rose-200"),
          300: themed("rose-300"),
          400: themed("rose-400"),
          500: themed("rose-500"),
          600: themed("rose-600"),
          700: themed("rose-700"),
          800: themed("rose-800"),
        },
        amber: {
          50: themed("amber-50"),
          200: themed("amber-200"),
          400: themed("amber-400"),
          500: themed("amber-500"),
          600: themed("amber-600"),
          700: themed("amber-700"),
          800: themed("amber-800"),
        },
        violet: {
          50: themed("violet-50"),
          200: themed("violet-200"),
          700: themed("violet-700"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
};

export default config;
