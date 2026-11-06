(function(){
'use strict';
const ROOM_KEY='cerdasPlayQuizRoomsV2',NOTIF_KEY='cerdasPlayRoomNotifsV1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const sess=()=>{try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
const rooms=()=>{try{return JSON.parse(localStorage.getItem(ROOM_KEY)||'{}')}catch(e){return {}}};
/* BACKEND: simpan skor/progres ronde siswa -> PATCH /api/rooms/:code/players/:studentId (lalu broadcast via WebSocket) */
function saveRooms(rs){const v=JSON.stringify(rs);localStorage.setItem(ROOM_KEY,v);window.dispatchEvent(new StorageEvent('storage',{key:ROOM_KEY,newValue:v}))}
const rcode=s=>sessionStorage.getItem('cerdasPlayStudentQuizRoom:'+s.id);
const MED=['🥇','🥈','🥉'];
const eff=p=>(p.score||0)+(p.finished?0:(p.live||0));
const rank=a=>[...a].sort((x,y)=>eff(y)-eff(x)||(x.totalTime||0)-(y.totalTime||0)||(x.lastAnswerAt||0)-(y.lastAnswerAt||0));

/* ---------- riwayat notifikasi: hapus setelah 24 jam ---------- */
function purge(){try{const l=JSON.parse(localStorage.getItem(NOTIF_KEY)||'[]'),k=l.filter(n=>Date.now()-n.ts<864e5);if(k.length!==l.length)localStorage.setItem(NOTIF_KEY,JSON.stringify(k))}catch(e){}}
purge();setInterval(purge,30000);

/* ================= GURU: klasemen realtime ================= */
function sync(container,items,mk,upd,axis){
  const els=[...container.children],old={},map={};
  els.forEach(e=>{old[e.dataset.id]=e.getBoundingClientRect();map[e.dataset.id]=e});
  items.forEach((it,i)=>{let e=map[it.id];if(!e){e=mk();e.dataset.id=it.id;container.appendChild(e);map[it.id]=e}upd(e,it,i)});
  els.forEach(e=>{if(!items.some(it=>it.id===e.dataset.id))e.remove()});
  if([...container.children].map(e=>e.dataset.id).join()!==items.map(i=>i.id).join())items.forEach(it=>container.appendChild(map[it.id]));
  items.forEach(it=>{const e=map[it.id],o=old[it.id];if(!o)return;const n=e.getBoundingClientRect(),d=axis==='x'?o.left-n.left:o.top-n.top;
    if(Math.abs(d)>1){e.style.transition='none';e.style.transform=axis==='x'?`translateX(${d}px)`:`translateY(${d}px)`;void e.offsetWidth;e.style.transition='transform .7s cubic-bezier(.2,.8,.2,1),background .6s';e.style.transform='';e.classList.add(d>0?'cp-up':'cp-down');setTimeout(()=>e.classList.remove('cp-up','cp-down'),1300)}});
}
/* ===== countdown mulai room (dipakai guru & siswa, disinkronkan lewat room.startedAt) ===== */
const CD_MS=3000;
function countOverlay(id,r,label){
  if($(id))return;
  const end=r.startedAt+CD_MS,o=document.createElement('div');o.id=id;o.className='cp-count-ov';
  o.innerHTML=`<div><small>Ruang ${esc(r.code)}</small><p>${label}</p><b class="cp-cnum"></b></div>`;document.body.appendChild(o);
  const num=o.querySelector('.cp-cnum');let last='';
  const paint=()=>{const rem=end-Date.now();if(rem<=0){if(id!=='cpRoomCount'){o.remove();return false}num.textContent='Mulai!';num.classList.add('go');return false} /* layar siswa: ditutup oleh launchCover saat permainan sudah tampil */
    const v=String(Math.max(1,Math.ceil(rem/1000)));
    if(v!==last){last=v;num.textContent=v;num.classList.remove('tick');void num.offsetWidth;num.classList.add('tick')}
    return true};
  paint();const iv=setInterval(()=>{if(!paint())clearInterval(iv)},100);
}
function teacherCount(r){if(r.status==='playing'&&r.startedAt&&Date.now()<r.startedAt+CD_MS)countOverlay('cpTCount',r,'Permainan dimulai dalam…')}

/* ===== tabel 7 kolom: # | siswa | progres | ✓/✕ | waktu | skor | status ===== */
const HEAD7='<span style="text-align:center">#</span><span>Siswa</span><span>Progres</span><span>✓ / ✕</span><span>Waktu</span><span style="text-align:right">Skor</span><span>Status</span>';
function rowHtml(p,i,r){
  const total=(r.sequence||[]).length,done=p.finished?total:Math.min(p.roundIndex||0,total),part=p.finished?0:(p.live||0)/90;
  const w=total?Math.min(100,(done+part)/total*100):0;
  return `<div class="pos">${i+1}</div><div><span class="cp-av">${p.avatar||'👤'}</span> ${esc(p.name)}</div><div><div class="cp-pbar"><i style="width:${w}%"></i></div><small>${done}/${total} ronde</small></div><div>${p.roundsOk||0} / ${p.roundsFail||0}</div><div>${Math.round(p.totalTime||0)} dtk</div><div class="sc">${eff(p)}</div><div><span class="cp-st ${p.finished?'':'live'}">${p.finished?'Selesai':'Bermain'}</span></div>`;
}
const medalCard=(p,i)=>`<i class="cp-rk">${i+1}</i><span class="cp-av">${p.avatar||'👤'}</span><b>${esc(p.name)}</b><small>${eff(p)} poin</small>`;
function medalsHtml(list){
  return list.map((p,i)=>`<div class="cp-medal m${i+1}">${medalCard(p,i)}</div>`).join('');
}
/* tabel hasil akhir statis (dipakai panel guru "selesai" dan menu Nilai Siswa) */
window.__cpRoomFinalHtml=function(r){
  const rk=rank(r.players||[]);
  return `<div class="cp-medals">${medalsHtml(rk.slice(0,3))}</div><div class="cp-board"><div class="cp-bh">${HEAD7}</div>${rk.map((p,i)=>`<div class="cp-brow ${i<3?'r'+(i+1):''}">${rowHtml(p,i,r)}</div>`).join('')}</div>`;
};

function liveBuild(host,r,s){
  const st=r.status,fin=st==='finished';
  host.innerHTML=`<div id="cpLiveRoot" data-code="${esc(r.code)}" data-st="${st}"><div class="tg4-head"><div><span class="badge">🎯 ROOM GAME</span><h1>Room Game</h1><p>${fin?'Permainan selesai. Skor sudah masuk ke Nilai Siswa.':'Pantau posisi dan progres siswa secara langsung.'}</p></div><span class="tg4-chip">${esc(s.className)}</span></div>
  <div class="tg4-panel"><div class="tg4-room-top"><div><small>KODE ROOM</small><div class="tg4-room-code">${esc(r.code)}</div></div><span class="tg4-status ${fin?'done':'live'}">${fin?'Selesai':'Sedang bermain'}</span></div>
  ${fin?'':'<div class="cp-sum" id="cpSum"></div>'}<div class="cp-medals" id="cpMedals"></div>
  ${fin?'':'<h3 class="cp-h3">📡 Klasemen Langsung</h3>'}
  <div class="cp-board"><div class="cp-bh">${HEAD7}</div><div id="cpRows"></div></div>
  ${fin?'':'<div class="tg4-note" style="margin-top:12px">Posisi berubah langsung saat siswa menjawab. Skor ronde = 100 poin jika level selesai + bonus kecepatan (maks. +100). Jika waktu habis, skor sesuai progres. Urutan: skor tertinggi, lalu waktu tercepat.</div>'}
  <div class="tg4-actions">${fin?'<button id="cpToScores" class="btn btn-primary">🏆 Lihat Nilai Siswa</button><button id="cpNew" class="btn btn-outline">Buat Room Baru</button>':'<button id="cpEnd" class="btn btn-outline">⏹ Akhiri Sekarang</button>'}</div></div></div>`;
  const go=n=>document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext="'+n+'"]')?.click();
  const on=(id,fn)=>{const e=$(id);if(e)e.onclick=fn};
  on('cpEnd',()=>{if(!confirm('Akhiri permainan sekarang? Skor yang sudah masuk tetap disimpan.'))return;const rs=rooms(),x=rs[r.code];if(!x)return;x.status='finished';x.finishedAt=Date.now();(x.players||[]).forEach(p=>{p.finished=true;p.score=(p.score||0)+(p.live||0);p.live=0});saveRooms(rs);window.__cpLivePanel(host,x,s)});
  on('cpNew',()=>{sessionStorage.removeItem('cerdasPlayTeacherQuizRoom:'+s.id);go('room')});
  on('cpToScores',()=>go('scores'));
}
window.__cpLivePanel=function(host,r,s){
  let root=host.querySelector('#cpLiveRoot');
  if(!root||root.dataset.code!==r.code||root.dataset.st!==r.status){liveBuild(host,r,s)}
  teacherCount(r);
  const pl=r.players||[],rk=rank(pl),fin=r.status==='finished';
  const sum=$('cpSum');
  if(sum){const done=pl.filter(p=>p.finished).length,sc=pl.map(eff);
    sum.innerHTML=`<div><small>PEMAIN</small><b>${pl.length}</b></div><div><small>SUDAH SELESAI</small><b>${done}/${pl.length}</b></div><div><small>RATA-RATA SKOR</small><b>${sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):0}</b></div><div><small>SKOR TERTINGGI</small><b>${Math.max(0,...sc)}</b></div>`}
  const top=(fin?rk:rk.filter(p=>eff(p)>0)).slice(0,3),med=$('cpMedals');
  if(!top.length){med.innerHTML=''}
  else{if(!med.querySelector('.cp-medal'))med.innerHTML='';
    sync(med,top.map(p=>({id:p.id,p})),()=>document.createElement('div'),(e,it)=>{const i=top.findIndex(t=>t.id===it.id);e.className='cp-medal m'+(i+1);e.innerHTML=medalCard(it.p,i)},'x')}
  sync($('cpRows'),rk.map(p=>({id:p.id,p})),()=>document.createElement('div'),(e,it,i)=>{
    e.className='cp-brow '+(i<3?'r'+(i+1):'');e.innerHTML=rowHtml(it.p,i,r)},'y');
};

/* ================= SISWA: hasil (hanya juara 1-3 + posisi sendiri) ================= */
window.__cpStudentResult=function(r){
  const s=sess();if(!s)return;
  const modal=$('quizRoomModalV2'),box=$('quizRoomLobbyV2');if(!modal||!box)return;
  modal.classList.remove('hidden');$('quizRoomJoinV2')?.classList.add('hidden');$('quizPlayOverlayV2')?.classList.add('hidden');box.classList.remove('hidden');
  const pl=r.players||[],rk=rank(pl),pos=rk.findIndex(p=>p.id===s.id)+1,me=rk[pos-1]||{},done=r.status==='finished',left=pl.filter(p=>!p.finished).length;
  const html=`<div class="room-vnext-result"><div style="font-size:3rem">${done?(pos>=1&&pos<=3?MED[pos-1]:'🏁'):'⏳'}</div><h2>${done?'Room Selesai':'Kamu sudah selesai!'}</h2><p class="cp-mypos">${done?'Kamu juara':'Posisimu sementara'} <strong>ke-${pos}</strong> dari ${pl.length} siswa</p><div class="cp-myscore"><span class="cp-av">${me.avatar||'👤'}</span><b>${esc(me.name||s.name)}</b><small>Skor <strong>${me.score||0}</strong></small></div>${done?'':`<p class="cp-wait">Menunggu ${left} teman lagi menyelesaikan semua ronde…</p>`}${done?'<button id="cpBackRoom" class="btn btn-primary" style="margin-top:12px">Kembali</button>':''}</div>`;
  if(box.dataset.cpH!==html){box.dataset.cpH=html;box.innerHTML=html;
    const b=$('cpBackRoom');if(b)b.onclick=()=>{sessionStorage.removeItem('cerdasPlayStudentQuizRoom:'+s.id);box.dataset.cpH='';modal.classList.add('hidden')}}
};

/* ================= SISWA: runner room (memainkan game asli) ================= */
const OUT=['levelOutcomeModal','timeoutModalV3','cp5Outcome','lgOutcome','ttOutcome'];
const OUT_OF={math:['levelOutcomeModal','timeoutModalV3','cp5Outcome'],logic:['lgOutcome'],picture:['ttOutcome']};
/* ---- penjaga popup: selama/sesudah Join Room, popup "Waktu Habis"/"Level berikutnya" game mandiri tidak boleh muncul ---- */
let guardUntil=0,inTransition=false; /* inTransition: popup antar ronde sedang tampil -> ronde berikutnya belum boleh dimulai */
function guardOn(){guardUntil=Date.now()+90000;document.body.classList.add('cp-room-guard')}
function guardOff(){guardUntil=0;document.body.classList.remove('cp-room-guard')}
function stopAll(){try{window.__upStopAllTimers&&window.__upStopAllTimers()}catch(e){}}
setInterval(()=>{
  if(!guardUntil)return;
  if(Date.now()>guardUntil){guardOff();return}
  const pg=document.querySelector('.app-view:not(.hidden)');
  /* siswa sudah membuka game mandiri sendiri setelah room selesai -> penjaga dimatikan */
  if(!RR.running&&!starting&&!counting&&!$('cpRoomInter')&&pg&&/(Game|Page)$/.test(pg.id)&&!/Levels/.test(pg.id)&&pg.id!=='studentDashboard'&&!document.body.classList.contains('cp-room-mode')){guardOff();return}
  const stale=!RR.running||RR.reported;
  OUT.forEach(id=>{const e=$(id);if(!e||e.classList.contains('hidden'))return;
    if(stale||!(OUT_OF[RR.game]||OUT).includes(id)){e.classList.add('hidden');stopAll()}});
},120);
const POPS=['cpRulesModal','lgRulesModal','ttRulesModal','cpExitModal','lgExitModal','ttExitModal'];
const EXC=/^(cerdasPlayQuizRoomsV2|cerdasPlayRoomNotifsV1|cerdasPlayStudents|cerdasPlayStudentJabatan|cerdasPlayAdmin|cerdasPlayRoomNotifSeen|cerdasPlayPvp|cerdasPlayLocalPvp|cerdasPlay:\d[A-D]:)/;
let RR={running:false,reported:false,idx:0,code:'',snap:null},starting=false,sid='';
const mine=k=>k.startsWith('cerdasPlay')&&!EXC.test(k)&&(k.includes(sid)||/Level\d|Stars|logic|math|picture|tebak|score/i.test(k));
function takeSnap(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(mine(k))o[k]=localStorage.getItem(k)}return o}
function restore(sn){if(!sn)return;Object.keys(localStorage).forEach(k=>{if(mine(k)&&!(k in sn))localStorage.removeItem(k)});Object.keys(sn).forEach(k=>{if(localStorage.getItem(k)!==sn[k])localStorage.setItem(k,sn[k])})}
const vis=e=>{if(!e||e.classList.contains('hidden'))return false;const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>0&&b.height>0};
function hideOutcomes(){OUT.forEach(id=>{const e=$(id);if(e)e.classList.add('hidden')});POPS.forEach(id=>$(id)?.classList.remove('cp-show'))}
function hud(r,me,idx){
  let h=$('cpRoomHud');if(!h){h=document.createElement('div');h.id='cpRoomHud';document.body.appendChild(h)}
  h.innerHTML=`🎯 Room ${esc(r.code)} <span>•</span> Ronde <b>${Math.min(idx+1,r.sequence.length)}/${r.sequence.length}</b> <span>•</span> Skor <b>${me.score||0}</b>`;
}
function inter(html,ms,cb){let o=$('cpRoomInter');if(!o){o=document.createElement('div');o.id='cpRoomInter';document.body.appendChild(o)}o.innerHTML='<div>'+html+'</div>';setTimeout(()=>{o.remove();cb()},ms)}
function endRun(){stopAll();guardOn();RR.running=false;starting=false;window.__cpRoomBusy=false;document.body.classList.remove('cp-room-mode');$('cpRoomHud')?.remove();$('cpRoomInter')?.remove()}
function abort(r){
  inTransition=false;
  hideOutcomes();restore(RR.snap);endRun();
  try{window.showPage(homePageForSession())}catch(e){}
  if(r&&r.status==='finished')window.__cpStudentResult(r);
}
function finishRun(r){endRun();try{window.showPage(homePageForSession())}catch(e){}window.__cpStudentResult(r)}
function launchGame(q){
  if(q.game==='math'){window.showPage('levels');setTimeout(()=>window.__cpLaunchMath&&window.__cpLaunchMath(q.level),60)}
  else if(q.game==='logic')window.__lgLogika.begin(q.level);
  else window.__ttTebak.begin(q.level);
}
function doStartRound(){
  const s=sess();if(!s||starting)return;const r=rooms()[rcode(s)];if(!r||r.status!=='playing')return;
  const me=(r.players||[]).find(p=>p.id===s.id);if(!me||me.finished)return;
  const idx=me.roundIndex||0,q=(r.sequence||[])[idx];if(!q)return;
  starting=true;sid=s.id;
  RR={running:true,reported:false,idx,code:r.code,game:q.game,snap:takeSnap(),liveF:0,d0:0};guardOn();
  window.__cpRoomBusy=true;document.body.classList.add('cp-room-mode');
  $('quizRoomModalV2')?.classList.add('hidden');$('quizPlayOverlayV2')?.classList.add('hidden');hideOutcomes();
  hud(r,me,idx);
  if(window.__upGameOn&&!window.__upGameOn(r.className||s.className,q.game)){RR.reported=true;report(0,false,0,0,q);return}
  launchCover();launchGame(q);skipRules();
}
/* Penutup saat berpindah ke halaman permainan: halaman menu level tidak sempat terlihat (tidak glitch) */
function launchCover(){
  let c=$('cpLaunchCover');
  if(!c){c=document.createElement('div');c.id='cpLaunchCover';c.innerHTML='<div><span class="cpl-dot"></span><b>Memulai ronde…</b></div>';document.body.appendChild(c)}
  const t0=Date.now();
  const iv=setInterval(()=>{
    const v=document.querySelector('.app-view:not(.hidden)');
    const ok=v&&!/^(mathLevelsPage|lgLevelsPage|ttLevelsPage|studentDashboard|landingPage|levelsPage)$/.test(v.id);
    if(ok||Date.now()-t0>2500){clearInterval(iv);setTimeout(()=>{const cd=$('cpRoomCount');if(cd){cd.classList.add('out');setTimeout(()=>cd.remove(),260)}c.classList.add('out');setTimeout(()=>c.remove(),260)},160)}
  },40);
}
function skipRules(){
  let n=0;const iv=setInterval(()=>{n++;if(!RR.running||n>40){clearInterval(iv);return}
    [['cpRulesModal','cpRulesStart'],['lgRulesModal','lgRulesStart'],['ttRulesModal','ttRulesStart']].forEach(([m,b])=>{const e=$(m);if(e&&e.classList.contains('cp-show')){const x=$(b);if(x)x.click()}});
    const tm=$('gameTutorialModal');if(tm&&!tm.classList.contains('hidden')){const x=[...tm.querySelectorAll('button')].find(b=>/mengerti|mulai/i.test(b.textContent));if(x)x.click()}
  },100);
}
let counting=false;
function startRound(){
  const s=sess();if(!s||starting||counting)return;const r=rooms()[rcode(s)];if(!r||r.status!=='playing')return;
  const me=(r.players||[]).find(p=>p.id===s.id);if(!me||me.finished)return;
  const wait=(me.roundIndex||0)===0&&r.startedAt?r.startedAt+CD_MS-Date.now():0;
  if(wait>0&&wait<=CD_MS+600){
    counting=true;window.__cpRoomBusy=true;
    $('quizRoomModalV2')?.classList.add('hidden');$('quizPlayOverlayV2')?.classList.add('hidden');
    countOverlay('cpRoomCount',r,'Bersiap! Permainan dimulai dalam…');
    setTimeout(()=>{counting=false;window.__cpSkipCD=true;setTimeout(()=>{window.__cpSkipCD=false},3000);doStartRound()},wait);
    return;
  }
  window.__cpSkipCD=false;doStartRound();
}
/* ----- progres langsung dalam ronde (agar klasemen guru naik-turun saat siswa mengerjakan) ----- */
function mazeFrac(){
  const g=$('mazeGrid');if(!g||!g.children.length)return null;
  const cs=[...g.children],n=Math.round(Math.sqrt(cs.length));let ps=null,gl=null;const w=[];
  for(let r=0;r<n;r++){w.push([]);for(let c=0;c<n;c++){const e=cs[r*n+c];w[r].push(e.classList.contains('wall'));if(e.classList.contains('player'))ps=[r,c];if(e.classList.contains('goal'))gl=[r,c]}}
  if(!ps||!gl)return null;
  const d=Array.from({length:n},()=>Array(n).fill(-1));d[ps[0]][ps[1]]=0;const q=[ps];
  for(let k=0;k<q.length;k++){const [r,c]=q[k];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=r+a,y=c+b;if(x>=0&&y>=0&&x<n&&y<n&&!w[x][y]&&d[x][y]<0){d[x][y]=d[r][c]+1;q.push([x,y])}}}
  const dist=d[gl[0]][gl[1]];if(dist<0)return null;
  if(!RR.d0)RR.d0=Math.max(1,dist);
  return Math.max(0,1-dist/RR.d0);
}
function frac(){
  const pg=document.querySelector('.app-view:not(.hidden)');if(!pg)return null;
  if(pg.id==='mathMazePage')return mazeFrac();
  const t=pg.innerText||'';let m;
  if(m=/Posisi\s*(\d+)\s*\/\s*(\d+)/i.exec(t))return (m[1]-1)/Math.max(1,m[2]-1);
  if(m=/Pasangan:?\s*(\d+)\s*\/\s*(\d+)/i.exec(t))return m[1]/m[2];
  if(m=/Kata benar\s*(\d+)\s*\/\s*(\d+)/i.exec(t))return m[1]/m[2];
  if(m=/KUNCI\s*(\d+)\s*\/\s*(\d+)/i.exec(t))return (m[1]-1)/m[2];
  const tot=/Soal\s*(\d+)\s*\/\s*(\d+)/i.exec(t),ok=/Soal Benar\s*(\d+)/i.exec(t);
  if(tot&&ok)return ok[1]/tot[2];
  return null;
}
function liveTick(r){
  const f=frac();if(f==null||isNaN(f))return;
  const v=Math.max(RR.liveF||0,Math.min(.99,Math.max(0,f)));RR.liveF=v;
  const lv=Math.round(v*90),rs=rooms(),x=rs[RR.code],s=sess();if(!x||x.status!=='playing'||!s)return;
  const me=(x.players||[]).find(p=>p.id===s.id);if(!me||(me.live||0)===lv)return;
  me.live=lv;saveRooms(rs);
}
function report(pts,ok,used,cnt,skipped){
  const s=sess(),rs=rooms(),r=rs[RR.code];
  if(!r||r.status!=='playing'){abort(r);return}
  const me=(r.players||[]).find(p=>p.id===s.id);if(!me){abort(r);return}
  const total=r.sequence.length;
  me.score=(me.score||0)+pts;me.live=0;me.roundIndex=RR.idx+1;me.roundsOk=(me.roundsOk||0)+(ok?1:0);me.roundsFail=(me.roundsFail||0)+(ok?0:1);
  me.totalTime=(me.totalTime||0)+used;me.correct=(me.correct||0)+cnt;me.lastAnswerAt=Date.now();
  if(me.roundIndex>=total)me.finished=true;
  if(r.players.every(p=>p.finished)){r.status='finished';r.finishedAt=Date.now()}
  stopAll();hideOutcomes();inTransition=true;
  saveRooms(rs);restore(RR.snap);RR.running=false;guardOn();
  const nq=r.sequence[me.roundIndex];
  /* tahap 1: ronde selesai  ->  tahap 2: ronde berikutnya (tanpa popup aturan) */
  const rn=RR.idx+1;
  inter(`<div class="cpi-ic">${skipped?'⏸️':ok?'✅':'⏰'}</div><h2>Ronde ${rn} ${skipped?'dilewati':'selesai'}</h2><p class="cpi-sub">${skipped?esc(skipped.gameName)+' sedang dinonaktifkan untuk kelasmu oleh admin, jadi ronde ini tidak dimainkan.':ok?'Level berhasil diselesaikan.':'Waktu habis. Skor dihitung dari progresmu.'}</p><div class="pts">+${pts}</div><p>Skor kamu sekarang: <b>${me.score}</b></p>${me.finished?'':`<small class="cpi-next">Ronde berikutnya segera dimulai…</small>`}`,2000,()=>{
    starting=false;const l=rooms()[RR.code];
    if(me.finished||!l){inTransition=false;finishRun(l||r);return}
    if(l.status!=='playing'){inTransition=false;abort(l);return}
    /* tahap 2: ronde berikutnya + hitung mundur 3-2-1 (otomatis, siswa tidak perlu klik) */
    inter(`<div class="cpi-ic">${nq.icon}</div><small class="cpi-kick">Ronde ${me.roundIndex+1} dari ${total}</small><h2>${esc(nq.gameName)}</h2><p class="cpi-sub">Level ${nq.level} • waktu ${window.__upDurTxt?window.__upDurTxt(nq.game):"3 menit"}</p><div class="cpi-count" aria-live="assertive"><b>3</b></div>`,3000,()=>{
      inTransition=false;
      const l2=rooms()[RR.code];if(!l2||l2.status!=='playing'){abort(l2);return}
      window.__cpSkipCD=true;setTimeout(()=>{window.__cpSkipCD=false},3000);
      startRound();
    });
    let k=3;const cdv=setInterval(()=>{k--;const b=document.querySelector('#cpRoomInter .cpi-count b');if(!b||k<1){clearInterval(cdv);return}b.textContent=k;b.style.animation='none';void b.offsetWidth;b.style.animation=''},1000);
  });
}
function handleOutcome(el){
  RR.reported=true;
  const txt=el.innerText||el.textContent||'',fail=/waktu\s*habis/i.test(txt);
  let rem=0;const tb=document.querySelector('.app-view:not(.hidden) .cd-timebar strong'),tm=tb&&/(\d+):(\d+)/.exec(tb.textContent);
  const __D=(window.__upDur?window.__upDur(RR.game):60);
  if(tm&&!fail)rem=Math.min(__D,+tm[1]*60+ +tm[2]);
  const m=/(\d+)\s*(?:dari\s*\d+\s*)?(?:soal|pasangan|teka|benda|peribahasa|kata|tempat|ungkapan|kotak|petak|ronde|kode)/i.exec(txt),cnt=m?+m[1]:0;
  hideOutcomes();
  report(fail?Math.max(Math.min(60,cnt*10),Math.round((RR.liveF||0)*90)):100+Math.round(100*rem/__D),!fail,__D-rem,cnt);
}
function loop(){
  const s=sess();if(!s||s.role!=='student')return;
  const code=rcode(s),r=code&&rooms()[code];
  if(RR.running){
    if(!r||r.status!=='playing'){abort(r);return}
    /* hanya popup milik game ronde ini yang dihitung; popup dari game lain (timer basi) diabaikan */
    if(!RR.reported){for(const id of OUT_OF[RR.game]||OUT){const e=$(id);if(vis(e)){handleOutcome(e);return}}liveTick(r)}
    return;
  }
  if(r&&r.status==='playing'&&!starting&&!inTransition){const me=(r.players||[]).find(p=>p.id===s.id);if(me&&!me.finished)startRound()}
}
setInterval(loop,400);
document.addEventListener('keydown',e=>{if(document.body.classList.contains('cp-room-mode')&&e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault()}},true);
window.__cpRoomRun=function(){loop()};
})();
