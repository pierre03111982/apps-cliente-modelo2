"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, X, ShoppingCart, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/Button"

type Favorito = {
  id: string
  imagemUrl?: string | null
  productName?: string | null
  productPrice?: number | null
  createdAt?: any
}

type FavoritosStep2Props = {
  lojistaId: string
  clienteId?: string | null
  salesConfig?: {
    channel?: string
    salesWhatsapp?: string
    checkoutLink?: string
    whatsappLink?: string
  }
  onClose?: () => void
}

export function FavoritosStep2({
  lojistaId,
  clienteId,
  salesConfig,
  onClose,
}: FavoritosStep2Props) {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!clienteId || !lojistaId) {
      setLoading(false)
      return
    }

    const loadFavoritos = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
        const response = await fetch(
          `${backendUrl}/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}`
        )

        if (response.ok) {
          const data = await response.json()
          // API retorna 'favorites', não 'favoritos'
          const favorites = data.favorites || data.favoritos || []
          // Garantir que temos imagemUrl válida
          const validFavorites = favorites.filter((f: Favorito) => f.imagemUrl)
          setFavoritos(validFavorites)
        }
      } catch (error) {
        console.error("[FavoritosStep2] Erro ao carregar favoritos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFavoritos()
  }, [clienteId, lojistaId])

  const ultimoFavorito = favoritos.length > 0 ? favoritos[0] : null

  const formatPrice = (value?: number | null) => {
    return typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar valor"
  }

  const handleComprar = (favorito: Favorito) => {
    if (salesConfig?.channel === "checkout" && salesConfig?.checkoutLink) {
      window.open(salesConfig.checkoutLink, "_blank", "noopener,noreferrer")
    } else if (salesConfig?.whatsappLink) {
      window.open(salesConfig.whatsappLink, "_blank", "noopener,noreferrer")
    } else if (salesConfig?.salesWhatsapp) {
      const whatsapp = salesConfig.salesWhatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer")
    }
  }

  if (loading) {
    return null
  }

  if (!ultimoFavorito) {
    return null
  }

  return (
    <>
      {/* Card do último favorito */}
      <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-purple-600/90 via-indigo-700/90 to-blue-800/90 p-6 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-400 fill-pink-400" />
            <h3 className="text-lg font-semibold text-white">Seu último favorito</h3>
          </div>
          {favoritos.length > 1 && (
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-white/70 hover:text-white underline"
            >
              Ver todos ({favoritos.length})
            </button>
          )}
        </div>

        <div className="flex gap-4">
          {/* Imagem do look */}
          {ultimoFavorito.imagemUrl && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-white/30 flex-shrink-0">
              <Image
                src={ultimoFavorito.imagemUrl}
                alt={ultimoFavorito.productName || "Look favorito"}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Informações do produto */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-semibold text-white mb-1">
                {ultimoFavorito.productName || "Produto"}
              </h4>
              <p className="text-lg font-bold text-emerald-300 mb-2">
                {formatPrice(ultimoFavorito.productPrice)}
              </p>
            </div>

            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg"
              onClick={() => handleComprar(ultimoFavorito)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Comprar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal com todos os favoritos */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl border border-white/20 bg-gradient-to-br from-purple-600/90 via-indigo-700/90 to-blue-800/90 p-6 shadow-xl shadow-black/30 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-400 fill-pink-400" />
                <h2 className="text-2xl font-semibold text-white">Meus Favoritos</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {favoritos.length === 0 ? (
              <div className="py-12 text-center">
                <Heart className="mx-auto h-16 w-16 text-white/30 mb-4" />
                <p className="text-white/70">Você ainda não tem favoritos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoritos.map((favorito) => (
                  <div
                    key={favorito.id}
                    className="rounded-lg border border-white/20 bg-white/10 p-4 hover:bg-white/20 transition"
                  >
                    {favorito.imagemUrl && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-white/30 mb-3">
                        <Image
                          src={favorito.imagemUrl}
                          alt={favorito.productName || "Look favorito"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <h4 className="text-sm font-semibold text-white mb-1 truncate">
                      {favorito.productName || "Produto"}
                    </h4>
                    <p className="text-base font-bold text-emerald-300 mb-3">
                      {formatPrice(favorito.productPrice)}
                    </p>

                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600"
                      onClick={() => handleComprar(favorito)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Comprar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

