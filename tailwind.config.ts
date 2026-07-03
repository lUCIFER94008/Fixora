import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080808",
        foreground: "#FFFFFF",
        luxury: {
          bg: "#080808",
          secondary: "#111111",
          card: "#151515",
          border: "rgba(255,255,255,0.06)",
          accent: "#FFD400",
          hover: "#FFC300",
          textSecondary: "#9A9A9A",
          success: "#7CFF7A",
          danger: "#FF5959",
        },
        // Backwards compatibility aliases to prevent styling gaps
        navy: {
          950: "#080808",
          900: "#111111",
          800: "#151515",
          700: "#1a1a1a",
          600: "#222222",
        },
        electric: {
          400: "#FFD400",
          500: "#FFD400",
          600: "#FFD400",
          700: "#FFC300",
        },
        neon: {
          cyan: "#FFD400",
          magenta: "#FFC300",
          purple: "#9A9A9A",
          yellow: "#FFD400",
        }
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slow-drift": "drift 40s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1) rotate(10deg)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9) rotate(-10deg)" },
        }
      },
      boxShadow: {
        "luxury-glow": "0 0 15px rgba(255, 212, 0, 0.15)",
        "luxury-shadow": "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
      }
    },
  },
  plugins: [],
};
export default config;

