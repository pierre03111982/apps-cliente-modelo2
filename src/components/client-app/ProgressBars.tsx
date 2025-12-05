"use client"

import { useEffect, useState } from "react"

export interface ProgressCategory {
  id: string
  label: string
  progress: number // 0 a 100
  color: string
}

interface ProgressBarsProps {
  categories: ProgressCategory[]
  className?: string
}

export function ProgressBars({ categories, className = "" }: ProgressBarsProps) {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {category.label}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {Math.round(category.progress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${category.progress}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Categorias padrão de ajustes na geração de imagens
export const DEFAULT_PROGRESS_CATEGORIES: ProgressCategory[] = [
  {
    id: "image-processing",
    label: "Processamento de Imagens",
    progress: 0,
    color: "#3b82f6", // blue-500
  },
  {
    id: "product-analysis",
    label: "Análise de Produtos",
    progress: 0,
    color: "#8b5cf6", // violet-500
  },
  {
    id: "prompt-generation",
    label: "Geração de Prompt",
    progress: 0,
    color: "#ec4899", // pink-500
  },
  {
    id: "ai-generation",
    label: "Geração com IA",
    progress: 0,
    color: "#f59e0b", // amber-500
  },
  {
    id: "post-processing",
    label: "Pós-processamento",
    progress: 0,
    color: "#10b981", // emerald-500
  },
  {
    id: "finalization",
    label: "Finalização",
    progress: 0,
    color: "#06b6d4", // cyan-500
  },
]

// Hook para simular progresso automático (para demonstração)
export function useProgressSimulation() {
  const [categories, setCategories] = useState<ProgressCategory[]>(
    DEFAULT_PROGRESS_CATEGORIES.map(cat => ({ ...cat }))
  )

  useEffect(() => {
    let isMounted = true
    const intervals: NodeJS.Timeout[] = []
    
    categories.forEach((_, index) => {
      const interval = setInterval(() => {
        if (!isMounted) return

        setCategories((prev) => {
          const newCategories = prev.map(cat => ({ ...cat }))
          const currentCategory = newCategories[index]
          
          // Só incrementa se a categoria anterior estiver completa ou se for a primeira
          const prevCategory = index > 0 ? newCategories[index - 1] : null
          const canProgress = !prevCategory || prevCategory.progress >= 100
          
          if (canProgress && currentCategory.progress < 100) {
            // Progresso mais suave e realista
            const increment = currentCategory.progress < 50 
              ? Math.random() * 12 + 8  // Mais rápido no início
              : Math.random() * 8 + 4   // Mais lento no final
            
            currentCategory.progress = Math.min(
              100,
              currentCategory.progress + increment
            )
          }
          
          return newCategories
        })
      }, 600 + Math.random() * 400) // Intervalo variável entre 600-1000ms
      
      intervals.push(interval)
    })

    return () => {
      isMounted = false
      intervals.forEach((interval) => clearInterval(interval))
    }
  }, [])

  return categories
}

// Hook para usar progresso real da API (quando disponível)
export function useProgressFromAPI(jobId?: string | null) {
  const [categories, setCategories] = useState<ProgressCategory[]>(
    DEFAULT_PROGRESS_CATEGORIES.map(cat => ({ ...cat }))
  )

  useEffect(() => {
    if (!jobId) {
      // Se não tem jobId, usa simulação
      return
    }

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) return
        
        const data = await response.json()
        
        // Se a API retornar progresso estruturado, atualiza as categorias
        if (data.progress && Array.isArray(data.progress)) {
          setCategories(data.progress)
        }
      } catch (error) {
        console.error("Erro ao buscar progresso:", error)
      }
    }

    const interval = setInterval(pollProgress, 2000) // Poll a cada 2 segundos
    pollProgress() // Primeira chamada imediata

    return () => clearInterval(interval)
  }, [jobId])

  return categories
}

