/**
 * PHASE 25: PWA Icon Route
 * Rota específica para servir ícone do PWA
 * Garante que o Chrome possa acessar o ícone corretamente no modal de instalação
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
    
    const db = getFirestoreAdmin();
    
    // Buscar dados da loja
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    let lojaData: any = null;
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
    } else {
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
      }
    }
    
    // Priorizar app_icon_url, depois logoUrl
    const iconUrl = lojaData?.app_icon_url || lojaData?.logoUrl || null;
    
    // Construir URL absoluta
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                   'https://app2.experimenteai.com.br';
    
    // Se não houver ícone, buscar ícone padrão
    if (!iconUrl) {
      try {
        const defaultIconUrl = `${baseUrl}/icons/default-icon.png`;
        const defaultResponse = await fetch(defaultIconUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (defaultResponse.ok) {
          const buffer = await defaultResponse.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (error) {
        console.error('[PWA Icon] Erro ao buscar ícone padrão:', error);
      }
      return new NextResponse('Ícone não encontrado', { status: 404 });
    }
    
    let iconUrlAbsolute: string;
    if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
      iconUrlAbsolute = iconUrl.startsWith('http://') ? iconUrl.replace('http://', 'https://') : iconUrl;
    } else {
      iconUrlAbsolute = iconUrl.startsWith('/') ? `${baseUrl}${iconUrl}` : `${baseUrl}/${iconUrl}`;
    }
    
    // PHASE 25: Buscar imagem diretamente (Chrome precisa de resposta direta, não redirecionamento)
    try {
      let imageResponse: Response;
      
      // Se for Firebase Storage, buscar diretamente (Firebase permite CORS se configurado)
      if (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) {
        // Tentar buscar diretamente primeiro
        imageResponse = await fetch(iconUrlAbsolute, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
            'Accept': 'image/*',
          },
          signal: AbortSignal.timeout(10000),
        });
        
        // Se não funcionar, usar proxy
        if (!imageResponse.ok) {
          const proxyUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(iconUrlAbsolute)}`;
          imageResponse = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
              'Accept': 'image/*',
            },
            signal: AbortSignal.timeout(10000),
          });
        }
      } else {
        // Para outras URLs, buscar diretamente
        imageResponse = await fetch(iconUrlAbsolute, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
            'Accept': 'image/*',
          },
          signal: AbortSignal.timeout(10000),
        });
      }
      
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        
        // PHASE 25: Retornar imagem diretamente com headers corretos para PWA
        // Chrome precisa de Content-Type correto e CORS habilitado
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
    } catch (error: any) {
      console.error('[PWA Icon] Erro ao buscar ícone:', error);
    }
    
    // Fallback: retornar erro 404
    return new NextResponse('Ícone não encontrado', { status: 404 });
  } catch (error: any) {
    console.error('[PWA Icon] Erro:', error);
    return NextResponse.redirect(new URL('/icons/default-icon.png', request.url));
  }
}

