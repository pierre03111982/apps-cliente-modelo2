"use client"

import { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
import { ClockAnimation } from "../ClockAnimation"
import { LoadingSpinner } from "../LoadingSpinner"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants" // Esta constante não será mais usada
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
  lojistaId
}: ExperimentarViewProps) {
  const [selectedProductDetail, setSelectedProductDetail] = useState<Produto | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isButtonExpanded, setIsButtonExpanded] = useState(false)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const phraseIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedFavoriteDetail, setSelectedFavoriteDetail] = useState<any | null>(null)

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

  return (
    // Estilo geral do Modelo 2: fundo claro e texto escuro
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto text-zinc-800 antialiased">
      {/* Overlay de Loading Centralizado quando gerando */}
      {isGenerating && (
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
                {creativePhrases[currentPhraseIndex] || creativePhrases[0]}
              </p>
              <p className="text-sm text-white/80">Aguarde enquanto criamos seu look...</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Vídeo de Fundo - Fixo */}
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

      {/* 2. Conteúdo Principal */}
      <div className="relative z-10 min-h-screen p-4 pb-24">
        <div className="mx-auto max-w-6xl space-y-3">
          {/* Caixa com Logo e Nome da Loja */}
          <div>
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
                onClick={() => {
                  if (isRefineMode && handleBackFromRefinement) {
                    handleBackFromRefinement()
                  } else {
                    router.push(`/${lojistaId}/login`)
                  }
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-white hover:opacity-80 transition"
              >
                <ArrowLeftCircle className="h-6 w-6" />
              </button>
              {lojistaData?.logoUrl && (
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
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

          {/* Upload de Foto e Área Personalize o seu Look */}
          <div
            className={`flex flex-col sm:flex-row items-stretch gap-3 ${
              userPhotoUrl ? "justify-center" : "justify-center"
            }`}
          >
            {/* Upload de Foto */}
            <div className={`${userPhotoUrl ? 'w-full sm:max-w-[48%] md:max-w-[42%]' : 'w-full'}`}>
              {userPhotoUrl && !isRefineMode ? (
                <div className="relative inline-block">
                  <div className="relative rounded-2xl p-2 shadow-lg bg-white/50 inline-block" style={{ 
                    border: '4px double #3b82f6',
                    borderWidth: '4px',
                    borderStyle: 'double',
                    borderColor: '#3b82f6'
                  }}>
                    <div className="relative rounded-xl p-1 inline-block" style={{ 
                      border: '4px double #60a5fa',
                      borderWidth: '4px',
                      borderStyle: 'double',
                      borderColor: '#60a5fa'
                    }}>
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
                    onClick={() => setShowFavoritesModal(true)}
                    className="absolute left-3 bottom-3 rounded-full bg-pink-500/80 p-2 text-white transition hover:bg-pink-600 z-10"
                    title="Ver favoritos"
                  >
                    <Heart className="h-5 w-5" />
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
                <div className="relative inline-block">
                  <div className="relative rounded-2xl p-2 shadow-lg bg-white/50 inline-block" style={{ 
                    border: '4px double #3b82f6',
                    borderWidth: '4px',
                    borderStyle: 'double',
                    borderColor: '#3b82f6'
                  }}>
                    <div className="relative rounded-xl p-1 inline-block" style={{ 
                      border: '4px double #60a5fa',
                      borderWidth: '4px',
                      borderStyle: 'double',
                      borderColor: '#60a5fa'
                    }}>
                      {refineBaseImageUrl && (
                        <img
                          src={refineBaseImageUrl}
                          alt="Look base para refinamento"
                          className="h-auto w-auto max-w-full object-contain block rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-purple-600/90 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                    Adicionar Acessório
                  </div>
                  <button
                    onClick={() => setShowFavoritesModal(true)}
                    className="absolute left-3 bottom-3 rounded-full bg-pink-500/80 p-2 text-white transition hover:bg-pink-600 z-10"
                    title="Ver favoritos"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 sm:gap-4 rounded-2xl p-8 sm:p-10 md:p-12 transition hover:opacity-90 backdrop-blur"
                  style={{
                    background: "rgba(30, 58, 138, 0.15)", // Azul escuro com 15% de transparência
                    border: '4px double #3b82f6',
                    borderWidth: '4px',
                    borderStyle: 'double',
                    borderColor: '#3b82f6',
                  }}
                >
                  <Camera className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-rose-500" />
                  <span className="text-base sm:text-lg font-bold text-white text-center px-2">
                    Faça upload da sua foto
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-yellow-200 text-center px-2">PNG ou JPG até 10MB</span>
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

            {/* Área: Personalize o seu Look */}
            {userPhotoUrl && (
              <div
                className="w-full sm:flex-1 self-stretch rounded-xl border-2 border-white/30 backdrop-blur p-3 sm:p-4 md:p-5 shadow-xl flex flex-col min-h-0 sm:max-w-[48%] md:max-w-[42%]"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
                }}
              >
                <div className="mb-3 sm:mb-4 shrink-0">
                  <div className="rounded-lg border-2 border-white/50 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-2 sm:p-3 shadow-lg">
                    <h2 className="text-center text-[10px] sm:text-xs md:text-sm font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      Provador virtual com IA
                    </h2>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1 justify-between min-h-0">
                  <div className="flex flex-col gap-3 shrink-0">
                    {/* Passos com texto branco */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/80 text-sm font-bold text-white shadow-lg">1</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Carregue sua Foto</span>
                        {userPhotoUrl && (<div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${selectedProducts.length > 0 ? 'bg-teal-500/80' : 'bg-zinc-300'}`}>2</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Escolha um Produto</span>
                        {selectedProducts.length > 0 && (<div className="mt-1 h-1 w-full rounded-full bg-green-500"></div>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${userPhotoUrl && selectedProducts.length > 0 ? 'bg-teal-500/80' : 'bg-zinc-300'}`}>3</div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs md:text-sm font-semibold text-white">Crie o seu Look</span>
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
              className="rounded-xl border-2 border-white/30 backdrop-blur p-2 sm:p-2.5 shadow-xl w-full sm:w-[90%] md:w-[80%] lg:w-[70%] mx-auto"
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
                    {produto.imagemUrl && (
                      <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                        {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`[ExperimentarView] Erro ao carregar imagem: ${produto.imagemUrl}`, e);
                            // Tentar carregar novamente após um delay
                            const target = e.currentTarget;
                            setTimeout(() => {
                              if (target.src && !target.complete) {
                                const ImageConstructor = window.Image;
                                const newImg = new ImageConstructor();
                                newImg.onload = () => {
                                  target.src = newImg.src;
                                  target.style.display = '';
                                };
                                newImg.onerror = () => {
                                  target.style.display = 'none';
                                };
                                newImg.src = produto.imagemUrl || '';
                              }
                            }, 1000);
                          }}
                        />
                      </div>
                    )}
                    {/* Informações do Produto */}
                    <div className="p-1.5 bg-purple-900">
                      <h3 className="text-left text-[10px] font-semibold text-white line-clamp-2 mb-0.5 leading-tight h-7">
                        {produto.nome}
                      </h3>
                      <div className="flex flex-col gap-0.5">
                        {(() => {
                          const desconto = lojistaData?.descontoRedesSociais;
                          const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm;
                          const descontoValido =
                            desconto &&
                            desconto > 0 &&
                            (!expiraEm || new Date(expiraEm) >= new Date());
                          if (descontoAplicado && descontoValido) {
                            return (
                              <>
                                <p className="text-left text-[9px] text-purple-300 line-through">
                                  {formatPrice(produto.preco)}
                                </p>
                                <div className="flex items-center gap-0.5 flex-wrap">
                                  <p className="text-left text-[10px] font-bold text-amber-300">
                                    {formatPrice(
                                      produto.preco
                                        ? produto.preco * (1 - desconto / 100)
                                        : 0
                                    )}
                                  </p>
                                  <p className="text-left text-[7px] font-semibold text-green-400 leading-tight">
                                    Desconto aplicado
                                  </p>
                                </div>
                              </>
                            );
                          }
                          return (
                            <p className="text-left text-[10px] font-bold text-amber-300">
                              {formatPrice(produto.preco)}
                            </p>
                          );
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
            <div
              className="rounded-xl border-2 border-white/30 backdrop-blur p-4 shadow-xl"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
              }}
            >
              {isRefineMode ? (
                <p className="text-xs font-medium text-white text-center">
                  ✨ <span className="font-bold">Adicionar Acessório:</span> Selecione <span className="font-bold">1 produto</span> para adicionar ao look.
                </p>
              ) : (
                <p className="text-xs font-medium text-white text-center">
                  💡 Você pode selecionar até <span className="font-bold">2 produtos</span> de <span className="font-bold">categorias diferentes</span>
                </p>
              )}
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto */}
          <div
            className="rounded-lg border-2 border-white/30 backdrop-blur px-4 py-3 shadow-lg"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border-2 border-white/40 bg-red-700 px-3 py-1.5">
                <p className="text-xs font-medium text-white text-center">Siga, Curta ou Compartilhe !!!<br/>Aplique o seu Desconto agora!</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {lojistaData?.redesSociais?.instagram ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Instagram className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-50"><Instagram className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.facebook ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Facebook className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white opacity-50"><Facebook className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.tiktok ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-black text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Music2 className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white opacity-50"><Music2 className="h-5 w-5" /></div>)}
                <button onClick={handleShareApp} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Compartilhar aplicativo"><Share2 className="h-5 w-5" /></button>
              </div>
              {(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; if (!desconto || desconto <= 0) { return null } if (expiraEm) { const dataExpiracao = new Date(expiraEm); const agora = new Date(); if (dataExpiracao < agora) { return null } } return (
                <>
                  <p className="text-base font-semibold text-white text-center flex items-center justify-center gap-1.5">
                    <span className="font-bold text-yellow-400 text-base">GANHE</span>
                    <span className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-lg">{desconto}%</span>
                    <span className="font-semibold text-white text-base">de</span>
                    <span className="font-bold text-yellow-400 text-base">DESCONTO!</span>
                  </p>
                  {descontoAplicado && (<p className="text-xs font-semibold text-green-400 text-center animate-pulse">✓ Desconto aplicado!</p>)}
                </>
              )})()}
            </div>
          </div>

          {/* Card Principal */}
          <div
            className="rounded-3xl border-2 border-white/30 backdrop-blur p-6 md:p-8 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            {/* Abas de Categoria */}
            <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-2 sm:mx-0">
              <div className="flex gap-2 justify-start sm:justify-center px-2 sm:px-0 min-w-max sm:min-w-0 flex-wrap sm:flex-nowrap">
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

            {/* Grid de Produtos */}
            {isLoadingCatalog ? (<div className="py-12 text-center text-zinc-600">Carregando produtos...</div>) : filteredCatalog.length === 0 ? (<div className="py-12 text-center text-zinc-500">Nenhum produto encontrado.</div>) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-4 pr-2 custom-scrollbar justify-items-center" style={{ maxHeight: '900px' }}>
                {filteredCatalog.map((produto) => { const isSelected = selectedProducts.some((p) => p.id === produto.id); return (
                  <div
                    key={produto.id}
                    onClick={(e) => {
                      if (!isGenerating && !isButtonExpanded) {
                        handleProductCardClick(produto, e)
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl border-2 transition w-full ${
                      isGenerating || isButtonExpanded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${
                      isSelected
                        ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-500/30"
                        : "border-purple-500 bg-white hover:border-purple-400"
                    }`}
                  >
                    {/* Caixinha Seletora no canto superior esquerdo */}
                    <div 
                      className="product-checkbox absolute left-2 top-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isGenerating && !isButtonExpanded) {
                          toggleProductSelection(produto)
                        }
                      }}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        isSelected 
                          ? "bg-teal-500 border-teal-600" 
                          : "bg-white border-purple-500 hover:bg-purple-50"
                      }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    {produto.imagemUrl && (
                      <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                        {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`[ExperimentarView] Erro ao carregar imagem: ${produto.imagemUrl}`, e);
                            // Tentar carregar novamente após um delay
                            const target = e.currentTarget;
                            setTimeout(() => {
                              if (target.src && !target.complete) {
                                const ImageConstructor = window.Image;
                                const newImg = new ImageConstructor();
                                newImg.onload = () => {
                                  target.src = newImg.src;
                                  target.style.display = '';
                                };
                                newImg.onerror = () => {
                                  target.style.display = 'none';
                                };
                                newImg.src = produto.imagemUrl || '';
                              }
                            }, 1000);
                          }}
                        />
                      </div>
                    )}
                    <div className="p-2 bg-purple-900">
                      <h3 className="text-left text-xs font-semibold text-white line-clamp-2 h-8">
                        {produto.nome}
                      </h3>
                      <div className="mt-1 flex flex-col gap-0.5">{(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date()); if (descontoAplicado && descontoValido) { return (<><p className="text-left text-xs text-purple-300 line-through">{formatPrice(produto.preco)}</p><p className="text-left text-sm font-bold text-amber-300">{formatPrice(produto.preco ? produto.preco * (1 - (desconto / 100)) : 0)}</p></>) } return (
                        <p className="text-left text-sm font-bold text-amber-300">
                          {formatPrice(produto.preco)}
                        </p>
                      )})()}</div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAB - Visualize (oculto quando gerando) */}
      {(userPhotoUrl) && selectedProducts.length > 0 && !isGenerating && (
        <div 
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full shadow-2xl transition-all duration-500 w-auto"
          style={{ 
            background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))'
          }}
        >
          <button 
            onClick={handleCreateClick} 
            disabled={isGenerating} 
            className="flex items-center justify-center gap-2 sm:gap-3 rounded-full px-5 sm:px-7 py-3.5 sm:py-4.5 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 disabled:cursor-not-allowed w-full h-full animate-pulse-glow hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))',
              border: '4px solid white',
              borderWidth: '4px',
            }}
          >
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            <span className="hidden sm:inline">CRIAR LOOK</span>
            <span className="sm:hidden">CRIAR</span>
          </button>
        </div>
      )}

      {/* Mensagem de erro */}
      {generationError && (<div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-red-500/50 bg-red-500/10 px-4 py-3 backdrop-blur"><p className="text-sm font-medium text-red-200">{generationError}</p></div>)}

      {/* Modal de Detalhes do Produto */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedProductDetail(null)}>
          <div 
            className="w-full max-w-2xl rounded-xl border-2 border-white/30 bg-white/95 backdrop-blur-lg p-6 shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-800">Detalhes do Produto</h2>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="rounded-full p-2 text-zinc-600 hover:bg-zinc-200 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imagem do Produto */}
              {selectedProductDetail.imagemUrl && (
                <div className="relative w-full min-h-96 rounded-lg overflow-hidden border-2 border-purple-500 bg-white flex items-center justify-center">
                  {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                  <img
                    src={selectedProductDetail.imagemUrl}
                    alt={selectedProductDetail.nome}
                    className="max-h-[600px] w-auto h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`[ExperimentarView] Erro ao carregar imagem: ${selectedProductDetail.imagemUrl}`, e);
                      const target = e.currentTarget;
                      setTimeout(() => {
                        if (target.src && !target.complete) {
                          const ImageConstructor = window.Image;
                          const newImg = new ImageConstructor();
                          newImg.onload = () => {
                            target.src = newImg.src;
                            target.style.display = '';
                          };
                          newImg.onerror = () => {
                            target.style.display = 'none';
                          };
                          newImg.src = selectedProductDetail.imagemUrl || '';
                        }
                      }, 1000);
                    }}
                  />
                </div>
              )}

              {/* Nome */}
              <div>
                <h3 className="text-xl font-bold text-zinc-800 mb-2">{selectedProductDetail.nome}</h3>
              </div>

              {/* Preço */}
              <div className="p-4 bg-purple-900 rounded-lg">
                {(() => {
                  const desconto = lojistaData?.descontoRedesSociais
                  const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                  const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
                  
                  if (descontoAplicado && descontoValido) {
                    return (
                      <div className="space-y-1">
                        <p className="text-lg text-purple-300 line-through">{formatPrice(selectedProductDetail.preco)}</p>
                        <p className="text-2xl font-bold text-amber-300">
                          {formatPrice(selectedProductDetail.preco ? selectedProductDetail.preco * (1 - (desconto / 100)) : 0)}
                        </p>
                        <p className="text-xs font-semibold text-green-400 whitespace-nowrap">Desconto aplicado</p>
                      </div>
                    )
                  }
                  return (
                    <p className="text-2xl font-bold text-amber-300">
                      {formatPrice(selectedProductDetail.preco)}
                    </p>
                  )
                })()}
              </div>

              {/* Categoria */}
              {selectedProductDetail.categoria && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Categoria:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.categoria}</p>
                </div>
              )}

              {/* Tamanhos */}
              {selectedProductDetail.tamanhos && selectedProductDetail.tamanhos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-2">Tamanhos disponíveis:</p>
                  {selectedProductDetail.tamanhos.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(selectedSize === tamanho ? null : tamanho)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            selectedSize === tamanho
                              ? 'bg-purple-600 text-white border-2 border-purple-700 shadow-lg'
                              : 'bg-purple-100 text-purple-800 border-2 border-purple-300 hover:bg-purple-200'
                          }`}
                        >
                          {tamanho}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {tamanho}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cores */}
              {selectedProductDetail.cores && selectedProductDetail.cores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Cores disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductDetail.cores.map((cor, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {cor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medidas */}
              {selectedProductDetail.medidas && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Medidas:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.medidas}</p>
                </div>
              )}

              {/* Estoque */}
              {selectedProductDetail.estoque !== null && selectedProductDetail.estoque !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Estoque:</p>
                  <p className={`text-base font-medium ${selectedProductDetail.estoque > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProductDetail.estoque > 0 ? `${selectedProductDetail.estoque} unidades disponíveis` : 'Fora de estoque'}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedProductDetail.obs && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Observações:</p>
                  <p className="text-base text-zinc-800 whitespace-pre-wrap">{selectedProductDetail.obs}</p>
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
                      <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-white/30 bg-white/40">
                        <Image
                          src={lojistaData.logoUrl}
                          alt={lojistaData.nome || "Logo"}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover opacity-80"
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
                onClick={() => {
                  const checkoutLink = lojistaData?.salesConfig?.checkoutLink || lojistaData?.salesConfig?.whatsappLink
                  if (checkoutLink) {
                    window.open(checkoutLink, "_blank", "noopener,noreferrer")
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
                    // Salvar a foto para substituir a foto de upload na tela de experimentar
                    sessionStorage.setItem(`photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                    console.log("[ExperimentarView] Foto do favorito salva para tela de experimentar:", selectedFavoriteDetail.imagemUrl)
                    setSelectedFavoriteDetail(null)
                    setShowFavoritesModal(false)
                    // Redirecionar para a tela de experimentar (já estamos nela, mas recarregar para aplicar a foto)
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
                  <ArrowLeftCircle className="h-5 w-5" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


                          if (descontoAplicado && descontoValido) {
                            return (
                              <>
                                <p className="text-left text-[9px] text-purple-300 line-through">
                                  {formatPrice(produto.preco)}
                                </p>
                                <div className="flex items-center gap-0.5 flex-wrap">
                                  <p className="text-left text-[10px] font-bold text-amber-300">
                                    {formatPrice(
                                      produto.preco
                                        ? produto.preco * (1 - desconto / 100)
                                        : 0
                                    )}
                                  </p>
                                  <p className="text-left text-[7px] font-semibold text-green-400 leading-tight">
                                    Desconto aplicado
                                  </p>
                                </div>
                              </>
                            );
                          }
                          return (
                            <p className="text-left text-[10px] font-bold text-amber-300">
                              {formatPrice(produto.preco)}
                            </p>
                          );
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
            <div
              className="rounded-xl border-2 border-white/30 backdrop-blur p-4 shadow-xl"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
              }}
            >
              {isRefineMode ? (
                <p className="text-xs font-medium text-white text-center">
                  ✨ <span className="font-bold">Adicionar Acessório:</span> Selecione <span className="font-bold">1 produto</span> para adicionar ao look.
                </p>
              ) : (
                <p className="text-xs font-medium text-white text-center">
                  💡 Você pode selecionar até <span className="font-bold">2 produtos</span> de <span className="font-bold">categorias diferentes</span>
                </p>
              )}
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto */}
          <div
            className="rounded-lg border-2 border-white/30 backdrop-blur px-4 py-3 shadow-lg"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border-2 border-white/40 bg-red-700 px-3 py-1.5">
                <p className="text-xs font-medium text-white text-center">Siga, Curta ou Compartilhe !!!<br/>Aplique o seu Desconto agora!</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {lojistaData?.redesSociais?.instagram ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Instagram className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-50"><Instagram className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.facebook ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Facebook className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white opacity-50"><Facebook className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.tiktok ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-black text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Music2 className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white opacity-50"><Music2 className="h-5 w-5" /></div>)}
                <button onClick={handleShareApp} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Compartilhar aplicativo"><Share2 className="h-5 w-5" /></button>
              </div>
              {(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; if (!desconto || desconto <= 0) { return null } if (expiraEm) { const dataExpiracao = new Date(expiraEm); const agora = new Date(); if (dataExpiracao < agora) { return null } } return (
                <>
                  <p className="text-base font-semibold text-white text-center flex items-center justify-center gap-1.5">
                    <span className="font-bold text-yellow-400 text-base">GANHE</span>
                    <span className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-lg">{desconto}%</span>
                    <span className="font-semibold text-white text-base">de</span>
                    <span className="font-bold text-yellow-400 text-base">DESCONTO!</span>
                  </p>
                  {descontoAplicado && (<p className="text-xs font-semibold text-green-400 text-center animate-pulse">✓ Desconto aplicado!</p>)}
                </>
              )})()}
            </div>
          </div>

          {/* Card Principal */}
          <div
            className="rounded-3xl border-2 border-white/30 backdrop-blur p-6 md:p-8 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            {/* Abas de Categoria */}
            <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-2 sm:mx-0">
              <div className="flex gap-2 justify-start sm:justify-center px-2 sm:px-0 min-w-max sm:min-w-0 flex-wrap sm:flex-nowrap">
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

            {/* Grid de Produtos */}
            {isLoadingCatalog ? (<div className="py-12 text-center text-zinc-600">Carregando produtos...</div>) : filteredCatalog.length === 0 ? (<div className="py-12 text-center text-zinc-500">Nenhum produto encontrado.</div>) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-4 pr-2 custom-scrollbar justify-items-center" style={{ maxHeight: '900px' }}>
                {filteredCatalog.map((produto) => { const isSelected = selectedProducts.some((p) => p.id === produto.id); return (
                  <div
                    key={produto.id}
                    onClick={(e) => {
                      if (!isGenerating && !isButtonExpanded) {
                        handleProductCardClick(produto, e)
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl border-2 transition w-full ${
                      isGenerating || isButtonExpanded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${
                      isSelected
                        ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-500/30"
                        : "border-purple-500 bg-white hover:border-purple-400"
                    }`}
                  >
                    {/* Caixinha Seletora no canto superior esquerdo */}
                    <div 
                      className="product-checkbox absolute left-2 top-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isGenerating && !isButtonExpanded) {
                          toggleProductSelection(produto)
                        }
                      }}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        isSelected 
                          ? "bg-teal-500 border-teal-600" 
                          : "bg-white border-purple-500 hover:bg-purple-50"
                      }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    {produto.imagemUrl && (
                      <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                        {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`[ExperimentarView] Erro ao carregar imagem: ${produto.imagemUrl}`, e);
                            // Tentar carregar novamente após um delay
                            const target = e.currentTarget;
                            setTimeout(() => {
                              if (target.src && !target.complete) {
                                const ImageConstructor = window.Image;
                                const newImg = new ImageConstructor();
                                newImg.onload = () => {
                                  target.src = newImg.src;
                                  target.style.display = '';
                                };
                                newImg.onerror = () => {
                                  target.style.display = 'none';
                                };
                                newImg.src = produto.imagemUrl || '';
                              }
                            }, 1000);
                          }}
                        />
                      </div>
                    )}
                    <div className="p-2 bg-purple-900">
                      <h3 className="text-left text-xs font-semibold text-white line-clamp-2 h-8">
                        {produto.nome}
                      </h3>
                      <div className="mt-1 flex flex-col gap-0.5">{(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date()); if (descontoAplicado && descontoValido) { return (<><p className="text-left text-xs text-purple-300 line-through">{formatPrice(produto.preco)}</p><p className="text-left text-sm font-bold text-amber-300">{formatPrice(produto.preco ? produto.preco * (1 - (desconto / 100)) : 0)}</p></>) } return (
                        <p className="text-left text-sm font-bold text-amber-300">
                          {formatPrice(produto.preco)}
                        </p>
                      )})()}</div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAB - Visualize (oculto quando gerando) */}
      {(userPhotoUrl) && selectedProducts.length > 0 && !isGenerating && (
        <div 
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full shadow-2xl transition-all duration-500 w-auto"
          style={{ 
            background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))'
          }}
        >
          <button 
            onClick={handleCreateClick} 
            disabled={isGenerating} 
            className="flex items-center justify-center gap-2 sm:gap-3 rounded-full px-5 sm:px-7 py-3.5 sm:py-4.5 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 disabled:cursor-not-allowed w-full h-full animate-pulse-glow hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))',
              border: '4px solid white',
              borderWidth: '4px',
            }}
          >
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            <span className="hidden sm:inline">CRIAR LOOK</span>
            <span className="sm:hidden">CRIAR</span>
          </button>
        </div>
      )}

      {/* Mensagem de erro */}
      {generationError && (<div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-red-500/50 bg-red-500/10 px-4 py-3 backdrop-blur"><p className="text-sm font-medium text-red-200">{generationError}</p></div>)}

      {/* Modal de Detalhes do Produto */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedProductDetail(null)}>
          <div 
            className="w-full max-w-2xl rounded-xl border-2 border-white/30 bg-white/95 backdrop-blur-lg p-6 shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-800">Detalhes do Produto</h2>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="rounded-full p-2 text-zinc-600 hover:bg-zinc-200 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imagem do Produto */}
              {selectedProductDetail.imagemUrl && (
                <div className="relative w-full min-h-96 rounded-lg overflow-hidden border-2 border-purple-500 bg-white flex items-center justify-center">
                  {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                  <img
                    src={selectedProductDetail.imagemUrl}
                    alt={selectedProductDetail.nome}
                    className="max-h-[600px] w-auto h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`[ExperimentarView] Erro ao carregar imagem: ${selectedProductDetail.imagemUrl}`, e);
                      const target = e.currentTarget;
                      setTimeout(() => {
                        if (target.src && !target.complete) {
                          const ImageConstructor = window.Image;
                          const newImg = new ImageConstructor();
                          newImg.onload = () => {
                            target.src = newImg.src;
                            target.style.display = '';
                          };
                          newImg.onerror = () => {
                            target.style.display = 'none';
                          };
                          newImg.src = selectedProductDetail.imagemUrl || '';
                        }
                      }, 1000);
                    }}
                  />
                </div>
              )}

              {/* Nome */}
              <div>
                <h3 className="text-xl font-bold text-zinc-800 mb-2">{selectedProductDetail.nome}</h3>
              </div>

              {/* Preço */}
              <div className="p-4 bg-purple-900 rounded-lg">
                {(() => {
                  const desconto = lojistaData?.descontoRedesSociais
                  const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                  const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
                  
                  if (descontoAplicado && descontoValido) {
                    return (
                      <div className="space-y-1">
                        <p className="text-lg text-purple-300 line-through">{formatPrice(selectedProductDetail.preco)}</p>
                        <p className="text-2xl font-bold text-amber-300">
                          {formatPrice(selectedProductDetail.preco ? selectedProductDetail.preco * (1 - (desconto / 100)) : 0)}
                        </p>
                        <p className="text-xs font-semibold text-green-400 whitespace-nowrap">Desconto aplicado</p>
                      </div>
                    )
                  }
                  return (
                    <p className="text-2xl font-bold text-amber-300">
                      {formatPrice(selectedProductDetail.preco)}
                    </p>
                  )
                })()}
              </div>

              {/* Categoria */}
              {selectedProductDetail.categoria && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Categoria:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.categoria}</p>
                </div>
              )}

              {/* Tamanhos */}
              {selectedProductDetail.tamanhos && selectedProductDetail.tamanhos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-2">Tamanhos disponíveis:</p>
                  {selectedProductDetail.tamanhos.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(selectedSize === tamanho ? null : tamanho)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            selectedSize === tamanho
                              ? 'bg-purple-600 text-white border-2 border-purple-700 shadow-lg'
                              : 'bg-purple-100 text-purple-800 border-2 border-purple-300 hover:bg-purple-200'
                          }`}
                        >
                          {tamanho}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {tamanho}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cores */}
              {selectedProductDetail.cores && selectedProductDetail.cores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Cores disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductDetail.cores.map((cor, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {cor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medidas */}
              {selectedProductDetail.medidas && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Medidas:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.medidas}</p>
                </div>
              )}

              {/* Estoque */}
              {selectedProductDetail.estoque !== null && selectedProductDetail.estoque !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Estoque:</p>
                  <p className={`text-base font-medium ${selectedProductDetail.estoque > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProductDetail.estoque > 0 ? `${selectedProductDetail.estoque} unidades disponíveis` : 'Fora de estoque'}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedProductDetail.obs && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Observações:</p>
                  <p className="text-base text-zinc-800 whitespace-pre-wrap">{selectedProductDetail.obs}</p>
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
                      <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-white/30 bg-white/40">
                        <Image
                          src={lojistaData.logoUrl}
                          alt={lojistaData.nome || "Logo"}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover opacity-80"
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
                onClick={() => {
                  const checkoutLink = lojistaData?.salesConfig?.checkoutLink || lojistaData?.salesConfig?.whatsappLink
                  if (checkoutLink) {
                    window.open(checkoutLink, "_blank", "noopener,noreferrer")
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
                    // Salvar a foto para substituir a foto de upload na tela de experimentar
                    sessionStorage.setItem(`photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                    console.log("[ExperimentarView] Foto do favorito salva para tela de experimentar:", selectedFavoriteDetail.imagemUrl)
                    setSelectedFavoriteDetail(null)
                    setShowFavoritesModal(false)
                    // Redirecionar para a tela de experimentar (já estamos nela, mas recarregar para aplicar a foto)
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
                  <ArrowLeftCircle className="h-5 w-5" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


                          if (descontoAplicado && descontoValido) {
                            return (
                              <>
                                <p className="text-left text-[9px] text-purple-300 line-through">
                                  {formatPrice(produto.preco)}
                                </p>
                                <div className="flex items-center gap-0.5 flex-wrap">
                                  <p className="text-left text-[10px] font-bold text-amber-300">
                                    {formatPrice(
                                      produto.preco
                                        ? produto.preco * (1 - desconto / 100)
                                        : 0
                                    )}
                                  </p>
                                  <p className="text-left text-[7px] font-semibold text-green-400 leading-tight">
                                    Desconto aplicado
                                  </p>
                                </div>
                              </>
                            );
                          }
                          return (
                            <p className="text-left text-[10px] font-bold text-amber-300">
                              {formatPrice(produto.preco)}
                            </p>
                          );
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
            <div
              className="rounded-xl border-2 border-white/30 backdrop-blur p-4 shadow-xl"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
              }}
            >
              {isRefineMode ? (
                <p className="text-xs font-medium text-white text-center">
                  ✨ <span className="font-bold">Adicionar Acessório:</span> Selecione <span className="font-bold">1 produto</span> para adicionar ao look.
                </p>
              ) : (
                <p className="text-xs font-medium text-white text-center">
                  💡 Você pode selecionar até <span className="font-bold">2 produtos</span> de <span className="font-bold">categorias diferentes</span>
                </p>
              )}
            </div>
          )}

          {/* Caixa de Redes Sociais e Desconto */}
          <div
            className="rounded-lg border-2 border-white/30 backdrop-blur px-4 py-3 shadow-lg"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md border-2 border-white/40 bg-red-700 px-3 py-1.5">
                <p className="text-xs font-medium text-white text-center">Siga, Curta ou Compartilhe !!!<br/>Aplique o seu Desconto agora!</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {lojistaData?.redesSociais?.instagram ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.instagram!.startsWith('http') ? lojistaData.redesSociais.instagram! : `https://instagram.com/${lojistaData.redesSociais.instagram!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Instagram className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-50"><Instagram className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.facebook ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.facebook!.startsWith('http') ? lojistaData.redesSociais.facebook! : `https://facebook.com/${lojistaData.redesSociais.facebook!}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Facebook className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white opacity-50"><Facebook className="h-5 w-5" /></div>)}
                {lojistaData?.redesSociais?.tiktok ? (<button onClick={() => handleSocialClick(lojistaData.redesSociais.tiktok!.startsWith('http') ? lojistaData.redesSociais.tiktok! : `https://tiktok.com/@${lojistaData.redesSociais.tiktok!.replace('@', '')}`)} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-black text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Music2 className="h-5 w-5" /></button>) : (<div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white opacity-50"><Music2 className="h-5 w-5" /></div>)}
                <button onClick={handleShareApp} disabled={isGenerating || isButtonExpanded} className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white transition hover:scale-110 ${isGenerating || isButtonExpanded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title="Compartilhar aplicativo"><Share2 className="h-5 w-5" /></button>
              </div>
              {(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; if (!desconto || desconto <= 0) { return null } if (expiraEm) { const dataExpiracao = new Date(expiraEm); const agora = new Date(); if (dataExpiracao < agora) { return null } } return (
                <>
                  <p className="text-base font-semibold text-white text-center flex items-center justify-center gap-1.5">
                    <span className="font-bold text-yellow-400 text-base">GANHE</span>
                    <span className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-lg">{desconto}%</span>
                    <span className="font-semibold text-white text-base">de</span>
                    <span className="font-bold text-yellow-400 text-base">DESCONTO!</span>
                  </p>
                  {descontoAplicado && (<p className="text-xs font-semibold text-green-400 text-center animate-pulse">✓ Desconto aplicado!</p>)}
                </>
              )})()}
            </div>
          </div>

          {/* Card Principal */}
          <div
            className="rounded-3xl border-2 border-white/30 backdrop-blur p-6 md:p-8 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            {/* Abas de Categoria */}
            <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-2 sm:mx-0">
              <div className="flex gap-2 justify-start sm:justify-center px-2 sm:px-0 min-w-max sm:min-w-0 flex-wrap sm:flex-nowrap">
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

            {/* Grid de Produtos */}
            {isLoadingCatalog ? (<div className="py-12 text-center text-zinc-600">Carregando produtos...</div>) : filteredCatalog.length === 0 ? (<div className="py-12 text-center text-zinc-500">Nenhum produto encontrado.</div>) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-4 pr-2 custom-scrollbar justify-items-center" style={{ maxHeight: '900px' }}>
                {filteredCatalog.map((produto) => { const isSelected = selectedProducts.some((p) => p.id === produto.id); return (
                  <div
                    key={produto.id}
                    onClick={(e) => {
                      if (!isGenerating && !isButtonExpanded) {
                        handleProductCardClick(produto, e)
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl border-2 transition w-full ${
                      isGenerating || isButtonExpanded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${
                      isSelected
                        ? "border-teal-400 bg-teal-50 shadow-lg shadow-teal-500/30"
                        : "border-purple-500 bg-white hover:border-purple-400"
                    }`}
                  >
                    {/* Caixinha Seletora no canto superior esquerdo */}
                    <div 
                      className="product-checkbox absolute left-2 top-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isGenerating && !isButtonExpanded) {
                          toggleProductSelection(produto)
                        }
                      }}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        isSelected 
                          ? "bg-teal-500 border-teal-600" 
                          : "bg-white border-purple-500 hover:bg-purple-50"
                      }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    {produto.imagemUrl && (
                      <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                        {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`[ExperimentarView] Erro ao carregar imagem: ${produto.imagemUrl}`, e);
                            // Tentar carregar novamente após um delay
                            const target = e.currentTarget;
                            setTimeout(() => {
                              if (target.src && !target.complete) {
                                const ImageConstructor = window.Image;
                                const newImg = new ImageConstructor();
                                newImg.onload = () => {
                                  target.src = newImg.src;
                                  target.style.display = '';
                                };
                                newImg.onerror = () => {
                                  target.style.display = 'none';
                                };
                                newImg.src = produto.imagemUrl || '';
                              }
                            }, 1000);
                          }}
                        />
                      </div>
                    )}
                    <div className="p-2 bg-purple-900">
                      <h3 className="text-left text-xs font-semibold text-white line-clamp-2 h-8">
                        {produto.nome}
                      </h3>
                      <div className="mt-1 flex flex-col gap-0.5">{(() => { const desconto = lojistaData?.descontoRedesSociais; const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm; const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date()); if (descontoAplicado && descontoValido) { return (<><p className="text-left text-xs text-purple-300 line-through">{formatPrice(produto.preco)}</p><p className="text-left text-sm font-bold text-amber-300">{formatPrice(produto.preco ? produto.preco * (1 - (desconto / 100)) : 0)}</p></>) } return (
                        <p className="text-left text-sm font-bold text-amber-300">
                          {formatPrice(produto.preco)}
                        </p>
                      )})()}</div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAB - Visualize (oculto quando gerando) */}
      {(userPhotoUrl) && selectedProducts.length > 0 && !isGenerating && (
        <div 
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full shadow-2xl transition-all duration-500 w-auto"
          style={{ 
            background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))'
          }}
        >
          <button 
            onClick={handleCreateClick} 
            disabled={isGenerating} 
            className="flex items-center justify-center gap-2 sm:gap-3 rounded-full px-5 sm:px-7 py-3.5 sm:py-4.5 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 disabled:cursor-not-allowed w-full h-full animate-pulse-glow hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))',
              border: '4px solid white',
              borderWidth: '4px',
            }}
          >
            <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            <span className="hidden sm:inline">CRIAR LOOK</span>
            <span className="sm:hidden">CRIAR</span>
          </button>
        </div>
      )}

      {/* Mensagem de erro */}
      {generationError && (<div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-red-500/50 bg-red-500/10 px-4 py-3 backdrop-blur"><p className="text-sm font-medium text-red-200">{generationError}</p></div>)}

      {/* Modal de Detalhes do Produto */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-8 sm:pt-12 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedProductDetail(null)}>
          <div 
            className="w-full max-w-2xl rounded-xl border-2 border-white/30 bg-white/95 backdrop-blur-lg p-6 shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-800">Detalhes do Produto</h2>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="rounded-full p-2 text-zinc-600 hover:bg-zinc-200 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Imagem do Produto */}
              {selectedProductDetail.imagemUrl && (
                <div className="relative w-full min-h-96 rounded-lg overflow-hidden border-2 border-purple-500 bg-white flex items-center justify-center">
                  {/* Usar img tag para todas as URLs externas para evitar problemas com Next.js Image */}
                  <img
                    src={selectedProductDetail.imagemUrl}
                    alt={selectedProductDetail.nome}
                    className="max-h-[600px] w-auto h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      console.error(`[ExperimentarView] Erro ao carregar imagem: ${selectedProductDetail.imagemUrl}`, e);
                      const target = e.currentTarget;
                      setTimeout(() => {
                        if (target.src && !target.complete) {
                          const ImageConstructor = window.Image;
                          const newImg = new ImageConstructor();
                          newImg.onload = () => {
                            target.src = newImg.src;
                            target.style.display = '';
                          };
                          newImg.onerror = () => {
                            target.style.display = 'none';
                          };
                          newImg.src = selectedProductDetail.imagemUrl || '';
                        }
                      }, 1000);
                    }}
                  />
                </div>
              )}

              {/* Nome */}
              <div>
                <h3 className="text-xl font-bold text-zinc-800 mb-2">{selectedProductDetail.nome}</h3>
              </div>

              {/* Preço */}
              <div className="p-4 bg-purple-900 rounded-lg">
                {(() => {
                  const desconto = lojistaData?.descontoRedesSociais
                  const expiraEm = lojistaData?.descontoRedesSociaisExpiraEm
                  const descontoValido = desconto && desconto > 0 && (!expiraEm || new Date(expiraEm) >= new Date())
                  
                  if (descontoAplicado && descontoValido) {
                    return (
                      <div className="space-y-1">
                        <p className="text-lg text-purple-300 line-through">{formatPrice(selectedProductDetail.preco)}</p>
                        <p className="text-2xl font-bold text-amber-300">
                          {formatPrice(selectedProductDetail.preco ? selectedProductDetail.preco * (1 - (desconto / 100)) : 0)}
                        </p>
                        <p className="text-xs font-semibold text-green-400 whitespace-nowrap">Desconto aplicado</p>
                      </div>
                    )
                  }
                  return (
                    <p className="text-2xl font-bold text-amber-300">
                      {formatPrice(selectedProductDetail.preco)}
                    </p>
                  )
                })()}
              </div>

              {/* Categoria */}
              {selectedProductDetail.categoria && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Categoria:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.categoria}</p>
                </div>
              )}

              {/* Tamanhos */}
              {selectedProductDetail.tamanhos && selectedProductDetail.tamanhos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-2">Tamanhos disponíveis:</p>
                  {selectedProductDetail.tamanhos.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(selectedSize === tamanho ? null : tamanho)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            selectedSize === tamanho
                              ? 'bg-purple-600 text-white border-2 border-purple-700 shadow-lg'
                              : 'bg-purple-100 text-purple-800 border-2 border-purple-300 hover:bg-purple-200'
                          }`}
                        >
                          {tamanho}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetail.tamanhos.map((tamanho, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {tamanho}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cores */}
              {selectedProductDetail.cores && selectedProductDetail.cores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Cores disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductDetail.cores.map((cor, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {cor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medidas */}
              {selectedProductDetail.medidas && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Medidas:</p>
                  <p className="text-base text-zinc-800">{selectedProductDetail.medidas}</p>
                </div>
              )}

              {/* Estoque */}
              {selectedProductDetail.estoque !== null && selectedProductDetail.estoque !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Estoque:</p>
                  <p className={`text-base font-medium ${selectedProductDetail.estoque > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProductDetail.estoque > 0 ? `${selectedProductDetail.estoque} unidades disponíveis` : 'Fora de estoque'}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedProductDetail.obs && (
                <div>
                  <p className="text-sm font-semibold text-zinc-600 mb-1">Observações:</p>
                  <p className="text-base text-zinc-800 whitespace-pre-wrap">{selectedProductDetail.obs}</p>
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
          <div className="w-full max-w-4xl rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-2xl mb-8">
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
                      <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border border-white/30 bg-white/40">
                        <Image
                          src={lojistaData.logoUrl}
                          alt={lojistaData.nome || "Logo"}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover opacity-80"
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
                onClick={() => {
                  const checkoutLink = lojistaData?.salesConfig?.checkoutLink || lojistaData?.salesConfig?.whatsappLink
                  if (checkoutLink) {
                    window.open(checkoutLink, "_blank", "noopener,noreferrer")
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
                    // Salvar a foto para substituir a foto de upload na tela de experimentar
                    sessionStorage.setItem(`photo_${lojistaId}`, selectedFavoriteDetail.imagemUrl)
                    console.log("[ExperimentarView] Foto do favorito salva para tela de experimentar:", selectedFavoriteDetail.imagemUrl)
                    setSelectedFavoriteDetail(null)
                    setShowFavoritesModal(false)
                    // Redirecionar para a tela de experimentar (já estamos nela, mas recarregar para aplicar a foto)
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
                  <ArrowLeftCircle className="h-5 w-5" /> Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

