# Antigravity Russifier (Ветка: russify)

Этот инструмент полностью русифицирует интерфейс настроек безопасности, аккаунта, разрешений файлов/команд, моделей ИИ и параметров редактора на русский язык в **Antigravity Chat 2.0** и **Antigravity IDE**.

## Возможности
- 🇷🇺 **Полная русификация настроек** — переводит меню настроек безопасности, аккаунта, разрешений файлов/команд, моделей ИИ и параметров редактора на русский язык.
- ⚙️ **Динамический перевод** — отслеживает изменения DOM и работает с Shadow DOM и iframe.

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

## Лицензия
MIT
