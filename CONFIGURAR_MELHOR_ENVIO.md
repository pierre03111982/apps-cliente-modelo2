# Como Configurar Melhor Envio - Guia Completo

## ⚠️ IMPORTANTE: Erro "Client authentication failed"

Este erro geralmente ocorre por um dos seguintes motivos:

### 1. **Redirect URI não registrado no Melhor Envio**

O `redirect_uri` usado na autorização **DEVE ser exatamente igual** ao registrado no app do Melhor Envio.

**URL de callback que deve ser registrada:**
```
https://app2.experimenteai.com.br/api/melhor-envio/callback
```

**Como verificar/registrar:**
1. Acesse: https://sandbox.melhorenvio.com.br (ou produção)
2. Vá em "Minha Conta" → "Integrações" → "Aplicações"
3. Encontre seu app (Client ID: `21117` ou o seu)
4. Verifique se o `redirect_uri` está registrado exatamente como: `https://app2.experimenteai.com.br/api/melhor-envio/callback`
5. Se não estiver, adicione e salve

### 2. **Client ID ou Secret incorretos**

- Verifique se o Client ID e Secret estão corretos
- Certifique-se de que são do ambiente correto (sandbox vs produção)
- No sandbox, use as credenciais do ambiente de teste

### 3. **Ambiente incorreto**

- **Sandbox:** `https://sandbox.melhorenvio.com.br`
- **Produção:** `https://melhorenvio.com.br`

Certifique-se de usar o ambiente correto nas credenciais.

## 📋 Passo a Passo

### 1. Obter Credenciais no Melhor Envio

1. Acesse: https://sandbox.melhorenvio.com.br (ou produção)
2. Faça login
3. Vá em "Minha Conta" → "Integrações" → "Aplicações"
4. Crie uma nova aplicação ou use uma existente
5. Anote:
   - **Client ID**
   - **Client Secret**
   - **Redirect URI** (deve ser: `https://app2.experimenteai.com.br/api/melhor-envio/callback`)

### 2. Configurar no Painel Admin

1. Acesse o painel admin
2. Vá em "Configurações de Vendas"
3. Selecione "Melhor Envio" como provedor de frete
4. Preencha:
   - **Client ID do Melhor Envio**
   - **Secret do Melhor Envio**
5. Clique em "Salvar configurações de vendas"
6. Clique em "🔐 Autorizar e Obter Token"

### 3. Autorizar Aplicação

1. Você será redirecionado para o Melhor Envio
2. Faça login (se necessário)
3. Autorize a aplicação
4. Você será redirecionado de volta ao painel admin
5. O token será salvo automaticamente

## 🔍 Debug

### Verificar Logs

Os logs estão disponíveis em:
- **Vercel:** Dashboard → Deployments → Functions → Logs
- **Local:** Console do servidor

### Verificar Configuração

1. Verifique se o `redirect_uri` está correto nos logs:
   ```
   [melhor-envio/auth] Iniciando OAuth: {
     lojistaId: "...",
     clientId: "...",
     redirectUri: "https://app2.experimenteai.com.br/api/melhor-envio/callback",
     baseUrl: "..."
   }
   ```

2. Verifique se o `redirect_uri` está registrado no Melhor Envio

3. Verifique se as credenciais estão corretas no Firestore:
   - Coleção: `lojas/{lojistaId}/perfil/dados`
   - Campo: `salesConfig.integrations.melhor_envio_client_id`
   - Campo: `salesConfig.integrations.melhor_envio_client_secret`

## ❌ Erros Comuns

### "Client authentication failed"
- **Causa:** Redirect URI não registrado ou Client ID/Secret incorretos
- **Solução:** Verifique o redirect URI no app do Melhor Envio

### "redirect_uri_mismatch"
- **Causa:** O redirect URI usado não está registrado no app
- **Solução:** Adicione o redirect URI exato no app do Melhor Envio

### "invalid_client"
- **Causa:** Client ID não existe ou está incorreto
- **Solução:** Verifique o Client ID no app do Melhor Envio

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs no Vercel
2. Verifique a configuração no Melhor Envio
3. Entre em contato com o suporte do Melhor Envio





