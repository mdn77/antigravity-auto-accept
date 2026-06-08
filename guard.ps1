# guard.ps1 — Автоматический страж модов Antigravity v1.0
# Отслеживает обновления app.asar и автоматически переустанавливает автокликер и русификатор
#
# Использование:
#   .\guard.ps1 -Install     Установить страж (автозапуск при входе в Windows)
#   .\guard.ps1 -Uninstall   Удалить страж полностью
#   .\guard.ps1 -Check       Одноразовая проверка и переустановка
#   .\guard.ps1 -Status      Показать текущий статус
#   .\guard.ps1              Режим наблюдения (используется автозапуском)

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Check,
    [switch]$Status
)

$ErrorActionPreference = "Continue"

# === ПУТИ ===
$GuardDir      = Join-Path $env:APPDATA "AntigravityGuard"
$MarkerFile    = Join-Path $GuardDir ".last_asar_time"
$LogFile       = Join-Path $GuardDir "guard.log"
$PidFile       = Join-Path $GuardDir ".guard.pid"
$StartupDir    = [Environment]::GetFolderPath("Startup")
$StartupScript = Join-Path $StartupDir "AntigravityGuard.vbs"
$MaxLogSizeKB  = 512

# === ЛОГИРОВАНИЕ ===
function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    if (-not (Test-Path $GuardDir)) {
        New-Item -ItemType Directory -Path $GuardDir -Force | Out-Null
    }
    # Ротация лога
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length / 1KB -gt $MaxLogSizeKB)) {
        $backup = "$LogFile.old"
        if (Test-Path $backup) { Remove-Item $backup -Force }
        Rename-Item $LogFile $backup -Force
    }
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

# === ПОИСК ANTIGRAVITY ===
function Find-AsarPath {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Programs\Antigravity\resources\app.asar"),
        "C:\Program Files\Antigravity\resources\app.asar",
        "C:\Program Files (x86)\Antigravity\resources\app.asar"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# === ПРОВЕРКА И ПЕРЕУСТАНОВКА ===
function Do-Check {
    $asarPath = Find-AsarPath
    if (-not $asarPath) {
        Write-Log "SKIP: Antigravity app.asar не найден"
        return $false
    }

    $currentTime = (Get-Item $asarPath).LastWriteTime.ToString("o")
    $lastKnown = ""
    if (Test-Path $MarkerFile) {
        $lastKnown = (Get-Content $MarkerFile -ErrorAction SilentlyContinue).Trim()
    }

    if ($currentTime -eq $lastKnown) {
        Write-Log "OK: моды на месте (asar не изменялся)"
        return $false
    }

    if ($lastKnown) {
        Write-Log "UPDATE: app.asar изменён! Переустановка модов..."
    } else {
        Write-Log "INIT: первая установка модов..."
    }

    # Проверка Node.js
    try {
        $nodeVer = (& node -v 2>&1).ToString().Trim()
        Write-Log "NODE: $nodeVer"
    } catch {
        Write-Log "ERROR: Node.js не найден в PATH! Установите Node.js: https://nodejs.org"
        return $false
    }

    $installJs = Join-Path $GuardDir "install.js"
    if (-not (Test-Path $installJs)) {
        Write-Log "ERROR: install.js не найден в $GuardDir"
        return $false
    }

    try {
        Push-Location $GuardDir
        $output = (& node install.js 2>&1) -join " | "
        Pop-Location

        if ($output -match "успешно") {
            Write-Log "INSTALL: моды успешно установлены"
        } else {
            Write-Log "INSTALL: $output"
        }

        # Сохраняем маркер с НОВЫМ временем (после модификации install.js)
        $newTime = (Get-Item $asarPath).LastWriteTime.ToString("o")
        Set-Content -Path $MarkerFile -Value $newTime
        Write-Log "MARKER: $newTime"
        return $true
    } catch {
        Pop-Location
        Write-Log "ERROR: Ошибка установки: $_"
        return $false
    }
}

# === РЕЖИМ НАБЛЮДЕНИЯ (FileSystemWatcher) ===
function Do-Watch {
    # Проверка единственного экземпляра
    if (Test-Path $PidFile) {
        $oldPid = (Get-Content $PidFile -ErrorAction SilentlyContinue).Trim()
        if ($oldPid -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
            Write-Log "WATCH: уже запущен (PID $oldPid), выход"
            return
        }
    }

    # Записываем наш PID
    if (-not (Test-Path $GuardDir)) {
        New-Item -ItemType Directory -Path $GuardDir -Force | Out-Null
    }
    Set-Content -Path $PidFile -Value $PID

    try {
        # Начальная проверка
        Do-Check | Out-Null

        $asarPath = Find-AsarPath
        if (-not $asarPath) {
            Write-Log "WATCH: app.asar не найден, ожидание установки Antigravity..."
            # Ждём появления Antigravity (проверка каждые 5 минут)
            while (-not $asarPath) {
                Start-Sleep -Seconds 300
                $asarPath = Find-AsarPath
            }
            Write-Log "WATCH: Antigravity обнаружен! $asarPath"
            Do-Check | Out-Null
        }

        $resourcesDir = Split-Path $asarPath
        $lastInstallTime = [datetime]::MinValue

        $watcher = [System.IO.FileSystemWatcher]::new()
        $watcher.Path = $resourcesDir
        $watcher.Filter = "app.asar"
        $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor `
                                [System.IO.NotifyFilters]::Size -bor `
                                [System.IO.NotifyFilters]::FileName

        Write-Log "WATCH: наблюдение за $resourcesDir\app.asar (PID $PID)"

        while ($true) {
            $result = $watcher.WaitForChanged(
                [System.IO.WatcherChangeTypes]::Changed -bor [System.IO.WatcherChangeTypes]::Created,
                60000  # таймаут 60с (для проверки что процесс жив)
            )

            if (-not $result.TimedOut) {
                # Дебаунс: пропускаем если мы только что устанавливали
                $elapsed = (Get-Date) - $lastInstallTime
                if ($elapsed.TotalSeconds -lt 30) {
                    continue
                }

                Write-Log "WATCH: обнаружено изменение app.asar, ожидание 15с..."
                Start-Sleep -Seconds 15

                $reinstalled = Do-Check
                if ($reinstalled) {
                    $lastInstallTime = Get-Date
                    Write-Log "WATCH: моды восстановлены после обновления!"
                }
            }
        }
    } finally {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

# === УСТАНОВКА СТРАЖА ===
function Do-Install {
    Write-Host ""
    Write-Host "=== Установка стража модов Antigravity ===" -ForegroundColor Cyan
    Write-Host ""

    # Создаём директорию
    if (-not (Test-Path $GuardDir)) {
        New-Item -ItemType Directory -Path $GuardDir -Force | Out-Null
    }

    # Определяем папку-источник
    $srcDir = $PSScriptRoot
    if (-not $srcDir) { $srcDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
    if (-not $srcDir) { $srcDir = (Get-Location).Path }

    # Копируем файлы
    $files = @("install.js", "autoclicker.js", "russify.js", "guard.ps1", "package.json")
    foreach ($f in $files) {
        $src = Join-Path $srcDir $f
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $GuardDir $f) -Force
            Write-Host "  + $f" -ForegroundColor Green
        } else {
            Write-Host "  - $f (не найден, пропуск)" -ForegroundColor Yellow
        }
    }

    # Создаём VBS-скрипт автозапуска (запускает PowerShell скрыто)
    $guardPs1 = Join-Path $GuardDir "guard.ps1"
    $q = '"'
    $vbsContent = "' AntigravityGuard - auto-reinstall mods after updates`r`n"
    $vbsContent += "Set WshShell = CreateObject($q" + 'WScript.Shell' + "$q)`r`n"
    $vbsContent += "WshShell.Run $q" + "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File $q$q" + $guardPs1 + "$q$q$q, 0, False`r`n"
    Set-Content -Path $StartupScript -Value $vbsContent -Encoding ASCII
    Write-Host "  + Автозапуск создан" -ForegroundColor Green

    Write-Host ""
    Write-Host "[OK] Страж установлен!" -ForegroundColor Green
    Write-Host "  Файлы:      $GuardDir" -ForegroundColor DarkGray
    Write-Host "  Автозапуск: при входе в Windows" -ForegroundColor DarkGray
    Write-Host "  Реакция:    мгновенно при изменении app.asar" -ForegroundColor DarkGray
    Write-Host "  Лог:        $LogFile" -ForegroundColor DarkGray
    Write-Host ""

    # Начальная проверка
    Do-Check | Out-Null

    # Запускаем наблюдатель в фоне
    Write-Host "Запуск наблюдателя в фоне..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$guardPs1`"" -WindowStyle Hidden
    Write-Host "Наблюдатель запущен." -ForegroundColor Green
    Write-Host ""
}

# === УДАЛЕНИЕ СТРАЖА ===
function Do-Uninstall {
    Write-Host ""
    Write-Host "=== Удаление стража модов ===" -ForegroundColor Yellow

    # Останавливаем наблюдатель
    if (Test-Path $PidFile) {
        $oldPid = (Get-Content $PidFile -ErrorAction SilentlyContinue).Trim()
        if ($oldPid) {
            Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue
            Write-Host "  Наблюдатель остановлен (PID $oldPid)"
        }
    }

    # Удаляем автозапуск
    if (Test-Path $StartupScript) {
        Remove-Item $StartupScript -Force
        Write-Host "  Автозапуск удалён"
    }

    # Удаляем директорию стража
    if (Test-Path $GuardDir) {
        Remove-Item $GuardDir -Recurse -Force
        Write-Host "  Файлы удалены"
    }

    Write-Host ""
    Write-Host "[OK] Страж полностью удалён" -ForegroundColor Green
    Write-Host "  Моды в текущей установке Antigravity сохранены." -ForegroundColor DarkGray
    Write-Host ""
}

# === СТАТУС ===
function Do-Status {
    Write-Host ""
    Write-Host "=== Статус стража модов Antigravity ===" -ForegroundColor Cyan
    Write-Host ""

    # Автозапуск
    if (Test-Path $StartupScript) {
        Write-Host "  Автозапуск:   установлен" -ForegroundColor Green
    } else {
        Write-Host "  Автозапуск:   НЕ установлен" -ForegroundColor Red
    }

    # Процесс наблюдателя
    $running = $false
    if (Test-Path $PidFile) {
        $oldPid = (Get-Content $PidFile -ErrorAction SilentlyContinue).Trim()
        if ($oldPid -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
            Write-Host "  Наблюдатель:  работает (PID $oldPid)" -ForegroundColor Green
            $running = $true
        }
    }
    if (-not $running) {
        Write-Host "  Наблюдатель:  НЕ запущен" -ForegroundColor Red
    }

    # Директория
    if (Test-Path $GuardDir) {
        Write-Host "  Директория:   $GuardDir" -ForegroundColor Green
    } else {
        Write-Host "  Директория:   НЕ найдена" -ForegroundColor Red
    }

    # app.asar
    $asarPath = Find-AsarPath
    if ($asarPath) {
        $asarTime = (Get-Item $asarPath).LastWriteTime.ToString("dd.MM.yyyy HH:mm:ss")
        Write-Host "  app.asar:     $asarTime" -ForegroundColor Cyan
    } else {
        Write-Host "  app.asar:     НЕ найден" -ForegroundColor Red
    }

    # Маркер
    if (Test-Path $MarkerFile) {
        $marker = (Get-Content $MarkerFile -ErrorAction SilentlyContinue).Trim()
        $markerDate = [datetime]::Parse($marker).ToString("dd.MM.yyyy HH:mm:ss")
        Write-Host "  Посл. патч:   $markerDate" -ForegroundColor Cyan
    }

    # Лог
    if (Test-Path $LogFile) {
        Write-Host ""
        Write-Host "  Последние записи лога:" -ForegroundColor DarkGray
        Get-Content $LogFile -Tail 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }

    Write-Host ""
}

# === ТОЧКА ВХОДА ===
if ($Install)        { Do-Install }
elseif ($Uninstall)  { Do-Uninstall }
elseif ($Check)      { Do-Check | Out-Null }
elseif ($Status)     { Do-Status }
else                 { Do-Watch }

