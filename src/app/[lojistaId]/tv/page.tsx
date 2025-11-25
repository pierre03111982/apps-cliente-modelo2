"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, Timestamp } from "firebase/firestore"
import { fetchLojistaData } from "@/lib/firebaseQueries"
import type { LojistaData } from "@/lib/types"
import { SafeImage } from "@/components/ui/SafeImage"

type ViewMode = "active" | "carousel"

interface ComposicaoComLike {
  id: string
  imagemUrl: string
  liked?: boolean
  curtido?: boolean
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  customerName?: string
  customerId?: string
  compositionId?: string
}

export default function TVStorePage() {
  const params = useParams()
  const lojistaId = params?.lojistaId as string

  const [lojistaData, setLojistaData] = useState<LojistaData | null>(null)
  const [currentImage, setCurrentImage] = useState<ComposicaoComLike | null>(null)
  const [carouselImages, setCarouselImages] = useState<ComposicaoComLike[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("active")
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [lastLikeTime, setLastLikeTime] = useState<number>(Date.now())
  const [isLoading, setIsLoading] = useState(true)

  // Carregar dados da loja
  useEffect(() => {
    if (!lojistaId) return

    const loadLojistaData = async () => {
      try {
        const data = await fetchLojistaData(lojistaId)
        setLojistaData(data)
      } catch (error) {
        console.error("[TVStorePage] Erro ao carregar dados da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLojistaData()
  }, [lojistaId])

  // Escutar composições com like (Fase 12)
  useEffect(() => {
    if (!lojistaId || !isFirebaseConfigured || isLoading) return

    const db = getFirestoreClient()
    if (!db) {
      console.warn("[TVStorePage] Firestore não disponível")
      return
    }

    console.log("[TVStorePage] Iniciando listener de composições com like para lojistaId:", lojistaId)

    // Query: composições da loja com like, ordenadas por data (mais recente primeiro)
    const composicoesRef = collection(db, "lojas", lojistaId, "composicoes")
    
    // Tentar filtrar por liked ou curtido (dependendo da estrutura do banco)
    const q = query(
      composicoesRef,
      where("liked", "==", true),
      orderBy("updatedAt", "desc"),
      limit(1)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          console.log("[TVStorePage] Nenhuma composição com like encontrada")
          // Se não houver likes recentes, entrar em modo carrossel
          if (viewMode === "active" && currentImage) {
            // Esperar 60 segundos antes de entrar em carrossel
            const timeSinceLastLike = (Date.now() - lastLikeTime) / 1000
            if (timeSinceLastLike >= 60) {
              console.log("[TVStorePage] Entrando em modo carrossel (60s sem likes)")
              setViewMode("carousel")
            }
          }
          return
        }

        const doc = snapshot.docs[0]
        const data = doc.data()

        // Verificar se realmente tem like
        const hasLike = data.liked === true || data.curtido === true

        if (!hasLike || !data.imagemUrl) {
          return
        }

        console.log("[TVStorePage] ✅ Nova composição com like recebida:", {
          id: doc.id,
          hasImage: !!data.imagemUrl,
          customerName: data.customerName || data.customer?.nome || null,
        })

        // Criar objeto de composição
        const composicao: ComposicaoComLike = {
          id: doc.id,
          imagemUrl: data.imagemUrl,
          liked: true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
          customerName: data.customerName || data.customer?.nome || null,
          customerId: data.customerId || data.customerId || null,
          compositionId: data.compositionId || data.id || null,
        }

        // Atualizar imagem ativa
        setCurrentImage(composicao)
        setViewMode("active")
        setLastLikeTime(Date.now())

        // Carregar últimas 10 composições com like para carrossel
        loadCarouselImages(lojistaId, db)
      },
      (error) => {
        console.error("[TVStorePage] Erro ao escutar composições:", error)
        
        // Se o erro for por falta de índice ou campo, tentar query alternativa
        if (error.code === "failed-precondition" || error.message?.includes("index")) {
          console.warn("[TVStorePage] Tentando query alternativa sem filtro de like...")
          // Tentar sem filtro e filtrar no código
          const altQuery = query(
            composicoesRef,
            orderBy("updatedAt", "desc"),
            limit(20)
          )
          
          onSnapshot(altQuery, (snapshot) => {
            const likedComposicoes = snapshot.docs
              .filter(doc => {
                const data = doc.data()
                return (data.liked === true || data.curtido === true) && data.imagemUrl
              })
              .slice(0, 1)
            
            if (likedComposicoes.length > 0) {
              const doc = likedComposicoes[0]
              const data = doc.data()
              
              const composicao: ComposicaoComLike = {
                id: doc.id,
                imagemUrl: data.imagemUrl,
                liked: true,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt || data.createdAt,
                customerName: data.customerName || data.customer?.nome || null,
                customerId: data.customerId || null,
                compositionId: data.compositionId || data.id || null,
              }

              setCurrentImage(composicao)
              setViewMode("active")
              setLastLikeTime(Date.now())
              loadCarouselImages(lojistaId, db)
            }
          })
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [lojistaId, isLoading, viewMode, currentImage, lastLikeTime])

  // Carregar imagens para carrossel
  const loadCarouselImages = async (lojistaId: string, db: any) => {
    try {
      const composicoesRef = collection(db, "lojas", lojistaId, "composicoes")
      const q = query(
        composicoesRef,
        orderBy("updatedAt", "desc"),
        limit(20)
      )

      const snapshot = await getDocs(q)
      
      const likedComposicoes: ComposicaoComLike[] = snapshot.docs
        .filter(doc => {
          const data = doc.data()
          return (data.liked === true || data.curtido === true) && data.imagemUrl
        })
        .slice(0, 10)
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            imagemUrl: data.imagemUrl,
            liked: true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || data.createdAt,
            customerName: data.customerName || data.customer?.nome || null,
            customerId: data.customerId || null,
            compositionId: data.compositionId || data.id || null,
          }
        })

      setCarouselImages(likedComposicoes)
    } catch (error) {
      console.error("[TVStorePage] Erro ao carregar carrossel:", error)
    }
  }

  // Modo carrossel: trocar imagem a cada 5 segundos
  useEffect(() => {
    if (viewMode !== "carousel" || carouselImages.length === 0) return

    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % carouselImages.length
        setCurrentImage(carouselImages[next])
        return next
      })
    }, 5000) // 5 segundos por imagem

    return () => clearInterval(interval)
  }, [viewMode, carouselImages])

  // Verificar timeout de 60 segundos para entrar em carrossel
  useEffect(() => {
    if (viewMode !== "active" || !currentImage) return

    const timeout = setTimeout(() => {
      const timeSinceLastLike = (Date.now() - lastLikeTime) / 1000
      if (timeSinceLastLike >= 60 && carouselImages.length > 0) {
        console.log("[TVStorePage] Entrando em modo carrossel (60s sem novos likes)")
        setViewMode("carousel")
        setCarouselIndex(0)
        setCurrentImage(carouselImages[0])
      }
    }, 60000) // Verificar após 60 segundos

    return () => clearTimeout(timeout)
  }, [viewMode, currentImage, lastLikeTime, carouselImages])

  // Gerar URL do QR Code
  const getQrCodeUrl = () => {
    if (typeof window === "undefined") return ""
    const baseUrl = window.location.origin
    return `${baseUrl}/${lojistaId}/experimentar`
  }

  // Tela de loading
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando TV Store...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      {/* Área principal da imagem */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {currentImage ? (
          <div className="relative w-full h-full max-w-[85vw] max-h-[85vh] flex items-center justify-center">
            <div
              key={currentImage.id}
              className="relative w-full h-full animate-scale-in"
            >
              <SafeImage
                src={currentImage.imagemUrl}
                alt="Look curtido"
                className="w-full h-full object-contain rounded-lg"
                containerClassName="w-full h-full flex items-center justify-center"
              />
              
              {/* Legenda com nome do cliente */}
              {currentImage.customerName && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-6 py-3 animate-fade-in">
                  <p className="text-white text-lg font-medium">
                    Look criado por <span className="font-bold">{currentImage.customerName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-white/50 text-2xl text-center">
            {lojistaData?.nome && (
              <>
                <p className="text-4xl font-bold mb-4">Bem-vindo à {lojistaData.nome}</p>
                <p className="text-xl">Aguardando likes...</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Code na lateral direita */}
      <div className="absolute right-8 top-8 bottom-8 w-80 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
        {lojistaData?.logoUrl && (
          <div className="mb-6 w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
            <img
              src={lojistaData.logoUrl}
              alt={lojistaData.nome || "Logo"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h2 className="text-xl font-bold text-center mb-4">
          Escaneie para Provador Virtual
        </h2>
        
        <div className="bg-white p-4 rounded-2xl mb-4">
          <QRCodeSVG
            value={getQrCodeUrl()}
            size={240}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <p className="text-sm text-white/70 text-center max-w-xs">
          Aponte a câmera do seu celular para este código
        </p>

        {/* Indicador de modo */}
        <div className="mt-6 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              viewMode === "active" ? "bg-green-500 animate-pulse" : "bg-blue-500"
            }`}
          />
          <span className="text-xs text-white/60">
            {viewMode === "active" ? "Ao vivo" : "Carrossel"}
          </span>
        </div>
      </div>

      {/* Logo da loja no canto inferior esquerdo (opcional) */}
      {lojistaData?.nome && !lojistaData.logoUrl && (
        <div className="absolute bottom-8 left-8 bg-white/5 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
          <p className="text-white font-semibold">{lojistaData.nome}</p>
        </div>
      )}
    </div>
  )
}

