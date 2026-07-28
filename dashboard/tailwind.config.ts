import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0d14",
        surface: "#121722",
        surfaceLight: "#1c2436",
        border: "#26324a",
        primary: {
          DEFAULT: "#e11d48",
          dark: "#be123c",
          light: "#fb7185",
        },
        accent: {
          emerald: "#10b981",
          amber: "#f59e0b",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(225, 29, 72, 0.4)",
        glowAmber: "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        glowEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.4)",
      },
      backgroundImage: {
        "radial-dark": "radial-gradient(circle layout at 50% 50%, #161e2e 0%, #0a0d14 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
