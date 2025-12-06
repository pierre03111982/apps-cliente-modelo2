"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"

type ProductAffinityBadgeProps = {
  lojistaId: string
  clienteId: string
  productId: string
}

export function ProductAffinityBadge({
  lojistaId,
  clienteId,
  productId,
}: ProductAffinityBadgeProps) {
  const [affinityCount, setAffinityCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lojistaId || !clienteId || !productId) {
      setLoading(false)
      return
    }

    const fetchAffinity = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
        const response = await fetch(
          `${backendUrl}/api/cliente/affinity?lojistaId=${encodeURIComponent(lojistaId)}&userId=${encodeURIComponent(clienteId)}&productId=${encodeURIComponent(productId)}&action=count`
        )

        if (response.ok) {
          const data = await response.json()
          setAffinityCount(data.count || 0)
        } else {
          setAffinityCount(0)
        }
      } catch (error) {
        console.error("[ProductAffinityBadge] Erro ao buscar afinidade:", error)
        setAffinityCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchAffinity()
  }, [lojistaId, clienteId, productId])

  if (loading || affinityCount === null || affinityCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-pink-500/20 border border-pink-400/30 px-3 py-1.5">
      <Heart className="h-3.5 w-3.5 text-pink-400 fill-pink-400" />
      <span className="text-xs font-semibold text-pink-300">
        Você já curtiu {affinityCount} {affinityCount === 1 ? "look" : "looks"} com esta peça
      </span>
    </div>
  )
}


