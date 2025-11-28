# 🔧 Correções: Display QR Code e Layout

## ✅ Problemas Identificados e Corrigidos

### 1. **QR Code Apontando para Domínio Errado** ✅ CORRIGIDO
**Problema:** O QR Code estava usando `window.location.origin`, que quando o display está em `display.experimenteai.com.br`, gerava uma URL apontando para o display em vez do app cliente.

**Solução:**
- Modificado `DisplayView.tsx` para detectar ambiente (dev/prod)
- Em produção, usa `app.experimenteai.com.br` (domínio do app cliente)
- Em desenvolvimento, usa `localhost:3005` (porta do modelo-2)
- QR Code agora aponta corretamente para o app do cliente

**Arquivo alterado:** `src/components/views/DisplayView.tsx`

### 2. **Erros "Failed to fetch" nas Imagens** ✅ MELHORADO
**Problema:** Imagens de produtos não carregavam e mostravam erro "Failed to fetch".

**Solução:**
- Melhorado componente `SafeImage.tsx` para exibir mensagem de erro mais clara
- Adicionado placeholder SVG com mensagem "Imagem não disponível"
- Melhor tratamento de erros visuais

**Arquivo alterado:** `src/components/ui/SafeImage.tsx`

### 3. **Vídeo de Fundo** ✅ MELHORADO
**Problema:** Vídeo de fundo poderia não carregar.

**Solução:**
- Adicionado `preload="auto"` no vídeo
- Adicionado tratamento de erro com fallback para fundo preto
- Adicionado `bg-black` no container como fallback

**Arquivo alterado:** `src/components/views/ExperimentarView.tsx`

---

## 📋 Verificações Necessárias

### Antes de Testar:
1. **Variáveis de Ambiente:**
   - ✅ `NEXT_PUBLIC_APP_DOMAIN` deve estar configurado como `app.experimenteai.com.br`
   - ✅ `NEXT_PUBLIC_DISPLAY_DOMAIN` deve estar configurado como `display.experimenteai.com.br`

2. **Arquivos Públicos:**
   - ✅ Verificar se `public/video2tela2.mp4` existe
   - ✅ Verificar se imagens dos produtos estão acessíveis

3. **CORS:**
   - ✅ Verificar se as URLs das imagens dos produtos permitem carregamento
   - ✅ Verificar se há restrições de CORS no Firebase Storage

---

## 🔍 Como Testar

### 1. Testar QR Code:
1. Acessar display: `display.experimenteai.com.br/[lojistaId]`
2. Escanear QR Code
3. **Esperado:** Deve abrir `app.experimenteai.com.br/[lojistaId]/experimentar?connect=true&target_display=[UUID]`
4. **Esperado:** Deve mostrar o layout correto com vídeo de fundo

### 2. Testar Imagens:
1. Abrir app do cliente
2. Verificar se imagens dos produtos carregam
3. Se falhar, deve mostrar placeholder SVG com mensagem

### 3. Testar Vídeo:
1. Abrir app do cliente
2. Verificar se vídeo de fundo está rodando
3. Se falhar, deve ter fundo preto (não branco)

---

## ⚠️ Problemas Conhecidos

1. **CORS nas Imagens:** Se as imagens estão no Firebase Storage, verificar regras de CORS
2. **Tamanho do Vídeo:** Vídeo pode demorar para carregar em conexões lentas
3. **Cache:** Pode precisar limpar cache do navegador após mudanças

---

## 📝 Próximos Passos

1. Testar em produção após deploy
2. Monitorar erros de console para imagens que não carregam
3. Considerar adicionar retry automático para imagens que falham
4. Considerar comprimir vídeo para carregamento mais rápido










