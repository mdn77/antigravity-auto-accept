# install_auto.ps1 — Автоматический установщик автокликера и русификатора Antigravity
# Скачивает нужные файлы с GitHub во временную папку и запускает установку.

$ErrorActionPreference = "Stop"

# Проверка наличия Node.js
try {
    $nodeVersion = node -v
    Write-Host "[AC] Найдена Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "[AC] ОШИБКА: Node.js не установлен! Установите Node.js (https://nodejs.org) перед запуском."
    exit 1
}

# Временная папка
$tempDir = Join-Path $env:TEMP "antigravity-auto-accept-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

$baseUrl = "https://raw.githubusercontent.com/mdn77/antigravity-auto-accept/main"
$files = @("install.js", "install-ide.js", "autoclicker.js", "russify.js")

Write-Host "[AC] Загрузка файлов установки..." -ForegroundColor Cyan
foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $dest = Join-Path $tempDir $file
    Write-Host "  Скачивание $file..."
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

Write-Host "[AC] Запуск установки для Antigravity Chat 2.0 (install.js)..." -ForegroundColor Cyan
Push-Location $tempDir
try {
    node install.js
    Write-Host "[AC] Запуск установки для Antigravity IDE (install-ide.js)..." -ForegroundColor Cyan
    node install-ide.js
} finally {
    Pop-Location
    # Очистка
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
