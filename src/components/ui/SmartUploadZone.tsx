'use client'

import React, { useRef, useState, useEffect } from "react"
import { Camera, UploadCloud, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"

// Importar imagens diretamente para garantir que sejam incluídas no build
const GUIDE_SLIDES = [
  {
    id: 1,
    image: "/images/4.jpg",
    title: "A Luz é Tudo",
    text: "Evite fotos contra a luz ou no escuro. A IA precisa ver os detalhes.",
  },
  {
    id: 2,
    image: "/images/2.jpg",
    title: "Roupa Justa Ajuda",
    text: "Roupas muito largas confundem a IA. Se possível, use peças mais justas.",
  },
  {
    id: 3,
    image: "/images/3.jpg",
    title: "Evite Bagunça",
    text: "Objetos atrás de você podem atrapalhar. Prefira uma parede lisa ou fundo limpo.",
  },
  {
    id: 4,
    image: "/images/1.jpg",
    title: "Limpe o Espelho",
    text: "Manchas e sujeira no espelho criam distorções na sua roupa nova.",
  },
]

interface SmartUploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function SmartUploadZone({ onFileSelect, isLoading }: SmartUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [qualityWarning, setQualityWarning] = useState<string | null>(null)
  const [imageError, setImageError] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % GUIDE_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Resetar erro de imagem quando o slide mudar
  useEffect(() => {
    setImageError(null)
  }, [currentSlide])

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % GUIDE_SLIDES.length)
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev === 0 ? GUIDE_SLIDES.length - 1 : prev - 1))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) validateAndProcess(e.dataTransfer.files[0])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndProcess(e.target.files[0])
  }

  const validateAndProcess = (file: File) => {
    setQualityWarning(null)
    if (file.size < 50 * 1024) setQualityWarning("Atenção: Imagem muito pequena.")
    onFileSelect(file)
  }

  return (
    <div className="w-full space-y-4 select-none">
      <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
        <div className="relative aspect-[16/9] bg-gray-200 transition-opacity duration-500 md:aspect-[2.5/1]">
          {imageError === currentSlide ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-300">
              <div className="text-center text-gray-500">
                <UploadCloud className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Imagem não disponível</p>
              </div>
            </div>
          ) : (
            <img
              key={`slide-${currentSlide}-${Date.now()}`}
              src={`${GUIDE_SLIDES[currentSlide].image}?v=1`}
              alt={GUIDE_SLIDES[currentSlide].title}
              className="h-full w-full object-contain opacity-95 md:object-cover transition-opacity duration-500"
              onError={(e) => {
                const imgSrc = GUIDE_SLIDES[currentSlide].image
                console.error("[SmartUploadZone] Erro ao carregar imagem:", imgSrc, e)
                setImageError(currentSlide)
              }}
              onLoad={() => {
                // Limpar erro se a imagem carregar com sucesso
                if (imageError === currentSlide) {
                  setImageError(null)
                }
              }}
              loading={currentSlide === 0 ? "eager" : "lazy"}
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 pt-10 text-center">
            <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
              <h3 className="text-sm font-bold text-white drop-shadow-md md:text-base">
                {GUIDE_SLIDES[currentSlide].title}
              </h3>
              <p className="mx-auto max-w-md text-xs leading-tight text-white/90 md:text-sm">
                {GUIDE_SLIDES[currentSlide].text}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1.5">
          {GUIDE_SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-1.5 rounded-full shadow-sm transition-all duration-300 ${
                idx === currentSlide ? "w-4 bg-white" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className={`relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
          dragActive ? "border-accent-1 bg-accent-1/5" : "border-gray-300 bg-surface hover:bg-gray-50"
        } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <div className="rounded-full bg-white p-3 shadow-sm">
            {isLoading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-accent-1" />
            ) : (
              <UploadCloud className="h-6 w-6 text-accent-1" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Toque para enviar sua foto</p>
            <p className="text-xs text-gray-400">ou arraste aqui</p>
          </div>
          <Button variant="ghost" size="sm" className="pointer-events-none mt-1 h-8 text-xs">
            <Camera className="mr-2 h-3 w-3" />
            Câmera
          </Button>
        </div>
      </div>

      {qualityWarning && (
        <div className="flex items-center gap-2 rounded border border-yellow-100 bg-yellow-50 p-2 text-xs text-yellow-700 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-4 w-4" /> {qualityWarning}
        </div>
      )}
    </div>
  )
}


