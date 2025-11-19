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
        "dark-bg": "#0f0c29", // Fundo gradiente escuro (roxo/azul)
        "glass-bg": "rgba(255, 255, 255, 0.05)", // Fundo glassmorphism
        "glass-border": "rgba(255, 255, 255, 0.1)", // Borda glassmorphism
        "card-bg": "rgba(30, 30, 60, 0.4)", // Fundo de card semi-transparente
        "gradient-orange": "#ff6b6b", // Laranja vibrante
        "gradient-pink": "#ff8fab", // Rosa vibrante
        "gradient-purple": "#a855f7", // Roxo vibrante
        "gradient-blue": "#4ecdc4", // Azul ciano vibrante
        "gradient-green": "#51cf66", // Verde vibrante
        "accent-primary": "#ff6b6b", // Cor de destaque primária
        "accent-secondary": "#4ecdc4", // Cor de destaque secundária
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)", // Sombra glassmorphism
        "glass-inset": "inset 0 2px 4px rgba(255, 255, 255, 0.1)", // Sombra interna glass
        "glow-orange": "0 0 20px rgba(255, 107, 107, 0.5)", // Brilho laranja
        "glow-cyan": "0 0 20px rgba(78, 205, 196, 0.5)", // Brilho ciano
        "glow-purple": "0 0 20px rgba(168, 85, 247, 0.5)", // Brilho roxo
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config
