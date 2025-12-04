# Script de verificação de credenciais expostas (PowerShell)
# Uso: .\scripts\verify-secrets.ps1

$ErrorActionPreference = "Stop"
$errors = 0

Write-Host "🔍 Verificando credenciais expostas no repositório..." -ForegroundColor Cyan
Write-Host ""

# Verificar arquivos .env sendo rastreados
Write-Host "1. Verificando arquivos .env sendo rastreados pelo Git..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String "\.env"
if ($envFiles) {
    Write-Host "❌ ERRO: Arquivos .env estão sendo rastreados pelo Git!" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    $errors++
} else {
    Write-Host "✅ Nenhum arquivo .env sendo rastreado" -ForegroundColor Green
}
Write-Host ""

# Verificar chaves do Google Cloud hardcoded
Write-Host "2. Verificando chaves do Google Cloud (AIzaSy) no código..." -ForegroundColor Yellow
$gcpKeys = Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "AIzaSy[A-Za-z0-9_-]{35}" | Where-Object { $_.Path -notmatch "\.(md|example)$" }
if ($gcpKeys) {
    Write-Host "❌ ERRO: Chaves do Google Cloud encontradas no código!" -ForegroundColor Red
    $gcpKeys | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line)" -ForegroundColor Red }
    $errors++
} else {
    Write-Host "✅ Nenhuma chave do Google Cloud encontrada no código" -ForegroundColor Green
}
Write-Host ""

# Verificar tokens secretos
Write-Host "3. Verificando tokens secretos (sk-) no código..." -ForegroundColor Yellow
$secrets = Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "sk-[A-Za-z0-9]{32,}" | Where-Object { $_.Path -notmatch "\.(md|example)$" }
if ($secrets) {
    Write-Host "❌ ERRO: Tokens secretos encontrados no código!" -ForegroundColor Red
    $secrets | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line)" -ForegroundColor Red }
    $errors++
} else {
    Write-Host "✅ Nenhum token secreto encontrado no código" -ForegroundColor Green
}
Write-Host ""

# Verificar arquivos de credenciais JSON
Write-Host "4. Verificando arquivos de credenciais JSON sendo rastreados..." -ForegroundColor Yellow
$jsonFiles = git ls-files | Select-String -Pattern "(service-account|credentials|gcp-key|firebase-admin).*\.json$"
if ($jsonFiles) {
    Write-Host "❌ ERRO: Arquivos de credenciais JSON estão sendo rastreados!" -ForegroundColor Red
    $jsonFiles | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    $errors++
} else {
    Write-Host "✅ Nenhum arquivo de credenciais JSON sendo rastreado" -ForegroundColor Green
}
Write-Host ""

# Verificar arquivos .pem e .key
Write-Host "5. Verificando arquivos .pem e .key sendo rastreados..." -ForegroundColor Yellow
$keyFiles = git ls-files | Select-String -Pattern "\.(pem|key|p12|pfx)$"
if ($keyFiles) {
    Write-Host "❌ ERRO: Arquivos de chave (.pem, .key) estão sendo rastreados!" -ForegroundColor Red
    $keyFiles | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    $errors++
} else {
    Write-Host "✅ Nenhum arquivo de chave sendo rastreado" -ForegroundColor Green
}
Write-Host ""

# Resultado final
if ($errors -eq 0) {
    Write-Host "✅ Verificação concluída: Nenhuma credencial exposta encontrada!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Verificação concluída: $errors erro(s) encontrado(s)!" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  AÇÃO NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host "   - Remova os arquivos sensíveis do Git" -ForegroundColor Yellow
    Write-Host "   - Adicione-os ao .gitignore" -ForegroundColor Yellow
    Write-Host "   - Regenerar credenciais comprometidas" -ForegroundColor Yellow
    exit 1
}






