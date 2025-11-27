import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"
import type { SalesConfig, CartItem } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Integração real com API Melhor Envio
async function calculateMelhorEnvioShipping(
  originZip: string,
  destinationZip: string,
  items: CartItem[],
  token: string,
  lojistaId: string
) {
  if (!token) {
    throw new Error("Token do Melhor Envio não configurado")
  }

  // Buscar dimensões dos produtos do Firestore
  const db = getFirestoreAdmin()
  const produtosRef = db.collection("lojas").doc(lojistaId).collection("produtos")

  // Preparar volumes (pacotes) para cálculo
  const volumes: Array<{
    height: number
    width: number
    length: number
    weight: number
  }> = []

  for (const item of items) {
    try {
      const produtoDoc = await produtosRef.doc(item.id).get()
      const produtoData = produtoDoc.data()

      // Usar dimensões do produto ou valores padrão
      const dimensions = produtoData?.dimensions || {
        weight_kg: 0.5,
        height_cm: 10,
        width_cm: 20,
        depth_cm: 30,
      }

      // Adicionar um volume para cada quantidade
      for (let i = 0; i < (item.quantity || 1); i++) {
        volumes.push({
          height: Math.max(2, dimensions.height_cm || 10),
          width: Math.max(11, dimensions.width_cm || 20),
          length: Math.max(16, dimensions.depth_cm || 30),
          weight: Math.max(0.1, dimensions.weight_kg || 0.5),
        })
      }
    } catch (error) {
      console.warn(`[calculate-shipping] Erro ao buscar produto ${item.id}:`, error)
      // Usar valores padrão se não conseguir buscar
      for (let i = 0; i < (item.quantity || 1); i++) {
        volumes.push({
          height: 10,
          width: 20,
          length: 30,
          weight: 0.5,
        })
      }
    }
  }

  // Preparar payload para API Melhor Envio
  const payload = {
    from: {
      postal_code: originZip.replace(/\D/g, ""),
    },
    to: {
      postal_code: destinationZip.replace(/\D/g, ""),
    },
    products: volumes.map((vol) => ({
      height: vol.height,
      width: vol.width,
      length: vol.length,
      weight: vol.weight,
    })),
  }

  try {
    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Virtual Try-On App (app@experimenteai.com)",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[calculate-shipping] Erro na API Melhor Envio:", errorData)
      throw new Error(errorData?.message || `Erro ao calcular frete: ${response.status}`)
    }

    const data = await response.json()

    // Mapear resposta do Melhor Envio para nosso formato
    const quotes = data.map((option: any) => ({
      id: `melhor_envio_${option.id || option.name?.toLowerCase().replace(/\s+/g, "_") || "standard"}`,
      label: option.name || "Melhor Envio",
      eta: option.delivery_time
        ? `${option.delivery_time.min} - ${option.delivery_time.max} dias úteis`
        : "5-7 dias úteis",
      price: parseFloat(option.price || 0),
    }))

    return quotes
  } catch (error: any) {
    console.error("[calculate-shipping] Erro ao chamar API Melhor Envio:", error)
    throw error
  }
}

// Integração real com API Melhor Envio
async function calculateMelhorEnvioShipping(
  originZip: string,
  destinationZip: string,
  items: CartItem[],
  token: string,
  lojistaId: string
) {
  if (!token) {
    throw new Error("Token do Melhor Envio não configurado")
  }

  // Buscar dimensões dos produtos do Firestore
  const db = getFirestoreAdmin()
  const produtosRef = db.collection("lojas").doc(lojistaId).collection("produtos")

  // Preparar volumes (pacotes) para cálculo
  const volumes: Array<{
    height: number
    width: number
    length: number
    weight: number
  }> = []

  for (const item of items) {
    try {
      const produtoDoc = await produtosRef.doc(item.id).get()
      const produtoData = produtoDoc.data()

      // Usar dimensões do produto ou valores padrão
      const dimensions = produtoData?.dimensions || {
        weight_kg: 0.5,
        height_cm: 10,
        width_cm: 20,
        depth_cm: 30,
      }

      // Adicionar um volume para cada quantidade
      for (let i = 0; i < (item.quantity || 1); i++) {
        volumes.push({
          height: Math.max(2, dimensions.height_cm || 10),
          width: Math.max(11, dimensions.width_cm || 20),
          length: Math.max(16, dimensions.depth_cm || 30),
          weight: Math.max(0.1, dimensions.weight_kg || 0.5),
        })
      }
    } catch (error) {
      console.warn(`[calculate-shipping] Erro ao buscar produto ${item.id}:`, error)
      // Usar valores padrão se não conseguir buscar
      for (let i = 0; i < (item.quantity || 1); i++) {
        volumes.push({
          height: 10,
          width: 20,
          length: 30,
          weight: 0.5,
        })
      }
    }
  }

  // Preparar payload para API Melhor Envio
  const payload = {
    from: {
      postal_code: originZip.replace(/\D/g, ""),
    },
    to: {
      postal_code: destinationZip.replace(/\D/g, ""),
    },
    products: volumes.map((vol) => ({
      height: vol.height,
      width: vol.width,
      length: vol.length,
      weight: vol.weight,
    })),
  }

  try {
    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Virtual Try-On App (app@experimenteai.com)",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[calculate-shipping] Erro na API Melhor Envio:", errorData)
      throw new Error(errorData?.message || `Erro ao calcular frete: ${response.status}`)
    }

    const data = await response.json()

    // Mapear resposta do Melhor Envio para nosso formato
    const quotes = data.map((option: any) => ({
      id: `melhor_envio_${option.id || option.name?.toLowerCase().replace(/\s+/g, "_") || "standard"}`,
      label: option.name || "Melhor Envio",
      eta: option.delivery_time
        ? `${option.delivery_time.min} - ${option.delivery_time.max} dias úteis`
        : "5-7 dias úteis",
      price: parseFloat(option.price || 0),
    }))

    return quotes
  } catch (error: any) {
    console.error("[calculate-shipping] Erro ao chamar API Melhor Envio:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const lojistaId = body?.lojistaId as string | undefined
    const destinationZip = body?.destination_zip as string | undefined
    const items = (body?.items || []) as CartItem[]
    const config = body?.config as SalesConfig | undefined

    if (!destinationZip) {
      return NextResponse.json(
        { error: "destination_zip é obrigatório" },
        { status: 400 }
      )
    }

    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar salesConfig do Firestore se não foi fornecido
    let salesConfig = config
    if (!salesConfig) {
      try {
        const db = getFirestoreAdmin()
        const lojistaRef = db.collection("lojistas").doc(lojistaId)
        const lojistaDoc = await lojistaRef.get()
        if (lojistaDoc.exists) {
          const data = lojistaDoc.data()
          salesConfig = data?.salesConfig || data?.sales_config
        }
      } catch (error) {
        console.warn("[sales/calculate-shipping] Erro ao buscar salesConfig:", error)
      }
    }

    const quotes: Array<{ id: string; label: string; eta: string; price: number }> = []

    // Opção: Retirar na loja (sempre disponível)
    quotes.push({
      id: "retirar_loja",
      label: "Retirar na loja",
      eta: "Disponível em 1 dia",
      price: 0,
    })

    // Calcular frete baseado no provider configurado
    if (salesConfig?.shipping_provider === "fixed_price") {
      const fixedPrice = salesConfig.fixed_shipping_price || 0
      quotes.push({
        id: "fixed_shipping",
        label: "Frete fixo",
        eta: "5-7 dias úteis",
        price: fixedPrice,
      })
    } else if (salesConfig?.shipping_provider === "melhor_envio") {
      const originZip = salesConfig.origin_zip || "01311-200" // Fallback para SP
      const token = salesConfig.integrations?.melhor_envio_token
      
      if (!token) {
        console.warn("[calculate-shipping] Token do Melhor Envio não configurado")
        quotes.push({
          id: "melhor_envio_error",
          label: "Erro: Token não configurado",
          eta: "Configure o token na área de vendas",
          price: 0,
        })
      } else {
        try {
          const melhorEnvioQuotes = await calculateMelhorEnvioShipping(
            originZip,
            destinationZip,
            items,
            token,
            lojistaId
          )
          quotes.push(...melhorEnvioQuotes)
        } catch (error: any) {
          console.error("[calculate-shipping] Erro ao calcular frete Melhor Envio:", error)
          quotes.push({
            id: "melhor_envio_error",
            label: "Erro ao calcular frete",
            eta: error.message || "Tente novamente",
            price: 0,
          })
        }
      }
    } else {
      // Fallback: frete padrão quando não configurado
      quotes.push({
        id: "standard_shipping",
        label: "Frete padrão",
        eta: "5-7 dias úteis",
        price: 25.0,
      })
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error("[sales/calculate-shipping] erro:", error)
    return NextResponse.json(
      { error: "Erro ao calcular frete." },
      { status: 500 }
    )
  }
}

