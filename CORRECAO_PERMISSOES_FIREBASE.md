# Correção de Permissões do Firebase para Display

## Erro Atual
```
FirebaseError: Missing or insufficient permissions.
```

## Problema
A coleção `displays` precisa ser acessível para leitura pública (para o display ler as atualizações) e escrita autenticada ou pública (para o app cliente enviar imagens).

## Solução: Atualizar Regras do Firestore

No Firebase Console, vá para **Firestore Database > Rules** e adicione/atualize as regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para a coleção displays
    // Permite leitura pública e escrita (para permitir que o app cliente envie imagens)
    match /displays/{displayId} {
      // Permitir leitura para todos (o display precisa ler)
      allow read: if true;
      
      // Permitir escrita para todos (o app cliente precisa enviar imagens)
      // Em produção, você pode restringir com autenticação se necessário
      allow write: if true;
      
      // OU, para maior segurança, usar autenticação:
      // allow write: if request.auth != null;
    }
    
    // Suas outras regras existentes...
  }
}
```

## Alternativa Segura (Recomendada para Produção)

Se quiser mais segurança, você pode:

1. **Permitir leitura pública** (display precisa ler sem autenticação)
2. **Permitir escrita apenas com autenticação** ou **via Cloud Function**

```javascript
match /displays/{displayId} {
  // Leitura pública (display pode ler)
  allow read: if true;
  
  // Escrita apenas autenticada ou via Cloud Function
  allow write: if request.auth != null;
}
```

E então criar uma Cloud Function para permitir escrita do app cliente sem autenticação do usuário (mas com validação de origem, etc.).

## Como Aplicar

1. Acesse o Firebase Console
2. Vá em **Firestore Database > Rules**
3. Cole as regras acima
4. Clique em **Publish**

Após publicar, o erro de permissões deve desaparecer e o display conseguirá ler as atualizações.









