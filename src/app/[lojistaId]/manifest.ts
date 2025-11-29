/**
 * PHASE 17: Dynamic PWA Manifest
 * Gera manifest.json dinâmico baseado no lojistaId
 * Permite que cada lojista tenha seu próprio ícone e nome no PWA
 */

import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface Manifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lojistaId: string }> }
) {
  const { lojistaId } = await params;
  
  try {
    // Buscar dados da loja do Firestore
    const db = getFirestoreAdmin();
    const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
    
    if (!lojaDoc.exists) {
      // Retornar manifest padrão se loja não existir
      return Response.json(getDefaultManifest(lojistaId), {
        headers: {
          'Content-Type': 'application/manifest+json',
        },
      });
    }
    
    const lojaData = lojaDoc.data();
    const nome = lojaData?.nome || "Loja";
    const descricao = lojaData?.descricao || "Experimente as roupas sem sair de casa";
    const appIconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || '/icons/default-icon.png';
    const themeColor = lojaData?.themeColor || '#000000';
    // PHASE 17: Background color preto para barra de navegação inferior
    const backgroundColor = lojaData?.backgroundColor || '#000000';
    
    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    // Construir manifest
    const manifest: Manifest = {
      name: nome,
      short_name: nome.length > 12 ? nome.slice(0, 12) : nome,
      description: descricao || `Aplicativo da ${nome} - Provador Virtual com IA`,
      start_url: `/${lojistaId}/experimentar`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: [
        {
          src: appIconUrl.startsWith('http') ? appIconUrl : `${baseUrl}${appIconUrl}`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: appIconUrl.startsWith('http') ? appIconUrl : `${baseUrl}${appIconUrl}`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };
    
    console.log("[Manifest] Manifest gerado para lojista:", {
      lojistaId,
      nome,
      appIconUrl,
      themeColor,
    });
    
    return Response.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error("[Manifest] Erro ao gerar manifest:", error);
    // Retornar manifest padrão em caso de erro
    return Response.json(getDefaultManifest(lojistaId), {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  }
}

function getDefaultManifest(lojistaId: string): Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.NEXT_PUBLIC_VERCEL_URL ? 
                 `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                 'https://experimente.ai';
  
  return {
    name: "Provador Virtual",
    short_name: "Provador",
    description: "Experimente roupas sem sair de casa",
    start_url: `/${lojistaId}/experimentar`,
    display: 'standalone',
    background_color: '#000000', // PHASE 17: Preto para barra de navegação inferior
    theme_color: '#000000',
    icons: [
      {
        src: `${baseUrl}/icons/default-icon.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: `${baseUrl}/icons/default-icon.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}

