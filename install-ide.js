/**
 * install-ide.js — Установщик русификатора для Antigravity IDE (ветка russify)
 * 
 * IDE использует распакованную структуру (app/), а не app.asar.
 * Инъекция через <script> тег в workbench.html.
 * Автоматически отключает проверку целостности (checksums) в product.json.
 * Интегрирует перевод настроек и других Webview фреймов.
 * 
 * Использование:
 *   node install-ide.js              — Установить русификатор
 *   node install-ide.js --uninstall  — Удалить русификатор
 */

const fs = require('fs');
const path = require('path');

const MARKER = '<!-- AntiG Russifier -->';
const MARKER_WV = '<!-- AntiG Webview Russifier -->';

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
    console.log('=== Установщик Русификатора для Antigravity IDE ===\n');

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
    const ruDst = path.join(workbenchDir, 'antig_russify.js');

    // 1. Бэкап workbench.html
    if (!fs.existsSync(backupPath)) {
        console.log('Создание бэкапа workbench.html...');
        fs.copyFileSync(workbenchHtml, backupPath);
    }

    // 2. Копирование русификатора в workbench
    console.log('Установка Русификатора...');
    const ruSrc = path.join(__dirname, 'russify.js');
    fs.copyFileSync(ruSrc, ruDst);
    console.log('  Скопирован:', ruDst);

    // 3. Инъекция в workbench.html
    let html = fs.readFileSync(workbenchHtml, 'utf8');
    if (!html.includes(MARKER)) {
        const tag = `\n${MARKER}\n<script src="./antig_russify.js" defer></script>\n`;
        const pos = html.lastIndexOf('</html>');
        if (pos !== -1) {
            html = html.slice(0, pos) + tag + html.slice(pos);
        } else {
            html += tag;
        }
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('  Тег добавлен в workbench.html');
    }

    // 4. Патч webview index.html для русификации настроек
    const webviewIndexHtml = path.join(ide.appDir, 'out', 'vs', 'workbench', 'contrib', 'webview', 'browser', 'pre', 'index.html');
    if (fs.existsSync(webviewIndexHtml)) {
        const webviewBackupPath = webviewIndexHtml + '.backup';
        const webviewRuDst = path.join(path.dirname(webviewIndexHtml), 'antig_russify.js');
        
        // Бэкап
        if (!fs.existsSync(webviewBackupPath)) {
            fs.copyFileSync(webviewIndexHtml, webviewBackupPath);
            console.log('Создан бэкап webview/index.html...');
        }
        // Копирование
        fs.copyFileSync(ruSrc, webviewRuDst);
        console.log('  Скопирован русификатор для webview:', webviewRuDst);
        // Инъекция
        let wvh = fs.readFileSync(webviewIndexHtml, 'utf8');
        if (!wvh.includes(MARKER_WV)) {
            const tag = `\n\t${MARKER_WV}\n\t<script src="./antig_russify.js"></script>\n`;
            wvh = wvh.replace('</head>', `${tag}</head>`);
            fs.writeFileSync(webviewIndexHtml, wvh, 'utf8');
            console.log('  Добавлен тег русификатора в webview/index.html');
        }
    }

    // 5. Патч product.json для отключения предупреждения о контрольных суммах
    try {
        const productJsonPath = path.join(ide.resourcesDir, 'app', 'product.json');
        if (fs.existsSync(productJsonPath)) {
            const backupProduct = productJsonPath + '.backup';
            if (!fs.existsSync(backupProduct)) {
                fs.copyFileSync(productJsonPath, backupProduct);
                console.log('Создан бэкап product.json...');
            }
            let data = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
            if (data.checksums && Object.keys(data.checksums).length > 0) {
                data.checksums = {};
                fs.writeFileSync(productJsonPath, JSON.stringify(data, null, '\t'), 'utf8');
                console.log('Проверка контрольных сумм отключена в product.json (решает ошибку «установка повреждена»).');
            }
        }
    } catch (e) {
        console.log('Не удалось модифицировать product.json:', e.message);
    }

    console.log('\n=== Установка русификатора завершена! ===');
}

function uninstall() {
    console.log('=== Удаление Русификатора из Antigravity IDE ===\n');

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
    const backupProduct = path.join(ide.resourcesDir, 'app', 'product.json.backup');
    const productJsonPath = path.join(ide.resourcesDir, 'app', 'product.json');
    const ruDst = path.join(path.dirname(workbenchHtml), 'antig_russify.js');

    // Восстановление workbench.html
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, workbenchHtml);
        console.log('workbench.html восстановлен из бэкапа.');
    } else {
        let html = fs.readFileSync(workbenchHtml, 'utf8');
        const lines = html.split('\n');
        html = lines.filter(line => !line.includes('antig_russify.js') && !line.includes(MARKER)).join('\n');
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('Теги инъекции удалены из workbench.html.');
    }

    // Восстановление webview index.html
    const webviewIndexHtml = path.join(ide.appDir, 'out', 'vs', 'workbench', 'contrib', 'webview', 'browser', 'pre', 'index.html');
    const webviewBackupPath = webviewIndexHtml + '.backup';
    const webviewRuDst = path.join(path.dirname(webviewIndexHtml), 'antig_russify.js');

    if (fs.existsSync(webviewBackupPath)) {
        fs.copyFileSync(webviewBackupPath, webviewIndexHtml);
        console.log('webview/index.html восстановлен из бэкапа.');
    } else if (fs.existsSync(webviewIndexHtml)) {
        let wvh = fs.readFileSync(webviewIndexHtml, 'utf8');
        const lines = wvh.split('\n');
        wvh = lines.filter(line => !line.includes('antig_russify.js') && !line.includes(MARKER_WV)).join('\n');
        fs.writeFileSync(webviewIndexHtml, wvh, 'utf8');
        console.log('Теги инъекции удалены из webview/index.html.');
    }

    if (fs.existsSync(webviewRuDst)) {
        fs.unlinkSync(webviewRuDst);
        console.log('antig_russify.js удален из webview.');
    }

    // Восстановление product.json
    if (fs.existsSync(backupProduct)) {
        fs.copyFileSync(backupProduct, productJsonPath);
        console.log('product.json восстановлен из оригинального бэкапа.');
    }

    if (fs.existsSync(ruDst)) {
        fs.unlinkSync(ruDst);
        console.log('antig_russify.js удален.');
    }

    console.log('\nУдаление русификатора успешно завершено!');
}

if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
