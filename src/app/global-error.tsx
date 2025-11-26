"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-xl border border-red-500/50 bg-zinc-900/95 p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Erro Crítico
            </h2>
            <p className="mb-6 text-zinc-400">
              {error.message || "Ocorreu um erro crítico. Por favor, recarregue a página."}
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              Tentar Novamente
            </button>
            {error.digest && (
              <p className="mt-4 text-xs text-zinc-500">
                Código de erro: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}






