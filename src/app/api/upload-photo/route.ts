import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOCAL_BACKEND = "http://localhost:3000";

// Forçar renderização dinâmica para evitar erro de build estático
export const dynamic = 'force-dynamic';

// Nota: No Next.js 13+ App Router, o limite de body size é controlado pelo servidor
// Para aumentar o limite, configure a variável de ambiente NEXT_MAX_BODY_SIZE ou
// use um servidor proxy reverso (nginx, etc.) com limite maior
// A compressão de imagem no frontend já reduz significativamente o tamanho

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_LOCAL_BACKEND;

    console.log("[upload-photo] Iniciando upload para backend:", backendUrl);

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const paineladmResponse = await fetch(
        `${backendUrl}/api/lojista/composicoes/upload-photo`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!paineladmResponse.ok) {
        let errorData: any = {};
        try {
          const errorText = await paineladmResponse.text();
          if (errorText) {
            errorData = JSON.parse(errorText);
          }
        } catch (parseError) {
          console.error("[upload-photo] Erro ao parsear resposta de erro:", parseError);
        }
        
        console.error("[upload-photo] Erro do backend:", {
          status: paineladmResponse.status,
          statusText: paineladmResponse.statusText,
          error: errorData,
        });

        return NextResponse.json(
          { 
            error: errorData.error || errorData.message || `Erro ao fazer upload: ${paineladmResponse.status} ${paineladmResponse.statusText}` 
          },
          { status: paineladmResponse.status }
        );
      }

      let data: any;
      try {
        const responseText = await paineladmResponse.text();
        if (!responseText) {
          throw new Error("Resposta vazia do backend");
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[upload-photo] Erro ao parsear resposta:", parseError);
        return NextResponse.json(
          { error: "Erro ao processar resposta do servidor" },
          { status: 500 }
        );
      }

      console.log("[upload-photo] ✅ Upload concluído com sucesso");
      return NextResponse.json(data, { status: paineladmResponse.status });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("[upload-photo] Timeout ao fazer upload");
        return NextResponse.json(
          { error: "Tempo de resposta excedido. Tente novamente." },
          { status: 408 }
        );
      }
      
      if (fetchError.message?.includes('fetch failed') || fetchError.message?.includes('Failed to fetch')) {
        console.error("[upload-photo] Erro de conexão:", fetchError);
        return NextResponse.json(
          { error: "Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente." },
          { status: 503 }
        );
      }
      
      throw fetchError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error: any) {
    console.error("[upload-photo] Erro no proxy:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Erro interno no proxy de upload. Tente novamente." 
      },
      { status: 500 }
    );
  }
}

