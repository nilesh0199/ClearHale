import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          base: "var(--palette-base)",
          50: "var(--palette-50)",
          100: "var(--palette-100)",
          200: "var(--palette-200)",
          300: "var(--palette-300)",
          400: "var(--palette-400)",
          500: "var(--palette-500)",
          600: "var(--palette-600)",
          700: "var(--palette-700)",
          800: "var(--palette-800)",
          900: "var(--palette-900)",
          950: "var(--palette-950)",
        },
        background: "var(--bg-page)",
        foreground: "var(--text-primary)",
        muted: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        disabled: "var(--text-disabled)",
        card: "var(--bg-surface)",
        "card-subtle": "var(--bg-subtle)",
        "card-border": "var(--border-subtle)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        danger: "var(--color-danger)",
        "danger-bg": "var(--color-danger-bg)",
        teal: {
          accent: "var(--teal-accent)",
          hover: "var(--teal-hover)",
          light: "var(--teal-light)",
          ring: "var(--teal-ring)",
        },
        aqi: {
          good: "var(--aqi-good)",
          satisfactory: "var(--aqi-sat)",
          moderate: "var(--aqi-mod)",
          poor: "var(--aqi-poor)",
          verypoor: "var(--aqi-verypoor)",
          severe: "var(--aqi-severe)",
        },
      },
      borderRadius: {
        card: "20px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [],
};
export default config;
