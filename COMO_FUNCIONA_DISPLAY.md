# 📺 Como Funciona o Display da Loja

## 🎯 Conceito

O Display da Loja é uma tela **passiva** que fica na TV/monitor da loja física. Ele:
- ✅ **NÃO precisa de login** (é apenas visualização)
- ✅ Mostra QR Code para clientes escanearem
- ✅ Exibe looks gerados em tempo real
- ✅ Funciona de forma autônoma (sem interação)

---

## 🔄 Fluxo Completo

### 1. **Display na Loja (TV/Monitor)**
   - URL: `display.experimenteai.com.br/[lojistaId]` ou `app.experimenteai.com.br/[lojistaId]?display=1`
   - **Não precisa de login** ✅
   - Mostra tela com QR Code grande
   - Fica em modo "idle" (aguardando)

### 2. **Cliente Escaneia QR Code**
   - QR Code aponta para: `app.experimenteai.com.br/[lojistaId]/experimentar?connect=true&target_display=[UUID]`
   - Cliente é redirecionado para o **app no celular**
   - **App no celular PRECISA de login** (cliente cria conta/se autentica)

### 3. **Cliente Gera Look no Celular**
   - Faz upload de foto
   - Seleciona produtos
   - Clica em "Visualizar"
   - Look é gerado pela IA

### 4. **Look Aparece no Display da Loja**
   - Backend envia imagem para Firestore: `displays/{display_uuid}/activeImage`
   - Display escuta Firestore em tempo real (`onSnapshot`)
   - Quando recebe nova imagem, mostra na TV
   - Timeout de 45 segundos → volta para QR Code

---

## 🔍 Diferença: Display vs App Cliente

| Recurso | Display (TV) | App Cliente (Celular) |
|---------|--------------|----------------------|
| **Login Necessário?** | ❌ NÃO | ✅ SIM |
| **Interação** | ❌ Somente visualização | ✅ Completa (upload, selecionar produtos) |
| **URL** | `display.experimenteai.com.br/[lojistaId]` | `app.experimenteai.com.br/[lojistaId]/experimentar` |
| **Função** | Mostrar QR Code e looks | Gerar looks |

---

## 📋 Passo a Passo de Uso

### Para o Lojista (Configurar Display):

1. **No Painel do Lojista:**
   - Vá em "Display da Loja"
   - Copie o link ou baixe o QR Code

2. **Na TV/Monitor da Loja:**
   - Abra o link em um navegador
   - Deixe em tela cheia (F11)
   - Fixe a aba (pode colocar em modo kiosk)
   - Pronto! O display está ativo

### Para o Cliente:

1. **Escaneia o QR Code** no display
2. **Cria conta** (se não tiver) ou **faz login**
3. **Faz upload de foto**
4. **Seleciona produtos**
5. **Gera look**
6. **✨ MAGIA:** O look aparece automaticamente no display da loja!

---

## 🔧 Como Funciona Tecnicamente

### Display (DisplayView.tsx):
```typescript
// 1. Gera UUID único para este display
const displayUuid = localStorage.getItem("display_uuid") || crypto.randomUUID()

// 2. QR Code aponta para app com target_display
const qrUrl = `${baseUrl}/${lojistaId}/experimentar?connect=true&target_display=${displayUuid}`

// 3. Escuta Firestore em tempo real
onSnapshot(doc(db, "displays", displayUuid), (snapshot) => {
  if (snapshot.data().activeImage) {
    // Mostra imagem na TV
    setActiveImage(snapshot.data().activeImage)
    // Timeout de 45s para voltar ao QR Code
  }
})
```

### App Cliente:
```typescript
// 1. Cliente escaneia QR Code
// 2. URL tem: ?connect=true&target_display=[UUID]
// 3. Hook useStoreSession detecta e salva target_display
// 4. Quando gera look, envia para displays/{UUID}
await fetch("/api/display/update", {
  body: {
    displayUuid: targetDisplay,
    activeImage: imageUrl,
    lojistaId
  }
})
```

---

## ⚠️ Problema Identificado e Corrigido

**Problema:** O display estava redirecionando para login.

**Causa:** A verificação de login acontecia ANTES de verificar se estava em modo display.

**Solução:** Agora, quando `isDisplayMode === true`, o código:
- ✅ Pula a verificação de login
- ✅ Finaliza a inicialização imediatamente
- ✅ Renderiza DisplayView diretamente

---

## ✅ Status

**CORREÇÃO APLICADA!** O display agora funciona corretamente:
- ✅ Não pede login
- ✅ Vai direto para DisplayView
- ✅ Funciona apenas como visualizador passivo

---

**Criado em:** $(date)
