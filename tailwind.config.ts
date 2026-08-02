import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
          pressed: "rgb(var(--primary-pressed) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
          pressed: "rgb(var(--secondary-pressed) / <alpha-value>)",
        },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          soft: "rgb(var(--surface-soft) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
          dark: "rgb(var(--surface-dark) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
        },
        body: "rgb(var(--body) / <alpha-value>)",
        charcoal: "rgb(var(--charcoal) / <alpha-value>)",
        mute: "rgb(var(--mute) / <alpha-value>)",
        ash: "rgb(var(--ash) / <alpha-value>)",
        stone: "rgb(var(--stone) / <alpha-value>)",
        hairline: {
          DEFAULT: "rgb(var(--hairline) / <alpha-value>)",
          soft: "rgb(var(--hairline-soft) / <alpha-value>)",
        },
        "on-dark": {
          DEFAULT: "rgb(var(--on-dark) / <alpha-value>)",
          mute: "rgb(var(--on-dark-mute) / 0.7)",
        },
        success: {
          deep: "rgb(var(--success-deep) / <alpha-value>)",
          pale: "rgb(var(--success-pale) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "8px",
        md: "16px",
        lg: "32px",
        pill: "9999px",
        full: "9999px",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        display: "-1.2px",
        "display-lg": "-0.8px",
        heading: "-1.2px",
      },
      spacing: {
        section: "64px",
      },
      maxWidth: {
        content: "1280px",
      },
      boxShadow: {
        modal: "0 8px 32px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
