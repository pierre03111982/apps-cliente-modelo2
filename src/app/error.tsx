"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error("[Error Boundary] Erro capturado:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/50 bg-zinc-900/95 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Algo deu errado!
        </h2>
        <p className="mb-6 text-zinc-400">
          {error.message || "Ocorreu um erro inesperado. Por favor, tente novamente."}
        </p>
        <div className="flex gap-4">
          <Button
            onClick={reset}
            variant="primary"
            className="flex-1"
          >
            Tentar Novamente
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            variant="ghost"
            className="flex-1"
          >
            Voltar ao Início
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-zinc-500">
            Código de erro: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}

