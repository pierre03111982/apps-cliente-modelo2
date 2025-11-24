import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/login
 * Autentica cliente com WhatsApp e senha
 * Body: { lojistaId: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, whatsapp, password } = body;

    if (!lojistaId || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    console.log("[Cliente Login] Tentando autenticar no backend:", {
      backendUrl,
      lojistaId,
      whatsapp: cleanWhatsapp.substring(0, 5) + "...",
    });

    // Autenticar no backend
    let res: Response;
    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      res = await fetch(`${backendUrl}/api/cliente/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          whatsapp: cleanWhatsapp,
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.error("[Cliente Login] Erro ao conectar com backend:", fetchError);
      
      // Se for erro de conexão, retornar erro mais específico
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: "Timeout ao conectar com o servidor. Verifique se o painel está rodando." },
          { status: 503 }
        );
      }
      
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          { error: "Não foi possível conectar com o servidor. Verifique se o painel está rodando em " + backendUrl },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

    let data: any;
    try {
      const text = await res.text();
      if (!text) {
        throw new Error("Resposta vazia do servidor");
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[Cliente Login] Erro ao parsear resposta:", parseError);
      return NextResponse.json(
        { error: "Resposta inválida do servidor" },
        { status: 500 }
      );
    }

    if (!res.ok) {
      console.error("[Cliente Login] Erro do backend:", data);
      return NextResponse.json(
        { error: data.error || "Erro ao fazer login" },
        { status: res.status }
      );
    }

    console.log("[Cliente Login] Login bem-sucedido");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Cliente Login] Erro inesperado:", error);
    console.error("[Cliente Login] Stack:", error.stack);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao fazer login",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

