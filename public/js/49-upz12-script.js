/* =====================================================================
   UpPlay V12
   1. Lupa kata sandi (siswa) di form Masuk + info untuk guru
   2. Portal guru: menu Profil & Permainan (3 permainan siswa, level terkunci bertahap)
   3. Admin/Master: Kontrol Permainan dua kartu (Siswa per kelas • Guru wali kelas)
   4. Data siswa/guru yang berubah langsung tampil di admin & master
   Isi & alur game siswa tidak diubah.
   ===================================================================== */
(function(){
'use strict';
if(window.__upz12)return;window.__upz12=true;
var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};
var jget=function(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
/* BACKEND: setiap jset = satu PUT ke API (lihat docs/BACKEND.md) */
var jset=function(k,v){var s=JSON.stringify(v);localStorage.setItem(k,s);try{window.dispatchEvent(new StorageEvent('storage',{key:k,newValue:s}))}catch(e){}};
var sess=function(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
var K={stu:'cerdasPlayStudents',log:'cerdasPlayAdminLog',tprof:'cerdasPlayTeacherProfiles',tgames:'cerdasPlayTeacherGames'};
var CLASSES=['5A','5B','5C','5D','6A','6B','6C','6D'];
function adminLog(m){var l=jget(K.log,[]);l.unshift({ts:Date.now(),msg:m});jset(K.log,l.slice(0,100))}
function toast(t,title){try{window.__upNotify&&window.__upNotify({title:title||'UpPlay',text:t})}catch(e){}}
var EYE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var LOCK='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

/* ================= 1. LUPA KATA SANDI ================= */
function ensureForgotLink(){
  var form=$('loginForm'),err=$('loginError');if(!form||!err||$('upForgotLink'))return;
  var row=document.createElement('div');row.className='up-forgot-row';
  row.innerHTML='<button type="button" id="upForgotLink" class="up-forgot-link">Lupa kata sandi?</button>';
  form.insertBefore(row,err);
}
function buildForgot(){
  if($('upForgotModal'))return;
  var o=document.createElement('div');o.id='upForgotModal';o.className='modal-overlay hidden up-auth-light';
  o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-labelledby','upForgotTitle');
  o.innerHTML='<div class="modal">'+
    '<div class="modal-top"><div><h2 id="upForgotTitle">Atur Ulang Kata Sandi</h2><p>Khusus akun siswa. Masukkan surel yang dipakai saat mendaftar, lalu buat kata sandi baru.</p></div>'+
    '<button type="button" class="close-modal" data-up-fclose aria-label="Tutup">×</button></div>'+
    '<form id="upForgotForm" class="login-form" novalidate>'+
      '<div class="field-group"><label for="upFEmail">Surel terdaftar</label><input id="upFEmail" type="email" placeholder="contoh: siswa.hebat@gmail.com" autocomplete="email" required></div>'+
      '<div class="field-group"><label for="upFPass">Kata sandi baru</label><div class="password-wrap"><input id="upFPass" type="password" placeholder="Minimal 6 karakter" autocomplete="new-password" required><button type="button" class="toggle-password up-ftoggle" data-target="upFPass" aria-label="Lihat kata sandi">'+EYE+'</button></div></div>'+
      '<div class="field-group"><label for="upFPass2">Ulangi kata sandi baru</label><div class="password-wrap"><input id="upFPass2" type="password" placeholder="Ketik ulang kata sandi baru" autocomplete="new-password" required><button type="button" class="toggle-password up-ftoggle" data-target="upFPass2" aria-label="Lihat kata sandi">'+EYE+'</button></div></div>'+
      '<div class="up-fnote"><b>Guru lupa kata sandi?</b> Kata sandi guru dikelola sekolah. Silakan hubungi admin / operator sekolah untuk mengatur ulang.</div>'+
      '<div id="upFErr" class="login-error" role="alert"></div>'+
      '<div class="up-frow"><button type="button" class="btn btn-outline" data-up-fclose>Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div>'+
    '</form></div>';
  document.body.appendChild(o);
  o.addEventListener('click',function(e){if(e.target===o||e.target.closest('[data-up-fclose]')){e.preventDefault();closeForgot(true)}});
  o.querySelectorAll('.up-ftoggle').forEach(function(b){b.addEventListener('click',function(){var i=$(b.dataset.target);i.type=i.type==='password'?'text':'password'})});
  $('upForgotForm').addEventListener('submit',function(e){
    e.preventDefault();
    var em=$('upFEmail').value.trim().toLowerCase(),p1=$('upFPass').value,p2=$('upFPass2').value,er=$('upFErr');
    er.classList.remove('success-message');
    if(!em)return void(er.textContent='⚠️ Surel wajib diisi.');
    var list=jget(K.stu,[]),i=list.findIndex(function(s){return String(s.email||'').toLowerCase()===em});
    if(i<0)return void(er.textContent='⚠️ Surel tidak terdaftar sebagai akun siswa. Guru silakan menghubungi admin sekolah.');
    {const __pw=window.__upPwCheck?window.__upPwCheck(p1):(p1.length<6?'Kata sandi baru minimal 6 karakter.':'');if(__pw)return void(er.textContent='⚠️ '+__pw);}
    if(p1!==p2)return void(er.textContent='⚠️ Ulangan kata sandi tidak sama.');
    list[i].password=p1;list[i].passwordChangedAt=new Date().toISOString();
    jset(K.stu,list); /* BACKEND: POST /api/auth/reset-password {email,newPassword} */
    adminLog('Siswa '+list[i].name+' ('+list[i].className+') mengatur ulang kata sandi lewat "Lupa kata sandi"');
    var name=list[i].name;
    closeForgot(false);
    var lm=$('loginModal');if(lm){lm.classList.remove('hidden')}
    if($('loginName'))$('loginName').value=name;
    if($('loginPassword')){$('loginPassword').value='';setTimeout(function(){$('loginPassword').focus()},60)}
    var n=$('loginError');if(n){n.classList.add('success-message');n.innerHTML='<span class="success-check">✓</span><span><strong>Kata sandi berhasil diperbarui. Masuk dengan kata sandi baru.</strong></span>'}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!o.classList.contains('hidden'))closeForgot(true)});
}
function openForgot(){
  buildForgot();
  var lm=$('loginModal');if(lm)lm.classList.add('hidden');
  ['upFEmail','upFPass','upFPass2'].forEach(function(id){$(id).value=''});
  var er=$('upFErr');er.textContent='';er.classList.remove('success-message');
  $('upForgotModal').classList.remove('hidden');setTimeout(function(){$('upFEmail').focus()},60);
}
function closeForgot(backToLogin){
  var o=$('upForgotModal');if(o)o.classList.add('hidden');
  if(backToLogin){var lm=$('loginModal');if(lm)lm.classList.remove('hidden')}
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#upForgotLink')){e.preventDefault();openForgot()}});
ensureForgotLink();setInterval(ensureForgotLink,1000);

/* ================= 2. PORTAL GURU ================= */
function teacherRec(){
  var s=sess();if(!s||s.role!=='teacher')return null;
  var td=null;try{td=teacherData}catch(e){}
  var t=null;if(td)Object.keys(td).some(function(c){var x=(td[c]||[]).find(function(y){return y.id===s.id});if(x){t=Object.assign({className:c},x);return true}});
  return t||{id:s.id,name:s.name,className:s.className,password:''};
}
function tprof(id){return Object.assign({email:'',phone:'',nip:'',photo:''},(jget(K.tprof,{})||{})[id]||{})}
function saveTprof(id,patch){var all=jget(K.tprof,{})||{};all[id]=Object.assign(tprof(id),patch,{updatedAt:new Date().toISOString()});jset(K.tprof,all)}
window.__upTeacherAva=function(s){var p=s&&s.id&&tprof(s.id).photo;return '<img src="'+esc(p||window.__upDonut||'')+'" alt="">'};
function teacherGames(id){return Object.assign({math:true,logic:true,picture:true},(jget(K.tgames,{})||{})[id]||{})}

var AVA_EMPTY='<img src="'+(window.__upDonut||'')+'" alt="Foto profil bawaan">';
window.__upTeacherProfile=function(host){
  var t=teacherRec();if(!t||!host)return;var p=tprof(t.id);
  host.innerHTML=
   '<div class="tg4-head up-tp-head"><div><span class="badge">Portal Guru</span><h1>Profil</h1><p>Data wali kelas yang dikelola sekolah. Foto dan kontak bisa kamu perbarui sendiri.</p></div><span class="tg4-chip">Kelas '+esc(t.className)+'</span></div>'+
   '<form class="up-tprof" id="upTProfForm" autocomplete="off">'+
    '<section class="up-tp-card">'+
     '<div class="up-tp-kick">PROFIL GURU</div><h2>Data akun saya</h2>'+
     '<div class="up-tp-photo">'+
       '<div class="up-tp-ava'+(p.photo?' has':'')+'" id="upTPAva" role="button" tabindex="0" aria-label="'+(p.photo?'Perbesar foto profil':'Belum ada foto')+'">'+(p.photo?'<img src="'+esc(p.photo)+'" alt="Foto profil '+esc(t.name)+'">':AVA_EMPTY)+
         '<label class="up-tp-cam" for="upTPFile" title="Ganti foto" aria-label="Ganti foto"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></label></div>'+
       '<div><strong>Foto profil</strong><p>Gunakan foto JPG/PNG. Klik foto untuk memperbesar.</p><div class="up-tp-btns"><label class="btn btn-primary" for="upTPFile">Ganti Foto</label><input id="upTPFile" type="file" accept="image/png,image/jpeg,image/webp" hidden><button type="button" class="btn btn-outline" id="upTPDel"'+(p.photo?'':' disabled')+'>Hapus Foto</button></div></div>'+
     '</div>'+
     '<div class="up-tp-grid">'+
       fld('Nama Lengkap','upTPName',t.name,true,'Nama mengikuti data sekolah.')+
       fld('Wali Kelas','upTPClass','Kelas '+t.className,true)+
       fld('NIP / NUPTK','upTPNip',p.nip,false,'','Opsional')+
       fld('Surel','upTPEmail',p.email,false,'','guru@sekolah.sch.id','email')+
       fld('No. HP / WhatsApp','upTPPhone',p.phone,false,'','08xxxxxxxxxx','tel')+
       '<div class="field-group up-tp-pw"><label for="upTPPw">Kata Sandi</label><div class="up-tp-lock">'+LOCK+'<input id="upTPPw" type="text" value="••••••••" disabled readonly aria-readonly="true" tabindex="-1"></div><small>Kata sandi guru hanya bisa diubah oleh admin / operator sekolah.</small></div>'+
     '</div>'+
     '<div class="up-tp-actions"><span class="up-tp-msg" id="upTPMsg" role="status"></span><button type="submit" class="btn btn-primary">Simpan Perubahan</button></div>'+
    '</section>'+
   '</form>';
  function fld(l,id,v,ro,hint,ph,type){return '<div class="field-group'+(ro?' up-ro':'')+'"><label for="'+id+'">'+l+'</label><input id="'+id+'" type="'+(type||'text')+'" value="'+esc(v||'')+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+(ro?' disabled readonly aria-readonly="true" tabindex="-1"':'')+'>'+(hint?'<small>'+hint+'</small>':'')+'</div>'}
  $('upTProfForm').addEventListener('submit',function(e){
    e.preventDefault();
    var em=$('upTPEmail').value.trim(),ph=$('upTPPhone').value.trim(),nip=$('upTPNip').value.trim(),msg=$('upTPMsg');
    if(em&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){msg.className='up-tp-msg bad';msg.textContent='Format surel belum benar.';return}
    if(ph&&!/^[0-9+\s-]{8,16}$/.test(ph)){msg.className='up-tp-msg bad';msg.textContent='Nomor HP hanya angka (8–16 digit).';return}
    saveTprof(t.id,{email:em,phone:ph,nip:nip});adminLog('Guru '+t.name+' memperbarui profil');
    msg.className='up-tp-msg ok';msg.textContent='Profil tersimpan.';toast('Profil guru tersimpan.');
  });
  $('upTPFile').addEventListener('change',function(e){
    var f=e.target.files&&e.target.files[0];if(!f)return;
    if(!/^image\//.test(f.type)){toast('Pilih berkas gambar JPG/PNG.');return}
    var r=new FileReader();r.onload=function(){
      var img=new Image();img.onload=function(){
        var S=360,c=document.createElement('canvas'),k=Math.max(S/img.width,S/img.height);c.width=S;c.height=S;
        var w=img.width*k,h=img.height*k;c.getContext('2d').drawImage(img,(S-w)/2,(S-h)/2,w,h);
        saveTprof(t.id,{photo:c.toDataURL('image/jpeg',.86)});adminLog('Guru '+t.name+' mengganti foto profil');
        window.__upTeacherProfile(host);toast('Foto profil diperbarui.');
      };img.src=r.result;
    };r.readAsDataURL(f);
  });
  $('upTPDel').addEventListener('click',function(){saveTprof(t.id,{photo:''});window.__upTeacherProfile(host)});
  var ava=$('upTPAva');
  var zoom=function(e){if(e&&e.target.closest('.up-tp-cam'))return;var img=ava.querySelector('img');if(!img)return;openZoom(img.getAttribute('src'),t.name)};
  ava.addEventListener('click',zoom);ava.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();zoom(e)}});
};
function openZoom(src,name){
  var ov=document.createElement('div');ov.id='upzPhoto';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Foto profil');
  ov.innerHTML='<figure><img src="'+esc(src)+'" alt="Foto profil '+esc(name)+'"><figcaption>'+esc(name)+'</figcaption></figure>';
  document.body.appendChild(ov);
  var close=function(){ov.remove();document.removeEventListener('keydown',k,true)},k=function(ev){if(ev.key==='Escape')close()};
  ov.addEventListener('click',close);document.addEventListener('keydown',k,true);
}
/* foto guru di sidebar ikut bisa diperbesar */
document.addEventListener('click',function(e){
  var s=sess();if(!s||s.role!=='teacher')return;
  var img=e.target.closest&&e.target.closest('#upxAva img');if(!img)return;
  e.preventDefault();e.stopPropagation();openZoom(img.getAttribute('src'),s.name||'');
},true);

/* ---- menu Permainan guru: 3 permainan siswa dengan judul untuk guru ---- */
var TGAMES=[
 {k:'math',cls:'math',page:'levels',icon:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/></svg>',
  title:'Permainan Numerasi & Operasi Hitung',desc:'Tinjau 5 level yang dimainkan siswa: ular tangga, kartu ingatan, TTS angka, labirin, dan brankas kode.',tag:'NUMERASI • 5 LEVEL'},
 {k:'logic',cls:'logic',page:'logic',icon:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.2v14"/><path d="M12 5.2a2.9 2.9 0 0 0-5-1.4A3.1 3.1 0 0 0 4.2 7.6a3.3 3.3 0 0 0 .3 5.5 3.2 3.2 0 0 0 2.7 5.2A2.9 2.9 0 0 0 12 19.2"/><path d="M12 5.2a2.9 2.9 0 0 1 5-1.4 3.1 3.1 0 0 1 2.8 3.8 3.3 3.3 0 0 1-.3 5.5 3.2 3.2 0 0 1-2.7 5.2A2.9 2.9 0 0 1 12 19.2"/><path d="M7.6 9.4c1.1.2 1.9 1 2.1 2.1M16.4 9.4c-1.1.2-1.9 1-2.1 2.1M7.4 14.6c.9-.6 2.1-.6 3 .1M16.6 14.6c-.9-.6-2.1-.6-3 .1"/></svg>',
  title:'Permainan Penalaran Logis & Pola',desc:'Tinjau 5 level penalaran: pola bilangan, ingatan visual, susun balok, benar–salah, dan detektif logika.',tag:'PENALARAN • 5 LEVEL'},
 {k:'picture',cls:'picture',page:'picture',icon:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 5.3 5.3"/><path d="M7.6 9.2a3.2 3.2 0 0 1 2.6-1.9"/></svg>',
  title:'Permainan Literasi Visual & Bahasa',desc:'Tinjau 5 level literasi: tebak kata bergambar, tebak tempat, ungkapan & peribahasa, teka-teki, dan siapakah aku.',tag:'LITERASI • 5 LEVEL'}
];
window.__upTeacherGames=function(host){
  var t=teacherRec();if(!t||!host)return;var on=teacherGames(t.id),list=TGAMES.filter(function(g){return on[g.k]});
  host.innerHTML='<div class="tg4-head"><div><span class="badge">Portal Guru</span><h1>Permainan</h1><p>Uji coba permainan yang dimainkan siswa. Level terbuka bertahap seperti di akun siswa.</p></div><span class="tg4-chip">Kelas '+esc(t.className)+'</span></div>'+
   '<div class="tg4-panel up-tgames"><span class="up-tg-kick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="14" r=".9" fill="currentColor"/></svg>PERMAINAN PEMBELAJARAN</span><h3 class="up-tg-title">Permainan yang tersedia untukmu</h3><p class="up-tg-sub">Permainan untuk ditinjau guru</p>'+
   (list.length?'<div class="game-mini-grid dashboard-game-grid up-tgame-grid">'+list.map(function(g){
     return '<div class="subject-card '+g.cls+' up-tcard"><div class="subject-card-content"><div class="subject-icon">'+g.icon+'</div><span class="card-game-tag">'+g.tag+'</span><h2>'+g.title+'</h2><p>'+g.desc+'</p><span class="play-label" role="button" tabindex="0" data-up-tplay="'+g.page+'">Buka Permainan →</span></div></div>'}).join('')+'</div>'
    :'<div class="up-tempty">Semua permainan sedang dinonaktifkan admin untuk akunmu.</div>')+
   '</div>';
};
function playT(page){
  try{if(page==='levels'&&typeof window.updateDashboardProgress==='function')window.updateDashboardProgress()}catch(e){}
  window.showPage(page);
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-up-tplay]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();playT(b.dataset.upTplay)},true);
document.addEventListener('keydown',function(e){var b=e.target.closest&&e.target.closest('[data-up-tplay]');if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();playT(b.dataset.upTplay)}});
/* guru yang sedang membuka Permainan: kartu ikut berubah bila admin mematikan/menyalakan */
window.addEventListener('storage',function(e){
  if(e.key!==K.tgames&&e.key!==K.tprof)return;
  var s=sess();if(!s||s.role!=='teacher')return;
  var act=document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext].active'),host=$('teacherGuruV4');
  if(!act||!host||$('teacherPortalPage').classList.contains('hidden'))return;
  if(act.dataset.teacherVnext==='games'&&e.key===K.tgames)window.__upTeacherGames(host);
});

/* ================= 3. ADMIN/MASTER: Kontrol Permainan dua kartu ================= */
window.__upCtab=window.__upCtab||'siswa';
window.__upAdminClasses=function(base){
  var i=base.indexOf('<div class="ad-cls">');if(i<0)return base;
  var head=base.slice(0,i),siswaGrid=base.slice(i);
  var desc={siswa:'Centang untuk mengaktifkan permainan di kelas tersebut. Permainan yang dimatikan langsung hilang dari beranda siswa kelas itu dan tidak dimainkan di Gabung Ruang.',guru:'Centang untuk menampilkan permainan di menu Permainan akun guru. Level guru terbuka bertahap seperti siswa; uji coba tanpa kunci tersedia di menu Uji Permainan admin/master.'};
  var td=null;try{td=teacherData}catch(e){}
  var tlist=[];if(td)CLASSES.forEach(function(c){(td[c]||[]).forEach(function(t){tlist.push({id:t.id,name:t.name,className:c})})});
  var nStu=jget(K.stu,[]).length;
  var tab=window.__upCtab==='guru'?'guru':'siswa';
  head=head.replace(/(<p class="ad-sub"[^>]*>)[\s\S]*?(<\/p>)/,'$1'+desc[tab]+'$2');
  var GM=[['math','Perhitungan'],['logic','Logika Sederhana'],['picture','Tebak-Tebakan']];
  var cards='<div class="up-ctabs" role="tablist" aria-label="Kontrol permainan">'+
    '<button type="button" role="tab" class="up-ctab'+(tab==='siswa'?' on':'')+'" data-upctab="siswa" aria-selected="'+(tab==='siswa')+'"><span class="up-ct-ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/></svg></span><span><b>Permainan Siswa</b><small>8 kelas • '+nStu+' siswa</small></span></button>'+
    '<button type="button" role="tab" class="up-ctab'+(tab==='guru'?' on':'')+'" data-upctab="guru" aria-selected="'+(tab==='guru')+'"><span class="up-ct-ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M3 20c.6-3.6 3-5.4 6-5.4s5.4 1.8 6 5.4"/><path d="M15 6.5h6M15 10h6M17 13.5h4"/></svg></span><span><b>Permainan Guru</b><small>'+tlist.length+' wali kelas</small></span></button>'+
  '</div>';
  if(tab==='siswa')return head+cards+siswaGrid;
  var grid='<div class="ad-cls up-tcls">'+tlist.map(function(t){var g=teacherGames(t.id),p=tprof(t.id);
    return '<div class="ad-card"><h2>'+esc(t.name)+'</h2><p style="margin:0;color:#84817d;font-weight:700">Wali kelas '+esc(t.className)+(p.email?' • '+esc(p.email):'')+'</p>'+
      GM.map(function(x){return '<label><input type="checkbox" data-tid="'+esc(t.id)+'" data-tgame="'+x[0]+'" '+(g[x[0]]?'checked':'')+'> '+x[1]+'</label>'}).join('')+'</div>'}).join('')+'</div>';
  return head+cards+grid;
};
function adminRerender(){var b=document.querySelector('#adMenu button.on');if(b&&!document.querySelector('.ad-ov'))b.click()}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-upctab]');if(!b)return;
  e.preventDefault();window.__upCtab=b.dataset.upctab;adminRerender();
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t.dataset||!t.dataset.tgame)return;
  var all=jget(K.tgames,{})||{},g=teacherGames(t.dataset.tid);g[t.dataset.tgame]=t.checked;all[t.dataset.tid]=g;jset(K.tgames,all);
  adminLog((t.checked?'Aktifkan ':'Matikan ')+t.dataset.tgame+' untuk guru '+t.dataset.tid);
  toast('Pengaturan permainan guru disimpan.');
});
/* perubahan data siswa/guru (lupa sandi, profil guru) langsung tampil di admin & master */
window.addEventListener('storage',function(e){
  if([K.stu,K.tprof,K.tgames,'cerdasPlayAdminTeachers'].indexOf(e.key)<0)return;
  var s=sess();if(!s||s.role!=='admin')return;
  var pg=$('adminPortalPage');if(!pg||pg.classList.contains('hidden'))return;
  var v=document.querySelector('#adMenu button.on');if(!v)return;
  if(['students','teachers','classes','dash'].indexOf(v.dataset.v)<0)return;
  var a=document.activeElement;if(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)&&$('adMain').contains(a))return; /* jangan ganggu admin yang sedang mengetik */
  adminRerender();
});
})();
