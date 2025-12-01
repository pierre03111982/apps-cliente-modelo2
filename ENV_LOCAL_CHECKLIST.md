# ✅ Checklist: Variáveis no .env.local

## 🔴 FALTANDO (Críticas para PWA e OG Image)

### 1. `NEXT_PUBLIC_APP_URL` ⚠️ CRÍTICA
```env
NEXT_PUBLIC_APP_URL=http://localhost:3005
```
**Para desenvolvimento local:**
- Use `http://localhost:3005` (mesma porta do app cliente)
- **OU** use a URL de produção: `https://app2.experimenteai.com.br`

**Onde é usado:**
- OG Image (`/api/og-image/{lojistaId}`)
- Manifest PWA (`/{lojistaId}/manifest.json`)
- Meta tags Open Graph
- URLs absolutas

### 2. `NEXT_PUBLIC_FACEBOOK_APP_ID` (Opcional mas Recomendada)
```env
NEXT_PUBLIC_FACEBOOK_APP_ID=1155635880092697
```
**Remove warning no Facebook Debugger**

## ✅ JÁ EXISTEM (Corretas)

### Firebase Admin SDK
- ✅ `FIREBASE_PROJECT_ID=paineladmexperimenteai`
- ✅ `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...`
- ✅ `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### URLs do App Cliente
- ✅ `NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3005`
- ✅ `NEXT_PUBLIC_CLIENT_APP_DEV_URL=http://localhost:3005`

### Firebase Client SDK
- ✅ Todas as variáveis `NEXT_PUBLIC_FIREBASE_*` estão presentes

## 📝 Adicionar ao .env.local

Adicione estas linhas no final do arquivo:

```env
# ================================
# PWA & SEO (PHASE 25)
# ================================

# URL base para OG Image, Manifest PWA e URLs absolutas
# Para desenvolvimento local, use a mesma porta do app cliente
NEXT_PUBLIC_APP_URL=http://localhost:3005

# Facebook App ID (opcional - remove warning no Facebook Debugger)
NEXT_PUBLIC_FACEBOOK_APP_ID=1155635880092697
```

## 🎯 Diferença entre as URLs

| Variável | Uso | Valor Local | Valor Produção |
|----------|-----|------------|----------------|
| `NEXT_PUBLIC_APP_URL` | PWA, OG Image, Manifest | `http://localhost:3005` | `https://app2.experimenteai.com.br` |
| `NEXT_PUBLIC_CLIENT_APP_URL` | Webhooks, Links | `http://localhost:3005` | `https://app2.experimenteai.com.br` |

**Nota:** Em desenvolvimento local, ambas podem ter o mesmo valor (`http://localhost:3005`).

