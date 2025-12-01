# Como Obter Token do Melhor Envio

## ⚠️ Importante

O Melhor Envio **NÃO** exibe o token diretamente no painel. É necessário usar o **fluxo OAuth 2.0** para obter o token de acesso.

## 📋 Pré-requisitos

Você já tem:
- ✅ **Client ID**: `21117`
- ✅ **Secret**: `6tqGHAGHVFpbTSFugNxXeXe8flzU9MUTMjMANd30`
- ✅ **Aplicativo cadastrado**: "Experimente AI"

## 🔐 Passo a Passo para Obter o Token

### 1. Configurar no Painel Admin

No painel admin, na seção "Vendas no Aplicativo", configure:

- **Client ID do Melhor Envio**: `21117`
- **Secret do Melhor Envio**: `6tqGHAGHVFpbTSFugNxXeXe8flzU9MUTMjMANd30`

### 2. Iniciar Fluxo OAuth

Acesse a URL de autorização (substitua `[lojistaId]` pelo ID da sua loja):

```
https://app2.experimenteai.com.br/api/melhor-envio/auth?lojistaId=[lojistaId]
```

**Exemplo:**
```
https://app2.experimenteai.com.br/api/melhor-envio/auth?lojistaId=hOQL4BaVY92787EjKVMt
```

### 3. Autorizar Aplicativo

1. Você será redirecionado para a página de autorização do Melhor Envio
2. Faça login na sua conta do Melhor Envio
3. Revise as permissões solicitadas
4. Clique em **"Autorizar"** ou **"Permitir"**

### 4. Token Será Salvo Automaticamente

Após autorizar:
- O sistema trocará o código de autorização por um token de acesso
- O token será salvo automaticamente no Firestore
- Você será redirecionado de volta para o painel admin

## 🔄 Renovação Automática

O token expira em **30 dias**. O sistema pode ser configurado para renovar automaticamente usando o `refresh_token`.

## 🧪 Ambiente Sandbox vs Produção

**Sandbox (Teste):**
- URL: `https://sandbox.melhorenvio.com.br`
- Use para testes durante desenvolvimento

**Produção:**
- URL: `https://www.melhorenvio.com.br`
- Use para ambiente real

⚠️ **Nota**: O código atual está configurado para **Sandbox**. Para produção, atualize as URLs nos arquivos:
- `src/app/api/melhor-envio/auth/route.ts`
- `src/app/api/melhor-envio/callback/route.ts`

## 📝 Campos no Painel Admin

No painel admin, você precisa preencher:

1. **Client ID do Melhor Envio**: `21117`
2. **Secret do Melhor Envio**: `6tqGHAGHVFpbTSFugNxXeXe8flzU9MUTMjMANd30`
3. **Token do Melhor Envio**: Será preenchido automaticamente após autorização OAuth

## ✅ Verificação

Após completar o fluxo OAuth, o token será salvo em:
```
lojas/{lojistaId}/perfil/dados.salesConfig.integrations.melhor_envio_token
```

## 🆘 Problemas Comuns

**Erro: "Client ID ou Secret não configurados"**
- Verifique se preencheu Client ID e Secret no painel admin

**Erro: "redirect_uri mismatch"**
- Verifique se a URL de callback no Melhor Envio está correta:
  ```
  https://app2.experimenteai.com.br/api/melhor-envio/callback
  ```

**Token não aparece após autorização**
- Verifique os logs do servidor
- Confirme que o fluxo OAuth foi completado

## 📚 Documentação Oficial

- [Documentação Melhor Envio - Autenticação](https://docs.melhorenvio.com.br/docs/autenticacao-1)
- [Documentação Melhor Envio - Introdução](https://docs.melhorenvio.com.br/docs/introducao-a-api)

