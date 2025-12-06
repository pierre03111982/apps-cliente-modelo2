"use client"

import { useEffect, useState } from "react"
import { X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

type ProductGalleryModalProps = {
  lojistaId: string
  clienteId: string
  productId: string
  productName?: string
  uploadImageHash?: string | null
  isOpen: boolean
  onClose: () => void
}

interface GalleryItem {
  id: string
  imagemUrl: string
  createdAt: Date
  productName?: string
}

export function ProductGalleryModal({
  lojistaId,
  clienteId,
  productId,
  productName,
  uploadImageHash,
  isOpen,
  onClose,
}: ProductGalleryModalProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !lojistaId || !clienteId || !productId) {
      return
    }

    const fetchGallery = async () => {
      setLoading(true)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
        let url = `${backendUrl}/api/cliente/affinity?lojistaId=${encodeURIComponent(lojistaId)}&userId=${encodeURIComponent(clienteId)}&productId=${encodeURIComponent(productId)}&action=gallery`
        
        if (uploadImageHash) {
          url += `&uploadImageHash=${encodeURIComponent(uploadImageHash)}`
        }

        const response = await fetch(url)

        if (response.ok) {
          const data = await response.json()
          const items = (data.gallery || []).map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }))
          setGallery(items)
        }
      } catch (error) {
        console.error("[ProductGalleryModal] Erro ao buscar galeria:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [isOpen, lojistaId, clienteId, productId, uploadImageHash])

  if (!isOpen) {
    return null
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) {
      return "Hoje"
    } else if (diffDays === 1) {
      return "Ontem"
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return date.toLocaleDateString("pt-BR")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Galeria com {productName || "este produto"}</h2>
            <p className="text-sm text-white/70 mt-1">
              {loading ? "Carregando..." : `${gallery.length} look${gallery.length !== 1 ? "s" : ""} curtido${gallery.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="h-16 w-16 text-white/30 mb-4" />
              <p className="text-white/70 text-lg">
                Nenhum look curtido com {productName || "este produto"} ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden border-2 border-white/20 bg-zinc-900 hover:border-pink-400/50 transition-all hover:scale-105"
                >
                  <Image
                    src={item.imagemUrl}
                    alt={item.productName || "Look"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white/90 font-medium">
                        {formatDate(item.createdAt)}
                      </p>
                      {item.productName && (
                        <p className="text-xs text-white/70 mt-1">
                          {item.productName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

