"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Camera, Upload, User, Sparkles, Share2, ShoppingCart, Heart, RefreshCw, Home, ArrowLeftCircle } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { ExperimentarView } from "@/components/views/ExperimentarView"
import { useState } from "react"
import { Produto } from "@/lib/types"

function DemoPageContent() {
  const searchParams = useSearchParams()
  const tela = searchParams.get("tela") || "1"

  // Imagens Mockadas
  const MOCK_USER_PHOTO = "/mock-person.jpg"
  const MOCK_RESULT_PHOTO = "/mock-result.jpg"

  // Estado para interação no Demo (Tela 2)
  const [demoSelectedProducts, setDemoSelectedProducts] = useState<Produto[]>([])

  // Mock Catalog
  const mockCatalog: Produto[] = [
      { id: '1', nome: 'Vestido Floral Verão', preco: 199.90, imagemUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=500&auto=format&fit=crop', categoria: 'Vestidos' },
      { id: '2', nome: 'Blusa Seda Premium', preco: 149.90, imagemUrl: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=500&auto=format&fit=crop', categoria: 'Blusas' },
       { id: '3', nome: 'Saia Longa Plissada', preco: 179.90, imagemUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=500&auto=format&fit=crop', categoria: 'Saias' },
        { id: '4', nome: 'Vestido Festa Luxo', preco: 299.90, imagemUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop', categoria: 'Vestidos' },
  ]

  // --- TELA 1: LOGIN ---
  if (tela === "1") {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans">
        <div className="absolute inset-0 z-0">
          <img
            src="/background.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
          <div
            className="w-full max-w-md space-y-8 rounded-2xl border border-white/30 backdrop-blur p-8 shadow-2xl"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))",
            }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Sua Loja
              </h1>
              <p className="text-sm text-gray-400">
                Bem-vindo(a) à nova era<br/>da Moda Digital
                <span className="block text-xs mt-1">(Provador Virtual IA)</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="tel"
                  disabled
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <input
                  type="password"
                  disabled
                  placeholder="******"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <button
                disabled
                className="w-full rounded-lg bg-white py-3 font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- TELA 2: UPLOAD / EXPERIMENTAR (USANDO COMPONENTE REAL) ---
  if (tela === "2") {
    return (
      <ExperimentarView 
        lojistaData={{ 
            id: 'demo',
            nome: "Sua Loja", 
            logoUrl: null,
            descricao: "Loja de demonstração",
            salesConfig: {
              enabled: false,
              payment_gateway: "manual_whatsapp",
              shipping_provider: "none",
            }, 
            redesSociais: { instagram: "@lojademo" },
            descontoRedesSociais: 10,
            descontoRedesSociaisExpiraEm: new Date(Date.now() + 86400000).toISOString()
        }}
        isLoadingCatalog={false}
        filteredCatalog={mockCatalog}
        categories={["Todos", "Vestidos", "Blusas", "Saias"]}
        activeCategory="Todos"
        setActiveCategory={() => {}}
        userPhotoUrl={MOCK_USER_PHOTO}
        isRefineMode={false}
        refineBaseImageUrl={null}
        handleChangePhoto={() => {}}
        handleRemovePhoto={() => {}}
        handlePhotoUpload={() => {}}
        selectedProducts={demoSelectedProducts}
        toggleProductSelection={(p) => {
            setDemoSelectedProducts(prev => {
                const exists = prev.find(i => i.id === p.id)
                if (exists) return prev.filter(i => i.id !== p.id)
                return [...prev, p]
            })
        }}
        categoryWarning={null}
        handleSocialClick={() => {}}
        handleShareApp={() => {}}
        descontoAplicado={true}
        formatPrice={(v) => `R$ ${v?.toFixed(2).replace('.', ',')}`}
        handleVisualize={() => {}}
        isGenerating={false}
        generationError={null}
        showFavoritesModal={false}
        setShowFavoritesModal={() => {}}
        isLoadingFavorites={false}
        favorites={[]}
        router={{ push: () => {} }}
        lojistaId="demo"
        handleBackFromRefinement={() => {}}
        isDisplayConnected={false}
        onDisplayConnect={() => {}}
      />
    )
  }

  // --- TELA 3: RESULTADO ---
  if (tela === "3") {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Fundo */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <img
            src="/background.jpg"
            alt="Fundo"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 min-h-screen flex flex-col p-4 items-center justify-center space-y-3">
          
          {/* Cabeçalho */}
          <div className="w-full max-w-sm">
            <div
              className="rounded-xl border-2 border-white/30 backdrop-blur px-3 py-2 shadow-xl flex items-center justify-center gap-3 relative"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}
            >
              <button className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-white"><ArrowLeftCircle className="h-6 w-6" /></button>
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/30 flex-shrink-0 bg-white">
                {/* Placeholder para logo */}
              </div>
              <h3 className="text-lg font-bold text-white" style={{ textShadow: "1px 1px 2px black" }}>Sua Loja</h3>
            </div>
          </div>
          
          {/* Card Principal */}
          <div 
            className="relative w-full max-w-sm space-y-3 rounded-2xl border-2 border-white/30 backdrop-blur p-4 shadow-2xl"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), rgba(59,130,246,0.2), rgba(34,197,94,0.2), rgba(59,130,246,0.2), rgba(0,0,0,0.2))" }}
          >
              <div className="absolute top-4 right-4 z-10">
                  <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border-2 border-white/50 text-white" style={{ background: "linear-gradient(45deg, rgba(37,99,235,1), rgba(147,51,234,1), rgba(249,115,22,1), rgba(34,197,94,1))" }}>
                      <Sparkles className="h-4 w-4 text-white" />
                      Look Criativo IA
                  </span>
              </div>
              <div className="w-full rounded-xl overflow-hidden border-2 border-white/30">
                <img src={MOCK_RESULT_PHOTO} alt="Resultado" className="h-auto w-full object-cover rounded-lg" />
              </div>

              <div className="space-y-3">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Look Salvo!</h2>
                    <p className="text-sm text-gray-300">O que fazer agora?</p>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm" style={{ background: "linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)"}}><ShoppingCart className="h-4 w-4" /> Comprar Agora</button>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-black/30 border-2 border-white/30 py-3 font-semibold text-white text-sm"><ShoppingCart className="h-4 w-4" /> Adicionar ao Carrinho</button>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm" style={{ background: "linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)"}}><Share2 className="h-4 w-4" /></button>
                    <button className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm" style={{ background: "linear-gradient(to right, #db2777, #f472b6, #db2777)"}}><Heart className="h-4 w-4" /> Favoritos</button>
                  </div>
                  
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm" style={{ background: "linear-gradient(to right, #7e22ce, #a855f7, #7e22ce)"}}><Sparkles className="h-4 w-4" /> Adicionar Acessório</button>
                  
                  <div className="flex flex-col gap-3">
                     <button className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white text-sm" style={{ background: "linear-gradient(to right, #15803d, #22c55e, #15803d)"}}><RefreshCw className="h-4 w-4" /> Remixar Look</button>
                     <button className="flex items-center justify-center gap-2 rounded-xl bg-black/30 border-2 border-white/30 py-3 font-semibold text-white text-sm"><Home className="h-4 w-4" /> Criar outro</button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    )
  }

  return <div>Selecione uma tela</div>
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DemoPageContent />
    </Suspense>
  )
}
