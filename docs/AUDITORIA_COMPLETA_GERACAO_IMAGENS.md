# Relatório de Auditoria Completa - Geração de Imagens
## App Modelo-2

**Data:** 2025-01-27  
**Versão:** PHASE 26  
**Escopo:** Estrutura completa e lógica de geração de imagens

---

## 1. Visão Geral da Arquitetura

### 1.1 Estrutura de Diretórios

```
apps-cliente/modelo-2/
├── src/
│   ├── app/
│   │   ├── [lojistaId]/
│   │   │   ├── experimentar/          # Página principal de experimentação
│   │   │   ├── resultado/              # Página de resultados
│   │   │   └── login/                 # Autenticação
│   │   └── api/
│   │       ├── generate-looks/        # API principal de geração
│   │       │   ├── route.ts           # Geração padrão
│   │       │   └── remix/route.ts     # Geração remix
│   │       ├── refine-tryon/         # Refinamento de looks
│   │       ├── import-scenarios/      # Importação de cenários
│   │       └── upload-photo/         # Upload de fotos
│   ├── components/
│   │   ├── views/
│   │   │   ├── ExperimentarView.tsx   # Componente principal
│   │   │   └── DisplayView.tsx       # Visualização em display
│   │   └── ui/
│   │       ├── SmartUploadZone.tsx    # Upload inteligente
│   │       └── AvatarSelector.tsx     # Seleção de avatar
│   └── lib/
│       ├── scenarioMatcher.ts         # Matching de cenários por tags
│       ├── financials.ts             # Validação de créditos
│       ├── types.ts                  # Tipos TypeScript
│       └── firebaseAdmin.ts          # Admin Firebase
```

### 1.2 Fluxo de Dados Principal

```
[Frontend] → [API Route] → [Backend (paineladm)] → [Orchestrator] → [Gemini API]
     ↓            ↓              ↓                      ↓              ↓
  Upload      Validação    Processamento         Construção      Geração
  Foto        Créditos     Produtos              Prompt          Imagem
```

---

## 2. Rotas de API de Geração

### 2.1 `/api/generate-looks` (Geração Padrão)

**Arquivo:** `src/app/api/generate-looks/route.ts`

**Função:** Proxy principal para geração de looks

**Fluxo:**
1. **Validação de Entrada**
   - Valida `lojistaId`
   - Valida `original_photo_url` ou `personImageUrl`
   - Valida `productIds` (array não vazio)

2. **Validação de Créditos**
   - Chama `consumeGenerationCredit(lojistaId)`
   - Verifica saldo disponível
   - Decrementa créditos se permitido
   - Retorna erro 402 se créditos insuficientes

3. **Busca de Produtos (PHASE 26)**
   - Busca produtos do Firestore usando `productIds`
   - Extrai dados: `nome`, `categoria`, `preco`, `imagemUrl`, `obs`

4. **Matching de Cenários (PHASE 26)**
   - Chama `findScenarioByProductTags(products)`
   - Extrai keywords dos produtos
   - Busca cenários no Firestore que contenham tags correspondentes
   - Seleciona cenário aleatório se múltiplos matches
   - Fallback para categoria se nenhum match por tags

5. **Construção do Payload**
   ```typescript
   {
     ...body,
     personImageUrl: finalPersonImageUrl,
     original_photo_url: finalPersonImageUrl,
     productIds: body.productIds,
     lojistaId: body.lojistaId,
     customerId: body.customerId,
     sceneInstructions: body.sceneInstructions || "IMPORTANT: The scene must be during DAYTIME...",
     // PHASE 26: Dados do cenário
     scenarioImageUrl: scenarioData?.imageUrl,
     scenarioLightingPrompt: scenarioData?.lightingPrompt,
     scenarioCategory: scenarioData?.category,
     scenarioInstructions: `CRITICAL: Use the provided scenarioImageUrl as the BACKGROUND IMAGE input...`
   }
   ```

6. **Requisição ao Backend**
   - POST para `${backendUrl}/api/lojista/composicoes/generate`
   - Timeout: 180 segundos (3 minutos)
   - Tratamento de erros de rede e timeout

7. **Resposta**
   - Retorna `{ composicaoId, looks, totalCost, ... }`
   - Logs detalhados para debug

**Parâmetros de Entrada:**
- `lojistaId` (string, obrigatório)
- `original_photo_url` (string, obrigatório)
- `productIds` (string[], obrigatório)
- `customerId` (string, opcional)
- `sceneInstructions` (string, opcional)

**Parâmetros de Saída:**
- `composicaoId` (string)
- `looks` (GeneratedLook[])
- `totalCost` (number)
- `totalCostBRL` (number)

---

### 2.2 `/api/generate-looks/remix` (Geração Remix)

**Arquivo:** `src/app/api/generate-looks/remix/route.ts`

**Função:** Geração de variação do look com mudança de pose e cenário

**Diferenças da Geração Padrão:**
1. **Validação Específica**
   - Requer `original_photo_url` explicitamente
   - Aceita `products[]` array OU `productIds[]`

2. **Geração de Pose Aleatória**
   - Seleciona pose aleatória de lista pré-definida
   - Gera `randomSeed` para variação
   - Instruções específicas de remix no prompt

3. **Matching de Cenários (PHASE 26)**
   - Mesma lógica de `findScenarioByProductTags`
   - Busca produtos do Firestore se não fornecidos

4. **Flag `gerarNovoLook: true`**
   - Sempre ativada para permitir mudança de pose
   - Backend aplica regras de postura condicional

5. **Prompt Específico de Remix**
   ```typescript
   const remixPrompt = `${subjectDescription} ${randomPose} wearing ${productPrompt}...
   ⚠️ CRITICAL REMIX INSTRUCTION: This is a REMIX generation. 
   The scene MUST be DRAMATICALLY DIFFERENT from any previous generation...`
   ```

**Poses Disponíveis:**
- Walking confidently towards camera
- Leaning against wall casually
- Standing with hands in pockets
- Looking over shoulder
- Standing with one hand on hip
- Standing with arms crossed
- Walking away then turning back
- Standing with weight on one leg
- Walking with slight turn
- Standing with hands on hips

---

### 2.3 `/api/refine-tryon` (Refinamento)

**Arquivo:** `src/app/api/refine-tryon/route.ts`

**Função:** Proxy simples para refinamento de looks

**Fluxo:**
- Recebe body JSON
- Encaminha para `${backendUrl}/api/refine-tryon`
- Retorna resposta do backend

**Nota:** Esta rota é um proxy puro, sem lógica adicional.

---

## 3. Lógica de Matching de Cenários (PHASE 26)

### 3.1 Arquivo: `src/lib/scenarioMatcher.ts`

### 3.2 Função: `extractProductKeywords(product: Produto): string[]`

**Objetivo:** Extrair keywords/tags de um produto

**Fonte de Dados:**
1. **Nome do Produto** (`product.nome`)
   - Divide por espaços, vírgulas, hífens, pontos
   - Filtra palavras com mais de 2 caracteres
   - Normaliza para lowercase

2. **Categoria** (`product.categoria`)
   - Adiciona categoria completa
   - Adiciona palavras individuais da categoria

3. **Observações** (`product.obs`)
   - Divide por espaços, vírgulas, hífens, pontos
   - Filtra palavras com mais de 3 caracteres

**Retorno:** Array de keywords únicas, normalizadas, lowercase

---

### 3.3 Função: `mapProductCategoryToScenarioCategory(productCategory?: string | null): string | null`

**Objetivo:** Mapear categoria de produto para categoria de cenário

**Mapeamentos:**
- `calçados/tênis/sneaker` → `urban`
- `bota/botas` → `winter`
- `praia/biquini/maio/sunga` → `beach`
- `fitness/academia/yoga/treino` → `fitness`
- `festa/balada/gala/noite` → `party`
- `inverno/frio` → `winter`
- `social/formal/trabalho/executivo` → `social`
- `natureza/campo` → `nature`
- `urbano/streetwear` → `urban`

**Retorno:** Categoria de cenário ou `null` (fallback)

---

### 3.4 Função: `findScenarioByProductTags(products: Produto[])`

**Objetivo:** Buscar cenário no Firestore baseado em tags de produtos

**Estratégia em 3 Etapas:**

#### Etapa 1: Busca por Tags (Prioridade Máxima)
1. Extrai todas as keywords de todos os produtos
2. Remove duplicatas
3. Busca todos os cenários ativos no Firestore
4. Filtra em memória: cenários que têm pelo menos uma tag em comum
   - Match case-insensitive
   - Match parcial (contains)
5. Seleciona cenário aleatório se múltiplos matches

**Query Firestore:**
```typescript
db.collection('scenarios')
  .where('active', '==', true)
  .get()
```

**Filtro em Memória:**
```typescript
scenario.tags.some(tag => 
  uniqueKeywords.some(keyword => 
    tag.includes(keyword) || keyword.includes(tag)
  )
)
```

#### Etapa 2: Fallback por Categoria
1. Se nenhum match por tags, usa primeira categoria de produto
2. Mapeia categoria para categoria de cenário
3. Busca cenários por categoria
4. Seleciona cenário aleatório

**Query Firestore:**
```typescript
db.collection('scenarios')
  .where('active', '==', true)
  .where('category', '==', scenarioCategory)
  .get()
```

#### Etapa 3: Retorno Null
- Se nenhum cenário encontrado, retorna `null`
- Backend usa prompt genérico

**Retorno:**
```typescript
{
  imageUrl: string,
  lightingPrompt: string,
  category: string
} | null
```

---

## 4. Estrutura de Dados

### 4.1 Tipo: `Produto`

```typescript
type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  categoria?: string | null
  obs?: string
  // ... outros campos
}
```

### 4.2 Tipo: `GeneratedLook`

```typescript
type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean
}
```

### 4.3 Tipo: `LojistaData`

```typescript
type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  displayOrientation?: "horizontal" | "vertical" | null
  produtos?: Produto[]
  financials?: LojistaFinancials
  theme?: StoreTheme
  is_sandbox_mode?: boolean
}
```

### 4.4 Firestore: Collection `scenarios`

**Estrutura do Documento:**
```typescript
{
  imageUrl: string              // URL da imagem no Firebase Storage
  fileName: string              // Nome do arquivo original
  category: string              // Categoria (urban, beach, fitness, etc.)
  lightingPrompt: string         // Prompt de iluminação
  tags: string[]                // Array de tags (PHASE 26)
  active: boolean               // Se está ativo
  createdAt: Date
  updatedAt: Date
}
```

**Caminho no Storage:**
```
assets/scenarios/{category}/{fileName}
```

---

## 5. Validação de Créditos

### 5.1 Arquivo: `src/lib/financials.ts`

### 5.2 Função: `consumeGenerationCredit(lojistaId?: string)`

**Fluxo:**
1. Valida `lojistaId`
2. Busca documento do lojista no Firestore
3. Verifica modo sandbox (`is_sandbox_mode`)
4. Verifica status de faturamento (`billing_status`)
5. Calcula saldo disponível: `credits_balance + overdraft_limit`
6. Se saldo > 0:
   - Decrementa 1 crédito (se não sandbox)
   - Retorna `{ allowed: true, remainingBalance, planTier }`
7. Se saldo <= 0:
   - Retorna `{ allowed: false, status: 402, message: "Créditos insuficientes" }`

**Transação Firestore:**
- Usa `db.runTransaction()` para garantir atomicidade
- Decrementa créditos apenas se não estiver em sandbox

**Modo Sandbox:**
- Se Firebase não configurado OU `is_sandbox_mode === true`
- Permite geração sem decrementar créditos
- Retorna `remainingBalance: 999999`

---

## 6. Componentes Frontend

### 6.1 `ExperimentarView.tsx`

**Localização:** `src/components/views/ExperimentarView.tsx`

**Responsabilidades:**
- Interface de upload de foto
- Seleção de produtos
- Botões de ação (Visualizar, Refinar, Remixar)
- Exibição de catálogo
- Gerenciamento de estado de geração

**Estados Principais:**
- `isGenerating`: boolean
- `generationError`: string | null
- `selectedProducts`: Produto[]
- `userPhotoUrl`: string | null

**Funções Principais:**
- `handleVisualize()`: Chama `/api/generate-looks`
- `handleRefine()`: Chama `/api/generate-looks` (modo refine)
- `toggleProductSelection()`: Adiciona/remove produto da seleção

---

### 6.2 `ExperimentarPage.tsx`

**Localização:** `src/app/[lojistaId]/experimentar/page.tsx`

**Responsabilidades:**
- Carregamento de dados da loja
- Carregamento de catálogo de produtos
- Gerenciamento de sessão
- Navegação para página de resultados

**Fluxo de Carregamento:**
1. Busca dados da loja via `/api/lojista/perfil`
2. Busca produtos via `/api/lojista/products`
3. Carrega favoritos do cliente (se autenticado)
4. Renderiza `ExperimentarView`

---

### 6.3 `ResultadoPage.tsx`

**Localização:** `src/app/[lojistaId]/resultado/page.tsx`

**Responsabilidades:**
- Exibição de looks gerados
- Ações: Like, Dislike, Remixar, Compartilhar
- Navegação de volta para experimentar
- Gerenciamento de votos

**Funções Principais:**
- `handleRemix()`: Chama `/api/generate-looks/remix`
- `handleLike()`: Salva voto positivo
- `handleDislike()`: Salva voto negativo com motivo

---

## 7. Integração com Backend (paineladm)

### 7.1 Endpoint: `/api/lojista/composicoes/generate`

**Método:** POST

**Payload Recebido:**
```typescript
{
  personImageUrl: string
  original_photo_url: string
  productIds: string[]
  lojistaId: string
  customerId?: string
  sceneInstructions?: string
  // PHASE 26: Dados do cenário
  scenarioImageUrl?: string
  scenarioLightingPrompt?: string
  scenarioCategory?: string
  scenarioInstructions?: string
  options?: {
    quality?: "low" | "medium" | "high"
    skipWatermark?: boolean
    lookType?: "natural" | "creative"
    allProductImageUrls?: string[]
    productCategory?: string
    gerarNovoLook?: boolean
    smartContext?: string
    smartFraming?: string
    forbiddenScenarios?: string[]
    productsData?: any[]
    // PHASE 26: Dados do cenário
    scenarioImageUrl?: string
    scenarioLightingPrompt?: string
    scenarioCategory?: string
    scenarioInstructions?: string
  }
}
```

**Processamento no Backend:**
1. Recebe payload
2. Busca produtos do Firestore
3. Chama `CompositionOrchestrator.createComposition()`
4. Orchestrator inclui `scenarioImageUrl` como última imagem no array
5. Envia para Gemini Flash Image API
6. Retorna imagem gerada

**Resposta:**
```typescript
{
  success: true
  composicaoId: string
  looks: GeneratedLook[]
  totalCost: number
  totalCostBRL: number
  exchangeRate: number
  productsProcessed: number
  primaryProductId: string
  primaryProductName: string
}
```

---

## 8. Processamento no Orchestrator (Backend)

### 8.1 Arquivo: `paineladm/src/lib/ai-services/composition-orchestrator.ts`

### 8.2 Fluxo de Geração (Look Criativo)

1. **Validação**
   - Valida `personImageUrl` (deve ser HTTP)
   - Valida `allProductImageUrls` (não vazio)

2. **Construção do Array de Imagens**
   ```typescript
   const imageUrls = [
     params.personImageUrl,        // 1ª: IMAGEM_PESSOA
     ...allProductImageUrls,        // 2ª+: IMAGEM_PRODUTO_1, IMAGEM_PRODUTO_2, ...
   ];
   
   // PHASE 26: Adicionar imagem do cenário se fornecido
   if (scenarioImageUrl && scenarioImageUrl.startsWith("http")) {
     imageUrls.push(scenarioImageUrl); // Última: IMAGEM_CENARIO
   }
   ```

3. **Construção do Prompt**
   - Identity Anchor Block (sandwich method)
   - Instruções de composição
   - **PHASE 26: Instruções para usar imagem do cenário como fundo**
   - Context rules (smartContext)
   - Framing rules (smartFraming)
   - Postura rules (gerarNovoLook)
   - Product integration instructions
   - Negative prompt

4. **Chamada ao Gemini Flash Image**
   ```typescript
   await this.geminiFlashImageService.generateImage({
     prompt: creativePrompt,
     imageUrls: imageUrls,  // Array com pessoa, produtos e cenário
     negativePrompt: strongNegativePrompt,
     temperature: isRemix ? 0.75 : 0.4,
   });
   ```

5. **Processamento da Resposta**
   - Extrai imagem gerada (base64 ou URL)
   - Faz upload para Firebase Storage (se necessário)
   - Retorna URL pública

---

## 9. Instruções para Gemini (PHASE 26)

### 9.1 Quando `scenarioImageUrl` é Fornecido

**Instruções Adicionadas ao Prompt:**
```
🎬 PHASE 26: CENÁRIO DE FUNDO FORNECIDO:
CRITICAL: Use the provided scenarioImageUrl as the BACKGROUND IMAGE input for Gemini Vision API.
- This image should be the 3rd input image (after person photo and product images)
- DO NOT generate or create a new background - USE the provided scenario image as-is
- Focus ALL AI processing power on:
  1. Maintaining exact facial identity and features from the person photo
  2. Ensuring products match exactly (colors, textures, fit)
  3. Seamlessly compositing the person and products onto the provided background
- The background image is already perfect - just use it directly
- Lighting and scene context: {scenarioLightingPrompt}
```

**Objetivo:**
- Forçar Gemini a usar a imagem do cenário como input visual
- Evitar que Gemini gere novo cenário
- Focar capacidade de processamento em identidade facial e produtos

---

## 10. Fluxo Completo de Geração

### 10.1 Fluxo Padrão (Experimentar)

```
1. Usuário faz upload de foto
   ↓
2. Usuário seleciona produtos
   ↓
3. Usuário clica em "Visualizar"
   ↓
4. Frontend chama /api/generate-looks
   ↓
5. API valida créditos
   ↓
6. API busca produtos do Firestore
   ↓
7. API chama findScenarioByProductTags()
   ↓
8. scenarioMatcher extrai keywords dos produtos
   ↓
9. scenarioMatcher busca cenários no Firestore
   ↓
10. scenarioMatcher seleciona cenário aleatório
   ↓
11. API constrói payload com scenarioImageUrl
   ↓
12. API envia para backend (paineladm)
   ↓
13. Backend recebe e processa
   ↓
14. Orchestrator inclui scenarioImageUrl no array de imagens
   ↓
15. Orchestrator constrói prompt com instruções de cenário
   ↓
16. Orchestrator chama Gemini Flash Image API
   ↓
17. Gemini processa: pessoa + produtos + cenário
   ↓
18. Gemini retorna imagem gerada
   ↓
19. Backend faz upload para Firebase Storage
   ↓
20. Backend retorna URL da imagem
   ↓
21. Frontend navega para página de resultados
```

### 10.2 Fluxo Remix

```
1. Usuário está na página de resultados
   ↓
2. Usuário clica em "Remixar Look"
   ↓
3. Frontend chama /api/generate-looks/remix
   ↓
4. API seleciona pose aleatória
   ↓
5. API busca cenário por tags (mesma lógica)
   ↓
6. API envia com flag gerarNovoLook: true
   ↓
7. Backend processa com mudança de pose permitida
   ↓
8. Gemini gera nova imagem com pose diferente
   ↓
9. Frontend atualiza página de resultados
```

---

## 11. Tratamento de Erros

### 11.1 Erros de Validação
- **400 Bad Request**: Parâmetros obrigatórios faltando
- **402 Payment Required**: Créditos insuficientes
- **403 Forbidden**: Conta bloqueada

### 11.2 Erros de Rede
- **503 Service Unavailable**: Erro de conexão com backend
- **504 Gateway Timeout**: Timeout (180 segundos)

### 11.3 Erros de Processamento
- **500 Internal Server Error**: Erro no backend ou Gemini
- Logs detalhados para debug

---

## 12. Logs e Debug

### 12.1 Logs Principais

**Frontend (API Routes):**
- `[modelo-2/api/generate-looks]`: Logs de geração padrão
- `[remix]`: Logs de remix
- `[scenarioMatcher]`: Logs de matching de cenários

**Backend (Orchestrator):**
- `[Orchestrator]`: Logs de processamento
- `[GeminiFlashImage]`: Logs de chamada à API Gemini

### 12.2 Informações Logadas
- URLs de imagens (primeiros 100 caracteres)
- Contagem de produtos
- Cenário selecionado
- Tempo de processamento
- Custos
- Erros detalhados

---

## 13. Variáveis de Ambiente

### 13.1 Frontend (modelo-2)
- `NEXT_PUBLIC_BACKEND_URL`: URL do backend
- `NEXT_PUBLIC_PAINELADM_URL`: URL alternativa do backend
- `FIREBASE_PROJECT_ID`: ID do projeto Firebase
- `FIREBASE_CLIENT_EMAIL`: Email da service account
- `FIREBASE_PRIVATE_KEY`: Chave privada da service account

### 13.2 Backend (paineladm)
- `GOOGLE_CLOUD_PROJECT_ID`: ID do projeto GCP
- `GOOGLE_CLOUD_LOCATION`: Localização (us-central1)
- `FIREBASE_STORAGE_BUCKET`: Bucket do Firebase Storage

---

## 14. Melhorias Implementadas (PHASE 26)

### 14.1 Matching por Tags
- ✅ Extração de keywords de produtos
- ✅ Busca de cenários por tags (match parcial)
- ✅ Fallback para categoria
- ✅ Seleção aleatória se múltiplos matches

### 14.2 Imagem de Cenário como Input Visual
- ✅ Envio de `scenarioImageUrl` no payload
- ✅ Inclusão da imagem como última no array enviado ao Gemini
- ✅ Instruções claras para Gemini usar imagem como fundo
- ✅ Foco em identidade facial e produtos (não gerar cenário)

### 14.3 Integração Completa
- ✅ Rotas de geração padrão e remix atualizadas
- ✅ Backend recebe e processa dados do cenário
- ✅ Orchestrator inclui imagem do cenário no array
- ✅ Prompt instrui Gemini corretamente

---

## 15. Pontos de Atenção

### 15.1 Performance
- Busca de cenários em memória (pode ser lento com muitos cenários)
- Considerar índices no Firestore para tags
- Cache de cenários ativos

### 15.2 Segurança
- Validação de URLs de imagens
- Sanitização de inputs
- Rate limiting (implementar se necessário)

### 15.3 Escalabilidade
- Múltiplas queries Firestore (otimizar se necessário)
- Processamento assíncrono para grandes volumes
- Queue system para gerações

---

## 16. Próximos Passos Sugeridos

1. **Otimização de Queries**
   - Implementar índices no Firestore para tags
   - Cache de cenários ativos em memória
   - Batch queries quando possível

2. **Melhorias de Matching**
   - Peso por relevância de tags
   - Machine learning para matching inteligente
   - Histórico de matches bem-sucedidos

3. **Monitoramento**
   - Métricas de tempo de geração
   - Taxa de sucesso de matches
   - Custos por geração

4. **Testes**
   - Testes unitários para `scenarioMatcher`
   - Testes de integração para rotas de API
   - Testes E2E para fluxo completo

---

## 17. Conclusão

O sistema de geração de imagens do App Modelo-2 está bem estruturado e implementado, com:

- ✅ Arquitetura clara e modular
- ✅ Separação de responsabilidades
- ✅ Tratamento robusto de erros
- ✅ Logs detalhados para debug
- ✅ Integração completa com backend
- ✅ Matching inteligente de cenários (PHASE 26)
- ✅ Uso de imagem de cenário como input visual (PHASE 26)

A implementação atual suporta geração padrão, remix e refinamento, com validação de créditos e integração completa com o backend para processamento via Gemini Flash Image API.

---

**Documento gerado automaticamente em:** 2025-01-27  
**Última atualização:** PHASE 26

