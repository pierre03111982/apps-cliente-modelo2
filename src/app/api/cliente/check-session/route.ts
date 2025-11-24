import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/check-session
 * Verifica se o cliente já está logado em outro dispositivo POR WHATSAPP
 */
export async function POST(request: NextRequest) {
  try {
    const { lojistaId, whatsapp, deviceId } = await request.json();

    if (!lojistaId || !whatsapp) {
      return NextResponse.json(
        { error: "lojistaId e whatsapp são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_PAINELADM_URL || 
      "http://localhost:3000";

    // Verificar sessão no backend POR WHATSAPP
    const response = await fetch(`${backendUrl}/api/cliente/check-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lojistaId, whatsapp: cleanWhatsapp, deviceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Se o backend não tiver essa rota, permitir login (não bloquear)
      return NextResponse.json(
        { alreadyLoggedIn: false, message: "Sistema de sessão não disponível no backend" },
        { status: 200 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Check Session API] Erro:", error);
    // Em caso de erro, permitir login (não bloquear)
    return NextResponse.json(
      { alreadyLoggedIn: false, error: error.message },
      { status: 200 }
    );
  }
}
