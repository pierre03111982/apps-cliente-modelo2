"use client"

import { useEffect, useRef, useState } from "react"

interface VideoBackgroundProps {
  videoSrc: string
  className?: string
}

/**
 * Componente de vídeo de fundo que:
 * - Se estiver conectado ao display: mostra frame estático (vídeo pausado)
 * - Se não estiver conectado: mostra vídeo reproduzindo normalmente em loop
 */
export function VideoBackground({ videoSrc, className = "" }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Verificar se está conectado ao display
  useEffect(() => {
    if (typeof window === "undefined") return

    const checkConnection = () => {
      const connectedStoreId = sessionStorage.getItem("connected_store_id")
      return !!connectedStoreId
    }

    setIsConnected(checkConnection())

    // Escutar mudanças no sessionStorage
    const handleStorageChange = () => {
      setIsConnected(checkConnection())
    }

    // Verificar periodicamente (para pegar mudanças na mesma aba)
    const interval = setInterval(handleStorageChange, 500)

    // Escutar eventos de storage (para mudanças de outras abas)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  // Se estiver conectado, capturar frame estático
  useEffect(() => {
    if (!isConnected) {
      // Se não estiver conectado, não precisa capturar frame
      setImageUrl(null)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const captureFrame = () => {
      try {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Configurar canvas com as dimensões do vídeo
        canvas.width = video.videoWidth || 1920
        canvas.height = video.videoHeight || 1080

        // Desenhar o primeiro frame no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Converter canvas para URL de imagem
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
        setImageUrl(dataUrl)

        // Pausar o vídeo após capturar o frame
        video.pause()
      } catch (error) {
        console.error("[VideoBackground] Erro ao capturar frame:", error)
        setImageUrl(null)
      }
    }

    // Quando o vídeo carregar metadata (dimensões disponíveis)
    const handleLoadedMetadata = () => {
      video.currentTime = 0
    }

    // Quando o frame estiver pronto
    const handleSeeked = () => {
      captureFrame()
    }

    // Quando houver dados suficientes
    const handleCanPlay = () => {
      if (video.readyState >= 2) {
        video.currentTime = 0
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("canplay", handleCanPlay)

    // Tentar carregar o frame imediatamente
    if (video.readyState >= 2) {
      video.currentTime = 0
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [videoSrc, isConnected])

  // Se estiver conectado, mostrar frame estático
  if (isConnected && imageUrl) {
    return (
      <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
        {/* Vídeo oculto para capturar frame */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute opacity-0 pointer-events-none"
          preload="metadata"
          muted
          playsInline
          crossOrigin="anonymous"
        />
        
        {/* Canvas oculto para renderizar frame */}
        <canvas ref={canvasRef} className="absolute opacity-0 pointer-events-none" />

        {/* Imagem estática de fundo */}
        <div
          className="fixed inset-0 h-screen w-screen"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        >
          {/* Overlay sutil para garantir legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>
      </div>
    )
  }

  // Se não estiver conectado, mostrar vídeo reproduzindo normalmente
  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectFit: "cover",
        }}
      />
      {/* Overlay sutil para garantir legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  )
}

