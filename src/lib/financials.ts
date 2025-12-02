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

type CreditReservationResult =
  | {
      success: true
      reservationId: string
      remainingBalance: number
      planTier: LojistaFinancials["plan_tier"]
    }
  | {
      success: false
      status: number
      message: string
    }

const INSUFFICIENT_FUNDS_MESSAGE =
  "Créditos insuficientes. Recarregue sua carteira para continuar gerando looks."

/**
 * PHASE 27: Sistema de Reserva de Créditos
 * 
 * Em vez de debitar imediatamente, reservamos o crédito e só debitamos quando o usuário visualizar a imagem.
 */

/**
 * Reserva um crédito sem debitar permanentemente
 * Cria um registro de reserva que pode ser confirmada ou cancelada depois
 */
export async function reserveCredit(lojistaId: string): Promise<CreditReservationResult> {
  if (!lojistaId) {
    return {
      success: false,
      status: 400,
      message: "lojistaId é obrigatório para reserva de créditos.",
    }
  }

  let db;
  try {
    db = getFirestoreAdmin();
  } catch (firebaseError: any) {
    console.warn("[financials] Firebase Admin não configurado, permitindo reserva em modo sandbox:", firebaseError.message);
    // Em sandbox, criar reserva fake
    return {
      success: true,
      reservationId: `sandbox-${Date.now()}`,
      remainingBalance: 999999,
      planTier: "micro",
    };
  }

  const lojistaRef = db.collection("lojistas").doc(lojistaId);
  const reservationsRef = db.collection("credit_reservations");

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(lojistaRef);

      if (!snapshot.exists) {
        console.warn("[financials] Lojista não encontrado, permitindo reserva em modo sandbox");
        const reservationId = `sandbox-${Date.now()}`;
        return {
          success: true,
          reservationId,
          remainingBalance: 999999,
          planTier: "micro" as const,
        };
      }

      const docData = snapshot.data() || {};
      const isSandbox = Boolean(docData.is_sandbox_mode);
      const financials = docData.financials as LojistaFinancials | undefined;

      // Se estiver em modo sandbox OU não tiver dados financeiros configurados
      if (isSandbox || !financials) {
        const reservationId = `sandbox-${Date.now()}`;
        return {
          success: true,
          reservationId,
          remainingBalance: financials?.credits_balance ?? 999999,
          planTier: financials?.plan_tier ?? "micro",
        };
      }

      if (financials.billing_status === "frozen") {
        return {
          success: false,
          status: 403,
          message: "Conta bloqueada. Regularize seu faturamento para voltar a gerar looks.",
        };
      }

      const availableBalance = financials.credits_balance + financials.overdraft_limit;

      if (availableBalance <= 0) {
        return {
          success: false,
          status: 402,
          message: INSUFFICIENT_FUNDS_MESSAGE,
        };
      }

      // Criar registro de reserva
      const reservationId = `reservation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const reservationRef = reservationsRef.doc(reservationId);

      tx.set(reservationRef, {
        lojistaId,
        status: "reserved",
        amount: 1,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24 horas
        confirmedAt: null,
        cancelledAt: null,
      });

      // Não debitar ainda - apenas reservar
      // O saldo será debitado apenas quando commitCredit for chamado

      return {
        success: true,
        reservationId,
        remainingBalance: financials.credits_balance,
        planTier: financials.plan_tier,
      };
    });
  } catch (error: any) {
    console.error("[financials] Erro ao processar reserva de créditos:", error);
    
    if (error?.message?.includes("FIREBASE_PROJECT_ID") || 
        error?.message?.includes("FIREBASE_CLIENT_EMAIL") || 
        error?.message?.includes("FIREBASE_PRIVATE_KEY") ||
        error?.message?.includes("não configurada")) {
      console.warn("[financials] Firebase não configurado, permitindo reserva em modo sandbox");
      return {
        success: true,
        reservationId: `sandbox-${Date.now()}`,
        remainingBalance: 999999,
        planTier: "micro",
      };
    }
    
    return {
      success: false,
      status: 500,
      message: "Erro ao reservar créditos. Tente novamente em instantes.",
    };
  }
}

/**
 * Confirma o débito efetivo da reserva
 * Deve ser chamado quando o usuário visualizar a imagem
 */
export async function commitCredit(lojistaId: string, reservationId: string): Promise<{ success: boolean; message?: string }> {
  if (!lojistaId || !reservationId) {
    return {
      success: false,
      message: "lojistaId e reservationId são obrigatórios.",
    };
  }

  // Se for reserva sandbox, apenas confirmar sem debitar
  if (reservationId.startsWith("sandbox-")) {
    console.log("[financials] Confirmando reserva sandbox (sem débito):", reservationId);
    return { success: true };
  }

  let db;
  try {
    db = getFirestoreAdmin();
  } catch (firebaseError: any) {
    console.warn("[financials] Firebase Admin não configurado, confirmando reserva sandbox:", firebaseError.message);
    return { success: true };
  }

  const lojistaRef = db.collection("lojistas").doc(lojistaId);
  const reservationRef = db.collection("credit_reservations").doc(reservationId);

  try {
    return await db.runTransaction(async (tx) => {
      // Verificar se a reserva existe e está válida
      const reservationSnapshot = await tx.get(reservationRef);
      
      if (!reservationSnapshot.exists) {
        return {
          success: false,
          message: "Reserva não encontrada.",
        };
      }

      const reservationData = reservationSnapshot.data();
      
      if (reservationData?.status !== "reserved") {
        return {
          success: false,
          message: `Reserva já foi ${reservationData?.status === "confirmed" ? "confirmada" : "cancelada"}.`,
        };
      }

      // Verificar se a reserva não expirou
      const expiresAt = reservationData?.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        return {
          success: false,
          message: "Reserva expirada.",
        };
      }

      // Verificar saldo do lojista
      const lojistaSnapshot = await tx.get(lojistaRef);
      
      if (!lojistaSnapshot.exists) {
        return {
          success: false,
          message: "Lojista não encontrado.",
        };
      }

      const docData = lojistaSnapshot.data() || {};
      const financials = docData.financials as LojistaFinancials | undefined;
      const isSandbox = Boolean(docData.is_sandbox_mode);

      if (isSandbox || !financials) {
        // Em sandbox, apenas marcar como confirmada sem debitar
        tx.update(reservationRef, {
          status: "confirmed",
          confirmedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
      }

      const availableBalance = financials.credits_balance + financials.overdraft_limit;

      if (availableBalance <= 0) {
        return {
          success: false,
          message: INSUFFICIENT_FUNDS_MESSAGE,
        };
      }

      // Debitar crédito
      tx.update(lojistaRef, {
        "financials.credits_balance": FieldValue.increment(-1),
        "metrics.paid_credits_count": FieldValue.increment(1), // PHASE 27: Métrica de créditos pagos
      });

      // Marcar reserva como confirmada
      tx.update(reservationRef, {
        status: "confirmed",
        confirmedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("[financials] Erro ao confirmar crédito:", error);
    return {
      success: false,
      message: "Erro ao confirmar crédito. Tente novamente em instantes.",
    };
  }
}

/**
 * Cancela a reserva (rollback)
 * Deve ser chamado em caso de erro na geração da imagem
 */
export async function rollbackCredit(lojistaId: string, reservationId: string): Promise<{ success: boolean; message?: string }> {
  if (!lojistaId || !reservationId) {
    return {
      success: false,
      message: "lojistaId e reservationId são obrigatórios.",
    };
  }

  // Se for reserva sandbox, apenas cancelar sem fazer nada
  if (reservationId.startsWith("sandbox-")) {
    console.log("[financials] Cancelando reserva sandbox:", reservationId);
    return { success: true };
  }

  let db;
  try {
    db = getFirestoreAdmin();
  } catch (firebaseError: any) {
    console.warn("[financials] Firebase Admin não configurado, cancelando reserva sandbox:", firebaseError.message);
    return { success: true };
  }

  const reservationRef = db.collection("credit_reservations").doc(reservationId);

  try {
    return await db.runTransaction(async (tx) => {
      const reservationSnapshot = await tx.get(reservationRef);
      
      if (!reservationSnapshot.exists) {
        return {
          success: false,
          message: "Reserva não encontrada.",
        };
      }

      const reservationData = reservationSnapshot.data();
      
      if (reservationData?.status === "confirmed") {
        return {
          success: false,
          message: "Não é possível cancelar uma reserva já confirmada.",
        };
      }

      if (reservationData?.status === "cancelled") {
        return { success: true }; // Já estava cancelada
      }

      // Marcar reserva como cancelada
      tx.update(reservationRef, {
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("[financials] Erro ao cancelar reserva:", error);
    return {
      success: false,
      message: "Erro ao cancelar reserva. Tente novamente em instantes.",
    };
  }
}

/**
 * Função legada: consumeGenerationCredit
 * Mantida para compatibilidade, mas agora usa reserveCredit internamente
 * @deprecated Use reserveCredit + commitCredit em vez disso
 */
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
    return {
      allowed: true,
      sandbox: true,
      planTier: "micro",
      remainingBalance: 999999,
    };
  }

  const lojistaRef = db.collection("lojistas").doc(lojistaId)

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(lojistaRef)

      if (!snapshot.exists) {
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

      if (isSandbox || !financials) {
        return {
          allowed: true,
          sandbox: true,
          planTier: financials?.plan_tier ?? "micro",
          remainingBalance: financials?.credits_balance ?? 999999,
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
