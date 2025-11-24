import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * GET /api/lojista/perfil
 * Busca dados do perfil da loja
 * Query: lojistaId
 */
export async function GET(request: NextRequest) {
  try {
    const lojistaId = request.nextUrl.searchParams.get("lojistaId");

    console.log("[modelo-2/api/lojista/perfil] Recebida requisição para lojistaId:", lojistaId);

    if (!lojistaId) {
      console.error("[modelo-2/api/lojista/perfil] lojistaId não fornecido");
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      DEFAULT_LOCAL_BACKEND;

    console.log("[modelo-2/api/lojista/perfil] Backend URL:", backendUrl);

    const url = `${backendUrl}/api/lojista/perfil?lojistaId=${encodeURIComponent(lojistaId)}`;
    console.log("[modelo-2/api/lojista/perfil] Buscando em:", url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[modelo-2/api/lojista/perfil] Resposta do backend:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("[modelo-2/api/lojista/perfil] Dados recebidos:", {
          nome: data?.nome,
          hasLogo: !!data?.logoUrl,
          lojistaId: data?.id || lojistaId
        });
        return NextResponse.json(data, { status: 200 });
      } else {
        const errorText = await response.text();
        console.error(`[modelo-2/api/lojista/perfil] API retornou status ${response.status}:`, errorText);
        return NextResponse.json(
          { error: "Erro ao buscar perfil da loja", details: errorText },
          { status: response.status }
        );
      }
    } catch (fetchError: any) {
      console.error("[modelo-2/api/lojista/perfil] Erro ao buscar do backend:", fetchError);
      console.error("[modelo-2/api/lojista/perfil] Tipo do erro:", fetchError.name);
      console.error("[modelo-2/api/lojista/perfil] Mensagem:", fetchError.message);
      
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: "Timeout ao comunicar com o servidor backend" },
          { status: 504 }
        );
      }
      
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          { error: "Servidor backend não está disponível. Verifique se está rodando em " + backendUrl },
          { status: 503 }
        );
      }

      // Retornar erro para que o cliente tente Firebase
      return NextResponse.json(
        { error: "Erro ao buscar perfil da loja", details: fetchError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[modelo-2/api/lojista/perfil] Erro inesperado:", error);
    console.error("[modelo-2/api/lojista/perfil] Stack:", error?.stack);
    return NextResponse.json(
      { error: "Erro ao buscar perfil da loja" },
      { status: 500 }
    );
  }
}

