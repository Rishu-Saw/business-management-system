import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#bcd1ff",
          300: "#8eb3ff",
          400: "#598aff",
          500: "#3363ff",
          600: "#1d40f5",
          700: "#162fe1",
          800: "#1829b6",
          900: "#1a288f",
          950: "#151b57",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.10)",
        pop: "0 12px 32px -8px rgb(16 24 40 / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
