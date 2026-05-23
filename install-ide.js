/**
 * install-ide.js — Установщик для Antigravity IDE (автокликер и русификатор отдельно)
 * 
 * IDE использует распакованную структуру (app/), а не app.asar.
 * Инъекция через <script> теги в workbench.html.
 * 
 * Использование:
 *   node install-ide.js                    — Установить всё (автокликер + русификатор)
 *   node install-ide.js --only-clicker     — Установить только автокликер
 *   node install-ide.js --only-russifier   — Установить только русификатор
 *   node install-ide.js --uninstall        — Удалить всё
 */

const fs = require('fs');
const path = require('path');

const MARKER_AC = '<!-- AntiG AutoClicker -->';
const MARKER_RU = '<!-- AntiG Russifier -->';

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

function findWorkbenchHtml(appDir) {
    const candidates = [
        path.join(appDir, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
        path.join(appDir, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return findFileRecursive(appDir, 'workbench.html', 3);
}

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

function install() {
    console.log('=== Установщик Antigravity IDE (Раздельный) ===\n');

    const onlyClicker = process.argv.includes('--only-clicker');
    const onlyRussifier = process.argv.includes('--only-russifier');
    const installClicker = !onlyRussifier;
    const installRussifier = !onlyClicker;

    const ide = findIDEPath();
    if (!ide) {
        console.error('ОШИБКА: Antigravity IDE не найдена!');
        process.exit(1);
    }

    if (ide.type !== 'unpacked') {
        console.error('ОШИБКА: IDE использует app.asar. Данный установщик рассчитан на unpacked.');
        process.exit(1);
    }

    const workbenchHtml = findWorkbenchHtml(ide.appDir);
    if (!workbenchHtml) {
        console.error('ОШИБКА: workbench.html не найден!');
        process.exit(1);
    }
    console.log('workbench.html найден:', workbenchHtml);

    const workbenchDir = path.dirname(workbenchHtml);
    const backupPath = workbenchHtml + '.backup';

    // 1. Создание бэкапа
    if (!fs.existsSync(backupPath)) {
        console.log('Создание бэкапа workbench.html...');
        fs.copyFileSync(workbenchHtml, backupPath);
    }

    let html = fs.readFileSync(workbenchHtml, 'utf8');

    // 2. Копирование и инъекция автокликера
    const acDst = path.join(workbenchDir, 'antig_autoclicker.js');
    if (installClicker) {
        console.log('Установка Автокликера...');
        const acSrc = path.join(__dirname, 'autoclicker.js');
        fs.copyFileSync(acSrc, acDst);
        console.log('  Скопирован:', acDst);

        if (!html.includes(MARKER_AC)) {
            const tag = `\n${MARKER_AC}\n<script src="./antig_autoclicker.js" defer></script>\n`;
            const pos = html.lastIndexOf('</html>');
            if (pos !== -1) {
                html = html.slice(0, pos) + tag + html.slice(pos);
            } else {
                html += tag;
            }
            console.log('  Добавлен тег автокликера в workbench.html');
        }
    } else {
        // Удаляем из html если был
        if (html.includes(MARKER_AC)) {
            const lines = html.split('\n');
            html = lines.filter(line => !line.includes('antig_autoclicker.js') && !line.includes(MARKER_AC)).join('\n');
            console.log('  Тег автокликера исключен/удален из html.');
        }
        if (fs.existsSync(acDst)) {
            fs.unlinkSync(acDst);
            console.log('  Удален старый файл автокликера.');
        }
    }

    // 3. Копирование и инъекция русификатора
    const ruDst = path.join(workbenchDir, 'antig_russify.js');
    if (installRussifier) {
        console.log('Установка Русификатора...');
        const ruSrc = path.join(__dirname, 'russify.js');
        fs.copyFileSync(ruSrc, ruDst);
        console.log('  Скопирован:', ruDst);

        if (!html.includes(MARKER_RU)) {
            const tag = `\n${MARKER_RU}\n<script src="./antig_russify.js" defer></script>\n`;
            const pos = html.lastIndexOf('</html>');
            if (pos !== -1) {
                html = html.slice(0, pos) + tag + html.slice(pos);
            } else {
                html += tag;
            }
            console.log('  Добавлен тег русификатора в workbench.html');
        }
    } else {
        // Удаляем из html если был
        if (html.includes(MARKER_RU)) {
            const lines = html.split('\n');
            html = lines.filter(line => !line.includes('antig_russify.js') && !line.includes(MARKER_RU)).join('\n');
            console.log('  Тег русификатора исключен/удален из html.');
        }
        if (fs.existsSync(ruDst)) {
            fs.unlinkSync(ruDst);
            console.log('  Удален старый файл русификатора.');
        }
    }

    fs.writeFileSync(workbenchHtml, html, 'utf8');
    console.log('\n=== Установка завершена! ===');
    console.log('Пожалуйста, перезапустите Antigravity IDE.');
}

function uninstall() {
    console.log('=== Удаление из Antigravity IDE ===\n');

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
    const acDst = path.join(path.dirname(workbenchHtml), 'antig_autoclicker.js');
    const ruDst = path.join(path.dirname(workbenchHtml), 'antig_russify.js');

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, workbenchHtml);
        console.log('workbench.html восстановлен из бэкапа.');
    } else {
        let html = fs.readFileSync(workbenchHtml, 'utf8');
        const lines = html.split('\n');
        html = lines.filter(line => 
            !line.includes('antig_autoclicker.js') && 
            !line.includes(MARKER_AC) &&
            !line.includes('antig_russify.js') &&
            !line.includes(MARKER_RU)
        ).join('\n');
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('Теги инъекции удалены из workbench.html.');
    }

    if (fs.existsSync(acDst)) {
        fs.unlinkSync(acDst);
        console.log('antig_autoclicker.js удален.');
    }
    if (fs.existsSync(ruDst)) {
        fs.unlinkSync(ruDst);
        console.log('antig_russify.js удален.');
    }

    console.log('\nУдаление успешно завершено!');
}

if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
