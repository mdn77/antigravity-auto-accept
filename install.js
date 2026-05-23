/**
 * install.js - Установщик русификатора для Antigravity Chat 2.0 (ветка russify)
 * 
 * Внедряет скрипт русификатора в app.asar.
 * 
 * Использование:
 *   node install.js              - Установить русификатор
 *   node install.js --uninstall  - Удалить русификатор
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
        possiblePaths.push('/Applications/Antigravity.app/Contents/Resources');
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
    console.log('=== Установщик Русификатора для Antigravity Chat 2.0 ===\n');

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');
    const extractDir = path.join(resourcesDir, '_asar_temp');

    console.log('Путь Antigravity:', resourcesDir);

    // 1. Бэкап
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

    // 3. Копирование и инъекция
    const ruDst = path.join(extractDir, 'dist', 'antig_russify.js');
    const ruSrc = path.join(__dirname, 'russify.js');
    fs.copyFileSync(ruSrc, ruDst);

    let utilsContent = fs.readFileSync(utilsPath, 'utf8');
    if (!utilsContent.includes('antig_russify.js')) {
        const didFinishMarker = "win.webContents.on('did-finish-load'";
        const markerPos = utilsContent.indexOf(didFinishMarker);

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
        if (markerPos !== -1) {
            utilsContent = utilsContent.slice(0, markerPos) + injectionCode + utilsContent.slice(markerPos);
        } else {
            utilsContent += injectionCode;
        }
        fs.writeFileSync(utilsPath, utilsContent, 'utf8');
        console.log('  Загрузчик русификатора добавлен в utils.js');
    }

    // 4. Сборка
    console.log('Сборка app.asar...');
    try {
        execSync(`npx -y @electron/asar pack "${extractDir}" "${asarPath}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('ОШИБКА: Не удалось собрать asar архив.');
        fs.rmSync(extractDir, { recursive: true, force: true });
        process.exit(1);
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    console.log('\n=== Установка русификатора успешно завершена! ===');
}

function uninstall() {
    console.log('=== Удаление Русификатора из Antigravity ===\n');

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, asarPath);
        console.log('app.asar восстановлен из бэкапа.');
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
