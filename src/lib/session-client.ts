/**
 * FASE 0.2: Cliente Helper para Sessão Segura
 * 
 * Funções auxiliares para gerenciar sessão do cliente via API (cookies HttpOnly)
 * Substitui o uso direto de localStorage
 */

export interface ClienteSession {
  clienteId: string;
  nome: string;
  whatsapp: string;
  lojistaId: string;
  deviceId: string;
  loggedAt: string;
}

/**
 * Obtém a sessão do cliente via API (lê cookie HttpOnly)
 */
export async function getClienteSession(lojistaId?: string): Promise<ClienteSession | null> {
  try {
    const response = await fetch("/api/cliente/session", {
      method: "GET",
      credentials: "include", // Incluir cookies
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.authenticated || !data.cliente) {
      return null;
    }

    // Se lojistaId fornecido, validar que corresponde
    if (lojistaId && data.cliente.lojistaId !== lojistaId) {
      return null;
    }

    // A API retorna 'id' mas a interface espera 'clienteId', fazer o mapeamento
    return {
      clienteId: data.cliente.id || data.cliente.clienteId,
      nome: data.cliente.nome || "",
      whatsapp: data.cliente.whatsapp || "",
      lojistaId: data.cliente.lojistaId,
      deviceId: data.cliente.deviceId || `device-${Date.now()}`,
      loggedAt: data.cliente.loggedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("[getClienteSession] Erro:", error);
    return null;
  }
}

/**
 * Salva a sessão do cliente via API (cria cookie HttpOnly)
 */
export async function setClienteSession(session: ClienteSession): Promise<boolean> {
  try {
    const response = await fetch("/api/cliente/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Incluir cookies
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[setClienteSession] Erro:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[setClienteSession] Erro:", error);
    return false;
  }
}

/**
 * Remove a sessão do cliente (logout)
 */
export async function removeClienteSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/cliente/session", {
      method: "DELETE",
      credentials: "include", // Incluir cookies
    });

    return response.ok;
  } catch (error) {
    console.error("[removeClienteSession] Erro:", error);
    return false;
  }
}

/**
 * Hook de compatibilidade: Migração gradual de localStorage
 * 
 * Esta função tenta ler da sessão segura primeiro, e se não encontrar,
 * tenta ler do localStorage (para manter compatibilidade durante migração)
 * 
 * @deprecated Use getClienteSession() diretamente após migração completa
 */
export async function getClienteSessionWithFallback(lojistaId: string): Promise<ClienteSession | null> {
  // Tentar sessão segura primeiro
  const secureSession = await getClienteSession(lojistaId);
  if (secureSession) {
    return secureSession;
  }

  // Fallback: localStorage (durante migração)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Migrar para cookie se encontrar no localStorage
        if (data.clienteId && data.lojistaId) {
          await setClienteSession({
            clienteId: data.clienteId,
            nome: data.nome || "",
            whatsapp: data.whatsapp || "",
            lojistaId: data.lojistaId,
            deviceId: data.deviceId || `device-${Date.now()}`,
            loggedAt: data.loggedAt || new Date().toISOString(),
          });
          // Remover do localStorage após migração
          localStorage.removeItem(`cliente_${lojistaId}`);
          return await getClienteSession(lojistaId);
        }
      }
    } catch (error) {
      console.error("[getClienteSessionWithFallback] Erro ao ler localStorage:", error);
    }
  }

  return null;
}


