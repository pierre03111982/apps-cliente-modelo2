import { consumeGenerationCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { findScenarioByProductTags } from "@/lib/scenarioMatcher";
import type { Produto } from "@/lib/types";

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
    
    // PHASE 26: Buscar produtos do Firestore para extrair tags
    let products: Produto[] = [];
    try {
      const db = getFirestoreAdmin();
      if (db) {
        const lojistaRef = db.collection("lojas").doc(body.lojistaId);
        const produtosSnapshot = await lojistaRef.collection("produtos").get();
        
        products = produtosSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              nome: data.nome || "",
              categoria: data.categoria || null,
              preco: data.preco || null,
              imagemUrl: data.imagemUrl || null,
              obs: data.obs || null,
            } as Produto;
          })
          .filter((p: Produto) => body.productIds.includes(p.id));
        
        console.log("[modelo-2/api/generate-looks] PHASE 26: Produtos encontrados:", products.length);
      }
    } catch (productError: any) {
      console.warn("[modelo-2/api/generate-looks] PHASE 26: Erro ao buscar produtos:", productError.message);
      // Continuar mesmo sem produtos - fallback será usado
    }
    
    // PHASE 26: Buscar cenário baseado em tags dos produtos
    // IMPORTANTE: Quando há múltiplos produtos, usar o cenário do PRIMEIRO produto adicionado
    let scenarioData: { imageUrl: string; lightingPrompt: string; category: string } | null = null;
    if (products.length > 0) {
      try {
        // Se há múltiplos produtos, usar apenas o primeiro para buscar o cenário
        const productsForScenario = products.length > 1 ? [products[0]] : products;
        
        console.log("[modelo-2/api/generate-looks] PHASE 26: Buscando cenário:", {
          totalProdutos: products.length,
          usandoPrimeiroProduto: products.length > 1,
          primeiroProduto: products[0]?.nome || "N/A",
        });
        
        scenarioData = await findScenarioByProductTags(productsForScenario);
        if (scenarioData) {
          console.log("[modelo-2/api/generate-looks] PHASE 26: Cenário encontrado por tags:", {
            category: scenarioData.category,
            hasImageUrl: !!scenarioData.imageUrl,
            lightingPrompt: scenarioData.lightingPrompt.substring(0, 50) + "...",
            baseadoNoPrimeiroProduto: products.length > 1,
          });
        }
      } catch (scenarioError: any) {
        console.warn("[modelo-2/api/generate-looks] PHASE 26: Erro ao buscar cenário:", scenarioError.message);
        // Continuar sem cenário - backend usará prompt genérico
      }
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
        // PHASE 25: Adicionar instrução para evitar cenários noturnos se não foi fornecida
        sceneInstructions: body.sceneInstructions || "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
        // PHASE 26: Adicionar URL do cenário e prompt de iluminação se encontrado
        ...(scenarioData && {
          scenarioImageUrl: scenarioData.imageUrl,
          scenarioLightingPrompt: scenarioData.lightingPrompt,
          scenarioCategory: scenarioData.category,
          // PHASE 26: Instrução crítica para usar a imagem como input visual
          scenarioInstructions: `CRITICAL: Use the provided scenarioImageUrl as the BACKGROUND IMAGE input for Gemini Vision API. 
          - This image should be the 3rd input image (after person photo and product images)
          - DO NOT generate or create a new background - USE the provided scenario image as-is
          - Focus ALL AI processing power on:
            1. Maintaining exact facial identity and features from the person photo
            2. Ensuring products match exactly (colors, textures, fit)
            3. Seamlessly compositing the person and products onto the provided background
          - The background image is already perfect - just use it directly
          - Lighting and scene context: ${scenarioData.lightingPrompt}`,
        }),
      };
      
      console.log("[modelo-2/api/generate-looks] PHASE 13/26: Enviando requisição para backend:", {
        url: `${backendUrl}/api/lojista/composicoes/generate`,
        hasOriginalPhoto: !!finalPersonImageUrl,
        originalPhotoUrl: finalPersonImageUrl.substring(0, 80) + "...",
        productIdsCount: body.productIds?.length || 0,
        hasScenePrompts: !!body.scenePrompts,
        payloadPersonImageUrl: backendPayload.personImageUrl.substring(0, 80) + "...",
        hasScenarioImage: !!scenarioData?.imageUrl,
        scenarioCategory: scenarioData?.category || "N/A",
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

