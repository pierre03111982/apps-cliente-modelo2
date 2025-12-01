# 🔍 Diagnóstico: Logo não aparece no OG Image

## ✅ Correções Aplicadas

1. **URL base corrigida**: Agora sempre usa `https://app2.experimenteai.com.br` em produção
2. **Logs melhorados**: Adicionados logs detalhados para debug
3. **Tratamento de erros**: Melhor tratamento quando a logo não pode ser baixada
4. **Timeout aumentado**: 20 segundos para download da logo
5. **Validação de buffer**: Verifica se a imagem foi baixada corretamente

## 🔎 Como Verificar o Problema

### 1. Verificar se a Logo está Configurada no Firestore

**Caminho no Firestore:**
```
lojas/{lojistaId}/perfil/dados
```

**Campos a verificar:**
- `logoUrl` (prioridade 1)
- `app_icon_url` (prioridade 2)

**Exemplo de URL válida:**
```
https://firebasestorage.googleapis.com/v0/b/...
```

### 2. Testar a URL da OG Image Diretamente

Acesse no navegador:
```
https://app2.experimenteai.com.br/api/og-image/{lojistaId}
```

**O que deve aparecer:**
- ✅ Se a logo estiver configurada: Imagem com logo da loja
- ❌ Se não estiver: Imagem com inicial do nome da loja

### 3. Verificar Logs no Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Logs** do projeto
3. Procure por: `[OG Image]` ou `[Proxy Image]`
4. Verifique se há erros ao baixar a logo

**Logs esperados:**
```
[OG Image] PHASE 25: Dados encontrados: { lojistaId, nome, logoUrl: "...", ... }
[OG Image] PHASE 25: Tentando baixar logo: https://...
[OG Image] PHASE 25: ✅ Logo baixada e convertida para base64 com sucesso
```

**Se houver erro:**
```
[OG Image] PHASE 25: ❌ Erro ao baixar logo: { message, ... }
```

### 4. Testar o Proxy de Imagem

Se a logo estiver no Firebase Storage, teste o proxy:
```
https://app2.experimenteai.com.br/api/proxy-image?url={URL_DA_LOGO}
```

**O que deve acontecer:**
- ✅ Retorna a imagem diretamente
- ❌ Retorna erro JSON com detalhes

### 5. Limpar Cache do Facebook/WhatsApp

**Facebook Debugger:**
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL: `https://app2.experimenteai.com.br/{lojistaId}/login`
3. Clique em **"Buscar novamente"** (Scrape Again)
4. Verifique se a URL da `og:image` está correta

**URL esperada:**
```
https://app2.experimenteai.com.br/api/og-image/{lojistaId}
```

**⚠️ IMPORTANTE:** Se aparecer URL do Vercel (ex: `apps-cliente-modelo02-2c2y1uq4t...`), significa que o cache ainda está antigo. Limpe novamente.

## 🐛 Problemas Comuns

### Problema 1: Logo não está no Firestore
**Solução:** Configure a logo no painel admin em `Configurações > Perfil`

### Problema 2: Logo está no Firestore mas não aparece
**Possíveis causas:**
- URL da logo está incorreta
- Logo não está acessível publicamente
- Firebase Storage bloqueando acesso

**Solução:**
1. Verifique se a URL da logo está completa e válida
2. Teste a URL diretamente no navegador
3. Verifique as regras de acesso do Firebase Storage

### Problema 3: Cache do Facebook/WhatsApp
**Solução:** 
- Use o Facebook Debugger para limpar o cache
- Adicione `?v=2` na URL da og:image (já implementado no código)

### Problema 4: Timeout ao baixar logo
**Solução:**
- Verifique se a logo não é muito grande (> 5MB pode dar timeout)
- Verifique a conexão do servidor com o Firebase Storage

## 📊 Checklist de Verificação

- [ ] Logo está configurada no Firestore (`logoUrl` ou `app_icon_url`)
- [ ] URL da logo é válida e acessível
- [ ] Teste direto da OG Image funciona (`/api/og-image/{lojistaId}`)
- [ ] Logs no Vercel não mostram erros
- [ ] Cache do Facebook foi limpo
- [ ] URL da `og:image` no Facebook Debugger está correta (não é URL do Vercel)

## 🚀 Próximos Passos

1. **Aguardar deploy** (já feito - commit `e37c349`)
2. **Verificar logs no Vercel** após o deploy
3. **Testar URL da OG Image** diretamente
4. **Limpar cache do Facebook** novamente
5. **Compartilhar no WhatsApp** para testar

## 📝 Notas Técnicas

- A OG Image é gerada dinamicamente no servidor
- A logo é baixada e convertida para base64 antes de ser incorporada
- Se a logo estiver no Firebase Storage, usa o proxy `/api/proxy-image`
- Timeout de 20 segundos para download da logo
- Fallback: mostra inicial do nome se logo não estiver disponível

