/**
 * install-ide.js — Установщик автокликера для Antigravity IDE
 * 
 * IDE использует распакованную структуру (app/), а не app.asar.
 * Инъекция через <script> тег в workbench.html.
 * 
 * Использование:
 *   node install-ide.js              — Установить
 *   node install-ide.js --uninstall  — Удалить (восстановить из бэкапа)
 */

const fs = require('fs');
const path = require('path');

// Маркер для поиска инъекции
const MARKER = '<!-- AntiG AutoClicker -->';

// Поиск директории ресурсов IDE
function findIDEPath() {
    const platform = process.platform;
    const paths = [];

    if (platform === 'win32') {
        paths.push(
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity IDE', 'resources'),
            path.join('C:', 'Program Files', 'Antigravity IDE', 'resources'),
            path.join('C:', 'Program Files (x86)', 'Antigravity IDE', 'resources')
        );
    } else if (platform === 'darwin') {
        paths.push('/Applications/Antigravity IDE.app/Contents/Resources');
    } else {
        paths.push(
            '/opt/Antigravity IDE/resources',
            '/usr/lib/antigravity-ide/resources',
            path.join(process.env.HOME || '', '.local', 'share', 'antigravity-ide', 'resources')
        );
    }

    for (const p of paths) {
        // IDE может использовать app/ (распакованная) или app.asar
        const appDir = path.join(p, 'app');
        const appAsar = path.join(p, 'app.asar');
        if (fs.existsSync(appDir) && fs.statSync(appDir).isDirectory()) {
            return { resourcesDir: p, type: 'unpacked', appDir };
        }
        if (fs.existsSync(appAsar)) {
            return { resourcesDir: p, type: 'asar', appAsar };
        }
    }
    return null;
}

// Поиск workbench.html в распакованной структуре
function findWorkbenchHtml(appDir) {
    const candidates = [
        path.join(appDir, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
        path.join(appDir, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    // Рекурсивный поиск
    const found = findFileRecursive(appDir, 'workbench.html', 3);
    return found;
}

// Рекурсивный поиск файла (с ограничением глубины)
function findFileRecursive(dir, name, maxDepth, depth = 0) {
    if (depth > maxDepth) return null;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isFile() && entry.name === name) return full;
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                const found = findFileRecursive(full, name, maxDepth, depth + 1);
                if (found) return found;
            }
        }
    } catch {}
    return null;
}

// Установка
function install() {
    console.log('=== Установщик AutoClick для Antigravity IDE ===\n');

    const ide = findIDEPath();
    if (!ide) {
        console.error('ОШИБКА: Antigravity IDE не найдена!');
        console.log('Убедитесь, что IDE установлена.');
        process.exit(1);
    }

    console.log('Тип:', ide.type);
    console.log('Путь:', ide.resourcesDir);

    if (ide.type !== 'unpacked') {
        console.error('ОШИБКА: IDE использует app.asar. Используйте install.js для asar-инсталляции.');
        process.exit(1);
    }

    // Шаг 1: Находим workbench.html
    const workbenchHtml = findWorkbenchHtml(ide.appDir);
    if (!workbenchHtml) {
        console.error('ОШИБКА: workbench.html не найден!');
        process.exit(1);
    }
    console.log('workbench.html:', workbenchHtml);

    const workbenchDir = path.dirname(workbenchHtml);
    const backupPath = workbenchHtml + '.backup';
    const autoclickerDst = path.join(workbenchDir, 'antig_autoclicker.js');

    // Шаг 2: Бэкап
    if (!fs.existsSync(backupPath)) {
        console.log('\n[1/3] Создание бэкапа workbench.html...');
        fs.copyFileSync(workbenchHtml, backupPath);
        console.log('  Бэкап:', backupPath);
    } else {
        console.log('\n[1/3] Бэкап уже существует.');
    }

    // Шаг 3: Копируем autoclicker.js
    console.log('[2/3] Копирование автокликера...');
    const autoclickerSrc = path.join(__dirname, 'autoclicker.js');
    fs.copyFileSync(autoclickerSrc, autoclickerDst);
    console.log('  Скопирован:', autoclickerDst);

    // Шаг 4: Инъекция в workbench.html
    console.log('[3/3] Инъекция в workbench.html...');
    let html = fs.readFileSync(workbenchHtml, 'utf8');

    if (html.includes(MARKER)) {
        console.log('  Инъекция уже присутствует — обновляем скрипт.');
    } else {
        // Вставляем перед </html>
        const scriptTag = `\n${MARKER}\n<script src="./antig_autoclicker.js" defer></script>\n`;
        const insertPos = html.lastIndexOf('</html>');
        if (insertPos !== -1) {
            html = html.slice(0, insertPos) + scriptTag + html.slice(insertPos);
        } else {
            html += scriptTag;
        }
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('  Тег <script> добавлен в workbench.html');
    }

    console.log('\n=== Установка завершена! ===');
    console.log('Перезапустите Antigravity IDE.');
    console.log('Виджет AutoClick появится в правом нижнем углу.\n');
}

// Удаление
function uninstall() {
    console.log('=== Удаление AutoClick из Antigravity IDE ===\n');

    const ide = findIDEPath();
    if (!ide || ide.type !== 'unpacked') {
        console.error('ОШИБКА: Antigravity IDE не найдена!');
        process.exit(1);
    }

    const workbenchHtml = findWorkbenchHtml(ide.appDir);
    if (!workbenchHtml) {
        console.error('ОШИБКА: workbench.html не найден!');
        process.exit(1);
    }

    const backupPath = workbenchHtml + '.backup';
    const autoclickerPath = path.join(path.dirname(workbenchHtml), 'antig_autoclicker.js');

    // Восстанавливаем из бэкапа
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, workbenchHtml);
        console.log('workbench.html восстановлен из бэкапа.');
    } else {
        // Ручное удаление инъекции
        let html = fs.readFileSync(workbenchHtml, 'utf8');
        const markerIdx = html.indexOf(MARKER);
        if (markerIdx !== -1) {
            const endIdx = html.indexOf('</script>', markerIdx);
            if (endIdx !== -1) {
                html = html.slice(0, markerIdx) + html.slice(endIdx + '</script>\n'.length);
                fs.writeFileSync(workbenchHtml, html, 'utf8');
                console.log('Инъекция удалена из workbench.html.');
            }
        }
    }

    // Удаляем файл автокликера
    if (fs.existsSync(autoclickerPath)) {
        fs.unlinkSync(autoclickerPath);
        console.log('antig_autoclicker.js удалён.');
    }

    console.log('\nУдаление завершено! Перезапустите IDE.\n');
}

// Точка входа
if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
