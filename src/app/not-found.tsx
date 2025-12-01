"use client"

import { useEffect } from "react"

export default function NotFound() {
  useEffect(() => {
    // Se estiver em uma rota que parece ser um lojistaId mas não existe, tentar redirecionar
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const lojistaIdMatch = path.match(/^\/([^/]+)$/)
      
      if (lojistaIdMatch) {
        const lojistaId = lojistaIdMatch[1]
        // Se não for uma rota conhecida, pode ser um lojistaId válido
        // Tentar redirecionar para /login
        const knownRoutes = ['api', '_next', 'favicon.ico', 'manifest.json', 'og-image']
        if (!knownRoutes.includes(lojistaId)) {
          // Não redirecionar automaticamente, apenas mostrar a mensagem
        }
      }
    }
  }, [])

  const currentOrigin = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://app2.experimenteai.com.br'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white px-4">
      <div className="text-center max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Página não encontrada
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <p className="mb-6 text-gray-300 text-lg">
            A página que você está procurando não existe.
          </p>
          
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Acesse o aplicativo usando o link completo com o ID da loja:</p>
            <code className="text-blue-400 break-all text-sm block mb-4">
              {currentOrigin}/[lojistaId]/login
            </code>
            <p className="text-sm text-gray-400 mb-2">Exemplo:</p>
            <code className="text-green-400 break-all text-sm">
              {currentOrigin}/seu-lojista-id/login
            </code>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Entre em contato com o administrador da loja para obter o link de acesso correto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

