"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { ProgressBars, useProgressSimulation, DEFAULT_PROGRESS_CATEGORIES } from "./ProgressBars"

const loadingMessages = [
  "Ajustando caimento nas curvas...",
  "Analisando sua foto com IA segura...",
  "Combinando tecidos e cores ideais...",
  "Criando cenário criativo exclusivo...",
  "Aplicando iluminação fotográfica...",
  "Finalizando os looks com watermark...",
]

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0)
  const progressCategories = useProgressSimulation()

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  // Calcular progresso geral (média de todas as categorias)
  const overallProgress = Math.round(
    progressCategories.reduce((sum, cat) => sum + cat.progress, 0) / progressCategories.length
  )

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <span className="rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-1">
            Experimente AI
          </span>
          <Loader2 className="h-14 w-14 animate-spin text-accent-1" />
          <div className="text-center">
            <p className="text-lg font-medium text-slate-700">
              {loadingMessages[messageIndex]}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Segura aí, estamos produzindo seus looks.
            </p>
          </div>
        </div>

        {/* Barra de progresso geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Progresso Geral
            </span>
            <span className="text-sm font-bold text-accent-1">
              {overallProgress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-accent-1 to-accent-2 transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Barras de progresso por categoria */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ajustes em Andamento
          </h3>
          <ProgressBars categories={progressCategories} />
        </div>
      </div>
    </div>
  )
}


