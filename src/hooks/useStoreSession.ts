import { useState, useEffect, useCallback } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"
import toast from "react-hot-toast"

const CONNECTED_STORE_KEY = "connected_store_id"
const TARGET_DISPLAY_KEY = "target_display"
const SESSION_ID_KEY = "display_session_id"
const LAST_INTERACTION_KEY = "display_last_interaction"
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos
const INACTIVITY_CHECK_INTERVAL = 60 * 1000 // 1 minuto

/**
 * Hook para gerenciar a sessão de conexão com a loja (Display)
 * Detecta se o cliente escaneou um QR Code que conecta à loja
 */
export function useStoreSession(lojistaId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectedStoreId, setConnectedStoreId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(SESSION_ID_KEY)
  })

  const clearSessionData = useCallback(() => {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(CONNECTED_STORE_KEY)
    sessionStorage.removeItem(TARGET_DISPLAY_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
    localStorage.removeItem(LAST_INTERACTION_KEY)
    setIsConnected(false)
    setConnectedStoreId(null)
    setSessionId(null)
  }, [])

  const claimDisplaySession = useCallback(
    async (displayUuid: string, newSessionId: string) => {
      if (!displayUuid || !isFirebaseConfigured) return
      try {
        const db = getFirestoreClient()
        if (!db) return

        await setDoc(
          doc(db, "displays", displayUuid),
          {
            activeSessionId: newSessionId,
            sessionClaimedAt: Date.now(),
          },
          { merge: true }
        )
      } catch (error) {
        console.error("[useStoreSession] Erro ao registrar sessão do display:", error)
      }
    },
    []
  )

  const ensureSessionId = useCallback(
    async (displayUuid: string | null) => {
      if (!displayUuid || typeof window === "undefined") return
      let storedSessionId = sessionStorage.getItem(SESSION_ID_KEY)
      if (!storedSessionId) {
        storedSessionId = crypto.randomUUID()
        sessionStorage.setItem(SESSION_ID_KEY, storedSessionId)
      }
      setSessionId(storedSessionId)
      await claimDisplaySession(displayUuid, storedSessionId)
      localStorage.setItem(LAST_INTERACTION_KEY, Date.now().toString())
    },
    [claimDisplaySession]
  )

  const handleDisconnect = useCallback(
    (reason?: string) => {
      clearSessionData()
      if (reason) {
        toast(reason)
      }
    },
    [clearSessionData]
  )

  const updateInteraction = useCallback(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(LAST_INTERACTION_KEY, Date.now().toString())
  }, [])

  useEffect(() => {
    if (!lojistaId || typeof window === "undefined") {
      clearSessionData()
      return
    }

    const storedConnection = sessionStorage.getItem(CONNECTED_STORE_KEY)
    if (storedConnection === lojistaId) {
      setIsConnected(true)
      setConnectedStoreId(lojistaId)
      setSessionId(sessionStorage.getItem(SESSION_ID_KEY))
      ensureSessionId(sessionStorage.getItem(TARGET_DISPLAY_KEY))
    } else {
      clearSessionData()
    }

    const params = new URLSearchParams(window.location.search)
    const connectParam = params.get("connect")
    const lojistaParam = params.get("lojista")
    const targetDisplayParam = params.get("target_display")

    if (connectParam === "true" && lojistaParam) {
      sessionStorage.setItem(CONNECTED_STORE_KEY, lojistaParam)
      if (targetDisplayParam) {
        sessionStorage.setItem(TARGET_DISPLAY_KEY, targetDisplayParam)
      }
      setIsConnected(true)
      setConnectedStoreId(lojistaParam)
      ensureSessionId(targetDisplayParam || sessionStorage.getItem(TARGET_DISPLAY_KEY))
      updateInteraction()

      params.delete("connect")
      params.delete("lojista")
      params.delete("target_display")
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
      window.history.replaceState({}, "", newUrl)
    }
  }, [lojistaId, clearSessionData, ensureSessionId])

  // Atualizar lastInteraction em eventos globais
  useEffect(() => {
    if (!isConnected || typeof window === "undefined") return

    updateInteraction()
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "touchstart"]
    events.forEach((event) => window.addEventListener(event, updateInteraction))

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateInteraction))
    }
  }, [isConnected])

  // Timeout de inatividade
  useEffect(() => {
    if (!isConnected || typeof window === "undefined") return

    const checkInactivity = () => {
      const lastInteraction = Number(localStorage.getItem(LAST_INTERACTION_KEY) || "0")
      if (lastInteraction && Date.now() - lastInteraction > INACTIVITY_TIMEOUT) {
        handleDisconnect("Desconectado por inatividade (30 min).")
      }
    }

    const interval = setInterval(checkInactivity, INACTIVITY_CHECK_INTERVAL)
    checkInactivity()

    return () => clearInterval(interval)
  }, [isConnected, handleDisconnect])

  // Monitorar sessão concorrente
  useEffect(() => {
    if (!isConnected || !sessionId || !isFirebaseConfigured || typeof window === "undefined") return
    const displayUuid = sessionStorage.getItem(TARGET_DISPLAY_KEY)
    if (!displayUuid) return

    const db = getFirestoreClient()
    if (!db) return

    const displayRef = doc(db, "displays", displayUuid)
    const unsubscribe = onSnapshot(displayRef, (snapshot) => {
      const data = snapshot.data()
      const activeSession = data?.activeSessionId
      if (activeSession && activeSession !== sessionId) {
        handleDisconnect("Desconectado: outro cliente assumiu o display.")
      }
    })

    return () => unsubscribe()
  }, [isConnected, sessionId, handleDisconnect])

  const disconnect = useCallback(() => {
    handleDisconnect("Conexão com o display encerrada.")
  }, [handleDisconnect])

  const connect = useCallback(
    (storeId: string, targetDisplay?: string) => {
      if (typeof window === "undefined") return
      sessionStorage.setItem(CONNECTED_STORE_KEY, storeId)
      if (targetDisplay) {
        sessionStorage.setItem(TARGET_DISPLAY_KEY, targetDisplay)
      }
      setIsConnected(true)
      setConnectedStoreId(storeId)
    ensureSessionId(targetDisplay || sessionStorage.getItem(TARGET_DISPLAY_KEY))
    updateInteraction()
    },
    [ensureSessionId, updateInteraction]
  )

  return {
    isConnected,
    connectedStoreId,
    disconnect,
    connect,
    sessionId,
    updateInteraction,
  }
}

export const markDisplayInteraction = () => {
  if (typeof window === "undefined") return
  localStorage.setItem(LAST_INTERACTION_KEY, Date.now().toString())
}




