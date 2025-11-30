# 🔧 Variáveis de Ambiente Necessárias na Vercel

## ✅ OBRIGATÓRIAS (Para PWA e OG Image funcionarem)

### 1. Firebase Admin SDK
```
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
**⚠️ IMPORTANTE:** O `FIREBASE_PRIVATE_KEY` deve estar entre aspas e com `\n` literal (não quebras de linha reais).

### 2. URL Base da Aplicação
```
NEXT_PUBLIC_APP_URL=https://app2.experimenteai.com.br
```
**OU** (se usar domínio da Vercel):
```
NEXT_PUBLIC_VERCEL_URL=apps-cliente-modelo02.vercel.app
```

## 🔵 OPCIONAIS (Mas Recomendadas)

### 3. Facebook App ID (Remove warning no Facebook Debugger)
```
NEXT_PUBLIC_FACEBOOK_APP_ID=seu-facebook-app-id
```
**Como obter:**
1. Acesse: https://developers.facebook.com/apps/
2. Crie um app ou use um existente
3. Copie o "App ID"

### 4. Firebase Storage Bucket (Se usar uploads)
```
FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-project.appspot.com
```

## 📋 Checklist de Configuração na Vercel

1. ✅ Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. ✅ Adicione TODAS as variáveis OBRIGATÓRIAS
3. ✅ Para `FIREBASE_PRIVATE_KEY`, copie EXATAMENTE como está no Firebase Console (com `\n`)
4. ✅ Selecione TODOS os ambientes (Production, Preview, Development)
5. ✅ Clique em "Save"
6. ✅ Faça um novo deploy (ou aguarde o próximo)

## 🧪 Como Testar se Está Funcionando

### Teste 0: Endpoint de Diagnóstico (NOVO!)
1. Acesse: `https://app2.experimenteai.com.br/api/test-og-image/{lojistaId}`
2. Este endpoint retorna um JSON completo com:
   - ✅ Status de todas as variáveis de ambiente
   - ✅ Status da conexão com Firestore
   - ✅ Dados da loja encontrados
   - ✅ Status de acessibilidade das rotas OG Image e Manifest
   - ✅ Recomendações de correção

### Teste 1: OG Image
1. Acesse: `https://app2.experimenteai.com.br/api/og-image/{lojistaId}`
2. Deve retornar uma imagem PNG (não erro 500)
3. Se retornar erro, verifique os logs da Vercel

### Teste 2: Manifest
1. Acesse: `https://app2.experimenteai.com.br/{lojistaId}/manifest.json`
2. Deve retornar JSON com `icons` contendo URLs válidas
3. Verifique se `icons[0].src` aponta para uma URL acessível

### Teste 3: Facebook Debugger
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole: `https://app2.experimenteai.com.br/{lojistaId}/login`
3. Clique em "Scrape Again"
4. A imagem deve aparecer no preview
5. Se não aparecer, verifique o campo `og:image` na tabela de propriedades

## 🐛 Problemas Comuns

### Erro: "FIREBASE_PROJECT_ID não configurado"
- ✅ Verifique se a variável está definida na Vercel
- ✅ Verifique se está selecionada para o ambiente correto

### Erro: "Invalid private key"
- ✅ Verifique se `FIREBASE_PRIVATE_KEY` está entre aspas
- ✅ Verifique se tem `\n` literal (não quebras de linha reais)

### OG Image não aparece
- ✅ Verifique se `NEXT_PUBLIC_APP_URL` está configurada
- ✅ Teste a rota `/api/og-image/{lojistaId}` diretamente
- ✅ Verifique os logs da Vercel para erros

### Ícone PWA genérico
- ✅ Verifique se `app_icon_url` está salvo no Firestore
- ✅ Verifique se o manifest está retornando a URL correta
- ✅ Desinstale e reinstale o app (cache do navegador)

