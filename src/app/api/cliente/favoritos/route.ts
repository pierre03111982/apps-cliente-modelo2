import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Proxy para buscar favoritos do cliente no backend (paineladm)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojistaId = searchParams.get("lojistaId");
    const customerId = searchParams.get("customerId");
    const timestamp = searchParams.get("_t");

    console.log("[Cliente Favoritos Proxy] Recebida requisição:", { lojistaId, customerId, timestamp });

    if (!lojistaId || !customerId) {
      console.error("[Cliente Favoritos Proxy] Parâmetros faltando:", { lojistaId: !!lojistaId, customerId: !!customerId });
      return NextResponse.json(
        { error: "lojistaId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Favoritos Proxy] Enviando para backend:", backendUrl);

    const url = `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(customerId)}${timestamp ? `&_t=${timestamp}` : ''}`;
    console.log("[Cliente Favoritos Proxy] URL completa:", url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cliente Favoritos Proxy] Erro na resposta:", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[Cliente Favoritos Proxy] Favoritos recebidos:", data.favorites?.length || 0);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Favoritos Proxy] Erro:", error);
    console.error("[Cliente Favoritos Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar favoritos" },
      { status: 500 }
    );
  }
}

