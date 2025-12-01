import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"
import { MercadoPagoConfig, Payment } from "mercadopago"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const type = body?.type as string | undefined
    const data = body?.data as { id: string } | undefined

    console.log("[webhooks/mercadopago] Notificação recebida:", { type, dataId: data?.id })

    // Verificar se é uma notificação de pagamento
    if (type !== "payment" || !data?.id) {
      return NextResponse.json({ received: true, message: "Notificação ignorada" })
    }

    const paymentId = data.id
    const db = getFirestoreAdmin()

    // ESTRATÉGIA MELHORADA: Buscar o pagamento primeiro para pegar o external_reference
    // Isso nos permite identificar o lojista sem precisar buscar em todas as lojas
    let paymentData: any = null
    let lojistaIdFromPayment: string | null = null
    let preferenceIdFromPayment: string | null = null

    // Tentar buscar o pagamento em todas as lojas até encontrar o access_token correto
    const lojasSnapshot = await db.collection("lojas").get()

    for (const lojaDoc of lojasSnapshot.docs) {
      const lojistaId = lojaDoc.id
      const lojistaData = lojaDoc.data()
      const salesConfig = lojistaData?.salesConfig || lojistaData?.sales_config
      const accessToken = salesConfig?.integrations?.mercadopago_access_token

      if (!accessToken) continue

      try {
        const client = new MercadoPagoConfig({ accessToken })
        const paymentClient = new Payment(client)
        const payment = await paymentClient.get({ id: parseInt(paymentId) })

        if (payment) {
          paymentData = payment
          lojistaIdFromPayment = lojistaId

          // Extrair preference_id do external_reference ou metadata
          const externalRef = payment.external_reference || ""
          // Formato: order_{lojistaId}_{timestamp}
          if (externalRef.startsWith("order_")) {
            const parts = externalRef.split("_")
            if (parts.length >= 2) {
              lojistaIdFromPayment = parts[1] // Confirmar lojistaId
            }
          }

          // O preference_id pode estar no metadata ou precisamos buscar pela preference
          preferenceIdFromPayment = payment.metadata?.preference_id || null

          console.log("[webhooks/mercadopago] Pagamento encontrado:", {
            paymentId,
            lojistaId: lojistaIdFromPayment,
            externalReference: externalRef,
            status: payment.status,
          })
          break
        }
      } catch (error: any) {
        // Este access_token não tem acesso a este pagamento, tentar próximo
        continue
      }
    }

    if (!paymentData || !lojistaIdFromPayment) {
      console.warn("[webhooks/mercadopago] Pagamento não encontrado ou lojista não identificado:", {
        paymentId,
      })
      return NextResponse.json({ received: true, processed: false, error: "Pagamento não encontrado" })
    }

    // Buscar pedido pelo preference_id (salvo quando o pedido foi criado)
    // OU pelo payment_id (se já foi atualizado anteriormente)
    const lojistaRef = db.collection("lojas").doc(lojistaIdFromPayment)
    const ordersRef = lojistaRef.collection("orders")

    // Tentar buscar pelo payment_id primeiro (caso já tenha sido atualizado)
    let ordersSnapshot = await ordersRef.where("payment_id", "==", paymentId).get()

    // Se não encontrar, buscar pelo preference_id (do external_reference)
    if (ordersSnapshot.empty && preferenceIdFromPayment) {
      ordersSnapshot = await ordersRef.where("preference_id", "==", preferenceIdFromPayment).get()
    }

    // Se ainda não encontrar, buscar pelo external_reference no metadata do pedido
    if (ordersSnapshot.empty) {
      const externalRef = paymentData.external_reference || ""
      if (externalRef) {
        // Buscar todos os pedidos pendentes deste lojista e verificar pelo external_reference
        const allOrders = await ordersRef.where("status", "==", "pending").get()
        for (const orderDoc of allOrders.docs) {
          // Verificar se o external_reference corresponde (formato: order_{lojistaId}_{timestamp})
          const orderData = orderDoc.data()
          if (orderData.preference_id) {
            // Se temos o preference_id, podemos verificar se corresponde
            ordersSnapshot = await ordersRef.where("preference_id", "==", orderData.preference_id).limit(1).get()
            if (!ordersSnapshot.empty) break
          }
        }
      }
    }

    if (ordersSnapshot.empty) {
      console.warn("[webhooks/mercadopago] Pedido não encontrado para payment_id:", {
        paymentId,
        lojistaId: lojistaIdFromPayment,
        preferenceId: preferenceIdFromPayment,
      })
      return NextResponse.json({ received: true, processed: false, error: "Pedido não encontrado" })
    }

    const orderDoc = ordersSnapshot.docs[0]
    const status = paymentData.status

    console.log("[webhooks/mercadopago] Status do pagamento:", {
      paymentId,
      status,
      externalReference: paymentData.external_reference,
      orderId: orderDoc.id,
    })

    // Atualizar status do pedido baseado no status do pagamento
    let orderStatus = "pending"

    if (status === "approved") {
      orderStatus = "paid"
    } else if (status === "rejected" || status === "cancelled") {
      orderStatus = "cancelled"
    } else if (status === "refunded" || status === "charged_back") {
      orderStatus = "refunded"
    } else if (status === "pending" || status === "in_process") {
      orderStatus = "pending"
    }

    // Atualizar pedido no Firestore
    await orderDoc.ref.update({
      status: orderStatus,
      payment_id: paymentId.toString(), // Salvar o payment_id real
      payment_status: status,
      payment_data: {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        date_approved: paymentData.date_approved,
        date_created: paymentData.date_created,
        external_reference: paymentData.external_reference,
      },
      updatedAt: new Date(),
    })

    console.log("[webhooks/mercadopago] Pedido atualizado:", {
      orderId: orderDoc.id,
      lojistaId: lojistaIdFromPayment,
      status: orderStatus,
      paymentId,
    })

    // Se o pagamento foi aprovado, podemos fazer outras ações:
    // - Deduzir estoque
    // - Enviar notificação para o lojista
    // - Enviar email de confirmação para o cliente
    if (status === "approved") {
      // TODO: Implementar dedução de estoque
      // TODO: Implementar notificações
      console.log("[webhooks/mercadopago] ✅ Pagamento aprovado! Pedido:", orderDoc.id)
    }

    return NextResponse.json({ received: true, processed: true, orderId: orderDoc.id, status: orderStatus })
  } catch (error) {
    console.error("[webhooks/mercadopago] Erro ao processar webhook:", error)
    // Retornar 200 mesmo em caso de erro para evitar retentativas desnecessárias
    return NextResponse.json(
      { received: true, error: "Erro ao processar webhook" },
      { status: 200 }
    )
  }
}

// GET para verificação (alguns sistemas fazem GET antes de POST)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook" })
}


