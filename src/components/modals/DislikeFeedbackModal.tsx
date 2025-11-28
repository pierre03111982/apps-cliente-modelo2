'use client'

import { DislikeReason } from "@/lib/types"
import { AlertTriangle, Frown, Sparkles, Shirt } from "lucide-react"
import { Button } from "@/components/ui/Button"
import clsx from "clsx"

interface DislikeFeedbackModalProps {
  open: boolean
  isSubmitting?: boolean
  onSelect: (reason: DislikeReason) => void
  onSkip: () => void
  onClose?: () => void
}

const OPTIONS: Array<{
  reason: DislikeReason
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    reason: "garment_style",
    label: "Não gostei da peça",
    description: "Modelo, cor ou estilo não combinou comigo.",
    icon: Shirt,
  },
  {
    reason: "fit_issue",
    label: "Caimento ruim",
    description: "Pareceu apertado, largo ou desproporcional.",
    icon: Frown,
  },
  {
    reason: "ai_distortion",
    label: "Imagem estranha",
    description: "Erro da IA, artefatos ou distorções.",
    icon: Sparkles,
  },
  {
    reason: "other",
    label: "Outro motivo",
    description: "Quero apenas registrar o dislike.",
    icon: AlertTriangle,
  },
]

export function DislikeFeedbackModal({ open, onSelect, onSkip, isSubmitting = false, onClose }: DislikeFeedbackModalProps) {
  if (!open) return null

  const handleClose = () => {
    onSkip()
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 px-4 pb-6 pt-20 sm:items-center sm:pt-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Feedback rápido</p>
          <h3 className="text-xl font-semibold text-slate-900">O que não agradou?</h3>
          <p className="text-sm text-slate-600">Seu feedback ajuda a loja a personalizar melhor os looks.</p>
        </div>

        <div className="mt-5 grid gap-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.reason}
                disabled={isSubmitting}
                onClick={() => onSelect(option.reason)}
                className={clsx(
                  "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50",
                  isSubmitting && "opacity-60"
                )}
              >
                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-600">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full justify-center border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Registrar apenas o dislike
        </Button>
      </div>
    </div>
  )
}


