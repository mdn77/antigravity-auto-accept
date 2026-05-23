// autoclicker.js v21 - Автокликер для Antigravity 2.0
// Автоматическое нажатие кнопок Submit + обход проектов с синими точками + автоповтор + пауза при активности пользователя
(function(){
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,iv:null,siv:null,ui:null,lastActivity:0,pauseSec:20};

// Функция регистрации активности пользователя
function userActive(e){
    if(e.target.closest&&e.target.closest('#antig-autoclicker'))return;
    st.lastActivity=Date.now();
}

// Слушатели событий активности (клавиатура, мышь, скролл)
document.addEventListener('keydown',userActive,true);
document.addEventListener('mousedown',userActive,true);
document.addEventListener('wheel',userActive,true);

// Проверка, находится ли кликер на паузе из-за действий пользователя
function isPaused(){
    return Date.now()-st.lastActivity<st.pauseSec*1000;
}

// Генерация HTML-переключателей для интерфейса
function mkT(id,l,c){
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;"><span style="font-size:12px;">'+l+'</span><div id="'+id+'" style="width:32px;height:18px;border-radius:9px;background:'+(c?'#166534':'#333')+';cursor:pointer;position:relative;transition:all .3s;"><div style="width:14px;height:14px;border-radius:50%;background:'+(c?'#4ade80':'#555')+';position:absolute;top:2px;left:'+(c?'16px':'2px')+';transition:all .3s;box-shadow:'+(c?'0 0 6px #4ade80':'none')+';"></div></div></div>';
}

// Изменение состояния переключателя (визуальное)
function setT(el,on){
    el.style.background=on?'#166534':'#333';
    var k=el.firstChild;
    k.style.background=on?'#4ade80':'#555';
    k.style.left=on?'16px':'2px';
    k.style.boxShadow=on?'0 0 6px #4ade80':'none';
}

// Сканирование текущей страницы на наличие активных кнопок Submit
function clickSubmits(){
    var c=0;
    document.querySelectorAll('button.bg-accent').forEach(function(b){
        if(b.offsetWidth>0&&(b.textContent||'').indexOf('Submit')>=0){
            b.click();
            c++;
            st.total++;
        }
    });
    return c;
}

// Обработка кнопки Retry при возникновении ошибок сети/соединения
function clickRetry(){
    if(!st.retry)return 0;
    if(Date.now()-st.lastR>60000)st.retryN=0;
    if(st.retryN>=st.maxR)return 0;
    var c=0;
    document.querySelectorAll('button').forEach(function(b){
        if(b.offsetWidth>0&&st.retryN<st.maxR){
            var t=(b.textContent||'').trim().toLowerCase();
            if(t==='retry'||t==='try again'){
                b.click();
                c++;
                st.retryN++;
                st.lastR=Date.now();
                console.log('[AC] Выполнен повтор #' + st.retryN + '/' + st.maxR);
            }
        }
    });
    return c;
}

// Получение списка проектов в левой панели, имеющих синий индикатор
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

// Периодический обход проектов с синими индикаторами
function sweepDots(){
    if(!st.on||!st.dots||st.sweeping)return;
    if(isPaused()){
        return;
    }
    var active=getActiveDots();
    if(active.length===0){
        return;
    }
    st.sweeping=true;
    var idx=0;
    console.log('[AC] Запуск обхода активных проектов: '+active.length);
    function next(){
        if(idx>=active.length||isPaused()){
            st.sweeping=false;
            updateUI();
            return;
        }
        var name=(active[idx].textContent||'').trim().substring(0,30);
        active[idx].click();
        idx++;
        setTimeout(function(){
            var c=clickSubmits();
            if(c===0)clickRetry();
            setTimeout(next,400);
        },700);
    }
    next();
}

// Быстрое сканирование текущего открытого окна
function scan(){
    if(!st.on||st.sweeping)return;
    var c=clickSubmits();
    if(c===0)c=clickRetry();
    if(c>0){
        updateUI();
        console.log('[AC] Кликнут Submit #' + st.total);
    }
}

// Рендеринг пользовательского интерфейса панели управления
function createUI(){
    var el=document.createElement('div');
    el.id='antig-autoclicker';
    el.style.cssText='position:fixed;bottom:60px;right:16px;background:rgba(24,24,27,0.96);backdrop-filter:blur(16px);color:#e0e0e0;padding:0;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.6);font:13px -apple-system,BlinkMacSystemFont,sans-serif;z-index:999999;border:1px solid rgba(255,255,255,0.08);user-select:none;min-width:190px;';
    el.innerHTML='<div id="ac-hdr" style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);"><span id="ac-led" style="width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;flex-shrink:0;"></span><span style="font-weight:600;font-size:13px;flex:1;">AutoClick</span><span id="ac-cnt" style="color:#4ade80;font-weight:bold;font-size:14px;">0</span><span id="ac-arrow" style="color:#666;font-size:10px;margin-left:4px;">&#9660;</span></div>'
    +'<div id="ac-panel" style="display:none;padding:8px 14px 12px;">'
    +mkT('t-on','Автоклик Submit',true)
    +mkT('t-dots','Обход синих точек',false)
    +mkT('t-retry','Повтор при ошибках',true)
    +'<div style="display:flex;align-items:center;gap:6px;padding:4px 0;"><span style="font-size:11px;color:#888;">Попыток Retry:</span><input id="t-maxr" type="number" value="10" min="1" max="50" style="width:42px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:2px 4px;font-size:11px;text-align:center;"></div>'
    +'<div style="display:flex;align-items:center;gap:6px;padding:4px 0;"><span style="font-size:11px;color:#888;">Пауза (сек):</span><input id="t-pause" type="number" value="20" min="5" max="120" style="width:42px;background:#333;color:#e0e0e0;border:1px solid #444;border-radius:4px;padding:2px 4px;font-size:11px;text-align:center;"></div>'
    +'<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#666;">'
    +'<div>Нажато: <span id="s-acc" style="color:#4ade80;">0</span> &nbsp; Ретраи: <span id="s-ret" style="color:#f59e0b;">0</span>/<span id="s-maxr">10</span></div>'
    +'<div style="margin-top:2px;">Активные точки: <span id="s-dots" style="color:#60a5fa;">0</span> &nbsp; <span id="s-pause" style="color:#888;"></span></div></div></div>';
    document.body.appendChild(el);
    var exp=false;el.querySelector('#ac-hdr').onclick=function(){exp=!exp;el.querySelector('#ac-panel').style.display=exp?'block':'none';el.querySelector('#ac-arrow').textContent=exp?'\u25B2':'\u25BC'};
    el.querySelector('#t-on').onclick=function(){st.on=!st.on;setT(this,st.on);updateUI()};
    el.querySelector('#t-dots').onclick=function(){st.dots=!st.dots;setT(this,st.dots)};
    el.querySelector('#t-retry').onclick=function(){st.retry=!st.retry;setT(this,st.retry)};
    el.querySelector('#t-maxr').onchange=function(){st.maxR=parseInt(this.value)||10;updateUI()};
    el.querySelector('#t-pause').onchange=function(){st.pauseSec=parseInt(this.value)||20};
    st.ui=el;updateUI()}

// Обновление состояния светодиода и показателей
function updateUI(){if(!st.ui)return;var led=st.ui.querySelector('#ac-led');var paused=isPaused();led.style.background=st.on?(paused?'#f59e0b':'#4ade80'):'#666';led.style.boxShadow=st.on?(paused?'0 0 8px #f59e0b':'0 0 8px #4ade80'):'none';
st.ui.querySelector('#ac-cnt').textContent=st.total;
var a=st.ui.querySelector('#s-acc');if(a)a.textContent=st.total;
var r=st.ui.querySelector('#s-ret');if(r)r.textContent=st.retryN;
var m=st.ui.querySelector('#s-maxr');if(m)m.textContent=st.maxR;
var d=st.ui.querySelector('#s-dots');if(d)d.textContent=getActiveDots().length;
var p=st.ui.querySelector('#s-pause');if(p){if(paused&&st.dots){var left=Math.ceil(st.pauseSec-(Date.now()-st.lastActivity)/1000);p.textContent='Пауза '+left+'с';p.style.color='#f59e0b'}else{p.textContent=st.dots?'Готов':'';p.style.color='#4ade80'}}}

// Запуск плагинов при полной готовности body
function init(){if(!document.body){setTimeout(init,500);return}createUI();st.iv=setInterval(function(){scan();updateUI()},2000);st.siv=setInterval(sweepDots,12000);console.log('[AC] v21 запущен')}
init();

// Регистрация интерфейса удаления
window.__ANTIG_AUTOCLICKER={destroy:function(){clearInterval(st.iv);clearInterval(st.siv);if(st.ui)st.ui.remove();document.removeEventListener('keydown',userActive,true);document.removeEventListener('mousedown',userActive,true);document.removeEventListener('wheel',userActive,true)}};
})();
