import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/watermark
 * Adiciona marca d'água na imagem no servidor (evita problemas de CORS)
 * Versão otimizada com timeout curto
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, logoUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl é obrigatório", fallback: true },
        { status: 400 }
      );
    }

    if (!logoUrl) {
      return NextResponse.json(
        { watermarkedUrl: imageUrl, fallback: true },
        { status: 200 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_PAINELADM_URL || 
                      "http://localhost:3000";

    // Timeout curto de 2 segundos para não travar
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      // Enviar para o backend processar a marca d'água
      const response = await fetch(`${backendUrl}/api/watermark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, logoUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Se backend retornou imagem processada, usar ela
        if (data.watermarkedUrl && data.watermarkedUrl !== imageUrl) {
          return NextResponse.json({
            watermarkedUrl: data.watermarkedUrl,
            fallback: false
          });
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name !== 'AbortError') {
        console.warn("[Watermark API] Erro ao processar:", fetchError);
      }
    }

    // Se falhar ou timeout, retornar imagem original (sem marca d'água)
    return NextResponse.json(
      { watermarkedUrl: imageUrl, fallback: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Watermark API] Erro:", error);
    // Em caso de erro, retornar a imagem original
    try {
      const { imageUrl } = await request.json();
      return NextResponse.json(
        { watermarkedUrl: imageUrl || null, fallback: true },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar marca d'água", fallback: true },
        { status: 500 }
      );
    }
  }
}




export const dynamic = 'force-dynamic';

/**
 * POST /api/watermark
 * Adiciona marca d'água na imagem no servidor (evita problemas de CORS)
 * Versão otimizada com timeout curto
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, logoUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl é obrigatório", fallback: true },
        { status: 400 }
      );
    }

    if (!logoUrl) {
      return NextResponse.json(
        { watermarkedUrl: imageUrl, fallback: true },
        { status: 200 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_PAINELADM_URL || 
                      "http://localhost:3000";

    // Timeout curto de 2 segundos para não travar
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      // Enviar para o backend processar a marca d'água
      const response = await fetch(`${backendUrl}/api/watermark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, logoUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Se backend retornou imagem processada, usar ela
        if (data.watermarkedUrl && data.watermarkedUrl !== imageUrl) {
          return NextResponse.json({
            watermarkedUrl: data.watermarkedUrl,
            fallback: false
          });
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name !== 'AbortError') {
        console.warn("[Watermark API] Erro ao processar:", fetchError);
      }
    }

    // Se falhar ou timeout, retornar imagem original (sem marca d'água)
    return NextResponse.json(
      { watermarkedUrl: imageUrl, fallback: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Watermark API] Erro:", error);
    // Em caso de erro, retornar a imagem original
    try {
      const { imageUrl } = await request.json();
      return NextResponse.json(
        { watermarkedUrl: imageUrl || null, fallback: true },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar marca d'água", fallback: true },
        { status: 500 }
      );
    }
  }
}

