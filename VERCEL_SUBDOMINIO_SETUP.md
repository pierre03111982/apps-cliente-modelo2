# 🚀 Guia: Configurar Subdomínio de Display na Vercel

## ⚠️ IMPORTANTE: Qual Projeto?

### ✅ PROJETO CORRETO: `apps-cliente/modelo-2`
Este é o projeto que precisa do subdomínio `display.experimenteai.com.br`

### ❌ NÃO É O PROJETO: `paineladm`
O paineladm apenas gera os links, mas não precisa do subdomínio. Ele só precisa da variável de ambiente para saber qual URL gerar.

---

## Objetivo
Configurar o subdomínio `display.experimenteai.com.br` para o projeto `apps-cliente/modelo-2` na Vercel.

---

## 📋 Pré-requisitos

1. ✅ Projeto `apps-cliente/modelo-2` já deployado na Vercel
2. ✅ Domínio principal `experimenteai.com.br` configurado e funcionando
3. ✅ Acesso à Vercel com permissões de administrador do projeto

---

## 🔧 Passo 1: Adicionar Subdomínio na Vercel

### 1.1 Acessar o Projeto
1. Vá para [vercel.com](https://vercel.com) e faça login
2. Encontre o projeto `apps-cliente/modelo-2` (ou o nome que você deu)
3. Clique no projeto para abrir o dashboard

### 1.2 Configurar Domínio
1. No menu lateral, clique em **Settings** (Configurações)
2. Clique na aba **Domains** (Domínios)
3. Você verá os domínios já configurados

### 1.3 Adicionar Subdomínio
1. Clique no botão **Add** ou **Add Domain**
2. Digite o subdomínio: `display.experimenteai.com.br`
3. Clique em **Add** ou **Continue**

### 1.4 Configurar DNS
A Vercel vai mostrar as instruções de DNS. Você precisa adicionar um registro CNAME no seu provedor de DNS:

#### Opção A: Se usar DNS da Vercel
- A Vercel configura automaticamente ✅

#### Opção B: Se usar DNS externo (GoDaddy, Cloudflare, etc.)
Adicione este registro CNAME:
```
Tipo: CNAME
Nome: display
Valor: cname.vercel-dns.com
TTL: 3600 (ou automático)
```

**OU** se a Vercel fornecer um valor específico, use aquele.

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Acessar Variáveis de Ambiente
1. No dashboard do projeto, vá em **Settings** → **Environment Variables**

### 2.2 Adicionar Variáveis
Adicione as seguintes variáveis de ambiente:

```bash
# Subdomínio de Display (Fase 11)
NEXT_PUBLIC_DISPLAY_DOMAIN=display.experimenteai.com.br

# Domínio Principal do App
NEXT_PUBLIC_APP_DOMAIN=app2.experimenteai.com.br

# Protocolo (geralmente https)
NEXT_PUBLIC_DISPLAY_PROTOCOL=https
```

**Importante:**
- Selecione **Production**, **Preview** e **Development** para todas as variáveis
- Clique em **Save** após cada variável

---

## 🔄 Passo 3: Fazer Redeploy

Após adicionar o subdomínio e as variáveis:

1. Vá para a aba **Deployments**
2. Encontre o último deployment
3. Clique nos **3 pontinhos** (...) → **Redeploy**
4. Ou faça um push para o repositório para trigger automático

---

## ✅ Passo 4: Verificar Configuração

### 4.1 Testar o Subdomínio
Após alguns minutos (propagação DNS), teste:

```
https://display.experimenteai.com.br/[lojistaId]
```

Deve redirecionar automaticamente para:
```
https://display.experimenteai.com.br/[lojistaId]/experimentar?display=1
```

### 4.2 Verificar Middleware
O middleware deve:
- ✅ Detectar o subdomínio `display.experimenteai.com.br`
- ✅ Adicionar `?display=1` automaticamente
- ✅ Renderizar a `DisplayView` (tela de Magic Mirror)

---

## 🐛 Troubleshooting

### Problema: Subdomínio não carrega
**Solução:**
1. Verifique se o DNS foi propagado (pode levar até 48h, geralmente 5-30min)
2. Use [whatsmydns.net](https://www.whatsmydns.net) para verificar propagação
3. Verifique se o CNAME está correto

### Problema: Erro 404 ou página não encontrada
**Solução:**
1. Verifique se o projeto está deployado corretamente
2. Verifique as variáveis de ambiente
3. Veja os logs de deploy na Vercel

### Problema: Middleware não funciona
**Solução:**
1. Verifique se `NEXT_PUBLIC_DISPLAY_DOMAIN` está configurada
2. Veja os logs do middleware no console da Vercel
3. Teste localmente primeiro

### Problema: SSL não funciona
**Solução:**
- A Vercel configura SSL automaticamente
- Aguarde alguns minutos após adicionar o domínio
- Verifique na aba **Domains** se o SSL está ativo (ícone de cadeado)

---

## 📝 Checklist Final

- [ ] Subdomínio `display.experimenteai.com.br` adicionado na Vercel
- [ ] DNS CNAME configurado no provedor DNS
- [ ] Variável `NEXT_PUBLIC_DISPLAY_DOMAIN` configurada
- [ ] Variável `NEXT_PUBLIC_APP_DOMAIN` configurada
- [ ] Variável `NEXT_PUBLIC_DISPLAY_PROTOCOL` configurada
- [ ] Projeto redeployado
- [ ] Subdomínio testado e funcionando
- [ ] SSL ativo (cadeado verde no navegador)

---

## 🎯 Próximos Passos

Após configurar o subdomínio:

1. **Testar QR Code:** Gere um QR Code apontando para o subdomínio
2. **Testar Display:** Acesse `display.experimenteai.com.br/[lojistaId]` em um dispositivo
3. **Verificar Logs:** Monitore os logs na Vercel para garantir que está funcionando

---

## 📚 Referências

- [Vercel: Adding and Configuring Domains](https://vercel.com/docs/concepts/projects/domains)
- [Next.js: Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- Documentação: `Fase 11 - Infraestrutura Display.md`

---

**Criado em:** $(date)
**Projeto:** apps-cliente/modelo-2
**Fase:** 11 - Infraestrutura Display

