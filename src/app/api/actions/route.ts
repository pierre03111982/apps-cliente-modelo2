import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({ 
      success: false, 
      error: "Erro ao comunicar com o servidor" 
    }));

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}

