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
import { getClienteSessionWithFallback } from "@/lib/session-client"

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
          const sortedProducts = produtosDb.sort((a, b) => {
            const catA = (a.categoria || "").toLowerCase()
            const catB = (b.categoria || "").toLowerCase()
            if (catA !== catB) return catA.localeCompare(catB, "pt-BR")
            return (a.nome || "").toLowerCase().localeCompare((b.nome || "").toLowerCase(), "pt-BR")
          })
          console.log("[ExperimentarPage] Produtos carregados:", sortedProducts.length)
          setCatalog(sortedProducts)
        } else {
          console.warn("[ExperimentarPage] Nenhum produto encontrado para lojistaId:", lojistaId)
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

    const checkAuthAndFinalize = async () => {
      // Usar getClienteSessionWithFallback para ler do cookie HttpOnly primeiro
      const clienteData = await getClienteSessionWithFallback(lojistaId)
      if (!clienteData) {
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
        
        // IMPORTANTE: Carregar produtos selecionados quando estiver em modo refine (Trocar Produto)
        // Esses produtos foram selecionados para gerar o último look e devem aparecer como selecionados
        const storedProducts = sessionStorage.getItem(`products_${lojistaId}`)
        if (storedProducts) {
          try {
            const parsedProducts = JSON.parse(storedProducts)
            if (parsedProducts && Array.isArray(parsedProducts) && parsedProducts.length > 0) {
              setSelectedProducts(parsedProducts)
              console.log("[ExperimentarPage] Produtos selecionados carregados para troca:", parsedProducts.length)
            }
          } catch (error) {
            console.error("[ExperimentarPage] Erro ao carregar produtos selecionados:", error)
          }
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
        // EXCEÇÃO: Não limpar se estiver em modo refine (Trocar Produto)
        const refineMode = sessionStorage.getItem(`refine_mode_${lojistaId}`)
        if (refineMode !== "true") {
          // Os produtos precisam ser selecionados novamente apenas se não estiver em modo refine
          sessionStorage.removeItem(`products_${lojistaId}`)
          setSelectedProducts([])
        }
      }
    }
    
    // Adiciona um pequeno delay para garantir que os dados da loja comecem a carregar primeiro
    // Isso ajuda a evitar um flash rápido da tela de loading se a verificação for muito rápida
    const timer = setTimeout(() => {
      checkAuthAndFinalize().catch((error) => {
        console.error("[ExperimentarPage] Erro ao verificar autenticação:", error)
        router.push(`/${lojistaId}/login`)
      })
    }, 100);

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
      const clienteData = await getClienteSessionWithFallback(lojistaId)
      if (!clienteData) return

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
    console.log("[ExperimentarPage] Filtrando produtos - catalog:", catalog.length, "activeCategory:", activeCategory)
    let filtered = activeCategory === "Todos"
      ? catalog
      : catalog.filter((item) => item.categoria === activeCategory)
    console.log("[ExperimentarPage] Produtos filtrados:", filtered.length)

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

    // Função auxiliar para verificar se é categoria permitida múltipla (Cosméticos e Joias)
    const isCategoriaPermitidaMultipla = (categoria: string | null | undefined) => {
      const cat = categoria?.toLowerCase() || ""
      return cat.includes("cosmético") || cat.includes("cosmetico") || cat.includes("joia") || cat.includes("joias")
    }

    // Função auxiliar para verificar se produtos são da mesma categoria
    const isMesmaCategoria = (cat1: string | null | undefined, cat2: string | null | undefined) => {
      const c1 = cat1?.toLowerCase() || ""
      const c2 = cat2?.toLowerCase() || ""
      return c1 === c2 && c1 !== ""
    }

    // Lógica única para modo normal e modo refinamento (Trocar Produto)
    // Máximo de 2 produtos simultâneos
    // Verificar se já tem 2 produtos selecionados
    if (selectedProducts.length >= 2) {
      // Já tem 2 produtos: verificar se pode substituir ou precisa desmarcar
      if (!isCategoriaPermitidaMultipla(produto.categoria)) {
        const existingProductInCategory = selectedProducts.find(
          (p) => isMesmaCategoria(p.categoria, produto.categoria)
        )

        if (existingProductInCategory) {
          // Mesma categoria: permitir substituir automaticamente (remove o antigo e adiciona o novo)
          const updated = selectedProducts.filter((p) => !isMesmaCategoria(p.categoria, produto.categoria))
          updated.push(produto)
          setSelectedProducts(updated)
          sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(updated))
          setCategoryWarning(null)
          toast.success("Produto substituído com sucesso!", {
            duration: 2000,
            icon: "✅",
          })
          return
        } else {
          // Categoria diferente e já tem 2 produtos: avisar que precisa desmarcar
          toast.error("Você já selecionou 2 produtos. Desmarque um produto antes de selecionar outro de uma categoria diferente.", {
            duration: 4000,
            icon: "⚠️",
          })
          setCategoryWarning(
            "Você já selecionou 2 produtos. Desmarque um produto antes de selecionar outro de uma categoria diferente."
          )
          setTimeout(() => setCategoryWarning(null), 5000)
          return
        }
      } else {
        // É categoria permitida múltipla (Cosméticos/Joias) mas já tem 2 produtos: avisar
        toast.error("Você já selecionou 2 produtos. Desmarque um produto antes de selecionar outro.", {
          duration: 4000,
          icon: "⚠️",
        })
        setCategoryWarning(
          "Você já selecionou 2 produtos. Desmarque um produto antes de selecionar outro."
        )
        setTimeout(() => setCategoryWarning(null), 5000)
        return
      }
    }
    
    // Se há espaço disponível (menos de 2 produtos)
    // Verificar se já existe produto da mesma categoria (exceto Cosméticos e Joias)
    if (!isCategoriaPermitidaMultipla(produto.categoria)) {
      const existingProductInCategory = selectedProducts.find(
        (p) => isMesmaCategoria(p.categoria, produto.categoria)
      )

      if (existingProductInCategory) {
        // Mesma categoria: permitir substituir automaticamente (remove o antigo e adiciona o novo)
        const updated = selectedProducts.filter((p) => !isMesmaCategoria(p.categoria, produto.categoria))
        updated.push(produto)
        setSelectedProducts(updated)
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(updated))
        setCategoryWarning(null)
        toast.success("Produto substituído com sucesso!", {
          duration: 2000,
          icon: "✅",
        })
        return
      }
    }
    // Se não há produto da mesma categoria ou é categoria permitida múltipla, permitir adicionar
    // (continua para adicionar o produto no final da função)

    // Adicionar novo produto
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

  // Helper para garantir que nunca enviamos blob URL ao servidor
  const ensureHttpUrl = async (url: string): Promise<string> => {
    // Se já é HTTP/HTTPS, retornar direto
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Se é blob ou data URL, precisa converter
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      console.warn("[ensureHttpUrl] ⚠️ Detectado blob/data URL, convertendo para HTTP...");
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const fileName = `photo-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });
        
        // Usar a função uploadPersonPhoto que está logo abaixo
        return await uploadPersonPhoto(file);
      } catch (error: any) {
        console.error("[ensureHttpUrl] ❌ Erro ao converter blob/data URL:", error);
        throw new Error("Erro ao processar foto. Por favor, faça upload novamente.");
      }
    }
    
    // Caso inesperado
    throw new Error("Formato de foto inválido. Por favor, faça upload novamente.");
  };

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
      
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
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

  // Refinar look (trocar produto) - Usa a mesma lógica de geração normal, mas com foto original
  const handleRefine = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Selecione pelo menos 1 produto para trocar no look")
      return
    }

    // IMPORTANTE: No modo refine, sempre usar a foto ORIGINAL do upload (não a imagem gerada)
    // Isso garante que a geração seja feita do zero com os novos produtos selecionados
    const originalPhotoUrl = sessionStorage.getItem(`original_photo_${lojistaId}`)
    
    if (!originalPhotoUrl) {
      toast.error("Foto original não encontrada. Por favor, faça upload novamente.")
      return
    }

    try {
      setIsGenerating(true)
      setGenerationError(null)

      // Buscar clienteId da sessão
      const clienteData = await getClienteSessionWithFallback(lojistaId)
      const clienteId = clienteData?.clienteId || null

      // Preparar foto original para envio
      let personImageUrl: string
      
      if (originalPhotoUrl.startsWith('blob:') || originalPhotoUrl.startsWith('data:')) {
        // Se for blob ou data URL, converter para File e fazer upload
        try {
          console.log("[handleRefine] Convertendo blob/data URL para File...");
          
          // PHASE 25: Melhorar timeout e tratamento de erros para blob URLs no mobile
          const fetchController = new AbortController();
          const fetchTimeout = setTimeout(() => fetchController.abort(), 30000); // 30 segundos para fetch (mobile pode ser mais lento)
          
          let response: Response;
          try {
            response = await fetch(originalPhotoUrl, { 
              signal: fetchController.signal,
              cache: 'no-cache',
              mode: 'cors',
            });
            clearTimeout(fetchTimeout);
          } catch (fetchError: any) {
            clearTimeout(fetchTimeout);
            
            // PHASE 25: Melhor tratamento de erros de rede no mobile
            if (fetchError.name === 'AbortError') {
              throw new Error("Tempo de resposta excedido ao carregar a foto. Tente fazer upload novamente.");
            }
            
            if (fetchError.message?.includes('fetch failed') || 
                fetchError.message?.includes('Failed to fetch') ||
                fetchError.message?.includes('NetworkError') ||
                fetchError.message?.includes('Network request failed') ||
                fetchError.message?.includes('ERR_FILE_NOT_FOUND')) {
              throw new Error("Não foi possível carregar a foto. A foto pode ter expirado. Por favor, faça upload novamente.");
            }
            
            if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
              throw new Error("Servidor não está respondendo. Tente novamente em alguns instantes.");
            }
            
            throw new Error(`Erro ao carregar foto: ${fetchError.message || "Erro desconhecido. Tente fazer upload novamente."}`);
          }
          
          if (!response.ok) {
            // PHASE 25: Se o blob não foi encontrado (404), a foto expirou
            if (response.status === 404) {
              throw new Error("A foto não foi encontrada. Por favor, faça upload novamente.");
            }
            throw new Error(`Erro ao carregar foto: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          if (!blob || blob.size === 0) {
            throw new Error("Foto vazia ou inválida. Tente fazer upload novamente.");
          }
          
          const fileName = `original-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
          const file = new File([blob], fileName, { type: blob.type || 'image/png' })
          
          console.log("[handleRefine] Fazendo upload da foto convertida...");
          personImageUrl = await uploadPersonPhoto(file)
          console.log("[handleRefine] ✅ Foto original (blob/data) convertida e enviada:", personImageUrl?.substring(0, 50) + "...")
          } catch (blobError: any) {
            console.error("[handleRefine] Erro ao converter blob/data original para File:", {
              message: blobError.message,
              name: blobError.name,
              stack: blobError.stack,
            });
            
            // Tentar usar diretamente APENAS se for HTTP (NUNCA blob)
            if (originalPhotoUrl.startsWith('http')) {
              console.warn("[handleRefine] ⚠️ Usando URL HTTP diretamente como fallback");
              personImageUrl = originalPhotoUrl
            } else {
              // NUNCA fazer fallback com blob URL - lançar erro informativo
              throw new Error("Erro ao processar foto original. Por favor, faça upload novamente.");
            }
          }
      } else {
        // URL HTTP/HTTPS (já foi enviada anteriormente)
        personImageUrl = originalPhotoUrl
        console.log("[handleRefine] ✅ Usando foto original (HTTP):", personImageUrl?.substring(0, 50) + "...")
      }

      // VALIDAÇÃO FINAL: Garantir que personImageUrl NUNCA é blob URL antes de enviar
      if (personImageUrl.startsWith('blob:') || personImageUrl.startsWith('data:')) {
        console.warn("[handleRefine] ⚠️ VALIDAÇÃO: personImageUrl ainda é blob/data, convertendo agora...");
        personImageUrl = await ensureHttpUrl(personImageUrl);
      }

      // Preparar dados para geração (mesma lógica do handleVisualize)
      const productIds = selectedProducts.map((p) => p.id).filter(Boolean)

      if (productIds.length === 0) {
        throw new Error("Nenhum produto válido selecionado")
      }

      // Preparar payload para API de geração normal
      // MASTER PROMPT: UNIFICAÇÃO DE QUALIDADE VISUAL - Aplicar protocolo Remix Universal
      // Gerar seed aleatório para evitar resultados "médios/plásticos"
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      // Prompt base de alta qualidade para todas as gerações
      const baseScenePrompt = "Professional fashion photography, confident pose, natural lighting, looking at camera, high detail";
      
      const payload = {
        personImageUrl: personImageUrl,
        productIds: productIds,
        lojistaId: lojistaId,
        customerId: clienteId,
        original_photo_url: personImageUrl, // PHASE 13: Sempre usar foto original
        options: {
          skipWatermark: true,
          lookType: "creative", // Sempre usar Look Criativo para multi-produto
          // MASTER PROMPT: Ativar protocolo Remix Universal para qualidade editorial
          gerarNovoLook: true, // Força reconstrução de cena com melhor integração de luz
          seed: randomSeed, // Seed aleatório para variar e evitar resultados "médios"
        },
        // MASTER PROMPT: Scene prompts dinâmico para todas as gerações
        scenePrompts: [baseScenePrompt],
        // PHASE 25: Instrução explícita para evitar cenários noturnos
        sceneInstructions: "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
      }

      console.log("[handleRefine] PHASE 13: Enviando para /api/generate-looks com foto ORIGINAL:", {
        hasOriginalPhoto: !!personImageUrl,
        originalPhotoUrl: personImageUrl?.substring(0, 50) + "...",
        totalProducts: productIds.length,
        productIds,
      })

      // PHASE 25: Melhorar timeout e tratamento de erros para mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeoutMs = isMobile ? 180000 : 120000; // 3 minutos mobile, 2 minutos desktop
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      let response: Response;
      try {
        response = await fetch("/api/generate-looks", {
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
        clearTimeout(timeoutId);
        
        // PHASE 25: Melhor tratamento de erros de rede no mobile
        if (fetchError.name === "AbortError") {
          throw new Error("Tempo de resposta excedido. O processamento está demorando mais que o esperado. Tente novamente.");
        }
        
        if (fetchError.message?.includes("fetch failed") || 
            fetchError.message?.includes("Failed to fetch") ||
            fetchError.message?.includes("NetworkError") ||
            fetchError.message?.includes("Network request failed")) {
          throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
        }
        
        throw new Error(`Erro ao processar foto: ${fetchError.message || "Erro desconhecido. Tente novamente."}`);
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = errorData.error || errorData.message || `Erro ao gerar look (${response.status})`;
        
        // PHASE 25: Melhorar mensagens de erro
        if (response.status === 500) {
          errorMessage = "Erro interno do servidor. Tente novamente em alguns instantes.";
        } else if (response.status === 503) {
          errorMessage = "Serviço temporariamente indisponível. Tente novamente em alguns instantes.";
        } else if (response.status === 429) {
          errorMessage = "Muitas requisições. Aguarde alguns instantes antes de tentar novamente.";
        } else if (response.status === 400) {
          errorMessage = errorData.error || errorData.message || "Dados inválidos. Verifique se selecionou uma foto e produtos.";
        }
        
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // PHASE 27: Verificar se a resposta é assíncrona (202 Accepted com jobId)
      if (response.status === 202 && responseData.jobId) {
        console.log("[handleRefine] PHASE 27: Job criado, iniciando polling:", responseData.jobId)
        
        // Salvar jobId e reservationId para uso posterior
        const jobId = responseData.jobId
        const reservationId = responseData.reservationId
        
        // Função de polling para verificar status do Job
        const pollJobStatus = async (): Promise<any> => {
          const maxPollingTime = 180000 // 3 minutos máximo
          const pollInterval = 2000 // 2 segundos entre polls
          const startTime = Date.now()
          
          while (Date.now() - startTime < maxPollingTime) {
            try {
              const statusResponse = await fetch(`/api/jobs/${jobId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: 'no-cache',
              })
              
              if (!statusResponse.ok) {
                throw new Error(`Erro ao verificar status: ${statusResponse.status}`)
              }
              
              const statusData = await statusResponse.json()
              console.log("[handleRefine] PHASE 27: Status do Job:", statusData.status)
              
              if (statusData.status === "COMPLETED") {
                // Job concluído com sucesso
                if (statusData.result?.imageUrl || statusData.result?.compositionId) {
                  return {
                    success: true,
                    imageUrl: statusData.result.imageUrl,
                    compositionId: statusData.result.compositionId,
                    reservationId,
                  }
                } else {
                  throw new Error("Job concluído mas sem URL de imagem")
                }
              } else if (statusData.status === "FAILED") {
                // Job falhou
                throw new Error(statusData.error || "Erro ao gerar imagem")
              } else if (statusData.status === "PROCESSING" || statusData.status === "PENDING") {
                // Ainda processando, continuar polling
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              } else {
                // Status desconhecido
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              }
            } catch (pollError: any) {
              console.error("[handleRefine] PHASE 27: Erro no polling:", pollError)
              // Se o erro for de rede, continuar tentando
              if (pollError.message?.includes("fetch") || pollError.message?.includes("network")) {
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              }
              throw pollError
            }
          }
          
          // Timeout atingido
          throw new Error("Tempo de processamento excedido. A geração está demorando mais que o esperado.")
        }
        
        // Iniciar polling
        const pollResult = await pollJobStatus()
        
        // Salvar resultados e navegar
        const generatedLook = {
          id: pollResult.compositionId || `generated-${Date.now()}`,
          titulo: "Look Gerado",
          imagemUrl: pollResult.imageUrl,
          produtoNome: selectedProducts.map((p) => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: pollResult.compositionId || null,
        }

        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
        // Salvar reservationId para confirmação de visualização
        if (reservationId) {
          sessionStorage.setItem(`reservation_${lojistaId}`, reservationId)
          sessionStorage.setItem(`job_${lojistaId}`, jobId)
        }
        
        // IMPORTANTE: Preservar a foto original (não substituir pela gerada)
        // A foto original deve permanecer para futuras trocas de produto
        if (originalPhotoUrl) {
          sessionStorage.setItem(`original_photo_${lojistaId}`, originalPhotoUrl)
          console.log("[handleRefine] ✅ Foto original preservada para futuras trocas")
        }

        // Limpar modo de refinamento
        sessionStorage.removeItem(`refine_mode_${lojistaId}`)
        sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
        sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)

        // IMPORTANTE: Preservar conexão com display ao navegar para resultado
        const currentTargetDisplay = sessionStorage.getItem("target_display")
        const currentConnectedStoreId = sessionStorage.getItem("connected_store_id")
        
        if (currentTargetDisplay) {
          console.log("[handleRefine] Preservando conexão com display:", {
            targetDisplay: currentTargetDisplay,
            connectedStoreId: currentConnectedStoreId,
          })
        }

        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        console.log("[handleRefine] ✅ Look gerado com sucesso, navegando para resultado")
        
        // Navegar para resultado
        router.push(`/${lojistaId}/resultado`)
        return
      }

      // Compatibilidade com resposta síncrona antiga
      if (responseData.looks && Array.isArray(responseData.looks) && responseData.looks.length > 0) {
        // Salvar looks gerados
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify(responseData.looks))
        
        // Salvar produtos selecionados
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
        
        // IMPORTANTE: Preservar a foto original (não substituir pela gerada)
        // A foto original deve permanecer para futuras trocas de produto
        if (originalPhotoUrl) {
          sessionStorage.setItem(`original_photo_${lojistaId}`, originalPhotoUrl)
          console.log("[handleRefine] ✅ Foto original preservada para futuras trocas")
        }

        // Limpar modo de refinamento
        sessionStorage.removeItem(`refine_mode_${lojistaId}`)
        sessionStorage.removeItem(`refine_baseImage_${lojistaId}`)
        sessionStorage.removeItem(`refine_compositionId_${lojistaId}`)

        // IMPORTANTE: Preservar conexão com display ao navegar para resultado
        const currentTargetDisplay = sessionStorage.getItem("target_display")
        const currentConnectedStoreId = sessionStorage.getItem("connected_store_id")
        
        if (currentTargetDisplay) {
          console.log("[handleRefine] Preservando conexão com display:", {
            targetDisplay: currentTargetDisplay,
            connectedStoreId: currentConnectedStoreId,
          })
        }

        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        
        console.log("[handleRefine] ✅ Look gerado com sucesso, navegando para resultado:", {
          looksCount: responseData.looks.length,
          targetDisplay: currentTargetDisplay,
        })
        
        // Navegar para resultado
        router.push(`/${lojistaId}/resultado`)
      } else {
        throw new Error("Nenhum look foi gerado")
      }
    } catch (error: any) {
      console.error("[handleRefine] Erro:", error)
      const errorMessage = error.message || "Erro ao gerar look refinado. Tente novamente."
      setGenerationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  // Gerar looks (modo normal e modo refine usam a MESMA lógica de geração)
  const handleVisualize = async () => {
    if ((!userPhoto && !userPhotoUrl) || selectedProducts.length === 0) return

    try {
      setIsGenerating(true)
      setGenerationError(null)

      // PHASE 11 FIX: SEMPRE usar a foto ORIGINAL (não a foto gerada anteriormente)
      // Isso evita o "efeito colagem" quando adiciona acessórios
      let personImageUrl: string
      
      // Prioridade 1: Buscar foto original do sessionStorage
      const originalPhotoUrl = sessionStorage.getItem(`original_photo_${lojistaId}`)
      
      if (originalPhotoUrl) {
        // Se tiver foto original salva, usar ela (pode ser blob ou HTTP)
        console.log("[handleVisualize] 📸 Usando foto ORIGINAL do sessionStorage:", originalPhotoUrl.substring(0, 50) + "...")
        
        if (originalPhotoUrl.startsWith('blob:')) {
          // Se for blob, converter para File e fazer upload
          // NUNCA enviar blob URL diretamente ao servidor
          try {
            const response = await fetch(originalPhotoUrl)
            const blob = await response.blob()
            const fileName = `original-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
            const file = new File([blob], fileName, { type: blob.type || 'image/png' })
            personImageUrl = await uploadPersonPhoto(file)
            console.log("[handleVisualize] ✅ Foto original (blob) convertida e enviada:", personImageUrl?.substring(0, 50) + "...")
          } catch (blobError: any) {
            console.error("[handleVisualize] Erro ao converter blob original para File:", blobError)
            // NUNCA fazer fallback com blob URL - lançar erro
            throw new Error("Erro ao processar foto original. Por favor, faça upload novamente.")
          }
        } else {
          // URL HTTP/HTTPS (já foi enviada anteriormente)
          personImageUrl = originalPhotoUrl
          console.log("[handleVisualize] ✅ Usando foto original (HTTP):", personImageUrl?.substring(0, 50) + "...")
        }
      } else if (userPhoto) {
        // Fallback: Se não tiver original, usar File atual (primeira vez)
        console.log("[handleVisualize] 📤 Fazendo upload do File (primeira vez):", {
          fileName: userPhoto.name,
          fileSize: userPhoto.size,
          fileType: userPhoto.type,
        })
        personImageUrl = await uploadPersonPhoto(userPhoto)
        // Salvar como original para próximas gerações
        sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
        console.log("[handleVisualize] ✅ Foto salva como original:", personImageUrl?.substring(0, 50) + "...")
      } else if (userPhotoUrl) {
        // Fallback: Se não tiver original nem File, usar URL atual
        if (userPhotoUrl.startsWith('blob:') || userPhotoUrl.startsWith('data:')) {
          console.warn("[handleVisualize] ⚠️ URL blob/data sem File, tentando converter...")
          try {
            // PHASE 25: Melhorar timeout e tratamento de erros para mobile
            // Mobile pode ter conexão mais lenta, aumentar timeout
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const fetchTimeoutMs = isMobile ? 30000 : 15000; // 30s mobile, 15s desktop
            
            const fetchController = new AbortController();
            const fetchTimeout = setTimeout(() => fetchController.abort(), fetchTimeoutMs);
            
            let response: Response;
            try {
              // PHASE 25: Adicionar headers e melhor configuração para mobile
              response = await fetch(userPhotoUrl, { 
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
              
              // PHASE 25: Melhor tratamento de erros de rede no mobile
              if (fetchError.message?.includes('fetch failed') || 
                  fetchError.message?.includes('Failed to fetch') ||
                  fetchError.message?.includes('NetworkError') ||
                  fetchError.message?.includes('Network request failed')) {
                throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
              }
              
              if (fetchError.message?.includes('CORS') || fetchError.message?.includes('cross-origin')) {
                throw new Error("Erro ao acessar a foto. Tente selecionar novamente.");
              }
              
              throw fetchError;
            }
            
            if (!response.ok) {
              throw new Error(`Erro ao carregar foto: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob()
            if (!blob || blob.size === 0) {
              throw new Error("Foto vazia ou inválida. Tente selecionar novamente.");
            }
            
            const fileName = `avatar-${Date.now()}.${blob.type.split('/')[1] || 'png'}`
            const file = new File([blob], fileName, { type: blob.type || 'image/png' })
            personImageUrl = await uploadPersonPhoto(file)
            // Salvar como original
            sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
            sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl)
          } catch (blobError: any) {
            console.error("[handleVisualize] Erro ao converter blob/data para File:", {
              message: blobError.message,
              name: blobError.name,
              stack: blobError.stack,
            });
            
            // PHASE 25: Melhor tratamento de erros de blob no mobile
            if (blobError.name === 'AbortError') {
              throw new Error("Tempo de resposta excedido ao processar a foto. Tente selecionar novamente.");
            }
            
            if (blobError.message?.includes("fetch failed") || 
                blobError.message?.includes("Failed to fetch") ||
                blobError.message?.includes("NetworkError")) {
              throw new Error("Erro de conexão ao processar a foto. Verifique sua internet e tente novamente.");
            }
            
            // Se o erro já tem uma mensagem específica, usar ela
            if (blobError.message && !blobError.message.includes("Erro ao processar foto")) {
              throw blobError;
            }
            
            throw new Error(blobError.message || "Erro ao processar foto. Tente selecionar novamente.")
          }
        } else {
          // URL HTTP/HTTPS (já foi enviada anteriormente)
          personImageUrl = userPhotoUrl
          // Salvar como original se não estiver salva
          if (!originalPhotoUrl) {
            sessionStorage.setItem(`original_photo_${lojistaId}`, personImageUrl)
          }
        }
      } else {
        throw new Error("Foto não encontrada")
      }
      
      // VALIDAÇÃO FINAL: Garantir que personImageUrl NUNCA é blob URL antes de enviar
      if (personImageUrl.startsWith('blob:') || personImageUrl.startsWith('data:')) {
        console.warn("[handleVisualize] ⚠️ VALIDAÇÃO: personImageUrl ainda é blob/data, convertendo agora...");
        personImageUrl = await ensureHttpUrl(personImageUrl);
      }
      
      console.log("[handleVisualize] ✅ Foto final enviada:", personImageUrl?.substring(0, 50) + "...")

      // 2. Preparar dados para geração
      // PHASE 11-B FIX: Enviar TODOS os produtos selecionados (não apenas o primeiro)
      const productIds = selectedProducts.map((p) => p.id).filter(Boolean)

      if (productIds.length === 0) {
        throw new Error("Nenhum produto válido selecionado")
      }

      // Buscar clienteId da sessão
      const clienteData = await getClienteSessionWithFallback(lojistaId)
      const clienteId = clienteData?.clienteId || null
      const clienteNome = clienteData?.nome || null

      // PHASE 13: Usar a API correta (/api/generate-looks) e enviar original_photo_url explicitamente
      // MASTER PROMPT: UNIFICAÇÃO DE QUALIDADE VISUAL - Aplicar protocolo Remix Universal
      // Gerar seed aleatório para evitar resultados "médios/plásticos"
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      // Prompt base de alta qualidade para todas as gerações
      const baseScenePrompt = "Professional fashion photography, confident pose, natural lighting, looking at camera, high detail";
      
      const payload = {
        original_photo_url: personImageUrl, // PHASE 13: Sempre enviar como original_photo_url (Source of Truth)
        personImageUrl: personImageUrl, // Também enviar como personImageUrl para compatibilidade
        productIds: productIds, // TODOS os produtos selecionados
        lojistaId,
        customerId: clienteId,
        customerName: clienteNome, // Adicionar customerName para o Radar funcionar
        options: {
          quality: "high",
          // IMPORTANTE: Desabilitar watermark para remover a caixa preta com informações do produto
          // Quando skipWatermark = true, o orquestrador não aplica a sobreposição preta no canto da imagem
          skipWatermark: true,
          lookType: "creative", // Sempre usar Look Criativo para multi-produto
          // MASTER PROMPT: Ativar protocolo Remix Universal para qualidade editorial
          gerarNovoLook: true, // Força reconstrução de cena com melhor integração de luz
          seed: randomSeed, // Seed aleatório para variar e evitar resultados "médios"
        },
        // MASTER PROMPT: Scene prompts dinâmico para todas as gerações
        scenePrompts: [baseScenePrompt],
        // PHASE 25: Instrução explícita para evitar cenários noturnos
        sceneInstructions: "IMPORTANT: The scene must be during DAYTIME with bright natural lighting. NEVER use night scenes, dark backgrounds, evening, sunset, dusk, or any nighttime setting. Always use well-lit daytime environments with natural sunlight.",
      }

      console.log("[handleVisualize] PHASE 13: Enviando para /api/generate-looks com foto ORIGINAL:", {
        hasOriginalPhoto: !!personImageUrl,
        originalPhotoUrl: personImageUrl?.substring(0, 50) + "...",
        totalProducts: productIds.length,
        productIds,
        payloadOriginalPhotoUrl: payload.original_photo_url?.substring(0, 50) + "...",
      })

      // PHASE 25: Melhorar timeout e tratamento de erros para mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeoutMs = isMobile ? 180000 : 120000; // 3 minutos mobile, 2 minutos desktop
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      let response: Response
      try {
        // PHASE 11-B FIX: Usar a rota correta /api/generate-looks
        // PHASE 25: Adicionar headers e configurações melhores para mobile
        response = await fetch("/api/generate-looks", {
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

      const responseData = await response.json()

      // PHASE 27: Verificar se a resposta é assíncrona (202 Accepted com jobId)
      if (response.status === 202 && responseData.jobId) {
        console.log("[handleVisualize] PHASE 27: Job criado, iniciando polling:", responseData.jobId)
        
        // Salvar jobId e reservationId para uso posterior
        const jobId = responseData.jobId
        const reservationId = responseData.reservationId
        
        // Função de polling para verificar status do Job
        const pollJobStatus = async (): Promise<any> => {
          const maxPollingTime = 180000 // 3 minutos máximo
          const pollInterval = 2000 // 2 segundos entre polls
          const startTime = Date.now()
          
          while (Date.now() - startTime < maxPollingTime) {
            try {
              const statusResponse = await fetch(`/api/jobs/${jobId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: 'no-cache',
              })
              
              if (!statusResponse.ok) {
                throw new Error(`Erro ao verificar status: ${statusResponse.status}`)
              }
              
              const statusData = await statusResponse.json()
              console.log("[handleVisualize] PHASE 27: Status do Job:", statusData.status)
              
              if (statusData.status === "COMPLETED") {
                // Job concluído com sucesso
                if (statusData.result?.imageUrl || statusData.result?.compositionId) {
                  return {
                    success: true,
                    imageUrl: statusData.result.imageUrl,
                    compositionId: statusData.result.compositionId,
                    reservationId,
                  }
                } else {
                  throw new Error("Job concluído mas sem URL de imagem")
                }
              } else if (statusData.status === "FAILED") {
                // Job falhou
                throw new Error(statusData.error || "Erro ao gerar imagem")
              } else if (statusData.status === "PROCESSING" || statusData.status === "PENDING") {
                // Ainda processando, continuar polling
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              } else {
                // Status desconhecido
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              }
            } catch (pollError: any) {
              console.error("[handleVisualize] PHASE 27: Erro no polling:", pollError)
              // Se o erro for de rede, continuar tentando
              if (pollError.message?.includes("fetch") || pollError.message?.includes("network")) {
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                continue
              }
              throw pollError
            }
          }
          
          // Timeout atingido
          throw new Error("Tempo de processamento excedido. A geração está demorando mais que o esperado.")
        }
        
        // Iniciar polling
        const pollResult = await pollJobStatus()
        
        // Salvar resultados e navegar
        const generatedLook = {
          id: pollResult.compositionId || `generated-${Date.now()}`,
          titulo: "Look Gerado",
          imagemUrl: pollResult.imageUrl,
          produtoNome: selectedProducts.map((p) => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: pollResult.compositionId || null,
        }

        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
        sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl || userPhotoUrl || "")
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        // Salvar reservationId para confirmação de visualização
        if (reservationId) {
          sessionStorage.setItem(`reservation_${lojistaId}`, reservationId)
          sessionStorage.setItem(`job_${lojistaId}`, jobId)
        }
        router.push(`/${lojistaId}/resultado`)
        return
      }

      // 4. Salvar resultados e navegar (compatibilidade com resposta síncrona antiga)
      // PHASE 11-B FIX: A resposta vem com looks[] array
      if (responseData.looks && responseData.looks.length > 0) {
        // Usar o primeiro look gerado
        const firstLook = responseData.looks[0]
        
        // Formatar como look para compatibilidade com a tela de resultado
        const generatedLook = {
          id: firstLook.id || responseData.compositionId || `generated-${Date.now()}`,
          titulo: firstLook.titulo || "Look Gerado",
          imagemUrl: firstLook.imagemUrl,
          produtoNome: selectedProducts.map((p) => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: responseData.compositionId || firstLook.compositionId || null,
        }

        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
        // Salvar a URL da foto ORIGINAL que foi enviada ao backend
        sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl || userPhotoUrl || "")
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
        // Marcar que uma nova imagem foi gerada (para resetar hasVoted na tela de resultado)
        sessionStorage.setItem(`new_looks_generated_${lojistaId}`, "true")
        router.push(`/${lojistaId}/resultado`)
      } else if (responseData.imageUrl) {
        // Fallback: se vier imageUrl direto (compatibilidade)
        const generatedLook = {
          id: responseData.compositionId || `generated-${Date.now()}`,
          titulo: "Look Gerado",
          imagemUrl: responseData.imageUrl,
          produtoNome: selectedProducts.map((p) => p.nome).join(" + "),
          produtoPreco: selectedProducts.reduce((sum, p) => sum + (p.preco || 0), 0),
          compositionId: responseData.compositionId || null,
        }
        sessionStorage.setItem(`looks_${lojistaId}`, JSON.stringify([generatedLook]))
        sessionStorage.setItem(`photo_${lojistaId}`, personImageUrl || userPhotoUrl || "")
        sessionStorage.setItem(`products_${lojistaId}`, JSON.stringify(selectedProducts))
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
      handleRefine={isRefineMode ? handleRefine : undefined}
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
