# Documentação Técnica - Modelo 2 (App Cliente)

## Visão Geral

O **Modelo 2** é uma aplicação web de provador virtual inteligente desenvolvida com **Next.js 14**, **React 18**, **Firebase** e **Tailwind CSS**. O aplicativo permite que clientes façam upload de suas fotos, selecionem produtos de uma loja e gerem visualizações de looks personalizados usando Inteligência Artificial.

### Funcionalidades Principais

- **Autenticação de Clientes**: Sistema de login/cadastro com WhatsApp e senha
- **Upload de Fotos**: Upload de fotos do usuário para geração de looks
- **Catálogo de Produtos**: Visualização e seleção de produtos por categoria
- **Geração de Looks**: Integração com backend para gerar composições usando IA
- **Sistema de Favoritos**: Salvamento e visualização de looks favoritados
- **Compartilhamento Social**: Integração com redes sociais e WhatsApp
- **Refinamento de Looks**: Possibilidade de refinar looks gerados

### Tecnologias Principais

- **Next.js 14.2.6**: Framework React com App Router
- **React 18.3.1**: Biblioteca de interface de usuário
- **Firebase 12.6.0**: Autenticação, Firestore e Storage
- **Tailwind CSS 3.4.13**: Framework de estilização
- **TypeScript 5.3.3**: Tipagem estática
- **Lucide React**: Biblioteca de ícones

---

## Estrutura de Arquivos

```
modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/          # Rotas dinâmicas por lojista
│   │   │   ├── layout.tsx        # Layout específico do lojista
│   │   │   ├── page.tsx          # Página inicial (redirecionamento)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Página de login/cadastro
│   │   │   ├── experimentar/
│   │   │   │   └── page.tsx      # Página principal de experimentação
│   │   │   └── resultado/
│   │   │       └── page.tsx      # Página de resultados dos looks gerados
│   │   ├── api/                  # Rotas de API (proxies para backend)
│   │   │   ├── actions/          # Registro de ações (like, dislike, share)
│   │   │   ├── cliente/          # Autenticação e favoritos do cliente
│   │   │   ├── generate-looks/   # Geração de looks
│   │   │   ├── upload-photo/     # Upload de fotos
│   │   │   └── lojista/          # Dados do lojista e produtos
│   │   ├── layout.tsx            # Layout raiz da aplicação
│   │   ├── page.tsx              # Página inicial
│   │   └── globals.css           # Estilos globais
│   ├── components/
│   │   ├── client-app/           # Componentes específicos do app cliente
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   ├── Step3Results.tsx
│   │   │   ├── FavoritosStep2.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── views/
│   │   │   └── ExperimentarView.tsx  # View principal de experimentação
│   │   ├── ui/                   # Componentes de UI reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Checkbox.tsx
│   │   ├── ClockAnimation.tsx
│   │   └── LoadingSpinner.tsx
│   └── lib/
│       ├── firebase.ts           # Configuração do Firebase
│       ├── firebaseQueries.ts    # Queries do Firestore
│       ├── types.ts              # Definições de tipos TypeScript
│       ├── constants.ts          # Constantes da aplicação
│       ├── utils.ts              # Funções utilitárias
│       └── produtosTeste.ts      # Produtos de teste (fallback)
├── public/                       # Arquivos estáticos
│   ├── video2.mp4               # Vídeo de fundo
│   └── images/                   # Imagens estáticas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Dependências

### Dependencies

```json
{
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-slot": "^1.0.3",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "firebase": "^12.6.0",
  "lucide-react": "^0.553.0",
  "next": "14.2.6",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-icons": "^5.5.0",
  "tailwind-merge": "^2.5.2"
}
```

### DevDependencies

```json
{
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
```

---

## Arquivos Críticos

### 1. Configuração do Firebase (`src/lib/firebase.ts`)

```typescript
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const REQUIRED_KEYS = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = REQUIRED_KEYS.every(
  (value) => typeof value === "string" && value.length > 0
)

let firebaseApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: FirebaseStorage | null = null

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Firebase não configurado: usando dados mock/fallback.")
    }
    return null
  }

  if (!firebaseApp) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  }

  return firebaseApp
}

export function getFirebaseApp() {
  return initializeFirebase()
}

export function getFirebaseAuth() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedAuth) {
    cachedAuth = getAuth(app)
  }
  return cachedAuth
}

export function getFirestoreClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedDb) {
    cachedDb = getFirestore(app)
  }
  return cachedDb
}

export function getStorageClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedStorage) {
    cachedStorage = getStorage(app)
  }
  return cachedStorage
}
```

### 2. Definições de Tipos (`src/lib/types.ts`)

```typescript
export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesConfig = {
  whatsappLink?: string
  ecommerceUrl?: string
  [key: string]: string | undefined
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
}

export type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean
}

export type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  produtos?: Produto[]
}
```

### 3. Layout Principal (`src/app/layout.tsx`)

```typescript
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#000000" />
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
      <body translate="no">{children}</body>
    </html>
  );
}
```

### 4. Layout do Lojista (`src/app/[lojistaId]/layout.tsx`)

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

### 5. Página Principal (`src/app/[lojistaId]/page.tsx`)

```typescript
"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica para evitar erro 404 em rotas dinâmicas
export const dynamic = 'force-dynamic'

export default function ClienteAppPage() {
  const params = useParams()
  const router = useRouter()
  const [lojistaId, setLojistaId] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    // Garantir que params está disponível
    const id = (params?.lojistaId as string) || ""
    setLojistaId(id)
    
    if (!id) {
      // Se não houver lojistaId, redirecionar para página raiz
      router.push("/")
      return
    }
    
    if (isRedirecting) return
    
    setIsRedirecting(true)
    
    // Verificar login e redirecionar imediatamente
    const checkLogin = () => {
      try {
        const stored = localStorage.getItem(`cliente_${id}`)
        if (!stored) {
          router.replace(`/${id}/login`)
          return
        }
        // Se estiver logado, redirecionar para experimentar
        router.replace(`/${id}/experimentar`)
      } catch (error) {
        console.error("[ClienteAppPage] Erro ao verificar login:", error)
        router.replace(`/${id}/login`)
      }
    }
    
    // Redirecionar imediatamente sem delay
    checkLogin()
  }, [params, router, isRedirecting])
  
  // Redirecionar sem mostrar tela de loading
  return null
}
```

### 6. Rota de API - Login (`src/app/api/cliente/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/login
 * Autentica cliente com WhatsApp e senha
 * Body: { lojistaId: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, whatsapp, password } = body;

    if (!lojistaId || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Autenticar no backend
    const res = await fetch(`${backendUrl}/api/cliente/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lojistaId,
        whatsapp: cleanWhatsapp,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Login] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
```

### 7. Rota de API - Favoritos (`src/app/api/cliente/favoritos/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Proxy para buscar favoritos do cliente no backend (paineladm)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojistaId = searchParams.get("lojistaId");
    const customerId = searchParams.get("customerId");
    const timestamp = searchParams.get("_t");

    console.log("[Cliente Favoritos Proxy] Recebida requisição:", { lojistaId, customerId, timestamp });

    if (!lojistaId || !customerId) {
      console.error("[Cliente Favoritos Proxy] Parâmetros faltando:", { lojistaId: !!lojistaId, customerId: !!customerId });
      return NextResponse.json(
        { error: "lojistaId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Favoritos Proxy] Enviando para backend:", backendUrl);

    const url = `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(customerId)}${timestamp ? `&_t=${timestamp}` : ''}`;
    console.log("[Cliente Favoritos Proxy] URL completa:", url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cliente Favoritos Proxy] Erro na resposta:", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[Cliente Favoritos Proxy] Favoritos recebidos:", data.favorites?.length || 0);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Favoritos Proxy] Erro:", error);
    console.error("[Cliente Favoritos Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar favoritos" },
      { status: 500 }
    );
  }
}
```

### 8. Rota de API - Upload de Foto (`src/app/api/upload-photo/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/upload-photo`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await paineladmResponse.json();

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/upload-photo] Erro no proxy:", error);
    return NextResponse.json(
      { error: "Erro interno no proxy de upload" },
      { status: 500 }
    );
  }
}
```

### 9. Rota de API - Geração de Looks (`src/app/api/generate-looks/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    console.log("[modelo-1/api/generate-looks] Iniciando requisição:", {
      backendUrl,
      hasPersonImageUrl: !!body.personImageUrl,
      productIdsCount: body.productIds?.length || 0,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
    });

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await paineladmResponse.json();

    if (!paineladmResponse.ok) {
      console.error("[modelo-1/api/generate-looks] Erro do backend:", {
        status: paineladmResponse.status,
        error: data.error,
        details: data.details,
      });
      
      return NextResponse.json(
        {
          error: data.error || "Erro ao gerar composição",
          details: data.details || `Status: ${paineladmResponse.status}`,
        },
        { status: paineladmResponse.status }
      );
    }

    console.log("[modelo-1/api/generate-looks] Sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
    });

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/generate-looks] Erro no proxy:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return NextResponse.json(
      {
        error: "Erro interno no proxy de geração",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

### 10. Rota de API - Ações (`src/app/api/actions/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Actions Proxy] Recebido:", { action: body.action, lojistaId: body.lojistaId, customerId: body.customerId });
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Actions Proxy] Backend URL:", backendUrl);

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    console.log("[Actions Proxy] Enviando para backend:", { action: payload.action, lojistaId: payload.lojistaId });

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Actions Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json().catch((err) => {
      console.error("[Actions Proxy] Erro ao parsear JSON:", err);
      return { 
        success: false, 
        error: "Erro ao comunicar com o servidor" 
      };
    });

    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}
```

### 11. Queries do Firebase (`src/lib/firebaseQueries.ts`)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "./firebase"
import type { LojistaData, Produto } from "./types"
import { PRODUTOS_TESTE } from "./produtosTeste"

const produtosCollectionPath = (lojistaId: string) => {
  const db = getFirestoreClient()
  if (!db) return null
  return collection(db, "lojas", lojistaId, "produtos")
}

export async function fetchLojistaData(
  lojistaId: string
): Promise<LojistaData | null> {
  console.log("[fetchLojistaData] Iniciando busca para lojistaId:", lojistaId)

  // TENTATIVA 1: Buscar via API do Painel (para evitar erro de permissão do Firestore Client)
  try {
    const painelUrl = process.env.NEXT_PUBLIC_PAINEL_URL || "http://localhost:3000";
    
    console.log(`[fetchLojistaData] Tentando buscar via API: ${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`);
    
    const response = await fetch(`${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[fetchLojistaData] Dados recebidos da API:", data);
      
      if (data && (data.nome || data.descricao)) {
        return {
          id: lojistaId,
          nome: data.nome || "Loja",
          logoUrl: data.logoUrl || null,
          descricao: data.descricao || null,
          redesSociais: {
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
          },
          salesConfig: data.salesConfig || {},
          descontoRedesSociais: data.descontoRedesSociais || null,
          descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
        };
      }
    } else {
      console.warn("[fetchLojistaData] API retornou erro:", response.status);
    }
  } catch (apiError) {
    console.error("[fetchLojistaData] Erro ao buscar da API:", apiError);
  }

  // TENTATIVA 2: Fallback para Firestore Client (código original)
  console.log("[fetchLojistaData] Fallback para Firestore Client...");
  
  if (!isFirebaseConfigured) {
    console.warn("[fetchLojistaData] Firebase não configurado!")
    return null
  }

  try {
    const db = getFirestoreClient()
    if (!db) {
      console.warn("[fetchLojistaData] Firestore não disponível")
      return null
    }

    const lojistaDoc = await getDoc(doc(db, "lojas", lojistaId))
    
    if (lojistaDoc.exists()) {
      const data = lojistaDoc.data()
      console.log("[fetchLojistaData] ✅ Dados encontrados no Firestore:", data.nome)
      return {
        id: lojistaId,
        nome: data.nome || "Loja",
        logoUrl: data.logoUrl || null,
        descricao: data.descricao || null,
        redesSociais: {
          instagram: data.instagram || data.redesSociais?.instagram || null,
          facebook: data.facebook || data.redesSociais?.facebook || null,
          tiktok: data.tiktok || data.redesSociais?.tiktok || null,
          whatsapp: data.whatsapp || data.redesSociais?.whatsapp || null,
        },
        salesConfig: data.salesConfig || {
          whatsappLink: data.salesWhatsapp || null,
          ecommerceUrl: data.checkoutLink || null,
        },
        descontoRedesSociais: data.descontoRedesSociais || null,
        descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
      }
    }
    
    console.warn("[fetchLojistaData] Loja não encontrada no Firestore")
    return null

  } catch (error: any) {
     console.error("[fetchLojistaData] Erro no fallback:", error);
    return null
  }
}

export async function fetchProdutos(
  lojistaId: string,
  opts?: { categoria?: string; limite?: number }
): Promise<Produto[]> {
  let produtos: Produto[] = []

  // Tentar buscar do Firestore se configurado
  if (isFirebaseConfigured) {
    try {
      const baseCollection = produtosCollectionPath(lojistaId)
      if (baseCollection) {
        const filtros = [] as any[]

        if (opts?.categoria) {
          filtros.push(where("categoria", "==", opts.categoria))
        }

        let produtosQuery = query(baseCollection, ...filtros)

        if (opts?.limite) {
          produtosQuery = query(produtosQuery, limit(opts.limite))
        }

        const snapshot = await getDocs(produtosQuery)

        produtos = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()

          return {
            id: docSnapshot.id,
            nome: typeof data.nome === "string" ? data.nome : "Produto",
            preco: typeof data.preco === "number" ? data.preco : null,
            imagemUrl: typeof data.imagemUrl === "string" ? data.imagemUrl : null,
            categoria: typeof data.categoria === "string" ? data.categoria : null,
            tamanhos: Array.isArray(data.tamanhos) ? (data.tamanhos as string[]) : [],
            cores: Array.isArray(data.cores) ? (data.cores as string[]) : [],
            medidas: typeof data.medidas === "string" ? data.medidas : undefined,
            estoque: typeof data.estoque === "number" ? data.estoque : null,
            obs: typeof data.obs === "string" ? data.obs : undefined,
          }
        })
      }
    } catch (error: any) {
      // Se for erro de permissão, logar mas não quebrar o fluxo
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        console.warn("[fetchProdutos] Erro de permissão do Firestore:", error.message)
      } else {
        console.error("[fetchProdutos] Erro ao buscar produtos:", error)
      }
    }
  }

  // Se não encontrou produtos no Firestore, usar produtos de teste
  if (produtos.length === 0) {
    console.log("[fetchProdutos] Nenhum produto encontrado no Firestore. Usando produtos de teste.")
    produtos = [...PRODUTOS_TESTE]
  }

  // Aplicar filtro de categoria se especificado e usando produtos de teste
  if (opts?.categoria && produtos.length > 0 && produtos[0].id?.startsWith("produto-teste")) {
    produtos = produtos.filter((p) => p.categoria === opts.categoria)
  }

  // Aplicar limite se especificado
  if (opts?.limite && produtos.length > opts.limite) {
    produtos = produtos.slice(0, opts.limite)
  }

  return produtos
}
```

### 12. Constantes (`src/lib/constants.ts`)

```typescript
// Imagem de fundo do closet de luxo para todas as telas
// Imagem matriz: closet-background.png

// Usar imagem matriz local (closet-background)
// Coloque a imagem em: public/images/closet-background.png (ou .jpg)
export const CLOSET_BACKGROUND_IMAGE = "/images/closet-background.png"

// OPÇÃO 2: Usar imagem do Unsplash (fallback)
// Se a imagem local não existir, descomente a linha abaixo e comente a linha acima:
// export const CLOSET_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=80"
```

### 13. Utilitários (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Regras de Negócio

### Fluxo de Autenticação

1. **Acesso Inicial**: O usuário acessa a URL `/{lojistaId}` que redireciona automaticamente para `/{lojistaId}/login` se não estiver autenticado.

2. **Login/Cadastro**: 
   - O usuário pode escolher entre **Login** ou **Cadastro**
   - **Cadastro**: Requer nome completo, WhatsApp (com DDD) e senha (mínimo 6 caracteres)
   - **Login**: Requer WhatsApp e senha
   - O WhatsApp é formatado automaticamente: `(DD) 99999-9999`
   - O nome é capitalizado automaticamente

3. **Verificação de Sessão**:
   - Antes de fazer login/cadastro, o sistema limpa qualquer sessão anterior do mesmo WhatsApp na mesma loja
   - Faz logout no backend para garantir limpeza
   - Verifica se há sessão ativa em outro dispositivo
   - Implementa lógica de **"último dispositivo a logar ganha"** - se um novo dispositivo fizer login, o anterior é desconectado automaticamente

4. **Armazenamento Local**:
   - Os dados do cliente são salvos no `localStorage` com a chave `cliente_{lojistaId}`
   - Contém: `nome`, `whatsapp`, `lojistaId`, `clienteId`, `loggedAt`, `deviceId`
   - O `deviceId` é gerado uma vez e persistido para identificar o dispositivo

5. **Redirecionamento Pós-Login**:
   - Após login/cadastro bem-sucedido, o usuário é redirecionado para `/{lojistaId}/experimentar`

### Fluxo Principal (Upload → Processamento → Salvamento)

1. **Upload de Foto**:
   - O usuário pode fazer upload de uma foto através de:
     - Input de arquivo (seleção de arquivo)
     - Câmera (usando `capture="user"` no input)
   - A foto é enviada para `/api/upload-photo` que faz proxy para o backend (`/api/lojista/composicoes/upload-photo`)
   - A foto é armazenada no Firebase Storage e a URL é retornada

2. **Seleção de Produtos**:
   - O usuário navega pelo catálogo de produtos organizado por categorias
   - Pode selecionar múltiplos produtos (máximo recomendado: 3-5 produtos)
   - Os produtos são filtrados por categoria
   - Cada produto exibe: imagem, nome, preço (se disponível), tamanhos e cores

3. **Geração de Looks**:
   - Ao clicar em "Visualizar", o sistema:
     - Valida que há uma foto e pelo menos um produto selecionado
     - Envia requisição para `/api/generate-looks` que faz proxy para o backend (`/api/lojista/composicoes/generate`)
     - O backend processa usando IA e retorna os looks gerados
     - Os looks são salvos no `sessionStorage` para persistência durante a navegação

4. **Visualização de Resultados**:
   - O usuário é redirecionado para `/{lojistaId}/resultado`
   - Os looks são carregados do `sessionStorage`
   - O usuário pode:
     - Navegar entre os looks gerados
     - Dar **Like** (salva nos favoritos)
     - Dar **Dislike** (não salva, apenas contabiliza)
     - **Compartilhar** nas redes sociais
     - **Comprar** (redireciona para WhatsApp ou e-commerce)
     - **Refinar** o look (gera uma nova versão)

5. **Sistema de Favoritos**:
   - Apenas looks com **Like** são salvos nos favoritos
   - Dislikes não salvam a imagem, apenas contabilizam o custo e a ação
   - Os favoritos são buscados do backend via `/api/cliente/favoritos`
   - São exibidos em um modal com as últimas 10 imagens favoritadas
   - Ordenados por data de criação (mais recente primeiro)
   - Sem duplicatas (verificação por `imagemUrl` e `compositionId`)

6. **Ações do Cliente**:
   - Todas as ações (like, dislike, share, checkout) são registradas via `/api/actions`
   - O proxy envia para o backend (`/api/actions` do paineladm)
   - As ações são contabilizadas nas estatísticas do cliente
   - Para dislikes, a `imagemUrl` não é enviada (não salva a imagem)

### Fluxo de Refinamento

1. **Iniciar Refinamento**:
   - O usuário clica em "Refinar" em um look gerado
   - O look atual é salvo no `sessionStorage` como base para refinamento
   - O usuário é redirecionado de volta para `/{lojistaId}/experimentar` em modo refinamento

2. **Modo Refinamento**:
   - A foto base do look é carregada automaticamente
   - O usuário pode ajustar produtos ou manter os mesmos
   - Ao gerar novamente, o sistema usa a imagem base do look anterior

3. **Resultado do Refinamento**:
   - Os novos looks são gerados e exibidos normalmente
   - O modo de refinamento é limpo após a geração

### Integração com Backend

O aplicativo funciona como um **frontend proxy** que se comunica com o backend principal (paineladm):

- **URL do Backend**: Configurada via `NEXT_PUBLIC_BACKEND_URL` ou `NEXT_PUBLIC_PAINELADM_URL` (fallback: `http://localhost:3000`)
- **Rotas de Proxy**: Todas as rotas em `/api/*` fazem proxy para o backend correspondente
- **Autenticação**: O backend gerencia autenticação, sessões e dados dos clientes
- **Geração de Looks**: O backend processa a geração usando serviços de IA externos
- **Armazenamento**: O backend gerencia Firebase Storage e Firestore

### Gerenciamento de Estado

- **LocalStorage**: Dados de autenticação do cliente (`cliente_{lojistaId}`)
- **SessionStorage**: Looks gerados (`generated_looks_{lojistaId}`), modo de refinamento (`refine_mode_{lojistaId}`)
- **Estado React**: Gerenciamento de UI, catálogo, favoritos, etc.

---

## Variáveis de Ambiente Necessárias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://localhost:3000
```

---

## Scripts Disponíveis

```json
{
  "dev": "next dev -p 3005",
  "build": "next build",
  "start": "next start -p 3005",
  "lint": "next lint"
}
```

---

## Observações Importantes

1. **Porta Padrão**: O aplicativo roda na porta **3005** por padrão
2. **Rotas Dinâmicas**: Todas as rotas sob `[lojistaId]` são renderizadas dinamicamente (`force-dynamic`)
3. **Proxy Pattern**: O app funciona como proxy para o backend, não possui lógica de negócio própria
4. **Fallback de Produtos**: Se não houver produtos no Firestore, usa produtos de teste (`produtosTeste.ts`)
5. **Sessão Única**: Implementa lógica de "último dispositivo a logar ganha" para evitar múltiplas sessões
6. **Favoritos**: Apenas likes são salvos, dislikes apenas contabilizam sem salvar imagem

---

**Documentação gerada em:** 2025-01-23  
**Versão do Projeto:** 0.1.0  
**Última Atualização:** 2025-01-23


## Visão Geral

O **Modelo 2** é uma aplicação web de provador virtual inteligente desenvolvida com **Next.js 14**, **React 18**, **Firebase** e **Tailwind CSS**. O aplicativo permite que clientes façam upload de suas fotos, selecionem produtos de uma loja e gerem visualizações de looks personalizados usando Inteligência Artificial.

### Funcionalidades Principais

- **Autenticação de Clientes**: Sistema de login/cadastro com WhatsApp e senha
- **Upload de Fotos**: Upload de fotos do usuário para geração de looks
- **Catálogo de Produtos**: Visualização e seleção de produtos por categoria
- **Geração de Looks**: Integração com backend para gerar composições usando IA
- **Sistema de Favoritos**: Salvamento e visualização de looks favoritados
- **Compartilhamento Social**: Integração com redes sociais e WhatsApp
- **Refinamento de Looks**: Possibilidade de refinar looks gerados

### Tecnologias Principais

- **Next.js 14.2.6**: Framework React com App Router
- **React 18.3.1**: Biblioteca de interface de usuário
- **Firebase 12.6.0**: Autenticação, Firestore e Storage
- **Tailwind CSS 3.4.13**: Framework de estilização
- **TypeScript 5.3.3**: Tipagem estática
- **Lucide React**: Biblioteca de ícones

---

## Estrutura de Arquivos

```
modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/          # Rotas dinâmicas por lojista
│   │   │   ├── layout.tsx        # Layout específico do lojista
│   │   │   ├── page.tsx          # Página inicial (redirecionamento)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Página de login/cadastro
│   │   │   ├── experimentar/
│   │   │   │   └── page.tsx      # Página principal de experimentação
│   │   │   └── resultado/
│   │   │       └── page.tsx      # Página de resultados dos looks gerados
│   │   ├── api/                  # Rotas de API (proxies para backend)
│   │   │   ├── actions/          # Registro de ações (like, dislike, share)
│   │   │   ├── cliente/          # Autenticação e favoritos do cliente
│   │   │   ├── generate-looks/   # Geração de looks
│   │   │   ├── upload-photo/     # Upload de fotos
│   │   │   └── lojista/          # Dados do lojista e produtos
│   │   ├── layout.tsx            # Layout raiz da aplicação
│   │   ├── page.tsx              # Página inicial
│   │   └── globals.css           # Estilos globais
│   ├── components/
│   │   ├── client-app/           # Componentes específicos do app cliente
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   ├── Step3Results.tsx
│   │   │   ├── FavoritosStep2.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── views/
│   │   │   └── ExperimentarView.tsx  # View principal de experimentação
│   │   ├── ui/                   # Componentes de UI reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Checkbox.tsx
│   │   ├── ClockAnimation.tsx
│   │   └── LoadingSpinner.tsx
│   └── lib/
│       ├── firebase.ts           # Configuração do Firebase
│       ├── firebaseQueries.ts    # Queries do Firestore
│       ├── types.ts              # Definições de tipos TypeScript
│       ├── constants.ts          # Constantes da aplicação
│       ├── utils.ts              # Funções utilitárias
│       └── produtosTeste.ts      # Produtos de teste (fallback)
├── public/                       # Arquivos estáticos
│   ├── video2.mp4               # Vídeo de fundo
│   └── images/                   # Imagens estáticas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Dependências

### Dependencies

```json
{
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-slot": "^1.0.3",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "firebase": "^12.6.0",
  "lucide-react": "^0.553.0",
  "next": "14.2.6",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-icons": "^5.5.0",
  "tailwind-merge": "^2.5.2"
}
```

### DevDependencies

```json
{
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
```

---

## Arquivos Críticos

### 1. Configuração do Firebase (`src/lib/firebase.ts`)

```typescript
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const REQUIRED_KEYS = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = REQUIRED_KEYS.every(
  (value) => typeof value === "string" && value.length > 0
)

let firebaseApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: FirebaseStorage | null = null

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Firebase não configurado: usando dados mock/fallback.")
    }
    return null
  }

  if (!firebaseApp) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  }

  return firebaseApp
}

export function getFirebaseApp() {
  return initializeFirebase()
}

export function getFirebaseAuth() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedAuth) {
    cachedAuth = getAuth(app)
  }
  return cachedAuth
}

export function getFirestoreClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedDb) {
    cachedDb = getFirestore(app)
  }
  return cachedDb
}

export function getStorageClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedStorage) {
    cachedStorage = getStorage(app)
  }
  return cachedStorage
}
```

### 2. Definições de Tipos (`src/lib/types.ts`)

```typescript
export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesConfig = {
  whatsappLink?: string
  ecommerceUrl?: string
  [key: string]: string | undefined
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
}

export type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean
}

export type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  produtos?: Produto[]
}
```

### 3. Layout Principal (`src/app/layout.tsx`)

```typescript
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#000000" />
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
      <body translate="no">{children}</body>
    </html>
  );
}
```

### 4. Layout do Lojista (`src/app/[lojistaId]/layout.tsx`)

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

### 5. Página Principal (`src/app/[lojistaId]/page.tsx`)

```typescript
"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica para evitar erro 404 em rotas dinâmicas
export const dynamic = 'force-dynamic'

export default function ClienteAppPage() {
  const params = useParams()
  const router = useRouter()
  const [lojistaId, setLojistaId] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    // Garantir que params está disponível
    const id = (params?.lojistaId as string) || ""
    setLojistaId(id)
    
    if (!id) {
      // Se não houver lojistaId, redirecionar para página raiz
      router.push("/")
      return
    }
    
    if (isRedirecting) return
    
    setIsRedirecting(true)
    
    // Verificar login e redirecionar imediatamente
    const checkLogin = () => {
      try {
        const stored = localStorage.getItem(`cliente_${id}`)
        if (!stored) {
          router.replace(`/${id}/login`)
          return
        }
        // Se estiver logado, redirecionar para experimentar
        router.replace(`/${id}/experimentar`)
      } catch (error) {
        console.error("[ClienteAppPage] Erro ao verificar login:", error)
        router.replace(`/${id}/login`)
      }
    }
    
    // Redirecionar imediatamente sem delay
    checkLogin()
  }, [params, router, isRedirecting])
  
  // Redirecionar sem mostrar tela de loading
  return null
}
```

### 6. Rota de API - Login (`src/app/api/cliente/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/login
 * Autentica cliente com WhatsApp e senha
 * Body: { lojistaId: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, whatsapp, password } = body;

    if (!lojistaId || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Autenticar no backend
    const res = await fetch(`${backendUrl}/api/cliente/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lojistaId,
        whatsapp: cleanWhatsapp,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Login] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
```

### 7. Rota de API - Favoritos (`src/app/api/cliente/favoritos/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Proxy para buscar favoritos do cliente no backend (paineladm)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojistaId = searchParams.get("lojistaId");
    const customerId = searchParams.get("customerId");
    const timestamp = searchParams.get("_t");

    console.log("[Cliente Favoritos Proxy] Recebida requisição:", { lojistaId, customerId, timestamp });

    if (!lojistaId || !customerId) {
      console.error("[Cliente Favoritos Proxy] Parâmetros faltando:", { lojistaId: !!lojistaId, customerId: !!customerId });
      return NextResponse.json(
        { error: "lojistaId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Favoritos Proxy] Enviando para backend:", backendUrl);

    const url = `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(customerId)}${timestamp ? `&_t=${timestamp}` : ''}`;
    console.log("[Cliente Favoritos Proxy] URL completa:", url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cliente Favoritos Proxy] Erro na resposta:", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[Cliente Favoritos Proxy] Favoritos recebidos:", data.favorites?.length || 0);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Favoritos Proxy] Erro:", error);
    console.error("[Cliente Favoritos Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar favoritos" },
      { status: 500 }
    );
  }
}
```

### 8. Rota de API - Upload de Foto (`src/app/api/upload-photo/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/upload-photo`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await paineladmResponse.json();

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/upload-photo] Erro no proxy:", error);
    return NextResponse.json(
      { error: "Erro interno no proxy de upload" },
      { status: 500 }
    );
  }
}
```

### 9. Rota de API - Geração de Looks (`src/app/api/generate-looks/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    console.log("[modelo-1/api/generate-looks] Iniciando requisição:", {
      backendUrl,
      hasPersonImageUrl: !!body.personImageUrl,
      productIdsCount: body.productIds?.length || 0,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
    });

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await paineladmResponse.json();

    if (!paineladmResponse.ok) {
      console.error("[modelo-1/api/generate-looks] Erro do backend:", {
        status: paineladmResponse.status,
        error: data.error,
        details: data.details,
      });
      
      return NextResponse.json(
        {
          error: data.error || "Erro ao gerar composição",
          details: data.details || `Status: ${paineladmResponse.status}`,
        },
        { status: paineladmResponse.status }
      );
    }

    console.log("[modelo-1/api/generate-looks] Sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
    });

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/generate-looks] Erro no proxy:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return NextResponse.json(
      {
        error: "Erro interno no proxy de geração",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

### 10. Rota de API - Ações (`src/app/api/actions/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Actions Proxy] Recebido:", { action: body.action, lojistaId: body.lojistaId, customerId: body.customerId });
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Actions Proxy] Backend URL:", backendUrl);

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    console.log("[Actions Proxy] Enviando para backend:", { action: payload.action, lojistaId: payload.lojistaId });

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Actions Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json().catch((err) => {
      console.error("[Actions Proxy] Erro ao parsear JSON:", err);
      return { 
        success: false, 
        error: "Erro ao comunicar com o servidor" 
      };
    });

    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}
```

### 11. Queries do Firebase (`src/lib/firebaseQueries.ts`)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "./firebase"
import type { LojistaData, Produto } from "./types"
import { PRODUTOS_TESTE } from "./produtosTeste"

const produtosCollectionPath = (lojistaId: string) => {
  const db = getFirestoreClient()
  if (!db) return null
  return collection(db, "lojas", lojistaId, "produtos")
}

export async function fetchLojistaData(
  lojistaId: string
): Promise<LojistaData | null> {
  console.log("[fetchLojistaData] Iniciando busca para lojistaId:", lojistaId)

  // TENTATIVA 1: Buscar via API do Painel (para evitar erro de permissão do Firestore Client)
  try {
    const painelUrl = process.env.NEXT_PUBLIC_PAINEL_URL || "http://localhost:3000";
    
    console.log(`[fetchLojistaData] Tentando buscar via API: ${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`);
    
    const response = await fetch(`${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[fetchLojistaData] Dados recebidos da API:", data);
      
      if (data && (data.nome || data.descricao)) {
        return {
          id: lojistaId,
          nome: data.nome || "Loja",
          logoUrl: data.logoUrl || null,
          descricao: data.descricao || null,
          redesSociais: {
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
          },
          salesConfig: data.salesConfig || {},
          descontoRedesSociais: data.descontoRedesSociais || null,
          descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
        };
      }
    } else {
      console.warn("[fetchLojistaData] API retornou erro:", response.status);
    }
  } catch (apiError) {
    console.error("[fetchLojistaData] Erro ao buscar da API:", apiError);
  }

  // TENTATIVA 2: Fallback para Firestore Client (código original)
  console.log("[fetchLojistaData] Fallback para Firestore Client...");
  
  if (!isFirebaseConfigured) {
    console.warn("[fetchLojistaData] Firebase não configurado!")
    return null
  }

  try {
    const db = getFirestoreClient()
    if (!db) {
      console.warn("[fetchLojistaData] Firestore não disponível")
      return null
    }

    const lojistaDoc = await getDoc(doc(db, "lojas", lojistaId))
    
    if (lojistaDoc.exists()) {
      const data = lojistaDoc.data()
      console.log("[fetchLojistaData] ✅ Dados encontrados no Firestore:", data.nome)
      return {
        id: lojistaId,
        nome: data.nome || "Loja",
        logoUrl: data.logoUrl || null,
        descricao: data.descricao || null,
        redesSociais: {
          instagram: data.instagram || data.redesSociais?.instagram || null,
          facebook: data.facebook || data.redesSociais?.facebook || null,
          tiktok: data.tiktok || data.redesSociais?.tiktok || null,
          whatsapp: data.whatsapp || data.redesSociais?.whatsapp || null,
        },
        salesConfig: data.salesConfig || {
          whatsappLink: data.salesWhatsapp || null,
          ecommerceUrl: data.checkoutLink || null,
        },
        descontoRedesSociais: data.descontoRedesSociais || null,
        descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
      }
    }
    
    console.warn("[fetchLojistaData] Loja não encontrada no Firestore")
    return null

  } catch (error: any) {
     console.error("[fetchLojistaData] Erro no fallback:", error);
    return null
  }
}

export async function fetchProdutos(
  lojistaId: string,
  opts?: { categoria?: string; limite?: number }
): Promise<Produto[]> {
  let produtos: Produto[] = []

  // Tentar buscar do Firestore se configurado
  if (isFirebaseConfigured) {
    try {
      const baseCollection = produtosCollectionPath(lojistaId)
      if (baseCollection) {
        const filtros = [] as any[]

        if (opts?.categoria) {
          filtros.push(where("categoria", "==", opts.categoria))
        }

        let produtosQuery = query(baseCollection, ...filtros)

        if (opts?.limite) {
          produtosQuery = query(produtosQuery, limit(opts.limite))
        }

        const snapshot = await getDocs(produtosQuery)

        produtos = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()

          return {
            id: docSnapshot.id,
            nome: typeof data.nome === "string" ? data.nome : "Produto",
            preco: typeof data.preco === "number" ? data.preco : null,
            imagemUrl: typeof data.imagemUrl === "string" ? data.imagemUrl : null,
            categoria: typeof data.categoria === "string" ? data.categoria : null,
            tamanhos: Array.isArray(data.tamanhos) ? (data.tamanhos as string[]) : [],
            cores: Array.isArray(data.cores) ? (data.cores as string[]) : [],
            medidas: typeof data.medidas === "string" ? data.medidas : undefined,
            estoque: typeof data.estoque === "number" ? data.estoque : null,
            obs: typeof data.obs === "string" ? data.obs : undefined,
          }
        })
      }
    } catch (error: any) {
      // Se for erro de permissão, logar mas não quebrar o fluxo
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        console.warn("[fetchProdutos] Erro de permissão do Firestore:", error.message)
      } else {
        console.error("[fetchProdutos] Erro ao buscar produtos:", error)
      }
    }
  }

  // Se não encontrou produtos no Firestore, usar produtos de teste
  if (produtos.length === 0) {
    console.log("[fetchProdutos] Nenhum produto encontrado no Firestore. Usando produtos de teste.")
    produtos = [...PRODUTOS_TESTE]
  }

  // Aplicar filtro de categoria se especificado e usando produtos de teste
  if (opts?.categoria && produtos.length > 0 && produtos[0].id?.startsWith("produto-teste")) {
    produtos = produtos.filter((p) => p.categoria === opts.categoria)
  }

  // Aplicar limite se especificado
  if (opts?.limite && produtos.length > opts.limite) {
    produtos = produtos.slice(0, opts.limite)
  }

  return produtos
}
```

### 12. Constantes (`src/lib/constants.ts`)

```typescript
// Imagem de fundo do closet de luxo para todas as telas
// Imagem matriz: closet-background.png

// Usar imagem matriz local (closet-background)
// Coloque a imagem em: public/images/closet-background.png (ou .jpg)
export const CLOSET_BACKGROUND_IMAGE = "/images/closet-background.png"

// OPÇÃO 2: Usar imagem do Unsplash (fallback)
// Se a imagem local não existir, descomente a linha abaixo e comente a linha acima:
// export const CLOSET_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=80"
```

### 13. Utilitários (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Regras de Negócio

### Fluxo de Autenticação

1. **Acesso Inicial**: O usuário acessa a URL `/{lojistaId}` que redireciona automaticamente para `/{lojistaId}/login` se não estiver autenticado.

2. **Login/Cadastro**: 
   - O usuário pode escolher entre **Login** ou **Cadastro**
   - **Cadastro**: Requer nome completo, WhatsApp (com DDD) e senha (mínimo 6 caracteres)
   - **Login**: Requer WhatsApp e senha
   - O WhatsApp é formatado automaticamente: `(DD) 99999-9999`
   - O nome é capitalizado automaticamente

3. **Verificação de Sessão**:
   - Antes de fazer login/cadastro, o sistema limpa qualquer sessão anterior do mesmo WhatsApp na mesma loja
   - Faz logout no backend para garantir limpeza
   - Verifica se há sessão ativa em outro dispositivo
   - Implementa lógica de **"último dispositivo a logar ganha"** - se um novo dispositivo fizer login, o anterior é desconectado automaticamente

4. **Armazenamento Local**:
   - Os dados do cliente são salvos no `localStorage` com a chave `cliente_{lojistaId}`
   - Contém: `nome`, `whatsapp`, `lojistaId`, `clienteId`, `loggedAt`, `deviceId`
   - O `deviceId` é gerado uma vez e persistido para identificar o dispositivo

5. **Redirecionamento Pós-Login**:
   - Após login/cadastro bem-sucedido, o usuário é redirecionado para `/{lojistaId}/experimentar`

### Fluxo Principal (Upload → Processamento → Salvamento)

1. **Upload de Foto**:
   - O usuário pode fazer upload de uma foto através de:
     - Input de arquivo (seleção de arquivo)
     - Câmera (usando `capture="user"` no input)
   - A foto é enviada para `/api/upload-photo` que faz proxy para o backend (`/api/lojista/composicoes/upload-photo`)
   - A foto é armazenada no Firebase Storage e a URL é retornada

2. **Seleção de Produtos**:
   - O usuário navega pelo catálogo de produtos organizado por categorias
   - Pode selecionar múltiplos produtos (máximo recomendado: 3-5 produtos)
   - Os produtos são filtrados por categoria
   - Cada produto exibe: imagem, nome, preço (se disponível), tamanhos e cores

3. **Geração de Looks**:
   - Ao clicar em "Visualizar", o sistema:
     - Valida que há uma foto e pelo menos um produto selecionado
     - Envia requisição para `/api/generate-looks` que faz proxy para o backend (`/api/lojista/composicoes/generate`)
     - O backend processa usando IA e retorna os looks gerados
     - Os looks são salvos no `sessionStorage` para persistência durante a navegação

4. **Visualização de Resultados**:
   - O usuário é redirecionado para `/{lojistaId}/resultado`
   - Os looks são carregados do `sessionStorage`
   - O usuário pode:
     - Navegar entre os looks gerados
     - Dar **Like** (salva nos favoritos)
     - Dar **Dislike** (não salva, apenas contabiliza)
     - **Compartilhar** nas redes sociais
     - **Comprar** (redireciona para WhatsApp ou e-commerce)
     - **Refinar** o look (gera uma nova versão)

5. **Sistema de Favoritos**:
   - Apenas looks com **Like** são salvos nos favoritos
   - Dislikes não salvam a imagem, apenas contabilizam o custo e a ação
   - Os favoritos são buscados do backend via `/api/cliente/favoritos`
   - São exibidos em um modal com as últimas 10 imagens favoritadas
   - Ordenados por data de criação (mais recente primeiro)
   - Sem duplicatas (verificação por `imagemUrl` e `compositionId`)

6. **Ações do Cliente**:
   - Todas as ações (like, dislike, share, checkout) são registradas via `/api/actions`
   - O proxy envia para o backend (`/api/actions` do paineladm)
   - As ações são contabilizadas nas estatísticas do cliente
   - Para dislikes, a `imagemUrl` não é enviada (não salva a imagem)

### Fluxo de Refinamento

1. **Iniciar Refinamento**:
   - O usuário clica em "Refinar" em um look gerado
   - O look atual é salvo no `sessionStorage` como base para refinamento
   - O usuário é redirecionado de volta para `/{lojistaId}/experimentar` em modo refinamento

2. **Modo Refinamento**:
   - A foto base do look é carregada automaticamente
   - O usuário pode ajustar produtos ou manter os mesmos
   - Ao gerar novamente, o sistema usa a imagem base do look anterior

3. **Resultado do Refinamento**:
   - Os novos looks são gerados e exibidos normalmente
   - O modo de refinamento é limpo após a geração

### Integração com Backend

O aplicativo funciona como um **frontend proxy** que se comunica com o backend principal (paineladm):

- **URL do Backend**: Configurada via `NEXT_PUBLIC_BACKEND_URL` ou `NEXT_PUBLIC_PAINELADM_URL` (fallback: `http://localhost:3000`)
- **Rotas de Proxy**: Todas as rotas em `/api/*` fazem proxy para o backend correspondente
- **Autenticação**: O backend gerencia autenticação, sessões e dados dos clientes
- **Geração de Looks**: O backend processa a geração usando serviços de IA externos
- **Armazenamento**: O backend gerencia Firebase Storage e Firestore

### Gerenciamento de Estado

- **LocalStorage**: Dados de autenticação do cliente (`cliente_{lojistaId}`)
- **SessionStorage**: Looks gerados (`generated_looks_{lojistaId}`), modo de refinamento (`refine_mode_{lojistaId}`)
- **Estado React**: Gerenciamento de UI, catálogo, favoritos, etc.

---

## Variáveis de Ambiente Necessárias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://localhost:3000
```

---

## Scripts Disponíveis

```json
{
  "dev": "next dev -p 3005",
  "build": "next build",
  "start": "next start -p 3005",
  "lint": "next lint"
}
```

---

## Observações Importantes

1. **Porta Padrão**: O aplicativo roda na porta **3005** por padrão
2. **Rotas Dinâmicas**: Todas as rotas sob `[lojistaId]` são renderizadas dinamicamente (`force-dynamic`)
3. **Proxy Pattern**: O app funciona como proxy para o backend, não possui lógica de negócio própria
4. **Fallback de Produtos**: Se não houver produtos no Firestore, usa produtos de teste (`produtosTeste.ts`)
5. **Sessão Única**: Implementa lógica de "último dispositivo a logar ganha" para evitar múltiplas sessões
6. **Favoritos**: Apenas likes são salvos, dislikes apenas contabilizam sem salvar imagem

---

**Documentação gerada em:** 2025-01-23  
**Versão do Projeto:** 0.1.0  
**Última Atualização:** 2025-01-23


## Visão Geral

O **Modelo 2** é uma aplicação web de provador virtual inteligente desenvolvida com **Next.js 14**, **React 18**, **Firebase** e **Tailwind CSS**. O aplicativo permite que clientes façam upload de suas fotos, selecionem produtos de uma loja e gerem visualizações de looks personalizados usando Inteligência Artificial.

### Funcionalidades Principais

- **Autenticação de Clientes**: Sistema de login/cadastro com WhatsApp e senha
- **Upload de Fotos**: Upload de fotos do usuário para geração de looks
- **Catálogo de Produtos**: Visualização e seleção de produtos por categoria
- **Geração de Looks**: Integração com backend para gerar composições usando IA
- **Sistema de Favoritos**: Salvamento e visualização de looks favoritados
- **Compartilhamento Social**: Integração com redes sociais e WhatsApp
- **Refinamento de Looks**: Possibilidade de refinar looks gerados

### Tecnologias Principais

- **Next.js 14.2.6**: Framework React com App Router
- **React 18.3.1**: Biblioteca de interface de usuário
- **Firebase 12.6.0**: Autenticação, Firestore e Storage
- **Tailwind CSS 3.4.13**: Framework de estilização
- **TypeScript 5.3.3**: Tipagem estática
- **Lucide React**: Biblioteca de ícones

---

## Estrutura de Arquivos

```
modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/          # Rotas dinâmicas por lojista
│   │   │   ├── layout.tsx        # Layout específico do lojista
│   │   │   ├── page.tsx          # Página inicial (redirecionamento)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Página de login/cadastro
│   │   │   ├── experimentar/
│   │   │   │   └── page.tsx      # Página principal de experimentação
│   │   │   └── resultado/
│   │   │       └── page.tsx      # Página de resultados dos looks gerados
│   │   ├── api/                  # Rotas de API (proxies para backend)
│   │   │   ├── actions/          # Registro de ações (like, dislike, share)
│   │   │   ├── cliente/          # Autenticação e favoritos do cliente
│   │   │   ├── generate-looks/   # Geração de looks
│   │   │   ├── upload-photo/     # Upload de fotos
│   │   │   └── lojista/          # Dados do lojista e produtos
│   │   ├── layout.tsx            # Layout raiz da aplicação
│   │   ├── page.tsx              # Página inicial
│   │   └── globals.css           # Estilos globais
│   ├── components/
│   │   ├── client-app/           # Componentes específicos do app cliente
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   ├── Step3Results.tsx
│   │   │   ├── FavoritosStep2.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── views/
│   │   │   └── ExperimentarView.tsx  # View principal de experimentação
│   │   ├── ui/                   # Componentes de UI reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Checkbox.tsx
│   │   ├── ClockAnimation.tsx
│   │   └── LoadingSpinner.tsx
│   └── lib/
│       ├── firebase.ts           # Configuração do Firebase
│       ├── firebaseQueries.ts    # Queries do Firestore
│       ├── types.ts              # Definições de tipos TypeScript
│       ├── constants.ts          # Constantes da aplicação
│       ├── utils.ts              # Funções utilitárias
│       └── produtosTeste.ts      # Produtos de teste (fallback)
├── public/                       # Arquivos estáticos
│   ├── video2.mp4               # Vídeo de fundo
│   └── images/                   # Imagens estáticas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Dependências

### Dependencies

```json
{
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-slot": "^1.0.3",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "firebase": "^12.6.0",
  "lucide-react": "^0.553.0",
  "next": "14.2.6",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-icons": "^5.5.0",
  "tailwind-merge": "^2.5.2"
}
```

### DevDependencies

```json
{
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
```

---

## Arquivos Críticos

### 1. Configuração do Firebase (`src/lib/firebase.ts`)

```typescript
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const REQUIRED_KEYS = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = REQUIRED_KEYS.every(
  (value) => typeof value === "string" && value.length > 0
)

let firebaseApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: FirebaseStorage | null = null

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Firebase não configurado: usando dados mock/fallback.")
    }
    return null
  }

  if (!firebaseApp) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  }

  return firebaseApp
}

export function getFirebaseApp() {
  return initializeFirebase()
}

export function getFirebaseAuth() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedAuth) {
    cachedAuth = getAuth(app)
  }
  return cachedAuth
}

export function getFirestoreClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedDb) {
    cachedDb = getFirestore(app)
  }
  return cachedDb
}

export function getStorageClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedStorage) {
    cachedStorage = getStorage(app)
  }
  return cachedStorage
}
```

### 2. Definições de Tipos (`src/lib/types.ts`)

```typescript
export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesConfig = {
  whatsappLink?: string
  ecommerceUrl?: string
  [key: string]: string | undefined
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
}

export type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean
}

export type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  produtos?: Produto[]
}
```

### 3. Layout Principal (`src/app/layout.tsx`)

```typescript
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#000000" />
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
      <body translate="no">{children}</body>
    </html>
  );
}
```

### 4. Layout do Lojista (`src/app/[lojistaId]/layout.tsx`)

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

### 5. Página Principal (`src/app/[lojistaId]/page.tsx`)

```typescript
"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica para evitar erro 404 em rotas dinâmicas
export const dynamic = 'force-dynamic'

export default function ClienteAppPage() {
  const params = useParams()
  const router = useRouter()
  const [lojistaId, setLojistaId] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    // Garantir que params está disponível
    const id = (params?.lojistaId as string) || ""
    setLojistaId(id)
    
    if (!id) {
      // Se não houver lojistaId, redirecionar para página raiz
      router.push("/")
      return
    }
    
    if (isRedirecting) return
    
    setIsRedirecting(true)
    
    // Verificar login e redirecionar imediatamente
    const checkLogin = () => {
      try {
        const stored = localStorage.getItem(`cliente_${id}`)
        if (!stored) {
          router.replace(`/${id}/login`)
          return
        }
        // Se estiver logado, redirecionar para experimentar
        router.replace(`/${id}/experimentar`)
      } catch (error) {
        console.error("[ClienteAppPage] Erro ao verificar login:", error)
        router.replace(`/${id}/login`)
      }
    }
    
    // Redirecionar imediatamente sem delay
    checkLogin()
  }, [params, router, isRedirecting])
  
  // Redirecionar sem mostrar tela de loading
  return null
}
```

### 6. Rota de API - Login (`src/app/api/cliente/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/login
 * Autentica cliente com WhatsApp e senha
 * Body: { lojistaId: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, whatsapp, password } = body;

    if (!lojistaId || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Autenticar no backend
    const res = await fetch(`${backendUrl}/api/cliente/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lojistaId,
        whatsapp: cleanWhatsapp,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Login] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
```

### 7. Rota de API - Favoritos (`src/app/api/cliente/favoritos/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Proxy para buscar favoritos do cliente no backend (paineladm)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojistaId = searchParams.get("lojistaId");
    const customerId = searchParams.get("customerId");
    const timestamp = searchParams.get("_t");

    console.log("[Cliente Favoritos Proxy] Recebida requisição:", { lojistaId, customerId, timestamp });

    if (!lojistaId || !customerId) {
      console.error("[Cliente Favoritos Proxy] Parâmetros faltando:", { lojistaId: !!lojistaId, customerId: !!customerId });
      return NextResponse.json(
        { error: "lojistaId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Favoritos Proxy] Enviando para backend:", backendUrl);

    const url = `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(customerId)}${timestamp ? `&_t=${timestamp}` : ''}`;
    console.log("[Cliente Favoritos Proxy] URL completa:", url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cliente Favoritos Proxy] Erro na resposta:", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[Cliente Favoritos Proxy] Favoritos recebidos:", data.favorites?.length || 0);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Favoritos Proxy] Erro:", error);
    console.error("[Cliente Favoritos Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar favoritos" },
      { status: 500 }
    );
  }
}
```

### 8. Rota de API - Upload de Foto (`src/app/api/upload-photo/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/upload-photo`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await paineladmResponse.json();

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/upload-photo] Erro no proxy:", error);
    return NextResponse.json(
      { error: "Erro interno no proxy de upload" },
      { status: 500 }
    );
  }
}
```

### 9. Rota de API - Geração de Looks (`src/app/api/generate-looks/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    console.log("[modelo-1/api/generate-looks] Iniciando requisição:", {
      backendUrl,
      hasPersonImageUrl: !!body.personImageUrl,
      productIdsCount: body.productIds?.length || 0,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
    });

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await paineladmResponse.json();

    if (!paineladmResponse.ok) {
      console.error("[modelo-1/api/generate-looks] Erro do backend:", {
        status: paineladmResponse.status,
        error: data.error,
        details: data.details,
      });
      
      return NextResponse.json(
        {
          error: data.error || "Erro ao gerar composição",
          details: data.details || `Status: ${paineladmResponse.status}`,
        },
        { status: paineladmResponse.status }
      );
    }

    console.log("[modelo-1/api/generate-looks] Sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
    });

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/generate-looks] Erro no proxy:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return NextResponse.json(
      {
        error: "Erro interno no proxy de geração",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

### 10. Rota de API - Ações (`src/app/api/actions/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Actions Proxy] Recebido:", { action: body.action, lojistaId: body.lojistaId, customerId: body.customerId });
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Actions Proxy] Backend URL:", backendUrl);

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    console.log("[Actions Proxy] Enviando para backend:", { action: payload.action, lojistaId: payload.lojistaId });

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Actions Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json().catch((err) => {
      console.error("[Actions Proxy] Erro ao parsear JSON:", err);
      return { 
        success: false, 
        error: "Erro ao comunicar com o servidor" 
      };
    });

    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}
```

### 11. Queries do Firebase (`src/lib/firebaseQueries.ts`)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "./firebase"
import type { LojistaData, Produto } from "./types"
import { PRODUTOS_TESTE } from "./produtosTeste"

const produtosCollectionPath = (lojistaId: string) => {
  const db = getFirestoreClient()
  if (!db) return null
  return collection(db, "lojas", lojistaId, "produtos")
}

export async function fetchLojistaData(
  lojistaId: string
): Promise<LojistaData | null> {
  console.log("[fetchLojistaData] Iniciando busca para lojistaId:", lojistaId)

  // TENTATIVA 1: Buscar via API do Painel (para evitar erro de permissão do Firestore Client)
  try {
    const painelUrl = process.env.NEXT_PUBLIC_PAINEL_URL || "http://localhost:3000";
    
    console.log(`[fetchLojistaData] Tentando buscar via API: ${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`);
    
    const response = await fetch(`${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[fetchLojistaData] Dados recebidos da API:", data);
      
      if (data && (data.nome || data.descricao)) {
        return {
          id: lojistaId,
          nome: data.nome || "Loja",
          logoUrl: data.logoUrl || null,
          descricao: data.descricao || null,
          redesSociais: {
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
          },
          salesConfig: data.salesConfig || {},
          descontoRedesSociais: data.descontoRedesSociais || null,
          descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
        };
      }
    } else {
      console.warn("[fetchLojistaData] API retornou erro:", response.status);
    }
  } catch (apiError) {
    console.error("[fetchLojistaData] Erro ao buscar da API:", apiError);
  }

  // TENTATIVA 2: Fallback para Firestore Client (código original)
  console.log("[fetchLojistaData] Fallback para Firestore Client...");
  
  if (!isFirebaseConfigured) {
    console.warn("[fetchLojistaData] Firebase não configurado!")
    return null
  }

  try {
    const db = getFirestoreClient()
    if (!db) {
      console.warn("[fetchLojistaData] Firestore não disponível")
      return null
    }

    const lojistaDoc = await getDoc(doc(db, "lojas", lojistaId))
    
    if (lojistaDoc.exists()) {
      const data = lojistaDoc.data()
      console.log("[fetchLojistaData] ✅ Dados encontrados no Firestore:", data.nome)
      return {
        id: lojistaId,
        nome: data.nome || "Loja",
        logoUrl: data.logoUrl || null,
        descricao: data.descricao || null,
        redesSociais: {
          instagram: data.instagram || data.redesSociais?.instagram || null,
          facebook: data.facebook || data.redesSociais?.facebook || null,
          tiktok: data.tiktok || data.redesSociais?.tiktok || null,
          whatsapp: data.whatsapp || data.redesSociais?.whatsapp || null,
        },
        salesConfig: data.salesConfig || {
          whatsappLink: data.salesWhatsapp || null,
          ecommerceUrl: data.checkoutLink || null,
        },
        descontoRedesSociais: data.descontoRedesSociais || null,
        descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
      }
    }
    
    console.warn("[fetchLojistaData] Loja não encontrada no Firestore")
    return null

  } catch (error: any) {
     console.error("[fetchLojistaData] Erro no fallback:", error);
    return null
  }
}

export async function fetchProdutos(
  lojistaId: string,
  opts?: { categoria?: string; limite?: number }
): Promise<Produto[]> {
  let produtos: Produto[] = []

  // Tentar buscar do Firestore se configurado
  if (isFirebaseConfigured) {
    try {
      const baseCollection = produtosCollectionPath(lojistaId)
      if (baseCollection) {
        const filtros = [] as any[]

        if (opts?.categoria) {
          filtros.push(where("categoria", "==", opts.categoria))
        }

        let produtosQuery = query(baseCollection, ...filtros)

        if (opts?.limite) {
          produtosQuery = query(produtosQuery, limit(opts.limite))
        }

        const snapshot = await getDocs(produtosQuery)

        produtos = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()

          return {
            id: docSnapshot.id,
            nome: typeof data.nome === "string" ? data.nome : "Produto",
            preco: typeof data.preco === "number" ? data.preco : null,
            imagemUrl: typeof data.imagemUrl === "string" ? data.imagemUrl : null,
            categoria: typeof data.categoria === "string" ? data.categoria : null,
            tamanhos: Array.isArray(data.tamanhos) ? (data.tamanhos as string[]) : [],
            cores: Array.isArray(data.cores) ? (data.cores as string[]) : [],
            medidas: typeof data.medidas === "string" ? data.medidas : undefined,
            estoque: typeof data.estoque === "number" ? data.estoque : null,
            obs: typeof data.obs === "string" ? data.obs : undefined,
          }
        })
      }
    } catch (error: any) {
      // Se for erro de permissão, logar mas não quebrar o fluxo
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        console.warn("[fetchProdutos] Erro de permissão do Firestore:", error.message)
      } else {
        console.error("[fetchProdutos] Erro ao buscar produtos:", error)
      }
    }
  }

  // Se não encontrou produtos no Firestore, usar produtos de teste
  if (produtos.length === 0) {
    console.log("[fetchProdutos] Nenhum produto encontrado no Firestore. Usando produtos de teste.")
    produtos = [...PRODUTOS_TESTE]
  }

  // Aplicar filtro de categoria se especificado e usando produtos de teste
  if (opts?.categoria && produtos.length > 0 && produtos[0].id?.startsWith("produto-teste")) {
    produtos = produtos.filter((p) => p.categoria === opts.categoria)
  }

  // Aplicar limite se especificado
  if (opts?.limite && produtos.length > opts.limite) {
    produtos = produtos.slice(0, opts.limite)
  }

  return produtos
}
```

### 12. Constantes (`src/lib/constants.ts`)

```typescript
// Imagem de fundo do closet de luxo para todas as telas
// Imagem matriz: closet-background.png

// Usar imagem matriz local (closet-background)
// Coloque a imagem em: public/images/closet-background.png (ou .jpg)
export const CLOSET_BACKGROUND_IMAGE = "/images/closet-background.png"

// OPÇÃO 2: Usar imagem do Unsplash (fallback)
// Se a imagem local não existir, descomente a linha abaixo e comente a linha acima:
// export const CLOSET_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=80"
```

### 13. Utilitários (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Regras de Negócio

### Fluxo de Autenticação

1. **Acesso Inicial**: O usuário acessa a URL `/{lojistaId}` que redireciona automaticamente para `/{lojistaId}/login` se não estiver autenticado.

2. **Login/Cadastro**: 
   - O usuário pode escolher entre **Login** ou **Cadastro**
   - **Cadastro**: Requer nome completo, WhatsApp (com DDD) e senha (mínimo 6 caracteres)
   - **Login**: Requer WhatsApp e senha
   - O WhatsApp é formatado automaticamente: `(DD) 99999-9999`
   - O nome é capitalizado automaticamente

3. **Verificação de Sessão**:
   - Antes de fazer login/cadastro, o sistema limpa qualquer sessão anterior do mesmo WhatsApp na mesma loja
   - Faz logout no backend para garantir limpeza
   - Verifica se há sessão ativa em outro dispositivo
   - Implementa lógica de **"último dispositivo a logar ganha"** - se um novo dispositivo fizer login, o anterior é desconectado automaticamente

4. **Armazenamento Local**:
   - Os dados do cliente são salvos no `localStorage` com a chave `cliente_{lojistaId}`
   - Contém: `nome`, `whatsapp`, `lojistaId`, `clienteId`, `loggedAt`, `deviceId`
   - O `deviceId` é gerado uma vez e persistido para identificar o dispositivo

5. **Redirecionamento Pós-Login**:
   - Após login/cadastro bem-sucedido, o usuário é redirecionado para `/{lojistaId}/experimentar`

### Fluxo Principal (Upload → Processamento → Salvamento)

1. **Upload de Foto**:
   - O usuário pode fazer upload de uma foto através de:
     - Input de arquivo (seleção de arquivo)
     - Câmera (usando `capture="user"` no input)
   - A foto é enviada para `/api/upload-photo` que faz proxy para o backend (`/api/lojista/composicoes/upload-photo`)
   - A foto é armazenada no Firebase Storage e a URL é retornada

2. **Seleção de Produtos**:
   - O usuário navega pelo catálogo de produtos organizado por categorias
   - Pode selecionar múltiplos produtos (máximo recomendado: 3-5 produtos)
   - Os produtos são filtrados por categoria
   - Cada produto exibe: imagem, nome, preço (se disponível), tamanhos e cores

3. **Geração de Looks**:
   - Ao clicar em "Visualizar", o sistema:
     - Valida que há uma foto e pelo menos um produto selecionado
     - Envia requisição para `/api/generate-looks` que faz proxy para o backend (`/api/lojista/composicoes/generate`)
     - O backend processa usando IA e retorna os looks gerados
     - Os looks são salvos no `sessionStorage` para persistência durante a navegação

4. **Visualização de Resultados**:
   - O usuário é redirecionado para `/{lojistaId}/resultado`
   - Os looks são carregados do `sessionStorage`
   - O usuário pode:
     - Navegar entre os looks gerados
     - Dar **Like** (salva nos favoritos)
     - Dar **Dislike** (não salva, apenas contabiliza)
     - **Compartilhar** nas redes sociais
     - **Comprar** (redireciona para WhatsApp ou e-commerce)
     - **Refinar** o look (gera uma nova versão)

5. **Sistema de Favoritos**:
   - Apenas looks com **Like** são salvos nos favoritos
   - Dislikes não salvam a imagem, apenas contabilizam o custo e a ação
   - Os favoritos são buscados do backend via `/api/cliente/favoritos`
   - São exibidos em um modal com as últimas 10 imagens favoritadas
   - Ordenados por data de criação (mais recente primeiro)
   - Sem duplicatas (verificação por `imagemUrl` e `compositionId`)

6. **Ações do Cliente**:
   - Todas as ações (like, dislike, share, checkout) são registradas via `/api/actions`
   - O proxy envia para o backend (`/api/actions` do paineladm)
   - As ações são contabilizadas nas estatísticas do cliente
   - Para dislikes, a `imagemUrl` não é enviada (não salva a imagem)

### Fluxo de Refinamento

1. **Iniciar Refinamento**:
   - O usuário clica em "Refinar" em um look gerado
   - O look atual é salvo no `sessionStorage` como base para refinamento
   - O usuário é redirecionado de volta para `/{lojistaId}/experimentar` em modo refinamento

2. **Modo Refinamento**:
   - A foto base do look é carregada automaticamente
   - O usuário pode ajustar produtos ou manter os mesmos
   - Ao gerar novamente, o sistema usa a imagem base do look anterior

3. **Resultado do Refinamento**:
   - Os novos looks são gerados e exibidos normalmente
   - O modo de refinamento é limpo após a geração

### Integração com Backend

O aplicativo funciona como um **frontend proxy** que se comunica com o backend principal (paineladm):

- **URL do Backend**: Configurada via `NEXT_PUBLIC_BACKEND_URL` ou `NEXT_PUBLIC_PAINELADM_URL` (fallback: `http://localhost:3000`)
- **Rotas de Proxy**: Todas as rotas em `/api/*` fazem proxy para o backend correspondente
- **Autenticação**: O backend gerencia autenticação, sessões e dados dos clientes
- **Geração de Looks**: O backend processa a geração usando serviços de IA externos
- **Armazenamento**: O backend gerencia Firebase Storage e Firestore

### Gerenciamento de Estado

- **LocalStorage**: Dados de autenticação do cliente (`cliente_{lojistaId}`)
- **SessionStorage**: Looks gerados (`generated_looks_{lojistaId}`), modo de refinamento (`refine_mode_{lojistaId}`)
- **Estado React**: Gerenciamento de UI, catálogo, favoritos, etc.

---

## Variáveis de Ambiente Necessárias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://localhost:3000
```

---

## Scripts Disponíveis

```json
{
  "dev": "next dev -p 3005",
  "build": "next build",
  "start": "next start -p 3005",
  "lint": "next lint"
}
```

---

## Observações Importantes

1. **Porta Padrão**: O aplicativo roda na porta **3005** por padrão
2. **Rotas Dinâmicas**: Todas as rotas sob `[lojistaId]` são renderizadas dinamicamente (`force-dynamic`)
3. **Proxy Pattern**: O app funciona como proxy para o backend, não possui lógica de negócio própria
4. **Fallback de Produtos**: Se não houver produtos no Firestore, usa produtos de teste (`produtosTeste.ts`)
5. **Sessão Única**: Implementa lógica de "último dispositivo a logar ganha" para evitar múltiplas sessões
6. **Favoritos**: Apenas likes são salvos, dislikes apenas contabilizam sem salvar imagem

---

**Documentação gerada em:** 2025-01-23  
**Versão do Projeto:** 0.1.0  
**Última Atualização:** 2025-01-23


## Visão Geral

O **Modelo 2** é uma aplicação web de provador virtual inteligente desenvolvida com **Next.js 14**, **React 18**, **Firebase** e **Tailwind CSS**. O aplicativo permite que clientes façam upload de suas fotos, selecionem produtos de uma loja e gerem visualizações de looks personalizados usando Inteligência Artificial.

### Funcionalidades Principais

- **Autenticação de Clientes**: Sistema de login/cadastro com WhatsApp e senha
- **Upload de Fotos**: Upload de fotos do usuário para geração de looks
- **Catálogo de Produtos**: Visualização e seleção de produtos por categoria
- **Geração de Looks**: Integração com backend para gerar composições usando IA
- **Sistema de Favoritos**: Salvamento e visualização de looks favoritados
- **Compartilhamento Social**: Integração com redes sociais e WhatsApp
- **Refinamento de Looks**: Possibilidade de refinar looks gerados

### Tecnologias Principais

- **Next.js 14.2.6**: Framework React com App Router
- **React 18.3.1**: Biblioteca de interface de usuário
- **Firebase 12.6.0**: Autenticação, Firestore e Storage
- **Tailwind CSS 3.4.13**: Framework de estilização
- **TypeScript 5.3.3**: Tipagem estática
- **Lucide React**: Biblioteca de ícones

---

## Estrutura de Arquivos

```
modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/          # Rotas dinâmicas por lojista
│   │   │   ├── layout.tsx        # Layout específico do lojista
│   │   │   ├── page.tsx          # Página inicial (redirecionamento)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Página de login/cadastro
│   │   │   ├── experimentar/
│   │   │   │   └── page.tsx      # Página principal de experimentação
│   │   │   └── resultado/
│   │   │       └── page.tsx      # Página de resultados dos looks gerados
│   │   ├── api/                  # Rotas de API (proxies para backend)
│   │   │   ├── actions/          # Registro de ações (like, dislike, share)
│   │   │   ├── cliente/          # Autenticação e favoritos do cliente
│   │   │   ├── generate-looks/   # Geração de looks
│   │   │   ├── upload-photo/     # Upload de fotos
│   │   │   └── lojista/          # Dados do lojista e produtos
│   │   ├── layout.tsx            # Layout raiz da aplicação
│   │   ├── page.tsx              # Página inicial
│   │   └── globals.css           # Estilos globais
│   ├── components/
│   │   ├── client-app/           # Componentes específicos do app cliente
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   ├── Step3Results.tsx
│   │   │   ├── FavoritosStep2.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── views/
│   │   │   └── ExperimentarView.tsx  # View principal de experimentação
│   │   ├── ui/                   # Componentes de UI reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Checkbox.tsx
│   │   ├── ClockAnimation.tsx
│   │   └── LoadingSpinner.tsx
│   └── lib/
│       ├── firebase.ts           # Configuração do Firebase
│       ├── firebaseQueries.ts    # Queries do Firestore
│       ├── types.ts              # Definições de tipos TypeScript
│       ├── constants.ts          # Constantes da aplicação
│       ├── utils.ts              # Funções utilitárias
│       └── produtosTeste.ts      # Produtos de teste (fallback)
├── public/                       # Arquivos estáticos
│   ├── video2.mp4               # Vídeo de fundo
│   └── images/                   # Imagens estáticas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Dependências

### Dependencies

```json
{
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-slot": "^1.0.3",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "firebase": "^12.6.0",
  "lucide-react": "^0.553.0",
  "next": "14.2.6",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-icons": "^5.5.0",
  "tailwind-merge": "^2.5.2"
}
```

### DevDependencies

```json
{
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
```

---

## Arquivos Críticos

### 1. Configuração do Firebase (`src/lib/firebase.ts`)

```typescript
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const REQUIRED_KEYS = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = REQUIRED_KEYS.every(
  (value) => typeof value === "string" && value.length > 0
)

let firebaseApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: FirebaseStorage | null = null

function initializeFirebase() {
  if (!isFirebaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Firebase não configurado: usando dados mock/fallback.")
    }
    return null
  }

  if (!firebaseApp) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  }

  return firebaseApp
}

export function getFirebaseApp() {
  return initializeFirebase()
}

export function getFirebaseAuth() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedAuth) {
    cachedAuth = getAuth(app)
  }
  return cachedAuth
}

export function getFirestoreClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedDb) {
    cachedDb = getFirestore(app)
  }
  return cachedDb
}

export function getStorageClient() {
  const app = initializeFirebase()
  if (!app) return null
  if (!cachedStorage) {
    cachedStorage = getStorage(app)
  }
  return cachedStorage
}
```

### 2. Definições de Tipos (`src/lib/types.ts`)

```typescript
export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesConfig = {
  whatsappLink?: string
  ecommerceUrl?: string
  [key: string]: string | undefined
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
}

export type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean
}

export type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  produtos?: Produto[]
}
```

### 3. Layout Principal (`src/app/layout.tsx`)

```typescript
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#000000" />
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
      <body translate="no">{children}</body>
    </html>
  );
}
```

### 4. Layout do Lojista (`src/app/[lojistaId]/layout.tsx`)

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

### 5. Página Principal (`src/app/[lojistaId]/page.tsx`)

```typescript
"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica para evitar erro 404 em rotas dinâmicas
export const dynamic = 'force-dynamic'

export default function ClienteAppPage() {
  const params = useParams()
  const router = useRouter()
  const [lojistaId, setLojistaId] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    // Garantir que params está disponível
    const id = (params?.lojistaId as string) || ""
    setLojistaId(id)
    
    if (!id) {
      // Se não houver lojistaId, redirecionar para página raiz
      router.push("/")
      return
    }
    
    if (isRedirecting) return
    
    setIsRedirecting(true)
    
    // Verificar login e redirecionar imediatamente
    const checkLogin = () => {
      try {
        const stored = localStorage.getItem(`cliente_${id}`)
        if (!stored) {
          router.replace(`/${id}/login`)
          return
        }
        // Se estiver logado, redirecionar para experimentar
        router.replace(`/${id}/experimentar`)
      } catch (error) {
        console.error("[ClienteAppPage] Erro ao verificar login:", error)
        router.replace(`/${id}/login`)
      }
    }
    
    // Redirecionar imediatamente sem delay
    checkLogin()
  }, [params, router, isRedirecting])
  
  // Redirecionar sem mostrar tela de loading
  return null
}
```

### 6. Rota de API - Login (`src/app/api/cliente/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/login
 * Autentica cliente com WhatsApp e senha
 * Body: { lojistaId: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, whatsapp, password } = body;

    if (!lojistaId || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Autenticar no backend
    const res = await fetch(`${backendUrl}/api/cliente/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lojistaId,
        whatsapp: cleanWhatsapp,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Login] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
```

### 7. Rota de API - Favoritos (`src/app/api/cliente/favoritos/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Proxy para buscar favoritos do cliente no backend (paineladm)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojistaId = searchParams.get("lojistaId");
    const customerId = searchParams.get("customerId");
    const timestamp = searchParams.get("_t");

    console.log("[Cliente Favoritos Proxy] Recebida requisição:", { lojistaId, customerId, timestamp });

    if (!lojistaId || !customerId) {
      console.error("[Cliente Favoritos Proxy] Parâmetros faltando:", { lojistaId: !!lojistaId, customerId: !!customerId });
      return NextResponse.json(
        { error: "lojistaId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Favoritos Proxy] Enviando para backend:", backendUrl);

    const url = `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(customerId)}${timestamp ? `&_t=${timestamp}` : ''}`;
    console.log("[Cliente Favoritos Proxy] URL completa:", url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cliente Favoritos Proxy] Erro na resposta:", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[Cliente Favoritos Proxy] Favoritos recebidos:", data.favorites?.length || 0);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Favoritos Proxy] Erro:", error);
    console.error("[Cliente Favoritos Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar favoritos" },
      { status: 500 }
    );
  }
}
```

### 8. Rota de API - Upload de Foto (`src/app/api/upload-photo/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/upload-photo`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await paineladmResponse.json();

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/upload-photo] Erro no proxy:", error);
    return NextResponse.json(
      { error: "Erro interno no proxy de upload" },
      { status: 500 }
    );
  }
}
```

### 9. Rota de API - Geração de Looks (`src/app/api/generate-looks/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    console.log("[modelo-1/api/generate-looks] Iniciando requisição:", {
      backendUrl,
      hasPersonImageUrl: !!body.personImageUrl,
      productIdsCount: body.productIds?.length || 0,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
    });

    const paineladmResponse = await fetch(
      `${backendUrl}/api/lojista/composicoes/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await paineladmResponse.json();

    if (!paineladmResponse.ok) {
      console.error("[modelo-1/api/generate-looks] Erro do backend:", {
        status: paineladmResponse.status,
        error: data.error,
        details: data.details,
      });
      
      return NextResponse.json(
        {
          error: data.error || "Erro ao gerar composição",
          details: data.details || `Status: ${paineladmResponse.status}`,
        },
        { status: paineladmResponse.status }
      );
    }

    console.log("[modelo-1/api/generate-looks] Sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
    });

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error) {
    console.error("[modelo-1/api/generate-looks] Erro no proxy:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return NextResponse.json(
      {
        error: "Erro interno no proxy de geração",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

### 10. Rota de API - Ações (`src/app/api/actions/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Actions Proxy] Recebido:", { action: body.action, lojistaId: body.lojistaId, customerId: body.customerId });
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Actions Proxy] Backend URL:", backendUrl);

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    console.log("[Actions Proxy] Enviando para backend:", { action: payload.action, lojistaId: payload.lojistaId });

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Actions Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json().catch((err) => {
      console.error("[Actions Proxy] Erro ao parsear JSON:", err);
      return { 
        success: false, 
        error: "Erro ao comunicar com o servidor" 
      };
    });

    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}
```

### 11. Queries do Firebase (`src/lib/firebaseQueries.ts`)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "./firebase"
import type { LojistaData, Produto } from "./types"
import { PRODUTOS_TESTE } from "./produtosTeste"

const produtosCollectionPath = (lojistaId: string) => {
  const db = getFirestoreClient()
  if (!db) return null
  return collection(db, "lojas", lojistaId, "produtos")
}

export async function fetchLojistaData(
  lojistaId: string
): Promise<LojistaData | null> {
  console.log("[fetchLojistaData] Iniciando busca para lojistaId:", lojistaId)

  // TENTATIVA 1: Buscar via API do Painel (para evitar erro de permissão do Firestore Client)
  try {
    const painelUrl = process.env.NEXT_PUBLIC_PAINEL_URL || "http://localhost:3000";
    
    console.log(`[fetchLojistaData] Tentando buscar via API: ${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`);
    
    const response = await fetch(`${painelUrl}/api/lojista/perfil?lojistaId=${lojistaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[fetchLojistaData] Dados recebidos da API:", data);
      
      if (data && (data.nome || data.descricao)) {
        return {
          id: lojistaId,
          nome: data.nome || "Loja",
          logoUrl: data.logoUrl || null,
          descricao: data.descricao || null,
          redesSociais: {
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
          },
          salesConfig: data.salesConfig || {},
          descontoRedesSociais: data.descontoRedesSociais || null,
          descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
        };
      }
    } else {
      console.warn("[fetchLojistaData] API retornou erro:", response.status);
    }
  } catch (apiError) {
    console.error("[fetchLojistaData] Erro ao buscar da API:", apiError);
  }

  // TENTATIVA 2: Fallback para Firestore Client (código original)
  console.log("[fetchLojistaData] Fallback para Firestore Client...");
  
  if (!isFirebaseConfigured) {
    console.warn("[fetchLojistaData] Firebase não configurado!")
    return null
  }

  try {
    const db = getFirestoreClient()
    if (!db) {
      console.warn("[fetchLojistaData] Firestore não disponível")
      return null
    }

    const lojistaDoc = await getDoc(doc(db, "lojas", lojistaId))
    
    if (lojistaDoc.exists()) {
      const data = lojistaDoc.data()
      console.log("[fetchLojistaData] ✅ Dados encontrados no Firestore:", data.nome)
      return {
        id: lojistaId,
        nome: data.nome || "Loja",
        logoUrl: data.logoUrl || null,
        descricao: data.descricao || null,
        redesSociais: {
          instagram: data.instagram || data.redesSociais?.instagram || null,
          facebook: data.facebook || data.redesSociais?.facebook || null,
          tiktok: data.tiktok || data.redesSociais?.tiktok || null,
          whatsapp: data.whatsapp || data.redesSociais?.whatsapp || null,
        },
        salesConfig: data.salesConfig || {
          whatsappLink: data.salesWhatsapp || null,
          ecommerceUrl: data.checkoutLink || null,
        },
        descontoRedesSociais: data.descontoRedesSociais || null,
        descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
      }
    }
    
    console.warn("[fetchLojistaData] Loja não encontrada no Firestore")
    return null

  } catch (error: any) {
     console.error("[fetchLojistaData] Erro no fallback:", error);
    return null
  }
}

export async function fetchProdutos(
  lojistaId: string,
  opts?: { categoria?: string; limite?: number }
): Promise<Produto[]> {
  let produtos: Produto[] = []

  // Tentar buscar do Firestore se configurado
  if (isFirebaseConfigured) {
    try {
      const baseCollection = produtosCollectionPath(lojistaId)
      if (baseCollection) {
        const filtros = [] as any[]

        if (opts?.categoria) {
          filtros.push(where("categoria", "==", opts.categoria))
        }

        let produtosQuery = query(baseCollection, ...filtros)

        if (opts?.limite) {
          produtosQuery = query(produtosQuery, limit(opts.limite))
        }

        const snapshot = await getDocs(produtosQuery)

        produtos = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()

          return {
            id: docSnapshot.id,
            nome: typeof data.nome === "string" ? data.nome : "Produto",
            preco: typeof data.preco === "number" ? data.preco : null,
            imagemUrl: typeof data.imagemUrl === "string" ? data.imagemUrl : null,
            categoria: typeof data.categoria === "string" ? data.categoria : null,
            tamanhos: Array.isArray(data.tamanhos) ? (data.tamanhos as string[]) : [],
            cores: Array.isArray(data.cores) ? (data.cores as string[]) : [],
            medidas: typeof data.medidas === "string" ? data.medidas : undefined,
            estoque: typeof data.estoque === "number" ? data.estoque : null,
            obs: typeof data.obs === "string" ? data.obs : undefined,
          }
        })
      }
    } catch (error: any) {
      // Se for erro de permissão, logar mas não quebrar o fluxo
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        console.warn("[fetchProdutos] Erro de permissão do Firestore:", error.message)
      } else {
        console.error("[fetchProdutos] Erro ao buscar produtos:", error)
      }
    }
  }

  // Se não encontrou produtos no Firestore, usar produtos de teste
  if (produtos.length === 0) {
    console.log("[fetchProdutos] Nenhum produto encontrado no Firestore. Usando produtos de teste.")
    produtos = [...PRODUTOS_TESTE]
  }

  // Aplicar filtro de categoria se especificado e usando produtos de teste
  if (opts?.categoria && produtos.length > 0 && produtos[0].id?.startsWith("produto-teste")) {
    produtos = produtos.filter((p) => p.categoria === opts.categoria)
  }

  // Aplicar limite se especificado
  if (opts?.limite && produtos.length > opts.limite) {
    produtos = produtos.slice(0, opts.limite)
  }

  return produtos
}
```

### 12. Constantes (`src/lib/constants.ts`)

```typescript
// Imagem de fundo do closet de luxo para todas as telas
// Imagem matriz: closet-background.png

// Usar imagem matriz local (closet-background)
// Coloque a imagem em: public/images/closet-background.png (ou .jpg)
export const CLOSET_BACKGROUND_IMAGE = "/images/closet-background.png"

// OPÇÃO 2: Usar imagem do Unsplash (fallback)
// Se a imagem local não existir, descomente a linha abaixo e comente a linha acima:
// export const CLOSET_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=80"
```

### 13. Utilitários (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Regras de Negócio

### Fluxo de Autenticação

1. **Acesso Inicial**: O usuário acessa a URL `/{lojistaId}` que redireciona automaticamente para `/{lojistaId}/login` se não estiver autenticado.

2. **Login/Cadastro**: 
   - O usuário pode escolher entre **Login** ou **Cadastro**
   - **Cadastro**: Requer nome completo, WhatsApp (com DDD) e senha (mínimo 6 caracteres)
   - **Login**: Requer WhatsApp e senha
   - O WhatsApp é formatado automaticamente: `(DD) 99999-9999`
   - O nome é capitalizado automaticamente

3. **Verificação de Sessão**:
   - Antes de fazer login/cadastro, o sistema limpa qualquer sessão anterior do mesmo WhatsApp na mesma loja
   - Faz logout no backend para garantir limpeza
   - Verifica se há sessão ativa em outro dispositivo
   - Implementa lógica de **"último dispositivo a logar ganha"** - se um novo dispositivo fizer login, o anterior é desconectado automaticamente

4. **Armazenamento Local**:
   - Os dados do cliente são salvos no `localStorage` com a chave `cliente_{lojistaId}`
   - Contém: `nome`, `whatsapp`, `lojistaId`, `clienteId`, `loggedAt`, `deviceId`
   - O `deviceId` é gerado uma vez e persistido para identificar o dispositivo

5. **Redirecionamento Pós-Login**:
   - Após login/cadastro bem-sucedido, o usuário é redirecionado para `/{lojistaId}/experimentar`

### Fluxo Principal (Upload → Processamento → Salvamento)

1. **Upload de Foto**:
   - O usuário pode fazer upload de uma foto através de:
     - Input de arquivo (seleção de arquivo)
     - Câmera (usando `capture="user"` no input)
   - A foto é enviada para `/api/upload-photo` que faz proxy para o backend (`/api/lojista/composicoes/upload-photo`)
   - A foto é armazenada no Firebase Storage e a URL é retornada

2. **Seleção de Produtos**:
   - O usuário navega pelo catálogo de produtos organizado por categorias
   - Pode selecionar múltiplos produtos (máximo recomendado: 3-5 produtos)
   - Os produtos são filtrados por categoria
   - Cada produto exibe: imagem, nome, preço (se disponível), tamanhos e cores

3. **Geração de Looks**:
   - Ao clicar em "Visualizar", o sistema:
     - Valida que há uma foto e pelo menos um produto selecionado
     - Envia requisição para `/api/generate-looks` que faz proxy para o backend (`/api/lojista/composicoes/generate`)
     - O backend processa usando IA e retorna os looks gerados
     - Os looks são salvos no `sessionStorage` para persistência durante a navegação

4. **Visualização de Resultados**:
   - O usuário é redirecionado para `/{lojistaId}/resultado`
   - Os looks são carregados do `sessionStorage`
   - O usuário pode:
     - Navegar entre os looks gerados
     - Dar **Like** (salva nos favoritos)
     - Dar **Dislike** (não salva, apenas contabiliza)
     - **Compartilhar** nas redes sociais
     - **Comprar** (redireciona para WhatsApp ou e-commerce)
     - **Refinar** o look (gera uma nova versão)

5. **Sistema de Favoritos**:
   - Apenas looks com **Like** são salvos nos favoritos
   - Dislikes não salvam a imagem, apenas contabilizam o custo e a ação
   - Os favoritos são buscados do backend via `/api/cliente/favoritos`
   - São exibidos em um modal com as últimas 10 imagens favoritadas
   - Ordenados por data de criação (mais recente primeiro)
   - Sem duplicatas (verificação por `imagemUrl` e `compositionId`)

6. **Ações do Cliente**:
   - Todas as ações (like, dislike, share, checkout) são registradas via `/api/actions`
   - O proxy envia para o backend (`/api/actions` do paineladm)
   - As ações são contabilizadas nas estatísticas do cliente
   - Para dislikes, a `imagemUrl` não é enviada (não salva a imagem)

### Fluxo de Refinamento

1. **Iniciar Refinamento**:
   - O usuário clica em "Refinar" em um look gerado
   - O look atual é salvo no `sessionStorage` como base para refinamento
   - O usuário é redirecionado de volta para `/{lojistaId}/experimentar` em modo refinamento

2. **Modo Refinamento**:
   - A foto base do look é carregada automaticamente
   - O usuário pode ajustar produtos ou manter os mesmos
   - Ao gerar novamente, o sistema usa a imagem base do look anterior

3. **Resultado do Refinamento**:
   - Os novos looks são gerados e exibidos normalmente
   - O modo de refinamento é limpo após a geração

### Integração com Backend

O aplicativo funciona como um **frontend proxy** que se comunica com o backend principal (paineladm):

- **URL do Backend**: Configurada via `NEXT_PUBLIC_BACKEND_URL` ou `NEXT_PUBLIC_PAINELADM_URL` (fallback: `http://localhost:3000`)
- **Rotas de Proxy**: Todas as rotas em `/api/*` fazem proxy para o backend correspondente
- **Autenticação**: O backend gerencia autenticação, sessões e dados dos clientes
- **Geração de Looks**: O backend processa a geração usando serviços de IA externos
- **Armazenamento**: O backend gerencia Firebase Storage e Firestore

### Gerenciamento de Estado

- **LocalStorage**: Dados de autenticação do cliente (`cliente_{lojistaId}`)
- **SessionStorage**: Looks gerados (`generated_looks_{lojistaId}`), modo de refinamento (`refine_mode_{lojistaId}`)
- **Estado React**: Gerenciamento de UI, catálogo, favoritos, etc.

---

## Variáveis de Ambiente Necessárias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000
NEXT_PUBLIC_PAINEL_URL=http://localhost:3000
```

---

## Scripts Disponíveis

```json
{
  "dev": "next dev -p 3005",
  "build": "next build",
  "start": "next start -p 3005",
  "lint": "next lint"
}
```

---

## Observações Importantes

1. **Porta Padrão**: O aplicativo roda na porta **3005** por padrão
2. **Rotas Dinâmicas**: Todas as rotas sob `[lojistaId]` são renderizadas dinamicamente (`force-dynamic`)
3. **Proxy Pattern**: O app funciona como proxy para o backend, não possui lógica de negócio própria
4. **Fallback de Produtos**: Se não houver produtos no Firestore, usa produtos de teste (`produtosTeste.ts`)
5. **Sessão Única**: Implementa lógica de "último dispositivo a logar ganha" para evitar múltiplas sessões
6. **Favoritos**: Apenas likes são salvos, dislikes apenas contabilizam sem salvar imagem

---

**Documentação gerada em:** 2025-01-23  
**Versão do Projeto:** 0.1.0  
**Última Atualização:** 2025-01-23








