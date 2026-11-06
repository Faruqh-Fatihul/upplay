/* =====================================================================
   UpPlay V10
   1. Kartu permainan & kartu level: hanya tombol yang bisa diklik
   2. Transisi tema: matahari terbit (ke terang) / bulan sabit (ke gelap)
   3. Penjaga popup Gabung Ruang agar tidak pernah tampil kosong
   ===================================================================== */
(function(){
'use strict';
if(window.__upz10)return;window.__upz10=true;
var $=function(id){return document.getElementById(id)};
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. klik hanya di tombol ---------- */
window.addEventListener('click',function(e){
  if(e.detail===0)return; /* klik dari keyboard/skrip tetap diteruskan */
  var t=e.target;if(!t.closest)return;
  var card=t.closest('.subject-card');
  if(card&&!t.closest('.play-label')){e.preventDefault();e.stopImmediatePropagation();return}
  var lc=t.closest('.level-card');
  if(lc&&!t.closest('button')){e.preventDefault();e.stopImmediatePropagation();return}
},true);
function tagButtons(){
  document.querySelectorAll('.subject-card .play-label').forEach(function(l){if(!l.dataset.upzBtn){l.dataset.upzBtn='1';l.setAttribute('role','button')}});
}
setInterval(tagButtons,1000);tagButtons();

/* ---------- 2. transisi tema ---------- */
var busy=false;
function themeNow(){return document.documentElement.classList.contains('upx-dark')?'dark':'light'}
function setThemeTo(t){
  if(window.__upxSetTheme)window.__upxSetTheme(t);
  try{localStorage.setItem(window.__upThemeKey?window.__upThemeKey():'upplayTheme',t)}catch(e){}
  document.documentElement.classList.toggle('upx-dark',t==='dark'&&document.body.classList.contains('upx-app'));
  document.querySelectorAll('[data-upx-theme]').forEach(function(b){b.classList.toggle('on',b.dataset.upxTheme===t)});
}
var MOON='<svg viewBox="0 0 100 100"><defs><mask id="upzCres"><rect width="100" height="100" fill="#fff"/><circle cx="64" cy="38" r="34" fill="#000"/></mask><radialGradient id="upzMoonG" cx="40%" cy="40%"><stop offset="0" stop-color="#fbf6ee"/><stop offset="1" stop-color="#d3b99d"/></radialGradient></defs><circle cx="46" cy="52" r="34" fill="url(#upzMoonG)" mask="url(#upzCres)"/></svg>';
function play(to){
  if(busy)return;busy=true;
  var W=window.innerWidth,H=window.innerHeight,sky=document.createElement('div');sky.id='upzSky';
  var light=to==='light';
  sky.innerHTML='<div class="veil"></div><div class="body '+(light?'sun':'moon')+'">'+(light?'':MOON)+'</div>';
  document.body.appendChild(sky);
  var veil=sky.querySelector('.veil'),body=sky.querySelector('.body');
  /* tirai warna tema tujuan menyapu dari pojok */
  veil.style.background=light?'linear-gradient(35deg,#e5e0d9 0%,#f6f3ee 60%,#fbf6ee 100%)':'linear-gradient(215deg,#141413 0%,#1e1f1f 60%,#2a2a29 100%)';
  var from=light?'circle(0% at 0% 100%)':'circle(0% at 100% 0%)',to2=light?'circle(150% at 0% 100%)':'circle(150% at 100% 0%)';
  veil.animate([{clipPath:from},{clipPath:to2}],{duration:900,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
  /* matahari: kiri bawah -> kanan atas (terbit); bulan sabit: kanan atas -> kiri bawah (seolah matahari tenggelam) */
  var s=150,path=light?[[-s,H],[W*.25,H*.45],[W*.62,H*.12],[W-s*.6,-s*.2]]:[[W,-s],[W*.7,H*.18],[W*.35,H*.5],[-s*.4,H-s*.4]];
  body.animate(path.map(function(p,i){return {transform:'translate('+p[0]+'px,'+p[1]+'px) scale('+(i===0||i===3?.7:1)+')',opacity:(i===0?0:i===3?0:1)}}),{duration:1250,easing:'cubic-bezier(.45,0,.25,1)',fill:'forwards'});
  setTimeout(function(){setThemeTo(to)},620);
  setTimeout(function(){sky.animate([{opacity:1},{opacity:0}],{duration:380,easing:'ease-out',fill:'forwards'}).onfinish=function(){sky.remove();busy=false}},1080);
}
window.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-upx-theme]');if(!b)return;
  var to=b.dataset.upxTheme;
  if(!document.body.classList.contains('upx-app'))return;
  e.preventDefault();e.stopImmediatePropagation();
  /* sidebar tertutup hanya menampilkan satu tombol tema: klik = beralih */
  if(to===themeNow()&&b.closest('#upxSide')&&!document.body.classList.contains('upx-open'))to=to==='dark'?'light':'dark';
  if(to===themeNow()||busy)return;
  if(REDUCE){setThemeTo(to);return}
  if(window.__upSky)window.__upSky(to,setThemeTo,function(v){busy=v});else play(to);
},true);

/* ---------- 3. Gabung Ruang tidak pernah kosong ---------- */
setInterval(function(){
  var m=$('quizRoomModalV2');if(!m||m.classList.contains('hidden'))return;
  var j=$('quizRoomJoinV2'),l=$('quizRoomLobbyV2');if(!j||!l)return;
  var lobbyEmpty=l.classList.contains('hidden')||!l.textContent.trim();
  if(j.classList.contains('hidden')&&lobbyEmpty){j.classList.remove('hidden');l.classList.add('hidden')}
},400);
})();
