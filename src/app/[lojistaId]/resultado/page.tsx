"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, ShoppingCart, Heart, RefreshCw, Home, Instagram, Facebook, Music2, MessageCircle, X, Sparkles } from "lucide-react"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants"
import { fetchLojistaData } from "@/lib/firebaseQueries"
import type { LojistaData, GeneratedLook } from "@/lib/types"

// Resolver backend URL
const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    return params.get("backend") || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL || "http://localhost:3000"
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL || "http://localhost:3000"
}

export default function ResultadoPage() {
  const params = useParams()
  const router = useRouter()
  const lojistaId = params?.lojistaId as string

  const [lojistaData, setLojistaData] = useState<LojistaData | null>(null)
  const [looks, setLooks] = useState<GeneratedLook[]>([])
  const [currentLookIndex, setCurrentLookIndex] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedType, setVotedType] = useState<"like" | "dislike" | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [fromFavoritos, setFromFavoritos] = useState(false)

  // Carregar dados da loja
  useEffect(() => {
    if (!lojistaId) return

    const loadData = async () => {
      try {
        // Tentar buscar do backend primeiro
        let lojistaDb: LojistaData | null = null

        try {
          const perfilResponse = await fetch(`/api/lojista/perfil?lojistaId=${encodeURIComponent(lojistaId)}`)
          if (perfilResponse.ok) {
            const perfilData = await perfilResponse.json()
            if (perfilData?.nome) {
              lojistaDb = {
                id: lojistaId,
                nome: perfilData.nome,
                logoUrl: perfilData.logoUrl || null,
                descricao: perfilData.descricao || null,
                redesSociais: {
                  instagram: perfilData.instagram || perfilData.redesSociais?.instagram || null,
                  facebook: perfilData.facebook || perfilData.redesSociais?.facebook || null,
                  tiktok: perfilData.tiktok || perfilData.redesSociais?.tiktok || null,
                  whatsapp: perfilData.whatsapp || perfilData.redesSociais?.whatsapp || null,
                },
                salesConfig: perfilData.salesConfig || {
                  whatsappLink: perfilData.salesWhatsapp || null,
                  ecommerceUrl: perfilData.checkoutLink || null,
                },
                descontoRedesSociais: perfilData.descontoRedesSociais || null,
                descontoRedesSociaisExpiraEm: perfilData.descontoRedesSociaisExpiraEm || null,
              }
            }
          }
        } catch (apiError) {
          console.warn("[ResultadoPage] Erro ao buscar via API, tentando Firebase:", apiError)
        }

        // Se não encontrou via API, tentar Firebase
        if (!lojistaDb) {
          lojistaDb = await fetchLojistaData(lojistaId).catch(() => null)
        }

        if (lojistaDb) setLojistaData(lojistaDb)
      } catch (error) {
        console.error("[ResultadoPage] Erro ao carregar dados:", error)
      }
    }

    loadData()
  }, [lojistaId])

  // Verificar se já foi votado
  const checkVoteStatus = async (compositionId: string | null) => {
    if (!compositionId || !lojistaId) return null

    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (!stored) return null

      const clienteData = JSON.parse(stored)
      const clienteId = clienteData.clienteId

      if (!clienteId) return null

      const response = await fetch(
        `/api/actions/check-vote?compositionId=${encodeURIComponent(compositionId)}&customerId=${encodeURIComponent(clienteId)}&lojistaId=${encodeURIComponent(lojistaId)}`
      )

      if (response.ok) {
        const data = await response.json()
        return data.votedType || data.action || null // "like" ou "dislike"
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao verificar voto:", error)
    }

    return null
  }

  // Carregar looks do sessionStorage ou favorito
  useEffect(() => {
    if (!lojistaId) return

    const loadLooksAndCheckVote = async () => {
      // Verificar se veio de favoritos
      const fromFavoritosFlag = sessionStorage.getItem(`from_favoritos_${lojistaId}`)
      if (fromFavoritosFlag === "true") {
        setFromFavoritos(true)
        // Carregar favorito do sessionStorage
        const favoritoData = sessionStorage.getItem(`favorito_${lojistaId}`)
        if (favoritoData) {
          try {
            const favoritoLook = JSON.parse(favoritoData)
            setLooks([favoritoLook])
            setCurrentLookIndex(0)
            // Marcar como já votado (like) - veio de favoritos
            setHasVoted(true)
            setVotedType("like")
            // Limpar flag
            sessionStorage.removeItem(`from_favoritos_${lojistaId}`)
          } catch (error) {
            console.error("[ResultadoPage] Erro ao carregar favorito:", error)
            router.push(`/${lojistaId}/experimentar`)
          }
        } else {
          router.push(`/${lojistaId}/experimentar`)
        }
        return
      }

      // Carregar looks normalmente
      const storedLooks = sessionStorage.getItem(`looks_${lojistaId}`)
      if (storedLooks) {
        try {
          const parsedLooks = JSON.parse(storedLooks)
          setLooks(parsedLooks)
          
          // Verificar se já foi votado no primeiro look
          if (parsedLooks.length > 0 && parsedLooks[0].compositionId) {
            const voteStatus = await checkVoteStatus(parsedLooks[0].compositionId)
            if (voteStatus) {
              setHasVoted(true)
              setVotedType(voteStatus === "like" ? "like" : "dislike")
            }
          }
        } catch (error) {
          console.error("[ResultadoPage] Erro ao carregar looks:", error)
        }
      } else {
        // Se não houver looks, redirecionar para experimentar
        router.push(`/${lojistaId}/experimentar`)
      }

      // Carregar produtos selecionados do sessionStorage
      const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
      if (storedProducts) {
        try {
          const parsedProducts = JSON.parse(storedProducts)
          if (parsedProducts && Array.isArray(parsedProducts) && parsedProducts.length > 0) {
            setSelectedProducts(parsedProducts) // Carregar todos os produtos
          }
        } catch (error) {
          console.error("[ResultadoPage] Erro ao carregar produtos:", error)
        }
      }
    }

    loadLooksAndCheckVote()
  }, [lojistaId, router])

  // Verificar se cliente está logado
  useEffect(() => {
    if (!lojistaId) return

    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    if (!stored) {
      router.push(`/${lojistaId}/login`)
    }
  }, [lojistaId, router])

  // Verificar voto quando mudar de look (mas não se vier de favoritos)
  useEffect(() => {
    if (!fromFavoritos && looks.length > 0 && looks[currentLookIndex]) {
      const checkVote = async () => {
        const compositionId = looks[currentLookIndex].compositionId
        if (compositionId) {
          const voteStatus = await checkVoteStatus(compositionId)
          if (voteStatus) {
            setHasVoted(true)
            setVotedType(voteStatus === "like" ? "like" : "dislike")
          } else {
            setHasVoted(false)
            setVotedType(null)
          }
        } else {
          setHasVoted(false)
          setVotedType(null)
        }
      }
      checkVote()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLookIndex, fromFavoritos, looks])

  // Recarregar favoritos quando o modal for aberto
  useEffect(() => {
    if (showFavoritesModal && lojistaId) {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesModal, lojistaId])

  // Carregar favoritos
  const loadFavorites = useCallback(async () => {
    if (!lojistaId) return

    try {
      setIsLoadingFavorites(true)
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (!stored) return

      const clienteData = JSON.parse(stored)
      const clienteId = clienteData.clienteId

      if (!clienteId) return

      // Adicionar timestamp para evitar cache
      const response = await fetch(
        `/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}&_t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const favoritesList = data.favorites || data.favoritos || []
        
        // Filtrar apenas os likes (action === "like" ou tipo === "like" ou votedType === "like")
        const likesOnly = favoritesList.filter((f: any) => {
          const hasImage = f.imagemUrl && f.imagemUrl.trim() !== ""
          const isLike = f.action === "like" || f.tipo === "like" || f.votedType === "like"
          // Se não tiver campo de ação, assumir que é like (compatibilidade com dados antigos)
          return hasImage && (isLike || (!f.action && !f.tipo && !f.votedType))
        })
        
        // Ordenar por data de criação (mais recente primeiro)
        const sortedFavorites = likesOnly.sort((a: any, b: any) => {
          // Tentar diferentes formatos de data
          let dateA: Date
          let dateB: Date
          
          if (a.createdAt?.toDate) {
            dateA = a.createdAt.toDate()
          } else if (a.createdAt?.seconds) {
            dateA = new Date(a.createdAt.seconds * 1000)
          } else if (typeof a.createdAt === 'string') {
            dateA = new Date(a.createdAt)
          } else if (a.createdAt) {
            dateA = new Date(a.createdAt)
          } else {
            dateA = new Date(0) // Data muito antiga se não houver
          }
          
          if (b.createdAt?.toDate) {
            dateB = b.createdAt.toDate()
          } else if (b.createdAt?.seconds) {
            dateB = new Date(b.createdAt.seconds * 1000)
          } else if (typeof b.createdAt === 'string') {
            dateB = new Date(b.createdAt)
          } else if (b.createdAt) {
            dateB = new Date(b.createdAt)
          } else {
            dateB = new Date(0) // Data muito antiga se não houver
          }
          
          // Ordenar do mais recente para o mais antigo
          return dateB.getTime() - dateA.getTime()
        })
        
        // Limitar a 10 favoritos mais recentes
        const limitedFavorites = sortedFavorites.slice(0, 10)
        
        console.log("[ResultadoPage] Favoritos carregados:", limitedFavorites.length, "de", likesOnly.length, "likes totais")
        
        setFavorites(limitedFavorites)
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao carregar favoritos:", error)
    } finally {
      setIsLoadingFavorites(false)
    }
  }, [lojistaId])

  // Registrar ação (like/dislike)
  const registerAction = async (action: "like" | "dislike" | "share" | "checkout") => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook || !lojistaId) return

    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    const clienteData = stored ? JSON.parse(stored) : null
    const clienteId = clienteData?.clienteId || null
    const clienteNome = clienteData?.nome || null

    setLoadingAction(action)

    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          action,
          compositionId: currentLook.compositionId || null,
          jobId: currentLook.jobId || null,
          customerId: clienteId,
          customerName: clienteNome,
          productName: currentLook.produtoNome,
          productPrice: currentLook.produtoPreco || null,
          imagemUrl: currentLook.imagemUrl,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("[ResultadoPage] Erro ao registrar ação:", error)
      return false
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle like
  const handleLike = useCallback(async () => {
    if (hasVoted) return

    const currentLook = looks[currentLookIndex]
    if (!currentLook || !lojistaId) return

    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    const clienteData = stored ? JSON.parse(stored) : null
    const clienteId = clienteData?.clienteId || null
    const clienteNome = clienteData?.nome || null

    setLoadingAction("like")

    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          action: "like",
          compositionId: currentLook.compositionId || null,
          jobId: currentLook.jobId || null,
          customerId: clienteId,
          customerName: clienteNome,
          productName: currentLook.produtoNome,
          productPrice: currentLook.produtoPreco || null,
          imagemUrl: currentLook.imagemUrl,
        }),
      })

      if (response.ok) {
        setHasVoted(true)
        setVotedType("like")
        // Aguardar um pouco antes de atualizar favoritos para garantir que o backend processou
        setTimeout(async () => {
          await loadFavorites()
        }, 500)
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao registrar like:", error)
    } finally {
      setLoadingAction(null)
    }
  }, [hasVoted, currentLookIndex, looks, lojistaId, loadFavorites])

  // Handle dislike
  const handleDislike = useCallback(async () => {
    if (hasVoted) return

    const success = await registerAction("dislike")
    if (success) {
      setHasVoted(true)
      setVotedType("dislike")
    }
  }, [hasVoted, currentLookIndex, looks, lojistaId])

  // Handle share
  const handleShare = useCallback(async () => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook) return

    await registerAction("share")

    const shareUrl = `${window.location.origin}/${lojistaId}`
    const shareText = `Confira este look incrível da ${lojistaData?.nome || "loja"}! ${shareUrl}`

    if (navigator.share) {
      try {
        const shareData: any = {
          title: "Experimente AI - Look Gerado",
          text: shareText,
          url: shareUrl,
        }

        // Tentar incluir a imagem gerada se possível
        if (currentLook.imagemUrl) {
          try {
            const response = await fetch(currentLook.imagemUrl)
            const blob = await response.blob()
            const file = new File([blob], "look.jpg", { type: blob.type })
            shareData.files = [file]
          } catch (error) {
            console.warn("Não foi possível incluir imagem no compartilhamento:", error)
          }
        }

        await navigator.share(shareData)
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Erro ao compartilhar:", error)
          // Fallback: copiar link
          navigator.clipboard.writeText(shareUrl)
          alert("Link copiado para a área de transferência!")
        }
      }
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(shareUrl)
      alert("Link copiado para a área de transferência!")
    }
  }, [currentLookIndex, looks, lojistaId, lojistaData, registerAction])

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    await registerAction("checkout")
    const checkoutLink = lojistaData?.salesConfig?.checkoutLink || lojistaData?.salesConfig?.whatsappLink
    if (checkoutLink) {
      window.open(checkoutLink, "_blank", "noopener,noreferrer")
    }
  }, [lojistaData])

  // Gerar novo look (remixar) com as mesmas foto e produtos
  const handleRegenerate = async () => {
    try {
      setLoadingAction("remix")

      // Buscar dados anteriores do sessionStorage
      const storedPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
      const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)

      if (!storedPhoto || !storedProducts) {
        // Se não houver dados salvos, redirecionar para experimentar
        router.push(`/${lojistaId}/experimentar`)
        return
      }

      const products = JSON.parse(storedProducts)
      const productIds = products.map((p: any) => p.id).filter(Boolean)

      if (productIds.length === 0) {
        throw new Error("Nenhum produto encontrado")
      }

      // Buscar clienteId do localStorage
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null

      // Usar a URL da foto já salva (não precisa fazer upload novamente)
      const personImageUrl = storedPhoto

      if (!personImageUrl) {
        throw new Error("Foto não encontrada")
      }

      const payload = {
        personImageUrl,
        productIds,
        lojistaId,
        customerId: clienteId,
        scenePrompts: [],
        options: { quality: "high", skipWatermark: true },
      }

      // Gerar novo look criativo
      const response = await fetch("/api/generate-looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error || "Erro ao gerar novo look"
        const errorDetails = responseData.details ? `\n\nDetalhes: ${responseData.details}` : ""
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      // Salvar novos resultados
      if (responseData.looks && Array.isArray(responseData.looks) && responseData.looks.length > 0) {
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify(responseData.looks))
        // Manter foto e produtos salvos
        sessionStorage.setItem(`photo_${lojistaId}`, storedPhoto)
        sessionStorage.setItem(`products_${lojistaId}`, storedProducts)
        
        // Resetar votação para o novo look
        setHasVoted(false)
        setVotedType(null)
        setCurrentLookIndex(0)
        
        // Atualizar favoritos antes de recarregar (caso tenha dado like anteriormente)
        await loadFavorites()
        
        // Recarregar a página para mostrar o novo look
        window.location.reload()
      } else {
        throw new Error("Nenhum look foi gerado")
      }
    } catch (error: any) {
      console.error("[handleRegenerate] Erro:", error)
      alert(error.message || "Erro ao remixar look. Tente novamente.")
    } finally {
      setLoadingAction(null)
    }
  }

  // Voltar para início
  const handleGoHome = () => {
    // Limpar produtos selecionados do sessionStorage
    sessionStorage.removeItem(`products_${lojistaId}`)
    router.push(`/${lojistaId}/experimentar`)
  }

  // Adicionar Acessório (Refinamento)
  const handleAddAccessory = () => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook || !currentLook.imagemUrl) {
      alert("Erro: Imagem do look não encontrada")
      return
    }

    // Salvar a URL da imagem base para refinamento
    sessionStorage.setItem(`refine_baseImage_${lojistaId}`, currentLook.imagemUrl)
    
    // Salvar compositionId se disponível
    if (currentLook.compositionId) {
      sessionStorage.setItem(`refine_compositionId_${lojistaId}`, currentLook.compositionId)
    }

    // Marcar que estamos em modo de refinamento
    sessionStorage.setItem(`refine_mode_${lojistaId}`, "true")

    // Redirecionar para a galeria de produtos (experimentar) em modo refinamento
    router.push(`/${lojistaId}/experimentar?mode=refine`)
  }

  const currentLook = looks[currentLookIndex]
  const formatPrice = (value?: number | null) =>
    typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar preço"

  if (!currentLook) {
    return (
      <div className="relative min-h-screen w-screen overflow-hidden flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Imagem de Fundo - Fixa sem redimensionar */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src={CLOSET_BACKGROUND_IMAGE}
          alt="Guarda-roupa de luxo"
          className="absolute inset-0 h-full w-full object-cover blur-[2px] brightness-50"
          style={{ objectFit: 'cover', objectPosition: 'center', minHeight: '100vh', minWidth: '100vw' }}
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header com Botão Voltar - Só aparece após votação */}
        {hasVoted && (
          <div className="flex items-center justify-start p-4 md:p-6">
            <button
              onClick={() => {
                // Limpar produtos selecionados do sessionStorage ao voltar
                sessionStorage.removeItem(`products_${lojistaId}`)
                router.back()
              }}
              className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Logo e Nome da Loja com Redes Sociais - Sempre visível */}
        <div className="mb-3 sm:mb-4 flex items-center justify-center px-3 sm:px-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/30 bg-white/10 backdrop-blur-lg px-3 sm:px-4 py-2 sm:py-3 shadow-xl flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {lojistaData?.logoUrl && (
              <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
                <Image
                  src={lojistaData.logoUrl}
                  alt={lojistaData.nome || "Logo"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white" translate="no">
              {lojistaData?.nome || "Loja"}
            </h3>
            
            {/* Botões das Redes Sociais */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              {/* Instagram */}
              {lojistaData?.redesSociais?.instagram && (
                <button
                  onClick={() => window.open(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white transition hover:scale-105"
                >
                  <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Instagram</span>
                </button>
              )}
              
              {/* Facebook */}
              {lojistaData?.redesSociais?.facebook && (
                <button
                  onClick={() => window.open(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white transition hover:scale-105"
                >
                  <Facebook className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Facebook</span>
                </button>
              )}
              
              {/* TikTok */}
              {lojistaData?.redesSociais?.tiktok && (
                <button
                  onClick={() => window.open(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-black px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white transition hover:scale-105"
                >
                  <Music2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">TikTok</span>
                </button>
              )}
              
              {/* WhatsApp */}
              {(lojistaData?.redesSociais?.whatsapp || lojistaData?.salesConfig?.whatsappLink) && (
                <button
                  onClick={() => window.open(lojistaData?.redesSociais?.whatsapp ? `https://wa.me/${lojistaData.redesSociais.whatsapp.replace(/\D/g, '')}` : lojistaData?.salesConfig?.whatsappLink || '#', '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-500 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white transition hover:scale-105"
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Imagem Gerada - Com Borda Dupla e Produtos no Canto Inferior Direito */}
        <div className="flex items-start justify-center px-3 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-6">
          <div className="w-full max-w-2xl relative">
            <div className="relative inline-block w-full">
              {/* Moldura Externa - Contínua */}
              <div className="relative rounded-xl sm:rounded-2xl border-2 border-white/50 p-2 sm:p-3 shadow-xl inline-block w-full">
                {/* Moldura Interna - Pontilhada */}
                <div className="relative border-2 border-dashed border-white/30 rounded-lg sm:rounded-xl p-1.5 sm:p-2 inline-block w-full">
                  <img
                    src={currentLook.imagemUrl}
                    alt={currentLook.titulo}
                    className="h-auto w-full max-w-full object-contain object-top block rounded-lg"
                  />
                  
                  {/* Miniaturas dos Produtos - Canto Inferior Direito */}
                  {selectedProducts.length > 0 && (
                    <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 flex flex-col gap-1 sm:gap-1.5 z-10">
                      {selectedProducts.map((produto, index) => (
                        <div key={produto.id || index} className="relative">
                          {/* Moldura Externa - Contínua - Justa à imagem */}
                          <div className="relative rounded border-2 border-white/50 shadow-xl bg-white/90 backdrop-blur-sm">
                            {/* Moldura Interna - Pontilhada - Justa à imagem */}
                            <div className="relative border-2 border-dashed border-white/30 rounded bg-white overflow-hidden">
                              {/* Imagem do Produto */}
                              {produto.imagemUrl ? (
                                <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                                  <Image
                                    src={produto.imagemUrl}
                                    alt={produto.nome || `Produto ${index + 1}`}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-200 flex items-center justify-center">
                                  <span className="text-[6px] sm:text-[8px] text-gray-500">Sem imagem</span>
                                </div>
                              )}
                              {/* Informações do Produto - Reduzidas e truncadas */}
                              <div className="px-0.5 py-0.5 bg-white">
                                <h3 className="text-left text-[6px] sm:text-[8px] md:text-[10px] font-semibold text-gray-900 line-clamp-1 mb-0 leading-tight truncate" title={produto.nome || `Produto ${index + 1}`}>
                                  {produto.nome && produto.nome.length > 10 
                                    ? `${produto.nome.substring(0, 10)}...` 
                                    : produto.nome || `Produto ${index + 1}`}
                                </h3>
                                {produto.preco && (
                                  <p className="text-left text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 truncate">
                                    {formatPrice(produto.preco).length > 8 
                                      ? `${formatPrice(produto.preco).substring(0, 8)}...` 
                                      : formatPrice(produto.preco)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões Comprar Agora e Adicionar ao Carrinho - Só aparecem após votação */}
        {hasVoted && (
          <div className="flex items-center justify-center px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="w-full max-w-2xl space-y-2 sm:space-y-3">
              <button
                onClick={handleCheckout}
                className="w-full rounded-lg border-2 border-blue-600 bg-blue-600 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-bold text-white transition hover:bg-blue-700"
              >
                Comprar agora
              </button>
              <button
                onClick={handleCheckout}
                className="w-full rounded-lg bg-gray-200 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-blue-600 transition hover:bg-gray-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Adicionar ao carrinho</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Painel Inferior - Separado */}
        <div className="flex items-center justify-center px-3 sm:px-4 pb-4 sm:pb-6">
          <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
            {/* Caixa 1: Feedback Like/Dislike */}
            {!hasVoted && (
              <div className="rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 backdrop-blur-lg p-4 sm:p-6 shadow-xl text-center">
                <p className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-white drop-shadow-lg">
                  Curtiu o Look?
                </p>
                <div className="flex justify-center gap-3 sm:gap-4">
                  <button
                    onClick={handleDislike}
                    disabled={loadingAction === "dislike"}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-red-500/80 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    <ThumbsDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    Não
                  </button>
                  <button
                    onClick={handleLike}
                    disabled={loadingAction === "like"}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-green-500/80 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-green-600 disabled:opacity-50"
                  >
                    <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Sim
                  </button>
                </div>
              </div>
            )}

            {/* Botões de Ação após votação */}
            {hasVoted && (
              <div className="rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 backdrop-blur-lg p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 rounded-lg bg-blue-600 px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Share2 className="mx-auto h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowFavoritesModal(true)
                        // loadFavorites será chamado automaticamente pelo useEffect quando o modal abrir
                      }}
                      className="flex-1 rounded-lg bg-pink-500 px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-white transition hover:bg-pink-600"
                    >
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Favoritos</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Navegação */}
            {hasVoted && (
              <div className="rounded-xl sm:rounded-2xl border border-white/30 bg-white/10 backdrop-blur-lg p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <button
                    onClick={handleAddAccessory}
                    className="w-full rounded-lg bg-purple-600 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-purple-700"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-base">Adicionar Acessório</span>
                    </div>
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loadingAction === "remix"}
                    className="w-full rounded-lg bg-teal-600 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loadingAction === "remix" ? "animate-spin" : ""}`} />
                      <span className="text-xs sm:text-base">{loadingAction === "remix" ? "Gerando novo look..." : "Remixar esse Look"}</span>
                    </div>
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="w-full rounded-lg bg-gray-600 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-base">Criar outro Look</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Favoritos */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Meus Favoritos</h2>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {isLoadingFavorites ? (
              <div className="py-12 text-center text-white">Carregando favoritos...</div>
            ) : favorites.length === 0 ? (
              <div className="py-12 text-center text-white/70">
                <Heart className="mx-auto mb-4 h-16 w-16 text-white/30" />
                <p>Você ainda não tem favoritos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {favorites.map((favorito) => (
                  <div
                    key={favorito.id}
                    onClick={() => {
                      // Salvar dados do favorito no sessionStorage
                      const favoritoLook: GeneratedLook = {
                        id: favorito.id || `favorito-${Date.now()}`,
                        imagemUrl: favorito.imagemUrl,
                        titulo: favorito.productName || "Look favorito",
                        produtoNome: favorito.productName || "",
                        produtoPreco: favorito.productPrice || null,
                        compositionId: favorito.compositionId || null,
                        jobId: favorito.jobId || null,
                      }
                      sessionStorage.setItem(`favorito_${lojistaId}`, JSON.stringify(favoritoLook))
                      sessionStorage.setItem(`from_favoritos_${lojistaId}`, "true")
                      // Fechar modal e recarregar página
                      setShowFavoritesModal(false)
                      // Recarregar a página para aplicar as mudanças
                      window.location.href = `/${lojistaId}/resultado?from=favoritos`
                    }}
                    className="group relative overflow-hidden rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/10 cursor-pointer"
                  >
                    {favorito.imagemUrl && (
                      <div className="relative aspect-square w-full">
                        <Image
                          src={favorito.imagemUrl}
                          alt={favorito.productName || "Look favorito"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {favorito.productName && (
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white line-clamp-2">
                          {favorito.productName}
                        </p>
                        {favorito.productPrice && (
                          <p className="mt-1 text-xs font-bold text-yellow-300">
                            {formatPrice(favorito.productPrice)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

