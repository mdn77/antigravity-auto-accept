/**
 * install-ide.js — Установщик автокликера для Antigravity IDE (ветка autoclicker)
 * 
 * IDE использует распакованную структуру (app/), а не app.asar.
 * Инъекция через <script> тег в workbench.html.
 * 
 * Использование:
 *   node install-ide.js              — Установить автокликер
 *   node install-ide.js --uninstall  — Удалить автокликер
 */

const fs = require('fs');
const path = require('path');

const MARKER = '<!-- AntiG AutoClicker -->';

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
    console.log('=== Установщик Автокликера для Antigravity IDE ===\n');

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
    const acDst = path.join(workbenchDir, 'antig_autoclicker.js');

    // 1. Бэкап
    if (!fs.existsSync(backupPath)) {
        console.log('Создание бэкапа workbench.html...');
        fs.copyFileSync(workbenchHtml, backupPath);
    }

    // 2. Копирование автокликера
    console.log('Установка Автокликера...');
    const acSrc = path.join(__dirname, 'autoclicker.js');
    fs.copyFileSync(acSrc, acDst);
    console.log('  Скопирован:', acDst);

    // 3. Инъекция
    let html = fs.readFileSync(workbenchHtml, 'utf8');
    if (!html.includes(MARKER)) {
        const tag = `\n${MARKER}\n<script src="./antig_autoclicker.js" defer></script>\n`;
        const pos = html.lastIndexOf('</html>');
        if (pos !== -1) {
            html = html.slice(0, pos) + tag + html.slice(pos);
        } else {
            html += tag;
        }
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('  Тег добавлен в workbench.html');
    }

    console.log('\n=== Установка автокликера завершена! ===');
}

function uninstall() {
    console.log('=== Удаление Автокликера из Antigravity IDE ===\n');

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

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, workbenchHtml);
        console.log('workbench.html восстановлен из бэкапа.');
    } else {
        let html = fs.readFileSync(workbenchHtml, 'utf8');
        const lines = html.split('\n');
        html = lines.filter(line => !line.includes('antig_autoclicker.js') && !line.includes(MARKER)).join('\n');
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('Теги инъекции удалены из workbench.html.');
    }

    if (fs.existsSync(acDst)) {
        fs.unlinkSync(acDst);
        console.log('antig_autoclicker.js удален.');
    }

    console.log('\nУдаление автокликера успешно завершено!');
}

if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
