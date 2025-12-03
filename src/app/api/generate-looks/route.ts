import { reserveCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
// REMOVIDO: findScenarioByProductTags - backend sempre usa getSmartScenario
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
    
    // IMPORTANTE: NÃO buscar cenário no frontend
    // Backend sempre usa getSmartScenario que aplica todas as regras (Bikini Law, Gym Integrity, etc.)
    console.log("[modelo-2/api/generate-looks] Backend usará getSmartScenario para determinar cenário:", {
      totalProdutos: products.length,
      note: "Cenário será determinado pelo backend usando getSmartScenario",
    });
    
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
      options: (() => {
        const opts: any = {
          ...body.options,
          sceneInstructions: body.sceneInstructions || "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
          original_photo_url: finalPersonImageUrl,
        };
        // IMPORTANTE: NÃO incluir scenarioImageUrl (sempre undefined) - backend sempre usa getSmartScenario
        // Remover explicitamente para não enviar undefined ao Firestore
        if (opts.scenarioImageUrl !== undefined) delete opts.scenarioImageUrl;
        return opts;
      })(),
    };

    try {
      // Validações finais antes de criar job
      if (!finalPersonImageUrl || finalPersonImageUrl.trim() === "") {
        throw new Error("personImageUrl está vazio ou inválido");
      }
      
      if (!body.productIds || !Array.isArray(body.productIds) || body.productIds.length === 0) {
        throw new Error("productIds está vazio ou inválido");
      }
      
      if (!creditReservation.reservationId || creditReservation.reservationId.trim() === "") {
        throw new Error("reservationId está vazio ou inválido");
      }
      
      // Criar Job no Firestore
      console.log("[modelo-2/api/generate-looks] PHASE 27: Tentando criar job no Firestore...", {
        jobId,
        lojistaId: body.lojistaId,
        productIdsCount: body.productIds?.length || 0,
        hasDb: !!db,
        hasJobsRef: !!jobsRef,
        personImageUrlLength: finalPersonImageUrl.length,
        reservationId: creditReservation.reservationId,
      });
      
      // Validar que jobData não contém valores inválidos
      // Remover campos undefined e garantir tipos corretos
      const sanitizedJobData: any = {
        lojistaId: jobData.lojistaId,
        status: jobData.status,
        reservationId: jobData.reservationId,
        createdAt: jobData.createdAt, // Já é FieldValue.serverTimestamp()
        personImageUrl: jobData.personImageUrl,
        productIds: jobData.productIds,
        retryCount: jobData.retryCount || 0,
        maxRetries: jobData.maxRetries || 3,
      };
      
      // Adicionar campos opcionais apenas se existirem e não forem undefined
      if (jobData.customerId !== undefined && jobData.customerId !== null) sanitizedJobData.customerId = jobData.customerId;
      if (jobData.customerName !== undefined && jobData.customerName !== null) sanitizedJobData.customerName = jobData.customerName;
      if (jobData.productUrl !== undefined && jobData.productUrl !== null) sanitizedJobData.productUrl = jobData.productUrl;
      if (jobData.scenePrompts !== undefined && jobData.scenePrompts !== null) sanitizedJobData.scenePrompts = jobData.scenePrompts;
      
      // Sanitizar options: remover undefined e garantir que não há valores inválidos
      if (jobData.options !== undefined && jobData.options !== null) {
        const sanitizedOptions: any = {};
        for (const [key, value] of Object.entries(jobData.options)) {
          // Ignorar undefined e null
          if (value !== undefined && value !== null) {
            // Se for objeto, fazer deep sanitize
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
              const sanitizedValue: any = {};
              for (const [subKey, subValue] of Object.entries(value)) {
                if (subValue !== undefined && subValue !== null) {
                  sanitizedValue[subKey] = subValue;
                }
              }
              if (Object.keys(sanitizedValue).length > 0) {
                sanitizedOptions[key] = sanitizedValue;
              }
            } else {
              sanitizedOptions[key] = value;
            }
          }
        }
        if (Object.keys(sanitizedOptions).length > 0) {
          sanitizedJobData.options = sanitizedOptions;
        }
      }
      
      console.log("[modelo-2/api/generate-looks] PHASE 27: Dados do Job preparados:", {
        jobId,
        lojistaId: sanitizedJobData.lojistaId,
        status: sanitizedJobData.status,
        reservationId: sanitizedJobData.reservationId,
        productIdsCount: sanitizedJobData.productIds?.length || 0,
        hasOptions: !!sanitizedJobData.options,
        optionsKeys: sanitizedJobData.options ? Object.keys(sanitizedJobData.options) : [],
      });
      
      console.log("[modelo-2/api/generate-looks] PHASE 27: Tentando salvar no Firestore...");
      await jobsRef.doc(jobId).set(sanitizedJobData);
      console.log("[modelo-2/api/generate-looks] PHASE 27: Job salvo no Firestore com sucesso");
      
      console.log("[modelo-2/api/generate-looks] PHASE 27: Job criado com sucesso:", {
        jobId,
        reservationId: creditReservation.reservationId,
        status: "PENDING",
      });

      // Disparar processamento assíncrono (não aguardar)
      // FIX PRODUÇÃO: Detectar URL do backend corretamente em produção
      let backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_PAINELADM_URL;
      
      // Se não tiver variável de ambiente, tentar detectar automaticamente em produção
      if (!backendUrl || backendUrl === DEFAULT_LOCAL_BACKEND) {
        const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        
        // Se estiver em produção (não localhost), usar o mesmo domínio do frontend
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          // Tentar detectar o domínio do backend baseado no domínio do frontend
          // Exemplo: app2.experimenteai.com.br -> paineladm.experimenteai.com.br
          if (host.includes('app2.experimenteai.com.br')) {
            backendUrl = 'https://paineladm.experimenteai.com.br';
          } else if (host.includes('app.experimenteai.com.br')) {
            backendUrl = 'https://paineladm.experimenteai.com.br';
          } else {
            // Fallback: usar o mesmo domínio com porta padrão (se necessário)
            backendUrl = `${protocol}://${host}`;
          }
        } else {
          // Local: usar localhost
          backendUrl = DEFAULT_LOCAL_BACKEND;
        }
      }
      
      console.log("[modelo-2/api/generate-looks] 🔍 Backend URL detectado:", {
        backendUrl,
        host: request.headers.get('host'),
        hasEnvVar: !!(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL),
        envBackend: process.env.NEXT_PUBLIC_BACKEND_URL,
        envPaineladm: process.env.NEXT_PUBLIC_PAINELADM_URL,
      });
      
      // PHASE 27: Disparar processamento assíncrono imediatamente
      // Tentar chamar o endpoint interno primeiro, se falhar, o cron processará depois
      fetch(`${backendUrl}/api/internal/process-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Request": "true", // Header para identificar requisições internas
        },
        body: JSON.stringify({ jobId }),
        // Não aguardar resposta (fire and forget)
      }).catch((error) => {
        console.error("[modelo-2/api/generate-looks] Erro ao disparar processamento assíncrono imediato:", error);
        console.log("[modelo-2/api/generate-looks] Job será processado pelo cron job automaticamente");
        // Não falhar a requisição se o disparo falhar - o Job será processado pelo cron
      });
      
      // PHASE 27: Também disparar o trigger de processamento pendente como fallback
      // Isso garante que Jobs sejam processados mesmo se o endpoint interno falhar
      fetch(`${backendUrl}/api/triggers/process-pending-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
        body: JSON.stringify({ jobId, limit: 1 }),
      }).catch((error) => {
        // Silenciosamente ignorar - o cron processará depois
        console.log("[modelo-2/api/generate-looks] Trigger fallback não disponível, cron processará depois");
      });

      // Retornar jobId imediatamente
      return NextResponse.json({
        jobId,
        status: "PENDING",
        message: "Geração iniciada. Use o jobId para verificar o status.",
        reservationId: creditReservation.reservationId,
      }, { status: 202 }); // 202 Accepted - requisição aceita mas ainda processando
    } catch (jobError: any) {
      console.error("[modelo-2/api/generate-looks] PHASE 27: ❌ ERRO ao criar Job:", {
        message: jobError?.message,
        name: jobError?.name,
        code: jobError?.code,
        stack: jobError?.stack?.substring(0, 500),
        type: typeof jobError,
      });
      
      // Tentar identificar o tipo de erro
      if (jobError?.code === 'permission-denied') {
        console.error("[modelo-2/api/generate-looks] PHASE 27: Erro de permissão do Firestore");
      } else if (jobError?.code === 'invalid-argument') {
        console.error("[modelo-2/api/generate-looks] PHASE 27: Argumento inválido no Firestore");
      } else if (jobError?.message?.includes('FieldValue')) {
        console.error("[modelo-2/api/generate-looks] PHASE 27: Erro relacionado ao FieldValue.serverTimestamp()");
      }
      
      console.error("[modelo-2/api/generate-looks] PHASE 27: Dados que causaram erro:", {
        jobId,
        lojistaId: jobData.lojistaId,
        hasPersonImageUrl: !!jobData.personImageUrl,
        personImageUrlLength: jobData.personImageUrl?.length || 0,
        productIdsCount: jobData.productIds?.length || 0,
        hasReservationId: !!jobData.reservationId,
        hasOptions: !!jobData.options,
      });
      
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

