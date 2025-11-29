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
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
      console.log("[Layout] Perfil encontrado em perfil/dados:", lojaData?.nome || "sem nome");
    } else {
      // PRIORIDADE 2: Tentar buscar dados diretamente do documento da loja
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
        console.log("[Layout] Perfil encontrado no documento da loja:", lojaData?.nome || "sem nome");
      }
    }
    
    if (lojaData) {
      const nome = lojaData?.nome || "Loja";
      const descricao = lojaData?.descricao || "Experimente as roupas sem sair de casa";
      const logoUrl = lojaData?.logoUrl || null;
      
      console.log("[Layout] Dados da loja:", { lojistaId, nome, logoUrl: logoUrl ? "presente" : "ausente" });
      
      // URL base do site
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_VERCEL_URL ? 
                     `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                     'https://experimente.ai';
      
      // Imagem Open Graph - SEMPRE usar a rota de geração dinâmica
      // Isso garante que a imagem tenha o tamanho correto (1200x630px) e inclua a logo
      const ogImage = `${baseUrl}/api/og-image/${lojistaId}`;
      console.log("[Layout] Usando imagem Open Graph gerada dinamicamente:", ogImage);
      
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
    } else {
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        const lojaData = lojaDoc.data();
        faviconUrl = lojaData?.logoUrl || lojaData?.app_icon_url || null;
      }
    }
  } catch (error) {
    console.error("[Layout] Erro ao buscar favicon:", error);
  }
  
  return (
    <>
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

