# ✅ Configurar Variável no Painel Adm

## 🎯 Resposta: SIM, é necessário!

O paineladm precisa saber qual é a URL do Modelo 1 para mostrar o link correto na página "Aplicativo Cliente".

## 📍 Onde Adicionar

### **1. No Vercel do Painel Adm (Produção)** 🔴 OBRIGATÓRIO

1. Acesse o projeto **"paineladm"** no Vercel
2. Vá em **"Settings"** → **"Environment Variables"**
3. Adicione:

```
Nome: NEXT_PUBLIC_MODELO1_URL
Valor: https://apps-clientes-modelos.vercel.app
Ambiente: Production
```

4. Clique em **"Save"**
5. Faça um **redeploy** do paineladm

### **2. No .env.local do Painel Adm (Desenvolvimento Local)** 🟡 OPCIONAL

Se você quiser testar localmente:

1. Abra o arquivo `.env.local` do paineladm
2. Adicione esta linha:

```env
NEXT_PUBLIC_MODELO1_URL=http://localhost:3004
```

**OU** se você quiser apontar para a versão em produção:

```env
NEXT_PUBLIC_MODELO1_URL=https://apps-clientes-modelos.vercel.app
```

---

## 🔍 Como Funciona

O paineladm usa essa variável na página "Aplicativo Cliente":

- Se o lojista selecionou **"Modelo 1"** nas configurações
- O paineladm busca `NEXT_PUBLIC_MODELO1_URL`
- E mostra o link correto do Modelo 1

---

## ✅ Checklist

- [ ] Variável `NEXT_PUBLIC_MODELO1_URL` adicionada no Vercel do paineladm
- [ ] Redeploy do paineladm feito
- [ ] No paineladm → Configurações, selecionar "Modelo 1"
- [ ] Verificar se o link aparece na página "Aplicativo Cliente"

---

## 🎯 Resumo

**SIM**, você precisa adicionar `NEXT_PUBLIC_MODELO1_URL` no paineladm (Vercel) para que o link do Modelo 1 apareça corretamente!

---

**Adicione a variável no Vercel do paineladm e faça um redeploy!** 🚀

