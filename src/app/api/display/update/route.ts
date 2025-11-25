import { NextRequest, NextResponse } from "next/server"
import { getFirestoreClient, isFirebaseConfigured } from "@/lib/firebase"
import { doc, setDoc, Timestamp } from "firebase/firestore"

export const dynamic = 'force-dynamic'

/**
 * API para atualizar o display específico com uma nova imagem
 * Usado na Fase 10 para enviar imagens para displays específicos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayUuid, imageUrl, lojistaId } = body

    if (!displayUuid || !imageUrl) {
      return NextResponse.json(
        { error: "displayUuid e imageUrl são obrigatórios" },
        { status: 400 }
      )
    }

    if (!isFirebaseConfigured) {
      return NextResponse.json(
        { error: "Firebase não configurado" },
        { status: 500 }
      )
    }

    const db = getFirestoreClient()
    if (!db) {
      return NextResponse.json(
        { error: "Firestore não disponível" },
        { status: 500 }
      )
    }

    // Atualizar documento do display
    const displayRef = doc(db, "displays", displayUuid)
    
    await setDoc(
      displayRef,
      {
        activeImage: imageUrl,
        timestamp: Timestamp.now(),
        lojistaId: lojistaId || null,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )

    console.log("[display/update] Display atualizado:", {
      displayUuid,
      imageUrl: imageUrl.substring(0, 50) + "...",
      lojistaId,
    })

    return NextResponse.json({
      success: true,
      displayUuid,
    })
  } catch (error: any) {
    console.error("[display/update] Erro:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar display",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

