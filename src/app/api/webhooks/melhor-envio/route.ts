import { NextRequest, NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"
import { logError } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Webhook do Melhor Envio
 * Recebe notificações sobre atualizações de etiquetas e status de envio
 * 
 * Eventos suportados:
 * - Atualização das etiquetas criadas e editadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    console.log("[webhooks/melhor-envio] Webhook recebido:", {
      timestamp: new Date().toISOString(),
      event: body.event || body.type,
      data: body,
    })

    // Verificar se é uma atualização de etiqueta
    if (body.event === "label.updated" || body.type === "label.updated" || body.status) {
      const orderId = body.order_id || body.external_reference || body.id
      const status = body.status || body.event_status
      const trackingCode = body.tracking_code || body.tracking

      if (orderId) {
        // Buscar pedido no Firestore
        const db = getFirestoreAdmin()
        
        // Tentar encontrar o pedido pelo order_id ou external_reference
        // O order_id pode estar no formato: order_{lojistaId}_{timestamp}
        const orderIdMatch = String(orderId).match(/^order_(.+?)_(\d+)$/)
        
        if (orderIdMatch) {
          const lojistaId = orderIdMatch[1]
          const ordersRef = db.collection("lojas").doc(lojistaId).collection("orders")
          
          // Buscar pedido mais recente que corresponde (pode ter múltiplos)
          const ordersSnapshot = await ordersRef
            .where("preference_id", "!=", null)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()

          let orderFound = false
          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data()
            
            // Atualizar status do pedido
            await orderDoc.ref.update({
              shipping_status: status || "pending",
              tracking_code: trackingCode || orderData.tracking_code || null,
              melhor_envio_data: body,
              updatedAt: new Date(),
            })

            console.log("[webhooks/melhor-envio] Pedido atualizado:", {
              orderId: orderDoc.id,
              lojistaId,
              status,
              trackingCode,
            })

            orderFound = true
            break
          }

          if (!orderFound) {
            console.warn("[webhooks/melhor-envio] Pedido não encontrado para orderId:", orderId)
          }
        } else {
          // Tentar buscar por lojistaId diretamente se não estiver no formato esperado
          // Neste caso, precisaríamos de mais informações no body
          console.warn("[webhooks/melhor-envio] Formato de orderId não reconhecido:", orderId)
        }
      }
    }

    // Retornar sucesso
    return NextResponse.json({ 
      success: true,
      message: "Webhook processado com sucesso" 
    }, { status: 200 })

  } catch (error) {
    console.error("[webhooks/melhor-envio] Erro ao processar webhook:", error)
    
    // Logar erro no Firestore
    await logError(
      "Webhook - Melhor Envio",
      error instanceof Error ? error : new Error(String(error)),
      {
        errorType: "WebhookError",
        provider: "melhor-envio",
      }
    ).catch(err => console.error("[Webhook] Erro ao salvar log:", err))
    
    // Retornar erro mas com status 200 para não causar retry excessivo
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar webhook" 
    }, { status: 200 })
  }
}

/**
 * GET para verificar se o webhook está funcionando
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: "ok",
    message: "Webhook do Melhor Envio está ativo",
    timestamp: new Date().toISOString(),
  })
}

