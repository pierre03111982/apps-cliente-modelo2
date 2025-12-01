# 🔒 Como Remover Credenciais do Histórico do Git

## ⚠️ IMPORTANTE

Se uma credencial foi commitada no Git, **ela permanece no histórico** mesmo que você remova o arquivo. Isso significa que qualquer pessoa com acesso ao repositório pode ver a credencial nos commits antigos.

## 📋 Opções de Solução

### Opção 1: Regenerar a Chave (RECOMENDADO - Mais Rápido)

**Esta é a solução mais rápida e recomendada:**

1. **Regenere a chave comprometida** no Google Cloud Console
2. **Atualize as variáveis de ambiente** com a nova chave
3. **A chave antiga fica inativa** e não pode mais ser usada

**Vantagens:**
- ✅ Rápido (5 minutos)
- ✅ Não requer reescrever histórico
- ✅ Não afeta outros desenvolvedores
- ✅ Funciona imediatamente

**Desvantagens:**
- ⚠️ A chave antiga ainda está visível no histórico (mas inativa)

---

### Opção 2: Remover do Histórico do Git (Mais Completo)

**Use esta opção se:**
- A chave ainda está ativa e não pode ser regenerada
- Você precisa remover completamente do histórico
- O repositório é privado ou você tem controle total

**⚠️ ATENÇÃO:** Esta operação reescreve o histórico do Git e requer force push!

---

## 🔧 Como Remover do Histórico

### Método 1: Usando git filter-branch (Nativo do Git)

```bash
# 1. Fazer backup do repositório
git clone --mirror https://github.com/usuario/repositorio.git backup-repo.git

# 2. Remover a chave do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Remover referências antigas
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (CUIDADO!)
git push origin --force --all
git push origin --force --tags
```

### Método 2: Usando BFG Repo-Cleaner (Mais Rápido)

```bash
# 1. Instalar BFG (se não tiver)
# Download: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Fazer backup
git clone --mirror https://github.com/usuario/repositorio.git backup-repo.git

# 3. Remover arquivo específico
java -jar bfg.jar --delete-files .env.local

# 4. Limpar repositório
cd repositorio.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push origin --force --all
```

### Método 3: Remover String Específica

Se você quer remover apenas a chave específica (não o arquivo inteiro):

```bash
# Usando git filter-branch com sed
git filter-branch --force --tree-filter \
  'if [ -f .env.local ]; then
     sed -i "s/AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs/REMOVIDO/g" .env.local
   fi' \
  --prune-empty --tag-name-filter cat -- --all
```

---

## ⚠️ AVISOS IMPORTANTES

### Antes de Remover do Histórico:

1. **⚠️ BACKUP OBRIGATÓRIO**
   ```bash
   git clone --mirror https://github.com/usuario/repositorio.git backup-antes-remover.git
   ```

2. **⚠️ COMUNICAR A EQUIPE**
   - Todos os desenvolvedores precisarão refazer o clone
   - Commits locais serão perdidos se não sincronizados

3. **⚠️ FORCE PUSH É DESTRUTIVO**
   - Reescreve o histórico do repositório
   - Pode afetar pull requests e issues
   - Pode quebrar forks e clones

4. **⚠️ VERIFICAR SE A CHAVE ESTÁ REALMENTE NO HISTÓRICO**
   ```bash
   # Verificar se a chave está no histórico
   git log --all --full-history -p --source -- "*env*" | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"
   
   # Se não encontrar nada, a chave não está no histórico deste repositório
   ```

---

## 🔍 Verificar se a Chave Está no Histórico

### Verificar em um Repositório Específico

```bash
# Verificar se a chave está em algum commit
git log --all --full-history -p | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"

# Verificar em arquivos específicos
git log --all --full-history -p -- "*env*" | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"

# Verificar em todo o código
git log --all --full-history -p | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"
```

### Verificar em Todos os Repositórios

Se você tem múltiplos repositórios, verifique todos:

```bash
# apps-cliente-modelo-1
cd ../apps-cliente-modelo-1
git log --all --full-history -p | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"

# apps-cliente-modelo-2
cd ../apps-cliente-modelo-2
git log --all --full-history -p | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"

# paineladm
cd ../../paineladm
git log --all --full-history -p | grep "AIzaSyDATnJJmvdSTTApuIQK56IRJGDPxgg1YRs"
```

---

## ✅ Checklist de Ação

### Se a Chave Está no Histórico:

- [ ] **Fazer backup completo** do repositório
- [ ] **Comunicar a equipe** sobre a operação
- [ ] **Regenerar a chave** no Google Cloud Console (IMPORTANTE!)
- [ ] **Escolher método** de remoção (filter-branch ou BFG)
- [ ] **Executar remoção** do histórico
- [ ] **Verificar** se a remoção funcionou
- [ ] **Force push** (se necessário)
- [ ] **Notificar equipe** para refazer clone
- [ ] **Atualizar variáveis de ambiente** com nova chave

### Se a Chave NÃO Está no Histórico:

- [ ] **Regenerar a chave** mesmo assim (por segurança)
- [ ] **Verificar** se está em outros repositórios
- [ ] **Garantir** que .gitignore está funcionando
- [ ] **Executar scripts de verificação** regularmente

---

## 🆘 Em Caso de Dúvida

**Se você não tem certeza se deve remover do histórico:**

1. **Regenere a chave primeiro** (solução imediata)
2. **Verifique se há uso não autorizado** nos logs do Google Cloud
3. **Considere remover do histórico** apenas se:
   - A chave ainda está ativa
   - O repositório é público
   - Você tem certeza de que precisa remover

**Lembre-se:** Regenerar a chave é geralmente suficiente, pois a chave antiga fica inativa e não pode mais ser usada.

---

## 📚 Recursos Adicionais

- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Filter-Branch Documentation](https://git-scm.com/docs/git-filter-branch)

---

**Última atualização**: Dezembro 2024

