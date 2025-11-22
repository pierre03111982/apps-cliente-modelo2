"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import {
  Instagram,
  MessageCircle,
  Music2,
  Share2,
  ShoppingCart,
  RefreshCw,
  Facebook,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Download,
} from "lucide-react"
import type { GeneratedLook, SalesConfig, SocialLinks } from "@/lib/types"

type Step3Props = {
  lojistaId: string
  lojistaNome: string
  lojistaLogoUrl?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  looks?: GeneratedLook[]
  isLoadingLooks?: boolean
  feedbackMessage?: string | null
  onReset: () => void
  onRegenerate?: () => void
  canRegenerate?: boolean
  clienteId?: string | null
  clienteNome?: string | null
  clienteWhatsapp?: string | null
}

const CTA_ENDPOINT = "/api/actions"

const FALLBACK_LOOKS: GeneratedLook[] = [
  {
    id: "look-criativo",
    titulo: "Look Criativo IA",
    descricao: "Look gerado por IA com os produtos selecionados.",
    imagemUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80",
    produtoNome: "Produto",
    produtoPreco: 0,
    watermarkText: "Valor sujeito a alteração.",
  },
  {
    id: "look-criativo",
    titulo: "Look Criativo IA",
    descricao: "Versão cinematográfica gerada pela Experimente AI.",
    imagemUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=720&q=80",
    produtoNome: "Vestido Midi Floral",
    produtoPreco: 499.9,
    watermarkText: "Imagem gerada com tecnologia Experimente AI.",
  },
]

async function registerAction(payload: {
  lojistaId: string
  action: "like" | "dislike" | "share" | "checkout"
  compositionId?: string | null
  jobId?: string | null
  customerId?: string | null
  customerName?: string | null
  productName?: string | null
  productPrice?: number | null
  imagemUrl?: string | null
}) {
  try {
    const response = await fetch(CTA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Status ${response.status}`)
    }

    const data = (await response.json()) as { success?: boolean }
    return data.success !== false
  } catch (error) {
    console.error("Erro ao registrar ação do cliente:", error)
    return false
  }
}

export function Step3Results({
  lojistaId,
  lojistaNome,
  lojistaLogoUrl,
  redesSociais,
  salesConfig,
  looks,
  isLoadingLooks = false,
  feedbackMessage,
  onReset,
  onRegenerate,
  canRegenerate = false,
  clienteId,
  clienteNome,
  clienteWhatsapp,
}: Step3Props) {
  const resolvedLooks = useMemo(
    () => (looks && looks.length > 0 ? looks : FALLBACK_LOOKS),
    [looks]
  )

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedType, setVotedType] = useState<"like" | "dislike" | null>(null) // Rastrear qual botão foi clicado
  const [showFavorites, setShowFavorites] = useState(false)
  const [selectedFavorite, setSelectedFavorite] = useState<GeneratedLook | null>(null)
  const [favoriteLooksFromBackend, setFavoriteLooksFromBackend] = useState<GeneratedLook[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  
  // Resetar estados de voto quando novos looks forem gerados
  useEffect(() => {
    if (looks && looks.length > 0) {
      setHasVoted(false)
      setVotedType(null)
      console.log("[Step3Results] ✅ Novos looks gerados, estados de voto resetados")
    }
  }, [looks?.map(l => l.id).join(",")]) // Resetar quando os IDs dos looks mudarem

  // Looks marcados como "curtidos" na sessão atual, derivados do mapa de likes.
  const favoriteLooksFromSession = useMemo(
    () => resolvedLooks.filter((look) => likedMap[look.id]),
    [resolvedLooks, likedMap]
  )

  // Combinar favoritos da sessão atual com favoritos do backend
  const favoriteLooks = useMemo(() => {
    // Se tiver favoritos do backend, usar eles (são os últimos 10)
    if (favoriteLooksFromBackend.length > 0) {
      return favoriteLooksFromBackend
    }
    // Senão, usar os da sessão atual
    return favoriteLooksFromSession
  }, [favoriteLooksFromBackend, favoriteLooksFromSession])

  // Buscar favoritos do backend quando abrir o modal
  const loadFavoritesFromBackend = useCallback(async () => {
    if (!clienteId || !lojistaId || loadingFavorites) return

    try {
      setLoadingFavorites(true)
      // Usar proxy interno para evitar CORS
      const response = await fetch(
        `/api/cliente/favoritos?lojistaId=${encodeURIComponent(lojistaId)}&customerId=${encodeURIComponent(clienteId)}`
      )

      if (response.ok) {
        const data = await response.json()
        const favorites = data.favorites || data.favoritos || []
        
        // Converter favoritos do backend para formato GeneratedLook
        const convertedFavorites: GeneratedLook[] = favorites
          .filter((f: any) => f.imagemUrl) // Apenas os que têm imagem
          .map((f: any) => ({
            id: f.id || `favorite-${Date.now()}`,
            titulo: "Look Criativo IA",
            descricao: "Look favoritado anteriormente",
            imagemUrl: f.imagemUrl,
            produtoNome: f.productName || "Produto",
            produtoPreco: f.productPrice || null,
            watermarkText: "Imagem gerada por IA – Experimente AI",
            compositionId: f.compositionId || null,
            jobId: f.jobId || null,
            downloadUrl: f.imagemUrl,
          }))

        setFavoriteLooksFromBackend(convertedFavorites)
        console.log("[Step3Results] ✅ Favoritos carregados do backend:", convertedFavorites.length)
      } else {
        console.warn("[Step3Results] Erro ao buscar favoritos:", response.status)
      }
    } catch (error) {
      console.error("[Step3Results] Erro ao carregar favoritos do backend:", error)
    } finally {
      setLoadingFavorites(false)
    }
  }, [clienteId, lojistaId, loadingFavorites])

  // Carregar favoritos automaticamente quando o componente montar (se cliente estiver logado)
  useEffect(() => {
    if (clienteId && lojistaId && !loadingFavorites && favoriteLooksFromBackend.length === 0) {
      // Carregar favoritos em background quando o componente carregar
      loadFavoritesFromBackend()
    }
  }, [clienteId, lojistaId, loadingFavorites, favoriteLooksFromBackend.length, loadFavoritesFromBackend])

  const formatPrice = useCallback((value?: number | null) => {
    return typeof value === "number"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Consultar valor"
  }, [])


  const handleLike = useCallback(
    async (look: GeneratedLook) => {
      // Favoritar o look (agora só temos look criativo)
      const likeKey = look.id
      if (likedMap[likeKey] || hasVoted) return // Não permitir se já votou

      // Assim que o cliente curtir, já consideramos que ele respondeu
      setHasVoted(true)
      setVotedType("like")
      setLoadingAction(`like-${likeKey}`)

      // Registrar like no backend
      const success = await registerAction({
        lojistaId,
        action: "like",
        compositionId: look.compositionId ?? null,
        jobId: look.jobId ?? null,
        customerId: clienteId || null, // Usar clienteId das props
        productName: look.produtoNome,
        productPrice: look.produtoPreco ?? null,
        imagemUrl: look.imagemUrl,
        customerName: clienteNome || look.customerName || undefined,
      })
      
      // Após salvar, recarregar favoritos do backend para atualizar a lista
      if (success && clienteId) {
        setTimeout(() => {
          loadFavoritesFromBackend()
        }, 500) // Pequeno delay para garantir que o Firestore salvou
      }

      if (success) {
        setLikedMap((prev) => ({ ...prev, [likeKey]: true }))
      }
      setLoadingAction(null)
    },
    [likedMap, lojistaId, resolvedLooks, clienteId, clienteNome, loadFavoritesFromBackend, hasVoted]
  )

  const handleShare = useCallback(
    async (look: GeneratedLook, mode: "whatsapp" | "share") => {
      setLoadingAction(`${mode}-${look.id}`)
      
      // Registrar ação no backend
      await registerAction({
        lojistaId,
        action: "share",
        compositionId: look.compositionId ?? null,
        jobId: look.jobId ?? null,
        customerId: clienteId ?? look.customerName ?? null,
        productName: look.produtoNome,
        productPrice: look.produtoPreco ?? null,
        imagemUrl: look.imagemUrl,
        customerName: clienteNome ?? look.customerName ?? undefined,
      })

      if (mode === "whatsapp") {
        const whatsappLink = salesConfig.whatsappLink ?? "https://wa.me/"
        window.open(whatsappLink, "_blank", "noopener,noreferrer")
      } else {
        // Criar link de compartilhamento com tracking (usar proxy interno)
        try {
          // Se não tiver clienteId, usar um ID temporário baseado no nome
          const finalClienteId = clienteId || `temp-${Date.now()}`
          const finalClienteNome = clienteNome || "Cliente"
          
          const shareResponse = await fetch("/api/cliente/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lojistaId,
              clienteId: finalClienteId,
              clienteNome: finalClienteNome,
              clienteWhatsapp: clienteWhatsapp || "",
              imagemUrl: look.imagemUrl,
              lookId: look.id,
              compositionId: look.compositionId || null,
              jobId: look.jobId || null,
            }),
          })

          if (shareResponse.ok) {
            const shareData = await shareResponse.json()
            const shareUrl = shareData.shareUrl || look.imagemUrl
            // Construir link de acesso à loja
            const clientAppUrl = process.env.NEXT_PUBLIC_CLIENT_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002')
            const lojaUrl = `${clientAppUrl}/${lojistaId}`

            console.log("[handleShare] ✅ Link de compartilhamento criado:", shareUrl)

            if (navigator.share && shareUrl) {
              try {
                // Tentar compartilhar com imagem quando disponível
                const shareData: any = {
                  title: `${lojistaNome} · ${look.titulo}`,
                  text: `Veja minha composição criada pela ${lojistaNome}! Acesse a loja: ${lojaUrl}`,
                  url: lojaUrl,
                }
                
                // Se a API suportar compartilhamento de arquivos, incluir a imagem
                if (navigator.canShare && look.imagemUrl) {
                  try {
                    // Buscar a imagem como blob para compartilhar
                    const imageResponse = await fetch(look.imagemUrl)
                    const imageBlob = await imageResponse.blob()
                    const imageFile = new File([imageBlob], `look-${look.id}.jpg`, { type: 'image/jpeg' })
                    
                    if (navigator.canShare({ files: [imageFile] })) {
                      shareData.files = [imageFile]
                    }
                  } catch (imageError) {
                    console.warn("[handleShare] Não foi possível incluir imagem:", imageError)
                  }
                }
                
                await navigator.share(shareData)
                setShareMessage("Compartilhado com sucesso!")
              } catch (error) {
                console.warn("[handleShare] Usuário cancelou ou não suportado:", error)
                // Fallback: copiar link
                try {
                  await navigator.clipboard.writeText(shareUrl)
                  setShareMessage("Link copiado para a área de transferência.")
                } catch (clipError) {
                  console.warn("[handleShare] Erro ao copiar:", clipError)
                  setShareMessage("Link criado! Copie manualmente: " + shareUrl.substring(0, 50) + "...")
                }
              }
            } else if (shareUrl) {
              try {
                await navigator.clipboard.writeText(shareUrl)
                setShareMessage("Link copiado para a área de transferência.")
              } catch (error) {
                console.warn("[handleShare] Não foi possível copiar o link:", error)
                setShareMessage("Link criado! Copie manualmente: " + shareUrl.substring(0, 50) + "...")
              }
            }
          } else {
            const errorData = await shareResponse.json().catch(() => ({}))
            console.error("[handleShare] Erro na resposta:", {
              status: shareResponse.status,
              error: errorData.error || "Erro desconhecido"
            })
            
            // Fallback: usar imagem direta se falhar
            const shareUrl = look.downloadUrl ?? look.imagemUrl
            if (shareUrl) {
              try {
                await navigator.clipboard.writeText(shareUrl)
                setShareMessage("Link da imagem copiado para a área de transferência.")
              } catch (error) {
                console.warn("[handleShare] Não foi possível copiar o link:", error)
                setShareMessage("Erro ao criar link de compartilhamento. Tente novamente.")
              }
            } else {
              setShareMessage("Erro ao criar link de compartilhamento.")
            }
          }
        } catch (error: any) {
          console.error("[handleShare] Erro ao criar link de compartilhamento:", error)
          // Fallback: usar imagem direta
          const shareUrl = look.downloadUrl ?? look.imagemUrl
          if (shareUrl) {
            try {
              await navigator.clipboard.writeText(shareUrl)
              setShareMessage("Link da imagem copiado para a área de transferência.")
            } catch (err) {
              console.warn("[handleShare] Não foi possível copiar o link:", err)
              setShareMessage("Erro ao compartilhar. Tente novamente.")
            }
          } else {
            setShareMessage("Erro ao compartilhar. Tente novamente.")
          }
        }
      }

      setTimeout(() => setShareMessage(null), 3500)
      setLoadingAction(null)
    },
    [lojistaId, lojistaNome, salesConfig.whatsappLink, clienteId, clienteNome, clienteWhatsapp]
  )

  const handleDislike = useCallback(async (look: GeneratedLook) => {
    if (hasVoted) return // Não permitir se já votou
    
    setHasVoted(true)
    setVotedType("dislike")
    try {
      setLoadingAction("dislike")
      await registerAction({
        lojistaId,
        action: "dislike",
        compositionId: look.compositionId ?? null,
        jobId: look.jobId ?? null,
        customerId: clienteId || null,
        productName: look.produtoNome,
        productPrice: look.produtoPreco ?? null,
        imagemUrl: look.imagemUrl,
        customerName: clienteNome || undefined,
      })
    } finally {
      setLoadingAction(null)
    }
  }, [lojistaId, clienteId, clienteNome, hasVoted])

  const handleDownload = useCallback(async (look: GeneratedLook) => {
    const targetUrl = look.downloadUrl ?? look.imagemUrl
    if (!targetUrl) return

    try {
      const link = document.createElement("a")
      link.href = targetUrl
      link.target = "_blank"
      link.rel = "noopener"
      link.download = `${look.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Não foi possível iniciar o download:", error)
    }
  }, [])

  const handleCheckout = useCallback(
    async (look: GeneratedLook) => {
      setLoadingAction(`checkout-${look.id}`)
      const success = await registerAction({
        lojistaId,
        action: "checkout",
        compositionId: look.compositionId ?? null,
        jobId: look.jobId ?? null,
        customerId: look.customerName ?? null,
        productName: look.produtoNome,
        productPrice: look.produtoPreco ?? null,
        imagemUrl: look.imagemUrl,
        customerName: look.customerName ?? undefined,
      })

      const checkoutLink = salesConfig.ecommerceUrl ?? salesConfig.whatsappLink
      if (success && checkoutLink) {
        window.open(checkoutLink, "_blank", "noopener,noreferrer")
      }
      setLoadingAction(null)
    },
    [lojistaId, salesConfig.ecommerceUrl, salesConfig.whatsappLink]
  )

  return (
    <div className="space-y-10">
      <div className="text-center">
        {lojistaLogoUrl && (
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-white shadow-2xl shadow-black/60">
            <Image
              src={lojistaLogoUrl}
              alt={`Logo da ${lojistaNome}`}
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <h1 className="mt-2 text-4xl font-extrabold text-white md:text-6xl drop-shadow-[0_0_18px_rgba(0,0,0,0.7)]">
          {lojistaNome}
        </h1>
        <p className="mt-1 text-sm font-semibold text-white/90">
          <span className="font-bold">Experimente AI</span>{" "}
          <span className="italic">– Provador Virtual</span>
        </p>
        <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs md:text-sm text-white/90 shadow-lg shadow-black/30">
          As imagens geradas são meramente ilustrativas, criadas por IA. Têm o intuito de te auxiliar na escolha do look,
          mas não isentam a prova real para verificar medidas e satisfação. O aplicativo é apenas uma ferramenta de apoio.
        </div>
        {(redesSociais.instagram || redesSociais.facebook || redesSociais.tiktok) && (
          <div className="mt-4 flex justify-center gap-3">
            {redesSociais.instagram && (
              <a
                href={redesSociais.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/60 transition hover:scale-105 hover:shadow-xl"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            )}
            {redesSociais.facebook && (
              <a
                href={redesSociais.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/60 transition hover:scale-105 hover:shadow-xl"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
            )}
            {redesSociais.tiktok && (
              <a
                href={redesSociais.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-black to-gray-800 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/60 transition hover:scale-105 hover:shadow-xl"
              >
                <Music2 className="h-4 w-4 text-emerald-300" />
                TikTok
              </a>
            )}
          </div>
        )}
        {feedbackMessage && (
          <p className="mt-2 text-xs font-medium text-rose-500">{feedbackMessage}</p>
        )}
      </div>

      {isLoadingLooks ? (
        <div className="flex justify-center">
          <div className="h-[520px] w-full max-w-2xl animate-pulse rounded-3xl border border-slate-300 bg-white" />
        </div>
      ) : (
        <div className="flex justify-center">
          {resolvedLooks.map((look) => {
            const isLiked = likedMap[look.id]
            const actionBusy = loadingAction?.includes(look.id)

            return (
              <article
                key={look.id}
                className="w-full max-w-2xl space-y-6 rounded-3xl border-2 border-white/40 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-6 shadow-xl shadow-black/40 backdrop-blur"
              >
                <div className="space-y-3 text-center">
                  <div className="inline-flex rounded-lg border border-white/80 px-6 py-2 text-sm font-semibold shadow-lg shadow-black/70 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 text-white">
                    <span className="text-lg md:text-xl">{look.titulo}</span>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-transparent shadow-2xl shadow-black/60">
                  {look.desativado || !look.imagemUrl ? (
                    // Look Desativado - mostrar placeholder
                    <div className="flex h-[520px] flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-300">
                          <span className="text-3xl font-bold text-slate-500">🚫</span>
                        </div>
                        <p className="text-2xl font-semibold text-slate-600">Desativado</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Esta funcionalidade está temporariamente desativada.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Look Normal - mostrar imagem (janela se ajusta à imagem)
                    <>
                      <div className="relative w-full">
                        <Image
                          src={look.imagemUrl}
                          alt={look.titulo}
                          width={720}
                          height={920}
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '80vh' }}
                        />
                        {/* Ícone de Download no canto inferior direito */}
                        <button
                          onClick={() => handleDownload(look)}
                          className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 border-2 border-white/30 text-white shadow-lg transition-all hover:scale-110 z-10"
                          title="Baixar imagem"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        {/* Ações em coluna no canto superior direito */}
                        <div className="absolute right-4 top-4 flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleShare(look, "share")}
                            disabled={actionBusy}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg shadow-black/60 hover:bg-blue-500 hover:text-white transition"
                          >
                            <Share2 className="h-7 w-7 text-blue-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(look)}
                            disabled={actionBusy}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg shadow-black/60 hover:bg-slate-800 hover:text-white transition"
                          >
                            <Download className="h-7 w-7 text-slate-700" />
                          </button>
                        </div>

                        {/* Caixa branca com detalhes do produto */}
                        <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-black/40">
                          <p className="font-semibold text-slate-900">
                            {look.produtoNome}
                            {" "}
                            <span className="font-normal text-slate-500">
                              • {formatPrice(look.produtoPreco)}
                            </span>
                          </p>
                          {look.watermarkText && (
                            <p className="text-[11px] text-slate-500">
                              {look.watermarkText}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!look.desativado && (
                  <>
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 border-4 border-blue-700 shadow-xl shadow-black/60 hover:bg-blue-700 text-white font-bold text-lg"
                      disabled={loadingAction === `checkout-${look.id}`}
                      onClick={() => handleCheckout(look)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Comprar agora
                    </Button>
                    <Button
                      size="lg"
                      className="w-full bg-gray-200 border-2 border-gray-300 shadow-lg shadow-black/40 hover:bg-gray-300 text-blue-600 font-semibold mt-3"
                      disabled={loadingAction === `cart-${look.id}`}
                      onClick={() => handleCheckout(look)}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <Plus className="h-4 w-4" />
                      </div>
                      Adicionar no carrinho
                    </Button>
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}

      <section className="rounded-3xl border border-white/20 bg-gradient-to-r from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-6 shadow-xl shadow-black/40">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Arial, sans-serif' }}>
              Curtiu o Look?
            </h3>
            <p className="mt-1 text-xs md:text-sm text-white/80">
              Sua opinião ajuda a gente a melhorar a experiência.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                // Dar like no look criativo (primeiro/único look)
                const target = resolvedLooks[0]
                if (target) {
                  void handleLike(target)
                }
              }}
              disabled={hasVoted}
              className={`flex items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-black/50 transition ${
                hasVoted 
                  ? "h-20 w-20 opacity-75 cursor-not-allowed" 
                  : "h-14 w-14 hover:scale-105 hover:bg-emerald-400"
              }`}
            >
              <ThumbsUp className={`text-white ${hasVoted ? "h-10 w-10" : "h-7 w-7"}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                // Dar dislike no look criativo (primeiro/único look)
                const target = resolvedLooks[0]
                if (target) {
                  void handleDislike(target)
                }
              }}
              disabled={hasVoted}
              className={`flex items-center justify-center rounded-full bg-rose-500 shadow-xl shadow-black/50 transition ${
                hasVoted 
                  ? "h-20 w-20 opacity-75 cursor-not-allowed" 
                  : "h-14 w-14 hover:scale-105 hover:bg-rose-400"
              }`}
            >
              <ThumbsDown className={`text-white ${hasVoted ? "h-10 w-10" : "h-7 w-7"}`} />
            </button>
          </div>
          <div className={`mt-2 flex flex-wrap justify-center gap-3 transition-all duration-300 ${
            hasVoted ? "scale-110 opacity-100" : "scale-100 opacity-70"
          }`}>
            <Button
              size="sm"
              disabled={!hasVoted || !onRegenerate || isLoadingLooks}
              onClick={onRegenerate}
              className="min-w-[150px] font-bold shadow-lg"
            >
              Gerar novo look
            </Button>
            <Button
              size="sm"
              disabled={!hasVoted}
              onClick={async () => {
                setShowFavorites(true)
                setSelectedFavorite(null)
                // Buscar favoritos do backend quando abrir o modal
                await loadFavoritesFromBackend()
              }}
              className="min-w-[150px] font-bold shadow-lg"
              variant="secondary"
            >
              Favoritos
            </Button>
            <Button
              size="sm"
              disabled={!hasVoted}
              onClick={onReset}
              className="min-w-[150px] font-bold shadow-lg"
              variant="ghost"
            >
              Voltar para início
            </Button>
          </div>
        </div>
      </section>

      {showFavorites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-black/70">
            {!selectedFavorite ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Favoritos</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFavorites(false)}
                    >
                      Fechar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowFavorites(false)
                        onReset()
                      }}
                    >
                      Voltar para início
                    </Button>
                  </div>
                </div>
                {loadingFavorites ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-300">Carregando favoritos...</p>
                  </div>
                ) : favoriteLooks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-300">
                      Você ainda não curtiu nenhum look.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {favoriteLooks.map((look) => (
                      <button
                        key={look.id}
                        type="button"
                        onClick={() => setSelectedFavorite(look)}
                        className="group overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-md shadow-black/40 transition hover:border-accent-1 hover:shadow-lg"
                      >
                        <Image
                          src={look.imagemUrl ?? ""}
                          alt={look.titulo}
                          width={260}
                          height={320}
                          className="h-40 w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="p-2 text-left">
                          <p className="text-xs font-semibold text-white truncate">
                            {look.produtoNome}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatPrice(look.produtoPreco)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Look selecionado
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFavorite(null)}
                    >
                      Voltar para favoritos
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowFavorites(false)
                        onReset()
                      }}
                    >
                      Voltar para início
                    </Button>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
                  <div className="overflow-hidden rounded-2xl border border-slate-700 bg-black shadow-xl shadow-black/60">
                    {selectedFavorite.imagemUrl && (
                      <Image
                        src={selectedFavorite.imagemUrl}
                        alt={selectedFavorite.titulo}
                        width={800}
                        height={1000}
                        className="h-[520px] w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                      <p className="text-sm font-semibold text-white">
                        {selectedFavorite.produtoNome}
                      </p>
                      <p className="text-xs text-slate-300">
                        {formatPrice(selectedFavorite.produtoPreco)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        className="border-2 border-white/80 shadow-xl shadow-black/60"
                        onClick={() => handleCheckout(selectedFavorite)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Comprar agora
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

