// autoclicker.js v25 — Универсальный автокликер + полная русификация
// Кнопка в нижней панели (статусбар), всплывающее меню настроек
// Chat 2.0 + Antigravity IDE, без innerHTML
(function(){
'use strict';

// Защита от дублирования
if(window.__ANTIG_AUTOCLICKER){
    try{window.__ANTIG_AUTOCLICKER.destroy();}catch(e){}
}

// === СОСТОЯНИЕ ===
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,iv:null,siv:null,riv:null,ui:null,popup:null,lastActivity:0,pauseSec:20};

// === ПАТТЕРНЫ КНОПОК (EN + RU) ===
var SUBMIT_PATTERNS = ['submit', 'send', 'отправить'];
var RETRY_PATTERNS = ['retry', 'try again', 'повторить', 'попробовать снова'];
var ACCEPT_PATTERNS = [
    'yes, allow this time', 'yes, and always allow when not in a project',
    'yes, and always allow', 'always proceed', 'yes, and always allow \'$json\'',
    'да, разрешить', 'да, всегда разрешать', 'всегда выполнять'
];

// === ПОЛНАЯ РУСИФИКАЦИЯ ===
var TRANSLATIONS = {
    // Заголовки настроек
    'Settings - Permissions': 'Настройки - Разрешения',
    'Settings - Appearance': 'Настройки - Оформление',
    'Settings - General': 'Настройки - Общие',
    'Settings - Models': 'Настройки - Модели',
    'Settings - Notifications': 'Настройки - Уведомления',
    'Settings - Customizations': 'Настройки - Настройки',
    'Settings - Browser': 'Настройки - Браузер',
    'Settings - Tab': 'Настройки - Автодополнение',
    'Settings - Editor': 'Настройки - Редактор',
    // Меню слева
    'General': 'Общие', 'Account': 'Аккаунт', 'Permissions': 'Разрешения',
    'Appearance': 'Оформление', 'Notifications': 'Уведомления', 'Models': 'Модели',
    'Customizations': 'Настройки', 'Browser': 'Браузер', 'Tab': 'Автодополнение',
    'Editor': 'Редактор', 'Workspaces': 'Проекты',
    'Shortcuts': 'Горячие клавиши', 'Provide Feedback': 'Обратная связь',
    // Агент (панель справа и настройки)
    'Agent': 'Агент', 'Agent Auto-Fix Lints': 'Авто-исправление ошибок',
    'Auto Execution': 'Авто-выполнение', 'Review Policy': 'Политика проверки',
    'Manage': 'Управление', 'Advanced Settings': 'Расширенные настройки',
    'Settings': 'Настройки', 'AI Shortcuts': 'Горячие клавиши ИИ',
    'Request Review': 'Запросить проверку',
    // Вкладка Автодополнение
    'Suggestions in Editor': 'Подсказки в редакторе',
    'Tab Gitignore Access': 'Доступ к .gitignore',
    'Tab Speed': 'Скорость', 'Tab to Import': 'Импорт по Tab',
    'Tab to Jump': 'Переход по Tab', 'Snooze': 'Пауза', 'Start': 'Начать',
    // Безопасность
    'Agent security mode': 'Режим безопасности агента',
    'Select one of the three options. Agent settings and permissions can be further customized below.':
        'Выберите один из трёх режимов. Настройки агента можно уточнить ниже.',
    'Full access': 'Полный доступ',
    'Agents have full access to your machine and external resources.':
        'Агенты имеют полный доступ к компьютеру и внешним ресурсам.',
    'Sandboxed': 'Песочница',
    'Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.':
        'Агенты работают в песочнице с ограниченным доступом за пределы доверенных папок.',
    'Strict': 'Строгий',
    'Terminal commands always require review and the agent cannot access files outside of its given workspaces.':
        'Команды терминала всегда требуют проверки, доступ к файлам ограничен рабочими папками.',
    // Терминал
    'Terminal': 'Терминал',
    'Terminal Command Auto Execution': 'Авто-выполнение команд терминала',
    'Controls whether terminal commands require your approval before running.':
        'Определяет, нужно ли ваше одобрение перед выполнением команд.',
    'Note: A change to this setting will only apply to new messages sent to Agent. In-progress responses will use the previous setting value.':
        'Примечание: изменение применится только к новым сообщениям. Текущие ответы используют предыдущее значение.',
    'Enable Shell Integration': 'Интеграция с оболочкой',
    'When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution.':
        'Агент будет использовать интеграцию с оболочкой для отслеживания команд.',
    // Доступ к файлам
    'File Access': 'Доступ к файлам',
    'Agent Non-Workspace File Access': 'Доступ к файлам вне проекта',
    'Allows the agent to access files outside of your current workspace.':
        'Разрешает агенту доступ к файлам за пределами рабочей области.',
    'Auto-Open Edited Files': 'Авто-открытие файлов',
    'Open files in the background if Agent creates or edits them':
        'Открывать файлы при их создании или редактировании агентом',
    'Planning': 'Планирование',
    // Оформление
    'Configure the agent\'s visual theme and display preferences.':
        'Настройка темы оформления и отображения агента.',
    'Chat Settings': 'Настройки чата',
    'Verbose agent chat': 'Подробный чат агента',
    'Display and preserve intermediate thinking steps':
        'Показывать и сохранять промежуточные шаги размышлений',
    // Горячие клавиши
    'Open Command': 'Открыть команду', 'No shortcut': 'Нет',
    'Open Agent': 'Открыть агента',
    'View all Antigravity IDE shortcuts': 'Все горячие клавиши Antigravity IDE',
    'Reset to default shortcuts': 'Сбросить горячие клавиши',
    // Разрешения диалогов
    'Allow running this command?': 'Разрешить выполнение этой команды?',
    'Yes, allow this time': 'Да, разрешить сейчас',
    'Yes, and always allow': 'Да, всегда разрешать',
    'No (tell the agent what to do instead)': 'Нет (указать агенту, что делать)',
    'Skip': 'Пропустить', 'Submit': 'Отправить', 'Send': 'Отправить',
    'Cancel': 'Отменить', 'Retry': 'Повторить', 'Close': 'Закрыть',
    'Save': 'Сохранить', 'Delete': 'Удалить', 'Copy': 'Копировать',
    'Edit': 'Редактировать', 'Open': 'Открыть',
    'Running': 'Выполняется', 'Idle': 'Ожидание', 'Thinking': 'Думает',
    'Loading': 'Загрузка', 'Stop': 'Стоп',
    'Code with Agent': 'Код с Агентом',
    'Ask anything, @ to mention, / for actions': 'Спрашивайте, @ для упоминаний, / для действий',
    'Open Folder': 'Открыть папку', 'Clone Repository': 'Клонировать репозиторий',
    // Значения
    'On': 'Вкл', 'Off': 'Выкл', 'Fast': 'Быстро',
    'Always proceed': 'Всегда выполнять', 'Always Ask': 'Всегда спрашивать',
    // Плейсхолдеры
    'Ask anything, @ to mention, / for actions': 'Спрашивайте, @ для упоминаний, / для действий',
    'Type a message...': 'Введите сообщение...'
};

// === АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЯ ===
function userActive(e){
    if(e.target&&e.target.closest&&e.target.closest('#ac-bar'))return;
    if(e.target&&e.target.closest&&e.target.closest('#ac-popup'))return;
    st.lastActivity=Date.now();
}
document.addEventListener('keydown',userActive,true);
document.addEventListener('mousedown',userActive,true);
document.addEventListener('wheel',userActive,true);

function isPaused(){ return Date.now()-st.lastActivity<st.pauseSec*1000; }

// === ПОИСК КНОПОК ===
function matchesAny(text,patterns){
    var t=(text||'').trim().toLowerCase();
    if(!t)return false;
    for(var i=0;i<patterns.length;i++){
        if(t===patterns[i]||t.indexOf(patterns[i])>=0)return true;
    }
    return false;
}

function findButtons(patterns){
    var found=[];
    document.querySelectorAll('button').forEach(function(b){
        if(b.offsetWidth>0&&b.offsetHeight>0&&!b.disabled){
            if(matchesAny(b.textContent,patterns))found.push(b);
        }
    });
    if(!found.length){
        document.querySelectorAll('[role="button"]').forEach(function(b){
            if(b.offsetWidth>0&&b.offsetHeight>0&&matchesAny(b.textContent,patterns))found.push(b);
        });
    }
    return found;
}

// === КЛИКИ ===
function clickSubmits(){
    var c=0;
    findButtons(SUBMIT_PATTERNS).forEach(function(b){b.click();c++;st.total++;});
    return c;
}
function clickRetry(){
    if(!st.retry)return 0;
    if(Date.now()-st.lastR>60000)st.retryN=0;
    if(st.retryN>=st.maxR)return 0;
    var c=0;
    findButtons(RETRY_PATTERNS).forEach(function(b){
        if(st.retryN<st.maxR){b.click();c++;st.retryN++;st.lastR=Date.now();}
    });
    return c;
}
function clickAccept(){
    var c=0;
    findButtons(ACCEPT_PATTERNS).forEach(function(b){b.click();c++;st.total++;});
    return c;
}

// === ОБХОД СИНИХ ТОЧЕК ===
function getActiveDots(){
    var items=[];
    document.querySelectorAll('div.cursor-pointer.rounded-lg').forEach(function(el){
        var cls=el.className||'';
        if(cls.indexOf('select-none')<0||cls.indexOf('min-h-')<0)return;
        if(el.getBoundingClientRect().left>280)return;
        if(el.querySelector('.animate-unread-ping')||el.querySelector('div.bg-primary.rounded-full'))items.push(el);
    });
    return items;
}

function sweepDots(){
    if(!st.on||!st.dots||st.sweeping||isPaused())return;
    var active=getActiveDots();
    if(!active.length)return;
    st.sweeping=true; var idx=0;
    function next(){
        if(idx>=active.length||isPaused()){st.sweeping=false;updateBar();return;}
        active[idx].click();idx++;
        setTimeout(function(){
            var c=clickSubmits();if(!c)c=clickRetry();if(!c)clickAccept();
            setTimeout(next,400);
        },700);
    }
    next();
}

function scan(){
    if(!st.on||st.sweeping||isPaused())return;
    var c=clickSubmits();if(!c)c=clickRetry();if(!c)c=clickAccept();
    if(c>0)updateBar();
}

// === РУСИФИКАЦИЯ ===
function russify(){
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
    var node;
    while(node=walker.nextNode()){
        var t=node.textContent.trim();
        if(t&&TRANSLATIONS[t]){
            node.textContent=node.textContent.replace(t,TRANSLATIONS[t]);
        }
    }
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function(el){
        var ph=el.placeholder.trim();
        if(TRANSLATIONS[ph])el.placeholder=TRANSLATIONS[ph];
    });
    // Заголовок окна настроек
    document.querySelectorAll('title,[class*="title"]').forEach(function(el){
        var t=el.textContent.trim();
        if(TRANSLATIONS[t])el.textContent=TRANSLATIONS[t];
    });
}

// === UI: КНОПКА В СТАТУСБАРЕ ===
function makeEl(tag,css,text){
    var el=document.createElement(tag);
    if(css)el.style.cssText=css;
    if(text)el.textContent=text;
    return el;
}

function createBar(){
    // Не создаём виджет в окнах Settings/настроек
    var title=document.title||'';
    if(title.indexOf('Settings')>=0||title.indexOf('Настройки')>=0)return;

    var old=document.getElementById('ac-bar');
    if(old)old.remove();
    var oldPopup=document.getElementById('ac-popup');
    if(oldPopup)oldPopup.remove();

    // Кнопка над статусбаром (bottom:22px для IDE, bottom:0 для Chat 2.0)
    var isIDE=!!document.querySelector('.monaco-workbench');
    var bottom=isIDE?'22px':'0';
    var bar=makeEl('div','position:fixed;bottom:'+bottom+';right:8px;height:22px;display:flex;align-items:center;gap:6px;padding:0 10px;background:rgba(0,122,204,0.9);color:#fff;font:11px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;z-index:999999;user-select:none;border-radius:4px 4px 0 0;');
    bar.id='ac-bar';

    var led=makeEl('span','width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;');
    led.id='ac-led';
    bar.appendChild(led);
    bar.appendChild(makeEl('span','font-weight:600;','AutoClick'));
    var cnt=makeEl('span','font-weight:bold;margin-left:2px;','0');
    cnt.id='ac-cnt';
    bar.appendChild(cnt);
    var arr=makeEl('span','font-size:9px;margin-left:2px;opacity:0.7;','\u25B2');
    bar.appendChild(arr);

    document.body.appendChild(bar);
    st.ui=bar;

    // Всплывающая панель
    var popupBottom=isIDE?'46px':'24px';
    var popup=makeEl('div','display:none;position:fixed;bottom:'+popupBottom+';right:8px;background:rgba(24,24,27,0.97);backdrop-filter:blur(16px);color:#e0e0e0;padding:12px 16px;border-radius:10px;box-shadow:0 -4px 24px rgba(0,0,0,0.5);font:12px -apple-system,BlinkMacSystemFont,sans-serif;z-index:999999;border:1px solid rgba(255,255,255,0.1);user-select:none;min-width:200px;');
    popup.id='ac-popup';

    // Переключатели
    popup.appendChild(mkToggle('t-on','Автоклик',true));
    popup.appendChild(mkToggle('t-dots','Обход точек',false));
    popup.appendChild(mkToggle('t-retry','Повтор ошибок',true));

    // Числовые поля
    var r1=makeEl('div','display:flex;align-items:center;gap:6px;padding:3px 0;');
    r1.appendChild(makeEl('span','font-size:11px;color:#888;','Ретраи:'));
    var maxrInp=document.createElement('input');
    maxrInp.type='number';maxrInp.id='t-maxr';maxrInp.value='10';maxrInp.min='1';maxrInp.max='50';
    maxrInp.style.cssText='width:40px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:1px 4px;font-size:11px;text-align:center;';
    r1.appendChild(maxrInp);
    r1.appendChild(makeEl('span','font-size:11px;color:#888;margin-left:8px;','Пауза:'));
    var pauseInp=document.createElement('input');
    pauseInp.type='number';pauseInp.id='t-pause';pauseInp.value='20';pauseInp.min='5';pauseInp.max='120';
    pauseInp.style.cssText='width:40px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:1px 4px;font-size:11px;text-align:center;';
    r1.appendChild(pauseInp);
    r1.appendChild(makeEl('span','font-size:11px;color:#666;','сек'));
    popup.appendChild(r1);

    // Статистика
    var stats=makeEl('div','margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#666;');
    var sr=makeEl('div','');
    sr.appendChild(document.createTextNode('Нажато: '));
    var sAcc=makeEl('span','color:#4ade80;','0');sAcc.id='s-acc';sr.appendChild(sAcc);
    sr.appendChild(document.createTextNode('  Ретраи: '));
    var sRet=makeEl('span','color:#f59e0b;','0');sRet.id='s-ret';sr.appendChild(sRet);
    sr.appendChild(document.createTextNode('/'));
    var sMaxr=makeEl('span','','10');sMaxr.id='s-maxr';sr.appendChild(sMaxr);
    sr.appendChild(document.createTextNode('  Точки: '));
    var sDots=makeEl('span','color:#60a5fa;','0');sDots.id='s-dots';sr.appendChild(sDots);
    stats.appendChild(sr);
    var sPause=makeEl('div','margin-top:2px;');
    var sPauseSpan=makeEl('span','color:#888;','');sPauseSpan.id='s-pause';sPause.appendChild(sPauseSpan);
    stats.appendChild(sPause);
    popup.appendChild(stats);

    document.body.appendChild(popup);
    st.popup=popup;

    // События
    var open=false;
    bar.onclick=function(e){
        e.stopPropagation();
        open=!open;
        popup.style.display=open?'block':'none';
    };
    document.addEventListener('click',function(e){
        if(open&&!popup.contains(e.target)&&!bar.contains(e.target)){
            open=false;popup.style.display='none';
        }
    });
    popup.querySelector('#t-on').onclick=function(){st.on=!st.on;setToggle(this,st.on);updateBar();};
    popup.querySelector('#t-dots').onclick=function(){st.dots=!st.dots;setToggle(this,st.dots);};
    popup.querySelector('#t-retry').onclick=function(){st.retry=!st.retry;setToggle(this,st.retry);};
    maxrInp.onchange=function(){st.maxR=parseInt(this.value)||10;updateBar();};
    pauseInp.onchange=function(){st.pauseSec=parseInt(this.value)||20;};

    updateBar();
}

function mkToggle(id,label,checked){
    var row=makeEl('div','display:flex;align-items:center;justify-content:space-between;padding:4px 0;');
    row.appendChild(makeEl('span','font-size:12px;',label));
    var sw=makeEl('div','width:30px;height:16px;border-radius:8px;background:'+(checked?'#166534':'#333')+';cursor:pointer;position:relative;transition:all .3s;');
    sw.id=id;
    var knob=makeEl('div','width:12px;height:12px;border-radius:50%;background:'+(checked?'#4ade80':'#555')+';position:absolute;top:2px;left:'+(checked?'16px':'2px')+';transition:all .3s;box-shadow:'+(checked?'0 0 4px #4ade80':'none')+';');
    sw.appendChild(knob);
    row.appendChild(sw);
    return row;
}

function setToggle(el,on){
    el.style.background=on?'#166534':'#333';
    var k=el.firstChild;
    k.style.background=on?'#4ade80':'#555';
    k.style.left=on?'16px':'2px';
    k.style.boxShadow=on?'0 0 4px #4ade80':'none';
}

function updateBar(){
    if(!st.ui)return;
    var led=st.ui.querySelector('#ac-led');
    var p=isPaused();
    led.style.background=st.on?(p?'#f59e0b':'#4ade80'):'#666';
    led.style.boxShadow=st.on?(p?'0 0 6px #f59e0b':'0 0 6px #4ade80'):'none';
    st.ui.querySelector('#ac-cnt').textContent=st.total;
    if(!st.popup)return;
    var a=st.popup.querySelector('#s-acc');if(a)a.textContent=st.total;
    var r=st.popup.querySelector('#s-ret');if(r)r.textContent=st.retryN;
    var m=st.popup.querySelector('#s-maxr');if(m)m.textContent=st.maxR;
    var d=st.popup.querySelector('#s-dots');if(d)d.textContent=getActiveDots().length;
    var sp=st.popup.querySelector('#s-pause');
    if(sp){
        if(p&&st.on){var left=Math.ceil(st.pauseSec-(Date.now()-st.lastActivity)/1000);sp.textContent='Пауза '+left+'с';sp.style.color='#f59e0b';}
        else{sp.textContent=st.on?'Активен':'Выкл';sp.style.color=st.on?'#4ade80':'#666';}
    }
}

// === ЗАПУСК ===
function init(){
    if(!document.body){setTimeout(init,500);return;}
    createBar();
    st.iv=setInterval(function(){scan();updateBar();},2000);
    st.siv=setInterval(sweepDots,12000);
    russify();
    st.riv=setInterval(russify,3000);
    console.log('[AC] v25 запущен — статусбар + полная русификация');
}
init();

window.__ANTIG_AUTOCLICKER={destroy:function(){
    clearInterval(st.iv);clearInterval(st.siv);clearInterval(st.riv);
    if(st.ui)st.ui.remove();if(st.popup)st.popup.remove();
    document.removeEventListener('keydown',userActive,true);
    document.removeEventListener('mousedown',userActive,true);
    document.removeEventListener('wheel',userActive,true);
}};
})();
