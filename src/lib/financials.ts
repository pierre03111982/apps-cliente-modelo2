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

  // Se Firebase Admin não estiver configurado, permitir geração em modo sandbox
  let db;
  try {
    db = getFirestoreAdmin();
  } catch (firebaseError: any) {
    console.warn("[financials] Firebase Admin não configurado, permitindo geração em modo sandbox:", firebaseError.message);
    // Se Firebase não estiver configurado, permitir geração (modo sandbox)
    return {
      allowed: true,
      sandbox: true,
      planTier: "micro",
      remainingBalance: 999999, // Créditos ilimitados em sandbox
    };
  }

  const lojistaRef = db.collection("lojistas").doc(lojistaId)

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(lojistaRef)

      if (!snapshot.exists) {
        // Se lojista não existe, permitir em modo sandbox
        console.warn("[financials] Lojista não encontrado, permitindo em modo sandbox");
        return {
          allowed: true,
          sandbox: true,
          planTier: "micro",
          remainingBalance: 999999,
        }
      }

      const docData = snapshot.data() || {}
      const isSandbox = Boolean(docData.is_sandbox_mode)
      const financials = docData.financials as LojistaFinancials | undefined

      // Se estiver em modo sandbox OU não tiver dados financeiros configurados,
      // permitir geração (tratar como sandbox)
      if (isSandbox || !financials) {
        return {
          allowed: true,
          sandbox: true,
          planTier: financials?.plan_tier ?? "micro",
          remainingBalance: financials?.credits_balance ?? 999999, // Créditos ilimitados em sandbox
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

      // Decrementar créditos apenas se não estiver em sandbox
      if (!isSandbox) {
        tx.update(lojistaRef, {
          "financials.credits_balance": FieldValue.increment(-1),
        })
      }

      return {
        allowed: true,
        planTier: financials.plan_tier,
        remainingBalance: isSandbox ? financials.credits_balance : financials.credits_balance - 1,
      }
    })
  } catch (error: any) {
    console.error("[financials] Erro ao processar transação de créditos:", error)
    
    // Se o erro for relacionado a Firebase não configurado, permitir em modo sandbox
    if (error?.message?.includes("FIREBASE_PROJECT_ID") || 
        error?.message?.includes("FIREBASE_CLIENT_EMAIL") || 
        error?.message?.includes("FIREBASE_PRIVATE_KEY") ||
        error?.message?.includes("não configurada")) {
      console.warn("[financials] Firebase não configurado, permitindo em modo sandbox");
      return {
        allowed: true,
        sandbox: true,
        planTier: "micro",
        remainingBalance: 999999,
      };
    }
    
    return {
      allowed: false,
      status: 500,
      message: "Erro ao validar créditos. Tente novamente em instantes.",
    }
  }
}


