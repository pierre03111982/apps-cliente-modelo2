"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"

type Category = {
  id: string
  label: string
  images: string[]
}

const CATEGORIES: Category[] = [
  {
    id: "masculino",
    label: "Masculino",
    images: ["A.png", "E.png"],
  },
  {
    id: "feminino",
    label: "Feminino",
    images: ["B.png", "F.png"],
  },
  {
    id: "meninos",
    label: "Meninos",
    images: ["C.png", "G.png"],
  },
  {
    id: "meninas",
    label: "Meninas",
    images: ["D.png", "H.png"],
  },
]

interface AvatarSelectorProps {
  onSelect?: (file: File) => void
}

export function AvatarSelector({ onSelect }: AvatarSelectorProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)

  const currentCategory = CATEGORIES[currentCategoryIndex]

  const handlePreviousCategory = () => {
    setCurrentCategoryIndex((prev) => (prev === 0 ? CATEGORIES.length - 1 : prev - 1))
    setSelectedAvatar(null)
  }

  const handleNextCategory = () => {
    setCurrentCategoryIndex((prev) => (prev === CATEGORIES.length - 1 ? 0 : prev + 1))
    setSelectedAvatar(null)
  }

  const handleAvatarClick = async (imageName: string) => {
    try {
      const imagePath = `/images/avatars/${imageName}`
      setSelectedAvatar(imagePath)

      // Converter a imagem para File
      const response = await fetch(imagePath)
      if (!response.ok) {
        throw new Error(`Erro ao carregar imagem: ${response.statusText}`)
      }

      const blob = await response.blob()
      const file = new File([blob], imageName, {
        type: blob.type || "image/png",
        lastModified: Date.now(),
      })

      // Passar o arquivo para o callback
      onSelect?.(file)
      toast.success("Avatar selecionado! Pronto para gerar.")
    } catch (error) {
      console.error("[AvatarSelector] Erro ao processar avatar:", error)
      toast.error("Erro ao selecionar avatar. Tente novamente.")
      setSelectedAvatar(null)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Modo privado ativado
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousCategory}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500"
            aria-label="Categoria anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-slate-700 dark:text-slate-200">
            {currentCategory.label}
          </span>
          <button
            type="button"
            onClick={handleNextCategory}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500"
            aria-label="Próxima categoria"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-600 dark:text-slate-300">
        Escolha um avatar para continuar sem enviar sua foto real.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {currentCategory.images.map((imageName) => {
          const imagePath = `/images/avatars/${imageName}`
          const isSelected = selectedAvatar === imagePath

          return (
            <button
              key={imageName}
              type="button"
              onClick={() => handleAvatarClick(imageName)}
              className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 shadow-lg shadow-green-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md"
              }`}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={imagePath}
                  alt={`Avatar ${currentCategory.label} - ${imageName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 dark:bg-green-500/30">
                    <div className="rounded-full bg-green-500 dark:bg-green-400 p-2 shadow-lg">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="rounded-lg bg-green-500 dark:bg-green-400 px-2 py-1 text-center text-xs font-semibold text-white shadow-md">
                    Selecionado
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}











