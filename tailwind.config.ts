import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        obsidian: {
          950: "#090A0D",
          900: "#0D1016",
          850: "#11151D",
          800: "#151A24",
          750: "#1B212D",
          700: "#222938",
        },
        brand: {
          amber: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
          },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
        "dark-card": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        "elevated-card": "0 8px 30px -4px rgba(0, 0, 0, 0.6)",
        "amber-glow": "0 0 20px -3px rgba(245, 158, 11, 0.25)",
        "amber-glow-subtle": "0 0 15px -3px rgba(245, 158, 11, 0.15)",
        "inner-highlight": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
