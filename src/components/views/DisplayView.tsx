"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"
import { doc, onSnapshot, Timestamp } from "firebase/firestore"
import type { LojistaData } from "@/lib/types"
import { SafeImage } from "../ui/SafeImage"
import { Sparkles, Wand2, Star, Heart, Zap, Crown } from "lucide-react"

interface DisplayViewProps {
  lojistaData: LojistaData | null
}

type ViewMode = "idle" | "active"

interface Composicao {
  id: string
  imagemUrl: string
  createdAt: Timestamp | Date
  customerId?: string
  lojistaId?: string
}

// Frases criativas rotativas para o display
const creativePhrases = [
  { icon: Sparkles, text: "Experimente looks incríveis com IA", color: "from-purple-400 to-pink-400" },
  { icon: Wand2, text: "Magia da moda na ponta dos dedos", color: "from-blue-400 to-cyan-400" },
  { icon: Star, text: "Descubra seu estilo único", color: "from-yellow-400 to-orange-400" },
  { icon: Heart, text: "Moda que combina com você", color: "from-pink-400 to-rose-400" },
  { icon: Zap, text: "Transforme seu guarda-roupa", color: "from-indigo-400 to-purple-400" },
  { icon: Crown, text: "Seja a estrela que você já é", color: "from-amber-400 to-yellow-400" },
]

export function DisplayView({ lojistaData }: DisplayViewProps) {
  const params = useParams()
  const lojistaId = params?.lojistaId as string

  const [viewMode, setViewMode] = useState<ViewMode>("idle")
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  
  // Fase 10: UUID único para este display
  const [displayUuid, setDisplayUuid] = useState<string | null>(null)
  
  // Cache de imagens pré-carregadas para troca mais rápida
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  // Orientação do display (horizontal ou vertical)
  const orientation = lojistaData?.displayOrientation || "horizontal"
  const isVertical = orientation === "vertical"

  // Rotação de frases criativas
  useEffect(() => {
    if (viewMode === "idle") {
      const interval = setInterval(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % creativePhrases.length)
      }, 4000) // Mudar frase a cada 4 segundos
      return () => clearInterval(interval)
    }
  }, [viewMode])

  // Inicializar ou recuperar display_uuid
  useEffect(() => {
    if (typeof window === "undefined") return

    // Verificar se já existe um UUID salvo
    let uuid = localStorage.getItem("display_uuid")
    
    // Se não existir, gerar um novo
    if (!uuid) {
      uuid = crypto.randomUUID()
      localStorage.setItem("display_uuid", uuid)
      console.log("[DisplayView] Novo display_uuid gerado:", uuid)
    } else {
      console.log("[DisplayView] Display_uuid recuperado:", uuid)
    }
    
    setDisplayUuid(uuid)
  }, [])

  // Gerar URL do QR Code (Fase 10: incluir target_display)
  // IMPORTANTE: QR Code deve apontar para o APP do cliente, não para o display
  const getQrCodeUrl = () => {
    if (typeof window === "undefined" || !displayUuid) return ""
    
    // Detectar se está em desenvolvimento
    const isDev = window.location.hostname === "localhost"
    
    // Determinar URL base - SEMPRE usar subdomínio de display para garantir que mostre a tela do display
    let baseUrl: string
    if (isDev) {
      // Em desenvolvimento, usar localhost com porta do modelo-2
      const port = process.env.NEXT_PUBLIC_MODELO2_PORT || process.env.NEXT_PUBLIC_MODELO_2_PORT || "3005"
      baseUrl = `http://localhost:${port}`
    } else {
      // Em produção, SEMPRE usar subdomínio de display para garantir que mostre a tela do display
      const displayDomain = process.env.NEXT_PUBLIC_DISPLAY_DOMAIN || "display.experimenteai.com.br"
      const protocol = process.env.NEXT_PUBLIC_DISPLAY_PROTOCOL || "https"
      baseUrl = `${protocol}://${displayDomain}`
    }
    
    // Sempre incluir display=1 para garantir que mostre a tela do display
    const url = `${baseUrl}/${lojistaId}/experimentar?display=1&connect=true&lojista=${lojistaId}&target_display=${displayUuid}`
    console.log("[DisplayView] QR Code URL gerada:", url)
    return url
  }

  // Fase 10: Escutar displays/{display_uuid} (com fallback para composicoes)
  useEffect(() => {
    if (!lojistaId || !isFirebaseConfigured || !displayUuid) return

    const db = getFirestoreClient()
    if (!db) {
      console.warn("[DisplayView] Firestore não disponível")
      return
    }

    console.log("[DisplayView] Iniciando listener para display_uuid:", displayUuid)

    // Fase 10: Escutar coleção displays/{display_uuid}
    const displayRef = doc(db, "displays", displayUuid)

    const unsubscribe = onSnapshot(
      displayRef,
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          console.log("[DisplayView] Display não encontrado, voltando para idle")
          setViewMode("idle")
          setActiveImage(null)
          return
        }

        const data = docSnapshot.data()
        
        console.log("[DisplayView] Atualização recebida do display:", {
          hasImage: !!data.activeImage,
          timestamp: data.timestamp
        })

        if (data.activeImage) {
          // Verificar se a atualização é recente (últimos 180 segundos para dar margem)
          const timestamp = data.timestamp
          let updateTime: number

          if (timestamp instanceof Timestamp) {
            updateTime = timestamp.toMillis()
          } else if (timestamp instanceof Date) {
            updateTime = timestamp.getTime()
          } else if (timestamp?.seconds) {
            updateTime = timestamp.seconds * 1000
          } else if (typeof timestamp === "number") {
            updateTime = timestamp
          } else {
            // Se não houver timestamp, assumir que é recente
            updateTime = Date.now()
          }

          const now = Date.now()
          const ageInSeconds = (now - updateTime) / 1000

          console.log("[DisplayView] Idade da atualização:", ageInSeconds, "segundos")

          // Se foi atualizado nos últimos 180 segundos, mostrar na tela (margem maior que o timeout de 120s)
          if (ageInSeconds <= 180) {
            console.log("[DisplayView] ✅ Mostrando nova imagem na tela")
            
            // Limpar timeout anterior se existir
            if (timeoutId) {
              clearTimeout(timeoutId)
            }

            // Otimização: Pré-carregar imagem antes de atualizar estado para troca mais rápida
            const newImageUrl = data.activeImage
            if (newImageUrl !== activeImage) {
              // Verificar se já está no cache
              if (!imageCache.current.has(newImageUrl)) {
                // Pré-carregar a nova imagem e adicionar ao cache
                const img = new Image()
                img.src = newImageUrl
                imageCache.current.set(newImageUrl, img)
              }
              
              // Atualizar estado imediatamente (não esperar carregamento completo)
              // O navegador vai usar o cache e mostrar rapidamente
              setActiveImage(newImageUrl)
              setViewMode("active")
            } else {
              // Mesma imagem, apenas garantir que está ativa
              setViewMode("active")
            }

            // Iniciar timeout de 120 segundos (2 minutos)
            // IMPORTANTE: Sempre iniciar o timeout, mesmo se a imagem já estava sendo exibida
            // Isso garante que o tempo de 120 segundos seja respeitado
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
            
            const newTimeoutId = setTimeout(() => {
              console.log("[DisplayView] Timeout de 120 segundos: voltando para modo idle")
              setViewMode("idle")
              setActiveImage(null)
              setTimeoutId(null)
            }, 120000) // 120 segundos (2 minutos) - tempo exato de exibição

            setTimeoutId(newTimeoutId)
            console.log("[DisplayView] ✅ Timeout de 120 segundos iniciado para a imagem")
          } else {
            console.log("[DisplayView] Atualização muito antiga (mais de 180 segundos), ignorando")
            // Se muito antiga, limpar
            setViewMode("idle")
            setActiveImage(null)
            // Limpar timeout se existir
            if (timeoutId) {
              clearTimeout(timeoutId)
              setTimeoutId(null)
            }
          }
        } else {
          // Sem imagem ativa, voltar para idle
          setViewMode("idle")
          setActiveImage(null)
        }
      },
      (error) => {
        console.error("[DisplayView] Erro ao escutar display:", error)
        // Continuar funcionando mesmo com erro de permissão (modo degradado)
      }
    )

    return () => {
      unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lojistaId, displayUuid, timeoutId])

  const currentPhrase = creativePhrases[currentPhraseIndex]
  const IconComponent = currentPhrase.icon

  // Renderizar modo idle (QR Code)
  if (viewMode === "idle" || !activeImage) {
    return (
      <div 
        className={`relative w-full h-full text-white flex flex-col items-center justify-center ${isVertical ? 'p-4' : 'p-8'} overflow-hidden`}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift 15s ease infinite",
          minHeight: "100vh",
          height: "100vh"
        }}
      >
        {/* Animações de fundo decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Logo da Loja (se disponível) */}
        {lojistaData?.logoUrl && (
          <div className={`absolute ${isVertical ? 'top-6 left-6' : 'top-8 left-8'} z-10`}>
            <div className={`${isVertical ? 'w-20 h-20' : 'w-28 h-28'} rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 backdrop-blur-md`}>
              <img
                src={lojistaData.logoUrl}
                alt={lojistaData.nome || "Logo"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Conteúdo Principal - Layout diferente para vertical */}
        {isVertical ? (
          // Layout Vertical (TV na vertical) - Otimizado para preencher a tela
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 w-full h-full px-8 py-12">
            {/* Nome da loja no topo - compacto */}
            {lojistaData?.nome && (
              <div className="text-center space-y-1 mb-2">
                <h1 className="text-3xl font-black text-white drop-shadow-2xl">
                  Bem-vindo à
                </h1>
                <span 
                  className="text-4xl font-black bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent block"
                  style={{ textShadow: "none" }}
                >
                  {lojistaData.nome}
                </span>
              </div>
            )}

            {/* QR Code centralizado - maior para TV */}
            <div className="flex flex-col items-center gap-4 flex-1 justify-center">
              <div 
                className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border-4 border-white/50"
                style={{
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2) inset"
                }}
              >
                <QRCodeSVG
                  value={getQrCodeUrl()}
                  size={320}
                  level="L"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
                {/* Decoração no canto do QR Code */}
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Texto abaixo do QR Code */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white drop-shadow-2xl">
                  Escaneie para Começar
                </h2>
                <p className="text-base text-white/90 max-w-md font-medium drop-shadow-lg">
                  Aponte a câmera do seu celular para o código e descubra sua próxima paixão fashion
                </p>
              </div>
            </div>

            {/* Frase criativa no rodapé - compacta */}
            <div className="mt-4">
              <div 
                key={currentPhraseIndex}
                className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/30 shadow-xl transform transition-all duration-500 animate-fade-in"
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${currentPhrase.color} shadow-lg`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <p className="text-base font-bold text-white drop-shadow-lg">
                  {currentPhrase.text}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Layout Horizontal (padrão)
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-16 max-w-7xl w-full">
            {/* QR Code com design melhorado */}
            <div className="flex flex-col items-center gap-8">
              <div 
                className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-4 border-white/50 transform transition-transform hover:scale-105"
                style={{
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2) inset"
                }}
              >
                <QRCodeSVG
                  value={getQrCodeUrl()}
                  size={320}
                  level="L"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
                {/* Decoração no canto do QR Code */}
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Texto abaixo do QR Code */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-white drop-shadow-2xl">
                  Escaneie para Começar
                </h2>
                <p className="text-lg text-white/90 max-w-md font-medium drop-shadow-lg">
                  Aponte a câmera do seu celular para o código e descubra sua próxima paixão fashion
                </p>
              </div>
            </div>

            {/* Texto de Boas-vindas com frase criativa */}
            <div className="flex flex-col gap-8 max-w-xl text-center lg:text-left">
              {/* Logo/Nome da loja */}
              {lojistaData?.nome && (
                <div className="space-y-4">
                  <h1 className="text-6xl lg:text-7xl font-black text-white drop-shadow-2xl leading-tight">
                    Bem-vindo à<br />
                    <span 
                      className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent"
                      style={{ textShadow: "none" }}
                    >
                      {lojistaData.nome}
                    </span>
                  </h1>
                </div>
              )}

              {/* Frase criativa rotativa */}
              <div className="flex flex-col gap-6">
                <div 
                  key={currentPhraseIndex}
                  className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-xl transform transition-all duration-500 animate-fade-in"
                >
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${currentPhrase.color} shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white drop-shadow-lg flex-1">
                    {currentPhrase.text}
                  </p>
                </div>

                {/* Lista de benefícios */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/90 text-lg">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="font-semibold">Provador Virtual com IA</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-lg">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="font-semibold">Experimente antes de comprar</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-lg">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <span className="font-semibold">Looks personalizados para você</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé decorativo - apenas em modo horizontal */}
        {!isVertical && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30 shadow-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
              <span className="text-white font-semibold drop-shadow-lg">
                Aguardando você criar seu primeiro look...
              </span>
            </div>
          </div>
        )}

        {/* CSS para animação de gradiente */}
        <style jsx>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Renderizar modo active (Mostrando imagem)
  return (
    <div 
      className="relative min-h-screen w-full text-white flex items-center justify-center p-8 animate-fade-in overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)",
      }}
    >
      {/* Animações de fundo sutis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo da loja no topo */}
      {lojistaData?.logoUrl && (
        <div className="absolute top-8 left-8 z-10">
          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/40 shadow-xl bg-white/10 backdrop-blur-md">
            <img
              src={lojistaData.logoUrl}
              alt={lojistaData.nome || "Logo"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Sidebar com QR Code (quando em modo active) */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 z-10 flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="mb-4 text-center">
            <Sparkles className="w-6 h-6 text-yellow-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white drop-shadow-lg">
              Novo Cliente?
            </h3>
          </div>
          <div className="bg-white p-3 rounded-xl mb-4 shadow-xl transform hover:scale-105 transition-transform">
            <QRCodeSVG
              value={getQrCodeUrl()}
              size={180}
              level="L"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-xs text-white/90 text-center font-medium drop-shadow-md">
            Escaneie e crie<br />seu look único
          </p>
        </div>

      {/* Imagem Principal - Ajustada para tamanho máximo quando transmitindo */}
      <div className="flex-1 flex items-center justify-center ml-72 mr-8">
        <div className="relative w-full h-full max-w-full max-h-[95vh] flex items-center justify-center">
          <div 
            className="relative w-full h-full max-w-full max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 animate-scale-in bg-white/5 backdrop-blur-sm"
            style={{
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.1) inset"
            }}
          >
            <SafeImage
              src={activeImage}
              alt="Look gerado"
              className="w-full h-full object-cover"
              containerClassName="w-full h-full flex items-center justify-center"
              loading="eager"
            />
            
            {/* Overlay decorativo no topo da imagem */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Indicador de conexão melhorado */}
      <div className="absolute top-8 right-8 z-10 flex items-center gap-3 bg-gradient-to-r from-green-500/30 to-emerald-500/30 backdrop-blur-xl rounded-full px-6 py-3 border-2 border-green-400/50 shadow-xl">
        <div className="relative">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
          <div className="w-3 h-3 bg-green-500 rounded-full relative" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white drop-shadow-lg">Look ao vivo</span>
          <span className="text-xs text-white/80">Transmitindo na loja</span>
        </div>
      </div>

      {/* Mensagem motivacional no rodapé */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30 shadow-lg">
            <p className="text-white font-semibold drop-shadow-lg text-center">
              ✨ Você está sendo visto! ✨
            </p>
          </div>
        </div>

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
