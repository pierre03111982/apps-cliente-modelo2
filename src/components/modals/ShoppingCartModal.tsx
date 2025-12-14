"use client"

import { useMemo, useState, useEffect } from "react"
import { X, Truck, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { SalesConfig } from "@/lib/types"

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string | null
}

type ShippingQuote = {
  id: string
  label: string
  eta: string
  price: number
}

type ShoppingCartModalProps = {
  open: boolean
  onClose: () => void
  items: CartItem[]
  lojistaId: string
  salesConfig?: SalesConfig
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function ShoppingCartModal({
  open,
  onClose,
  items,
  lojistaId,
  salesConfig,
}: ShoppingCartModalProps) {
  const [destinationZip, setDestinationZip] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerWhatsapp, setCustomerWhatsapp] = useState("")
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Função para formatar telefone brasileiro
  const formatPhone = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '')
    
    // Formata conforme o tamanho
    if (numbers.length === 11) {
      // (XX) XXXXX-XXXX
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`
    } else if (numbers.length === 10) {
      // (XX) XXXX-XXXX
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`
    }
    // Retorna como está se não tem tamanho padrão
    return phone
  }

  // ✅ NOVO: Preencher automaticamente com dados do cadastro do cliente
  useEffect(() => {
    if (!open || !lojistaId) return

    try {
      const stored = localStorage.getItem(`cliente_${lojistaId}`)
      if (stored) {
        const clienteData = JSON.parse(stored)
        
        // Preencher nome se disponível
        if (clienteData.nome || clienteData.name) {
          const nome = clienteData.nome || clienteData.name
          setCustomerName(nome)
        }
        
        // Preencher whatsapp se disponível (com formatação)
        if (clienteData.whatsapp || clienteData.telefone || clienteData.phone) {
          const whatsapp = clienteData.whatsapp || clienteData.telefone || clienteData.phone
          const formatted = formatPhone(whatsapp)
          setCustomerWhatsapp(formatted)
        }
      }
    } catch (error) {
      console.error('❌ [ShoppingCartModal] Erro ao carregar dados do cliente:', error)
    }
  }, [open, lojistaId])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )
  const shippingPrice = useMemo(() => {
    const quote = shippingQuotes.find((q) => q.id === selectedQuote)
    return quote?.price ?? 0
  }, [selectedQuote, shippingQuotes])
  const total = subtotal + shippingPrice

  if (!open) return null

  const handleCalculateShipping = async () => {
    if (!destinationZip) {
      setFeedback("Informe o CEP para calcular o frete.")
      return
    }

    setIsCalculating(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/sales/calculate-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          destination_zip: destinationZip,
          items,
          config: salesConfig,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "Erro ao calcular frete.")
      }

      const data = await response.json()
      setShippingQuotes(data.quotes || [])
      setSelectedQuote(data.quotes?.[0]?.id ?? null)
    } catch (error: any) {
      console.error("[ShoppingCartModal] Frete:", error)
      setFeedback(error?.message || "Não foi possível calcular o frete.")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      setFeedback("Selecione algum item antes de pagar.")
      return
    }

    // Validação dos campos do cliente
    if (!customerName || customerName.trim().length < 3) {
      setFeedback("Por favor, informe seu nome completo.")
      return
    }

    if (!customerWhatsapp || customerWhatsapp.trim().length < 10) {
      setFeedback("Por favor, informe um número de WhatsApp válido.")
      return
    }

    setIsPaying(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/sales/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lojistaId,
          cartItems: items,
          shippingOption: shippingQuotes.find((q) => q.id === selectedQuote) || null,
          destinationZip,
          customerName: customerName.trim(),
          customerWhatsapp: customerWhatsapp.trim(),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || "Erro ao iniciar o pagamento.")
      }

      const data = await response.json()
      if (data.checkout_url) {
        window.open(data.checkout_url, "_blank", "noopener,noreferrer")
        setFeedback("Checkout iniciado em uma nova aba.")
      } else if (data.message) {
        setFeedback(data.message)
      } else {
        setFeedback("Pedido registrado! Aguarde o contato da loja.")
      }
    } catch (error: any) {
      console.error("[ShoppingCartModal] Pagamento:", error)
      setFeedback(error?.message || "Erro ao iniciar pagamento.")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 py-4 sm:items-center sm:py-8">
      <div className="w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-3xl bg-white p-6 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Carrinho</p>
            <h2 className="text-2xl font-semibold text-slate-900">Finalizar compra</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity}x {formatBRL(item.price)}
                </p>
              </div>
              <p className="font-semibold text-slate-900">
                {formatBRL(item.price * item.quantity)}
              </p>
            </div>
          ))}

          {/* Dados do Cliente */}
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <h3 className="text-sm font-bold text-blue-900 mb-3">Seus dados</h3>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Nome completo *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                WhatsApp *
              </label>
              <input
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setCustomerWhatsapp(formatted)
                }}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                required
                maxLength={15}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-500" />
            CEP de destino
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={destinationZip}
              onChange={(e) => setDestinationZip(e.target.value)}
              placeholder="00000-000"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
            <Button
              type="button"
              variant="ghost"
              className="border-blue-500 text-blue-600 whitespace-nowrap sm:w-auto w-full"
              onClick={handleCalculateShipping}
              disabled={isCalculating}
            >
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
            </Button>
          </div>
          {shippingQuotes.length > 0 && (
            <div className="space-y-2">
              {shippingQuotes.map((quote) => (
                <label
                  key={quote.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    selectedQuote === quote.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <span>
                    {quote.label} · {quote.eta}
                  </span>
                  <span className="font-semibold">{formatBRL(quote.price)}</span>
                  <input
                    type="radio"
                    name="shipping"
                    value={quote.id}
                    checked={selectedQuote === quote.id}
                    onChange={() => setSelectedQuote(quote.id)}
                    className="ml-2"
                  />
                </label>
              ))}
            </div>
          )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Produtos</span>
              <span className="font-semibold text-slate-900">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Frete</span>
              <span className="font-semibold text-slate-900">{formatBRL(shippingPrice)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>

          {feedback && (
            <p className="mt-2 text-center text-sm text-blue-600">{feedback}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row flex-shrink-0 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            className="w-full border-slate-300 text-slate-700"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleCheckout}
            disabled={isPaying || !salesConfig?.enabled}
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Ir para pagamento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


