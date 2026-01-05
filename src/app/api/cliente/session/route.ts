import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

/**
 * FASE 0.2: API de Sessão Segura via Cookies HttpOnly
 * 
 * GET /api/cliente/session
 * Retorna os dados da sessão do cliente (se autenticado)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("cliente_session");
    
    if (!sessionCookie) {
      return NextResponse.json(
        { authenticated: false, cliente: null },
        { status: 200 }
      );
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value);
      
      // Validar estrutura básica
      if (!sessionData.lojistaId || !sessionData.clienteId) {
        return NextResponse.json(
          { authenticated: false, cliente: null },
          { status: 200 }
        );
      }

      return NextResponse.json({
        authenticated: true,
        cliente: {
          id: sessionData.clienteId,
          nome: sessionData.nome,
          whatsapp: sessionData.whatsapp,
          lojistaId: sessionData.lojistaId,
          deviceId: sessionData.deviceId,
          loggedAt: sessionData.loggedAt,
        },
      });
    } catch (parseError) {
      console.error("[Session API] Erro ao parsear cookie:", parseError);
      // Limpar cookie inválido
      const response = NextResponse.json(
        { authenticated: false, cliente: null },
        { status: 200 }
      );
      response.cookies.delete("cliente_session");
      return response;
    }
  } catch (error: any) {
    console.error("[Session API] Erro:", error);
    return NextResponse.json(
      { authenticated: false, cliente: null, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cliente/session
 * Cria/atualiza a sessão do cliente via cookie HttpOnly
 * Body: { clienteId, nome, whatsapp, lojistaId, deviceId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, nome, whatsapp, lojistaId, deviceId } = body;

    if (!clienteId || !lojistaId) {
      return NextResponse.json(
        { error: "clienteId e lojistaId são obrigatórios" },
        { status: 400 }
      );
    }

    const sessionData = {
      clienteId,
      nome: nome || "",
      whatsapp: whatsapp || "",
      lojistaId,
      deviceId: deviceId || `device-${Date.now()}`,
      loggedAt: new Date().toISOString(),
    };

    // Criar resposta com cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      cliente: sessionData,
    });

    // Configurar cookie HttpOnly (seguro contra XSS)
    // Max-Age: 30 dias (mesmo período do localStorage antigo)
    response.cookies.set("cliente_session", JSON.stringify(sessionData), {
      httpOnly: true, // Não acessível via JavaScript (proteção XSS)
      secure: process.env.NODE_ENV === "production", // HTTPS apenas em produção
      sameSite: "lax", // Proteção CSRF
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    console.log("[Session API] ✅ Sessão criada via cookie HttpOnly:", {
      clienteId,
      lojistaId,
      deviceId: sessionData.deviceId,
    });

    return response;
  } catch (error: any) {
    console.error("[Session API] Erro ao criar sessão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar sessão" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cliente/session
 * Remove a sessão do cliente (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "Sessão removida" });
    
    // Remover cookie
    response.cookies.delete("cliente_session");
    
    console.log("[Session API] ✅ Sessão removida");
    
    return response;
  } catch (error: any) {
    console.error("[Session API] Erro ao remover sessão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover sessão" },
      { status: 500 }
    );
  }
}


