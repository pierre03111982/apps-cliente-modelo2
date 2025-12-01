# ⚠️ CORREÇÃO URGENTE: URL do Webhook no Mercado Pago

## 🔴 Problema Identificado

Na imagem que você compartilhou, a URL configurada no Mercado Pago está:

```
https://app2.experimenteai.com.br/api/webhooks/mercadopago
```

## ✅ URL Correta

A URL correta é:

```
https://app2.experimenteai.com.br/api/webhooks/mercadopago
```

**Confirmação:**
- ✅ `experimenteai.com.br` (com "i" - CORRETO)

---

## 🔧 Como Corrigir

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação: **"Experimenteailojavirtual"**
3. Vá em **"NOTIFICAÇÕES" → "Webhooks"**
4. Clique em **"Configurar notificações"**
5. **Apague** a URL atual: `https://app2.experimenteai.com.br/api/webhooks/mercadopago`
6. **Cole** a URL correta: `https://app2.experimenteai.com.br/api/webhooks/mercadopago`
7. Certifique-se de que o evento **"Pagamentos"** está marcado
8. Salve

---

## ✅ Verificação

Após corrigir, teste:

1. **Teste 1 - Endpoint de Teste:**
   ```
   https://app2.experimenteai.com.br/api/webhooks/mercadopago/test
   ```
   Deve retornar `status: "ok"`

2. **Teste 2 - Endpoint GET:**
   ```
   https://app2.experimenteai.com.br/api/webhooks/mercadopago
   ```
   Deve retornar: `{"status": "ok", "service": "mercadopago-webhook"}`

3. **Teste 3 - Fazer um pagamento de teste:**
   - Use um cartão de teste do Mercado Pago
   - Verifique se o webhook recebe a notificação
   - Verifique os logs da Vercel

---

## 📋 Checklist Final

- [ ] URL corrigida no Mercado Pago (experimenteai.com.br)
- [ ] Evento "Pagamentos" marcado
- [ ] Modo de teste configurado (para testes)
- [ ] Credenciais de teste configuradas no Painel Admin
- [ ] Teste realizado com sucesso
- [ ] Logs verificados na Vercel

---

## 🎯 Próximos Passos

Após corrigir a URL:

1. Faça um **pagamento de teste** usando cartão de teste
2. Verifique os **logs da Vercel** para confirmar que o webhook recebeu a notificação
3. Verifique o **Firestore** para confirmar que o pedido foi atualizado
4. Se tudo funcionar, você está pronto para produção! 🚀

