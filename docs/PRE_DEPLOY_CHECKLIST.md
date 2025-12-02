# Checklist Pré-Deploy

Use este checklist antes de fazer deploy em produção.

## ✅ 1. Verificação de Código

- [ ] Executar `npm run lint` - sem erros críticos
- [ ] Executar `npm run build` - build completa sem erros
- [ ] Verificar console do navegador - sem erros
- [ ] Testar fluxo completo localmente

## ✅ 2. Variáveis de Ambiente

- [ ] Todas as variáveis `NEXT_PUBLIC_*` configuradas no Vercel
- [ ] URLs de produção (sem localhost)
- [ ] Chaves do Firebase corretas
- [ ] Verificar arquivo `docs/VARIAVEIS_AMBIENTE.md`

## ✅ 3. Testes Manuais

- [ ] Executar checklist completo em `docs/QA_MANUAL.md`
- [ ] Testar em dispositivos móveis (iPhone e Android)
- [ ] Testar em diferentes navegadores
- [ ] Verificar responsividade

## ✅ 4. Build de Produção

### App Cliente (modelo-2)
```bash
cd apps-cliente/modelo-2
npm run build
```

### Painel Adm
```bash
cd paineladm
npm run build
```

## ✅ 5. Deploy no Vercel

- [ ] Verificar configuração do projeto no Vercel
- [ ] Verificar variáveis de ambiente no Vercel
- [ ] Fazer deploy de staging primeiro
- [ ] Testar em staging antes de produção
- [ ] Fazer deploy em produção

## ✅ 6. Pós-Deploy

- [ ] Testar URLs de produção
- [ ] Verificar logs no Vercel
- [ ] Monitorar erros no console
- [ ] Verificar performance

## 🚨 Problemas Comuns

### Build falha
- Verificar erros de TypeScript
- Verificar dependências instaladas
- Limpar cache: `rm -rf .next node_modules/.cache`

### Variáveis não funcionam
- Verificar se começam com `NEXT_PUBLIC_`
- Verificar se estão no Vercel
- Fazer novo deploy após adicionar variáveis

### CORS errors
- Verificar `ALLOWED_ORIGINS` no backend
- Verificar URLs configuradas
- Verificar headers CORS

















