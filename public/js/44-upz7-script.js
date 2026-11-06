/* =====================================================================
   UpPlay V7
   - mode gelap hanya berlaku di dalam aplikasi (landing, login, daftar tetap terang)
   - popup konfirmasi: keluar sesi (4 user) & aksi hapus/nonaktif (admin/master)
   - Kontrol Kelas & Game: kartu game siswa hilang bila dimatikan untuk kelasnya
   - brankas: tombol kembali sejajar judul, latar terang di mode terang
   - landing: visual game yang bergeser otomatis (live)
   ===================================================================== */
(function(){
'use strict';
if(window.__upz7)return;window.__upz7=true;
var $=function(id){return document.getElementById(id)};
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};

/* ---------- 1. tema gelap hanya di dalam aplikasi ---------- */
function wantDark(){try{return localStorage.getItem(window.__upThemeKey?window.__upThemeKey():'upplayTheme')==='dark'}catch(e){return false}}
function syncTheme(){
  var inApp=document.body.classList.contains('upx-app');
  var on=inApp&&wantDark();
  if(document.documentElement.classList.contains('upx-dark')!==on)document.documentElement.classList.toggle('upx-dark',on);
  var t=wantDark()?'dark':'light';document.querySelectorAll('[data-upx-theme]').forEach(function(b){var o=b.dataset.upxTheme===t;if(b.classList.contains('on')!==o)b.classList.toggle('on',o)});
}
new MutationObserver(syncTheme).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-upx-theme]'))setTimeout(syncTheme,0)});
syncTheme();setInterval(syncTheme,500);

/* ---------- 2. dialog konfirmasi ---------- */
function ask(o){
  return new Promise(function(res){
    var ov=document.createElement('div');ov.className='upz-dlg';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
    ov.innerHTML='<div class="upz-dlg-box"><div class="upz-dlg-ic '+(o.danger?'danger':'')+'">'+(o.icon||'!')+'</div><h3>'+esc(o.title)+'</h3><p>'+esc(o.text)+'</p><div class="upz-dlg-row"><button type="button" class="upz-dlg-no">'+esc(o.no||'Batal')+'</button><button type="button" class="upz-dlg-yes '+(o.danger?'danger':'')+'">'+esc(o.yes||'Ya')+'</button></div></div>';
    document.body.appendChild(ov);
    var done=function(v){ov.classList.add('out');setTimeout(function(){ov.remove()},REDUCE?0:220);document.removeEventListener('keydown',key,true);res(v)};
    var key=function(e){if(e.key==='Escape'){e.stopPropagation();done(false)}};
    document.addEventListener('keydown',key,true);
    ov.querySelector('.upz-dlg-no').onclick=function(){done(false)};
    ov.querySelector('.upz-dlg-yes').onclick=function(){done(true)};
    ov.addEventListener('click',function(e){if(e.target===ov)done(false)});
    setTimeout(function(){ov.querySelector('.upz-dlg-no').focus()},30);
  });
}
window.__upzAsk=ask;
var bypass=false;
function replay(el){
  bypass=true;var oc=window.confirm;window.confirm=function(){return true};
  try{el.click()}finally{window.confirm=oc;bypass=false}
}

/* keluar sesi: siswa, guru, admin, master */
var LOGOUT_IDS=/^(logoutBtn|teacherLogoutBtn|adminLogoutBtn|roleLogoutBtn)$/;
window.addEventListener('click',function(e){
  if(bypass||window.__upzForceLogout)return; /* __upzForceLogout: keluar paksa saat pemeliharaan, tanpa konfirmasi */
  var b=e.target.closest&&e.target.closest('button,a');if(!b||!LOGOUT_IDS.test(b.id))return;
  var s=sess();if(!s)return;
  e.preventDefault();e.stopImmediatePropagation();
  var who=s.tester?'uji coba':(s.role==='admin'?(s.adminLevel==='master'?'Master':'Admin'):s.role==='teacher'?'Guru':'Siswa');
  ask({icon:'⎋',title:'Keluar dari sesi?',text:'Anda akan keluar dari akun '+(s.name||who)+'. Progres yang sudah tersimpan tidak hilang.',yes:'Ya, keluar',no:'Batal'}).then(function(ok){if(ok)replay(b)});
},true);

/* admin & master: hapus / nonaktif / reset harus dikonfirmasi */
var ACT={
  's-del':['Hapus siswa?','Akun siswa beserta progres dan skornya akan dihapus permanen.','Ya, hapus'],
  's-tg':['Nonaktifkan siswa?','Siswa ini tidak bisa masuk sampai diaktifkan kembali.','Ya, nonaktifkan'],
  't-tg':['Nonaktifkan guru?','Guru ini tidak bisa masuk sampai diaktifkan kembali.','Ya, nonaktifkan'],
  't-del':['Hapus guru?','Akun guru akan dihapus permanen.','Ya, hapus'],
  'r-end':['Akhiri room?','Room langsung selesai. Skor yang sudah masuk tetap disimpan.','Ya, akhiri'],
  'r-close':['Tutup room?','Room ditutup dan nilainya tidak dihitung.','Ya, tutup'],
  'r-del':['Hapus room?','Room dan nilainya dihapus dari riwayat.','Ya, hapus'],
  'r-clean':['Hapus room ditutup?','Semua room berstatus ditutup akan dihapus.','Ya, hapus'],
  'sc-room':['Reset nilai room?','Semua nilai Join Room pada pilihan kelas ini dihapus.','Ya, reset'],
  'sc-pvp':['Reset nilai PVP?','Semua nilai PVP pada pilihan kelas ini dihapus.','Ya, reset'],
  'rst-rooms':['Hapus semua room & notifikasi?','Seluruh room dan notifikasi kode room dihapus.','Ya, hapus'],
  'rst-prog':['Hapus progres & skor siswa?','Progres level dan skor game semua siswa dihapus. Akun tetap ada.','Ya, hapus'],
  'maint':['Ubah mode pemeliharaan?','Saat aktif, siswa dan guru tidak bisa masuk.','Ya, ubah']
};
window.addEventListener('click',function(e){
  if(bypass)return;
  var page=$('adminPortalPage');if(!page||!page.contains(e.target))return;
  var b=e.target.closest('[data-act]');if(!b||!ACT[b.dataset.act])return;
  var a=b.dataset.act,txt=(b.textContent||'').trim();
  if((a==='s-tg'||a==='t-tg')&&!/nonaktif/i.test(txt))return; /* mengaktifkan kembali tidak perlu konfirmasi */
  e.preventDefault();e.stopImmediatePropagation();
  var c=ACT[a];
  if(a==='maint')c=[/aktifkan/i.test(txt)&&!/nonaktif/i.test(txt)?'Aktifkan mode pemeliharaan?':'Nonaktifkan mode pemeliharaan?',/aktifkan/i.test(txt)&&!/nonaktif/i.test(txt)?'Siswa dan guru tidak bisa masuk sampai mode ini dimatikan.':'Siswa dan guru bisa masuk kembali.','Ya, lanjutkan'];
  ask({icon:/hapus|reset/i.test(c[0])?'×':'!',title:c[0],text:c[1],yes:c[2],no:'Batal',danger:/hapus|reset|nonaktif/i.test(c[0])}).then(function(ok){if(ok)replay(b)});
},true);
/* centang game dimatikan */
window.addEventListener('click',function(e){
  if(bypass)return;
  var t=e.target;if(!t||t.tagName!=='INPUT'||!t.dataset||!t.dataset.game)return;
  var page=$('adminPortalPage');if(!page||!page.contains(t))return;
  if(t.checked)return; /* klik mencentang = mengaktifkan, langsung saja (status checked sudah berubah saat event klik) */
  e.preventDefault();
  var name={math:'Perhitungan',logic:'Logika Sederhana',picture:'Tebak-Tebakan'}[t.dataset.game]||t.dataset.game;
  ask({icon:'!',title:'Nonaktifkan '+name+'?',text:'Game ini hilang dari dashboard siswa kelas '+t.dataset.cls+' dan dilewati di Join Room sampai diaktifkan lagi.',yes:'Ya, nonaktifkan',no:'Batal',danger:true}).then(function(ok){
    if(!ok)return;t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));
  });
},true);

/* ---------- 3. game per kelas di dashboard siswa ---------- */
var CARD={math:'openMathBtn',logic:'openLogicBtn',picture:'openPictureBtn'};
function applyClassGames(){
  var s=sess();if(!s||s.role!=='student'||s.tester)return;
  var on=window.__upGameOn||function(){return true},n=0;
  Object.keys(CARD).forEach(function(g){
    var b=$(CARD[g]);if(!b)return;var ok=on(s.className,g);if(ok)n++;
    if(ok){if(b.dataset.upzOff){delete b.dataset.upzOff;b.style.removeProperty('display');b.removeAttribute('aria-hidden')}}
    else if(!b.dataset.upzOff||b.style.getPropertyValue('display')!=='none'){b.dataset.upzOff='1';b.style.setProperty('display','none','important');b.setAttribute('aria-hidden','true')}
  });
  var grid=$(CARD.math)&&$(CARD.math).parentElement;if(!grid)return;
  var note=$('upzNoGame');
  if(n===0&&!note){note=document.createElement('div');note.id='upzNoGame';note.className='upz-nogame';note.textContent='Semua game untuk kelasmu sedang dinonaktifkan sementara oleh admin sekolah.';grid.parentElement.insertBefore(note,grid.nextSibling)}
  if(n>0&&note)note.remove();
  var tot=$('studentTotalGames')||document.querySelector('#studentDashboard .portal-stat strong');
  if(tot&&/^\d+$/.test(tot.textContent.trim())&&tot.textContent.trim()!==String(n)&&tot.closest('.portal-stat')&&/Total Game/i.test(tot.closest('.portal-stat').textContent))tot.textContent=String(n);
}
setInterval(applyClassGames,700);
window.addEventListener('storage',function(e){if(e.key&&/:games$/.test(e.key))applyClassGames()});

/* ---------- 4. brankas: tombol kembali di dalam baris judul ---------- */
function fixVault(){
  var a=$('safeExitArrow'),h=document.querySelector('#safeCrackerPage .vault-head');
  if(a&&h&&a.parentElement!==h){h.insertBefore(a,h.firstChild)}
}
setInterval(fixVault,500);

/* ---------- 5. ikon garis pada kartu game siswa ---------- */
var IC={
  math:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
  logic:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.2v14"/><path d="M12 5.2a2.9 2.9 0 0 0-5-1.4A3.1 3.1 0 0 0 4.2 7.6a3.3 3.3 0 0 0 .3 5.5 3.2 3.2 0 0 0 2.7 5.2A2.9 2.9 0 0 0 12 19.2"/><path d="M12 5.2a2.9 2.9 0 0 1 5-1.4 3.1 3.1 0 0 1 2.8 3.8 3.3 3.3 0 0 1-.3 5.5 3.2 3.2 0 0 1-2.7 5.2A2.9 2.9 0 0 1 12 19.2"/><path d="M7.6 9.4c1.1.2 1.9 1 2.1 2.1M16.4 9.4c-1.1.2-1.9 1-2.1 2.1M7.4 14.6c.9-.6 2.1-.6 3 .1M16.6 14.6c-.9-.6-2.1-.6-3 .1"/></svg>',
  picture:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 5.3 5.3"/><path d="M7.6 9.2a3.2 3.2 0 0 1 2.6-1.9"/></svg>'
};
function cardIcons(){
  document.querySelectorAll('.subject-card').forEach(function(c){
    var k=c.classList.contains('math')?'math':c.classList.contains('logic')?'logic':c.classList.contains('picture')?'picture':null;
    var i=c.querySelector('.subject-icon');if(!k||!i||i.dataset.upz)return;
    i.dataset.upz='1';i.innerHTML=IC[k];
  });
}
setInterval(cardIcons,800);

/* ---------- 6. LANDING: visual game bergeser otomatis ---------- */
function slide(k,title,sub,scene){return '<div class="upz-slide" data-k="'+k+'"><div class="upz-scene">'+scene+'</div><div class="upz-cap"><small>'+sub+'</small><b>'+title+'</b></div></div>'}
function snakeScene(){var c='';for(var r=4;r>=0;r--){for(var x=0;x<5;x++){var n=r%2===0?r*5+x+1:r*5+(5-x);c+='<i>'+n+'</i>'}}
  return '<div class="sc-snake"><div class="sc-grid">'+c+'</div><svg class="sc-lad" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M30 92 L50 52 M38 92 L58 52"/><path d="M33 86 L41 86 M36 78 L44 78 M40 70 L48 70 M44 62 L52 62"/></svg><svg class="sc-sn" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M78 18 C60 30 92 44 70 58 C52 70 70 80 58 90"/></svg><span class="sc-pawn"></span><span class="sc-dice"><span class="up-abs" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" transform="rotate(10 12 12)"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" opacity=".45"/></svg></span></span></div>'}
function memScene(){var v=['3×4','12','15','5×3','7+8','15','9','3×3'];return '<div class="sc-mem">'+v.map(function(t,i){return '<div class="mc mc'+i+'"><div class="f">?</div><div class="b">'+t+'</div></div>'}).join('')+'</div>'}
function ttsScene(){var w='EMPAT',d='DELAPAN';var g='';for(var i=0;i<5;i++)g+='<i style="grid-column:'+(i+1)+';grid-row:2"><b style="animation-delay:'+(i*.35)+'s">'+w[i]+'</b></i>';for(var j=0;j<4;j++)if(j!==1)g+='<i style="grid-column:2;grid-row:'+(j+1)+'"><b style="animation-delay:'+(1.9+j*.3)+'s">'+'SEMBILAN'[j]+'</b></i>';
  return '<div class="sc-tts"><div class="sc-tg">'+g+'</div><div class="sc-clue"><span>Mendatar: 2 + 2 = ....</span><span>Menurun: 3 × 3 = ....</span></div></div>'}
function polaScene(){return '<div class="sc-pola"><div class="row"><b>3</b><b>6</b><b>9</b><b>12</b><b class="q"><span>?</span><span class="a">15</span></b></div><div class="opt"><span>14</span><span class="ok">15</span><span>18</span></div></div>'}
function kataScene(){var w='MATAHARI';return '<div class="sc-kata"><div class="em"><span class="up-abs" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2.5 12c3-5 6-7 9.5-7s6.5 2 9.5 7c-3 5-6 7-9.5 7s-6.5-2-9.5-7z"/><circle cx="12" cy="12" r="3.6" fill="currentColor" fill-opacity=".35"/></svg></span><em>+</em><span class="up-abs" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.6" fill="currentColor" fill-opacity=".3"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg></span></div><div class="lt">'+w.split('').map(function(c,i){return '<b style="animation-delay:'+(i*.22)+'s">'+c+'</b>'}).join('')+'</div></div>'}
function safeScene(){return '<div class="sc-safe"><div class="door"><div class="dial"><div class="ring"></div><i></i></div></div><div class="pad"><div class="code"><b>0</b><b>0</b><b>4</b><b>7</b></div><small>33 + 14 = ?</small></div></div>'}
function buildHero(){
  var hv=document.querySelector('#landingPage .hero-visual');if(!hv||hv.dataset.wired)return;
  hv.dataset.wired='1';hv.setAttribute('aria-label','Cuplikan game UpPlay yang berganti otomatis');
  /* markup slider sudah ditulis langsung di index.html (tanpa kedip); dibuat ulang hanya jika tidak ada */
  if(!hv.querySelector('.upz-show'))hv.innerHTML='<div class="upz-show" tabindex="0" aria-roledescription="carousel">'+
    '<div class="upz-track">'+
      slide('snake','Ular Tangga Pintar','Perhitungan · Level 1',snakeScene())+
      slide('pola','Tebak Pola','Logika Sederhana · Level 1',polaScene())+
      slide('kata','Tebak Kata','Tebak-Tebakan · Level 1',kataScene())+
    '</div><div class="upz-dots"></div><span class="upz-live">LIVE</span></div>';
  var show=hv.querySelector('.upz-show'),sl=[].slice.call(hv.querySelectorAll('.upz-slide')),dots=hv.querySelector('.upz-dots'),cur=0,t=null,paused=false;
  sl.forEach(function(_,i){var d=document.createElement('button');d.type='button';d.setAttribute('aria-label','Tampilkan cuplikan '+(i+1));d.onclick=function(){go(i,true)};dots.appendChild(d)});
  function go(i,user){
    var prev=cur;cur=(i+sl.length)%sl.length;
    sl.forEach(function(s,k){s.classList.toggle('on',k===cur);s.classList.toggle('was',k===prev&&k!==cur);
      if(k===cur){s.querySelectorAll('[style*="animation-delay"],.mc,.sc-pawn,.q,.ok,.ring,.code b').forEach(function(x){x.style.animationName='none';void x.offsetWidth;x.style.animationName=''})}});
    [].forEach.call(dots.children,function(d,k){d.classList.toggle('on',k===cur)});
    if(user)restart();
  }
  function restart(){clearInterval(t);t=setInterval(function(){if(!paused&&!document.hidden&&show.getClientRects().length)go(cur+1)},4200)}
  show.addEventListener('mouseenter',function(){paused=true});show.addEventListener('mouseleave',function(){paused=false});
  show.addEventListener('keydown',function(e){if(e.key==='ArrowRight')go(cur+1,true);if(e.key==='ArrowLeft')go(cur-1,true)});
  var x0=null;show.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
  show.addEventListener('touchend',function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)go(cur+(dx<0?1:-1),true);x0=null});
  go(0);restart();
}
buildHero();
})();
