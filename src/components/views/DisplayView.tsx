"use client"



import { useEffect, useState, useRef } from "react"

import { useParams } from "next/navigation"

import { QRCodeSVG } from "qrcode.react"

import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"

import { doc, onSnapshot, Timestamp } from "firebase/firestore"

import type { LojistaData } from "@/lib/types"

import { SafeImage } from "../ui/SafeImage"

import { Cast, Crown, Heart, RefreshCcw, Sparkles, Wand2, Star, Zap } from "lucide-react"



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

  const [isLoadingNewImage, setIsLoadingNewImage] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastUpdateMetaRef = useRef<{ url: string | null; updatedAt: number }>({ url: null, updatedAt: 0 })

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

  

  // Fase 10: UUID único para este display

  const [displayUuid, setDisplayUuid] = useState<string | null>(null)



  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(lojistaData?.displayOrientation || "horizontal")

  

  // Cache de imagens pré-carregadas para troca mais rápida

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())



  // Orientação do display (horizontal ou vertical)

  const isVertical = orientation === "vertical"



  const clearDisplayTimeout = () => {

    if (timeoutRef.current) {

      clearTimeout(timeoutRef.current)

      timeoutRef.current = null

    }

  }



  const startDisplayTimeout = () => {

    clearDisplayTimeout()

    timeoutRef.current = setTimeout(() => {

      console.log("[DisplayView] Timeout de 120 segundos: voltando para modo idle")

      setViewMode("idle")

      setActiveImage(null)

      setIsLoadingNewImage(false)

      timeoutRef.current = null

    }, 120000)

  }



  const preloadImageWithTimeout = (url: string) => {

    if (imageCache.current.has(url)) {

      return Promise.resolve()

    }



    return new Promise<void>((resolve) => {

      const img = new Image()

      let resolved = false



      const finalize = (cacheImage = false) => {

        if (!resolved) {

          resolved = true

          if (cacheImage) {

            imageCache.current.set(url, img)

          }

          resolve()

        }

      }



      const timeout = setTimeout(() => {

        console.warn("[DisplayView] Pré-carregamento demorou mais de 5s, exibindo assim mesmo")

        finalize()

      }, 5000)



      img.onload = () => {

        clearTimeout(timeout)

        finalize(true)

      }



      img.onerror = () => {

        clearTimeout(timeout)

        console.warn("[DisplayView] Erro ao carregar imagem, exibindo mesmo assim")

        finalize()

      }



      img.src = url

    })

  }



  const normalizeTimestamp = (timestamp: any) => {

    if (!timestamp) return Date.now()

    if (timestamp instanceof Timestamp) return timestamp.toMillis()

    if (timestamp instanceof Date) return timestamp.getTime()

    if (typeof timestamp === "number") return timestamp

    if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000

    return Date.now()

  }



  useEffect(() => {

    setOrientation(lojistaData?.displayOrientation || "horizontal")

  }, [lojistaData?.displayOrientation])



  // Rotação de frases criativas

  useEffect(() => {

    if (viewMode === "idle") {

      const interval = setInterval(() => {

        setCurrentPhraseIndex((prev) => (prev + 1) % creativePhrases.length)

      }, 4000) // Mudar frase a cada 4 segundos

      return () => clearInterval(interval)

    }

  }, [viewMode])



  // Assinar mudanças do perfil do lojista para orientação em tempo real

  useEffect(() => {

    if (!lojistaId || !isFirebaseConfigured) return

    const db = getFirestoreClient()

    if (!db) return



    const lojistaRef = doc(db, "lojistas", lojistaId)

    const unsubscribe = onSnapshot(lojistaRef, (snapshot) => {

      const data = snapshot.data()

      const newOrientation = data?.displayOrientation

      if (newOrientation === "horizontal" || newOrientation === "vertical") {

        setOrientation(newOrientation)

      }

    })



    return () => unsubscribe()

  }, [lojistaId])



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

    

    // Determinar URL base - usar domínio do APP CLIENTE (não do display!)

    // O usuário que escaneia o QR code deve ir para o app normal, não para o display

    let baseUrl: string

    if (isDev) {

      // Em desenvolvimento, usar localhost com porta do modelo-2

      const port = process.env.NEXT_PUBLIC_MODELO2_PORT || process.env.NEXT_PUBLIC_MODELO_2_PORT || "3005"

      baseUrl = `http://localhost:${port}`

    } else {

      // Em produção, usar domínio do app cliente (não do display!)

      // Usar variável de ambiente se disponível, senão usar domínio padrão

      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "app2.experimenteai.com.br"

      const protocol = process.env.NEXT_PUBLIC_APP_PROTOCOL || "https"

      baseUrl = `${protocol}://${appDomain}`

    }

    

    // URL para conectar o celular ao display (sem display=1, pois é o app normal)

    const url = `${baseUrl}/${lojistaId}/experimentar?connect=true&lojista=${lojistaId}&target_display=${displayUuid}`

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



    const displayRef = doc(db, "displays", displayUuid)

    let isMounted = true



    const unsubscribe = onSnapshot(

      displayRef,

      (docSnapshot) => {

        if (!isMounted) return



        if (!docSnapshot.exists()) {

          console.log("[DisplayView] Display não encontrado, voltando para idle")

          clearDisplayTimeout()

          setViewMode("idle")

          setActiveImage(null)

          setIsLoadingNewImage(false)

          return

        }



        const data = docSnapshot.data()

        const newImageUrl = data.activeImage as string | undefined

        const updateTime = normalizeTimestamp(data.updatedAt || data.timestamp)

        const ageInSeconds = (Date.now() - updateTime) / 1000



        console.log("[DisplayView] Atualização recebida do display:", {

          hasImage: !!newImageUrl,

          updatedAt: updateTime,

          ageInSeconds,

        })



        if (!newImageUrl) {

          clearDisplayTimeout()

          setViewMode("idle")

          setActiveImage(null)

          setIsLoadingNewImage(false)

          return

        }



        if (ageInSeconds > 180) {

          console.log("[DisplayView] Atualização muito antiga (mais de 180 segundos), ignorando")

          return

        }



        const lastMeta = lastUpdateMetaRef.current

        if (

          lastMeta &&

          lastMeta.url === newImageUrl &&

          updateTime <= lastMeta.updatedAt

        ) {

          console.log("[DisplayView] Atualização duplicada detectada, ignorando")

          return

        }



        lastUpdateMetaRef.current = { url: newImageUrl, updatedAt: updateTime }

        clearDisplayTimeout()

        setViewMode("active")



        const applyImageToScreen = () => {

          if (!isMounted) return

          setActiveImage(newImageUrl)

          setIsLoadingNewImage(false)

          startDisplayTimeout()

        }



        if (imageCache.current.has(newImageUrl)) {

          console.log("[DisplayView] Imagem encontrada no cache, aplicando imediatamente")

          setIsLoadingNewImage(false)

          applyImageToScreen()

          return

        }



        console.log("[DisplayView] Pré-carregando nova imagem do display...")

        setIsLoadingNewImage(true)

        preloadImageWithTimeout(newImageUrl).finally(applyImageToScreen)

      },

      (error) => {

        console.error("[DisplayView] Erro ao escutar display:", error)

      }

    )



    return () => {

      isMounted = false

      unsubscribe()

      clearDisplayTimeout()

    }

  }, [lojistaId, displayUuid])



  const currentPhrase = creativePhrases[currentPhraseIndex]

  const IconComponent = currentPhrase.icon

  const featuredProduct = lojistaData?.produtos?.[0]
  const activeMetadata = {
    title: featuredProduct?.nome || (lojistaData?.nome ? `Look exclusivo ${lojistaData.nome}` : "Look em destaque"),
    price: featuredProduct?.preco ?? null,
    disclaimer:
      featuredProduct?.obs ||
      "Looks gerados com inteligência artificial para inspirar combinações reais. Consulte a equipe para confirmar disponibilidade.",
  }



  // Renderizar modo idle (QR Code)
  const shouldRenderIdle = viewMode === "idle" && !isLoadingNewImage

  if (shouldRenderIdle || (!activeImage && !isLoadingNewImage)) {
    if (isVertical) {
      return (
        <div
          className="relative flex h-screen w-full flex-col items-center justify-between gap-8 p-10 text-white overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #312e81 0%, #5a23c8 45%, #9333ea 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-16 left-16 h-[22rem] w-[22rem] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-pink-500/30 blur-[160px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            {lojistaData?.logoUrl && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl bg-white/10 backdrop-blur-lg">
                <img src={lojistaData.logoUrl} alt={lojistaData.nome || "Logo"} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-sm font-semibold tracking-[0.35em] uppercase text-white/70">
              {lojistaData?.nome || "Espelho Digital"}
            </p>
            <h1 className="text-5xl font-black leading-tight">
              Ative seu <span className="text-yellow-300">Espelho Digital</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              A magia do <span className="text-white font-semibold">Provador Virtual</span> com IA.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="relative rounded-[40px] border border-white/20 bg-white/10 p-8 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 rounded-[40px] border border-white/30 pointer-events-none" />
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-purple-400 via-pink-400 to-amber-300 rounded-3xl px-5 py-2 text-sm font-semibold shadow-lg">
                Provador Virtual IA
              </div>
              <div className="bg-white p-5 rounded-[32px] shadow-inner shadow-black/20">
                <QRCodeSVG value={getQrCodeUrl()} size={380} level="L" includeMargin fgColor="#000000" bgColor="#ffffff" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/15 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                pronto
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center max-w-2xl space-y-3">
            <p className="text-2xl font-semibold">
              Escaneie o QR code e conecte sua experiência ao espelho da loja.
            </p>
            <div className="flex items-center justify-center gap-3 text-white/70 text-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
              <span>Disponível 24h • seguro • instantâneo</span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div 
        className="relative w-full h-full min-h-screen text-white overflow-hidden flex flex-row flex-wrap lg:flex-nowrap items-center justify-center gap-16 p-10"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift 15s ease infinite",
          height: "100vh"
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

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
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-white drop-shadow-2xl">
              Escaneie para Começar
            </h2>
            <p className="text-lg text-white/90 max-w-md font-medium drop-shadow-lg">
              Aponte a câmera do seu celular para o código e descubra sua próxima paixão fashion
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 max-w-xl text-center lg:text-left">
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30 shadow-lg">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
            <span className="text-white font-semibold drop-shadow-lg">
              Aguardando você criar seu primeiro look...
            </span>
          </div>
        </div>

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

  if (isVertical) {

    const priceLabel =

      typeof activeMetadata.price === "number"

        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(activeMetadata.price)

        : activeMetadata.price || null



    return (

      <div

        className="relative min-h-screen w-full text-white flex flex-col gap-6 p-6 animate-fade-in overflow-hidden"

        style={{ background: "linear-gradient(150deg, #161837 0%, #31186f 50%, #6a21bf 100%)" }}

      >

        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">

          <div className="absolute -top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />

          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/15 rounded-full blur-[140px]" />

        </div>



        <div className="relative z-10 flex items-center justify-between">

          {lojistaData?.logoUrl && (

            <div className="flex items-center gap-3">

              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 backdrop-blur-lg">

                <img src={lojistaData.logoUrl} alt={lojistaData.nome || "Logo"} className="w-full h-full object-cover" />

              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Display ON</p>

                <p className="text-lg font-semibold">{lojistaData?.nome}</p>

              </div>

            </div>

          )}

          <div className="flex items-center gap-2 bg-white/10 border border-white/30 rounded-full px-4 py-2 shadow-lg backdrop-blur-md">

            <span className="relative flex h-3 w-3">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>

              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>

            </span>

            <span className="text-xs font-semibold">Espelho Digital ativo</span>

          </div>

        </div>



        <div className="relative z-10 flex flex-col gap-6 flex-1 w-full">

          <div className="relative flex-1 rounded-[32px] overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_35px_80px_rgba(0,0,0,0.45)]">

            <SafeImage

              src={activeImage}

              alt="Look gerado"

              className="w-full h-full object-cover"

              containerClassName="w-full h-full"

              loading="eager"

            />

            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent.pointer-events-none" />

            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent.pointer-events-none" />

            <div className="absolute top-6 right-6 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 px-5 py-2 shadow-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]">

              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />

              Espelho Digital Ativo

            </div>

            {isLoadingNewImage && (

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">

                <div className="h-12 w-12 border-4 border-white/40 border-t-white rounded-full animate-spin" />

                <p className="text-sm font-semibold text-white drop-shadow-lg text-center px-6">

                  Preparando novo look...

                </p>

              </div>

            )}

          </div>



          <div className="grid grid-cols-3 gap-6 w-full min-h-[32vh]">

            <div className="col-span-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl p-6 flex flex-col justify-center">

              <p className="text-xs uppercase tracking-[0.6em] text-yellow-200/90">Produtos Selecionados</p>

              <h3 className="text-4xl font-black mt-2 leading-tight">

                {activeMetadata.title}

              </h3>

              {priceLabel && (

                <p className="text-5xl font-black text-white mt-2">{priceLabel}</p>

              )}

              <p className="text-sm text-white/70 mt-4 max-w-2xl">

                {activeMetadata.disclaimer}

              </p>

            </div>

            <div className="col-span-1 rounded-2xl border border-white/20 bg-indigo-900/40 backdrop-blur-lg shadow-2xl p-4 flex flex-col items-center justify-center text-center gap-3">

              <p className="text-base uppercase tracking-[0.3em] text-white/80">Sua vez!</p>

              <div className="bg-white rounded-2xl p-3 shadow-xl">

                <QRCodeSVG value={getQrCodeUrl()} size={180} level="L" includeMargin fgColor="#000000" bgColor="#ffffff" />

              </div>

              <p className="text-sm text-white/80 max-w-[14rem]">

                Escaneie e crie seu look com o Espelho Digital.

              </p>

            </div>

          </div>

        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Transmitir", Icon: Cast },
              { label: "Trocar look", Icon: RefreshCcw },
              { label: "Favoritos", Icon: Heart },
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg py-4 text-center shadow-lg"
              >
                <Icon className="h-5 w-5 text-white" />
                <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-full bg-white/15 border border-white/20 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/80 shadow-lg">
            Pronto! Continue criando para a vitrine.
          </div>
        </div>


      </div>

    )

  }



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



            {isLoadingNewImage && (

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">

                <div className="h-12 w-12 border-4 border-white/40 border-t-white rounded-full animate-spin" />

                <p className="text-sm font-semibold text-white drop-shadow-lg text-center px-6">

                  Preparando novo look...

                </p>

              </div>

            )}

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

