"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { fetchLojistaData, fetchProdutos } from "@/lib/firebaseQueries"
import type { Produto, LojistaData, GeneratedLook } from "@/lib/types"
import { ExperimentarView } from "@/components/views/ExperimentarView"
import { DisplayView } from "@/components/views/DisplayView"
import { VideoBackground } from "@/components/VideoBackground"
import { useStoreSession } from "@/hooks/useStoreSession"
import { StoreConnectionIndicator } from "@/components/StoreConnectionIndicator"
import toast from "react-hot-toast"
import { normalizeSalesConfig } from "@/lib/utils"

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
  const searchParams = useSearchParams()
  const lojistaId = params?.lojistaId as string
  
  // Verificar se está em modo display
  const isDisplayMode = searchParams?.get("display") === "1"
  
  // Ler orientação da URL (para preview no simulador) ou usar padrão
  const orientationFromUrl = searchParams?.get("displayOrientation") as "horizontal" | "vertical" | null
  
  // Hook para gerenciar conexão com a loja (Fase 9)
  const { isConnected, connectedStoreId, disconnect, connect } = useStoreSession(lojistaId)

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
  
  // Referência para o input de upload de foto
  const photoInputRef = useRef<HTMLInputElement>(null)

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
                salesConfig: normalizeSalesConfig(perfilData.salesConfig),
                descontoRedesSociais: perfilData.descontoRedesSociais || null,
                descontoRedesSociaisExpiraEm: perfilData.descontoRedesSociaisExpiraEm || null,
                displayOrientation: orientationFromUrl || perfilData.displayOrientation || "horizontal",
              }
            }
          }
          
          // Buscar produtos via API (sem cache para sempre ter dados atualizados)
          const produtosResponse = await fetch(`/api/lojista/products?lojistaId=${encodeURIComponent(lojistaId)}`, {
            cache: "no-store",
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

        if (lojistaDb) {
          setLojistaData({
            ...lojistaDb,
            salesConfig: normalizeSalesConfig(lojistaDb.salesConfig),
          })
        }
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
        // Se estiver em modo display, finalizar inicialização após carregar dados
        // Isso garante que lojistaData esteja disponível antes de renderizar DisplayView
        const currentIsDisplayMode = searchParams?.get("display") === "1"
        if (currentIsDisplayMode) {
          setIsInitializing(false)
        }
        // Para modo normal, a verificação de cliente logado vai finalizar a inicialização
      }
    }

    loadData()

    // Verificar se o desconto já foi aplicado anteriormente
    const descontoSalvo = localStorage.getItem(`desconto_aplicado_${lojistaId}`)
    if (descontoSalvo === 'true') {
      setDescontoAplicado(true)
    }
  }, [lojistaId, searchParams])

  // Flag para evitar execução múltipla do useEffect
  const photoLoadedRef = useRef(false)

  // Verificar se cliente está logado e carregar foto do sessionStorage
  // IMPORTANTE: Se estiver em modo display, NÃO verificar login (display funciona sem login)
  useEffect(() => {
    if (!lojistaId) return
    
    // Se estiver em modo display, não precisa de login - pular verificação
    // O isInitializing já será setado como false após carregar os dados no loadData
    if (isDisplayMode) {
      return
    }
    
    // Evitar execução múltipla
    if (photoLoadedRef.current) return

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
        photoLoadedRef.current = true
      } else {
        // TELA 2 (EXPERIMENTAR): Sempre manter a foto original do upload
        // Se selecionou favorito, usar a foto do favorito (substitui original)
        // Caso contrário, restaurar a foto original do cliente
        
        const originalPhoto = sessionStorage.getItem(`original_photo_${lojistaId}`)
        const savedPhotoUrl = sessionStorage.getItem(`photo_${lojistaId}`)
        
        // Verificar se veio de seleção de favorito (foto do favorito deve estar em photo_${lojistaId})
        // Se não houver foto original salva e houver foto salva, pode ser que veio de favorito
        const isFromFavorite = savedPhotoUrl && 
                               (savedPhotoUrl.startsWith('http://') || savedPhotoUrl.startsWith('https://')) &&
                               savedPhotoUrl.includes('storage.googleapis.com') &&
                               (!originalPhoto || originalPhoto !== savedPhotoUrl)
        
        if (isFromFavorite) {
          // Veio de favorito: usar a foto do favorito (substitui original)
          setUserPhotoUrl(savedPhotoUrl)
          console.log("[ExperimentarPage] Foto do favorito carregada (substitui original):", savedPhotoUrl.substring(0, 50))
          // Atualizar foto original para ser a do favorito
          sessionStorage.setItem(`original_photo_${lojistaId}`, savedPhotoUrl)
          photoLoadedRef.current = true
        } else if (originalPhoto) {
          // Restaurar foto original do cliente (tela 2 sempre mostra foto original)
          setUserPhotoUrl(originalPhoto)
          sessionStorage.setItem(`photo_${lojistaId}`, originalPhoto)
          console.log("[ExperimentarPage] Foto original do cliente restaurada:", originalPhoto.substring(0, 50))
          photoLoadedRef.current = true
        } else if (savedPhotoUrl) {
          // Se não houver original, usar a foto salva e salvar como original
          if (savedPhotoUrl.startsWith('blob:')) {
            setUserPhotoUrl(savedPhotoUrl)
            sessionStorage.setItem(`original_photo_${lojistaId}`, savedPhotoUrl)
            console.log("[ExperimentarPage] Foto blob carregada e salva como original:", savedPhotoUrl.substring(0, 50))
            photoLoadedRef.current = true
          } else if (savedPhotoUrl.startsWith('http://') || savedPhotoUrl.startsWith('https://')) {
            setUserPhotoUrl(savedPhotoUrl)
            sessionStorage.setItem(`original_photo_${lojistaId}`, savedPhotoUrl)
            console.log("[ExperimentarPage] Foto HTTP carregada e salva como original:", savedPhotoUrl.substring(0, 50))
            photoLoadedRef.current = true
          } else {
            console.warn("[ExperimentarPage] URL de foto inválida no sessionStorage:", savedPhotoUrl)
            sessionStorage.removeItem(`photo_${lojistaId}`)
            photoLoadedRef.current = true // Marcar como carregado mesmo sem foto válida
          }
        } else {
          // Nenhuma foto encontrada, marcar como carregado
          photoLoadedRef.current = true
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

            return () => {
              clearTimeout(timer);
              // Resetar flag quando o componente desmontar ou lojistaId mudar
              photoLoadedRef.current = false;
            };

          }, [lojistaId, router, isDisplayMode]) // Adicionar isDisplayMode às dependências

  // Validar foto quando userPhotoUrl muda (apenas para URLs blob)
  useEffect(() => {
    if (!userPhotoUrl || !userPhotoUrl.startsWith('blob:')) {
      return // Não validar URLs HTTP/HTTPS ou se não houver foto
    }
    
    // Verificar se a URL blob ainda é válida
    const img = new Image()
    let isMounted = true
    
    img.onload = () => {
      if (isMounted) {
        console.log("[ExperimentarPage] Foto validada com sucesso:", userPhotoUrl.substring(0, 50) + "...")
      }
    }
    
    img.onerror = () => {
      if (isMounted) {
        console.error("[ExperimentarPage] URL blob inválida, removendo:", userPhotoUrl.substring(0, 50) + "...")
        // URL blob inválida, limpar apenas se ainda for a mesma URL
        // Isso evita limpar uma URL que foi substituída enquanto a validação estava em andamento
        const urlToCheck = userPhotoUrl // Capturar URL atual
        setUserPhotoUrl((currentUrl) => {
          // Só limpar se ainda for a mesma URL que estava sendo validada
          if (currentUrl === urlToCheck) {
            sessionStorage.removeItem(`photo_${lojistaId}`)
            return null
          }
          return currentUrl
        })
        setUserPhoto(null)
      }
    }
    
    img.src = userPhotoUrl
    
    return () => {
      // Cleanup: cancelar validação se componente desmontar ou URL mudar
      isMounted = false
    }
  }, [userPhotoUrl, lojistaId])

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
  const applyPhotoUrl = (photoUrl: string) => {
    // limpar url anterior blob
    if (userPhotoUrl && userPhotoUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(userPhotoUrl)
      } catch (err) {
        console.warn("[ExperimentarPage] Erro ao revogar URL anterior:", err)
      }
    }

    setUserPhoto(null)
    setUserPhotoUrl(photoUrl)
    sessionStorage.setItem(`photo_${lojistaId}`, photoUrl)
    sessionStorage.setItem(`original_photo_${lojistaId}`, photoUrl)
    setSelectedProducts([])
    sessionStorage.removeItem(`products_${lojistaId}`)
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) {
      console.warn("[ExperimentarPage] Nenhum arquivo selecionado")
      // Resetar input mesmo se não houver arquivo
      if (event.target) {
        event.target.value = ""
      }
      return
    }
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.error("[ExperimentarPage] Arquivo não é uma imagem:", file.type)
      toast.error("Por favor, selecione um arquivo de imagem válido.")
      if (event.target) {
        event.target.value = ""
      }
      return
    }
    
    console.log("[ExperimentarPage] 📸 Arquivo selecionado:", {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    // Limpar URL anterior se existir (para liberar memória)
    if (userPhotoUrl && userPhotoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(userPhotoUrl)
        console.log("[ExperimentarPage] URL blob anterior revogada")
      } catch (e) {
        console.warn("[ExperimentarPage] Erro ao revogar URL anterior:", e)
      }
    }
    
    // Criar URL do novo arquivo
    const newPhotoUrl = URL.createObjectURL(file)
    console.log("[ExperimentarPage] ✅ Nova URL blob criada:", newPhotoUrl.substring(0, 50) + "...")
    
    // IMPORTANTE: Aplicar a mesma regra do botão de favoritos
    // Quando uma foto é selecionada pelo botão da câmera, ela deve substituir tanto photo quanto original_photo
    // Isso garante que ao voltar da tela 3, a foto selecionada pelo botão da câmera seja mantida
    
      // IMPORTANTE: Atualizar estados de forma síncrona para garantir que a foto seja exibida imediatamente
    // SEMPRE setar userPhoto quando houver um File (incluindo avatares)
    setUserPhoto(file)
    applyPhotoUrl(newPhotoUrl)
    
    console.log("[ExperimentarPage] ✅ File salvo no estado userPhoto:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
    
    console.log("[ExperimentarPage] ✅✅✅ Foto carregada e exibida com sucesso:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      blobUrl: newPhotoUrl.substring(0, 50) + "...",
      userPhotoUrlState: newPhotoUrl.substring(0, 50) + "..."
    })
    
    // Resetar input para permitir selecionar o mesmo arquivo novamente
    // Usar setTimeout para garantir que o estado foi atualizado primeiro
    setTimeout(() => {
      if (event.target) {
        event.target.value = ""
      }
      // Também resetar a referência se existir
      if (photoInputRef.current) {
        photoInputRef.current.value = ""
      }
    }, 100)
  }

  // Remover foto
  const handleRemovePhoto = () => {
    // Confirmar antes de remover
    if (!confirm("Tem certeza que deseja remover a foto? Você precisará fazer upload novamente.")) {
      return
    }
    
    // Limpar URL se for blob (liberar memória)
    if (userPhotoUrl && userPhotoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(userPhotoUrl)
      } catch (e) {
        console.warn("[ExperimentarPage] Erro ao revogar URL:", e)
      }
    }
    
    // Limpar estados
    setUserPhoto(null)
    setUserPhotoUrl(null)
    
    // Limpar sessionStorage
    sessionStorage.removeItem(`photo_${lojistaId}`)
    // Limpar foto original também (permitir novo upload)
    sessionStorage.removeItem(`original_photo_${lojistaId}`)
    console.log("[ExperimentarPage] Foto e foto original removidas do sessionStorage")
    
    // Limpar produtos selecionados quando remove foto
    setSelectedProducts([])
    sessionStorage.removeItem(`products_${lojistaId}`)
    
    // Resetar input
    const input = document.getElementById("photo-upload") as HTMLInputElement
    if (input) {
      input.value = ""
    }
    
    console.log("[ExperimentarPage] Foto removida com sucesso")
  }

  // Trocar foto - permite selecionar nova foto mesmo quando já existe uma
  const handleChangePhoto = () => {
    // Usar a referência primeiro (mais confiável)
    let input = photoInputRef.current
    
    // Se não encontrou pela referência, tentar pelo ID
    if (!input) {
      input = document.getElementById("photo-upload") as HTMLInputElement
    }
    
    // Se ainda não encontrou, tentar pelo querySelector
    if (!input) {
      input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
    }
    
    if (input) {
      // Resetar input antes de abrir para garantir que onChange sempre dispare
      input.value = ""
      
      // Pequeno delay para garantir que o reset foi processado
      setTimeout(() => {
        // Abrir seletor de arquivo
        input?.click()
        console.log("[ExperimentarPage] ✅ Seletor de arquivo aberto para trocar foto")
      }, 10)
    } else {
      console.error("[ExperimentarPage] ❌ Input de upload não encontrado. Tentando criar um temporário...")
      
      // Criar input temporário se não encontrar
      const tempInput = document.createElement('input')
      tempInput.type = 'file'
      tempInput.accept = 'image/*'
      tempInput.style.display = 'none'
      tempInput.onchange = (e) => {
        const target = e.target as HTMLInputElement
        if (target.files?.[0]) {
          // Criar um evento sintético para passar para handlePhotoUpload
          const syntheticEvent = {
            target: target
          } as React.ChangeEvent<HTMLInputElement>
          handlePhotoUpload(syntheticEvent)
        }
        document.body.removeChild(tempInput)
      }
      document.body.appendChild(tempInput)
      tempInput.click()
    }
  }

  // Voltar do modo refinamento para tela 2 normal com foto original
  const handleBackFromRefinement = () => {
    // Restaurar foto original do cliente (tela 2 sempre mostra foto original)
    const originalPhoto = sessionStorage.getItem(`original_photo_${lojistaId}`)
    if (originalPhoto) {
      sessionStorage.setItem(`photo_${lojistaId}`, originalPhoto)
      setUserPhotoUrl(originalPhoto)
      setUserPhoto(null) // Limpar arquivo se houver
      console.log("[ExperimentarPage] Foto original restaurada ao sair do modo refinamento")
    } else {
      // Se não houver original, tentar usar a foto atual
      const currentPhoto = sessionStorage.getItem(`photo_${lojistaId}`)
      if (currentPhoto) {
        setUserPhotoUrl(currentPhoto)
        console.log("[ExperimentarPage] Usando foto atual ao sair do modo refinamento")
      }
    }
    
    // Limpar modo refinamento
    sessionStorage.removeItem(`refine_mode_${lojistaId}`)
    sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
    sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)
    sessionStorage.removeItem(`refined_photo_${lojistaId}`)
    
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

  // Função para comprimir imagem antes do upload
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
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

  // Upload de foto para o backend (usar proxy interno)
  const uploadPersonPhoto = async (file: File): Promise<string> => {
    try {
      console.log("[uploadPersonPhoto] Iniciando upload:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
      
      // Comprimir imagem antes do upload (máximo 1920x1920, qualidade 85%)
      let fileToUpload = file
      
      // Só comprimir se o arquivo for maior que 1MB
      if (file.size > 1024 * 1024) {
        console.log("[uploadPersonPhoto] Comprimindo imagem antes do upload...")
        fileToUpload = await compressImage(file, 1920, 1920, 0.85)
        console.log("[uploadPersonPhoto] Imagem comprimida:", {
          originalSize: file.size,
          compressedSize: fileToUpload.size,
        })
      }
      
      const formData = new FormData()
      formData.append("photo", fileToUpload)
      formData.append("lojistaId", lojistaId)

      console.log("[uploadPersonPhoto] Enviando para /api/upload-photo...")
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      console.log("[uploadPersonPhoto] Resposta recebida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

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
        
        const errorMessage = errorData.error || errorData.message || `Erro ao fazer upload: ${response.status} ${response.statusText}`
        console.error("[uploadPersonPhoto] Erro do servidor:", {
          status: response.status,
          error: errorMessage,
          errorData,
        })
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
        console.error("[uploadPersonPhoto] Erro ao parsear resposta:", parseError)
        throw new Error("Erro ao processar resposta do servidor")
      }

      if (!data.imageUrl) {
        console.error("[uploadPersonPhoto] Resposta sem imageUrl:", data)
        throw new Error("Servidor não retornou URL da imagem")
      }

      console.log("[uploadPersonPhoto] ✅ Upload concluído:", data.imageUrl.substring(0, 50) + "...")
      return data.imageUrl
    } catch (error: any) {
      console.error("[uploadPersonPhoto] Erro completo:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
      throw error
    }
  }

  // Refinar look (adicionar acessórios)
  const handleRefine = async () => {
    if (!refineBaseImageUrl || selectedProducts.length === 0) {
      toast.error("Selecione um produto para adicionar ao look")
      return
    }

    if (selectedProducts.length > 1) {
      toast.error("Em modo de refinamento, você pode selecionar apenas 1 produto.")
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
        // Usar o novo compositionId retornado pela API (se disponível) ou o original
        const newCompositionId = responseData.compositionId || refineCompositionId || null;
        const refinedLook: GeneratedLook = {
          id: `refined-${Date.now()}`,
          titulo: "Look Refinado",
          imagemUrl: responseData.refinedImageUrl,
          produtoNome: selectedProducts.map(p => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: newCompositionId, // Usar novo ID se disponível
        }

        // Salvar o look refinado
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([refinedLook]))
        // Manter a última foto gerada (refinada) na tela de adicionar acessório
        // Não substituir a foto original do upload
        sessionStorage.setItem(`refined_photo_${lojistaId}`, responseData.refinedImageUrl)
        // Manter a foto base para possível refinamento futuro
        sessionStorage.setItem(`photo_${lojistaId}`, refineBaseImageUrl)
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))

        // Limpar modo de refinamento
        sessionStorage.removeItem(`refine_mode_${lojistaId}`)
        sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
        sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)

        // IMPORTANTE: Preservar conexão com display ao navegar para resultado
        // Garantir que target_display e connected_store_id sejam mantidos
        const currentTargetDisplay = sessionStorage.getItem("target_display")
        const currentConnectedStoreId = sessionStorage.getItem("connected_store_id")
        
        if (currentTargetDisplay) {
          console.log("[handleRefine] Preservando conexão com display:", {
            targetDisplay: currentTargetDisplay,
            connectedStoreId: currentConnectedStoreId,
          })
          // Os valores já estão no sessionStorage, não precisamos fazer nada
          // Apenas garantir que não serão limpos
        }

        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        console.log("[handleRefine] Navegando para resultado com look refinado:", {
          compositionId: newCompositionId,
          imageUrl: responseData.refinedImageUrl.substring(0, 50) + "...",
          targetDisplay: currentTargetDisplay,
        })
        
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
        // Se tiver File (incluindo avatares), sempre fazer upload
        console.log("[handleVisualize] 📤 Fazendo upload do File:", {
          fileName: userPhoto.name,
          fileSize: userPhoto.size,
          fileType: userPhoto.type,
        })
        personImageUrl = await uploadPersonPhoto(userPhoto)
      } else if (userPhotoUrl) {
        // Se não tiver File mas tiver URL blob, tentar converter para File
        if (userPhotoUrl.startsWith('blob:')) {
          console.warn("[handleVisualize] ⚠️ URL blob sem File, tentando converter...")
          try {
            const response = await fetch(userPhotoUrl)
            const blob = await response.blob()
            const fileName = `avatar-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
            const file = new File([blob], fileName, { type: blob.type || 'image/png' })
            personImageUrl = await uploadPersonPhoto(file)
          } catch (blobError) {
            console.error("[handleVisualize] Erro ao converter blob para File:", blobError)
            throw new Error("Erro ao processar foto. Tente selecionar novamente.")
          }
        } else {
          // URL HTTP/HTTPS (já foi enviada anteriormente)
          personImageUrl = userPhotoUrl
        }
      } else {
        throw new Error("Foto não encontrada")
      }
      console.log("[handleVisualize] ✅ Foto enviada:", personImageUrl?.substring(0, 50) + "...")

      // 2. Preparar dados para geração
      const productImageUrls = selectedProducts
        .map((p) => p.imagemUrl)
        .filter(Boolean) as string[]

      if (productImageUrls.length === 0) {
        throw new Error("Nenhum produto válido selecionado")
      }

      // Buscar clienteId do localStorage
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      const clienteData = stored ? JSON.parse(stored) : null
      const clienteId = clienteData?.clienteId || null

      // Obter URL do backend (paineladm)
      const backendUrl = getBackendUrl()

      // 3. Gerar imagem usando a nova API do paineladm (Gemini + Imagen)
        // NOTA: Transmissão para display agora é manual via botão, não automática
      const payload = {
        lojistaId,
        customerId: clienteId,
        userImageUrl: personImageUrl,
        productImageUrl: productImageUrls.length === 1 ? productImageUrls[0] : productImageUrls,
          broadcast: false, // Transmissão manual via botão
      }

      console.log("[handleVisualize] Chamando API do paineladm:", `${backendUrl}/api/ai/generate`)

      // Adicionar timeout e melhor tratamento de erros
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos de timeout

      let response: Response
      try {
        response = await fetch(`${backendUrl}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
          signal: controller.signal,
      })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // Tratar diferentes tipos de erro de fetch
        if (fetchError.name === "AbortError") {
          throw new Error("Tempo de resposta excedido. O servidor está demorando muito para processar. Tente novamente.")
        }
        
        if (fetchError.message?.includes("fetch failed") || fetchError.message?.includes("Failed to fetch")) {
          throw new Error(`Não foi possível conectar com o servidor. Verifique se o painel está rodando em ${backendUrl}`)
        }
        
        if (fetchError.message?.includes("ECONNREFUSED") || fetchError.message?.includes("NetworkError")) {
          throw new Error(`Servidor não está respondendo. Verifique se o painel está rodando em ${backendUrl}`)
        }
        
        throw new Error(`Erro de conexão: ${fetchError.message || "Erro desconhecido"}`)
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
        
        // Mensagens mais amigáveis para diferentes códigos de erro
        let errorMessage = errorData.error || `Erro ao gerar composição (${response.status})`
        
        if (response.status === 500) {
          errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes."
        } else if (response.status === 503) {
          errorMessage = "Serviço temporariamente indisponível. Tente novamente em alguns instantes."
        } else if (response.status === 429) {
          errorMessage = "Muitas requisições. Aguarde alguns instantes antes de tentar novamente."
        } else if (response.status === 400) {
          errorMessage = errorData.error || "Dados inválidos. Verifique se selecionou uma foto e produtos."
        }
        
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // 4. Salvar resultados e navegar
      // NOTA: Transmissão para display agora é manual via botão, não automática
      if (responseData.imageUrl) {

        // Formatar como look para compatibilidade com a tela de resultado
        const generatedLook = {
          id: responseData.compositionId || `generated-${Date.now()}`,
          titulo: "Look Gerado",
          imagemUrl: responseData.imageUrl,
          produtoNome: selectedProducts.map((p) => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: responseData.compositionId || null,
        }

        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
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
      const errorMessage = error.message || "Erro ao gerar looks. Tente novamente."
      setGenerationError(errorMessage)
      toast.error(errorMessage)
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
            toast.success("Link copiado para a área de transferência!")
          } catch (clipboardError) {
            console.error("Erro ao copiar link:", clipboardError)
            toast.error(`Erro ao copiar. Link: ${appLink}`)
          }
        }
      }
    } else {
      // Fallback: copiar para área de transferência
      try {
        await navigator.clipboard.writeText(appLink)
        toast.success("Link copiado para a área de transferência!")
      } catch (error) {
        console.error("Erro ao copiar link:", error)
        toast.error(`Erro ao copiar. Link: ${appLink}`)
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
      {/* Vídeo de fundo (estático se conectado ao display, animado se não conectado) */}
      <VideoBackground videoSrc="/video2tela2.mp4" />
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

  // Se estiver em modo display, renderizar DisplayView
  if (isDisplayMode) {
    return <DisplayView lojistaData={lojistaData} />
  }

  // Renderizar modo normal (celular)
  return (
    <>
      {/* Indicador de conexão com a loja (Fase 9) */}
      <StoreConnectionIndicator
        isConnected={isConnected}
        storeName={lojistaData?.nome || undefined}
        onDisconnect={disconnect}
      />
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
      photoInputRef={photoInputRef}
      isDisplayConnected={isConnected && connectedStoreId === lojistaId}
      onDisplayConnect={(storeId, targetDisplay) => connect(storeId, targetDisplay)}
    />
    </>
  )
}
