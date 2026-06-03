# Antigravity Tools: Auto-Accept & Russifier (Версия 1.2.0)

Репозиторий содержит два раздельных инструмента для **Antigravity Chat 2.0** и **Antigravity IDE**:

1. 🔵 **Автокликер (`autoclicker.js`)** — автоматически нажимает кнопки Submit/Отправить, Retry/Повторить, Accept/Разрешить, а также содержит виджет управления в правом нижнем углу и логику обхода проектов. Не содержит кода перевода интерфейса.
2. 🇷🇺 **Русификатор (`russify.js`)** — полностью переводит весь интерфейс настроек безопасности, аккаунта, разрешений файлов/команд, моделей ИИ и параметров редактора на русский язык (включая контент в Shadow DOM, iframe и панели настроек агента `workbench-jetski-agent.html` с полным обходом CSP). Не содержит кода автокликера.

## Совместимость
* **Antigravity Chat 2.0** (проверено на версии 2.0.6 и выше)
* **Antigravity IDE** (все версии, включая те, что используют панели агента/настроек `workbench-jetski-agent.html`)

Вы можете установить только один из них или оба вместе.

---

## Инструкция для ИИ-агентов (Cascade, Antigravity, etc.)

ИИ-агенты могут выполнить установку одной командой:

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/mdn77/antigravity-auto-accept.git
   cd antigravity-auto-accept
   ```
2. Запустите установку в зависимости от пожеланий пользователя:
   - **Установить ВСЁ (Автокликер + Русификатор):**
     ```bash
     node install.js && node install-ide.js
     ```
   - **Установить ТОЛЬКО автокликер:**
     ```bash
     node install.js --only-clicker && node install-ide.js --only-clicker
     ```
   - **Установить ТОЛЬКО русификатор:**
     ```bash
     node install.js --only-russifier && node install-ide.js --only-russifier
     ```
3. Сообщите пользователю о необходимости перезапустить приложение Antigravity.

---

## Установка

### Автоматическая установка (Рекомендуется для Windows)
Вы можете установить оба инструмента (автокликер и русификатор) одной командой в PowerShell:
```powershell
powershell -c "irm https://raw.githubusercontent.com/mdn77/antigravity-auto-accept/main/install_auto.ps1 | iex"
```

## Установка вручную

### Требования
- Node.js 18+
- Установленный Antigravity Chat 2.0 и/или Antigravity IDE

### 1. Для Antigravity Chat 2.0 (Electron-приложение)
Перейдите в папку склонированного репозитория и выполните:
```bash
# Установка всего вместе
node install.js

# Установка только автокликера (без перевода настроек)
node install.js --only-clicker

# Установка только русификатора (без автокликера)
node install.js --only-russifier
```

### 2. Для Antigravity IDE
Выполните:
```bash
# Установка всего вместе
node install-ide.js

# Установка только автокликера (без перевода настроек)
node install-ide.js --only-clicker

# Установка только русификатора (без автокликера)
node install-ide.js --only-russifier
```

---

## Удаление

Восстановление оригинальных файлов из резервных копий:
```bash
# Для Chat 2.0
node install.js --uninstall

# Для IDE
node install-ide.js --uninstall
```

## Как это работает

### Chat 2.0
Установщик распаковывает архив `app.asar`, копирует выбранные файлы скриптов (`antig_autoclicker.js` и/или `antig_russify.js`) в папку `dist/`, внедряет вызовы `executeJavaScript` в `utils.js` на событие `did-finish-load` и собирает архив обратно.

### IDE
Установщик выполняет следующие действия:
1. Копирует скрипты в папку `workbench`.
2. Внедряет теги `<script src="./antig_autoclicker.js" defer></script>` и/или `<script src="./antig_russify.js" defer></script>` в `workbench.html` и `workbench-jetski-agent.html` (отвечающий за настройки и панель агента).
3. Внедряет inline-код русификатора в `webview/index.html` с автоматической модификацией Content-Security-Policy заголовка для успешного обхода ограничений безопасности (CSP).

## Лицензия
MIT
