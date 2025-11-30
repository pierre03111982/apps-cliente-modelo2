// Layout para rotas dinâmicas [lojistaId]
// Garante que todas as rotas dentro de [lojistaId] sejam renderizadas dinamicamente
import { Metadata } from 'next';
import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic'
export const dynamicParams = true

/**
 * PHASE 12: Generate Metadata dinâmico para SEO e Open Graph
 * Cria previews bonitos para WhatsApp/Social Media
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lojistaId: string }>
}): Promise<Metadata> {
  const { lojistaId } = await params;
  
  try {
    // Buscar dados da loja do Firestore
    // PRIORIDADE 1: Buscar em perfil/dados (onde salvamos os dados)
    const db = getFirestoreAdmin();
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    let lojaData: any = null;
    let dataSource = "nenhum";
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
      dataSource = "perfil/dados";
      console.log("[Layout] PHASE 25: Perfil encontrado em perfil/dados:", lojaData?.nome || "sem nome");
    } else {
      // PRIORIDADE 2: Tentar buscar dados diretamente do documento da loja
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
        dataSource = "lojas/{id}";
        console.log("[Layout] PHASE 25: Perfil encontrado no documento da loja:", lojaData?.nome || "sem nome");
      }
    }
    
    if (lojaData) {
      const nome = lojaData?.nome || "Loja";
      const descricao = lojaData?.descricao || "Experimente as roupas sem sair de casa";
      const logoUrl = lojaData?.logoUrl || null;
      
      console.log("[Layout] PHASE 25: Dados da loja para metadata (Open Graph):", { 
        lojistaId, 
        nome, 
        logoUrl: logoUrl ? (logoUrl.length > 50 ? logoUrl.substring(0, 50) + "..." : logoUrl) : "ausente",
        app_icon_url: lojaData?.app_icon_url ? (lojaData.app_icon_url.length > 50 ? lojaData.app_icon_url.substring(0, 50) + "..." : lojaData.app_icon_url) : "ausente",
        hasLogoUrl: !!logoUrl,
        hasAppIconUrl: !!lojaData?.app_icon_url,
        source: dataSource
      });
      
      // URL base do site
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_VERCEL_URL ? 
                     `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                     'https://experimente.ai';
      
      // Imagem Open Graph
      // Se temos logo, usar diretamente (mais rápido e confiável)
      // Se não temos logo, usar rota dinâmica que gera imagem com nome da loja
      let ogImage: string;
      if (logoUrl) {
        // Usar logo diretamente - Facebook aceita qualquer tamanho, mas ideal é 1200x630px
        if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
          ogImage = logoUrl;
        } else {
          ogImage = logoUrl.startsWith('/') ? `${baseUrl}${logoUrl}` : `${baseUrl}/${logoUrl}`;
        }
        console.log("[Layout] PHASE 25: Usando logoUrl diretamente como og:image:", ogImage);
      } else {
        // Fallback: gerar imagem Open Graph dinamicamente
        ogImage = `${baseUrl}/api/og-image/${lojistaId}`;
        console.log("[Layout] PHASE 25: Logo não encontrada, usando imagem gerada dinamicamente:", ogImage);
      }
      
      const themeColor = lojaData?.themeColor || '#000000';
      
      return {
        title: `${nome} | Provador Virtual com IA`,
        description: `Experimente as roupas da ${nome} sem sair de casa. ${descricao}. Tecnologia de Provador Virtual Inteligente.`,
        other: {
          'theme-color': themeColor,
          'msapplication-navbutton-color': themeColor,
          // Open Graph tags explícitas para garantir que o Facebook detecte
          'og:image': ogImage,
          'og:image:width': '1200',
          'og:image:height': '630',
          'og:image:alt': `${nome} - Provador Virtual`,
          'og:url': `${baseUrl}/${lojistaId}/login`,
        },
        openGraph: {
          title: `${nome} | Provador Virtual com IA`,
          description: `Experimente as roupas da ${nome} sem sair de casa. Tecnologia de Provador Virtual Inteligente.`,
          url: `${baseUrl}/${lojistaId}/login`,
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `${nome} - Provador Virtual`,
            },
          ],
          type: 'website',
          siteName: nome,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${nome} | Provador Virtual com IA`,
          description: `Experimente as roupas da ${nome} sem sair de casa. Tecnologia de Provador Virtual Inteligente.`,
          images: [ogImage],
        },
      };
    }
  } catch (error) {
    console.error("[Layout] Erro ao buscar dados da loja para metadata:", error);
  }
  
  // Fallback metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXT_PUBLIC_VERCEL_URL ? 
                 `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                 'https://experimente.ai';
  const fallbackOgImage = `${baseUrl}/api/og-image/${lojistaId}`;
  
  return {
    title: "Provador Virtual com IA | Experimente.ai",
    description: "Experimente roupas sem sair de casa. Tecnologia de Provador Virtual Inteligente.",
    other: {
      'theme-color': '#000000',
      'msapplication-navbutton-color': '#000000',
      // Open Graph tags explícitas no fallback também
      'og:image': fallbackOgImage,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:url': `${baseUrl}/${lojistaId}/login`,
    },
    openGraph: {
      title: "Provador Virtual com IA | Experimente.ai",
      description: "Experimente roupas sem sair de casa. Tecnologia de Provador Virtual Inteligente.",
      url: `${baseUrl}/${lojistaId}/login`,
      images: [
        {
          url: fallbackOgImage,
          width: 1200,
          height: 630,
          alt: "Provador Virtual com IA",
        },
      ],
      type: 'website',
    },
  };
}

export default async function LojistaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lojistaId: string }>;
}) {
  const { lojistaId } = await params;
  
  // Buscar logo para favicon
  let faviconUrl: string | null = null;
  try {
    const db = getFirestoreAdmin();
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    if (perfilDadosDoc.exists) {
      const lojaData = perfilDadosDoc.data();
      faviconUrl = lojaData?.logoUrl || lojaData?.app_icon_url || null;
      console.log("[Layout] Favicon encontrado em perfil/dados:", faviconUrl ? "sim" : "não");
    } else {
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        const lojaData = lojaDoc.data();
        faviconUrl = lojaData?.logoUrl || lojaData?.app_icon_url || null;
        console.log("[Layout] Favicon encontrado no documento da loja:", faviconUrl ? "sim" : "não");
      } else {
        console.log("[Layout] Loja não encontrada para favicon");
      }
    }
  } catch (error) {
    console.error("[Layout] Erro ao buscar favicon:", error);
  }
  
  return (
    <>
      {/* PHASE 25: Link do manifest - Next.js pode não detectar automaticamente em rotas dinâmicas
          Adicionar manualmente para garantir que o manifest seja carregado */}
      <link rel="manifest" href={`/${lojistaId}/manifest.json`} />
      {/* Favicon dinâmico usando logo da loja */}
      {faviconUrl ? (
        <>
          <link rel="icon" type="image/png" sizes="32x32" href={faviconUrl} />
          <link rel="icon" type="image/png" sizes="16x16" href={faviconUrl} />
          <link rel="apple-touch-icon" sizes="180x180" href={faviconUrl} />
          <link rel="shortcut icon" href={faviconUrl} />
        </>
      ) : null}
      {children}
    </>
  );
}

