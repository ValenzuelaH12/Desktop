# Script de sincronización automática para HotelOps Pro
$GIT_PATH = "C:\Program Files\Git\bin\git.exe"

Write-Host "Sincronizando con GitHub..." -ForegroundColor Cyan

& $GIT_PATH add .
& $GIT_PATH commit -m "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
& $GIT_PATH push origin master

Write-Host "¡Sincronización completada!" -ForegroundColor Green
