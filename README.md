# Antigravity Auto-Accept (Ветка: autoclicker)

Этот инструмент автоматически принимает диалоги подтверждения, выполняет повторы при ошибках генерации/сети и автоматически отправляет запросы в **Antigravity Chat 2.0** и **Antigravity IDE**.

## Возможности
- ✅ **Автоклик Submit/Отправить/Send** — нажимает кнопку отправки сообщений.
- 🔄 **Автоповтор Retry/Повторить** — при ошибках сети (с настраиваемым лимитом попыток).
- 🛡️ **Accept/Разрешить** — автоматически принимает диалоги подтверждения команд и разрешений.
- 🔵 **Обход проектов** — переключается между проектами с синими индикаторами активности.
- ⏸️ **Пауза при активности** — приостанавливает клики при действиях пользователя для комфортной работы.

---

## Инструкция для ИИ-агентов (Cascade, Antigravity, etc.)

ИИ-агенты могут выполнить установку автокликера одной командой:

1. Клонируйте репозиторий и перейдите на ветку `autoclicker`:
   ```bash
   git clone -b autoclicker https://github.com/mdn77/antigravity-auto-accept.git
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
