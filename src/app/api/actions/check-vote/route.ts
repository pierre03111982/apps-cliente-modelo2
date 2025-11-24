import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/actions/check-vote
 * Verificar se o cliente já votou em uma composição
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const compositionId = searchParams.get("compositionId");
    const customerId = searchParams.get("customerId");
    const lojistaId = searchParams.get("lojistaId");

    if (!compositionId || !customerId || !lojistaId) {
      return NextResponse.json(
        { error: "compositionId, customerId e lojistaId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

    try {
      const response = await fetch(
        `${backendUrl}/api/actions/check-vote?compositionId=${encodeURIComponent(compositionId)}&customerId=${encodeURIComponent(customerId)}&lojistaId=${encodeURIComponent(lojistaId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        // Se der erro 500 ou outro, retornar que não votou (não bloquear)
        console.warn("[Check Vote Proxy] Erro do backend:", response.status);
        return NextResponse.json(
          { votedType: null, action: null },
          { status: 200 }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error("[Check Vote Proxy] Erro ao buscar:", fetchError);
      // Em caso de erro, retornar que não votou (não bloquear)
      return NextResponse.json(
        { votedType: null, action: null },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("[Check Vote Proxy] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao verificar voto" },
      { status: 500 }
    );
  }
}
