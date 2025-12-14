'use client'

import { DislikeReason } from "@/lib/types"
import { AlertTriangle, Frown, Sparkles, Shirt } from "lucide-react"
import { Button } from "@/components/ui/Button"
import clsx from "clsx"

interface DislikeFeedbackModalProps {
  open: boolean
  isSubmitting?: boolean
  onSelect: (reason: DislikeReason, category: FeedbackCategory) => void
  onSkip: () => void
  onClose?: () => void
}

// Categorias de feedback para treinar a IA
type FeedbackCategory = "style" | "technical";

const OPTIONS: Array<{
  reason: DislikeReason
  category: FeedbackCategory
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  // Categoria: Estilo
  {
    reason: "garment_style",
    category: "style",
    label: "Não faz meu estilo",
    description: "O estilo geral não combina comigo.",
    icon: Shirt,
  },
  {
    reason: "garment_style",
    category: "style",
    label: "Não gostei da cor/estampa",
    description: "A cor ou estampa não me agradou.",
    icon: Shirt,
  },
  {
    reason: "garment_style",
    category: "style",
    label: "Combinação não funcionou",
    description: "As peças não combinaram bem juntas.",
    icon: Shirt,
  },
  // Categoria: Técnico
  {
    reason: "ai_distortion",
    category: "technical",
    label: "Distorção na imagem/IA",
    description: "A IA gerou uma imagem com erros visuais.",
    icon: Sparkles,
  },
  {
    reason: "fit_issue",
    category: "technical",
    label: "Ficou desproporcional",
    description: "A imagem ficou com proporções estranhas.",
    icon: Frown,
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

        <div className="mt-5 space-y-4">
          {/* Categoria: Estilo */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Estilo</p>
            <div className="grid gap-3">
              {OPTIONS.filter(opt => opt.category === "style").map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={`${option.category}-${option.label}`}
                    disabled={isSubmitting}
                    onClick={() => onSelect(option.reason, option.category)}
                    className={clsx(
                      "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-pink-200 hover:bg-pink-50",
                      isSubmitting && "opacity-60"
                    )}
                  >
                    <div className="rounded-2xl bg-pink-100 p-3 text-pink-600">
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
          </div>

          {/* Categoria: Técnico */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Técnico</p>
            <div className="grid gap-3">
              {OPTIONS.filter(opt => opt.category === "technical").map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={`${option.category}-${option.label}`}
                    disabled={isSubmitting}
                    onClick={() => onSelect(option.reason, option.category)}
                    className={clsx(
                      "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50",
                      isSubmitting && "opacity-60"
                    )}
                  >
                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
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
          </div>
        </div>
      </div>
    </div>
  )
}


