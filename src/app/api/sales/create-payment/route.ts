import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"
import type { SalesConfig, CartItem } from "@/lib/types"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { logError } from "@/lib/logger"

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
  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

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
    const response = await preference.create({ body: preferenceData })
    
    return {
      preference_id: response.id || "",
      checkout_url: response.init_point || response.sandbox_init_point || "",
      init_point: response.init_point || "",
      sandbox_init_point: response.sandbox_init_point || "",
    }
  } catch (error: any) {
    console.error("[createMercadoPagoPreference] Erro ao criar preference:", error)
    
    // PHASE 12: Logar erro crítico no Firestore
    await logError(
      "Payment API - MercadoPago Preference",
      error instanceof Error ? error : new Error(String(error)),
      {
        storeId: lojistaId,
        errorType: "PaymentFailed",
        gateway: "mercadopago",
      }
    ).catch(err => console.error("[Payment API] Erro ao salvar log:", err));
    
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
  preferenceId?: string,
  customerName?: string,
  customerWhatsapp?: string
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
    customerName: customerName || null,
    customerWhatsapp: customerWhatsapp || null,
    preference_id: preferenceId || null,
    payment_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const orderRef = await ordersRef.add(orderData)
  return orderRef.id
}

export async function POST(request: NextRequest) {
  console.log('🚀🚀🚀 [create-payment] FUNÇÃO CHAMADA - TIMESTAMP:', new Date().toISOString());
  
  // PHASE 12 FIX: Declarar variável fora do try para acesso no catch
  let lojistaId: string | undefined;
  
  try {
    console.log('🔍 [create-payment] Parseando body...');
    const body = await request.json().catch(() => ({}))
    
    lojistaId = body?.lojistaId as string | undefined
    const cartItems = (body?.cartItems || []) as CartItem[]
    const shippingOption = body?.shippingOption as { id: string; price: number } | null
    const destinationZip = body?.destinationZip as string | undefined
    const customerName = body?.customerName as string | undefined
    const customerWhatsapp = body?.customerWhatsapp as string | undefined

    console.log('✅ [create-payment] Request recebido:', {
      lojistaId,
      cartItemsLength: cartItems.length,
      customerName,
      customerWhatsapp,
      destinationZip
    });

    if (!lojistaId) {
      console.error('[create-payment] Erro: lojistaId não fornecido');
      return NextResponse.json(
        { error: "lojistaId é obrigatório" },
        { status: 400 }
      )
    }

    if (!cartItems || cartItems.length === 0) {
      console.error('[create-payment] Erro: carrinho vazio');
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      )
    }

    if (!customerName || customerName.trim().length < 3) {
      console.error('[create-payment] Erro: nome inválido');
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      )
    }

    if (!customerWhatsapp || customerWhatsapp.replace(/\D/g, '').length < 10) {
      console.error('[create-payment] Erro: WhatsApp inválido');
      return NextResponse.json(
        { error: "WhatsApp do cliente é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar salesConfig do Firestore
    let salesConfig: SalesConfig | null = null
    try {
      console.log('[create-payment] Buscando salesConfig para lojista:', lojistaId);
      
      const db = getFirestoreAdmin()
      const lojaRef = db.collection("lojas").doc(lojistaId)
      const lojaDoc = await lojaRef.get()
      
      if (lojaDoc.exists) {
        const data = lojaDoc.data()
        salesConfig = data?.salesConfig || data?.sales_config || null
        console.log('[create-payment] SalesConfig encontrado na loja:', !!salesConfig);
      }
      
      // Se não encontrou, buscar em perfil/dados
      if (!salesConfig) {
        try {
          const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
          if (perfilDoc.exists) {
            const perfilData = perfilDoc.data()
            salesConfig = perfilData?.salesConfig || perfilData?.sales_config || null
            console.log('[create-payment] SalesConfig encontrado no perfil:', !!salesConfig);
          }
        } catch (error) {
          console.log('[create-payment] Perfil/dados não encontrado, continuando...');
        }
      }
    } catch (error) {
      console.error("[create-payment] Erro CRÍTICO ao buscar salesConfig:", error)
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

    console.log('[create-payment] Gateway de pagamento:', salesConfig.payment_gateway);
    console.log('[create-payment] Shipping price:', shippingPrice);

    // Se for manual_whatsapp, retornar link do WhatsApp
    if (salesConfig.payment_gateway === "manual_whatsapp") {
      console.log('[create-payment] Processando via WhatsApp manual');
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
      try {
        console.log('[create-payment] Criando pedido com dados:', {
          lojistaId,
          itemsCount: cartItems.length,
          customerName,
          customerWhatsapp,
          destinationZip
        });
        
        const orderId = await createOrder(lojistaId, cartItems, shippingPrice, destinationZip || "", undefined, customerName, customerWhatsapp)
        
        console.log('[create-payment] ✅ Pedido criado com sucesso:', orderId);
      } catch (orderError) {
        console.error('[create-payment] ❌ ERRO ao criar pedido:', orderError);
        throw new Error('Erro ao criar pedido no banco de dados');
      }

      return NextResponse.json({
        success: true,
        checkout_url: whatsappUrl,
        message: "Redirecionando para WhatsApp...",
      })
    }

    // Se for Mercado Pago, criar preference
    if (salesConfig.payment_gateway === "mercadopago") {
      console.log('[create-payment] Processando via Mercado Pago');
      
      const accessToken = salesConfig.integrations?.mercadopago_access_token
      if (!accessToken) {
        console.error('[create-payment] Erro: Token MP não configurado');
        return NextResponse.json(
          { error: "Token de acesso do Mercado Pago não configurado." },
          { status: 400 }
        )
      }

      console.log('[create-payment] Criando preference no Mercado Pago...');
      const preference = await createMercadoPagoPreference(
        cartItems,
        shippingPrice,
        accessToken,
        lojistaId,
        destinationZip
      )
      console.log('[create-payment] ✅ Preference criada:', preference.preference_id);

      // Criar pedido no Firestore
      try {
        console.log('[create-payment] Criando pedido no Firestore com dados:', {
          lojistaId,
          itemsCount: cartItems.length,
          customerName,
          customerWhatsapp,
          destinationZip
        });
        
        const orderId = await createOrder(
          lojistaId,
          cartItems,
          shippingPrice,
          destinationZip || "",
          preference.preference_id,
          customerName,
          customerWhatsapp
        )
        
        console.log('[create-payment] ✅ Pedido criado com sucesso:', orderId);

        return NextResponse.json({
          success: true,
          preference_id: preference.preference_id,
          checkout_url: preference.checkout_url,
          order_id: orderId,
          message: "Checkout iniciado via Mercado Pago.",
        })
      } catch (orderError) {
        console.error('[create-payment] ❌ ERRO CRÍTICO ao criar pedido:', orderError);
        throw new Error('Erro ao salvar pedido no banco de dados');
      }
    }

    return NextResponse.json(
      { error: "Gateway de pagamento não suportado." },
      { status: 400 }
    )
  } catch (error) {
    console.error("═══════════════════════════════════════");
    console.error("❌ [create-payment] ERRO CAPTURADO:");
    console.error("Tipo:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Mensagem:", error instanceof Error ? error.message : String(error));
    console.error("Stack:", error instanceof Error ? error.stack : 'N/A');
    console.error("lojistaId:", lojistaId);
    console.error("═══════════════════════════════════════");
    
    // PHASE 12: Logar erro crítico no Firestore
    try {
      await logError(
        "Payment API - Create Payment",
        error instanceof Error ? error : new Error(String(error)),
        {
          storeId: lojistaId || "unknown",
          errorType: "PaymentFailed",
        }
      );
    } catch (logErr) {
      console.error("[create-payment] Erro ao salvar log no Firestore:", logErr);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Erro ao iniciar pagamento.",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

