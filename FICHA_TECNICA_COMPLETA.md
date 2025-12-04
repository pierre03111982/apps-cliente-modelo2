# 📋 FICHA TÉCNICA COMPLETA - APP CLIENTE MODELO-2

**Versão:** 0.1.0  
**Data de Compilação:** 27 de Novembro de 2025  
**Tecnologias:** Next.js 14, React 18, TypeScript, Firebase, Tailwind CSS

---

## 📑 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Fluxo de Navegação](#4-fluxo-de-navegação)
5. [Lógica de Geração de Imagens](#5-lógica-de-geração-de-imagens)
6. [Sistema de Prompts](#6-sistema-de-prompts)
7. [Funcionalidades dos Botões](#7-funcionalidades-dos-botões)
8. [APIs e Endpoints](#8-apis-e-endpoints)
9. [Sistema de Créditos](#9-sistema-de-créditos)
10. [Modo Privado (Avatares)](#10-modo-privado-avatares)
11. [Sistema de Favoritos](#11-sistema-de-favoritos)
12. [Display/TV Mode](#12-displaytv-mode)
13. [Integrações de Vendas](#13-integrações-de-vendas)
14. [Variáveis de Ambiente](#14-variáveis-de-ambiente)
15. [Configurações e Dependências](#15-configurações-e-dependências)

---

## 1. VISÃO GERAL

O **App Cliente Modelo-2** é uma aplicação web Next.js que permite aos clientes experimentarem roupas e acessórios virtualmente usando Inteligência Artificial. O app oferece três telas principais:

- **Tela 1 (Login/Onboarding):** Autenticação e consentimento de privacidade
- **Tela 2 (Experimentar):** Upload de foto, seleção de produtos e geração de looks
- **Tela 3 (Resultado):** Visualização de looks gerados, ações de like/dislike, remix e compartilhamento
- **Tela Display/TV:** Modo de exibição pública para lojas físicas

### Tecnologias Principais

- **Framework:** Next.js 14.2.33 (App Router)
- **UI:** React 18.3.1, Tailwind CSS 3.4.13
- **Backend:** Firebase (Firestore, Storage), Firebase Admin SDK
- **IA:** Google Vertex AI Try-On, Gemini 2.5 Flash Image, Stability.ai
- **Pagamentos:** Mercado Pago SDK
- **Outros:** QR Code, React Hot Toast, Lucide Icons

---

## 2. ARQUITETURA DO SISTEMA

### 2.1. Fluxo de Dados

```
Cliente (Browser)
    ↓
Next.js App (Frontend)
    ↓
API Routes (/api/*)
    ↓
Backend (Painel Adm) → Firebase → Serviços de IA
```

### 2.2. Componentes Principais

- **`ExperimentarView`:** Tela principal de experimentação (Tela 2)
- **`ResultadoPage`:** Tela de resultados e ações (Tela 3)
- **`DisplayView`:** Modo de exibição pública (TV/Display)
- **`AvatarSelector`:** Seletor de avatares para modo privado
- **`SmartUploadZone`:** Zona de upload inteligente de fotos
- **`DislikeFeedbackModal`:** Modal de feedback para dislikes
- **`PrivacyOnboardingModal`:** Modal de onboarding de privacidade

---

## 3. ESTRUTURA DE PASTAS

```
src/
├── app/
│   ├── [lojistaId]/          # Rotas dinâmicas por lojista
│   │   ├── experimentar/      # Tela 2: Experimentar
│   │   ├── resultado/         # Tela 3: Resultado
│   │   ├── login/             # Tela 1: Login
│   │   ├── tv/                # Display/TV Mode
│   │   └── layout.tsx         # Layout com metadata dinâmica
│   ├── api/                   # API Routes
│   │   ├── generate-looks/    # Geração de looks
│   │   │   ├── route.ts       # Geração principal
│   │   │   └── remix/         # Remix de looks
│   │   ├── actions/           # Ações (like/dislike)
│   │   ├── cliente/           # APIs de cliente
│   │   ├── sales/             # APIs de vendas
│   │   └── upload-photo/      # Upload de fotos
│   └── globals.css            # Estilos globais
├── components/
│   ├── views/                 # Views principais
│   ├── modals/                # Modais
│   └── ui/                    # Componentes UI
├── lib/
│   ├── financials.ts         # Sistema de créditos
│   ├── firebase.ts            # Firebase Client
│   ├── firebaseAdmin.ts       # Firebase Admin
│   ├── types.ts               # TypeScript types
│   └── logger.ts              # Sistema de logs
└── hooks/
    └── useStoreSession.ts     # Hook de sessão de loja
```

---

## 4. FLUXO DE NAVEGAÇÃO

### 4.1. Fluxo Principal

```
1. Login/Onboarding
   ↓
2. Experimentar (Upload foto + Selecionar produtos)
   ↓
3. Geração de Look (IA)
   ↓
4. Resultado (Visualizar + Ações)
   ↓
5. (Opcional) Remix ou Voltar para Experimentar
```

### 4.2. Estados e Persistência

- **LocalStorage:** Dados do cliente (`cliente_{lojistaId}`)
- **SessionStorage:** Foto original (`original_photo_{lojistaId}`), produtos selecionados (`products_{lojistaId}`)
- **Firestore:** Composições geradas, favoritos, ações (like/dislike)

---

## 5. LÓGICA DE GERAÇÃO DE IMAGENS

### 5.1. Pipeline de Geração

O sistema utiliza um **orquestrador de composições** (`CompositionOrchestrator`) que gerencia o fluxo completo:

#### 5.1.1. Look Natural (Try-On)

**Para Roupas:**
1. **Vertex AI Try-On:** Aplica a roupa na foto da pessoa
   - Input: `personImageUrl` + `productImageUrl`
   - Output: Imagem com roupa aplicada
   - Custo: ~$0.04 por imagem

**Para Acessórios:**
1. **Stability.ai:** Gera composição com acessório
   - Input: `personImageUrl` + `productImageUrl` + prompt
   - Output: Imagem com acessório aplicado

#### 5.1.2. Look Criativo (Multi-Produto)

**Gemini 2.5 Flash Image:**
1. Recebe múltiplas imagens:
   - `IMAGEM_PESSOA` (primeira imagem)
   - `IMAGEM_PRODUTO_1`, `IMAGEM_PRODUTO_2`, etc.
2. Aplica prompt detalhado (ver Seção 6)
3. Gera imagem final com todos os produtos integrados

### 5.2. Fluxo de Dados na Geração

```typescript
// Frontend (ExperimentarView)
handleVisualize() 
  → uploadPersonPhoto(userPhoto) 
  → /api/generate-looks (POST)
    → consumeGenerationCredit(lojistaId)
    → /api/lojista/composicoes/generate (Backend)
      → CompositionOrchestrator.createComposition()
        → Vertex Try-On OU Gemini Flash Image
        → Watermark Service
      → Retorna composicaoId + looks[]
```

### 5.3. Remix de Looks

**API:** `/api/generate-looks/remix`

**Lógica:**
1. Recebe `original_photo_url` (foto original do cliente)
2. Recebe `products[]` (array de produtos selecionados)
3. **Scenario/Pose Shuffler:**
   - Seleciona aleatoriamente um cenário (ex: "Luxury Hotel Lobby")
   - Seleciona aleatoriamente uma pose (ex: "Walking confidently")
4. Constrói prompt: `"[Subject] [Pose] wearing [Product1] AND [Product2], in [Scenario]"`
5. Chama o orquestrador com a foto original + novo prompt

**Cenários Disponíveis:**
- Luxury Hotel Lobby
- Modern City Street with Bokeh
- Minimalist Concrete Studio
- Golden Hour Park
- Rooftop Bar at Night
- Cozy Living Room

**Poses Disponíveis:**
- Walking confidently
- Leaning against wall
- Sitting on modern chair
- Hands in pockets casual stance
- Looking over shoulder

### 5.4. Smart Framing (Phase 11)

O sistema detecta automaticamente a categoria do produto e ajusta o enquadramento:

- **Calçados:** Força corpo inteiro com pés visíveis
- **Acessórios/Óculos/Joias:** Close-up no rosto
- **Roupas (padrão):** Shot médio com foco no tecido

---

## 6. SISTEMA DE PROMPTS

### 6.1. Prompt Base (Look Criativo)

O prompt principal está localizado em `composition-orchestrator.ts` e segue uma estrutura hierárquica de prioridades:

#### Prioridade 1: Identidade da Pessoa (Inalterável)
- Preservação 100% do rosto e corpo
- Proporções físicas mantidas
- Semelhança reconhecível

#### Prioridade 2: Fidelidade dos Produtos
- Integração física e natural
- Fidelidade de cor, estilo, forma

#### Prioridade 3: Cenário e Iluminação
- Adaptação contextual
- Regra Mestra de Enquadramento (close-up vs. corpo inteiro)

#### Prioridade 4: Qualidade Fotográfica
- Estilo: Fotografia de moda/lifestyle
- Resolução: 8K
- Iluminação: Natural ou estúdio

### 6.2. Modificadores por Categoria (Phase 11)

**Calçados:**
```
", full body shot, wide angle, camera low angle, feet fully visible, 
standing on floor, showing complete shoes, ground visible"
```

**Acessórios/Óculos/Joias:**
```
", close-up portrait, focus on face and neck, high detail accessory, 
shallow depth of field"
```

**Roupas (Padrão):**
```
", medium-full shot, detailed fabric texture, professional fashion 
photography, perfect fit"
```

### 6.3. Negative Prompt (Phase 11)

```
"(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, 
wrong anatomy, extra limb, missing limb, floating limbs, 
(mutated hands and fingers:1.4), disconnected limbs, mutation, 
mutated, ugly, blurry, amputation, (feet cut off:1.5), 
(head cut off:1.5), text, watermark, bad composition, duplicate"
```

### 6.4. Prompt de Remix

```
"[Subject] [RandomPose] wearing [Product1] AND [Product2], 
in [RandomScenario]. Photorealistic, 8k, highly detailed."
```

---

## 7. FUNCIONALIDADES DOS BOTÕES

### 7.1. Tela 2 (Experimentar)

#### Botão "Gerar Look" / "Visualizar"
- **Função:** `handleVisualize()`
- **Ações:**
  1. Valida foto do usuário (upload ou avatar)
  2. Valida produtos selecionados (mínimo 1)
  3. Faz upload da foto (se File object)
  4. Salva `original_photo_url` no sessionStorage
  5. Chama `/api/generate-looks` com:
     - `personImageUrl`
     - `productIds[]`
     - `lojistaId`, `customerId`
     - `options` (quality, skipWatermark)
  6. Redireciona para `/resultado` com dados da composição

#### Botão "Adicionar Acessório"
- **Função:** `toggleProductSelection(produto)`
- **Ações:**
  1. Adiciona produto ao array `selectedProducts`
  2. Atualiza UI com produto selecionado
  3. Permite múltiplos produtos (máximo 3)

#### Botão "Trocar Foto"
- **Função:** `handleChangePhoto()`
- **Ações:**
  1. Abre input de arquivo
  2. Permite novo upload
  3. Substitui foto atual

#### Botão "Remover Foto"
- **Função:** `handleRemovePhoto()`
- **Ações:**
  1. Limpa `userPhoto` e `userPhotoUrl`
  2. Remove do sessionStorage
  3. Reseta estado

#### Botão "Favoritos"
- **Função:** Abre modal de favoritos
- **Ações:**
  1. Carrega favoritos do Firestore
  2. Exibe grid de looks favoritados
  3. Permite selecionar favorito para reutilizar

#### Botão "Compartilhar App"
- **Função:** `handleShareApp()`
- **Ações:**
  1. Gera link de compartilhamento
  2. Copia para clipboard
  3. Mostra toast de sucesso

#### Botão "Enviar para Display"
- **Função:** `onDisplayConnect(lojistaId, displayUuid)`
- **Ações:**
  1. Conecta com display via Firestore
  2. Envia imagem atual para exibição
  3. Atualiza estado de conexão

### 7.2. Tela 3 (Resultado)

#### Botão "Curtir" (Thumbs Up)
- **Função:** `handleLike()`
- **Ações:**
  1. Verifica se já votou
  2. Chama `/api/actions` (POST) com `type: "like"`
  3. Salva no Firestore (`actions` collection)
  4. Atualiza estado local
  5. Mostra toast de sucesso

#### Botão "Não Curtir" (Thumbs Down)
- **Função:** `handleDislike()`
- **Ações:**
  1. Abre modal de feedback (`DislikeFeedbackModal`)
  2. Usuário seleciona motivo:
     - `garment_style` (estilo da roupa)
     - `fit_issue` (problema de caimento)
     - `ai_distortion` (distorção da IA)
     - `other` (outro)
  3. Chama `/api/actions` (POST) com `type: "dislike"` + `reason`
  4. Salva no Firestore
  5. Fecha modal

#### Botão "Remixar Look"
- **Função:** `handleRegenerate()`
- **Ações:**
  1. Recupera `original_photo_url` do sessionStorage
  2. Recupera `selectedProducts` do sessionStorage
  3. Chama `/api/generate-looks/remix` (POST) com:
     - `original_photo_url`
     - `products[]` (array completo)
     - `lojistaId`, `customerId`
  4. Mostra loading com frases rotativas
  5. Atualiza looks com novo resultado

#### Botão "Favoritar" (Heart)
- **Função:** `handleFavorite()`
- **Ações:**
  1. Verifica se já está favoritado
  2. Chama `/api/cliente/favoritos` (POST/DELETE)
  3. Salva/remove do Firestore (`favoritos` collection)
  4. Atualiza estado local

#### Botão "Compartilhar"
- **Função:** `handleShare()`
- **Ações:**
  1. Gera link de compartilhamento da imagem
  2. Copia para clipboard
  3. Mostra toast de sucesso

#### Botão "Adicionar ao Carrinho"
- **Função:** `handleAddToCart()`
- **Ações:**
  1. Abre modal de carrinho (`ShoppingCartModal`)
  2. Permite selecionar tamanho, quantidade
  3. Adiciona ao carrinho (localStorage)
  4. Calcula preço com descontos

#### Botão "Comprar Agora"
- **Função:** `handleCheckout()`
- **Ações:**
  1. Valida carrinho
  2. Calcula frete (`/api/sales/calculate-shipping`)
  3. Cria pagamento (`/api/sales/create-payment`)
  4. Redireciona para checkout (Mercado Pago ou WhatsApp)

#### Botão "Voltar"
- **Função:** `router.push('/experimentar')`
- **Ações:**
  1. Retorna para Tela 2
  2. Mantém foto original no sessionStorage
  3. Limpa produtos selecionados

#### Botão "Home"
- **Função:** `router.push('/experimentar')`
- **Ações:**
  1. Retorna para Tela 2
  2. Reseta estado

### 7.3. Display/TV Mode

#### Botão "Atualizar QR Code"
- **Função:** Gera novo UUID para display
- **Ações:**
  1. Gera UUID único
  2. Atualiza QR Code
  3. Salva no Firestore

#### Botão "Conectar Display"
- **Função:** Conecta cliente com display
- **Ações:**
  1. Escaneia QR Code
  2. Conecta via Firestore
  3. Envia imagem para display

---

## 8. APIs E ENDPOINTS

### 8.1. Geração de Looks

#### `POST /api/generate-looks`

**Request:**
```json
{
  "personImageUrl": "https://...",
  "productIds": ["prod1", "prod2"],
  "lojistaId": "lojista123",
  "customerId": "cliente456",
  "scenePrompts": ["optional prompt"],
  "options": {
    "quality": "high",
    "skipWatermark": false
  }
}
```

**Response:**
```json
{
  "composicaoId": "comp_123",
  "looks": [
    {
      "id": "look1",
      "imagemUrl": "https://...",
      "titulo": "Look Gerado"
    }
  ]
}
```

**Validações:**
- Valida créditos (`consumeGenerationCredit`)
- Valida `personImageUrl`
- Valida `productIds` (mínimo 1)
- Timeout: 120 segundos

#### `POST /api/generate-looks/remix`

**Request:**
```json
{
  "original_photo_url": "https://...",
  "products": [
    {
      "id": "prod1",
      "nome": "Produto 1",
      "descricao": "Descrição",
      "categoria": "Roupas",
      "imagemUrl": "https://..."
    }
  ],
  "lojistaId": "lojista123",
  "customerId": "cliente456",
  "options": {
    "quality": "high"
  }
}
```

**Response:**
```json
{
  "composicaoId": "comp_123",
  "looks": [...],
  "remixInfo": {
    "scenario": "Luxury Hotel Lobby",
    "pose": "Walking confidently",
    "prompt": "..."
  }
}
```

### 8.2. Ações (Like/Dislike)

#### `POST /api/actions`

**Request:**
```json
{
  "lojistaId": "lojista123",
  "customerId": "cliente456",
  "compositionId": "comp_123",
  "productId": "prod1",
  "type": "like" | "dislike",
  "reason": "fit_issue" // opcional, apenas para dislike
}
```

**Response:**
```json
{
  "success": true,
  "actionId": "action_123"
}
```

#### `GET /api/actions/check-vote`

**Query Params:**
- `compositionId`
- `customerId`
- `lojistaId`

**Response:**
```json
{
  "voted": true,
  "votedType": "like" | "dislike"
}
```

### 8.3. Cliente

#### `POST /api/cliente/login`

**Request:**
```json
{
  "phoneNumber": "+5511999999999",
  "lojistaId": "lojista123"
}
```

**Response:**
```json
{
  "clienteId": "cliente456",
  "sessionToken": "token123"
}
```

#### `POST /api/cliente/register`

**Request:**
```json
{
  "phoneNumber": "+5511999999999",
  "lojistaId": "lojista123",
  "privacyMode": "public" | "private",
  "marketingConsent": true
}
```

#### `GET /api/cliente/check-session`

**Query Params:**
- `lojistaId`
- `customerId`

**Response:**
```json
{
  "valid": true,
  "cliente": {...}
}
```

### 8.4. Favoritos

#### `GET /api/cliente/favoritos`

**Query Params:**
- `lojistaId`
- `customerId`

**Response:**
```json
{
  "favoritos": [
    {
      "id": "fav1",
      "imagemUrl": "https://...",
      "produtoNome": "Produto",
      "createdAt": "..."
    }
  ]
}
```

#### `POST /api/cliente/favoritos`

**Request:**
```json
{
  "lojistaId": "lojista123",
  "customerId": "cliente456",
  "compositionId": "comp_123",
  "imagemUrl": "https://...",
  "produtoNome": "Produto"
}
```

#### `DELETE /api/cliente/favoritos`

**Query Params:**
- `favoritoId`
- `lojistaId`
- `customerId`

### 8.5. Upload de Foto

#### `POST /api/upload-photo`

**Request:** `FormData` com `file` (File object)

**Response:**
```json
{
  "imageUrl": "https://storage.googleapis.com/...",
  "fileName": "photo_123.jpg"
}
```

### 8.6. Vendas

#### `POST /api/sales/calculate-shipping`

**Request:**
```json
{
  "lojistaId": "lojista123",
  "destinationZip": "01310-100",
  "items": [
    {
      "id": "prod1",
      "quantity": 1,
      "dimensions": {...}
    }
  ]
}
```

**Response:**
```json
{
  "shippingOptions": [
    {
      "name": "PAC",
      "price": 15.50,
      "estimatedDays": 5
    }
  ]
}
```

#### `POST /api/sales/create-payment`

**Request:**
```json
{
  "lojistaId": "lojista123",
  "customerId": "cliente456",
  "cartItems": [...],
  "shippingOption": {...},
  "destinationZip": "01310-100"
}
```

**Response:**
```json
{
  "paymentId": "payment_123",
  "checkoutUrl": "https://mercadopago.com/..."
}
```

### 8.7. Display

#### `POST /api/display/update`

**Request:**
```json
{
  "lojistaId": "lojista123",
  "displayUuid": "uuid-123",
  "imagemUrl": "https://...",
  "customerId": "cliente456"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 9. SISTEMA DE CRÉDITOS

### 9.1. Validação de Créditos

**Função:** `consumeGenerationCredit(lojistaId)`

**Lógica:**
1. Verifica se Firebase Admin está configurado
2. Se não estiver, permite em modo sandbox (créditos ilimitados)
3. Busca dados financeiros do lojista no Firestore
4. Verifica:
   - `billing_status` (não pode ser "frozen")
   - `credits_balance + overdraft_limit > 0`
5. Se permitido, decrementa 1 crédito (transação atômica)
6. Retorna status e saldo restante

**Retorno:**
```typescript
{
  allowed: true,
  sandbox?: boolean,
  remainingBalance: number,
  planTier: "micro" | "growth" | "enterprise"
} | {
  allowed: false,
  status: 402 | 403,
  message: string
}
```

### 9.2. Modo Sandbox

- Ativado quando Firebase Admin não está configurado
- Ativado quando `is_sandbox_mode: true` no Firestore
- Créditos ilimitados (999999)
- Não decrementa créditos

---

## 10. MODO PRIVADO (AVATARES)

### 10.1. AvatarSelector Component

**Localização:** `src/components/ui/AvatarSelector.tsx`

**Categorias:**
- **Masculino:** A.png, E.png
- **Feminino:** B.png, F.png
- **Meninos:** C.png, G.png
- **Meninas:** D.png, H.png

**Funcionalidade:**
1. Navegação por categorias (setas esquerda/direita)
2. Seleção de avatar (click)
3. Conversão de imagem para `File` object:
   ```typescript
   const response = await fetch(imagePath)
   const blob = await response.blob()
   const file = new File([blob], imageName, { type: blob.type })
   ```
4. Callback `onSelect(file)` para `ExperimentarView`

### 10.2. Integração com ExperimentarView

- Exibido quando `privacyMode === "private"`
- Avatar selecionado é tratado como `userPhoto` (File object)
- Upload via `uploadPersonPhoto()` igual a foto real
- Salvo como `original_photo_url` no sessionStorage

---

## 11. SISTEMA DE FAVORITOS

### 11.1. Estrutura de Dados

**Collection:** `favoritos` (subcollection de `lojas/{lojistaId}`)

**Documento:**
```typescript
{
  id: string,
  customerId: string,
  compositionId: string,
  imagemUrl: string,
  produtoNome: string,
  produtoPreco?: number,
  createdAt: Timestamp,
  produtos?: Produto[] // Array de produtos do look
}
```

### 11.2. Funcionalidades

- **Adicionar:** Botão "Favoritar" na Tela 3
- **Listar:** Modal de favoritos na Tela 2
- **Reutilizar:** Selecionar favorito carrega foto e produtos
- **Remover:** Botão de remover no modal

### 11.3. Fluxo de Reutilização

1. Usuário abre modal de favoritos
2. Seleciona um favorito
3. Sistema carrega:
   - `imagemUrl` → `userPhotoUrl`
   - `produtos[]` → `selectedProducts`
4. Salva `imagemUrl` como `original_photo_url`
5. Permite gerar novo look ou remix

---

## 12. DISPLAY/TV MODE

### 12.1. Funcionalidade

Modo de exibição pública para lojas físicas, permitindo que clientes enviem seus looks para uma TV/Display na loja.

### 12.2. Componente DisplayView

**Localização:** `src/components/views/DisplayView.tsx`

**Estados:**
- **Idle:** Exibe QR Code e frases criativas rotativas
- **Active:** Exibe imagem recebida do cliente

### 12.3. Fluxo de Conexão

1. **Display gera UUID único:**
   ```typescript
   const displayUuid = crypto.randomUUID()
   ```

2. **Display cria documento no Firestore:**
   ```
   displays/{displayUuid}
   {
     lojistaId: string,
     status: "waiting" | "active",
     imagemUrl: string | null,
     updatedAt: Timestamp
   }
   ```

3. **Cliente escaneia QR Code:**
   - QR Code contém `displayUuid` e `lojistaId`

4. **Cliente envia imagem:**
   - Chama `/api/display/update`
   - Atualiza documento `displays/{displayUuid}`

5. **Display escuta mudanças:**
   ```typescript
   onSnapshot(doc(db, "displays", displayUuid), (snapshot) => {
     const data = snapshot.data()
     if (data?.imagemUrl) {
       setActiveImage(data.imagemUrl)
       setViewMode("active")
     }
   })
   ```

### 12.4. Timeout

- Display volta para modo idle após 120 segundos sem atualização
- Limpa imagem ativa

### 12.5. Pré-carregamento

- Sistema pré-carrega imagens em cache
- Timeout de 5 segundos para pré-carregamento
- Troca mais rápida entre imagens

---

## 13. INTEGRAÇÕES DE VENDAS

### 13.1. Mercado Pago

**Configuração:**
- `mercadopago_public_key`
- `mercadopago_access_token`

**Fluxo:**
1. Cliente adiciona produtos ao carrinho
2. Calcula frete (`/api/sales/calculate-shipping`)
3. Cria pagamento (`/api/sales/create-payment`)
4. Redireciona para checkout do Mercado Pago
5. Webhook (`/api/webhooks/mercadopago`) processa resultado

### 13.2. Melhor Envio

**Configuração:**
- `melhor_envio_token`

**Cálculo de Frete:**
- Busca CEP de origem da loja
- Calcula frete para CEP de destino
- Retorna opções (PAC, SEDEX, etc.)

### 13.3. WhatsApp Manual

**Fallback:**
- Se não houver integração de pagamento
- Gera link do WhatsApp com produtos
- Formato: `https://wa.me/{numero}?text={mensagem}`

---

## 14. VARIÁVEIS DE AMBIENTE

### 14.1. Frontend (.env.local)

```bash
# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# App URL
NEXT_PUBLIC_APP_URL=https://experimente.ai
NEXT_PUBLIC_VERCEL_URL=...
```

### 14.2. Backend (Painel Adm)

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# APIs de IA
GOOGLE_CLOUD_PROJECT_ID=...
STABILITY_API_KEY=...
```

---

## 15. CONFIGURAÇÕES E DEPENDÊNCIAS

### 15.1. package.json

**Dependências Principais:**
```json
{
  "next": "^14.2.33",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "firebase": "^12.6.0",
  "firebase-admin": "^13.0.0",
  "mercadopago": "^2.0.0",
  "qrcode.react": "^4.2.0",
  "react-hot-toast": "^2.6.0",
  "lucide-react": "^0.553.0",
  "tailwindcss": "^3.4.13"
}
```

### 15.2. next.config.mjs

**Configurações Importantes:**
- **Image Optimization:**
  ```javascript
  images: {
    remotePatterns: [
      { hostname: "storage.googleapis.com" },
      { hostname: "firebasestorage.googleapis.com" }
    ]
  }
  ```

- **Console Removal (Production):**
  ```javascript
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  }
  ```

### 15.3. Tailwind CSS

**Configuração:**
- `darkMode: 'class'`
- Cores customizadas para tema neon
- Classes utilitárias para bordas neon (`.neon-border`)

### 15.4. TypeScript

**Configuração:**
- Strict mode habilitado
- Types em `src/lib/types.ts`
- Interfaces para todas as entidades principais

---

## 16. SISTEMA DE LOGS

### 16.1. Logger Utility

**Localização:** `src/lib/logger.ts`

**Função:** `logError(message, error, context)`

**Uso:**
```typescript
import { logError } from "@/lib/logger"

try {
  // código
} catch (error) {
  await logError(
    "Payment API - Create Payment",
    error instanceof Error ? error : new Error(String(error)),
    { storeId: lojistaId, errorType: "PaymentFailed" }
  )
}
```

**Collection:** `system_logs` (Firestore)

**Estrutura:**
```typescript
{
  level: "error" | "warn" | "info" | "critical",
  message: string,
  error?: {
    name: string,
    message: string,
    stack?: string
  },
  context?: Record<string, any>,
  storeId?: string,
  userId?: string,
  timestamp: string,
  environment: "development" | "production",
  createdAt: Timestamp
}
```

---

## 17. SEGURANÇA E PRIVACIDADE

### 17.1. Privacidade do Cliente

- **Modo Público:** Foto real do cliente
- **Modo Privado:** Avatar selecionado
- Consentimento via `PrivacyOnboardingModal`
- Dados salvos em `localStorage` (`cliente_{lojistaId}`)

### 17.2. Validação de Sessão

- Verificação de `clienteId` em todas as APIs
- Validação de `lojistaId` em todas as requisições
- Timeout de sessão (não implementado, mas recomendado)

### 17.3. Upload de Fotos

- Validação de tipo de arquivo (imagem)
- Validação de tamanho (recomendado: max 10MB)
- Upload para Firebase Storage com path único
- URLs públicas temporárias

---

## 18. PERFORMANCE E OTIMIZAÇÕES

### 18.1. Image Optimization

- Next.js Image component com otimização automática
- Lazy loading de imagens
- Pré-carregamento de imagens no Display mode

### 18.2. Caching

- SessionStorage para dados temporários
- LocalStorage para dados do cliente
- Firestore cache para dados da loja

### 18.3. Code Splitting

- Next.js App Router com code splitting automático
- Lazy loading de componentes pesados

---

## 19. TRATAMENTO DE ERROS

### 19.1. Erros de Geração

- Timeout de 120 segundos
- Mensagens amigáveis ao usuário
- Logging detalhado no backend
- Retry automático (não implementado, mas recomendado)

### 19.2. Erros de API

- Validação de entrada
- Mensagens de erro específicas
- Fallback para modo sandbox quando Firebase não configurado

### 19.3. Erros de Upload

- Validação de arquivo antes do upload
- Feedback visual de progresso
- Tratamento de erros de rede

---

## 20. TESTES E DEPLOYMENT

### 20.1. Desenvolvimento Local

```bash
npm run dev
# Roda em http://localhost:3005
```

### 20.2. Build de Produção

```bash
npm run build
npm start
```

### 20.3. Deployment (Vercel)

- Configuração automática via `vercel.json`
- Variáveis de ambiente no painel da Vercel
- Deploy automático via Git push

---

## 21. PRÓXIMAS MELHORIAS (ROADMAP)

### 21.1. Funcionalidades Planejadas

- [ ] Sistema de retry automático para geração
- [ ] Cache de looks gerados
- [ ] Compartilhamento em redes sociais nativo
- [ ] Histórico de looks gerados
- [ ] Comparação lado a lado de looks
- [ ] Filtros avançados de produtos
- [ ] Sistema de recomendações baseado em IA

### 21.2. Otimizações Técnicas

- [ ] Implementar Service Worker para cache offline
- [ ] Otimizar bundle size
- [ ] Implementar lazy loading mais agressivo
- [ ] Adicionar métricas de performance (Web Vitals)

---

## 22. CONTATO E SUPORTE

**Documentação Técnica:** Este arquivo  
**Repositório:** GitHub (privado)  
**Versão Atual:** 0.1.0  
**Última Atualização:** 27 de Novembro de 2025

---

**FIM DA FICHA TÉCNICA**










