import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        secondary: "#101010",
        brand: "#2563eb",
        "accent-blue": "#3b82f6",
        "accent-gold": "#f5c542",
      },
    },
  },
  plugins: [],
};

export default config;
