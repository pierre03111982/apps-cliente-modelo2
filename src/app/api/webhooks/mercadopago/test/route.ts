import { NextResponse } from "next/server"
import { getFirestoreAdmin } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Rota de teste para verificar se o webhook está configurado corretamente
 * Acesse: https://app2.experimenteai.com.br/api/webhooks/mercadopago/test
 */
export async function GET() {
  try {
    const db = getFirestoreAdmin()
    
    // Verificar se há lojas configuradas
    const lojasSnapshot = await db.collection("lojas").limit(5).get()
    const lojas = lojasSnapshot.docs.map((doc) => {
      const data = doc.data()
      const salesConfig = data?.salesConfig || data?.sales_config
      return {
        lojistaId: doc.id,
        nome: data?.nome || data?.name || "Sem nome",
        temMercadoPago: !!salesConfig?.integrations?.mercadopago_access_token,
        paymentGateway: salesConfig?.payment_gateway || "não configurado",
      }
    })

    return NextResponse.json({
      status: "ok",
      message: "Webhook está acessível e funcionando",
      timestamp: new Date().toISOString(),
      webhookUrl: "https://app2.experimenteai.com.br/api/webhooks/mercadopago",
      lojas: lojas,
      totalLojas: lojasSnapshot.size,
      instrucoes: {
        passo1: "Configure a URL do webhook no Mercado Pago: https://app2.experimenteai.com.br/api/webhooks/mercadopago",
        passo2: "Marque o evento 'Pagamentos' nas configurações do webhook",
        passo3: "Teste fazendo um pagamento de teste no modo sandbox",
        passo4: "Verifique os logs da Vercel para ver as notificações recebidas",
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Erro ao verificar configuração",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

