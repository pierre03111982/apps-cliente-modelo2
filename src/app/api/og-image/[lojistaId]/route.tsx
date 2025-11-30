/**
 * PHASE 18: Dynamic Open Graph Image Generator
 * Gera imagens Open Graph dinamicamente com a logo da loja
 * Tamanho recomendado: 1200x630px
 */

import { ImageResponse } from 'next/og';
import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

// Usar nodejs runtime porque Firebase Admin não funciona no edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lojistaId: string }> }
) {
  try {
    const { lojistaId } = await params;
    
    // Buscar dados da loja
    // PRIORIDADE 1: Buscar em perfil/dados (onde salvamos os dados)
    const db = getFirestoreAdmin();
    const perfilDadosDoc = await db.collection("lojas").doc(lojistaId).collection("perfil").doc("dados").get();
    
    let lojaData: any = null;
    if (perfilDadosDoc.exists) {
      lojaData = perfilDadosDoc.data();
      console.log("[OG Image] Perfil encontrado em perfil/dados:", lojaData?.nome || "sem nome");
    } else {
      // PRIORIDADE 2: Tentar buscar dados diretamente do documento da loja
      const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
      if (lojaDoc.exists) {
        lojaData = lojaDoc.data();
        console.log("[OG Image] Perfil encontrado no documento da loja:", lojaData?.nome || "sem nome");
      }
    }
    
    if (!lojaData) {
      return new Response('Loja não encontrada', { status: 404 });
    }
    
    const nome = lojaData?.nome || "Loja";
    const logoUrl = lojaData?.logoUrl || null;
    const appIconUrl = lojaData?.app_icon_url || null;
    
    console.log("[OG Image] PHASE 25: Dados encontrados:", {
      lojistaId,
      nome,
      logoUrl: logoUrl ? (logoUrl.length > 50 ? logoUrl.substring(0, 50) + "..." : logoUrl) : "ausente",
      appIconUrl: appIconUrl ? (appIconUrl.length > 50 ? appIconUrl.substring(0, 50) + "..." : appIconUrl) : "ausente",
      hasLogoUrl: !!logoUrl,
      hasAppIconUrl: !!appIconUrl
    });
    
    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_VERCEL_URL ? 
                   `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                   'https://experimente.ai';
    
    // Construir URL da logo (garantir URL absoluta)
    // Priorizar logoUrl, depois app_icon_url
    let logoImageData: string | null = null;
    const logoToUse = logoUrl || appIconUrl;
    
    if (logoToUse) {
      let logoImageUrl: string;
      if (logoToUse.startsWith('http://') || logoToUse.startsWith('https://')) {
        logoImageUrl = logoToUse;
      } else {
        logoImageUrl = logoToUse.startsWith('/') ? `${baseUrl}${logoToUse}` : `${baseUrl}/${logoToUse}`;
      }
      
      console.log("[OG Image] PHASE 25: Tentando baixar logo:", logoImageUrl);
      
      // PHASE 25 FIX CRÍTICO: ImageResponse não carrega imagens externas diretamente
      // Precisamos baixar a imagem no servidor e converter para base64
      try {
        const imageResponse = await fetch(logoImageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
          },
          signal: AbortSignal.timeout(10000), // 10 segundos timeout
        });
        
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          // Converter ArrayBuffer para base64 (compatível com Node.js e Edge)
          const imageBase64 = btoa(
            String.fromCharCode(...new Uint8Array(imageBuffer))
          );
          const contentType = imageResponse.headers.get('content-type') || 'image/png';
          logoImageData = `data:${contentType};base64,${imageBase64}`;
          console.log("[OG Image] PHASE 25: Logo baixada e convertida para base64 com sucesso");
        } else {
          console.warn("[OG Image] PHASE 25: Erro ao baixar logo (status:", imageResponse.status, ")");
        }
      } catch (fetchError: any) {
        console.error("[OG Image] PHASE 25: Erro ao baixar logo:", fetchError.message);
        // Continuar sem logo
      }
    } else {
      console.log("[OG Image] PHASE 25: Nenhuma logo encontrada, gerando imagem sem logo");
    }
    
    // Gerar imagem Open Graph
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Logo da Loja */}
          {logoImageData ? (
            <img
              src={logoImageData}
              alt={nome}
              width={200}
              height={200}
              style={{
                objectFit: 'contain',
                marginBottom: '40px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
              }}
            />
          ) : null}
          
          {/* Nome da Loja */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: '20px',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {nome}
          </div>
          
          {/* Subtítulo */}
          <div
            style={{
              fontSize: '32px',
              color: '#F3F4F6',
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Provador Virtual com IA
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('[OG Image] Erro ao gerar imagem:', error);
    console.error('[OG Image] Stack:', error.stack);
    console.error('[OG Image] Variáveis de ambiente:', {
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'não configurado',
    });
    
    // Retornar imagem de fallback simples
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            Provador Virtual com IA
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

