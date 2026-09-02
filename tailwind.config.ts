import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#040405",
        foreground: "#ffffff",
        garage: {
          950: "#020203",
          900: "#060608",
          850: "#0a0b0f",
          800: "#0f1117",
          750: "#151720",
          700: "#1c1f2b",
          600: "#262b3b",
        },
        neon: {
          red: "#dc2626",
          crimson: "#ef4444",
          blood: "#b91c1c",
          cyan: "#dc2626",
          blue: "#dc2626",
          purple: "#b91c1c",
          pink: "#f87171",
          green: "#10b981",
          emerald: "#10b981",
          amber: "#dc2626",
        },
        // Mapped to fierce action red so all existing orange-* classes automatically become fierce red
        orange: {
          300: "#fca5a5",
          400: "#f87171",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#450a0a",
        },
        red: {
          400: "#f87171",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#450a0a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
