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

    // PHASE 25: Aumentar timeout para mobile (upload pode ser mais lento)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos para mobile

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
      
      // PHASE 25: Melhor tratamento de erros de rede no mobile
      if (fetchError.message?.includes('fetch failed') || 
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('NetworkError') ||
          fetchError.message?.includes('Network request failed')) {
        console.error("[upload-photo] Erro de conexão:", fetchError);
        return NextResponse.json(
          { error: "Erro de conexão. Verifique sua internet e tente novamente." },
          { status: 503 }
        );
      }
      
      if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("[upload-photo] Servidor não está respondendo:", fetchError);
        return NextResponse.json(
          { error: "Servidor não está respondendo. Tente novamente em alguns instantes." },
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

