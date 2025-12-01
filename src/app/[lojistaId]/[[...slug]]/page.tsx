"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

/**
 * Rota catch-all para capturar URLs malformadas
 * Exemplo: /[lojistaId]/(48)%2098815-6098 -> redireciona para /[lojistaId]/experimentar
 */
export default function CatchAllPage() {
  const params = useParams()
  const router = useRouter()
  
  useEffect(() => {
    const lojistaId = params?.lojistaId as string
    
    if (!lojistaId) {
      router.replace("/")
      return
    }
    
    // Limpar a URL e redirecionar para a página correta
    // Verificar se está logado
    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (stored) {
        // Se estiver logado, redirecionar para experimentar
        router.replace(`/${lojistaId}/experimentar`)
      } else {
        // Se não estiver logado, redirecionar para login
        router.replace(`/${lojistaId}/login`)
      }
    } catch (error) {
      console.error("[CatchAllPage] Erro ao verificar login:", error)
      router.replace(`/${lojistaId}/login`)
    }
  }, [params, router])
  
  // Não mostrar nada enquanto redireciona
  return null
}

