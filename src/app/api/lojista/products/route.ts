import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/lojista/products
 * Busca produtos da loja
 * Query: lojistaId, categoria (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const lojistaId = request.nextUrl.searchParams.get("lojistaId");
    const categoria = request.nextUrl.searchParams.get("categoria");

    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      DEFAULT_LOCAL_BACKEND;

    let url = `${backendUrl}/api/lojista/products?lojistaId=${encodeURIComponent(lojistaId)}`;
    if (categoria) {
      url += `&categoria=${encodeURIComponent(categoria)}`;
    }

    console.log("[modelo-2/api/lojista/products] Buscando produtos em:", url);

    let response: Response;
    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      response = await fetch(url, {
        cache: "no-store",
        next: { revalidate: 0 },
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.error("[modelo-2/api/lojista/products] Erro ao conectar com backend:", fetchError);
      
      // Se for erro de conexão, retornar array vazio em vez de erro 500
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        console.warn("[modelo-2/api/lojista/products] Timeout ao conectar com backend. Retornando array vazio.");
        return NextResponse.json([], { status: 200 });
      }

      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed')) {
        console.warn("[modelo-2/api/lojista/products] Backend não disponível. Retornando array vazio.");
        return NextResponse.json([], { status: 200 });
      }

      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Erro ${response.status} ao buscar produtos` };
      }
      console.error("[modelo-2/api/lojista/products] Erro do backend:", response.status, errorData);
      
      // Se o backend retornar erro mas não for crítico, retornar array vazio
      if (response.status >= 500) {
        console.warn("[modelo-2/api/lojista/products] Erro do servidor backend. Retornando array vazio.");
        return NextResponse.json([], { status: 200 });
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    let data;
    try {
      const text = await response.text();
      if (!text) {
        console.warn("[modelo-2/api/lojista/products] Resposta vazia do backend. Retornando array vazio.");
        return NextResponse.json([], { status: 200 });
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[modelo-2/api/lojista/products] Erro ao parsear resposta:", parseError);
      return NextResponse.json([], { status: 200 });
    }

    // Garantir que sempre retornamos um array
    const produtos = Array.isArray(data) ? data : [];
    console.log(`[modelo-2/api/lojista/products] Retornando ${produtos.length} produtos`);
    return NextResponse.json(produtos, { status: 200 });
  } catch (error: any) {
    console.error("[modelo-2/api/lojista/products] Erro inesperado:", error);
    // Em caso de erro inesperado, retornar array vazio em vez de erro 500
    return NextResponse.json([], { status: 200 });
  }
}
