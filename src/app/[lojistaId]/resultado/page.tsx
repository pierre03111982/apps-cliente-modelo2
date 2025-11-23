"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, ShoppingCart, Heart, RefreshCw, Home, Instagram, Facebook, Music2, MessageCircle, X, Sparkles, ArrowLeftCircle, Check, Download } from "lucide-react"
import { ClockAnimation } from "@/components/ClockAnimation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
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
              
              if (compositionId) {
                const voteStatus = await checkVoteStatus(compositionId)
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
                // Sem compositionId - mostrar pergunta
                setHasVoted(false)
                setVotedType(null)
              }
            } else {
              setHasVoted(false)
              setVotedType(null)
            }
          } else {
            // Não é nova imagem - verificar se já foi votado
            if (parsedLooks.length > 0) {
              const firstLook = parsedLooks[0]
              let compositionId = firstLook.compositionId
              
              // Se não houver compositionId (look refinado ou remixado), criar um ID único baseado na imagemUrl
              if (!compositionId && firstLook.imagemUrl) {
                const imageHash = firstLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
                compositionId = `refined-${imageHash}`
              }
              
              if (compositionId) {
                const voteStatus = await checkVoteStatus(compositionId)
                if (voteStatus) {
                  // Já votou - não mostrar pergunta
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
        
        // Verificar status de voto
        if (compositionId) {
          const voteStatus = await checkVoteStatus(compositionId)
          console.log("[ResultadoPage] Status de voto verificado:", voteStatus)
          if (voteStatus) {
            setHasVoted(true)
            setVotedType(voteStatus === "like" ? "like" : "dislike")
          } else {
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

  // Recarregar favoritos quando o modal for aberto ou quando der like
  useEffect(() => {
    if (showFavoritesModal && lojistaId) {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFavoritesModal, lojistaId, votedType])

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
        
        // Remover duplicatas baseadas em imagemUrl (manter apenas o mais recente)
        const seenUrls = new Map<string, any>()
        likesOnly.forEach((f: any) => {
          const imageUrl = f.imagemUrl?.trim()
          if (imageUrl) {
            const existing = seenUrls.get(imageUrl)
            if (!existing) {
              seenUrls.set(imageUrl, f)
            } else {
              // Comparar datas e manter o mais recente
              let existingDate = new Date(0)
              let currentDate = new Date(0)
              
              if (existing.createdAt?.toDate) {
                existingDate = existing.createdAt.toDate()
              } else if (existing.createdAt?.seconds) {
                existingDate = new Date(existing.createdAt.seconds * 1000)
              } else if (existing.createdAt) {
                existingDate = new Date(existing.createdAt)
              }
              
              if (f.createdAt?.toDate) {
                currentDate = f.createdAt.toDate()
              } else if (f.createdAt?.seconds) {
                currentDate = new Date(f.createdAt.seconds * 1000)
              } else if (f.createdAt) {
                currentDate = new Date(f.createdAt)
              }
              
              if (currentDate.getTime() > existingDate.getTime()) {
                seenUrls.set(imageUrl, f)
              }
            }
          }
        })
        
        const uniqueFavorites = Array.from(seenUrls.values())
        
        // Ordenar por data de criação (mais recente primeiro)
        const sortedFavorites = uniqueFavorites.sort((a: any, b: any) => {
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
        
        console.log("[ResultadoPage] Favoritos carregados:", limitedFavorites.length, "de", likesOnly.length, "likes totais (após remover duplicatas)")
        
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

      // Enviar like imediatamente com a imagem original (não bloquear)
      console.log("[ResultadoPage] Salvando like com imagemUrl original:", currentLook.imagemUrl)

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
        
        // Atualizar favoritos imediatamente com delay para garantir que backend processou
        setTimeout(async () => {
          await loadFavorites()
        }, 1000)
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
  }, [hasVoted, currentLookIndex, looks, lojistaId, lojistaData, loadFavorites])

  // Handle dislike
  const handleDislike = useCallback(async () => {
    if (hasVoted) {
      console.log("[ResultadoPage] Já votado, ignorando dislike")
      return
    }

    const currentLook = looks[currentLookIndex]
    if (!currentLook || !lojistaId) {
      console.error("[ResultadoPage] Look ou lojistaId não encontrado")
      return
    }

    setLoadingAction("dislike")

    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null

      // Para looks refinados sem compositionId, usar um ID único baseado na imagemUrl
      let compositionId = currentLook.compositionId
      let jobId = currentLook.jobId
      
      if (!compositionId && currentLook.imagemUrl) {
        const imageHash = currentLook.imagemUrl.split('/').pop()?.split('?')[0] || `refined-${Date.now()}`
        compositionId = `refined-${imageHash}`
      }

      console.log("[ResultadoPage] Registrando dislike:", { compositionId, jobId, clienteId })

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
          // Dislike não envia imagemUrl
        }),
      })

      const responseData = await response.json().catch(() => ({}))

      console.log("[ResultadoPage] Resposta do servidor (dislike):", response.status, responseData)

      if (response.ok && responseData.success !== false) {
        setHasVoted(true)
        setVotedType("dislike")
        setLoadingAction(null) // Liberar o botão imediatamente
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
        
        // SEMPRE marcar como nova imagem gerada (remixar gera imagem NOVA, sempre permite like/dislike)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        // Resetar votação para o novo look ANTES de recarregar
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
                          handleDislike()
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
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-2 text-white font-semibold shadow-lg transition ${
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
                            className={`flex items-center justify-center rounded-xl bg-black py-3 font-semibold text-white text-sm transition shadow-md ${
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
                          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold text-white text-sm transition shadow-md ${
                            isRemixing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                          }`}
                      >
                          <Sparkles className="h-4 w-4" /> Adicionar Acessório
                      </button>
                      {!isRemixing && (
                        <button 
                          onClick={handleRegenerate} 
                          disabled={loadingAction === "remix"} 
                          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm transition shadow-md bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
              <div className="py-12 text-center text-white">Carregando favoritos...</div>
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
                      <div className="relative aspect-square w-full bg-white">
                        <Image
                          src={favorito.imagemUrl}
                          alt={favorito.productName || "Look favorito"}
                          fill
                          className="object-contain"
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
          <div className="w-full max-w-6xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="relative w-full">
                      <img
                        src={selectedFavoriteDetail.imagemUrl}
                        alt={selectedFavoriteDetail.productName || "Look favorito"}
                        className="w-full h-auto object-contain rounded-lg"
                      />
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
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
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
                  <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4 w-full">
                    <h3 className="text-lg font-bold text-white mb-3">Produtos Selecionados</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-white">{selectedFavoriteDetail.productName}</span>
                        {selectedFavoriteDetail.productPrice && (
                          <span className="text-sm font-bold text-yellow-300">{formatPrice(selectedFavoriteDetail.productPrice)}</span>
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

                  {/* Botões Selecionar e Voltar */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (!selectedFavoriteDetail.imagemUrl) {
                          alert("Erro: Imagem do favorito não encontrada.")
                          return
                        }
                        // Salvar a foto para substituir a foto de upload na tela de experimentar
                        sessionStorage.setItem(`photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                        console.log("[ResultadoPage] Foto do favorito salva para tela de experimentar:", selectedFavoriteDetail.imagemUrl)
                        setSelectedFavoriteDetail(null)
                        setShowFavoritesModal(false)
                        // Redirecionar para a tela de experimentar
                        window.location.href = `/${lojistaId}/experimentar`
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
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Imagem Gerada */}
      {showImageDetailModal && currentLook && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-6xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="relative w-full">
                      <img
                        src={currentLook.imagemUrl}
                        alt={currentLook.titulo || "Look gerado"}
                        className="w-full h-auto object-contain rounded-lg"
                      />
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
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-base hover:opacity-90 transition relative overflow-hidden"
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
                  <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4 w-full">
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
                  className="flex items-center justify-center rounded-xl bg-black py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-900"
                >
                  <Download className="h-6 w-6 text-white" />
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
          </div>
        </div>
      )}
    </div>
  )
}

