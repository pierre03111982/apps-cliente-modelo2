"use client"

import { useState } from "react"
import { Cast, Check } from "lucide-react"
import toast from "react-hot-toast"
import { markDisplayInteraction } from "@/hooks/useStoreSession"

interface SendToDisplayButtonProps {
  imageUrl: string
  lojistaId: string
  displayUuid?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right"
}

/**
 * Botão para transmitir imagem para o display da loja
 * Só aparece se o cliente estiver conectado ao display
 */
export function SendToDisplayButton({
  imageUrl,
  lojistaId,
  displayUuid,
  className = "",
  size = "md",
  position = "bottom-left",
}: SendToDisplayButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Buscar displayUuid do sessionStorage se não foi fornecido
  const targetDisplay = displayUuid || (typeof window !== "undefined" ? sessionStorage.getItem("target_display") : null)
  
  // Verificar se está conectado
  const isConnected = typeof window !== "undefined" 
    ? sessionStorage.getItem("connected_store_id") === lojistaId 
    : false

  // Debug: Log informações de conexão
  if (typeof window !== "undefined" && imageUrl) {
    console.log("[SendToDisplayButton] Estado de conexão:", {
      isConnected,
      connectedStoreId: sessionStorage.getItem("connected_store_id"),
      lojistaId,
      targetDisplay,
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl.substring(0, 50) + "...",
    })
  }

  // Não mostrar se não estiver conectado ou não tiver displayUuid
  if (!isConnected || !targetDisplay || !imageUrl) {
    if (typeof window !== "undefined" && imageUrl) {
      console.warn("[SendToDisplayButton] Botão não será exibido:", {
        isConnected,
        targetDisplay,
        hasImageUrl: !!imageUrl,
      })
    }
    return null
  }

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const positionClasses = {
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
  }

  // Se className contém "relative", não usar fixed positioning
  const isRelative = className.includes("relative")

  const handleSendToDisplay = async () => {
    if (!imageUrl || !targetDisplay || isSending || sent) {
      console.warn("[SendToDisplayButton] handleSendToDisplay bloqueado:", {
        hasImageUrl: !!imageUrl,
        targetDisplay,
        isSending,
        sent,
      })
      return
    }

    console.log("[SendToDisplayButton] Iniciando transmissão para display:", {
      displayUuid: targetDisplay,
      lojistaId,
      imageUrl: imageUrl.substring(0, 50) + "...",
    })

    setIsSending(true)
    markDisplayInteraction()

    try {
      // Otimização: Pré-carregar a imagem para garantir que está pronta
      console.log("[SendToDisplayButton] Pré-carregando imagem...")
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          console.log("[SendToDisplayButton] Imagem pré-carregada com sucesso")
          resolve(img)
        }
        img.onerror = (err) => {
          console.warn("[SendToDisplayButton] Erro ao pré-carregar imagem:", err)
          reject(err)
        }
        img.src = imageUrl
        // Timeout de 5 segundos para pré-carregamento (aumentado)
        setTimeout(() => reject(new Error("Timeout ao pré-carregar imagem")), 5000)
      }).catch((err) => {
        // Continuar mesmo se pré-carregamento falhar
        console.warn("[SendToDisplayButton] Aviso: não foi possível pré-carregar imagem:", err)
      })

      // Otimizar: usar AbortController para timeout mais rápido e melhor resposta
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn("[SendToDisplayButton] Timeout atingido (15s), abortando requisição")
        controller.abort()
      }, 15000) // Timeout aumentado para 15 segundos (para imagens maiores)

      console.log("[SendToDisplayButton] Enviando requisição para /api/display/update...")
      const response = await fetch("/api/display/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayUuid: targetDisplay,
          imageUrl: imageUrl,
          lojistaId: lojistaId,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("[SendToDisplayButton] Resposta recebida:", {
        status: response.status,
        ok: response.ok,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[SendToDisplayButton] Erro na resposta:", {
          status: response.status,
          errorData,
        })
        throw new Error(errorData.error || `Erro ao enviar para o display (${response.status})`)
      }

      const responseData = await response.json().catch(() => ({}))
      console.log("[SendToDisplayButton] ✅ Transmissão bem-sucedida:", responseData)

      setSent(true)
      toast.success("Foto enviada para o display!", {
        duration: 2000,
        icon: "✅",
      })
      
      // Resetar estado após 2 segundos (mais rápido)
      setTimeout(() => {
        setSent(false)
      }, 2000)
    } catch (error: any) {
      console.error("[SendToDisplayButton] Erro ao enviar para display:", {
        error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      })
      
      if (error.name === "AbortError") {
        toast.error("Tempo de resposta excedido. Tente novamente.", {
          duration: 3000,
        })
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.", {
          duration: 3000,
        })
      } else {
        toast.error(error.message || "Erro ao enviar foto para o display", {
          duration: 3000,
        })
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleSendToDisplay()
      }}
      disabled={isSending || sent}
      className={`
        ${sizeClasses[size]}
        ${isRelative ? "" : `${positionClasses[position]} fixed`}
        ${className}
        ${isRelative ? "" : "z-40"}
        flex items-center justify-center
        rounded-full bg-indigo-600 shadow-lg
        border-2 border-white/50
        transition-all duration-200
        ${sent 
          ? "bg-green-500 scale-110" 
          : "hover:bg-indigo-700 hover:scale-110 active:scale-95"
        }
        ${isSending ? "opacity-70 cursor-wait" : "cursor-pointer"}
        backdrop-blur-sm
      `}
      title={sent ? "Enviado!" : "Enviar para o display da loja"}
    >
      {isSending ? (
        <div className={`${iconSizes[size]} animate-spin rounded-full border-2 border-white/30 border-t-white`} />
      ) : sent ? (
        <Check className={`${iconSizes[size]} text-white`} />
      ) : (
        <Cast className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  )
}




