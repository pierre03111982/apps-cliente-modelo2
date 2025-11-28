import { consumeGenerationCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[modelo-2/api/generate-looks] Erro ao parsear body:", parseError);
      return NextResponse.json(
        { error: "Corpo da requisição inválido", details: "JSON malformado" },
        { status: 400 }
      );
    }

    if (!body?.lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório para gerar looks" },
        { status: 400 }
      );
    }

    let creditValidation;
    try {
      creditValidation = await consumeGenerationCredit(body.lojistaId);
    } catch (creditError: any) {
      console.error("[modelo-2/api/generate-looks] Erro ao validar créditos:", creditError);
      return NextResponse.json(
        { 
          error: "Erro ao validar créditos", 
          details: creditError?.message || "Erro interno na validação de créditos" 
        },
        { status: 500 }
      );
    }
    if (!creditValidation.allowed) {
      // Type narrowing: quando allowed é false, message e status existem
      const errorMessage = "message" in creditValidation ? creditValidation.message : "Créditos insuficientes";
      const statusCode = "status" in creditValidation ? creditValidation.status : 402;
      console.warn("[modelo-2/api/generate-looks] Créditos bloqueados:", {
        lojistaId: body.lojistaId,
        message: errorMessage,
      });
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      DEFAULT_LOCAL_BACKEND;

    // Validar campos obrigatórios
    if (!body.personImageUrl) {
      return NextResponse.json(
        { error: "personImageUrl é obrigatório", details: "Foto da pessoa não fornecida" },
        { status: 400 }
      );
    }

    if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { error: "productIds é obrigatório", details: "Pelo menos um produto deve ser selecionado" },
        { status: 400 }
      );
    }

    console.log("[modelo-2/api/generate-looks] Iniciando requisição:", {
      backendUrl,
      hasPersonImageUrl: !!body.personImageUrl,
      personImageUrlLength: body.personImageUrl?.length || 0,
      productIdsCount: body.productIds?.length || 0,
      productIds: body.productIds,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
      sandbox: creditValidation.sandbox ?? false,
      remainingCredits: creditValidation.remainingBalance,
      hasScenePrompts: !!body.scenePrompts,
      hasOptions: !!body.options,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos de timeout

    let paineladmResponse: Response;
    try {
      console.log("[modelo-2/api/generate-looks] Enviando requisição para backend:", {
        url: `${backendUrl}/api/lojista/composicoes/generate`,
        hasPersonImageUrl: !!body.personImageUrl,
        productIdsCount: body.productIds?.length || 0,
        hasScenePrompts: !!body.scenePrompts,
      });
      
      paineladmResponse = await fetch(
        `${backendUrl}/api/lojista/composicoes/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      console.log("[modelo-2/api/generate-looks] Resposta recebida:", {
        status: paineladmResponse.status,
        statusText: paineladmResponse.statusText,
        ok: paineladmResponse.ok,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[modelo-2/api/generate-looks] Erro ao conectar com backend:", fetchError);
      
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return NextResponse.json(
          {
            error: "Timeout ao gerar composição. O processo está demorando mais que o esperado.",
            details: "Tente novamente em alguns instantes.",
          },
          { status: 504 }
        );
      }
      
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          {
            error: "Servidor backend não está disponível.",
            details: `Verifique se o backend está rodando em ${backendUrl}`,
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

    let data: any;
    try {
      const text = await paineladmResponse.text();
      if (!text) {
        console.error("[modelo-2/api/generate-looks] Resposta vazia do backend");
        return NextResponse.json(
          {
            error: "Resposta vazia do servidor",
            details: "O backend não retornou dados válidos.",
          },
          { status: 500 }
        );
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[modelo-2/api/generate-looks] Erro ao parsear resposta:", parseError);
      return NextResponse.json(
        {
          error: "Erro ao processar resposta do servidor",
          details: "A resposta do backend não está em formato válido.",
        },
        { status: 500 }
      );
    }

    if (!paineladmResponse.ok) {
      console.error("[modelo-2/api/generate-looks] Erro do backend:", {
        status: paineladmResponse.status,
        error: data.error,
        details: data.details,
        message: data.message,
      });
      
      return NextResponse.json(
        {
          error: data.error || data.message || "Erro ao gerar composição",
          details: data.details || `Status: ${paineladmResponse.status}`,
        },
        { status: paineladmResponse.status }
      );
    }

    console.log("[modelo-2/api/generate-looks] Sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
    });

    return NextResponse.json(data, { status: paineladmResponse.status });
  } catch (error: any) {
    console.error("[modelo-2/api/generate-looks] Erro inesperado no proxy:", error);
    console.error("[modelo-2/api/generate-looks] Stack:", error?.stack);
    console.error("[modelo-2/api/generate-looks] Tipo do erro:", typeof error);
    console.error("[modelo-2/api/generate-looks] Nome do erro:", error?.name);
    console.error("[modelo-2/api/generate-looks] Mensagem do erro:", error?.message);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error?.name || "UnknownError";
    
    // Mensagens mais específicas baseadas no tipo de erro
    let userFriendlyMessage = "Erro interno no proxy de geração";
    let details = process.env.NODE_ENV === 'development' ? errorMessage : "Erro ao processar requisição.";
    
    if (errorName === "AbortError" || errorMessage?.includes("timeout")) {
      userFriendlyMessage = "Timeout ao gerar composição. O processo está demorando mais que o esperado.";
      details = "Tente novamente em alguns instantes.";
    } else if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("fetch failed")) {
      userFriendlyMessage = "Servidor backend não está disponível.";
      details = `Verifique se o backend está rodando.`;
    } else if (errorMessage?.includes("JSON")) {
      userFriendlyMessage = "Erro ao processar resposta do servidor.";
      details = "A resposta do backend não está em formato válido.";
    } else if (errorMessage?.includes("429") || errorMessage?.includes("RESOURCE_EXHAUSTED")) {
      userFriendlyMessage = "Limite de requisições atingido.";
      details = "Por favor, aguarde alguns instantes e tente novamente.";
    }
    
    return NextResponse.json(
      {
        error: userFriendlyMessage,
        details: details,
        ...(process.env.NODE_ENV === 'development' && {
          originalError: errorMessage,
          errorName: errorName,
        }),
      },
      { status: 500 }
    );
  }
}

