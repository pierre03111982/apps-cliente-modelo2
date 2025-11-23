import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/watermark
 * Adiciona marca d'água na imagem no servidor (evita problemas de CORS)
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, logoUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl é obrigatório" },
        { status: 400 }
      );
    }

    if (!logoUrl) {
      return NextResponse.json(
        { error: "logoUrl é obrigatório" },
        { status: 400 }
      );
    }

    // Fazer proxy das imagens através do servidor
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_PAINELADM_URL || 
                      "http://localhost:3000";

    // Enviar para o backend processar a marca d'água
    const response = await fetch(`${backendUrl}/api/watermark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, logoUrl }),
    });

    if (!response.ok) {
      // Se o backend não tiver essa rota, retornar a imagem original
      return NextResponse.json(
        { watermarkedUrl: imageUrl, fallback: true },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Watermark API] Erro:", error);
    // Em caso de erro, retornar a imagem original
    const { imageUrl } = await request.json().catch(() => ({ imageUrl: null }));
    return NextResponse.json(
      { watermarkedUrl: imageUrl || null, fallback: true },
      { status: 200 }
    );
  }
}

