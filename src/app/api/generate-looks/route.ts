import { reserveCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { findScenarioByProductTags } from "@/lib/scenarioMatcher";
import type { Produto, GenerationJob, JobStatus } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

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

    // PHASE 27: Reservar crédito (não debitar ainda)
    let creditReservation;
    try {
      creditReservation = await reserveCredit(body.lojistaId);
    } catch (creditError: any) {
      console.error("[modelo-2/api/generate-looks] Erro ao reservar créditos:", creditError);
      return NextResponse.json(
        { 
          error: "Erro ao reservar créditos", 
          details: creditError?.message || "Erro interno na reserva de créditos" 
        },
        { status: 500 }
      );
    }
    if (!creditReservation.success) {
      const errorMessage = creditReservation.message || "Créditos insuficientes";
      const statusCode = creditReservation.status || 402;
      console.warn("[modelo-2/api/generate-looks] Créditos bloqueados:", {
        lojistaId: body.lojistaId,
        message: errorMessage,
        status: statusCode,
      });
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    // Validar que reservationId existe
    if (!creditReservation.reservationId) {
      console.error("[modelo-2/api/generate-looks] reservationId não retornado pela reserva:", creditReservation);
      return NextResponse.json(
        { 
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: "Reserva de crédito inválida"
        },
        { status: 500 }
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
    let db;
    
    // Tentar obter db uma única vez, com tratamento de erro adequado
    try {
      console.log("[modelo-2/api/generate-looks] PHASE 26: Tentando obter Firestore Admin...");
      db = getFirestoreAdmin();
      console.log("[modelo-2/api/generate-looks] PHASE 26: Firestore Admin obtido com sucesso:", { dbExists: !!db });
    } catch (dbInitError: any) {
      console.error("[modelo-2/api/generate-looks] PHASE 26: Erro ao inicializar Firestore Admin:", dbInitError);
      console.error("[modelo-2/api/generate-looks] PHASE 26: Mensagem do erro:", dbInitError?.message);
      console.error("[modelo-2/api/generate-looks] PHASE 26: Stack do erro:", dbInitError?.stack);
      
      // Fazer rollback da reserva
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
      } catch (rollbackError) {
        console.error("[modelo-2/api/generate-looks] Erro ao fazer rollback:", rollbackError);
      }
      
      return NextResponse.json(
        {
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: dbInitError?.message?.includes("não configurada") 
            ? "Configuração do Firebase incompleta" 
            : "Serviço temporariamente indisponível"
        },
        { status: 500 }
      );
    }
    
    // Se db foi obtido, buscar produtos
    if (db) {
      try {
        console.log("[modelo-2/api/generate-looks] PHASE 26: Buscando produtos do Firestore...");
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
      } catch (productError: any) {
        console.warn("[modelo-2/api/generate-looks] PHASE 26: Erro ao buscar produtos:", productError.message);
        console.warn("[modelo-2/api/generate-looks] PHASE 26: Stack do erro:", productError?.stack);
        // Continuar mesmo sem produtos - fallback será usado
      }
    } else {
      console.warn("[modelo-2/api/generate-looks] PHASE 26: db é null/undefined, pulando busca de produtos");
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
      finalPersonImageUrl: finalPersonImageUrl ? (finalPersonImageUrl.length > 80 ? finalPersonImageUrl.substring(0, 80) + "..." : finalPersonImageUrl) : "N/A",
      ignorandoPreviousImage: body.previous_image ? "SIM (ignorado)" : "N/A",
    });

    // PHASE 27: Criar Job assíncrono em vez de processar síncronamente
    // db já foi obtido e validado anteriormente, então deve estar disponível aqui
    if (!db) {
      console.error("[modelo-2/api/generate-looks] PHASE 27: ERRO CRÍTICO - db não está disponível");
      // Fazer rollback da reserva
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
      } catch (rollbackError) {
        console.error("[modelo-2/api/generate-looks] Erro ao fazer rollback:", rollbackError);
      }
      return NextResponse.json(
        {
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: "Firestore Admin não disponível"
        },
        { status: 500 }
      );
    }

    console.log("[modelo-2/api/generate-looks] PHASE 27: Criando referência para collection 'generation_jobs'...");
    const jobsRef = db.collection("generation_jobs");
    console.log("[modelo-2/api/generate-looks] PHASE 27: Referência para collection criada com sucesso");
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Preparar dados do Job
    // Usar Partial para permitir campos opcionais e evitar erros de tipo
    const jobData: Partial<GenerationJob> & {
      lojistaId: string;
      status: JobStatus;
      reservationId: string;
      createdAt: any;
      personImageUrl: string;
      productIds: string[];
      retryCount: number;
      maxRetries: number;
    } = {
      lojistaId: body.lojistaId,
      customerId: body.customerId || undefined,
      customerName: body.customerName || undefined,
      status: "PENDING" as JobStatus,
      reservationId: creditReservation.reservationId,
      createdAt: FieldValue.serverTimestamp() as any,
      personImageUrl: finalPersonImageUrl,
      productIds: body.productIds,
      productUrl: body.productUrl || undefined,
      scenePrompts: body.scenePrompts || undefined,
      retryCount: 0, // PHASE 27: Inicializar contador de retries
      maxRetries: 3, // PHASE 27: Máximo de 3 tentativas
      options: {
        ...body.options,
        // PHASE 26: Adicionar dados do cenário
        ...(scenarioData && {
          scenarioImageUrl: scenarioData.imageUrl,
          scenarioLightingPrompt: scenarioData.lightingPrompt,
          scenarioCategory: scenarioData.category,
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
        sceneInstructions: body.sceneInstructions || "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
        original_photo_url: finalPersonImageUrl,
      },
    };

    try {
      // Criar Job no Firestore
      console.log("[modelo-2/api/generate-looks] PHASE 27: Tentando criar job no Firestore...", {
        jobId,
        lojistaId: body.lojistaId,
        productIdsCount: body.productIds?.length || 0,
        hasDb: !!db,
        hasJobsRef: !!jobsRef,
      });
      
      // Validar que jobData não contém valores inválidos
      const sanitizedJobData = {
        ...jobData,
        // Garantir que todos os valores são serializáveis
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      console.log("[modelo-2/api/generate-looks] PHASE 27: Dados do Job preparados:", {
        jobId,
        lojistaId: sanitizedJobData.lojistaId,
        status: sanitizedJobData.status,
        reservationId: sanitizedJobData.reservationId,
        productIdsCount: sanitizedJobData.productIds?.length || 0,
      });
      
      await jobsRef.doc(jobId).set(sanitizedJobData);
      
      console.log("[modelo-2/api/generate-looks] PHASE 27: Job criado com sucesso:", {
        jobId,
        reservationId: creditReservation.reservationId,
        status: "PENDING",
      });

      // Disparar processamento assíncrono (não aguardar)
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_PAINELADM_URL ||
        DEFAULT_LOCAL_BACKEND;
      
      // Chamar endpoint interno de processamento (não aguardar resposta)
      fetch(`${backendUrl}/api/internal/process-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Request": "true", // Header para identificar requisições internas
        },
        body: JSON.stringify({ jobId }),
      }).catch((error) => {
        console.error("[modelo-2/api/generate-looks] Erro ao disparar processamento assíncrono:", error);
        // Não falhar a requisição se o disparo falhar - o Job pode ser processado depois
      });

      // Retornar jobId imediatamente
      return NextResponse.json({
        jobId,
        status: "PENDING",
        message: "Geração iniciada. Use o jobId para verificar o status.",
        reservationId: creditReservation.reservationId,
      }, { status: 202 }); // 202 Accepted - requisição aceita mas ainda processando
    } catch (jobError: any) {
      console.error("[modelo-2/api/generate-looks] PHASE 27: Erro ao criar Job:", jobError);
      console.error("[modelo-2/api/generate-looks] PHASE 27: Mensagem do erro:", jobError?.message);
      console.error("[modelo-2/api/generate-looks] PHASE 27: Stack do erro:", jobError?.stack);
      console.error("[modelo-2/api/generate-looks] PHASE 27: Nome do erro:", jobError?.name);
      console.error("[modelo-2/api/generate-looks] PHASE 27: Tipo do erro:", typeof jobError);
      console.error("[modelo-2/api/generate-looks] PHASE 27: Erro completo (stringify):", JSON.stringify(jobError, Object.getOwnPropertyNames(jobError)));
      console.error("[modelo-2/api/generate-looks] PHASE 27: jobData que causou erro:", JSON.stringify(jobData, null, 2));
      
      // Se falhar ao criar Job, fazer rollback da reserva
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
        console.log("[modelo-2/api/generate-looks] PHASE 27: Rollback da reserva realizado com sucesso");
      } catch (rollbackError) {
        console.error("[modelo-2/api/generate-looks] PHASE 27: Erro ao fazer rollback da reserva:", rollbackError);
      }
      
      return NextResponse.json(
        {
          error: "Erro ao criar job de geração",
          details: jobError?.message || "Erro interno ao criar job.",
          ...(process.env.NODE_ENV === 'development' && {
            errorName: jobError?.name,
            errorStack: jobError?.stack,
          }),
        },
        { status: 500 }
      );
    }
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

