import { FieldValue } from "firebase-admin/firestore"
import { getFirestoreAdmin } from "./firebaseAdmin"
import { LojistaFinancials } from "./types"

type CreditCheckResult =
  | {
      allowed: true
      sandbox?: boolean
      remainingBalance: number
      planTier: LojistaFinancials["plan_tier"]
    }
  | {
      allowed: false
      status: number
      message: string
    }

const INSUFFICIENT_FUNDS_MESSAGE =
  "Créditos insuficientes. Recarregue sua carteira para continuar gerando looks."

export async function consumeGenerationCredit(lojistaId?: string): Promise<CreditCheckResult> {
  if (!lojistaId) {
    return {
      allowed: false,
      status: 400,
      message: "lojistaId é obrigatório para validação de créditos.",
    }
  }

  const db = getFirestoreAdmin()
  const lojistaRef = db.collection("lojistas").doc(lojistaId)

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(lojistaRef)

      if (!snapshot.exists) {
        return {
          allowed: false,
          status: 404,
          message: "Lojista não encontrado para validação financeira.",
        }
      }

      const docData = snapshot.data() || {}
      const isSandbox = Boolean(docData.is_sandbox_mode)
      const financials = docData.financials as LojistaFinancials | undefined

      if (isSandbox) {
        return {
          allowed: true,
          sandbox: true,
          planTier: financials?.plan_tier ?? "micro",
          remainingBalance: financials?.credits_balance ?? 0,
        }
      }

      if (!financials) {
        return {
          allowed: false,
          status: 400,
          message: "Dados financeiros não encontrados. Configure a carteira para continuar.",
        }
      }

      if (financials.billing_status === "frozen") {
        return {
          allowed: false,
          status: 403,
          message: "Conta bloqueada. Regularize seu faturamento para voltar a gerar looks.",
        }
      }

      const availableBalance = financials.credits_balance + financials.overdraft_limit

      if (availableBalance <= 0) {
        return {
          allowed: false,
          status: 402,
          message: INSUFFICIENT_FUNDS_MESSAGE,
        }
      }

      tx.update(lojistaRef, {
        "financials.credits_balance": FieldValue.increment(-1),
      })

      return {
        allowed: true,
        planTier: financials.plan_tier,
        remainingBalance: financials.credits_balance - 1,
      }
    })
  } catch (error) {
    console.error("[financials] Erro ao processar transação de créditos:", error)
    return {
      allowed: false,
      status: 500,
      message: "Erro ao validar créditos. Tente novamente em instantes.",
    }
  }
}

