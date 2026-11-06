(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const NAMES={math:{1:'Ular Tangga Pintar',2:'Memory Card Angka',3:'TTS Hitung-Hitungan',4:'Misi Soal Cerita',5:'Boss Matematika'},
 logic:{1:'Pemula',2:'Menengah',3:'Strategi',4:'Ahli',5:'Master'},
 picture:{1:'Jelajah',2:'Petualang',3:'Detektif',4:'Ahli',5:'Master'}};
const CARD={math:{icon:'🔢',title:'Perhitungan'},logic:{icon:'🧠',title:'Logika Sederhana'},picture:{icon:'🖼️',title:'Tebak-Tebakan'}};
const cardHtml=(g,sub,tag)=>`<div class="subject-card ${g} cp-card"><div class="subject-card-content"><div class="subject-icon">${CARD[g].icon}</div><span class="card-game-tag">${tag}</span><h2>${CARD[g].title}</h2><p>${sub}</p></div></div>`;

/* intro card menu tiap ronde */
window.__cpIntro=function(ch,r,done){
  const body=$('quizPlayBodyV2'),ov=$('quizPlayOverlayV2');if(!body||!ov){done();return}
  ov.classList.remove('hidden');let n=3;
  const paint=()=>{body.innerHTML=`<div class="cp-intro"><small>RONDE ${ch.round} / ${r.sequence.length}</small>${cardHtml(ch.game,'Level '+ch.level+' • '+NAMES[ch.game][ch.level],'RONDE '+ch.round)}<div class="cp-count">${n>0?n:'Mulai!'}</div><p>Bersiap… waktu ${window.__upDurTxt?window.__upDurTxt(ch.game):'3 menit'} mulai setelah hitungan selesai.</p></div>`};
  paint();
  const t=setInterval(()=>{n--;if(n<0){clearInterval(t);done();return}paint()},800);
};
window.__cpLobbyCards=function(r){
  const set=['math','logic','picture'].filter(g=>!window.__upGameOn||window.__upGameOn(r.className,g));
  const sub={math:'Ular Tangga, Memory Card, TTS, Soal Cerita, Boss',logic:'Pola, urutan, dan pemecahan masalah',picture:'Amati gambar dan tebak jawabannya'};
  return `<div class="cp-lobbycards"><strong>Permainan dalam ruang ini</strong><div class="cp-lc">${set.map(g=>cardHtml(g,sub[g],'GAME INTERAKTIF')).join('')}</div></div>`;
};

/* papan ular tangga (tampilan saja, logika game asli tidak dipakai) */
const LAD={3:10,6:15,9:18},SNK={14:8,19:12};
const coord=p=>{const i=p-1,b=Math.floor(i/5),inr=i%5,col=b%2===1?4-inr:inr;return{x:col*100+50,y:(4-b)*100+50}};
function ladder(s,e){const a=coord(s),b=coord(e),dx=b.x-a.x,dy=b.y-a.y,L=Math.sqrt(dx*dx+dy*dy),ox=-dy/L*15,oy=dx/L*15;
  let o=`<g><line x1="${a.x+ox}" y1="${a.y+oy}" x2="${b.x+ox}" y2="${b.y+oy}" stroke="#8c5526" stroke-width="12" stroke-linecap="round"/><line x1="${a.x-ox}" y1="${a.y-oy}" x2="${b.x-ox}" y2="${b.y-oy}" stroke="#8c5526" stroke-width="12" stroke-linecap="round"/>`;
  const st=Math.max(3,Math.floor(L/60));for(let i=1;i<st;i++){const t=i/st;o+=`<line x1="${a.x+ox+dx*t}" y1="${a.y+oy+dy*t}" x2="${a.x-ox+dx*t}" y2="${a.y-oy+dy*t}" stroke="#dca560" stroke-width="9" stroke-linecap="round"/>`}
  return o+'</g>'}
function snake(s,e,i){const a=coord(s),b=coord(e),mx=(a.x+b.x)/2+(i%2===0?70:-70),my=(a.y+b.y)/2+30;
  return `<g><path d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="#d63d4d" stroke-width="27" stroke-linecap="round"/><path d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="#ff7880" stroke-width="12" stroke-linecap="round" stroke-dasharray="5 24"/><circle cx="${a.x}" cy="${a.y}" r="29" fill="#ef5964"/><circle cx="${a.x-10}" cy="${a.y-6}" r="4.5" fill="#fff"/><circle cx="${a.x+10}" cy="${a.y-6}" r="4.5" fill="#fff"/><circle cx="${a.x-10}" cy="${a.y-6}" r="2.2" fill="#1d243e"/><circle cx="${a.x+10}" cy="${a.y-6}" r="2.2" fill="#1d243e"/></g>`}
function board(){
  let c='';for(let row=0;row<5;row++)for(let col=0;col<5;col++){const bt=4-row,inr=bt%2===0?col:4-col,p=bt*5+inr+1;c+=`<div class="cell${p===1?' start':''}${p===25?' finish':''}${LAD[p]?' cell-ladder':''}${SNK[p]?' cell-snake':''}">${p}</div>`}
  const svg=Object.entries(LAD).map(([a,b])=>ladder(+a,+b)).join('')+Object.entries(SNK).map(([a,b],i)=>snake(+a,+b,i)).join('');
  return `<div class="board-shell"><div class="board">${c}<svg class="board-svg" viewBox="0 0 500 500">${svg}</svg><div class="cp-token" id="cpToken" style="left:10%;top:90%">★</div></div></div><div class="cp-cap">Jawab benar untuk naik ke kotak 25!</div>`;
}
const mem=()=>`<div class="cp-mem" id="cpMem">${'<span>🃏</span>'.repeat(6)}</div><div class="cp-cap">Cocokkan kartu dengan jawaban yang benar!</div>`;
const TP=[0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,0,1,0,1,0];
const tts=()=>`<div class="cp-tts" id="cpTts">${TP.map(v=>v?'<span></span>':'<span class="d"></span>').join('')}</div><div class="cp-cap">Isi kotak dengan jawaban hitungan!</div>`;
const boss=()=>`<div class="cp-boss" id="cpBoss"><div class="face">👾</div><div class="hp"><i></i></div><small>Kalahkan bos dengan jawaban benar!</small></div>`;
const banner=(g,lv)=>`<div class="cp-banner ${g}"><span>${g==='logic'?'🧠':'🔍'}</span><div>${g==='logic'?'Tantangan Logika':'Tebak Apa Ini?'}<small>Level ${lv}: ${NAMES[g][lv]}</small></div></div>`;

window.__cpDecorate=function(ch,q){
  const body=$('quizPlayBodyV2'),qb=body&&body.querySelector('.question-box');if(!qb)return;
  const g=ch.game,lv=ch.level;
  const scene=g==='math'?((lv===1||lv===4)?board():lv===2?mem():lv===3?tts():boss()):banner(g,lv);
  const wrap=document.createElement('div');wrap.className='cp-grid '+(g==='math'?'two':'one');
  wrap.innerHTML=`<div class="cp-scene">${scene}</div>`;
  qb.parentNode.insertBefore(wrap,qb);wrap.appendChild(qb);
  window.__cpScene={g,lv};
};
window.__cpResult=function(ok){
  const sc=window.__cpScene;if(!sc||sc.g!=='math')return;
  if(sc.lv===1||sc.lv===4){const t=$('cpToken');if(t)(ok?[10,18,25]:[14,8]).forEach((p,i)=>setTimeout(()=>{const c=coord(p);t.style.left=c.x/5+'%';t.style.top=c.y/5+'%'},i*260))}
  else if(sc.lv===2){const m=$('cpMem');if(m){m.classList.add(ok?'ok':'bad');m.querySelectorAll('span').forEach(s=>s.textContent=ok?'⭐':'❌')}}
  else if(sc.lv===3){const t=$('cpTts');if(t){t.classList.toggle('cp-shake',!ok);if(ok)t.querySelectorAll('span:not(.d)').forEach(s=>s.textContent='✓')}}
  else{const b=$('cpBoss');if(b){b.querySelector('.face').textContent=ok?'💥':'😈';if(ok)b.querySelector('.hp i').style.width='0%';else b.classList.add('cp-shake')}}
};
})();
