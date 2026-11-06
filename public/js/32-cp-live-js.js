(function(){
'use strict';
const ROOM_KEY='cerdasPlayQuizRoomsV2',NOTIF_KEY='cerdasPlayRoomNotifsV1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const sess=()=>{try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
const rooms=()=>{try{return JSON.parse(localStorage.getItem(ROOM_KEY)||'{}')}catch(e){return {}}};
const notifs=()=>{try{return JSON.parse(localStorage.getItem(NOTIF_KEY)||'[]')}catch(e){return []}};
function upd(code,fn){const rs=rooms();if(!rs[code])return;fn(rs[code]);localStorage.setItem(ROOM_KEY,JSON.stringify(rs))}
const rank=a=>[...a].sort((x,y)=>(y.score||0)-(x.score||0)||(x.totalTime||0)-(y.totalTime||0));
const goMenu=n=>document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext="'+n+'"]')?.click();
function tRoom(s){const c=sessionStorage.getItem('cerdasPlayTeacherQuizRoom:'+s.id);return c?rooms()[c]||null:null}

/* ================= GURU ================= */
function rows(r,ranked,live){
  const total=(r.sequence||[]).length;
  return `<div class="cp-tw"><table class="cp-t"><thead><tr><th>#</th><th>Siswa</th><th>Progres</th>${live?'<th>Sedang di</th>':''}<th>✔ / ✖</th><th>Waktu</th><th style="text-align:right">Skor</th><th>Status</th></tr></thead><tbody>${ranked.map((p,i)=>{
    const done=p.finished?total:Math.min(p.roundIndex||0,total),q=(r.sequence||[])[done];
    return `<tr class="${i===0&&(p.score||0)>0?'top':''}"><td>${i+1}</td><td>${p.avatar||'👤'} ${esc(p.name)}</td><td><div class="cp-bar"><i style="width:${total?done/total*100:0}%"></i></div><small>${done}/${total} ronde</small></td>${live?`<td>${p.finished||!q?'—':q.icon+' '+esc(q.gameName)+' L'+q.level}</td>`:''}<td>${p.correct||0} / ${p.wrong||0}</td><td>${Math.round(p.totalTime||0)} dtk</td><td class="cp-sc">${p.score||0}</td><td><span class="cp-badge ${p.finished?'done':''}">${p.finished?'Selesai':'Bermain'}</span></td></tr>`}).join('')}</tbody></table></div>`;
}
function panelHtml(r,s){
  const pl=r.players||[],total=(r.sequence||[]).length,st=r.status;
  const sent=notifs().find(n=>n.code===r.code);
  const label=st==='waiting'?'Menunggu siswa':st==='playing'?'Sedang bermain':'Selesai';
  const head=`<div class="tg4-head"><div><span class="badge">🎯 ROOM GAME</span><h1>Room Game</h1><p>${st==='playing'?'Pantau jawaban dan skor siswa secara langsung.':st==='finished'?'Permainan selesai. Skor sudah masuk ke Nilai Siswa.':'Bagikan kode ke siswa, tunggu semua bergabung, lalu mulai.'}</p></div><span class="tg4-chip">${esc(s.className)}</span></div>`;
  const top=`<div class="tg4-room-top"><div><small>KODE ROOM</small><div class="tg4-room-code">${esc(r.code)}</div></div><span class="tg4-status ${st==='playing'?'live':''} ${st==='finished'?'done':''}">${label}</span></div>`;
  const rounds=`<div class="tg4-round-grid">${(r.sequence||[]).map(x=>`<div class="tg4-round"><b>Ronde ${x.round}</b><small>${x.icon} ${esc(x.gameName)} • Level ${x.level} • ${window.__upDurTxt?window.__upDurTxt(x.game):'3 menit'}</small></div>`).join('')}</div>`;
  let body='';
  if(st==='waiting'){
    body=`<div class="cp-btnrow"><button id="cpSend" class="btn btn-primary">📨 ${sent?'Kirim Ulang Kode':'Kirim Kode ke Siswa'}</button>${sent?`<span class="cp-sent">✅ Terkirim ke notifikasi siswa kelas ${esc(r.className)} (${new Date(sent.ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})})</span>`:''}</div>
    <p style="margin-top:12px"><b>${pl.length}</b> siswa sudah bergabung. Nilai dari room ini hanya menjadi <b>Nilai Individu</b>.</p>${rounds}
    <div class="room-player-grid" style="margin-top:15px">${pl.map(p=>`<span class="room-player-chip">${p.avatar||'👤'} ${esc(p.name)}</span>`).join('')||'<span class="room-player-chip">Belum ada siswa</span>'}</div>
    <div class="tg4-actions"><button id="cpStart" class="btn btn-success" ${pl.length<1?'disabled':''}>▶ Mulai Permainan</button><button id="cpClose" class="btn btn-outline">Tutup Room</button></div>`;
  }else if(st==='playing'){
    const fin=pl.filter(p=>p.finished).length,sc=pl.map(p=>p.score||0),avg=sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):0;
    body=`<div class="cp-sum"><div><small>PEMAIN</small><b>${pl.length}</b></div><div><small>SUDAH SELESAI</small><b>${fin}/${pl.length}</b></div><div><small>RATA-RATA SKOR</small><b>${avg}</b></div><div><small>SKOR TERTINGGI</small><b>${Math.max(0,...sc)}</b></div></div>
    <h3 style="margin:6px 0">📡 Leaderboard Langsung</h3>${rows(r,rank(pl),true)}
    <div class="tg4-note" style="margin-top:12px">Skor = 100 poin untuk jawaban benar + bonus kecepatan (maks. +100). Jawaban salah / waktu habis = 0 dan siswa otomatis lanjut ke ronde berikutnya.</div>
    <div class="tg4-actions"><button id="cpEnd" class="btn btn-outline">⏹ Akhiri Sekarang</button></div>`;
  }else{
    const rk=rank(pl),med=['🥇','🥈','🥉'];
    body=`<div class="cp-podium">${rk.slice(0,3).map((p,i)=>`<div><span>${med[i]}</span><b>${p.avatar||'👤'} ${esc(p.name)}</b><br><small>${p.score||0} poin</small></div>`).join('')}</div>${rows(r,rk,false)}
    <div class="tg4-actions"><button id="cpToScores" class="btn btn-primary">🏆 Lihat Nilai Siswa</button><button id="cpNew" class="btn btn-outline">Buat Room Baru</button></div>`;
  }
  return `<div id="cpRoomRoot">${head}<div class="tg4-panel">${top}${body}</div></div>`;
}
let lastHtml='';
function bindPanel(r,s){
  const on=(id,fn)=>{const e=$(id);if(e)e.onclick=fn};
  on('cpSend',()=>{
    const list=notifs().filter(n=>n.code!==r.code);
    list.push({id:'n'+Date.now(),className:r.className,code:r.code,teacherName:s.name,rounds:(r.sequence||[]).length,ts:Date.now()});
    localStorage.setItem(NOTIF_KEY,JSON.stringify(list.slice(-30)));refresh();
  });
  on('cpStart',()=>{upd(r.code,x=>{if(x.status!=='waiting')return;x.status='playing';x.startedAt=Date.now();(x.players||[]).forEach(p=>{p.score=0;p.roundIndex=0;p.finished=false;p.correct=0;p.wrong=0;p.totalTime=0})});refresh()});
  on('cpEnd',()=>{if(!confirm('Akhiri permainan sekarang? Skor yang sudah masuk tetap disimpan.'))return;upd(r.code,x=>{x.status='finished';x.finishedAt=Date.now();(x.players||[]).forEach(p=>p.finished=true)});refresh()});
  on('cpClose',()=>{upd(r.code,x=>{x.status='closed'});sessionStorage.removeItem('cerdasPlayTeacherQuizRoom:'+s.id);lastHtml='';goMenu('room')});
  on('cpNew',()=>{sessionStorage.removeItem('cerdasPlayTeacherQuizRoom:'+s.id);lastHtml='';goMenu('room')});
  on('cpToScores',()=>goMenu('scores'));
}
function paint(host,r,s){
  if((r.status==='playing'||r.status==='finished')&&window.__cpLivePanel){window.__cpLivePanel(host,r,s);return}
  const html=panelHtml(r,s);
  if(lastHtml===html&&host.querySelector('#cpRoomRoot'))return;
  lastHtml=html;host.innerHTML=html;bindPanel(r,s);
}
function refresh(){
  const s=sess();if(!s||s.role!=='teacher')return;
  const host=$('teacherGuruV4'),r=tRoom(s);if(host&&r)paint(host,r,s);
}
window.__cpRoomPanel=function(host,r,s){lastHtml='';paint(host,r,s)};

/* ================= SISWA: hasil / lobby akhir ================= */
window.__cpStudentResult=function(r){
  const s=sess();if(!s)return;
  const modal=$('quizRoomModalV2'),box=$('quizRoomLobbyV2');if(!modal||!box)return;
  modal.classList.remove('hidden');$('quizRoomJoinV2')?.classList.add('hidden');$('quizPlayOverlayV2')?.classList.add('hidden');box.classList.remove('hidden');
  const pl=r.players||[],rk=rank(pl),me=pl.find(p=>p.id===s.id)||{},done=r.status==='finished',left=pl.filter(p=>!p.finished).length;
  const html=`<div class="room-vnext-result"><div style="font-size:3rem">${done?'🏆':'⏳'}</div><h2>${done?'Room Selesai':'Kamu sudah selesai!'}</h2><p>Skor kamu: <strong>${me.score||0}</strong> • ✔ ${me.correct||0} benar • ✖ ${me.wrong||0} salah</p>${done?'':`<p>Menunggu ${left} teman lagi… ranking di bawah diperbarui langsung.</p>`}<div class="room-vnext-ranking">${rk.map((p,i)=>`<div class="room-rank-row ${i===0?'top':''}"><b>${i+1}</b><span>${p.avatar||'👤'} ${esc(p.name)}${p.id===s.id?' (kamu)':''}</span><strong>${p.score||0}</strong></div>`).join('')}</div>${done?'<button id="cpBackRoom" class="btn btn-primary" style="margin-top:16px">Kembali</button>':''}</div>`;
  if(box.dataset.cpH!==html){box.dataset.cpH=html;box.innerHTML=html;
    $('cpBackRoom')&&($('cpBackRoom').onclick=()=>{sessionStorage.removeItem('cerdasPlayStudentQuizRoom:'+s.id);box.dataset.cpH='';modal.classList.add('hidden')});}
};

/* ================= SISWA: notifikasi kode room ================= */
const seenKey=s=>'cerdasPlayRoomNotifSeen:'+s.id;
const seen=s=>{try{return JSON.parse(localStorage.getItem(seenKey(s))||'[]')}catch(e){return []}};
const mine=s=>notifs().filter(n=>n.className===s.className&&Date.now()-n.ts<864e5).sort((a,b)=>b.ts-a.ts);
const live=n=>{const r=rooms()[n.code];return r&&(r.status==='waiting')};
function copy(t){
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).catch(()=>fb(t));
  fb(t);return Promise.resolve();
}
function fb(t){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove()}
function dot(s){
  const i=document.querySelector('#studentNotificationBtn i');if(!i)return;
  const un=mine(s).filter(n=>!seen(s).includes(n.id)&&live(n)).length;
  i.style.setProperty('display',un?'block':'none','important');
}
function closePanel(){$('cpNotifPanel')?.remove()}
function openPanel(){
  const s=sess(),btn=$('studentNotificationBtn');if(!s||!btn)return;
  if($('cpNotifPanel')){closePanel();return}
  const list=mine(s),p=document.createElement('div');p.id='cpNotifPanel';
  const rc=btn.getBoundingClientRect();p.style.top=(rc.bottom+8)+'px';p.style.right=Math.max(8,window.innerWidth-rc.right)+'px';
  p.innerHTML='<h4>🔔 Notifikasi</h4>'+(list.length?list.map(n=>{
    const r=rooms()[n.code],st=r?r.status:'closed',active=st==='waiting';
    return `<div class="cp-n ${active?'':'old'}"><b>🎮 Room Game dari ${esc(n.teacherName||'Guru')}</b><small>${n.rounds} ronde • ${new Date(n.ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})} • ${active?'Menunggu siswa':st==='playing'?'Sudah dimulai':'Sudah berakhir'}</small><div class="code">${esc(n.code)}</div>${active?`<button class="p" data-copy="${esc(n.code)}">📋 Salin Kode</button><button data-join="1">Buka Join Room</button>`:''}</div>`}).join(''):'<p style="color:#84817d;font-weight:700">Belum ada notifikasi.</p>');
  document.body.appendChild(p);
  localStorage.setItem(seenKey(s),JSON.stringify([...new Set([...seen(s),...list.map(n=>n.id)])]));dot(s);
  p.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy).then(()=>{b.textContent='✅ Tersalin!'}));
  p.querySelectorAll('[data-join]').forEach(b=>b.onclick=()=>{closePanel();$('joinRoomBtn')?.click()});
}
const toasted=new Set();
function toast(n){
  const ss=sess()||{},staff=ss.tester||ss.role==='admin';
  if(window.__upNotify){window.__upNotify(staff?{id:'cpToast',kind:'room',title:'Ruang baru: '+n.code,text:(n.teacherName||'Guru')+' membuat ruang permainan untuk kelas '+(n.className||'-')+'.',ms:7000,meta:{code:n.code}}:{id:'cpToast',kind:'room',title:'Kode Ruang baru: '+n.code,text:'Dari '+(n.teacherName||'guru kelasmu')+'. Buka riwayat notifikasi untuk bergabung.',ms:9000,meta:{code:n.code,join:true}});return}
  $('cpToast')?.remove();const t=document.createElement('div');t.id='cpToast';
  t.textContent='Kode Room baru dari Guru: '+n.code+' — ketuk untuk melihat';
  t.onclick=()=>{t.remove();openPanel()};document.body.appendChild(t);setTimeout(()=>t.remove(),9000);
}
document.addEventListener('click',e=>{
  if(e.target.closest&&e.target.closest('#studentNotificationBtn')){e.preventDefault();openPanel();return}
  if($('cpNotifPanel')&&!e.target.closest('#cpNotifPanel'))closePanel();
},true);

/* ================= loop realtime ================= */
function tick(){
  const s=sess();if(!s)return;
  if(s.role==='teacher'){
    const page=$('teacherPortalPage');
    if(page&&!page.classList.contains('hidden')&&document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext].active')?.dataset.teacherVnext==='room')refresh();
  }
  if(s.role==='student'){
    dot(s);
    mine(s).forEach(n=>{if(!seen(s).includes(n.id)&&live(n)&&!toasted.has(n.id)){toasted.add(n.id);toast(n)}});
    const code=sessionStorage.getItem('cerdasPlayStudentQuizRoom:'+s.id),r=code&&rooms()[code];
    if(r){
      const me=(r.players||[]).find(p=>p.id===s.id),ov=$('quizPlayOverlayV2'),md=$('quizRoomModalV2');
      const ovShown=ov&&!ov.classList.contains('hidden'),mdShown=md&&!md.classList.contains('hidden');
      if(r.status==='playing'&&me&&!me.finished&&!ovShown&&!mdShown&&!window.__cpRoomBusy)window.__cpRoomRun&&window.__cpRoomRun(r);
      if(r.status==='finished'&&ovShown)window.__cpStudentResult(r);
    }
  }
}
setInterval(tick,1000);
window.addEventListener('storage',tick);
})();
