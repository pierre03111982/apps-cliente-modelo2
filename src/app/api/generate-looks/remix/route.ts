import { consumeGenerationCredit } from "@/lib/financials";
import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

/**
 * PHASE 11: REMIX ENGINE - Scenario/Pose Shuffler
 * 
 * Gera uma variação do look usando a foto original + mesmo produto,
 * mas mudando o cenário e a pose.
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

    // Validar se a URL da foto original é válida
    // No mobile, URLs podem ser blob: ou data: além de http:// e https://
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
    
    // Se for blob: ou data:, precisamos converter para uma URL HTTP antes de enviar ao backend
    // O backend espera URLs HTTP válidas
    let finalPhotoUrl = photoUrl;
    
    if (photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) {
      console.warn("[remix] URL blob/data detectada - o backend pode precisar de conversão:", photoUrl.substring(0, 100));
      // Para blob: e data:, vamos tentar usar como está e deixar o backend lidar
      // Se o backend não aceitar, ele retornará um erro específico
      finalPhotoUrl = photoUrl;
    }

    // PHASE 11 FIX: Aceitar products[] array OU productIds[]
    let productIds: string[] = [];
    let products: any[] = [];
    
    if (body?.products && Array.isArray(body.products) && body.products.length > 0) {
      // Se products[] foi enviado, usar diretamente
      products = body.products;
      productIds = products.map((p: any) => p.id || p.productId).filter(Boolean);
    } else if (body?.productIds && Array.isArray(body.productIds) && body.productIds.length > 0) {
      // Fallback: se apenas productIds foi enviado, buscar produtos do Firestore
      productIds = body.productIds;
      try {
        const db = getFirestoreAdmin();
        const lojistaRef = db.collection("lojas").doc(body.lojistaId);
        const produtosSnapshot = await lojistaRef.collection("produtos").get();
        
        products = produtosSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => productIds.includes(p.id));
      } catch (fetchError) {
        console.warn("[remix] Erro ao buscar produtos do Firestore:", fetchError);
        // Continuar com productIds mesmo sem descrições
      }
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

    // Validar créditos
    let creditValidation;
    try {
      creditValidation = await consumeGenerationCredit(body.lojistaId);
    } catch (creditError: any) {
      console.error("[remix] Erro ao validar créditos:", creditError);
      return NextResponse.json(
        { 
          error: "Erro ao validar créditos", 
          details: creditError?.message || "Erro interno na validação de créditos" 
        },
        { status: 500 }
      );
    }

    if (!creditValidation.allowed) {
      const errorMessage = "message" in creditValidation ? creditValidation.message : "Créditos insuficientes";
      const statusCode = "status" in creditValidation ? creditValidation.status : 402;
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    // PHASE 14: Scenario/Pose Shuffler - Mudança Drástica (Prompt Mestre v2.1)
    // Cenários mais distintos e variados para forçar mudanças visuais dramáticas
    const scenarios = [
      "at a vibrant sunny beach during golden hour, ocean waves in background, sand, palm trees, tropical paradise, sunset colors, warm natural lighting",
      "inside a luxury 5-star hotel lobby with marble floors, crystal chandeliers, elegant modern furniture, warm ambient lighting, sophisticated upscale atmosphere",
      "on a bustling modern city street at night with neon signs, bokeh lights, urban architecture, dynamic street photography style, vibrant nightlife",
      "in a minimalist high-end photography studio with concrete walls, dramatic shadows, professional lighting setup, clean modern aesthetic, fashion editorial style",
      "at an exclusive rooftop bar overlooking city skyline at sunset, modern outdoor furniture, warm evening atmosphere, sophisticated urban setting",
      "in a cozy Scandinavian-style living room with natural wood, plants, large windows, warm soft lighting, comfortable minimalist furniture, homey atmosphere",
      "at a luxury resort poolside during day, infinity pool, tropical plants, blue sky, bright natural sunlight, vacation paradise setting",
      "in a contemporary art gallery with white walls, high ceilings, modern art installations, gallery track lighting, cultural sophisticated atmosphere",
      "on a European cobblestone street in historic district, old architecture, charming cafes, golden hour lighting, romantic old-world atmosphere",
      "at a modern fitness center with glass walls, natural light, sleek equipment, active lifestyle setting, energetic atmosphere"
    ];

    // PHASE 20: Pose Variation - Mudança Drástica mantendo identidade facial (BANIDAS poses sentadas)
    const poses = [
      "Walking confidently towards camera with dynamic movement, natural stride, engaging expression, fashion model walk",
      "Leaning against wall casually with relaxed posture, hands visible, one leg crossed, confident casual stance",
      "Standing with hands in pockets, relaxed body language, natural positioning, casual confident expression",
      "Looking over shoulder with engaging expression, dynamic angle, direct eye contact, fashion editorial pose",
      "Standing with one hand on hip, confident powerful pose, fashion model stance, strong presence",
      "Standing with arms crossed, confident assertive pose, strong body language, professional demeanor",
      "Walking away from camera then turning back, dynamic movement, cinematic pose, engaging presence",
      "Standing with weight on one leg, relaxed confident pose, natural body language, fashion model stance",
      "Walking with slight turn, dynamic movement, engaging expression, professional photography style",
      "Standing with hands on hips, powerful confident pose, strong presence, fashion editorial style"
    ];

    // PHASE 11-B: Selecionar aleatoriamente um cenário e uma pose
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPose = poses[Math.floor(Math.random() * poses.length)];
    
    // PHASE 11-B: Gerar random seed para forçar variação na IA
    const randomSeed = Math.floor(Math.random() * 999999);

    console.log("[remix] PHASE 11-B Scenario/Pose/Seed selecionados:", {
      scenario: randomScenario,
      pose: randomPose,
      randomSeed,
    });

    // PHASE 11 FIX: Combinar descrições de TODOS os produtos
    let productDescriptions: string[] = [];
    
    if (products.length > 0) {
      // Usar descrições dos produtos fornecidos
      productDescriptions = products.map((p: any) => {
        // Priorizar descrição, depois nome, depois categoria
        return p.descricao || p.nome || p.categoria || "product";
      });
    } else {
      // Fallback: usar IDs como descrição genérica
      productDescriptions = productIds.map(id => `product ${id}`);
    }
    
    // Combinar todas as descrições com "AND" conforme especificação
    const productPrompt = productDescriptions.join(" AND ");
    
    // Detectar gênero (verificar se algum produto tem categoria que indique gênero)
    const gender = body.gender || 
      (products.find((p: any) => p.genero)?.genero) ||
      (products.find((p: any) => p.categoria?.toLowerCase().includes("feminino")) ? "feminino" : 
       products.find((p: any) => p.categoria?.toLowerCase().includes("masculino")) ? "masculino" : "");
    
    const subjectDescription = gender 
      ? (gender.toLowerCase().includes("feminino") || gender.toLowerCase().includes("feminine") 
          ? "A stylish woman" 
          : "A stylish man")
      : "A stylish person";

    // PHASE 14 FIX: Construir prompt mais descritivo e ENFÁTICO sobre mudanças de cenário e pose
    // O prompt deve ser MUITO específico sobre mudanças dramáticas para forçar variação visual
    const remixPrompt = `${subjectDescription} ${randomPose} wearing ${productPrompt}, harmonious outfit combination, ${randomScenario}. 
    
⚠️ CRITICAL REMIX INSTRUCTION: This is a REMIX generation. The scene MUST be DRAMATICALLY DIFFERENT from any previous generation. 
- BACKGROUND: Completely change the background to ${randomScenario}. The environment must be visually distinct and different.
- POSE: The person must be in a ${randomPose.toLowerCase()} position, which is DIFFERENT from the original photo's pose.
- LIGHTING: Adapt lighting to match the new scene (${randomScenario}).
- CAMERA ANGLE: Use a different camera angle or perspective to emphasize the new pose and scene.

Photorealistic, 8k, highly detailed, professional fashion photography, distinct visual style. The final image must look like a COMPLETELY NEW PHOTOSHOOT in a DIFFERENT LOCATION with a DIFFERENT POSE, while maintaining the person's exact identity and the products' fidelity.`;

    console.log("[remix] Prompt gerado:", remixPrompt);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      DEFAULT_LOCAL_BACKEND;

    // PHASE 11-B: Preparar payload para o backend
    // IMPORTANTE: Usar a foto ORIGINAL (original_photo_url) para manter identidade
    // PHASE 11-B: Detectar categoria para Smart Framing (previne "cut legs")
    const hasShoes = products.some((p: any) => {
      const cat = (p.categoria || "").toLowerCase();
      return cat.includes("calçado") || cat.includes("calcado") || 
             cat.includes("sapato") || cat.includes("tênis") || 
             cat.includes("tenis") || cat.includes("shoe") || 
             cat.includes("footwear");
    });
    
    // PHASE 14: Preparar payload garantindo que sempre usa original_photo_url
    // PHASE 14: Injetar flag "GERAR NOVO LOOK" para ativar mudança de pose
    // Usar finalPhotoUrl que foi validada (aceita blob:, data:, http://, https://)
    const payload = {
      original_photo_url: finalPhotoUrl, // PHASE 14: Source of Truth - Foto original (pode ser blob/data/http)
      personImageUrl: finalPhotoUrl, // PHASE 14: Também enviar como personImageUrl para compatibilidade
      productIds: productIds, // PHASE 14: TODOS os produtos selecionados (não apenas o último)
      lojistaId: body.lojistaId,
      customerId: body.customerId || null,
      customerName: body.customerName || null, // Adicionar customerName para o Radar funcionar
      scenePrompts: [remixPrompt], // PHASE 14: Prompt descritivo de remix com cenário e pose variados
      options: {
        quality: body.options?.quality || "high",
        skipWatermark: body.options?.skipWatermark !== false, // Default: true
        lookType: "creative", // Sempre usar look criativo para remix
        // PHASE 14: Smart Framing - Se houver calçados, forçar full body
        productCategory: hasShoes ? "Calçados" : body.product_category || undefined,
        // PHASE 14: Random seed para forçar variação na IA
        seed: randomSeed,
        // PHASE 14: Flag "GERAR NOVO LOOK" para ativar mudança de pose (Regra de Postura Condicional)
        gerarNovoLook: true, // CRÍTICO: Sempre ativar no remix para permitir mudança de pose
      },
    };
    
    console.log("[remix] PHASE 14: Flag 'GERAR NOVO LOOK' ativada no payload:", {
      gerarNovoLook: payload.options.gerarNovoLook,
      totalProdutos: productIds.length,
      hasShoes,
    });

    console.log("[remix] PHASE 13: Enviando requisição para backend com foto ORIGINAL:", {
      url: `${backendUrl}/api/lojista/composicoes/generate`,
      hasOriginalPhoto: !!body.original_photo_url,
      originalPhotoUrl: body.original_photo_url?.substring(0, 80) + "...",
      productIdsCount: productIds.length,
      productsCount: products.length,
      productPrompt: productPrompt.substring(0, 100) + "...",
      remixPrompt: remixPrompt.substring(0, 150) + "...",
      randomSeed,
      hasShoes,
      productCategory: payload.options.productCategory,
      payloadOriginalPhotoUrl: payload.original_photo_url?.substring(0, 80) + "...",
    });

    const controller = new AbortController();
    // Aumentar timeout para 3 minutos em dispositivos móveis (conexões mais lentas)
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutos

    let backendResponse: Response;
    try {
      console.log("[remix] Iniciando requisição para backend...");
      backendResponse = await fetch(
        `${backendUrl}/api/lojista/composicoes/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      console.log("[remix] Resposta recebida do backend:", {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        contentType: backendResponse.headers.get('content-type'),
        contentLength: backendResponse.headers.get('content-length'),
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[remix] Erro ao conectar com backend:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout') || fetchError.message?.includes('aborted')) {
        return NextResponse.json(
          {
            error: "Erro ao gerar composição",
            details: "O processo está demorando mais que o esperado. Tente novamente em alguns instantes.",
          },
          { status: 504 }
        );
      }
      
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed') || fetchError.message?.includes('network')) {
        return NextResponse.json(
          {
            error: "Erro ao gerar composição",
            details: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
          },
          { status: 503 }
        );
      }
      
      // Erro genérico de rede
      return NextResponse.json(
        {
          error: "Erro ao gerar composição",
          details: "Erro de conexão. Tente novamente em alguns instantes.",
        },
        { status: 500 }
      );
    }

    let data: any;
    try {
      const text = await backendResponse.text();
      if (!text || text.trim() === '') {
        console.error("[remix] Resposta vazia do backend:", {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: Object.fromEntries(backendResponse.headers.entries()),
        });
        return NextResponse.json(
          {
            error: "Erro ao gerar composição",
            details: "O servidor não retornou dados. Tente novamente em alguns instantes.",
          },
          { status: 500 }
        );
      }
      
      // Log do conteúdo da resposta para debug (primeiros 500 caracteres)
      console.log("[remix] Resposta do backend (primeiros 500 chars):", text.substring(0, 500));
      
      try {
        data = JSON.parse(text);
      } catch (jsonError: any) {
        console.error("[remix] Erro ao fazer parse JSON:", {
          error: jsonError.message,
          responsePreview: text.substring(0, 200),
          responseLength: text.length,
          contentType: backendResponse.headers.get('content-type'),
        });
        
        // Se a resposta não for JSON, pode ser HTML de erro ou texto simples
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
          return NextResponse.json(
            {
              error: "Erro ao gerar composição",
              details: "O servidor retornou uma resposta inválida. Tente novamente em alguns instantes.",
            },
            { status: 500 }
          );
        }
        
        // Se for texto simples, tentar extrair mensagem de erro
        const errorMatch = text.match(/error["\s:]+([^"}\n]+)/i) || text.match(/message["\s:]+([^"}\n]+)/i);
        const errorMessage = errorMatch ? errorMatch[1].trim() : "Resposta do servidor em formato inválido";
        
        return NextResponse.json(
          {
            error: "Erro ao gerar composição",
            details: errorMessage.substring(0, 200),
          },
          { status: 500 }
        );
      }
    } catch (parseError: any) {
      console.error("[remix] Erro inesperado ao processar resposta:", {
        error: parseError.message,
        name: parseError.name,
        stack: parseError.stack,
      });
      return NextResponse.json(
        {
          error: "Erro ao gerar composição",
          details: "Erro ao processar resposta do servidor. Tente novamente em alguns instantes.",
        },
        { status: 500 }
      );
    }

    if (!backendResponse.ok) {
      // Se data não foi parseado corretamente ou não é um objeto, tratar como erro genérico
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.error("[remix] Erro do backend - resposta não é JSON válido:", {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          dataType: typeof data,
          isArray: Array.isArray(data),
          dataPreview: String(data).substring(0, 200),
        });
        
        return NextResponse.json(
          {
            error: "Erro ao gerar composição",
            details: `Erro do servidor (${backendResponse.status}). Tente novamente em alguns instantes.`,
          },
          { status: backendResponse.status >= 500 ? 500 : backendResponse.status }
        );
      }
      
      console.error("[remix] Erro do backend:", {
        status: backendResponse.status,
        error: data.error,
        details: data.details,
        message: data.message,
        fullResponse: JSON.stringify(data).substring(0, 500),
      });
      
      // Mensagens mais amigáveis para diferentes códigos de erro
      let errorMessage = data.error || data.message || "Erro ao gerar composição";
      let errorDetails = data.details || `Status: ${backendResponse.status}`;
      
      if (backendResponse.status === 500) {
        errorMessage = "Erro ao gerar composição";
        errorDetails = "Erro interno do servidor. Tente novamente em alguns instantes.";
      } else if (backendResponse.status === 503) {
        errorMessage = "Erro ao gerar composição";
        errorDetails = "Serviço temporariamente indisponível. Tente novamente em alguns instantes.";
      } else if (backendResponse.status === 429 || (data.error && (data.error.includes('RESOURCE_EXHAUSTED') || data.error.includes('rate limit')))) {
        errorMessage = "Erro ao gerar composição";
        errorDetails = "Muitas requisições. Aguarde alguns instantes e tente novamente.";
      } else if (backendResponse.status === 400) {
        errorMessage = "Erro ao gerar composição";
        errorDetails = data.details || "Dados inválidos. Verifique se a foto e os produtos estão corretos.";
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
        },
        { status: backendResponse.status >= 500 ? 500 : backendResponse.status }
      );
    }

    console.log("[remix] PHASE 11-B Remix gerado com sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
      scenario: randomScenario,
      pose: randomPose,
      randomSeed,
    });

    // PHASE 11-B: Retornar dados com informações do remix (incluindo seed)
    return NextResponse.json({
      ...data,
      remixInfo: {
        scenario: randomScenario,
        pose: randomPose,
        prompt: remixPrompt,
        randomSeed, // PHASE 11-B: Incluir seed na resposta
      },
    }, { status: backendResponse.status });

  } catch (error: any) {
    console.error("[remix] Erro inesperado:", error);
    console.error("[remix] Stack:", error?.stack);
    console.error("[remix] Tipo do erro:", typeof error);
    console.error("[remix] Propriedades do erro:", Object.keys(error || {}));
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error?.name || "UnknownError";
    
    let userFriendlyMessage = "Erro ao gerar composição";
    let details = "Erro ao processar requisição. Tente novamente em alguns instantes.";
    
    if (errorName === "AbortError" || errorMessage?.includes("timeout") || errorMessage?.includes("aborted")) {
      userFriendlyMessage = "Erro ao gerar composição";
      details = "O processo está demorando mais que o esperado. Tente novamente em alguns instantes.";
    } else if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("fetch failed") || errorMessage?.includes("network")) {
      userFriendlyMessage = "Erro ao gerar composição";
      details = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    } else if (errorMessage?.includes("JSON") || errorMessage?.includes("parse")) {
      userFriendlyMessage = "Erro ao gerar composição";
      details = "Erro ao processar resposta do servidor. Tente novamente.";
    } else if (errorMessage?.includes("429") || errorMessage?.includes("RESOURCE_EXHAUSTED") || errorMessage?.includes("rate limit")) {
      userFriendlyMessage = "Erro ao gerar composição";
      details = "Muitas requisições. Aguarde alguns instantes e tente novamente.";
    } else if (errorMessage?.includes("400") || errorMessage?.includes("Bad Request")) {
      userFriendlyMessage = "Erro ao gerar composição";
      details = "Dados inválidos. Verifique se a foto e os produtos estão corretos.";
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

