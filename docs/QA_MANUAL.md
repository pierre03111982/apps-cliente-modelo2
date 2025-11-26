# Checklist de QA Manual - App Cliente Modelo 2

Este documento contém o checklist completo para testes manuais do aplicativo antes do deploy em produção.

## 📋 Pré-requisitos

- [ ] Backend (`paineladm`) rodando em `http://localhost:3000`
- [ ] Frontend (`modelo-2`) rodando em `http://localhost:3005`
- [ ] Firebase configurado com variáveis de ambiente corretas
- [ ] Conta de lojista criada no Firebase
- [ ] Produtos cadastrados para o lojista
- [ ] Créditos de IA configurados para o lojista

---

## 🔐 1. Login e Cadastro

### 1.1 Fluxo Feliz - Login
- [ ] Acessar `/[lojistaId]/login`
- [ ] Inserir código de acesso válido
- [ ] Clicar em "Entrar"
- [ ] Verificar redirecionamento para `/[lojistaId]/experimentar`
- [ ] Verificar se dados da loja aparecem (nome, logo)
- [ ] Verificar se produtos são carregados

### 1.2 Fluxo Infeliz - Login
- [ ] Tentar entrar com código inválido
- [ ] Verificar mensagem de erro (toast deve aparecer)
- [ ] Tentar entrar sem código
- [ ] Verificar validação de campo obrigatório
- [ ] Tentar entrar com código inexistente
- [ ] Verificar mensagem apropriada

### 1.3 Cadastro de Novo Cliente
- [ ] Acessar página de login
- [ ] Clicar em "Novo Cliente"
- [ ] Preencher nome completo
- [ ] Preencher WhatsApp (formato válido)
- [ ] Clicar em "Cadastrar"
- [ ] Verificar criação do cliente no Firebase
- [ ] Verificar redirecionamento automático após cadastro

---

## 📸 2. Upload e Gerenciamento de Fotos

### 2.1 Upload de Foto
- [ ] Clicar no botão de upload/câmera
- [ ] Selecionar imagem válida (JPG, PNG)
- [ ] Verificar se imagem aparece na área de upload
- [ ] Verificar se imagem não estoura o container (SafeImage funcionando)
- [ ] Verificar placeholder quando imagem falha ao carregar

### 2.2 Upload de Imagem Pesada (>5MB)
- [ ] Tentar fazer upload de imagem >5MB
- [ ] Verificar tratamento de erro apropriado
- [ ] Verificar mensagem de erro amigável (toast)

### 2.3 Remover Foto
- [ ] Com foto carregada, clicar no botão "X" (remover)
- [ ] Confirmar remoção no diálogo
- [ ] Verificar se foto é removida
- [ ] Verificar se área de upload volta ao estado inicial

### 2.4 Trocar Foto
- [ ] Com foto carregada, clicar no botão de câmera
- [ ] Selecionar nova imagem
- [ ] Verificar se foto antiga é substituída pela nova
- [ ] Verificar se não há duplicação de imagens

### 2.5 Selecionar Foto dos Favoritos
- [ ] Clicar no botão de favoritos (coração)
- [ ] Verificar se modal de favoritos abre
- [ ] Selecionar uma foto dos favoritos
- [ ] Verificar se foto selecionada aparece na área de upload
- [ ] Verificar se modal fecha automaticamente

---

## 🛍️ 3. Seleção de Produtos

### 3.1 Seleção de Produtos
- [ ] Navegar pelas categorias (filtros)
- [ ] Selecionar 1 produto
- [ ] Verificar se produto aparece selecionado (checkmark)
- [ ] Verificar se contador de produtos selecionados atualiza
- [ ] Selecionar 2 produtos de categorias diferentes
- [ ] Verificar se ambos aparecem selecionados
- [ ] Verificar mensagem de limite (máximo 2 produtos)

### 3.2 Limite de Produtos
- [ ] Tentar selecionar 3 produtos
- [ ] Verificar aviso sobre limite de categorias diferentes
- [ ] Verificar se apenas 2 produtos podem ser selecionados
- [ ] Desmarcar um produto
- [ ] Verificar se pode selecionar outro produto

### 3.3 Produtos com Desconto
- [ ] Verificar se desconto aparece quando aplicado
- [ ] Verificar cálculo correto do preço com desconto
- [ ] Verificar se desconto persiste após refresh

### 3.4 Visualização de Produtos
- [ ] Verificar se imagens dos produtos carregam corretamente
- [ ] Verificar se imagens não estouram o container
- [ ] Verificar placeholder quando imagem falha
- [ ] Verificar informações do produto (nome, preço)

---

## ✨ 4. Geração de Looks

### 4.1 Geração Normal
- [ ] Com foto e produtos selecionados, clicar em "CRIAR LOOK"
- [ ] Verificar overlay de loading com animação
- [ ] Verificar mensagens de progresso (frases criativas)
- [ ] Aguardar conclusão da geração
- [ ] Verificar redirecionamento para `/resultado`
- [ ] Verificar se look gerado aparece na tela

### 4.2 Geração com Servidor Ocupado
- [ ] Simular timeout ou erro no backend
- [ ] Verificar mensagem de erro apropriada (toast)
- [ ] Verificar se usuário pode tentar novamente
- [ ] Verificar se estado não fica travado

### 4.3 Rate Limiting
- [ ] Gerar um look
- [ ] Tentar gerar outro look imediatamente (< 10 segundos)
- [ ] Verificar mensagem de rate limit (toast)
- [ ] Aguardar 10 segundos
- [ ] Tentar gerar novamente
- [ ] Verificar se funciona após espera

### 4.4 Saldo Insuficiente
- [ ] Configurar lojista com 0 créditos
- [ ] Tentar gerar look
- [ ] Verificar mensagem de saldo insuficiente (toast)
- [ ] Verificar código de erro 402

---

## ❤️ 5. Favoritos e Likes

### 5.1 Curtir Look Gerado
- [ ] Na tela de resultado, clicar no botão de like
- [ ] Verificar se like é registrado
- [ ] Verificar se look aparece nos favoritos
- [ ] Verificar se não há duplicação ao curtir novamente

### 5.2 Descurtir Look
- [ ] Clicar no botão de like novamente (descurtir)
- [ ] Verificar se like é removido
- [ ] Verificar se look desaparece dos favoritos

### 5.3 Modal de Favoritos
- [ ] Clicar no botão de favoritos
- [ ] Verificar se modal abre com skeleton loading
- [ ] Verificar se favoritos carregam sem "flickering"
- [ ] Verificar se imagens aparecem corretamente
- [ ] Selecionar um favorito
- [ ] Verificar se foto é aplicada na área de upload

### 5.4 Persistência de Favoritos
- [ ] Curtir alguns looks
- [ ] Recarregar a página (F5)
- [ ] Verificar se favoritos persistem
- [ ] Verificar se não há duplicação

---

## 🔄 6. Refinamento de Looks

### 6.1 Adicionar Acessório
- [ ] Na tela de resultado, clicar em "Adicionar Acessório"
- [ ] Verificar se volta para tela de experimentar
- [ ] Verificar se foto base do look aparece
- [ ] Selecionar 1 produto
- [ ] Clicar em "CRIAR LOOK"
- [ ] Verificar se novo look é gerado com acessório

### 6.2 Limite de Produto no Refinamento
- [ ] Em modo refinamento, tentar selecionar 2 produtos
- [ ] Verificar mensagem de erro apropriada
- [ ] Verificar se apenas 1 produto pode ser selecionado

---

## 📱 7. Responsividade Mobile

### 7.1 iPhone (Safari)
- [ ] Testar em iPhone real ou simulador
- [ ] Verificar se layout se adapta corretamente
- [ ] Verificar se botões são clicáveis
- [ ] Verificar se imagens não estouram
- [ ] Verificar safe areas (notch)

### 7.2 Android (Chrome)
- [ ] Testar em Android real ou emulador
- [ ] Verificar layout responsivo
- [ ] Verificar navegação suave
- [ ] Verificar performance

### 7.3 Tablet
- [ ] Testar em iPad ou tablet Android
- [ ] Verificar se layout aproveita espaço maior
- [ ] Verificar se grid de produtos se adapta

---

## 🔗 8. Compartilhamento e Redes Sociais

### 8.1 Compartilhar App
- [ ] Clicar no botão de compartilhar
- [ ] Verificar se link é copiado (toast de sucesso)
- [ ] Verificar se link está correto
- [ ] Testar em dispositivo móvel (navigator.share)

### 8.2 Redes Sociais
- [ ] Clicar em botão do Instagram
- [ ] Verificar se abre link correto
- [ ] Repetir para Facebook e TikTok
- [ ] Verificar se desconto é aplicado ao clicar

### 8.3 Aplicar Desconto
- [ ] Clicar em qualquer rede social
- [ ] Verificar se desconto é aplicado
- [ ] Verificar se badge "Desconto aplicado" aparece
- [ ] Verificar se desconto persiste após refresh

---

## 🔙 9. Navegação e Fluxo

### 9.1 Voltar para Compras
- [ ] Na tela de resultado, clicar em "Voltar para Compras"
- [ ] Verificar se volta para `/experimentar`
- [ ] Verificar se foto original é restaurada
- [ ] Verificar se produtos selecionados são mantidos

### 9.2 Voltar para Login
- [ ] Na tela de experimentar, clicar em voltar
- [ ] Verificar se volta para login
- [ ] Verificar se dados não são perdidos (sessionStorage)

### 9.3 Persistência de Dados
- [ ] Carregar foto e selecionar produtos
- [ ] Navegar para outra página
- [ ] Voltar para experimentar
- [ ] Verificar se foto e produtos são mantidos

---

## ⚠️ 10. Tratamento de Erros

### 10.1 Erro de Rede
- [ ] Desconectar internet
- [ ] Tentar gerar look
- [ ] Verificar mensagem de erro apropriada (toast)
- [ ] Reconectar internet
- [ ] Verificar se pode tentar novamente

### 10.2 Erro de API
- [ ] Parar backend
- [ ] Tentar gerar look
- [ ] Verificar mensagem de erro (toast)
- [ ] Verificar se não trava a aplicação

### 10.3 Erro de Firebase
- [ ] Simular erro de conexão Firebase
- [ ] Verificar fallback para API
- [ ] Verificar mensagens de erro apropriadas

---

## 🎨 11. UI/UX e Animações

### 11.1 Animações
- [ ] Verificar fade-in nas imagens ao carregar
- [ ] Verificar animação de loading
- [ ] Verificar transições suaves entre páginas
- [ ] Verificar animação do botão "CRIAR LOOK"

### 11.2 Feedback Visual
- [ ] Verificar skeleton loading nos favoritos
- [ ] Verificar spinners durante carregamento
- [ ] Verificar toasts para ações do usuário
- [ ] Verificar estados vazios (empty states)

### 11.3 Acessibilidade
- [ ] Navegar com teclado (Tab)
- [ ] Verificar foco visível nos elementos
- [ ] Verificar contraste de cores
- [ ] Verificar textos alternativos em imagens

---

## 🔒 12. Segurança

### 12.1 CORS
- [ ] Tentar acessar API de origem não permitida
- [ ] Verificar bloqueio (403)
- [ ] Verificar headers CORS corretos

### 12.2 Rate Limiting
- [ ] Fazer múltiplas requisições rápidas
- [ ] Verificar bloqueio após limite
- [ ] Verificar mensagem de rate limit

### 12.3 Validação de Entrada
- [ ] Tentar enviar dados inválidos
- [ ] Verificar validação no frontend
- [ ] Verificar validação no backend

---

## 📊 13. Performance

### 13.1 Carregamento Inicial
- [ ] Medir tempo de carregamento da página de login
- [ ] Verificar se < 3 segundos
- [ ] Verificar lazy loading de imagens

### 13.2 Geração de Look
- [ ] Medir tempo de geração
- [ ] Verificar feedback durante espera
- [ ] Verificar timeout apropriado (2 minutos)

### 13.3 Memória
- [ ] Verificar se URLs blob são revogadas
- [ ] Verificar se não há vazamentos de memória
- [ ] Testar múltiplas gerações consecutivas

---

## ✅ 14. Checklist Final

### 14.1 Variáveis de Ambiente
- [ ] Verificar `.env.local` configurado
- [ ] Verificar URLs do backend corretas
- [ ] Verificar chaves do Firebase
- [ ] Verificar domínios permitidos (CORS)

### 14.2 Build de Produção
- [ ] Executar `npm run build` no modelo-2
- [ ] Verificar se build completa sem erros
- [ ] Executar `npm run build` no paineladm
- [ ] Verificar se build completa sem erros

### 14.3 Deploy
- [ ] Verificar configuração do Vercel
- [ ] Verificar variáveis de ambiente no Vercel
- [ ] Verificar domínios configurados
- [ ] Testar deploy em staging antes de produção

---

## 📝 Notas de Teste

**Data do Teste:** _______________

**Testador:** _______________

**Ambiente:** [ ] Local [ ] Staging [ ] Produção

**Observações:**
- 
- 
- 

---

## 🐛 Bugs Encontrados

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
|   |           |            |        |
|   |           |            |        |

---

**Última atualização:** $(date)






