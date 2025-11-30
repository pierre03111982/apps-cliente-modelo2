# 🔧 Configuração das Duas Variáveis de URL

## 📋 Resumo Rápido

Você tem **DUAS variáveis diferentes** na Vercel:

1. **`NEXT_PUBLIC_APP_URL`** - Para PWA, OG Image, Manifest (URLs absolutas)
2. **`NEXT_PUBLIC_CLIENT_APP_URL`** - Para webhooks, redirecionamentos, links internos

## ✅ Configuração Correta

### 1. `NEXT_PUBLIC_APP_URL` (PWA & SEO)
```
NEXT_PUBLIC_APP_URL=https://app2.experimenteal.com.br
```

**Onde é usado:**
- ✅ Geração de OG Image (`/api/og-image/{lojistaId}`)
- ✅ Manifest PWA (`/{lojistaId}/manifest.json`)
- ✅ Meta tags Open Graph
- ✅ URLs absolutas para imagens do Firebase Storage

**⚠️ CRÍTICO:** Esta deve ser a URL onde o **app cliente** está hospedado.

### 2. `NEXT_PUBLIC_CLIENT_APP_URL` (Webhooks & Links)
```
NEXT_PUBLIC_CLIENT_APP_URL=https://app2.experimenteal.com.br
```

**Onde é usado:**
- ✅ Webhooks de pagamento (`/api/sales/create-payment`)
- ✅ Redirecionamentos após ações
- ✅ Links de compartilhamento
- ✅ URLs de callback

**⚠️ IMPORTANTE:** Geralmente é a mesma URL do app cliente, mas pode ser diferente se houver múltiplos ambientes.

## 🎯 Configuração Recomendada

### Para Produção:
```
NEXT_PUBLIC_APP_URL=https://app2.experimenteal.com.br
NEXT_PUBLIC_CLIENT_APP_URL=https://app2.experimenteal.com.br
```

**Ambas apontam para o mesmo domínio** (app cliente em produção).

### Se Tiver Ambientes Diferentes:
```
# Produção
NEXT_PUBLIC_APP_URL=https://app2.experimenteal.com.br
NEXT_PUBLIC_CLIENT_APP_URL=https://app2.experimenteal.com.br

# Desenvolvimento (opcional)
NEXT_PUBLIC_CLIENT_APP_DEV_URL=http://localhost:3002
```

## ❌ Problema Atual

Na sua configuração atual:
- ❌ `NEXT_PUBLIC_APP_URL` = `https://www.experimenteai.com.br` (ERRADO - esse é o painel admin)
- ✅ `NEXT_PUBLIC_CLIENT_APP_URL` = `https://app2.experimenteal.com.br` (CORRETO)

## ✅ Correção Necessária

**Altere na Vercel:**
```
NEXT_PUBLIC_APP_URL=https://app2.experimenteal.com.br
```

**Mantenha:**
```
NEXT_PUBLIC_CLIENT_APP_URL=https://app2.experimenteal.com.br
```

## 🧪 Como Verificar

Após corrigir, teste:
1. **OG Image:** `https://app2.experimenteal.com.br/api/og-image/{lojistaId}`
2. **Manifest:** `https://app2.experimenteal.com.br/{lojistaId}/manifest.json`
3. **Diagnóstico:** `https://app2.experimenteal.com.br/api/test-og-image/{lojistaId}`

O endpoint de diagnóstico mostrará se ambas as variáveis estão corretas.

