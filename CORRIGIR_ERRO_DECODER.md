# 🔴 CORREÇÃO URGENTE: Erro "DECODER routines::unsupported"

## ⚠️ Problema

O erro `DECODER routines::unsupported` indica que a `FIREBASE_PRIVATE_KEY` está formatada incorretamente na Vercel.

**Erro completo:**
```
"error":"2 UNKNOWN: Getting metadata from plugin failed with error: error:1E08010C:DECODER routines::unsupported"
```

---

## ✅ Solução Rápida

### Passo 1: Obter a Chave Correta

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá em **"Configurações do projeto"** → **"Contas de serviço"**
4. Clique em **"Gerar nova chave privada"** (se ainda não tiver)
5. Baixe o JSON

### Passo 2: Formatar a Chave para a Vercel

**No JSON do Firebase, a chave está assim:**
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

**Na Vercel, você precisa colar assim (com `\\n` duplo):**
```
"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
```

### Passo 3: Atualizar na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **apps-cliente-modelo2**
3. Vá em **"Settings"** → **"Environment Variables"**
4. Encontre `FIREBASE_PRIVATE_KEY`
5. **Delete** o valor atual
6. **Cole** o novo valor formatado (com `\\n` duplo e aspas)
7. Clique em **"Save"**
8. Faça um novo deploy

---

## 🔍 Verificação

**Formato CORRETO:**
- ✅ Começa com `"-----BEGIN PRIVATE KEY-----\\n`
- ✅ Termina com `\\n-----END PRIVATE KEY-----\\n"`
- ✅ Usa `\\n` (duas barras invertidas + n)
- ✅ Está entre aspas duplas
- ✅ Tudo em uma única linha (sem quebras de linha reais)

**Formato INCORRETO (causa erro):**
- ❌ Quebras de linha reais (Enter)
- ❌ Usa `\n` (uma barra) ao invés de `\\n` (duas barras)
- ❌ Sem aspas ou com aspas simples
- ❌ Com espaços extras

---

## 🧪 Teste Após Corrigir

Após atualizar e fazer deploy, teste:

```
https://app2.experimenteai.com.br/api/webhooks/mercadopago/test
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "message": "Webhook está acessível e funcionando",
  "lojas": [...]
}
```

---

## 💡 Dica: Script de Conversão

Se você tem a chave no formato JSON, pode usar este script Node.js para converter:

```javascript
const json = require('./firebase-key.json');
const privateKey = json.private_key;

// Converter quebras de linha reais para \\n
const formatted = privateKey
  .replace(/\r\n/g, '\\n')  // Windows
  .replace(/\n/g, '\\n')     // Unix
  .replace(/\r/g, '\\n');   // Mac

console.log('"'+formatted+'"');
```

Cole o resultado na Vercel.

---

## 🆘 Ainda com Erro?

Se o erro persistir:

1. **Gere uma nova chave privada** no Firebase
2. **Use o formato exato** mostrado acima
3. **Aguarde 2-3 minutos** após salvar (cache da Vercel)
4. **Faça um deploy manual** para forçar atualização
5. **Verifique os logs da Vercel** para ver erros específicos

