// autoclicker.js v24 — Универсальный автокликер + русификация
// Работает в Chat 2.0 И в Antigravity IDE
// Не использует innerHTML (совместимость с trusted-types CSP)
(function(){
'use strict';

// === СОСТОЯНИЕ ===
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,iv:null,siv:null,riv:null,ui:null,lastActivity:0,pauseSec:20};

// === ПАТТЕРНЫ КНОПОК (EN + RU) ===
var SUBMIT_PATTERNS = ['submit', 'send', 'отправить'];
var RETRY_PATTERNS = ['retry', 'try again', 'повторить', 'попробовать снова'];
var ACCEPT_PATTERNS = [
    'yes, allow this time', 'yes, and always allow when not in a project',
    'yes, and always allow', 'always proceed',
    'да, разрешить', 'да, всегда разрешать', 'всегда выполнять'
];

// === РУСИФИКАЦИЯ НАСТРОЕК IDE ===
var IDE_TRANSLATIONS = {
    // Настройки агента (панель справа)
    'Agent': 'Агент',
    'Agent Auto-Fix Lints': 'Авто-исправление ошибок',
    'Auto Execution': 'Авто-выполнение',
    'Review Policy': 'Политика проверки',
    'Customizations': 'Настройки',
    'Manage': 'Управление',
    'Tab': 'Автодополнение',
    'Suggestions in Editor': 'Подсказки в редакторе',
    'Tab Gitignore Access': 'Доступ к .gitignore',
    'Tab Speed': 'Скорость',
    'Tab to Import': 'Импорт по Tab',
    'Tab to Jump': 'Переход по Tab',
    'Snooze': 'Пауза',
    'Start': 'Начать',
    'Advanced Settings': 'Расширенные настройки',
    'Settings': 'Настройки',
    'AI Shortcuts': 'Горячие клавиши ИИ',
    'Request Review': 'Запросить проверку',
    // Настройки разрешений
    'Agent security mode': 'Режим безопасности агента',
    'Select one of the three options. Agent settings and permissions can be further customized below.':
        'Выберите один из трёх режимов. Настройки агента можно уточнить ниже.',
    'Full access': 'Полный доступ',
    'Agents have full access to your machine and external resources.':
        'Агенты имеют полный доступ к компьютеру и внешним ресурсам.',
    'Sandboxed': 'Песочница',
    'Agents run in a secure sandbox that restricts access to external resources outside of your trusted folders.':
        'Агенты работают в безопасной песочнице с ограниченным доступом за пределы доверенных папок.',
    'Strict': 'Строгий',
    'Terminal commands always require review and the agent cannot access files outside of its given workspaces.':
        'Команды терминала всегда требуют проверки, доступ к файлам ограничен рабочими папками.',
    'Terminal': 'Терминал',
    'Terminal Command Auto Execution': 'Авто-выполнение команд терминала',
    'Controls whether terminal commands require your approval before running.':
        'Определяет, нужно ли ваше одобрение перед выполнением команд.',
    'Enable Shell Integration': 'Интеграция с оболочкой',
    'When enabled, Agent will use IDE\'s shell integration to detect and report terminal command execution.':
        'Агент будет использовать интеграцию с оболочкой для отслеживания выполнения команд.',
    'File Access': 'Доступ к файлам',
    'Agent Non-Workspace File Access': 'Доступ к файлам вне проекта',
    'Allows the agent to access files outside of your current workspace.':
        'Разрешает агенту доступ к файлам за пределами рабочей области.',
    'Auto-Open Edited Files': 'Авто-открытие файлов',
    'Open files in the background if Agent creates or edits them':
        'Открывать файлы при их создании или редактировании агентом',
    'Planning': 'Планирование',
    'Shortcuts': 'Горячие клавиши',
    'Provide Feedback': 'Обратная связь',
    'General': 'Общие',
    'Account': 'Аккаунт',
    'Permissions': 'Разрешения',
    'Appearance': 'Оформление',
    'Notifications': 'Уведомления',
    'Models': 'Модели',
    'Browser': 'Браузер',
    'Editor': 'Редактор',
    'Workspaces': 'Проекты',
    'Code with Agent': 'Код с Агентом',
    'Ask anything, @ to mention, / for actions': 'Спрашивайте, @ для упоминаний, / для действий',
    // Значения выпадающих списков
    'On': 'Вкл',
    'Off': 'Выкл',
    'Fast': 'Быстро',
    'Normal': 'Нормально',
    'Slow': 'Медленно'
};

// === АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЯ ===
function userActive(e){
    if(e.target&&e.target.closest&&e.target.closest('#antig-autoclicker'))return;
    st.lastActivity=Date.now();
}
document.addEventListener('keydown',userActive,true);
document.addEventListener('mousedown',userActive,true);
document.addEventListener('wheel',userActive,true);

function isPaused(){
    return Date.now()-st.lastActivity<st.pauseSec*1000;
}

// === ПОИСК КНОПОК ===
function matchesAny(text, patterns){
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
            if(matchesAny(b.textContent, patterns)) found.push(b);
        }
    });
    if(found.length===0){
        document.querySelectorAll('[role="button"]').forEach(function(b){
            if(b.offsetWidth>0&&b.offsetHeight>0){
                if(matchesAny(b.textContent, patterns)) found.push(b);
            }
        });
    }
    return found;
}

// === КЛИКИ ===
function clickSubmits(){
    var c=0;
    findButtons(SUBMIT_PATTERNS).forEach(function(b){ b.click(); c++; st.total++; });
    return c;
}

function clickRetry(){
    if(!st.retry)return 0;
    if(Date.now()-st.lastR>60000)st.retryN=0;
    if(st.retryN>=st.maxR)return 0;
    var c=0;
    findButtons(RETRY_PATTERNS).forEach(function(b){
        if(st.retryN<st.maxR){ b.click(); c++; st.retryN++; st.lastR=Date.now(); }
    });
    return c;
}

function clickAccept(){
    var c=0;
    findButtons(ACCEPT_PATTERNS).forEach(function(b){ b.click(); c++; st.total++; });
    return c;
}

// === ОБХОД СИНИХ ТОЧЕК (только Chat 2.0) ===
function getActiveDots(){
    var items=[];
    document.querySelectorAll('div.cursor-pointer.rounded-lg').forEach(function(el){
        var cls=el.className||'';
        if(cls.indexOf('select-none')<0||cls.indexOf('min-h-')<0)return;
        if(el.getBoundingClientRect().left>280)return;
        if(el.querySelector('.animate-unread-ping')||el.querySelector('div.bg-primary.rounded-full'))
            items.push(el);
    });
    return items;
}

function sweepDots(){
    if(!st.on||!st.dots||st.sweeping)return;
    if(isPaused())return;
    var active=getActiveDots();
    if(active.length===0)return;
    st.sweeping=true;
    var idx=0;
    function next(){
        if(idx>=active.length||isPaused()){ st.sweeping=false; updateUI(); return; }
        active[idx].click(); idx++;
        setTimeout(function(){
            var c=clickSubmits(); if(c===0)c=clickRetry(); if(c===0)clickAccept();
            setTimeout(next,400);
        },700);
    }
    next();
}

// === СКАНИРОВАНИЕ ===
function scan(){
    if(!st.on||st.sweeping)return;
    if(isPaused())return;
    var c=clickSubmits();
    if(c===0)c=clickRetry();
    if(c===0)c=clickAccept();
    if(c>0){ updateUI(); }
}

// === РУСИФИКАЦИЯ IDE ===
function russifyIDE(){
    // Проходим по всем текстовым узлам и заменяем
    var walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while(node=walker.nextNode()){
        var text=node.textContent.trim();
        if(text && IDE_TRANSLATIONS[text]){
            node.textContent=node.textContent.replace(text, IDE_TRANSLATIONS[text]);
        }
    }
    // Плейсхолдеры в input/textarea
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function(el){
        var ph=el.placeholder.trim();
        if(IDE_TRANSLATIONS[ph]) el.placeholder=IDE_TRANSLATIONS[ph];
    });
}

// === UI (без innerHTML — через createElement) ===

function makeEl(tag, styles, text){
    var el=document.createElement(tag);
    if(styles) el.style.cssText=styles;
    if(text) el.textContent=text;
    return el;
}

function mkToggle(id, label, checked){
    var row=makeEl('div','display:flex;align-items:center;justify-content:space-between;padding:6px 0;');
    row.appendChild(makeEl('span','font-size:12px;',label));
    var sw=makeEl('div','width:32px;height:18px;border-radius:9px;background:'+(checked?'#166534':'#333')+';cursor:pointer;position:relative;transition:all .3s;');
    sw.id=id;
    var knob=makeEl('div','width:14px;height:14px;border-radius:50%;background:'+(checked?'#4ade80':'#555')+';position:absolute;top:2px;left:'+(checked?'16px':'2px')+';transition:all .3s;box-shadow:'+(checked?'0 0 6px #4ade80':'none')+';');
    sw.appendChild(knob);
    row.appendChild(sw);
    return row;
}

function setToggle(el,on){
    el.style.background=on?'#166534':'#333';
    var k=el.firstChild;
    k.style.background=on?'#4ade80':'#555';
    k.style.left=on?'16px':'2px';
    k.style.boxShadow=on?'0 0 6px #4ade80':'none';
}

function makeNumInput(id, label, value){
    var row=makeEl('div','display:flex;align-items:center;gap:6px;padding:4px 0;');
    row.appendChild(makeEl('span','font-size:11px;color:#888;',label));
    var inp=document.createElement('input');
    inp.type='number'; inp.id=id; inp.value=value; inp.min='1'; inp.max='120';
    inp.style.cssText='width:42px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:2px 4px;font-size:11px;text-align:center;';
    row.appendChild(inp);
    return row;
}

function createUI(){
    var old=document.getElementById('antig-autoclicker');
    if(old)old.remove();

    var el=makeEl('div','position:fixed;bottom:60px;right:16px;background:rgba(24,24,27,0.96);backdrop-filter:blur(16px);color:#e0e0e0;padding:0;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.6);font:13px -apple-system,BlinkMacSystemFont,sans-serif;z-index:999999;border:1px solid rgba(255,255,255,0.08);user-select:none;min-width:190px;');
    el.id='antig-autoclicker';

    // Заголовок
    var hdr=makeEl('div','display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);');
    var led=makeEl('span','width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;flex-shrink:0;');
    led.id='ac-led';
    hdr.appendChild(led);
    hdr.appendChild(makeEl('span','font-weight:600;font-size:13px;flex:1;','AutoClick'));
    var cnt=makeEl('span','color:#4ade80;font-weight:bold;font-size:14px;','0');
    cnt.id='ac-cnt';
    hdr.appendChild(cnt);
    var arrow=makeEl('span','color:#666;font-size:10px;margin-left:4px;','\u25BC');
    arrow.id='ac-arrow';
    hdr.appendChild(arrow);
    el.appendChild(hdr);

    // Панель настроек
    var panel=makeEl('div','display:none;padding:8px 14px 12px;');
    panel.id='ac-panel';
    panel.appendChild(mkToggle('t-on','Автоклик Submit',true));
    panel.appendChild(mkToggle('t-dots','Обход синих точек',false));
    panel.appendChild(mkToggle('t-retry','Повтор при ошибках',true));
    panel.appendChild(makeNumInput('t-maxr','Попыток Retry:','10'));
    panel.appendChild(makeNumInput('t-pause','Пауза (сек):','20'));

    // Статистика
    var stats=makeEl('div','margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#666;');
    var row1=makeEl('div','');
    row1.appendChild(document.createTextNode('Нажато: '));
    var sAcc=makeEl('span','color:#4ade80;','0'); sAcc.id='s-acc'; row1.appendChild(sAcc);
    row1.appendChild(document.createTextNode('  Ретраи: '));
    var sRet=makeEl('span','color:#f59e0b;','0'); sRet.id='s-ret'; row1.appendChild(sRet);
    row1.appendChild(document.createTextNode('/'));
    var sMaxr=makeEl('span','','10'); sMaxr.id='s-maxr'; row1.appendChild(sMaxr);
    stats.appendChild(row1);

    var row2=makeEl('div','margin-top:2px;');
    row2.appendChild(document.createTextNode('Точки: '));
    var sDots=makeEl('span','color:#60a5fa;','0'); sDots.id='s-dots'; row2.appendChild(sDots);
    row2.appendChild(document.createTextNode('  '));
    var sPause=makeEl('span','color:#888;',''); sPause.id='s-pause'; row2.appendChild(sPause);
    stats.appendChild(row2);
    panel.appendChild(stats);
    el.appendChild(panel);

    document.body.appendChild(el);

    // События
    var exp=false;
    hdr.onclick=function(){ exp=!exp; panel.style.display=exp?'block':'none'; arrow.textContent=exp?'\u25B2':'\u25BC'; };
    el.querySelector('#t-on').onclick=function(){ st.on=!st.on; setToggle(this,st.on); updateUI(); };
    el.querySelector('#t-dots').onclick=function(){ st.dots=!st.dots; setToggle(this,st.dots); };
    el.querySelector('#t-retry').onclick=function(){ st.retry=!st.retry; setToggle(this,st.retry); };
    el.querySelector('#t-maxr').onchange=function(){ st.maxR=parseInt(this.value)||10; updateUI(); };
    el.querySelector('#t-pause').onchange=function(){ st.pauseSec=parseInt(this.value)||20; };
    st.ui=el;
    updateUI();
}

function updateUI(){
    if(!st.ui)return;
    var led=st.ui.querySelector('#ac-led');
    var paused=isPaused();
    led.style.background=st.on?(paused?'#f59e0b':'#4ade80'):'#666';
    led.style.boxShadow=st.on?(paused?'0 0 8px #f59e0b':'0 0 8px #4ade80'):'none';
    st.ui.querySelector('#ac-cnt').textContent=st.total;
    var a=st.ui.querySelector('#s-acc');if(a)a.textContent=st.total;
    var r=st.ui.querySelector('#s-ret');if(r)r.textContent=st.retryN;
    var m=st.ui.querySelector('#s-maxr');if(m)m.textContent=st.maxR;
    var d=st.ui.querySelector('#s-dots');if(d)d.textContent=getActiveDots().length;
    var p=st.ui.querySelector('#s-pause');
    if(p){
        if(paused&&st.on){
            var left=Math.ceil(st.pauseSec-(Date.now()-st.lastActivity)/1000);
            p.textContent='Пауза '+left+'с'; p.style.color='#f59e0b';
        } else { p.textContent=st.on?'Активен':''; p.style.color='#4ade80'; }
    }
}

// === ЗАПУСК ===
function init(){
    if(!document.body){setTimeout(init,500);return;}
    createUI();
    st.iv=setInterval(function(){scan();updateUI();},2000);
    st.siv=setInterval(sweepDots,12000);
    // Русификация IDE (повторяем — MutationObserver для новых элементов)
    russifyIDE();
    st.riv=setInterval(russifyIDE,3000);
    console.log('[AC] v24 запущен — универсальный (Chat 2.0 + IDE, EN+RU)');
}
init();

// Интерфейс удаления
window.__ANTIG_AUTOCLICKER={destroy:function(){
    clearInterval(st.iv);clearInterval(st.siv);clearInterval(st.riv);
    if(st.ui)st.ui.remove();
    document.removeEventListener('keydown',userActive,true);
    document.removeEventListener('mousedown',userActive,true);
    document.removeEventListener('wheel',userActive,true);
}};
})();
