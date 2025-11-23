import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/actions
 * Proxy para registrar ações do cliente no backend (paineladm)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Actions Proxy] Recebido:", { action: body.action, lojistaId: body.lojistaId, customerId: body.customerId });
    
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Actions Proxy] Backend URL:", backendUrl);

    // Se for dislike, não enviar imagemUrl (não salvar imagem)
    const payload = { ...body };
    if (body.action === "dislike") {
      delete payload.imagemUrl;
    }

    console.log("[Actions Proxy] Enviando para backend:", { action: payload.action, lojistaId: payload.lojistaId });

    const response = await fetch(`${backendUrl}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Actions Proxy] Resposta do backend:", response.status, response.statusText);

    const data = await response.json().catch((err) => {
      console.error("[Actions Proxy] Erro ao parsear JSON:", err);
      return { 
        success: false, 
        error: "Erro ao comunicar com o servidor" 
      };
    });

    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}



    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}



    console.log("[Actions Proxy] Dados recebidos:", data);

    if (!response.ok) {
      console.error("[Actions Proxy] Erro na resposta:", response.status, data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || "Erro interno ao registrar ação." 
        }, 
        { status: response.status }
      );
    }

    console.log("[Actions Proxy] Sucesso:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Actions Proxy] Erro:", error);
    console.error("[Actions Proxy] Stack:", error?.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao registrar ação." },
      { status: 500 }
    );
  }
}

