# install_auto.ps1 — Автоматический установщик автокликера и русификатора Antigravity
# Скачивает нужные файлы с GitHub, устанавливает моды и настраивает автоматическую
# переустановку после обновлений (страж).

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Antigravity Auto-Accept: Установка ===" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "[!] Node.js не установлен! Установите: https://nodejs.org"
    exit 1
}

# Временная папка
$tempDir = Join-Path $env:TEMP "antigravity-auto-accept-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

$baseUrl = "https://raw.githubusercontent.com/mdn77/antigravity-auto-accept/main"
$files = @("install.js", "install-ide.js", "autoclicker.js", "russify.js", "guard.ps1", "package.json")

Write-Host "[..] Загрузка файлов..." -ForegroundColor Cyan
foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $dest = Join-Path $tempDir $file
    Write-Host "  $file"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

Write-Host ""
Write-Host "[..] Установка для Chat 2.0..." -ForegroundColor Cyan
Push-Location $tempDir
try {
    node install.js

    Write-Host ""
    Write-Host "[..] Установка для IDE..." -ForegroundColor Cyan
    node install-ide.js

    # Установка стража (автоматическая переустановка после обновлений)
    Write-Host ""
    Write-Host "[..] Установка стража обновлений..." -ForegroundColor Cyan
    powershell -ExecutionPolicy Bypass -File (Join-Path $tempDir "guard.ps1") -Install

} finally {
    Pop-Location
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== Готово! Перезапустите Antigravity ===" -ForegroundColor Green
Write-Host "  Моды будут автоматически восстанавливаться после обновлений." -ForegroundColor DarkGray
Write-Host ""
