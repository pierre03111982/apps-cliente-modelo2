/**
 * PHASE 25: Test Endpoint for OG Image
 * Testa se a rota OG Image está funcionando corretamente
 * Acesse: /api/test-og-image/{lojistaId}
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
    
    // Verificar variáveis de ambiente
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_VERCEL_URL: !!process.env.NEXT_PUBLIC_VERCEL_URL,
      NEXT_PUBLIC_FACEBOOK_APP_ID: !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    };
    
    // Tentar buscar dados da loja
    let lojaData: any = null;
    let firestoreError: string | null = null;
    
    try {
      const db = getFirestoreAdmin();
      const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
      
      if (perfilDadosDoc.exists) {
        lojaData = perfilDadosDoc.data();
      } else {
        const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
        if (lojaDoc.exists) {
          lojaData = lojaDoc.data();
        }
      }
    } catch (error: any) {
      firestoreError = error.message;
    }
    
    // Construir URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    // Testar URL da OG Image
    const ogImageUrl = `${baseUrl}/api/og-image/${lojistaId}`;
    let ogImageTest: { accessible: boolean; status?: number; error?: string } = { accessible: false };
    
    try {
      const response = await fetch(ogImageUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) 
      });
      ogImageTest = {
        accessible: response.ok,
        status: response.status,
      };
    } catch (error: any) {
      ogImageTest = {
        accessible: false,
        error: error.message,
      };
    }
    
    // Testar URL do Manifest
    const manifestUrl = `${baseUrl}/${lojistaId}/manifest.json`;
    let manifestTest: { accessible: boolean; status?: number; error?: string } = { accessible: false };
    
    try {
      const response = await fetch(manifestUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) 
      });
      manifestTest = {
        accessible: response.ok,
        status: response.status,
      };
    } catch (error: any) {
      manifestTest = {
        accessible: false,
        error: error.message,
      };
    }
    
    return NextResponse.json({
      success: true,
      lojistaId,
      timestamp: new Date().toISOString(),
      environment: {
        ...envCheck,
        baseUrl,
      },
      firestore: {
        connected: !firestoreError,
        error: firestoreError,
        lojaData: lojaData ? {
          nome: lojaData?.nome || "não encontrado",
          hasLogoUrl: !!lojaData?.logoUrl,
          hasAppIconUrl: !!lojaData?.app_icon_url,
          logoUrl: lojaData?.logoUrl ? (lojaData.logoUrl.length > 100 ? lojaData.logoUrl.substring(0, 100) + "..." : lojaData.logoUrl) : null,
          appIconUrl: lojaData?.app_icon_url ? (lojaData.app_icon_url.length > 100 ? lojaData.app_icon_url.substring(0, 100) + "..." : lojaData.app_icon_url) : null,
        } : null,
      },
      endpoints: {
        ogImage: {
          url: ogImageUrl,
          ...ogImageTest,
        },
        manifest: {
          url: manifestUrl,
          ...manifestTest,
        },
      },
      recommendations: {
        missingEnvVars: Object.entries(envCheck)
          .filter(([key, value]) => !value && key !== 'NEXT_PUBLIC_FACEBOOK_APP_ID')
          .map(([key]) => key),
        needsFacebookAppId: !envCheck.NEXT_PUBLIC_FACEBOOK_APP_ID,
        firestoreIssue: !!firestoreError,
        ogImageIssue: !ogImageTest.accessible,
        manifestIssue: !manifestTest.accessible,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, {
      status: 500,
    });
  }
}

