(function(){
'use strict';
if(window.__upzLayer)return;window.__upzLayer=true;
var $=function(id){return document.getElementById(id)};
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
function putSession(s){
  try{if(typeof setSession==='function'){setSession(s);return}}catch(e){}
  try{window.currentSession=s;sessionStorage.setItem('cerdasPlaySession',JSON.stringify(s))}catch(e){}
}
function isDark(){return document.documentElement.classList.contains('upx-dark')}

/* ============ font serif (Google Fonts, cadangan Georgia bila offline) ============ */
(function(){
  if(document.getElementById('upzFonts'))return;
  var pc=document.createElement('link');pc.rel='preconnect';pc.href='https://fonts.gstatic.com';pc.crossOrigin='';document.head.appendChild(pc);
  var l=document.createElement('link');l.id='upzFonts';l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Playfair+Display:wght@600..900&display=swap';
  document.head.appendChild(l);
})();

/* ============ UJI COBA GAME untuk Master & Admin ============
   Master/Admin dipindah sementara ke sesi "siswa uji coba" (id terpisah, semua level terbuka).
   Saat kembali dari game, sesi Master/Admin dipulihkan dan menu Game dibuka lagi. */
var ORIG_KEY='upzTesterOrig';
function orig(){try{return JSON.parse(sessionStorage.getItem(ORIG_KEY)||'null')}catch(e){return null}}
window.__upzTest=function(game){
  var s=sess();if(!s||s.role!=='admin')return;
  var lvl=s.adminLevel==='master'?'master':'admin',id='tester-'+lvl;
  sessionStorage.setItem(ORIG_KEY,JSON.stringify(s));
  for(var i=1;i<=4;i++){['math','logic','tebak'].forEach(function(g){var k='cerdasPlay:'+id+':'+g+'Level'+i+'Completed';if(localStorage.getItem(k)!=='true')localStorage.setItem(k,'true')})}
  putSession({role:'student',id:id,name:(lvl==='master'?'Master':'Admin')+' (uji coba)',className:'5A',email:'',absen:'',photo:'',tester:true,adminLevel:lvl});
  var btn={math:'openMathBtn',logic:'openLogicBtn',picture:'openPictureBtn'}[game];
  var b=btn&&$(btn);
  if(b)b.click();else window.showPage(game==='math'?'levels':game);
};
function backToAdmin(){
  var o=orig();sessionStorage.removeItem(ORIG_KEY);
  if(o)putSession(o);
  return o;
}
var sp=window.showPage;
if(typeof sp==='function'){
  window.showPage=function(n){
    var s=sess();
    if(s&&s.tester&&(n==='dashboard'||n==='admin'||n==='teacher')){
      backToAdmin();
      var r=sp.call(this,'admin');
      setTimeout(function(){var g=document.querySelector('#adMenu button[data-v="games"]');if(g)g.click()},0);
      return r;
    }
    if(n==='landing'&&!s)sessionStorage.removeItem(ORIG_KEY);
    return sp.apply(this,arguments);
  };
}

/* ============ tombol kembali saat bermain: pakai tombol asli di bawah garis waktu ============ */
/* (CSS menampilkan .back-btn bawaan halaman; #upxFback mengambang dimatikan) */

/* ============ transisi halus setiap klik ============ */
var lastClick=0;
document.addEventListener('pointerdown',function(e){
  lastClick=Date.now();
  if(REDUCE)return;
  var el=e.target.closest&&e.target.closest('button,.subject-card,.level-card,.upx-item,a.btn,[role="button"],.ad-b');
  if(!el||el.disabled||el.closest('.cd-timebar'))return;
  if(el.closest('body.upx-play .game-page,body.upx-play main'))return; /* papan game tidak diberi efek tekan */
  el.animate([{transform:'scale(1)'},{transform:'scale(.965)'},{transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
},true);
function watchContent(id){
  var el=$(id);if(!el||el.__upzW)return;el.__upzW=1;
  new MutationObserver(function(ms){
    if(Date.now()-lastClick>700||!window.__upxAnimateIn)return;
    if(ms.some(function(m){return m.type==='childList'&&m.addedNodes.length}))window.__upxAnimateIn(el,{soft:false});
  }).observe(el,{childList:true});
}
setInterval(function(){watchContent('adMain');watchContent('teacherGuruV4')},800);

/* ============ KONTRAS MODE GELAP (otomatis untuk semua elemen & popup) ============
   1) permukaan putih/terang di mode gelap -> warna permukaan gelap
   2) teks yang kontrasnya < 4.5 terhadap latar efektifnya -> warna terang/gelap yang kontras */
var MARK='data-upzdk';
function rgba(c){var m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c||'');return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null}
function stops(img){if(!img||img==='none'||/url\(/.test(img))return null;var r=[],re=/rgba?\([^)]*\)/g,m;while((m=re.exec(img)))r.push(rgba(m[0]));return r.length?r:null}
function avg(a){var o=[0,0,0];a.forEach(function(c){o[0]+=c[0];o[1]+=c[1];o[2]+=c[2]});return [o[0]/a.length,o[1]/a.length,o[2]/a.length,1]}
function boardCell(e){var p=e.parentElement;if(!p)return false;var n=p.children.length;if(n<9)return false;var d=getComputedStyle(p).display;return /grid/.test(d)||(n>=16)}
function L(c){var a=[c[0],c[1],c[2]].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function ratio(a,b){var x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
var PAGE=[20,20,19],SURF=[30,31,31],SURF2=[42,42,41],INK='#efe9e1',INK_DARK='#1e1f1f';
var SKIP='.level-outcome-stars,.game-stars,.cp-pstars,.game-result-stars,.up-st,.up-stars,#upxSide,#upxMenu,.upx-head,svg,canvas,img,video,iframe,script,style,input,select,textarea,option,.cd-timebar,#upzToast,.empty,#landingPage,#loginModal,#registerModal,.up-notif';
function revert(root){
  (root||document).querySelectorAll('['+MARK+']').forEach(function(e){
    freeze(e);var o=e.__upzOld||{};
    ['background-color','background-image','color','border-color'].forEach(function(p){
      if(o[p]===undefined)return;
      if(o[p])e.style.setProperty(p,o[p][0],o[p][1]);else e.style.removeProperty(p);
    });
    e.__upzOld=null;e.removeAttribute(MARK);
  });
}
function setP(e,p,v){
  freeze(e);
  e.__upzOld=e.__upzOld||{};
  if(e.__upzOld[p]===undefined){var cur=e.style.getPropertyValue(p);e.__upzOld[p]=cur?[cur,e.style.getPropertyPriority(p)]:null}
  e.style.setProperty(p,v,'important');e.setAttribute(MARK,'1');
}
function roots(){
  var out=[],v=null;
  document.querySelectorAll('.app-view').forEach(function(a){if(!a.classList.contains('hidden'))v=a});
  if(v)out.push(v);
  Array.prototype.forEach.call(document.body.children,function(c){
    if(c.classList.contains('app-view')||c.id==='upxSide'||c.id==='upxMenu'||c.tagName==='SCRIPT'||c.tagName==='STYLE')return;
    var cs=getComputedStyle(c);if(cs.display==='none'||cs.visibility==='hidden')return;
    if(c.offsetWidth||c.offsetHeight||cs.position==='fixed')out.push(c);
  });
  return out;
}
function visible(e){return e.offsetWidth>0||e.offsetHeight>0||e.getClientRects().length>0}
var frozen=[];
function freeze(e){if(e.__upzFz)return;e.__upzFz=[e.style.getPropertyValue('transition'),e.style.getPropertyPriority('transition')];e.style.setProperty('transition','none','important');frozen.push(e)}
function scan(){
  try{scanInner()}finally{
    if(frozen.length){void document.body.offsetWidth;frozen.forEach(function(e){var o=e.__upzFz;e.__upzFz=null;if(o&&o[0])e.style.setProperty('transition',o[0],o[1]);else e.style.removeProperty('transition')});frozen=[]}
  }
}
function scanInner(){
  revert(document);
  var DARK=isDark();
  if(!document.body.classList.contains('upx-app')&&!document.querySelector('.modal-overlay:not(.hidden),.cp-ov.cp-show,.level-outcome-overlay:not(.hidden),#cpRoomInter'))return;
  var rs=roots(),els=[];
  rs.forEach(function(r){els.push(r);Array.prototype.push.apply(els,r.querySelectorAll('*'))});
  els=els.filter(function(e){return !(e.closest&&e.closest(SKIP))&&visible(e)});
  var info=new Map();
  /* tahap 1: permukaan terang (hanya mode gelap) */
  if(DARK)
  els.forEach(function(e){
    var cs=getComputedStyle(e),bg=rgba(cs.backgroundColor);
    info.set(e,cs);
    var gs=stops(cs.backgroundImage),grad=false;
    if(cs.backgroundImage!=='none'){
      if(!gs||gs.some(function(c){return c[3]>.3&&(Math.min(c[0],c[1],c[2])<222||Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2])>30)}))return;
      grad=true;bg=bg&&bg[3]>=.55?bg:[255,255,255,1];
    }
    if(!bg||bg[3]<.55)return;
    if(boardCell(e))return;
    var mn=Math.min(bg[0],bg[1],bg[2]),mx=Math.max(bg[0],bg[1],bg[2]);
    if(mn<222||mx-mn>30)return;                       /* hanya putih / putih keabuan / ungu sangat muda */
    if(e.offsetWidth<56&&e.offsetHeight<56)return;     /* sel papan game kecil dibiarkan */
    var par=e.parentElement,pb=null;
    while(par&&par!==document.documentElement){var pc=rgba(getComputedStyle(par).backgroundColor);if(pc&&pc[3]>=.55&&getComputedStyle(par).backgroundImage==='none'){pb=pc;break}par=par.parentElement}
    var useS2=pb&&Math.abs(pb[0]-SURF[0])<4&&Math.abs(pb[2]-SURF[2])<4;
    if(grad)setP(e,'background-image','none');
    setP(e,'background-color',useS2?'rgb('+SURF2.join(',')+')':'rgb('+SURF.join(',')+')');
    var bc=rgba(cs.borderTopColor);
    if(bc&&Math.min(bc[0],bc[1],bc[2])>200)setP(e,'border-color','#3a3936');
  });
  /* tahap 2: teks */
  var bgCache=new Map();
  function effBg(e){
    var chain=[],x=e,res=null;
    while(x&&x.nodeType===1){
      if(bgCache.has(x)){res=bgCache.get(x);break}
      chain.push(x);
      var cs=getComputedStyle(x);
      if(cs.backgroundImage&&cs.backgroundImage!=='none'&&!/url\(/.test(cs.backgroundImage)){var st=stops(cs.backgroundImage);if(st&&st.every(function(c){return c[3]>.6})){res=avg(st);break}if(!st||!st.length){res='grad';break}}
      var b=rgba(cs.backgroundColor);
      if(b&&b[3]>=.5){res=b;break}
      if(x===document.body||x===document.documentElement){res=PAGE;break}
      x=x.parentElement;
    }
    if(!res)res=PAGE;
    chain.forEach(function(c){bgCache.set(c,res)});
    return res;
  }
  els.forEach(function(e){
    var has=false;
    for(var n=e.firstChild;n;n=n.nextSibling){if(n.nodeType===3&&/\S/.test(n.nodeValue)){has=true;break}} /* termasuk simbol bentuk (◆ ▲ ♥) di soal pola */
    if(!has)return;
    var cs=getComputedStyle(e),fg=rgba(cs.color);if(!fg)return;
    if(parseFloat(cs.opacity)<.2)return;
    var bg=effBg(e);if(bg==='grad')return;
    if(ratio(fg,bg)>=4.5)return;
    /* mode terang: teks abu-abu yang terlalu pucat dipertegas ke abu tua palet (tetap ada hirarki) */
    setP(e,'color',L(bg)<.35?INK:(DARK?INK_DARK:(ratio([79,76,72,1],bg)>=4.5?'#4f4c48':INK_DARK)));
  });
}
var queued=false,lastRun=0,timer=0;
var slowScan=false;
function schedule(){
  if(queued)return;queued=true;
  /* dijalankan sebagai microtask: selesai sebelum browser menggambar, jadi tidak ada kedip putih */
  var go=function(){queued=false;var t0=performance.now();lastRun=Date.now();try{scan()}catch(err){}slowScan=performance.now()-t0>40};
  if(slowScan){var wait=Math.max(0,120-(Date.now()-lastRun));timer=setTimeout(function(){requestAnimationFrame(go)},wait)}
  else Promise.resolve().then(go);
}
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){
    var m=ms[i];
    if(m.type==='attributes'&&(m.attributeName===MARK||m.attributeName==='style'))continue;
    var t=m.target;if(t.closest&&t.closest('#upxSide,#upxMenu,.upx-head'))continue;
    var te=t.nodeType===1?t:t.parentElement;if(te&&!(m.type==='attributes'&&m.attributeName==='class'&&/(^|\s)(app-view|modal-overlay|cp-ov|level-outcome-overlay)(\s|$)/.test(te.className))&&!te.getClientRects().length)continue;
    schedule();return;
  }
}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden','open']});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',schedule);
window.__upzContrast=scan;
schedule();
})();
