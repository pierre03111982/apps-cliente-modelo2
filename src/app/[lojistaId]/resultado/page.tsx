"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, ShoppingCart, Heart, RefreshCw, Home, Instagram, Facebook, Music2, MessageCircle, X, Sparkles, ArrowLeftCircle, Check, Download } from "lucide-react"
import { ClockAnimation } from "@/components/ClockAnimation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { VideoBackground } from "@/components/VideoBackground"
import { SendToDisplayButton } from "@/components/SendToDisplayButton"
import { StoreConnectionIndicator } from "@/components/StoreConnectionIndicator"
import { SafeImage } from "@/components/ui/SafeImage"
import { useStoreSession } from "@/hooks/useStoreSession"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants"
import { fetchLojistaData } from "@/lib/firebaseQueries"
import type { LojistaData, GeneratedLook, DislikeReason } from "@/lib/types"
import { normalizeSalesConfig } from "@/lib/utils"
import { DislikeFeedbackModal } from "@/components/modals/DislikeFeedbackModal"
import { ShoppingCartModal, CartItem } from "@/components/modals/ShoppingCartModal"

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

  // Hook para gerenciar conexão com a loja (Display)
  const { isConnected, connectedStoreId, disconnect } = useStoreSession(lojistaId)

  const [lojistaData, setLojistaData] = useState<LojistaData | null>(null)
  const [looks, setLooks] = useState<GeneratedLook[]>([])
  const [currentLookIndex, setCurrentLookIndex] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedType, setVotedType] = useState<"like" | "dislike" | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const [isLoadingFavoritesRef, setIsLoadingFavoritesRef] = useState(false) // Ref para evitar múltiplas chamadas
  const [favoritesLoadedOnce, setFavoritesLoadedOnce] = useState(false) // Flag para saber se já carregou uma vez
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [fromFavoritos, setFromFavoritos] = useState(false)
  const [isRemixing, setIsRemixing] = useState(false)
  const [remixPhraseIndex, setRemixPhraseIndex] = useState(0)
  const [selectedFavoriteDetail, setSelectedFavoriteDetail] = useState<any | null>(null)
  const [showImageDetailModal, setShowImageDetailModal] = useState(false)
  const [isDislikeModalOpen, setIsDislikeModalOpen] = useState(false)
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const preferredWhatsappLink = useMemo(() => {
    return (
      lojistaData?.redesSociais?.whatsapp ||
      lojistaData?.salesConfig?.manual_contact ||
      lojistaData?.salesConfig?.salesWhatsapp ||
      lojistaData?.salesConfig?.whatsappLink ||
      null
    )
  }, [lojistaData])

  const derivedCheckoutLink = useMemo(() => {
    return (
      lojistaData?.salesConfig?.checkout_url ||
      lojistaData?.salesConfig?.checkoutLink ||
      lojistaData?.salesConfig?.ecommerceUrl ||
      preferredWhatsappLink
    )
  }, [lojistaData, preferredWhatsappLink])

  // Frases para remixar (preparando surpresa)
  const remixPhrases = [
    "🎁 Preparando uma surpresa especial...",
    "✨ Criando uma nova versão incrível...",
    "🎨 Aplicando transformações mágicas...",
    "💫 Gerando algo único para você...",
    "🌟 Quase pronto, aguarde...",
    "🎯 Finalizando os últimos detalhes...",
  ]

  // Carregar dados da loja (sempre recarregar se não houver dados)
  useEffect(() => {
    if (!lojistaId) return

    const loadData = async () => {
      // Se já temos dados da loja, não recarregar desnecessariamente
      // Mas se não temos dados, tentar carregar
      if (lojistaData && lojistaData.nome) {
        console.log("[ResultadoPage] Dados da loja já carregados, pulando recarregamento")
        return
      }

      try {
        // Tentar buscar do backend primeiro
        let lojistaDb: LojistaData | null = null

        try {
          console.log("[ResultadoPage] Carregando dados da loja...")
          const perfilResponse = await fetch(`/api/lojista/perfil?lojistaId=${encodeURIComponent(lojistaId)}`, {
            cache: 'no-store'
          })
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
                salesConfig: normalizeSalesConfig(perfilData.salesConfig),
                descontoRedesSociais: perfilData.descontoRedesSociais || null,
                descontoRedesSociaisExpiraEm: perfilData.descontoRedesSociaisExpiraEm || null,
              }
              console.log("[ResultadoPage] Dados da loja carregados:", lojistaDb.nome)
            }
          } else {
            console.warn("[ResultadoPage] Erro ao buscar perfil:", perfilResponse.status)
          }
        } catch (apiError) {
          console.warn("[ResultadoPage] Erro ao buscar via API, tentando Firebase:", apiError)
        }

        // Se não encontrou via API, tentar Firebase
        if (!lojistaDb) {
          console.log("[ResultadoPage] Tentando carregar via Firebase...")
          lojistaDb = await fetchLojistaData(lojistaId).catch(() => null)
          if (lojistaDb) {
            console.log("[ResultadoPage] Dados da loja carregados via Firebase:", lojistaDb.nome)
          }
        }

        if (lojistaDb) {
          setLojistaData({
            ...lojistaDb,
            salesConfig: normalizeSalesConfig(lojistaDb.salesConfig),
          })
        } else {
          console.error("[ResultadoPage] Não foi possível carregar dados da loja")
        }
      } catch (error) {
        console.error("[ResultadoPage] Erro ao carregar dados:", error)
      }
      
      // Carregar favoritos na inicialização apenas uma vez (silenciosamente em background)
      if (!favoritesLoadedOnce) {
        console.log("[ResultadoPage] Carregando favoritos na inicialização (background)...")
        const stored = localStorage.getItem(`cliente_${lojistaId}`)
        if (stored) {
          const clienteData = JSON.parse(stored)
          const clienteId = clienteData.clienteId
          if (clienteId && !isLoadingFavoritesRef) {
            setIsLoadingFavoritesRef(true)
            // Carregar em background sem mostrar loading
            loadFavorites(true).finally(() => {
              setIsLoadingFavoritesRef(false)
              setFavoritesLoadedOnce(true)
            })
          }
        }
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojistaId]) // Carregar apenas quando lojistaId mudar

  // Verificar se já foi votado (verifica por compositionId e também por imagemUrl para evitar duplicatas)
  const checkVoteStatus = async (compositionId: string | null, imagemUrl?: string | null) => {
    if (!lojistaId) return null

    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (!stored) return null

      const clienteData = JSON.parse(stored)
      const clienteId = clienteData.clienteId

      if (!clienteId) return null

      // Verificar por compositionId se disponível
      if (compositionId) {
        const response = await fetch(
          `/api/actions/check-vote?compositionId=${encodeURIComponent(compositionId)}&customerId=${encodeURIComponent(clienteId)}&lojistaId=${encodeURIComponent(lojistaId)}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.votedType || data.action) {
            return data.votedType || data.action
          }
        }
      }

      // Se não encontrou por compositionId e temos imagemUrl, verificar nos favoritos locais
      if (imagemUrl && favorites.length > 0) {
        const alreadyLiked = favorites.some((fav: any) => {
          return fav.imagemUrl === imagemUrl || fav.compositionId === compositionId
        })
        if (alreadyLiked) {
          return "like"
        }
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao verificar voto:", error)
    }

    return null
  }

  // Carregar looks do sessionStorage ou favorito
  useEffect(() => {
    if (!lojistaId) return

    // Debug: Verificar conexão com display ao carregar
    if (typeof window !== "undefined") {
      const targetDisplay = sessionStorage.getItem("target_display")
      const connectedStoreId = sessionStorage.getItem("connected_store_id")
      console.log("[ResultadoPage] Estado de conexão com display ao carregar:", {
        targetDisplay,
        connectedStoreId,
        lojistaId,
        isConnected: connectedStoreId === lojistaId,
      })
    }

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
            // Garantir que a imagemUrl está presente
            if (!favoritoLook.imagemUrl) {
              console.error("[ResultadoPage] Favorito sem imagemUrl:", favoritoLook)
              router.push(`/${lojistaId}/experimentar`)
              return
            }
            console.log("[ResultadoPage] Carregando favorito com imagem:", favoritoLook.imagemUrl)
            // Salvar a foto para reutilização na tela de experimentar
            if (favoritoLook.imagemUrl) {
              sessionStorage.setItem(`photo_${lojistaId}`, favoritoLook.imagemUrl)
              console.log("[ResultadoPage] Foto salva para reutilização:", favoritoLook.imagemUrl)
            }
            // Definir looks e estado de uma vez
            setLooks([favoritoLook])
            setCurrentLookIndex(0)
            // Marcar como já votado (like) - veio de favoritos
            setHasVoted(true)
            setVotedType("like")
            // Limpar flag
            sessionStorage.removeItem(`from_favoritos_${lojistaId}`)
            console.log("[ResultadoPage] Favorito carregado e estado atualizado:", favoritoLook)
          } catch (error) {
            console.error("[ResultadoPage] Erro ao carregar favorito:", error)
            router.push(`/${lojistaId}/experimentar`)
          }
        } else {
          console.error("[ResultadoPage] Nenhum favorito encontrado no sessionStorage")
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
          
          // Verificar se uma nova imagem foi gerada
          const newLooksGenerated = sessionStorage.getItem(`new_looks_generated_${lojistaId}`)
          if (newLooksGenerated === "true") {
            // Nova imagem gerada - verificar se já votou nesta nova imagem
            sessionStorage.removeItem(`new_looks_generated_${lojistaId}`)
            
            // Verificar voto para a nova imagem gerada
            if (parsedLooks.length > 0) {
              const firstLook = parsedLooks[0]
              let compositionId = firstLook.compositionId
              
              // Se não houver compositionId (look refinado ou remixado), criar um ID único baseado na imagemUrl
              if (!compositionId && firstLook.imagemUrl) {
                const imageHash = firstLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
                compositionId = `refined-${imageHash}`
              }
              
              if (compositionId || firstLook.imagemUrl) {
                const voteStatus = await checkVoteStatus(compositionId, firstLook.imagemUrl)
                if (voteStatus) {
                  // Já votou nesta imagem - não mostrar pergunta
                  setHasVoted(true)
                  setVotedType(voteStatus === "like" ? "like" : "dislike")
                } else {
                  // Não votou ainda - mostrar pergunta
                  setHasVoted(false)
                  setVotedType(null)
                }
              } else {
                // Sem compositionId e sem imagemUrl - mostrar pergunta
                setHasVoted(false)
                setVotedType(null)
              }
            } else {
              setHasVoted(false)
              setVotedType(null)
            }
          } else {
            // Não é nova imagem - SEMPRE verificar se já foi votado (mesmo após refresh)
            if (parsedLooks.length > 0) {
              const firstLook = parsedLooks[0]
              let compositionId = firstLook.compositionId
              
              // Se não houver compositionId (look refinado ou remixado), criar um ID único baseado na imagemUrl
              if (!compositionId && firstLook.imagemUrl) {
                const imageHash = firstLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
                compositionId = `refined-${imageHash}`
              }
              
              if (compositionId || firstLook.imagemUrl) {
                // SEMPRE verificar voto no backend ao carregar a página
                console.log("[ResultadoPage] Verificando voto ao carregar página para compositionId:", compositionId, "imagemUrl:", firstLook.imagemUrl?.substring(0, 50))
                const voteStatus = await checkVoteStatus(compositionId, firstLook.imagemUrl)
                console.log("[ResultadoPage] Status de voto verificado:", voteStatus)
                if (voteStatus) {
                  // Já votou - mostrar botões liberados (não perguntar novamente)
                  setHasVoted(true)
                  setVotedType(voteStatus === "like" ? "like" : "dislike")
                } else {
                  // Não votou ainda - mostrar pergunta
                  setHasVoted(false)
                  setVotedType(null)
                }
              } else {
                // Sem compositionId - mostrar pergunta
                setHasVoted(false)
                setVotedType(null)
              }
            } else {
              setHasVoted(false)
              setVotedType(null)
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
        // Primeiro verificar se novas imagens foram geradas (prioridade máxima)
        const newLooksGenerated = sessionStorage.getItem(`new_looks_generated_${lojistaId}`)
        console.log("[ResultadoPage] Verificando voto - newLooksGenerated:", newLooksGenerated)
        
        if (newLooksGenerated === "true") {
          // Nova imagem gerada - sempre mostrar botões de like/dislike
          console.log("[ResultadoPage] Nova imagem gerada detectada - resetando voto")
          setHasVoted(false)
          setVotedType(null)
          // Remover flag
          sessionStorage.removeItem(`new_looks_generated_${lojistaId}`)
          return
        }
        
        const currentLook = looks[currentLookIndex]
        console.log("[ResultadoPage] Verificando voto para look:", currentLook.id, "compositionId:", currentLook.compositionId)
        
        let compositionId = currentLook.compositionId
        
        // Se não houver compositionId (look refinado ou remixado), criar um ID único baseado na imagemUrl
        if (!compositionId && currentLook.imagemUrl) {
          const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
          compositionId = `refined-${imageHash}`
          console.log("[ResultadoPage] CompositionId gerado para look sem ID:", compositionId)
        }
        
        // SEMPRE verificar status de voto no backend (mesmo após refresh)
        // Verificar tanto por compositionId quanto por imagemUrl para evitar duplicatas
        if (compositionId || currentLook.imagemUrl) {
          const voteStatus = await checkVoteStatus(compositionId, currentLook.imagemUrl)
          console.log("[ResultadoPage] Status de voto verificado ao mudar look:", voteStatus, "para imagemUrl:", currentLook.imagemUrl?.substring(0, 50))
          if (voteStatus) {
            // Já votou - mostrar botões liberados (não perguntar novamente)
            setHasVoted(true)
            setVotedType(voteStatus === "like" ? "like" : "dislike")
          } else {
            // Não votou ainda - mostrar pergunta
            setHasVoted(false)
            setVotedType(null)
          }
        } else {
          console.log("[ResultadoPage] Sem compositionId - resetando voto")
          setHasVoted(false)
          setVotedType(null)
        }
      }
      checkVote()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLookIndex, fromFavoritos, looks, lojistaId])

  // Recarregar favoritos quando o modal for aberto (apenas se não estiver carregando)
  useEffect(() => {
    if (showFavoritesModal && lojistaId && !isLoadingFavoritesRef) {
      console.log("[ResultadoPage] Modal de favoritos aberto - recarregando favoritos...")
      setIsLoadingFavoritesRef(true)
      loadFavorites(false).finally(() => {
        setIsLoadingFavoritesRef(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesModal, lojistaId])

  // Carregar favoritos (simplificado como no modelo-3)
  const loadFavorites = useCallback(async (silent = false) => {
    if (!lojistaId || isLoadingFavoritesRef) {
      console.log("[ResultadoPage] loadFavorites ignorado - já está carregando ou sem lojistaId")
      return
    }

    try {
      if (!silent) {
        setIsLoadingFavorites(true)
      }
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (!stored) return

      const clienteData = JSON.parse(stored)
      const clienteId = clienteData.clienteId

      if (!clienteId) return

      // Adicionar timestamp para evitar cache (forçar sempre buscar dados frescos)
      const timestamp = Date.now()
      const url = `/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}&_t=${timestamp}`
      console.log("[ResultadoPage] Buscando favoritos:", { lojistaId, clienteId, timestamp })
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      })

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
        console.log("[ResultadoPage] Primeiro favorito (mais recente):", limitedFavorites[0] ? {
          id: limitedFavorites[0].id,
          imagemUrl: limitedFavorites[0].imagemUrl?.substring(0, 50),
          createdAt: limitedFavorites[0].createdAt,
          action: limitedFavorites[0].action
        } : "Nenhum")
        console.log("[ResultadoPage] Último favorito (mais antigo):", limitedFavorites[limitedFavorites.length - 1] ? {
          id: limitedFavorites[limitedFavorites.length - 1].id,
          imagemUrl: limitedFavorites[limitedFavorites.length - 1].imagemUrl?.substring(0, 50),
          createdAt: limitedFavorites[limitedFavorites.length - 1].createdAt,
          action: limitedFavorites[limitedFavorites.length - 1].action
        } : "Nenhum")
        
        setFavorites(limitedFavorites)
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao carregar favoritos:", error)
    } finally {
      if (!silent) {
        setIsLoadingFavorites(false)
      }
    }
  }, [lojistaId, isLoadingFavoritesRef])

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
      // Para looks refinados sem compositionId, usar um ID único baseado na imagemUrl
      let compositionId = currentLook.compositionId
      let jobId = currentLook.jobId
      
      // Se não houver compositionId (look refinado), criar um ID único baseado na imagemUrl
      if (!compositionId && currentLook.imagemUrl) {
        // Usar hash da imagemUrl como compositionId para looks refinados
        const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
        compositionId = `refined-${imageHash}`
      }

      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          action,
          compositionId: compositionId || null,
          jobId: jobId || null,
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

  // Função para adicionar marca d'água na imagem
  const addWatermarkToImage = async (imageUrl: string, logoUrl: string): Promise<string> => {
    console.log('[ResultadoPage] Iniciando processo de marca d\'água...')
    console.log('[ResultadoPage] ImageUrl:', imageUrl)
    console.log('[ResultadoPage] LogoUrl:', logoUrl)
    
    // Tentar usar API do servidor primeiro (evita problemas de CORS)
    try {
      console.log('[ResultadoPage] Tentando usar API do servidor...')
      const response = await fetch('/api/watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, logoUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ResultadoPage] Resposta da API:', data)
        if (data.watermarkedUrl && !data.fallback) {
          console.log('[ResultadoPage] ✅ Marca d\'água aplicada via API do servidor')
          return data.watermarkedUrl;
        } else {
          console.warn('[ResultadoPage] API retornou fallback, tentando método cliente...')
        }
      } else {
        console.warn('[ResultadoPage] API retornou erro:', response.status, 'tentando método cliente...')
      }
    } catch (apiError) {
      console.warn('[ResultadoPage] Erro ao usar API de marca d\'água, tentando método cliente:', apiError);
    }

    // Fallback: tentar no cliente (pode falhar com CORS)
    console.log('[ResultadoPage] Tentando aplicar marca d\'água no cliente...')
    return new Promise((resolve) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      let imageLoaded = false
      let logoLoaded = false
      let canvas: HTMLCanvasElement | null = null
      let ctx: CanvasRenderingContext2D | null = null
      
      const tryLoadImage = (useCors: boolean) => {
        if (!useCors) {
          img.crossOrigin = undefined as any
        }
        
        img.onload = () => {
          console.log('[ResultadoPage] Imagem carregada, dimensões:', img.width, 'x', img.height)
          imageLoaded = true
          
          canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          ctx = canvas.getContext('2d')
          
          if (!ctx) {
            console.error('[ResultadoPage] Não foi possível criar contexto do canvas')
            resolve(imageUrl)
            return
          }
          
          try {
            // Desenhar imagem original
            ctx.drawImage(img, 0, 0)
            console.log('[ResultadoPage] Imagem desenhada no canvas')
            
            // Se logo já carregou, desenhar logo
            if (logoLoaded && canvas) {
              drawLogo()
            }
          } catch (drawError) {
            // Se falhar ao desenhar (canvas tainted), retornar original
            console.warn('[ResultadoPage] Canvas tainted ao desenhar imagem:', drawError)
            resolve(imageUrl)
            return
          }
        }
        
        img.onerror = (error) => {
          console.error('[ResultadoPage] Erro ao carregar imagem:', error)
          if (useCors) {
            console.log('[ResultadoPage] Tentando carregar imagem sem CORS...')
            tryLoadImage(false)
          } else {
            console.error('[ResultadoPage] Não foi possível carregar imagem, retornando original')
            resolve(imageUrl)
          }
        }
        
        img.src = imageUrl
      }
      
      const drawLogo = () => {
        if (!canvas || !ctx) {
          console.error('[ResultadoPage] Canvas ou contexto não disponível para desenhar logo')
          return
        }
        
        const logo = new window.Image()
        logo.crossOrigin = 'anonymous'
        
        const tryLoadLogo = (logoUseCors: boolean) => {
          if (!logoUseCors) {
            logo.crossOrigin = undefined as any
          }
          
          logo.onload = () => {
            console.log('[ResultadoPage] Logo carregada, dimensões:', logo.width, 'x', logo.height)
            logoLoaded = true
            
            try {
              if (!canvas || !ctx) {
                console.error('[ResultadoPage] Canvas não disponível')
                resolve(imageUrl)
                return
              }
              
              // Tamanho da logo (15% da largura da imagem)
              const logoSize = Math.min(canvas.width, canvas.height) * 0.15
              const logoX = logoSize * 0.1
              const logoY = logoSize * 0.1
              
              console.log('[ResultadoPage] Desenhando logo em:', logoX, logoY, 'tamanho:', logoSize)
              
              // Desenhar círculo branco semi-transparente atrás da logo
              ctx.save()
              ctx.globalAlpha = 0.4
              ctx.fillStyle = 'white'
              ctx.beginPath()
              ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
              ctx.fill()
              ctx.restore()
              
              // Desenhar logo
              ctx.save()
              ctx.globalAlpha = 0.6
              ctx.beginPath()
              ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2)
              ctx.clip()
              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
              ctx.restore()
              
              console.log('[ResultadoPage] Logo desenhada com sucesso')
              
              // Tentar converter para blob
              try {
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob)
                    console.log('[ResultadoPage] ✅ Blob criado com sucesso, tamanho:', blob.size, 'bytes')
                    resolve(url)
                  } else {
                    console.warn('[ResultadoPage] Blob vazio, retornando imagem original')
                    resolve(imageUrl)
                  }
                }, 'image/jpeg', 0.9)
              } catch (blobError) {
                // Se toBlob falhar (canvas tainted), retornar original
                console.warn('[ResultadoPage] Erro ao criar blob:', blobError)
                resolve(imageUrl)
              }
            } catch (drawError) {
              // Se falhar ao desenhar logo, retornar original
              console.error('[ResultadoPage] Erro ao desenhar logo:', drawError)
              resolve(imageUrl)
            }
          }
          
          logo.onerror = (error) => {
            console.error('[ResultadoPage] Erro ao carregar logo:', error)
            if (logoUseCors) {
              console.log('[ResultadoPage] Tentando carregar logo sem CORS...')
              tryLoadLogo(false)
            } else {
              console.error('[ResultadoPage] Não foi possível carregar logo, retornando imagem original')
              resolve(imageUrl)
            }
          }
          
          logo.src = logoUrl
        }
        
        tryLoadLogo(true)
      }
      
      // Carregar imagem primeiro
      tryLoadImage(true)
      
      // Carregar logo em paralelo
      const logo = new window.Image()
      logo.crossOrigin = 'anonymous'
      logo.onload = () => {
        console.log('[ResultadoPage] Logo carregada antes da imagem')
        logoLoaded = true
        // Se imagem já carregou, desenhar logo
        if (imageLoaded && canvas && ctx) {
          drawLogo()
        }
      }
      logo.onerror = () => {
        console.warn('[ResultadoPage] Logo não carregou, mas continuando...')
      }
      logo.src = logoUrl
    })
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
      // Para looks refinados sem compositionId, usar um ID único baseado na imagemUrl
      let compositionId = currentLook.compositionId
      let jobId = currentLook.jobId
      
      // Se não houver compositionId (look refinado), criar um ID único baseado na imagemUrl
      if (!compositionId && currentLook.imagemUrl) {
        // Usar hash da imagemUrl como compositionId para looks refinados
        const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
        compositionId = `refined-${imageHash}`
      }

      // Validar se temos todos os dados necessários
      if (!clienteId) {
        console.error("[ResultadoPage] Erro: clienteId não encontrado no localStorage")
        alert("Erro: Cliente não identificado. Faça login novamente.")
        setLoadingAction(null)
        return
      }

      if (!currentLook.imagemUrl || currentLook.imagemUrl.trim() === "") {
        console.error("[ResultadoPage] Erro: imagemUrl vazia ou ausente:", currentLook)
        alert("Erro: Imagem não disponível. Não é possível salvar como favorito.")
        setLoadingAction(null)
        return
      }

      // Verificar se a imagem já está nos favoritos (evitar duplicatas)
      // Verifica tanto por imagemUrl quanto por compositionId
      const imagemUrl = currentLook.imagemUrl
      const alreadyInFavorites = favorites.some((fav: any) => {
        const favImageUrl = fav.imagemUrl?.trim()
        const favCompositionId = fav.compositionId
        const currentImageUrl = imagemUrl?.trim()
        const currentCompositionId = compositionId
        
        // Verificar por URL exata ou por compositionId
        return (favImageUrl && currentImageUrl && favImageUrl === currentImageUrl) ||
               (favCompositionId && currentCompositionId && favCompositionId === currentCompositionId)
      })
      
      // Também verificar no backend para garantir que não há duplicata
      const voteStatus = await checkVoteStatus(compositionId, imagemUrl)
      
      if (alreadyInFavorites || voteStatus === "like") {
        console.log("[ResultadoPage] Imagem já está nos favoritos ou já foi curtida, atualizando apenas o status de voto")
        setHasVoted(true)
        setVotedType("like")
        setLoadingAction(null)
        return
      }

      // Enviar like imediatamente com a imagem original (não bloquear)
      console.log("[ResultadoPage] Salvando like:", {
        lojistaId,
        clienteId,
        imagemUrl: currentLook.imagemUrl?.substring(0, 100),
        compositionId,
        jobId,
        produtoNome: currentLook.produtoNome,
      })

      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          action: "like",
          compositionId: compositionId || null,
          jobId: jobId || null,
          customerId: clienteId,
          customerName: clienteNome,
          productName: currentLook.produtoNome,
          productPrice: currentLook.produtoPreco || null,
          imagemUrl: currentLook.imagemUrl, // Usar imagem original imediatamente
        }),
      })

      const responseData = await response.json().catch(() => ({}))

      console.log("[ResultadoPage] Resposta do servidor:", response.status, responseData)

      if (response.ok && responseData.success !== false) {
        setHasVoted(true)
        setVotedType("like")
        setLoadingAction(null) // Liberar o botão imediatamente
        
        console.log("[ResultadoPage] Like salvo com sucesso - imagem será salva automaticamente nos favoritos")
        
        // Recarregar favoritos apenas uma vez após um pequeno delay para dar tempo ao backend processar
        if (!isLoadingFavoritesRef) {
          setTimeout(async () => {
            console.log("[ResultadoPage] Recarregando favoritos após like...")
            setIsLoadingFavoritesRef(true)
            await loadFavorites(false).finally(() => {
              setIsLoadingFavoritesRef(false)
            })
          }, 500)
        }
      } else {
        console.error("[ResultadoPage] Erro ao registrar like:", response.status, responseData)
        const errorMessage = responseData.error || "Erro ao salvar like. Tente novamente."
        alert(errorMessage)
        setLoadingAction(null)
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao registrar like:", error)
      alert("Erro ao salvar like. Tente novamente.")
      setLoadingAction(null)
    }
  }, [hasVoted, currentLookIndex, looks, lojistaId, lojistaData, loadFavorites, favorites])

  const openDislikeModal = useCallback(() => {
    if (hasVoted) {
      console.log("[ResultadoPage] Já votado, ignorando dislike")
      return
    }
    setIsDislikeModalOpen(true)
  }, [hasVoted])

  const submitDislike = useCallback(
    async (reason?: DislikeReason) => {
      if (hasVoted) {
        setIsDislikeModalOpen(false)
        return
      }

      const currentLook = looks[currentLookIndex]
      if (!currentLook || !lojistaId) {
        console.error("[ResultadoPage] Look ou lojistaId não encontrado")
        setIsDislikeModalOpen(false)
        return
      }

      setIsDislikeModalOpen(false)
      setLoadingAction("dislike")

      try {
        const stored = localStorage.getItem(`cliente_${lojistaId}`)
        const clienteData = stored ? JSON.parse(stored) : null
        const clienteId = clienteData?.clienteId || null

        let compositionId = currentLook.compositionId
        let jobId = currentLook.jobId

        if (!compositionId && currentLook.imagemUrl) {
          const imageHash = currentLook.imagemUrl.split("/").pop()?.split("?")[0] || `refined-${Date.now()}`
          compositionId = `refined-${imageHash}`
        }

        console.log("[ResultadoPage] Registrando dislike:", { compositionId, jobId, clienteId, reason })

        const response = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lojistaId,
            action: "dislike",
            compositionId: compositionId || null,
            jobId: jobId || null,
            customerId: clienteId,
            customerName: clienteData?.nome || null,
            productName: currentLook.produtoNome,
            productPrice: currentLook.produtoPreco || null,
            reason,
          }),
        })

        const responseData = await response.json().catch(() => ({}))

        console.log("[ResultadoPage] Resposta do servidor (dislike):", response.status, responseData)

        if (response.ok && responseData.success !== false) {
          setHasVoted(true)
          setVotedType("dislike")
          setLoadingAction(null)
          console.log("[ResultadoPage] Dislike salvo com sucesso")
        } else {
          console.error("[ResultadoPage] Erro ao registrar dislike:", response.status, responseData)
          const errorMessage = responseData.error || "Erro ao salvar dislike. Tente novamente."
          alert(errorMessage)
          setLoadingAction(null)
        }
      } catch (error) {
        console.error("[ResultadoPage] Erro ao registrar dislike:", error)
        alert("Erro ao salvar dislike. Tente novamente.")
        setLoadingAction(null)
      }
    },
    [hasVoted, looks, currentLookIndex, lojistaId]
  )

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

  // Converter selectedProducts para CartItem
  const cartItems: CartItem[] = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) {
      return []
    }
    return selectedProducts.map((produto: any) => ({
      id: produto.id || produto.productId || String(Date.now() + Math.random()),
      name: produto.nome || produto.name || "Produto sem nome",
      price: produto.preco || produto.price || 0,
      quantity: 1,
      imageUrl: produto.imagemUrl || produto.imageUrl || null,
    }))
  }, [selectedProducts])

  // Handle checkout - Abrir modal do carrinho
  const handleCheckout = useCallback(async () => {
    await registerAction("checkout")
    
    // Se não houver produtos selecionados e houver um link de checkout estático, usar ele
    if (cartItems.length === 0 && derivedCheckoutLink) {
      window.open(derivedCheckoutLink, "_blank", "noopener,noreferrer")
      return
    }
    
    // Se houver produtos, abrir modal do carrinho
    if (cartItems.length > 0) {
      setCartModalOpen(true)
    } else {
      // Se não houver produtos e não houver link, mostrar mensagem
      alert("Selecione produtos antes de comprar.")
    }
  }, [registerAction, derivedCheckoutLink, cartItems])

  // Handle WhatsApp
  const handleWhatsApp = useCallback(() => {
    if (!preferredWhatsappLink) return
    const url = preferredWhatsappLink.startsWith("http")
      ? preferredWhatsappLink
      : `https://wa.me/${preferredWhatsappLink.replace(/\D/g, "")}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [preferredWhatsappLink])

  // Verificar se WhatsApp está disponível
  const hasWhatsApp = !!preferredWhatsappLink

  // Handle download - Versão simplificada e otimizada
  const handleDownload = useCallback(async () => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook?.imagemUrl) {
      console.error("[ResultadoPage] Imagem não encontrada para download")
      return
    }

    // Se não houver logo, fazer download direto (rápido e sem problemas)
    if (!lojistaData?.logoUrl) {
      try {
        const link = document.createElement('a')
        link.href = currentLook.imagemUrl
        link.download = `look-${currentLook.id || Date.now()}.jpg`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      } catch (error) {
        console.error("[ResultadoPage] Erro ao baixar imagem:", error)
        return
      }
    }

    // Se houver logo, tentar usar backend para processar marca d'água (rápido e sem CORS)
    try {
      console.log("[ResultadoPage] Processando marca d'água via backend...")
      
      // Timeout curto de 3 segundos - se demorar mais, fazer download direto
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      try {
        const response = await fetch('/api/watermark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: currentLook.imagemUrl, 
            logoUrl: lojistaData.logoUrl 
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          
          // Se backend retornou imagem com marca d'água, usar ela
          if (data.watermarkedUrl && !data.fallback && data.watermarkedUrl !== currentLook.imagemUrl) {
            console.log("[ResultadoPage] ✅ Marca d'água processada pelo backend")
            const link = document.createElement('a')
            link.href = data.watermarkedUrl
            link.download = `look-${currentLook.id || Date.now()}.jpg`
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            return
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name !== 'AbortError') {
          console.warn("[ResultadoPage] Erro ao processar marca d'água:", fetchError)
        }
      }
    } catch (error) {
      console.warn("[ResultadoPage] Erro ao processar marca d'água:", error)
    }
    
    // Fallback: sempre fazer download direto da imagem original (rápido e confiável)
    try {
      console.log("[ResultadoPage] Fazendo download direto da imagem...")
      const link = document.createElement('a')
      link.href = currentLook.imagemUrl
      link.download = `look-${currentLook.id || Date.now()}.jpg`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log("[ResultadoPage] ✅ Download concluído!")
    } catch (fallbackError) {
      console.error("[ResultadoPage] Erro no download:", fallbackError)
    }
  }, [currentLookIndex, looks, lojistaData])

  // Função para comprimir imagem antes do upload
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<File> => {
    // Verificar se está no cliente (browser)
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('compressImage só pode ser usado no cliente'))
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // Usar HTMLImageElement explicitamente para evitar conflito com Next.js Image
        const img = document.createElement('img') as HTMLImageElement
        img.onload = () => {
          // Calcular novas dimensões mantendo proporção
          let width = img.width
          let height = img.height
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }
          
          // Criar canvas para redimensionar e comprimir
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'))
            return
          }
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height)
          
          // Converter para blob com compressão
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erro ao comprimir imagem'))
                return
              }
              
              // Criar novo File a partir do blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              
              console.log(`[compressImage] Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
              resolve(compressedFile)
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => reject(new Error('Erro ao carregar imagem'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsDataURL(file)
    })
  }

  // Upload de foto para o backend (helper function para handleRegenerate)
  const uploadPersonPhoto = async (file: File): Promise<string> => {
    try {
      console.log("[uploadPersonPhoto] Iniciando upload:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
      
      let fileToUpload = file
      if (file.size > 1024 * 1024) {
        console.log("[uploadPersonPhoto] Comprimindo imagem antes do upload...")
        fileToUpload = await compressImage(file, 1920, 1920, 0.85)
      }
      
      const formData = new FormData()
      formData.append("photo", fileToUpload)
      formData.append("lojistaId", lojistaId)

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      let response: Response;
      try {
        response = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Tempo de resposta excedido ao fazer upload da foto. Tente novamente.");
        }
        if (fetchError.message?.includes('fetch failed') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error("Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.");
        }
        throw fetchError;
      }
              
              if (!response.ok) {
        let errorData: any = {}
        try {
          const responseText = await response.text()
          if (responseText) {
            errorData = JSON.parse(responseText)
          }
        } catch (parseError) {
          console.error("[uploadPersonPhoto] Erro ao parsear resposta de erro:", parseError)
        }
        const errorMessage = errorData.error || errorData.message || `Erro ao fazer upload: ${response.status}`
        throw new Error(errorMessage)
      }

      let data: any
      try {
        const responseText = await response.text()
        if (!responseText) {
          throw new Error("Resposta vazia do servidor")
        }
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Erro ao processar resposta do servidor")
      }

      if (!data.imageUrl) {
        throw new Error("Servidor não retornou URL da imagem")
      }

      return data.imageUrl
    } catch (error: any) {
      console.error("[uploadPersonPhoto] Erro:", error)
      throw error
    }
  }

  // Gerar novo look (remixar) - REESCRITO BASEADO NO handleVisualize
  const handleRegenerate = async () => {
    let phraseInterval: NodeJS.Timeout | null = null
    
    try {
      setLoadingAction("remix")
      setIsRemixing(true)
      setRemixPhraseIndex(0)
      
      // Iniciar animação de frases
      let phraseIndex = 0
      phraseInterval = setInterval(() => {
        phraseIndex++
        if (phraseIndex < remixPhrases.length) {
          setRemixPhraseIndex(phraseIndex)
        } else {
          phraseIndex = 0
          setRemixPhraseIndex(0)
        }
      }, 2500)

      // PHASE 11 FIX: SEMPRE usar a foto ORIGINAL (não a foto gerada anteriormente) - MESMA LÓGICA DO handleVisualize
      let personImageUrl: string
      
      // Prioridade 1: Buscar foto original do sessionStorage
      const originalPhotoUrl = sessionStorage.getItem(`original_photo_${lojistaId}`)
      
      if (originalPhotoUrl) {
        // Se tiver foto original salva, usar ela (pode ser blob ou HTTP)
        console.log("[handleRegenerate] 📸 Usando foto ORIGINAL do sessionStorage:", originalPhotoUrl.substring(0, 50) + "...")
        
        if (originalPhotoUrl.startsWith('blob:')) {
          // Se for blob, converter para File e fazer upload
          try {
            const response = await fetch(originalPhotoUrl)
            const blob = await response.blob()
            const fileName = `original-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
            const file = new File([blob], fileName, { type: blob.type || 'image/png' })
            personImageUrl = await uploadPersonPhoto(file)
            console.log("[handleRegenerate] ✅ Foto original (blob) convertida e enviada:", personImageUrl?.substring(0, 50) + "...")
          } catch (blobError) {
            console.error("[handleRegenerate] Erro ao converter blob original para File:", blobError)
            // Fallback: tentar usar diretamente
            personImageUrl = originalPhotoUrl
          }
        } else {
          // URL HTTP/HTTPS (já foi enviada anteriormente)
          personImageUrl = originalPhotoUrl
          console.log("[handleRegenerate] ✅ Usando foto original (HTTP):", personImageUrl?.substring(0, 50) + "...")
        }
      } else {
        // Fallback: Se não tiver original, tentar usar foto atual
        const currentPhotoUrl = fromFavoritos && currentLook && currentLook.imagemUrl 
          ? currentLook.imagemUrl 
          : sessionStorage.getItem(`photo_${lojistaId}`)
        
        if (!currentPhotoUrl) {
          throw new Error("Foto não encontrada. Por favor, faça upload de uma nova foto.")
        }
        
        // Se for blob/data, converter e fazer upload - MESMA LÓGICA DO handleVisualize
        if (currentPhotoUrl.startsWith('blob:') || currentPhotoUrl.startsWith('data:')) {
          console.warn("[handleRegenerate] ⚠️ URL blob/data sem File, tentando converter...")
          try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const fetchTimeoutMs = isMobile ? 30000 : 15000;
            
            const fetchController = new AbortController();
            const fetchTimeout = setTimeout(() => fetchController.abort(), fetchTimeoutMs);
            
            let response: Response;
            try {
              response = await fetch(currentPhotoUrl, { 
                signal: fetchController.signal,
                cache: 'no-cache',
                mode: 'cors',
              });
              clearTimeout(fetchTimeout);
            } catch (fetchError: any) {
              clearTimeout(fetchTimeout);
            if (fetchError.name === 'AbortError') {
                throw new Error("Tempo de resposta excedido ao carregar a foto. Verifique sua conexão e tente novamente.");
            }
            if (fetchError.message?.includes('fetch failed') || 
                fetchError.message?.includes('Failed to fetch') ||
                  fetchError.message?.includes('NetworkError')) {
                throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
            }
              throw fetchError;
            }
            
            if (!response.ok) {
              throw new Error(`Erro ao carregar foto: ${response.status}`)
            }
            
            const blob = await response.blob()
            if (!blob || blob.size === 0) {
              throw new Error("Foto vazia ou inválida. Tente selecionar novamente.")
            }
            
            const fileName = `avatar-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
            const file = new File([blob], fileName, { type: blob.type || 'image/png' })
            personImageUrl = await uploadPersonPhoto(file)
            // Salvar como original
            sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
            sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
          } catch (blobError: any) {
            console.error("[handleRegenerate] Erro ao converter blob/data para File:", blobError)
            if (blobError.name === 'AbortError') {
              throw new Error("Tempo de resposta excedido ao processar a foto. Tente selecionar novamente.")
            }
            if (blobError.message?.includes("fetch failed") || blobError.message?.includes("Failed to fetch")) {
              throw new Error("Erro de conexão ao processar a foto. Verifique sua internet e tente novamente.")
            }
            throw new Error(blobError.message || "Erro ao processar foto. Tente selecionar novamente.")
          }
        } else {
          // URL HTTP/HTTPS (já foi enviada anteriormente)
          personImageUrl = currentPhotoUrl
          // Salvar como original se não estiver salva
          if (!originalPhotoUrl) {
            sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
            sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
          }
        }
      }
      
      console.log("[handleRegenerate] ✅ Foto final enviada:", personImageUrl?.substring(0, 50) + "...")

      // 2. Preparar dados para geração - MESMA LÓGICA DO handleVisualize
      // PHASE 11-B FIX: Enviar TODOS os produtos selecionados (não apenas o primeiro)
      const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
      if (!storedProducts) {
        router.push(`/${lojistaId}/experimentar`)
        return
      }

      const products = JSON.parse(storedProducts)
      const productIds = products.map((p: any) => p.id).filter(Boolean)

      if (productIds.length === 0) {
        throw new Error("Nenhum produto válido selecionado")
      }

      // Buscar clienteId do localStorage
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null
      const clienteNome = clienteData?.nome || clienteData?.name || null

      // PHASE 13: Usar a API de Remix (/api/generate-looks/remix) e enviar original_photo_url explicitamente
      const payload = {
        original_photo_url: personImageUrl, // PHASE 13: Sempre enviar como original_photo_url (Source of Truth)
        personImageUrl: personImageUrl, // Também enviar como personImageUrl para compatibilidade
        products: products, // Passar produtos completos (com nome, descrição, categoria)
        productIds: productIds, // TODOS os produtos selecionados
        lojistaId,
        customerId: clienteId,
        customerName: clienteNome, // Adicionar customerName para o Radar funcionar
        gender: products.find((p: any) => p.genero)?.genero || null, // Detectar gênero dos produtos
        options: { 
          quality: "high", 
          // IMPORTANTE: Desabilitar watermark para remover a caixa preta com informações do produto
          skipWatermark: true,
          lookType: "creative", // Sempre usar Look Criativo para multi-produto
        },
        // PHASE 25: Instrução explícita para evitar cenários noturnos
        sceneInstructions: "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
      }

      console.log("[handleRegenerate] PHASE 13: Enviando para /api/generate-looks/remix com foto ORIGINAL:", {
        hasOriginalPhoto: !!personImageUrl,
        originalPhotoUrl: personImageUrl?.substring(0, 50) + "...",
        totalProducts: productIds.length,
        productIds,
        payloadOriginalPhotoUrl: payload.original_photo_url?.substring(0, 50) + "...",
      })

      // PHASE 25: Melhorar timeout e tratamento de erros para mobile - MESMA LÓGICA DO handleVisualize
      // IMPORTANTE: Timeout inicial apenas para a requisição POST inicial (criação do job)
      // Após receber jobId, o timeout será limpo e o polling terá seu próprio timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeoutMs = isMobile ? 60000 : 45000; // 60s mobile, 45s desktop (apenas para criar o job)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      let response: Response
      try {
        // PHASE 11-B FIX: Usar a rota correta /api/generate-looks/remix
        // PHASE 25: Adicionar headers e configurações melhores para mobile
        response = await fetch("/api/generate-looks/remix", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          cache: 'no-cache',
          mode: 'cors',
        })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // PHASE 25: Melhor tratamento de erros de rede no mobile
        if (fetchError.name === "AbortError") {
          throw new Error("Tempo de resposta excedido. O processamento está demorando mais que o esperado. Tente novamente.")
        }
        
        if (fetchError.message?.includes("fetch failed") || 
            fetchError.message?.includes("Failed to fetch") ||
            fetchError.message?.includes("NetworkError") ||
            fetchError.message?.includes("Network request failed")) {
          throw new Error("Erro de conexão. Verifique sua internet e tente novamente.")
        }
        
        if (fetchError.message?.includes("ECONNREFUSED") || fetchError.message?.includes("ERR_CONNECTION_REFUSED")) {
          throw new Error("Servidor não está respondendo. Tente novamente em alguns instantes.")
        }
        
        if (fetchError.message?.includes("CORS") || fetchError.message?.includes("cross-origin")) {
          throw new Error("Erro de permissão. Tente recarregar a página e tentar novamente.")
        }
        
        // PHASE 25: Mensagem mais amigável para erros desconhecidos
        throw new Error(`Erro ao processar foto: ${fetchError.message || "Erro desconhecido. Tente novamente."}`)
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: any = {}
        try {
          const errorText = await response.text()
            try {
            errorData = JSON.parse(errorText)
            } catch {
            errorData = { error: errorText || `Erro HTTP ${response.status}` }
          }
        } catch {
          errorData = { error: `Erro HTTP ${response.status}` }
        }
        
        // PHASE 25: Mensagens mais amigáveis para diferentes códigos de erro
        let errorMessage = errorData.error || errorData.message || `Erro ao gerar composição (${response.status})`
        
        // PHASE 25: Melhorar mensagens de erro para mobile
        if (response.status === 500) {
          errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes."
        } else if (response.status === 503) {
          errorMessage = "Serviço temporariamente indisponível. Tente novamente em alguns instantes."
        } else if (response.status === 429) {
          errorMessage = "Muitas requisições. Aguarde alguns instantes antes de tentar novamente."
        } else if (response.status === 400) {
          errorMessage = errorData.error || errorData.message || "Dados inválidos. Verifique se selecionou uma foto e produtos."
        } else if (response.status === 413) {
          errorMessage = "Foto muito grande. Tente usar uma foto menor ou comprimir a imagem."
        } else if (response.status === 408) {
          errorMessage = "Tempo de processamento excedido. Tente novamente com uma foto menor."
        }
        
        // PHASE 25: Garantir que a mensagem seja sempre amigável
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch failed")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        }
        
        throw new Error(errorMessage)
      }

      // IMPORTANTE: Limpar o timeout da requisição POST inicial (já recebemos a resposta)
      clearTimeout(timeoutId)
      
      const responseData = await response.json()
      
      console.log("[handleRegenerate] 📋 Resposta recebida:", {
        status: response.status,
        hasJobId: !!responseData.jobId,
        hasLooks: !!(responseData.looks && Array.isArray(responseData.looks)),
        responseDataKeys: Object.keys(responseData),
        jobId: responseData.jobId,
        looksCount: responseData.looks?.length || 0,
      })

      // PHASE 27: Verificar se a resposta é assíncrona (202 Accepted com jobId) - MESMA LÓGICA DO handleVisualize
      if (response.status === 202 && responseData.jobId) {
        
        console.log("[handleRegenerate] PHASE 27: Job criado, iniciando polling:", responseData.jobId)
        
        // Salvar jobId e reservationId para uso posterior
        const jobId = responseData.jobId
        const reservationId = responseData.reservationId
        
        // Função de polling para verificar status do Job - MESMA LÓGICA DO handleVisualize
        const pollJobStatus = async (): Promise<any> => {
          // Aumentar tempo máximo de polling para 5 minutos (geração de imagens pode demorar)
          const maxPollingTime = 300000 // 5 minutos máximo
          const pollInterval = 2000 // 2 segundos entre polls
          const startTime = Date.now()
          let consecutiveErrors = 0
          const maxConsecutiveErrors = 5 // Máximo de 5 erros consecutivos antes de falhar
          
          while (Date.now() - startTime < maxPollingTime) {
            let requestTimeout: NodeJS.Timeout | null = null
            try {
              // Usar o mesmo endpoint que handleVisualize usa
              // Criar AbortController para timeout individual de cada requisição
              const requestController = new AbortController()
              requestTimeout = setTimeout(() => requestController.abort(), 10000) // 10 segundos timeout por requisição
              
              const statusResponse = await fetch(`/api/jobs/${jobId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: 'no-cache',
                signal: requestController.signal,
              })
              
              if (requestTimeout) {
                clearTimeout(requestTimeout)
                requestTimeout = null
              }
              
              // Resetar contador de erros em caso de sucesso
              consecutiveErrors = 0
              
              if (!statusResponse.ok) {
                // Se for 404, o job pode não existir ainda (retry)
                if (statusResponse.status === 404) {
                  console.warn(`[handleRegenerate] PHASE 27: Job não encontrado (404), aguardando...`)
                  await new Promise(resolve => setTimeout(resolve, pollInterval))
                  continue
                }
                throw new Error(`Erro ao verificar status: ${statusResponse.status}`)
              }
              
              const statusData = await statusResponse.json()
              const attemptNumber = Math.floor((Date.now() - startTime) / pollInterval) + 1
              console.log("[handleRegenerate] PHASE 27: Polling attempt:", {
                attempt: attemptNumber,
                status: statusData.status,
                elapsed: Math.floor((Date.now() - startTime) / 1000) + "s",
              })
              
              if (statusData.status === "COMPLETED") {
                // Job concluído com sucesso
                if (statusData.result?.imageUrl || statusData.final_image_url) {
                  console.log("[handleRegenerate] PHASE 27: ✅ Job concluído com sucesso!")
                  return {
                    success: true,
                    imageUrl: statusData.result?.imageUrl || statusData.final_image_url,
                    compositionId: statusData.result?.compositionId || statusData.composition_id,
                    reservationId,
                  }
                } else {
                  throw new Error("Job concluído mas sem URL de imagem")
                }
              } else if (statusData.status === "FAILED") {
                // Job falhou
                const errorMsg = statusData.error || statusData.errorDetails?.message || "Erro ao gerar imagem"
                console.error("[handleRegenerate] PHASE 27: ❌ Job falhou:", errorMsg)
                throw new Error(errorMsg)
              } else if (statusData.status === "PROCESSING" || statusData.status === "PENDING") {
                // Ainda processando, continuar polling
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              } else {
                // Status desconhecido
                console.warn("[handleRegenerate] PHASE 27: Status desconhecido:", statusData.status)
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              }
            } catch (pollError: any) {
              // Limpar timeout se ainda estiver ativo
              if (requestTimeout) {
                clearTimeout(requestTimeout)
                requestTimeout = null
              }
              
              consecutiveErrors++
              console.error("[handleRegenerate] PHASE 27: Erro no polling:", {
                error: pollError.message,
                name: pollError.name,
                consecutiveErrors,
                attempt: Math.floor((Date.now() - startTime) / pollInterval) + 1,
              })
              
              // Se exceder máximo de erros consecutivos, falhar
              if (consecutiveErrors >= maxConsecutiveErrors) {
                console.error("[handleRegenerate] PHASE 27: ❌ Muitos erros consecutivos, abortando polling")
                throw new Error("Erro de conexão durante o processamento. Tente novamente.")
              }
              
              // Se o erro for de rede/timeout, continuar tentando com backoff
              if (pollError.name === "AbortError" || 
                  pollError.name === "TimeoutError" ||
                  pollError.message?.includes("ECONNRESET") ||
                  pollError.message?.includes("fetch failed") || 
                  pollError.message?.includes("Failed to fetch") ||
                  pollError.message?.includes("NetworkError") ||
                  pollError.message?.includes("network") ||
                  pollError.message?.includes("timeout")) {
                // Backoff exponencial: esperar mais tempo após erros
                const backoffDelay = Math.min(pollInterval * Math.pow(2, consecutiveErrors - 1), 10000)
                console.log(`[handleRegenerate] PHASE 27: Erro de rede/timeout, aguardando ${backoffDelay}ms antes de retry...`)
                await new Promise(resolve => setTimeout(resolve, backoffDelay))
                continue
              }
              
              // Para outros erros, aguardar intervalo normal e continuar
              await new Promise(resolve => setTimeout(resolve, pollInterval))
              continue
            }
          }
          
          // Timeout atingido
          throw new Error("Tempo de processamento excedido. A geração está demorando mais que o esperado.")
        }
        
        // Iniciar polling
        console.log("[handleRegenerate] 🚀 Iniciando polling do job:", jobId)
        let pollResult: any
        try {
          pollResult = await pollJobStatus()
          console.log("[handleRegenerate] ✅ Polling concluído com sucesso:", {
            hasImageUrl: !!pollResult?.imageUrl,
            hasCompositionId: !!pollResult?.compositionId,
            imageUrl: pollResult?.imageUrl?.substring(0, 50) + "...",
          })
        } catch (pollError: any) {
          console.error("[handleRegenerate] ❌ Erro no polling:", {
            error: pollError?.message,
            stack: pollError?.stack?.substring(0, 500),
          })
          throw new Error(`Erro ao processar geração: ${pollError?.message || "Tempo de processamento excedido"}`)
        }
        
        // Validar que pollResult tem os dados necessários
        if (!pollResult || !pollResult.imageUrl) {
          console.error("[handleRegenerate] ❌ PollResult inválido:", pollResult)
          throw new Error("Erro ao gerar composição. Nenhum look foi gerado.")
        }
        
        // Salvar resultados e recarregar - MESMA LÓGICA DO handleVisualize
        const generatedLook = {
          id: pollResult.compositionId || `generated-${Date.now()}`,
          titulo: "Look Remixado",
          imagemUrl: pollResult.imageUrl,
          produtoNome: products.map((p: any) => p.nome).join(" + "),
          produtoPreco: products.reduce((sum: number, p: any) => sum + (p.preco || 0), 0),
          compositionId: pollResult.compositionId || null,
        }
        
        console.log("[handleRegenerate] 💾 Salvando look gerado:", {
          lookId: generatedLook.id,
          hasImageUrl: !!generatedLook.imagemUrl,
          imageUrl: generatedLook.imagemUrl?.substring(0, 50) + "...",
        })

        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
        // PHASE 11 FIX: Manter foto ORIGINAL (não sobrescrever com foto gerada)
        if (personImageUrl) {
          sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
          sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
        }
        sessionStorage.setItem(`products_${lojistaId}`, storedProducts)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        // Salvar reservationId para confirmação de visualização
        if (reservationId) {
          sessionStorage.setItem(`reservation_${lojistaId}`, reservationId)
          sessionStorage.setItem(`job_${lojistaId}`, jobId)
        }
        
        // Resetar votação para o novo look ANTES de recarregar
        setHasVoted(false)
        setVotedType(null)
        setCurrentLookIndex(0)
        
        // Limpar intervalo de frases antes de recarregar
        if (phraseInterval) {
          clearInterval(phraseInterval)
        }
        
        // Recarregar a página para mostrar o novo look
        window.location.reload()
        return
      }

      // 4. Salvar resultados e navegar (compatibilidade com resposta síncrona antiga)
      // PHASE 11-B FIX: A resposta vem com looks[] array - MESMA LÓGICA DO handleVisualize
      if (responseData.looks && Array.isArray(responseData.looks) && responseData.looks.length > 0) {
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify(responseData.looks))
        // PHASE 11 FIX: Manter foto ORIGINAL (não sobrescrever com foto gerada)
        // A foto original deve permanecer para próximos remixes
        if (personImageUrl) {
          sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
          sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
        }
        sessionStorage.setItem(`products_${lojistaId}`, storedProducts)
        
        // SEMPRE marcar como nova imagem gerada (remixar gera imagem NOVA, sempre permite like/dislike)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        // Resetar votação para o novo look ANTES de recarregar
        setHasVoted(false)
        setVotedType(null)
        setCurrentLookIndex(0)
        
        // Atualizar favoritos antes de recarregar (caso tenha dado like anteriormente)
        if (!isLoadingFavoritesRef) {
          setIsLoadingFavoritesRef(true)
          await loadFavorites(false).finally(() => {
            setIsLoadingFavoritesRef(false)
          })
        }
        
        // Limpar intervalo de frases antes de recarregar
        if (phraseInterval) {
          clearInterval(phraseInterval)
        }
        
        // Recarregar a página para mostrar o novo look
        window.location.reload()
      } else {
        throw new Error("Nenhum look foi gerado")
      }
    } catch (error: any) {
      console.error("[handleRegenerate] Erro:", error)
      if (phraseInterval) {
        clearInterval(phraseInterval)
      }
      setIsRemixing(false)
      setRemixPhraseIndex(0)
      
      // Preservar dados da loja e produtos mesmo em caso de erro
      // Garantir que os dados não sejam perdidos
      try {
        // Verificar se os dados ainda estão no sessionStorage
        const storedPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
        const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
        
        if (!storedPhoto || !storedProducts) {
          console.warn("[handleRegenerate] Dados não encontrados no sessionStorage após erro")
        }
        
        // Recarregar dados da loja se necessário
        if (!lojistaData) {
          console.log("[handleRegenerate] Recarregando dados da loja após erro...")
          const perfilResponse = await fetch(`/api/lojista/perfil?lojistaId=${encodeURIComponent(lojistaId)}`)
          if (perfilResponse.ok) {
            const perfilData = await perfilResponse.json()
            if (perfilData?.nome) {
              setLojistaData({
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
                salesConfig: normalizeSalesConfig(perfilData.salesConfig),
                descontoRedesSociais: perfilData.descontoRedesSociais || null,
                descontoRedesSociaisExpiraEm: perfilData.descontoRedesSociaisExpiraEm || null,
              })
            }
          }
        }
      } catch (reloadError) {
        console.error("[handleRegenerate] Erro ao recarregar dados:", reloadError)
      }
      
      // Mensagem de erro mais amigável
      // PHASE 25: Melhor tratamento de erros com mensagens mais amigáveis
      let errorMessage = error.message || "Erro ao gerar composição";
      
      // PHASE 25: Se a mensagem já for amigável, usar diretamente
      if (errorMessage.includes("Erro de conexão") || 
          errorMessage.includes("Tempo de resposta excedido") ||
          errorMessage.includes("Servidor não está respondendo") ||
          errorMessage.includes("Verifique sua internet")) {
        // Já é uma mensagem amigável, usar diretamente
      } else if (!errorMessage.includes("Erro ao gerar composição")) {
        // Adicionar prefixo apenas se não tiver
        errorMessage = `Erro ao gerar composição. ${errorMessage}`;
      }
      
      // PHASE 25: Garantir que mensagens de rede sejam amigáveis
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch failed")) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      console.error("[handleRegenerate] Erro completo:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        originalError: error,
      });
      
      // Usar toast ou alert dependendo do que estiver disponível
      if (typeof window !== "undefined" && (window as any).toast) {
        (window as any).toast.error(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoadingAction(null)
      setIsRemixing(false)
      if (phraseInterval) {
        clearInterval(phraseInterval)
      }
    }
  }

  // Voltar para início (Tela 2 - Experimentar)
  const handleGoHome = () => {
    // NOVA REGRA: Resetar produtos selecionados mas manter a imagem original do upload
    // A foto original (matriz) deve ser preservada, mas os produtos selecionados devem ser limpos
    
    const originalPhoto = sessionStorage.getItem(`original_photo_${lojistaId}`)
    const currentPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
    
    // Resetar produtos selecionados
    sessionStorage.removeItem(`products_${lojistaId}`)
    console.log("[ResultadoPage] Produtos selecionados resetados ao voltar para compras")
    
    // IMPORTANTE: Limpar modo refine para garantir que volta para tela normal de experimentar
    sessionStorage.removeItem(`refine_mode_${lojistaId}`)
    sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
    sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)
    console.log("[ResultadoPage] Modo refine limpo ao voltar para compras")
    
    // Prioridade: sempre usar a foto original (que foi salva quando selecionada pelos favoritos ou botão da câmera)
    if (originalPhoto) {
      // Restaurar a foto original (pode ser de favorito ou do botão da câmera)
      sessionStorage.setItem(`photo_${lojistaId}`, originalPhoto)
      console.log("[ResultadoPage] ✅ Foto original preservada ao voltar (pode ser de favorito ou botão da câmera):", originalPhoto.substring(0, 50))
    } else if (currentPhoto) {
      // Se não houver original salva, manter a foto atual e salvar como original
      sessionStorage.setItem(`original_photo_${lojistaId}`, currentPhoto)
      console.log("[ResultadoPage] Foto atual salva como original:", currentPhoto.substring(0, 50))
    } else {
      console.warn("[ResultadoPage] Nenhuma foto encontrada para restaurar")
    }
    
    // Limpar produtos selecionados do sessionStorage (precisa selecionar novamente)
    sessionStorage.removeItem(`products_${lojistaId}`)
    
    // Limpar flag de favoritos se existir
    sessionStorage.removeItem(`from_favoritos_${lojistaId}`)
    
    // Voltar para tela 2 (Experimentar) SEM modo refine
    router.push(`/${lojistaId}/experimentar`)
  }

  // Trocar Produto (Refinamento)
  const handleAddAccessory = () => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook || !currentLook.imagemUrl) {
      alert("Erro: Imagem do look não encontrada")
      return
    }

    // Preservar foto original antes de entrar no modo refinamento
    const originalPhoto = sessionStorage.getItem(`original_photo_${lojistaId}`)
    if (!originalPhoto) {
      // Tentar buscar a foto original do upload
      const uploadPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
      if (uploadPhoto && (uploadPhoto.startsWith('blob:') || (!uploadPhoto.includes('storage.googleapis.com')))) {
        sessionStorage.setItem(`original_photo_${lojistaId}`, uploadPhoto)
        console.log("[ResultadoPage] Foto original preservada antes de trocar produto")
      }
    }

    // IMPORTANTE: Carregar os produtos que foram selecionados para gerar o último look
    // Esses produtos serão exibidos como selecionados na tela de produtos
    const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts)
        console.log("[ResultadoPage] Produtos selecionados carregados para troca:", parsedProducts.length)
        // Os produtos já estão no sessionStorage, serão carregados automaticamente na tela de produtos
      } catch (error) {
        console.error("[ResultadoPage] Erro ao carregar produtos selecionados:", error)
      }
    }

    // Salvar a URL da imagem base para refinamento (última foto gerada)
    // Na tela de trocar produto, manter a última foto gerada
    sessionStorage.setItem(`refine_baseImage_${lojistaId}`, currentLook.imagemUrl)
    
    // Salvar compositionId se disponível
    if (currentLook.compositionId) {
      sessionStorage.setItem(`refine_compositionId_${lojistaId}`, currentLook.compositionId)
    }

    // Marcar que estamos em modo de refinamento
    sessionStorage.setItem(`refine_mode_${lojistaId}`, "true")

    // Redirecionar para a galeria de produtos (experimentar) em modo refinamento
    // Os produtos selecionados já estarão no sessionStorage e serão carregados automaticamente
    router.push(`/${lojistaId}/experimentar?mode=refine`)
  }

  const currentLook = looks[currentLookIndex]
  const formatPrice = (value?: number | null) =>
    typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar preço"

  // Calcular total dos produtos e desconto
  const calcularTotalProdutos = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) {
      return { total: 0, totalComDesconto: 0, percentualDesconto: 0, temDesconto: false }
    }

    const total = selectedProducts.reduce((sum, produto) => sum + (produto.preco || 0), 0)
    
    // Verificar se há desconto aplicado
    const descontoAplicado = localStorage.getItem(`desconto_aplicado_${lojistaId}`) === 'true'
    const descontoRedesSociais = lojistaData?.descontoRedesSociais || 0
    const descontoExpiraEm = lojistaData?.descontoRedesSociaisExpiraEm
    
    // Verificar se o desconto está válido
    const descontoValido = descontoAplicado && 
                           descontoRedesSociais > 0 && 
                           (!descontoExpiraEm || new Date(descontoExpiraEm) >= new Date())
    
    if (descontoValido) {
      const totalComDesconto = total * (1 - descontoRedesSociais / 100)
      return {
        total,
        totalComDesconto,
        percentualDesconto: descontoRedesSociais,
        temDesconto: true
      }
    }
    
    return { total, totalComDesconto: total, percentualDesconto: 0, temDesconto: false }
  }, [selectedProducts, lojistaData, lojistaId])

  if (!currentLook) {
    return (
      <div className="relative min-h-screen w-screen overflow-hidden flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Overlay de Loading Centralizado quando remixando */}
      {isRemixing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <LoadingSpinner size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockAnimation size={60} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white mb-2">
                {remixPhrases[remixPhraseIndex] || remixPhrases[0]}
              </p>
              <p className="text-sm text-white/80">Aguarde enquanto remixamos seu look...</p>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Vídeo de fundo (estático se conectado ao display, animado se não conectado) */}
      <VideoBackground videoSrc="/video2tela2.mp4" />

      {/* Indicador de conexão com a loja */}
      <StoreConnectionIndicator
        isConnected={isConnected}
        storeName={lojistaData?.nome}
        onDisconnect={disconnect}
      />

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-screen flex flex-col p-4 items-center justify-center space-y-3">
        
        {/* Caixa com Logo e Nome da Loja */}
        <div className="w-full max-w-sm">
          <div
            className="neon-border rounded-xl border-2 border-white/30 backdrop-blur-md px-3 sm:px-4 py-2 shadow-xl flex items-center justify-center gap-2 sm:gap-3 relative"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.75), rgba(147,51,234,0.75), rgba(59,130,246,0.75), rgba(147,51,234,0.75), rgba(0,0,0,0.75))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {/* Botão voltar só aparece após votação */}
            {hasVoted && (
              <button
                onClick={() => router.push(`/${params.lojistaId}/experimentar`)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-white hover:opacity-80 transition"
              >
                <ArrowLeftCircle className="h-6 w-6" />
              </button>
            )}

            {lojistaData?.logoUrl && (
              <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
                <Image
                  src={lojistaData.logoUrl}
                  alt={lojistaData.nome || "Logo"}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <h3
              className="text-base sm:text-lg md:text-xl font-bold text-white"
              style={{ textShadow: "0px 1px 3px black, 0px 1px 3px black" }}
              translate="no"
            >
              {lojistaData?.nome || "Loja"}
            </h3>
          </div>
        </div>
        
        <div 
          className="neon-border relative w-full max-w-sm space-y-4 rounded-2xl border-2 border-white/30 backdrop-blur p-4 shadow-2xl"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
          }}
        >
            {/* PHASE 14: Removido badge "Look Criativo IA" que estava causando overlay problemático */}
            {/* Imagem Gerada */}
            <div className="w-full rounded-xl overflow-hidden">
              <div className="neon-border relative rounded-2xl border-2 border-white/50 shadow-lg bg-transparent inline-block w-full">
                <div 
                  className={`relative border-2 border-dashed border-white/30 rounded-xl inline-block w-full ${
                    hasVoted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => {
                    // Só abrir modal se já votou (like ou dislike)
                    if (hasVoted) {
                      setShowImageDetailModal(true)
                    }
                  }}
                  style={{
                    // PHASE 14 FIX: Ocultar qualquer elemento filho que possa estar sendo renderizado incorretamente
                    overflow: 'hidden',
                    // Ocultar qualquer elemento absoluto que possa estar sendo renderizado sobre a imagem
                    position: 'relative',
                    // Remover padding para eliminar barras brancas
                    padding: 0,
                  }}
                >
                    {currentLook.imagemUrl ? (
                      <SafeImage
                        src={currentLook.imagemUrl}
                        alt={currentLook.titulo || "Look gerado"}
                        className="w-full h-auto rounded-lg"
                        containerClassName="w-full"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 'auto',
                          objectFit: 'contain',
                        }}
                        onError={(e) => {
                          console.error("[ResultadoPage] Erro ao carregar imagem:", currentLook.imagemUrl, e)
                        }}
                        title={currentLook.titulo || "Look gerado"}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-[400px] p-4 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
                      </div>
                    )}
                    {/* Marca d'água com logo da loja no canto superior esquerdo */}
                    {lojistaData?.logoUrl && (
                      <div className="absolute top-2 left-2 z-10 opacity-60">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-white/30 bg-white/40">
                          <Image
                            src={lojistaData.logoUrl}
                            alt={lojistaData.nome || "Logo"}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover opacity-80"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Botão de transmitir para o display (canto inferior esquerdo) - aparece apenas após votar (like ou dislike) */}
                    {currentLook.imagemUrl && hasVoted && (
                      <div className="absolute bottom-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <SendToDisplayButton
                          imageUrl={currentLook.imagemUrl}
                          lojistaId={lojistaId}
                          position="bottom-left"
                          size="md"
                          className="relative"
                        />
                      </div>
                    )}
                    
                    {/* PHASE 14 FIX: Remover qualquer componente de informações do produto que possa estar sendo renderizado incorretamente sobre a imagem */}
                    {/* Não renderizar informações de produto sobrepostas à imagem principal */}
                </div>
              </div>
            </div>

            {/* Ações e Feedback */}
            <div className="space-y-2">
              {!hasVoted ? (
                <div 
                  className="text-center rounded-2xl border border-white/30 backdrop-blur p-4 shadow-2xl"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                  }}
                >
                  <p className="mb-3 font-semibold text-white">Curtiu o Look?</p>
                  <div className="flex justify-center gap-4">
                    <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("[ResultadoPage] Botão dislike clicado")
                          openDislikeModal()
                        }} 
                        disabled={isRemixing || hasVoted || loadingAction === "dislike"}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-2 text-white font-semibold shadow-lg transition ${
                          isRemixing || hasVoted || loadingAction === "dislike" ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 active:scale-95'
                        }`}
                    >
                        {loadingAction === "dislike" ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-5 w-5" />
                        )}
                        Não
                    </button>
                    <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log("[ResultadoPage] Botão like clicado")
                          handleLike()
                        }} 
                        disabled={isRemixing || hasVoted || loadingAction === "like"}
                        className={`neon-border-green flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-2 text-white font-semibold shadow-lg transition ${
                          isRemixing || hasVoted || loadingAction === "like" ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 active:scale-95'
                        }`}
                    >
                        {loadingAction === "like" ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-5 w-5" />
                        )}
                        Sim
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                    <div className="text-center">
                        {votedType === 'like' ? (
                          <>
                            <h2 className="text-xl font-bold text-white">Look Salvo!</h2>
                            <p className="text-sm text-gray-300">O que fazer agora?</p>
                          </>
                        ) : (
                          <>
                            <h2 className="text-xl font-bold text-white">Que pena!</h2>
                            <p className="text-sm text-gray-300">Vamos tentar um novo look?</p>
                          </>
                        )}
                    </div>

                    {/* Card 1: Ações Primárias de Compra */}
                    <div className="space-y-2 rounded-2xl border border-white/30 backdrop-blur p-3 shadow-2xl" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}>
                        <button 
                            onClick={handleCheckout} 
                            disabled={isRemixing}
                            className={`neon-border-blue w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base transition relative overflow-hidden ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                            }`}
                            style={{ 
                              background: "linear-gradient(to right, #1e3a8a, #3b82f6, #60a5fa, #3b82f6, #1e3a8a)",
                              animation: isRemixing ? "none" : "pulse-glow-strong 1.5s ease-in-out infinite"
                            }}
                        >
                            <ShoppingCart className="h-5 w-5" /> Comprar Agora
                        </button>
                        <button 
                            onClick={handleCheckout} 
                            disabled={isRemixing}
                            className={`neon-border-white w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2 font-semibold text-gray-800 text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                            }`}
                        >
                            <ShoppingCart className="h-4 w-4" /> Adicionar ao Carrinho
                        </button>
                    </div>

                    {/* Card 2: Ações Secundárias */}
                    <div className="rounded-2xl border border-white/30 backdrop-blur p-3 shadow-2xl" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}>
                      <div className="grid grid-cols-4 gap-3">
                        <button 
                            onClick={handleShare} 
                            disabled={isRemixing}
                            className={`neon-border-blue flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                            }`}
                        >
                            <Share2 className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={handleWhatsApp} 
                            disabled={isRemixing || !hasWhatsApp}
                            className={`neon-border-green flex items-center justify-center rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing || !hasWhatsApp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                            }`}
                            title={hasWhatsApp ? "Abrir WhatsApp da loja" : "WhatsApp não disponível"}
                        >
                            <svg 
                                className="h-6 w-6" 
                                fill="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                        </button>
                        <button 
                            onClick={() => {
                              console.log("[ResultadoPage] Botão Favoritos clicado - abrindo modal...")
                              // Abrir modal - o useEffect vai recarregar os favoritos se necessário
                              setShowFavoritesModal(true)
                            }} 
                            disabled={isRemixing}
                            className={`neon-border-pink flex items-center justify-center rounded-xl bg-pink-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700'
                            }`}
                        >
                            <Heart className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={handleDownload} 
                            disabled={isRemixing}
                            className={`neon-border-black flex items-center justify-center rounded-xl bg-black py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900'
                            }`}
                        >
                            <Download className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Card 3: Ações de Navegação e Geração */}
                    <div className="space-y-2 rounded-2xl border border-white/30 backdrop-blur p-3 shadow-2xl" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}>
                      <button 
                          onClick={handleAddAccessory} 
                          disabled={isRemixing}
                          className={`neon-border-purple w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition-all duration-300 shadow-md ${
                            isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 active:scale-100'
                          }`}
                          style={{
                            background: isRemixing ? "linear-gradient(to right, #6b21a8, #9333ea, #6b21a8)" : "linear-gradient(to right, #6b21a8, #9333ea, #6b21a8)",
                          }}
                      >
                          <Sparkles className="h-4 w-4" /> Trocar Produto
                      </button>
                      {!isRemixing && (
                        <button 
                          onClick={handleRegenerate} 
                          disabled={loadingAction === "remix"} 
                          className="neon-border-green w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition-all duration-300 shadow-md disabled:opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 active:scale-100"
                          style={{
                            background: loadingAction === "remix" ? "linear-gradient(to right, #15803d, #22c55e, #15803d)" : "linear-gradient(to right, #15803d, #22c55e, #15803d)",
                          }}
                        >
                          {loadingAction === "remix" ? (
                            <ClockAnimation size={20} />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {loadingAction === "remix" ? "Gerando..." : "Remixar Look"}
                        </button>
                      )}
                      <button 
                          onClick={handleGoHome} 
                          disabled={isRemixing}
                          className={`neon-border-orange w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition-all duration-300 shadow-md ${
                            isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 active:scale-100'
                          }`}
                          style={{
                            background: isRemixing ? "linear-gradient(to right, #c2410c, #f97316, #c2410c)" : "linear-gradient(to right, #c2410c, #f97316, #c2410c)",
                          }}
                      >
                          <Home className="h-4 w-4" /> Voltar as Compras
                      </button>
                    </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Modal de Favoritos (mantido como está) */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl neo-card p-6 max-h-[90vh] overflow-y-auto">
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
              <div className="py-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="relative aspect-square w-full rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 animate-pulse"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="h-8 w-8 text-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : favorites.length === 0 ? (
              <div className="py-12 text-center text-white/70">
                <Heart className="mx-auto mb-4 h-16 w-16 text-white/30" />
                <p>Você ainda não tem favoritos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {favorites.map((favorito) => (
                  <div
                    key={favorito.id}
                    onClick={() => setSelectedFavoriteDetail(favorito)}
                    className="group relative overflow-hidden rounded-xl border-2 border-purple-500 bg-white hover:border-purple-400 transition cursor-pointer"
                  >
                    {favorito.imagemUrl && (
                      <div className="relative aspect-square w-full">
                        <Image
                          src={favorito.imagemUrl}
                          alt={favorito.productName || "Look favorito"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                        {/* Marca d'água com logo da loja no canto superior esquerdo */}
                        {lojistaData?.logoUrl && (
                          <div className="absolute top-2 left-2 z-10 opacity-60">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 overflow-hidden rounded-full border border-white/30 bg-white/40">
                              <Image
                                src={lojistaData.logoUrl}
                                alt={lojistaData.nome || "Logo"}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover opacity-80"
                              />
                            </div>
                          </div>
                        )}
                        {/* Botão de transmitir para o display (canto inferior esquerdo) - relativo ao card */}
                        <div 
                          className="absolute bottom-2 left-2 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SendToDisplayButton
                            imageUrl={favorito.imagemUrl}
                            lojistaId={lojistaId}
                            position="bottom-left"
                            size="sm"
                            className="relative"
                          />
                        </div>
                      </div>
                    )}
                    {favorito.productName && (
                      <div className="p-2 bg-purple-900">
                        <h3 className="text-left text-xs font-semibold text-white line-clamp-2 h-8">
                          {favorito.productName}
                        </h3>
                        {favorito.productPrice && (
                          <p className="mt-1 text-left text-sm font-bold text-amber-300">
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

      {/* Modal de Detalhes do Favorito */}
      {selectedFavoriteDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="neon-border w-full max-w-6xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Look</h2>
              <button 
                onClick={() => setSelectedFavoriteDetail(null)} 
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Layout: Desktop (2 colunas) | Mobile (1 coluna) */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Coluna Esquerda: Imagem */}
              <div className="flex-shrink-0 lg:w-1/2">
                {selectedFavoriteDetail.imagemUrl && (
                  <div className="neon-border relative rounded-xl overflow-hidden">
                    <div className="relative w-full rounded-lg overflow-hidden">
                      {selectedFavoriteDetail.imagemUrl ? (
                        <SafeImage
                          src={selectedFavoriteDetail.imagemUrl}
                          alt={selectedFavoriteDetail.productName || "Look favorito"}
                          className="w-full h-auto rounded-lg"
                          containerClassName="w-full"
                          style={{
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            console.error("[ResultadoPage] Erro ao carregar imagem do favorito:", selectedFavoriteDetail.imagemUrl, e)
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-[400px] p-4 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
                        </div>
                      )}
                      {/* Marca d'água com logo da loja no canto superior esquerdo */}
                      {lojistaData?.logoUrl && (
                        <div className="absolute top-4 left-4 z-10 opacity-70">
                          <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-full border-2 border-white/50 bg-white/60 shadow-lg">
                            <Image
                              src={lojistaData.logoUrl}
                              alt={lojistaData.nome || "Logo"}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Botão de transmitir para o display (canto inferior esquerdo) - dentro da imagem */}
                      <div className="absolute bottom-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <SendToDisplayButton
                          imageUrl={selectedFavoriteDetail.imagemUrl}
                          lojistaId={lojistaId}
                          position="bottom-left"
                          size="md"
                          className="relative"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Conteúdo */}
              <div className="flex-1 lg:w-1/2 flex flex-col">
                {/* Botão Comprar Agora - Logo abaixo da foto no mobile, no topo no desktop */}
                <div className="mb-6 w-full">
                  <button
                    onClick={handleCheckout}
                    className="neon-border-blue w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
                    style={{ 
                      background: "linear-gradient(to right, #1e3a8a, #3b82f6, #60a5fa, #3b82f6, #1e3a8a)",
                      animation: "pulse-glow-strong 1.5s ease-in-out infinite"
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" /> Comprar Agora
                  </button>
                </div>

                {/* Produtos Selecionados - Se houver informações de produtos no favorito */}
                {selectedFavoriteDetail.productName && (
                  <div className="neon-border mb-6 rounded-xl border-2 border-white/20 bg-black/30 p-4 w-full">
                    <h3 className="text-lg font-bold text-white mb-3">Produtos Selecionados</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">{selectedFavoriteDetail.productName}</span>
                        {selectedFavoriteDetail.productPrice && (
                          <span className="text-sm font-bold text-yellow-300">{formatPrice(selectedFavoriteDetail.productPrice)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Total do Favorito */}
                    {selectedFavoriteDetail.productPrice && (
                      <div className="pt-3 border-t border-white/10">
                        {(() => {
                          const precoFavorito = selectedFavoriteDetail.productPrice || 0
                          const descontoAplicado = localStorage.getItem(`desconto_aplicado_${lojistaId}`) === 'true'
                          const descontoRedesSociais = lojistaData?.descontoRedesSociais || 0
                          const descontoExpiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                          const descontoValido = descontoAplicado && 
                                                 descontoRedesSociais > 0 && 
                                                 (!descontoExpiraEm || new Date(descontoExpiraEm) >= new Date())
                          
                          if (descontoValido) {
                            const totalComDesconto = precoFavorito * (1 - descontoRedesSociais / 100)
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-white/80">Subtotal:</span>
                                  <span className="text-sm text-white/80 line-through">{formatPrice(precoFavorito)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-green-400">
                                      Desconto de {descontoRedesSociais}% aplicado!
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                  <span className="text-lg font-bold text-white">Total:</span>
                                  <span className="text-xl font-bold text-green-400">{formatPrice(totalComDesconto)}</span>
                                </div>
                              </>
                            )
                          }
                          
                          return (
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-lg font-bold text-white">Total:</span>
                              <span className="text-xl font-bold text-yellow-300">{formatPrice(precoFavorito)}</span>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Informações sobre a Simulação */}
                <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4 w-full">
                  <p className="text-base text-white mb-3">
                    Adoramos te ajudar a escolher! ✨ Esta imagem é uma simulação da nossa Inteligência Artificial para você visualizar o look.
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Importante:</strong> Esta tecnologia serve como referência visual e não substitui a prova física. O ajuste exato, as dimensões e a textura real dos materiais podem apresentar diferenças em relação à simulação digital.
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3 w-full mt-auto">
                  {/* Botão Adicionar ao Carrinho */}
                  <button
                    onClick={handleCheckout}
                    className="neon-border-white w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black text-sm transition shadow-md hover:bg-gray-100"
                  >
                    <ShoppingCart className="h-5 w-5 text-black" /> Adicionar ao Carrinho
                  </button>

                  {/* Botões de Ação Secundários - Todos na mesma linha com mesma largura */}
                  <div className="grid grid-cols-4 gap-2 w-full">
                    <button
                      onClick={async () => {
                        if (!selectedFavoriteDetail?.imagemUrl) {
                          alert("Erro: Imagem do favorito não encontrada.")
                          return
                        }

                        await registerAction("share")

                        const shareUrl = `${window.location.origin}/${lojistaId}`
                        const shareText = `Confira este look incrível da ${lojistaData?.nome || "loja"}! ${shareUrl}`

                        if (navigator.share) {
                          try {
                            const shareData: any = {
                              title: "Experimente AI - Look Favorito",
                              text: shareText,
                              url: shareUrl,
                            }

                            // Tentar incluir a imagem do favorito se possível
                            if (selectedFavoriteDetail.imagemUrl) {
                              try {
                                const response = await fetch(selectedFavoriteDetail.imagemUrl)
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
                      }}
                      className="neon-border-blue flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-blue-700"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      disabled={!hasWhatsApp}
                      className={`neon-border-green flex items-center justify-center rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                        !hasWhatsApp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                      }`}
                      title={hasWhatsApp ? "Abrir WhatsApp da loja" : "WhatsApp não disponível"}
                    >
                      <svg 
                        className="h-5 w-5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedFavoriteDetail?.imagemUrl) {
                          console.error("[ResultadoPage] Imagem do favorito não encontrada para download")
                          return
                        }

                        // Se não houver logo, fazer download direto
                        if (!lojistaData?.logoUrl) {
                          try {
                            const link = document.createElement('a')
                            link.href = selectedFavoriteDetail.imagemUrl
                            link.download = `look-favorito-${selectedFavoriteDetail.id || Date.now()}.jpg`
                            link.target = '_blank'
                            link.rel = 'noopener noreferrer'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            return
                          } catch (error) {
                            console.error("[ResultadoPage] Erro ao baixar imagem do favorito:", error)
                            return
                          }
                        }

                        // Se houver logo, tentar usar backend para processar marca d'água
                        try {
                          console.log("[ResultadoPage] Processando marca d'água do favorito via backend...")
                          
                          const controller = new AbortController()
                          const timeoutId = setTimeout(() => controller.abort(), 3000)
                          
                          try {
                            const response = await fetch('/api/watermark', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                imageUrl: selectedFavoriteDetail.imagemUrl, 
                                logoUrl: lojistaData.logoUrl 
                              }),
                              signal: controller.signal
                            })

                            clearTimeout(timeoutId)

                            if (response.ok) {
                              const data = await response.json()
                              
                              if (data.watermarkedUrl && !data.fallback && data.watermarkedUrl !== selectedFavoriteDetail.imagemUrl) {
                                console.log("[ResultadoPage] ✅ Marca d'água processada pelo backend")
                                const link = document.createElement('a')
                                link.href = data.watermarkedUrl
                                link.download = `look-favorito-${selectedFavoriteDetail.id || Date.now()}.jpg`
                                link.target = '_blank'
                                link.rel = 'noopener noreferrer'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                return
                              }
                            }
                          } catch (fetchError: any) {
                            clearTimeout(timeoutId)
                            if (fetchError.name !== 'AbortError') {
                              console.warn("[ResultadoPage] Erro ao processar marca d'água:", fetchError)
                            }
                          }
                        } catch (error) {
                          console.warn("[ResultadoPage] Erro ao processar marca d'água:", error)
                        }
                        
                        // Fallback: sempre fazer download direto da imagem original
                        try {
                          console.log("[ResultadoPage] Fazendo download direto da imagem do favorito...")
                          const link = document.createElement('a')
                          link.href = selectedFavoriteDetail.imagemUrl
                          link.download = `look-favorito-${selectedFavoriteDetail.id || Date.now()}.jpg`
                          link.target = '_blank'
                          link.rel = 'noopener noreferrer'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        } catch (error) {
                          console.error("[ResultadoPage] Erro ao baixar imagem do favorito:", error)
                        }
                      }}
                      className="neon-border-black flex items-center justify-center rounded-xl bg-black py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-900"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedFavoriteDetail(null)}
                      className="neon-border-gray flex items-center justify-center gap-2 rounded-xl bg-gray-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-700"
                    >
                      <ArrowLeft className="h-5 w-5" /> Voltar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Imagem Gerada */}
      {showImageDetailModal && currentLook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="neon-border w-full max-w-6xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Look</h2>
              <button 
                onClick={() => setShowImageDetailModal(false)} 
                className="text-white/70 hover:text-white transition ml-4"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Layout: Desktop (2 colunas) | Mobile (1 coluna) */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Coluna Esquerda: Imagem */}
              <div className="flex-shrink-0 lg:w-1/2">
                {currentLook.imagemUrl && (
                  <div className="neon-border relative rounded-xl overflow-hidden">
                    <div className="relative w-full rounded-lg overflow-hidden">
                      {currentLook.imagemUrl ? (
                        <SafeImage
                          src={currentLook.imagemUrl}
                          alt={currentLook.titulo || "Look gerado"}
                          className="w-full h-auto rounded-lg"
                          containerClassName="w-full"
                          style={{
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            console.error("[ResultadoPage] Erro ao carregar imagem no modal:", currentLook.imagemUrl, e)
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-[400px] p-4 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">Imagem não disponível</p>
                        </div>
                      )}
                      {/* Marca d'água com logo da loja no canto superior esquerdo */}
                      {lojistaData?.logoUrl && (
                        <div className="absolute top-4 left-4 z-10 opacity-70">
                          <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-full border-2 border-white/50 bg-white/60 shadow-lg">
                            <Image
                              src={lojistaData.logoUrl}
                              alt={lojistaData.nome || "Logo"}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Conteúdo */}
              <div className="flex-1 lg:w-1/2 flex flex-col">
                {/* Botão Comprar Agora - Logo abaixo da foto no mobile, no topo no desktop */}
                <div className="mb-6 w-full">
                  <button
                    onClick={handleCheckout}
                    className="neon-border-blue w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
                    style={{ 
                      background: "linear-gradient(to right, #1e3a8a, #3b82f6, #60a5fa, #3b82f6, #1e3a8a)",
                      animation: "pulse-glow-strong 1.5s ease-in-out infinite"
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" /> Comprar Agora
                  </button>
                </div>

                {/* Produtos Selecionados */}
                {selectedProducts.length > 0 && (
                  <div className="neon-border mb-6 rounded-xl border-2 border-white/20 bg-black/30 p-4 w-full">
                    <h3 className="text-lg font-bold text-white mb-3">Produtos Selecionados</h3>
                    <div className="space-y-2 mb-4">
                      {selectedProducts.map((produto: any, index: number) => (
                        <div key={produto.id || index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                          <span className="text-sm text-white">{produto.nome}</span>
                          {produto.preco && (
                            <span className="text-sm font-bold text-yellow-300">{formatPrice(produto.preco)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Total dos Produtos */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex flex-col gap-2">
                        {calcularTotalProdutos.temDesconto ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">Subtotal:</span>
                              <span className="text-sm text-white/80 line-through">{formatPrice(calcularTotalProdutos.total)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-green-400">
                                  Desconto de {calcularTotalProdutos.percentualDesconto}% aplicado!
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                              <span className="text-lg font-bold text-white">Total:</span>
                              <span className="text-xl font-bold text-green-400">{formatPrice(calcularTotalProdutos.totalComDesconto)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-lg font-bold text-white">Total:</span>
                            <span className="text-xl font-bold text-yellow-300">{formatPrice(calcularTotalProdutos.total)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações sobre a Simulação */}
                <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4 w-full">
                  <p className="text-base text-white mb-3">
                    Adoramos te ajudar a escolher! ✨ Esta imagem é uma simulação da nossa Inteligência Artificial para você visualizar o look.
                  </p>
                  <p className="text-sm text-white/80">
                    <strong>Importante:</strong> Esta tecnologia serve como referência visual e não substitui a prova física. O ajuste exato, as dimensões e a textura real dos materiais podem apresentar diferenças em relação à simulação digital.
                  </p>
                </div>

                {/* Botões */}
                <div className="space-y-3 w-full mt-auto">

              {/* Botões de Ação */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={handleShare}
                  className="neon-border-blue flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-blue-700"
                >
                  <Share2 className="h-6 w-6" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  disabled={!hasWhatsApp}
                  className={`neon-border-green flex items-center justify-center rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                    !hasWhatsApp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                  }`}
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowImageDetailModal(false)
                    setShowFavoritesModal(true)
                  }}
                  className="neon-border-pink flex items-center justify-center rounded-xl bg-pink-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-pink-700"
                >
                  <Heart className="h-6 w-6" />
                </button>
                <button
                  onClick={handleDownload}
                  className="neon-border-black flex items-center justify-center rounded-xl bg-black py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-900"
                >
                  <Download className="h-6 w-6 text-white" />
                </button>
              </div>

                  {/* Botão Voltar */}
                  <button
                    onClick={() => setShowImageDetailModal(false)}
                    className="neon-border-gray w-full flex items-center justify-center gap-2 rounded-xl bg-gray-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" /> Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <DislikeFeedbackModal
        open={isDislikeModalOpen}
        isSubmitting={loadingAction === "dislike"}
        onSelect={(reason) => submitDislike(reason)}
        onSkip={() => submitDislike()}
      />
      <ShoppingCartModal
        open={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        items={cartItems}
        lojistaId={lojistaId}
        salesConfig={lojistaData?.salesConfig ? normalizeSalesConfig(lojistaData.salesConfig) : undefined}
      />
    </div>
  )
}