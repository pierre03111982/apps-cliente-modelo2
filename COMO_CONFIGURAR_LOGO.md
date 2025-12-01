# 🖼️ Como Configurar a Logo da Loja

## ❌ Problema Identificado

A OG Image está mostrando o ícone padrão "EAI" porque a **logo da loja não está configurada** no Firestore.

## ✅ Solução: Configurar Logo no Painel Admin

### Passo 1: Acessar o Painel Admin

1. Acesse: https://paineladm.experimenteai.com.br
2. Faça login com suas credenciais
3. Selecione a loja que deseja configurar

### Passo 2: Ir em Configurações

1. No menu lateral, clique em **"Configurações"** ou **"Perfil"**
2. Procure pela seção de **"Logo"** ou **"Ícone da Loja"**

### Passo 3: Fazer Upload da Logo

1. Clique no botão **"Upload Logo"** ou **"Escolher arquivo"**
2. Selecione uma imagem da logo da loja
3. **Recomendações:**
   - Formato: PNG ou JPG
   - Tamanho: Mínimo 512x512 pixels (ideal para PWA)
   - Fundo: Preferencialmente transparente (PNG) ou branco
   - Tamanho do arquivo: Máximo 2MB

### Passo 4: Salvar

1. Após o upload, clique em **"Salvar"** ou **"Atualizar"**
2. Aguarde a confirmação de sucesso

## 🔍 Verificar se a Logo foi Salva

### Opção 1: Usar a Rota de Debug (Após Deploy)

Após o deploy, acesse:
```
https://app2.experimenteai.com.br/api/debug-logo/{lojistaId}
```

**Exemplo:**
```
https://app2.experimenteai.com.br/api/debug-logo/hOQL4BaVY92787EjKVMt
```

**O que você deve ver:**
```json
{
  "success": true,
  "lojistaId": "hOQL4BaVY92787EjKVMt",
  "nome": "THAIS MODA",
  "dataSource": "perfil/dados",
  "logo": {
    "logoUrl": "https://firebasestorage.googleapis.com/...",
    "appIconUrl": null,
    "logoToUse": "https://firebasestorage.googleapis.com/...",
    "logoImageUrl": "https://app2.experimenteai.com.br/api/proxy-image?url=...",
    "accessible": true,
    "error": null
  },
  ...
}
```

**Se `logo.logoUrl` for `null`:**
- ❌ A logo não foi salva corretamente
- ⚠️ Tente fazer upload novamente

**Se `logo.accessible` for `false`:**
- ❌ A logo foi salva mas não é acessível
- ⚠️ Verifique se a URL está correta

### Opção 2: Verificar no Firestore

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Vá em **Firestore Database**
3. Navegue até: `lojas/{lojistaId}/perfil/dados`
4. Verifique se existe o campo:
   - `logoUrl` (com uma URL do Firebase Storage)
   - OU `app_icon_url` (com uma URL do Firebase Storage)

**Exemplo de URL válida:**
```
https://firebasestorage.googleapis.com/v0/b/[PROJECT_ID].appspot.com/o/[PATH]?alt=media&token=[TOKEN]
```

## 🧪 Testar a OG Image

Após configurar a logo:

1. **Aguardar deploy** (se necessário)
2. **Acessar a URL da OG Image:**
   ```
   https://app2.experimenteai.com.br/api/og-image/{lojistaId}
   ```
3. **Verificar se a logo aparece:**
   - ✅ Se aparecer a logo da loja: **Sucesso!**
   - ❌ Se ainda aparecer o ícone padrão "EAI": Verifique os logs

## 🔄 Limpar Cache do Facebook/WhatsApp

Após configurar a logo e verificar que a OG Image está correta:

1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL: `https://app2.experimenteai.com.br/{lojistaId}/login`
3. Clique em **"Buscar novamente"** (Scrape Again)
4. Verifique se a preview mostra a logo correta

## 📝 Campos no Firestore

A logo pode ser salva em dois campos (prioridade):

1. **`logoUrl`** (prioridade 1) - Usado para Open Graph e fallback PWA
2. **`app_icon_url`** (prioridade 2) - Específico para PWA, usado como fallback

**Caminho no Firestore:**
```
lojas/{lojistaId}/perfil/dados
```

## ⚠️ Problemas Comuns

### Problema 1: Logo não aparece após upload
**Solução:**
- Verifique se o upload foi concluído com sucesso
- Verifique se a URL foi salva no Firestore
- Aguarde alguns minutos e teste novamente

### Problema 2: Logo aparece no painel mas não na OG Image
**Solução:**
- Verifique se a URL da logo é acessível publicamente
- Teste a URL diretamente no navegador
- Verifique os logs no Vercel

### Problema 3: Logo muito grande ou pequena
**Solução:**
- Use uma imagem de pelo menos 512x512 pixels
- Preferencialmente quadrada (1:1)
- Formato PNG com fundo transparente

## 🎯 Checklist

- [ ] Logo foi enviada no painel admin
- [ ] Confirmação de sucesso no upload
- [ ] Verificado no Firestore que `logoUrl` ou `app_icon_url` existe
- [ ] Testado a URL da OG Image diretamente
- [ ] Logo aparece na OG Image gerada
- [ ] Cache do Facebook foi limpo
- [ ] Testado compartilhamento no WhatsApp

## 📞 Suporte

Se após seguir todos os passos a logo ainda não aparecer:

1. Verifique os logs no Vercel
2. Use a rota de debug: `/api/debug-logo/{lojistaId}`
3. Verifique se a URL da logo é acessível publicamente

