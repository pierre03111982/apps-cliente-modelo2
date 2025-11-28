# Documentação: Sistema de Favoritos, Like e Dislike

## 📋 Visão Geral

Este documento descreve o funcionamento completo do sistema de favoritos, likes e dislikes no aplicativo modelo-2. O sistema permite que clientes salvem looks favoritos, registrem preferências e interajam com composições geradas pela IA.

---

## 🎯 Funcionalidades Principais

### 1. **Like (Curtir)**
- **Ação**: Cliente curte uma composição gerada
- **Comportamento**: 
  - Salva a imagem nos favoritos automaticamente
  - Registra a ação no backend
  - Atualiza estatísticas do cliente
  - Marca a composição como curtida

### 2. **Dislike (Não Curtir)**
- **Ação**: Cliente não curte uma composição
- **Comportamento**:
  - **NÃO** salva a imagem nos favoritos
  - Registra a ação apenas para contabilização
  - Atualiza estatísticas do cliente
  - Marca a composição como não curtida

### 3. **Favoritos**
- **Conteúdo**: Apenas imagens que receberam "like"
- **Limite**: Máximo de 10 favoritos exibidos (mais recentes primeiro)
- **Filtros**: Remove duplicatas por `imagemUrl` e `compositionId`
- **Ordenação**: Por data de criação (mais recente primeiro)

---

## 🔧 Arquitetura Técnica

### Fluxo de Dados

```
Frontend (modelo-2) → API Proxy (/api/actions) → Backend (paineladm) → Firebase
```

### Rotas da API

#### 1. **Registrar Ação (Like/Dislike)**
```
POST /api/actions
```

**Payload:**
```json
{
  "action": "like" | "dislike" | "share" | "checkout",
  "compositionId": "string",
  "jobId": "string",
  "lojistaId": "string",
  "customerId": "string",
  "customerName": "string",
  "productName": "string",
  "productPrice": number,
  "imagemUrl": "string" // Apenas para likes
}
```

**Comportamento:**
- **Like**: Salva `imagemUrl` nos favoritos
- **Dislike**: **NÃO** salva `imagemUrl` (apenas contabiliza)

#### 2. **Buscar Favoritos**
```
GET /api/cliente/favoritos?lojistaId={id}&customerId={id}&_t={timestamp}
```

**Resposta:**
```json
{
  "favorites": [
    {
      "id": "string",
      "imagemUrl": "string",
      "compositionId": "string",
      "jobId": "string",
      "productName": "string",
      "productPrice": number,
      "createdAt": "timestamp",
      "action": "like"
    }
  ]
}
```

#### 3. **Verificar Voto**
```
GET /api/actions/check-vote?compositionId={id}&customerId={id}&lojistaId={id}
```

**Resposta:**
```json
{
  "votedType": "like" | "dislike" | null,
  "action": "like" | "dislike" | null,
  "alreadyVoted": boolean
}
```

---

## 📁 Estrutura de Arquivos

### Frontend (modelo-2)

```
src/app/[lojistaId]/resultado/page.tsx
├── Estados relacionados:
│   ├── favorites: Array<any>           // Lista de favoritos
│   ├── isLoadingFavorites: boolean     // Estado de carregamento
│   ├── showFavoritesModal: boolean     // Modal aberto/fechado
│   └── votedType: "like" | "dislike" | null
│
├── Funções principais:
│   ├── loadFavorites()                  // Carrega favoritos da API
│   ├── registerAction()                 // Registra like/dislike
│   └── handleLike() / handleDislike()   // Handlers de ações
│
└── Componentes:
    ├── Modal de Favoritos              // Exibe lista de favoritos
    └── Botões Like/Dislike             // Ações do usuário
```

### Backend (paineladm)

```
src/app/api/actions/route.ts
├── POST /api/actions
│   ├── Validação de payload
│   ├── Registro de favorito (apenas para likes)
│   ├── Atualização de estatísticas
│   └── Atualização de composição
│
src/app/api/actions/check-vote/route.ts
├── GET /api/actions/check-vote
│   ├── Verifica composição
│   └── Verifica favoritos
│
src/app/api/cliente/favoritos/route.ts
├── GET /api/cliente/favoritos
│   ├── Busca favoritos do Firestore
│   ├── Filtra apenas likes
│   └── Ordena por data
```

---

## 🔄 Fluxo de Funcionamento

### 1. **Registro de Like**

```
1. Cliente clica em "Like"
   ↓
2. Frontend chama POST /api/actions com action="like"
   ↓
3. Backend processa:
   - Salva imagemUrl nos favoritos (Firestore)
   - Atualiza estatísticas do cliente
   - Marca composição como curtida
   ↓
4. Frontend recarrega favoritos após 500ms
   ↓
5. Modal de favoritos atualizado
```

### 2. **Registro de Dislike**

```
1. Cliente clica em "Dislike"
   ↓
2. Frontend chama POST /api/actions com action="dislike"
   ↓
3. Backend processa:
   - NÃO salva imagemUrl (apenas contabiliza)
   - Atualiza estatísticas do cliente
   - Marca composição como não curtida
   ↓
4. Favoritos NÃO são atualizados
```

### 3. **Carregamento de Favoritos**

```
1. Página carrega
   ↓
2. loadFavorites() é chamado em background (silenciosamente)
   ↓
3. GET /api/cliente/favoritos
   ↓
4. Backend retorna apenas likes com imagemUrl
   ↓
5. Frontend filtra e ordena:
   - Remove duplicatas por imagemUrl
   - Ordena por data (mais recente primeiro)
   - Limita a 10 favoritos
   ↓
6. Estado atualizado sem "piscar"
```

---

## 🎨 Melhorias Implementadas

### 1. **Prevenção de Múltiplas Requisições**

**Problema**: Favoritos piscavam na tela devido a múltiplas chamadas simultâneas.

**Solução**:
- Adicionado `isLoadingFavoritesRef` para evitar requisições simultâneas
- Flag `favoritesLoadedOnce` para carregar apenas uma vez na inicialização
- Carregamento silencioso em background na inicialização

**Código**:
```typescript
const [isLoadingFavoritesRef, setIsLoadingFavoritesRef] = useState(false)
const [favoritesLoadedOnce, setFavoritesLoadedOnce] = useState(false)

const loadFavorites = useCallback(async (silent = false) => {
  if (!lojistaId || isLoadingFavoritesRef) return
  // ... código de carregamento
}, [lojistaId, isLoadingFavoritesRef])
```

### 2. **Skeleton Loading**

**Problema**: Tela branca durante carregamento.

**Solução**: Adicionado skeleton loading com animação pulse.

**Código**:
```typescript
{isLoadingFavorites ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
    {[...Array(10)].map((_, i) => (
      <div className="animate-pulse bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <Heart className="h-8 w-8 text-white/20" />
      </div>
    ))}
  </div>
) : (
  // ... favoritos
)}
```

### 3. **Otimização de Carregamento**

- Carregamento inicial em background (silent mode)
- Recarregamento apenas quando necessário (após like, ao abrir modal)
- Debounce implícito através do flag de loading

---

## 📊 Estrutura de Dados

### Favorito (Firestore)

```typescript
{
  id: string                    // ID do documento
  lojistaId: string             // ID da loja
  customerId: string            // ID do cliente
  customerName: string          // Nome do cliente
  compositionId: string | null  // ID da composição
  jobId: string | null          // ID do job
  imagemUrl: string | null       // URL da imagem (null para dislikes)
  productName: string | null    // Nome do produto
  productPrice: number | null   // Preço do produto
  lookType: "criativo"          // Tipo de look
  action: "like" | "dislike"    // Tipo de ação
  tipo: "like" | "dislike"      // Tipo (compatibilidade)
  votedType: "like" | "dislike" // Tipo de voto (compatibilidade)
  createdAt: Timestamp           // Data de criação
}
```

### Filtros Aplicados

```typescript
// Apenas likes com imagem
const likesOnly = favorites.filter((f: any) => {
  const hasImage = f.imagemUrl && f.imagemUrl.trim() !== ""
  const isLike = f.action === "like" || f.tipo === "like" || f.votedType === "like"
  return hasImage && (isLike || (!f.action && !f.tipo && !f.votedType))
})

// Remover duplicatas por imagemUrl
const seenUrls = new Map<string, any>()
likesOnly.forEach((f: any) => {
  const imageUrl = f.imagemUrl?.trim()
  if (imageUrl && !seenUrls.has(imageUrl)) {
    seenUrls.set(imageUrl, f)
  }
})

// Ordenar por data (mais recente primeiro)
const sorted = Array.from(seenUrls.values()).sort((a, b) => {
  const dateA = new Date(a.createdAt || 0)
  const dateB = new Date(b.createdAt || 0)
  return dateB.getTime() - dateA.getTime()
})

// Limitar a 10
const limited = sorted.slice(0, 10)
```

---

## 🔍 Regras de Negócio

### 1. **Like**
- ✅ Salva `imagemUrl` nos favoritos
- ✅ Atualiza estatísticas (`totalLikes`)
- ✅ Marca composição como `curtido: true`
- ✅ Aparece no modal de favoritos

### 2. **Dislike**
- ❌ **NÃO** salva `imagemUrl` nos favoritos
- ✅ Atualiza estatísticas (`totalDislikes`)
- ✅ Marca composição como `disliked: true`
- ❌ **NÃO** aparece no modal de favoritos

### 3. **Favoritos**
- ✅ Apenas likes com `imagemUrl` válida
- ✅ Máximo de 10 favoritos exibidos
- ✅ Ordenados por data (mais recente primeiro)
- ✅ Sem duplicatas (por `imagemUrl`)

---

## 🐛 Troubleshooting

### Problema: Favoritos não aparecem

**Possíveis causas**:
1. Cliente não deu like (apenas dislike)
2. `imagemUrl` está vazia ou null
3. Backend não está rodando
4. Erro de CORS

**Solução**:
- Verificar logs do console: `[ResultadoPage] Favoritos carregados: X`
- Verificar se `action === "like"` no Firestore
- Verificar se `imagemUrl` não está vazio

### Problema: Favoritos piscam na tela

**Causa**: Múltiplas chamadas simultâneas de `loadFavorites()`

**Solução**: Já implementado com `isLoadingFavoritesRef` e `favoritesLoadedOnce`

### Problema: Dislike aparece nos favoritos

**Causa**: Filtro não está funcionando corretamente

**Solução**: Verificar se o backend está salvando `imagemUrl: null` para dislikes

---

## 📝 Notas de Desenvolvimento

### Variáveis de Ambiente

```env
# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000

# Client App URL
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3005
NEXT_PUBLIC_CLIENT_APP_DEV_URL=http://localhost:3005
```

### Logs Importantes

```typescript
// Frontend
console.log("[ResultadoPage] Favoritos carregados:", count)
console.log("[ResultadoPage] Like salvo com sucesso")
console.log("[ResultadoPage] Recarregando favoritos após like...")

// Backend
console.log("[api/actions] Registrando favorito para like:", data)
console.log("[api/actions] Dislike registrado (sem imagemUrl)")
console.log("[api/cliente/favoritos] Favoritos encontrados:", count)
```

---

## 🚀 Melhorias Futuras

1. **Paginação**: Carregar mais de 10 favoritos com scroll infinito
2. **Busca**: Filtrar favoritos por nome do produto
3. **Compartilhamento**: Compartilhar favoritos via WhatsApp
4. **Exportação**: Exportar favoritos como PDF
5. **Categorização**: Agrupar favoritos por categoria

---

## 📚 Referências

- **Backend API**: `E:\projetos\paineladm\src\app\api\actions\route.ts`
- **Frontend**: `E:\projetos\apps-cliente\modelo-2\src\app\[lojistaId]\resultado\page.tsx`
- **Documentação Técnica**: `DOCUMENTACAO_TECNICA.md`

---

**Última atualização**: 2025-01-27
**Versão**: 1.0.0









