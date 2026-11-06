(function(){
'use strict';

const ROOM_KEY='cerdasPlayQuizRoomsV2';
/* 16 avatar karakter hewan, masing-masing hanya boleh dipakai satu siswa per room */
const AVATARS=['🦊','🐼','🐯','🐸','🐵','🐨','🐰','🐱','🦄','🐙','🦁','🐻','🐧','🐶','🦉','🐢'];
const GAMES=[
  {id:'math',name:'Perhitungan',icon:'🔢'},
  {id:'logic',name:'Logika Sederhana',icon:'🧠'},
  {id:'picture',name:'Tebak-Tebakan',icon:'🖼️'}
];

function sess(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}}
function rooms(){try{return JSON.parse(localStorage.getItem(ROOM_KEY)||'{}')}catch(e){return {}}}
function saveRooms(x){localStorage.setItem(ROOM_KEY,JSON.stringify(x));window.dispatchEvent(new StorageEvent('storage',{key:ROOM_KEY,newValue:JSON.stringify(x)}))}
function room(code){return code?rooms()[code]||null:null}
function codeFor(cls){const rs=rooms();let c;do{c=String(cls||'ROOM').toUpperCase()+String(Math.floor(100+Math.random()*900))}while(rs[c]);return c}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}

function getStudents(cls){
  try{
    const data=JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]');
    if(Array.isArray(data)) return data.filter(s=>s.className===cls);
  }catch(e){}
  try{
    const data=JSON.parse(localStorage.getItem('cerdasPlayUsers')||'[]');
    if(Array.isArray(data)) return data.filter(s=>s.role==='student'&&s.className===cls);
  }catch(e){}
  return [];
}

/* ---------- Jabatan kelas (hanya dikelola dari sisi guru) ---------- */
const JABATAN_KEY='cerdasPlayStudentJabatan';
function getAllJabatan(){ try{ return JSON.parse(localStorage.getItem(JABATAN_KEY)||'{}'); }catch(e){ return {}; } }
function getJabatan(studentId){ return getAllJabatan()[studentId] || '-'; }
function setJabatan(studentId,value){ const data=getAllJabatan(); data[studentId]=value; localStorage.setItem(JABATAN_KEY,JSON.stringify(data)); }

/* ---------- Grafik jumlah siswa seluruh kelas 5A–6D ---------- */
function buildClassStudentChart(){
  const classes=['5A','5B','5C','5D','6A','6B','6C','6D'];
  const counts=classes.map(c=>getStudents(c).length);
  const maxVal=Math.max(1,...counts);
  const top=Math.max(10,Math.ceil((maxVal+Math.ceil(maxVal*0.15)+1)/10)*10);
  const W=680,H=250,padL=34,padR=18,padT=22,padB=34;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const stepX=classes.length>1?plotW/(classes.length-1):0;
  const points=counts.map((v,i)=>({
    x:padL+i*stepX,
    y:padT+plotH-(v/top)*plotH,
    v
  }));
  const path=points.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
  const areaPath=`${path} L${points[points.length-1].x.toFixed(1)},${(padT+plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padT+plotH).toFixed(1)} Z`;
  const steps=5;
  let grid='';
  for(let i=0;i<=steps;i++){
    const val=Math.round(top/steps*i);
    const y=padT+plotH-(val/top)*plotH;
    grid+=`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W-padR}" y2="${y.toFixed(1)}" stroke="#efe9e1" stroke-width="1"/><text x="${padL-8}" y="${(y+3.5).toFixed(1)}" font-size="10" text-anchor="end" fill="#84817d" font-family="Nunito,Arial,sans-serif">${val}</text>`;
  }
  const xLabels=classes.map((c,i)=>`<text x="${points[i].x.toFixed(1)}" y="${H-10}" font-size="11.5" font-weight="800" text-anchor="middle" fill="#2a2a29" font-family="Nunito,Arial,sans-serif">${c}</text>`).join('');
  const dataLabels=points.map(p=>`<text x="${p.x.toFixed(1)}" y="${(p.y-10).toFixed(1)}" font-size="11" font-weight="800" text-anchor="middle" fill="#1e1f1f" font-family="Nunito,Arial,sans-serif">${p.v}</text>`).join('');
  const dots=points.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.2" fill="#fff" stroke="#1e1f1f" stroke-width="2.6"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="teacher-chart-svg" role="img" aria-label="Grafik jumlah siswa per kelas">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff" rx="16"/>
    ${grid}
    <line x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}" stroke="#d4ccc1" stroke-width="1.4"/>
    <path d="${areaPath}" fill="rgba(30,31,31,0.08)" stroke="none"/>
    <path d="${path}" fill="none" stroke="#1e1f1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${dataLabels}
    ${xLabels}
  </svg>`;
}

function buildQuestion(game,level){
  let pool=[];
  if(game==='logic' && typeof logicLevels!=='undefined') pool=logicLevels[level]||logicLevels[1]||[];
  if(game==='picture' && typeof pictureLevels!=='undefined') pool=pictureLevels[level]||pictureLevels[1]||[];
  if(game==='math'){
    const q=(level>=4 && typeof hardQuestions!=='undefined')?hardQuestions:(typeof normalQuestions!=='undefined'?normalQuestions:[]);
    pool=q;
  }
  const q=pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
  if(!q){
    return {kind:'text',text:'Berapakah 2 + 3?',options:['4','5','6','7'],answer:1,explanation:'2 + 3 = 5.'};
  }
  if(game==='logic' || game==='picture'){
    return {kind:'choice',text:q.text||q.clue||'',visual:q.visual||'',options:q.options||[],answer:Number(q.answer)||0,explanation:q.explanation||''};
  }
  return {kind:'number',text:q.text,options:null,answer:Number(q.answer),explanation:'Jawaban yang benar adalah '+q.answer+'.'};
}

function makeSequence(count){
  const arr=[];
  for(let i=0;i<count;i++){
    const __cls=(window.currentSession||{}).className,__on=GAMES.filter(x=>!window.__upGameOn||window.__upGameOn(__cls,x.id)),__G=__on.length?__on:GAMES;
    const g=__G[Math.floor(Math.random()*__G.length)];
    const level=1+Math.floor(Math.random()*5);
    arr.push({round:i+1,game:g.id,gameName:g.name,icon:g.icon,level});
  }
  return arr;
}

/* ---------- STUDENT ROOM ---------- */
let studentQStart=Date.now();
function cpPoints(ok){if(!ok)return 0;const sec=Math.min(60,Math.max(0,(Date.now()-studentQStart)/1000));return 100+Math.round(100*(1-sec/60))}
let studentRoomCode=null, studentAvatar='🦊', studentRoundIndex=0, studentAnswered=false, studentTimer=null;

function studentKey(){const s=sess();return s?`cerdasPlayStudentQuizRoom:${s.id}`:null}
function getStudentRoom(){const k=studentKey();return k?sessionStorage.getItem(k):studentRoomCode}
function setStudentRoom(c){studentRoomCode=c;const k=studentKey();if(k){if(c)sessionStorage.setItem(k,c);else sessionStorage.removeItem(k)}}

function ensureStudentModal(){
  if(document.getElementById('quizRoomModalV2'))return;
  const wrap=document.createElement('div');
  wrap.id='quizRoomModalV2';wrap.className='modal-overlay hidden';
  wrap.innerHTML=`
   <div class="modal room-vnext-modal">
    <div class="modal-top"><div><span class="section-kicker">🎮 ROOM QUIZ KELAS</span><h2>Join Room</h2><p>Masukkan kode room dari guru. Setelah masuk, pilih avatar dan tunggu guru menekan Mulai.</p></div>
    <button type="button" class="modal-close" id="quizRoomCloseV2">×</button></div>
    <form id="quizRoomJoinV2" class="room-vnext-lobby">
      <div class="field-group"><label>Kode Room</label><div class="cp-pastewrap"><input id="quizRoomCodeV2" maxlength="12" placeholder="Contoh: 5A321" required autocomplete="off"><button type="button" id="quizRoomPasteV2" class="cp-pastebtn" title="Tempel kode dari clipboard" aria-label="Tempel kode dari clipboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11v6"/><path d="m9 14 3 3 3-3"/></svg></button></div></div>
      <div id="quizRoomJoinErrorV2" class="login-error"></div>
      <button class="btn btn-success" type="submit">Masuk ke Room →</button>
    </form>
    <div id="quizRoomLobbyV2" class="hidden"></div>
   </div>`;
  document.body.appendChild(wrap);
  document.getElementById('quizRoomCloseV2').onclick=()=>wrap.classList.add('hidden');
  document.getElementById('quizRoomPasteV2').onclick=async()=>{const i=document.getElementById('quizRoomCodeV2'),er=document.getElementById('quizRoomJoinErrorV2');try{const t=String(await navigator.clipboard.readText()||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);if(!t)throw new Error('kosong');i.value=t;er.textContent='';i.focus()}catch(x){i.focus();er.textContent='ℹ️ Clipboard belum bisa dibaca otomatis. Tekan Ctrl+V pada kolom kode.'}};
  document.getElementById('quizRoomJoinV2').onsubmit=e=>{
    e.preventDefault();const input=document.getElementById('quizRoomCodeV2'),err=document.getElementById('quizRoomJoinErrorV2');
    try{joinStudentQuizRoom(input.value);input.value='';err.textContent='';renderStudentRoom();}catch(ex){err.textContent='⚠️ '+ex.message}
  };
}
function openStudentRoom(){ensureStudentModal();const m=document.getElementById('quizRoomModalV2');m.classList.remove('hidden');showJoinForm();{const rx=room(getStudentRoom());if(rx&&['waiting','playing','finished'].includes(rx.status))renderStudentRoom();}}
function showJoinForm(){
  document.getElementById('quizRoomJoinV2').classList.remove('hidden');
  document.getElementById('quizRoomLobbyV2').classList.add('hidden');
}
function joinStudentQuizRoom(raw){
  const s=sess();if(!s||s.role!=='student')throw new Error('Hanya akun siswa yang dapat masuk ke room.');
  const c=String(raw||'').trim().toUpperCase(),r=room(c);
  if(!c)throw new Error('Masukkan kode room.');
  if(!r)throw new Error('Kode room tidak ditemukan.');
  if(r.className!==s.className)throw new Error('Room ini khusus kelas '+r.className+'.');
  if(r.status!=='waiting')throw new Error('Room sudah dimulai. Minta guru membuat room baru.');
  r.players=r.players||[];
  const p=r.players.find(x=>x.id===s.id);
  if(!AVATARS.includes(studentAvatar))studentAvatar=AVATARS[0]; /* avatar boleh sama dengan teman (kembar) */
  if(!p)r.players.push({id:s.id,name:s.name,avatar:studentAvatar});
  else p.avatar=studentAvatar;
  saveRoom(r);setStudentRoom(c);
}
function saveRoom(r){const rs=rooms();rs[r.code]=r;saveRooms(rs)}
function renderStudentRoom(){
  const s=sess(),m=document.getElementById('quizRoomModalV2');if(!m||!s||s.role!=='student')return;
  const r=room(getStudentRoom());
  if(!r){showJoinForm();return}
  if(!['waiting','playing','finished'].includes(r.status)){try{sessionStorage.removeItem('cerdasPlayStudentQuizRoom:'+s.id)}catch(e){}showJoinForm();return}
  document.getElementById('quizRoomJoinV2').classList.add('hidden');
  const box=document.getElementById('quizRoomLobbyV2');box.classList.remove('hidden');
  if(r.status==='waiting'){
    const me=(r.players||[]).find(p=>p.id===s.id);
    studentAvatar=me?.avatar||studentAvatar;
    const used={};(r.players||[]).forEach(p=>{if(p.id!==s.id&&p.avatar)used[p.avatar]=p.name});
    const html=`
      <div class="room-vnext-lobby">
       <div class="room-vnext-status"><small>KODE ROOM</small><div class="room-vnext-code">${esc(r.code)}</div><strong>Menunggu guru memulai permainan…</strong><small>${(r.players||[]).length} siswa sudah bergabung.</small></div>
       <div><strong>Pilih Avatar</strong><div class="avatar-grid">${AVATARS.map(a=>`<button type="button" class="avatar-choice ${a===studentAvatar?'active':''}" data-avatar="${a}" aria-pressed="${a===studentAvatar}" title="${used[a]?'Juga dipakai '+esc(used[a]):'Pilih avatar ini'}">${a}${used[a]?'<i class="avatar-twin" aria-hidden="true"></i>':''}</button>`).join('')}</div><small class="avatar-note">Boleh memilih avatar yang sama dengan teman. Titik kecil menandai avatar yang sudah dipakai.</small></div>
       <div><strong>Teman yang sudah join</strong><div class="room-player-grid">${(r.players||[]).map(p=>`<span class="room-player-chip ${p.id===s.id?'me':''}">${p.avatar||'🦊'} ${esc(p.name)}${p.id===s.id?' (kamu)':''}</span>`).join('')}</div></div>
       <div class="auth-note">⏳ Guru akan menentukan jumlah ronde. Game dan level tiap ronde akan diacak oleh sistem saat tombol <b>Mulai</b> ditekan.</div>${window.__cpLobbyCards?window.__cpLobbyCards(r):''}
      </div>`;
    /* render ulang hanya jika isi berubah -> ruang tunggu tidak berkedip */
    if(box.__h!==html||!box.querySelector('.room-vnext-lobby')){
      box.__h=html;box.innerHTML=html;
      box.querySelectorAll('.avatar-choice').forEach(b=>b.onclick=()=>{
        const rr=room(r.code);if(!rr)return;
        studentAvatar=b.dataset.avatar;
        const pp=rr.players.find(p=>p.id===s.id);if(pp){pp.avatar=studentAvatar;saveRoom(rr)}
        renderStudentRoom();
      });
    }
  }else if(r.status==='playing'){
    const meP=(r.players||[]).find(p=>p.id===s.id);if(meP&&meP.finished){renderStudentRoomResult(r);return}
    m.classList.add('hidden'); if(window.__cpRoomRun)window.__cpRoomRun(r);else renderStudentQuizPage(r);
  }else if(r.status==='finished'){
    renderStudentRoomResult(r);
  }
}
function renderStudentRoomResult(r){
  if(window.__cpStudentResult)return window.__cpStudentResult(r);
  const s=sess(),box=document.getElementById('quizRoomLobbyV2');box.classList.remove('hidden');
  const ranked=[...(r.players||[])].sort((a,b)=>(b.score||0)-(a.score||0));
  const me=ranked.findIndex(p=>p.id===s.id);
  box.innerHTML=`<div class="room-vnext-result"><div style="font-size:3rem">🏆</div><h2>Room Selesai</h2><p>Nilai room kamu: <strong>${r.players.find(p=>p.id===s.id)?.score||0}</strong></p><div class="room-vnext-ranking">${ranked.map((p,i)=>`<div class="room-rank-row ${i===0?'top':''}"><b>${i+1}</b><span>${p.avatar||'👤'} ${esc(p.name)}</span><strong>${p.score||0}</strong></div>`).join('')}</div><button id="closeQuizRoomV2" class="btn btn-primary" style="margin-top:16px">Kembali</button></div>`;
  document.getElementById('closeQuizRoomV2').onclick=()=>{setStudentRoom(null);document.getElementById('quizRoomModalV2').classList.add('hidden')};
}
function renderStudentQuizPage(r){
  const s0=sess(),me0=(r.players||[]).find(p=>p.id===s0?.id),ch0=me0&&r.sequence[me0.roundIndex||0];
  if(ch0&&window.__cpIntro){const key=r.code+':'+(me0.roundIndex||0);if(window.__cpIntroKey!==key){window.__cpIntroKey=key;ensureQuizOverlay();window.__cpIntro(ch0,r,()=>{const l=room(r.code);if(l&&l.status==='playing')renderStudentQuizPage(l)});return}}
  return renderStudentQuizPageCore(r);
}
function renderStudentQuizPageCore(r){
  const s=sess(),idx=r.players.find(p=>p.id===s.id);
  if(!idx)return;
  const challenge=r.sequence[r.players.find(p=>p.id===s.id).roundIndex||0];
  if(!challenge){finishStudentRoom(r);return}
  const q=buildQuestion(challenge.game,challenge.level);
  studentAnswered=false;studentQStart=Date.now();
  ensureQuizOverlay();
  const ov=document.getElementById('quizPlayOverlayV2');ov.classList.remove('hidden');
  const body=document.getElementById('quizPlayBodyV2');
  body.innerHTML=`
   <div class="room-vnext-status"><small>RONDE ${challenge.round} / ${r.sequence.length}</small><h2 style="margin:4px 0">${challenge.icon} ${esc(challenge.gameName)} • Level ${challenge.level}</h2><small><span class="room-vnext-timer" id="quizTimerV2">60</span> detik • Skor <b>${(r.players.find(p=>p.id===s.id)||{}).score||0}</b></small></div>
   <div class="question-box" style="margin-top:14px"><div class="question-label">SOAL</div>${q.visual?`<div class="picture-visual" style="margin-bottom:10px">${esc(q.visual)}</div>`:''}<div class="question-text">${esc(q.text)}</div><div id="quizAnswersV2"></div><div id="quizFeedbackV2" class="game-message">Pilih jawabanmu.</div></div>`;
  window.__cpDecorate&&window.__cpDecorate(challenge,q);
  const ans=document.getElementById('quizAnswersV2');
  if(q.kind==='number'){
    ans.innerHTML=`<div class="answer-area"><input id="quizNumberV2" type="number" placeholder="Tulis jawaban"><button class="check-answer" id="quizSubmitV2">Jawab</button></div>`;
    document.getElementById('quizSubmitV2').onclick=()=>answerRoom(q,Number(document.getElementById('quizNumberV2').value),r);
  }else{
    ans.className='room-vnext-answer-grid';
    ans.innerHTML=q.options.map((o,i)=>`<button class="room-answer ${challenge.game==='logic'?'logic-option':challenge.game==='picture'?'picture-option':''}" data-i="${i}">${esc(o)}</button>`).join('');
    ans.querySelectorAll('button').forEach(b=>b.onclick=()=>answerRoom(q,Number(b.dataset.i),r,b));
  }
  clearInterval(studentTimer);let left=60;
  studentTimer=setInterval(()=>{left--;const t=document.getElementById('quizTimerV2');if(t)t.textContent=left;if(left<=0){clearInterval(studentTimer);if(!studentAnswered)answerRoom(q,NaN,r,null,true)}},1000);
}
function ensureQuizOverlay(){
 if(document.getElementById('quizPlayOverlayV2'))return;
 const ov=document.createElement('div');ov.id='quizPlayOverlayV2';ov.className='modal-overlay hidden';
 ov.innerHTML=`<div class="modal room-vnext-modal"><div class="modal-top"><div><span class="section-kicker">🎯 ROOM QUIZ</span><h2>Permainan Berlangsung</h2></div></div><div id="quizPlayBodyV2"></div></div>`;
 document.body.appendChild(ov);
}
function answerRoom(q,val,r,btn,timedOut=false){
 if(studentAnswered)return;studentAnswered=true;clearInterval(studentTimer);
 const correct=(typeof val==='number'&&!Number.isNaN(val)&&val===q.answer);
 const pts=cpPoints(correct),secUsed=Math.min(60,(Date.now()-studentQStart)/1000);
 if(btn){btn.classList.add(correct?'correct':'wrong')}
 window.__cpResult&&window.__cpResult(correct);
 const fb=document.getElementById('quizFeedbackV2');if(fb)fb.innerHTML=correct?'🎉 Benar! +'+pts+' poin (bonus cepat +'+(pts-100)+')':'💡 '+(timedOut?'Waktu habis. ':'Belum tepat. ')+(q.explanation||'');
 const s=sess(),rr=room(r.code),me=rr.players.find(p=>p.id===s.id);
 if(me&&rr.status==='playing'){me.score=(me.score||0)+pts;me.correct=(me.correct||0)+(correct?1:0);me.wrong=(me.wrong||0)+(correct?0:1);me.totalTime=(me.totalTime||0)+secUsed;me.roundIndex=(me.roundIndex||0)+1;me.lastAnswerAt=Date.now()}
 saveRoom(rr);
 setTimeout(()=>{const latest=room(r.code);if(latest?.status==='playing')renderStudentQuizPage(latest)},850);
}
function finishStudentRoom(r){
 const s=sess(),rr=room(r.code),me=rr.players.find(p=>p.id===s.id);if(me)me.finished=true;
 if(rr.players.length&&rr.players.every(p=>p.finished)){rr.status='finished';rr.finishedAt=Date.now()}
 saveRoom(rr);document.getElementById('quizPlayOverlayV2')?.classList.add('hidden');renderStudentRoomResult(rr);
}

/* ---------- TEACHER ROOM ---------- */
let teacherRoomCode=null;
function getTeacherRoom(){const s=sess();if(!s)return null;const c=teacherRoomCode||sessionStorage.getItem('cerdasPlayTeacherQuizRoom:'+s.id);return room(c)}
function setTeacherRoom(c){teacherRoomCode=c;const s=sess();if(s)sessionStorage.setItem('cerdasPlayTeacherQuizRoom:'+s.id,c||'')}
function createTeacherQuizRoom(){
 const s=sess();if(!s||s.role!=='teacher')return;
 const count=Math.max(1,Math.min(5,Number(document.getElementById('teacherRoomLevelCountV2')?.value||3)));
 const c=codeFor(s.className);
 const r={code:c,className:s.className,teacherId:s.id,teacherName:s.name,status:'waiting',levelCount:count,sequence:makeSequence(count),players:[],createdAt:Date.now()};
 saveRoom(r);setTeacherRoom(c);renderTeacherVNext();
}
function startTeacherQuizRoom(){
 const r=getTeacherRoom();if(!r||r.status!=='waiting'||(r.players||[]).length<1)return;
 r.status='playing';r.startedAt=Date.now();r.players.forEach(p=>{p.score=0;p.roundIndex=0;p.finished=false});saveRoom(r);renderTeacherVNext();
}
function closeTeacherQuizRoom(){
 const r=getTeacherRoom();if(r){r.status='closed';saveRoom(r)}setTeacherRoom(null);renderTeacherVNext();
}

/* =========================================================
   PVP TARIK TAMBANG V3 — 1 PERANGKAT, TANPA ROOM
   - Dua pemain memasukkan nama di layar yang sama.
   - Masing-masing menekan tombol TARIK di sisi sendiri.
   - Hasil otomatis masuk ke ranking akumulasi nilai siswa.
========================================================= */
const LOCAL_PVP_KEY='cerdasPlayLocalPvpScoresV3';
const LOCAL_PVP_QUESTIONS=[
 {q:'Berapakah 7 + 5?',a:['10','11','12','13'],c:2},
 {q:'Berapakah 15 - 6?',a:['7','8','9','10'],c:2},
 {q:'Hewan yang menghasilkan susu adalah ...',a:['Sapi','Ayam','Ikan','Kucing'],c:0},
 {q:'Planet tempat kita tinggal adalah ...',a:['Mars','Bumi','Venus','Jupiter'],c:1},
 {q:'Berapakah 6 × 4?',a:['20','22','24','26'],c:2},
 {q:'1 jam = berapa menit?',a:['30','45','60','90'],c:2},
 {q:'Ibukota Indonesia adalah ...',a:['Bandung','Surabaya','Jakarta','Bogor'],c:2},
 {q:'Bentuk yang memiliki 3 sisi adalah ...',a:['Persegi','Lingkaran','Segitiga','Trapesium'],c:2},
 {q:'Berapakah 36 ÷ 6?',a:['5','6','7','8'],c:1},
 {q:'Warna campuran merah dan putih menjadi ...',a:['Hijau','Ungu','Oranye','Merah muda'],c:3},
 {q:'Air membeku pada suhu ... °C',a:['0','10','50','100'],c:0},
 {q:'Hasil dari 9 + 8 - 5 adalah ...',a:['10','11','12','13'],c:2},
 {q:'Benda yang digunakan untuk mengukur panjang adalah ...',a:['Penggaris','Kompas','Jam','Termometer'],c:0},
 {q:'Hewan yang mengalami metamorfosis dari ulat menjadi ...',a:['Ikan','Kupu-kupu','Kambing','Ayam'],c:1},
 {q:'Berapakah 5 × 5?',a:['15','20','25','30'],c:2},
 {q:'Satu minggu terdiri dari ... hari',a:['5','6','7','8'],c:2}
];
let localPvpState={running:false,p1:'',p2:'',a:0,b:0,timer:null,seconds:30,finished:false,q1:null,q2:null,answered1:false,answered2:false,streak1:0,streak2:0,round:0};
function getLocalPvpScores(cls){
  try{return (JSON.parse(localStorage.getItem(LOCAL_PVP_KEY)||'[]')||[]).filter(x=>x.className===cls)}catch(e){return []}
}
function saveLocalPvpScores(list){localStorage.setItem(LOCAL_PVP_KEY,JSON.stringify(list));}
function addLocalPvpResult(cls,p1,p2,a,b){
  const rows=getLocalPvpScores(cls), now=Date.now();
  const add=(name,score,place)=>{
    if(!name)return;
    const key=name.trim().toLowerCase();
    const existing=rows.find(x=>x.className===cls&&x.name.toLowerCase()===key);
    if(existing){existing.score=(Number(existing.score)||0)+score;existing.lastPlayed=now;existing.lastResult=place;}
    else rows.push({studentId:'pvp-'+cls+'-'+key.replace(/[^a-z0-9]+/gi,'-'),className:cls,name:name.trim(),score,lastPlayed:now,lastResult:place});
  };
  if(a>b){add(p1,200,'Menang');add(p2,100,'Kalah');}
  else if(b>a){add(p1,100,'Kalah');add(p2,200,'Menang');}
  else {add(p1,150,'Seri');add(p2,150,'Seri');}
  saveLocalPvpScores(rows);
}
function nextLocalQuestion(exclude){
  let q=LOCAL_PVP_QUESTIONS[Math.floor(Math.random()*LOCAL_PVP_QUESTIONS.length)];
  for(let i=0;i<8&&exclude&&q.q===exclude.q;i++) q=LOCAL_PVP_QUESTIONS[Math.floor(Math.random()*LOCAL_PVP_QUESTIONS.length)];
  return q;
}
function localRopePercent(){return Math.max(14,Math.min(86,50+(localPvpState.a-localPvpState.b)*4));}
function localPvpQuestionHtml(side,q,answered){
  const color=side===1?'blue':'red';
  const label=side===1?localPvpState.p1:localPvpState.p2;
  return `<div class="local-pvp-question ${color}">
    <h3>${side===1?'🔵':'🔴'} ${esc(label)}</h3>
    <div class="local-pvp-question-text">${esc(q.q)}</div>
    <div class="local-pvp-answer-grid">${q.a.map((ans,i)=>`<button class="local-pvp-answer" data-pvp-side="${side}" data-pvp-answer="${i}" ${answered?'disabled':''}>${esc(ans)}</button>`).join('')}</div>
    <div id="localPvpFeedback${side}" class="local-pvp-feedback">${answered?'✅ Benar! Soal berikutnya sedang disiapkan...':'Jawab secepat mungkin.'}</div>
  </div>`;
}
function renderLocalPvp(host,s){
  if(!host)return;
  if(!localPvpState.running && !localPvpState.finished){
    host.innerHTML=`
      <div class="local-pvp-setup" id="localPvpSetup">
        <div class="local-pvp-rule">💡 <b>Tarik Tambang 1 Perangkat:</b> dua siswa bermain pada layar yang sama. Ketika jawaban benar, tali langsung tertarik ke sisi pemain tersebut. Yang lebih cepat dan lebih banyak menjawab benar akan menarik lawan sampai menang.</div>
        <div class="local-pvp-name-grid">
          <div class="local-pvp-name-card team-a-card">
            <span>🔵 PEMAIN 1</span>
            <label for="localPvpName1">Nama siswa</label>
            <input id="localPvpName1" type="text" placeholder="Ketik nama pemain 1" autocomplete="off" autocapitalize="words" spellcheck="false" tabindex="1">
          </div>
          <div class="local-pvp-name-card team-b-card">
            <span>🔴 PEMAIN 2</span>
            <label for="localPvpName2">Nama siswa</label>
            <input id="localPvpName2" type="text" placeholder="Ketik nama pemain 2" autocomplete="off" autocapitalize="words" spellcheck="false" tabindex="2">
          </div>
        </div>
        <div id="localPvpNameError" class="local-pvp-error" role="alert" aria-live="polite"></div>
        <button id="localPvpStartBtn" class="btn btn-primary local-pvp-start" type="button" tabindex="3" disabled>⚔️ Masukkan Nama untuk Mulai</button>
        <p class="local-pvp-note">Soal universal tingkat SD: matematika, IPA, pengetahuan umum, bentuk, waktu, dan lainnya. Durasi 30 detik.</p>
      </div>`;

    const n1=host.querySelector('#localPvpName1');
    const n2=host.querySelector('#localPvpName2');
    const err=host.querySelector('#localPvpNameError');
    const startBtn=host.querySelector('#localPvpStartBtn');

    const updateStartState=()=>{
      const p1=n1.value.trim(),p2=n2.value.trim();
      const ready=!!p1&&!!p2&&p1.toLowerCase()!==p2.toLowerCase();
      startBtn.disabled=!ready;
      startBtn.textContent=ready?'⚔️ Mulai Tarik Tambang':'⚔️ Masukkan Nama untuk Mulai';
      if(p1&&p2&&p1.toLowerCase()===p2.toLowerCase()){
        err.textContent='⚠️ Nama pemain harus berbeda.';err.classList.add('show');
      }else if(err.textContent==='⚠️ Nama pemain harus berbeda.'){
        err.textContent='';err.classList.remove('show');
      }
    };

    [n1,n2].forEach(input=>{
      input.addEventListener('click',e=>e.stopPropagation());
      input.addEventListener('mousedown',e=>e.stopPropagation());
      input.addEventListener('keydown',e=>e.stopPropagation());
      input.addEventListener('input',()=>{
        err.textContent='';err.classList.remove('show');
        updateStartState();
      });
      input.addEventListener('focus',()=>input.select && input.setSelectionRange(input.value.length,input.value.length));
    });

    startBtn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const p1=n1.value.trim(),p2=n2.value.trim();
      if(!p1){err.textContent='⚠️ Nama Pemain 1 wajib diisi.';err.classList.add('show');n1.focus();return;}
      if(!p2){err.textContent='⚠️ Nama Pemain 2 wajib diisi.';err.classList.add('show');n2.focus();return;}
      if(p1.toLowerCase()===p2.toLowerCase()){err.textContent='⚠️ Nama pemain harus berbeda.';err.classList.add('show');n2.focus();return;}

      localPvpState={running:true,p1,p2,a:0,b:0,timer:null,seconds:30,finished:false,q1:nextLocalQuestion(),q2:nextLocalQuestion(),answered1:false,answered2:false,streak1:0,streak2:0,round:1};
      renderLocalPvp(host,s);
      localPvpState.timer=setInterval(()=>{
        if(!localPvpState.running)return;
        localPvpState.seconds--;
        const t=host.querySelector('#localPvpSeconds');
        if(t)t.textContent=localPvpState.seconds;
        const bar=host.querySelector('.local-pvp-progress>i');
        if(bar)bar.style.width=Math.max(0,(localPvpState.seconds/30)*100)+'%';
        if(localPvpState.seconds<=0)finishLocalPvp(host,s);
      },1000);
    });

    // Pastikan field benar-benar siap diketik meskipun ada handler global di halaman guru.
    requestAnimationFrame(()=>n1.focus());
    return;
  }
  if(localPvpState.running){
    const pct=localRopePercent();
    host.innerHTML=`
      <div class="local-pvp-arena">
        <div class="local-pvp-arena-head"><span>⚔️ PERTANDINGAN BERLANGSUNG</span><strong><b id="localPvpSeconds">${localPvpState.seconds}</b> detik</strong></div>
        <div class="local-pvp-progress"><i style="width:${Math.max(0,(localPvpState.seconds/30)*100)}%"></i></div>
        <div class="local-pvp-battle">
          <div class="local-pvp-sky"></div>
          <div class="local-pvp-people">
            <div class="local-pvp-person left">
              <div class="person-avatar">🧑‍🎓</div><div class="person-body"></div><div class="person-name">${esc(localPvpState.p1)}</div><div class="local-pvp-side-label">PEMAIN 1</div>
            </div>
            <div class="local-pvp-rope-stage">
              <div class="local-pvp-rope-line" style="transform:translateX(${pct-50}%);"></div>
              <div class="local-pvp-rope-flag" style="left:${pct}%">🚩</div>
            </div>
            <div class="local-pvp-person right">
              <div class="person-avatar">👩‍🎓</div><div class="person-body"></div><div class="person-name">${esc(localPvpState.p2)}</div><div class="local-pvp-side-label">PEMAIN 2</div>
            </div>
          </div>
          <div class="local-pvp-ground"></div>
        </div>
        <div class="local-pvp-stats"><span class="local-pvp-stat">🔵 Tarikan benar: ${localPvpState.a}</span><span class="local-pvp-stat">🔴 Tarikan benar: ${localPvpState.b}</span></div>
        <div class="local-pvp-question-grid">
          ${localPvpQuestionHtml(1,localPvpState.q1,localPvpState.answered1)}
          ${localPvpQuestionHtml(2,localPvpState.q2,localPvpState.answered2)}
        </div>
        <p class="local-pvp-note">Jawaban benar = tali tertarik ke pemain tersebut. Jawaban salah tidak menambah tarikan.</p>
      </div>`;
    host.querySelectorAll('.local-pvp-answer').forEach(btn=>btn.onclick=()=>answerLocalPvp(host,s,Number(btn.dataset.pvpSide),Number(btn.dataset.pvpAnswer)));
    return;
  }
  if(localPvpState.finished){
    const winner=localPvpState.a===localPvpState.b?'Seri':(localPvpState.a>localPvpState.b?localPvpState.p1:localPvpState.p2);
    host.innerHTML=`<div class="local-pvp-result"><div class="local-pvp-result-icon">${winner==='Seri'?'🤝':'🏆'}</div><h2>${winner==='Seri'?'Pertandingan Seri!':esc(winner)+' Menang!'}</h2><p>🔵 ${esc(localPvpState.p1)} <b>${localPvpState.a}</b> — <b>${localPvpState.b}</b> 🔴 ${esc(localPvpState.p2)}</p><div class="local-pvp-result-points"><b>${winner==='Seri'?'Masing-masing mendapat 150 poin.':'Pemenang mendapat 200 poin dan lawan 100 poin.'}</b><br>Poin otomatis masuk ke <b>Nilai Siswa</b>.</div><button id="localPvpAgain" class="btn btn-primary">Main Lagi</button></div>`;
    host.querySelector('#localPvpAgain').onclick=()=>{localPvpState={running:false,p1:'',p2:'',a:0,b:0,timer:null,seconds:30,finished:false,q1:null,q2:null,answered1:false,answered2:false,streak1:0,streak2:0,round:0};renderLocalPvp(host,s)};
  }
}
function answerLocalPvp(host,s,side,answer){
  if(!localPvpState.running)return;
  const q=side===1?localPvpState.q1:localPvpState.q2;
  const already=side===1?localPvpState.answered1:localPvpState.answered2;
  if(already)return;
  const correct=answer===q.c;
  const feedback=host.querySelector('#localPvpFeedback'+side);
  if(correct){
    if(side===1){localPvpState.a++;localPvpState.streak1++;localPvpState.answered1=true;}
    else {localPvpState.b++;localPvpState.streak2++;localPvpState.answered2=true;}
    if(feedback){feedback.textContent='✅ Benar! Tali tertarik ke arahmu!';feedback.style.color='#15803d'}
    const rope=host.querySelector('.local-pvp-rope-line');if(rope){rope.classList.remove('pulse');void rope.offsetWidth;rope.classList.add('pulse')}
    const diff=Math.abs(localPvpState.a-localPvpState.b);
    if(diff>=10){finishLocalPvp(host,s);return}
    setTimeout(()=>{
      if(!localPvpState.running)return;
      if(side===1){localPvpState.q1=nextLocalQuestion(localPvpState.q1);localPvpState.answered1=false;}
      else {localPvpState.q2=nextLocalQuestion(localPvpState.q2);localPvpState.answered2=false;}
      renderLocalPvp(host,s);
    },260);
  }else{
    if(side===1)localPvpState.streak1=0;else localPvpState.streak2=0;
    if(feedback){feedback.textContent='❌ Kurang tepat. Coba soal berikutnya!';feedback.style.color='#be123c'}
    setTimeout(()=>{if(!localPvpState.running)return;if(side===1){localPvpState.q1=nextLocalQuestion(localPvpState.q1);localPvpState.answered1=false}else{localPvpState.q2=nextLocalQuestion(localPvpState.q2);localPvpState.answered2=false}renderLocalPvp(host,s)},300);
  }
}
function finishLocalPvp(host,s){
  if(!localPvpState.running)return;
  clearInterval(localPvpState.timer);localPvpState.running=false;localPvpState.finished=true;
  addLocalPvpResult(s.className,localPvpState.p1,localPvpState.p2,localPvpState.a,localPvpState.b);
  renderLocalPvp(host,s);renderTeacherVNext();
}

function renderTeacherVNext(){
 const s=sess();if(!s||s.role!=='teacher')return;
 const root=document.getElementById('teacherVNextRoot');if(!root)return;
 const r=getTeacherRoom();
 const students=getStudents(s.className);
 document.getElementById('teacherStudentCount')?.replaceChildren(document.createTextNode(String(students.length)));
 const aggregate={};
 students.forEach(st=>{ aggregate[st.id]={id:st.id,name:st.name,avatar:st.avatar||'👤',absen:st.absen||'-',score:0}; });
 Object.values(rooms()).filter(x=>x.className===s.className && x.status==='finished').forEach(x=>{
   (x.players||[]).forEach(p=>{
     aggregate[p.id]??={id:p.id,name:p.name,avatar:p.avatar||'👤',absen:p.absen||'-',score:0};
     aggregate[p.id].name=p.name; aggregate[p.id].avatar=p.avatar||aggregate[p.id].avatar||'👤';
     aggregate[p.id].score+=(Number(p.score)||0);
   });
 });
 // PVP lokal 1 perangkat juga masuk ke akumulasi nilai berdasarkan nama siswa.
 getLocalPvpScores(s.className).forEach(p=>{
   const st=students.find(x=>x.id===p.studentId || x.name.toLowerCase()===p.name.toLowerCase());
   if(st){
     aggregate[st.id]??={id:st.id,name:st.name,avatar:st.avatar||'👤',absen:st.absen||'-',score:0};
     aggregate[st.id].score+=(Number(p.score)||0);
   }
 });
 const rankings=Object.values(aggregate).sort((a,b)=>(b.score||0)-(a.score||0)||a.name.localeCompare(b.name));
 const active=document.querySelector('.teacher-menu[data-teacher-vnext].active')?.dataset.teacherVnext||'dashboard';
 document.querySelectorAll('.teacher-vnext-panel').forEach(p=>p.classList.remove('active'));
 document.getElementById('teacherVNext-'+active)?.classList.add('active');

 if(active==='dashboard'){
   root.querySelector('#teacherVNextStudentCount').textContent=students.length;
   root.querySelector('#teacherVNextClassChip').textContent=s.className;
   root.querySelector('#teacherVNextTitle').textContent='Dashboard';
   root.querySelector('#teacherVNextRoomCount').textContent=r&&r.status!=='closed'?'1':'0';
   root.querySelector('#teacherVNextGameCount').textContent='4';

   // Grafik jumlah siswa seluruh kelas 5A–6D (data asli dari akun yang terdaftar).
   const chartHost=root.querySelector('#teacherStudentChart');
   if(chartHost) chartHost.innerHTML=buildClassStudentChart();

   // Cardmenu jumlah game & jumlah level per game.
   const levelGrid=root.querySelector('#teacherGameLevelGrid');
   if(levelGrid){
     levelGrid.innerHTML=`
       <div class="game-level-card"><span class="glc-icon">🔢</span><b>Perhitungan</b><span class="glc-count">5 Level</span></div>
       <div class="game-level-card"><span class="glc-icon">🧠</span><b>Logika Sederhana</b><span class="glc-count">5 Level</span></div>
       <div class="game-level-card"><span class="glc-icon">🖼️</span><b>Tebak-Tebakan</b><span class="glc-count">5 Level</span></div>
       <div class="game-level-card"><span class="glc-icon">⚔️</span><b>PVP Tarik Tambang</b><span class="glc-count">1 vs 1</span></div>
       <div class="game-level-card total"><span class="glc-icon">🎮</span><b>Total Game</b><span class="glc-count">4 Game</span></div>
     `;
   }
 }

 if(active==='room'){
   const box=root.querySelector('#teacherVNextRoom');
   box.innerHTML=`<h2>🎯 Room Game</h2><p class="teacher-score-note">Guru hanya menentukan jumlah ronde. <b>Game dan level tiap ronde diacak otomatis oleh sistem</b> dari Perhitungan, Logika Sederhana, dan Tebak-Tebakan — mirip memilih "Logika Sederhana level 3" lalu ronde berikutnya "Perhitungan level 2" secara acak.</p><div id="teacherRoomActiveV2"></div>`;
   const inner=box.querySelector('#teacherRoomActiveV2');
   if(!r){
     inner.innerHTML=`<div class="teacher-vnext-create"><h3>🎯 Buat Room Quiz</h3><p>Pilih berapa ronde yang diinginkan, sisanya diacak sistem.</p><div class="teacher-room-config"><div class="field-group"><label>Jumlah level / ronde</label><select id="teacherRoomLevelCountV2"><option value="1">1 level</option><option value="2">2 level</option><option value="3" selected>3 level</option><option value="4">4 level</option><option value="5">5 level</option></select></div><button id="createTeacherQuizRoomV2" class="btn btn-primary">🚀 Buat Room</button></div></div>`;
     inner.querySelector('#createTeacherQuizRoomV2').onclick=createTeacherQuizRoom;
   }else{
     inner.innerHTML=`<div class="teacher-room-active"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><small>KODE ROOM</small><div class="room-vnext-code">${esc(r.code)}</div></div><span class="pvp-status-badge ${r.status==='playing'?'live':''}">${r.status==='waiting'?'Menunggu siswa':'Sedang bermain'}</span></div><p class="teacher-score-note">Bagikan kode ini ke siswa kelas ${esc(s.className)}. ${r.players.length} siswa sudah masuk.</p><div class="teacher-room-seq">${r.sequence.map(x=>`<div class="teacher-round-chip">Ronde ${x.round}: ${x.icon} ${x.gameName} — Level ${x.level}</div>`).join('')}</div><div class="room-player-grid" style="margin-top:12px">${r.players.map(p=>`<span class="room-player-chip">${p.avatar||'👤'} ${esc(p.name)} <b>${p.score||0}</b></span>`).join('')||'<span class="room-player-chip">Belum ada siswa</span>'}</div><div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">${r.status==='waiting'?`<button id="startTeacherQuizV2" class="btn btn-success" ${r.players.length<1?'disabled':''}>▶ Mulai Permainan</button>`:''}<button id="closeTeacherQuizV2" class="btn btn-outline">Tutup Room</button></div></div>`;
     inner.querySelector('#startTeacherQuizV2')?.addEventListener('click',startTeacherQuizRoom);
     inner.querySelector('#closeTeacherQuizV2')?.addEventListener('click',closeTeacherQuizRoom);
   }
 }

 if(active==='scores'){
   const panel=root.querySelector('#teacherVNextScores');
   panel.innerHTML=`<h2>🏆 Nilai Siswa</h2><p class="teacher-score-note">Peringkat diakumulasi dari skor Room Game (Join Room) dan PVP yang pernah diikuti siswa. Klik jabatan untuk mengubahnya.</p>
     <div class="room-rank-table">
       <div class="room-rank-header"><span>Peringkat</span><span>Nama</span><span>No. Absen</span><span>Jabatan</span><span>Score</span></div>
       ${rankings.length ? rankings.map((p,i)=>`
         <div class="room-rank-row2 ${i===0?'top':''}">
           <span class="rr-rank">${i+1}</span>
           <span class="rr-name">${p.avatar||'👤'} ${esc(p.name)}</span>
           <span class="rr-absen">${esc(p.absen||'-')}</span>
           <button type="button" class="rr-jabatan" data-jabatan-id="${esc(p.id)}">${esc(getJabatan(p.id))} ✎</button>
           <span class="rr-score">${p.score||0}</span>
         </div>`).join('')
       : '<div class="student-item"><strong>Belum ada nilai</strong><small>Buat Room Game lalu ajak siswa Join Room untuk mulai mengumpulkan nilai.</small></div>'}
     </div>`;
   panel.querySelectorAll('.rr-jabatan').forEach(btn=>{
     btn.addEventListener('click',()=>{
       const id=btn.dataset.jabatanId;
       const current=getJabatan(id);
       const next=prompt('Jabatan di kelas untuk siswa ini (contoh: Ketua Kelas, Bendahara, Sekretaris):', current==='-'?'':current);
       if(next===null) return;
       setJabatan(id, next.trim()||'-');
       renderTeacherVNext();
     });
   });
 }
 if(active==='pvp'){
   const p=root.querySelector('#teacherVNextPvp');
   p.innerHTML=`<div class="local-pvp-head"><div><span class="section-kicker">⚔️ PVP TARIK TAMBANG</span><h2>Tarik Tambang — 1 Perangkat</h2><p>Guru membuka arena ini di satu perangkat/LED. Dua siswa cukup memasukkan nama, lalu bermain pada layar yang sama. <b>Tidak memakai room atau kode.</b></p></div><span class="class-chip">${esc(s.className)}</span></div><div id="localPvpHostV3"></div>`;
   const host=p.querySelector('#localPvpHostV3');
   renderLocalPvp(host,s);
 }
}

/* Build new teacher navigation/panels */
let teacherPvpOriginalBoxV2=null;
function installTeacherVNext(){
 const tp=document.getElementById('teacherPortalPage');if(!tp||document.getElementById('teacherVNextRoot'))return;
 const main=tp.querySelector('.teacher-main');
 const root=document.createElement('div');root.id='teacherVNextRoot';
 root.innerHTML=`
   <div class="teacher-vnext-panel active" id="teacherVNext-dashboard">
    <div class="portal-top"><div><span class="badge">👩‍🏫 Portal Guru</span><h1 id="teacherVNextTitle">Dashboard</h1><p>Ringkasan jumlah siswa seluruh kelas dan daftar game yang tersedia.</p></div><span class="class-chip" id="teacherVNextClassChip">5A</span></div>
    <div class="portal-cards">
      <div class="portal-stat"><span>Jumlah siswa (kelasmu)</span><strong id="teacherVNextStudentCount">0</strong><small>Siswa di kelasmu</small></div>
      <div class="portal-stat"><span>Total Game</span><strong id="teacherVNextGameCount">4</strong><small>Perhitungan • Logika Sederhana • Tebak-Tebakan • PVP</small></div>
      <div class="portal-stat"><span>Room aktif</span><strong id="teacherVNextRoomCount">0</strong><small>Room Quiz</small></div>
    </div>

    <div class="teacher-chart-card">
      <div class="teacher-chart-head">
        <span class="section-kicker">📊 GRAFIK SELURUH KELAS</span>
        <h3>Jumlah Siswa per Kelas (5A–6D)</h3>
      </div>
      <div id="teacherStudentChart" class="teacher-chart-box"></div>
      <div class="teacher-chart-legend"><span class="legend-dot"></span>Jumlah Siswa Terdaftar</div>
    </div>

    <div class="teacher-chart-card">
      <div class="teacher-chart-head">
        <span class="section-kicker">🎮 DAFTAR GAME</span>
        <h3>Jumlah Game &amp; Level per Game</h3>
      </div>
      <div id="teacherGameLevelGrid" class="game-level-grid"></div>
    </div>
   </div>

   <div class="teacher-vnext-panel portal-panel" id="teacherVNext-room"><div id="teacherVNextRoom"></div></div>
   <div class="teacher-vnext-panel portal-panel" id="teacherVNext-scores"><div id="teacherVNextScores"></div></div>
   <div class="teacher-vnext-panel portal-panel" id="teacherVNext-pvp"><div id="teacherVNextPvp"></div></div>`;
 main.querySelector('.teacher-layout')?.classList.add('hidden');
 main.appendChild(root);
 const pvpBox=tp.querySelector('#teacherGamesPanel .pvp-teacher-box');
 if(pvpBox){ pvpBox.id='teacherPvpOriginalBoxV2'; pvpBox.remove(); teacherPvpOriginalBoxV2=pvpBox; }
}

function teacherNavBind(){
 document.querySelectorAll('#teacherPortalPage .teacher-menu[data-teacher-vnext]').forEach(btn=>{
   if(btn.dataset.vnextBound)return;btn.dataset.vnextBound='1';
   btn.addEventListener('click',e=>{
     e.preventDefault();e.stopImmediatePropagation();
     document.querySelectorAll('#teacherPortalPage .teacher-menu').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
     renderTeacherVNext();
     window.scrollTo({top:0,behavior:'auto'});
   },true);
 });
}
function studentNavBind(){
 document.querySelectorAll('#studentDashboard .student-menu').forEach(btn=>{
   if(btn.dataset.roomV2Bound)return;btn.dataset.roomV2Bound='1';
   if(btn.dataset.studentView==='nilai'){
     btn.addEventListener('click',e=>{
       e.preventDefault();e.stopImmediatePropagation();
       renderStudentRoomScoreView(); 
     },true);
   }
 });
}
function renderStudentRoomScoreView(){
 const s=sess();if(!s)return;
 const target=document.getElementById('studentViewNilai');if(!target)return;
 const all=Object.values(rooms()).filter(r=>r.className===s.className&&r.status==='finished');
 const agg={};
 getStudents(s.className).forEach(st=>{agg[st.id]={id:st.id,name:st.name,avatar:st.avatar||'👤',score:0};});
 all.forEach(r=>r.players.forEach(p=>{agg[p.id]??={id:p.id,name:p.name,avatar:p.avatar||'👤',score:0};agg[p.id].name=p.name;agg[p.id].avatar=p.avatar||agg[p.id].avatar||'👤';agg[p.id].score+=(Number(p.score)||0)}));
 getLocalPvpScores(s.className).forEach(p=>{
   const st=getStudents(s.className).find(x=>x.id===p.studentId || x.name.toLowerCase()===p.name.toLowerCase());
   if(st){agg[st.id]??={id:st.id,name:st.name,avatar:st.avatar||'👤',score:0};agg[st.id].score+=(Number(p.score)||0);}
 });
 const rows=Object.values(agg).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 target.innerHTML=`<div class="portal-panel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><span class="section-kicker">🏆 NILAI ROOM</span><h2>Ranking Kelas</h2><p>Akumulasi poin dari quiz room yang sudah selesai.</p></div><span class="privacy-lock">Room Quiz</span></div><div class="room-vnext-ranking">${rows.length?rows.map((p,i)=>`<div class="room-rank-row ${p.id===s.id?'top':''}"><b>${i+1}</b><span>${p.avatar} ${esc(p.name)}${p.id===s.id?' (kamu)':''}</span><strong>${p.score}</strong></div>`).join(''):'<div class="student-item"><strong>Belum ada nilai room</strong><small>Join room dari tombol di pojok kanan atas.</small></div>'}</div></div>`;
 /* Make the student's own ranking visible while keeping old personal score data separate. */
 document.querySelectorAll('#studentDashboard .student-view').forEach(v=>v.classList.add('hidden'));
 target.classList.remove('hidden');
 document.querySelectorAll('#studentDashboard .student-menu').forEach(b=>b.classList.toggle('active',b.dataset.studentView==='nilai'));
 document.getElementById('studentPageTitle').textContent='Nilai Room';
 document.getElementById('studentPageSubtitle').textContent='Ranking berdasarkan akumulasi quiz room kelasmu.';
}

/* Hook into existing UI */
function boot(){
 installTeacherVNext();teacherNavBind();studentNavBind();ensureStudentModal();

 /* Intercept the older student capture handlers before they can open the
    legacy room modal or force the old 2-item sidebar state. */
 document.addEventListener('click',function(e){
   const el=e.target.closest && e.target.closest('button');
   if(!el)return;
   if(el.id==='joinRoomBtn'){
     e.preventDefault();e.stopImmediatePropagation();
     openStudentRoom();return;
   }
   if(el.closest('#studentDashboard') && el.dataset.studentView==='nilai'){
     e.preventDefault();e.stopImmediatePropagation();
     renderStudentRoomScoreView();return;
   }
 },true);
 const join=document.getElementById('joinRoomBtn');
 if(join&&!join.dataset.roomV2Bound){
   join.dataset.roomV2Bound='1';
   join.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openStudentRoom()},true);
 }
 const s=sess();
 if(s?.role==='teacher'){renderTeacherVNext();}
 if(s?.role==='student'){
   const c=getStudentRoom();if(c&&room(c)&&room(c).status==='waiting'){/* lobby is opened only when user clicks Join Room */}
 }
}
window.addEventListener('storage',e=>{
 if(e.key===LOCAL_PVP_KEY){ const ss=sess(); if(ss?.role==='teacher') renderTeacherVNext(); if(ss?.role==='student') renderStudentRoomScoreView(); }
 if(e.key===ROOM_KEY){
   const s=sess();
   if(s?.role==='teacher')renderTeacherVNext();
   if(s?.role==='student'){
     const c=getStudentRoom(),r=room(c);
     const m=document.getElementById('quizRoomModalV2');
     if(m&&!m.classList.contains('hidden')&&r)renderStudentRoom();
   }
 }
});
setInterval(()=>{
 const s=sess();
 if(s?.role==='teacher')renderTeacherVNext();
 if(s?.role==='student'){
   const m=document.getElementById('quizRoomModalV2');
   if(m&&!m.classList.contains('hidden'))renderStudentRoom();
 }
},1000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
