"use client"

import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Verificar se está no domínio correto (app2.experimenteai.com.br)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'app2.experimenteai.com.br'
      
      // Se não estiver no subdomínio app2, redirecionar
      if (!hostname.includes('app2') && hostname.includes('experimenteai.com.br')) {
        const newUrl = `https://${appDomain}${window.location.pathname}${window.location.search}`
        window.location.href = newUrl
        return
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 text-lg animate-pulse">Carregando...</div>
        </div>
      </div>
    )
  }

  const currentOrigin = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://app2.experimenteai.com.br'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white px-4">
      <div className="text-center max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Experimente AI
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Provador Virtual Inteligente
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <p className="mb-6 text-gray-300 text-lg">
            Para acessar o aplicativo, você precisa do link completo com o ID da loja:
          </p>
          
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Formato do link:</p>
            <code className="text-blue-400 break-all text-sm">
              {currentOrigin}/[lojistaId]/login
            </code>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
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


