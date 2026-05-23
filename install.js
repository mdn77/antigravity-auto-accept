/**
 * install.js - Установщик для Antigravity Auto-Accept
 * 
 * Автоматически внедряет скрипт автокликера в app.asar текстового редактора Antigravity.
 * 
 * Использование:
 *   node install.js              - Установить плагин
 *   node install.js --uninstall  - Удалить плагин (восстановить из бэкапа)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Поиск папки установки Antigravity в зависимости от операционной системы
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

// Запуск процесса установки
function install() {
    console.log('=== Установщик Antigravity Auto-Accept ===\n');

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        console.log('Убедитесь, что приложение Antigravity установлено.');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');
    const extractDir = path.join(resourcesDir, '_asar_temp');

    console.log('Путь Antigravity:', resourcesDir);
    console.log('');

    // Шаг 1: Создание резервной копии
    if (!fs.existsSync(backupPath)) {
        console.log('[1/4] Создание резервной копии app.asar...');
        fs.copyFileSync(asarPath, backupPath);
        console.log('  Резервная копия сохранена:', backupPath);
    } else {
        console.log('[1/4] Резервная копия уже существует, шаг пропущен.');
    }

    // Шаг 2: Извлечение asar архива
    console.log('[2/4] Распаковка app.asar...');
    try {
        execSync(`npx -y @electron/asar extract "${asarPath}" "${extractDir}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('ОШИБКА: Не удалось извлечь архив asar. Убедитесь, что Node.js установлен.');
        process.exit(1);
    }

    // Шаг 3: Запись скрипта автокликера
    console.log('[3/4] Внедрение автокликера...');
    const autoclickerSrc = path.join(__dirname, 'autoclicker.js');
    const autoclickerDst = path.join(extractDir, 'dist', 'antig_autoclicker.js');
    fs.copyFileSync(autoclickerSrc, autoclickerDst);

    // Добавление точки входа (лоадера) в конец utils.js
    const utilsPath = path.join(extractDir, 'dist', 'utils.js');
    if (fs.existsSync(utilsPath)) {
        let utilsContent = fs.readFileSync(utilsPath, 'utf8');
        if (!utilsContent.includes('antig_autoclicker')) {
            const injectionCode = `
// --- Загрузчик Antigravity Auto-Accept ---
try {
    if (typeof window !== 'undefined') {
        const _acWait = setInterval(() => {
            if (document.body) {
                clearInterval(_acWait);
                try {
                    const acPath = require('path').join(__dirname, 'antig_autoclicker.js');
                    const acCode = require('fs').readFileSync(acPath, 'utf8');
                    const acScript = document.createElement('script');
                    acScript.textContent = acCode;
                    document.body.appendChild(acScript);
                } catch(e) { console.log('[AC] Ошибка загрузки:', e.message); }
            }
        }, 500);
    }
} catch(e) {}
// --- Конец загрузчика Auto-Accept ---
`;
            utilsContent += injectionCode;
            fs.writeFileSync(utilsPath, utilsContent, 'utf8');
            console.log('  Точка загрузки интегрирована в utils.js');
        } else {
            console.log('  Точка загрузки уже присутствует в utils.js');
        }
    }

    // Шаг 4: Сборка asar архива обратно
    console.log('[4/4] Сборка app.asar...');
    try {
        execSync(`npx -y @electron/asar pack "${extractDir}" "${asarPath}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error('ОШИБКА: Не удалось собрать asar архив.');
        process.exit(1);
    }

    // Удаление временной директории
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log('\n=== Установка успешно завершена! ===');
    console.log('Перезапустите Antigravity для активации автокликера.');
    console.log('Виджет управления отобразится в правом нижнем углу.\n');
}

// Запуск процесса удаления
function uninstall() {
    console.log('=== Удаление Antigravity Auto-Accept ===\n');

    const resourcesDir = findAntigravityPath();
    if (!resourcesDir) {
        console.error('ОШИБКА: Путь установки Antigravity не найден!');
        process.exit(1);
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    const backupPath = path.join(resourcesDir, 'app.asar.backup');

    if (fs.existsSync(backupPath)) {
        console.log('Восстановление оригинального app.asar из бэкапа...');
        fs.copyFileSync(backupPath, asarPath);
        console.log('Удаление успешно завершено! Перезапустите Antigravity.\n');
    } else {
        console.error('ОШИБКА: Файл резервной копии не найден.');
        process.exit(1);
    }
}

if (process.argv.includes('--uninstall')) {
    uninstall();
} else {
    install();
}
