# 🔧 Resolver Erro de Build no Vercel

## 🎯 Problema

O erro mostra: `Property 'personagemImgUrl' does not exist on type 'GeneratedLook'`

Mas o código local está correto! Isso pode ser:
- Cache do Vercel
- Versão antiga sendo usada
- Problema de sincronização

## ✅ Solução: Forçar Novo Build

### **OPÇÃO 1: Fazer um Commit Vazio (Recomendado)**

Isso força o Vercel a fazer um novo build:

```powershell
cd E:\projetos\apps-cliente\modelo-1
```

```powershell
git commit --allow-empty -m "trigger: forçar novo build"
```

```powershell
git push
```

### **OPÇÃO 2: Limpar Cache e Redeploy**

No Vercel:

1. Vá em **"Deployments"**
2. Clique nos **3 pontinhos** ao lado do último deploy
3. Clique em **"Redeploy"**
4. **Marque a opção "Use existing Build Cache" como DESMARCADA** (limpar cache)
5. Clique em **"Redeploy"**

### **OPÇÃO 3: Verificar Root Directory**

Certifique-se de que o Root Directory está correto:

1. Vá em **"Settings"** → **"General"**
2. Verifique **"Root Directory"**
3. Deve ser: `apps-cliente/modelo-1`
4. Se estiver diferente, altere e salve
5. Faça um novo deploy

---

## 🔍 Verificação do Código

O código local está correto na linha 309:

```typescript
const personImageUrl = storedPhoto
```

Se o erro persistir, pode ser que o Vercel esteja usando uma versão antiga do código.

---

## 🚀 Próximos Passos

1. ✅ Execute o commit vazio (Opção 1)
2. ✅ Aguarde o Vercel fazer o novo build automaticamente
3. ✅ Verifique se o erro foi resolvido

---

## 💡 Se Ainda Der Erro

Se mesmo assim der erro, pode ser que haja outro arquivo com problema. Me avise qual erro aparece e eu verifico!

---

**Execute a Opção 1 primeiro e me diga o resultado!** 🚀

