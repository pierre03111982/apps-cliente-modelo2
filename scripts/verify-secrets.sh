#!/bin/bash
# Script de verificação de credenciais expostas
# Uso: ./scripts/verify-secrets.sh

set -e

echo "🔍 Verificando credenciais expostas no repositório..."
echo ""

ERRORS=0

# Verificar arquivos .env sendo rastreados
echo "1. Verificando arquivos .env sendo rastreados pelo Git..."
if git ls-files | grep -q "\.env"; then
  echo "❌ ERRO: Arquivos .env estão sendo rastreados pelo Git!"
  git ls-files | grep "\.env"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Nenhum arquivo .env sendo rastreado"
fi
echo ""

# Verificar chaves do Google Cloud hardcoded
echo "2. Verificando chaves do Google Cloud (AIzaSy) no código..."
if grep -r "AIzaSy[A-Za-z0-9_-]\{35\}" src/ 2>/dev/null | grep -v ".md" | grep -v ".example"; then
  echo "❌ ERRO: Chaves do Google Cloud encontradas no código!"
  grep -r "AIzaSy[A-Za-z0-9_-]\{35\}" src/ 2>/dev/null | grep -v ".md" | grep -v ".example"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Nenhuma chave do Google Cloud encontrada no código"
fi
echo ""

# Verificar tokens secretos
echo "3. Verificando tokens secretos (sk-) no código..."
if grep -r "sk-[A-Za-z0-9]\{32,\}" src/ 2>/dev/null | grep -v ".md" | grep -v ".example"; then
  echo "❌ ERRO: Tokens secretos encontrados no código!"
  grep -r "sk-[A-Za-z0-9]\{32,\}" src/ 2>/dev/null | grep -v ".md" | grep -v ".example"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Nenhum token secreto encontrado no código"
fi
echo ""

# Verificar arquivos de credenciais JSON
echo "4. Verificando arquivos de credenciais JSON sendo rastreados..."
if git ls-files | grep -E "(service-account|credentials|gcp-key|firebase-admin).*\.json$"; then
  echo "❌ ERRO: Arquivos de credenciais JSON estão sendo rastreados!"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Nenhum arquivo de credenciais JSON sendo rastreado"
fi
echo ""

# Verificar arquivos .pem e .key
echo "5. Verificando arquivos .pem e .key sendo rastreados..."
if git ls-files | grep -E "\.(pem|key|p12|pfx)$"; then
  echo "❌ ERRO: Arquivos de chave (.pem, .key) estão sendo rastreados!"
  ERRORS=$((ERRORS + 1))
else
  echo "✅ Nenhum arquivo de chave sendo rastreado"
fi
echo ""

# Resultado final
if [ $ERRORS -eq 0 ]; then
  echo "✅ Verificação concluída: Nenhuma credencial exposta encontrada!"
  exit 0
else
  echo "❌ Verificação concluída: $ERRORS erro(s) encontrado(s)!"
  echo ""
  echo "⚠️  AÇÃO NECESSÁRIA:"
  echo "   - Remova os arquivos sensíveis do Git"
  echo "   - Adicione-os ao .gitignore"
  echo "   - Regenerar credenciais comprometidas"
  exit 1
fi

