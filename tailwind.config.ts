import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08080a",
          900: "#0b0b0d",
          800: "#141416",
          700: "#1d1d20",
          600: "#2a2a2e",
          500: "#3a3a40",
        },
        bone: {
          DEFAULT: "#f2efe8",
          dim: "#a8a49a",
          faint: "#6c6960",
        },
        blood: {
          DEFAULT: "#d7263d",
          dark: "#a01526",
          glow: "#ff3349",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        ultra: "0.35em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
