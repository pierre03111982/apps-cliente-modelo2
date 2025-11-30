/**
 * PHASE 25: Debug Endpoint for Manifest
 * Verifica se o ícone está sendo encontrado e acessível
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
    
    // Buscar dados da loja
    const db = getFirestoreAdmin();
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
    
    if (!lojaData) {
      return NextResponse.json({
        error: 'Loja não encontrada',
        lojistaId,
      }, { status: 404 });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    // Verificar ícones
    const appIconUrl = lojaData?.app_icon_url || null;
    const logoUrl = lojaData?.logoUrl || null;
    const iconUrl = appIconUrl || logoUrl || null;
    
    let iconUrlAbsolute: string | null = null;
    if (iconUrl) {
      iconUrlAbsolute = iconUrl.startsWith('http') ? iconUrl : 
                       iconUrl.startsWith('/') ? `${baseUrl}${iconUrl}` : 
                       `${baseUrl}/${iconUrl}`;
    }
    
    // Testar acessibilidade
    let iconAccessible: boolean = false;
    let iconStatus: number | null = null;
    let iconError: string | null = null;
    
    if (iconUrlAbsolute) {
      try {
        const response = await fetch(iconUrlAbsolute, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) 
        });
        iconAccessible = response.ok;
        iconStatus = response.status;
      } catch (error: any) {
        iconError = error.message;
      }
    }
    
    // Testar manifest
    const manifestUrl = `${baseUrl}/${lojistaId}/manifest.json`;
    let manifestAccessible: boolean = false;
    let manifestStatus: number | null = null;
    let manifestData: any = null;
    
    try {
      const response = await fetch(manifestUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) 
      });
      manifestAccessible = response.ok;
      manifestStatus = response.status;
      if (response.ok) {
        manifestData = await response.json();
      }
    } catch (error: any) {
      // Ignorar erro
    }
    
    return NextResponse.json({
      lojistaId,
      lojaNome: lojaData?.nome || "não encontrado",
      dados: {
        hasAppIconUrl: !!appIconUrl,
        hasLogoUrl: !!logoUrl,
        appIconUrl: appIconUrl ? (appIconUrl.length > 100 ? appIconUrl.substring(0, 100) + "..." : appIconUrl) : null,
        logoUrl: logoUrl ? (logoUrl.length > 100 ? logoUrl.substring(0, 100) + "..." : logoUrl) : null,
        iconUrlSelected: iconUrl ? (iconUrl.length > 100 ? iconUrl.substring(0, 100) + "..." : iconUrl) : null,
      },
      icon: {
        url: iconUrlAbsolute,
        accessible: iconAccessible,
        status: iconStatus,
        error: iconError,
        isFirebaseStorage: iconUrlAbsolute ? (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) : false,
      },
      manifest: {
        url: manifestUrl,
        accessible: manifestAccessible,
        status: manifestStatus,
        icons: manifestData?.icons || null,
      },
      recommendations: {
        needsAppIconUpload: !appIconUrl && !logoUrl,
        iconNotAccessible: !iconAccessible && iconUrlAbsolute,
        shouldUseProxy: iconUrlAbsolute ? (iconUrlAbsolute.includes('storage.googleapis.com') || iconUrlAbsolute.includes('firebasestorage.googleapis.com')) : false,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, {
      status: 500,
    });
  }
}

