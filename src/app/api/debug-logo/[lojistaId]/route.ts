/**
 * PHASE 25: Debug Route para verificar configuração da logo
 * Ajuda a diagnosticar por que a logo não aparece na OG Image
 */

import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lojistaId: string }> }
) {
  try {
    const { lojistaId } = await params;
    
    const db = getFirestoreAdmin();
    
    // Buscar dados da loja
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    let lojaData: any = null;
    let dataSource = "nenhum";
    
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
      dataSource = "perfil/dados";
    } else {
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
        dataSource = "lojas/{id}";
      }
    }
    
    if (!lojaData) {
      return NextResponse.json({
        success: false,
        error: "Loja não encontrada",
        lojistaId,
      }, { status: 404 });
    }
    
    const nome = lojaData?.nome || "Loja";
    const logoUrl = lojaData?.logoUrl || null;
    const appIconUrl = lojaData?.app_icon_url || null;
    
    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                   'https://app2.experimenteai.com.br';
    
    // Construir URL da logo
    const logoToUse = logoUrl || appIconUrl;
    let logoImageUrl: string | null = null;
    
    if (logoToUse) {
      if (logoToUse.startsWith('http://') || logoToUse.startsWith('https://')) {
        logoImageUrl = logoToUse;
      } else {
        logoImageUrl = logoToUse.startsWith('/') ? `${baseUrl}${logoToUse}` : `${baseUrl}/${logoToUse}`;
      }
      
      // Se for Firebase Storage, usar proxy
      if (logoImageUrl.includes('storage.googleapis.com') || logoImageUrl.includes('firebasestorage.googleapis.com')) {
        logoImageUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent(logoImageUrl)}`;
      }
    }
    
    // Testar se a logo é acessível
    let logoAccessible = false;
    let logoError: string | null = null;
    
    if (logoImageUrl) {
      try {
        const testResponse = await fetch(logoImageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
            'Accept': 'image/*',
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (testResponse.ok) {
          const buffer = await testResponse.arrayBuffer();
          logoAccessible = buffer.byteLength > 0;
          if (!logoAccessible) {
            logoError = "Logo baixada mas está vazia (0 bytes)";
          }
        } else {
          logoError = `HTTP ${testResponse.status}: ${testResponse.statusText}`;
        }
      } catch (error: any) {
        logoError = error.message || "Erro desconhecido";
      }
    }
    
    return NextResponse.json({
      success: true,
      lojistaId,
      nome,
      dataSource,
      logo: {
        logoUrl: logoUrl ? (logoUrl.length > 100 ? logoUrl.substring(0, 100) + "..." : logoUrl) : null,
        appIconUrl: appIconUrl ? (appIconUrl.length > 100 ? appIconUrl.substring(0, 100) + "..." : appIconUrl) : null,
        logoToUse: logoToUse ? (logoToUse.length > 100 ? logoToUse.substring(0, 100) + "..." : logoToUse) : null,
        logoImageUrl: logoImageUrl ? (logoImageUrl.length > 150 ? logoImageUrl.substring(0, 150) + "..." : logoImageUrl) : null,
        accessible: logoAccessible,
        error: logoError,
      },
      ogImageUrl: `${baseUrl}/api/og-image/${lojistaId}`,
      environment: {
        baseUrl,
        vercelUrl: process.env.VERCEL_URL || null,
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || null,
      },
    });
  } catch (error: any) {
    console.error('[Debug Logo] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message || "Erro desconhecido",
      stack: error.stack,
    }, { status: 500 });
  }
}






