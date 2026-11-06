(function(){
'use strict';
const $=id=>document.getElementById(id);
const page=$('safeCrackerPage');if(!page)return;
const old=page.querySelector('main.safe-shell');if(old){old.setAttribute('aria-hidden','true')}

/* ---- tampilan brankas ---- */
let ticks='',nums='';
for(let i=0;i<60;i++){const L=i%6===0;ticks+=`<line x1="100" y1="${L?9:12}" x2="100" y2="${L?23:19}" transform="rotate(${i*6} 100 100)" stroke="${L?'#eef3fa':'#93a4ba'}" stroke-width="${L?2.6:1.2}" stroke-linecap="round"/>`}
for(let d=0;d<10;d++)nums+=`<text x="100" y="41" transform="rotate(${d*36} 100 100)" text-anchor="middle" font-size="15" font-weight="900" fill="#f4f7fb" font-family="Nunito,Arial,sans-serif">${d}</text>`;
let grips='';for(let i=0;i<24;i++)grips+=`<line x1="100" y1="53" x2="100" y2="60" transform="rotate(${i*15} 100 100)" stroke="#2d3746" stroke-width="2.4" stroke-linecap="round"/>`;
const dialSVG=`<svg viewBox="0 0 200 200" aria-hidden="true"><defs>
 <radialGradient id="vdRing" cx="40%" cy="35%"><stop offset="0" stop-color="#55657c"/><stop offset="1" stop-color="#1c2533"/></radialGradient>
 <radialGradient id="vdKnob" cx="38%" cy="32%"><stop offset="0" stop-color="#f5f8fc"/><stop offset=".55" stop-color="#a9b5c5"/><stop offset="1" stop-color="#5d6a7c"/></radialGradient></defs>
 <circle cx="100" cy="100" r="97" fill="#10161f"/>
 <g class="vault-dial-rot" id="vaultDialRot"><circle cx="100" cy="100" r="92" fill="url(#vdRing)" stroke="#0b0f15" stroke-width="2"/>${ticks}${nums}
  <circle cx="100" cy="100" r="47" fill="url(#vdKnob)" stroke="#2b3542" stroke-width="2"/>${grips}
  <circle cx="100" cy="100" r="15" fill="#3a4555" stroke="#cfd8e3" stroke-width="2"/><rect x="97" y="58" width="6" height="22" rx="3" fill="#ffcf4a"/></g>
 <polygon points="90,-6 110,-6 100,9" fill="#ffcf4a" stroke="#7a5a10" stroke-width="1.5"/></svg>`;
const handleSVG=`<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="vhHub" cx="38%" cy="32%"><stop offset="0" stop-color="#f3f6fa"/><stop offset="1" stop-color="#6b7889"/></radialGradient></defs>
 ${[0,120,240].map(a=>`<g transform="rotate(${a} 50 50)"><rect x="46" y="8" width="8" height="42" rx="4" fill="#c4ceda" stroke="#4d5a6b" stroke-width="1.5"/><circle cx="50" cy="9" r="8.5" fill="url(#vhHub)" stroke="#4d5a6b" stroke-width="1.5"/></g>`).join('')}
 <circle cx="50" cy="50" r="15" fill="url(#vhHub)" stroke="#4d5a6b" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#3a4555"/></svg>`;
const BOLT_Y=[14,32,50,68,86];
const main=document.createElement('main');main.className='vault-main';main.id='vaultMain';
main.innerHTML=`
 <div class="vault-head"><h1>Level 5: Misteri Brankas Angka</h1><p>Pecahkan 5 kode untuk membuka 5 kunci brankas.</p></div>
 <div class="vault-layout">
  <section class="vault-stage" aria-label="Brankas">
   <div class="vault-frame" id="vaultFrame">
    <div class="vault-inside" aria-hidden="true"><div class="vault-shelf"><span>💰</span><span>💎</span><span>💰</span></div><div class="vault-shelf"><span>🪙</span><span>🏆</span><span>🪙</span></div></div>
    <div class="vault-doorwrap">
     ${BOLT_Y.map((y,i)=>`<div class="vault-bolt" data-bolt="${i}" style="top:${y-2.2}%"></div>`).join('')}
     <div class="vault-face">
      <span class="vault-rivet" style="left:3%;top:3%"></span><span class="vault-rivet" style="right:3%;top:3%"></span><span class="vault-rivet" style="left:3%;bottom:3%"></span><span class="vault-rivet" style="right:3%;bottom:3%"></span>
      <div class="vault-plate">UPPLAY·SAFE</div><div class="vault-lamp" id="vaultLamp"></div>
      <div class="vault-dial">${dialSVG}</div><div class="vault-handle">${handleSVG}</div>
     </div>
    </div>
   </div>
   <div class="vault-locks" id="vaultLocks">${[1,2,3,4,5].map(i=>`<span class="vault-lock" data-lock="${i-1}"><i>🔒</i>${i}</span>`).join('')}</div>
  </section>
  <aside class="vault-panel">
   <div class="vault-round"><span id="vaultRoundLbl">KUNCI 1 / 5</span><b class="vault-tier t1" id="vaultTier">Mudah</b></div>
   <div class="vault-q"><small>Pecahkan kode untuk membuka kunci ini:</small><div class="vault-expr" id="vaultExpr">—</div><p class="vault-hint" id="vaultHint"></p></div>
   <div class="vault-display" id="vaultDisplay" aria-live="polite"></div>
   <div class="vault-keypad" id="vaultKeypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" class="vault-key" data-vk="${n}">${n}</button>`).join('')}<button type="button" class="vault-key fn" data-vk="C">Hapus</button><button type="button" class="vault-key" data-vk="0">0</button><button type="button" class="vault-key fn" data-vk="B" aria-label="Hapus satu angka">⌫</button></div>
   <button type="button" class="vault-open" id="vaultOpen">🔓 Buka</button>
   <div class="vault-msg" id="vaultMsg">Masukkan hasilnya sebagai 4 digit, contoh 39 → 0039.</div>
  </aside>
 </div>`;
page.appendChild(main);

/* ---- soal: makin sulit dari kunci 1 ke kunci 5 ---- */
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function makeRounds(){
  const a1=R(12,48),b1=R(11,39);
  const a2=R(6,9),b2=R(6,12);
  const a3=R(4,9),b3=R(5,9),c3=R(12,40);
  const c4=R(4,9),q4=R(6,12),t4=c4*q4,a4=R(Math.ceil(t4*.3),Math.floor(t4*.7)),b4=t4-a4;
  const c5=R(12,25),b5=R(18,49),a5=b5+R(40,90),d5=R(105,480);
  return [
    {tier:'Mudah',t:1,q:`${a1} + ${b1}`,a:a1+b1,hint:'💡 Jumlahkan kedua angka.'},
    {tier:'Mudah',t:1,q:`${a2} × ${b2}`,a:a2*b2,hint:'💡 Ingat tabel perkalian.'},
    {tier:'Sedang',t:2,q:`${a3} × ${b3} + ${c3}`,a:a3*b3+c3,hint:'💡 Kerjakan perkalian lebih dulu, lalu tambahkan.'},
    {tier:'Sulit',t:3,q:`(${a4} + ${b4}) ÷ ${c4}`,a:q4,hint:'💡 Hitung isi kurung dulu, lalu bagi.'},
    {tier:'Sangat Sulit',t:4,q:`(${a5} − ${b5}) × ${c5} + ${d5}`,a:(a5-b5)*c5+d5,hint:'💡 Kurung dulu, lalu kali, terakhir tambah.'}
  ];
}

const V={qs:[],round:0,input:'',solved:0,busy:false,done:false,angle:0};
window.__cpVault=V;
const frame=$('vaultFrame'),lamp=$('vaultLamp'),disp=$('vaultDisplay'),msg=$('vaultMsg');
function say(t,c){msg.className='vault-msg'+(c?' '+c:'');msg.textContent=t}
function setLamp(c){lamp.className='vault-lamp'+(c?' '+c:'')}
function renderDisplay(){disp.innerHTML=[0,1,2,3].map(i=>V.input[i]!=null?`<span>${V.input[i]}</span>`:'<span class="empty">0</span>').join('')}
function render(){
  const q=V.qs[V.round];if(!q)return;
  $('vaultRoundLbl').textContent='KUNCI '+(V.round+1)+' / 5';
  const tr=$('vaultTier');tr.textContent=q.tier;tr.className='vault-tier t'+q.t;
  $('vaultExpr').textContent=q.q+' = ?';$('vaultHint').textContent=q.hint;
  renderDisplay();
  document.querySelectorAll('#vaultLocks .vault-lock').forEach((l,i)=>{l.classList.toggle('free',i<V.solved);l.classList.toggle('cur',i===V.round&&!V.done);l.querySelector('i').textContent=i<V.solved?'🔓':'🔒'});
  document.querySelectorAll('#vaultFrame .vault-bolt').forEach((b,i)=>b.classList.toggle('free',i<V.solved));
}
function spinTo(d){
  const target=-d*36,cur=V.angle;let delta=((cur-target)%360+360)%360;if(delta<90)delta+=360;
  V.angle=cur-delta;$('vaultDialRot').style.transform=`rotate(${V.angle}deg)`;
}
function overlayOpen(){
  if(document.querySelector('.cp-ov.cp-show'))return true;
  return ['timeoutModalV3','levelOutcomeModal','cp5Outcome'].some(id=>{const e=$(id);return e&&!e.classList.contains('hidden')})||!!document.querySelector('#countdownOverlay.active');
}
const blocked=()=>V.busy||V.done||window.__cpPaused||page.classList.contains('hidden')||overlayOpen();
function press(k){
  if(blocked())return;
  if(k==='C'){V.input='';setLamp('');renderDisplay();say('Kode dihapus. Masukkan lagi 4 digit.');return}
  if(k==='B'){V.input=V.input.slice(0,-1);renderDisplay();return}
  if(V.input.length>=4)return;
  V.input+=k;spinTo(+k);setLamp('typing');renderDisplay();
  if(V.input.length===4)say('Kode lengkap. Tekan 🔓 Buka.','warn');
}
function stopTimer(){try{window.__stopRequestedLevelTimer&&window.__stopRequestedLevelTimer()}catch(e){}}
function tryOpen(){
  if(blocked())return;
  if(V.input.length!==4){say('⚠️ Isi tepat 4 digit. Contoh: 39 → 0039.','warn');disp.classList.remove('bad');void disp.offsetWidth;disp.classList.add('bad');setTimeout(()=>disp.classList.remove('bad'),500);return}
  const q=V.qs[V.round];
  if(Number(V.input)===q.a){
    V.busy=true;V.solved++;setLamp('ok');disp.classList.add('ok');spinTo(0);
    say('🔓 Klik! Kunci '+V.solved+' terbuka.','ok');render();
    setTimeout(()=>{
      disp.classList.remove('ok');
      if(V.solved>=5){finale();return}
      V.round++;V.input='';setLamp('');render();V.busy=false;
      say('Kunci berikutnya lebih sulit. Masukkan 4 digit kodenya.');
    },800);
  }else{
    V.busy=true;setLamp('bad');disp.classList.add('bad');frame.classList.remove('shake');void frame.offsetWidth;frame.classList.add('shake');
    say('🔴 Kode salah. Soalnya tetap, coba lagi.','bad');
    setTimeout(()=>{disp.classList.remove('bad');V.input='';renderDisplay();setLamp('');V.busy=false},650);
  }
}
function finale(){
  V.done=true;V.busy=true;stopTimer();
  frame.classList.add('turning');say('🏆 Semua kunci terbuka! Pintu brankas dibuka...','ok');
  setTimeout(()=>frame.classList.add('open'),650);
  setTimeout(()=>{
    const sid=window.currentSession?.id||'demo';
    localStorage.setItem(`cerdasPlay:${sid}:mathLevel5Completed`,'true');
    try{window.saveStars&&window.saveStars(5,4)}catch(e){}
    try{window.markMathLevelDone&&window.markMathLevelDone(5)}catch(e){}
    try{window.saveStudentScore&&window.saveStudentScore('Misteri Brankas Angka Level 5',100)}catch(e){}
    try{window.updateDashboardProgress&&window.updateDashboardProgress()}catch(e){}
    try{window.__cpApplyLevelCards&&window.__cpApplyLevelCards()}catch(e){}
    if(typeof window.showRealLevelOutcome==='function')window.showRealLevelOutcome(5,'success','🏆 Level 5 Selesai!','Kelima kunci terbuka dan brankas berhasil dibuka. Misi selesai, kamu hebat!',4);
  },2100);
}
function start(){
  V.qs=makeRounds();V.round=0;V.input='';V.solved=0;V.busy=false;V.done=false;
  frame.classList.remove('open','turning','shake');setLamp('');
  render();say('Masukkan hasilnya sebagai 4 digit, contoh 39 → 0039.');
  try{window.showPage&&window.showPage('safeCracker')}catch(e){}
  document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('hidden',v!==page));
  window.scrollTo({top:0,behavior:'auto'});
  try{window.__startRequestedLevelTimer&&window.__startRequestedLevelTimer(5)}catch(e){}
}
window.__startRequestedSafe=start;
main.addEventListener('click',e=>{
  const k=e.target.closest&&e.target.closest('[data-vk]');if(k){press(k.dataset.vk);return}
  if(e.target.closest&&e.target.closest('#vaultOpen'))tryOpen();
});
window.addEventListener('keydown',e=>{
  if(page.classList.contains('hidden')||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(/^[0-9]$/.test(e.key)){e.preventDefault();press(e.key)}
  else if(e.key==='Backspace'){e.preventDefault();press('B')}
  else if(e.key==='Delete'){e.preventDefault();press('C')}
  else if(e.key==='Enter'){e.preventDefault();tryOpen()}
});
V.qs=makeRounds();render();
})();
