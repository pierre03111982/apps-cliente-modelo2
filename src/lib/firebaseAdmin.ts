import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

let firestoreSingleton: ReturnType<typeof getFirestore> | null = null

function assertEnv(variable: string | undefined, name: string) {
  if (!variable) {
    throw new Error(
      `[firebase-admin] Variável ${name} não configurada. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY para habilitar checagens financeiras.`
    )
  }
  return variable
}

export function getFirestoreAdmin() {
  if (firestoreSingleton) {
    return firestoreSingleton
  }

  if (!getApps().length) {
    const projectId = assertEnv(process.env.FIREBASE_PROJECT_ID, "FIREBASE_PROJECT_ID")
    const clientEmail = assertEnv(process.env.FIREBASE_CLIENT_EMAIL, "FIREBASE_CLIENT_EMAIL")
    const privateKey = assertEnv(process.env.FIREBASE_PRIVATE_KEY, "FIREBASE_PRIVATE_KEY")

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    })
  }

  firestoreSingleton = getFirestore()
  return firestoreSingleton
}


