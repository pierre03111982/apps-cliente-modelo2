"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Upload, X, Check, Filter, Instagram, Facebook, Music2, ExternalLink, Heart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { Produto, SocialLinks, SalesConfig } from "@/lib/types"
import { FavoritosStep2 } from "./FavoritosStep2"

// Componente para exibir a última foto favoritada
function UltimoFavoritoBox({ lojistaId, clienteId }: { lojistaId: string; clienteId: string }) {
  const [ultimoFavorito, setUltimoFavorito] = useState<{
    imagemUrl: string
    productName?: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUltimoFavorito = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
        const response = await fetch(
          `/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}`
        )

        if (response.ok) {
          const data = await response.json()
          const favorites = data.favorites || data.favoritos || []
          const validFavorites = favorites.filter((f: any) => f.imagemUrl)
          
          if (validFavorites.length > 0) {
            setUltimoFavorito({
              imagemUrl: validFavorites[0].imagemUrl,
              productName: validFavorites[0].productName,
            })
          }
        }
      } catch (error) {
        console.error("[UltimoFavoritoBox] Erro ao carregar favorito:", error)
      } finally {
        setLoading(false)
      }
    }

    if (clienteId && lojistaId) {
      loadUltimoFavorito()
    }
  }, [clienteId, lojistaId])

  if (loading || !ultimoFavorito) {
    return null
  }

  return (
    <div className="mt-4 rounded-xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-4 shadow-lg shadow-black/30">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-pink-400 fill-pink-400" />
        <h4 className="text-sm font-semibold text-white">Último look favoritado</h4>
      </div>
      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-white/30">
        <Image
          src={ultimoFavorito.imagemUrl}
          alt={ultimoFavorito.productName || "Look favorito"}
          fill
          className="object-cover"
        />
      </div>
    </div>
  )
}

type Step2Props = {
  catalog: Produto[]
  onGenerateLooks: (foto: File, produtos: Produto[]) => void
  isLoadingCatalog?: boolean
  errorMessage?: string
  lojistaNome?: string
  lojistaLogoUrl?: string | null
  lojistaId?: string
  redesSociais?: SocialLinks
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  isSimulator?: boolean
  initialPhoto?: File | null
  clienteId?: string | null
  salesConfig?: SalesConfig
}

export function Step2Workspace({
  catalog,
  onGenerateLooks,
  isLoadingCatalog,
  errorMessage,
  lojistaNome,
  lojistaLogoUrl,
  lojistaId,
  redesSociais,
  descontoRedesSociais,
  descontoRedesSociaisExpiraEm,
  isSimulator,
  initialPhoto,
  clienteId,
  salesConfig,
}: Step2Props) {
  const [userPhoto, setUserPhoto] = useState<File | null>(null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Produto[]>([])
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null)
  const [hasFollowedSocial, setHasFollowedSocial] = useState(false)

  // Quando vier uma foto inicial (por ex. ao voltar do Passo 3), preencher o estado
  useEffect(() => {
    if (initialPhoto && !userPhoto && !userPhotoUrl) {
      setUserPhoto(initialPhoto)
      const url = URL.createObjectURL(initialPhoto)
      setUserPhotoUrl(url)
    }
  }, [initialPhoto, userPhoto, userPhotoUrl])

  // Função para normalizar URL de rede social
  const normalizeSocialUrl = (url: string | null | undefined, platform: "instagram" | "facebook" | "tiktok"): string | null => {
    if (!url) return null
    
    // Se já é uma URL completa, retornar
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    
    // Se começa com @, remover e construir URL
    const handle = url.replace(/^@/, "").trim()
    
    switch (platform) {
      case "instagram":
        return `https://instagram.com/${handle}`
      case "facebook":
        return handle.includes("facebook.com") ? `https://${handle}` : `https://facebook.com/${handle}`
      case "tiktok":
        return `https://www.tiktok.com/@${handle}`
      default:
        return null
    }
  }

  // Função para abrir redes sociais
  const handleFollowSocial = (platform: "instagram" | "facebook" | "tiktok") => {
    const url = normalizeSocialUrl(
      redesSociais?.[platform],
      platform
    )
    
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
      
      // Marcar como seguido no localStorage
      if (followedStorageKey) {
        localStorage.setItem(followedStorageKey, "true")
        setHasFollowedSocial(true)
      }
    }
  }

  // Definir desconto efetivo:
  // - Lojistas: somente se cadastrarem porcentagem
  // - Simulador lojista-demo: sempre mostra, usando um valor padrão se não vier nada
  const effectiveDiscount =
    descontoRedesSociais && descontoRedesSociais > 0
      ? descontoRedesSociais
      : isSimulator && lojistaId === "lojista-demo"
        ? 10
        : null

  // Data de expiração (opcional)
  let discountExpiry: Date | null = null
  if (descontoRedesSociaisExpiraEm) {
    const d = new Date(descontoRedesSociaisExpiraEm)
    if (!isNaN(d.getTime())) {
      discountExpiry = d
    }
  }

  const isDiscountExpired =
    !!discountExpiry && discountExpiry.getTime() < new Date().setHours(0, 0, 0, 0)

  // Verificar se há desconto configurado
  const hasDiscount = !!effectiveDiscount && effectiveDiscount > 0 && !isDiscountExpired

  // Versão do desconto (para invalidar o "já seguiu" quando lojista mudar o desconto)
  const discountVersion = hasDiscount
    ? `${effectiveDiscount}_${discountExpiry ? discountExpiry.toISOString().slice(0, 10) : "noexp"}`
    : "none"

  const followedStorageKey =
    lojistaId && hasDiscount ? `followed_${lojistaId}_${discountVersion}` : null

  // Verificar se o usuário já seguiu (localStorage) para ESTE desconto específico
  useEffect(() => {
    if (!followedStorageKey) {
      setHasFollowedSocial(false)
      return
    }
    const followed =
      typeof window !== "undefined" &&
      localStorage.getItem(followedStorageKey) === "true"
    setHasFollowedSocial(followed)
  }, [followedStorageKey])

  // Calcular preço com desconto
  const calculatePriceWithDiscount = (preco: number | null | undefined): { original: number | null; discounted: number | null; percentage: number } => {
    if (!preco || typeof preco !== "number") {
      return { original: null, discounted: null, percentage: 0 }
    }
    
    if (!hasFollowedSocial || !effectiveDiscount || effectiveDiscount <= 0) {
      return { original: preco, discounted: preco, percentage: 0 }
    }
    
    const discount = (preco * effectiveDiscount) / 100
    const discounted = preco - discount
    
    return {
      original: preco,
      discounted: Math.round(discounted * 100) / 100, // Arredondar para 2 casas decimais
      percentage: effectiveDiscount
    }
  }

  // Verificar se há redes sociais configuradas
  const hasSocialMedia = redesSociais && (
    redesSociais.instagram || 
    redesSociais.facebook || 
    redesSociais.tiktok
  )

  useEffect(() => {
    setSelectedProducts((prev) =>
      prev.filter((selected) => catalog.some((produto) => produto.id === selected.id))
    )
  }, [catalog])

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    catalog.forEach((produto) => {
      if (produto.categoria) {
        uniqueCategories.add(produto.categoria)
      }
    })
    return ["Todos", ...Array.from(uniqueCategories)]
  }, [catalog])

  const filteredCatalog = useMemo(() => {
    let filtered = activeCategory === "Todos" 
      ? catalog 
      : catalog.filter((item) => item.categoria === activeCategory)
    
    // Garantir que os produtos filtrados também estejam ordenados por categoria e nome
    return [...filtered].sort((a, b) => {
      // Primeiro ordenar por categoria (alfabética)
      const categoriaA = (a.categoria || "").toLowerCase()
      const categoriaB = (b.categoria || "").toLowerCase()
      if (categoriaA !== categoriaB) {
        return categoriaA.localeCompare(categoriaB, "pt-BR")
      }
      // Se a categoria for igual, ordenar por nome
      const nomeA = (a.nome || "").toLowerCase()
      const nomeB = (b.nome || "").toLowerCase()
      return nomeA.localeCompare(nomeB, "pt-BR")
    })
  }, [catalog, activeCategory])

  // Função para obter classes de degradê e sombra baseadas na categoria
  const getCategoryButtonClasses = (category: string, isActive: boolean) => {
    if (!isActive) {
      return "rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
    }

    // Degradês e sombras diferentes para cada categoria
    const categoryStyles: Record<string, string> = {
      "Todos": "rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/50",
      "Roupas": "rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/50",
      "Acessórios": "rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/50",
      "Óculos": "rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-yellow-500/50",
      "Joias": "rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/50",
      "Cosméticos": "rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/50",
      "Tintura (Cabelo)": "rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/50",
    }

    // Se não encontrar estilo específico, usar um padrão baseado no índice
    return categoryStyles[category] || "rounded-full bg-gradient-to-r from-slate-500 to-gray-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-500/50"
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0]
      setUserPhoto(file)
      setUserPhotoUrl(URL.createObjectURL(file))
    }
  }

  const toggleProductSelection = (produto: Produto) => {
    // Verificar se o produto já está selecionado
    const isAlreadySelected = selectedProducts.some((p) => p.id === produto.id)
    
    if (isAlreadySelected) {
      // Se já está selecionado, remover
      setSelectedProducts((prev) => prev.filter((p) => p.id !== produto.id))
      setCategoryWarning(null)
      return
    }

    // Verificar se já existe um produto da mesma categoria selecionado
    const existingProductInCategory = selectedProducts.find(
      (p) => p.categoria === produto.categoria && p.categoria
    )

    if (existingProductInCategory) {
      // Mostrar aviso
      setCategoryWarning(
        `Você já selecionou um produto da categoria "${produto.categoria}". Apenas um produto por categoria é permitido.`
      )
      // Remover o aviso após 5 segundos
      setTimeout(() => setCategoryWarning(null), 5000)
      return
    }

    // Adicionar o produto
    setSelectedProducts((prev) => [...prev, produto])
    setCategoryWarning(null)
  }

  const handleGenerateClick = () => {
    if (!userPhoto || selectedProducts.length === 0) return
    onGenerateLooks(userPhoto, selectedProducts)
  }

  const showEmptyState = !isLoadingCatalog && filteredCatalog.length === 0

  const formatPrice = (value?: number | null) =>
    typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar preço"
  
  // Componente para exibir preço com desconto
  const PriceDisplay = ({ preco, compact = false }: { preco: number | null | undefined; compact?: boolean }) => {
    const priceInfo = calculatePriceWithDiscount(preco)
    
    if (!priceInfo.original || priceInfo.percentage === 0) {
      return <p className={compact ? "text-xs font-bold text-yellow-300" : "text-lg font-bold text-yellow-300"}>{formatPrice(preco)}</p>
    }
    
    if (compact) {
      return (
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-yellow-300">{formatPrice(priceInfo.discounted)}</p>
          <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-300">
            -{priceInfo.percentage}%
          </span>
          <p className="text-[10px] text-white/60 line-through">{formatPrice(priceInfo.original)}</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-yellow-300">{formatPrice(priceInfo.discounted)}</p>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-300">
            -{priceInfo.percentage}%
          </span>
        </div>
        <p className="text-sm text-white/60 line-through">{formatPrice(priceInfo.original)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header combinado: logo, nome, desconto (quando houver) e redes sociais */}
      {(lojistaNome || isSimulator) && (
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 px-5 py-4 shadow-xl shadow-black/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {lojistaLogoUrl && (
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-white shadow-2xl shadow-black/60">
                  <Image
                    src={lojistaLogoUrl}
                    alt={`Logo da ${lojistaNome}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-1">
                {lojistaNome && (
                  <span className="block text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg shadow-black/60">
                    {lojistaNome}
                  </span>
                )}
                {isSimulator && (
                  <span className="inline-flex items-center rounded-full bg-accent-1/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-1">
                    Modo simulador
                  </span>
                )}
                {hasDiscount && hasSocialMedia && !hasFollowedSocial && (
                  <>
                    <p className="mt-1 text-sm md:text-base font-semibold text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                      GANHE{" "}
                      <span className="text-lg md:text-2xl font-black underline decoration-yellow-300 decoration-4">
                        {effectiveDiscount}%
                      </span>{" "}
                      DE DESCONTO EM TODOS OS PRODUTOS
                      {discountExpiry && (
                        <span className="ml-2 text-[10px] md:text-xs font-normal text-white/80">
                          (válido até{" "}
                          {discountExpiry.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          )
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] md:text-xs text-white/85">
                      Para garantir o desconto, <span className="font-semibold">siga ou curta qualquer postagem</span> em uma das redes sociais da loja e{" "}
                      <span className="font-semibold">clique em qualquer link das redes ao lado</span>.
                    </p>
                  </>
                )}
                {hasDiscount && hasFollowedSocial && (
                  <p className="mt-1 text-xs md:text-sm font-semibold text-emerald-300">
                    Desconto de {effectiveDiscount}% aplicado em todos os produtos.
                  </p>
                )}
              </div>
            </div>

            {hasSocialMedia && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {redesSociais?.instagram && (
                  <button
                    onClick={() => handleFollowSocial("instagram")}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/60 transition hover:scale-105 hover:shadow-xl"
                  >
                    <Instagram className="h-5 w-5 text-pink-300" />
                    Instagram
                    <ExternalLink className="h-3 w-3 text-yellow-200" />
                  </button>
                )}
                {redesSociais?.facebook && (
                  <button
                    onClick={() => handleFollowSocial("facebook")}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/60 transition hover:scale-105 hover:shadow-xl"
                  >
                    <Facebook className="h-5 w-5 text-blue-200" />
                    Facebook
                    <ExternalLink className="h-3 w-3 text-yellow-200" />
                  </button>
                )}
                {redesSociais?.tiktok && (
                  <button
                    onClick={() => handleFollowSocial("tiktok")}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-black to-gray-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/60 transition hover:scale-105 hover:shadow-xl"
                  >
                    <Music2 className="h-5 w-5 text-emerald-300" />
                    TikTok
                    <ExternalLink className="h-3 w-3 text-yellow-200" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end">
            <span className="text-[11px] text-white/75">
              {catalog.length} produto(s) disponível(is)
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="rounded-full bg-gradient-to-r from-blue-600 to-purple-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg">
            Passo 2
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Personalize seu look inteligente
          </h2>
          <p className="mt-2 max-w-2xl text-white/80">
            Faça upload da sua foto, escolha as peças do catálogo do lojista e deixe a IA gerar duas versões exclusivas:
            uma natural e outra criativa.
          </p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-gradient-to-tl from-purple-500/90 via-indigo-700/90 to-blue-800/90 px-4 py-3 text-sm text-white shadow-xl shadow-black/30">
          <Filter className="mr-2 inline h-4 w-4 text-accent-2" />
          Combine acessórios para looks completos e aumente o ticket médio.
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-6 text-center shadow-xl shadow-black/30">
            <h3 className="text-lg font-semibold text-white">Sua foto</h3>
            <p className="mt-1 text-sm text-white/80">
              Escolha uma foto bem iluminada para resultados mais realistas.
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {userPhotoUrl ? (
              <div className="mt-6 space-y-4">
                <div className="mx-auto flex h-96 w-72 items-center justify-center rounded-2xl bg-black/20 p-2 shadow-xl shadow-black/50">
                  <img
                    src={userPhotoUrl}
                    alt="Pré-visualização da foto do cliente"
                    className="h-full w-full rounded-xl object-contain"
                  />
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Abrir seletor de arquivo novamente
                      const input = document.getElementById("photo-upload") as HTMLInputElement | null
                      if (input) {
                        input.click()
                      }
                    }}
                  >
                    Trocar foto
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setUserPhoto(null)
                      setUserPhotoUrl(null)
                      setSelectedProducts([])
                    }}
                  >
                    Excluir foto
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="photo-upload"
                className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-white/30 bg-gradient-to-tl from-purple-500/80 via-indigo-700/80 to-blue-800/80 py-10 shadow-xl shadow-black/30 transition hover:border-white/50 hover:shadow-xl hover:shadow-black/40"
              >
                <Upload className="h-10 w-10 text-accent-1" />
                <span className="text-sm font-medium text-accent-1">Fazer upload da sua foto</span>
                <span className="text-xs text-slate-400">PNG ou JPG até 10MB</span>
              </label>
            )}
          </section>

          {/* Componente de Favoritos */}
          {clienteId && lojistaId && (
            <FavoritosStep2
              lojistaId={lojistaId}
              clienteId={clienteId}
              salesConfig={salesConfig}
            />
          )}

          <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Produtos selecionados ({selectedProducts.length})
              </h3>
              {selectedProducts.length > 0 && (
                <button
                  className="rounded-lg bg-blue-950/90 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-blue-900/90"
                  onClick={() => setSelectedProducts([])}
                >
                  Limpar todos
                </button>
              )}
            </div>

            {selectedProducts.length === 0 ? (
              <p className="mt-4 text-sm text-white/80">
                Escolha ao menos um item do catálogo para gerar seus looks inteligentes.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-white/90">
                {selectedProducts.map((produto) => (
                  <li
                    key={produto.id}
                    className="flex items-center justify-between rounded-2xl border border-white/20 bg-[linear-gradient(to_right,_rgb(30,64,175)_90%,_rgb(234,179,8)_10%)] px-4 py-3 shadow-xl shadow-black/30"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{produto.nome}</span>
                      <div className="flex items-center gap-2">
                        <PriceDisplay preco={produto.preco} compact />
                        {produto.categoria && (
                          <span className="text-xs text-white/70">· {produto.categoria}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => toggleProductSelection(produto)} className="text-blue-800 hover:text-blue-700">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            onClick={handleGenerateClick}
            disabled={!userPhoto || selectedProducts.length === 0}
            className="w-full rounded-2xl border-2 border-accent-1/80 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-600 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-black/50 transition hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/70 disabled:pointer-events-none disabled:opacity-60 md:text-lg"
          >
            Gerar looks com{" "}
            {selectedProducts.length > 0
              ? `${selectedProducts.length} produto(s)`
              : "..."}
          </button>
          
          {/* Última foto favoritada */}
          {clienteId && lojistaId && <UltimoFavoritoBox lojistaId={lojistaId} clienteId={clienteId} />}
          
          {errorMessage && (
            <p className="text-center text-xs font-medium text-rose-500">{errorMessage}</p>
          )}
          {categoryWarning && (
            <div className="mt-4 rounded-lg border border-red-600 bg-red-600 px-4 py-3">
              <p className="text-sm font-medium text-white">{categoryWarning}</p>
            </div>
          )}
        </div>

        <section className="space-y-6 rounded-3xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((category) => {
              const isActive = category === activeCategory
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  disabled={isLoadingCatalog}
                  className={getCategoryButtonClasses(category, isActive)}
                >
                  {category}
                </button>
              )
            })}
          </div>

          {isLoadingCatalog ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : showEmptyState ? (
            <div className="mt-10 rounded-3xl border-2 border-dashed border-white/30 bg-gradient-to-tl from-purple-500/80 via-indigo-700/80 to-blue-800/80 p-10 text-center shadow-xl shadow-black/30">
              <p className="text-sm font-medium text-white/80">
                Nenhum produto disponível nesta categoria ainda. Peça para o lojista publicar itens no catálogo.
              </p>
            </div>
          ) : (
            <div className="mt-6 max-h-[800px] overflow-y-auto pr-2">
              <div className="grid gap-4 grid-cols-2">
                {filteredCatalog.map((produto) => {
                const isSelected = selectedProducts.some((p) => p.id === produto.id)
                const tamanhos = produto.tamanhos ?? []
                const cores = produto.cores ?? []

                return (
                  <article
                    key={produto.id}
                    className="group relative overflow-hidden rounded-3xl border-4 border-blue-500 bg-[linear-gradient(to_bottom_right,_rgb(37,99,235)_90%,_rgb(234,179,8)_10%)] shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 hover:border-blue-400"
                    onClick={() => toggleProductSelection(produto)}
                  >
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={produto.imagemUrl || "https://placehold.co/600x800/e9edfb/6f5cf1?text=Produto"}
                        alt={produto.nome}
                        fill
                        sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-3 p-5">
                      {produto.categoria && (
                        <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                          {produto.categoria}
                        </span>
                      )}
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-white">{produto.nome}</h4>
                        <PriceDisplay preco={produto.preco} />
                      </div>

                      {tamanhos.length > 0 ? (
                        <div className="space-y-1 text-xs text-white/80">
                          <p className="font-semibold uppercase tracking-[0.2em] text-white/70">Tamanhos</p>
                          <div className="flex flex-wrap gap-2">
                            {tamanhos.map((size) => (
                              <span
                                key={size}
                                className="rounded-full border border-white/30 px-2.5 py-1 text-[11px] font-medium text-white/90"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white/60">Tamanhos não informados.</p>
                      )}

                      {cores.length > 0 && (
                        <div className="space-y-1 text-xs text-white/80">
                          <p className="font-semibold uppercase tracking-[0.2em] text-white/70">Cores</p>
                          <div className="flex flex-wrap gap-2">
                            {cores.map((cor) => (
                              <span
                                key={cor}
                                className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white/90"
                              >
                                {cor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {produto.medidas && (
                        <p className="text-xs text-white/80">Medidas: {produto.medidas}</p>
                      )}

                      {produto.obs && (
                        <p className="text-xs text-white/70">{produto.obs}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-accent-1/40 backdrop-blur-sm">
                        <span className="flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-blue-800">
                          <Check className="h-4 w-4 text-blue-800" /> Adicionado
                        </span>
                      </div>
                    )}
                  </article>
                )
              })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

