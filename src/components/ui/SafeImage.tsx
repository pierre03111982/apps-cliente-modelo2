"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  style?: React.CSSProperties
  onClick?: () => void
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  loading?: "lazy" | "eager"
  title?: string
}

/**
 * Componente SafeImage - Blindado contra imagens que estouram o container
 * 
 * Características:
 * - Usa position: relative inline para garantir que nunca ultrapasse o container pai
 * - Placeholder SVG quando a imagem falha
 * - Suporta todas as props padrão de img
 */
export function SafeImage({
  src,
  alt,
  className,
  containerClassName,
  style,
  onClick,
  onError,
  loading = "lazy",
  title,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("[SafeImage] Erro ao carregar imagem:", {
      src: src?.substring(0, 100) + "...",
      srcLength: src?.length || 0,
      srcType: src?.startsWith("data:") ? "data URL" : src?.startsWith("http") ? "HTTP URL" : "outro",
      error: e,
    })
    setHasError(true)
    setIsLoading(false)
    if (onError) {
      onError(e)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // Placeholder SVG quando há erro (declarado antes de ser usado)
  const placeholderSvg = (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-gray-400", className)}
      style={style}
    >
      <rect width="200" height="200" fill="#f3f4f6" />
      <path
        d="M60 80L100 60L140 80V140H60V80Z"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="85" cy="95" r="8" fill="#9ca3af" />
      <path
        d="M60 120L75 110L90 120L110 110L140 120V140H60V120Z"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
  
  // Validar URL antes de renderizar
  if (!src || src.trim() === "") {
    console.warn("[SafeImage] URL vazia ou inválida:", src)
    return (
      <div
        className={cn("flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-[200px] p-4", className)}
        style={{ position: "relative", ...style }}
        title={title || "Imagem não disponível"}
      >
        {placeholderSvg}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">URL da imagem inválida</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center bg-gray-100 min-h-[200px] p-4", className)}
        style={{ position: "relative", ...style }}
        title={title || "Erro ao carregar imagem"}
      >
        {placeholderSvg}
        <p className="mt-2 text-xs text-gray-500 text-center">Imagem não disponível</p>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        width: "100%",
        ...style,
      }}
      className={cn("inline-block", containerClassName)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "block max-w-full h-auto transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100 animate-fade-in",
          className
        )}
        style={{
          position: "relative",
          maxWidth: "100%",
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "contain",
        }}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        title={title}
      />
    </div>
  )
}

