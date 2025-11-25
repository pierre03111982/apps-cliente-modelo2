"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"
import { doc, onSnapshot, Timestamp } from "firebase/firestore"
import type { LojistaData } from "@/lib/types"
import { SafeImage } from "../ui/SafeImage"

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

export function DisplayView({ lojistaData }: DisplayViewProps) {
  const params = useParams()
  const lojistaId = params?.lojistaId as string

  const [viewMode, setViewMode] = useState<ViewMode>("idle")
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  // Fase 10: UUID único para este display
  const [displayUuid, setDisplayUuid] = useState<string | null>(null)

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
  const getQrCodeUrl = () => {
    if (typeof window === "undefined" || !displayUuid) return ""
    
    const baseUrl = window.location.origin
    const url = `${baseUrl}/${lojistaId}/experimentar?connect=true&lojista=${lojistaId}&target_display=${displayUuid}`
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
          // Verificar se a atualização é recente (últimos 60 segundos)
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

          // Se foi atualizado nos últimos 60 segundos, mostrar na tela
          if (ageInSeconds <= 60) {
            console.log("[DisplayView] ✅ Mostrando nova imagem na tela")
            
            // Limpar timeout anterior se existir
            if (timeoutId) {
              clearTimeout(timeoutId)
            }

            // Atualizar estado
            setActiveImage(data.activeImage)
            setViewMode("active")

            // Iniciar timeout de 45 segundos (Fase 9)
            const newTimeoutId = setTimeout(() => {
              console.log("[DisplayView] Timeout: voltando para modo idle")
              setViewMode("idle")
              setActiveImage(null)
              setTimeoutId(null)
            }, 45000) // 45 segundos

            setTimeoutId(newTimeoutId)
          } else {
            console.log("[DisplayView] Atualização muito antiga, ignorando")
            // Se muito antiga, limpar
            setViewMode("idle")
            setActiveImage(null)
          }
        } else {
          // Sem imagem ativa, voltar para idle
          setViewMode("idle")
          setActiveImage(null)
        }
      },
      (error) => {
        console.error("[DisplayView] Erro ao escutar display:", error)
      }
    )

    return () => {
      unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lojistaId, displayUuid, timeoutId])

  // Renderizar modo idle (QR Code)
  if (viewMode === "idle" || !activeImage) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-8">
        {/* Logo da Loja (se disponível) */}
        {lojistaData?.logoUrl && (
          <div className="absolute top-8 left-8 w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
            <img
              src={lojistaData.logoUrl}
              alt={lojistaData.nome || "Logo"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-6xl w-full">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-6 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-center">
              Escaneie para Provador Virtual
            </h2>
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG
                value={getQrCodeUrl()}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-white/70 text-center max-w-xs">
              Aponte a câmera do seu celular para este código
            </p>
          </div>

          {/* Texto de Boas-vindas */}
          <div className="flex flex-col gap-4 max-w-md">
            <h1 className="text-5xl font-bold text-center lg:text-left">
              Bem-vindo à {lojistaData?.nome || "Loja"}
            </h1>
            <p className="text-xl text-white/80 text-center lg:text-left">
              Experimente nossos looks com Inteligência Artificial
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          Aguardando look...
        </div>
      </div>
    )
  }

  // Renderizar modo active (Mostrando imagem)
  return (
    <div className="relative min-h-screen w-full bg-black text-white flex items-center justify-center p-8 animate-fade-in">
      {/* Sidebar com QR Code (quando em modo active) */}
      <div className="absolute left-8 top-8 bottom-8 w-64 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Novo Cliente?
        </h3>
        <div className="bg-white p-3 rounded-xl mb-4">
          <QRCodeSVG
            value={getQrCodeUrl()}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-xs text-white/70 text-center">
          Escaneie para criar seu look
        </p>
      </div>

      {/* Imagem Principal */}
      <div className="flex-1 flex items-center justify-center ml-72">
        <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
          <div className="relative w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 animate-scale-in">
            <SafeImage
              src={activeImage}
              alt="Look gerado"
              className="w-full h-auto object-contain"
              containerClassName="w-full flex items-center justify-center"
            />
          </div>
        </div>
      </div>

      {/* Indicador de conexão */}
      <div className="absolute top-8 right-8 flex items-center gap-2 bg-green-500/20 backdrop-blur-md rounded-full px-4 py-2 border border-green-500/30">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">Look ao vivo</span>
      </div>
    </div>
  )
}

