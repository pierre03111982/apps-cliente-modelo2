import { NextRequest, NextResponse } from "next/server";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/register
 * Registra novo cliente com senha
 * Body: { lojistaId: string, nome: string, whatsapp: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lojistaId, nome, whatsapp, password } = body;

    if (!lojistaId || !nome || !whatsapp || !password) {
      return NextResponse.json(
        { error: "lojistaId, nome, whatsapp e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    
    // Detectar URL do backend automaticamente (mesma lógica de login)
    let backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL;

    // Se não tiver variável de ambiente, detectar automaticamente em produção
    if (!backendUrl || backendUrl === "http://localhost:3000") {
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      
      // Se estiver em produção (não localhost), usar o domínio do painel
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        // Tentar detectar o domínio do backend baseado no domínio do frontend
        if (host.includes('app2.experimenteai.com.br') || host.includes('app.experimenteai.com.br')) {
          backendUrl = 'https://paineladm.experimenteai.com.br';
        } else if (host.includes('vercel.app')) {
          backendUrl = 'https://paineladm.experimenteai.com.br';
        } else {
          backendUrl = `${protocol}://${host}`;
        }
      } else {
        // Local: usar localhost:3000
        backendUrl = "http://localhost:3000";
      }
    }

    console.log("[Cliente Register] Backend URL:", {
      backendUrl,
      lojistaId,
      hasEnvVar: !!(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL),
    });

    // Registrar cliente com senha no backend
    const res = await fetch(
      `${backendUrl}/api/lojista/clientes?lojistaId=${encodeURIComponent(lojistaId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp: cleanWhatsapp,
          password, // Backend fará o hash
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      clienteId: data.clienteId,
      message: "Cliente cadastrado com sucesso",
    });
  } catch (error: any) {
    console.error("[Cliente Register] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar cliente" },
      { status: 500 }
    );
  }
}

