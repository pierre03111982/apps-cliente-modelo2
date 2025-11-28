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

    // PHASE 11: Scenario/Pose Shuffler
    const scenarios = [
      "Luxury Hotel Lobby",
      "Modern City Street with Bokeh",
      "Minimalist Concrete Studio",
      "Golden Hour Park",
      "Rooftop Bar at Night",
      "Cozy Living Room"
    ];

    const poses = [
      "Walking confidently",
      "Leaning against wall",
      "Sitting on modern chair",
      "Hands in pockets casual stance",
      "Looking over shoulder"
    ];

    // Selecionar aleatoriamente um cenário e uma pose
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPose = poses[Math.floor(Math.random() * poses.length)];

    console.log("[remix] Scenario/Pose selecionados:", {
      scenario: randomScenario,
      pose: randomPose,
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

    // PHASE 11 FIX: Construir prompt com TODOS os produtos
    const remixPrompt = `${subjectDescription} ${randomPose} wearing ${productPrompt}, in ${randomScenario}. Photorealistic, 8k, highly detailed.`;

    console.log("[remix] Prompt gerado:", remixPrompt);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      DEFAULT_LOCAL_BACKEND;

    // Preparar payload para o backend
    // IMPORTANTE: Usar a foto ORIGINAL (original_photo_url) para manter identidade
    const payload = {
      personImageUrl: body.original_photo_url, // Foto original para manter identidade
      productIds: productIds, // Usar os IDs extraídos
      lojistaId: body.lojistaId,
      customerId: body.customerId || null,
      scenePrompts: [remixPrompt], // Passar o prompt de remix como scenePrompt
      options: {
        quality: body.options?.quality || "high",
        skipWatermark: body.options?.skipWatermark !== false, // Default: true
        lookType: "creative", // Sempre usar look criativo para remix
        // Detectar categoria principal (se houver calçados, forçar full body)
        productCategory: products.find((p: any) => p.categoria?.toLowerCase().includes("calçado")) 
          ? "Calçados" 
          : body.product_category || undefined,
      },
    };

    console.log("[remix] Enviando requisição para backend:", {
      url: `${backendUrl}/api/lojista/composicoes/generate`,
      hasOriginalPhoto: !!body.original_photo_url,
      productIdsCount: productIds.length,
      productsCount: products.length,
      productPrompt: productPrompt.substring(0, 100) + "...",
      remixPrompt: remixPrompt.substring(0, 150) + "...",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos

    let backendResponse: Response;
    try {
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("[remix] Erro ao conectar com backend:", fetchError);
      
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return NextResponse.json(
          {
            error: "Timeout ao gerar remix. O processo está demorando mais que o esperado.",
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
      const text = await backendResponse.text();
      if (!text) {
        console.error("[remix] Resposta vazia do backend");
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
      console.error("[remix] Erro ao parsear resposta:", parseError);
      return NextResponse.json(
        {
          error: "Erro ao processar resposta do servidor",
          details: "A resposta do backend não está em formato válido.",
        },
        { status: 500 }
      );
    }

    if (!backendResponse.ok) {
      console.error("[remix] Erro do backend:", {
        status: backendResponse.status,
        error: data.error,
        details: data.details,
      });
      
      return NextResponse.json(
        {
          error: data.error || data.message || "Erro ao gerar remix",
          details: data.details || `Status: ${backendResponse.status}`,
        },
        { status: backendResponse.status }
      );
    }

    console.log("[remix] Remix gerado com sucesso:", {
      composicaoId: data.composicaoId,
      looksCount: data.looks?.length || 0,
      scenario: randomScenario,
      pose: randomPose,
    });

    // Retornar dados com informações do remix
    return NextResponse.json({
      ...data,
      remixInfo: {
        scenario: randomScenario,
        pose: randomPose,
        prompt: remixPrompt,
      },
    }, { status: backendResponse.status });

  } catch (error: any) {
    console.error("[remix] Erro inesperado:", error);
    console.error("[remix] Stack:", error?.stack);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error?.name || "UnknownError";
    
    let userFriendlyMessage = "Erro interno ao gerar remix";
    let details = process.env.NODE_ENV === 'development' ? errorMessage : "Erro ao processar requisição.";
    
    if (errorName === "AbortError" || errorMessage?.includes("timeout")) {
      userFriendlyMessage = "Timeout ao gerar remix. O processo está demorando mais que o esperado.";
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

