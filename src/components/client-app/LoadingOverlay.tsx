"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

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

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface/80 backdrop-blur-md">
      <span className="rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-1">
        Experimente AI
      </span>
      <Loader2 className="h-14 w-14 animate-spin text-accent-1" />
      <p className="text-lg font-medium text-slate-700">
        {loadingMessages[messageIndex]}
      </p>
      <p className="text-sm text-slate-400">Segura aí, estamos produzindo seus looks.</p>
    </div>
  )
}


