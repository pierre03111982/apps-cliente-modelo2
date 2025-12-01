# 🧪 Guia Completo de Teste - Webhook Mercado Pago

## ✅ Checklist de Configuração

### 1. URL do Webhook no Mercado Pago

**⚠️ IMPORTANTE:** Verifique se a URL está correta:

- ✅ **CORRETO:** `https://app2.experimenteai.com.br/api/webhooks/mercadopago`
- ❌ **ERRADO:** `http://localhost:3005/api/webhooks/mercadopago` (não funciona em produção)

**Como configurar:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **"NOTIFICAÇÕES" → "Webhooks"**
4. Clique em **"Configurar notificações"**
5. Cole a URL: `https://app2.experimenteai.com.br/api/webhooks/mercadopago`
6. Marque o evento **"Pagamentos"**
7. Salve

### 2. Credenciais do Mercado Pago

Verifique se as credenciais estão configuradas no Painel Admin:

1. Acesse o Painel Admin
2. Vá em **"Configurações" → "Vendas"**
3. Selecione **"Mercado Pago"** como gateway
4. Cole:
   - **Public Key** (credencial de teste)
   - **Access Token** (credencial de teste)
5. Salve

**Onde encontrar as credenciais:**
- Acesse: https://www.mercadopago.com.br/developers/panel/app
- Vá em **"TESTES" → "Credenciais de teste"**
- Copie **"Chave pública"** e **"Token de acesso"**

### 3. Variáveis de Ambiente na Vercel

Verifique se estas variáveis estão configuradas:

```env
NEXT_PUBLIC_CLIENT_APP_URL=https://app2.experimenteai.com.br
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🧪 Testes Passo a Passo

### Teste 1: Verificar se o Webhook está Acessível

**URL de Teste:**
```
https://app2.experimenteai.com.br/api/webhooks/mercadopago/test
```

**O que verificar:**
- ✅ Deve retornar `status: "ok"`
- ✅ Deve listar as lojas configuradas
- ✅ Deve mostrar quais lojas têm Mercado Pago configurado

**Resultado esperado:**
```json
{
  "status": "ok",
  "message": "Webhook está acessível e funcionando",
  "webhookUrl": "https://app2.experimenteai.com.br/api/webhooks/mercadopago",
  "lojas": [...]
}
```

### Teste 2: Verificar Endpoint GET do Webhook

**URL:**
```
https://app2.experimenteai.com.br/api/webhooks/mercadopago
```

**Método:** GET

**Resultado esperado:**
```json
{
  "status": "ok",
  "service": "mercadopago-webhook"
}
```

### Teste 3: Teste de Pagamento no Modo Sandbox

**Passos:**
1. Acesse sua aplicação cliente: `https://app2.experimenteai.com.br/{lojistaId}/experimentar`
2. Adicione produtos ao carrinho
3. Vá para o checkout
4. Selecione **"Mercado Pago"** como forma de pagamento
5. Use um **cartão de teste** do Mercado Pago:
   - **Número:** `5031 4332 1540 6351`
   - **CVV:** `123`
   - **Nome:** Qualquer nome
   - **Validade:** Qualquer data futura (ex: 12/25)
6. Complete o pagamento

**O que verificar:**
1. ✅ O pagamento deve ser processado
2. ✅ O webhook deve receber a notificação
3. ✅ O pedido no Firestore deve ser atualizado com `status: "paid"`

### Teste 4: Verificar Logs da Vercel

**Como verificar:**
1. Acesse: https://vercel.com/seu-projeto
2. Vá em **"Deployments"**
3. Clique no último deploy
4. Vá em **"Functions" → "Logs"**
5. Procure por: `[webhooks/mercadopago]`

**Logs esperados:**
```
[webhooks/mercadopago] Notificação recebida: { type: 'payment', dataId: '123456789' }
[webhooks/mercadopago] Pagamento encontrado: { paymentId: '123456789', lojistaId: '...', status: 'approved' }
[webhooks/mercadopago] Pedido atualizado: { orderId: '...', status: 'paid' }
[webhooks/mercadopago] ✅ Pagamento aprovado! Pedido: ...
```

### Teste 5: Verificar Pedido no Firestore

**Como verificar:**
1. Acesse: https://console.firebase.google.com/
2. Vá em **"Firestore Database"**
3. Navegue até: `lojas/{lojistaId}/orders`
4. Encontre o pedido criado
5. Verifique os campos:
   - ✅ `status: "paid"` (se pagamento aprovado)
   - ✅ `payment_id: "123456789"` (ID do pagamento)
   - ✅ `payment_status: "approved"`
   - ✅ `payment_data` (objeto com dados do pagamento)

---

## 🐛 Troubleshooting

### Problema 1: Webhook não recebe notificações

**Possíveis causas:**
- ❌ URL incorreta no Mercado Pago
- ❌ Evento "Pagamentos" não marcado
- ❌ Webhook em modo de teste, mas pagamento em produção (ou vice-versa)

**Solução:**
1. Verifique a URL no Mercado Pago (deve ser exatamente: `https://app2.experimenteai.com.br/api/webhooks/mercadopago`)
2. Certifique-se de que o evento "Pagamentos" está marcado
3. Use credenciais de **teste** para pagamentos de **teste**

### Problema 2: "Pedido não encontrado" nos logs

**Possíveis causas:**
- ❌ O pedido não foi criado antes do webhook ser chamado
- ❌ O `preference_id` não está sendo salvo corretamente
- ❌ O `external_reference` não corresponde

**Solução:**
1. Verifique se o pedido foi criado no Firestore antes do pagamento
2. Verifique se o `preference_id` está sendo salvo no pedido
3. Verifique os logs do `create-payment` para ver se o pedido foi criado

### Problema 3: "Access token não encontrado"

**Possíveis causas:**
- ❌ Credenciais não configuradas no Painel Admin
- ❌ Estrutura do Firestore diferente do esperado

**Solução:**
1. Verifique se as credenciais estão salvas em: `lojas/{lojistaId}/salesConfig.integrations.mercadopago_access_token`
2. Verifique se o campo está como `salesConfig` ou `sales_config` (o código tenta ambos)

### Problema 4: Webhook retorna erro 500

**Possíveis causas:**
- ❌ Variáveis de ambiente não configuradas
- ❌ Erro no código do webhook
- ❌ Firebase Admin SDK não configurado

**Solução:**
1. Verifique os logs da Vercel para ver o erro específico
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Teste a rota `/api/webhooks/mercadopago/test` para verificar a configuração

---

## 📊 Status dos Testes

Use esta tabela para acompanhar o progresso:

| Teste | Status | Observações |
|-------|--------|-------------|
| Webhook acessível (GET) | ⬜ | |
| Rota de teste funcionando | ⬜ | |
| Pagamento de teste criado | ⬜ | |
| Webhook recebeu notificação | ⬜ | |
| Pedido atualizado no Firestore | ⬜ | |
| Logs aparecem na Vercel | ⬜ | |

---

## 🎯 Próximos Passos

Após confirmar que tudo está funcionando:

1. ✅ Testar em **modo de produção** (quando estiver pronto)
2. ✅ Configurar webhook de **produção** no Mercado Pago
3. ✅ Usar **credenciais de produção** no Painel Admin
4. ✅ Implementar notificações para o lojista (email, WhatsApp, etc.)
5. ✅ Implementar dedução de estoque automática

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da Vercel
2. Verifique os logs do Firebase
3. Teste a rota `/api/webhooks/mercadopago/test`
4. Verifique a documentação do Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs

