# Relatório de Auditoria Completa - App Cliente Modelo-2
## Sistema de Experimentação Virtual com IA

**Data:** 2025-01-06  
**Versão:** PHASE 27  
**Escopo:** Estrutura completa, funcionalidades e código do app modelo-2

---

## 1. Visão Geral da Arquitetura

### 1.1 Estrutura de Diretórios

```
apps-cliente/modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/              # Rotas dinâmicas por lojista
│   │   │   ├── experimentar/         # Tela de seleção de produtos e foto
│   │   │   ├── resultado/            # Tela de visualização e ações
│   │   │   ├── login/                # Tela de login/consentimento
│   │   │   ├── tv/                   # Modo display/TV
│   │   │   ├── page.tsx              # Página inicial
│   │   │   └── layout.tsx            # Layout específico do lojista
│   │   ├── api/                      # Rotas de API
│   │   │   ├── generate-looks/      # Geração de looks (normal e remix)
│   │   │   ├── cliente/              # APIs de cliente (login, favoritos, share)
│   │   │   ├── lojista/             # APIs de lojista (perfil, produtos)
│   │   │   ├── sales/                # APIs de vendas (pagamento, frete)
│   │   │   ├── jobs/                 # Sistema de jobs assíncronos (PHASE 27)
│   │   │   ├── display/              # APIs de display
│   │   │   ├── webhooks/             # Webhooks (MercadoPago, Melhor Envio)
│   │   │   └── melhor-envio/         # Integração Melhor Envio
│   │   ├── layout.tsx                # Layout raiz
│   │   └── globals.css               # Estilos globais
│   ├── components/
│   │   ├── client-app/               # Componentes do app cliente
│   │   │   ├── Step1LoginConsent.tsx
│   │   │   ├── Step2Workspace.tsx
│   │   │   ├── Step3Results.tsx
│   │   │   ├── ProductGalleryModal.tsx
│   │   │   ├── FavoritosStep2.tsx
│   │   │   └── ProductAffinityBadge.tsx
│   │   ├── views/                    # Views principais
│   │   │   ├── ExperimentarView.tsx
│   │   │   └── DisplayView.tsx
│   │   ├── modals/                   # Modais
│   │   │   ├── ShoppingCartModal.tsx
│   │   │   ├── DislikeFeedbackModal.tsx
│   │   │   └── PrivacyOnboardingModal.tsx
│   │   ├── ui/                       # Componentes UI reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── AvatarSelector.tsx
│   │   │   ├── SafeImage.tsx
│   │   │   └── SmartUploadZone.tsx
│   │   └── ...                      # Outros componentes
│   ├── lib/
│   │   ├── types.ts                  # Tipos TypeScript
│   │   ├── firebase.ts               # Configuração Firebase Client
│   │   ├── firebaseAdmin.ts          # Configuração Firebase Admin
│   │   ├── firebaseQueries.ts        # Queries Firestore
│   │   ├── financials.ts             # Sistema de créditos (PHASE 27)
│   │   ├── scenarioMatcher.ts        # Matching de cenários (PHASE 26)
│   │   ├── session-client.ts         # Gerenciamento de sessão
│   │   ├── constants.ts              # Constantes
│   │   └── utils.ts                  # Utilitários
│   └── hooks/
│       ├── useClienteSession.ts      # Hook de sessão do cliente
│       └── useStoreSession.ts       # Hook de sessão da loja (Display)
├── public/                           # Arquivos estáticos
├── docs/                             # Documentação
└── scripts/                          # Scripts utilitários
```

### 1.2 Fluxo de Dados Principal

```
[Cliente] → [App Modelo-2] → [API Routes] → [Backend paineladm] → [AI Services]
     ↓              ↓               ↓               ↓                  ↓
  Upload      Validação      Reserva de      Processamento    Geração de
  Foto        e Upload       Créditos        Assíncrono        Imagem
     ↓              ↓               ↓               ↓                  ↓
  Seleção      Geração       Job System      Orchestrator      Gemini Flash
  Produtos     de Look       (PHASE 27)      + Cenários        Image
     ↓              ↓               ↓               ↓                  ↓
  Resultado    Visualização  Polling         Watermark         Upload Storage
  e Ações      e Ações       Status          (opcional)        Firebase
```

---

## 2. Sistema de Autenticação e Sessão

### 2.1 Autenticação de Cliente

**Arquivo:** `src/lib/session-client.ts`

**Funções Principais:**

#### `getClienteSessionWithFallback(lojistaId: string)`
- Busca sessão do cliente em cookies HttpOnly (prioridade)
- Fallback para localStorage se cookie não disponível
- Retorna dados do cliente ou `null`

**Estrutura da Sessão:**
```typescript
{
  clienteId: string
  nome: string
  whatsapp: string
  lojistaId: string
  deviceId: string
  loggedAt: string
}
```

**APIs de Cliente:**
- `POST /api/cliente/login`: Login/registro do cliente
- `GET /api/cliente/check-session`: Verifica sessão ativa
- `GET /api/cliente/session`: Obtém dados da sessão
- `GET /api/cliente/find`: Busca cliente por telefone

### 2.2 Sessão de Loja (Display)

**Arquivo:** `src/hooks/useStoreSession.ts`

**Funcionalidades:**
- Gerenciamento de conexão com display físico
- Persistência em sessionStorage
- Indicador visual de conexão (`StoreConnectionIndicator`)

---

## 3. Telas Principais

### 3.1 Tela de Login/Consentimento

**Arquivo:** `src/app/[lojistaId]/login/page.tsx`

**Componente:** `Step1LoginConsent`

**Funcionalidades:**
- Coleta de nome e WhatsApp
- Consentimento de privacidade
- Seleção de avatar (opcional)
- Registro/login automático

### 3.2 Tela de Experimentar

**Arquivo:** `src/app/[lojistaId]/experimentar/page.tsx`

**Componente:** `ExperimentarView`

**Funcionalidades:**
- Upload de foto do cliente
- Seleção de produtos (máximo 2 simultâneos)
- Filtro por categoria
- Seleção de favoritos anteriores
- Modo refinamento (trocar produto)
- Geração de looks
- Conexão com display

**Estados Principais:**
- `userPhoto`: File da foto
- `userPhotoUrl`: URL da foto (blob ou HTTP)
- `selectedProducts`: Array de produtos selecionados
- `isRefineMode`: Modo de refinamento ativo
- `isGenerating`: Geração em andamento

**Lógica de Seleção de Produtos:**
- Máximo 2 produtos simultâneos
- Substituição automática se mesma categoria
- Exceção: Cosméticos e Joias podem ter múltiplos da mesma categoria
- Validação de categoria antes de adicionar

### 3.3 Tela de Resultado

**Arquivo:** `src/app/[lojistaId]/resultado/page.tsx`

**Componente:** `Step3Results`

**Funcionalidades:**
- Visualização do look gerado
- Ações: Like, Dislike, Compartilhar, Remixar, Trocar Produto
- Modal de feedback (dislike)
- Modal de carrinho de compras
- Envio para display
- Visualização de favoritos
- Download de imagem

**Estados Principais:**
- `looks`: Array de looks gerados
- `currentLookIndex`: Índice do look atual
- `hasVoted`: Se já votou (like/dislike)
- `votedType`: Tipo de voto ("like" | "dislike")
- `isRemixing`: Remix em andamento

---

## 4. Sistema de Geração de Looks

### 4.1 API de Geração Normal

**Rota:** `POST /api/generate-looks`

**Arquivo:** `src/app/api/generate-looks/route.ts`

**Fluxo Completo:**

1. **Validação de Entrada**
   - Valida `lojistaId`
   - Valida `original_photo_url` ou `personImageUrl`
   - Valida `productIds` (array não vazio)

2. **Reserva de Créditos (PHASE 27)**
   - Chama `reserveCredit(lojistaId)`
   - Cria registro de reserva em `credit_reservations`
   - Não debita ainda (só reserva)
   - Retorna `reservationId`

3. **Busca de Produtos**
   - Busca produtos do Firestore usando `productIds`
   - Extrai tags dos produtos para matching de cenários

4. **Matching de Cenários (PHASE 26)**
   - Usa `scenarioMatcher.findScenarioByProductTags()`
   - Cache em memória (5 minutos TTL)
   - Fallback para categoria se nenhum match por tags
   - Seleção aleatória se múltiplos matches

5. **Criação de Job Assíncrono (PHASE 27)**
   - Cria documento em `generation_jobs/{jobId}`
   - Status inicial: `PENDING`
   - Salva `reservationId` no job
   - Retorna `202 Accepted` com `jobId` e `reservationId`

6. **Processamento Assíncrono**
   - Backend processa job em background
   - Atualiza status: `PENDING` → `PROCESSING` → `COMPLETED` ou `FAILED`
   - Salva resultado em `result.imageUrl` e `result.compositionId`

7. **Polling no Frontend**
   - Frontend faz polling em `/api/jobs/{jobId}`
   - Intervalo: 2 segundos
   - Timeout máximo: 3 minutos
   - Quando `COMPLETED`, navega para resultado

**Payload de Requisição:**
```typescript
{
  original_photo_url: string        // Foto original (Source of Truth)
  personImageUrl: string             // Compatibilidade
  productIds: string[]              // IDs dos produtos selecionados
  lojistaId: string
  customerId?: string
  customerName?: string
  options: {
    quality: "high"
    skipWatermark: boolean
    lookType: "creative"
    gerarNovoLook: boolean          // PHASE 25: Remix Universal
    seed?: number                    // Seed aleatório
  }
  scenePrompts?: string[]           // Prompts de cena
  sceneInstructions?: string        // Instruções específicas (ex: DAYTIME)
}
```

**Resposta (202 Accepted):**
```typescript
{
  jobId: string
  reservationId: string
  status: "PENDING"
}
```

**Resposta do Polling (200 OK):**
```typescript
{
  status: "COMPLETED" | "PROCESSING" | "FAILED"
  result?: {
    compositionId: string
    imageUrl: string
    sceneImageUrls?: string[]
    totalCost?: number
    processingTime?: number
  }
  error?: string
}
```

### 4.2 API de Remix

**Rota:** `POST /api/generate-looks/remix`

**Arquivo:** `src/app/api/generate-looks/remix/route.ts`

**Diferenças do Geração Normal:**
- Usa `original_photo_url` obrigatório
- `gerarNovoLook: true` (força nova pose)
- `scenePrompts` com instruções de pose variada
- Mesma lógica de reserva de créditos e jobs assíncronos

### 4.3 Sistema de Jobs Assíncronos (PHASE 27)

**Arquivo:** `src/lib/types.ts` (interface `GenerationJob`)

**Estrutura do Job:**
```typescript
{
  id: string
  lojistaId: string
  customerId?: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  reservationId: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
  error?: string
  personImageUrl: string
  productIds: string[]
  result?: {
    compositionId?: string
    imageUrl?: string
  }
  apiCost?: number
  viewedAt?: Date
  creditCommitted?: boolean
  retryCount?: number
  maxRetries?: number
}
```

**API de Jobs:**
- `GET /api/jobs/[jobId]`: Consulta status do job
- Backend processa jobs via `/api/internal/process-job` (paineladm)

**Vantagens:**
- Não bloqueia requisição HTTP
- Permite retry em caso de falha
- Melhor UX (polling progressivo)
- Rastreamento de custos por job

---

## 5. Sistema de Créditos e Reservas (PHASE 27)

### 5.1 Arquitetura de Reserva

**Arquivo:** `src/lib/financials.ts`

**Fluxo:**
1. **Reserva** (`reserveCredit`): Reserva crédito sem debitar
2. **Confirmação** (`commitCredit`): Debita quando usuário visualiza
3. **Rollback** (`rollbackCredit`): Cancela se houver erro

**Estrutura de Reserva:**
```typescript
{
  id: string                    // reservationId
  lojistaId: string
  status: "reserved" | "confirmed" | "cancelled"
  amount: number               // Sempre 1 crédito
  createdAt: Date
  expiresAt: Date              // 24 horas
  confirmedAt?: Date
  cancelledAt?: Date
}
```

**Vantagens:**
- Não debita se geração falhar
- Só debita quando usuário visualiza (melhor UX)
- Permite rollback em caso de erro
- Suporta modo sandbox (sem débito real)

### 5.2 Validação de Créditos

**Checks:**
- Saldo disponível: `credits_balance + overdraft_limit`
- Status da conta: `billing_status !== "frozen"`
- Modo sandbox: Permite sem validação real

---

## 6. Sistema de Cenários (PHASE 26)

### 6.1 Matching de Cenários

**Arquivo:** `src/lib/scenarioMatcher.ts`

**Classe:** `ScenarioCache`

**Funcionalidades:**
- Cache em memória (5 minutos TTL)
- Busca cenários ativos do Firestore
- Matching por tags de produtos
- Fallback para categoria
- Seleção aleatória se múltiplos matches

**Método Principal:**
```typescript
findScenarioByProductTags(
  products: Produto[],
  fallbackCategory?: string
): Promise<CachedScenario | null>
```

**Fluxo:**
1. Carrega cenários do cache (ou Firestore se expirado)
2. Extrai tags de todos os produtos
3. Busca cenários que tenham pelo menos uma tag em comum
4. Se nenhum match, usa `fallbackCategory`
5. Se múltiplos matches, seleciona aleatório
6. Retorna cenário com `imageUrl`, `lightingPrompt`, `category`

**Estrutura de Cenário:**
```typescript
{
  id: string
  imageUrl: string
  fileName?: string
  category: string
  tags?: string[]
  lightingPrompt?: string
  active: boolean
}
```

---

## 7. APIs Principais

### 7.1 APIs de Cliente

#### `POST /api/cliente/login`
- Login/registro do cliente
- Cria sessão em cookie HttpOnly
- Retorna dados do cliente

#### `GET /api/cliente/favoritos`
- Lista favoritos do cliente (likes)
- Filtra por `lojistaId` e `customerId`
- Ordena por data (mais recente primeiro)
- Limita a 10 favoritos

#### `POST /api/cliente/share`
- Compartilha composição
- Gera link único
- Rastreia compartilhamentos

### 7.2 APIs de Lojista

#### `GET /api/lojista/perfil`
- Busca perfil da loja
- Retorna nome, logo, descrição, redes sociais, `salesConfig`

#### `GET /api/lojista/products`
- Lista produtos da loja
- Filtra arquivados
- Retorna array de `Produto`

### 7.3 APIs de Vendas

#### `POST /api/sales/create-payment`
- Cria pagamento no MercadoPago
- Retorna link de checkout

#### `POST /api/sales/calculate-shipping`
- Calcula frete via Melhor Envio
- Retorna opções de frete

### 7.4 APIs de Display

#### `POST /api/display/update`
- Atualiza conteúdo do display
- Envia composição para exibir

### 7.5 APIs de Webhooks

#### `POST /api/webhooks/mercadopago`
- Recebe notificações do MercadoPago
- Atualiza status de pagamento

#### `POST /api/webhooks/melhor-envio`
- Recebe notificações do Melhor Envio
- Atualiza status de envio

---

## 8. Componentes Principais

### 8.1 ExperimentarView

**Arquivo:** `src/components/views/ExperimentarView.tsx`

**Props:**
- `lojistaData`: Dados da loja
- `filteredCatalog`: Produtos filtrados
- `categories`: Categorias disponíveis
- `userPhotoUrl`: URL da foto
- `selectedProducts`: Produtos selecionados
- `handlePhotoUpload`: Handler de upload
- `toggleProductSelection`: Handler de seleção
- `handleVisualize`: Handler de geração
- `handleRefine`: Handler de refinamento (opcional)

**Funcionalidades:**
- Galeria de produtos
- Upload de foto (drag & drop ou click)
- Seleção de produtos
- Botão de gerar look
- Botão de trocar produto (modo refine)
- Modal de favoritos

### 8.2 Step3Results

**Arquivo:** `src/components/client-app/Step3Results.tsx`

**Funcionalidades:**
- Visualização de imagem gerada
- Botões de ação (Like, Dislike, Share, Remix, Trocar Produto)
- Modal de feedback (dislike)
- Modal de carrinho
- Envio para display
- Download de imagem

### 8.3 ShoppingCartModal

**Arquivo:** `src/components/modals/ShoppingCartModal.tsx`

**Funcionalidades:**
- Lista de itens no carrinho
- Cálculo de total
- Integração com MercadoPago ou WhatsApp
- Cálculo de frete (Melhor Envio)

### 8.4 DislikeFeedbackModal

**Arquivo:** `src/components/modals/DislikeFeedbackModal.tsx`

**Funcionalidades:**
- Coleta feedback do usuário
- Razões: "Não gostei da peça", "Caimento ruim", "Imagem estranha", "Outro"
- Envia feedback para backend

---

## 9. Gerenciamento de Estado

### 9.1 SessionStorage

**Chaves Principais:**
- `photo_{lojistaId}`: URL da foto atual
- `original_photo_{lojistaId}`: URL da foto original (Source of Truth)
- `products_{lojistaId}`: Produtos selecionados (JSON)
- `looks_{lojistaId}`: Looks gerados (JSON)
- `refine_mode_{lojistaId}`: Modo refinamento ativo
- `refine_baseImage_{lojistaId}`: Imagem base para refinamento
- `refine_compositionId_{lojistaId}`: ID da composição para refinamento
- `reservation_{lojistaId}`: ID da reserva de crédito
- `job_{lojistaId}`: ID do job de geração
- `new_looks_generated_{lojistaId}`: Flag de nova geração
- `target_display`: ID do display conectado
- `connected_store_id`: ID da loja conectada

### 9.2 LocalStorage

**Chaves Principais:**
- `desconto_aplicado_{lojistaId}`: Flag de desconto aplicado
- `cliente_{lojistaId}`: Dados do cliente (fallback)

---

## 10. Melhorias Implementadas por Fase

### PHASE 11
- ✅ **Fix: Sempre usar foto original**
  - Evita "efeito colagem" ao adicionar acessórios
  - Salva `original_photo_url` no sessionStorage
  - Usa foto original em todas as gerações

- ✅ **Fix: Enviar todos os produtos selecionados**
  - Não apenas o primeiro produto
  - Suporta multi-produto (até 2 simultâneos)

### PHASE 13
- ✅ **Source of Truth: original_photo_url**
  - Campo explícito `original_photo_url` no payload
  - Backend sempre usa foto original
  - Compatibilidade com `personImageUrl`

### PHASE 25
- ✅ **Remix Universal Protocol**
  - `gerarNovoLook: true` para melhor qualidade
  - Seed aleatório para variar resultados
  - Instruções explícitas de cena (ex: DAYTIME)

- ✅ **Melhorias Mobile**
  - Timeouts maiores (3 minutos mobile, 2 minutos desktop)
  - Mensagens de erro mais amigáveis
  - Melhor tratamento de erros de rede

### PHASE 26
- ✅ **Integração de Cenários como Input Visual**
  - Frontend busca cenários por tags de produtos
  - Envia `scenarioImageUrl` para backend
  - Backend inclui cenário no array de imagens do Gemini

- ✅ **Matching Inteligente de Cenários**
  - Cache em memória (5 minutos TTL)
  - Matching por tags de produtos
  - Fallback para categoria
  - Seleção aleatória se múltiplos matches

### PHASE 27
- ✅ **Sistema de Jobs Assíncronos**
  - Geração não bloqueia requisição HTTP
  - Polling progressivo no frontend
  - Retry em caso de falha
  - Rastreamento de custos por job

- ✅ **Sistema de Reserva de Créditos**
  - Reserva sem debitar imediatamente
  - Confirmação quando usuário visualiza
  - Rollback em caso de erro
  - Suporte a modo sandbox

---

## 11. Tecnologias e Dependências

### 11.1 Dependências Principais

```json
{
  "next": "^14.2.33",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "firebase": "^12.6.0",
  "firebase-admin": "^13.0.0",
  "lucide-react": "^0.553.0",
  "mercadopago": "^2.0.0",
  "qrcode.react": "^4.2.0",
  "react-hot-toast": "^2.6.0",
  "tailwindcss": "^3.4.13"
}
```

### 11.2 Configuração Next.js

**Arquivo:** `next.config.mjs`

**Otimizações:**
- `swcMinify: true` (minificação rápida)
- `compress: true` (compressão)
- Remoção de `console.log` em produção
- Configuração de imagens remotas (Firebase Storage, Google APIs)
- Webpack fallbacks para Node.js modules

---

## 12. Fluxos Principais

### 12.1 Fluxo de Geração de Look

```
1. Cliente faz upload de foto
   ↓
2. Cliente seleciona produtos (máximo 2)
   ↓
3. Cliente clica em "Criar Look"
   ↓
4. Frontend valida foto e produtos
   ↓
5. Frontend converte blob URL para HTTP (se necessário)
   ↓
6. Frontend chama POST /api/generate-looks
   ↓
7. Backend reserva crédito (reserveCredit)
   ↓
8. Backend busca produtos do Firestore
   ↓
9. Backend busca cenário por tags (scenarioMatcher)
   ↓
10. Backend cria job assíncrono
    ↓
11. Backend retorna 202 Accepted com jobId
    ↓
12. Frontend inicia polling em /api/jobs/{jobId}
    ↓
13. Backend processa job em background
    ↓
14. Backend atualiza status: PROCESSING → COMPLETED
    ↓
15. Frontend recebe status COMPLETED com imageUrl
    ↓
16. Frontend navega para /resultado
    ↓
17. Cliente visualiza imagem
    ↓
18. Frontend confirma crédito (commitCredit)
    ↓
19. Backend debita crédito efetivamente
```

### 12.2 Fluxo de Remix

```
1. Cliente está na tela de resultado
   ↓
2. Cliente clica em "Remixar"
   ↓
3. Frontend chama POST /api/generate-looks/remix
   ↓
4. Backend usa mesma lógica de geração normal
   ↓
5. Backend força gerarNovoLook: true
   ↓
6. Backend aplica scenePrompts com instruções de pose
   ↓
7. Mesmo fluxo de jobs assíncronos
   ↓
8. Frontend atualiza imagem na tela de resultado
```

### 12.3 Fluxo de Trocar Produto

```
1. Cliente está na tela de resultado
   ↓
2. Cliente clica em "Trocar Produto"
   ↓
3. Frontend navega para /experimentar com refine_mode=true
   ↓
4. Frontend carrega produtos selecionados anteriormente
   ↓
5. Frontend mostra imagem base (não permite novo upload)
   ↓
6. Cliente seleciona novos produtos
   ↓
7. Cliente clica em "Trocar Produto"
   ↓
8. Frontend chama POST /api/generate-looks (mesma API)
   ↓
9. Frontend SEMPRE usa original_photo_url (não imagem gerada)
   ↓
10. Mesmo fluxo de geração normal
    ↓
11. Frontend navega para /resultado com novo look
```

---

## 13. Tratamento de Erros

### 13.1 Erros de Upload

- **Blob URL inválida**: Converte para File e faz upload
- **Timeout**: 30 segundos para upload
- **Erro de rede**: Mensagem amigável + retry

### 13.2 Erros de Geração

- **Créditos insuficientes**: 402 Payment Required
- **Timeout**: 3 minutos mobile, 2 minutos desktop
- **Erro de rede**: Retry com backoff exponencial
- **Job falhou**: Rollback de crédito + mensagem de erro

### 13.3 Erros de Sessão

- **Sessão expirada**: Redireciona para /login
- **Cookie inválido**: Fallback para localStorage
- **Cliente não encontrado**: Cria novo cliente

---

## 14. Segurança

### 14.1 Autenticação

- Cookies HttpOnly para sessão
- Validação de `lojistaId` em todas as rotas
- Validação de `customerId` para ações do cliente

### 14.2 Validação de Dados

- Validação de URLs (HTTP/HTTPS apenas, não blob)
- Validação de tipos TypeScript
- Sanitização de inputs

### 14.3 CORS

- Headers CORS configurados
- Origin dinâmico (do header `origin`)
- Suporte a `OPTIONS` para preflight

---

## 15. Performance

### 15.1 Otimizações

- Cache de cenários em memória (5 minutos TTL)
- Compressão de imagens antes do upload (1920x1920, 85% qualidade)
- Lazy loading de componentes
- Polling otimizado (2 segundos, timeout 3 minutos)

### 15.2 Limitações

- Máximo 2 produtos simultâneos
- Timeout de 3 minutos para geração
- Cache de cenários expira em 5 minutos

---

## 16. Pontos de Atenção

### 16.1 Performance

- Cache de cenários pode ficar desatualizado (5 minutos)
- Polling pode gerar muitas requisições (otimizar se necessário)
- Upload de imagens grandes pode ser lento (já comprimido)

### 16.2 Segurança

- Validação de URLs blob (não enviar ao servidor)
- Validação de créditos (não permitir geração sem crédito)
- Rate limiting (implementar se necessário)

### 16.3 Escalabilidade

- Jobs assíncronos melhoram escalabilidade
- Cache de cenários reduz queries ao Firestore
- Polling pode ser substituído por WebSockets no futuro

---

## 17. Próximos Passos Sugeridos

1. **WebSockets para Jobs**
   - Substituir polling por WebSockets
   - Notificação em tempo real de conclusão

2. **Otimização de Cache**
   - Cache de produtos (com invalidação)
   - Cache de perfil da loja

3. **Melhorias de UX**
   - Progress bar para geração
   - Preview de produtos antes de selecionar
   - Histórico de looks gerados

4. **Testes**
   - Testes unitários para componentes
   - Testes de integração para APIs
   - Testes E2E para fluxos completos

5. **Monitoramento**
   - Logs estruturados
   - Métricas de performance
   - Alertas de erros

---

## 18. Conclusão

O app modelo-2 é um sistema robusto e bem estruturado, com:

- ✅ Arquitetura modular e escalável
- ✅ Separação clara de responsabilidades
- ✅ Sistema de jobs assíncronos (PHASE 27)
- ✅ Sistema de reserva de créditos (PHASE 27)
- ✅ Integração de cenários como input visual (PHASE 26)
- ✅ Matching inteligente de cenários (PHASE 26)
- ✅ Tratamento robusto de erros
- ✅ Suporte a mobile e desktop
- ✅ Integração com MercadoPago e Melhor Envio
- ✅ Sistema de display físico

O sistema suporta geração de looks, remix, troca de produto, favoritos, compartilhamento, vendas, e muito mais, com uma base sólida para crescimento e evolução.

---

**Documento gerado automaticamente em:** 2025-01-06  
**Última atualização:** PHASE 27

