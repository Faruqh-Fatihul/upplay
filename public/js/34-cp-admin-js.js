(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const H=(s,seed=0)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,c;i<s.length;i++){c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)};
/* BACKEND: setiap kunci di K adalah satu tabel/endpoint. jget = GET, jset = PUT/POST.
   stu -> /api/students | room -> /api/rooms | notif -> /api/notifications | grp & pvp -> /api/pvp-results
   cfg -> /api/admin/config (akun master/admin, pemeliharaan) | tch -> /api/teachers | log -> /api/admin/logs */
const K={stu:'cerdasPlayStudents',jab:'cerdasPlayStudentJabatan',room:'cerdasPlayQuizRoomsV2',notif:'cerdasPlayRoomNotifsV1',grp:'cerdasPlayPvpGroupScoresV4',pvp:'cerdasPlayLocalPvpScoresV3',cfg:'cerdasPlayAdminCfg',tch:'cerdasPlayAdminTeachers',log:'cerdasPlayAdminLog'};
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const CLASSES=['5A','5B','5C','5D','6A','6B','6C','6D'];
const GAMES=[['math','🔢 Perhitungan'],['logic','🧠 Logika Sederhana'],['picture','🖼️ Tebak-Tebakan']];
/* ================= AKUN BAWAAN (tanpa pendaftaran) =================
   Master (pusat)          -> username: master  | password: Master@2026
   Admin (operator sekolah)-> username: admin   | password: Admin@2026
   Password disimpan sebagai hash H('username|password'). Master dapat mengganti
   kedua akun dari menu Pengaturan; nilai baru disimpan di localStorage 'cerdasPlayAdminCfg'.
   =================================================================== */
const DEF={master:{user:'master',hash:'1wgrm6feyim'}/* master / Master@2026 */,admin:{user:'admin',hash:'1yp99qp98kg'}/* admin / Admin@2026 */};
const cfg=()=>jget(K.cfg,{});
const acc=lv=>Object.assign({},DEF[lv],(cfg().acc||{})[lv]||{});
const adminUser=()=>acc('master').user;
const adminAuth=(n,p)=>{const x=H(String(n).trim().toLowerCase()+'|'+p);for(const lv of ['master','admin']){if(x===acc(lv).hash)return lv}return null};
const isAdmin=(n,p)=>!!adminAuth(n,p);
const lvl=()=>{try{return currentSession&&currentSession.adminLevel==='master'?'master':'admin'}catch(e){return 'admin'}};
const MASTER_ONLY='Hanya akun Master yang dapat melakukan ini.';
const log=m=>{const l=jget(K.log,[]);l.unshift({ts:Date.now(),msg:m});jset(K.log,l.slice(0,100))};
const fd=ts=>ts?new Date(ts).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'-';

/* ---------- guru (override di atas teacherData bawaan) ---------- */
const BASE=JSON.parse(JSON.stringify(teacherData));
const tst=()=>Object.assign({edits:{},added:[]},jget(K.tch,{}));
function allTeachers(){const st=tst(),o=[];CLASSES.forEach(c=>(BASE[c]||[]).forEach(t=>o.push(Object.assign({className:c,base:true},t,st.edits[t.id]||{}))));st.added.forEach(t=>o.push(Object.assign({base:false},t,st.edits[t.id]||{})));return o}
function applyTeachers(){CLASSES.forEach(c=>{teacherData[c]=teacherData[c]||[];teacherData[c].length=0});allTeachers().filter(t=>!t.disabled).forEach(t=>teacherData[t.className].push({id:t.id,name:t.name,password:t.password}))}
applyTeachers();

/* ---------- data ---------- */
const students=()=>jget(K.stu,[]);
const rooms=()=>jget(K.room,{});
const roomList=()=>Object.values(rooms()).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
const classGames=c=>Object.assign({math:true,logic:true,picture:true},jget('cerdasPlay:'+c+':games',{}));
function scoreTable(cls){const m={};roomList().filter(r=>r.status==='finished'&&(!cls||r.className===cls)).forEach(r=>(r.players||[]).forEach(p=>{const x=m[p.id]||(m[p.id]={id:p.id,name:p.name,className:r.className,total:0,rooms:0});x.total+=p.score||0;x.rooms++}));return Object.values(m).sort((a,b)=>b.total-a.total)}
const totalOf=id=>{const x=scoreTable().find(s=>s.id===id);return x?x.total:0};
function rmKeys(f){Object.keys(localStorage).filter(f).forEach(k=>localStorage.removeItem(k))}
function delStudentData(id){rmKeys(k=>k.startsWith('cerdasPlay:'+id+':')||k.startsWith('cerdasPlay'+id));const j=jget(K.jab,{});delete j[id];jset(K.jab,j)}

/* ---------- UI helpers ---------- */
let view='dash',F={q:'',cls:''},showPw={};const FV={}; /* filter disimpan per halaman: pilihan kelas di Data Siswa tidak memengaruhi Data Guru */
function toast(m){if(window.__upNotify){window.__upNotify({text:m,kind:/salah|gagal|tidak|hanya|minimal|isi /i.test(m)?'warn':'ok',ms:3200});return}const t=document.createElement('div');t.className='ad-toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
function modal(title,fields,ok,label,danger){
  const o=document.createElement('div');o.className='ad-ov';
  o.innerHTML=`<form class="ad-md"><h3>${esc(title)}</h3>${fields.map(f=>`<label>${esc(f.l)}${f.t==='select'?`<select name="${f.k}">${f.o.map(x=>`<option ${x===f.v?'selected':''}>${esc(x)}</option>`).join('')}</select>`:`<input name="${f.k}" type="${f.t||'text'}" value="${esc(f.v||'')}">`}</label>`).join('')}<div class="ad-err"></div><div class="ad-row"><button type="button" class="ad-b" data-x>Batal</button><button class="ad-b pri ${danger?'red':''}">${label||'Simpan'}</button></div></form>`;
  document.body.appendChild(o);
  o.querySelector('[data-x]').onclick=()=>o.remove();
  o.onclick=e=>{if(e.target===o)o.remove()};
  o.querySelector('form').onsubmit=e=>{e.preventDefault();const v={};new FormData(e.target).forEach((x,k)=>v[k]=String(x).trim());const er=ok(v);if(er)o.querySelector('.ad-err').textContent='⚠️ '+er;else{o.remove();render()}};
  const i=o.querySelector('input');if(i)i.focus();
}
function info(title,html){const o=document.createElement('div');o.className='ad-ov';o.innerHTML=`<div class="ad-md"><h3>${esc(title)}</h3>${html}<div class="ad-row"><button class="ad-b pri" data-x>Tutup</button></div></div>`;document.body.appendChild(o);o.querySelector('[data-x]').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()}}
const tbl=(h,rows,empty)=>rows.length?`<div class="ad-tw"><table class="ad-t"><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:`<div class="ad-card ad-empty">${empty||'Belum ada data.'}</div>`;
const stat=(l,v)=>`<div class="ad-stat"><small>${l}</small><b>${v}</b></div>`;
const head=(t,s)=>`<h1>${t}</h1><p class="ad-sub">${s}</p>`;
const clsSel=(id,v)=>`<select id="${id}"><option value="">Semua kelas</option>${CLASSES.map(c=>`<option ${c===v?'selected':''}>${c}</option>`).join('')}</select>`;

/* ---------- views ---------- */
function vDash(){
  const st=students(),tc=allTeachers().filter(t=>!t.disabled),rl=roomList(),act=rl.filter(r=>r.status==='waiting'||r.status==='playing'),fin=rl.filter(r=>r.status==='finished'),sc=scoreTable();
  const avg=sc.length?Math.round(sc.reduce((a,b)=>a+b.total,0)/sc.length):0,wk=st.filter(s=>Date.now()-new Date(s.createdAt||0)<6048e5).length;
  const rows=CLASSES.map(c=>{const g=classGames(c);return `<tr><td><b>${c}</b></td><td>${st.filter(s=>s.className===c).length}</td><td>${tc.filter(t=>t.className===c).length}</td><td>${act.filter(r=>r.className===c).length}</td><td>${GAMES.map(([k,l])=>`<span title="${l}" style="opacity:${g[k]?1:.25}">${l.split(' ')[0]}</span>`).join(' ')}</td></tr>`});
  const rs=[...st].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5),lg=jget(K.log,[]).slice(0,6);
  return head('Beranda','Gambaran seluruh aplikasi UpPlay secara langsung.')+`<div class="ad-stats">${stat('👨‍🎓 SISWA',st.length)}${stat('👩‍🏫 GURU AKTIF',tc.length)}${stat('🏫 KELAS',CLASSES.length)}${stat('🎯 ROOM AKTIF',act.length)}${stat('✅ ROOM SELESAI',fin.length)}</div>${cfg().maintenance?'<div class="security-banner">🛠️ Mode pemeliharaan <b>AKTIF</b>: siswa dan guru tidak bisa masuk.</div>':''}${window.__upChartCard?window.__upChartCard():'<div class="ad-card"><h2>Per kelas</h2>'+tbl(['Kelas','Siswa','Guru','Room aktif','Game aktif'],rows)+'</div>'}<div class="ad-2"><div class="ad-card"><h2>Pendaftar terbaru</h2>${rs.length?rs.map(s=>`<div style="padding:7px 0;border-bottom:1px solid #efe9e1"><b>${esc(s.name)}</b> <span class="ad-bd">${esc(s.className)}</span></div>`).join(''):'<div class="ad-empty">Belum ada siswa.</div>'}</div><div class="ad-card"><h2>Aktivitas admin</h2><div class="ad-log">${lg.length?lg.map(l=>`<div><small>${fd(l.ts)}</small>${esc(l.msg)}</div>`).join(''):'<div class="ad-empty">Belum ada aktivitas.</div>'}</div></div></div>`;
}
function stuRows(){
  const q=F.q.toLowerCase(),j=jget(K.jab,{});
  const l=students().filter(s=>(!F.cls||s.className===F.cls)&&(!q||(s.name+s.email).toLowerCase().includes(q))).slice(0,300);
  return tbl(['No','Nama','Kelas','Email','Password','No. Absen','Jabatan','Skor room','Status','Aksi'],l.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td><span class="ad-bd">${esc(s.className)}</span></td><td>${esc(s.email)}</td><td class="ad-pwc"><code>${showPw[s.id]?esc(s.password||'-'):'••••••••'}</code> <button class="ad-b ad-eye" data-act="t-show" data-id="${s.id}" aria-label="${showPw[s.id]?'Sembunyikan':'Tampilkan'} password">👁</button></td><td>${esc(s.absen||'-')}</td><td>${esc(j[s.id]||'-')}</td><td><b>${totalOf(s.id)}</b></td><td><span class="ad-bd ${s.disabled?'r':'g'}">${s.disabled?'Nonaktif':'Aktif'}</span></td><td><button class="ad-b" data-act="s-edit" data-id="${s.id}">Edit</button><button class="ad-b" data-act="s-pw" data-id="${s.id}">Reset PW</button><button class="ad-b" data-act="s-tg" data-id="${s.id}">${s.disabled?'Aktifkan':'Nonaktifkan'}</button><button class="ad-b red" data-act="s-del" data-id="${s.id}">Hapus</button></td></tr>`),'Tidak ada siswa yang cocok.');
}
const vStudents=()=>head('Data Siswa','Kelola akun siswa yang mendaftar dari halaman utama.')+`<div class="ad-tb"><div class="ad-search"><input id="adQ" type="search" placeholder="Cari nama / email" value="${esc(F.q)}"><button type="button" class="ad-b pri" data-act="q-go">Cari</button></div>${clsSel('adCls',F.cls)}<button class="ad-b pri" data-act="s-add">+ Tambah Siswa</button><button class="ad-b" data-act="s-csv">⬇ Ekspor CSV</button></div><div id="adList">${stuRows()}</div>`;
function tchRows(){
  const q=F.q.toLowerCase(),rl=roomList();
  const l=allTeachers().filter(t=>(!F.cls||t.className===F.cls)&&(!q||t.name.toLowerCase().includes(q)));
  return tbl(['Nama','Kelas','Password','Room dibuat','Status','Aksi'],l.map(t=>`<tr><td>${esc(t.name)}</td><td><span class="ad-bd">${esc(t.className)}</span></td><td><code>${showPw[t.id]?esc(t.password):'••••••••'}</code> <button class="ad-b" data-act="t-show" data-id="${t.id}">👁</button></td><td>${rl.filter(r=>r.teacherId===t.id).length}</td><td><span class="ad-bd ${t.disabled?'r':'g'}">${t.disabled?'Nonaktif':'Aktif'}</span></td><td><button class="ad-b" data-act="t-edit" data-id="${t.id}">Edit</button><button class="ad-b" data-act="t-tg" data-id="${t.id}">${t.disabled?'Aktifkan':'Nonaktifkan'}</button>${t.base?'':`<button class="ad-b red" data-act="t-del" data-id="${t.id}">Hapus</button>`}</td></tr>`),'Tidak ada guru.');
}
const vTeachers=()=>head('Data Guru','Atur akun guru dan kelas yang ditugaskan. Perubahan langsung berlaku di login guru.')+`<div class="ad-tb"><div class="ad-search"><input id="adQ" type="search" placeholder="Cari nama guru" value="${esc(F.q)}"><button type="button" class="ad-b pri" data-act="q-go">Cari</button></div>${clsSel('adCls',F.cls)}<button class="ad-b pri" data-act="t-add">+ Tambah Guru</button></div><div id="adList">${tchRows()}</div>`;
function vClasses(){
  const st=students(),tc=allTeachers().filter(t=>!t.disabled);
  const __base=head('Kontrol Kelas & Game','Centang untuk mengaktifkan game di kelas tersebut. Game yang dimatikan langsung hilang dari dashboard siswa kelas itu dan tidak dimainkan di Join Room.')+`<div class="ad-cls">${CLASSES.map(c=>{const g=classGames(c);return `<div class="ad-card"><h2>Kelas ${c}</h2><p style="margin:0;color:#84817d;font-weight:700">${st.filter(s=>s.className===c).length} siswa • ${tc.filter(t=>t.className===c).length} guru</p>${GAMES.map(([k,l])=>`<label><input type="checkbox" data-cls="${c}" data-game="${k}" ${g[k]?'checked':''}> ${l}</label>`).join('')}</div>`}).join('')}</div>`;
  return window.__upAdminClasses?window.__upAdminClasses(__base):__base;
}
const stB=s=>`<span class="ad-bd ${s==='waiting'?'o':s==='playing'?'g':s==='finished'?'':'r'}">${{waiting:'Menunggu',playing:'Bermain',finished:'Selesai',closed:'Ditutup'}[s]||s}</span>`;
function vRooms(){
  const l=roomList();
  return head('Monitor Room','Pantau semua Room Game dari seluruh guru. Halaman ini diperbarui otomatis.')+`<div class="ad-tb"><button class="ad-b" data-act="r-clean">🧹 Hapus room ditutup</button></div>`+tbl(['Kode','Kelas','Guru','Status','Pemain','Ronde','Dibuat','Aksi'],l.map(r=>`<tr><td><b>${esc(r.code)}</b></td><td><span class="ad-bd">${esc(r.className)}</span></td><td>${esc(r.teacherName||'-')}</td><td>${stB(r.status)}</td><td>${(r.players||[]).length}</td><td>${(r.sequence||[]).length}</td><td>${fd(r.createdAt)}</td><td><button class="ad-b" data-act="r-view" data-id="${r.code}">Detail</button>${r.status==='waiting'||r.status==='playing'?`<button class="ad-b" data-act="r-end" data-id="${r.code}">Akhiri</button><button class="ad-b red" data-act="r-close" data-id="${r.code}">Tutup</button>`:''}<button class="ad-b red" data-act="r-del" data-id="${r.code}">Hapus</button></td></tr>`),'Belum ada room.');
}
function vScores(){
  const sv=F.sv||'rank',cls=F.cls;
  const l=scoreTable(cls),pv=jget(K.grp,[]).filter(x=>!cls||x.className===cls).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0));
  const fin=roomList().filter(r=>r.status==='finished'&&(!cls||r.className===cls)).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0));
  const svSel=`<select id="adScV" aria-label="Jenis rekap"><option value="rank" ${sv==='rank'?'selected':''}>Ranking individu (Join Room)</option><option value="rooms" ${sv==='rooms'?'selected':''}>Riwayat Join Room</option><option value="pvp" ${sv==='pvp'?'selected':''}>Riwayat PVP Tarik Tambang</option></select>`;
  let body='';
  if(sv==='rank'){
    body=`<div class="ad-card"><h2>Ranking individu${cls?' • Kelas '+cls:' • Semua kelas'}</h2><p class="ad-sub">Akumulasi skor setiap siswa dari semua Join Room yang sudah selesai.</p>${tbl(['Peringkat','Nama','Kelas','Jumlah room','Total skor'],l.slice(0,100).map((s,i)=>`<tr><td><b>${i+1}</b></td><td>${esc(s.name)}</td><td><span class="ad-bd">${esc(s.className)}</span></td><td>${s.rooms}</td><td><span class="ad-bd g">${s.total}</span></td></tr>`),'Belum ada room selesai.')}</div>`;
  }else if(sv==='rooms'){
    const cur=fin.find(r=>r.code===F.rc)||fin[0];
    body=`<div class="ad-card"><h2>Riwayat Join Room${cls?' • Kelas '+cls:''}</h2><p class="ad-sub">Pilih room untuk melihat podium dan tabel hasil lengkapnya.</p>${fin.length?`<div class="ad-tb"><select id="adScRoom" aria-label="Pilih room">${fin.map(r=>`<option value="${esc(r.code)}" ${cur&&r.code===cur.code?'selected':''}>Room ${esc(r.code)} • Kelas ${esc(r.className)} • ${fd(r.finishedAt||r.createdAt)} • ${(r.players||[]).length} siswa</option>`).join('')}</select></div>${window.__cpRoomFinalHtml?window.__cpRoomFinalHtml(cur):''}`:'<div class="ad-empty">Belum ada Join Room yang selesai.</div>'}</div>`;
  }else{
    const cur=pv.find(x=>x.id===F.pc)||pv[0];
    const team=(r,side)=>{const m=r[side+'Members']||(r[side]||[]).map(n=>({name:n}));const sc=side==='red'?r.redScore:r.blueScore;const win=r.winner===(side==='red'?'Tim Merah':'Tim Biru');
      return `<div class="ad-team ${side}"><h3>${side==='red'?'Tim Merah':'Tim Biru'}${win?' • Menang':''}</h3>${tbl(['Nama','Jawab benar','Jawab salah'],m.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.correct??'-'}</td><td>${x.wrong??'-'}</td></tr>`).concat([`<tr class="ad-sum"><td><b>Skor tim</b></td><td colspan="2"><b>${sc??0}</b></td></tr>`]))}</div>`};
    body=`<div class="ad-card"><h2>Riwayat PVP Tarik Tambang${cls?' • Kelas '+cls:''}</h2><p class="ad-sub">Nilai kelompok, terpisah dari nilai individu. Riwayat disimpan 24 jam.</p>${pv.length?`<div class="ad-tb"><select id="adScPvp" aria-label="Pilih pertandingan">${pv.map(x=>`<option value="${esc(x.id)}" ${cur&&x.id===cur.id?'selected':''}>${fd(x.finishedAt)} • Kelas ${esc(x.className)} • ${esc(x.winner||'-')} menang</option>`).join('')}</select></div><div class="ad-2">${team(cur,'red')}${team(cur,'blue')}</div>`:'<div class="ad-empty">Belum ada pertandingan PVP.</div>'}</div>`;
  }
  return head('Rekap Nilai','Kontrol nilai seluruh kelas: ranking individu, riwayat Join Room, dan riwayat PVP. Pilih kelas dan jenis rekap.')+`<div class="ad-tb">${clsSel('adCls',cls)}${svSel}<button class="ad-b red" data-act="sc-room">Reset nilai room${cls?' '+cls:' (semua)'}</button><button class="ad-b red" data-act="sc-pvp">Reset nilai PVP${cls?' '+cls:' (semua)'}</button></div><div class="ad-stats">${stat('PEMAIN BERNILAI',l.length)}${stat('JOIN ROOM SELESAI',fin.length)}${stat('PERTANDINGAN PVP',pv.length)}</div>${body}`;
}
/* ================= Kirim pesan ke pengguna =================
   BACKEND: POST /api/messages {to:'all'|'student'|'teacher', cls, kind:'info'|'maint', title, text}
   Saat ini disimpan di localStorage 'upplayMessagesV1' dan otomatis kedaluwarsa 24 jam. */
function msgCard(){
  return `<div class="ad-card ad-msg"><h2>📨 Kirim pesan ke pengguna</h2><p class="ad-sub">Kirim pengumuman ke siswa dan guru, misalnya pemberitahuan pemeliharaan beberapa jam lagi. Pesan muncul sebagai notifikasi dan tersimpan di riwayat notifikasi selama 24 jam.</p>
   <div class="ad-msg-grid">
    <label class="ad-fl">Penerima<select id="adMsgTo"><option value="all">Semua siswa &amp; guru</option><option value="student">Siswa saja</option><option value="teacher">Guru saja</option></select></label>
    <label class="ad-fl">Kelas<select id="adMsgCls"><option value="">Semua kelas</option>${CLASSES.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label>
    <label class="ad-fl">Jenis<select id="adMsgKind"><option value="info">Informasi</option><option value="maint">Jadwal pemeliharaan</option></select></label>
    <label class="ad-fl ad-msg-wide">Judul<input id="adMsgTitle" maxlength="80" placeholder="Contoh: Pemeliharaan sistem pukul 19.00"></label>
    <label class="ad-fl ad-msg-wide">Isi pesan<textarea id="adMsgText" rows="3" maxlength="400" placeholder="Tulis pesan untuk pengguna…"></textarea></label>
   </div>
   <div class="ad-accb"><button type="button" class="ad-b" data-act="msg-cancel">Batal</button><button type="button" class="ad-b pri" data-act="msg-send">Kirim pesan</button></div></div>`;
}
function acctCards(){
  /* Admin (operator sekolah) tidak memiliki mode pemeliharaan & pengelolaan akun. Hanya Master (pusat). */
  if(lvl()!=='master')return '';
  const m=cfg().maintenance;
  const eye=(id,ph,ac)=>`<label class="ad-fl">${ph}<input id="${id}" type="password" autocomplete="${ac||'new-password'}" placeholder="${ph}"></label>`;
  return `<div class="ad-card"><h2>🛠️ Mode pemeliharaan</h2><p class="ad-sub">Saat aktif, siswa dan guru tidak bisa masuk. Master dan Admin tetap bisa masuk untuk menguji game.</p><div class="ad-sw"><span class="ad-bd ${m?'r':'g'}">${m?'AKTIF':'Nonaktif'}</span><button class="ad-b pri" data-act="maint">${m?'Nonaktifkan':'Aktifkan'}</button></div></div>
  ${msgCard()}
  <div class="ad-2 ad-acc">
   <div class="ad-card"><h2>🔑 Akun Master</h2><p class="ad-sub">Akun pusat. Ganti username, password, atau keduanya.</p>
    <div class="ad-form ad-accf">
     <label class="ad-fl">Username Master saat ini<input id="adMCur" value="${esc(acc('master').user)}" readonly></label>
     ${eye('adOld','Password saat ini','current-password')}
     <label class="ad-fl">Username baru<input id="adNU" placeholder="Kosongkan jika tetap" autocomplete="off"></label>
     ${eye('adNP','Password baru (min. 8 karakter, kosongkan jika tetap)')}
     <div class="ad-accb"><button type="button" class="ad-b" data-act="acc-cancel" data-id="m">Batal</button><button type="button" class="ad-b pri" data-act="chpw">Simpan</button></div>
    </div></div>
   <div class="ad-card"><h2>👤 Akun Admin</h2><p class="ad-sub">Akun operator sekolah. Hanya Master yang bisa mengubahnya.</p>
    <div class="ad-form ad-accf">
     <label class="ad-fl">Username Admin saat ini<input id="adACur" value="${esc(acc('admin').user)}" readonly></label>
     ${eye('adAO','Password Admin saat ini','off')}
     <label class="ad-fl">Username baru<input id="adAU" placeholder="Kosongkan jika tetap" autocomplete="off"></label>
     ${eye('adAP','Password baru (min. 8 karakter, kosongkan jika tetap)')}
     <div class="ad-accb"><button type="button" class="ad-b" data-act="acc-cancel" data-id="a">Batal</button><button type="button" class="ad-b pri" data-act="chadm">Simpan</button></div>
    </div></div>
  </div>`;
}
const GLV={
 math:[['Ular Tangga Pintar','Jawab soal agar dadu terbuka, lalu naik tangga sampai kotak 25.'],['Memory Card Angka','Cocokkan pasangan kartu operasi hitung dengan hasilnya.'],['TTS Hitung-Hitungan','Isi kotak teka-teki silang dengan hasil hitungan.'],['Labirin Angka','Telusuri labirin dan jawab soal perkalian atau pembagian.'],['Misteri Brankas Angka','Boss level: pecahkan soal logika matematika dan buka brankas 4 digit.']],
 logic:[['Tebak Pola','Lanjutkan pola angka, kelipatan, warna, bentuk, dan emoji.'],['Memory Match','Cocokkan pasangan kartu gambar dengan mengingat letaknya.'],['Balok Logika','Susun kepingan balok menjadi bentuk yang diminta.'],['Benar atau Salah','Tentukan pernyataan matematika dan logika benar atau salah.'],['Detektif Logika','Boss level: pecahkan 10 kasus detektif dari petunjuk.']],
 picture:[['Tebak Kata','Gabungkan petunjuk gambar, lalu susun huruf menjadi kata.'],['Tebak Tempat','Amati petunjuk gambar, lalu pilih foto lokasi yang cocok.'],['Tebak Ungkapan','Pasangkan petunjuk emoji dengan ungkapan atau peribahasa.'],['Tebak Benda','Kenali benda yang buram, lalu pilih gambar benda yang sama.'],['Tebak Peribahasa','Baca cerita gambar, lalu pilih peribahasa yang sesuai.']]
};
function vGames(){
  const G=[['math','🔢','Perhitungan','Ular Tangga, Memory Card, TTS, Labirin, dan Brankas.'],['logic','🧠','Logika Sederhana','Pola, ingatan, balok, benar/salah, dan detektif.'],['picture','🖼️','Tebak-Tebakan','Kata, tempat, ungkapan, benda, dan peribahasa.']];
  return head('Uji Permainan','Mainkan langsung ketiga game siswa untuk uji coba, misalnya setelah pemeliharaan. Semua level terbuka untuk akun '+(lvl()==='master'?'Master':'Admin')+' dan progres uji coba tidak tercampur dengan nilai siswa.')+
  `<div class="ad-play">${G.map(([k,ic,t,d])=>`<button type="button" class="subject-card ${k} ad-playcard" data-act="play" data-id="${k}"><div class="subject-card-content"><div class="subject-icon">${ic}</div><span class="card-game-tag">UJI COBA</span><h2>${t}</h2><p>${d}</p><span class="play-label">Mainkan →</span></div></button>`).join('')}</div>
  <div class="ad-games">${G.map(([k,ic,t,d])=>`<div class="ad-card ad-gm ${k}"><div class="ad-gm-h"><h2>${ic} ${t}</h2><span class="ad-bd">5 Level</span></div><ol class="ad-lv">${GLV[k].map((x,i)=>`<li><i>${i+1}</i><div><b>${x[0]}</b><small>${x[1]}</small></div></li>`).join('')}</ol></div>`).join('')}</div>`;
}
function vSettings(){
  const lg=jget(K.log,[]);
  return head('Pengaturan & Pemeliharaan','Kunci akses, cadangan data, dan reset.')+`${lvl()==='master'?acctCards():msgCard()}<div class="ad-card"><h2>💾 Cadangan data</h2><p class="ad-sub">Ekspor semua data aplikasi (siswa, room, nilai, pengaturan kelas) atau pulihkan dari file cadangan.</p><button class="ad-b pri" data-act="export">⬇ Ekspor JSON</button><button class="ad-b" data-act="import">⬆ Impor JSON</button><input type="file" id="adFile" accept=".json" style="display:none"></div><div class="ad-card"><h2>⚠️ Zona berbahaya</h2><button class="ad-b red" data-act="rst-rooms">Hapus semua room & notifikasi</button><button class="ad-b red" data-act="rst-prog">Hapus progres & skor game siswa</button>${lvl()==='master'?'<button class="ad-b red pri" data-act="rst-all">Reset total aplikasi</button>':''}</div><div class="ad-card"><h2>📜 Log aktivitas admin</h2><div class="ad-log">${lg.length?lg.map(l=>`<div><small>${fd(l.ts)}</small>${esc(l.msg)}</div>`).join(''):'<div class="ad-empty">Belum ada aktivitas.</div>'}</div></div>`;
}
const V={dash:vDash,students:vStudents,teachers:vTeachers,classes:vClasses,rooms:vRooms,scores:vScores,games:vGames,settings:vSettings};
function render(){const m=$('adMain');if(!m)return;$('adMenu').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));const h=V[view]();m.innerHTML=h;m.dataset.h=h}

/* ---------- aksi ---------- */
const dl=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const nameTaken=(n,id)=>students().some(s=>s.id!==id&&s.name.toLowerCase()===n.toLowerCase());
const A={
 's-add'(){modal('Tambah Siswa',[{k:'name',l:'Nama'},{k:'email',l:'Email',t:'email'},{k:'className',l:'Kelas',t:'select',o:CLASSES},{k:'password',l:'Password (min. 6)',t:'password'}],v=>{if(!v.name||!v.email)return 'Nama dan email wajib diisi.';if(v.password.length<6)return 'Password minimal 6 karakter.';const l=students();if(nameTaken(v.name))return 'Nama sudah digunakan.';if(l.some(s=>s.email.toLowerCase()===v.email.toLowerCase()))return 'Email sudah terdaftar.';l.push({id:'student-'+Date.now(),name:v.name,email:v.email,className:v.className,password:v.password,absen:'',photo:'',createdAt:new Date().toISOString()});jset(K.stu,l);log('Tambah siswa '+v.name)})},
 's-edit'(id){const l=students(),s=l.find(x=>x.id===id);if(!s)return;modal('Edit Siswa',[{k:'name',l:'Nama',v:s.name},{k:'email',l:'Email',v:s.email},{k:'className',l:'Kelas',t:'select',o:CLASSES,v:s.className},{k:'absen',l:'No. Absen',v:s.absen},{k:'jabatan',l:'Jabatan',v:jget(K.jab,{})[id]}],v=>{if(!v.name)return 'Nama wajib diisi.';if(nameTaken(v.name,id))return 'Nama sudah digunakan.';Object.assign(s,{name:v.name,email:v.email,className:v.className,absen:v.absen});jset(K.stu,l);const j=jget(K.jab,{});if(v.jabatan)j[id]=v.jabatan;else delete j[id];jset(K.jab,j);log('Edit siswa '+v.name)})},
 's-pw'(id){const l=students(),s=l.find(x=>x.id===id);if(!s)return;modal('Reset Password: '+s.name,[{k:'password',l:'Password baru (min. 6)',t:'text'}],v=>{if(v.password.length<6)return 'Password minimal 6 karakter.';s.password=v.password;jset(K.stu,l);log('Reset password siswa '+s.name)})},
 's-tg'(id){const l=students(),s=l.find(x=>x.id===id);if(!s)return;s.disabled=!s.disabled;jset(K.stu,l);log((s.disabled?'Nonaktifkan':'Aktifkan')+' siswa '+s.name);render()},
 's-del'(id){const l=students(),s=l.find(x=>x.id===id);if(!s||!confirm('Hapus siswa "'+s.name+'" beserta progres dan skornya? Tindakan ini tidak bisa dibatalkan.'))return;jset(K.stu,l.filter(x=>x.id!==id));delStudentData(id);log('Hapus siswa '+s.name);render()},
 's-csv'(){const j=jget(K.jab,{}),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';dl('data-siswa.csv',['Nama,Email,Kelas,No. Absen,Jabatan,Skor room'].concat(students().map(s=>[s.name,s.email,s.className,s.absen,j[s.id],totalOf(s.id)].map(q).join(','))).join('\n'),'text/csv');log('Ekspor CSV siswa')},
 't-show'(id){showPw[id]=!showPw[id];$('adList').innerHTML=(view==='students'?stuRows:tchRows)()},
 't-add'(){modal('Tambah Guru',[{k:'name',l:'Nama guru'},{k:'className',l:'Kelas',t:'select',o:CLASSES},{k:'password',l:'Password (min. 6)',t:'text'}],v=>{if(!v.name)return 'Nama wajib diisi.';if(v.password.length<6)return 'Password minimal 6 karakter.';if(allTeachers().some(t=>t.name.toLowerCase()===v.name.toLowerCase()))return 'Nama guru sudah ada.';const st=tst();st.added.push({id:'teacher-custom-'+Date.now(),name:v.name,className:v.className,password:v.password});jset(K.tch,st);applyTeachers();log('Tambah guru '+v.name)})},
 't-edit'(id){const t=allTeachers().find(x=>x.id===id);if(!t)return;const f=[{k:'name',l:'Nama guru',v:t.name},{k:'password',l:'Password',v:t.password}];if(!t.base)f.push({k:'className',l:'Kelas',t:'select',o:CLASSES,v:t.className});modal('Edit Guru',f,v=>{if(!v.name)return 'Nama wajib diisi.';if(v.password.length<6)return 'Password minimal 6 karakter.';if(allTeachers().some(x=>x.id!==id&&x.name.toLowerCase()===v.name.toLowerCase()))return 'Nama guru sudah ada.';const st=tst();st.edits[id]=Object.assign(st.edits[id]||{},{name:v.name,password:v.password});if(!t.base)st.edits[id].className=v.className;jset(K.tch,st);applyTeachers();log('Edit guru '+v.name)})},
 't-tg'(id){const t=allTeachers().find(x=>x.id===id);if(!t)return;const st=tst();st.edits[id]=Object.assign(st.edits[id]||{},{disabled:!t.disabled});jset(K.tch,st);applyTeachers();log((t.disabled?'Aktifkan':'Nonaktifkan')+' guru '+t.name);render()},
 't-del'(id){const t=allTeachers().find(x=>x.id===id);if(!t||!confirm('Hapus guru "'+t.name+'"?'))return;const st=tst();st.added=st.added.filter(x=>x.id!==id);delete st.edits[id];jset(K.tch,st);applyTeachers();log('Hapus guru '+t.name);render()},
 'r-view'(c){const r=rooms()[c];if(!r)return;const p=[...(r.players||[])].sort((a,b)=>(b.score||0)-(a.score||0));info('Room '+c+' • Kelas '+r.className,`<p>${stB(r.status)} • ${(r.sequence||[]).length} ronde • Guru: ${esc(r.teacherName||'-')}</p>`+(p.length?tbl(['#','Siswa','Ronde','Skor'],p.map((x,i)=>`<tr><td>${i+1}</td><td>${x.avatar||'👤'} ${esc(x.name)}</td><td>${x.finished?'Selesai':(x.roundIndex||0)+'/'+(r.sequence||[]).length}</td><td><b>${x.score||0}</b></td></tr>`)):'<div class="ad-empty">Belum ada pemain.</div>'))},
 'r-end'(c){const rs=rooms();if(!rs[c]||!confirm('Akhiri room '+c+' sekarang? Skor yang sudah masuk tetap disimpan.'))return;rs[c].status='finished';rs[c].finishedAt=Date.now();(rs[c].players||[]).forEach(p=>p.finished=true);jset(K.room,rs);log('Akhiri room '+c);render()},
 'r-close'(c){const rs=rooms();if(!rs[c]||!confirm('Tutup room '+c+'? Nilainya tidak akan dihitung.'))return;rs[c].status='closed';jset(K.room,rs);log('Tutup room '+c);render()},
 'r-del'(c){const rs=rooms();if(!rs[c]||!confirm('Hapus room '+c+' dari riwayat? Nilainya ikut hilang.'))return;delete rs[c];jset(K.room,rs);log('Hapus room '+c);render()},
 'r-clean'(){const rs=rooms(),n=Object.keys(rs).filter(c=>rs[c].status==='closed');if(!n.length)return toast('Tidak ada room ditutup.');if(!confirm('Hapus '+n.length+' room yang ditutup?'))return;n.forEach(c=>delete rs[c]);jset(K.room,rs);log('Bersihkan '+n.length+' room ditutup');render()},
 'sc-room'(){const rs=rooms(),n=Object.keys(rs).filter(c=>rs[c].status==='finished'&&(!F.cls||rs[c].className===F.cls));if(!n.length)return toast('Tidak ada nilai room.');if(!confirm('Reset nilai '+n.length+' room selesai'+(F.cls?' kelas '+F.cls:'')+'?'))return;n.forEach(c=>delete rs[c]);jset(K.room,rs);log('Reset nilai room '+(F.cls||'semua kelas'));render()},
 'sc-pvp'(){if(!confirm('Reset nilai PVP'+(F.cls?' kelas '+F.cls:' semua kelas')+'?'))return;[K.grp,K.pvp].forEach(k=>jset(k,F.cls?jget(k,[]).filter(x=>x.className!==F.cls):[]));log('Reset nilai PVP '+(F.cls||'semua kelas'));render()},
 'maint'(){if(lvl()!=='master')return toast(MASTER_ONLY);const c=cfg();c.maintenance=!c.maintenance;jset(K.cfg,c);log('Mode pemeliharaan '+(c.maintenance?'diaktifkan':'dimatikan'));render()},
 'chpw'(){if(lvl()!=='master')return toast(MASTER_ONLY);const cur=acc('master'),o=$('adOld').value,nu=($('adNU').value.trim()||cur.user).toLowerCase(),np=$('adNP').value;
   if(!o)return toast('Isi password Master saat ini.');if(H(cur.user+'|'+o)!==cur.hash)return toast('Password Master saat ini salah.');
   if(np&&np.length<8)return toast('Password baru minimal 8 karakter.');if(!/^[a-z0-9._-]{3,30}$/.test(nu))return toast('Username 3–30 karakter: huruf kecil, angka, titik, garis bawah.');
   if(nu===acc('admin').user)return toast('Username itu sudah dipakai akun Admin.');if(nu===cur.user&&!np)return toast('Tidak ada perubahan untuk disimpan.');
   const c=cfg();c.acc=c.acc||{};c.acc.master={user:nu,hash:H(nu+'|'+(np||o))};jset(K.cfg,c);log('Master mengganti akun Master');toast('Akun Master tersimpan.');render()},
 'chadm'(){if(lvl()!=='master')return toast(MASTER_ONLY);const cur=acc('admin'),o=$('adAO').value,nu=($('adAU').value.trim()||cur.user).toLowerCase(),np=$('adAP').value;
   if(!o)return toast('Isi password Admin saat ini.');if(H(cur.user+'|'+o)!==cur.hash)return toast('Password Admin saat ini salah.');
   if(np&&np.length<8)return toast('Password baru minimal 8 karakter.');if(!/^[a-z0-9._-]{3,30}$/.test(nu))return toast('Username 3–30 karakter: huruf kecil, angka, titik, garis bawah.');
   if(nu===acc('master').user)return toast('Username itu sudah dipakai akun Master.');if(nu===cur.user&&!np)return toast('Tidak ada perubahan untuk disimpan.');
   const c=cfg();c.acc=c.acc||{};c.acc.admin={user:nu,hash:H(nu+'|'+(np||o))};jset(K.cfg,c);log('Master mengganti akun Admin');toast('Akun Admin tersimpan.');render()},
 'acc-cancel'(w){(w==='m'?['adOld','adNU','adNP']:['adAO','adAU','adAP']).forEach(id=>{const e=$(id);if(e){e.value='';if(e.dataset.upxPw)e.type='password'}});toast('Perubahan dibatalkan.')},
 'msg-send'(){const t=($('adMsgTitle').value||'').trim(),x=($('adMsgText').value||'').trim();if(!t||!x)return toast('Isi judul dan isi pesan terlebih dahulu.');
   const L=JSON.parse(localStorage.getItem('upplayMessagesV1')||'[]').filter(m=>Date.now()-m.at<864e5);
   L.push({id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),from:lvl()==='master'?'Master':'Admin',to:$('adMsgTo').value,cls:$('adMsgCls').value,kind:$('adMsgKind').value,title:t,text:x});
   localStorage.setItem('upplayMessagesV1',JSON.stringify(L));window.dispatchEvent(new StorageEvent('storage',{key:'upplayMessagesV1'}));
   log('Mengirim pesan: '+t);$('adMsgTitle').value='';$('adMsgText').value='';toast('Pesan terkirim ke '+({all:'semua siswa & guru',student:'siswa',teacher:'guru'})[$('adMsgTo').value]+($('adMsgCls').value?' kelas '+$('adMsgCls').value:'')+'.')},
 'msg-cancel'(){['adMsgTitle','adMsgText'].forEach(id=>{const e=$(id);if(e)e.value=''});toast('Pesan dibatalkan.')},
 'q-go'(){const q=$('adQ');F.q=q?q.value.trim():'';const l=$('adList');if(l)l.innerHTML=(view==='students'?stuRows:tchRows)();toast(F.q?'Hasil pencarian: "'+F.q+'"':'Menampilkan semua data.')},
 'play'(g){if(typeof window.__upzTest==='function')window.__upzTest(g)},
 'export'(){const o={};Object.keys(localStorage).filter(k=>k.startsWith('cerdasPlay')&&k!==K.cfg).forEach(k=>o[k]=localStorage.getItem(k));dl('cadangan-cerdasplay-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(o),'application/json');log('Ekspor cadangan data')},
 'import'(){$('adFile').click()},
 'rst-rooms'(){if(!confirm('Hapus semua room dan notifikasi kode room?'))return;localStorage.removeItem(K.room);localStorage.removeItem(K.notif);log('Hapus semua room & notifikasi');render()},
 'rst-prog'(){if(!confirm('Hapus progres & skor game semua siswa (akun tetap ada)?'))return;rmKeys(k=>/^cerdasPlay:student|^cerdasPlaystudent|^cerdasPlayLogicLevel|^cerdasPlayPictureLevel/.test(k));log('Hapus progres & skor siswa');render()},
 'rst-all'(){if(lvl()!=='master')return toast(MASTER_ONLY);modal('Reset total aplikasi',[{k:'w',l:'Ketik HAPUS untuk melanjutkan'}],v=>{if(v.w!=='HAPUS')return 'Ketik HAPUS dengan huruf besar.';rmKeys(k=>k.startsWith('cerdasPlay')&&k!==K.cfg&&k!==K.log);applyTeachers();log('Reset total aplikasi')},'Reset total',true)}
};
document.addEventListener('click',e=>{
  const p=$('adminPortalPage');if(!p||!p.contains(e.target))return;
  const m=e.target.closest('#adMenu button');if(m){FV[view]=F;view=m.dataset.v;F=FV[view]||{q:'',cls:''};render();return}
  const b=e.target.closest('[data-act]');if(b&&A[b.dataset.act])A[b.dataset.act](b.dataset.id);
});
document.addEventListener('change',e=>{
  const t=e.target;if(!$('adminPortalPage')?.contains(t))return;
  if(t.dataset&&t.dataset.game){const g=classGames(t.dataset.cls);g[t.dataset.game]=t.checked;jset('cerdasPlay:'+t.dataset.cls+':games',g);log((t.checked?'Aktifkan ':'Matikan ')+t.dataset.game+' kelas '+t.dataset.cls);toast('Pengaturan game kelas '+t.dataset.cls+' disimpan.')}
  else if(t.id==='adScV'){F.sv=t.value;render()}
  else if(t.id==='adScRoom'){F.rc=t.value;render()}
  else if(t.id==='adScPvp'){F.pc=t.value;render()}
  else if(t.id==='adCls'){F.cls=t.value;view==='scores'?render():$('adList').innerHTML=(view==='students'?stuRows:tchRows)()}
  else if(t.id==='adFile'&&t.files[0]){const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!confirm('Pulihkan '+Object.keys(o).length+' data? Data saat ini akan ditimpa.'))return;Object.entries(o).forEach(([k,v])=>{if(k.startsWith('cerdasPlay')&&k!==K.cfg)localStorage.setItem(k,v)});applyTeachers();log('Impor cadangan data');render();toast('Data dipulihkan.')}catch(x){toast('File cadangan tidak valid.')}};rd.readAsText(t.files[0])}
});
document.addEventListener('keydown',e=>{if(e.target.id==='adQ'&&e.key==='Enter'){e.preventDefault();A['q-go']()}});
document.addEventListener('input',e=>{if(e.target.id==='adQ'){F.q=e.target.value;$('adList').innerHTML=(view==='students'?stuRows:tchRows)()}});

/* ---------- login rahasia lewat form login yang sama ---------- */
document.addEventListener('submit',e=>{
  if(!e.target||e.target.id!=='loginForm')return;
  const n=$('loginName').value.trim(),p=$('loginPassword').value,err=$('loginError');
  const alv=adminAuth(n,p);
  if(alv){
    e.preventDefault();e.stopImmediatePropagation();
    setSession({role:'admin',id:alv,name:alv==='master'?'Master':'Admin',adminLevel:alv});closeModal();$('loginPassword').value='';$('loginName').value='';
    log((alv==='master'?'Master':'Admin')+' masuk');showPage('admin');return;
  }
  const bad=m=>{e.preventDefault();e.stopImmediatePropagation();err.classList.remove('success-message');err.textContent=m};
  if(cfg().maintenance)return bad('🛠️ Aplikasi sedang dalam pemeliharaan. Coba beberapa saat lagi.');
  const lo=n.toLowerCase();
  if(students().some(s=>s.disabled&&s.name.toLowerCase()===lo&&s.password===p))return bad('⚠️ Akun dinonaktifkan. Hubungi admin sekolah.');
  if(allTeachers().some(t=>t.disabled&&t.name.toLowerCase()===lo&&t.password===p))return bad('⚠️ Akun dinonaktifkan. Hubungi admin sekolah.');
},true);

/* ---------- pasang tampilan admin ---------- */
const sec=$('adminPortalPage'),mainEl=sec&&sec.querySelector('main');
if(mainEl){
  mainEl.outerHTML=`<div class="ad-wrap"><aside class="ad-side"><div class="ad-me"><small>Admin aktif</small><b>Administrator</b></div><nav class="ad-menu" id="adMenu"><button data-v="dash">📊 Beranda</button><button data-v="students">👨‍🎓 Data Siswa</button><button data-v="teachers">👩‍🏫 Data Guru</button><button data-v="classes">🏫 Kontrol Permainan</button><button data-v="rooms">🎯 Monitor Room</button><button data-v="scores">🏆 Rekap Nilai</button><button data-v="games">🎮 Uji Permainan</button><button data-v="settings">⚙️ Pengaturan</button></nav></aside><main class="ad-main" id="adMain"></main></div>`;
  const sp=window.showPage;
  window.showPage=function(n){const r=sp.apply(this,arguments);if(n==='admin'&&currentSession&&currentSession.role==='admin'){view='dash';render()}return r};
  setInterval(()=>{
    if(sec.classList.contains('hidden')||document.querySelector('.ad-ov')||!(view==='rooms'||view==='dash'))return;
    const m=$('adMain'),h=V[view]();if(m.dataset.h!==h){m.innerHTML=h;m.dataset.h=h}
  },2000);
  if(currentSession&&currentSession.role==='admin')render();
}
})();
