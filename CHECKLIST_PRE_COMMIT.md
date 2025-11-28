# ✅ Checklist Pré-Commit

## 🔍 Verificações Necessárias

### 1. **Console.logs** (315 encontrados)
- [ ] Remover console.logs de debug
- [ ] Manter apenas logs importantes de erro
- [ ] Usar ferramenta de logging em produção

### 2. **TypeScript**
- [ ] Verificar erros de tipo
- [ ] Remover `any` não necessários
- [ ] Verificar tipos de props e estados

### 3. **Variáveis de Ambiente**
- [ ] Verificar se todas as env vars estão documentadas
- [ ] Confirmar que não há secrets no código
- [ ] Verificar .env.example está atualizado

### 4. **Imports Não Utilizados**
- [ ] Limpar imports não usados
- [ ] Verificar dependências do package.json

### 5. **Performance**
- [ ] Verificar se há componentes re-renderizando desnecessariamente
- [ ] Verificar uso de useEffect e dependências

### 6. **Acessibilidade**
- [ ] Verificar labels e aria-labels
- [ ] Verificar navegação por teclado

### 7. **Documentação**
- [ ] Verificar se README está atualizado
- [ ] Documentar mudanças importantes

---

## 🛠️ Próximos Passos

Escolha quais correções deseja fazer antes do commit:

1. Limpar console.logs
2. Verificar TypeScript
3. Limpar imports não utilizados
4. Outras verificações específicas









