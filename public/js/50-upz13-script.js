/* =====================================================================
   UpPlay V13 — tooltip sidebar (semua pengguna), pesan form masuk rapi,
   tombol "Masuk" tanpa panah.
   ===================================================================== */
(function(){
'use strict';
if(window.__upz13)return;window.__upz13=true;
var $=function(id){return document.getElementById(id)};

/* ---------- 1. tooltip saat sidebar tertutup ---------- */
var tip=document.createElement('div');tip.id='upSideTip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);
var curEl=null;
function label(el){
  if(el.matches('.upx-logo,.upx-tab'))return 'Buka menu';
  if(el.matches('.upx-user')){var n=$('upxName'),c=$('upxClass');return (n?n.textContent:'')+(c&&c.textContent?' • '+c.textContent:'')}
  if(el.matches('.upx-theme button'))return el.dataset.upxTheme==='dark'?'Mode gelap':'Mode terang';
  return el.dataset.tip||el.getAttribute('aria-label')||(el.textContent||'').trim();
}
function showTip(el){
  var t=label(el);if(!t){hideTip();return}
  if(tip.textContent!==t)tip.textContent=t;
  var r=el.getBoundingClientRect();
  tip.style.left=Math.round(r.right+12)+'px';tip.style.top=Math.round(r.top+r.height/2)+'px';
  tip.classList.add('show');curEl=el;
}
function hideTip(){tip.classList.remove('show');curEl=null}
var SEL='#upxSide .upx-item,#upxSide .upx-theme button,#upxSide .upx-logo,#upxSide .upx-tab,#upxSide .upx-user';
document.addEventListener('mouseover',function(e){
  var el=e.target.closest&&e.target.closest(SEL);
  if(!el||document.body.classList.contains('upx-open')||window.innerWidth<=760||!document.body.classList.contains('upx-app')){if(curEl)hideTip();return}
  if(el!==curEl)showTip(el);
});
document.addEventListener('mouseout',function(e){if(!curEl)return;var to=e.relatedTarget;if(!to||!curEl.contains(to))hideTip()});
['click','scroll','keydown'].forEach(function(ev){window.addEventListener(ev,hideTip,true)});
/* tooltip bawaan browser (title) tidak dobel */
setInterval(function(){document.querySelectorAll('#upxSide [title]').forEach(function(x){x.removeAttribute('title')})},1000);

/* ---------- 2. pesan form: hanya teks berwarna, ikon kecil ---------- */
var ERR_IC='<span class="up-err-ic" aria-hidden="true"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.2" fill="currentColor"/><path d="M8 4.2v4.6" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r="1" fill="#fff"/></svg></span>';
function tidy(el){
  if(!el||el.__upTidy)return;
  var ok=!!el.querySelector('.success-check');
  if(ok){if(!el.classList.contains('success-message'))el.classList.add('success-message');return}
  if(el.classList.contains('success-message'))el.classList.remove('success-message');
  var t=el.textContent||'';
  if(/^\s*(⚠️|⚠|🛠️|🛠)/.test(t)){
    el.__upTidy=true;
    el.innerHTML=ERR_IC+'<span>'+t.replace(/^\s*(⚠️|⚠|🛠️|🛠)\s*/,'').replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})+'</span>';
    el.__upTidy=false;
  }
}
function watchMsg(id){var el=$(id);if(!el||el.__upW)return;el.__upW=true;tidy(el);new MutationObserver(function(){tidy(el)}).observe(el,{childList:true,characterData:true,subtree:true})}
function watchAll(){['loginError','registerError','upFErr'].forEach(watchMsg)}
watchAll();setInterval(watchAll,800);

/* ---------- 3. tombol "Masuk" tanpa panah ---------- */
function plainMasuk(){
  var a=$('openLoginBtn');if(a&&/→/.test(a.textContent))a.textContent='Masuk';
  var b=document.querySelector('#loginForm button[type=submit]');if(b&&/→/.test(b.textContent))b.textContent='Masuk';
}
plainMasuk();setInterval(plainMasuk,800);
})();
