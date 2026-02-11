/**
 * FASE 0.2: Hook para gerenciar sessão do cliente
 * 
 * Substitui o uso direto de localStorage.getItem(`cliente_${lojistaId}`)
 */

import { useState, useEffect } from "react";
import { getClienteSessionWithFallback, type ClienteSession } from "@/lib/session-client";

export function useClienteSession(lojistaId: string | null | undefined) {
  const [session, setSession] = useState<ClienteSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojistaId) {
      setSession(null);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        const clienteSession = await getClienteSessionWithFallback(lojistaId);
        setSession(clienteSession);
      } catch (error) {
        console.error("[useClienteSession] Erro ao carregar sessão:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [lojistaId]);

  return { session, loading, isAuthenticated: !!session };
}




