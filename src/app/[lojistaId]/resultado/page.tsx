"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, ShoppingCart, Heart, RefreshCw, Home, Instagram, Facebook, Music2, MessageCircle, X, Sparkles, ArrowLeftCircle, Check, Download } from "lucide-react"
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
  const [isRemixing, setIsRemixing] = useState(false)
  const [remixPhraseIndex, setRemixPhraseIndex] = useState(0)
  const [selectedFavoriteDetail, setSelectedFavoriteDetail] = useState<any | null>(null)
  const [showImageDetailModal, setShowImageDetailModal] = useState(false)

  // Frases para remixar (preparando surpresa)
  const remixPhrases = [
    "🎁 Preparando uma surpresa especial...",
    "✨ Criando uma nova versão incrível...",
    "🎨 Aplicando transformações mágicas...",
    "💫 Gerando algo único para você...",
    "🌟 Quase pronto, aguarde...",
    "🎯 Finalizando os últimos detalhes...",
  ]

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
          
          // Verificar se uma nova imagem foi gerada
          const newLooksGenerated = sessionStorage.getItem(`new_looks_generated_${lojistaId}`)
          if (newLooksGenerated === "true") {
            // Nova imagem gerada - sempre mostrar botões de like/dislike
            setHasVoted(false)
            setVotedType(null)
            // Remover flag
            sessionStorage.removeItem(`new_looks_generated_${lojistaId}`)
          } else {
            // Verificar se já foi votado no primeiro look (apenas se não for nova imagem)
            if (parsedLooks.length > 0 && parsedLooks[0].compositionId) {
              const voteStatus = await checkVoteStatus(parsedLooks[0].compositionId)
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
        const currentLook = looks[currentLookIndex]
        let compositionId = currentLook.compositionId
        
        // Se não houver compositionId (look refinado), criar um ID único baseado na imagemUrl
        if (!compositionId && currentLook.imagemUrl) {
          const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
          compositionId = `refined-${imageHash}`
        }
        
        // Verificar status de voto
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[ResultadoPage] Erro ao registrar like:", errorData)
        alert(errorData.error || "Erro ao salvar like. Tente novamente.")
      }
    } catch (error) {
      console.error("[ResultadoPage] Erro ao registrar like:", error)
      alert("Erro ao salvar like. Tente novamente.")
    } finally {
      setLoadingAction(null)
    }
  }, [hasVoted, currentLookIndex, looks, lojistaId, loadFavorites])

  // Handle dislike
  const handleDislike = useCallback(async () => {
    if (hasVoted) return

    const currentLook = looks[currentLookIndex]
    if (!currentLook) return

    // Para looks refinados sem compositionId, usar um ID único baseado na imagemUrl
    let compositionId = currentLook.compositionId
    if (!compositionId && currentLook.imagemUrl) {
      const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
      compositionId = `refined-${imageHash}`
    }

    const success = await registerAction("dislike")
    if (success) {
      setHasVoted(true)
      setVotedType("dislike")
    }
  }, [hasVoted, currentLookIndex, looks, lojistaId, registerAction])

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
  }, [lojistaData, registerAction])

  // Handle WhatsApp
  const handleWhatsApp = useCallback(() => {
    const whatsappLink = lojistaData?.redesSociais?.whatsapp || lojistaData?.salesConfig?.whatsappLink
    if (whatsappLink) {
      // Se não começar com http, adicionar https://wa.me/
      const url = whatsappLink.startsWith('http') 
        ? whatsappLink 
        : `https://wa.me/${whatsappLink.replace(/\D/g, '')}`
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }, [lojistaData])

  // Verificar se WhatsApp está disponível
  const hasWhatsApp = !!(lojistaData?.redesSociais?.whatsapp || lojistaData?.salesConfig?.whatsappLink)

  // Handle download
  const handleDownload = useCallback(async () => {
    const currentLook = looks[currentLookIndex]
    if (!currentLook?.imagemUrl) return

    try {
      const response = await fetch(currentLook.imagemUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `look-${currentLook.id || Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[ResultadoPage] Erro ao baixar imagem:", error)
      alert("Erro ao baixar imagem. Tente novamente.")
    }
  }, [currentLookIndex, looks])

  // Gerar novo look (remixar) com as mesmas foto e produtos
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

      // Se veio de favoritos, usar a imagem atual que está sendo exibida
      let personImageUrl: string
      if (fromFavoritos && currentLook && currentLook.imagemUrl) {
        personImageUrl = currentLook.imagemUrl
      } else {
        // Buscar dados anteriores do sessionStorage
        const storedPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
        if (!storedPhoto) {
          // Se não houver dados salvos, redirecionar para experimentar
          router.push(`/${lojistaId}/experimentar`)
          return
        }
        personImageUrl = storedPhoto
      }

      const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
      if (!storedProducts) {
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

      if (!personImageUrl) {
        throw new Error("Foto não encontrada")
      }

      // Adicionar prompts para mudar cenário e pose quando remixar
      const scenePrompts = [
        "Change the background scene to a completely different location and environment",
        "Change the person's pose to a different position and angle",
        "Apply creative variations to the scene and pose"
      ]

      const payload = {
        personImageUrl,
        productIds,
        lojistaId,
        customerId: clienteId,
        scenePrompts,
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
        // Usar apenas a mensagem amigável do backend (já trata erro 429)
        const errorMessage = responseData.error || "Erro ao gerar novo look"
        throw new Error(errorMessage)
      }

      // Salvar novos resultados
      if (responseData.looks && Array.isArray(responseData.looks) && responseData.looks.length > 0) {
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify(responseData.looks))
        // Manter foto e produtos salvos
        sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
        sessionStorage.setItem(`products_${lojistaId}`, storedProducts)
        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        // Resetar votação para o novo look
        setHasVoted(false)
        setVotedType(null)
        setCurrentLookIndex(0)
        
        // Atualizar favoritos antes de recarregar (caso tenha dado like anteriormente)
        await loadFavorites()
        
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
      alert(error.message || "Erro ao remixar look. Tente novamente.")
    } finally {
      setLoadingAction(null)
      setIsRemixing(false)
      if (phraseInterval) {
        clearInterval(phraseInterval)
      }
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
      {/* Overlay com blur quando remixando */}
      {isRemixing && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-opacity" />
      )}
      
      {/* Vídeo de Fundo Fixo */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          src="/video2tela2.mp4"
          loop
          muted
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/video2tela2.mp4" type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 min-h-screen flex flex-col p-4 items-center justify-center space-y-3">
        
        {/* Caixa com Logo e Nome da Loja */}
        <div className="w-full max-w-sm">
          <div
            className="rounded-xl border-2 border-white/30 backdrop-blur-md px-3 sm:px-4 py-2 shadow-xl flex items-center justify-center gap-2 sm:gap-3 relative"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.5), rgba(147,51,234,0.5), rgba(59,130,246,0.5), rgba(147,51,234,0.5), rgba(0,0,0,0.5))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <button
              onClick={() => router.push(`/${params.lojistaId}/experimentar`)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-white hover:opacity-80 transition"
            >
              <ArrowLeftCircle className="h-6 w-6" />
            </button>

            {lojistaData?.logoUrl && (
              <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
                <Image
                  src={lojistaData.logoUrl}
                  alt={lojistaData.nome || "Logo"}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
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
          className="relative w-full max-w-sm space-y-4 rounded-2xl border-2 border-white/30 backdrop-blur p-4 shadow-2xl"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
          }}
        >
            <div className="absolute top-4 right-4 z-10">
                <span 
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border-2 border-white/50 text-white"
                  style={{
                    background:
                      "linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))",
                  }}
                >
                    <Sparkles className="h-4 w-4 text-white" style={{ filter: "drop-shadow(0 0 2px white)"}} />
                    Look Criativo IA
                </span>
            </div>
            {/* Imagem Gerada */}
            <div className="w-full rounded-xl overflow-hidden">
              <div className="relative rounded-2xl border-2 border-white/50 p-2 shadow-lg bg-white/10 inline-block w-full">
                <div 
                  className="relative border-2 border-dashed border-white/30 rounded-xl p-1 inline-block w-full cursor-pointer"
                  onClick={() => setShowImageDetailModal(true)}
                >
                    <img
                      src={currentLook.imagemUrl}
                      alt={currentLook.titulo}
                      className="h-auto w-full object-cover rounded-lg"
                    />
                    {/* Marca d'água com logo da loja no canto superior esquerdo */}
                    {lojistaData?.logoUrl && (
                      <div className="absolute top-2 left-2 z-10 opacity-60">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-white/30 bg-white/40 p-0.5">
                          <Image
                            src={lojistaData.logoUrl}
                            alt={lojistaData.nome || "Logo"}
                            width={40}
                            height={40}
                            className="h-full w-full object-contain opacity-80"
                          />
                        </div>
                      </div>
                    )}
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
                        onClick={handleDislike} 
                        disabled={isRemixing}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-2 text-white font-semibold shadow-lg transition ${
                          isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                        }`}
                    >
                        <ThumbsDown className="h-5 w-5" /> Não
                    </button>
                    <button 
                        onClick={handleLike} 
                        disabled={isRemixing}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-2 text-white font-semibold shadow-lg transition ${
                          isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                        }`}
                    >
                        <ThumbsUp className="h-5 w-5" /> Sim
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
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base transition relative overflow-hidden ${
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
                            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2 font-semibold text-gray-800 text-sm transition shadow-md ${
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
                            className={`flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                            }`}
                        >
                            <Share2 className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={handleWhatsApp} 
                            disabled={isRemixing || !hasWhatsApp}
                            className={`flex items-center justify-center rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md ${
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
                            onClick={() => setShowFavoritesModal(true)} 
                            disabled={isRemixing}
                            className={`flex items-center justify-center rounded-xl bg-pink-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700'
                            }`}
                        >
                            <Heart className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={handleDownload} 
                            disabled={isRemixing}
                            className={`flex items-center justify-center rounded-xl bg-purple-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                              isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                            }`}
                        >
                            <Download className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Card 3: Ações de Navegação e Geração */}
                    <div className="space-y-2 rounded-2xl border border-white/30 backdrop-blur p-3 shadow-2xl" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}>
                      <button 
                          onClick={handleAddAccessory} 
                          disabled={isRemixing}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                            isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                          }`}
                      >
                          <Sparkles className="h-4 w-4" /> Adicionar Acessório
                      </button>
                      <button 
                        onClick={handleRegenerate} 
                        disabled={loadingAction === "remix" || isRemixing} 
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition shadow-md ${
                          isRemixing 
                            ? 'bg-green-700' 
                            : 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                        }`}
                        style={isRemixing ? {
                          border: '4px solid white',
                          borderWidth: '4px',
                        } : {}}
                      >
                        {isRemixing ? (
                          <div className="flex items-center justify-center gap-2 w-full overflow-hidden">
                            <div className="flex-shrink-0">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            </div>
                            <div className="flex-1 overflow-hidden text-center">
                              <div 
                                key={remixPhraseIndex}
                                className="animate-slide-in text-white font-semibold whitespace-nowrap text-center"
                              >
                                {remixPhrases[remixPhraseIndex] || remixPhrases[0]}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <RefreshCw className={`h-4 w-4 ${loadingAction === "remix" ? "animate-spin" : ""}`} /> 
                            {loadingAction === "remix" ? "Gerando..." : "Remixar Look"}
                          </>
                        )}
                      </button>
                      <button 
                          onClick={handleGoHome} 
                          disabled={isRemixing}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                            isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'
                          }`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
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
                    onClick={() => setSelectedFavoriteDetail(favorito)}
                    className="group relative overflow-hidden rounded-lg neo-card transition hover:shadow-glass cursor-pointer"
                  >
                    {favorito.imagemUrl && (
                      <div className="relative aspect-square w-full">
                        <Image
                          src={favorito.imagemUrl}
                          alt={favorito.productName || "Look favorito"}
                          fill
                          className="object-cover"
                        />
                        {/* Marca d'água com logo da loja no canto superior esquerdo */}
                        {lojistaData?.logoUrl && (
                          <div className="absolute top-2 left-2 z-10 opacity-60">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 overflow-hidden rounded-full border border-white/30 bg-white/40 p-0.5">
                              <Image
                                src={lojistaData.logoUrl}
                                alt={lojistaData.nome || "Logo"}
                                width={32}
                                height={32}
                                className="h-full w-full object-contain opacity-80"
                              />
                            </div>
                          </div>
                        )}
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

      {/* Modal de Detalhes do Favorito */}
      {selectedFavoriteDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Look</h2>
              <button 
                onClick={() => setSelectedFavoriteDetail(null)} 
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Imagem do Favorito */}
            {selectedFavoriteDetail.imagemUrl && (
              <div className="relative mb-6 rounded-xl overflow-hidden">
                <div className="relative aspect-[3/4] w-full">
                  <Image 
                    src={selectedFavoriteDetail.imagemUrl} 
                    alt={selectedFavoriteDetail.productName || "Look favorito"} 
                    fill 
                    className="object-contain bg-black/20" 
                  />
                  {/* Marca d'água com logo da loja no canto superior esquerdo */}
                  {lojistaData?.logoUrl && (
                    <div className="absolute top-4 left-4 z-10 opacity-60">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-white/30 bg-white/40 p-0.5">
                        <Image
                          src={lojistaData.logoUrl}
                          alt={lojistaData.nome || "Logo"}
                          width={56}
                          height={56}
                          className="h-full w-full object-contain opacity-80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações do Produto */}
            {selectedFavoriteDetail.productName && (
              <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4">
                <h3 className="text-xl font-bold text-white mb-2">{selectedFavoriteDetail.productName}</h3>
                {selectedFavoriteDetail.productPrice && (
                  <p className="text-2xl font-bold text-yellow-300">{formatPrice(selectedFavoriteDetail.productPrice)}</p>
                )}
                {selectedFavoriteDetail.descricao && (
                  <p className="mt-2 text-sm text-white/80">{selectedFavoriteDetail.descricao}</p>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="space-y-3">
              {/* Botão Comprar Agora */}
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
                style={{ 
                  background: "linear-gradient(to right, #1e3a8a, #3b82f6, #60a5fa, #3b82f6, #1e3a8a)",
                  animation: "pulse-glow-strong 1.5s ease-in-out infinite"
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Comprar Agora
              </button>

              {/* Botões Selecionar e Voltar */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const favoritoLook: GeneratedLook = {
                      id: selectedFavoriteDetail.id || `favorito-${Date.now()}`,
                      imagemUrl: selectedFavoriteDetail.imagemUrl,
                      titulo: selectedFavoriteDetail.productName || "Look favorito",
                      produtoNome: selectedFavoriteDetail.productName || "",
                      produtoPreco: selectedFavoriteDetail.productPrice || null,
                      compositionId: selectedFavoriteDetail.compositionId || null,
                      jobId: selectedFavoriteDetail.jobId || null,
                    }
                    sessionStorage.setItem(`favorito_${lojistaId}`, JSON.stringify(favoritoLook))
                    sessionStorage.setItem(`from_favoritos_${lojistaId}`, "true")
                    setSelectedFavoriteDetail(null)
                    setShowFavoritesModal(false)
                    window.location.href = `/${lojistaId}/resultado?from=favoritos`
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-green-700"
                >
                  <Check className="h-5 w-5" /> Selecionar
                </button>
                <button
                  onClick={() => setSelectedFavoriteDetail(null)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Imagem Gerada */}
      {showImageDetailModal && currentLook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Look</h2>
              <button 
                onClick={() => setShowImageDetailModal(false)} 
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Imagem do Look */}
            {currentLook.imagemUrl && (
              <div className="relative mb-6 rounded-xl overflow-hidden">
                <div className="relative aspect-[3/4] w-full">
                  <Image 
                    src={currentLook.imagemUrl} 
                    alt={currentLook.titulo || "Look gerado"} 
                    fill 
                    className="object-contain bg-black/20" 
                  />
                  {/* Marca d'água com logo da loja no canto superior esquerdo */}
                  {lojistaData?.logoUrl && (
                    <div className="absolute top-4 left-4 z-10 opacity-60">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-white/30 bg-white/40 p-0.5">
                        <Image
                          src={lojistaData.logoUrl}
                          alt={lojistaData.nome || "Logo"}
                          width={56}
                          height={56}
                          className="h-full w-full object-contain opacity-80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informações do Produto */}
            {currentLook.produtoNome && (
              <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4">
                <h3 className="text-xl font-bold text-white mb-2">{currentLook.produtoNome}</h3>
                {currentLook.produtoPreco && (
                  <p className="text-2xl font-bold text-yellow-300">{formatPrice(currentLook.produtoPreco)}</p>
                )}
                {currentLook.descricao && (
                  <p className="mt-2 text-sm text-white/80">{currentLook.descricao}</p>
                )}
              </div>
            )}

            {/* Produtos Selecionados */}
            {selectedProducts.length > 0 && (
              <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4">
                <h3 className="text-lg font-bold text-white mb-3">Produtos Selecionados</h3>
                <div className="space-y-2">
                  {selectedProducts.map((produto: any, index: number) => (
                    <div key={produto.id || index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-sm text-white">{produto.nome}</span>
                      {produto.preco && (
                        <span className="text-sm font-bold text-yellow-300">{formatPrice(produto.preco)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="space-y-3">
              {/* Botão Comprar Agora */}
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
                style={{ 
                  background: "linear-gradient(to right, #1e3a8a, #3b82f6, #60a5fa, #3b82f6, #1e3a8a)",
                  animation: "pulse-glow-strong 1.5s ease-in-out infinite"
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Comprar Agora
              </button>

              {/* Botões de Ação */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-blue-700"
                >
                  <Share2 className="h-6 w-6" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  disabled={!hasWhatsApp}
                  className={`flex items-center justify-center rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md ${
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
                  className="flex items-center justify-center rounded-xl bg-pink-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-pink-700"
                >
                  <Heart className="h-6 w-6" />
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center rounded-xl bg-purple-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-purple-700"
                >
                  <Download className="h-6 w-6" />
                </button>
              </div>

              {/* Botão Voltar */}
              <button
                onClick={() => setShowImageDetailModal(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" /> Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

