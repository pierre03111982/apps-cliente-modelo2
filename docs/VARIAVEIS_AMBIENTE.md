# Variáveis de Ambiente - App Cliente Modelo 2

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento do aplicativo.

## 📋 Variáveis Obrigatórias

### Firebase
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend URLs
```env
# URL do backend (paineladm)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000

# URL do app cliente (para compartilhamento)
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3005
NEXT_PUBLIC_CLIENT_APP_DEV_URL=http://localhost:3005
```

## 🔒 Variáveis para Produção

### Vercel/Produção
```env
# Substituir localhost pelas URLs de produção
NEXT_PUBLIC_BACKEND_URL=https://paineladm.vercel.app
NEXT_PUBLIC_PAINELADM_URL=https://paineladm.vercel.app
NEXT_PUBLIC_CLIENT_APP_URL=https://app-cliente.vercel.app
NEXT_PUBLIC_CLIENT_APP_DEV_URL=https://app-cliente.vercel.app
```

## ✅ Checklist de Verificação

### Antes do Deploy

- [ ] Todas as variáveis `NEXT_PUBLIC_*` estão configuradas no Vercel
- [ ] URLs de produção estão corretas (sem localhost)
- [ ] Chaves do Firebase são as mesmas em desenvolvimento e produção
- [ ] Backend está acessível na URL configurada
- [ ] CORS está configurado para aceitar o domínio de produção

### Verificação Local

1. Criar arquivo `.env.local` na raiz do projeto
2. Copiar todas as variáveis acima
3. Preencher com valores reais
4. Reiniciar servidor de desenvolvimento

### Verificação no Vercel

1. Acessar Settings > Environment Variables
2. Adicionar todas as variáveis `NEXT_PUBLIC_*`
3. Verificar se estão marcadas para Production, Preview e Development
4. Fazer novo deploy após adicionar variáveis

## 🚨 Variáveis Sensíveis

**NUNCA** commitar no Git:
- Chaves de API do Firebase
- Tokens de autenticação
- Senhas ou credenciais

**SEMPRE** usar:
- `.env.local` para desenvolvimento local
- Variáveis de ambiente do Vercel para produção
- `.gitignore` deve incluir `.env.local` e `.env`

## 📝 Exemplo de .env.local

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_PAINELADM_URL=http://localhost:3000

# App Cliente
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3005
NEXT_PUBLIC_CLIENT_APP_DEV_URL=http://localhost:3005
```









