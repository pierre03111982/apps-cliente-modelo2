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
      
      // Favicon URL (priorizar app_icon_url, depois logoUrl) - PHASE 25: Para aparecer na barra de navegação
      const faviconForMetadata = lojaData?.app_icon_url || lojaData?.logoUrl || null;
      let faviconUrlAbsolute: string | undefined = undefined;
      if (faviconForMetadata) {
        if (faviconForMetadata.startsWith('http://') || faviconForMetadata.startsWith('https://')) {
          faviconUrlAbsolute = faviconForMetadata;
        } else {
          faviconUrlAbsolute = faviconForMetadata.startsWith('/') ? `${baseUrl}${faviconForMetadata}` : `${baseUrl}/${faviconForMetadata}`;
        }
        console.log("[Layout] PHASE 25: Favicon URL para metadata:", faviconUrlAbsolute);
      }
      
      // Imagem Open Graph
      // PHASE 25 FIX CRÍTICO: Sempre usar rota dinâmica que baixa e processa a logo corretamente
      // O Facebook/WhatsApp não consegue acessar imagens do Firebase Storage diretamente
      // A rota /api/og-image baixa a logo no servidor e a incorpora na imagem gerada
      const ogImage = `${baseUrl}/api/og-image/${lojistaId}`;
      console.log("[Layout] PHASE 25: Sempre usando rota dinâmica OG Image:", ogImage);
      
      const themeColor = lojaData?.themeColor || '#000000';
      
      return {
        title: `${nome} | Provador Virtual com IA`,
        description: `Experimente as roupas da ${nome} sem sair de casa. ${descricao}. Tecnologia de Provador Virtual Inteligente.`,
        // PHASE 25: Adicionar favicon no metadata para garantir que apareça na barra de navegação
        icons: faviconUrlAbsolute ? {
          icon: faviconUrlAbsolute,
          apple: faviconUrlAbsolute,
          shortcut: faviconUrlAbsolute,
        } : undefined,
        other: {
          'theme-color': themeColor,
          'msapplication-navbutton-color': themeColor,
          // Open Graph tags explícitas para garantir que o Facebook detecte
          'og:image': ogImage,
          'og:image:width': '1200',
          'og:image:height': '630',
          'og:image:alt': `${nome} - Provador Virtual`,
          'og:url': `${baseUrl}/${lojistaId}/login`,
          // PHASE 25: Adicionar fb:app_id (opcional mas recomendado para evitar warnings)
          'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
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
      // PHASE 25: Adicionar fb:app_id no fallback também
      'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
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
      // PHASE 25: Priorizar app_icon_url (mais adequado para favicon), depois logoUrl
      faviconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || null;
      console.log("[Layout] Favicon encontrado em perfil/dados:", faviconUrl ? "sim" : "não");
    } else {
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        const lojaData = lojaDoc.data();
        faviconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || null;
        console.log("[Layout] Favicon encontrado no documento da loja:", faviconUrl ? "sim" : "não");
      } else {
        console.log("[Layout] Loja não encontrada para favicon");
      }
    }
  } catch (error) {
    console.error("[Layout] Erro ao buscar favicon:", error);
  }
  
  // URL base para garantir URLs absolutas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXT_PUBLIC_VERCEL_URL ? 
                 `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                 'https://experimente.ai';
  
  // Garantir URL absoluta para o favicon
  let faviconUrlAbsolute: string | null = null;
  if (faviconUrl) {
    if (faviconUrl.startsWith('http://') || faviconUrl.startsWith('https://')) {
      faviconUrlAbsolute = faviconUrl;
    } else {
      faviconUrlAbsolute = faviconUrl.startsWith('/') ? `${baseUrl}${faviconUrl}` : `${baseUrl}/${faviconUrl}`;
    }
    console.log("[Layout] Favicon URL final:", faviconUrlAbsolute);
  }
  
  return (
    <>
      {/* PHASE 25-C: Link do manifest via API Route com cache busting (?v=3) */}
      <link rel="manifest" href={`/api/manifest/${lojistaId}?v=3`} />
      {/* Favicon dinâmico usando logo da loja - PHASE 25: Melhorado para garantir que apareça na barra de navegação */}
      {faviconUrlAbsolute ? (
        <>
          {/* Favicon padrão (mais compatível) */}
          <link rel="icon" type="image/png" href={faviconUrlAbsolute} />
          <link rel="icon" type="image/png" sizes="32x32" href={faviconUrlAbsolute} />
          <link rel="icon" type="image/png" sizes="16x16" href={faviconUrlAbsolute} />
          {/* Apple Touch Icon (iOS) */}
          <link rel="apple-touch-icon" sizes="180x180" href={faviconUrlAbsolute} />
          {/* Shortcut icon (IE/Edge) */}
          <link rel="shortcut icon" href={faviconUrlAbsolute} />
          {/* Favicon ICO (fallback para navegadores antigos) */}
          <link rel="icon" type="image/x-icon" href={faviconUrlAbsolute} />
        </>
      ) : (
        /* Fallback: Favicon padrão se não houver logo */
        <>
          <link rel="icon" type="image/png" href="/favicon.ico" />
        </>
      )}
      {children}
    </>
  );
}

