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

    try {
      const response = await fetch(
        `${backendUrl}/api/lojista/perfil?lojistaId=${encodeURIComponent(lojistaId)}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
      } else {
        console.warn(`[modelo-2/api/lojista/perfil] API retornou status ${response.status}`);
        return NextResponse.json(
          { error: "Erro ao buscar perfil da loja" },
          { status: response.status }
        );
      }
    } catch (fetchError: any) {
      console.error("[modelo-2/api/lojista/perfil] Erro ao buscar do backend:", fetchError);
      // Retornar erro para que o cliente tente Firebase
      return NextResponse.json(
        { error: "Erro ao buscar perfil da loja", details: fetchError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[modelo-1/api/lojista/perfil] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil da loja" },
      { status: 500 }
    );
  }
}

