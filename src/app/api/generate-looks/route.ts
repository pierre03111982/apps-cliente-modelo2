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

    // PHASE 13: Source of Truth - Sempre usar original_photo_url se fornecido
    // Se original_photo_url não for fornecido, usar personImageUrl como fallback
    const originalPhotoUrl = body.original_photo_url || body.personImageUrl;
    
    // Validar campos obrigatórios
    if (!originalPhotoUrl) {
      return NextResponse.json(
        { error: "original_photo_url ou personImageUrl é obrigatório", details: "Foto original da pessoa não fornecida" },
        { status: 400 }
      );
    }

    if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { error: "productIds é obrigatório", details: "Pelo menos um produto deve ser selecionado" },
        { status: 400 }
      );
    }
    
    // PHASE 13: Garantir que personImageUrl sempre seja a foto ORIGINAL
    // Ignorar qualquer "previous_image" ou imagem gerada anteriormente
    const finalPersonImageUrl = originalPhotoUrl;
    
    console.log("[modelo-2/api/generate-looks] PHASE 13: Source of Truth - Usando foto ORIGINAL:", {
      original_photo_url: body.original_photo_url ? "FORNECIDO" : "NÃO FORNECIDO",
      personImageUrl: body.personImageUrl ? "FORNECIDO" : "NÃO FORNECIDO",
      finalPersonImageUrl: finalPersonImageUrl.substring(0, 80) + "...",
      ignorandoPreviousImage: body.previous_image ? "SIM (ignorado)" : "N/A",
    });

    console.log("[modelo-2/api/generate-looks] PHASE 13: Iniciando requisição com foto ORIGINAL:", {
      backendUrl,
      hasOriginalPhoto: !!finalPersonImageUrl,
      originalPhotoUrl: finalPersonImageUrl.substring(0, 80) + "...",
      productIdsCount: body.productIds?.length || 0,
      productIds: body.productIds,
      lojistaId: body.lojistaId,
      customerId: body.customerId,
      sandbox: creditValidation.sandbox ?? false,
      remainingCredits: creditValidation.remainingBalance,
      hasScenePrompts: !!body.scenePrompts,
      hasOptions: !!body.options,
    });

    // PHASE 25: Aumentar timeout para mobile (pode ter conexão mais lenta)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutos de timeout

    let paineladmResponse: Response;
    try {
      // PHASE 13: Construir payload garantindo que personImageUrl seja sempre a foto ORIGINAL
      const backendPayload = {
        ...body,
        personImageUrl: finalPersonImageUrl, // PHASE 13: Sempre usar foto original
        original_photo_url: finalPersonImageUrl, // PHASE 13: Também enviar como original_photo_url para garantir
        // PHASE 13: Remover qualquer referência a imagens geradas anteriormente
        previous_image: undefined,
        generated_image: undefined,
      };
      
      console.log("[modelo-2/api/generate-looks] PHASE 13: Enviando requisição para backend:", {
        url: `${backendUrl}/api/lojista/composicoes/generate`,
        hasOriginalPhoto: !!finalPersonImageUrl,
        originalPhotoUrl: finalPersonImageUrl.substring(0, 80) + "...",
        productIdsCount: body.productIds?.length || 0,
        hasScenePrompts: !!body.scenePrompts,
        payloadPersonImageUrl: backendPayload.personImageUrl.substring(0, 80) + "...",
      });
      
      paineladmResponse = await fetch(
        `${backendUrl}/api/lojista/composicoes/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendPayload),
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
      
      // PHASE 25: Melhor tratamento de erros de rede no mobile
      if (fetchError.message?.includes('ECONNREFUSED') || 
          fetchError.message?.includes('fetch failed') ||
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('NetworkError') ||
          fetchError.message?.includes('Network request failed')) {
        return NextResponse.json(
          {
            error: "Erro de conexão. Verifique sua internet e tente novamente.",
            details: "Não foi possível conectar com o servidor de processamento.",
          },
          { status: 503 }
        );
      }
      
      // PHASE 25: Re-throw com mensagem mais amigável
      return NextResponse.json(
        {
          error: "Erro ao processar foto",
          details: fetchError.message || "Erro desconhecido ao conectar com o servidor.",
        },
        { status: 500 }
      );
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

