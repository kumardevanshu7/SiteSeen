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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0066cc",
          focus: "#0071e3",
          "on-dark": "#2997ff",
        },
        canvas: {
          DEFAULT: "#ffffff",
          parchment: "#f5f5f7",
        },
        surface: {
          pearl: "#fafafc",
          "tile-1": "#272729",
          "tile-2": "#2a2a2c",
          "tile-3": "#252527",
          black: "#000000",
          "chip-translucent": "rgba(210, 210, 215, 0.64)",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          "muted-80": "#333333",
          "muted-48": "#7a7a7a",
        },
        body: {
          DEFAULT: "#1d1d1f",
          muted: "#cccccc",
        },
        hairline: "#e0e0e0",
        "divider-soft": "rgba(0, 0, 0, 0.04)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        none: "0px",
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        pill: "9999px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        "apple-tight": "-0.01em",
        "apple-headline": "-0.28px",
        "apple-display": "-0.374px",
      },
      transitionDuration: {
        "350": "350ms",
      },
    },
  },
  plugins: [],
};
export default config;

