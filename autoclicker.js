// autoclicker.js v28 — Универсальный: Chat 2.0 + IDE
// IDE: кнопка в .part.statusbar > .items-container > .statusbar-item
// Chat 2.0: плавающая кнопка (синяя, круглая)
// Полная русификация IDE, включая Shadow DOM и Iframe
(function(){
'use strict';
if(window.__ANTIG_AUTOCLICKER){try{window.__ANTIG_AUTOCLICKER.destroy();}catch(e){}}

// === СОСТОЯНИЕ ===
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,lastActivity:0,pauseSec:20,iv:null,siv:null,riv:null,bar:null,popup:null,initRetries:0};

// === СИНХРОНИЗАЦИЯ СОСТОЯНИЯ ===
function loadState(){
    try{
        var saved=localStorage.getItem('antig_ac_state');
        if(saved){
            var parsed=JSON.parse(saved);
            for(var k in parsed){
                if(k!=='bar'&&k!=='popup'&&k!=='iv'&&k!=='siv'&&k!=='riv') st[k]=parsed[k];
            }
        }
    }catch(e){}
}
function saveState(){
    try{
        localStorage.setItem('antig_ac_state',JSON.stringify({
            on:st.on,dots:st.dots,retry:st.retry,maxR:st.maxR,pauseSec:st.pauseSec,total:st.total
        }));
    }catch(e){}
}

// === ПАТТЕРНЫ ===
var SUBMIT=['submit','send','отправить'];
var RETRY_P=['retry','try again','повторить','попробовать снова'];
var ACCEPT=['yes, allow this time','yes, and always allow when not in a project','yes, and always allow','always proceed','да, разрешить','да, всегда разрешать','всегда выполнять','да, разрешить сейчас'];

// === ПОЛНАЯ РУСИФИКАЦИЯ ===
var TR={
    // Меню
    'General':'Общие','Account':'Аккаунт','Permissions':'Разрешения',
    'Appearance':'Оформление','Notifications':'Уведомления','Models':'Модели',
    'Customizations':'Настройки','Browser':'Браузер','Tab':'Автодополнение',
    'Editor':'Редактор','Workspaces':'Проекты',
    'Shortcuts':'Горячие клавиши','Provide Feedback':'Обратная связь',
    // Агент
    'Agent':'Агент','Agent Auto-Fix Lints':'Авто-исправление ошибок',
    'Auto Execution':'Авто-выполнение','Review Policy':'Политика проверки',
    'Manage':'Управление','Advanced Settings':'Расширенные настройки',
    'Settings':'Настройки','AI Shortcuts':'Горячие клавиши ИИ',
    'Request Review':'Запросить проверку',
    'Suggestions in Editor':'Подсказки в редакторе',
    'Tab Gitignore Access':'Доступ к .gitignore',
    'Tab Speed':'Скорость','Tab to Import':'Импорт по Tab',
    'Tab to Jump':'Переход по Tab','Snooze':'Пауза','Start':'Начать',
    'On':'Вкл','Off':'Выкл','Fast':'Быстро','Normal':'Нормально','Slow':'Медленно',
    'Always proceed':'Всегда выполнять','Always Proceed':'Всегда выполнять',
    'Always Ask':'Всегда спрашивать',
    // Безопасность
    'Agent security mode':'Режим безопасности агента',
    'Select one of the three options. Agent settings and permissions can be further customized below.':
        'Выберите один из трёх режимов безопасности. Настройки и разрешения можно уточнить ниже.',
    'Full access':'Полный доступ',
    'Agents have full access to your machine and external resources.':
        'Агенты имеют полный доступ к компьютеру и внешним ресурсам.',
    'Sandboxed':'Песочница',
    'Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.':
        'Агенты работают в безопасной песочнице с ограниченным доступом за пределами доверенных папок.',
    'Strict':'Строгий',
    'Terminal commands always require review and the agent cannot access files outside of its given workspaces.':
        'Команды всегда требуют проверки, доступ к файлам ограничен рабочими папками.',
    'Terminal':'Терминал',
    'Terminal Command Auto Execution':'Авто-выполнение команд терминала',
    'Controls whether terminal commands require your approval before running.':
        'Определяет, нужно ли одобрение перед выполнением команд.',
    'Note: A change to this setting will only apply to new messages sent to Agent. In-progress responses will use the previous setting value.':
        'Изменение применится только к новым сообщениям.',
    'Enable Shell Integration':'Интеграция с оболочкой',
    'When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution.':
        'Агент использует интеграцию с оболочкой для отслеживания команд.',
    'File Access':'Доступ к файлам',
    'Agent Non-Workspace File Access':'Доступ к файлам вне проекта',
    'Allows the agent to access files outside of your current workspace.':
        'Разрешает агенту доступ к файлам за пределами текущей рабочей области.',
    'Auto-Open Edited Files':'Авто-открытие файлов',
    'Open files in the background if Agent creates or edits them':
        'Открывать файлы при создании или редактировании агентом',
    'Planning':'Планирование',
    // Оформление
    'Configure the agent\'s visual theme and display preferences.':
        'Настройка темы оформления и отображения агента.',
    'Chat Settings':'Настройки чата',
    'Verbose agent chat':'Подробный чат агента',
    'Display and preserve intermediate thinking steps':
        'Показывать промежуточные шаги размышлений',
    // Аккаунт
    'Manage your plan, credentials, and general preferences.':
        'Управление планом, учётными данными и общими настройками.',
    'Enable Telemetry':'Телеметрия',
    'When toggled on, Antigravity IDE collects usage data to help Google enhance performance and features.':
        'Antigravity IDE собирает данные для улучшения производительности.',
    'Marketing Emails':'Маркетинговые письма',
    'Receive product updates, tips, and promotions from Google Antigravity IDE via email.':
        'Получать обновления и акции от Google Antigravity IDE.',
    'Your Plan: Google AI Unlim for AntiG':'Ваш план: Google AI Unlim для AntiG',
    'You have unlimited access to all AntiG features.':'Безлимитный доступ ко всем функциям.',
    'Email':'E-mail','Sign Out':'Выйти',
    'By using this app, you agree to its':'Используя приложение, вы соглашаетесь с',
    'Terms of Service':'Условиями использования',
    // Настройки
    'Configure default behaviors, skills, and MCP servers.':
        'Настройка поведения, навыков и MCP-серверов.',
    'Token Usage':'Использование токенов',
    'The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically.':
        'Использование токенов: навыки, правила и MCP. При превышении бюджета настройки автоматически сокращаются.',
    'of the customization budget is available.':'бюджета настроек доступно.',
    'Rules':'Правила','Show 1 breakdown':'Показать разбивку',
    'Installed MCP Servers':'Установленные MCP-серверы',
    'Add MCP +':'Добавить MCP +','Refresh':'Обновить',
    'Open MCP Config':'Открыть конфиг MCP',
    'No MCP Servers':'Нет MCP-серверов',
    'You currently don\'t have any MCP Servers installed. Add an MCP server above or add a custom one via the MCP Config.':
        'MCP-серверы не установлены. Добавьте сервер или настройте через конфиг.',
    'Build With Google Plugins':'Плагины Google','Customize':'Настроить',
    // Уведомления
    'Manage your notification preferences.':'Управление настройками уведомлений.',
    'Notification Settings':'Настройки уведомлений',
    'To modify notification settings, open your operating system\'s system preferences.':
        'Для изменения настроек откройте системные настройки ОС.',
    'Open System Preferences':'Системные настройки',
    // Модели
    'Select a model':'Выберите модель','Default model':'Модель по умолчанию',
    'Model Settings':'Настройки модели',
    'Configure your default model and model-specific settings.':
        'Настройте модель по умолчанию и параметры моделей.',
    // Браузер
    'Configure browser settings for Agent.':'Настройки браузера для агента.',
    'Browser Settings':'Настройки браузера',
    // Редактор
    'Configure editor settings.':'Настройки редактора.',
    'Editor Settings':'Настройки редактора',
    // Общие
    'Configure general settings.':'Общие настройки.',
    'Language':'Язык','Theme':'Тема',
    // Горячие клавиши
    'Open Command':'Открыть команду','No shortcut':'Нет',
    'Open Agent':'Открыть агента',
    'View all Antigravity IDE shortcuts':'Все горячие клавиши IDE',
    'Reset to default shortcuts':'Сбросить горячие клавиши',
    // Диалоги
    'Allow running this command?':'Разрешить выполнение команды?',
    'Yes, allow this time':'Да, разрешить сейчас',
    'Yes, and always allow':'Да, всегда разрешать',
    'No (tell the agent what to do instead)':'Нет (указать агенту)',
    'Skip':'Пропустить','Submit':'Отправить','Send':'Отправить',
    'Cancel':'Отмена','Retry':'Повторить','Close':'Закрыть',
    'Save':'Сохранить','Delete':'Удалить','Copy':'Копировать',
    'Running':'Выполняется','Idle':'Ожидание','Thinking':'Думает',
    'Loading':'Загрузка','Stop':'Стоп',
    'Code with Agent':'Код с Агентом',
    'Open Folder':'Открыть папку','Clone Repository':'Клонировать репозиторий',
    'Allow Tab to view and edit the files in .gitignore. Use with caution if your .gitignore lists files containing credentials, secrets, or other sensitive information.':
        'Разрешить Tab просмотр файлов .gitignore. Осторожно с секретами.',
    'Ask anything, @ to mention, / for actions':'Спрашивайте, @ для упоминаний, / для действий',
    'Type a message...':'Введите сообщение...',
    
    // Окно разрешений
    'Always Proceed': 'Разрешать всегда',
    'Agent never asks for confirmation before executing terminal commands (except those in the Deny list). This provides the Agent with the maximum ability to operate over long periods without intervention, but also has the highest risk of an Agent executing an unsafe terminal command.': 'Агент никогда не запрашивает подтверждения перед выполнением команд терминала (кроме команд из списка запрещенных). Это дает агенту максимальную автономность, но несет высокий риск выполнения небезопасных команд.',
    'Proceed In Sandbox': 'Выполнять в песочнице',
    'Terminal command automatically proceeds if the command runs inside the sandbox. Otherwise, it requests review.': 'Команды терминала выполняются автоматически, если запущены внутри песочницы. В противном случае запрашивается проверка.',
    'Always Ask': 'Всегда спрашивать',
    'Agent always asks for review.': 'Агент всегда запрашивает подтверждение для проверки.',
    'Agent never asks for review. This maximizes the autonomy of the Agent, but also has the highest risk of the Agent operating over unsafe or injected Artifact content.': 'Агент никогда не запрашивает подтверждения. Это максимизирует автономность агента, но несет повышенный риск работы с небезопасным или измененным контентом артефактов.',
    'Note: A change to this setting will only apply to new progress responses. In-progress responses will use the previous setting value.': 'Примечание: Изменение этой настройки применится только к новым ответам. Текущие ответы будут использовать предыдущее значение.',
    'Conversation History': 'История диалогов',
    'When enabled, the agent will be able to access past conversations to inform its responses.': 'Если включено, агент сможет использовать прошлые диалоги для контекста ответов.',
    'Knowledge': 'Знания',
    'When enabled, the agent will be able to access its knowledge base to inform its responses and automatically generate knowledge items in the background.': 'Если включено, агент сможет использовать базу знаний и автоматически создавать статьи базы знаний в фоне.',
    'Explain and Fix in Current Conversation': 'Объяснение и исправление в текущем диалоге',
    'When enabled, \'Explain and Fix\' actions will continue in the current conversation instead of starting a new one.': 'Если включено, действия «Объяснить и исправить» будут продолжаться в текущем диалоге вместо создания нового.',
    'Open Agent on Reload': 'Открывать Агента при перезагрузке',
    'Open Agent panel on window reload': 'Открывать панель Агента при перезапуске окна',
    'Enable Sounds for Agent': 'Звуки для Агента',
    'When enabled, Antigravity will play a sound when Agent finishes generating a response.': 'Если включено, Antigravity будет воспроизводить звук после завершения генерации ответа Агентом.',
    'Auto-Expand Changes Overview': 'Авто-разворачивание обзора изменений',
    'When enabled, the Changes Overview toolbar will automatically expand when Agent finishes generating a response.': 'Если включено, панель обзора изменений будет автоматически разворачиваться после завершения работы Агента.',
    '[Dev] GCP Project ID': '[Dev] Идентификатор проекта GCP',
    'GCP Project ID for enterprise features.': 'Идентификатор проекта GCP для корпоративных функций.',
    'Agent Auto-Fix Lints': 'Авто-исправление ошибок Агентом',
    'Auto-Fix Lints': 'Авто-исправление ошибок',
    'When enabled, Agent is given awareness of lint errors created by its edits and may fix them without explicit user prompting.': 'Если включено, Агент отслеживает ошибки компиляции/синтаксиса в своих правках и может исправлять их автоматически.',
    'Allow List Terminal Commands': 'Разрешённые команды терминала',
    'Deny List Terminal Commands': 'Запрещённые команды терминала',
    'Automation': 'Автоматизация',
    'History': 'История',

    // Разрешения
    'Read Files': 'Чтение файлов',
    'Paths the agent can read.': 'Пути, которые агент может читать.',
    'Write Files': 'Запись файлов',
    'Paths the agent can modify.': 'Пути, которые агент может изменять.',
    'Advanced Command Access': 'Расширенный доступ к командам',
    'Terminal Commands': 'Команды терминала',
    'Terminal commands': 'Команды терминала',
    'Terminal commands the agent can execute.': 'Команды терминала, которые агент может выполнять.',
    'Commands Outside Sandbox': 'Команды вне песочницы',
    'Commands the agent can run outside the sandbox.': 'Команды, которые агент может запускать вне песочницы.',
    'MCP Tools': 'Инструменты MCP',
    'External tools the agent can call via Model Context Protocol.': 'Внешние инструменты, которые агент может вызывать через Model Context Protocol.',
    'Advanced Web Access': 'Расширенный доступ к веб-ресурсам',
    'Read URLs': 'Чтение URL',
    'URLs the agent can read or open in the browser.': 'URL-адреса, которые агент может читать или открывать в браузере.',
    'Execute URLs': 'Выполнение URL',
    'URLs the agent can actuate on using the browser.': 'URL-адреса, с которыми агент может взаимодействовать через браузер.',
    'No permissions configured.': 'Разрешения не настроены.',
    'Enter target...': 'Введите цель...',
    'Add': 'Добавить',
    'Allow': 'Разрешить',
    'Deny': 'Запретить',
    'Ask first': 'Спрашивать сначала',
    'Allow once': 'Разрешить единоразово',
    'Allow Once': 'Разрешить один раз',
    'Ask every time': 'Спрашивать каждый раз',
    'Commands': 'Команды',
    'Projects': 'Проекты',
    'Local Permissions': 'Локальные разрешения',
    'Enable Terminal Sandbox': 'Включить песочницу терминала',
    'AI may make mistakes. Double-check all generated code.': 'ИИ может ошибаться. Проверяйте сгенерированный код.',
    
    // Дополнительные параметры
    'Agent asks for permission before executing commands matched by a deny list entry.': 'Агент запрашивает разрешение перед выполнением команд, соответствующих списку запретов.',
    'When enabled, Agent can interact with Google Workspace through the API to search and read documents.': 'Если включено, Агент может взаимодействовать с Google Workspace через API для поиска и чтения документов.',
    'When enabled, terminal commands run with sandbox restrictions.': 'Если включено, команды терминала выполняются с ограничениями песочницы.',
    'Sandbox Allow Network': 'Доступ к сети в песочнице',
    'When enabled, sandboxed commands are allowed to make network requests.': 'Если включено, командам в песочнице разрешено делать сетевые запросы.',
    'Terminal Command Auto Execution': 'Автовыполнение команд терминала',
    'Proceed in Sandbox': 'Выполнять в песочнице',
    'Controls whether the agent can run custom JavaScript to automate complex browser actions.': 'Управляет тем, может ли агент выполнять собственный JavaScript для автоматизации сложных действий в браузере.',
    'The default terminal command decoration background color.': 'Цвет фона оформления команды терминала по умолчанию.',
    'The terminal command decoration background color for successful commands.': 'Цвет фона оформления успешно выполненных команд терминала.',
    'The terminal command decoration background color for error commands.': 'Цвет фона оформления команд терминала, завершившихся ошибкой.',
    'Allow/deny specific terminal commands.': 'Разрешить/запретить определенные команды терминала.',
    'Allow/deny agent command execution outside the sandbox.': 'Разрешить/запретить выполнение команд агентом вне песочницы.',
    '. Local permissions have higher priority.': '. Локальные разрешения имеют более высокий приоритет.',
    'The browser subagent can be invoked by typing /browser in the conversation input box.': 'Браузерный субагент может быть вызван путем ввода /browser в окне ввода чата.',
    'Add an MCP server above or add a custom one via the MCP Config.': 'Добавьте MCP-сервер выше или добавьте собственный через MCP Config.',
    'Manage project folders, agent settings, and permissions.': 'Управление папками проекта, настройками агента и разрешениями.',
    'Configure workspace-specific permissions, resources, and customizations.': 'Настройка разрешений, ресурсов и кастомизаций рабочей области.',
    'Paths the agent can read inside this workspace.': 'Пути, которые агент может читать внутри этой рабочей области.',
    'Paths the agent can modify inside this workspace.': 'Пути, которые агент может изменять внутри этой рабочей области.',
    'Terminal commands the agent can execute in this workspace.': 'Команды терминала, которые агент может выполнять в этой рабочей области.',
    'Commands the agent can run outside the sandbox in this workspace.': 'Команды, которые агент может запускать вне песочницы в этой рабочей области.',
    'URLs the agent can actuate on in this workspace.': 'URL-адреса, на которых агент может совершать действия в этой рабочей области.',
    'Projects serve as your workspace where your agents work. Each project has its own file scope and permissions.': 'Проекты служат рабочей областью, в которой работают ваши агенты. Каждый проект имеет собственный доступ к файлам и разрешения.',

    // Редактор и Маркетплейс
    'Configure editor-specific behaviors and shortcuts.': 'Настройка поведения и горячих клавиш редактора.',
    'Marketplace': 'Маркетплейс',
    'Marketplace Item URL': 'URL-адрес расширения в Маркетплейсе',
    'Changes the base URL on each extension page. You must restart Antigravity IDE to use the new marketplace after changing this value.': 'Изменяет базовый URL-адрес на странице каждого расширения. Необходимо перезапустить Antigravity IDE после изменения этого значения.',
    'Changes the base URL on each extension page. You must restart Antigravity to use the new marketplace after changing this value.': 'Изменяет базовый URL-адрес на странице каждого расширения. Необходимо перезапустить Antigravity после изменения этого значения.',
    'Marketplace Gallery URL': 'URL-адрес галереи Маркетплейса',
    'Changes the base URL for marketplace search results. You must restart Antigravity IDE to use the new marketplace after changing this value.': 'Изменяет базовый URL-адрес для результатов поиска в Маркетплейсе. Необходимо перезапустить Antigravity IDE после изменения этого значения.',
    'Changes the base URL for marketplace search results. You must restart Antigravity to use the new marketplace after changing this value.': 'Изменяет базовый URL-адрес для результатов поиска в Маркетплейсе. Необходимо перезапустить Antigravity после изменения этого значения.',
    'Selection Actions': 'Действия при выделении текста',
    'Show Selection Actions': 'Показывать действия при выделении',
    'Show "Edit" and "Chat" buttons when selecting text in the editor.': 'Показывать кнопки «Изменить» и «Чат» при выделении текста в редакторе.',
    'To modify editor settings, open ': 'Чтобы изменить настройки редактора, откройте ',
    ' settings within the editor window.': ' в окне редактора.',
    'To modify editor settings, open': 'Чтобы изменить настройки редактора, откройте',
    'settings within the editor window.': 'в окне редактора.',
    'Open ': 'Открыть ',
    'Open': 'Открыть',
    'Open Настройки редактора': 'Открыть настройки редактора',

    // Браузер и инструменты
    'Browser User Profile Path': 'Путь к профилю браузера',
    'Browser CDP Port': 'Порт CDP браузера',
    'Browser Javascript Execution Policy': 'Политика выполнения JavaScript в браузере',
    'Browser JS execution policy': 'Политика выполнения JS в браузере',
    'Chrome Binary Path': 'Путь к исполняемому файлу Chrome',
    'Enable Browser Tools': 'Включить инструменты браузера',
    'Browser CDP port': 'Порт CDP браузера',
    'Browser user profile path': 'Путь к профилю браузера',
    'Custom path for the browser user profile directory. Leave empty for default (~/.gemini/antigravity-browser-profile).': 'Пользовательский путь к каталогу профиля браузера. Оставьте пустым для значения по умолчанию (~/.gemini/antigravity-browser-profile).',
    'Port number for Chrome DevTools Protocol remote debugging. Leave empty for default (9222).': 'Номер порта для удаленной отладки по протоколу Chrome DevTools (CDP). Оставьте пустым для значения по умолчанию (9222).',
    'Absolute path to the Chrome/Chromium executable': 'Абсолютный путь к исполняемому файлу Chrome/Chromium',
    'Controls whether the agent can run custom JavaScript to automate complex browser actions.': 'Управляет тем, может ли агент выполнять собственный JavaScript для автоматизации сложных действий в браузере.',
    'When enabled, Agent can use browser tools to open URLs, read web pages, and interact with browser content. This allows the Agent access to important (and often critical) knowledge and methods of validation, but any browser integration does increase exposure to external malicious parties for security exploits.': 'Если включено, Агент может использовать инструменты браузера для открытия URL-адресов, чтения веб-страниц и взаимодействия с веб-содержимым. Это обеспечивает доступ к критически важным методам валидации, но повышает риск уязвимостей при взаимодействии с внешними ресурсами.',
    
    // Доступы рабочей области
    'Workspace File Access': 'Доступ к файлам рабочей области',
    'Workspace Command Access': 'Доступ к командам рабочей области',
    'Workspace Web Access': 'Доступ к веб-ресурсам рабочей области',
    'Browser Actuation Rules': 'Правила взаимодействия с браузером',
    'Configure allowed and denied URLs for browser actuation.': 'Настройка разрешенных и запрещенных URL-адресов для работы в браузере.',
    'Allow/deny agent browser actuation access to specific URLs.': 'Разрешить/запретить агенту взаимодействие с браузером на определенных URL.',
    
    // Удаленное управление и кредиты
    'Remote Control': 'Удаленное управление',
    'Enable Remote Control': 'Включить удаленное управление',
    'If enabled, you can manage your conversations from the Antigravity website. Please reload the application to apply this setting.': 'Если включено, вы можете управлять своими диалогами с веб-сайта Antigravity. Пожалуйста, перезагрузите приложение, чтобы применить эту настройку.',
    'Include Jetski Default Customizations': 'Включить стандартные настройки Jetski',
    'When enabled, the agent will include default customizations, including default skills.': 'Если включено, агент будет использовать стандартные настройки, включая стандартные навыки.',
    'Enable Workspace API': 'Включить API рабочей области',
    'When enabled, Agent can interact with Google Workspace through the API to search and read documents.': 'Если включено, Агент может взаимодействовать с Google Workspace через API для поиска и чтения документов.',
    'Confirm Window Reload': 'Подтверждение перезагрузки окна',
    'Toggle if a confirmation is shown when using the "Reload Window" button.': 'Определяет, показывать ли подтверждение при нажатии кнопки «Перезагрузить окно».',
    'Strict Mode': 'Строгий режим',
    'When enabled, enforces settings that prevent the agent from autonomously running targeted exploits and requires human review for all agent actions. Visit antigravity.google/docs/strict-mode for details.': 'Если включено, применяются настройки, которые мешают агенту автономно запускать целевые эксплойты, и требуют проверки человеком для всех действий агента. Подробности на antigravity.google/docs/strict-mode.',
    'Prevent Sleep': 'Запретить спящий режим',
    'Prevent the computer from sleeping while the app is running.': 'Запретить компьютеру переходить в спящий режим во время работы приложения.',
    'Keep In Menu Bar': 'Оставлять в строке меню',
    'The app will be accessible from the menu bar and will keep running in the background when all windows are closed.': 'Приложение будет доступно из строки меню и продолжит работать в фоновом режиме после закрытия всех окон.',
    'Delete Project': 'Удалить проект',
    'Permanently delete this project and all of its conversations.': 'Навсегда удалить этот проект и все его диалоги.',
    'Model Credits': 'Баланс ИИ (Кредиты)',
    'Enable AI Credit Overages': 'Разрешить перерасход кредитов ИИ',
    'Model Quota': 'Квота моделей',
    'Folders': 'Папки',
    'Danger Zone': 'Опасная зона',
    'Keyboard Shortcuts': 'Горячие клавиши',
    'Open Keyboard Shortcuts': 'Открыть список горячих клавиш',
    'No folders added yet.': 'Папки ещё не добавлены.',
    'All Workspaces': 'Все рабочие области',
    'Skill Custom Paths': 'Пользовательские пути к навыкам',
    'Create Documents': 'Создание документов',
    'Gives the agent permission to create and upload documents to google drive': 'Дает агенту разрешение создавать и загружать документы на Google Диск',
    'Gives the agent permission to search through google drive. The agent will only see file titles, not file contents': 'Дает агенту разрешение на поиск в Google Диске. Агент будет видеть только названия файлов, но не их содержимое',
    'Manage Google Drive access permissions.': 'Управление правами доступа к Google Диску.',
    'Configure AI models and view your quota.': 'Настройка моделей ИИ и просмотр квот.',
    "When toggled on, Antigravity will use your AI credits to fulfill model requests once you're out of model quota. Antigravity will always use your model quota first before using AI credits.": "Если включено, Antigravity будет использовать ваши кредиты ИИ после исчерпания квоты на модели. Квота всегда используется в первую очередь.",
    "When toggled on, Antigravity IDE will use your AI credits to fulfill model requests once you're out of model quota. Antigravity IDE will always use your model quota first before using AI credits.": "Если включено, Antigravity IDE будет использовать ваши кредиты ИИ после исчерпания квоты на модели. Квота всегда используется в первую очередь."
};

// Сортировка ключей по убыванию длины для безопасной подстрочной замены
var TR_KEYS = Object.keys(TR).sort(function(a, b){ return b.length - a.length; });

// === АКТИВНОСТЬ ===
function userActive(e){
    if(e.target&&e.target.closest&&(e.target.closest('#ac-bar')||e.target.closest('#ac-popup')))return;
    st.lastActivity=Date.now();
}
document.addEventListener('keydown',userActive,true);
document.addEventListener('mousedown',userActive,true);
document.addEventListener('wheel',userActive,true);
function isPaused(){return Date.now()-st.lastActivity<st.pauseSec*1000;}

// === ПОИСК КНОПОК ===
function matchesAny(t,p){t=(t||'').trim().toLowerCase();if(!t)return false;for(var i=0;i<p.length;i++)if(t===p[i]||t.indexOf(p[i])>=0)return true;return false;}
function findBtns(p){var f=[];document.querySelectorAll('button,[role="button"]').forEach(function(b){if(b.offsetWidth>0&&b.offsetHeight>0&&!b.disabled&&matchesAny(b.textContent,p))f.push(b);});return f;}
function clickAll(p){var c=0;findBtns(p).forEach(function(b){b.click();c++;st.total++;saveState();});return c;}
function clickRetry(){
    if(!st.retry)return 0;if(Date.now()-st.lastR>60000)st.retryN=0;if(st.retryN>=st.maxR)return 0;
    var c=0;findBtns(RETRY_P).forEach(function(b){if(st.retryN<st.maxR){b.click();c++;st.retryN++;st.lastR=Date.now();saveState();}});return c;
}

// === ОБХОД ТОЧЕК ===
function getActiveDots(){
    var r=[];document.querySelectorAll('div.cursor-pointer.rounded-lg').forEach(function(el){
        var c=el.className||'';if(c.indexOf('select-none')<0||c.indexOf('min-h-')<0)return;
        if(el.getBoundingClientRect().left>280)return;
        if(el.querySelector('.animate-unread-ping')||el.querySelector('div.bg-primary.rounded-full'))r.push(el);
    });return r;
}
function sweepDots(){
    loadState();
    if(!st.on||!st.dots||st.sweeping||isPaused())return;
    var a=getActiveDots();if(!a.length)return;st.sweeping=true;var idx=0;
    function next(){if(idx>=a.length||isPaused()){st.sweeping=false;return;}a[idx].click();idx++;
    setTimeout(function(){clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);setTimeout(next,400);},700);}next();
}
function scan(){
    loadState();
    if(!st.on||st.sweeping||isPaused())return;
    clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);
}

// === ПОЛНАЯ РУСИФИКАЦИЯ (Shadow DOM & Iframes) ===
function russifyNode(root){
    if(!root)return;
    // 1. Обход текстовых узлов
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null,false),n;
    while(n=w.nextNode()){
        var t=n.textContent.trim();
        if(t&&TR[t]){n.textContent=n.textContent.replace(t,TR[t]);continue;}
        for(var i=0; i<TR_KEYS.length; i++){
            var k=TR_KEYS[i];
            if(k.length>3&&t.indexOf(k)>=0){n.textContent=n.textContent.replaceAll(k,TR[k]);}
        }
    }
    // 2. Элементы, Shadow DOM, Iframes
    var els=root.querySelectorAll?root.querySelectorAll('*'):[];
    els.forEach(function(el){
        if(el.children&&el.children.length===0){
            var t=el.textContent.trim();
            if(t&&TR[t])el.textContent=TR[t];
        }
        if(el.placeholder){var p=el.placeholder.trim();if(TR[p])el.placeholder=TR[p];}
        if(el.title){var tl=el.title.trim();if(TR[tl])el.title=TR[tl];}
        var al=el.getAttribute?el.getAttribute('aria-label'):null;
        if(al&&TR[al.trim()])el.setAttribute('aria-label',TR[al.trim()]);
        
        if(el.shadowRoot)russifyNode(el.shadowRoot);
        if(el.tagName==='IFRAME'){
            try{if(el.contentDocument)russifyNode(el.contentDocument);}catch(e){}
        }
    });
}
function russify(){russifyNode(document.body);}

// === UI ===
function makeEl(tag,css,text){var el=document.createElement(tag);if(css)el.style.cssText=css;if(text)el.textContent=text;return el;}
function mkToggle(id,label,checked){
    var r=makeEl('div','display:flex;align-items:center;justify-content:space-between;padding:4px 0;');
    r.appendChild(makeEl('span','font-size:12px;',label));
    var sw=makeEl('div','width:30px;height:16px;border-radius:8px;background:'+(checked?'#166534':'#333')+';cursor:pointer;position:relative;transition:all .3s;');
    sw.id=id;var k=makeEl('div','width:12px;height:12px;border-radius:50%;background:'+(checked?'#4ade80':'#555')+';position:absolute;top:2px;left:'+(checked?'16px':'2px')+';transition:all .3s;');
    sw.appendChild(k);r.appendChild(sw);return r;
}
function setToggle(el,on){el.style.background=on?'#166534':'#333';var k=el.firstChild;k.style.background=on?'#4ade80':'#555';k.style.left=on?'16px':'2px';}

function createPopup(pos){
    var p=makeEl('div','display:none;position:fixed;'+pos+'background:rgba(24,24,27,0.97);backdrop-filter:blur(16px);color:#e0e0e0;padding:12px 16px;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.5);font:12px -apple-system,BlinkMacSystemFont,sans-serif;z-index:999999;border:1px solid rgba(255,255,255,0.1);user-select:none;min-width:200px;');
    p.id='ac-popup';
    p.appendChild(mkToggle('t-on','Автоклик',st.on));
    p.appendChild(mkToggle('t-dots','Обход точек',st.dots));
    p.appendChild(mkToggle('t-retry','Повтор ошибок',st.retry));
    var row=makeEl('div','display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;');
    row.appendChild(makeEl('span','color:#888;','Ретраи:'));
    var mI=document.createElement('input');mI.type='number';mI.id='t-maxr';mI.value=st.maxR;mI.min=1;mI.max=50;
    mI.style.cssText='width:38px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:1px 3px;font-size:11px;text-align:center;';
    row.appendChild(mI);row.appendChild(makeEl('span','color:#888;margin-left:6px;','Пауза:'));
    var pI=document.createElement('input');pI.type='number';pI.id='t-pause';pI.value=st.pauseSec;pI.min=5;pI.max=120;
    pI.style.cssText='width:38px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:1px 3px;font-size:11px;text-align:center;';
    row.appendChild(pI);row.appendChild(makeEl('span','color:#666;','с'));
    p.appendChild(row);
    var s=makeEl('div','margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#666;');
    var sr=makeEl('div','');
    sr.appendChild(document.createTextNode('Нажато: '));var sA=makeEl('span','color:#4ade80;','0');sA.id='s-acc';sr.appendChild(sA);
    sr.appendChild(document.createTextNode('  Ретраи: '));var sR=makeEl('span','color:#f59e0b;','0');sR.id='s-ret';sr.appendChild(sR);
    sr.appendChild(document.createTextNode('/'));var sM=makeEl('span','',String(st.maxR));sM.id='s-maxr';sr.appendChild(sM);
    s.appendChild(sr);var sPd=makeEl('div','margin-top:2px;');
    var sPs=makeEl('span','color:#4ade80;','Активен');sPs.id='s-pause';sPd.appendChild(sPs);
    s.appendChild(sPd);p.appendChild(s);
    document.body.appendChild(p);st.popup=p;
    p.querySelector('#t-on').onclick=function(){st.on=!st.on;setToggle(this,st.on);saveState();updateUI();};
    p.querySelector('#t-dots').onclick=function(){st.dots=!st.dots;setToggle(this,st.dots);saveState();};
    p.querySelector('#t-retry').onclick=function(){st.retry=!st.retry;setToggle(this,st.retry);saveState();};
    mI.onchange=function(){st.maxR=parseInt(this.value)||10;saveState();updateUI();};
    pI.onchange=function(){st.pauseSec=parseInt(this.value)||20;saveState();};
}

function tryCreateIDE(){
    var sb=document.querySelector('.part.statusbar')||document.querySelector('[id="workbench.parts.statusbar"]');
    if(!sb){
        st.initRetries++;
        if(st.initRetries<40)setTimeout(tryCreateIDE,1000);
        return false;
    }
    var container=sb.querySelector('.right-items')||sb.querySelector('.items-container')||sb;
    if(!container){
        setTimeout(tryCreateIDE,1000);
        return false;
    }
    var old=document.getElementById('ac-bar');if(old)old.remove();
    
    var item=makeEl('div','display:inline-flex;align-items:center;gap:4px;padding:0 8px;cursor:pointer;height:22px;line-height:22px;font-size:12px;color:inherit;margin-left:8px;margin-right:8px;');
    item.id='ac-bar';
    item.className='statusbar-item right';
    item.setAttribute('role','button');
    item.title='AutoClicker Settings';
    
    var led=makeEl('span','width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;display:inline-block;margin-right:4px;');
    led.id='ac-led';item.appendChild(led);
    item.appendChild(makeEl('span','font-weight:600;','AC'));
    var cnt=makeEl('span','font-weight:bold;margin-left:2px;','0');cnt.id='ac-cnt';item.appendChild(cnt);
    
    if(container.classList.contains('right-items')||container.querySelector('.right-items')){
        container.insertBefore(item,container.firstChild);
    }else{
        container.appendChild(item);
    }
    st.bar=item;
    createPopup('bottom:26px;right:10px;');
    return true;
}

function createChat(){
    var bar=makeEl('div','position:fixed;bottom:8px;right:12px;height:28px;display:flex;align-items:center;gap:6px;padding:0 12px;background:rgba(0,122,204,0.92);color:#fff;font:12px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;z-index:999999;user-select:none;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.4);');
    bar.id='ac-bar';
    var led=makeEl('span','width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;');
    led.id='ac-led';bar.appendChild(led);
    bar.appendChild(makeEl('span','font-weight:600;','AutoClick'));
    var cnt=makeEl('span','font-weight:bold;','0');cnt.id='ac-cnt';bar.appendChild(cnt);
    bar.appendChild(makeEl('span','font-size:9px;opacity:0.6;','\u25B2'));
    document.body.appendChild(bar);
    st.bar=bar;
    createPopup('bottom:42px;right:12px;');
}

function createUI(){
    ['ac-bar','ac-popup'].forEach(function(id){var o=document.getElementById(id);if(o)o.remove();});
    
    var isMainWindow=!!document.querySelector('.monaco-workbench');
    var isIDE=isMainWindow||window.location.href.indexOf('workbench.html')>=0||window.location.protocol==='vscode-file:';
    
    if(isIDE){
        // Рисуем UI кнопки ТОЛЬКО в главном окне IDE (не в настройках, не в чат-панелях)
        if(isMainWindow) tryCreateIDE();
    }else{
        // В автономном чате Chat 2.0 показываем плавающую кнопку
        if(document.querySelector('[data-testid]')||document.querySelector('.bg-background')||window.location.href.indexOf('localhost')>=0){
            createChat();
        }
    }
    
    if(st.bar){
        st.bar.onclick=function(e){
            e.stopPropagation();
            if(st.popup)st.popup.style.display=st.popup.style.display==='none'?'block':'none';
        };
    }
    document.addEventListener('click',function(e){
        if(st.popup&&st.bar&&!st.popup.contains(e.target)&&!st.bar.contains(e.target))st.popup.style.display='none';
    });
}

function updateUI(){
    loadState();
    if(!st.bar)return;
    var led=st.bar.querySelector('#ac-led');var p=isPaused();
    if(led){led.style.background=st.on?(p?'#f59e0b':'#4ade80'):'#666';led.style.boxShadow=st.on?(p?'0 0 6px #f59e0b':'0 0 6px #4ade80'):'none';}
    var c=st.bar.querySelector('#ac-cnt');if(c)c.textContent=st.total;
    if(!st.popup)return;
    var a=st.popup.querySelector('#s-acc');if(a)a.textContent=st.total;
    var r=st.popup.querySelector('#s-ret');if(r)r.textContent=st.retryN;
    var m=st.popup.querySelector('#s-maxr');if(m)m.textContent=st.maxR;
    var sp=st.popup.querySelector('#s-pause');
    if(sp){if(p&&st.on){sp.textContent='Пауза '+Math.ceil(st.pauseSec-(Date.now()-st.lastActivity)/1000)+'с';sp.style.color='#f59e0b';}
    else{sp.textContent=st.on?'Активен':'Выкл';sp.style.color=st.on?'#4ade80':'#666';}}
}

// === ЗАПУСК ===
function init(){
    if(!document.body){setTimeout(init,500);return;}
    loadState();
    createUI();
    st.iv=setInterval(function(){scan();updateUI();},2000);
    st.siv=setInterval(sweepDots,12000);
    russify();st.riv=setInterval(russify,3000);
    console.log('[AC] v28 запущен');
}
setTimeout(init,document.querySelector('.monaco-workbench')?4000:500);

window.__ANTIG_AUTOCLICKER={destroy:function(){
    clearInterval(st.iv);clearInterval(st.siv);clearInterval(st.riv);
    if(st.bar)st.bar.remove();if(st.popup)st.popup.remove();
    document.removeEventListener('keydown',userActive,true);
    document.removeEventListener('mousedown',userActive,true);
    document.removeEventListener('wheel',userActive,true);
    st.bar=null;st.popup=null;
}};
})();
