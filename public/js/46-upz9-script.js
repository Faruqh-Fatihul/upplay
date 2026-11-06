/* =====================================================================
   UpPlay V9
   1. Riwayat notifikasi per pengguna (24 jam) + notifikasi Dynamic Island
   2. Pesan dari Master/Admin ke siswa & guru
   3. Notifikasi room baru untuk Admin/Master
   4. Pemeliharaan: peringatan + hitung mundur lalu keluar otomatis (siswa & guru)
   5. Foto profil bisa diperbesar
   6. Bahasa Indonesia untuk label antarmuka
   7. Pion ular tangga melangkah per kotak (seperti bidak catur)
   ===================================================================== */
(function(){
'use strict';
if(window.__upz9)return;window.__upz9=true;
var $=function(id){return document.getElementById(id)};
var DAY=864e5;
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};
var jget=function(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
var jset=function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
/* identitas pengguna untuk kunci penyimpanan per akun */
function uid(){var s=sess();if(!s)return null;if(s.tester)return 'admin:'+(s.adminLevel||'admin');return s.role+':'+s.id}
function role(){var s=sess();if(!s)return null;return s.tester?'admin':s.role}

/* ================= 1. RIWAYAT NOTIFIKASI ================= */
/* BACKEND: GET /api/notifications?since=24h untuk pengguna yang sedang masuk */
function hk(){return 'upplayNotifHist:'+uid()}
function hist(){var u=uid();if(!u)return [];var l=jget(hk(),[]).filter(function(x){return Date.now()-x.at<DAY});return l}
function saveHist(l){if(uid())jset(hk(),l.filter(function(x){return Date.now()-x.at<DAY}).slice(-80))}
function addHist(o){
  if(!uid())return;var l=hist();
  if(o.hid&&l.some(function(x){return x.hid===o.hid}))return;
  l.push({id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),hid:o.hid||'',at:o.at||Date.now(),kind:o.kind||'info',title:o.title||'',text:o.text||'',meta:o.meta||null,read:!!o.read});
  saveHist(l);
}
window.__upzHistCount=function(){return hist().filter(function(x){return !x.read}).length};

var baseNotify=window.__upNotify;
window.__upNotify=function(o){
  o=Object.assign({},o||{});
  var important=!!(o.title||o.kind==='room'||o.kind==='maint'||o.kind==='msg'||o.record);
  if(important&&o.record!==false)addHist({kind:o.kind,title:o.title,text:o.text,meta:o.meta,hid:o.hid});
  var user=o.onclick;
  o.onclick=function(){if(important)window.__upzOpenHistory();else if(typeof user==='function')user()};
  var n=baseNotify?baseNotify(o):null;
  if(n&&o.kind)n.classList.add('kind-'+o.kind);
  if(n&&important)n.title='Ketuk untuk membuka riwayat notifikasi';
  updateDots();
  return n;
};
function ago(t){var d=Math.max(0,Date.now()-t),m=Math.round(d/6e4);if(m<1)return 'baru saja';if(m<60)return m+' menit lalu';var h=Math.floor(m/60);return h+' jam lalu'}
var ICO={room:'<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',maint:'<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>',msg:'<path d="M4 5h16v11H8l-4 4z"/>',info:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>'};
ICO.warn=ICO.maint;ICO.ok=ICO.info;
/* Panel Notifikasi: muncul tepat di bawah tombol garis tiga (pojok kanan atas), isi 24 jam terakhir */
window.__upzOpenHistory=function(opt){opt=opt||{};
  var old=$('upzHist');if(old){old.remove();return}
  var l=hist().slice().sort(function(a,b){return b.at-a.at}),r=role();
  var ov=document.createElement('div');ov.id='upzHist';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Notifikasi');
  ov.innerHTML='<div class="upzh-card"><div class="upzh-head"><div><h3>Notifikasi</h3><small>Pesan dan pemberitahuan 24 jam terakhir</small></div><button type="button" class="upzh-x" aria-label="Tutup">×</button></div>'+
    '<div class="upzh-list">'+(l.length?l.map(function(x){
      var go=(r==='student'&&x.meta&&x.meta.join&&x.meta.code)?'<button type="button" class="upzh-go" data-code="'+esc(x.meta.code)+'">Gabung ke Ruang '+esc(x.meta.code)+'</button>':'';
      return '<div class="upzh-item kind-'+esc(x.kind)+(x.read?'':' unread')+'"><span class="upzh-ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(ICO[x.kind]||ICO.info)+'</svg></span><div class="upzh-b">'+(x.title?'<strong>'+esc(x.title)+'</strong>':'')+'<p>'+esc(x.text)+'</p><time>'+ago(x.at)+'</time>'+go+'</div></div>'}).join(''):'<div class="upzh-empty">Belum ada notifikasi dalam 24 jam terakhir.</div>')+'</div>'+
    '</div>';
  document.body.appendChild(ov);
  /* posisikan kartu di bawah tombol garis tiga yang sedang terlihat */
  var place=function(){
    var card=ov.querySelector('.upzh-card'),btn=[].slice.call(document.querySelectorAll('.upx-burger')).find(function(b){return b.offsetParent});
    if(window.innerWidth<=560||!btn){card.style.top='';card.style.right='';ov.classList.add('sheet');return}
    ov.classList.remove('sheet');var rc=btn.getBoundingClientRect();
    card.style.top=Math.round(rc.bottom+10)+'px';card.style.right=Math.max(10,Math.round(window.innerWidth-rc.right))+'px';
  };
  place();window.addEventListener('resize',place);
  var close=function(){ov.classList.add('out');setTimeout(function(){ov.remove()},180);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',place)};
  var key=function(e){if(e.key==='Escape'){e.stopPropagation();close()}};
  document.addEventListener('keydown',key,true);
  ov.addEventListener('click',function(e){
    if(e.target.closest('.upzh-x')){close();if(opt.fromMenu)setTimeout(function(){var mb=[].slice.call(document.querySelectorAll('.upx-burger')).find(function(b){return b.offsetParent});if(mb)mb.click()},200);return}
    if(e.target===ov)close();
    var g=e.target.closest('.upzh-go');
    if(g){close();var jb=$('joinRoomBtn');if(jb)jb.click();setTimeout(function(){var i=document.querySelector('#quizRoomModalV2 input');if(i){i.value=g.dataset.code;i.dispatchEvent(new Event('input',{bubbles:true}));i.focus()}},120)}
  });
  saveHist(hist().map(function(x){x.read=true;return x}));updateDots();
  setTimeout(function(){var b=ov.querySelector('.upzh-x');b&&b.focus()},30);
};
function updateDots(){var n=window.__upzHistCount();document.querySelectorAll('.upx-burger').forEach(function(b){if(n)b.classList.add('has-dot')})}

/* ================= 2. PESAN DARI MASTER / ADMIN ================= */
/* BACKEND: GET /api/messages?role=&class=  (kedaluwarsa 24 jam) */
function forMe(m){
  var s=sess();if(!s||s.tester)return false;
  if(s.role==='admin')return false;
  if(m.to!=='all'&&m.to!==s.role)return false;
  if(m.cls&&m.cls!==s.className)return false;
  return Date.now()-m.at<DAY;
}
var firstRun={};
function checkMessages(){
  var u=uid();if(!u)return;
  var seenK='upplayMsgSeen:'+u,seen=jget(seenK,[]),L=jget('upplayMessagesV1',[]).filter(forMe),fresh=[];
  L.forEach(function(m){if(seen.indexOf(m.id)<0){seen.push(m.id);fresh.push(m)}});
  if(!fresh.length)return;
  jset(seenK,seen.slice(-200));
  fresh.forEach(function(m,i){
    var t=(m.kind==='maint'?'Jadwal pemeliharaan':'Pesan dari '+m.from)+': '+m.title;
    setTimeout(function(){window.__upNotify({kind:m.kind==='maint'?'maint':'msg',title:t,text:m.text,hid:'msg:'+m.id,ms:8000})},i*900);
  });
}
/* ================= 3. ROOM BARU untuk ADMIN / MASTER ================= */
function checkRoomsForStaff(){
  var s=sess();if(!s||s.role!=='admin'||s.tester)return;
  var u=uid(),k='upplayRoomSeenStaff:'+u,seen=jget(k,null),list=jget('cerdasPlayRoomNotifsV1',[]).filter(function(n){return Date.now()-(n.ts||0)<DAY});
  if(seen===null){ /* pertama kali: masukkan ke riwayat tanpa menampilkan pulau notifikasi */
    list.forEach(function(n){addHist({kind:'room',title:'Ruang baru: '+n.code,text:(n.teacherName||'Guru')+' membuat ruang permainan untuk kelas '+(n.className||'-')+'.',hid:'room:'+n.id,at:n.ts,read:true})});
    jset(k,list.map(function(n){return n.id}));return;
  }
  list.forEach(function(n){if(seen.indexOf(n.id)<0){seen.push(n.id);
    window.__upNotify({kind:'room',title:'Ruang baru: '+n.code,text:(n.teacherName||'Guru')+' membuat ruang permainan untuk kelas '+(n.className||'-')+'.',hid:'room:'+n.id,ms:7000})}});
  jset(k,seen.slice(-200));
}

/* ================= 4. PEMELIHARAAN: keluarkan siswa & guru ================= */
var maintTimer=null;
function maintOn(){return !!(jget('cerdasPlayAdminCfg',{})||{}).maintenance}
function checkMaint(){
  var s=sess();
  if(!s||s.tester||(s.role!=='student'&&s.role!=='teacher')){if($('upzMaint'))cancelMaint();return}
  if(!maintOn()){if($('upzMaint'))cancelMaint();return}
  if($('upzMaint'))return;
  var n=10,ov=document.createElement('div');ov.id='upzMaint';ov.setAttribute('role','alertdialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML='<div class="box"><h3>Website sedang dalam pemeliharaan</h3><p>Master sedang melakukan pemeliharaan sistem. Progres yang sudah tersimpan aman. Kamu akan keluar otomatis.</p><div class="ring" aria-live="assertive">'+n+'</div><p>detik lagi</p></div>';
  document.body.appendChild(ov);
  maintTimer=setInterval(function(){
    n--;var r=ov.querySelector('.ring');if(r)r.textContent=Math.max(0,n);
    if(n<=0){clearInterval(maintTimer);maintTimer=null;forceLogout();ov.remove()}
  },1000);
}
function cancelMaint(){if(maintTimer)clearInterval(maintTimer);maintTimer=null;var o=$('upzMaint');if(o)o.remove()}
function forceLogout(){
  var s=sess();if(!s)return;
  try{window.__upStopAllTimers&&window.__upStopAllTimers()}catch(e){}
  var id={student:'logoutBtn',teacher:'teacherLogoutBtn'}[s.role],b=id&&$(id);
  window.__upzForceLogout=true;
  try{if(b)b.click();else{sessionStorage.removeItem('cerdasPlaySession');window.showPage('landing')}}finally{window.__upzForceLogout=false}
  setTimeout(function(){if(sess()){sessionStorage.removeItem('cerdasPlaySession');try{window.showPage('landing')}catch(e){}}},150);
}

/* ================= 5. FOTO PROFIL DIPERBESAR ================= */
document.addEventListener('click',function(e){
  var img=e.target.closest&&e.target.closest('#upxAva img,#studentDashboard .sd-avatar-wrap img,#studentSidebarAvatar img');
  if(!img||e.target.closest('.sd-cam'))return;
  e.preventDefault();e.stopPropagation();
  var s=sess()||{},ov=document.createElement('div');ov.id='upzPhoto';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Foto profil');
  ov.innerHTML='<figure><img src="'+esc(img.getAttribute('src'))+'" alt="Foto profil '+esc(s.name||'')+'"><figcaption>'+esc(s.name||'')+'</figcaption></figure>';
  document.body.appendChild(ov);
  var close=function(){ov.remove();document.removeEventListener('keydown',k,true)},k=function(ev){if(ev.key==='Escape')close()};
  ov.addEventListener('click',close);document.addEventListener('keydown',k,true);
},true);

/* ================= 6. BAHASA INDONESIA untuk label antarmuka ================= */
var TR=[
 ['Dashboard Siswa','Beranda Siswa'],['Dashboard','Beranda'],['DASHBOARD','BERANDA'],
 ['ROOM QUIZ KELAS','KUIS RUANG KELAS'],['Room Quiz Kelas','Kuis Ruang Kelas'],
 ['Riwayat Join Room','Riwayat Gabung Ruang'],['Join Room','Gabung Ruang'],['JOIN ROOM','GABUNG RUANG'],['Monitor Room','Pantau Ruang'],
 ['Room Game','Ruang Permainan'],['ROOM GAME','RUANG PERMAINAN'],['Kode Room','Kode Ruang'],['KODE ROOM','KODE RUANG'],
 ['Buat Room Baru','Buat Ruang Baru'],['Buat Room','Buat Ruang'],['Tutup Room','Tutup Ruang'],['Masuk ke Room','Masuk ke Ruang'],['Room Selesai','Ruang Selesai'],
 ['Riwayat PVP Tarik Tambang','Riwayat Duel Tarik Tambang'],['PVP Tarik Tambang','Duel Tarik Tambang'],['PVP','Duel'],
 ["Game Hitung'an",'Permainan Hitung-hitungan'],['Game Logika Sederhana','Permainan Logika Sederhana'],['Game Tebak-Tebakan','Permainan Tebak-Tebakan'],
 ['Memory Card Angka','Kartu Ingatan Angka'],['Memory Card','Kartu Ingatan'],['Memory Match','Cocokkan Ingatan'],
 ['Reset PW','Atur Ulang Sandi'],['PASSWORD','KATA SANDI'],['Password','Kata Sandi'],['password','kata sandi'],
 ['Username','Nama pengguna'],['username','nama pengguna'],['Login','Masuk'],['Logout','Keluar'],['Edit','Ubah'],
 ['Ranking','Peringkat'],['ranking','peringkat'],['Boss level','Level bos'],['LIVE','LANGSUNG'],['Live','Langsung'],
 ['Email / Gmail','Surel / Gmail'],['EMAIL','SUREL'],['Email','Surel'],['email','surel'],['Upload','Unggah'],['Download','Unduh'],
 ['GAME INTERAKTIF','PERMAINAN INTERAKTIF'],['GAME PEMBELAJARAN','PERMAINAN PEMBELAJARAN'],['ROOM','RUANG'],['Room','Ruang'],['room','ruang'],
 ['GAME','PERMAINAN'],['Game','Permainan'],['game','permainan'],['Join','Gabung'],['join','gabung'],['Ekspor CSV','Ekspor CSV'],['Score','Skor'],['Hint','Petunjuk']
];
var TRRE=new RegExp('(^|[^A-Za-z\\u00C0-\\u024F])('+TR.map(function(p){return p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')(?=$|[^A-Za-z\\u00C0-\\u024F])','g');
var TRMAP={};TR.forEach(function(p){TRMAP[p[0]]=p[1]});
var TSCOPE='#upxSide,#upxMenu,.upx-head,#studentDashboard,#teacherPortalPage,#adminPortalPage,#mathLevelsPage,#lgLevelsPage,#ttLevelsPage,.level-outcome-overlay,.cp-ov,#cpRoomInter,#cpRoomHud,#quizRoomModalV2,#cpNotifPanel,.ad-ov,.upz-dlg,#upNotifs,#upzHist,#gameTutorialModal,#cpRoomCount,.app-view .page-head,#loginModal,#registerModal,#landingPage';
var TSKIP='script,style,textarea,input,select,code,svg,[contenteditable="true"],.ad-pwc,.room-vnext-code,.upzh-b p,.up-notif p';
function trText(t){
  var p=t.parentElement;if(!p||!p.closest||p.closest(TSKIP)||!p.closest(TSCOPE))return;
  var v=t.nodeValue;TRRE.lastIndex=0;if(!TRRE.test(v))return;
  var nv=v.replace(TRRE,function(m,a,w){return a+(TRMAP[w]||w)});
  if(nv!==v)t.nodeValue=nv;
}
function trAttr(el){
  ['placeholder','title','aria-label'].forEach(function(a){var v=el.getAttribute&&el.getAttribute(a);if(!v)return;TRRE.lastIndex=0;if(!TRRE.test(v))return;
    var nv=v.replace(TRRE,function(m,x,w){return x+(TRMAP[w]||w)});if(nv!==v)el.setAttribute(a,nv)});
}
function trSweep(root){
  if(!root)return;if(root.nodeType===3){trText(root);return}if(root.nodeType!==1)return;
  if(root.closest&&root.closest(TSCOPE)||root.querySelector&&root.querySelector(TSCOPE)){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,l=[];while((n=w.nextNode()))l.push(n);l.forEach(trText);
    if(root.querySelectorAll){trAttr(root);root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(e){if(e.closest(TSCOPE))trAttr(e)})}
  }
}
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){var m=ms[i];
    if(m.type==='characterData')trText(m.target);
    else for(var j=0;j<m.addedNodes.length;j++)trSweep(m.addedNodes[j]);}
}).observe(document.body,{childList:true,subtree:true,characterData:true});
trSweep(document.body);
try{document.title=document.title.replace(/Dashboard/g,'Beranda').replace(/\bGame\b/g,'Permainan')}catch(e){}

/* ================= 7. PION ULAR TANGGA: melangkah per kotak ================= */
(function(){
  var tok=null,last=null,mo=null;
  function hop(){
    if(!tok)return;
    var l=parseFloat(tok.style.left),t=parseFloat(tok.style.top);if(isNaN(l)||isNaN(t))return;
    if(last){
      var d=Math.hypot(l-last[0],t-last[1]); /* 20% = 1 kotak */
      if(d<0.5){last=[l,t];return}
      var far=d>22,dur=far?520:200;
      tok.style.transitionDuration=dur+'ms';
      if(tok.animate&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){
        tok.animate([{translate:'0 0',scale:'1'},{translate:'0 '+(far?-48:-30)+'%',scale:'1.12',offset:.45},{translate:'0 0',scale:'.9',offset:.85},{translate:'0 0',scale:'1'}],{duration:dur+90,easing:'ease-out',composite:'replace'});
      }
    }
    last=[l,t];
  }
  setInterval(function(){
    var t=$('playerToken');
    if(t&&t!==tok){tok=t;last=[parseFloat(t.style.left),parseFloat(t.style.top)];if(mo)mo.disconnect();mo=new MutationObserver(hop);mo.observe(t,{attributes:true,attributeFilter:['style']})}
  },500);
})();

/* ================= jalankan berkala & saat data berubah di tab lain ================= */
function tick(){try{checkMessages()}catch(e){}try{checkRoomsForStaff()}catch(e){}/* V14: pemeliharaan ditangani popup Oke (upz14) */}
setInterval(tick,1500);
window.addEventListener('storage',function(e){if(!e.key||/upplayMessagesV1|cerdasPlayRoomNotifsV1|cerdasPlayAdminCfg/.test(e.key))tick()});
tick();
})();
