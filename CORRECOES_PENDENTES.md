# 🔧 Correções Pendentes

## ✅ Correções Já Feitas

1. ✅ **StoreConnectionIndicator.tsx** - Removido import `X` não utilizado do lucide-react
2. ✅ **StoreConnectionIndicator.tsx** - Corrigido `variant="outline"` para `variant="ghost"`

## 📋 Correções Sugeridas

### 1. **Import Não Utilizado**
- [ ] **ExperimentarView.tsx** linha 25: `CLOSET_BACKGROUND_IMAGE` está importado mas não é usado (há um comentário indicando isso)

### 2. **Console.logs** (315 encontrados)
- [ ] Remover logs de debug em produção
- [ ] Manter apenas logs importantes de erro
- [ ] Considerar usar um sistema de logging condicional baseado em `NODE_ENV`

### 3. **Verificações TypeScript**
- [ ] Verificar se há mais tipos `any` que podem ser tipados
- [ ] Verificar se há props opcionais que deveriam ser obrigatórias

### 4. **Performance**
- [ ] Verificar uso de `useMemo` e `useCallback` onde necessário
- [ ] Verificar dependências de `useEffect`

### 5. **Acessibilidade**
- [ ] Verificar se todos os botões têm `aria-label` quando necessário
- [ ] Verificar navegação por teclado

---

## 🎯 Prioridades

### Alta Prioridade (Antes de Commit)
1. Remover import não utilizado do `CLOSET_BACKGROUND_IMAGE` em ExperimentarView.tsx
2. Verificar se não há outros imports não utilizados

### Média Prioridade
1. Limpar console.logs de debug (manter apenas logs de erro importantes)

### Baixa Prioridade (Pode ser feito depois)
1. Melhorias de performance
2. Melhorias de acessibilidade

---

Deseja que eu aplique essas correções agora?













