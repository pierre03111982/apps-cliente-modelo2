import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Rota para iniciar o fluxo OAuth do Melhor Envio
 * GET /api/melhor-envio/auth?lojistaId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lojistaId = searchParams.get("lojistaId")
    
    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar Client ID e Secret do Firestore
    const { getFirestoreAdmin } = await import("@/lib/firebaseAdmin")
    const db = getFirestoreAdmin()
    
    const lojaRef = db.collection("lojas").doc(lojistaId)
    const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
    
    if (!perfilDoc.exists) {
      return NextResponse.json(
        { error: "Configurações da loja não encontradas" },
        { status: 404 }
      )
    }

    const salesConfig = perfilDoc.data()?.salesConfig
    const clientId = salesConfig?.integrations?.melhor_envio_client_id?.trim()
    const clientSecret = salesConfig?.integrations?.melhor_envio_client_secret?.trim()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID ou Secret do Melhor Envio não configurados. Configure no painel admin primeiro." },
        { status: 400 }
      )
    }

    // Construir URL de autorização OAuth
    // IMPORTANTE: O redirect_uri DEVE ser exatamente igual ao registrado no app do Melhor Envio
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005")
    
    const redirectUri = `${baseUrl}/api/melhor-envio/callback`
    
    console.log("[melhor-envio/auth] Iniciando OAuth:", {
      lojistaId,
      clientId,
      redirectUri,
      baseUrl,
    })
    
    // Scopes necessários para calcular frete e gerenciar etiquetas
    const scopes = [
      "cart-read",
      "cart-write",
      "shipments-read",
      "shipments-write",
    ].join(" ")

    // Usar produção por padrão (sandbox apenas se variável de ambiente estiver definida)
    const melhorEnvioBaseUrl = process.env.MELHOR_ENVIO_SANDBOX === "true" 
      ? "https://sandbox.melhorenvio.com.br" 
      : "https://www.melhorenvio.com.br"
    
    const authUrl = new URL(`${melhorEnvioBaseUrl}/oauth/authorize`)
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("state", lojistaId) // Passar lojistaId no state para recuperar depois

    const authUrlString = authUrl.toString()
    console.log("[melhor-envio/auth] URL de autorização:", authUrlString)

    // Retornar URL para o frontend fazer o redirect (evita problemas com NextResponse.redirect)
    return NextResponse.json({
      success: true,
      authUrl: authUrlString,
      message: "Redirecione para a URL fornecida"
    })
  } catch (error) {
    console.error("[melhor-envio/auth] Erro:", error)
    return NextResponse.json(
      { 
        error: "Erro ao iniciar autenticação",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Rota para iniciar o fluxo OAuth do Melhor Envio
 * GET /api/melhor-envio/auth?lojistaId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lojistaId = searchParams.get("lojistaId")
    
    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar Client ID e Secret do Firestore
    const { getFirestoreAdmin } = await import("@/lib/firebaseAdmin")
    const db = getFirestoreAdmin()
    
    const lojaRef = db.collection("lojas").doc(lojistaId)
    const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
    
    if (!perfilDoc.exists) {
      return NextResponse.json(
        { error: "Configurações da loja não encontradas" },
        { status: 404 }
      )
    }

    const salesConfig = perfilDoc.data()?.salesConfig
    const clientId = salesConfig?.integrations?.melhor_envio_client_id?.trim()
    const clientSecret = salesConfig?.integrations?.melhor_envio_client_secret?.trim()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID ou Secret do Melhor Envio não configurados. Configure no painel admin primeiro." },
        { status: 400 }
      )
    }

    // Construir URL de autorização OAuth
    // IMPORTANTE: O redirect_uri DEVE ser exatamente igual ao registrado no app do Melhor Envio
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005")
    
    const redirectUri = `${baseUrl}/api/melhor-envio/callback`
    
    console.log("[melhor-envio/auth] Iniciando OAuth:", {
      lojistaId,
      clientId,
      redirectUri,
      baseUrl,
    })
    
    // Scopes necessários para calcular frete e gerenciar etiquetas
    const scopes = [
      "cart-read",
      "cart-write",
      "shipments-read",
      "shipments-write",
    ].join(" ")

    // Usar produção (sandbox apenas se variável de ambiente estiver definida)
    const melhorEnvioBaseUrl = process.env.MELHOR_ENVIO_SANDBOX === "true" 
      ? "https://sandbox.melhorenvio.com.br" 
      : "https://www.melhorenvio.com.br"
    
    const authUrl = new URL(`${melhorEnvioBaseUrl}/oauth/authorize`)
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("state", lojistaId) // Passar lojistaId no state para recuperar depois

    console.log("[melhor-envio/auth] URL de autorização:", authUrl.toString())

    // Redirecionar para página de autorização do Melhor Envio
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error("[melhor-envio/auth] Erro:", error)
    return NextResponse.json(
      { 
        error: "Erro ao iniciar autenticação",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Rota para iniciar o fluxo OAuth do Melhor Envio
 * GET /api/melhor-envio/auth?lojistaId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lojistaId = searchParams.get("lojistaId")
    
    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar Client ID e Secret do Firestore
    const { getFirestoreAdmin } = await import("@/lib/firebaseAdmin")
    const db = getFirestoreAdmin()
    
    const lojaRef = db.collection("lojas").doc(lojistaId)
    const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
    
    if (!perfilDoc.exists) {
      return NextResponse.json(
        { error: "Configurações da loja não encontradas" },
        { status: 404 }
      )
    }

    const salesConfig = perfilDoc.data()?.salesConfig
    const clientId = salesConfig?.integrations?.melhor_envio_client_id?.trim()
    const clientSecret = salesConfig?.integrations?.melhor_envio_client_secret?.trim()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID ou Secret do Melhor Envio não configurados. Configure no painel admin primeiro." },
        { status: 400 }
      )
    }

    // Construir URL de autorização OAuth
    // IMPORTANTE: O redirect_uri DEVE ser exatamente igual ao registrado no app do Melhor Envio
    const baseUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || 
                   process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005")
    
    const redirectUri = `${baseUrl}/api/melhor-envio/callback`
    
    console.log("[melhor-envio/auth] Iniciando OAuth:", {
      lojistaId,
      clientId,
      redirectUri,
      baseUrl,
    })
    
    // Scopes necessários para calcular frete e gerenciar etiquetas
    const scopes = [
      "cart-read",
      "cart-write",
      "shipments-read",
      "shipments-write",
    ].join(" ")

    // Usar produção por padrão (sandbox apenas se variável de ambiente estiver definida)
    const melhorEnvioBaseUrl = process.env.MELHOR_ENVIO_SANDBOX === "true" 
      ? "https://sandbox.melhorenvio.com.br" 
      : "https://www.melhorenvio.com.br"
    
    const authUrl = new URL(`${melhorEnvioBaseUrl}/oauth/authorize`)
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", scopes)
    authUrl.searchParams.set("state", lojistaId) // Passar lojistaId no state para recuperar depois

    console.log("[melhor-envio/auth] URL de autorização:", authUrl.toString())

    // Redirecionar para página de autorização do Melhor Envio
    return NextResponse.redirect(authUrl.toString(), { status: 302 })
  } catch (error) {
    console.error("[melhor-envio/auth] Erro:", error)
    return NextResponse.json(
      { 
        error: "Erro ao iniciar autenticação",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

