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
  // PHASE 25-B FIX: Extrair lojistaId antes do try para estar disponível no catch
  const { lojistaId } = await params;
  
  try {
    
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
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any',
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
    
    // PHASE 25-C: Debug - Log dos dados encontrados no Firestore
    console.log("[Manifest API] PHASE 25-C: Dados do Firestore:", {
      lojistaId,
      nome,
      app_icon_url: lojaData?.app_icon_url ? (lojaData.app_icon_url.length > 100 ? lojaData.app_icon_url.substring(0, 100) + "..." : lojaData.app_icon_url) : "AUSENTE",
      logoUrl: lojaData?.logoUrl ? (lojaData.logoUrl.length > 100 ? lojaData.logoUrl.substring(0, 100) + "..." : lojaData.logoUrl) : "AUSENTE",
      hasAppIconUrl: !!lojaData?.app_icon_url,
      hasLogoUrl: !!lojaData?.logoUrl,
    });
    
    // PHASE 25-C: Priorizar app_icon_url, depois logoUrl, depois fallback
    const iconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || null;
    const themeColor = lojaData?.themeColor || '#000000';
    const backgroundColor = lojaData?.backgroundColor || '#000000';
    
    // PHASE 25-C: Garantir URL absoluta HTTPS (PWA manifest exige URLs absolutas)
    let iconUrlAbsolute: string;
    
    if (!iconUrl) {
      // Fallback: usar ícone padrão
      iconUrlAbsolute = `${baseUrl}/icons/default-icon.png`;
      console.log("[Manifest API] PHASE 25-C: Nenhum ícone encontrado, usando fallback:", iconUrlAbsolute);
    } else {
      // PHASE 25-C: Forçar URL absoluta HTTPS
      if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
        // Já é absoluta, garantir HTTPS
        iconUrlAbsolute = iconUrl.startsWith('http://') ? iconUrl.replace('http://', 'https://') : iconUrl;
      } else if (iconUrl.startsWith('/')) {
        // Relativa começando com /, adicionar baseUrl
        iconUrlAbsolute = `${baseUrl}${iconUrl}`;
      } else {
        // Relativa sem /, adicionar baseUrl com /
        iconUrlAbsolute = `${baseUrl}/${iconUrl}`;
      }
      
      console.log("[Manifest API] PHASE 25-C: URL original:", iconUrl);
      console.log("[Manifest API] PHASE 25-C: URL absoluta gerada:", iconUrlAbsolute);
      
      // PHASE 25-C: Se for Firebase Storage, usar proxy para garantir acesso
      if (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) {
        iconUrlAbsolute = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(iconUrlAbsolute)}`;
        console.log("[Manifest API] PHASE 25-C: Usando proxy para ícone do Firebase Storage");
      }
    }
    
    // PHASE 25-C: Verificar se o ícone é acessível
    let iconUrlFinal = iconUrlAbsolute;
    try {
      const iconResponse = await fetch(iconUrlAbsolute, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      if (!iconResponse.ok) {
        console.warn("[Manifest API] PHASE 25-C: Ícone não acessível (status:", iconResponse.status, "), usando fallback");
        iconUrlFinal = `${baseUrl}/icons/default-icon.png`;
      } else {
        const contentType = iconResponse.headers.get('content-type');
        console.log("[Manifest API] PHASE 25-C: Ícone verificado e acessível:", {
          url: iconUrlAbsolute,
          status: iconResponse.status,
          contentType: contentType,
        });
      }
    } catch (fetchError: any) {
      console.warn("[Manifest API] PHASE 25-C: Erro ao verificar ícone:", fetchError.message);
      // Se não conseguir verificar e for Firebase Storage, usar fallback
      if (iconUrl && (iconUrl.includes('storage.googleapis.com') || iconUrl.includes('firebasestorage.googleapis.com'))) {
        console.warn("[Manifest API] PHASE 25-C: Erro ao acessar ícone do Firebase Storage, usando fallback");
        iconUrlFinal = `${baseUrl}/icons/default-icon.png`;
      }
    }
    
    // PHASE 25-C: Garantir que a URL final seja HTTPS absoluta
    if (!iconUrlFinal.startsWith('https://') && !iconUrlFinal.startsWith('http://')) {
      iconUrlFinal = `${baseUrl}${iconUrlFinal.startsWith('/') ? iconUrlFinal : `/${iconUrlFinal}`}`;
    }
    if (iconUrlFinal.startsWith('http://')) {
      iconUrlFinal = iconUrlFinal.replace('http://', 'https://');
    }
    
    console.log("[Manifest API] PHASE 25-C: URL FINAL do ícone (garantida HTTPS absoluta):", iconUrlFinal);
    console.log("[Manifest API] PHASE 25-C: Manifest gerado para lojista:", {
      lojistaId,
      nome,
      iconUrlOriginal: iconUrl || "fallback",
      iconUrlFinal: iconUrlFinal,
      themeColor,
      backgroundColor,
      hasAppIconUrl: !!lojaData?.app_icon_url,
      hasLogoUrl: !!lojaData?.logoUrl,
    });
    
    // PHASE 25-C: Estrutura do manifest conforme especificação
    // Garantir que todos os ícones tenham type: 'image/png' e URLs absolutas HTTPS
    // Incluir múltiplos tamanhos para melhor compatibilidade com PWA
    // PHASE 25: Adicionar mais tamanhos e garantir que o ícone apareça no modal de instalação
    const manifest = {
      name: `${nome} | Provador Virtual com IA`,
      short_name: nome.length > 12 ? nome.slice(0, 12) : nome,
      description: descricao || `Aplicativo da ${nome} - Provador Virtual com IA`,
      start_url: `/${lojistaId}/experimentar`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: backgroundColor,
      theme_color: themeColor,
      scope: `/${lojistaId}/`,
      icons: [
        // PHASE 25: Ícone maskable para Android (melhor suporte)
        {
          src: iconUrlFinal,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        // PHASE 25: Ícones padrão (qualquer propósito)
        {
          src: iconUrlFinal,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '256x256',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any', // Apple Touch Icon
        },
        {
          src: iconUrlFinal,
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrlFinal,
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };
    
    console.log("[Manifest API] PHASE 25-C: Manifest JSON final:", JSON.stringify(manifest, null, 2));
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error("[Manifest API] PHASE 25-B: Erro ao gerar manifest:", error);
    console.error("[Manifest API] PHASE 25-B: Stack:", error.stack);
    
    // Retornar manifest padrão em caso de erro
    // PHASE 25-B FIX: lojistaId já está disponível no escopo externo
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
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${baseUrl}/icons/default-icon.png`,
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any',
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

