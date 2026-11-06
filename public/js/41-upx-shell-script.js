(function(){
'use strict';
if(window.__upxShell)return;window.__upxShell=true;

var $=function(id){return document.getElementById(id)};
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var MOBILE=function(){return window.matchMedia('(max-width:760px)').matches};
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};

/* ================= ikon garis (gaya sama dengan sidebar siswa) ================= */
var P={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
 gamepad:'<rect x="2" y="6" width="20" height="12" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="11" r=".9" fill="currentColor"/><circle cx="18" cy="13.4" r=".9" fill="currentColor"/>',
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4"/><path d="M12 13v4M8.5 20h7M10 17h4"/>',
 swords:'<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
 teacher:'<circle cx="8" cy="7" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><rect x="12" y="3" width="9.5" height="7" rx="1.2"/><path d="M14.5 13 18 10"/>',
 grad:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
 school:'<path d="m3 9 9-5 9 5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/><circle cx="12" cy="10.5" r="1.6"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
 logout:'<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h11"/>',
 sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 moon:'<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11z"/>',
 bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
 enter:'<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l4 4-4 4M18 12H8"/>',
 chevL:'<path d="m15 18-6-6 6-6"/>', chevR:'<path d="m9 18 6-6-6-6"/>',
 cal:'<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><circle cx="8.5" cy="14" r=".9" fill="currentColor"/><circle cx="12" cy="14" r=".9" fill="currentColor"/><circle cx="15.5" cy="14" r=".9" fill="currentColor"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeOff:'<path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 4.1-5"/><path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18.4 18.4 0 0 1-2.2 3.2"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/>',
 lock:'<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
 key:'<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 9-9M16 7l3 3M18.5 4.5 21 7"/>',
 wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
 rocket:'<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
 bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 broom:'<path d="M3 21l7-7"/><path d="M14 4l6 6-5 5-6-6z"/><path d="M9 9l-3 3 6 6 3-3"/>',
 download:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
 upload:'<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 19h16"/>',
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
 sparkles:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
 send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
 play:'<path d="M7 4.5v15l12-7.5z"/>', stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
 radio:'<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2"/>',
 medal:'<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3h4l2 4 2-4h4l-2.5 7"/>',
 hash:'<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
 brain:'<path d="M12 5.2v14"/><path d="M12 5.2a2.9 2.9 0 0 0-5-1.4A3.1 3.1 0 0 0 4.2 7.6a3.3 3.3 0 0 0 .3 5.5 3.2 3.2 0 0 0 2.7 5.2A2.9 2.9 0 0 0 12 19.2"/><path d="M12 5.2a2.9 2.9 0 0 1 5-1.4 3.1 3.1 0 0 1 2.8 3.8 3.3 3.3 0 0 1-.3 5.5 3.2 3.2 0 0 1-2.7 5.2A2.9 2.9 0 0 1 12 19.2"/><path d="M7.6 9.4c1.1.2 1.9 1 2.1 2.1M16.4 9.4c-1.1.2-1.9 1-2.1 2.1M7.4 14.6c.9-.6 2.1-.6 3 .1M16.6 14.6c-.9-.6-2.1-.6-3 .1"/>',
 image:'<circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 5.3 5.3"/><path d="M7.6 9.2a3.2 3.2 0 0 1 2.6-1.9"/>',
 clip:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M9 10h6M9 14h6"/>',
 check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>', checkC:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
 shuffle:'<path d="M3 7h3.5c3 0 4.5 10 8 10H21M3 17h3.5c1.5 0 2.5-2 3.5-4.5M14.5 7H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
 pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 pencil:'<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 hourglass:'<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
 dot:'<circle cx="12" cy="12" r="4" fill="currentColor"/>'
};
function svg(n,s){s=s||20;return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(P[n]||P.dot)+'</svg>'}

/* ================= tema gelap / terang ================= */
/* tema disimpan PER PENGGUNA: mengganti tema di satu akun tidak memengaruhi akun lain */
function themeKey(){var s=sess();if(!s)return 'upplayTheme:guest';return 'upplayTheme:'+(s.tester?'admin:'+(s.adminLevel||'admin'):s.role+':'+s.id)}
window.__upThemeKey=themeKey;
function theme(){try{return localStorage.getItem(themeKey())==='dark'?'dark':'light'}catch(e){return 'light'}}
window.__upxSetTheme=function(t){setTheme(t)};
function setTheme(t){
  try{localStorage.setItem(themeKey(),t)}catch(e){}
  document.documentElement.classList.toggle('upx-dark',t==='dark');
  document.querySelectorAll('[data-upx-theme]').forEach(function(b){b.classList.toggle('on',b.dataset.upxTheme===t);b.setAttribute('aria-pressed',b.dataset.upxTheme===t?'true':'false')});
}
document.documentElement.classList.toggle('upx-dark',theme()==='dark');

/* ================= data per peran ================= */
var HOME={student:'dashboard',teacher:'teacher',admin:'admin'};
var HOME_ID={student:'studentDashboard',teacher:'teacherPortalPage',admin:'adminPortalPage'};
var ICONS={
  student:{dashboard:'grid',profile:'user',game:'gamepad'},
  teacher:{dashboard:'grid',profile:'user',games:'gamepad',room:'target',scores:'trophy',pvp:'swords'},
  admin:{dash:'grid',students:'grad',teachers:'teacher',classes:'school',rooms:'target',scores:'trophy',games:'gamepad',settings:'settings'}
};
var SUB={student:'Dashboard Siswa',teacher:'Portal Guru',admin:'Portal Admin'};
var LOGOUT={student:'logoutBtn',teacher:'teacherLogoutBtn',admin:'adminLogoutBtn'};
var GAME_PAGES={snakeGamePage:1,logicGamePage:1,pictureGamePage:1,memoryPage:1,tugWarPage:1,crosswordGamePage:1,mathMazePage:1,safeCrackerPage:1,lgPlayPage:1,ttPlayPage:1};
var EMOJI_RE=/(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D(?:\p{Extended_Pictographic}))*\uFE0F?/gu;
function clean(t){return String(t||'').replace(EMOJI_RE,'').replace(/[←→⇥✦]/g,'').replace(/\s+/g,' ').trim()}

function testerOrig(){try{return JSON.parse(sessionStorage.getItem('upzTesterOrig')||'null')}catch(e){return null}}
function role(){var s=sess();if(s&&s.tester)return 'admin';return s&&s.role&&HOME[s.role]?s.role:null}
function items(r){
  var list=[];
  if(r==='student')document.querySelectorAll('#studentDashboard .student-menu[data-student-view]').forEach(function(b){list.push({key:b.dataset.studentView,label:clean(b.textContent),el:b})});
  if(r==='teacher')document.querySelectorAll('#teacherPortalPage .teacher-menu[data-teacher-vnext]').forEach(function(b){list.push({key:b.dataset.teacherVnext,label:clean(b.textContent),el:b})});
  if(r==='admin')document.querySelectorAll('#adMenu button[data-v]').forEach(function(b){list.push({key:b.dataset.v,label:clean(b.textContent),el:b})});
  return list;
}
function activeKey(r){
  var v=visibleView();
  if(r==='student'){
    if(v&&v.id!=='studentDashboard')return 'game';
    var a=document.querySelector('#studentDashboard .student-menu.active');return a?a.dataset.studentView:'dashboard';
  }
  if(r==='admin'&&sess()&&sess().tester)return 'games';
  if(v&&v.id!==HOME_ID[r]){if(r==='teacher'){if(v.id==='tugWarPage')return 'pvp';if(/^(mathLevelsPage|lgLevelsPage|ttLevelsPage|lgPlayPage|ttPlayPage|snakeGamePage|memoryPage|crosswordGamePage|mathMazePage|safeCrackerPage|pictureGamePage|logicGamePage|levelsPage)$/.test(v.id))return 'games'}return null}
  if(r==='teacher'){var t=document.querySelector('#teacherPortalPage .teacher-menu.active');return t?t.dataset.teacherVnext:'dashboard'}
  if(r==='admin'){var a2=document.querySelector('#adMenu button.on');return a2?a2.dataset.v:'dash'}
  return null;
}
function visibleView(){
  var all=document.querySelectorAll('.app-view');
  for(var i=0;i<all.length;i++){if(!all[i].classList.contains('hidden'))return all[i]}
  return null;
}

/* ================= SIDEBAR ================= */
var side=document.createElement('aside');
side.id='upxSide';side.setAttribute('aria-label','Menu utama');
side.innerHTML=
 '<div class="upx-brandrow">'+
   '<button class="upx-logo" type="button" id="upxLogo" aria-label="Buka atau tutup sidebar" aria-expanded="false" title="Buka/tutup menu"><span>✦</span></button>'+
   '<div class="upx-brandtext"><b>UpPlay</b><small id="upxSub">Dashboard</small></div>'+
   '<button class="upx-tab" type="button" id="upxTab" aria-label="Buka atau tutup sidebar">'+svg('chevR',14)+'</button>'+
 '</div>'+
 '<div class="upx-user"><div class="upx-ava" id="upxAva"></div><div class="upx-who"><b id="upxName">-</b><small id="upxClass"></small></div></div>'+
 '<nav class="upx-nav" id="upxNav"></nav>'+
 '<div class="upx-spacer"></div>'+
 '<div class="upx-bottom">'+
   '<button class="upx-item" type="button" id="upxHelp" data-tip="Bantuan">'+svg('help')+'<span class="upx-lbl">Bantuan</span></button>'+
   '<div class="upx-theme" role="group" aria-label="Tema tampilan">'+
     '<button type="button" data-upx-theme="light" title="Mode terang" aria-label="Mode terang">'+svg('sun',18)+'</button>'+
     '<button type="button" data-upx-theme="dark" title="Mode gelap" aria-label="Mode gelap">'+svg('moon',18)+'</button>'+
   '</div>'+
 '</div>';
var scrim=document.createElement('div');scrim.className='upx-scrim';
document.body.appendChild(scrim);document.body.appendChild(side);

function setOpen(open){
  document.body.classList.toggle('upx-open',open);
  $('upxLogo').setAttribute('aria-expanded',open?'true':'false');
  if(open&&!REDUCE){
    side.querySelectorAll('.upx-lbl,.upx-brandtext,.upx-who').forEach(function(el,i){
      el.animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:380,delay:90+i*28,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
    });
  }
}
function toggleSide(){setOpen(!document.body.classList.contains('upx-open'))}
$('upxLogo').addEventListener('click',toggleSide);
$('upxTab').addEventListener('click',toggleSide);
scrim.addEventListener('click',function(){setOpen(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMenu();if(MOBILE())setOpen(false)}});
side.addEventListener('click',function(e){var t=e.target.closest('[data-upx-theme]');if(t)setTheme(t.dataset.upxTheme)});
$('upxHelp').addEventListener('click',function(){
  var r=role();
  toast(r==='student'?'Butuh bantuan? Hubungi guru kelasmu atau admin sekolah.':r==='teacher'?'Kendala akun atau kelas? Hubungi admin sekolah.':'Panduan admin: kelola data dari menu di sidebar.');
});

var navSig='';
function renderNav(){
  var r=role();var nav=$('upxNav');if(!nav)return;
  if(!r){nav.innerHTML='';navSig='';return}
  var list=items(r),sig=r+'|'+list.map(function(x){return x.key+':'+x.label}).join(',');
  if(sig!==navSig){
    navSig=sig;
    nav.innerHTML=list.map(function(x){
      return '<button class="upx-item" type="button" data-key="'+esc(x.key)+'" data-tip="'+esc(x.label)+'" aria-label="'+esc(x.label)+'">'+svg((ICONS[r]||{})[x.key]||'dot')+'<span class="upx-lbl">'+esc(x.label)+'</span></button>';
    }).join('');
  }
  var ak=activeKey(r);
  nav.querySelectorAll('.upx-item').forEach(function(b){var on=b.dataset.key===ak;if(b.classList.contains('on')!==on)b.classList.toggle('on',on);if(on){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page')}else if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current')});
}
var userSig='';
function renderUser(){
  var r=role(),s=(sess()&&sess().tester&&testerOrig())||sess()||{};if(!r)return;
  var name,cls,ava;
  if(r==='student'){
    name=($('studentSidebarName')&&$('studentSidebarName').textContent.trim())||s.name||'Siswa';
    cls='Kelas '+(s.className||'-');
    var a=$('studentSidebarAvatar'),img=a&&a.querySelector('img');
    ava=img?'<img src="'+esc(img.getAttribute('src'))+'" alt="">':esc((name||'S').charAt(0).toUpperCase());
  }else if(r==='teacher'){
    name=($('teacherSidebarName')&&$('teacherSidebarName').textContent.trim())||s.name||'Guru';
    cls='Wali kelas '+(s.className||'-');ava=(window.__upTeacherAva&&window.__upTeacherAva(s))||svg('teacher',20);
  }else{name=s.name||'Administrator';cls=(s.adminLevel==='master'?'Master aktif':'Admin aktif');ava=svg('key',20)}
  var sig=r+name+cls+ava.length+ava.slice(0,80);
  if(sig===userSig)return;userSig=sig;
  $('upxName').textContent=name;$('upxClass').textContent=cls;$('upxAva').innerHTML=ava;$('upxSub').textContent=(r==='admin'&&s.adminLevel==='master')?'Portal Master':(SUB[r]||'');
  $('upxHelp').style.display=r==='student'?'':'';
}

side.addEventListener('click',function(e){
  var b=e.target.closest('.upx-item[data-key]');if(!b)return;
  go(role(),b.dataset.key);
});

/* keluar dari halaman game dengan tombol "kembali" asli agar timer & state dibersihkan */
function headerButtons(v){
  if(!v)return [];
  var h=v.querySelector(':scope > header.topbar');if(!h)return [];
  return Array.prototype.filter.call(h.querySelectorAll('button'),function(b){
    return !/^(logoutBtn|teacherLogoutBtn|adminLogoutBtn|roleLogoutBtn|joinRoomBtn|studentNotificationBtn)$/.test(b.id)&&!b.classList.contains('student-notification');
  });
}
function leaveTo(r){
  var homeId=HOME_ID[r];
  for(var i=0;i<4;i++){
    var v=visibleView();if(!v||v.id===homeId)return true;
    var back=headerButtons(v)[0];if(!back)break;
    var cancelled=false,oc=window.confirm;
    window.confirm=function(){var ok=oc.apply(window,arguments);if(!ok)cancelled=true;return ok};
    try{back.click()}finally{window.confirm=oc}
    if(cancelled)return false;
    if(visibleView()===v)break;
  }
  var cur=visibleView();
  if(!cur||cur.id!==homeId){try{window.showPage(HOME[r])}catch(e){}}
  return true;
}
function go(r,key){
  if(!r)return;
  if(!leaveTo(r))return;
  var target=null;
  if(r==='student'){
    if(typeof window.cerdasStudentSetView==='function')window.cerdasStudentSetView(key);
    else{var sb=document.querySelector('#studentDashboard .student-menu[data-student-view="'+key+'"]');if(sb)sb.click()}
    target=document.querySelector('#studentDashboard .student-view:not(.hidden)');
  }else if(r==='teacher'){
    var tb=document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext="'+key+'"]');if(tb)tb.click();
    target=$('teacherGuruV4')||document.querySelector('#teacherPortalPage .teacher-main');
  }else{
    var ab=document.querySelector('#adMenu button[data-v="'+key+'"]');if(ab)ab.click();
    target=$('adMain');
  }
  renderNav();
  if(target&&r!=='student')animateIn(target,{soft:false});
  if(MOBILE())setOpen(false);
  try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
}

/* ================= HEAD: tanggal realtime + menu garis tiga ================= */
var dayFmt=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
var timeFmt=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function tz(){var o=-new Date().getTimezoneOffset()/60;return o===7?'WIB':o===8?'WITA':o===9?'WIT':'GMT'+(o>=0?'+':'')+o}
function tick(){
  var d=new Date(),day=dayFmt.format(d),tm='Pukul '+timeFmt.format(d).replace(/:/g,'.')+' '+tz();
  document.querySelectorAll('.upx-head .upx-day').forEach(function(e){if(e.textContent!==day)e.textContent=day});
  document.querySelectorAll('.upx-head .upx-time').forEach(function(e){e.textContent=tm});
}
function ensureHead(v){
  if(!v||v.id==='landingPage')return null;
  var h=v.querySelector(':scope > .upx-head');
  if(!h){
    h=document.createElement('div');h.className='upx-head';
    h.innerHTML='<div class="upx-date"><button class="upx-mlogo" type="button" aria-label="Buka menu">✦</button><span class="upx-cal">'+svg('cal',22)+'</span><div><b class="upx-day"></b><small class="upx-time"></small></div></div>'+
      '<div class="upx-actions"><div class="upx-proxies" style="display:flex;gap:10px"></div>'+
      '<button class="upx-burger" type="button" aria-label="Menu akun" aria-haspopup="menu" aria-expanded="false"><i></i><i></i><i></i><span class="upx-dot"></span></button></div>';
    var hd=v.querySelector(':scope > header.topbar');
    if(hd)hd.insertAdjacentElement('afterend',h);else v.insertBefore(h,v.firstChild);
    h.querySelector('.upx-mlogo').addEventListener('click',function(){setOpen(true)});
    h.querySelector('.upx-burger').addEventListener('click',function(e){e.stopPropagation();toggleMenu(this)});
  }
  /* tombol kembali dari topbar lama dipindah ke sini (memanggil tombol aslinya) */
  var px=h.querySelector('.upx-proxies');px.innerHTML='';
  var inContentBack=Array.prototype.some.call(v.querySelectorAll('button,a'),function(b){
    if(b.closest('header.topbar')||b.closest('.upx-head'))return false;
    return (b.classList.contains('back-btn')||/^←$/.test(b.textContent.trim()))&&isShown(b);
  });
  headerButtons(v).forEach(function(orig){
    return; /* tombol Dashboard di head dihapus: halaman level sudah punya tombol kembali sendiri */
    var label=clean(orig.textContent)||'Kembali';
    var b=document.createElement('button');b.type='button';b.className='upx-back';
    b.innerHTML=svg('chevL',18)+'<span>'+esc(label)+'</span>';b.setAttribute('aria-label',label);
    b.addEventListener('click',function(){orig.click()});
    px.appendChild(b);
  });
  tick();
  return h;
}

/* dropdown */
var menu=document.createElement('div');menu.id='upxMenu';menu.setAttribute('role','menu');document.body.appendChild(menu);
var menuBtn=null;
function unread(){if(role()!=='student')return false;var i=document.querySelector('#studentNotificationBtn i');if(!i)return false;return getComputedStyle(i).display!=='none'}
function closeMenu(){
  if(!menu.classList.contains('show'))return;
  menu.classList.remove('show');
  if(menuBtn){menuBtn.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');menuBtn=null}
}
function placeMenu(btn){
  var rc=btn.getBoundingClientRect();
  menu.style.top=Math.round(rc.bottom+10)+'px';
  menu.style.right=Math.max(10,Math.round(window.innerWidth-rc.right))+'px';
}
function toggleMenu(btn){
  if(menu.classList.contains('show')&&menuBtn===btn){closeMenu();return}
  closeMenu();
  var r=role(),s=sess()||{},html='';
  html+='<div class="upx-mhead">'+esc(s.name||'Akun')+(s.className?' • Kelas '+esc(s.className):'')+'</div>';
  if(r==='student'){
    html+='<button class="upx-mi" role="menuitem" data-act="join"><span class="upx-mic">'+svg('enter',18)+'</span><span>Join Room<small>Masukkan kode dari guru</small></span></button>';
    html+='<div class="upx-sep"></div>';
  }
  var hc=window.__upzHistCount?window.__upzHistCount():0;
  html+='<button class="upx-mi" role="menuitem" data-act="hist"><span class="upx-mic">'+svg('bell',18)+'</span><span>Notifikasi<small>Pesan & pemberitahuan (24 jam)</small></span>'+(hc?'<span class="upx-count">'+hc+'</span>':'')+'</button><div class="upx-sep"></div>';
  html+='<div class="upx-mhead">Tampilan</div><div class="upx-mtheme">'+
    '<button type="button" data-upx-theme="light">'+svg('sun',17)+'Terang</button>'+
    '<button type="button" data-upx-theme="dark">'+svg('moon',17)+'Gelap</button></div>';
  html+='<div class="upx-sep"></div>';
  html+='<button class="upx-mi danger" role="menuitem" data-act="logout"><span class="upx-mic">'+svg('logout',18)+'</span><span>Keluar<small>Akhiri sesi di perangkat ini</small></span></button>';
  menu.innerHTML=html;setTheme(theme());
  menuBtn=btn;btn.classList.add('open');btn.setAttribute('aria-expanded','true');
  placeMenu(btn);menu.classList.add('show');
  if(!REDUCE)menu.animate([{opacity:0,transform:'translateY(-8px) scale(.96)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
  var first=menu.querySelector('.upx-mi');if(first)first.focus({preventScroll:true});
}
menu.addEventListener('click',function(e){
  var t=e.target.closest('[data-upx-theme]');if(t){setTheme(t.dataset.upxTheme);return}
  var a=e.target.closest('[data-act]');if(!a)return;
  var act=a.dataset.act,btn=menuBtn,r=role();
  closeMenu();
  if(act==='notif'){
    var nb=$('studentNotificationBtn');if(!nb)return;
    nb.click();
    var p=$('cpNotifPanel');
    if(p&&btn){var rc=btn.getBoundingClientRect();p.style.top=(rc.bottom+10)+'px';p.style.right=Math.max(10,window.innerWidth-rc.right)+'px';
      if(!REDUCE)p.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:280,easing:'ease-out'})}
  }
  if(act==='join'){var jb=$('joinRoomBtn');if(jb)jb.click()}
  if(act==='hist'){window.__upzOpenHistory&&window.__upzOpenHistory({fromMenu:true})}
  if(act==='logout'){var lb=$(LOGOUT[r]);if(lb)lb.click();else{try{clearSession()}catch(_e){}try{window.showPage('landing')}catch(_e){}}setOpen(false)}
});
document.addEventListener('click',function(e){if(menu.classList.contains('show')&&!menu.contains(e.target)&&!e.target.closest('.upx-burger'))closeMenu()});
window.addEventListener('resize',function(){if(menuBtn)placeMenu(menuBtn)});
window.addEventListener('scroll',function(){if(menuBtn)placeMenu(menuBtn)},{passive:true});

/* ================= animasi masuk (efek "morph") ================= */
var BLOCKS=['.upx-head','#adMain > .upcc','#teacherGuruV4 .upcc','.up-tp-card','.up-tp-photo','.up-tp-grid > .field-group','.up-tgame-grid > .subject-card','.up-ctabs > .up-ctab','.ad-cls > *','.ad-play > *','.ad-games > *','.tg4-game-grid > *','.cp-board','.room-vnext-lobby > *','.portal-top','.portal-stat','.sd-chart-card','.portal-panel','.profile-card','.subject-card','.level-card','.levels-header','.level-header',
 '.tg4-head','.tg4-stat','.tg4-panel','.tg4-cards > *','.ad-main > h1','.ad-main > .ad-sub','.ad-stat','.ad-card','.ad-tb','.ad-tw','.security-banner',
 '.dashboard-section-head','.game-flow > div','.feature-card','.tutorial-card','.section-heading','.hero-content > *','.hero-visual','.admin-card'].join(',');
function isShown(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden'}
function animateIn(root,opt){
  if(REDUCE||!root||!root.animate)return;
  opt=opt||{};
  var soft=!!opt.soft;
  if(soft){
    var main=root.querySelector(':scope > main')||root;
    var h=root.querySelector(':scope > .upx-head');
    [h,main].forEach(function(el,i){if(el)el.animate([{opacity:0,filter:'blur(6px)'},{opacity:1,filter:'blur(0)'}],{duration:520,delay:i*70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})});
    return;
  }
  var nodes=Array.prototype.filter.call(root.querySelectorAll(BLOCKS),isShown);
  /* Staggered Slide-Up: kartu di dalam panel tetap diberi giliran sendiri (tidak dibuang) */
  if(!nodes.length){var m=root.querySelector(':scope > main')||root;nodes=Array.prototype.filter.call(m.children,isShown)}
  nodes=nodes.slice(0,40);
  nodes.forEach(function(n,i){
    n.animate([
      {opacity:0,transform:'translateY(36px)'},
      {opacity:1,transform:'translateY(0)'}
    ],{duration:760,delay:Math.min(i*75,1100),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
  });
}

/* ================= deteksi pergantian halaman ================= */
var lastView=null,lastSub=null;
function onView(v,force){
  var id=v?v.id:null;
  var app=!!(v&&id!=='landingPage'&&role());
  document.body.classList.toggle('upx-app',app);
  if(id!==lastView||force){
    var prev=lastView;lastView=id;
    closeMenu();
    if(app){
      ensureHead(v);renderNav();renderUser();alignHead(v);
      if(prev==='landingPage'||prev===null){
        setOpen(false);
        if(!REDUCE)side.animate([{opacity:0,transform:'translateX(-30px) scale(.96)'},{opacity:1,transform:'none'}],{duration:640,easing:'cubic-bezier(.16,1,.3,1)'});
      }
      if(id==='studentDashboard'){var sv=document.querySelector('#studentDashboard .student-view:not(.hidden)');lastSub=sv?sv.id:null;if(lastSub==='studentViewProfile')fillProfile()}
      animateIn(v,{soft:!!GAME_PAGES[id]});
    }else{
      setOpen(false);
      if(id==='landingPage'&&prev)animateIn(v,{soft:false});
    }
  }
}
var mo=new MutationObserver(function(muts){
  var pageChanged=false,subChanged=null,modal=null;
  muts.forEach(function(m){
    var t=m.target;if(!t.classList)return;
    if(t.classList.contains('app-view'))pageChanged=true;
    else if(t.classList.contains('student-view')&&!t.classList.contains('hidden')&&/\bhidden\b/.test(m.oldValue||''))subChanged=t;
    else if(t.classList.contains('modal-overlay')||t.classList.contains('level-outcome-overlay')){if(!t.classList.contains('hidden')&&/\bhidden\b/.test(m.oldValue||''))modal=t}
  });
  if(pageChanged)onView(visibleView());
  if(subChanged&&subChanged.id!==lastSub&&lastView==='studentDashboard'){
    lastSub=subChanged.id;renderNav();
    if(subChanged.id==='studentViewProfile')fillProfile();
    animateIn(subChanged,{soft:false});
  }
  if(modal&&!REDUCE){
    var box=modal.firstElementChild;
    if(box&&box.animate)box.animate([{opacity:0,transform:'translateY(16px) scale(.94)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});
  }
});
function observeAll(){
  document.querySelectorAll('.app-view,.student-view,.modal-overlay,.level-outcome-overlay').forEach(function(el){
    if(el.__upxObs)return;el.__upxObs=1;
    mo.observe(el,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
  });
}
observeAll();
new MutationObserver(function(){observeAll()}).observe(document.body,{childList:true});

/* rata kiri/kanan head mengikuti konten halaman */
function alignHead(v){
  if(!v||MOBILE())return;var h=v.querySelector(':scope > .upx-head');if(!h)return;
  var ref=null,c=v.querySelectorAll('.portal-top, #teacherGuruV4 > *, .tg4-head, .ad-main > *, .levels-page > *, main > *');
  for(var i=0;i<c.length;i++){if(c[i]!==h&&isShown(c[i])&&c[i].getBoundingClientRect().width>200){ref=c[i];break}}
  if(!ref)return;
  var vr=v.getBoundingClientRect(),rr=ref.getBoundingClientRect();
  var L=Math.max(16,Math.round(rr.left-vr.left)),R=Math.max(16,Math.round(vr.right-rr.right));
  if(R>L+200)R=L;
  if(h.__l!==L||h.__r!==R){h.__l=L;h.__r=R;h.style.paddingLeft=L+'px';h.style.paddingRight=R+'px'}
}
/* loop ringan: sinkron menu aktif, nama, badge notifikasi, jam */
setInterval(function(){
  var v=visibleView();
  if(!v||v.id!==lastView)onView(v);
  if(document.body.classList.contains('upx-app')){
    renderNav();renderUser();alignHead(v);
    var dot=unread();
    document.querySelectorAll('.upx-burger').forEach(function(b){b.classList.toggle('has-dot',dot)});
  }
},400);
setInterval(tick,1000);

/* ================= landing: animasi pembuka + reveal saat scroll ================= */
function landingIntro(){
  var lp=$('landingPage');if(!lp||lp.classList.contains('hidden')||REDUCE)return;
  var top=lp.querySelector(':scope > header.topbar');
  if(top)top.animate([{opacity:0,transform:'translateY(-16px)'},{opacity:1,transform:'none'}],{duration:640,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  lp.querySelectorAll('.hero-content > *, .hero-visual').forEach(function(n,i){
    n.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'translateY(0)'}],{duration:900,delay:120+i*110,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);
      var sibs=Array.prototype.indexOf.call(e.target.parentElement.children,e.target);
      e.target.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,delay:Math.max(0,sibs)*110,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    })},{threshold:.18});
    lp.querySelectorAll('.feature-section .section-heading, .feature-card, .tutorial-section .section-heading, .tutorial-card').forEach(function(n){io.observe(n)});
  }
}

/* ================= PROFIL SISWA: Simpan & Batal per kartu ================= */
function accounts(){try{return JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]')}catch(e){return []}}
function myAccount(){var s=sess();if(!s)return null;return accounts().find(function(a){return a.id===s.id})||null}
function fillProfile(){
  var s=sess();if(!s||s.role!=='student')return;
  var a=myAccount()||s;
  if($('profileName'))$('profileName').value=a.name||s.name||'';
  if($('profileEmail'))$('profileEmail').value=a.email||s.email||'';
  if($('profileClass'))$('profileClass').value=a.className||s.className||'5A';
  if($('profileAbsen'))$('profileAbsen').value=(a.absen&&a.absen!=='-')?a.absen:'';
}
function msg(el,text,ok){if(!el)return;el.textContent=text;el.className='upx-msg '+(ok?'ok':'err');
  if(!REDUCE)el.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'})}
function resetEyes(scope){
  (scope||document).querySelectorAll('.password-toggle,.toggle-password,.upx-eye').forEach(function(b){
    var inp=eyeInput(b);if(inp)inp.type='password';
    b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Tampilkan password');b.title='Tampilkan password';b.innerHTML=svg('eye',20);
  });
}
function buildProfile(){
  var form=$('studentProfileForm');if(!form||form.dataset.upx)return;
  form.dataset.upx='1';
  var cards=form.querySelectorAll('.profile-card');
  var dataCard=cards[0],passCard=form.querySelector('.sd-card-pass')||cards[1];
  if(dataCard){
    var f1=document.createElement('div');f1.className='upx-cardfoot';
    f1.innerHTML='<div class="upx-msg" id="upxDataMsg" role="status"></div><div class="upx-btns"><button type="button" class="upx-btn" id="upxDataCancel">Batal</button><button type="button" class="upx-btn pri" id="upxDataSave">Simpan</button></div>';
    dataCard.appendChild(f1);
  }
  if(passCard){
    var f2=document.createElement('div');f2.className='upx-cardfoot';
    f2.innerHTML='<div class="upx-msg" id="upxPassMsg" role="status"></div><div class="upx-btns"><button type="button" class="upx-btn" id="upxPassCancel">Batal</button><button type="button" class="upx-btn pri" id="upxPassSave">Simpan</button></div>';
    passCard.appendChild(f2);
  }
  $('upxDataCancel')&&$('upxDataCancel').addEventListener('click',function(){fillProfile();msg($('upxDataMsg'),'Perubahan dibatalkan. Data dikembalikan seperti semula.',true)});
  $('upxDataSave')&&$('upxDataSave').addEventListener('click',saveData);
  $('upxPassCancel')&&$('upxPassCancel').addEventListener('click',function(){
    ['profileCurrentPassword','profileNewPassword','profileConfirmPassword'].forEach(function(id){if($(id))$(id).value=''});
    resetEyes(passCard);msg($('upxPassMsg'),'Kolom password dikosongkan.',true);
  });
  $('upxPassSave')&&$('upxPassSave').addEventListener('click',savePass);
  /* Enter di dalam form: arahkan ke tombol simpan kartu yang sedang diisi */
  window.addEventListener('submit',function(e){
    if(e.target!==form)return;
    e.preventDefault();e.stopImmediatePropagation();
    var ae=document.activeElement;
    if(passCard&&ae&&passCard.contains(ae))savePass();else saveData();
  },true);
}
function saveData(){
  var s=sess(),m=$('upxDataMsg');if(!s)return;
  var list=accounts(),i=list.findIndex(function(a){return a.id===s.id});
  if(i<0){msg(m,'Data akun tidak ditemukan. Silakan masuk ulang.',false);return}
  var name=($('profileName').value||'').trim(),email=($('profileEmail').value||'').trim(),cls=$('profileClass').value,absen=($('profileAbsen').value||'').trim();
  if(name.length<2){msg(m,'Nama lengkap minimal 2 huruf.',false);$('profileName').focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg(m,'Format email belum benar, contoh: nama@gmail.com.',false);$('profileEmail').focus();return}
  if(list.some(function(a,j){return j!==i&&String(a.name).toLowerCase()===name.toLowerCase()})){msg(m,'Nama ini sudah dipakai akun lain. Pakai nama yang berbeda.',false);return}
  if(list.some(function(a,j){return j!==i&&String(a.email).toLowerCase()===email.toLowerCase()})){msg(m,'Email ini sudah terdaftar di akun lain.',false);return}
  if(absen&&(!/^\d+$/.test(absen)||+absen<1||+absen>50)){msg(m,'No. absen diisi angka 1 sampai 50.',false);return}
  var a=list[i];a.name=name;a.email=email;a.className=cls;a.absen=absen;
  localStorage.setItem('cerdasPlayStudents',JSON.stringify(list));
  s.name=name;s.email=email;s.className=cls;s.absen=absen;s.photo=a.photo||s.photo||'';
  try{if(typeof setSession==='function')setSession(s);else sessionStorage.setItem('cerdasPlaySession',JSON.stringify(s))}catch(e){sessionStorage.setItem('cerdasPlaySession',JSON.stringify(s))}
  var set=function(id,v){if($(id))$(id).textContent=v};
  set('studentSidebarName',name);set('studentSidebarClass','Kelas '+cls);set('studentGreetingName',name);
  set('profileSummaryName',name);set('profileSummaryEmail',email);set('profileSummaryClass',cls);set('profileSummaryAbsen',absen||'-');
  userSig='';renderUser();
  try{window.renderStudentGameAvailability&&window.renderStudentGameAvailability()}catch(e){}
  msg(m,'Data profil tersimpan.',true);
}
function savePass(){
  var s=sess(),m=$('upxPassMsg');if(!s)return;
  var list=accounts(),i=list.findIndex(function(a){return a.id===s.id});
  if(i<0){msg(m,'Data akun tidak ditemukan. Silakan masuk ulang.',false);return}
  var cur=$('profileCurrentPassword').value,np=$('profileNewPassword').value,cp=$('profileConfirmPassword').value;
  if(!cur){msg(m,'Isi password saat ini terlebih dahulu.',false);$('profileCurrentPassword').focus();return}
  if(String(list[i].password||'')!==cur){msg(m,'Password saat ini tidak cocok.',false);return}
  {const __pw=window.__upPwCheck?window.__upPwCheck(np):(np.length<6?'Password baru minimal 6 karakter.':'');if(__pw){msg(m,__pw,false);$('profileNewPassword').focus();return}}
  if(np===cur){msg(m,'Password baru harus berbeda dari password saat ini.',false);return}
  if(np!==cp){msg(m,'Konfirmasi password baru belum sama.',false);$('profileConfirmPassword').focus();return}
  list[i].password=np;localStorage.setItem('cerdasPlayStudents',JSON.stringify(list));
  ['profileCurrentPassword','profileNewPassword','profileConfirmPassword'].forEach(function(id){$(id).value=''});
  resetEyes($('studentViewProfile'));
  msg(m,'Password berhasil diganti. Gunakan password baru saat masuk berikutnya.',true);
}

/* ================= IKON MATA di seluruh form password ================= */
function eyeInput(b){
  var id=b.dataset&&b.dataset.target;if(id&&$(id))return $(id);
  var w=b.parentElement;return w?w.querySelector('input'):null;
}
window.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.toggle-password,.upx-eye');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  var inp=eyeInput(b);if(!inp)return;
  var show=inp.type==='password';
  inp.type=show?'text':'password';
  b.setAttribute('aria-pressed',show?'true':'false');
  b.setAttribute('aria-label',show?'Sembunyikan password':'Tampilkan password');
  b.title=show?'Sembunyikan password':'Tampilkan password';
  b.innerHTML=svg(show?'eyeOff':'eye',20);
  try{inp.focus({preventScroll:true});var L=inp.value.length;inp.setSelectionRange(L,L)}catch(_e){}
},true);
function enhancePasswords(){
  document.querySelectorAll('.toggle-password').forEach(function(b){if(!b.dataset.upxEye){b.dataset.upxEye='1';var inp=eyeInput(b);b.innerHTML=svg(inp&&inp.type==='text'?'eyeOff':'eye',20);b.setAttribute('aria-pressed','false')}});
  document.querySelectorAll('input[type="password"]').forEach(function(inp){
    if(inp.dataset.upxPw)return;
    var p=inp.parentElement;
    if(p&&p.querySelector(':scope > .password-toggle,:scope > .toggle-password,:scope > .upx-eye')){inp.dataset.upxPw='1';return}
    inp.dataset.upxPw='1';
    var w=document.createElement('span');w.className='upx-pw';
    inp.parentNode.insertBefore(w,inp);w.appendChild(inp);
    var b=document.createElement('button');b.type='button';b.className='upx-eye';b.setAttribute('aria-label','Tampilkan password');b.title='Tampilkan password';b.setAttribute('aria-pressed','false');b.innerHTML=svg('eye',20);
    w.appendChild(b);
  });
}
/* modal login/daftar ditutup: kembalikan password ke mode tersembunyi */
['loginModal','registerModal'].forEach(function(id){
  var m=$(id);if(!m)return;
  new MutationObserver(function(){if(m.classList.contains('hidden'))resetEyes(m)}).observe(m,{attributes:true,attributeFilter:['class']});
});

/* ================= emoji → ikon garis (portal guru & admin) ================= */
var EMAP={
 '👩‍🏫':'teacher','👨‍🏫':'teacher','👨‍🎓':'grad','👩‍🎓':'grad','🏠':'home','🎯':'target','🏆':'trophy','⚔️':'swords','⚔':'swords',
 '📊':'chart','📈':'trend','🔐':'lock','🔒':'lock','🎮':'gamepad','🕹️':'gamepad','🕹':'gamepad','👧':'users','🧒':'users','👥':'users','👤':'user',
 '🏫':'school','✅':'checkC','⭐':'star','🌟':'star','🆕':'sparkles','🛠️':'wrench','🛠':'wrench','🔧':'wrench','🔑':'key','🧹':'broom','⬇':'download','⬇️':'download',
 '⬆':'upload','⬆️':'upload','📥':'download','📤':'upload','👁':'eye','👁️':'eye','📨':'send','▶':'play','▶️':'play','⏹':'stop','⏹️':'stop','📡':'radio',
 '🥇':'medal:gold','🥈':'medal:silver','🥉':'medal:bronze','🏅':'medal','🔢':'hash','🧠':'brain','🖼️':'image','🖼':'image','📋':'clip','✔':'check','✔️':'check',
 '✖':'x','✖️':'x','❌':'x','⚠️':'alert','⚠':'alert','🎲':'shuffle','📌':'pin','🗑️':'trash','🗑':'trash','✏️':'pencil','✏':'pencil','➕':'plus','🔄':'refresh',
 '🔔':'bell','⏱️':'clock','⏱':'clock','⏳':'hourglass','📖':'book','📚':'book','🚪':'logout','⚙️':'settings','⚙':'settings','💾':'download','👋':'user','🎉':'sparkles','✨':'sparkles','🚀':'rocket','🔴':'dot:red','🔵':'dot:blue','🟢':'dot:green','🟡':'dot:gold','✎':'pencil','💡':'bulb','📜':'book','📝':'pencil','🎓':'grad','👨':'user','👩':'user'
};
var EKEYS=Object.keys(EMAP).sort(function(a,b){return b.length-a.length});
var ERE=new RegExp('('+EKEYS.map(function(k){return k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')\\uFE0F?','g');
function iconFor(e){var v=EMAP[e]||EMAP[e.replace(/\uFE0F/g,'')];if(!v)return null;var p=v.split(':');return '<span class="upx-ic'+(p[1]?' '+p[1]:'')+'" aria-hidden="true">'+svg(p[0],18)+'</span>'}
function swapEmoji(root){
  if(!root)return;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
    var p=n.parentElement;if(!p)return NodeFilter.FILTER_REJECT;
    if(p.closest('script,style,textarea,input,select,option,svg,code,.upx-ic,.cp-av,[contenteditable="true"]'))return NodeFilter.FILTER_REJECT;
    ERE.lastIndex=0;return ERE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  var list=[],n;while((n=walker.nextNode()))list.push(n);
  list.forEach(function(t){
    var html=esc(t.nodeValue).replace(ERE,function(m){return iconFor(m)||m});
    var span=document.createElement('span');span.innerHTML=html;
    var frag=document.createDocumentFragment();while(span.firstChild)frag.appendChild(span.firstChild);
    t.parentNode.replaceChild(frag,t);
  });
  /* <option> tidak boleh berisi elemen: cukup hapus emojinya */
  root.querySelectorAll('option').forEach(function(o){ERE.lastIndex=0;if(ERE.test(o.textContent))o.textContent=o.textContent.replace(ERE,'').trim()});
}
var swapQueued=false;
function queueSwap(){
  if(swapQueued)return;swapQueued=true;
  Promise.resolve().then(function(){
    swapQueued=false;
    var r=role();
    if(r==='teacher'||r==='admin'){
      swapEmoji($('teacherPortalPage'));swapEmoji($('adminPortalPage'));
      document.querySelectorAll('body > .ad-ov').forEach(swapEmoji);
    }
    enhancePasswords();
  });
}
['teacherPortalPage','adminPortalPage'].forEach(function(id){var el=$(id);if(el)new MutationObserver(queueSwap).observe(el,{childList:true,subtree:true,characterData:true})});
new MutationObserver(function(ms){
  var need=false;
  ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&(n.classList.contains('ad-ov')||n.querySelector&&n.querySelector('input[type=password]')))need=true})});
  if(need){queueSwap();enhancePasswords()}
}).observe(document.body,{childList:true});
document.addEventListener('focusin',function(e){if(e.target&&e.target.type==='password'&&!e.target.dataset.upxPw)enhancePasswords()});

/* ================= toast kecil ================= */
function toast(t){
  if(window.__upNotify){window.__upNotify({text:t});return}
  var el=document.createElement('div');el.textContent=t;
  el.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:120;background:var(--upx-ink);color:var(--upx-surface);padding:12px 18px;border-radius:14px;font-weight:800;font-size:.9rem;box-shadow:0 16px 36px rgba(0,0,0,.25);max-width:90vw';
  document.body.appendChild(el);
  if(!REDUCE)el.animate([{opacity:0,transform:'translate(-50%,12px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:300,easing:'ease-out'});
  setTimeout(function(){el.remove()},2600);
}

window.__upxAnimateIn=animateIn;
/* ================= start ================= */
function boot(){
  setTheme(theme());
  buildProfile();
  enhancePasswords();
  queueSwap();
  onView(visibleView(),true);
  landingIntro();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
