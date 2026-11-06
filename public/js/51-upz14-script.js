/* =====================================================================
   UpPlay V14 — lapisan perilaku terakhir
   ===================================================================== */
(function(){
'use strict';
if(window.__upz14)return;window.__upz14=true;
var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};

/* ---------- 1. bintang popup: ★/☆ jadi span berwarna (teks tetap sama, tanpa tulis ulang berulang) ---------- */
var STAR_SEL='.level-outcome-stars,.cp-pstars,.game-result-stars,#cp5Meta';
function starify(el){
  var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),list=[],n;
  while((n=w.nextNode())){if(/[★☆]/.test(n.nodeValue)&&!(n.parentElement&&n.parentElement.classList.contains('up-st')))list.push(n)}
  list.forEach(function(t){
    var f=document.createDocumentFragment(),buf='';
    Array.from(t.nodeValue).forEach(function(ch){
      if(ch==='★'||ch==='☆'){if(buf){f.appendChild(document.createTextNode(buf));buf=''}var s=document.createElement('span');s.className='up-st'+(ch==='★'?' on':'');s.textContent=ch;f.appendChild(s)}
      else buf+=ch;
    });
    if(buf)f.appendChild(document.createTextNode(buf));
    t.parentNode.replaceChild(f,t);
  });
}
function starScan(node){
  var el=node.nodeType===1?node:node.parentElement;if(!el||!el.closest)return;
  var h=el.closest(STAR_SEL);if(h){starify(h);return}
  if(el.querySelectorAll)el.querySelectorAll(STAR_SEL).forEach(starify);
}
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){var m=ms[i];
    if(m.type==='characterData'){starScan(m.target);continue}
    if(m.target.closest&&m.target.closest(STAR_SEL))starScan(m.target);
    for(var j=0;j<m.addedNodes.length;j++)starScan(m.addedNodes[j]);
  }
}).observe(document.body,{childList:true,subtree:true,characterData:true});
document.querySelectorAll(STAR_SEL).forEach(starify);


/* ---------- 2. layar memuat selesai: hilang setelah semua skrip siap ---------- */
function bootDone(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(function(){window.__upBootDone&&window.__upBootDone()},120)})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootDone);else bootDone();


/* ---------- 3. LANDING: Tentang / Fitur / Cara Bermain tepat di bawah header ---------- */
function hdr(){var h=document.querySelector('#landingPage>.topbar');return h?Math.round(h.getBoundingClientRect().height):72}
function setHdr(){var lp=$('landingPage');if(lp)lp.style.setProperty('--up-land-hdr',hdr()+'px')}
setHdr();window.addEventListener('resize',setHdr);setTimeout(setHdr,400);
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('#landingPage .nav-links a[href^="#"]');if(!a)return;
  var sec=document.getElementById(a.getAttribute('href').slice(1));if(!sec)return;
  e.preventDefault();setHdr();
  var y=sec.getBoundingClientRect().top+window.scrollY-hdr();
  window.scrollTo({top:Math.max(0,Math.round(y)),behavior:'smooth'});
  try{history.replaceState(null,'',a.getAttribute('href'))}catch(_e){}
},true);
function spy(){
  var lp=$('landingPage');if(!lp||lp.classList.contains('hidden'))return;
  var h=hdr()+4,cur=null;
  ['tentang','fitur','tutorial'].forEach(function(id){var s=$(id);if(s&&s.getBoundingClientRect().top<=h+40)cur=id});
  lp.querySelectorAll('.nav-links a').forEach(function(a){var on=a.getAttribute('href')==='#'+cur;if(a.classList.contains('on')!==on)a.classList.toggle('on',on)});
}
window.addEventListener('scroll',spy,{passive:true});spy();

/* ---------- 4. PEMELIHARAAN & AKUN NONAKTIF: popup langsung, hanya tombol Oke ---------- */
var GEAR='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/></svg>';
var BANG='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 6v8"/><circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>';
var GATE={
  maint:{ic:GEAR,t:'Website sedang dalam pemeliharaan',p:'Progres yang sudah tersimpan tetap aman. Tekan Oke untuk kembali ke halaman awal.'},
  off:{ic:BANG,t:'Akun kamu dinonaktifkan',p:'Progres yang sudah tersimpan tetap aman. Hubungi admin sekolah, lalu tekan Oke untuk kembali ke halaman awal.'},
  gone:{ic:BANG,t:'Akun kamu tidak ditemukan',p:'Akun ini sudah tidak terdaftar. Hubungi admin sekolah, lalu tekan Oke untuk kembali ke halaman awal.'}
};
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function gateReason(){
  var s=sess();if(!s||s.tester||(s.role!=='student'&&s.role!=='teacher'))return null;
  if((jget('cerdasPlayAdminCfg',{})||{}).maintenance)return 'maint';
  if(s.role==='student'){var st=jget('cerdasPlayStudents',[]);if(!Array.isArray(st))return null;var me=st.find(function(x){return x.id===s.id});if(!me)return 'gone';if(me.disabled)return 'off'}
  if(s.role==='teacher'){var ed=(jget('cerdasPlayAdminTeachers',{})||{}).edits||{};if(ed[s.id]&&ed[s.id].disabled)return 'off';
    var td=null;try{td=teacherData}catch(e){}
    if(td){var found=Object.keys(td).some(function(c){return (td[c]||[]).some(function(t){return t.id===s.id})});var added=((jget('cerdasPlayAdminTeachers',{})||{}).added||[]).some(function(t){return t.id===s.id});if(!found&&!added&&!(ed[s.id]&&ed[s.id].disabled))return null}}
  return null;
}
function forceOut(){
  try{window.__upStopAllTimers&&window.__upStopAllTimers()}catch(e){}
  var s=sess();var id=s&&{student:'logoutBtn',teacher:'teacherLogoutBtn'}[s.role],b=id&&$(id);
  window.__upzForceLogout=true;
  try{if(b)b.click();else{sessionStorage.removeItem('cerdasPlaySession');window.showPage('landing')}}catch(e){}finally{window.__upzForceLogout=false}
  setTimeout(function(){if(sess()){sessionStorage.removeItem('cerdasPlaySession');try{window.currentSession=null}catch(e){}try{window.showPage('landing')}catch(e){}}
    ['quizRoomModalV2','quizPlayOverlayV2','lgOutcome','ttOutcome','levelOutcomeModal','timeoutModalV3','cp5Outcome'].forEach(function(i){var x=$(i);if(x)x.classList.add('hidden')});
    document.querySelectorAll('.cp-ov.cp-show').forEach(function(x){x.classList.remove('cp-show')});
    ['cpRoomHud','cpRoomInter','cpRoomCount','cpLaunchCover','upzHist'].forEach(function(i){var x=$(i);if(x)x.remove()});
    document.body.classList.remove('cp-room-mode','up-pvp-play');window.__cpPaused=false;window.__cpRoomBusy=false;
    try{window.scrollTo(0,0)}catch(e){}},120);
}
function showGate(kind){
  var g=$('upGate');if(g&&g.dataset.kind===kind)return;if(g)g.remove();
  var d=GATE[kind];window.__cpPaused=true;
  try{window.__upStopAllTimers&&window.__upStopAllTimers()}catch(e){}
  g=document.createElement('div');g.id='upGate';g.dataset.kind=kind;g.setAttribute('role','alertdialog');g.setAttribute('aria-modal','true');g.setAttribute('aria-labelledby','upGateT');
  g.innerHTML='<div class="up-gate-box"><div class="up-gate-ic">'+d.ic+'</div><h3 id="upGateT">'+d.t+'</h3><p>'+d.p+'</p><button type="button" class="up-gate-ok">Oke</button></div>';
  document.body.appendChild(g);
  var ok=g.querySelector('.up-gate-ok');ok.addEventListener('click',function(){g.remove();window.__cpPaused=false;forceOut()});
  g.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation()}if(e.key==='Tab'){e.preventDefault();ok.focus()}});
  setTimeout(function(){ok.focus()},40);
}
function gateTick(){
  var r=gateReason(),g=$('upGate');
  if(r)showGate(r);
  else if(g&&g.dataset.kind!=='off'&&g.dataset.kind!=='gone'){g.remove();window.__cpPaused=false}
}
setInterval(gateTick,700);window.addEventListener('storage',function(e){if(!e.key||/AdminCfg|Students|AdminTeachers/.test(e.key))gateTick()});

/* ---------- 5. KONFIRMASI Ya/Tidak (pengganti dialog bawaan browser) ---------- */
var CONF={
  cpEnd:{t:'Akhiri permainan sekarang?',p:'Permainan langsung berhenti untuk semua siswa. Skor yang sudah diperoleh siswa tetap disimpan ke Nilai Siswa, sedangkan ronde yang belum dimainkan tidak dihitung.',y:'Ya, akhiri',n:'Tidak, lanjutkan'},
  cpClose:{t:'Tutup ruang ini?',p:'Siswa yang sudah bergabung akan keluar dari ruang tunggu. Ruang ditutup sebelum dimulai sehingga tidak ada nilai yang disimpan.',y:'Ya, tutup',n:'Tidak'},
  tg4CloseRoom:{t:'Tutup ruang ini?',p:'Ruang ditutup dan siswa keluar dari ruang tunggu. Nilai dari ruang ini tidak disimpan.',y:'Ya, tutup',n:'Tidak'},
  tg5Abort:{t:'Akhiri tarik tambang sekarang?',p:'Pertandingan dihentikan dan hasilnya tidak disimpan ke Nilai Siswa. Kamu akan kembali ke halaman pengisian nama anggota tim.',y:'Ya, akhiri',n:'Tidak, lanjut main'}
};
var bypassConf=false;
window.addEventListener('click',function(e){
  if(bypassConf)return;
  var b=e.target.closest&&e.target.closest('#cpEnd,#cpClose,#tg4CloseRoom,#tg5Abort');if(!b)return;
  if(b.id==='tg5Abort'&&!document.getElementById('tg5Pull'))return;
  var c=CONF[b.id];if(!c||!window.__upzAsk)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(b.id==='tg5Abort')rememberPvp();
  window.__upzAsk({icon:'!',title:c.t,text:c.p,yes:c.y,no:c.n,danger:true}).then(function(ok){
    if(!ok)return;
    bypassConf=true;var oc=window.confirm;window.confirm=function(){return true};
    try{b.click()}finally{window.confirm=oc;bypassConf=false}
    if(b.id==='tg5Abort')setTimeout(refillPvp,60);
  });
},true);

/* ---------- 6. TARIK TAMBANG: aturan → hitung mundur 3-2-1 → layar penuh tanpa sidebar ---------- */
var lastTeams=null;
function rememberPvp(){
  var sz=$('tg4TeamSize');
  var n=document.querySelectorAll('[id^="tg5N-red-"]').length;
  var red=[],blue=[];for(var i=0;i<n;i++){var r=$('tg5N-red-'+i),bl=$('tg5N-blue-'+i);red.push(r?r.textContent:'');blue.push(bl?bl.textContent:'')}
  lastTeams={n:n,red:red,blue:blue};
}
function refillPvp(){
  if(!lastTeams)return;var sz=$('tg4TeamSize');if(!sz)return;
  sz.value=String(lastTeams.n);sz.dispatchEvent(new Event('change',{bubbles:true}));
  setTimeout(function(){for(var i=0;i<lastTeams.n;i++){var r=$('tg4Red'+i),b=$('tg4Blue'+i);if(r)r.value=lastTeams.red[i]||'';if(b)b.value=lastTeams.blue[i]||''}},30);
}
function pvpCountdown(cb){
  var o=document.createElement('div');o.className='cp-count-ov';o.id='upPvpCount';
  o.innerHTML='<div><small>Tarik Tambang</small><p>Bersiap! Pertandingan dimulai dalam…</p><b class="cp-cnum">3</b></div>';
  document.body.appendChild(o);var n=3,num=o.querySelector('.cp-cnum');
  var iv=setInterval(function(){n--;if(n<=0){clearInterval(iv);num.textContent='Mulai!';num.classList.add('go');setTimeout(function(){o.classList.add('out');setTimeout(function(){o.remove()},260);cb()},450);return}
    num.textContent=n;num.classList.remove('tick');void num.offsetWidth;num.classList.add('tick')},1000);
  num.classList.add('tick');
}
window.__upPvpGate=function(start){
  var m=document.createElement('div');m.className='cp-ov cp-show';m.id='upPvpRules';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
  m.innerHTML='<div class="cp-bubble"><button type="button" class="cp-close" aria-label="Tutup">✕</button><span class="cp-badge">Tarik Tambang</span><h2>Aturan Pertandingan</h2><p class="cp-goal">Tim yang lebih banyak menjawab benar menarik tali ke arahnya.</p>'+
    '<div class="cp-time"><span>⏱️ Waktu pengerjaan</span><strong>Tanpa batas</strong></div><ul class="cp-list">'+
    '<li>Setiap tim mendapat 50 soal matematika. Anggota tim menjawab bergantian sesuai giliran yang ditandai.</li>'+
    '<li>Ketik jawaban lewat tombol angka di sisi tim masing-masing, lalu tekan tombol OK/kirim. Kedua tim boleh menekan tombol bersamaan.</li>'+
    '<li>Jawaban benar menarik tali satu langkah. Jawaban salah tidak menarik tali.</li>'+
    '<li>Tim yang kakinya lebih dulu menyentuh garis tengah kalah. Jika 50 soal habis, tim dengan jawaban benar terbanyak menang.</li>'+
    '<li>Papan ketik: Tim Biru angka 0–9 di atas huruf + Enter, Tim Merah angka numpad + Enter numpad.</li></ul>'+
    '<div class="cp-actions"><button type="button" class="btn btn-primary up-pvp-go">Saya Mengerti, Mulai</button></div></div>';
  document.body.appendChild(m);
  var close=function(){m.remove()};
  m.querySelector('.cp-close').onclick=close;m.addEventListener('click',function(e){if(e.target===m)close()});
  m.querySelector('.up-pvp-go').onclick=function(){close();pvpCountdown(start)};
  setTimeout(function(){m.querySelector('.up-pvp-go').focus({preventScroll:true})},40);
};
function pvpMode(){
  var on=!!document.querySelector('#teacherPortalPage:not(.hidden) #tg5Pull');
  if(document.body.classList.contains('up-pvp-play')!==on){
    document.body.classList.toggle('up-pvp-play',on);
    if(on){try{window.scrollTo({top:0,behavior:'instant'})}catch(e){window.scrollTo(0,0)}}
  }
}
new MutationObserver(pvpMode).observe(document.body,{childList:true,subtree:true});
pvpMode();


/* ---------- 7. popup aturan selalu terbuka dari atas (fokus tombol tidak menggulir isi) ---------- */
new MutationObserver(function(ms){ms.forEach(function(m){var t=m.target;if(t.classList&&t.classList.contains('cp-ov')&&t.classList.contains('cp-show')){var b=t.querySelector('.cp-bubble');if(b){b.scrollTop=0;setTimeout(function(){b.scrollTop=0},80)}}})}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('focusin',function(e){var b=e.target.closest&&e.target.closest('.cp-ov.cp-show .cp-bubble');if(b&&b.scrollHeight>b.clientHeight&&!b.__upTop){b.__upTop=1;requestAnimationFrame(function(){b.scrollTop=0;setTimeout(function(){b.__upTop=0},300)})}});

/*__MORE__*/
})();

/* 8 — judul popup hasil: buang emoji/ikon di depan teks (ikon besar sudah ada di atas) */
(function(){
  function clean(){['levelOutcomeTitle','cp5Title'].forEach(function(id){var h=document.getElementById(id);if(!h)return;
    var first=h.firstChild;
    if(first&&first.nodeType===1&&first.tagName&&/svg|span|i|img/i.test(first.tagName)&&h.textContent.trim()&&/^level/i.test(h.textContent.trim())){first.remove()}
    if(h.childNodes.length===1&&h.firstChild.nodeType===3){var t=h.textContent,n=t.replace(/^[^A-Za-z0-9]+/,'');if(n!==t)h.textContent=n}
  })}
  document.addEventListener('DOMContentLoaded',function(){['levelOutcomeModal','cp5Outcome'].forEach(function(id){var m=document.getElementById(id);if(m)new MutationObserver(function(){if(!m.classList.contains('hidden'))clean()}).observe(m,{attributes:true,attributeFilter:['class']})})});
  setTimeout(function(){var m=document.getElementById('cp5Outcome');if(m&&!m.__upT){m.__upT=1;new MutationObserver(function(){if(!m.classList.contains('hidden'))clean()}).observe(m,{attributes:true,attributeFilter:['class']})}},1500);
})();
