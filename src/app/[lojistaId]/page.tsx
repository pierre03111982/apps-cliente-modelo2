"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica para evitar erro 404 em rotas dinâmicas
export const dynamic = 'force-dynamic'

export default function ClienteAppPage() {
  const params = useParams()
  const router = useRouter()
  const [lojistaId, setLojistaId] = useState<string>("")
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    // Garantir que params está disponível
    const id = (params?.lojistaId as string) || ""
    setLojistaId(id)
    
    if (!id) {
      // Se não houver lojistaId, redirecionar para página raiz
      router.push("/")
      return
    }
    
    if (isRedirecting) return
    
    setIsRedirecting(true)
    
    // Verificar login e redirecionar
    const checkLogin = () => {
      try {
        const stored = localStorage.getItem(`cliente_${id}`)
        if (!stored) {
          router.push(`/${id}/login`)
          return
        }
        // Se estiver logado, redirecionar para experimentar
        router.push(`/${id}/experimentar`)
      } catch (error) {
        console.error("[ClienteAppPage] Erro ao verificar login:", error)
        router.push(`/${id}/login`)
      }
    }
    
    // Pequeno delay para garantir que o router está pronto
    setTimeout(checkLogin, 100)
  }, [params, router, isRedirecting])
  
  // Mostrar loading enquanto redireciona
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="mb-4 text-lg">Carregando...</div>
        {lojistaId && (
          <div className="text-sm text-gray-400">Redirecionando para {lojistaId}</div>
        )}
      </div>
    </div>
  )
}
