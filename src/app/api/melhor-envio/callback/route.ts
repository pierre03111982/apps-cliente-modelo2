import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Callback OAuth do Melhor Envio
 * GET /api/melhor-envio/callback?code=xxx&state=lojistaId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // lojistaId
    const error = searchParams.get("error")

    // URL do painel admin
    const painelAdminUrl = process.env.NEXT_PUBLIC_PAINELADM_URL || 
                          process.env.NEXT_PUBLIC_BACKEND_URL ||
                          "https://paineladm.experimenteai.com.br"

    if (error) {
      return NextResponse.redirect(
        `${painelAdminUrl}/admin?error=melhor-envio-auth-error&message=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${painelAdminUrl}/admin?error=melhor-envio-auth-failed`
      )
    }

    const lojistaId = state

    // Buscar Client ID e Secret do Firestore
    const db = getFirestoreAdmin()
    const lojaRef = db.collection("lojas").doc(lojistaId)
    const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
    
    const painelAdminUrl = process.env.NEXT_PUBLIC_PAINELADM_URL || 
                          process.env.NEXT_PUBLIC_BACKEND_URL ||
                          "https://paineladm.experimenteai.com.br"

    if (!perfilDoc.exists) {
      return NextResponse.redirect(
        `${painelAdminUrl}/admin?error=melhor-envio-config-not-found`
      )
    }

    const salesConfig = perfilDoc.data()?.salesConfig || {}
    const integrations = salesConfig.integrations || {}
    const clientId = integrations.melhor_envio_client_id
    const clientSecret = integrations.melhor_envio_client_secret

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${painelAdminUrl}/admin?error=melhor-envio-credentials-missing`
      )
    }

    // Trocar código por token
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005")
    
    const redirectUri = `${baseUrl}/api/melhor-envio/callback`

    const tokenResponse = await fetch("https://sandbox.melhorenvio.com.br/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error("[melhor-envio/callback] Erro ao obter token:", errorData)
      return NextResponse.redirect(
        `${painelAdminUrl}/admin?error=melhor-envio-token-error&message=${encodeURIComponent(errorData.error || "Erro desconhecido")}`
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 2592000 // 30 dias em segundos

    // Salvar token no Firestore
    const updatedIntegrations = {
      ...integrations,
      melhor_envio_token: accessToken,
      melhor_envio_refresh_token: refreshToken,
      melhor_envio_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }

    await perfilDoc.ref.update({
      salesConfig: {
        ...salesConfig,
        integrations: updatedIntegrations,
      },
    })

    console.log("[melhor-envio/callback] Token salvo com sucesso para lojistaId:", lojistaId)

    // Redirecionar para painel admin com sucesso
    const painelAdminUrl = process.env.NEXT_PUBLIC_PAINELADM_URL || 
                          process.env.NEXT_PUBLIC_BACKEND_URL ||
                          "https://paineladm.experimenteai.com.br"
    return NextResponse.redirect(
      `${painelAdminUrl}/admin?success=melhor-envio-auth-success`
    )
  } catch (error) {
    console.error("[melhor-envio/callback] Erro:", error)
    const painelAdminUrl = process.env.NEXT_PUBLIC_PAINELADM_URL || 
                          process.env.NEXT_PUBLIC_BACKEND_URL ||
                          "https://paineladm.experimenteai.com.br"
    return NextResponse.redirect(
      `${painelAdminUrl}/admin?error=melhor-envio-callback-error`
    )
  }
}

