"use client"

import { useEffect, useRef, useState } from "react"

interface StaticVideoBackgroundProps {
  videoSrc: string
  className?: string
}

/**
 * Componente que exibe o primeiro frame do vídeo como imagem estática de fundo
 * Usa canvas para capturar e renderizar o frame
 */
export function StaticVideoBackground({ videoSrc, className = "" }: StaticVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
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
        console.error("[StaticVideoBackground] Erro ao capturar frame:", error)
        // Fallback: usar gradiente similar ao vídeo
        setImageUrl(null)
      }
    }

    // Quando o vídeo carregar metadata (dimensões disponíveis)
    const handleLoadedMetadata = () => {
      // Ir para o primeiro frame (0 segundos)
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
  }, [videoSrc])

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

      {/* Imagem estática de fundo - FIXA ao viewport (não move ao rolar) */}
      {imageUrl ? (
        <div
          className="fixed inset-0 h-screen w-screen"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed", // Fixa ao viewport
          }}
        >
          {/* Overlay sutil para garantir legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </div>
      ) : (
        // Fallback: gradiente similar ao estilo do vídeo enquanto carrega
        <div
          className="fixed inset-0 h-screen w-screen"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
            backgroundAttachment: "fixed", // Fixa ao viewport
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
    </div>
  )
}

