import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"
import type { SalesConfig, CartItem } from "@/lib/types"
import mercadopago from "mercadopago"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Criar Preference real no Mercado Pago
async function createMercadoPagoPreference(
  items: CartItem[],
  shippingPrice: number,
  accessToken: string,
  lojistaId: string,
  destinationZip?: string
) {
  // Configurar SDK do Mercado Pago
  mercadopago.configurations.setAccessToken(accessToken)

  // Calcular total
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
  const total = subtotal + shippingPrice

  // Construir URL do webhook
  const baseUrl =
    process.env.NEXT_PUBLIC_CLIENT_APP_URL ||
    process.env.NEXT_PUBLIC_CLIENT_APP_DEV_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3005")

  const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`

  // Mapear items para formato do Mercado Pago
  const preferenceItems = items.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.name,
    quantity: item.quantity || 1,
    currency_id: "BRL",
    unit_price: item.price,
    picture_url: item.imageUrl || undefined,
  }))

  // Criar preference payload
  const preferenceData = {
    items: preferenceItems,
    back_urls: {
      success: `${baseUrl}/checkout/success`,
      failure: `${baseUrl}/checkout/failure`,
      pending: `${baseUrl}/checkout/pending`,
    },
    auto_return: "approved" as const,
    external_reference: `order_${lojistaId}_${Date.now()}`,
    notification_url: notificationUrl,
    statement_descriptor: "Virtual Try-On",
    shipments: shippingPrice > 0
      ? {
          cost: shippingPrice,
          mode: "not_specified" as const,
          receiver_address: destinationZip
            ? {
                zip_code: destinationZip.replace(/\D/g, ""),
              }
            : undefined,
        }
      : undefined,
    metadata: {
      lojista_id: lojistaId,
      order_type: "virtual_try_on",
    },
  }

  try {
    const response = await mercadopago.preferences.create(preferenceData)
    
    return {
      preference_id: response.body.id,
      checkout_url: response.body.init_point || response.body.sandbox_init_point || "",
      init_point: response.body.init_point || "",
      sandbox_init_point: response.body.sandbox_init_point || "",
    }
  } catch (error: any) {
    console.error("[createMercadoPagoPreference] Erro ao criar preference:", error)
    throw new Error(
      error?.message || "Erro ao criar preference no Mercado Pago. Verifique as credenciais."
    )
  }
}

// Criar pedido no Firestore
async function createOrder(
  lojistaId: string,
  items: CartItem[],
  shippingPrice: number,
  destinationZip: string,
  preferenceId?: string
) {
  const db = getFirestoreAdmin()
  const ordersRef = db.collection("lojas").doc(lojistaId).collection("orders")
  
  const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0) + shippingPrice
  
  const orderData = {
    status: "pending",
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      imageUrl: item.imageUrl,
    })),
    subtotal: items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
    shipping: shippingPrice,
    total,
    destinationZip,
    payment_id: preferenceId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const orderRef = await ordersRef.add(orderData)
  return orderRef.id
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const lojistaId = body?.lojistaId as string | undefined
    const cartItems = (body?.cartItems || []) as CartItem[]
    const shippingOption = body?.shippingOption as { id: string; price: number } | null
    const destinationZip = body?.destinationZip as string | undefined

    if (!lojistaId) {
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      )
    }

    // Buscar salesConfig do Firestore
    let salesConfig: SalesConfig | null = null
    try {
      const db = getFirestoreAdmin()
      const lojistaRef = db.collection("lojistas").doc(lojistaId)
      const lojistaDoc = await lojistaRef.get()
      if (lojistaDoc.exists) {
        const data = lojistaDoc.data()
        salesConfig = data?.salesConfig || data?.sales_config || null
      }
    } catch (error) {
      console.error("[sales/create-payment] Erro ao buscar salesConfig:", error)
      return NextResponse.json(
        { error: "Erro ao buscar configurações de venda." },
        { status: 500 }
      )
    }

    if (!salesConfig?.enabled) {
      return NextResponse.json(
        { error: "Vendas não estão habilitadas para esta loja." },
        { status: 403 }
      )
    }

    const shippingPrice = shippingOption?.price || 0

    // Se for manual_whatsapp, retornar link do WhatsApp
    if (salesConfig.payment_gateway === "manual_whatsapp") {
      const whatsappNumber = salesConfig.manual_contact || salesConfig.salesWhatsapp || salesConfig.whatsappLink
      if (!whatsappNumber) {
        return NextResponse.json(
          { error: "Número do WhatsApp não configurado." },
          { status: 400 }
        )
      }

      const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0) + shippingPrice
      const itemsText = cartItems
        .map((item) => `${item.quantity || 1}x ${item.name} - ${item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`)
        .join("\n")
      
      const message = encodeURIComponent(
        `Olá! Gostaria de comprar:\n\n${itemsText}\n\nFrete: ${shippingPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\nTotal: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      )
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${message}`

      // Criar pedido no Firestore
      await createOrder(lojistaId, cartItems, shippingPrice, destinationZip || "")

      return NextResponse.json({
        success: true,
        checkout_url: whatsappUrl,
        message: "Redirecionando para WhatsApp...",
      })
    }

    // Se for Mercado Pago, criar preference
    if (salesConfig.payment_gateway === "mercadopago") {
      const accessToken = salesConfig.integrations?.mercadopago_access_token
      if (!accessToken) {
        return NextResponse.json(
          { error: "Token de acesso do Mercado Pago não configurado." },
          { status: 400 }
        )
      }

      const preference = await createMercadoPagoPreference(
        cartItems,
        shippingPrice,
        accessToken,
        lojistaId,
        destinationZip
      )

      // Criar pedido no Firestore
      const orderId = await createOrder(
        lojistaId,
        cartItems,
        shippingPrice,
        destinationZip || "",
        preference.preference_id
      )

      return NextResponse.json({
        success: true,
        preference_id: preference.preference_id,
        checkout_url: preference.checkout_url,
        order_id: orderId,
        message: "Checkout iniciado via Mercado Pago.",
      })
    }

    return NextResponse.json(
      { error: "Gateway de pagamento não suportado." },
      { status: 400 }
    )
  } catch (error) {
    console.error("[sales/create-payment] erro:", error)
    return NextResponse.json(
      { error: "Erro ao iniciar pagamento." },
      { status: 500 }
    )
  }
}

