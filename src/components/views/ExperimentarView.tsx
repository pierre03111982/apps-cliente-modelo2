"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import {
  Upload,
  Camera,
  Wand2,
  Heart,
  X,
  Check,
  Filter,
  ThumbsUp,
  Instagram,
  Facebook,
  Music2,
  Share2,
  ArrowLeftCircle,
  ShoppingCart,
  Cast,
} from "lucide-react"
import toast from "react-hot-toast"
import { ClockAnimation } from "../ClockAnimation"
import { LoadingSpinner } from "../LoadingSpinner"
import { SafeImage } from "../ui/SafeImage"
import { Button } from "../ui/Button"
import { VideoBackground } from "../VideoBackground"
import { SendToDisplayButton } from "../SendToDisplayButton"
import { SmartUploadZone } from "@/components/ui/SmartUploadZone"
import { AvatarSelector } from "@/components/ui/AvatarSelector"
import { PrivacyOnboardingModal } from "@/components/modals/PrivacyOnboardingModal"
import type { LojistaData, Produto, GeneratedLook } from "@/lib/types"

export interface ExperimentarViewProps {
  lojistaData: LojistaData | null
  isLoadingCatalog: boolean
  filteredCatalog: Produto[]
  categories: string[]
  activeCategory: string
  setActiveCategory: (category: string) => void
  userPhotoUrl: string | null
  isRefineMode: boolean
  refineBaseImageUrl: string | null
  handleChangePhoto: () => void
  handleRemovePhoto: () => void
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleBackFromRefinement?: () => void
  selectedProducts: Produto[]
  toggleProductSelection: (produto: Produto) => void
  categoryWarning: string | null
  handleSocialClick: (url: string) => void
  handleShareApp: () => void
  descontoAplicado: boolean
  formatPrice: (value?: number | null) => string
  handleVisualize: () => void
  isGenerating: boolean
  generationError: string | null
  showFavoritesModal: boolean
  setShowFavoritesModal: (show: boolean) => void
  isLoadingFavorites: boolean
  favorites: any[]
  router: any
  lojistaId: string
  photoInputRef?: React.RefObject<HTMLInputElement>
  isDisplayConnected: boolean
  onDisplayConnect: (storeId: string, targetDisplay?: string | null) => void
}

export function ExperimentarView({
  lojistaData,
  isLoadingCatalog,
  filteredCatalog,
  categories,
  activeCategory,
  setActiveCategory,
  userPhotoUrl,
  isRefineMode,
  refineBaseImageUrl,
  handleChangePhoto,
  handleRemovePhoto,
  handlePhotoUpload,
  handleBackFromRefinement,
  selectedProducts,
  toggleProductSelection,
  categoryWarning,
  handleSocialClick,
  handleShareApp,
  descontoAplicado,
  formatPrice,
  handleVisualize,
  isGenerating,
  generationError,
  showFavoritesModal,
  setShowFavoritesModal,
  isLoadingFavorites,
  favorites,
  router,
  lojistaId,
  photoInputRef,
  isDisplayConnected,
  onDisplayConnect,
}: ExperimentarViewProps) {
  const [selectedProductDetail, setSelectedProductDetail] = useState<Produto | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isButtonExpanded, setIsButtonExpanded] = useState(false)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const phraseIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedFavoriteDetail, setSelectedFavoriteDetail] = useState<any | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const barcodeDetectorRef = useRef<any>(null)
  const hasUserPhoto = Boolean(userPhotoUrl)
  const [privacyMode, setPrivacyMode] = useState<"public" | "private" | null>(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const redesDiscount = useMemo(() => {
    const base = lojistaData?.descontoRedesSociais ?? 0
    const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
    const isValid = base > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
    return isValid ? base : 0
  }, [lojistaData?.descontoRedesSociais, lojistaData?.descontoRedesSociaisExpiraEm])

  const getSpecialDiscount = (produto?: Produto | null) =>
    produto?.descontoProduto && produto.descontoProduto > 0 ? produto.descontoProduto : 0

  const getTotalDiscount = (produto?: Produto | null) => {
    const total = redesDiscount + getSpecialDiscount(produto)
    return Math.max(0, Math.min(total, 80))
  }

  // Função para obter cor de fundo e texto baseado no nome da cor
  const getCorStyle = (cor: string) => {
    const corLower = cor.toLowerCase().trim()
    const corMap: Record<string, { bg: string; text: string }> = {
      'preto': { bg: '#000000', text: '#ffffff' },
      'black': { bg: '#000000', text: '#ffffff' },
      'branco': { bg: '#ffffff', text: '#000000' },
      'white': { bg: '#ffffff', text: '#000000' },
      'vermelho': { bg: '#dc2626', text: '#ffffff' },
      'red': { bg: '#dc2626', text: '#ffffff' },
      'azul': { bg: '#2563eb', text: '#ffffff' },
      'blue': { bg: '#2563eb', text: '#ffffff' },
      'verde': { bg: '#16a34a', text: '#ffffff' },
      'green': { bg: '#16a34a', text: '#ffffff' },
      'amarelo': { bg: '#eab308', text: '#000000' },
      'yellow': { bg: '#eab308', text: '#000000' },
      'rosa': { bg: '#ec4899', text: '#ffffff' },
      'pink': { bg: '#ec4899', text: '#ffffff' },
      'roxo': { bg: '#9333ea', text: '#ffffff' },
      'purple': { bg: '#9333ea', text: '#ffffff' },
      'laranja': { bg: '#f97316', text: '#ffffff' },
      'orange': { bg: '#f97316', text: '#ffffff' },
      'marrom': { bg: '#92400e', text: '#ffffff' },
      'brown': { bg: '#92400e', text: '#ffffff' },
      'cinza': { bg: '#6b7280', text: '#ffffff' },
      'gray': { bg: '#6b7280', text: '#ffffff' },
      'bege': { bg: '#f5f5dc', text: '#000000' },
      'beige': { bg: '#f5f5dc', text: '#000000' },
    }
    
    const corStyle = corMap[corLower]
    if (corStyle) {
      return { backgroundColor: corStyle.bg, color: corStyle.text }
    }
    
    // Fallback para cores não mapeadas
    return { backgroundColor: '#6b7280', color: '#ffffff' }
  }

  const ensureLocalClientData = useCallback(() => {
    if (typeof window === "undefined" || !lojistaId) return null
    const stored = localStorage.getItem(`cliente_${lojistaId}`)
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.warn("[ExperimentarView] Não foi possível ler cliente do localStorage", error)
      return null
    }
  }, [lojistaId])

  useEffect(() => {
    if (typeof window === "undefined" || !lojistaId) return
    const clienteData = ensureLocalClientData()
    if (!clienteData) {
      setShowPrivacyModal(true)
      return
    }
    if (clienteData.privacy_mode) {
      setPrivacyMode(clienteData.privacy_mode)
    } else {
      setShowPrivacyModal(true)
    }
  }, [ensureLocalClientData, lojistaId])

  const handlePrivacySelection = (mode: "public" | "private") => {
    setPrivacyMode(mode)
    setShowPrivacyModal(false)
    if (typeof window === "undefined" || !lojistaId) return
    const clienteData = ensureLocalClientData() || {}
    clienteData.privacy_mode = mode
    try {
      localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(clienteData))
    } catch (error) {
      console.warn("[ExperimentarView] Não foi possível salvar privacy_mode", error)
    }
  }

  const handleSmartUploadSelect = useCallback(
    (file: File) => {
      if (!file) return
      try {
        const dataTransfer = typeof window !== "undefined" && "DataTransfer" in window ? new DataTransfer() : null
        const targetInput =
          (photoInputRef?.current as HTMLInputElement | null) ||
          (typeof document !== "undefined" ? document.createElement("input") : null)

        if (targetInput && dataTransfer) {
          dataTransfer.items.add(file)
          targetInput.type = "file"
          targetInput.files = dataTransfer.files
          const event = new Event("change", { bubbles: true })
          if (!targetInput.isConnected && photoInputRef?.current !== targetInput) {
            handlePhotoUpload({ target: targetInput } as React.ChangeEvent<HTMLInputElement>)
          } else {
            targetInput.dispatchEvent(event)
          }
          return
        }
      } catch (error) {
        console.warn("[ExperimentarView] DataTransfer indisponível, usando fallback", error)
      }

      const fallbackInput = {
        files: {
          length: 1,
          item: (index: number) => (index === 0 ? file : null),
          0: file,
        } as unknown as FileList,
      } as HTMLInputElement
      handlePhotoUpload({ target: fallbackInput } as React.ChangeEvent<HTMLInputElement>)
    },
    [handlePhotoUpload, photoInputRef]
  )

  const hasDiscountApplied = (produto?: Produto | null) =>
    descontoAplicado && getTotalDiscount(produto) > 0

  const getProdutoImagem = (produto?: Produto | null) =>
    produto?.imagemUrlCatalogo || produto?.imagemUrl || null

  const prioritizedCatalog = useMemo(() => {
    const especiais = filteredCatalog.filter((produto) => (produto.descontoProduto ?? 0) > 0)
    const comuns = filteredCatalog.filter((produto) => (produto.descontoProduto ?? 0) <= 0)
    return [...especiais, ...especiais, ...comuns]
  }, [filteredCatalog])

  // Frases criativas animadas
  const creativePhrases = [
    "✨ Criando seu look perfeito...",
    "🎨 Aplicando IA criativa...",
    "👗 Combinando estilos únicos...",
    "💫 Gerando magia da moda...",
    "🌟 Transformando sua foto...",
    "✨ Quase lá, aguarde...",
    "🎯 Finalizando detalhes...",
  ]

  // Frases para remixar (preparando surpresa)
  const remixPhrases = [
    "🎁 Preparando uma surpresa especial...",
    "✨ Criando uma nova versão incrível...",
    "🎨 Aplicando transformações mágicas...",
    "💫 Gerando algo único para você...",
    "🌟 Quase pronto, aguarde...",
    "🎯 Finalizando os últimos detalhes...",
  ]

  // Limpar intervalo quando componente desmontar
  useEffect(() => {
    return () => {
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current)
      }
    }
  }, [])

  // Resetar estado quando geração terminar
  useEffect(() => {
    if (!isGenerating && isButtonExpanded) {
      // Limpar intervalo
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current)
        phraseIntervalRef.current = null
      }
      // Resetar estado após um pequeno delay para permitir navegação
      const timeout = setTimeout(() => {
        setIsButtonExpanded(false)
        setCurrentPhraseIndex(0)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isGenerating, isButtonExpanded])

  // Função para lidar com o clique no botão
  const handleCreateClick = () => {
    if (isGenerating || isButtonExpanded) return
    
    // Expandir botão
    setIsButtonExpanded(true)
    setCurrentPhraseIndex(0)
    
    // Limpar intervalo anterior se existir
    if (phraseIntervalRef.current) {
      clearInterval(phraseIntervalRef.current)
    }
    
    // Iniciar animação de frases (mais devagar)
    let phraseIndex = 0
    phraseIntervalRef.current = setInterval(() => {
      phraseIndex++
      if (phraseIndex < creativePhrases.length) {
        setCurrentPhraseIndex(phraseIndex)
      } else {
        // Reiniciar frases se ainda estiver gerando
        phraseIndex = 0
        setCurrentPhraseIndex(0)
      }
    }, 2500) // Aumentado de 1500ms para 2500ms (mais devagar)
    
    // Chamar função original
    handleVisualize()
  }

  const stopScanner = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    barcodeDetectorRef.current = null
    setScannerError(null)
    setIsScannerOpen(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const handleQrResult = (value: string) => {
    try {
      const url = new URL(value)
      const connectParam = url.searchParams.get("connect")
      const lojistaParam =
        url.searchParams.get("lojista") ||
        url.pathname.split("/").filter(Boolean)[0]
      const targetDisplayParam = url.searchParams.get("target_display")

      if (connectParam !== "true" || !lojistaParam || !targetDisplayParam) {
        setScannerError("QR Code inválido para conexão com o display.")
        return false
      }

      if (lojistaParam !== lojistaId) {
        setScannerError("Este QR Code pertence a outra loja.")
        return false
      }

      onDisplayConnect(lojistaParam, targetDisplayParam)
      toast.success("Display conectado com sucesso!")
      stopScanner()
      return true
    } catch (error) {
      console.error("[ExperimentarView] Erro ao ler QR Code:", error)
      setScannerError("Não foi possível interpretar o QR Code.")
      return false
    }
  }

  const startScanner = async () => {
    if (typeof window === "undefined") return
    setScannerError(null)
    setIsScannerOpen(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const BarcodeDetectorClass = (window as any).BarcodeDetector
      if (!BarcodeDetectorClass) {
        setScannerError("Seu navegador não suporta leitura de QR Code. Use a câmera normal.")
        return
      }

      barcodeDetectorRef.current = new BarcodeDetectorClass({ formats: ["qr_code"] })

      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanFrameRef.current = requestAnimationFrame(detect)
          return
        }

        try {
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current)
          if (barcodes.length > 0) {
            const rawValue = barcodes[0]?.rawValue
            if (rawValue) {
              const success = handleQrResult(rawValue)
              if (success) return
            }
          }
        } catch (error) {
          console.error("[ExperimentarView] Erro no detector de QR:", error)
          setScannerError("Erro ao processar o QR Code. Tente novamente.")
        }

        scanFrameRef.current = requestAnimationFrame(detect)
      }

      detect()
    } catch (error) {
      console.error("[ExperimentarView] Não foi possível acessar a câmera:", error)
      setScannerError("Não foi possível acessar a câmera. Verifique as permissões.")
    }
  }

  const handleProductCardClick = (produto: Produto, e: React.MouseEvent) => {
    // Se clicou no checkbox, não abre o modal
    if ((e.target as HTMLElement).closest('.product-checkbox')) {
      return
    }
    setSelectedProductDetail(produto)
    setSelectedSize(null) // Resetar tamanho selecionado ao abrir modal
  }

  const handleSelectFromModal = (produto: Produto) => {
    toggleProductSelection(produto)
    setSelectedProductDetail(null)
    setSelectedSize(null)
  }

  const actionButtonBase =
    "w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white/70 shadow-lg flex items-center justify-center text-white transition hover:scale-105 focus:outline-none"

  const fallbackCheckoutLink =
    lojistaData?.salesConfig?.checkout_url ||
    lojistaData?.salesConfig?.checkoutLink ||
    lojistaData?.salesConfig?.ecommerceUrl ||
    lojistaData?.salesConfig?.manual_contact ||
    lojistaData?.salesConfig?.whatsappLink ||
    lojistaData?.redesSociais?.whatsapp ||
    null

  const renderActionButtons = (config: { allowCamera?: boolean; allowFavorites?: boolean; allowDisplay?: boolean }) => (
    <div className="absolute right-3 bottom-3 flex flex-col items-center gap-3 z-20">
      {config.allowDisplay && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!isScannerOpen) {
              startScanner()
            }
          }}
          className={`${actionButtonBase} ${isDisplayConnected ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          title={isDisplayConnected ? "Display conectado" : "Conectar ao display"}
          disabled={isScannerOpen}
        >
          <Cast className="h-6 w-6" />
        </button>
      )}

      {config.allowCamera && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleChangePhoto()
          }}
          className={`${actionButtonBase} bg-blue-600 hover:bg-blue-500`}
          title="Trocar foto"
        >
          <Camera className="h-6 w-6" />
        </button>
      )}

      {config.allowFavorites && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowFavoritesModal(true)
          }}
          className={`${actionButtonBase} bg-pink-600 hover:bg-pink-500`}
          title="Abrir favoritos"
        >
          <Heart className="h-6 w-6" />
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* PHASE 8: Solid & Clean - No Glass/Blur */}
      <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto text-gray-900 dark:text-white antialiased bg-[#F8F9FC] dark:bg-[#0F172A]">
      {/* Overlay de Loading Centralizado quando gerando */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90 animate-fade-in">
          <div className="flex flex-col items-center justify-center gap-6 animate-scale-in">
            <div className="relative">
              <LoadingSpinner size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <ClockAnimation size={60} />
              </div>
            </div>
            <div className="text-center animate-fade-in">
              <p className="text-xl font-bold text-white mb-2 transition-all duration-300">
                {creativePhrases[currentPhraseIndex] || creativePhrases[0]}
              </p>
              <p className="text-sm text-white/80">Aguarde enquanto criamos seu look...</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Vídeo de Fundo (estático se conectado ao display, animado se não conectado) */}
      <VideoBackground videoSrc="/video2tela2.mp4" />

      {/* 2. Conteúdo Principal */}
      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-3 sm:space-y-4 md:space-y-6">
          {/* Caixa com Logo e Nome da Loja - Mobile Otimizado */}
          <div>
            <div
              className="neon-border rounded-xl border-2 border-white/30 backdrop-blur-md px-3 sm:px-4 py-2 shadow-xl flex items-center justify-center gap-2 sm:gap-3 relative"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.5), rgba(147,51,234,0.5), rgba(59,130,246,0.5), rgba(147,51,234,0.5), rgba(0,0,0,0.5))",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <button
                onClick={() => {
                  if (isRefineMode && handleBackFromRefinement) {
                    handleBackFromRefinement()
                  } else {
                    router.push(`/${lojistaId}/login`)
                  }
                }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1 text-white hover:opacity-80 transition"
              >
                <ArrowLeftCircle className="h-5 w-5 sm:h-6 sm:w-6" />
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
                className="text-sm sm:text-base md:text-xl font-bold text-white"
                style={{ textShadow: "0px 1px 3px black, 0px 1px 3px black" }}
                translate="no"
              >
                {lojistaData?.nome || "Loja"}
              </h3>
            </div>
          </div>

          {/* Upload de Foto e Área Personalize o seu Look */}
          <div
            className={`flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 md:gap-6 ${
              userPhotoUrl ? "justify-center" : "justify-center"
            }`}
          >
            {/* Upload de Foto */}
            <div className={`relative ${userPhotoUrl ? 'w-full sm:max-w-[48%] md:max-w-[42%]' : 'w-full max-w-full'}`}>
              {renderActionButtons({ allowFavorites: true, allowCamera: hasUserPhoto, allowDisplay: hasUserPhoto })}
              {userPhotoUrl && !isRefineMode ? (
                // Exibir foto quando disponível
                <div className="relative inline-block w-full" style={{ position: 'relative' }}>
                  <div className="neon-border relative rounded-2xl border-2 border-white/30 backdrop-blur p-2 shadow-2xl inline-block w-full" style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                  }}>
                    <div className="relative rounded-xl border-2 border-white/50 p-1 inline-block w-full bg-white/10" style={{ 
                      minHeight: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <SafeImage
                        src={userPhotoUrl}
                        alt="Sua foto"
                        className="max-w-full max-h-[500px] w-auto h-auto object-contain block rounded-lg cursor-pointer"
                        containerClassName="w-full flex items-center justify-center"
                        onClick={handleChangePhoto}
                        title="Clique para trocar a foto"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute right-3 top-3 rounded-full bg-red-500/80 p-2 text-white transition hover:bg-red-600 z-20"
                    title="Remover foto"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <input
                    ref={photoInputRef}
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              ) : isRefineMode ? (
                <div className="relative inline-block w-full">
                  <div className="neon-border relative rounded-2xl border-2 border-white/30 backdrop-blur p-2 shadow-2xl inline-block w-full" style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                  }}>
                    <div className="relative rounded-xl border-2 border-white/50 p-1 inline-block w-full bg-white/10" style={{ 
                      aspectRatio: 'auto'
                    }}>
                      {refineBaseImageUrl && (
                        <SafeImage
                          src={refineBaseImageUrl}
                          alt="Look base para refinamento"
                          className="h-auto w-auto max-w-full object-contain block rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-purple-600/90 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                    Trocar Produto
                  </div>
                </div>
              ) : (
                <div className="relative inline-block w-full" style={{ position: "relative" }}>
                  <div className="neon-border rounded-2xl border-2 border-white/30 backdrop-blur p-3 shadow-2xl" style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                  }}>
                    <SmartUploadZone onFileSelect={handleSmartUploadSelect} isLoading={isGenerating} />
                    {privacyMode === "private" && !isRefineMode && (
                      <AvatarSelector onSelect={handleSmartUploadSelect} />
                    )}
                  </div>
                  <input
                    ref={photoInputRef}
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Área: Personalize o seu Look */}
            {userPhotoUrl && (
              <div
                className="neon-border w-full sm:flex-1 self-stretch rounded-2xl border-2 border-white/30 backdrop-blur p-3 sm:p-4 md:p-5 shadow-2xl flex flex-col min-h-0 sm:max-w-[48%] md:max-w-[42%]"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                }}
              >
                <div className="mb-3 sm:mb-4 shrink-0">
                  <div className="rounded-lg border-2 border-purple-500 dark:border-purple-400 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-2 sm:p-3 shadow-lg">
                    <h2 className="text-center text-[10px] sm:text-xs md:text-sm font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      Provador virtual com IA
                    </h2>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 justify-between min-h-0">
                  <div className="flex flex-col gap-3 shrink-0">
                    {/* Passos com texto branco */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 dark:bg-teal-600 text-sm font-bold text-white shadow-lg">1</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Carregue sua Foto</span>
                        {userPhotoUrl && (<div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${selectedProducts.length > 0 ? 'bg-teal-500 dark:bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}>2</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">Escolha um Produto</span>
                        {selectedProducts.length > 0 && (<div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${userPhotoUrl && selectedProducts.length > 0 ? 'bg-teal-500 dark:bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}>3</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">Crie o seu Look</span>
                        {userPhotoUrl && selectedProducts.length > 0 && (<div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caixa com Produtos Selecionados */}
          {userPhotoUrl && selectedProducts.length > 0 && (
            <div
              className="neon-border rounded-2xl border-2 border-white/30 backdrop-blur p-2 sm:p-2.5 shadow-2xl w-full sm:w-[90%] md:w-[80%] lg:w-[70%] mx-auto"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
              }}
            >
              <h3 className="mb-2 text-center text-xs sm:text-sm font-bold text-white">
                Produtos Selecionados
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {selectedProducts.map((produto, index) => (
                  <div key={produto.id || index} className="rounded-lg border-2 border-purple-500 bg-white overflow-hidden shadow-lg relative">
                    {/* Botão para remover produto */}
                    <button
                      onClick={() => toggleProductSelection(produto)}
                      className="absolute right-1 top-1 z-10 rounded-full bg-red-500/80 p-1 text-white transition hover:bg-red-600"
                      title="Remover produto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Imagem do Produto */}
                    {getProdutoImagem(produto) && (
                      <div 
                        className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden" 
                        style={{ 
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          minHeight: 0
                        }}
                      >
                        <SafeImage
                          src={getProdutoImagem(produto)!}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {/* Informações do Produto */}
                    <div className="p-1.5 bg-purple-900">
                      <h3 className="text-left text-[10px] font-semibold text-white line-clamp-2 mb-0.5 leading-tight h-7">
                        {produto.nome}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        {hasDiscountApplied(produto) && produto.preco ? (
                          <>
                            <p className="text-left text-[9px] text-purple-300 line-through">
                              {formatPrice(produto.preco)}
                            </p>
                            <div className="flex items-center gap-0.5 flex-wrap">
                              <p className="text-left text-[10px] font-bold text-amber-300">
                                {formatPrice(produto.preco * (1 - getTotalDiscount(produto) / 100))}
                              </p>
                              <p className="text-left text-[7px] font-semibold text-green-400 leading-tight">
                                {getTotalDiscount(produto).toFixed(1).replace(".0", "")}% OFF
                              </p>
                            </div>
                          </>
                        ) : (
                          <p className="text-left text-[10px] font-bold text-amber-300">
                            {formatPrice(produto.preco)}
                          </p>
                        )}
                        {getSpecialDiscount(produto) > 0 && (
                          <p className="text-left text-[8px] font-semibold text-pink-200">
                            +{getSpecialDiscount(produto)}% especial
                          </p>
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
            <div
              className="neon-border rounded-2xl border-2 border-white/30 backdrop-blur p-4 shadow-2xl"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
              }}
            >
              {isRefineMode ? (
                <p className="text-xs font-medium text-white text-center">
                  ✨ <span className="font-bold">Trocar Produto:</span> Selecione <span className="font-bold">1 produto</span> para trocar no look.
                </p>
              ) : (
                <p className="text-xs font-medium text-white text-center">
                  💡 Você pode selecionar até <span className="font-bold">2 produtos</span> de <span className="font-bold">categorias diferentes</span>
                </p>
              )}
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto - Mobile Otimizado */}
          <div
            className="neon-border rounded-2xl border-2 border-white/30 backdrop-blur px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5">
              <div className="rounded-lg sm:rounded-md border-2 border-white/40 bg-red-700 px-3 sm:px-4 py-2 sm:py-2 md:py-2.5 w-full">
                <p className="text-xs sm:text-sm md:text-base font-medium text-white text-center leading-tight">Siga, Curta ou Compartilhe !!!<br/>Aplique o seu Desconto agora!</p>
              </div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                {lojistaData?.redesSociais?.instagram ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Instagram className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-50"><Instagram className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.facebook ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Facebook className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white opacity-50"><Facebook className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.tiktok ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-black text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Music2 className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-black text-white opacity-50"><Music2 className="h-5 w-5" /></div>)}
                <button onClick={handleShareApp} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Compartilhar aplicativo"><Share2 className="h-5 w-5" /></button>
              </div>
              {redesDiscount > 0 && (
                <>
                  <p className="text-base font-semibold text-white text-center flex items-center justify-center gap-1.5">
                    <span className="font-bold text-yellow-400 text-base">GANHE</span>
                    <span className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-lg">{redesDiscount}%</span>
                    <span className="font-semibold text-white text-base">de</span>
                    <span className="font-bold text-yellow-400 text-base">DESCONTO!</span>
                  </p>
                  <p className="text-[11px] text-white text-center max-w-md">
                    Esse bônus soma com o <span className="font-semibold text-pink-200">Desconto Especial</span> de cada produto.
                  </p>
                  {descontoAplicado && (
                    <p className="text-xs font-semibold text-green-400 text-center animate-pulse">
                      ✓ Desconto aplicado! Os preços já consideram {redesDiscount}% + descontos especiais.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card Principal */}
          <div
              className="neon-border rounded-2xl sm:rounded-3xl border-2 border-white/30 backdrop-blur p-4 sm:p-6 md:p-8 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            {/* Abas de Categoria */}
            <div className="mb-4 sm:mb-5 md:mb-6 overflow-x-auto pb-2 -mx-1 sm:-mx-2 md:mx-0">
              <div className="flex gap-2 sm:gap-3 justify-start sm:justify-center px-2 sm:px-0 min-w-max sm:min-w-0 flex-wrap sm:flex-nowrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    disabled={isGenerating || isButtonExpanded}
                    className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
                      activeCategory === category
                        ? "bg-green-500 text-white border-2 border-white shadow-lg"
                        : "bg-purple-600 text-white border-2 border-white/80 hover:bg-purple-700"
                    } ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Aviso de categoria */}
            {categoryWarning && (<div className="mb-4 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 px-4 py-3"><p className="text-sm font-medium text-yellow-700">{categoryWarning}</p></div>)}

            {/* Grid de Produtos - 2 colunas no mobile, 4 colunas no desktop */}
            {isLoadingCatalog ? (<div className="py-12 text-center text-zinc-600">Carregando produtos...</div>) : filteredCatalog.length === 0 ? (<div className="py-12 text-center text-zinc-500">Nenhum produto encontrado.</div>) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 overflow-y-auto pb-4 pr-1 sm:pr-2 custom-scrollbar" style={{ maxHeight: '900px' }}>
                {prioritizedCatalog.map((produto, index) => { const isSelected = selectedProducts.some((p) => p.id === produto.id); const imagemPrincipal = getProdutoImagem(produto); const specialDiscount = getSpecialDiscount(produto); const totalDiscount = getTotalDiscount(produto); const applyDiscount = hasDiscountApplied(produto); return (
                  <div
                    key={`${produto.id}-${index}`}
                    onClick={(e) => {
                      if (!isGenerating && !isButtonExpanded) {
                        handleProductCardClick(produto, e)
                      }
                    }}
                    className={`group relative overflow-hidden rounded-lg sm:rounded-xl border-2 transition w-full ${
                      isGenerating || isButtonExpanded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${
                      isSelected
                        ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-500/30"
                        : "border-purple-500 bg-white hover:border-purple-400"
                    }`}
                    style={{ minHeight: 0 }}
                  >
                    {/* Caixinha Seletora no canto superior esquerdo */}
                    <div 
                      className="product-checkbox absolute left-1.5 top-1.5 sm:left-2 sm:top-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isGenerating && !isButtonExpanded) {
                          toggleProductSelection(produto)
                        }
                      }}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition ${
                        isSelected 
                          ? "bg-teal-500 border-teal-600" 
                          : "bg-white border-purple-500 hover:bg-purple-50"
                      }`}>
                        {isSelected && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                      </div>
                    </div>

                    {imagemPrincipal && (
                      <div 
                        className="relative w-full bg-gray-100 flex items-center justify-center overflow-hidden" 
                        style={{ 
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          minHeight: 0
                        }}
                      >
                        <SafeImage
                          src={imagemPrincipal}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {specialDiscount > 0 && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 rounded-full bg-pink-600/90 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-pink-500/30">
                        +{specialDiscount}% especial
                      </div>
                    )}
                    <div className="p-2 sm:p-2.5 md:p-3 bg-purple-900">
                      <h3 className="text-left text-[11px] sm:text-xs md:text-sm font-semibold text-white line-clamp-2 h-8 sm:h-9 md:h-10 leading-tight mb-1 sm:mb-1.5">
                        {produto.nome}
                      </h3>
                      <div className="mt-1 sm:mt-1.5 flex flex-col gap-1 sm:gap-1.5">
                        {applyDiscount && produto.preco ? (
                          <>
                            <p className="text-left text-[10px] sm:text-xs md:text-sm text-purple-300 line-through">
                              {formatPrice(produto.preco)}
                            </p>
                            <p className="text-left text-xs sm:text-sm md:text-base font-bold text-amber-300">
                              {formatPrice(produto.preco * (1 - totalDiscount / 100))}
                            </p>
                            <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-green-300">
                              {totalDiscount.toFixed(1).replace(".0", "")}% OFF {specialDiscount > 0 ? "(inclui especial)" : ""}
                            </p>
                          </>
                        ) : (
                          <p className="text-left text-xs sm:text-sm md:text-base font-bold text-amber-300">
                            {formatPrice(produto.preco)}
                          </p>
                        )}
                        {specialDiscount > 0 && (
                          <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-pink-200">
                            {applyDiscount
                              ? `Redes ${redesDiscount}% + Especial ${specialDiscount}%`
                              : `Desconto especial disponível (+${specialDiscount}%)`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAB - Visualize (fixo no rodapé com z-index alto) */}
      {(userPhotoUrl) && selectedProducts.length > 0 && (
        <div 
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] transition-all duration-500"
          style={{ 
            position: 'fixed',
            zIndex: 9999
          }}
        >
          <Button
            onClick={handleCreateClick}
            isLoading={isGenerating}
            disabled={isGenerating}
            variant="primary"
            size="lg"
            className="rounded-full shadow-2xl animate-pulse-glow hover:scale-105 gap-2 sm:gap-3 px-5 sm:px-7 py-3.5 sm:py-4.5 md:py-5 text-sm sm:text-base md:text-lg font-bold border-4 border-white"
            style={{
              background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))',
            }}
          >
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            <span className="hidden sm:inline">CRIAR LOOK</span>
            <span className="sm:hidden">CRIAR</span>
          </Button>
        </div>
      )}

      {/* Mensagem de erro */}
      {generationError && (<div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-3 shadow-md"><p className="text-sm font-medium text-red-700 dark:text-red-200">{generationError}</p></div>)}

      {/* Modal de Detalhes do Produto */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedProductDetail(null)}>
          <div
            className="neon-border w-full max-w-2xl rounded-xl border-2 border-white/20 bg-black/50 backdrop-blur-lg p-6 shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Produto</h2>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imagem do Produto */}
              {getProdutoImagem(selectedProductDetail) && (
                <div className="neon-border relative w-full min-h-96 rounded-lg overflow-hidden bg-gray-900 p-0" style={{ position: 'relative' }}>
                  <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                    <SafeImage
                      src={getProdutoImagem(selectedProductDetail)!}
                      alt={selectedProductDetail.nome}
                      className="w-full h-full object-contain"
                      containerClassName="w-full h-full"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Nome */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedProductDetail.nome}</h3>
              </div>

              {/* Preço */}
              <div className="p-4 bg-blue-900 rounded-lg text-center">
                {hasDiscountApplied(selectedProductDetail) && selectedProductDetail.preco ? (
                  <div className="space-y-2">
                    {/* Preço cheio riscado */}
                    <p className="text-lg text-gray-400 line-through">{formatPrice(selectedProductDetail.preco)}</p>
                    {/* Preço com desconto destacado */}
                    <div className="flex items-baseline justify-center gap-2">
                      <p className="text-3xl font-bold text-green-400">
                        {formatPrice(selectedProductDetail.preco * (1 - getTotalDiscount(selectedProductDetail) / 100))}
                      </p>
                      <span className="px-2 py-1 bg-green-500/20 border border-green-400 rounded text-sm font-bold text-green-300">
                        -{getTotalDiscount(selectedProductDetail).toFixed(1).replace(".0", "")}%
                      </span>
                    </div>
                    {getSpecialDiscount(selectedProductDetail) > 0 && (
                      <p className="text-xs font-semibold text-green-300">
                        Desconto: Redes Sociais {redesDiscount}% + Especial {getSpecialDiscount(selectedProductDetail)}%
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-amber-300">
                    {formatPrice(selectedProductDetail.preco)}
                  </p>
                )}
              </div>

              {/* Categoria */}
              {selectedProductDetail.categoria && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-1">Categoria:</p>
                  <p className="text-lg text-white">{selectedProductDetail.categoria}</p>
                </div>
              )}

              {/* Tamanhos */}
              {selectedProductDetail.tamanhos && selectedProductDetail.tamanhos.length > 0 && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-2">Tamanhos disponíveis:</p>
                  {selectedProductDetail.tamanhos.length > 1 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(selectedSize === tamanho ? null : tamanho)}
                          className={`px-6 py-3 rounded-lg text-base font-medium transition ${
                            selectedSize === tamanho
                              ? 'bg-blue-600 text-white border-2 border-blue-500 shadow-lg'
                              : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
                          }`}
                        >
                          {tamanho}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <span key={index} className="px-5 py-2 bg-white/10 text-white border border-white/30 rounded-full text-base font-medium">
                          {tamanho}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cores */}
              {selectedProductDetail.cores && selectedProductDetail.cores.length > 0 && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-2">Cores disponíveis:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedProductDetail.cores.map((cor, index) => {
                      const corStyle = getCorStyle(cor)
                      return (
                        <span 
                          key={index} 
                          className="px-5 py-2 rounded-full text-base font-medium border-2 border-white/50"
                          style={corStyle}
                        >
                          {cor}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Medidas */}
              {selectedProductDetail.medidas && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-1">Medidas:</p>
                  <p className="text-lg text-white">{selectedProductDetail.medidas}</p>
                </div>
              )}

              {/* Estoque */}
              {selectedProductDetail.estoque !== null && selectedProductDetail.estoque !== undefined && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-1">Estoque:</p>
                  <p className={`text-lg font-medium ${selectedProductDetail.estoque > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedProductDetail.estoque > 0 ? `${selectedProductDetail.estoque} unidades disponíveis` : 'Fora de estoque'}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedProductDetail.obs && (
                <div className="text-center">
                  <p className="text-base font-semibold text-white/80 mb-1">Observações:</p>
                  <p className="text-lg text-white whitespace-pre-wrap">{selectedProductDetail.obs}</p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleSelectFromModal(selectedProductDetail)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-white font-bold py-3 px-4 transition ${
                    selectedProducts.some((p) => p.id === selectedProductDetail.id)
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Check className="h-5 w-5" />
                  {selectedProducts.some((p) => p.id === selectedProductDetail.id) ? 'Desmarcar' : 'Selecionar'}
                </button>
                <button
                  onClick={() => setSelectedProductDetail(null)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 transition"
                >
                  <ArrowLeftCircle className="h-5 w-5" />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Favoritos */}
      {showFavoritesModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto">
          <div className="neon-border w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Meus Favoritos</h2>
              <button onClick={() => setShowFavoritesModal(false)} className="text-white/70 hover:text-white transition"><X className="h-6 w-6" /></button>
            </div>
            {isLoadingFavorites ? (<div className="py-12 text-center text-white">Carregando...</div>) : favorites.length === 0 ? (<div className="py-12 text-center text-white/70"><Heart className="mx-auto mb-4 h-16 w-16 text-white/30" /><p>Você não tem favoritos.</p></div>) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {favorites.map((favorito) => (
                  <div 
                    key={favorito.id} 
                    onClick={() => setSelectedFavoriteDetail(favorito)} 
                    className="group relative overflow-hidden rounded-xl border-2 border-purple-500 bg-white hover:border-purple-400 transition cursor-pointer"
                  >
                    {favorito.imagemUrl && (
                      <div className="relative aspect-square w-full bg-white">
                        <Image src={favorito.imagemUrl} alt={favorito.productName || "Look favorito"} fill className="object-contain" />
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
          <div className="neon-border w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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

            {/* Informações do Produto */}
            {selectedFavoriteDetail.productName && (
              <div className="mb-6 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedFavoriteDetail.productName}</h3>
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
                onClick={() => {
                  if (fallbackCheckoutLink) {
                    window.open(fallbackCheckoutLink, "_blank", "noopener,noreferrer")
                  }
                }}
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
                    if (!selectedFavoriteDetail.imagemUrl) {
                      alert("Erro: Imagem do favorito não encontrada.")
                      return
                    }
                    // Salvar a foto do favorito para usar nas composições
                    // Substituir tanto photo quanto original_photo para que seja usada nas composições
                    sessionStorage.setItem(`photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                    sessionStorage.setItem(`original_photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                    console.log("[ExperimentarView] ✅ Foto do favorito salva para usar nas composições:", selectedFavoriteDetail.imagemUrl.substring(0, 50))
                    setSelectedFavoriteDetail(null)
                    setShowFavoritesModal(false)
                    // Recarregar a página para aplicar a foto do favorito
                    window.location.reload()
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-green-700"
                >
                  <Check className="h-5 w-5" /> Usar esta foto
                </button>
                <button
                  onClick={() => setSelectedFavoriteDetail(null)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-600 py-3 font-semibold text-white text-sm transition shadow-md hover:bg-gray-700"
                >
                  <ArrowLeftCircle className="h-5 w-5" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 dark:bg-black/90 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-4 shadow-lg relative">
            <h3 className="text-lg font-semibold text-white mb-3 text-center">Conectar ao Display</h3>
            <video
              ref={videoRef}
              className="w-full rounded-xl border border-white/30 bg-black"
              autoPlay
              playsInline
              muted
            />
            <p className="mt-3 text-sm text-white/80 text-center">
              Aponte a câmera para o QR Code exibido no monitor da loja.
            </p>
            {scannerError && (
              <p className="mt-2 text-xs text-red-200 text-center">{scannerError}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={stopScanner}
                className="flex-1 rounded-xl bg-gray-200 text-gray-900 py-2 font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <PrivacyOnboardingModal open={showPrivacyModal} onSelect={handlePrivacySelection} />
    </>
  )
}
