/**
 * PHASE 25-B: PWA Manifest API Route
 * Gera manifest.json dinâmico via API Route explícita
 * Mais confiável que manifest.ts para rotas dinâmicas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lojistaId: string }> }
) {
  try {
    const { lojistaId } = await params;
    
    // Buscar dados da loja do Firestore
    // PRIORIDADE 1: Buscar em perfil/dados (onde salvamos os dados)
    const db = getFirestoreAdmin();
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    let lojaData: any = null;
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
      console.log("[Manifest API] PHASE 25-B: Perfil encontrado em perfil/dados:", lojaData?.nome || "sem nome");
    } else {
      // PRIORIDADE 2: Tentar buscar dados diretamente do documento da loja
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
        console.log("[Manifest API] PHASE 25-B: Perfil encontrado no documento da loja:", lojaData?.nome || "sem nome");
      }
    }
    
    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    if (!lojaData) {
      // Retornar manifest padrão se loja não existir
      console.log("[Manifest API] PHASE 25-B: Loja não encontrada, usando manifest padrão");
      const defaultManifest = {
        name: "Provador Virtual",
        short_name: "Provador",
        description: "Experimente roupas sem sair de casa",
        start_url: `/${lojistaId}/experimentar`,
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: `${baseUrl}/icons/default-icon.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${baseUrl}/icons/default-icon.png`,
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      };
      
      return NextResponse.json(defaultManifest, {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
    
    const nome = lojaData?.nome || "Loja";
    const descricao = lojaData?.descricao || "Experimente as roupas sem sair de casa";
    
    // PHASE 25-B: Priorizar app_icon_url, depois logoUrl, depois fallback
    const iconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || `${baseUrl}/icons/default-icon.png`;
    const themeColor = lojaData?.themeColor || '#000000';
    const backgroundColor = lojaData?.backgroundColor || '#000000';
    
    // Garantir URL absoluta para o ícone
    let iconUrlAbsolute = iconUrl.startsWith('http') ? iconUrl : 
                           iconUrl.startsWith('/') ? `${baseUrl}${iconUrl}` : 
                           `${baseUrl}/${iconUrl}`;
    
    // PHASE 25-B: Se for Firebase Storage, usar proxy para garantir acesso
    if (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) {
      iconUrlAbsolute = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(iconUrlAbsolute)}`;
      console.log("[Manifest API] PHASE 25-B: Usando proxy para ícone do Firebase Storage");
    }
    
    // PHASE 25-B: Verificar se o ícone é acessível
    let iconUrlFinal = iconUrlAbsolute;
    try {
      const iconResponse = await fetch(iconUrlAbsolute, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      if (!iconResponse.ok) {
        console.warn("[Manifest API] PHASE 25-B: Ícone não acessível (status:", iconResponse.status, "), usando fallback");
        iconUrlFinal = `${baseUrl}/icons/default-icon.png`;
      } else {
        console.log("[Manifest API] PHASE 25-B: Ícone verificado e acessível:", iconUrlAbsolute);
      }
    } catch (fetchError) {
      console.warn("[Manifest API] PHASE 25-B: Erro ao verificar ícone (pode ser CORS ou timeout):", fetchError);
      // Se não conseguir verificar e for Firebase Storage, usar fallback
      if (iconUrl.includes('storage.googleapis.com') || iconUrl.includes('firebasestorage.googleapis.com')) {
        console.warn("[Manifest API] PHASE 25-B: Erro ao acessar ícone do Firebase Storage, usando fallback");
        iconUrlFinal = `${baseUrl}/icons/default-icon.png`;
      }
    }
    
    console.log("[Manifest API] PHASE 25-B: Manifest gerado para lojista:", {
      lojistaId,
      nome,
      iconUrlOriginal: iconUrl,
      iconUrlFinal: iconUrlFinal,
      themeColor,
      backgroundColor,
      hasAppIconUrl: !!lojaData?.app_icon_url,
      hasLogoUrl: !!lojaData?.logoUrl,
    });
    
    // PHASE 25-B: Estrutura do manifest conforme especificação
    const manifest = {
      name: nome,
      short_name: nome.length > 12 ? nome.slice(0, 12) : nome,
      description: descricao || `Aplicativo da ${nome} - Provador Virtual com IA`,
      start_url: `/${lojistaId}/experimentar`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      icons: [
        {
          src: iconUrlFinal,
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: iconUrlFinal,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: iconUrlFinal,
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: iconUrlFinal,
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    };
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error("[Manifest API] PHASE 25-B: Erro ao gerar manifest:", error);
    console.error("[Manifest API] PHASE 25-B: Stack:", error.stack);
    
    // Retornar manifest padrão em caso de erro
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    const defaultManifest = {
      name: "Provador Virtual",
      short_name: "Provador",
      description: "Experimente roupas sem sair de casa",
      start_url: `/${lojistaId}/experimentar`,
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    };
    
    return NextResponse.json(defaultManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  }
}

