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
    
    if (!iconUrl) {
      // Retornar ícone padrão se não houver
      return NextResponse.redirect(new URL('/icons/default-icon.png', request.url));
    }
    
    // Construir URL absoluta
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                   'https://app2.experimenteai.com.br';
    
    let iconUrlAbsolute: string;
    if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
      iconUrlAbsolute = iconUrl.startsWith('http://') ? iconUrl.replace('http://', 'https://') : iconUrl;
    } else {
      iconUrlAbsolute = iconUrl.startsWith('/') ? `${baseUrl}${iconUrl}` : `${baseUrl}/${iconUrl}`;
    }
    
    // Se for Firebase Storage, buscar via proxy
    if (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) {
      // Usar proxy-image para buscar a imagem
      const proxyUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(iconUrlAbsolute)}`;
      
      try {
        const imageResponse = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
            'Accept': 'image/*',
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get('content-type') || 'image/png';
          
          // Retornar imagem com headers corretos para PWA
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          });
        }
      } catch (error) {
        console.error('[PWA Icon] Erro ao buscar via proxy:', error);
      }
    } else {
      // Se não for Firebase Storage, redirecionar para URL direta
      return NextResponse.redirect(iconUrlAbsolute);
    }
    
    // Fallback: redirecionar para ícone padrão
    return NextResponse.redirect(new URL('/icons/default-icon.png', request.url));
  } catch (error: any) {
    console.error('[PWA Icon] Erro:', error);
    return NextResponse.redirect(new URL('/icons/default-icon.png', request.url));
  }
}

