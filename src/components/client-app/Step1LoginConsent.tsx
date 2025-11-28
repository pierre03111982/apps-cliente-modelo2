"use client"

import Image from "next/image"
import { useMemo, useState, useEffect } from "react"
import { Info, Smartphone, User, Lock, CheckCircle2, LogIn, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { Button } from "@/components/ui/Button"

type Step1Props = {
  lojistaNome: string
  lojistaLogoUrl?: string | null
  descricao?: string | null
  lojistaId?: string | null
  onLoginSubmit: (nome: string, whatsapp: string) => void
}

const lgpdInfo = {
  title: "Garantir sua segurança e privacidade (LGPD).",
  description:
    "A Lei Geral de Proteção de Dados Pessoais (LGPD) garante que seus dados pessoais sejam tratados com total transparência e segurança. Utilizamos login verificado para proteger suas informações e liberar o provador virtual. Seus dados são usados exclusivamente para gerar seus looks personalizados e nunca serão compartilhados com terceiros sem sua autorização explícita. Você tem total controle sobre suas informações e pode solicitar a exclusão a qualquer momento.",
}

export function Step1LoginConsent({
  lojistaNome,
  lojistaLogoUrl,
  descricao,
  lojistaId,
  onLoginSubmit,
}: Step1Props) {
  const [mode, setMode] = useState<"login" | "register">("login") // Modo: login ou cadastro
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [consentImagem, setConsentImagem] = useState(false)
  const [consentComposicao, setConsentComposicao] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingExistingClient, setCheckingExistingClient] = useState(false)

  // Verificar se cliente já existe no localStorage ao carregar
  useEffect(() => {
    if (!lojistaId) return

    const checkExistingClient = async () => {
      try {
        const stored = localStorage.getItem(`cliente_${lojistaId}`)
        if (stored) {
          const clienteData = JSON.parse(stored)
          const cleanWhatsapp = clienteData.whatsapp?.replace(/\D/g, "") || ""
          
          if (cleanWhatsapp.length >= 10) {
            setCheckingExistingClient(true)
            
            // Verificar se cliente ainda existe no backend - usar proxy interno
            try {
              const res = await fetch(
                `/api/cliente/find?lojistaId=${encodeURIComponent(lojistaId)}&whatsapp=${encodeURIComponent(cleanWhatsapp)}`
              )
              
              if (res.ok) {
                const data = await res.json()
                if (data.cliente) {
                  // Cliente existe, fazer login automático
                  console.log("[Step1LoginConsent] ✅ Cliente encontrado no localStorage, fazendo login automático:", data.cliente.nome)
                  
                  // Atualizar localStorage com dados atualizados
                  const updatedClienteData = {
                    nome: data.cliente.nome,
                    whatsapp: cleanWhatsapp,
                    lojistaId,
                    clienteId: data.cliente.id,
                    loggedAt: new Date().toISOString(),
                  }
                  localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(updatedClienteData))
                  
                  onLoginSubmit(data.cliente.nome, cleanWhatsapp)
                  return
                }
              }
            } catch (fetchErr) {
              console.error("[Step1LoginConsent] Erro ao verificar cliente no backend:", fetchErr)
            }
            
            // Cliente não existe mais no backend, limpar localStorage
            localStorage.removeItem(`cliente_${lojistaId}`)
          }
        }
      } catch (err) {
        console.error("[Step1LoginConsent] Erro ao verificar cliente existente:", err)
      } finally {
        setCheckingExistingClient(false)
      }
    }

    checkExistingClient()
  }, [lojistaId, onLoginSubmit])

  const isFormValid = useMemo(() => {
    const nomeValid = nome.trim().length > 2
    const whatsappNumbers = whatsapp.replace(/\D/g, "")
    const whatsappValid = whatsappNumbers.length >= 10
    const passwordValid = mode === "login" 
      ? password.length >= 6 
      : password.length >= 6 && password === confirmPassword
    
    if (mode === "login") {
      return whatsappValid && passwordValid
    } else {
      return nomeValid && whatsappValid && passwordValid && consentImagem
    }
  }, [nome, whatsapp, password, confirmPassword, consentImagem, mode])

  // Formatação de nome em caixa alta
  const handleNomeChange = (value: string) => {
    const formatted = value.toUpperCase()
    setNome(formatted)
  }

  // Formatação de WhatsApp: (DDD) 99999-9999
  const formatWhatsApp = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 11)
    
    if (limited.length === 0) {
      return ""
    } else if (limited.length <= 2) {
      return `(${limited}`
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`
    }
  }

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsApp(value)
    setWhatsapp(formatted)
  }

  const handleLogin = async () => {
    if (!isFormValid || !lojistaId) return

    try {
      setIsLoading(true)
      setError(null)

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

      // Login bem-sucedido - salvar dados no localStorage
      const clienteData = {
        nome: data.cliente.nome,
        whatsapp: cleanWhatsapp,
        lojistaId,
        clienteId: data.cliente.id,
        loggedAt: new Date().toISOString(),
      }
      localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(clienteData))
      console.log("[Step1LoginConsent] ✅ Login realizado com sucesso")
      
      onLoginSubmit(data.cliente.nome, cleanWhatsapp)
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!isFormValid || !lojistaId) return

    try {
      setIsLoading(true)
      setError(null)

      const cleanWhatsapp = whatsapp.replace(/\D/g, "")
      
      if (password !== confirmPassword) {
        setError("As senhas não coincidem")
        return
      }

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

      // Cadastro bem-sucedido - salvar dados no localStorage e fazer login
      const clienteData = {
        nome,
        whatsapp: cleanWhatsapp,
        lojistaId,
        clienteId: data.clienteId,
        loggedAt: new Date().toISOString(),
      }
      localStorage.setItem(`cliente_${lojistaId}`, JSON.stringify(clienteData))
      console.log("[Step1LoginConsent] ✅ Cadastro realizado com sucesso")
      
      onLoginSubmit(nome, cleanWhatsapp)
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading enquanto verifica cliente existente
  if (checkingExistingClient) {
    return (
      <div className="space-y-10">
        <div className="text-center">
          {lojistaLogoUrl && (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-white shadow-2xl shadow-black/60">
              <Image src={lojistaLogoUrl} alt={`Logo da ${lojistaNome}`} width={96} height={96} className="h-full w-full object-contain" />
            </div>
          )}
          <h1 className="text-4xl font-semibold text-white md:text-5xl mb-2">
            {lojistaNome}
          </h1>
          <p className="text-xl text-white/90 mt-4">
            Verificando acesso...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        {lojistaLogoUrl && (
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white shadow-xl">
            <Image src={lojistaLogoUrl} alt={`Logo da ${lojistaNome}`} width={96} height={96} className="h-full w-full object-contain" />
          </div>
        )}
        <h1 className="text-4xl font-semibold text-white md:text-5xl mb-2">
          {lojistaNome}
        </h1>
        <p className="text-base font-bold text-white/90 mb-3">
          <span className="font-bold">Experimente AI</span> - <span className="italic">Provador Virtual</span>
        </p>
        <p className="mt-2 text-xl text-white/90">
          {descricao ?? "Acesse sua conta ou cadastre-se para começar."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-800/90 via-indigo-700/90 to-purple-500/90 p-8 shadow-xl shadow-black/30">
          {/* Tabs para alternar entre Login e Cadastro */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode("login")
                setError(null)
                setPassword("")
                setConfirmPassword("")
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
              Cadastrar
            </button>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" && (
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(event) => handleNomeChange(event.target.value)}
                icon={<User className="h-5 w-5" />}
              />
            )}

            <div className="relative">
              <div className="relative w-full">
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="WhatsApp com DDD (ex: (11) 99999-8888)"
                  value={whatsapp}
                  onChange={(event) => handleWhatsAppChange(event.target.value)}
                  icon={<Smartphone className="h-5 w-5" />}
                  className="pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
              </div>
            </div>

            <Input
              id="password"
              type="password"
              placeholder={mode === "login" ? "Sua senha" : "Crie uma senha (mín. 6 caracteres)"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<Lock className="h-5 w-5" />}
            />

            {mode === "register" && (
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                icon={<Lock className="h-5 w-5" />}
              />
            )}

            {mode === "register" && (
              <div className="space-y-4 pt-4">
                <label className="flex items-start gap-3 text-sm text-white/90">
                  <Checkbox
                    id="consent-imagem"
                    checked={consentImagem}
                    onCheckedChange={(checked) => setConsentImagem(checked as boolean)}
                  />
                  <span>
                    Autorizo o uso da minha imagem para provador virtual (LGPD).
                    <span
                      className="ml-2 inline-block"
                      title="Sua imagem é usada somente para gerar os looks. Nada é divulgado sem sua permissão."
                    >
                      <Info className="h-4 w-4 text-white/70" />
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-white/90">
                  <Checkbox
                    id="consent-composicao"
                    checked={consentComposicao}
                    onCheckedChange={(checked) => setConsentComposicao(checked as boolean)}
                  />
                  <span>
                    Autorizo a {lojistaNome} a ver minhas composições para sugestões.
                    <span
                      className="ml-2 inline-block"
                      title="Isso ajuda o(a) estilista a sugerir novas combinações personalizadas."
                    >
                      <Info className="h-4 w-4 text-white/70" />
                    </span>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-300 text-center bg-red-500/20 p-2 rounded">{error}</p>
            )}

            <Button
              size="lg"
              className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/70 transition-all border-2 border-white/30"
              onClick={mode === "login" ? handleLogin : handleRegister}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="mr-2">Processando...</span>
              ) : mode === "login" ? (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Cadastrar conta
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/20 bg-gradient-to-tl from-purple-500/90 via-indigo-700/90 to-blue-800/90 p-8 shadow-xl shadow-black/30">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="text-xl font-semibold text-white">
              Um ambiente <span className="font-bold">Seguro</span> é nossa <span className="font-bold">Prioridade</span>.
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-800/80 via-indigo-700/80 to-purple-500/80 p-5 shadow-xl shadow-black/30">
              <h4 className="text-base font-semibold text-white mb-2">
                {lgpdInfo.title}
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                {lgpdInfo.description}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-purple-500/80 via-indigo-700/80 to-blue-800/80 p-5 shadow-xl shadow-black/30">
              <h4 className="text-base font-semibold text-white mb-2">
                Imagens Geradas por IA
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                As imagens geradas são meramente ilustrativas, criadas por IA. Têm o intuito de te auxiliar na escolha do look, mas não isentam a prova real para verificar medidas e satisfação. O aplicativo é apenas uma ferramenta de apoio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
