"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa"
import { LogIn, UserPlus } from "lucide-react"
import { fetchLojistaData } from "@/lib/firebaseQueries"
import type { LojistaData } from "@/lib/types"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants"

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const lojistaId = params?.lojistaId as string

  const [lojistaData, setLojistaData] = useState<LojistaData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formatação de WhatsApp: (DDD) 99999-9999
  const formatWhatsApp = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 11)

    if (limited.length === 0) return ""
    if (limited.length <= 2) return `(${limited}`
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`
  }

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsApp(value)
    setWhatsapp(formatted)
  }

  // Formatação de nome: primeira letra maiúscula
  const handleNomeChange = (value: string) => {
    // Capitalizar primeira letra de cada palavra
    const formatted = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
    setNome(formatted)
  }

  // Validação do formulário
  const isFormValid = () => {
    const whatsappNumbers = whatsapp.replace(/\D/g, "")
    const whatsappValid = whatsappNumbers.length >= 10
    const passwordValid = password.length >= 6

    if (mode === "register") {
      const nomeValid = nome.trim().length >= 3
      const confirmPasswordValid = password === confirmPassword && password.length >= 6
      return nomeValid && whatsappValid && passwordValid && confirmPasswordValid
    }

    return whatsappValid && passwordValid
  }

  // Carregar dados da loja (em background, sem bloquear a UI)
  useEffect(() => {
    if (!lojistaId) return

    const loadLojistaData = async () => {
      try {
        const data = await fetchLojistaData(lojistaId)
        setLojistaData(data)
      } catch (err) {
        console.error("[LoginPage] Erro ao carregar dados da loja:", err)
      }
    }

    // Carregar em background sem mostrar loading
    loadLojistaData()
  }, [lojistaId])

  // Verificar se cliente já está logado
  useEffect(() => {
    if (!lojistaId) return

    const checkExistingClient = async () => {
      try {
        const stored = localStorage.getItem(`cliente_${lojistaId}`)
        if (stored) {
          const clienteData = JSON.parse(stored)
          // Verificar se ainda é válido (menos de 30 dias)
          const loggedAt = new Date(clienteData.loggedAt)
          const now = new Date()
          const daysDiff = (now.getTime() - loggedAt.getTime()) / (1000 * 60 * 60 * 24)

          if (daysDiff < 30) {
            // Cliente já logado, redirecionar para workspace
            router.push(`/${lojistaId}/experimentar`)
            return
          }
        }
      } catch (err) {
        console.error("[LoginPage] Erro ao verificar cliente existente:", err)
      }
    }

    checkExistingClient()
  }, [lojistaId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === "register") {
        // Validações de cadastro
        if (!nome.trim() || nome.trim().length < 3) {
          throw new Error("Nome deve ter pelo menos 3 caracteres")
        }
        if (!whatsapp.replace(/\D/g, "") || whatsapp.replace(/\D/g, "").length < 10) {
          throw new Error("WhatsApp inválido")
        }
        if (!password || password.length < 6) {
          throw new Error("Senha deve ter no mínimo 6 caracteres")
        }
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem")
        }

        // Registrar cliente
        const cleanWhatsapp = whatsapp.replace(/\D/g, "")
        const response = await fetch("/api/cliente/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lojistaId,
            nome,
            whatsapp: cleanWhatsapp,
            password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao cadastrar")
        }

        // Salvar dados no localStorage
        const clienteData = {
          nome,
          whatsapp: cleanWhatsapp,
          lojistaId,
          clienteId: data.clienteId,
          loggedAt: new Date().toISOString(),
        }
        localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(clienteData))

        // Redirecionar para workspace
        router.push(`/${lojistaId}/experimentar`)
      } else {
        // Login
        if (!whatsapp.replace(/\D/g, "") || whatsapp.replace(/\D/g, "").length < 10) {
          throw new Error("WhatsApp inválido")
        }
        if (!password || password.length < 6) {
          throw new Error("Senha inválida")
        }

        const cleanWhatsapp = whatsapp.replace(/\D/g, "")
        const response = await fetch("/api/cliente/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lojistaId,
            whatsapp: cleanWhatsapp,
            password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao fazer login")
        }

        // Salvar dados no localStorage
        const clienteData = {
          nome: data.cliente.nome,
          whatsapp: cleanWhatsapp,
          lojistaId,
          clienteId: data.cliente.id,
          loggedAt: new Date().toISOString(),
        }
        localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(clienteData))

        // Redirecionar para workspace
        router.push(`/${lojistaId}/experimentar`)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 1. Imagem de Fundo com Desfoque e Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={CLOSET_BACKGROUND_IMAGE}
          alt="Guarda-roupa de luxo"
          className="h-full w-full object-cover blur-[2px] brightness-50"
        />
      </div>

      {/* 2. Conteúdo do Formulário Sobreposto */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-6 text-white">
        {/* Card com moldura - proporções para celular */}
        <div className="w-full max-w-[90%] sm:max-w-sm rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm p-5 sm:p-6 md:p-8 shadow-2xl text-center">
          {/* 3. Títulos */}
              <h1
                className="mb-4 font-serif text-2xl md:text-3xl font-bold text-white drop-shadow-lg"
                style={{ fontFamily: "Playfair Display, serif", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                translate="no"
              >
                EXPERIMENTE AI
              </h1>
          <h2
            className="mb-8 text-lg md:text-xl text-white"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Desbloqueie Seu Estilo Perfeito
          </h2>

          {/* Tabs para alternar entre Login e Cadastro */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
                setPassword("")
                setConfirmPassword("")
                setNome("")
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === "login"
                  ? "bg-white/20 text-white shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <LogIn className="inline-block mr-2 h-4 w-4" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register")
                setError(null)
                setPassword("")
                setConfirmPassword("")
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === "register"
                  ? "bg-white/20 text-white shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <UserPlus className="inline-block mr-2 h-4 w-4" />
              Cadastrar conta
            </button>
          </div>

          {/* 4. Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                className="border-b border-white/50 bg-transparent py-2 text-lg text-white placeholder-white/70 outline-none focus:border-white transition-colors"
                required
              />
            )}

            <input
              type="tel"
              placeholder="WhatsApp com DDD (ex: (11) 99999-8888)"
              value={whatsapp}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              className="border-b border-white/50 bg-transparent py-2 text-lg text-white placeholder-white/70 outline-none focus:border-white transition-colors"
              required
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-b border-white/50 bg-transparent py-2 text-lg text-white placeholder-white/70 outline-none focus:border-white transition-colors"
              required
            />

            {mode === "register" && (
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-b border-white/50 bg-transparent py-2 text-lg text-white placeholder-white/70 outline-none focus:border-white transition-colors"
                required
              />
            )}

            {error && (
              <p className="text-sm text-red-300 text-left">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="mt-4 rounded-lg bg-teal-700 py-3 text-lg font-bold text-white transition hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Processando...</span>
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Cadastrar conta
                </>
              )}
            </button>
          </form>

          {/* 5. Login Social e Rodapé */}
          {mode === "login" && (
            <div className="mt-8">
              <p className="text-sm text-white/80 mb-4">Continuar com...</p>
              <div className="flex justify-center gap-6">
                <FaGoogle className="h-6 w-6 cursor-pointer transition hover:text-white/80 hover:scale-110" />
                <FaApple className="h-6 w-6 cursor-pointer transition hover:text-white/80 hover:scale-110" />
                <FaFacebook className="h-6 w-6 cursor-pointer transition hover:text-white/80 hover:scale-110" />
              </div>
            </div>
          )}

          <p className="mt-8 text-sm text-white/80">
            {mode === "login" ? (
              <>
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register")
                    setError(null)
                    setPassword("")
                    setConfirmPassword("")
                  }}
                  className="font-bold underline hover:text-white transition"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setError(null)
                    setPassword("")
                    setConfirmPassword("")
                    setNome("")
                  }}
                  className="font-bold underline hover:text-white transition"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

