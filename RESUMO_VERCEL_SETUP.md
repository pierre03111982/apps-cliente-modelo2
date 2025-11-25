# ⚡ Resumo Rápido: Configurar Subdomínio na Vercel

## ⚠️ ATENÇÃO: Qual Projeto?

### ✅ PROJETO CORRETO: `apps-cliente/modelo-2`
Este é o app que roda na TV da loja e precisa do subdomínio.

### ❌ NÃO É: `paineladm`
O paineladm é apenas o dashboard administrativo.

---

## 🎯 Objetivo
Configurar `display.experimenteai.com.br` para o projeto **`apps-cliente/modelo-2`** na Vercel

---

## 📝 Passos Rápidos

### 1️⃣ Adicionar Subdomínio
```
Vercel Dashboard → Seu Projeto → Settings → Domains → Add
Subdomínio: display.experimenteai.com.br
```

### 2️⃣ Configurar DNS
No seu provedor DNS (GoDaddy, Cloudflare, etc.):
```
Tipo: CNAME
Nome: display
Valor: cname.vercel-dns.com (ou o que a Vercel indicar)
```

### 3️⃣ Adicionar Variáveis de Ambiente
```
Vercel Dashboard → Settings → Environment Variables

Adicionar:
- NEXT_PUBLIC_DISPLAY_DOMAIN = display.experimenteai.com.br
- NEXT_PUBLIC_APP_DOMAIN = app2.experimenteai.com.br
- NEXT_PUBLIC_DISPLAY_PROTOCOL = https
```

### 4️⃣ Redeploy
```
Deployments → Redeploy (ou fazer push no git)
```

### 5️⃣ Testar
Aguardar 5-30min (propagação DNS) e testar:
```
https://display.experimenteai.com.br/[lojistaId]
```

---

## ✅ Checklist
- [ ] Subdomínio adicionado
- [ ] DNS configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Redeploy feito
- [ ] Testado e funcionando

---

**📚 Guia completo:** Veja `VERCEL_SUBDOMINIO_SETUP.md` para detalhes completos.

