"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa"
import { LogIn, UserPlus } from "lucide-react"
import { fetchLojistaData } from "@/lib/firebaseQueries"
import type { LojistaData } from "@/lib/types"
import { CLOSET_BACKGROUND_IMAGE } from "@/lib/constants"

function LoginPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
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

    // Se estiver em modo preview, não redirecionar
    if (searchParams.get("preview") === "true") {
      return
    }

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
            // router.push(`/${lojistaId}/experimentar`)
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
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* 1. Imagem de Fundo - Fixa */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src="/background.jpg"
          alt="Fundo"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* 2. Conteúdo do Formulário */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 space-y-3">
        {/* Caixa com Logo e Nome da Loja */}
        <div className="w-full max-w-md">
          <div
            className="rounded-xl border-2 border-white/30 backdrop-blur px-3 sm:px-4 py-2 shadow-xl flex items-center justify-center gap-2 sm:gap-3"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            {lojistaData?.logoUrl && (
              <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0">
                <Image
                  src={lojistaData.logoUrl}
                  alt={lojistaData.nome || "Logo"}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
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

        <div
          className="w-full max-w-md space-y-5 rounded-2xl border-2 border-white/30 p-6 backdrop-blur shadow-2xl"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
          }}
        >
          {/* Cabeçalho */}
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Bem-vindo(a) à nova era <br /> da Moda Digital
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              (Provador Virtual IA)
            </p>
          </div>

          {/* Botão de Ação Único */}
          {mode === 'login' ? (
            <button
              onClick={() => setMode("register")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500/90 border-2 border-white/30 py-2.5 font-semibold text-white transition-all hover:bg-blue-600 text-xs sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar conta
            </button>
          ) : (
             <button
              onClick={() => setMode("login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-700/90 border-2 border-white/30 py-2.5 font-semibold text-white transition-all hover:bg-gray-600 text-xs sm:text-sm"
            >
              <LogIn className="h-4 w-4" />
              Já tenho uma conta? Entrar
            </button>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className="w-full rounded-lg border-2 border-white/20 bg-black/20 px-4 py-2.5 text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all text-sm"
                  required
                />
              </div>
            )}

            <div>
              <input
                type="tel"
                placeholder="WhatsApp com DDD"
                value={whatsapp}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                className="w-full rounded-lg border-2 border-white/20 bg-black/20 px-4 py-2.5 text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all text-sm"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-2 border-white/20 bg-black/20 px-4 py-2.5 text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all text-sm"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border-2 border-white/20 bg-black/20 px-4 py-2.5 text-white placeholder-gray-400 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all text-sm"
                  required
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600/80 border-2 border-white/30 py-3 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <LogIn className="h-4 w-4" />
              {mode === "login" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

          {/* Divisor e Social Login */}
          <div className="space-y-3 text-center">
            <p className="text-xs text-gray-400">Continuar com...</p>
            <div className="flex justify-center gap-4">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 border-2 border-white/30 text-white transition hover:bg-gray-700">
                <FaGoogle />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 border-2 border-white/30 text-white transition hover:bg-gray-700">
                <FaApple />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 border-2 border-white/30 text-white transition hover:bg-gray-700">
                <FaFacebook />
              </button>
            </div>
          </div>
          
          {/* Link de Cadastro */}
          <div className="text-center text-xs text-gray-400">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-white underline ml-1"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
