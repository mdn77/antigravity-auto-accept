# Antigravity Russifier (Ветка: russify, Версия 1.2.0)

Этот инструмент полностью русифицирует интерфейс настроек безопасности, аккаунта, разрешений файлов/команд, моделей ИИ и параметров редактора на русский язык в **Antigravity Chat 2.0** и **Antigravity IDE**.

## Совместимость
* **Antigravity Chat 2.0** (проверено на версии 2.0.6 и выше)
* **Antigravity IDE** (все версии, включая те, что используют панели агента/настроек `workbench-jetski-agent.html`)

## Возможности
- 🇷🇺 **Полная русификация настроек** — переводит меню настроек безопасности, аккаунта, разрешений файлов/команд, моделей ИИ и параметров редактора на русский язык.
- ⚙️ **Динамический перевод** — отслеживает изменения DOM, переводит контент в Shadow DOM и iframe.
- 🛡️ **Обход CSP** — автоматически модифицирует заголовки Content-Security-Policy для успешного выполнения скрипта в изолированных фреймах настроек.

---

## Инструкция для ИИ-агентов (Cascade, Antigravity, etc.)

ИИ-агенты могут выполнить русификацию одной командой:

1. Клонируйте репозиторий и перейдите на ветку `russify`:
   ```bash
   git clone -b russify https://github.com/mdn77/antigravity-auto-accept.git
   cd antigravity-auto-accept
   ```
2. Запустите установку:
   - **Для Chat 2.0:** `node install.js`
   - **Для IDE:** `node install-ide.js`
   - **Везде сразу:** `node install.js && node install-ide.js`
3. Сообщите пользователю о необходимости перезапустить приложение Antigravity.

---

## Установка вручную

### Требования
- Node.js 18+

### 1. Для Antigravity Chat 2.0 (Electron-приложение)
```bash
node install.js
```

### 2. Для Antigravity IDE
```bash
node install-ide.js
```

---

## Удаление
```bash
# Chat 2.0
node install.js --uninstall

# IDE
node install-ide.js --uninstall
```

## Как это работает

### Chat 2.0
Установщик распаковывает архив `app.asar`, копирует файл скрипта `antig_russify.js` в папку `dist/`, внедряет вызов `executeJavaScript` в `utils.js` на событие `did-finish-load` и собирает архив обратно.

### IDE
Установщик выполняет следующие действия:
1. Копирует скрипт `antig_russify.js` в папку `workbench`.
2. Внедряет тег `<script src="./antig_russify.js" defer></script>` в `workbench.html` и `workbench-jetski-agent.html` (отвечающий за настройки и панель агента).
3. Внедряет inline-код русификатора в `webview/index.html` с автоматической модификацией Content-Security-Policy заголовка для успешного обхода ограничений безопасности (CSP).

## Лицензия
MIT
