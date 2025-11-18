import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Cliente | ExperimenteAI",
  description: "Provador virtual inteligente - Desbloqueie seu estilo perfeito",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="false" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body translate="no">{children}</body>
    </html>
  );
}
