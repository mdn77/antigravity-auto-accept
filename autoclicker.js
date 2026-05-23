// autoclicker.js v27 — Универсальный: Chat 2.0 + IDE
// IDE: кнопка в .part.statusbar > .right-items
// Chat 2.0: плавающая кнопка (синяя, круглая)
// Полная русификация IDE, без innerHTML
(function(){
'use strict';
if(window.__ANTIG_AUTOCLICKER){try{window.__ANTIG_AUTOCLICKER.destroy();}catch(e){}}

// === СОСТОЯНИЕ ===
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,lastActivity:0,pauseSec:20,iv:null,siv:null,riv:null,bar:null,popup:null,initRetries:0};

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
    'Always proceed':'Всегда выполнять','Always Ask':'Всегда спрашивать',
    // Безопасность
    'Agent security mode':'Режим безопасности агента',
    'Select one of the three options. Agent settings and permissions can be further customized below.':
        'Выберите один из трёх режимов. Настройки и разрешения можно уточнить ниже.',
    'Full access':'Полный доступ',
    'Agents have full access to your machine and external resources.':
        'Агенты имеют полный доступ к компьютеру и внешним ресурсам.',
    'Sandboxed':'Песочница',
    'Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.':
        'Агенты работают в песочнице с ограниченным доступом.',
    'Strict':'Строгий',
    'Terminal commands always require review and the agent cannot access files outside of its given workspaces.':
        'Команды всегда требуют проверки, доступ ограничен рабочими папками.',
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
        'Разрешает агенту доступ к файлам за пределами рабочей области.',
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
        'Использование токенов: навыки, правила и MCP. При превышении бюджета крупные настройки обрезаются.',
    'of the customization budget is available.':'бюджета настроек доступно.',
    'Rules':'Правила','Show 1 breakdown':'Показать разбивку',
    'Installed MCP Servers':'Установленные MCP-серверы',
    'Add MCP +':'Добавить MCP +','Refresh':'Обновить',
    'Open MCP Config':'Открыть конфиг MCP',
    'No MCP Servers':'Нет MCP-серверов',
    'You currently don\'t have any MCP Servers installed. Add an MCP server above or add a custom one via the MCP Config.':
        'MCP-серверы не установлены. Добавьте сервер или настройте через конфиг.',
    'Build With Google Plugins':'Плагины Google','Customize':'Настроить',
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
    'Select a model':'Выберите модель','Default model':'Модель по умолчанию'
};

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
function clickAll(p){var c=0;findBtns(p).forEach(function(b){b.click();c++;st.total++;});return c;}
function clickRetry(){
    if(!st.retry)return 0;if(Date.now()-st.lastR>60000)st.retryN=0;if(st.retryN>=st.maxR)return 0;
    var c=0;findBtns(RETRY_P).forEach(function(b){if(st.retryN<st.maxR){b.click();c++;st.retryN++;st.lastR=Date.now();}});return c;
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
    if(!st.on||!st.dots||st.sweeping||isPaused())return;
    var a=getActiveDots();if(!a.length)return;st.sweeping=true;var idx=0;
    function next(){if(idx>=a.length||isPaused()){st.sweeping=false;return;}a[idx].click();idx++;
    setTimeout(function(){clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);setTimeout(next,400);},700);}next();
}
function scan(){if(!st.on||st.sweeping||isPaused())return;clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);}

// === РУСИФИКАЦИЯ ===
function russify(){
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false),n;
    while(n=w.nextNode()){var t=n.textContent.trim();if(t&&TR[t])n.textContent=n.textContent.replace(t,TR[t]);}
    document.querySelectorAll('[placeholder]').forEach(function(el){var p=el.placeholder.trim();if(TR[p])el.placeholder=TR[p];});
    document.querySelectorAll('[title]').forEach(function(el){var t=el.title.trim();if(TR[t])el.title=TR[t];});
}

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
    p.querySelector('#t-on').onclick=function(){st.on=!st.on;setToggle(this,st.on);updateUI();};
    p.querySelector('#t-dots').onclick=function(){st.dots=!st.dots;setToggle(this,st.dots);};
    p.querySelector('#t-retry').onclick=function(){st.retry=!st.retry;setToggle(this,st.retry);};
    mI.onchange=function(){st.maxR=parseInt(this.value)||10;updateUI();};
    pI.onchange=function(){st.pauseSec=parseInt(this.value)||20;};
}

function tryCreateIDE(){
    // Ищем правый контейнер статусбара IDE
    var rightItems=document.querySelector('.part.statusbar > .right-items');
    if(!rightItems){
        // Пробуем общий контейнер
        var sb=document.querySelector('.part.statusbar');
        if(sb){
            // Ищем items-container с right элементами
            rightItems=sb.querySelector('.items-container')||sb;
        }
    }
    if(!rightItems){
        // Статусбар ещё не загрузился — ретрай
        st.initRetries++;
        if(st.initRetries<15){
            setTimeout(tryCreateIDE,2000);
        }
        return false;
    }
    // Создаём элемент в статусбаре
    var item=makeEl('div','display:inline-flex;align-items:center;gap:4px;padding:0 8px;cursor:pointer;height:22px;line-height:22px;font-size:12px;color:inherit;');
    item.id='ac-bar';
    item.className='statusbar-item right';
    var led=makeEl('span','width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;display:inline-block;');
    led.id='ac-led';item.appendChild(led);
    item.appendChild(makeEl('span','','AC'));
    var cnt=makeEl('span','font-weight:bold;','0');cnt.id='ac-cnt';item.appendChild(cnt);
    // Вставляем в начало right-items (чтобы быть видимым)
    if(rightItems.firstChild){rightItems.insertBefore(item,rightItems.firstChild);}
    else{rightItems.appendChild(item);}
    st.bar=item;
    createPopup('bottom:26px;right:4px;');
    return true;
}

function createChat(){
    // Плавающая кнопка для Chat 2.0
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

    // Определяем среду
    var isIDE=!!document.querySelector('.monaco-workbench');
    var isSettings=!!(document.title&&(document.title.indexOf('Settings')>=0));

    if(isSettings){
        // В окне Settings — только русификация, без виджета
        return;
    }

    if(isIDE){
        tryCreateIDE();
    } else {
        createChat();
    }

    // Общие события
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
    createUI();
    st.iv=setInterval(function(){scan();updateUI();},2000);
    st.siv=setInterval(sweepDots,12000);
    russify();st.riv=setInterval(russify,3000);
    console.log('[AC] v27 запущен');
}
// IDE грузится дольше — ждём
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
