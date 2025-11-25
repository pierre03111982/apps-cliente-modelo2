import { useState, useEffect } from "react"

/**
 * Hook para gerenciar a sessão de conexão com a loja (Display)
 * Detecta se o cliente escaneou um QR Code que conecta à loja
 */
export function useStoreSession(lojistaId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectedStoreId, setConnectedStoreId] = useState<string | null>(null)

  useEffect(() => {
    if (!lojistaId) {
      setIsConnected(false)
      setConnectedStoreId(null)
      return
    }

    // Verificar se há conexão salva no sessionStorage
    const storedConnection = sessionStorage.getItem("connected_store_id")
    const targetDisplay = sessionStorage.getItem("target_display")

    if (storedConnection === lojistaId) {
      setIsConnected(true)
      setConnectedStoreId(lojistaId)
    } else {
      setIsConnected(false)
      setConnectedStoreId(null)
    }

    // Verificar parâmetros da URL ao carregar (pode vir de QR Code)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const connectParam = params.get("connect")
      const lojistaParam = params.get("lojista")
      const targetDisplayParam = params.get("target_display")

      // Se veio do QR Code com connect=true
      if (connectParam === "true" && lojistaParam) {
        // Salvar conexão
        sessionStorage.setItem("connected_store_id", lojistaParam)
        
        if (targetDisplayParam) {
          sessionStorage.setItem("target_display", targetDisplayParam)
        }

        setIsConnected(true)
        setConnectedStoreId(lojistaParam)

        // Remover parâmetros da URL para limpar
        params.delete("connect")
        params.delete("lojista")
        params.delete("target_display")
        
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
        window.history.replaceState({}, "", newUrl)
      }
    }
  }, [lojistaId])

  const disconnect = () => {
    sessionStorage.removeItem("connected_store_id")
    sessionStorage.removeItem("target_display")
    setIsConnected(false)
    setConnectedStoreId(null)
  }

  const connect = (storeId: string, targetDisplay?: string) => {
    sessionStorage.setItem("connected_store_id", storeId)
    if (targetDisplay) {
      sessionStorage.setItem("target_display", targetDisplay)
    }
    setIsConnected(true)
    setConnectedStoreId(storeId)
  }

  return {
    isConnected,
    connectedStoreId,
    disconnect,
    connect,
  }
}

