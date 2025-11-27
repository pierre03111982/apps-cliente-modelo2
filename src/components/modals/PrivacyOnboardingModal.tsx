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
            className="absolute right-4 top-4 rounded-full border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            Fechar
          </button>
        )}

        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">Sua experiência</p>
          <h2 className="text-2xl font-bold text-zinc-900">Como você quer experimentar a loja?</h2>
          <p className="text-sm text-zinc-500">
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
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/90 p-5 text-left shadow-lg transition hover:-translate-y-0.5 hover:border-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                <div className={`rounded-2xl bg-gradient-to-r ${option.accent} p-4 text-white shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="mt-4 flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-zinc-900">{option.title}</h3>
                  <p className="text-sm text-zinc-500">{option.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
                    {option.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="mt-4 w-full justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-md transition group-hover:bg-indigo-500">
                  Escolher {option.title}
                </Button>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

