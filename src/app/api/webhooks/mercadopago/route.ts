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

    // Buscar informações do pagamento no Mercado Pago
    // Nota: Para verificar o pagamento, precisamos do access_token do lojista
    // Vamos buscar o pedido pelo external_reference primeiro
    const db = getFirestoreAdmin()

    // Buscar pedido pelo payment_id em todas as lojas
    // (Em produção, você pode otimizar isso usando um índice ou estrutura diferente)
    const lojasSnapshot = await db.collection("lojas").get()

    let orderFound = false

    for (const lojaDoc of lojasSnapshot.docs) {
      const lojistaId = lojaDoc.id
      const ordersRef = lojaDoc.ref.collection("orders")
      const ordersSnapshot = await ordersRef.where("payment_id", "==", paymentId).get()

      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0]
        const orderData = orderDoc.data()

        // Buscar access_token do lojista para verificar o pagamento
        const lojistaData = lojaDoc.data()
        const salesConfig = lojistaData?.salesConfig || lojistaData?.sales_config
        const accessToken = salesConfig?.integrations?.mercadopago_access_token

        if (accessToken) {
          // Configurar SDK do Mercado Pago
          const client = new MercadoPagoConfig({ accessToken })
          const paymentClient = new Payment(client)

          try {
            // Buscar informações do pagamento
            const payment = await paymentClient.get({ id: parseInt(paymentId) })

            if (payment) {
              const paymentData = payment
              const status = paymentData.status

              console.log("[webhooks/mercadopago] Status do pagamento:", {
                paymentId,
                status,
                externalReference: paymentData.external_reference,
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
                payment_status: status,
                payment_data: {
                  id: paymentData.id,
                  status: paymentData.status,
                  status_detail: paymentData.status_detail,
                  transaction_amount: paymentData.transaction_amount,
                  date_approved: paymentData.date_approved,
                  date_created: paymentData.date_created,
                },
                updatedAt: new Date(),
              })

              console.log("[webhooks/mercadopago] Pedido atualizado:", {
                orderId: orderDoc.id,
                lojistaId,
                status: orderStatus,
              })

              orderFound = true

              // Se o pagamento foi aprovado, podemos fazer outras ações:
              // - Deduzir estoque
              // - Enviar notificação para o lojista
              // - Enviar email de confirmação para o cliente
              if (status === "approved") {
                // TODO: Implementar dedução de estoque
                // TODO: Implementar notificações
                console.log("[webhooks/mercadopago] Pagamento aprovado! Pedido:", orderDoc.id)
              }
            }
          } catch (error: any) {
            console.error("[webhooks/mercadopago] Erro ao buscar pagamento:", error)
            // Continuar mesmo se houver erro ao buscar o pagamento
          }
        } else {
          console.warn("[webhooks/mercadopago] Access token não encontrado para lojista:", lojistaId)
        }

        break // Encontrou o pedido, pode parar
      }
    }

    if (!orderFound) {
      console.warn("[webhooks/mercadopago] Pedido não encontrado para payment_id:", paymentId)
    }

    return NextResponse.json({ received: true, processed: orderFound })
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


