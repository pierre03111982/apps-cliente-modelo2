import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: 'class', // PHASE 8: Enable class-based dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#d8dce8", // Tom médio mais escuro para melhor contraste
        "surface-strong": "#c8ccd8", // Um pouco mais escuro para gradientes
        "accent-1": "#4F46E5", // PHASE 8: Royal Blue (replaces Neon Purple)
        "accent-2": "#10B981", // PHASE 8: Emerald Green for success
        "accent-3": "#ff7c9c", // Mantém o rosa
      },
      backgroundColor: {
        'light-bg': '#F8F9FC', // PHASE 8: Clean Slate
        'dark-bg': '#0F172A', // PHASE 8: Deep Navy
        'light-card': '#FFFFFF', // PHASE 8: White cards
        'dark-card': '#1E293B', // PHASE 8: Dark cards
      },
      boxShadow: {
        soft: "0 24px 60px -30px rgba(110, 121, 198, 0.5)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config

