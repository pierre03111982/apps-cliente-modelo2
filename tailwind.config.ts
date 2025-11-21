import type { Config } from "tailwindcss"

const config: Config = {
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
        "accent-1": "#6f5cf1", // Mantém o roxo
        "accent-2": "#3cd2c9", // Mantém o turquesa
        "accent-3": "#ff7c9c", // Mantém o rosa
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

