# 🎯 Qual Projeto Precisa do Subdomínio?

## ✅ PROJETO CORRETO: `apps-cliente/modelo-2`

Este é o projeto que **RODA NA TV DA LOJA** e precisa do subdomínio `display.experimenteai.com.br`.

### O que este projeto faz:
- ✅ App cliente (experimentar looks)
- ✅ Display da loja (Magic Mirror)
- ✅ TV Store (looks curtidos)
- ✅ Middleware que detecta o subdomínio

### Arquivos importantes:
- `src/middleware.ts` - Detecta o subdomínio e ativa display mode
- `src/app/[lojistaId]/experimentar/page.tsx` - Página principal
- `src/components/views/DisplayView.tsx` - Tela do Magic Mirror

---

## ❌ NÃO É: `paineladm`

O **paineladm** é apenas o **painel administrativo** (dashboard).

### O que este projeto faz:
- ✅ Dashboard do lojista
- ✅ Cadastro de produtos
- ✅ Geração de QR codes
- ✅ Configurações

### Importante:
- ❌ **NÃO precisa** do subdomínio `display.experimenteai.com.br`
- ✅ **Só precisa** da variável de ambiente `NEXT_PUBLIC_DISPLAY_DOMAIN` para **gerar os links corretos**

---

## 📋 Resumo

| Projeto | Precisa do Subdomínio? | Função |
|---------|------------------------|---------|
| **apps-cliente/modelo-2** | ✅ **SIM** | App que roda na TV |
| **paineladm** | ❌ **NÃO** | Dashboard administrativo |

---

## 🚀 Próximos Passos

1. Vá para o projeto **`apps-cliente/modelo-2`** na Vercel
2. Configure o subdomínio `display.experimenteai.com.br`
3. Siga o guia `VERCEL_SUBDOMINIO_SETUP.md`

---

**Criado em:** $(date)






