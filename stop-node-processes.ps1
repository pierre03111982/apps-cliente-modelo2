# Script para parar processos Node.js de desenvolvimento
# Não para processos do Cursor (editor)

Write-Host "=== Parando processos Node.js de desenvolvimento ===" -ForegroundColor Cyan

# Encontrar processos Node.js que NÃO são do Cursor
$devProcesses = Get-Process | Where-Object {
    $_.ProcessName -eq "node" -and 
    $_.Path -notlike "*cursor*" -and
    $_.Path -notlike "*Program Files*"
}

if ($devProcesses.Count -eq 0) {
    Write-Host "`n✅ Nenhum processo de desenvolvimento encontrado!" -ForegroundColor Green
    Write-Host "Todos os processos Node.js são do Cursor (editor) e devem continuar rodando." -ForegroundColor Yellow
} else {
    Write-Host "`nProcessos encontrados:" -ForegroundColor Yellow
    $devProcesses | Select-Object Id, Path | Format-Table -AutoSize
    
    Write-Host "`nParando processos..." -ForegroundColor Yellow
    $devProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            Write-Host "✅ Processo $($_.Id) parado com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao parar processo $($_.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Verificando portas ===" -ForegroundColor Cyan
$port3005 = netstat -ano | findstr ":3005" | findstr "LISTENING"
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"

if ($port3005) {
    Write-Host "⚠️  Porta 3005 ainda em uso:" -ForegroundColor Yellow
    Write-Host $port3005
} else {
    Write-Host "✅ Porta 3005 livre" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "⚠️  Porta 3000 ainda em uso:" -ForegroundColor Yellow
    Write-Host $port3000
} else {
    Write-Host "✅ Porta 3000 livre" -ForegroundColor Green
}

Write-Host "`n=== Concluído ===" -ForegroundColor Cyan













