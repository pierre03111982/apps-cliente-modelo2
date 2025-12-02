# 🔧 Correção: Localização do salesConfig no Firestore

## 🔴 Problema Identificado

O `salesConfig` estava sendo salvo em um local diferente de onde estava sendo buscado:

**Onde era salvo (Painel Admin):**
- `lojas/{lojistaId}/perfil/dados` → campo `salesConfig`

**Onde era buscado (App Cliente):**
- `lojas/{lojistaId}` → campo `salesConfig` (não encontrava)
- `lojistas/{lojistaId}` → campo `salesConfig` (coleção errada)

---

## ✅ Correções Realizadas

### 1. Webhook do Mercado Pago (`/api/webhooks/mercadopago/route.ts`)

**Antes:**
```typescript
const lojistaData = lojaDoc.data()
const salesConfig = lojistaData?.salesConfig || lojistaData?.sales_config
```

**Depois:**
```typescript
// Buscar em dois lugares:
// 1. Diretamente no documento: lojas/{lojistaId}
// 2. No subdocumento: lojas/{lojistaId}/perfil/dados
let lojistaData = lojaDoc.data()
let salesConfig = lojistaData?.salesConfig || lojistaData?.sales_config

// Se não encontrou, buscar em perfil/dados
if (!salesConfig) {
  const perfilDoc = await lojaDoc.ref.collection("perfil").doc("dados").get()
  if (perfilDoc.exists) {
    const perfilData = perfilDoc.data()
    salesConfig = perfilData?.salesConfig || perfilData?.sales_config
  }
}
```

### 2. Rota de Teste (`/api/webhooks/mercadopago/test/route.ts`)

**Antes:**
```typescript
const data = doc.data()
const salesConfig = data?.salesConfig || data?.sales_config
```

**Depois:**
```typescript
let salesConfig = data?.salesConfig || data?.sales_config

// Se não encontrou, buscar em perfil/dados
if (!salesConfig) {
  const perfilDoc = await doc.ref.collection("perfil").doc("dados").get()
  if (perfilDoc.exists) {
    const perfilData = perfilDoc.data()
    salesConfig = perfilData?.salesConfig || perfilData?.sales_config
  }
}
```

### 3. API de Criação de Pagamento (`/api/sales/create-payment/route.ts`)

**Antes:**
```typescript
const lojistaRef = db.collection("lojistas").doc(lojistaId) // ❌ Coleção errada
const lojistaDoc = await lojistaRef.get()
```

**Depois:**
```typescript
const lojaRef = db.collection("lojas").doc(lojistaId) // ✅ Coleção correta
const lojaDoc = await lojaRef.get()

// Buscar também em perfil/dados
if (!salesConfig) {
  const perfilDoc = await lojaRef.collection("perfil").doc("dados").get()
  // ...
}
```

### 4. API de Cálculo de Frete (`/api/sales/calculate-shipping/route.ts`)

**Antes:**
```typescript
const lojistaRef = db.collection("lojistas").doc(lojistaId) // ❌ Coleção errada
```

**Depois:**
```typescript
const lojaRef = db.collection("lojas").doc(lojistaId) // ✅ Coleção correta
// Buscar também em perfil/dados
```

---

## 🧪 Como Testar

### Teste 1: Verificar se encontra as credenciais

Acesse:
```
https://app2.experimenteai.com.br/api/webhooks/mercadopago/test
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "lojas": [
    {
      "lojistaId": "...",
      "temMercadoPago": true,  // ✅ Deve ser true agora
      "paymentGateway": "mercadopago",
      "salesConfigLocation": "lojas/{id}/perfil/dados"
    }
  ]
}
```

### Teste 2: Fazer um pagamento de teste

1. Acesse a aplicação cliente
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Selecione Mercado Pago
5. Complete o pagamento com cartão de teste

**O que verificar:**
- ✅ O pagamento deve ser processado
- ✅ O webhook deve receber a notificação
- ✅ O pedido deve ser atualizado no Firestore

---

## 📋 Estrutura Correta no Firestore

```
lojas/
  {lojistaId}/
    perfil/
      dados/
        salesConfig: {
          enabled: true,
          payment_gateway: "mercadopago",
          integrations: {
            mercadopago_public_key: "...",
            mercadopago_access_token: "..."
          }
        }
```

---

## ✅ Status

- [x] Webhook corrigido para buscar em `perfil/dados`
- [x] Rota de teste corrigida
- [x] API de criação de pagamento corrigida
- [x] API de cálculo de frete corrigida
- [x] Todas as APIs agora buscam em `lojas` (não `lojistas`)

---

## 🎯 Próximos Passos

1. ✅ Fazer deploy das correções
2. ✅ Testar o endpoint `/api/webhooks/mercadopago/test`
3. ✅ Verificar se `temMercadoPago: true` aparece
4. ✅ Fazer um pagamento de teste
5. ✅ Verificar se o webhook recebe a notificação





