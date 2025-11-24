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

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    let response: Response;
    try {
      response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[Cliente Favoritos Proxy] Erro ao conectar com backend:", fetchError);
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: "Timeout ao buscar favoritos. Tente novamente.", favorites: [] },
          { status: 504 }
        );
      }
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed')) {
        console.warn("[Cliente Favoritos Proxy] Backend não disponível. Retornando array vazio.");
        return NextResponse.json(
          { error: "Servidor backend não está disponível", favorites: [] },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    console.log("[Cliente Favoritos Proxy] Resposta do backend:", response.status, response.statusText);

    let data: any;
    try {
      const text = await response.text();
      if (!text) {
        console.warn("[Cliente Favoritos Proxy] Resposta vazia do backend");
        data = { favorites: [] };
      } else {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("[Cliente Favoritos Proxy] Erro ao parsear JSON:", parseError);
      return NextResponse.json(
        { error: "Erro ao processar resposta do servidor", favorites: [] },
        { status: 500 }
      );
    }

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
