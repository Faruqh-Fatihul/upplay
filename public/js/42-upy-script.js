(function(){
'use strict';
if(window.__upyShell)return;window.__upyShell=true;
var $=function(id){return document.getElementById(id)};
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
var PLAY={snakeGamePage:1,logicGamePage:1,pictureGamePage:1,memoryPage:1,tugWarPage:1,crosswordGamePage:1,mathMazePage:1,safeCrackerPage:1,lgPlayPage:1,ttPlayPage:1};
var NOT_BACK=/^(logoutBtn|teacherLogoutBtn|adminLogoutBtn|roleLogoutBtn|joinRoomBtn|studentNotificationBtn)$/;
var EMOJI=/(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍(?:\p{Extended_Pictographic}))*️?/gu;
function clean(t){return String(t||'').replace(EMOJI,'').replace(/[←→⇥✦]/g,'').replace(/\s+/g,' ').trim()}
function curView(){var a=document.querySelectorAll('.app-view');for(var i=0;i<a.length;i++){if(!a[i].classList.contains('hidden'))return a[i]}return null}

/* ===== tombol kembali kiri-atas saat bermain (sidebar, tanggal, garis tiga disembunyikan lewat CSS) ===== */
var fb=document.createElement('button');
fb.id='upxFback';fb.type='button';fb.setAttribute('aria-label','Kembali');
fb.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span>Kembali</span>';
document.body.appendChild(fb);
var target=null;
function findTarget(v){
  var inb=null,hb=null;
  v.querySelectorAll('button,a').forEach(function(b){
    if(b.closest('.upx-head'))return;
    var top=b.closest('header.topbar');
    if(!top&&!inb&&(b.classList.contains('back-btn')||/^←$/.test(b.textContent.trim())))inb=b;
    if(top&&!hb&&b.tagName==='BUTTON'&&!NOT_BACK.test(b.id)&&!b.classList.contains('student-notification'))hb=b;
  });
  var brand=v.querySelector('header.topbar .brand');
  var label=hb?clean(hb.textContent):'';
  return {el:inb||hb||brand,label:label||'Kembali'};
}
fb.addEventListener('click',function(){if(target&&target.el)target.el.click()});
var lastSig='';
function sync(){
  var v=curView(),r=sess()&&sess().role;
  var play=!!(v&&r&&PLAY[v.id]);
  document.body.classList.toggle('upx-play',play);
  if(!play){lastSig='';return}
  var t=findTarget(v),sig=v.id+'|'+t.label;
  target=t;
  if(sig!==lastSig){lastSig=sig;fb.querySelector('span').textContent=t.label;fb.setAttribute('aria-label',t.label);fb.title=t.label}
}
setInterval(sync,200);
new MutationObserver(sync).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class'],attributeOldValue:false});

/* ===== grafik garis jumlah siswa: naik dari 0 ke jumlah sebenarnya saat dashboard dibuka ===== */
function runAnim(fn){
  var t0=performance.now(),D=1300;window.__upxF=0;
  (function step(t){
    var p=Math.min(1,((t||performance.now())-t0)/D);
    window.__upxF=p>=1?null:1-Math.pow(1-p,3);
    try{fn()}catch(e){}
    if(p<1)requestAnimationFrame(step);else window.__upxF=null;
  })(t0);
}
var vis={s:false,t:false};
function shown(el){return !!(el&&(el.offsetWidth||el.offsetHeight||el.getClientRects().length))}
function watchCharts(){
  var sc=$('sdClassChart'),sv=shown(sc)&&!!sc.querySelector('svg');
  var tw=document.querySelector('#teacherGuruV4 .tg4-chart-wrap'),tv=shown(tw);
  if(sv&&!vis.s&&typeof window.renderStudentDashboardCharts==='function')runAnim(window.renderStudentDashboardCharts);
  if(tv&&!vis.t&&typeof window.__tgChartRefresh==='function')runAnim(window.__tgChartRefresh);
  vis.s=sv;vis.t=tv;
}
setInterval(watchCharts,150);
})();
