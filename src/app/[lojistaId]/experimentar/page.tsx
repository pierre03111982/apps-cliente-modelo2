"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, Camera, Wand2, Heart, X, Check, Filter, ThumbsUp, Instagram, Facebook, Music2, Share2 } from "lucide-react"
import { fetchLojistaData, fetchProdutos } from "@/lib/firebaseQueries"
import type { Produto, LojistaData, SalesConfig, SocialLinks, GeneratedLook } from "@/lib/types"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants"

// Resolver backend URL
const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    return params.get("backend") || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL || "http://localhost:3000"
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_PAINELADM_URL || "http://localhost:3000"
}

export default function ExperimentarPage() {
  const params = useParams()
  const router = useRouter()
  const lojistaId = params?.lojistaId as string

  const [lojistaData, setLojistaData] = useState<LojistaData | null>(null)
  const [catalog, setCatalog] = useState<Produto[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [userPhoto, setUserPhoto] = useState<File | null>(null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Produto[]>([])
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const [descontoAplicado, setDescontoAplicado] = useState(false)
  const [isRefineMode, setIsRefineMode] = useState(false)
  const [refineBaseImageUrl, setRefineBaseImageUrl] = useState<string | null>(null)
  const [refineCompositionId, setRefineCompositionId] = useState<string | null>(null)

  // Carregar dados da loja e produtos
  useEffect(() => {
    if (!lojistaId) return

    const loadData = async () => {
      try {
        setIsLoadingCatalog(true)
        
        // Tentar buscar do backend primeiro
        const backendUrl = getBackendUrl()
        let lojistaDb: LojistaData | null = null
        let produtosDb: Produto[] = []

        try {
          // Buscar dados da loja via API
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
          
          // Buscar produtos via API
          const produtosResponse = await fetch(`/api/lojista/products?lojistaId=${encodeURIComponent(lojistaId)}`)
          if (produtosResponse.ok) {
            const produtosData = await produtosResponse.json()
            if (Array.isArray(produtosData)) {
              produtosDb = produtosData
            } else if (Array.isArray(produtosData.produtos)) {
              produtosDb = produtosData.produtos
            }
          }
        } catch (apiError) {
          console.warn("[ExperimentarPage] Erro ao buscar via API, tentando Firebase:", apiError)
        }

        // Se não encontrou via API, tentar Firebase
        if (!lojistaDb) {
          lojistaDb = await fetchLojistaData(lojistaId).catch(() => null)
        }
        if (produtosDb.length === 0) {
          produtosDb = await fetchProdutos(lojistaId).catch(() => [])
        }

        if (lojistaDb) setLojistaData(lojistaDb)
        if (produtosDb.length > 0) {
          setCatalog(produtosDb.sort((a, b) => {
            const catA = (a.categoria || "").toLowerCase()
            const catB = (b.categoria || "").toLowerCase()
            if (catA !== catB) return catA.localeCompare(catB, "pt-BR")
            return (a.nome || "").toLowerCase().localeCompare((b.nome || "").toLowerCase(), "pt-BR")
          }))
        }
      } catch (error) {
        console.error("[ExperimentarPage] Erro ao carregar dados:", error)
      } finally {
        setIsLoadingCatalog(false)
      }
    }

    loadData()

    // Verificar se o desconto já foi aplicado anteriormente
    const descontoSalvo = localStorage.getItem(`desconto_aplicado_${lojistaId}`)
    if (descontoSalvo === 'true') {
      setDescontoAplicado(true)
    }
  }, [lojistaId])

  // Verificar se cliente está logado e carregar foto do sessionStorage
  useEffect(() => {
    if (!lojistaId) return

    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    if (!stored) {
      router.push(`/${lojistaId}/login`)
      return
    }

    // Verificar se está em modo de refinamento
    const refineMode = sessionStorage.getItem(`refine_mode_${lojistaId}`)
    const baseImageUrl = sessionStorage.getItem(`refine_baseImage_${lojistaId}`)
    const compositionId = sessionStorage.getItem(`refine_compositionId_${lojistaId}`)

    if (refineMode === "true" && baseImageUrl) {
      setIsRefineMode(true)
      setRefineBaseImageUrl(baseImageUrl)
      if (compositionId) {
        setRefineCompositionId(compositionId)
      }
      // Em modo refinamento, mostrar a imagem base ao invés de permitir upload
      setUserPhotoUrl(baseImageUrl)
    } else {
      // Carregar foto do sessionStorage quando volta da Tela 3 (modo normal)
      const savedPhotoUrl = sessionStorage.getItem(`photo_${lojistaId}`)
      if (savedPhotoUrl && !userPhotoUrl) {
        setUserPhotoUrl(savedPhotoUrl)
      }

      // Limpar produtos selecionados quando volta da Tela 3
      // Os produtos precisam ser selecionados novamente
      sessionStorage.removeItem(`products_${lojistaId}`)
      setSelectedProducts([])
    }
  }, [lojistaId, router, userPhotoUrl])

  // Carregar favoritos
  const loadFavorites = async () => {
    if (!lojistaId) return

    try {
      setIsLoadingFavorites(true)
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (!stored) return

      const clienteData = JSON.parse(stored)
      const clienteId = clienteData.clienteId

      if (!clienteId) return

      const response = await fetch(
        `/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}`
      )

      if (response.ok) {
        const data = await response.json()
        const favoritesList = data.favorites || data.favoritos || []
        // Filtrar apenas os likes (action === "like" ou tipo === "like")
        const likesOnly = favoritesList.filter((f: any) => {
          const hasImage = f.imagemUrl
          const isLike = f.action === "like" || f.tipo === "like" || f.votedType === "like"
          // Se não tiver campo de ação, assumir que é like (compatibilidade com dados antigos)
          return hasImage && (isLike || (!f.action && !f.tipo && !f.votedType))
        })
        // Ordenar por data de criação (mais recente primeiro)
        const sortedFavorites = likesOnly.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
          return dateB.getTime() - dateA.getTime()
        })
        setFavorites(sortedFavorites.slice(0, 10)) // Últimos 10 likes
      }
    } catch (error) {
      console.error("[ExperimentarPage] Erro ao carregar favoritos:", error)
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  // Categorias disponíveis
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    catalog.forEach((produto) => {
      if (produto.categoria) {
        uniqueCategories.add(produto.categoria)
      }
    })
    return ["Todos", ...Array.from(uniqueCategories).sort()]
  }, [catalog])

  // Produtos filtrados por categoria
  const filteredCatalog = useMemo(() => {
    let filtered = activeCategory === "Todos"
      ? catalog
      : catalog.filter((item) => item.categoria === activeCategory)

    return [...filtered].sort((a, b) => {
      const categoriaA = (a.categoria || "").toLowerCase()
      const categoriaB = (b.categoria || "").toLowerCase()
      if (categoriaA !== categoriaB) {
        return categoriaA.localeCompare(categoriaB, "pt-BR")
      }
      const nomeA = (a.nome || "").toLowerCase()
      const nomeB = (b.nome || "").toLowerCase()
      return nomeA.localeCompare(nomeB, "pt-BR")
    })
  }, [catalog, activeCategory])

  // Upload de foto
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0]
      setUserPhoto(file)
      setUserPhotoUrl(URL.createObjectURL(file))
    }
  }

  // Remover foto
  const handleRemovePhoto = () => {
    setUserPhoto(null)
    setUserPhotoUrl(null)
    sessionStorage.removeItem(`photo_${lojistaId}`)
    if (document.getElementById("photo-upload") as HTMLInputElement) {
      (document.getElementById("photo-upload") as HTMLInputElement).value = ""
    }
  }

  // Trocar foto - permite selecionar nova foto mesmo quando já existe uma
  const handleChangePhoto = () => {
    const input = document.getElementById("photo-upload") as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  // Categorias permitidas em modo refinamento (apenas acessórios leves)
  const REFINEMENT_ALLOWED_CATEGORIES = [
    "joias", "jóias", "acessórios", "acessorios", "óculos", "oculos", 
    "relógios", "relogios", "cosméticos", "cosmeticos", "tintura", "perfumes"
  ]

  // Verificar se uma categoria é permitida em modo refinamento
  const isCategoryAllowedForRefinement = (categoria: string | null | undefined): boolean => {
    if (!categoria) return false
    const categoriaLower = categoria.toLowerCase()
    return REFINEMENT_ALLOWED_CATEGORIES.some(allowed => categoriaLower.includes(allowed))
  }

  // Toggle seleção de produto - permite até 2 produtos de categorias diferentes
  const toggleProductSelection = (produto: Produto) => {
    // Em modo refinamento, só permitir categorias leves
    if (isRefineMode && !isCategoryAllowedForRefinement(produto.categoria)) {
      setCategoryWarning(
        "Em modo de refinamento, você só pode adicionar acessórios leves (Jóias, Óculos, Cosméticos, Tintura, etc.). Roupas e Calçados não são permitidos."
      )
      setTimeout(() => setCategoryWarning(null), 5000)
      return
    }

    const isAlreadySelected = selectedProducts.some((p) => p.id === produto.id)

    if (isAlreadySelected) {
      setSelectedProducts((prev) => {
        const updated = prev.filter((p) => p.id !== produto.id)
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(updated))
        return updated
      })
      setCategoryWarning(null)
      return
    }

    // Verificar se já existe produto da mesma categoria
    const existingProductInCategory = selectedProducts.find(
      (p) => p.categoria === produto.categoria && p.categoria
    )

    if (existingProductInCategory) {
      setCategoryWarning(
        `Você já selecionou um produto da categoria "${produto.categoria}". Selecione produtos de categorias diferentes.`
      )
      setTimeout(() => setCategoryWarning(null), 5000)
      return
    }

    // Verificar se já tem 2 produtos selecionados
    if (selectedProducts.length >= 2) {
      setCategoryWarning(
        "Você pode selecionar até 2 produtos de categorias diferentes. Remova um produto antes de selecionar outro."
      )
      setTimeout(() => setCategoryWarning(null), 5000)
      return
    }

    const updated = [...selectedProducts, produto]
    setSelectedProducts(updated)
    sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(updated))
    setCategoryWarning(null)
  }

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Upload de foto para o backend (usar proxy interno)
  const uploadPersonPhoto = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("photo", file)
    formData.append("lojistaId", lojistaId)

    const response = await fetch("/api/upload-photo", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Erro ao fazer upload: ${response.status}`)
    }

    const data = await response.json()
    return data.imageUrl
  }

  // Refinar look (adicionar acessórios)
  const handleRefine = async () => {
    if (!refineBaseImageUrl || selectedProducts.length === 0) {
      alert("Selecione pelo menos um acessório para adicionar ao look")
      return
    }

    if (selectedProducts.length > 2) {
      alert("Você pode selecionar no máximo 2 acessórios")
      return
    }

    try {
      setIsGenerating(true)
      setGenerationError(null)

      // Buscar clienteId do localStorage
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null

      // Preparar URLs dos produtos novos
      const newProductUrls = selectedProducts
        .map((p) => p.imagemUrl)
        .filter(Boolean) as string[]

      if (newProductUrls.length === 0) {
        throw new Error("Nenhuma imagem de produto válida encontrada")
      }

      // Chamar API de refinamento
      const response = await fetch("/api/refine-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseImageUrl: refineBaseImageUrl,
          newProductUrls,
          lojistaId,
          customerId: clienteId,
          compositionId: refineCompositionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ao refinar look: ${response.status}`)
      }

      const responseData = await response.json()

      if (responseData.refinedImageUrl) {
        // Criar um novo look com a imagem refinada
        const refinedLook: GeneratedLook = {
          id: `refined-${Date.now()}`,
          titulo: "Look Refinado",
          imagemUrl: responseData.refinedImageUrl,
          produtoNome: selectedProducts.map(p => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: refineCompositionId || null,
        }

        // Salvar o look refinado
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([refinedLook]))
        sessionStorage.setItem(`photo_${lojistaId}`, refineBaseImageUrl)
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))

        // Limpar modo de refinamento
        sessionStorage.removeItem(`refine_mode_${lojistaId}`)
        sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
        sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)

        // Navegar para resultado
        router.push(`/${lojistaId}/resultado`)
      } else {
        throw new Error("Imagem refinada não foi retornada")
      }
    } catch (error: any) {
      console.error("[handleRefine] Erro:", error)
      setGenerationError(error.message || "Erro ao refinar look. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Gerar looks
  const handleVisualize = async () => {
    // Se estiver em modo refinamento, usar handleRefine
    if (isRefineMode) {
      await handleRefine()
      return
    }

    if ((!userPhoto && !userPhotoUrl) || selectedProducts.length === 0) return

    try {
      setIsGenerating(true)
      setGenerationError(null)

      // 1. Upload da foto (se tiver File, fazer upload; se não, usar URL salva)
      let personImageUrl: string
      if (userPhoto) {
        personImageUrl = await uploadPersonPhoto(userPhoto)
      } else if (userPhotoUrl) {
        // Se não tiver File mas tiver URL, usar a URL diretamente
        personImageUrl = userPhotoUrl
      } else {
        throw new Error("Foto não encontrada")
      }
      console.log("[handleVisualize] ✅ Foto enviada:", personImageUrl?.substring(0, 50) + "...")

      // 2. Preparar dados para geração
      const productIds = selectedProducts.map((p) => p.id).filter(Boolean)
      if (productIds.length === 0) {
        throw new Error("Nenhum produto válido selecionado")
      }

      // Buscar clienteId do localStorage
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null

      const payload = {
        personImageUrl,
        productIds,
        lojistaId,
        customerId: clienteId,
        scenePrompts: [],
        options: { quality: "high", skipWatermark: true },
      }

      // 3. Gerar looks (usar proxy interno)
      const response = await fetch("/api/generate-looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Usar mensagem amigável do backend se disponível, senão usar mensagem genérica
        const errorMessage = errorData.error || `Erro ao gerar composição (${response.status})`
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // 4. Salvar resultados e navegar
      if (responseData.looks && Array.isArray(responseData.looks) && responseData.looks.length > 0) {
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify(responseData.looks))
        // Salvar a URL da foto que foi enviada ao backend (personImageUrl)
        sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl || userPhotoUrl || "")
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
        router.push(`/${lojistaId}/resultado`)
      } else {
        throw new Error("Nenhum look foi gerado")
      }
    } catch (error: any) {
      console.error("[handleVisualize] Erro:", error)
      setGenerationError(error.message || "Erro ao gerar looks. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatPrice = (value?: number | null) =>
    typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar preço"

  const aplicarDesconto = () => {
    if (!descontoAplicado) {
      setDescontoAplicado(true)
      // Salvar no localStorage para persistir entre recarregamentos
      localStorage.setItem(`desconto_aplicado_${lojistaId}`, 'true')
    }
  }

  const handleShareApp = async () => {
    aplicarDesconto()

    const appLink = `${window.location.origin}/${lojistaId}`
    const shareText = lojistaData?.nome 
      ? `Confira os looks incríveis da ${lojistaData.nome}! ${appLink}`
      : `Confira os looks incríveis! ${appLink}`

    if (navigator.share) {
      try {
        const shareData: any = {
          title: lojistaData?.nome || "Experimente AI",
          text: shareText,
          url: appLink,
        }

        // Tentar incluir a imagem da loja se disponível
        if (lojistaData?.logoUrl) {
          try {
            const response = await fetch(lojistaData.logoUrl)
            const blob = await response.blob()
            const file = new File([blob], "logo.jpg", { type: blob.type })
            shareData.files = [file]
          } catch (error) {
            console.warn("Não foi possível incluir logo no compartilhamento:", error)
          }
        }

        await navigator.share(shareData)
      } catch (error: any) {
        if (error.name !== "AbortError") {
          // Usuário cancelou ou erro ao compartilhar
          console.log("Compartilhamento cancelado ou erro:", error)
          // Fallback: copiar para área de transferência
          try {
            await navigator.clipboard.writeText(appLink)
            alert("Link copiado para a área de transferência!")
          } catch (clipboardError) {
            console.error("Erro ao copiar link:", clipboardError)
            alert(`Link do aplicativo: ${appLink}`)
          }
        }
      }
    } else {
      // Fallback: copiar para área de transferência
      try {
        await navigator.clipboard.writeText(appLink)
        alert("Link copiado para a área de transferência!")
      } catch (error) {
        console.error("Erro ao copiar link:", error)
        alert(`Link do aplicativo: ${appLink}`)
      }
    }
  }

  const handleSocialClick = (url: string) => {
    aplicarDesconto()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-dark-bg">
      {/* 1. Imagem de Fundo Futurista com Linhas Neon - Fixa */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src={CLOSET_BACKGROUND_IMAGE}
          alt="Fundo futurista digital"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ 
            objectFit: 'cover', 
            objectPosition: 'center', 
            minHeight: '100vh', 
            minWidth: '100vw',
            filter: 'brightness(0.4) saturate(1.2)',
            opacity: 0.6
          }}
        />
        {/* Overlay gradiente para melhorar contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20"></div>
      </div>

      {/* 2. Conteúdo Principal */}
      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 pb-24 sm:pb-6">
        <div className="mx-auto max-w-6xl">
          {/* Caixa com Logo e Nome da Loja */}
          <div className="mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <div className="w-full rounded-3xl neo-card p-6 md:p-8 flex items-center gap-3 sm:gap-4 justify-center">
              {lojistaData?.logoUrl && (
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
                  <Image
                    src={lojistaData.logoUrl}
                    alt={lojistaData.nome || "Logo"}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white" translate="no">
                {lojistaData?.nome || "Loja"}
              </h3>
            </div>
          </div>

          {/* Upload de Foto e Área Personalize o seu Look */}
          <div className={`mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 ${userPhotoUrl ? 'justify-center' : 'justify-center'}`}>
            {/* Upload de Foto - Sem caixa externa, apenas moldura dupla */}
            <div className={`${userPhotoUrl ? 'w-full sm:max-w-[48%] md:max-w-[42%]' : 'w-full'}`}>
              {userPhotoUrl && !isRefineMode ? (
                <div className="relative inline-block">
                  {/* Moldura Externa - Contínua */}
                  <div className="relative rounded-2xl border-2 border-glass-border/50 p-2 shadow-glass inline-block">
                    {/* Moldura Interna - Pontilhada */}
                    <div className="relative border-2 border-dashed border-glass-border/30 rounded-xl p-1 inline-block">
                      <img
                        src={userPhotoUrl}
                        alt="Sua foto"
                        className="h-auto w-auto max-w-full object-contain block rounded-lg cursor-pointer"
                        onClick={handleChangePhoto}
                        title="Clique para trocar a foto"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute right-3 top-3 rounded-full bg-red-500/80 p-2 text-white transition hover:bg-red-600 z-10"
                    title="Remover foto"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleChangePhoto}
                    className="absolute right-3 bottom-3 rounded-full bg-blue-500/80 p-2 text-white transition hover:bg-blue-600 z-10"
                    title="Trocar foto"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              ) : isRefineMode ? (
                // Em modo refinamento, mostrar a imagem base sem permitir upload
                <div className="relative inline-block">
                  <div className="relative rounded-2xl border-2 border-glass-border/50 p-2 shadow-glass inline-block">
                    <div className="relative border-2 border-dashed border-glass-border/30 rounded-xl p-1 inline-block">
                      {refineBaseImageUrl && (
                        <img
                          src={refineBaseImageUrl}
                          alt="Look base para refinamento"
                          className="h-auto w-auto max-w-full object-contain block rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-gradient-orange to-gradient-pink text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg">
                    Modo Refinamento
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 sm:gap-4 rounded-2xl border-2 border-dashed border-glass-border/30 neo-card p-8 sm:p-10 md:p-12 transition hover:border-glass-border/50 hover:shadow-glass"
                >
                  <Camera className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-white/70" />
                  <span className="text-base sm:text-lg font-semibold text-white text-center px-2">
                    Faça upload da sua foto
                  </span>
                  <span className="text-xs sm:text-sm text-white/70 text-center px-2">PNG ou JPG até 10MB</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Área: Personalize o seu Look - Ao lado da foto */}
            {userPhotoUrl && (
              <div className="w-full sm:flex-1 self-stretch neo-card p-3 sm:p-4 md:p-5 flex flex-col min-h-0 sm:max-w-[48%] md:max-w-[42%] rounded-xl">
                <div className="mb-3 sm:mb-4 shrink-0">
                  <div className="rounded-lg border-2 border-glass-border/50 gradient-button p-2 sm:p-3">
                    <h2 className="text-center text-[10px] sm:text-xs md:text-sm font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      Provador virtual com IA
                    </h2>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 justify-between min-h-0">
                  {/* Passo a Passo */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {/* Passo 1 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-orange/80 text-sm font-bold text-white shadow-lg">
                        1
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Carregue sua Foto</span>
                        {userPhotoUrl && (
                          <div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                        selectedProducts.length > 0 ? 'bg-gradient-orange/80' : 'bg-card-bg'
                      }`}>
                        2
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Escolha um Produto</span>
                        {selectedProducts.length > 0 && (
                          <div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                        userPhotoUrl && selectedProducts.length > 0 ? 'bg-gradient-orange/80' : 'bg-card-bg'
                      }`}>
                        3
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Crie o seu Look</span>
                        {userPhotoUrl && selectedProducts.length > 0 && (
                          <div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Caixa com Produtos Selecionados - Abaixo da Foto Upload */}
          {userPhotoUrl && selectedProducts.length > 0 && (
            <div className="mb-4 sm:mb-6 neo-card p-2 sm:p-2.5 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] mx-auto rounded-xl">
              <h3 className="mb-2 text-center text-xs sm:text-sm font-bold text-white">
                Produtos Selecionados
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {selectedProducts.map((produto, index) => (
                  <div key={produto.id || index} className="rounded-lg border-2 border-glass-border/30 neo-card overflow-hidden relative">
                    {/* Botão para remover produto */}
                    <button
                      onClick={() => toggleProductSelection(produto)}
                      className="absolute right-1 top-1 z-10 rounded-full bg-red-500/80 p-1 text-white transition hover:bg-red-600"
                      title="Remover produto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Imagem do Produto */}
                    {produto.imagemUrl && (
                      <div className="relative aspect-square w-full">
                        <Image
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {/* Informações do Produto */}
                    <div className="p-1.5 bg-card-bg">
                      <h3 className="text-left text-[10px] font-semibold text-white line-clamp-2 mb-0.5 leading-tight">
                        {produto.nome}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        {(() => {
                          const desconto = lojistaData?.descontoRedesSociais
                          const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                          const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
                          
                          if (descontoAplicado && descontoValido) {
                            return (
                              <>
                                <p className="text-left text-[9px] text-white/50 line-through">
                                  {formatPrice(produto.preco)}
                                </p>
                                <div className="flex items-center gap-0.5 flex-wrap">
                                  <p className="text-left text-[10px] font-bold text-yellow-400">
                                    {formatPrice(produto.preco ? produto.preco * (1 - (desconto / 100)) : 0)}
                                  </p>
                                  <p className="text-left text-[7px] font-semibold text-green-400 leading-tight">
                                    Desconto aplicado
                                  </p>
                                </div>
                              </>
                            )
                          }
                          return (
                            <p className="text-left text-[10px] font-bold text-gradient-orange">
                              {formatPrice(produto.preco)}
                            </p>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aviso sobre seleção de produtos */}
          {userPhotoUrl && (
            <div className="mb-4 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 backdrop-blur-sm">
              {isRefineMode ? (
                <p className="text-xs font-medium text-purple-200 text-center">
                  ✨ <span className="font-bold">Modo Refinamento:</span> Adicione até <span className="font-bold text-yellow-300">2 acessórios leves</span> (Jóias, Óculos, Cosméticos, Tintura). Roupas e Calçados não são permitidos.
                </p>
              ) : (
                <p className="text-xs font-medium text-blue-200 text-center">
                  💡 Você pode selecionar até <span className="font-bold text-yellow-300">2 produtos</span> de <span className="font-bold text-yellow-300">categorias diferentes</span>
                </p>
              )}
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto */}
          <div className="mb-6 neo-card px-4 py-3 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border border-glass-border/30 bg-gradient-to-r from-gradient-orange to-red-600 px-3 py-1.5">
                <p className="text-xs font-medium text-white text-center">
                  Siga, Curta ou Compartilhe !!!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Instagram */}
                {lojistaData?.redesSociais?.instagram ? (
                  <button
                    onClick={() => handleSocialClick(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition hover:scale-110 cursor-pointer"
                  >
                    <Instagram className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-50">
                    <Instagram className="h-5 w-5" />
                  </div>
                )}
                
                {/* Facebook */}
                {lojistaData?.redesSociais?.facebook ? (
                  <button
                    onClick={() => handleSocialClick(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white transition hover:scale-110 cursor-pointer"
                  >
                    <Facebook className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white opacity-50">
                    <Facebook className="h-5 w-5" />
                  </div>
                )}
                
                {/* TikTok */}
                {lojistaData?.redesSociais?.tiktok ? (
                  <button
                    onClick={() => handleSocialClick(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white transition hover:scale-110 cursor-pointer"
                  >
                    <Music2 className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white opacity-50">
                    <Music2 className="h-5 w-5" />
                  </div>
                )}
                
                {/* Compartilhar App */}
                <button
                  onClick={handleShareApp}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white transition hover:scale-110 cursor-pointer"
                  title="Compartilhar aplicativo"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              {/* Mostrar desconto apenas se houver valor cadastrado e não expirado */}
              {(() => {
                const desconto = lojistaData?.descontoRedesSociais
                const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                
                // Verificar se há desconto válido
                if (!desconto || desconto <= 0) {
                  return null // Não mostrar se não houver desconto ou for 0
                }
                
                // Verificar se expirou
                if (expiraEm) {
                  const dataExpiracao = new Date(expiraEm)
                  const agora = new Date()
                  if (dataExpiracao < agora) {
                    return null // Não mostrar se expirou
                  }
                }
                
                // Mostrar desconto
                return (
                  <>
                    <p className="text-sm font-semibold text-white text-center">
                      <span className="text-yellow-400 font-bold">GANHE</span> <span className="text-xl md:text-2xl font-bold text-yellow-400">{desconto}%</span> de <span className="text-yellow-400 font-bold">DESCONTO</span> em Todos os Produtos!
                    </p>
                    {descontoAplicado && (
                      <p className="text-xs font-semibold text-green-400 text-center animate-pulse">
                        ✓ Desconto aplicado!
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Card Principal */}
          <div className="rounded-3xl neo-card p-6 md:p-8">

            {/* Abas de Categoria */}
            <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-2 sm:mx-0">
              <div className="flex gap-2 justify-start sm:justify-center px-2 sm:px-0 min-w-max sm:min-w-0 flex-wrap sm:flex-nowrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
                      activeCategory === category
                        ? "gradient-button"
                        : "neo-button"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso de categoria */}
            {categoryWarning && (
              <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
                <p className="text-sm font-medium text-yellow-200">{categoryWarning}</p>
              </div>
            )}

            {/* Grid de Produtos */}
            {isLoadingCatalog ? (
              <div className="py-12 text-center text-white">Carregando produtos...</div>
            ) : filteredCatalog.length === 0 ? (
              <div className="py-12 text-center text-white/70">
                Nenhum produto encontrado nesta categoria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
                {filteredCatalog.map((produto) => {
                  const isSelected = selectedProducts.some((p) => p.id === produto.id)
                  return (
                    <button
                      key={produto.id}
                      onClick={() => toggleProductSelection(produto)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition ${
                        isSelected
                          ? "border-gradient-orange bg-gradient-orange/10 shadow-glow-orange ring-2 ring-gradient-orange"
                          : "border-glass-border/30 neo-card hover:border-glass-border/50"
                      }`}
                    >
                      {produto.imagemUrl && (
                        <div className="relative aspect-square w-full">
                          <Image
                            src={produto.imagemUrl}
                            alt={produto.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3 bg-card-bg">
                        <h3 className="text-left text-sm font-semibold text-white line-clamp-2">
                          {produto.nome}
                        </h3>
                        <div className="mt-1 flex flex-col gap-0.5">
                          {(() => {
                            const desconto = lojistaData?.descontoRedesSociais
                            const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                            const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
                            
                            if (descontoAplicado && descontoValido) {
                              return (
                                <>
                                  <p className="text-left text-xs text-white/50 line-through">
                                    {formatPrice(produto.preco)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-left text-sm font-bold text-yellow-400">
                                      {formatPrice(produto.preco ? produto.preco * (1 - (desconto / 100)) : 0)}
                                    </p>
                                    <p className="text-left text-[10px] font-semibold text-green-400">
                                      Desconto aplicado
                                    </p>
                                  </div>
                                </>
                              )
                            }
                            return (
                              <p className="text-left text-sm font-bold text-gradient-orange">
                                {formatPrice(produto.preco)}
                              </p>
                            )
                          })()}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute right-2 top-2 rounded-full bg-gradient-orange p-1.5 shadow-lg">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAB - Visualize */}
      {(userPhoto || userPhotoUrl) && selectedProducts.length > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-0.5 sm:p-1 rounded-full shadow-glow-orange">
          <button
            onClick={handleVisualize}
            disabled={isGenerating}
            className="flex items-center gap-1.5 sm:gap-2 rounded-full gradient-button px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full h-full"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="hidden sm:inline">Gerando...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline">CRIAR LOOK</span>
                <span className="sm:hidden">CRIAR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mensagem de erro */}
      {generationError && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-sm font-medium text-red-200">{generationError}</p>
        </div>
      )}


      {/* Modal de Favoritos */}
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
                      // Navegar para Tela 3
                      router.push(`/${lojistaId}/resultado?from=favoritos`)
                    }}
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
