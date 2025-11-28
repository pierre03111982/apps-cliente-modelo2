/**
 * PHASE 12: Logger Centralizado para Modelo-2
 * Salva erros críticos no Firestore system_logs
 */

import { getFirestoreAdmin } from "./firebaseAdmin";

/**
 * Helper function logError para facilitar uso em catch blocks
 * Salva erros críticos no Firestore system_logs
 */
export async function logError(
  context: string,
  error: Error | unknown,
  additionalContext?: {
    userId?: string;
    storeId?: string;
    errorType?: string;
    [key: string]: any;
  }
): Promise<void> {
  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const db = getFirestoreAdmin();
    
    const logEntry = {
      level: "error",
      message: `[${context}] ${errorObj.message}`,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
      context: {
        errorType: additionalContext?.errorType || "UnknownError",
        ...additionalContext,
      },
      userId: additionalContext?.userId,
      lojistaId: additionalContext?.storeId,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };

    await db.collection("system_logs").add(logEntry);
  } catch (saveError) {
    // Se falhar ao salvar no Firestore, pelo menos logar no console
    console.error("[logError] Erro ao salvar log no Firestore:", saveError);
  }
}

