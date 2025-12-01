# ⚠️ URGENTE: Configurar Variáveis do Firebase na Vercel

## 🔴 Problema Identificado

O endpoint de teste do webhook está retornando erro porque as variáveis do Firebase Admin SDK **não estão configuradas na Vercel**.

**Erro:**
```
FIREBASE_PROJECT_ID não configurada. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY
```

---

## ✅ Solução: Configurar Variáveis na Vercel

### Passo 1: Acessar Configurações da Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **apps-cliente-modelo2** (ou o nome do seu projeto)
3. Vá em **"Settings"** → **"Environment Variables"**

### Passo 2: Adicionar Variáveis do Firebase

Você precisa adicionar **3 variáveis obrigatórias**:

#### 1. FIREBASE_PROJECT_ID

**Como obter:**
1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto (ex: `paineladmexperimenteai`)
3. Vá em **"Configurações do projeto"** (ícone de engrenagem)
4. Copie o **"ID do projeto"**

**Exemplo:**
```
FIREBASE_PROJECT_ID=paineladmexperimenteai
```

**Na Vercel:**
- **Key:** `FIREBASE_PROJECT_ID`
- **Value:** `paineladmexperimenteai` (sem aspas)
- **Environments:** Marque **Production**, **Preview** e **Development**

---

#### 2. FIREBASE_CLIENT_EMAIL

**Como obter:**
1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá em **"Configurações do projeto"** → **"Contas de serviço"**
4. Clique em **"Gerar nova chave privada"**
5. Uma janela abrirá com um JSON
6. Copie o valor do campo **"client_email"**

**Exemplo:**
```
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@paineladmexperimenteai.iam.gserviceaccount.com
```

**Na Vercel:**
- **Key:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `firebase-adminsdk-xxxxx@paineladmexperimenteai.iam.gserviceaccount.com` (sem aspas)
- **Environments:** Marque **Production**, **Preview** e **Development**

---

#### 3. FIREBASE_PRIVATE_KEY

**⚠️ CRÍTICO:** Esta é a variável mais importante e precisa de atenção especial!

**Como obter:**
1. No mesmo JSON que você baixou no passo anterior
2. Copie o valor do campo **"private_key"**
3. **IMPORTANTE:** O formato na Vercel é diferente do JSON!

**⚠️ PROBLEMA COMUM:** O erro `DECODER routines::unsupported` acontece quando a chave está formatada incorretamente.

**Solução - Formato Correto na Vercel:**

**Opção 1: Com Aspas e `\\n` (Duas Barras) - RECOMENDADO**

Na Vercel, cole a chave **EXATAMENTE** assim (com aspas e `\\n` duplo):

```
"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
```

**Passos:**
1. Abra o JSON baixado do Firebase
2. Copie o valor do campo `"private_key"` (que está entre aspas no JSON)
3. **Remova as aspas** do início e fim
4. **Substitua todas as quebras de linha reais** por `\\n` (duas barras invertidas + n)
5. **Adicione aspas duplas** no início e fim novamente
6. Cole na Vercel

**Exemplo prático:**

**No JSON do Firebase:**
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

**Na Vercel (Value):**
```
"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
```

**Opção 2: Sem Aspas, Apenas `\\n` (Duas Barras)**

Se a Opção 1 não funcionar, tente sem aspas:

```
-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n
```

**Na Vercel:**
- **Key:** `FIREBASE_PRIVATE_KEY`
- **Value:** Use uma das opções acima
- **⚠️ ATENÇÃO:** 
  - Use `\\n` (duas barras invertidas + n), NÃO `\n` (uma barra)
  - Se usar aspas, coloque no início e fim
  - NÃO use quebras de linha reais
- **Environments:** Marque **Production**, **Preview** e **Development**

**🔍 Como verificar se está correto:**

A chave deve ter:
- ✅ `-----BEGIN PRIVATE KEY-----` no início
- ✅ `-----END PRIVATE KEY-----` no final
- ✅ `\\n` (duas barras) entre as linhas, não quebras de linha reais
- ✅ Tudo em uma única linha (ou com `\\n` entre as partes)

---

### Passo 3: Verificar Variáveis Adicionais (Opcional mas Recomendado)

#### NEXT_PUBLIC_APP_URL

**Verifique se está configurada:**
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://app2.experimenteai.com.br`
- **Environments:** Marque **Production**, **Preview** e **Development**

#### NEXT_PUBLIC_CLIENT_APP_URL

**Verifique se está configurada:**
- **Key:** `NEXT_PUBLIC_CLIENT_APP_URL`
- **Value:** `https://app2.experimenteai.com.br`
- **Environments:** Marque **Production**, **Preview** e **Development**

---

## ✅ Após Configurar

1. **Salve** todas as variáveis
2. **Faça um novo deploy** (ou aguarde o próximo deploy automático)
3. **Teste novamente:** `https://app2.experimenteai.com.br/api/webhooks/mercadopago/test`

**Resultado esperado:**
```json
{
  "status": "ok",
  "message": "Webhook está acessível e funcionando",
  "lojas": [...]
}
```

---

## 🐛 Troubleshooting

### Erro: "Invalid private key" ou "DECODER routines::unsupported"

**Causa:** O `FIREBASE_PRIVATE_KEY` não está formatado corretamente.

**Solução:**
1. **Use `\\n` (duas barras invertidas + n)**, não `\n` (uma barra)
2. Se usar aspas, coloque no início e fim: `"-----BEGIN...\\n...-----END PRIVATE KEY-----\\n"`
3. **NÃO use quebras de linha reais** - tudo deve estar em uma linha com `\\n`
4. Copie novamente do JSON baixado do Firebase e substitua quebras de linha por `\\n`

**Formato correto:**
```
"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
```

**Formato incorreto (causa erro):**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```
(com quebras de linha reais)

### Erro: "FIREBASE_PROJECT_ID não configurada"

**Causa:** A variável não foi salva ou não está no ambiente correto.

**Solução:**
1. Verifique se marcou **Production**, **Preview** e **Development**
2. Verifique se clicou em **"Save"**
3. Faça um novo deploy

### Erro persiste após configurar

**Solução:**
1. Aguarde 1-2 minutos (cache da Vercel)
2. Faça um deploy manual
3. Verifique os logs da Vercel para ver erros específicos

---

## 📋 Checklist Final

- [ ] `FIREBASE_PROJECT_ID` configurada
- [ ] `FIREBASE_CLIENT_EMAIL` configurada
- [ ] `FIREBASE_PRIVATE_KEY` configurada (com aspas e `\n` literal)
- [ ] Todas as variáveis marcadas para **Production**, **Preview** e **Development**
- [ ] Clicou em **"Save"**
- [ ] Novo deploy realizado
- [ ] Teste `/api/webhooks/mercadopago/test` retorna `status: "ok"`

---

## 🎯 Próximos Passos

Após configurar as variáveis:

1. ✅ Teste o endpoint: `https://app2.experimenteai.com.br/api/webhooks/mercadopago/test`
2. ✅ Configure o webhook no Mercado Pago: `https://app2.experimenteai.com.br/api/webhooks/mercadopago`
3. ✅ Faça um pagamento de teste
4. ✅ Verifique os logs da Vercel

