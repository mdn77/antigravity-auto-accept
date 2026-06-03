// autoclicker.js v28 — Чистый автокликер для Chat 2.0 + IDE
// IDE: кнопка в статусбаре .part.statusbar
// Chat 2.0: плавающая кнопка (синяя, круглая)
(function(){
'use strict';
if(window.__ANTIG_AUTOCLICKER){try{window.__ANTIG_AUTOCLICKER.destroy();}catch(e){}}

// === СОСТОЯНИЕ ===
var st={on:true,dots:false,retry:true,maxR:10,retryN:0,lastR:0,total:0,sweeping:false,lastActivity:0,pauseSec:20,iv:null,siv:null,bar:null,popup:null,initRetries:0};

// === СИНХРОНИЗАЦИЯ СОСТОЯНИЯ ===
function loadState(){
    try{
        var saved=localStorage.getItem('antig_ac_state');
        if(saved){
            var parsed=JSON.parse(saved);
            for(var k in parsed){
                if(k!=='bar'&&k!=='popup'&&k!=='iv'&&k!=='siv') st[k]=parsed[k];
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

// === АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЯ ===
function userActive(e){
    if(e.target&&e.target.closest&&(e.target.closest('#ac-bar')||e.target.closest('#ac-popup')))return;
    st.lastActivity=Date.now();
}
document.addEventListener('keydown',userActive,true);
document.addEventListener('mousedown',userActive,true);
document.addEventListener('wheel',userActive,true);
function isPaused(){return Date.now()-st.lastActivity<st.pauseSec*1000;}

// === ПОИСК И КЛИК КНОПОК ===
function matchesAny(t,p){t=(t||'').trim().toLowerCase();if(!t)return false;for(var i=0;i<p.length;i++)if(t===p[i]||t.indexOf(p[i])>=0)return true;return false;}
function findBtnsInNode(root, p, f) {
    if (!root) return;
    var btns = root.querySelectorAll ? root.querySelectorAll('button,[role="button"]') : [];
    btns.forEach(function(b) {
        if (b.offsetWidth > 0 && b.offsetHeight > 0 && !b.disabled && matchesAny(b.textContent, p)) {
            f.push(b);
        }
    });
    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    els.forEach(function(el) {
        if (el.shadowRoot) findBtnsInNode(el.shadowRoot, p, f);
        if (el.tagName === 'IFRAME') {
            try { if (el.contentDocument) findBtnsInNode(el.contentDocument, p, f); } catch (e) {}
        }
    });
}
function findBtns(p) {
    var f = [];
    findBtnsInNode(document.body, p, f);
    return f;
}
function clickAll(p){var c=0;findBtns(p).forEach(function(b){b.click();c++;st.total++;saveState();});return c;}
function clickRetry(){
    if(!st.retry)return 0;if(Date.now()-st.lastR>60000)st.retryN=0;if(st.retryN>=st.maxR)return 0;
    var c=0;findBtns(RETRY_P).forEach(function(b){if(st.retryN<st.maxR){b.click();c++;st.retryN++;st.lastR=Date.now();saveState();}});return c;}

// === ОБХОД ТОЧЕК ===
function findDotsInNode(root, r) {
    if (!root) return;
    var els = root.querySelectorAll ? root.querySelectorAll('div.cursor-pointer.rounded-lg') : [];
    els.forEach(function(el) {
        var c = el.className || '';
        if (c.indexOf('select-none') < 0 || c.indexOf('min-h-') < 0) return;
        if (el.getBoundingClientRect().left > 280) return;
        if (el.querySelector('.animate-unread-ping') || el.querySelector('div.bg-primary.rounded-full')) {
            r.push(el);
        }
    });
    var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    all.forEach(function(el) {
        if (el.shadowRoot) findDotsInNode(el.shadowRoot, r);
        if (el.tagName === 'IFRAME') {
            try { if (el.contentDocument) findDotsInNode(el.contentDocument, r); } catch (e) {}
        }
    });
}
function getActiveDots() {
    var r = [];
    findDotsInNode(document.body, r);
    return r;
}
function sweepDots(){
    loadState();if(!st.on||!st.dots||st.sweeping||isPaused())return;
    var a=getActiveDots();if(!a.length)return;st.sweeping=true;var idx=0;
    function next(){if(idx>=a.length||isPaused()){st.sweeping=false;return;}a[idx].click();idx++;
    setTimeout(function(){clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);setTimeout(next,400);},700);}next();}
function scan(){
    loadState();if(!st.on||st.sweeping||isPaused())return;
    clickAll(SUBMIT)||clickRetry()||clickAll(ACCEPT);}

// === UI СОЗДАНИЕ ===
function makeEl(tag,css,text){var el=document.createElement(tag);if(css)el.style.cssText=css;if(text)el.textContent=text;return el;}
function mkToggle(id,label,checked){
    var r=makeEl('div','display:flex;align-items:center;justify-content:space-between;padding:4px 0;cursor:pointer;user-select:none;');
    r.className='ac-toggle-row';
    r.setAttribute('data-id', id);
    r.appendChild(makeEl('span','font-size:12px;pointer-events:none;',label));
    var sw=makeEl('div','width:30px;height:16px;border-radius:8px;background:'+(checked?'#166534':'#333')+';pointer-events:none;position:relative;transition:all .3s;');
    sw.id=id;var k=makeEl('div','width:12px;height:12px;border-radius:50%;background:'+(checked?'#4ade80':'#555')+';position:absolute;top:2px;left:'+(checked?'16px':'2px')+';transition:all .3s;');
    sw.appendChild(k);r.appendChild(sw);return r;}
function setToggle(el,on){if(!el)return;el.style.background=on?'#166534':'#333';var k=el.firstChild;if(k){k.style.background=on?'#4ade80':'#555';k.style.left=on?'16px':'2px';}}

function createPopup(pos){
    var p=makeEl('div','display:none;position:fixed;'+pos+'background:rgba(24,24,27,0.97);backdrop-filter:blur(16px);color:#e0e0e0;padding:12px 16px;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.5);font:12px -apple-system,BlinkMacSystemFont,sans-serif;z-index:999999;border:1px solid rgba(255,255,255,0.1);user-select:none;min-width:200px;pointer-events:auto !important;');
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

    p.addEventListener('click', function(e) { e.stopPropagation(); });

    var stopKeys = function(e) { e.stopPropagation(); };
    mI.addEventListener('keydown', stopKeys, true);
    mI.addEventListener('keyup', stopKeys, true);
    mI.addEventListener('keypress', stopKeys, true);
    pI.addEventListener('keydown', stopKeys, true);
    pI.addEventListener('keyup', stopKeys, true);
    pI.addEventListener('keypress', stopKeys, true);

    p.querySelectorAll('.ac-toggle-row').forEach(function(row) {
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            var targetId = this.getAttribute('data-id');
            var sw = this.querySelector('#' + targetId);
            if (targetId === 't-on') {
                st.on = !st.on;
                setToggle(sw, st.on);
                saveState();
                updateUI();
            } else if (targetId === 't-dots') {
                st.dots = !st.dots;
                setToggle(sw, st.dots);
                saveState();
            } else if (targetId === 't-retry') {
                st.retry = !st.retry;
                setToggle(sw, st.retry);
                saveState();
            }
        }, true);
    });

    mI.onchange=function(){st.maxR=parseInt(this.value)||10;saveState();updateUI();};
    pI.onchange=function(){st.pauseSec=parseInt(this.value)||20;saveState();};}

function tryCreateIDE(){
    var sb=document.querySelector('.part.statusbar')||document.querySelector('[id="workbench.parts.statusbar"]');
    if(!sb){
        st.initRetries++;
        if(st.initRetries<40)setTimeout(tryCreateIDE,1000);
        return false;
    }
    var container=sb.querySelector('.right-items')||sb.querySelector('.items-container')||sb;
    if(!container){setTimeout(tryCreateIDE,1000);return false;}
    var old=document.getElementById('ac-bar');if(old)old.remove();
    var item=makeEl('div','display:inline-flex;align-items:center;gap:4px;padding:0 8px;cursor:pointer;height:22px;line-height:22px;font-size:12px;color:inherit;margin-left:8px;margin-right:8px;pointer-events:auto !important;');
    item.id='ac-bar';item.className='statusbar-item right';item.setAttribute('role','button');item.title='AutoClicker Settings';
    var led=makeEl('span','width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;display:inline-block;margin-right:4px;');
    led.id='ac-led';item.appendChild(led);item.appendChild(makeEl('span','font-weight:600;','AC'));
    var cnt=makeEl('span','font-weight:bold;margin-left:2px;','0');cnt.id='ac-cnt';item.appendChild(cnt);
    if(container.classList.contains('right-items')||container.querySelector('.right-items')){
        container.insertBefore(item,container.firstChild);
    }else{container.appendChild(item);}
    st.bar=item;createPopup('bottom:26px;right:10px;');
    item.addEventListener('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        if(st.popup){
            st.popup.style.display=st.popup.style.display==='none'?'block':'none';
            updateUI();
        }
    }, true);
    return true;}

function createChat(){
    var bar=makeEl('div','position:fixed;bottom:8px;right:12px;height:28px;display:flex;align-items:center;gap:6px;padding:0 12px;background:rgba(0,122,204,0.92);color:#fff;font:12px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;z-index:999999;user-select:none;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.4);pointer-events:auto !important;');
    bar.id='ac-bar';
    var led=makeEl('span','width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;');
    led.id='ac-led';bar.appendChild(led);bar.appendChild(makeEl('span','font-weight:600;','AutoClick'));
    var cnt=makeEl('span','font-weight:bold;','0');cnt.id='ac-cnt';bar.appendChild(cnt);
    bar.appendChild(makeEl('span','font-size:9px;opacity:0.6;','\u25B2'));
    document.body.appendChild(bar);st.bar=bar;createPopup('bottom:42px;right:12px;');
    bar.addEventListener('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        if(st.popup){
            st.popup.style.display=st.popup.style.display==='none'?'block':'none';
            updateUI();
        }
    }, true);}

function createUI(){
    ['ac-bar','ac-popup'].forEach(function(id){var o=document.getElementById(id);if(o)o.remove();});
    var isMainWindow=!!document.querySelector('.monaco-workbench');
    var isIDE=isMainWindow||window.location.href.indexOf('workbench.html')>=0||window.location.protocol==='vscode-file:';
    if(isIDE){tryCreateIDE();
    }else{if(document.querySelector('[data-testid]')||document.querySelector('.bg-background')||window.location.href.indexOf('localhost')>=0){createChat();}}
    document.addEventListener('click',function(e){if(st.popup&&st.bar&&!st.popup.contains(e.target)&&!st.bar.contains(e.target))st.popup.style.display='none';});}

function updateUI(){
    loadState();if(!st.bar)return;
    var led=st.bar.querySelector('#ac-led');var p=isPaused();
    if(led){led.style.background=st.on?(p?'#f59e0b':'#4ade80'):'#666';led.style.boxShadow=st.on?(p?'0 0 6px #f59e0b':'0 0 6px #4ade80'):'none';}
    var c=st.bar.querySelector('#ac-cnt');if(c)c.textContent=st.total;
    if(!st.popup)return;
    var a=st.popup.querySelector('#s-acc');if(a)a.textContent=st.total;
    var r=st.popup.querySelector('#s-ret');if(r)r.textContent=st.retryN;
    var m=st.popup.querySelector('#s-maxr');if(m)m.textContent=st.maxR;
    var sp=st.popup.querySelector('#s-pause');
    if(sp){if(p&&st.on){sp.textContent='Пауза '+Math.ceil(st.pauseSec-(Date.now()-st.lastActivity)/1000)+'с';sp.style.color='#f59e0b';}
    else{sp.textContent=st.on?'Активен':'Выкл';sp.style.color=st.on?'#4ade80':'#666';}}}

// === ЗАПУСК ===
function init(){
    if(!document.body){setTimeout(init,500);return;}
    loadState();createUI();st.iv=setInterval(function(){scan();updateUI();},2000);st.siv=setInterval(sweepDots,12000);
    console.log('[AC] v28 запущен (без русификации)');
}
setTimeout(init,document.querySelector('.monaco-workbench')?4000:500);

window.__ANTIG_AUTOCLICKER={destroy:function(){
    clearInterval(st.iv);clearInterval(st.siv);if(st.bar)st.bar.remove();if(st.popup)st.popup.remove();
    document.removeEventListener('keydown',userActive,true);document.removeEventListener('mousedown',userActive,true);document.removeEventListener('wheel',userActive,true);
    st.bar=null;st.popup=null;
}};
})();
