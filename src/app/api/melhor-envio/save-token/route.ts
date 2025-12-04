import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Rota para salvar token do Melhor Envio manualmente
 * POST /api/melhor-envio/save-token
 * Body: { lojistaId: string, token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lojistaId, token } = body

    if (!lojistaId || !token) {
      return NextResponse.json(
        { error: "lojistaId e token são obrigatórios" },
        { status: 400 }
      )
    }

    const db = getFirestoreAdmin()
    const lojaRef = db.collection("lojas").doc(lojistaId)
    const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()

    if (!perfilDoc.exists) {
      return NextResponse.json(
        { error: "Perfil da loja não encontrado" },
        { status: 404 }
      )
    }

    const perfilData = perfilDoc.data()
    const salesConfig = perfilData?.salesConfig || {}
    const integrations = salesConfig.integrations || {}

    // Calcular expiração (30 dias a partir de agora)
    const expiresIn = 30 * 24 * 60 * 60 * 1000 // 30 dias em milissegundos
    const expiresAt = new Date(Date.now() + expiresIn).toISOString()

    // Atualizar integrações com o token
    const updatedIntegrations = {
      ...integrations,
      melhor_envio_token: token,
      melhor_envio_token_expires_at: expiresAt,
    }

    // Salvar no Firestore
    await perfilDoc.ref.update({
      salesConfig: {
        ...salesConfig,
        integrations: updatedIntegrations,
      },
    })

    console.log("[melhor-envio/save-token] Token salvo com sucesso para lojistaId:", lojistaId)

    return NextResponse.json({
      success: true,
      message: "Token salvo com sucesso",
      lojistaId,
    })
  } catch (error) {
    console.error("[melhor-envio/save-token] Erro:", error)
    return NextResponse.json(
      { 
        error: "Erro ao salvar token", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}





