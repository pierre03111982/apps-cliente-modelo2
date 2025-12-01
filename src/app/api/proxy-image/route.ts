/**
 * PHASE 25: Image Proxy Route
 * Serve imagens do Firebase Storage através do nosso servidor
 * Garante que imagens sejam acessíveis para OG Image e PWA Manifest
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      );
    }
    
    // Validar que é uma URL do Firebase Storage
    if (!imageUrl.includes('storage.googleapis.com') && !imageUrl.includes('firebasestorage.googleapis.com')) {
      return NextResponse.json(
        { error: 'URL inválida - apenas Firebase Storage permitido' },
        { status: 400 }
      );
    }
    
    // Buscar a imagem
    console.log('[Proxy Image] Buscando imagem do Firebase Storage:', imageUrl.substring(0, 100) + "...");
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ExperimenteAI/1.0)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(15000), // 15 segundos timeout
    });
    
    console.log('[Proxy Image] Resposta do Firebase Storage:', {
      status: imageResponse.status,
      statusText: imageResponse.statusText,
      contentType: imageResponse.headers.get('content-type'),
      contentLength: imageResponse.headers.get('content-length'),
    });
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => '');
      console.error('[Proxy Image] ❌ Erro ao buscar imagem:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        error: errorText.substring(0, 200),
        url: imageUrl.substring(0, 100) + "...",
      });
      return NextResponse.json(
        { error: `Imagem não encontrada: ${imageResponse.status} ${imageResponse.statusText}` },
        { status: imageResponse.status }
      );
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    if (imageBuffer.byteLength === 0) {
      console.error('[Proxy Image] ❌ Imagem baixada mas está vazia (0 bytes)');
      return NextResponse.json(
        { error: 'Imagem vazia' },
        { status: 500 }
      );
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    console.log('[Proxy Image] ✅ Imagem baixada com sucesso:', {
      size: imageBuffer.byteLength,
      contentType,
    });
    
    // Retornar a imagem com headers apropriados
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('[Proxy Image] Erro ao processar imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    );
  }
}




