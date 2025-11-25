"use client"

import { useState } from "react"
import { Cast, X } from "lucide-react"
import { Button } from "./ui/Button"

interface StoreConnectionIndicatorProps {
  isConnected: boolean
  storeName?: string
  onDisconnect: () => void
}

export function StoreConnectionIndicator({
  isConnected,
  storeName,
  onDisconnect,
}: StoreConnectionIndicatorProps) {
  const [showDialog, setShowDialog] = useState(false)

  if (!isConnected) return null

  return (
    <>
      {/* Botão de Indicador */}
      <button
        onClick={() => setShowDialog(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500/20 backdrop-blur-md rounded-full px-4 py-2 border border-green-500/30 hover:bg-green-500/30 transition-colors"
        title="Você está conectado ao telão da loja"
      >
        <Cast className="h-4 w-4 text-green-400" />
        <span className="text-sm font-medium text-green-300">Na Loja</span>
      </button>

      {/* Dialog de Desconexão */}
      {showDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Conectado à Loja
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Você está conectado ao telão da loja
              {storeName && (
                <>
                  <br />
                  <span className="font-semibold">{storeName}</span>
                </>
              )}
              . Seus looks serão exibidos automaticamente no display.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  onDisconnect()
                  setShowDialog(false)
                }}
                variant="outline"
                className="flex-1"
              >
                Desconectar
              </Button>
              <Button
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

