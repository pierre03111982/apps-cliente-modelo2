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
    
    // Detectar URL do backend automaticamente (mesma lógica de generate-looks/remix)
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
        // Exemplo: app2.experimenteai.com.br -> paineladm.experimenteai.com.br
        if (host.includes('app2.experimenteai.com.br') || host.includes('app.experimenteai.com.br')) {
          backendUrl = 'https://paineladm.experimenteai.com.br';
        } else if (host.includes('vercel.app')) {
          // Se estiver no Vercel, tentar detectar o projeto do painel
          backendUrl = 'https://paineladm.experimenteai.com.br';
        } else {
          // Fallback: usar o mesmo domínio
          backendUrl = `${protocol}://${host}`;
        }
      } else {
        // Local: usar localhost:3000
        backendUrl = "http://localhost:3000";
      }
    }

    console.log("[Cliente Login] Tentando autenticar no backend:", {
      backendUrl,
      lojistaId,
      whatsapp: cleanWhatsapp.substring(0, 5) + "...",
      hasEnvVar: !!(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL),
      host: request.headers.get('host'),
    });

    // Autenticar no backend
    let res: Response;
    try {
      // Criar AbortController para timeout (aumentado para 30 segundos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

      console.log("[Cliente Login] Fazendo requisição para:", `${backendUrl}/api/cliente/auth`);

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
      
      console.log("[Cliente Login] Resposta recebida:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
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
    let responseText: string = '';
    try {
      responseText = await res.text();
      if (!responseText) {
        console.error("[Cliente Login] Resposta vazia do servidor. Status:", res.status);
        return NextResponse.json(
          { error: "Resposta vazia do servidor. Verifique se o painel está rodando corretamente." },
          { status: 500 }
        );
      }
      
      // Verificar se a resposta é HTML (erro do Next.js)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("[Cliente Login] Servidor retornou HTML em vez de JSON. Status:", res.status);
        return NextResponse.json(
          { error: "Erro interno do servidor. Verifique os logs do painel." },
          { status: 500 }
        );
      }
      
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("[Cliente Login] Erro ao parsear resposta:", parseError);
      console.error("[Cliente Login] Resposta recebida:", responseText?.substring(0, 200));
      return NextResponse.json(
        { error: `Resposta inválida do servidor: ${parseError.message}` },
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

