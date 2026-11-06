/* =====================================================================
   UpPlay V8 — ikon abstrak pengganti emoji (UI 4 user), tanpa kedip awal
   Isi soal di dalam papan game TIDAK diubah (emoji di soal Tebak-Tebakan dll tetap).
   ===================================================================== */
(function(){
'use strict';
if(window.__upz8)return;window.__upz8=true;

var LINE={
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
 game:'<rect x="2.5" y="6.5" width="19" height="11" rx="5"/><path d="M7 10.5v3M5.5 12h3"/><circle cx="16" cy="11" r=".9" fill="currentColor"/><circle cx="18" cy="13.2" r=".9" fill="currentColor"/>',
 user:'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
 users:'<circle cx="9" cy="8" r="3.3"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14a6 6 0 0 1 3.2 6"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
 unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.4 2.6 2.6 5-5.6"/>',
 x:'<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
 star:'<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
 spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5"/><circle cx="12" cy="12" r="2"/>',
 send:'<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/>',
 play:'<path d="M7.5 5v14l11-7z"/>',
 stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
 bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
 bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 hash:'<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
 grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/>',
 image:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-9 8.5"/>',
 door:'<path d="M6 21V4h12v17M3 21h18"/><circle cx="14.5" cy="12.5" r=".9" fill="currentColor"/>',
 pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>',
 medal:'<circle cx="12" cy="14.5" r="5.2"/><path d="M8.5 10 6.3 3.5h3.8L12 7.3l1.9-3.8h3.8L15.5 10"/>',
 key:'<circle cx="8" cy="15" r="3.8"/><path d="m10.8 12.2 8.7-8.7M16.5 6.5l2.5 2.5"/>',
 pencil:'<path d="M4 20h4L19.3 8.7a2.8 2.8 0 0 0-4-4L4 16z"/>',
 swords:'<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3"/>',
 wave:'<path d="M4 13c2-3 4-3 6 0s4 3 6 0 4-3 4-3"/><path d="M4 18c2-3 4-3 6 0s4 3 6 0 4-3 4-3" opacity=".5"/>',
 brain:'<path d="M12 5.2v14"/><path d="M12 5.2a2.9 2.9 0 0 0-5-1.4A3.1 3.1 0 0 0 4.2 7.6a3.3 3.3 0 0 0 .3 5.5 3.2 3.2 0 0 0 2.7 5.2A2.9 2.9 0 0 0 12 19.2"/><path d="M12 5.2a2.9 2.9 0 0 1 5-1.4 3.1 3.1 0 0 1 2.8 3.8 3.3 3.3 0 0 1-.3 5.5 3.2 3.2 0 0 1-2.7 5.2A2.9 2.9 0 0 1 12 19.2"/><path d="M7.6 9.4c1.1.2 1.9 1 2.1 2.1M16.4 9.4c-1.1.2-1.9 1-2.1 2.1M7.4 14.6c.9-.6 2.1-.6 3 .1M16.6 14.6c-.9-.6-2.1-.6-3 .1"/>',
 magnify:'<circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 5.3 5.3"/><path d="M7.6 9.2a3.2 3.2 0 0 1 2.6-1.9"/>'
};
var MAP={
 '🏠':'home','🏡':'home','🎯':'target','🏆':'trophy','📊':'chart','📈':'chart','🎮':'game','🕹':'game','👤':'user','👥':'users','👨‍🎓':'users','👩‍🎓':'users','👩‍🏫':'users','👨‍🏫':'users','🧒':'user','👧':'user','👦':'user',
 '🔒':'lock','🔐':'lock','🔓':'unlock','⏱':'clock','⏰':'clock','⏳':'clock','⌛':'clock','✅':'check','✔':'check','☑':'check','❌':'x','✖':'x','⭐':'star','🌟':'star','★':'star','☆':'star','✨':'spark','🎉':'spark','🎊':'spark','🥳':'spark',
 '📨':'send','📤':'send','✉':'send','▶':'play','⏹':'stop','🔄':'refresh','🔁':'refresh','🔔':'bell','💡':'bulb','🔢':'hash','🧩':'grid','🖼':'magnify','🔍':'magnify','🔎':'magnify','🚪':'door','📌':'pin','📍':'pin',
 '🥇':'medal','🥈':'medal','🥉':'medal','🏅':'medal','🔑':'key','✏':'pencil','📝':'pencil','⚔':'swords','👋':'wave','🏫':'home','🧠':'brain','🎲':'grid','📋':'grid','📚':'grid','📖':'grid'
};
var SHAPES=[
 '<circle cx="12" cy="12" r="7.5"/>',
 '<rect x="5" y="5" width="14" height="14" rx="4"/>',
 '<path d="M12 3.8 20.2 12 12 20.2 3.8 12z"/>',
 '<path d="M12 4.5 20 19H4z"/>',
 '<path d="M12 3.5 19.4 7.8v8.4L12 20.5l-7.4-4.3V7.8z"/>',
 '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
 '<path d="M5 12a7 7 0 0 1 14 0"/><path d="M5 12a7 7 0 0 0 14 0" opacity=".45"/>',
 '<rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.6"/><rect x="13" y="13" width="6.5" height="6.5" rx="1.6"/>'
];
var TONES=['#1e1f1f','#4a4a49','#84817d','#ba9d7f','#a8875f'];
var TONES_DK=['#efe9e1','#d3b99d','#b3ada5','#ba9d7f','#e5e0d9'];
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
function svgFor(e){
  var base=e.replace(/[\uFE0F\u200D]/g,'').replace(/[\u{1F3FB}-\u{1F3FF}]/gu,'');
  var k=MAP[e]||MAP[base]||MAP[Array.from(base)[0]];
  if(k)return '<span class="upz-ab" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+LINE[k]+'</svg></span>';
  var h=hash(base),dk=document.documentElement.classList.contains('upx-dark');
  var c=(dk?TONES_DK:TONES)[h%5];
  return '<span class="upz-ab" aria-hidden="true"><svg viewBox="0 0 24 24" fill="'+c+'" fill-opacity=".22" stroke="'+c+'" stroke-width="1.8" stroke-linejoin="round">'+SHAPES[(h>>3)%SHAPES.length]+'</svg></span>';
}
var RE=/(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\uFE0F|\u20E3|[\u{1F3FB}-\u{1F3FF}])*(?:\u200D(?:\p{Extended_Pictographic})(?:\uFE0F|[\u{1F3FB}-\u{1F3FF}])*)*|[\u{1F51F}\u{1F522}]|[0-9#*]\uFE0F\u20E3/gu;
/* area UI yang diganti; isi papan game dibiarkan */
var SCOPE='#studentDashboard,#teacherPortalPage,#adminPortalPage,#mathLevelsPage,#lgLevelsPage,#ttLevelsPage,.level-outcome-overlay,.cp-ov,#cpRoomInter,#cpRoomHud,#quizRoomModalV2,#cpNotifPanel,.ad-ov,.upz-dlg,#upNotifs,#gameTutorialModal,'+
  '.app-view .page-head,.app-view .cd-timebar,.app-view .game-panel>h2,.app-view .game-panel>h3,[class$="-side"]>h2,[class$="-side"]>h3,[class*="panel"]>h2,[class*="panel"]>h3';
var SKIP='script,style,textarea,input,select,svg,code,.upz-ab,.upx-ic,[contenteditable="true"],.avatar-choice,.room-player-chip,.cp-av,.upzh-av';
/* avatar karakter siswa tetap emoji asli (tidak diabstrakkan) */
var KEEP=new Set(['🦊','🐼','🐯','🐸','🐵','🐨','🐰','🐱','🦄','🐙','🦁','🐻','🐧','🐶','🦉','🐢','🧑‍🎓','👩‍🎓','👨‍🎓']);
function inScope(el){return !!(el&&el.closest&&el.closest(SCOPE))}
function swapText(t){
  var p=t.parentElement;if(!p||p.closest(SKIP)||!inScope(p))return;
  var v=t.nodeValue;RE.lastIndex=0;if(!RE.test(v))return;
  if(p.tagName==='OPTION'){p.textContent=v.replace(RE,'').trim();return}
  var esc=v.replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]});
  var html=esc.replace(RE,function(m){return KEEP.has(m)||KEEP.has(m.replace(/\uFE0F/g,''))?m:svgFor(m)});
  if(html===esc)return; /* hanya avatar (tidak diganti) -> jangan sentuh DOM, cegah putaran observer */
  var tmp=document.createElement('span');tmp.innerHTML=html;
  var f=document.createDocumentFragment();while(tmp.firstChild)f.appendChild(tmp.firstChild);
  t.parentNode.replaceChild(f,t);
}
function sweep(root){
  if(!root)return;
  if(root.nodeType===3){swapText(root);return}
  if(root.nodeType!==1)return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),list=[],n;
  while((n=w.nextNode()))list.push(n);
  list.forEach(swapText);
}
window.__upzSweep=function(){document.querySelectorAll(SCOPE).forEach(sweep)};
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){
    var m=ms[i];
    if(m.type==='characterData')swapText(m.target);
    else for(var j=0;j<m.addedNodes.length;j++)sweep(m.addedNodes[j]);
  }
}).observe(document.body,{childList:true,subtree:true,characterData:true});

/* ---------- tampilkan halaman setelah semua siap (tanpa kedip emoji/ilustrasi lama) ---------- */
function reveal(){
  window.__upzSweep();
  var de=document.documentElement;de.classList.add('upz-booted');
  requestAnimationFrame(function(){de.classList.remove('upz-boot')});
}
reveal();
})();
