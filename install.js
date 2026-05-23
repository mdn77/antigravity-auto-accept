/**
 * install.js - Установщик для Antigravity (автокликер и русификатор отдельно)
 * 
 * Внедряет выбранные скрипты в app.asar текстового редактора Antigravity Chat 2.0.
 * 
 * Использование:
 *   node install.js                    - Установить всё (автокликер + русификатор)
 *   node install.js --only-clicker     - Установить только автокликер
 *   node install.js --only-russifier   - Установить только русификатор
 *   node install.js --uninstall        - Восстановить оригинальный app.asar из бэкапа
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findAntigravityPath() {
    const platform = process.platform;
    const possiblePaths = [];

    if (platform === 'win32') {
        possiblePaths.push(
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity', 'resources'),
            path.join('C:', 'Program Files', 'Antigravity', 'resources'),
            path.join('C:', 'Program Files (x86)', 'Antigravity', 'resources')
        );
    } else if (platform === 'darwin') {
        possiblePaths.push(
            '/Applications/Antigravity.app/Contents/Resources'
        );
    } else {
        possiblePaths.push(
            '/opt/Antigravity/resources',
            '/usr/lib/antigravity/resources',
            path.join(process.env.HOME || '', '.local', 'share', 'antigravity', 'resources')
        );
    }

    for (const p of possiblePaths) {
        const asarPath = path.join(p, 'app.asar');
        if (fs.existsSync(asarPath)) {
            return p;
        }
    }
    return null;
}

function install() {
    console.log('=== Установщик Antigravity Chat 2.0 (Раздельный) ===\n');

    const onlyClicker = process.argv.includes('--only-clicker');
    const onlyRussifier = process.argv.includes('--only-russifier');
    const installClicker = !onlyRussifier;
    const installRussifier = !onlyClicker;

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');
    const extractDir = path.join(resourcesDir, '_asar_temp');

    console.log('Путь Antigravity:', resourcesDir);

    // 1. Создание бэкапа
    if (!fs.existsSync(backupPath)) {
        console.log('Создание резервной копии app.asar...');
        fs.copyFileSync(asarPath, backupPath);
    }

    // 2. Распаковка
    console.log('Распаковка app.asar...');
    try {
        execSync(`npx -y @electron/asar extract "${asarPath}" "${extractDir}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('ОШИБКА: Не удалось извлечь архив asar.');
        process.exit(1);
    }

    const utilsPath = path.join(extractDir, 'dist', 'utils.js');
    if (!fs.existsSync(utilsPath)) {
        console.error('ОШИБКА: dist/utils.js не найден внутри app.asar!');
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.exit(1);
    }

    let utilsContent = fs.readFileSync(utilsPath, 'utf8');

    // Ищем обработчик did-finish-load или loadURL для инъекции
    const didFinishMarker = "win.webContents.on('did-finish-load'";
    const markerPos = utilsContent.indexOf(didFinishMarker);

    // 3. Обработка Автокликера
    const acDst = path.join(extractDir, 'dist', 'antig_autoclicker.js');
    if (installClicker) {
        console.log('Установка Автокликера...');
        const acSrc = path.join(__dirname, 'autoclicker.js');
        fs.copyFileSync(acSrc, acDst);

        if (!utilsContent.includes('antig_autoclicker.js')) {
            const injectionCode = `
    // --- Автокликер Auto-Accept ---
    win.webContents.on('did-finish-load', () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const acPath = path.join(__dirname, 'antig_autoclicker.js');
            if (fs.existsSync(acPath)) {
                win.webContents.executeJavaScript(fs.readFileSync(acPath, 'utf8')).catch(() => {});
                console.log('[AC] Автокликер внедрён');
            }
        } catch(e) { console.error('[AC] Ошибка загрузки автокликера:', e); }
    });
    // --- Конец загрузчика Auto-Accept ---
`;
            if (markerPos !== -1) {
                utilsContent = utilsContent.slice(0, markerPos) + injectionCode + utilsContent.slice(markerPos);
            } else {
                utilsContent += injectionCode;
            }
            console.log('  Загрузчик автокликера добавлен в utils.js');
        }
    } else {
        // Удаление автокликера из сборки
        if (fs.existsSync(acDst)) {
            fs.unlinkSync(acDst);
            console.log('  Удален файл автокликера.');
        }
        // Вырезаем код автокликера из utilsContent
        const lines = utilsContent.split('\n');
        let inAcBlock = false;
        utilsContent = lines.filter(line => {
            if (line.includes('// --- Автокликер Auto-Accept ---')) { inAcBlock = true; return false; }
            if (line.includes('// --- Конец загрузчика Auto-Accept ---')) { inAcBlock = false; return false; }
            return !inAcBlock;
        }).join('\n');
        console.log('  Загрузчик автокликера удален из utils.js');
    }

    // 4. Обработка Русификатора
    const ruDst = path.join(extractDir, 'dist', 'antig_russify.js');
    if (installRussifier) {
        console.log('Установка Русификатора...');
        const ruSrc = path.join(__dirname, 'russify.js');
        fs.copyFileSync(ruSrc, ruDst);

        if (!utilsContent.includes('antig_russify.js')) {
            const injectionCode = `
    // --- Русификатор Russifier ---
    win.webContents.on('did-finish-load', () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const ruPath = path.join(__dirname, 'antig_russify.js');
            if (fs.existsSync(ruPath)) {
                win.webContents.executeJavaScript(fs.readFileSync(ruPath, 'utf8')).catch(() => {});
                console.log('[RU] Русификатор внедрён');
            }
        } catch(e) { console.error('[RU] Ошибка загрузки русификатора:', e); }
    });
    // --- Конец загрузчика Russifier ---
`;
            const freshMarkerPos = utilsContent.indexOf(didFinishMarker);
            if (freshMarkerPos !== -1) {
                utilsContent = utilsContent.slice(0, freshMarkerPos) + injectionCode + utilsContent.slice(freshMarkerPos);
            } else {
                utilsContent += injectionCode;
            }
            console.log('  Загрузчик русификатора добавлен в utils.js');
        }
    } else {
        // Удаление русификатора из сборки
        if (fs.existsSync(ruDst)) {
            fs.unlinkSync(ruDst);
            console.log('  Удален файл русификатора.');
        }
        // Вырезаем код русификатора из utilsContent
        const lines = utilsContent.split('\n');
        let inRuBlock = false;
        utilsContent = lines.filter(line => {
            if (line.includes('// --- Русификатор Russifier ---')) { inRuBlock = true; return false; }
            if (line.includes('// --- Конец загрузчика Russifier ---')) { inRuBlock = false; return false; }
            return !inRuBlock;
        }).join('\n');
        console.log('  Загрузчик русификатора удален из utils.js');
    }

    fs.writeFileSync(utilsPath, utilsContent, 'utf8');

    // 5. Упаковка asar архива обратно
    console.log('Сборка app.asar...');
    try {
        execSync(`npx -y @electron/asar pack "${extractDir}" "${asarPath}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('ОШИБКА: Не удалось собрать asar архив.');
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.exit(1);
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    console.log('\n=== Установка успешно завершена! ===');
}

function uninstall() {
    console.log('=== Удаление из Antigravity ===\n');

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, asarPath);
        console.log('app.asar восстановлен из оригинального бэкапа.');
        console.log('Удаление успешно завершено!\n');
    } else {
        console.error('ОШИБКА: Файл бэкапа app.asar.backup не найден.');
        process.exit(1);
    }
}

if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
