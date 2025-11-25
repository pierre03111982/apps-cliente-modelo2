import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * API para atualizar o display específico com uma nova imagem
 * Faz proxy para o backend (paineladm) que usa Firebase Admin SDK
 * Usado na Fase 10 para enviar imagens para displays específicos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayUuid, imageUrl, lojistaId } = body

    if (!displayUuid || !imageUrl) {
      return NextResponse.json(
        { error: "displayUuid e imageUrl são obrigatórios" },
        { status: 400 }
      )
    }

    // Resolver URL do backend (paineladm)
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PAINELADM_URL ||
      "http://localhost:3000"

    console.log("[display/update] Enviando para backend:", {
      backendUrl,
      displayUuid,
      lojistaId,
      imageUrl: imageUrl.substring(0, 50) + "...",
    })

    // Fazer proxy para o backend (paineladm) que usa Firebase Admin SDK
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos

    try {
      const response = await fetch(`${backendUrl}/api/display/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayUuid,
          imageUrl,
          lojistaId,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          // Se não conseguir parsear, usar o texto como está
        }

        console.error("[display/update] Erro do backend:", {
          status: response.status,
          error: errorData,
        })

        return NextResponse.json(
          {
            error: errorData.error || "Erro ao atualizar display",
            details: errorData.details || errorText,
          },
          { status: response.status }
        )
      }

      const data = await response.json()

      console.log("[display/update] ✅ Display atualizado com sucesso:", {
        displayUuid,
        lojistaId,
      })

      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error("[display/update] Erro ao conectar com backend:", fetchError)

      if (fetchError.name === "AbortError" || fetchError.message?.includes("timeout")) {
        return NextResponse.json(
          { error: "Timeout ao conectar com o servidor" },
          { status: 503 }
        )
      }

      if (
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("fetch failed")
      ) {
        return NextResponse.json(
          {
            error: "Não foi possível conectar com o servidor",
            details: `Verifique se o painel está rodando em ${backendUrl}`,
          },
          { status: 503 }
        )
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error("[display/update] Erro geral:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar display",
        details: error.message || "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

