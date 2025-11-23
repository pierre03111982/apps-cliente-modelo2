"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchLojistaData, fetchProdutos } from "@/lib/firebaseQueries"
import type { Produto, LojistaData, GeneratedLook } from "@/lib/types"
import { ExperimentarView } from "@/components/views/ExperimentarView"

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

  const [isInitializing, setIsInitializing] = useState(true); // Novo estado
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
        // Não precisa setar isLoadingCatalog aqui, o isInitializing já cuida disso
        
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
          
          // Buscar produtos via API (sem cache para sempre ter dados atualizados)
          const produtosResponse = await fetch(`/api/lojista/products?lojistaId=${encodeURIComponent(lojistaId)}`, {
            cache: "no-store",
            next: { revalidate: 0 },
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          })
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
        // Finaliza a inicialização APENAS APÓS carregar os dados da loja
        // A verificação de cliente logado vai acontecer em paralelo
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

    const checkAuthAndFinalize = () => {
    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    if (!stored) {
      router.push(`/${lojistaId}/login`)
        return // Não finaliza a inicialização, pois vai redirecionar
    }

      // Se chegou aqui, está autenticado, pode finalizar a inicialização
      setIsInitializing(false);

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
      // Carregar foto do sessionStorage quando volta da Tela 3 (modo normal) ou quando seleciona favorito
      const savedPhotoUrl = sessionStorage.getItem(`photo_${lojistaId}`)
      if (savedPhotoUrl) {
        // Sempre substituir a foto atual pela foto salva (permite substituir foto de upload por favorito)
        setUserPhotoUrl(savedPhotoUrl)
        console.log("[ExperimentarPage] Foto carregada do sessionStorage:", savedPhotoUrl)
      }

      // Limpar produtos selecionados quando volta da Tela 3
      // Os produtos precisam ser selecionados novamente
      sessionStorage.removeItem(`products_${lojistaId}`)
      setSelectedProducts([])
    }
    }
    
    // Adiciona um pequeno delay para garantir que os dados da loja comecem a carregar primeiro
    // Isso ajuda a evitar um flash rápido da tela de loading se a verificação for muito rápida
    const timer = setTimeout(checkAuthAndFinalize, 100);

    return () => clearTimeout(timer);

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
        setFavorites(sortedFavorites.slice(0, 10))
      }
    } catch (error) {
      console.error("[ExperimentarPage] Erro ao carregar favoritos:", error)
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  // Carregar favoritos quando o modal for aberto
  useEffect(() => {
    if (showFavoritesModal && lojistaId) {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesModal, lojistaId])

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
      
      // Limpar URL anterior se existir (para liberar memória)
      if (userPhotoUrl && userPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(userPhotoUrl)
      }
      
      // Criar URL do novo arquivo
      const newPhotoUrl = URL.createObjectURL(file)
      
      // Substituir foto atual pela nova
      setUserPhoto(file)
      setUserPhotoUrl(newPhotoUrl)
      
      // Salvar no sessionStorage para persistir
      sessionStorage.setItem(`photo_${lojistaId}`, newPhotoUrl)
      
      console.log("[ExperimentarPage] Foto substituída com sucesso")
    }
    
    // Resetar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = ""
  }

  // Remover foto
  const handleRemovePhoto = () => {
    // Limpar URL se for blob
    if (userPhotoUrl && userPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(userPhotoUrl)
    }
    
    setUserPhoto(null)
    setUserPhotoUrl(null)
    sessionStorage.removeItem(`photo_${lojistaId}`)
    
    const input = document.getElementById("photo-upload") as HTMLInputElement
    if (input) {
      input.value = ""
    }
  }

  // Trocar foto - permite selecionar nova foto mesmo quando já existe uma
  const handleChangePhoto = () => {
    const input = document.getElementById("photo-upload") as HTMLInputElement
    if (input) {
      // Resetar input antes de abrir para garantir que onChange sempre dispare
      input.value = ""
      input.click()
    }
  }

  // Voltar do modo refinamento para tela 2 normal com foto original
  const handleBackFromRefinement = () => {
    // Limpar modo refinamento
    sessionStorage.removeItem(`refine_mode_${lojistaId}`)
    sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
    sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)
    
    // Restaurar foto original do sessionStorage
    const originalPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
    if (originalPhoto) {
      setUserPhotoUrl(originalPhoto)
      setUserPhoto(null) // Limpar arquivo se houver
    }
    
    // Limpar estado de refinamento
    setIsRefineMode(false)
    setRefineBaseImageUrl(null)
    setRefineCompositionId(null)
    
    // Limpar produtos selecionados
    setSelectedProducts([])
    sessionStorage.removeItem(`products_${lojistaId}`)
  }

  // Toggle seleção de produto
  const toggleProductSelection = (produto: Produto) => {
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

    // Em modo refinamento, permitir apenas 1 produto (qualquer categoria)
    if (isRefineMode) {
      if (selectedProducts.length >= 1) {
        setCategoryWarning(
          "Em modo de refinamento, você pode selecionar apenas 1 produto. Remova o produto selecionado antes de escolher outro."
        )
        setTimeout(() => setCategoryWarning(null), 5000)
        return
      }
    } else {
      // Modo normal: verificar se já existe produto da mesma categoria
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
      alert("Selecione um produto para adicionar ao look")
      return
    }

    if (selectedProducts.length > 1) {
      alert("Em modo de refinamento, você pode selecionar apenas 1 produto.")
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

        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
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
        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
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

  // TELA DE CARREGAMENTO
  if (isInitializing) {
  return (
      <div className="relative min-h-screen w-full overflow-hidden">
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
        <div className="relative z-10 flex h-screen flex-col items-center justify-center text-white">
              {lojistaData?.logoUrl && (
            <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-white/30">
              <img src={lojistaData.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                </div>
              )}
          <p className="font-semibold">Carregando sua experiência...</p>
          <div className="mt-4 h-6 w-6 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            </div>
          </div>
    );
  }

                return (
    <ExperimentarView
      lojistaData={lojistaData}
      isLoadingCatalog={isLoadingCatalog}
      filteredCatalog={filteredCatalog}
      categories={categories}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      userPhotoUrl={userPhotoUrl}
      isRefineMode={isRefineMode}
      refineBaseImageUrl={refineBaseImageUrl}
      handleChangePhoto={handleChangePhoto}
      handleRemovePhoto={handleRemovePhoto}
      handlePhotoUpload={handlePhotoUpload}
      handleBackFromRefinement={handleBackFromRefinement}
      selectedProducts={selectedProducts}
      toggleProductSelection={toggleProductSelection}
      categoryWarning={categoryWarning}
      handleSocialClick={handleSocialClick}
      handleShareApp={handleShareApp}
      descontoAplicado={descontoAplicado}
      formatPrice={formatPrice}
      handleVisualize={handleVisualize}
      isGenerating={isGenerating}
      generationError={generationError}
      showFavoritesModal={showFavoritesModal}
      setShowFavoritesModal={setShowFavoritesModal}
      isLoadingFavorites={isLoadingFavorites}
      favorites={favorites}
      router={router}
      lojistaId={lojistaId}
    />
  )
}
