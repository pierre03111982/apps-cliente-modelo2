"use client"

import { useState } from "react"
import { Cast, Check } from "lucide-react"
import toast from "react-hot-toast"

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

  // Não mostrar se não estiver conectado ou não tiver displayUuid
  if (!isConnected || !targetDisplay || !imageUrl) {
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
    if (!imageUrl || !targetDisplay || isSending || sent) return

    setIsSending(true)

    try {
      // Otimização: Pré-carregar a imagem para garantir que está pronta
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageUrl
        // Timeout de 3 segundos para pré-carregamento
        setTimeout(() => reject(new Error("Timeout ao pré-carregar imagem")), 3000)
      }).catch(() => {
        // Continuar mesmo se pré-carregamento falhar
        console.warn("[SendToDisplayButton] Aviso: não foi possível pré-carregar imagem")
      })

      // Otimizar: usar AbortController para timeout mais rápido e melhor resposta
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout reduzido para 5 segundos

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao enviar para o display")
      }

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
      console.error("[SendToDisplayButton] Erro ao enviar para display:", error)
      if (error.name === "AbortError") {
        toast.error("Tempo de resposta excedido. Tente novamente.")
      } else {
        toast.error(error.message || "Erro ao enviar foto para o display")
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




