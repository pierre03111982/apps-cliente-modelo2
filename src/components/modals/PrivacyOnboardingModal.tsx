'use client'

import { Camera, Shield } from "lucide-react"
import { Button } from "@/components/ui/Button"

type PrivacyMode = "public" | "private"

interface PrivacyOnboardingModalProps {
  open: boolean
  onSelect: (mode: PrivacyMode) => void
  onClose?: () => void
}

const OPTIONS: Array<{
  mode: PrivacyMode
  title: string
  description: string
  highlights: string[]
  icon: React.ComponentType<{ className?: string }>
  accent: string
}> = [
  {
    mode: "public",
    title: "Modo Imersivo",
    description: "Use sua própria foto para resultados hiper-realistas.",
    highlights: ["Maior precisão", "Recomendado para looks completos", "Pode compartilhar no espelho digital"],
    icon: Camera,
    accent: "from-blue-500/80 to-indigo-600/80",
  },
  {
    mode: "private",
    title: "Modo Discreto",
    description: "Use avatares criativos e mantenha sua privacidade.",
    highlights: ["Avatares criativos", "Não precisa tirar foto", "Ideal para testes rápidos"],
    icon: Shield,
    accent: "from-emerald-500/80 to-teal-600/80",
  },
]

export function PrivacyOnboardingModal({ open, onSelect, onClose }: PrivacyOnboardingModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white/95 p-6 text-zinc-900 shadow-2xl">
        {onClose && (
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Fechar
          </button>
        )}

        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Sua experiência</p>
          <h2 className="text-2xl font-bold text-slate-900">Como você quer experimentar a loja?</h2>
          <p className="text-sm text-slate-600">
            Você pode trocar de modo depois, mas precisamos começar com uma preferência.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.mode}
                onClick={() => onSelect(option.mode)}
                className="group flex h-full flex-row items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                {/* Icon with fixed width */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${option.accent} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                {/* Text content - flex-1 and text-left */}
                <div className="flex-1 space-y-2 text-left">
                  <h3 className="text-lg font-semibold text-slate-800">{option.title}</h3>
                  <p className="text-sm text-slate-600">{option.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                    {option.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4 w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-sm font-semibold text-white shadow-md transition group-hover:from-indigo-500 group-hover:to-indigo-600">
                    Escolher {option.title}
                  </Button>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


