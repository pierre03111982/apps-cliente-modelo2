import { reserveCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import type { Produto, GenerationJob, JobStatus } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

/**
 * REMIX - Usa a MESMA lógica do criar look
 * Diferenças apenas:
 * - scenePrompts com instruções de pose
 * - gerarNovoLook: true
 * - Não busca cenário no frontend (backend usa getSmartScenario)
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[remix] Erro ao parsear body:", parseError);
      return NextResponse.json(
        { error: "Corpo da requisição inválido", details: "JSON malformado" },
        { status: 400 }
      );
    }

    if (!body?.lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      );
    }

    if (!body?.original_photo_url) {
      return NextResponse.json(
        { error: "original_photo_url é obrigatório para remix" },
        { status: 400 }
      );
    }

    // Validar URL da foto
    const photoUrl = body.original_photo_url;
    const isValidUrl = 
      photoUrl.startsWith('http://') || 
      photoUrl.startsWith('https://') || 
      photoUrl.startsWith('blob:') || 
      photoUrl.startsWith('data:');
    
    if (!isValidUrl) {
      console.error("[remix] URL da foto original inválida:", photoUrl.substring(0, 100));
      return NextResponse.json(
        { error: "URL da foto original inválida", details: "A URL deve ser uma URL HTTP, blob ou data válida" },
        { status: 400 }
      );
    }

    // Rejeitar blob: URLs - frontend deve converter antes
    if (photoUrl.startsWith('blob:')) {
      return NextResponse.json(
        { error: "Foto inválida", details: "blob: URLs não podem ser processadas. Por favor, faça upload novamente da foto." },
        { status: 400 }
      );
    }

    // PHASE 27: Reservar crédito (MESMA LÓGICA DO CRIAR LOOK)
    let creditReservation;
    try {
      creditReservation = await reserveCredit(body.lojistaId);
    } catch (creditError: any) {
      console.error("[remix] Erro ao reservar créditos:", creditError);
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
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    if (!creditReservation.reservationId) {
      console.error("[remix] reservationId não retornado:", creditReservation);
      return NextResponse.json(
        { 
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: "Reserva de crédito inválida"
        },
        { status: 500 }
      );
    }

    // Validar produtos
    let productIds: string[] = [];
    let products: any[] = [];
    
    if (body?.products && Array.isArray(body.products) && body.products.length > 0) {
      products = body.products;
      productIds = products.map((p: any) => p.id || p.productId).filter(Boolean);
    } else if (body?.productIds && Array.isArray(body.productIds) && body.productIds.length > 0) {
      productIds = body.productIds;
    } else {
      return NextResponse.json(
        { error: "products ou productIds é obrigatório", details: "Pelo menos um produto deve ser selecionado" },
        { status: 400 }
      );
    }
    
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto válido encontrado" },
        { status: 400 }
      );
    }

    // Buscar produtos do Firestore (MESMA LÓGICA DO CRIAR LOOK)
    let db;
    try {
      db = getFirestoreAdmin();
    } catch (dbInitError: any) {
      console.error("[remix] Erro ao inicializar Firestore:", dbInitError);
      // Fazer rollback da reserva
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
      } catch (rollbackError) {
        console.error("[remix] Erro ao fazer rollback:", rollbackError);
      }
      return NextResponse.json(
        {
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: "Firestore Admin não disponível"
        },
        { status: 500 }
      );
    }

    // Buscar produtos se não foram fornecidos
    if (products.length === 0 && db) {
      try {
        const lojistaRef = db.collection("lojas").doc(body.lojistaId);
        const produtosSnapshot = await lojistaRef.collection("produtos").get();
        
        products = produtosSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => productIds.includes(p.id));
      } catch (fetchError) {
        console.warn("[remix] Erro ao buscar produtos:", fetchError);
      }
    }

    // REMIX: Gerar prompt de pose (ÚNICA DIFERENÇA DO CRIAR LOOK)
    // MASTER PROMPT: REFINAMENTO DE ESTILO - Poses elegantes e estáticas (sem movimento)
    const poses = [
      "Standing elegantly with straight back, relaxed shoulders, hands naturally at sides, confident high fashion editorial pose",
      "Leaning against wall casually with relaxed posture, hands visible, one leg crossed, confident casual stance, static elegant pose",
      "Standing with hands in pockets, relaxed body language, natural positioning, casual confident expression, stylish static pose",
      "Looking over shoulder with engaging expression, elegant angle, direct eye contact, fashion editorial pose, static confident stance",
      "Standing with one hand on hip, confident powerful pose, fashion model stance, strong presence, elegant static posture",
      "Standing with arms crossed, confident assertive pose, strong body language, professional demeanor, elegant static stance",
      "Standing with slight turn towards camera, elegant confident pose, engaging expression, professional photography style, static editorial pose",
      "Standing with weight on one leg, relaxed confident pose, natural body language, fashion model stance, elegant static posture",
      "Standing with hands on hips, powerful confident pose, strong presence, fashion editorial style, elegant static stance",
      "Standing with hands folded in front, elegant sophisticated pose, confident expression, high fashion editorial style, static professional stance"
    ];

    const randomPose = poses[Math.floor(Math.random() * poses.length)];
    const randomSeed = Math.floor(Math.random() * 999999);

    // Detectar gênero
    const gender = body.gender || 
      (products.find((p: any) => p.genero)?.genero) ||
      (products.find((p: any) => p.categoria?.toLowerCase().includes("feminino")) ? "feminino" : 
       products.find((p: any) => p.categoria?.toLowerCase().includes("masculino")) ? "masculino" : "");
    
    const subjectDescription = gender 
      ? (gender.toLowerCase().includes("feminino") || gender.toLowerCase().includes("feminine") 
          ? "A stylish woman" 
          : "A stylish man")
      : "A stylish person";

    // Combinar descrições de produtos
    const productDescriptions = products.length > 0
      ? products.map((p: any) => p.descricao || p.nome || p.categoria || "product")
      : productIds.map(id => `product ${id}`);
    const productPrompt = productDescriptions.join(" AND ");

    // Detectar calçados para Smart Framing
    const allText = products.map(p => `${p?.categoria || ""} ${p?.nome || ""}`).join(" ").toLowerCase();
    const hasBeach = allText.match(/biqu|bikini|maiô|maio|sunga|praia|beachwear|saída de praia|swimwear|moda praia|banho|nado|piscina|swim|beach/i);
    const hasShoesInProducts = allText.match(/calçado|calcado|sapato|tênis|tenis|sneaker|shoe|footwear|bota|boot/i);
    
    let beachFootwearPrompt = "";
    if (hasBeach && !hasShoesInProducts) {
      beachFootwearPrompt = " barefoot or wearing simple flip-flops/sandals, NO boots, NO sneakers, NO closed shoes";
    }

    const hasShoes = products.some((p: any) => {
      const cat = (p.categoria || "").toLowerCase();
      return cat.includes("calçado") || cat.includes("calcado") || 
             cat.includes("sapato") || cat.includes("tênis") || 
             cat.includes("tenis") || cat.includes("shoe") || 
             cat.includes("footwear");
    });

    // Gerar prompt de remix
    // MASTER PROMPT: REFINAMENTO DE ESTILO - Poses elegantes e estáticas
    const remixPrompt = `${subjectDescription} ${randomPose} wearing ${productPrompt}${beachFootwearPrompt}, harmonious outfit combination. 

⚠️ CRITICAL REMIX INSTRUCTION: This is a REMIX generation. The scene MUST be DRAMATICALLY DIFFERENT from any previous generation. 
- POSE: The person must be in a ${randomPose.toLowerCase()} position, which is DIFFERENT from the original photo's pose. ⚠️ CRITICAL: The person MUST face the camera or at MOST slightly to the side (3/4 view). NEVER from behind (back view). The face and frontal body MUST be visible. **NO WALKING or RUNNING** - elegant, static, confident pose only.
- LIGHTING: Adapt lighting to match the new scene context with warm, natural tones.
- CAMERA ANGLE: Use a different camera angle or perspective to emphasize the new pose and scene.

Photorealistic, 8k, highly detailed, professional fashion photography, distinct visual style. The final image must look like a COMPLETELY NEW PHOTOSHOOT in a DIFFERENT LOCATION with a DIFFERENT ELEGANT STATIC POSE, while maintaining the person's exact identity and the products' fidelity.`;

    // IMPORTANTE: REMIX NÃO busca cenário no frontend
    // Backend usará getSmartScenario para variar o cenário
    console.log("[remix] REMIX - NÃO buscando cenário no frontend (backend vai variar):", {
      totalProdutos: products.length,
      note: "Backend usará getSmartScenario para gerar novo cenário diferente",
    });

    // PHASE 27: Criar Job assíncrono (MESMA LÓGICA DO CRIAR LOOK)
    if (!db) {
      console.error("[remix] ERRO CRÍTICO - db não está disponível");
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
      } catch (rollbackError) {
        console.error("[remix] Erro ao fazer rollback:", rollbackError);
      }
      return NextResponse.json(
        {
          error: "Erro interno do servidor. Tente novamente em alguns instantes.",
          details: "Firestore Admin não disponível"
        },
        { status: 500 }
      );
    }

    const jobsRef = db.collection("generation_jobs");
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Preparar dados do Job (MESMA ESTRUTURA DO CRIAR LOOK)
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
      personImageUrl: photoUrl, // Usar original_photo_url diretamente
      productIds: productIds,
      retryCount: 0,
      maxRetries: 3,
      scenePrompts: [remixPrompt], // REMIX: Prompt de pose
      options: {
        ...body.options,
        quality: body.options?.quality || "high",
        skipWatermark: body.options?.skipWatermark !== false,
        lookType: "creative",
        productCategory: hasShoes ? "Calçados" : undefined,
        seed: randomSeed,
        gerarNovoLook: true, // CRÍTICO: Sempre ativar no remix
        original_photo_url: photoUrl,
        sceneInstructions: "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
        // REMIX: NÃO enviar scenarioImageUrl - backend usará getSmartScenario
        scenarioImageUrl: undefined,
      },
    };

    try {
      // Sanitizar dados do Job (MESMA LÓGICA DO CRIAR LOOK)
      const sanitizedJobData: any = {
        lojistaId: jobData.lojistaId,
        status: jobData.status,
        reservationId: jobData.reservationId,
        createdAt: jobData.createdAt,
        personImageUrl: jobData.personImageUrl,
        productIds: jobData.productIds,
        retryCount: jobData.retryCount || 0,
        maxRetries: jobData.maxRetries || 3,
      };
      
      if (jobData.customerId !== undefined && jobData.customerId !== null) sanitizedJobData.customerId = jobData.customerId;
      if (jobData.customerName !== undefined && jobData.customerName !== null) sanitizedJobData.customerName = jobData.customerName;
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
      
      await jobsRef.doc(jobId).set(sanitizedJobData);
      
      console.log("[remix] Job criado com sucesso:", {
        jobId,
        reservationId: creditReservation.reservationId,
        status: "PENDING",
      });

      // Disparar processamento assíncrono (MESMA LÓGICA DO CRIAR LOOK)
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
      
      console.log("[remix] 🔍 Backend URL detectado:", {
        backendUrl,
        host: request.headers.get('host'),
        hasEnvVar: !!(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL),
        envBackend: process.env.NEXT_PUBLIC_BACKEND_URL,
        envPaineladm: process.env.NEXT_PUBLIC_PAINELADM_URL,
      });
      
      // Disparar processamento assíncrono com logs detalhados
      console.log("[remix] 🚀 Disparando processamento assíncrono:", {
        backendUrl,
        jobId,
        endpoint: `${backendUrl}/api/internal/process-job`,
      });
      
      fetch(`${backendUrl}/api/internal/process-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
        body: JSON.stringify({ jobId }),
      })
      .then((response) => {
        console.log("[remix] ✅ Processamento disparado:", {
          status: response.status,
          statusText: response.statusText,
          jobId,
        });
      })
      .catch((error) => {
        console.error("[remix] ❌ Erro ao disparar processamento:", {
          error: error?.message,
          stack: error?.stack?.substring(0, 500),
          backendUrl,
          jobId,
          note: "Job será processado pelo cron job automaticamente",
        });
      });
      
      // Disparar trigger como fallback
      fetch(`${backendUrl}/api/triggers/process-pending-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
        body: JSON.stringify({ jobId, limit: 1 }),
      })
      .then(() => {
        console.log("[remix] ✅ Trigger fallback disparado:", jobId);
      })
      .catch((error) => {
        console.warn("[remix] ⚠️ Trigger fallback não disponível (normal em produção):", {
          error: error?.message,
          note: "Cron job processará o job automaticamente",
        });
      });

      // Retornar 202 com jobId (MESMA LÓGICA DO CRIAR LOOK)
      return NextResponse.json({
        success: true,
        jobId,
        reservationId: creditReservation.reservationId,
        status: "PENDING",
        message: "Geração iniciada. Use o jobId para consultar o status.",
      }, { status: 202 });
      
    } catch (jobError: any) {
      console.error("[remix] Erro ao criar Job:", jobError);
      
      // Fazer rollback da reserva
      try {
        const { rollbackCredit } = await import("@/lib/financials");
        await rollbackCredit(body.lojistaId, creditReservation.reservationId);
      } catch (rollbackError) {
        console.error("[remix] Erro ao fazer rollback:", rollbackError);
      }
      
      return NextResponse.json(
        {
          error: "Erro ao criar job de geração",
          details: jobError?.message || "Erro interno ao criar job.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[remix] Erro inesperado:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error?.name || "UnknownError";
    
    let userFriendlyMessage = "Erro ao gerar composição";
    let details = "Erro ao processar requisição. Tente novamente em alguns instantes.";
    
    if (errorName === "AbortError" || errorMessage?.includes("timeout")) {
      details = "O processo está demorando mais que o esperado. Tente novamente em alguns instantes.";
    } else if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("fetch failed")) {
      details = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    }
    
    return NextResponse.json(
      {
        error: userFriendlyMessage,
        details: details,
      },
      { status: 500 }
    );
  }
}
