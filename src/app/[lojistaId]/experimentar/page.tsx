"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, Camera, Wand2, Heart, X, Check, Filter, ThumbsUp, Instagram, Facebook, Music2, Share2 } from "lucide-react"
import { fetchLojistaData, fetchProdutos } from "@/lib/firebaseQueries"
import type { Produto, LojistaData, SalesConfig, SocialLinks } from "@/lib/types"
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

    // Carregar foto do sessionStorage quando volta da Tela 3
    const savedPhotoUrl = sessionStorage.getItem(`photo_${lojistaId}`)
    if (savedPhotoUrl && !userPhotoUrl) {
      setUserPhotoUrl(savedPhotoUrl)
    }

    // Carregar produtos selecionados do sessionStorage
    const savedProducts = sessionStorage.getItem(`products_${lojistaId}`)
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts)
        if (Array.isArray(products) && products.length > 0) {
          setSelectedProducts(products)
        }
      } catch (err) {
        console.error("[ExperimentarPage] Erro ao carregar produtos do sessionStorage:", err)
      }
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
        const validFavorites = favoritesList.filter((f: any) => f.imagemUrl)
        setFavorites(validFavorites.slice(0, 20)) // Últimos 20
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
    if (document.getElementById("photo-upload") as HTMLInputElement) {
      (document.getElementById("photo-upload") as HTMLInputElement).value = ""
    }
  }

  // Toggle seleção de produto - permite até 2 produtos de categorias diferentes
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

  // Gerar looks
  const handleVisualize = async () => {
    if (!userPhoto || selectedProducts.length === 0) return

    try {
      setIsGenerating(true)
      setGenerationError(null)

      // 1. Upload da foto
      const personImageUrl = await uploadPersonPhoto(userPhoto)
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
        throw new Error(`Erro ao gerar composição: ${response.status}`)
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
        await navigator.share({
          title: lojistaData?.nome || "Experimente AI",
          text: shareText,
          url: appLink,
        })
      } catch (error) {
        // Usuário cancelou ou erro ao compartilhar
        console.log("Compartilhamento cancelado ou erro:", error)
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
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* 1. Imagem de Fundo com Desfoque e Overlay - Fixa */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src={CLOSET_BACKGROUND_IMAGE}
          alt="Guarda-roupa de luxo"
          className="absolute inset-0 h-full w-full object-cover blur-[6px] brightness-50"
          style={{ objectFit: 'cover', objectPosition: 'center', minHeight: '100vh', minWidth: '100vw' }}
        />
      </div>

      {/* 2. Conteúdo Principal */}
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Caixa com Logo e Nome da Loja */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-lg px-4 py-3 shadow-xl flex items-center gap-3">
              {lojistaData?.logoUrl && (
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/30">
                  <Image
                    src={lojistaData.logoUrl}
                    alt={lojistaData.nome || "Logo"}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-lg font-bold text-white">
                {lojistaData?.nome || "Loja"}
              </h3>
            </div>
          </div>

          {/* Upload de Foto e Área Personalize o seu Look */}
          <div className={`mb-6 flex items-stretch gap-4 ${userPhotoUrl ? 'justify-start' : 'justify-center'}`}>
            {/* Upload de Foto - Sem caixa externa, apenas moldura dupla */}
            <div className={`${userPhotoUrl ? 'max-w-[42%]' : 'w-full'}`}>
              {userPhotoUrl ? (
                <div className="relative inline-block">
                  {/* Moldura Externa - Contínua */}
                  <div className="relative rounded-2xl border-2 border-white/50 p-2 shadow-xl inline-block">
                    {/* Moldura Interna - Pontilhada */}
                    <div className="relative border-2 border-dashed border-white/30 rounded-xl p-1 inline-block">
                      <img
                        src={userPhotoUrl}
                        alt="Sua foto"
                        className="h-auto w-auto max-w-full object-contain block rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute right-3 top-3 rounded-full bg-red-500/80 p-2 text-white transition hover:bg-red-600 z-10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/30 bg-white/5 p-12 transition hover:border-white/50 hover:bg-white/10"
                >
                  <Camera className="h-16 w-16 text-white/70" />
                  <span className="text-lg font-semibold text-white">
                    Faça upload da sua foto
                  </span>
                  <span className="text-sm text-white/70">PNG ou JPG até 10MB</span>
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
              <div className="flex-1 self-stretch rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg p-4 md:p-5 shadow-xl flex flex-col min-h-0">
                <div className="mb-4 shrink-0">
                  <div className="rounded-lg border-2 border-white/50 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-3 shadow-lg">
                    <h2 className="text-center text-base md:text-lg font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      Personalize o seu Look
                    </h2>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 justify-between min-h-0">
                  {/* Passo a Passo */}
                  <div className="flex flex-col gap-3 shrink-0">
                    {/* Passo 1 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/80 text-sm font-bold text-white shadow-lg">
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
                        selectedProducts.length > 0 ? 'bg-teal-500/80' : 'bg-white/20'
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
                        userPhotoUrl && selectedProducts.length > 0 ? 'bg-teal-500/80' : 'bg-white/20'
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
            <div className="mb-6 rounded-xl border border-white/30 bg-white/10 backdrop-blur-lg p-4 shadow-xl">
              <h3 className="mb-3 text-center text-sm font-bold text-white">
                Produtos Selecionados
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedProducts.map((produto, index) => (
                  <div key={produto.id || index} className="rounded-lg border-2 border-white/30 bg-white overflow-hidden shadow-lg">
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
                    <div className="p-2 bg-white">
                      <h3 className="text-left text-xs font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">
                        {produto.nome}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        {descontoAplicado && lojistaData?.descontoRedesSociais ? (
                          <>
                            <p className="text-left text-[10px] text-gray-400 line-through">
                              {formatPrice(produto.preco)}
                            </p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="text-left text-xs font-bold text-yellow-500">
                                {formatPrice(produto.preco ? produto.preco * (1 - (lojistaData.descontoRedesSociais / 100)) : 0)}
                              </p>
                              <p className="text-left text-[8px] font-semibold text-green-600 leading-tight">
                                Desconto aplicado
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-left text-xs font-bold text-blue-600">
                              {formatPrice(produto.preco)}
                            </p>
                          </>
                        )}
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
              <p className="text-xs font-medium text-blue-200 text-center">
                💡 Você pode selecionar até <span className="font-bold text-yellow-300">2 produtos</span> de <span className="font-bold text-yellow-300">categorias diferentes</span>
              </p>
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto */}
          <div className="mb-6 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shadow-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border border-white/30 bg-red-500/80 px-3 py-1.5">
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
              <p className="text-sm font-semibold text-white text-center">
                <span className="text-yellow-400 font-bold">GANHE</span> <span className="text-xl md:text-2xl font-bold text-yellow-400">{lojistaData?.descontoRedesSociais || 10}%</span> de <span className="text-yellow-400 font-bold">DESCONTO</span> em Todos os Produtos!
              </p>
              {descontoAplicado && (
                <p className="text-xs font-semibold text-green-400 text-center animate-pulse">
                  ✓ Desconto aplicado!
                </p>
              )}
            </div>
          </div>

          {/* Card Principal */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-6 md:p-8 shadow-2xl">

            {/* Abas de Categoria */}
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category
                      ? "bg-green-500 text-white border-2 border-white shadow-lg"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border-2 border-transparent"
                  }`}
                >
                  {category}
                </button>
              ))}
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
              <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pb-4 pr-2 custom-scrollbar">
                {filteredCatalog.map((produto) => {
                  const isSelected = selectedProducts.some((p) => p.id === produto.id)
                  return (
                    <button
                      key={produto.id}
                      onClick={() => toggleProductSelection(produto)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition ${
                        isSelected
                          ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-500/30"
                          : "border-gray-200 bg-white hover:border-gray-300"
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
                      <div className="p-3 bg-white">
                        <h3 className="text-left text-sm font-semibold text-gray-900 line-clamp-2">
                          {produto.nome}
                        </h3>
                        <div className="mt-1 flex flex-col gap-0.5">
                          {descontoAplicado && lojistaData?.descontoRedesSociais ? (
                            <>
                              <p className="text-left text-xs text-gray-400 line-through">
                                {formatPrice(produto.preco)}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-left text-sm font-bold text-yellow-500">
                                  {formatPrice(produto.preco ? produto.preco * (1 - (lojistaData.descontoRedesSociais / 100)) : 0)}
                                </p>
                                <p className="text-left text-[10px] font-semibold text-green-600">
                                  Desconto aplicado
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-left text-sm font-bold text-blue-600">
                                {formatPrice(produto.preco)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute right-2 top-2 rounded-full bg-teal-500 p-1.5 shadow-lg">
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
      {userPhoto && selectedProducts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 p-1 rounded-full shadow-2xl" style={{ background: 'linear-gradient(to right, #facc15, #ec4899, #a855f7, #3b82f6, #10b981)' }}>
          <button
            onClick={handleVisualize}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-full bg-teal-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-teal-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full h-full"
          >
            {isGenerating ? (
              <>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Gerando...
              </>
            ) : (
              <>
                <Wand2 className="h-6 w-6" />
                CRIAR LOOK
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
                    className="group relative overflow-hidden rounded-lg border border-white/20 bg-white/5 transition hover:bg-white/10"
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
