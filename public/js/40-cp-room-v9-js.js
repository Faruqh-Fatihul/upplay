(function(){
'use strict';
const ROOM_KEY='cerdasPlayQuizRoomsV2',NOTIF_KEY='cerdasPlayRoomNotifsV1',GROUP_KEY='cerdasPlayPvpGroupScoresV4',LPVP_KEY='cerdasPlayLocalPvpScoresV3',DAY=864e5;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const sess=()=>{try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
const rooms=()=>{try{return JSON.parse(localStorage.getItem(ROOM_KEY)||'{}')}catch(e){return {}}};
const jget=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};

/* ---------- riwayat: semua yang lebih dari 24 jam dihapus ---------- */
function purge(){
  const now=Date.now();
  try{
    const n=jget(NOTIF_KEY,[]);if(Array.isArray(n)){const k=n.filter(x=>now-(x.ts||0)<DAY);if(k.length!==n.length)localStorage.setItem(NOTIF_KEY,JSON.stringify(k))}
    const g=jget(GROUP_KEY,[]);if(Array.isArray(g)){const k=g.filter(x=>now-(x.finishedAt||0)<DAY);if(k.length!==g.length)localStorage.setItem(GROUP_KEY,JSON.stringify(k))}
    const l=jget(LPVP_KEY,[]);if(Array.isArray(l)){const k=l.filter(x=>now-(x.lastPlayed||0)<DAY);if(k.length!==l.length)localStorage.setItem(LPVP_KEY,JSON.stringify(k))}
    for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);
      if(key&&key.indexOf('cerdasPlayRoomNotifSeen:')===0){const a=jget(key,[]);if(Array.isArray(a)){const k=a.filter(id=>{const t=+String(id).replace(/\D/g,'');return !t||now-t<DAY});if(k.length!==a.length)localStorage.setItem(key,JSON.stringify(k))}}}
  }catch(e){}
}
purge();setInterval(purge,30000);

/* ---------- tombol tempel kode room ---------- */
function clean(t){return String(t||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)}
function latestCode(s){
  const n=jget(NOTIF_KEY,[]),rs=rooms();
  const c=(Array.isArray(n)?n:[]).filter(x=>s&&x.className===s.className&&Date.now()-x.ts<DAY).sort((a,b)=>b.ts-a.ts).find(x=>rs[x.code]&&rs[x.code].status==='waiting');
  return c?c.code:'';
}
async function doPaste(){
  const i=$('quizRoomCodeV2'),er=$('quizRoomJoinErrorV2');if(!i)return;
  let t='';
  try{if(navigator.clipboard&&navigator.clipboard.readText)t=clean(await navigator.clipboard.readText())}catch(e){}
  if(t){i.value=t;if(er)er.textContent='';i.focus();return}
  const lc=latestCode(sess());
  i.focus();
  if(lc){i.value=lc;if(er)er.textContent='ℹ️ Clipboard tidak bisa dibaca browser, jadi kode terbaru dari notifikasi guru dimasukkan.';return}
  i.select();
  if(er)er.textContent='ℹ️ Browser belum mengizinkan baca clipboard. Tekan Ctrl+V (atau tekan lama lalu Tempel) pada kolom kode.';
}
window.addEventListener('click',function(e){
  const b=e.target&&e.target.closest&&e.target.closest('#quizRoomPasteV2');
  if(!b)return;e.preventDefault();e.stopImmediatePropagation();doPaste();
},true);
document.addEventListener('paste',function(e){
  const i=e.target;if(!i||i.id!=='quizRoomCodeV2')return;
  e.preventDefault();const t=clean((e.clipboardData||window.clipboardData).getData('text'));
  if(t){i.value=t;const er=$('quizRoomJoinErrorV2');if(er)er.textContent=''}
},true);
document.addEventListener('input',function(e){
  const i=e.target;if(i&&i.id==='quizRoomCodeV2'){const p=i.selectionStart,v=clean(i.value);if(v!==i.value){i.value=v;try{i.setSelectionRange(p,p)}catch(x){}}}
},true);

/* ---------- Nilai Siswa (guru): hasil tiap Room Game yang sudah selesai ---------- */
let selCode='';
window.__cpScoresExtra=function(host,s){
  const old=$('cpRoomHist');if(old)old.remove();
  const first=host.querySelector('.tg4-panel');if(!first||!window.__cpRoomFinalHtml)return;
  const list=Object.values(rooms()).filter(r=>r.className===s.className&&r.status==='finished'&&Date.now()-(r.finishedAt||r.createdAt||0)<DAY).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0));
  const p=document.createElement('div');p.className='tg4-panel';p.id='cpRoomHist';
  const fmt=r=>new Date(r.finishedAt||r.createdAt||Date.now()).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  const draw=()=>{
    const cur=list.find(r=>r.code===selCode)||list[0];
    p.innerHTML=`<h2>🎮 Hasil Room Game</h2><p>Tabel hasil setiap Join Room yang sudah selesai. Riwayat hanya ditampilkan 24 jam terakhir; akumulasi skor tiap siswa dari semua room tetap ada pada tabel Nilai individu di atas.</p>`+
      (cur?`${list.length>1?`<div class="cp-roomhist-sel"><select id="cpRoomHistSel">${list.map(r=>`<option value="${esc(r.code)}" ${r.code===cur.code?'selected':''}>Room ${esc(r.code)} • ${esc(fmt(r))} • ${(r.players||[]).length} siswa</option>`).join('')}</select></div>`:`<div class="tg4-note" style="margin-bottom:12px">Room ${esc(cur.code)} • ${esc(fmt(cur))}</div>`}${window.__cpRoomFinalHtml(cur)}`
        :'<div class="tg4-note">Belum ada Room Game yang selesai dalam 24 jam terakhir.</div>');
    const sel=p.querySelector('#cpRoomHistSel');if(sel)sel.onchange=()=>{selCode=sel.value;draw()};
  };
  draw();first.after(p);
};
})();
