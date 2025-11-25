# DOCUMENTAÇÃO TÉCNICA - PAINEL LOJISTA
## Análise Profunda e Diagnóstico de Layout CSS

**Data:** 2025-01-27  
**Projeto:** apps-cliente/modelo-2  
**Objetivo:** Documentação completa para diagnóstico de problemas de carregamento de CSS/Tailwind

---

## 📁 ESTRUTURA DE ARQUIVOS

### Árvore Completa de Diretórios

```
apps-cliente/modelo-2/
├── docs/
│   ├── FAVORITOS_LIKE_DISLIKE.md
│   ├── PRE_DEPLOY_CHECKLIST.md
│   ├── QA_MANUAL.md
│   ├── RODAR_LOCAL.md
│   └── VARIAVEIS_AMBIENTE.md
├── public/
│   ├── background.jpg
│   ├── images/
│   │   ├── futuristic-background.jpg
│   │   └── README.md
│   ├── mock-person.jpg
│   ├── mock-result.jpg
│   ├── video2.mp4
│   └── video2tela2.mp4
├── scripts/
│   ├── verify-build.ps1
│   └── verify-build.sh
├── src/
│   ├── app/
│   │   ├── [lojistaId]/
│   │   │   ├── experimentar/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── resultado/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── actions/
│   │   │   │   ├── check-vote/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── cliente/
│   │   │   │   ├── check-session/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── favoritos/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── find/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   └── share/
│   │   │   │       └── route.ts
│   │   │   ├── generate-looks/
│   │   │   │   └── route.ts
│   │   │   ├── lojista/
│   │   │   │   ├── perfil/
│   │   │   │   │   └── route.ts
│   │   │   │   └── products/
│   │   │   │       └── route.ts
│   │   │   ├── refine-tryon/
│   │   │   │   └── route.ts
│   │   │   ├── simulator-proxy/
│   │   │   │   └── route.ts
│   │   │   ├── upload-photo/
│   │   │   │   └── route.ts
│   │   │   ├── verification/
│   │   │   │   ├── send-code/
│   │   │   │   │   └── route.ts
│   │   │   │   └── validate-code/
│   │   │   │       └── route.ts
│   │   │   └── watermark/
│   │   │       └── route.ts
│   │   ├── demo/
│   │   │   └── page.tsx
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── client-app/
│   │   │   ├── FavoritosStep2.tsx
│   │   │   ├── LoadingOverlay.tsx
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   └── Step3Results.tsx
│   │   ├── ClockAnimation.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Input.tsx
│   │   │   └── SafeImage.tsx
│   │   └── views/
│   │       └── ExperimentarView.tsx
│   └── lib/
│       ├── constants.ts
│       ├── firebase.ts
│       ├── firebaseQueries.ts
│       ├── produtosTeste.ts
│       ├── types.ts
│       ├── utils.ts
│       └── verification-codes.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── stop-node-processes.ps1
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vercel.json
```

---

## 📄 CONTEÚDO DOS ARQUIVOS CRÍTICOS

### 1. `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        {/* Viewport com suporte para safe areas */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        {/* Barra superior preta - Android */}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        {/* Barra inferior preta - Android */}
        <meta name="msapplication-navbutton-color" content="#000000" />
        {/* Barra superior preta - iOS/Mac */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body translate="no">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
```

**Observações:**
- ✅ Importa `./globals.css` corretamente
- ✅ Não aplica classes Tailwind diretamente no body (usa `@apply` no CSS)
- ⚠️ Meta tags de viewport podem interferir com estilos responsivos

---

### 2. `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

html {
  background-color: #000000;
  /* Suporte para safe areas - iOS */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

body {
  @apply bg-surface text-slate-900 antialiased;
  background-color: #000000; /* Fallback preto para as barras */
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  min-height: -webkit-fill-available; /* iOS Safari */
  /* Garantir que o body cubra as safe areas */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Barra de navegação inferior preta - Android */
@supports (padding: max(0px)) {
  body {
    padding-bottom: max(env(safe-area-inset-bottom), 0px);
  }
}

@layer base {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply text-slate-900;
  }

  ::selection {
    @apply bg-accent-1/20 text-slate-900;
  }
}

@layer components {
  .shadow-soft {
    box-shadow: 0 24px 60px -30px rgba(110, 121, 198, 0.45);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  @keyframes pulse-glow-strong {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.9), 0 0 50px rgba(59, 130, 246, 0.6), 0 0 75px rgba(59, 130, 246, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.8);
    }
    50% {
      transform: scale(1.03);
      box-shadow: 0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(59, 130, 246, 0.8), 0 0 120px rgba(59, 130, 246, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.8);
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 20px rgba(37, 99, 235, 0.8), 0 0 40px rgba(147, 51, 234, 0.6), 0 0 60px rgba(249, 115, 22, 0.4), 0 0 80px rgba(34, 197, 94, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(37, 99, 235, 1), 0 0 60px rgba(147, 51, 234, 0.8), 0 0 90px rgba(249, 115, 22, 0.6), 0 0 120px rgba(34, 197, 94, 0.4);
    }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes slide-in {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.5s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
  }
}
```

**Observações:**
- ✅ Diretivas `@tailwind` corretas
- ✅ Uso de `@apply` para classes Tailwind customizadas
- ✅ Classes customizadas definidas em `@layer components`
- ⚠️ Uso de `bg-surface` que deve estar definido no `tailwind.config.ts`
- ⚠️ Uso de `text-slate-900` e `bg-accent-1/20` que precisam estar disponíveis

---

### 3. `tailwind.config.ts`

```typescript
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
        soft: "0 24px 60px -30px rgba(110, 121, 246, 0.5)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config
```

**Observações:**
- ✅ Configuração de `content` inclui todos os caminhos relevantes
- ✅ Cores customizadas definidas (`surface`, `accent-1`, etc.)
- ✅ Plugin `@tailwindcss/forms` instalado
- ⚠️ **POTENCIAL PROBLEMA**: A configuração de `content` inclui `./src/pages/**/*` mas o projeto usa App Router (`src/app/`), não Pages Router. Isso pode não ser um problema se os arquivos estiverem em `src/app/`, mas é redundante.

---

### 4. `postcss.config.mjs`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Observações:**
- ✅ Configuração correta e padrão
- ✅ Tailwind e Autoprefixer configurados

---

### 5. `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de build
  swcMinify: true, // Usar SWC para minificação (mais rápido)
  compress: true, // Habilitar compressão
  
  // Remover console.log em produção
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Manter apenas erros e avisos
    } : false,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.googleapis.com",
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'], // Formatos modernos
    minimumCacheTTL: 60, // Cache de 60 segundos
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
```

**Observações:**
- ✅ Configuração padrão do Next.js
- ✅ Não há configuração que bloqueie CSS
- ⚠️ Não há configuração específica para otimização de CSS, mas isso geralmente não é necessário

---

### 6. `package.json`

```json
{
  "name": "modelo-2",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3005",
    "dev:3005": "next dev -p 3005",
    "build": "next build",
    "start": "next start -p 3005",
    "start:3005": "next start -p 3005",
    "lint": "next lint",
    "postinstall": "next telemetry disable"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-slot": "^1.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "firebase": "^12.6.0",
    "lucide-react": "^0.553.0",
    "next": "14.2.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hot-toast": "^2.6.0",
    "react-icons": "^5.5.0",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@types/node": "20.11.17",
    "@types/react": "18.2.47",
    "@types/react-dom": "18.2.18",
    "autoprefixer": "^10.4.19",
    "eslint": "8.56.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.13",
    "typescript": "5.3.3"
  }
}
```

**Observações:**
- ✅ Tailwind CSS instalado (v3.4.13)
- ✅ PostCSS instalado (v8.4.38)
- ✅ Autoprefixer instalado (v10.4.19)
- ✅ Plugin `@tailwindcss/forms` instalado
- ✅ Next.js 14.2.6 (compatível com Tailwind)
- ⚠️ **VERIFICAR**: Versões das dependências podem precisar de atualização

---

### 7. `src/components/ui/SafeImage.tsx`

```typescript
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  style?: React.CSSProperties
  onClick?: () => void
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  loading?: "lazy" | "eager"
  title?: string
}

/**
 * Componente SafeImage - Blindado contra imagens que estouram o container
 * 
 * Características:
 * - Usa position: relative inline para garantir que nunca ultrapasse o container pai
 * - Placeholder SVG quando a imagem falha
 * - Suporta todas as props padrão de img
 */
export function SafeImage({
  src,
  alt,
  className,
  containerClassName,
  style,
  onClick,
  onError,
  loading = "lazy",
  title,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("[SafeImage] Erro ao carregar imagem:", src, e)
    setHasError(true)
    setIsLoading(false)
    if (onError) {
      onError(e)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // Placeholder SVG quando há erro
  const placeholderSvg = (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-gray-400", className)}
      style={style}
    >
      <rect width="200" height="200" fill="#f3f4f6" />
      <path
        d="M60 80L100 60L140 80V140H60V80Z"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="85" cy="95" r="8" fill="#9ca3af" />
      <path
        d="M60 120L75 110L90 120L110 110L140 120V140H60V120Z"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )

  if (hasError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-gray-100", className)}
        style={{ position: "relative", ...style }}
        title={title}
      >
        {placeholderSvg}
      </div>
    )
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        width: "100%",
        ...style,
      }}
      className={cn("inline-block", containerClassName)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "block max-w-full h-auto transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100 animate-fade-in",
          className
        )}
        style={{
          position: "relative",
          maxWidth: "100%",
          height: "auto",
        }}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        title={title}
      />
    </div>
  )
}
```

**Observações:**
- ✅ Usa classes Tailwind: `flex`, `items-center`, `justify-center`, `bg-gray-100`, `absolute`, `inset-0`, `animate-pulse`, `animate-spin`, `rounded-full`, `border-4`, `block`, `max-w-full`, `h-auto`, `transition-opacity`, `duration-300`, `opacity-0`, `opacity-100`, `animate-fade-in`
- ✅ Usa `cn()` (provavelmente do `tailwind-merge`) para combinar classes
- ⚠️ Usa `animate-fade-in` que é uma animação customizada definida em `globals.css`

---

### 8. `src/app/[lojistaId]/experimentar/page.tsx`

Este arquivo tem **1010 linhas**. Mostrarei as partes mais críticas relacionadas ao CSS/Tailwind:

**Estrutura Principal:**
- Componente Client-Side (`"use client"`)
- Usa hooks do React (useState, useEffect, useRef, useMemo)
- Importa `ExperimentarView` como componente de apresentação
- Tela de carregamento inicial com estilos Tailwind

**Tela de Carregamento (linhas 946-973):**
```typescript
if (isInitializing) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          src="/video2tela2.mp4"
          loop
          muted
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/video2tela2.mp4" type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>
      <div className="relative z-10 flex h-screen flex-col items-center justify-center text-white">
        {lojistaData?.logoUrl && (
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-white/30">
            <img src={lojistaData.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          </div>
        )}
        <p className="font-semibold">Carregando sua experiência...</p>
        <div className="mt-4 h-6 w-6 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    </div>
  );
}
```

**Renderização Principal:**
```typescript
return (
  <ExperimentarView
    lojistaData={lojistaData}
    isLoadingCatalog={isLoadingCatalog}
    // ... outros props
  />
)
```

**Classes Tailwind usadas:**
- `relative`, `min-h-screen`, `w-full`, `overflow-hidden`
- `fixed`, `inset-0`, `z-0`, `z-10`
- `absolute`, `h-full`, `w-full`, `object-cover`
- `flex`, `flex-col`, `items-center`, `justify-center`
- `text-white`, `font-semibold`
- `mb-4`, `h-24`, `w-24`, `rounded-full`, `border-2`, `border-white/30`
- `mt-4`, `h-6`, `w-6`, `animate-spin`, `border-4`, `border-white/20`, `border-t-white`

---

### 9. `src/app/[lojistaId]/layout.tsx`

```typescript
// Layout para rotas dinâmicas [lojistaId]
// Garante que todas as rotas dentro de [lojistaId] sejam renderizadas dinamicamente
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

**Observações:**
- ✅ Layout simples que apenas passa children
- ✅ Configuração `force-dynamic` para SSR dinâmico
- ⚠️ Não interfere com CSS, apenas estrutura de roteamento

---

## 🔍 ANÁLISE DE ERROS E INCONSISTÊNCIAS

### 1. **Configuração do Tailwind - Paths de Content**

**Status:** ⚠️ POTENCIAL PROBLEMA

O `tailwind.config.ts` inclui:
```typescript
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",  // ← Pages Router
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",    // ← App Router
]
```

**Análise:**
- O projeto usa **App Router** (arquivos em `src/app/`)
- O path `./src/pages/**/*` é para **Pages Router** (não usado neste projeto)
- Isso não deveria causar problemas, mas é redundante

**Recomendação:**
- Remover `./src/pages/**/*` se não houver pasta `src/pages/`
- Manter apenas os paths relevantes

---

### 2. **Classes Customizadas no globals.css**

**Status:** ✅ CORRETO

O arquivo `globals.css` define:
- `bg-surface` → definido no `tailwind.config.ts` como `"#d8dce8"`
- `bg-accent-1/20` → `accent-1` definido como `"#6f5cf1"`, sufixo `/20` é opacidade do Tailwind
- `text-slate-900` → classe padrão do Tailwind (slate é cor padrão)

**Análise:**
- ✅ Tudo está configurado corretamente
- ✅ Cores customizadas disponíveis

---

### 3. **Animações Customizadas**

**Status:** ✅ CORRETO

O `globals.css` define animações customizadas:
- `animate-pulse-glow`
- `animate-slide-in`
- `animate-fade-in`
- `animate-scale-in`
- `animate-shimmer`

**Análise:**
- ✅ Todas definidas em `@layer components`
- ✅ Usadas nos componentes (ex: `animate-fade-in` em `SafeImage.tsx`)

**Uso verificado:**
- `ExperimentarView.tsx` usa `animate-fade-in`, `animate-scale-in`
- `SafeImage.tsx` usa `animate-fade-in`

---

### 4. **Importação do globals.css**

**Status:** ✅ CORRETO

O `layout.tsx` importa:
```typescript
import "./globals.css";
```

**Análise:**
- ✅ Importação correta e no lugar certo
- ✅ Deve estar no `layout.tsx` raiz para aplicar globalmente

---

### 5. **PostCSS Configuration**

**Status:** ✅ CORRETO

O `postcss.config.mjs` está configurado corretamente:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Análise:**
- ✅ Formato correto (ESM)
- ✅ Plugins na ordem correta (tailwindcss primeiro, depois autoprefixer)

---

### 6. **Dependências do Package.json**

**Status:** ✅ COMPATÍVEL

**Versões instaladas:**
- `tailwindcss`: `^3.4.13` ✅
- `postcss`: `^8.4.38` ✅
- `autoprefixer`: `^10.4.19` ✅
- `next`: `14.2.6` ✅ (compatível com Tailwind 3.x)

**Análise:**
- ✅ Todas as versões são compatíveis
- ✅ Plugin `@tailwindcss/forms` instalado

---

### 7. **Possíveis Problemas de Build**

**Checklist para diagnóstico:**

1. **Verificar se o CSS está sendo gerado:**
   - Procurar por arquivo `.next/static/css/` após build
   - Verificar se `globals.css` está sendo processado

2. **Verificar cache do Next.js:**
   - Limpar `.next/` e `node_modules/.cache/`
   - Rebuild completo

3. **Verificar se classes estão sendo purgadas incorretamente:**
   - Tailwind pode estar removendo classes dinâmicas
   - Classes geradas via JavaScript podem não ser detectadas

4. **Verificar conflitos de CSS:**
   - Estilos inline podem sobrescrever Tailwind
   - Classes de outros frameworks podem conflitar

---

## 🐛 PROBLEMAS IDENTIFICADOS E SOLUÇÕES

### Problema 1: Classes Tailwind não carregando

**Possíveis causas:**
1. **Build não processou o CSS:**
   ```bash
   # Solução: Limpar cache e rebuild
   rm -rf .next node_modules/.cache
   npm run build
   ```

2. **Classes dinâmicas não detectadas:**
   - Tailwind só inclui classes que encontra no código estático
   - Classes geradas dinamicamente podem ser removidas

3. **Ordem de importação:**
   - CSS deve ser importado antes de componentes

**Diagnóstico:**
```bash
# Verificar se o CSS está sendo gerado
npm run build
# Procurar em .next/static/css/ pelo arquivo CSS gerado
```

---

### Problema 2: Configuração de Content Paths

**Causa:** Paths redundantes no `tailwind.config.ts`

**Solução:**
```typescript
// tailwind.config.ts - VERSÃO OTIMIZADA
const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Remover ./src/pages/**/* se não existir pasta pages/
  ],
  // ... resto da config
}
```

---

### Problema 3: Classes Customizadas Não Funcionando

**Causa:** Classes customizadas podem não estar sendo aplicadas corretamente

**Verificação:**
- `bg-surface` → deve renderizar como `background-color: #d8dce8`
- `text-slate-900` → deve renderizar como `color: rgb(15 23 42)`

**Teste rápido:**
```tsx
<div className="bg-surface text-slate-900 p-4">
  Teste de classes Tailwind
</div>
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Use este checklist para diagnosticar problemas de CSS:

- [ ] ✅ `globals.css` está sendo importado no `layout.tsx`
- [ ] ✅ `tailwind.config.ts` está configurado corretamente
- [ ] ✅ `postcss.config.mjs` está configurado corretamente
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Build processa o CSS (verificar `.next/static/css/`)
- [ ] ✅ Classes customizadas definidas no `tailwind.config.ts`
- [ ] ✅ Animações customizadas definidas no `globals.css`
- [ ] ⚠️ Paths de `content` incluem todos os arquivos relevantes
- [ ] ⚠️ Cache limpo (`.next/` e `node_modules/.cache/`)
- [ ] ⚠️ Sem conflitos de CSS (estilos inline sobrescrevendo)

---

## 🔧 COMANDOS ÚTEIS PARA DIAGNÓSTICO

```bash
# 1. Limpar cache e rebuild
rm -rf .next node_modules/.cache
npm run build

# 2. Verificar estrutura de build
ls -la .next/static/css/

# 3. Rodar em modo desenvolvimento com logs
npm run dev

# 4. Verificar se Tailwind está processando
npx tailwindcss --help

# 5. Gerar CSS manualmente (teste)
npx tailwindcss -i ./src/app/globals.css -o ./test-output.css --watch
```

---

## 📝 RESUMO EXECUTIVO

### Estado Atual da Configuração

✅ **Configurações Corretas:**
- Importação do `globals.css` no layout raiz
- Configuração do PostCSS
- Dependências instaladas e compatíveis
- Classes customizadas definidas
- Animações customizadas definidas

⚠️ **Pontos de Atenção:**
- Paths redundantes no `tailwind.config.ts` (inclui `src/pages/` que pode não existir)
- Necessidade de limpar cache após mudanças de configuração
- Classes dinâmicas podem precisar de safelist no Tailwind

🔍 **Recomendações:**
1. Limpar cache e fazer rebuild completo
2. Remover path `./src/pages/**/*` do `tailwind.config.ts` se não existir pasta pages
3. Verificar se o CSS está sendo gerado corretamente no build
4. Usar ferramentas de desenvolvimento do navegador para inspecionar classes aplicadas

---

## 📞 PRÓXIMOS PASSOS PARA ARQUITETO EXTERNO

1. **Verificar Build:**
   - Executar `npm run build` e verificar se há erros
   - Inspecionar arquivo CSS gerado em `.next/static/css/`

2. **Inspecionar no Navegador:**
   - Abrir DevTools
   - Verificar se classes Tailwind estão sendo aplicadas
   - Verificar se há conflitos de CSS

3. **Testar Classes Customizadas:**
   - Criar componente de teste simples
   - Aplicar `bg-surface` e verificar se a cor aparece

4. **Verificar Cache:**
   - Limpar todos os caches
   - Fazer rebuild completo

5. **Comparar com Documentação:**
   - Verificar se a configuração segue as melhores práticas do Next.js 14
   - Verificar se a configuração segue as melhores práticas do Tailwind CSS 3.x

---

**Documento criado em:** 2025-01-27  
**Última atualização:** 2025-01-27  
**Status:** ✅ Completo

