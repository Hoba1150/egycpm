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
        background: "#0a0c10",
        foreground: "#ffffff",
        garage: {
          950: "#07080b",
          900: "#0d1117",
          850: "#12161f",
          800: "#171c26",
          750: "#1e2433",
          700: "#262e40",
          600: "#323c52",
        },
        neon: {
          cyan: "#ff6600",
          blue: "#ff7700",
          purple: "#ff6600",
          pink: "#ff8800",
          green: "#10b981",
          emerald: "#10b981",
          red: "#ef4444",
          amber: "#ff6600",
        },
        orange: {
          400: "#ff8533",
          500: "#ff6600",
          600: "#e65c00",
          700: "#cc5200",
        }
      },
    },
  },
  plugins: [],
};

export default config;
