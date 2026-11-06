(function(){
'use strict';
const $=id=>document.getElementById(id);
const sid=()=>window.currentSession?.id||'demo';
const K={
  math:{done:n=>`cerdasPlay:${sid()}:mathLevel${n}Completed`,fail:n=>`cerdasPlay:${sid()}:mathLevel${n}Failed`,stars:()=>`cerdasPlay${sid()}mathStars`},
  logic:{done:n=>`cerdasPlay:${sid()}:logicLevel${n}Completed`,fail:n=>`cerdasPlay:${sid()}:logicLevel${n}Failed`,stars:()=>`cerdasPlay${sid()}logicStars`}
};
const isDone=(g,n)=>localStorage.getItem(K[g].done(n))==='true';
const fails=(g,n)=>Number(localStorage.getItem(K[g].fail(n)))||0;
const starsOf=g=>{try{return JSON.parse(localStorage.getItem(K[g].stars())||'{}')||{}}catch(e){return {}}};
const STAR=k=>'★'.repeat(k)+'☆'.repeat(4-k);
function saveStarsFor(g,n,k){const d=starsOf(g);if(isDone(g,n))k=4;if((Number(d[n])||0)>=k&&!(isDone(g,n)&&d[n]!==4))return;d[n]=isDone(g,n)?4:Math.max(Number(d[n])||0,k);localStorage.setItem(K[g].stars(),JSON.stringify(d))}

/* ---------- kartu menu level ---------- */
const MATH_IDS={mathLevelCard1:1,level2Card:2,level3Card:3,level4Card:4,level5Card:5};
const grids=()=>[['math',document.querySelector('#mathLevelsPage .level-grid')],['logic',$('lgGrid')]];
const __upN=s=>String(s==null?'':s).replace(/[^\p{L}\p{N}★☆]+/gu,'');
const setText=(el,t)=>{if(el&&__upN(el.textContent)!==__upN(t))el.textContent=t};
const __upH=s=>String(s==null?'':s).replace(/\s(?:style|data-upzdk)="[^"]*"/g,'');
const setHTML=(el,h)=>{if(el&&__upH(el.innerHTML)!==__upH(h))el.innerHTML=h};
function levelOf(card,g){if(g==='math')return MATH_IDS[card.id]||0;const b=card.querySelector('[data-lg-play]');return b?+b.dataset.lgPlay:0}
function decorate(card,g,st){
  const n=levelOf(card,g);if(!n)return;
  const done=isDone(g,n),failed=!done&&fails(g,n)>0;
  const num=card.querySelector('.level-number');if(num&&num.textContent.trim()==='✓')setText(num,String(n));
  const btn=card.querySelector('button.btn');if(btn)setText(btn,btn.textContent.replace(/\s*✓\s*$/,''));
  const prev=card.querySelector('.game-preview');
  let stars=card.querySelector('.level-stars');
  if(!stars){stars=document.createElement('div');stars.className='level-stars';if(prev)prev.after(stars);else if(btn)btn.before(stars);else card.appendChild(stars)}
  const k=done?4:Math.max(0,Math.min(3,Number(st[n])||0));
  setHTML(stars,'Bintang: <span class="game-stars" aria-label="'+k+' dari 4 bintang">'+[1,2,3,4].map(i=>'<span class="'+(i<=k?'earned':'')+'">★</span>').join('')+'</span>');
  let tm=card.querySelector('.level-time');
  if(!tm){tm=document.createElement('div');tm.className='level-time';stars.after(tm)}
  setText(tm,'⏱ 3 menit');
  let bd=card.querySelector('.lv-status');
  if(!done&&!failed){if(bd)bd.remove()}
  else{
    if(!bd){bd=document.createElement('span');card.appendChild(bd)}
    const cls='lv-status '+(done?'done':'fail');if(bd.className!==cls)bd.className=cls;
    setText(bd,done?'Selesai':'Belum Selesai');
  }
  card.classList.toggle('lv-done',done);card.classList.toggle('lv-fail',failed);
}
const observers=[];
function apply(){
  grids().forEach(([g,grid])=>{if(!grid)return;
    /* level yang sudah selesai selalu tersimpan 4 bintang */
    const st=starsOf(g);let dirty=false;for(let n=1;n<=5;n++){if(isDone(g,n)&&st[n]!==4){st[n]=4;dirty=true}}
    if(dirty)localStorage.setItem(K[g].stars(),JSON.stringify(st));
    grid.querySelectorAll(':scope > .level-card').forEach(c=>decorate(c,g,st))});
  observers.forEach(o=>o.takeRecords());
}
let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply()})};
grids().forEach(([,grid])=>{if(!grid)return;const o=new MutationObserver(schedule);o.observe(grid,{childList:true,subtree:true,characterData:true});observers.push(o)});

/* ---------- gagal & bintang dari kemajuan ---------- */
function recordFail(g,n){if(!n||!K[g]||isDone(g,n))return;localStorage.setItem(K[g].fail(n),String(fails(g,n)+1));apply()}
window.__cpRecordFail=recordFail;
const PAGE_LV={snakeGamePage:1,memoryPage:2,crosswordGamePage:3,mathMazePage:4,safeCrackerPage:5};
function mathLvOnScreen(){for(const id in PAGE_LV){const e=$(id);if(e&&!e.classList.contains('hidden'))return PAGE_LV[id]}return 0}
let mazeStartDist=0;
function mazeDist(){
  const cells=[...document.querySelectorAll('#mazeGrid > .maze-cell')],n=Math.round(Math.sqrt(cells.length));if(!n)return 0;
  const P=cells.findIndex(c=>c.classList.contains('player')),G=cells.findIndex(c=>c.classList.contains('goal'));if(P<0||G<0)return 0;
  const dist=new Array(cells.length).fill(-1),q=[P];dist[P]=0;
  for(let i=0;i<q.length;i++){const v=q[i],r=Math.floor(v/n),c=v%n;if(v===G)return dist[v];
    [[r+1,c],[r-1,c],[r,c+1],[r,c-1]].forEach(([a,b])=>{if(a<0||b<0||a>=n||b>=n)return;const w=a*n+b;if(dist[w]<0&&!cells[w].classList.contains('wall')){dist[w]=dist[v]+1;q.push(w)}})}
  return 0;
}
function mathProgress(lv){
  if(lv===1){const m=/(\d+)\s*\/\s*25/.exec(($('positionText')||{}).textContent||'');return m?(Math.min(25,+m[1])-1)/24:0}
  if(lv===2)return (Number(($('memoryPairs')||{}).textContent)||0)/4;
  if(lv===3){const all=document.querySelectorAll('#crosswordGamePage .cw3-clue').length;return all?document.querySelectorAll('#crosswordGamePage .cw3-clue.done').length/all:0}
  if(lv===4){const d=mazeDist();return mazeStartDist>0?Math.max(0,1-d/mazeStartDist):0}
  if(lv===5)return ((window.__cpVault&&window.__cpVault.solved)||0)/5;
  return 0;
}
const partial=p=>Math.max(0,Math.min(3,Math.floor(p*4+1e-9)));
const origMaze=window.__startRequestedMaze;
if(typeof origMaze==='function'){window.__startRequestedMaze=function(){const r=origMaze.apply(this,arguments);mazeStartDist=mazeDist();return r}}
window.__progress45=()=>({maze:Math.round((Number(($('mazeScore')||{}).textContent)||0)/15),boss:(window.__cpVault&&window.__cpVault.solved)||0});

function starsRow(afterEl,id,k){
  if(!afterEl)return;let el=$(id);
  if(!el){el=document.createElement('div');el.id=id;el.className='level-outcome-stars cp-pstars';afterEl.after(el)}
  el.style.display=k==null?'none':'';el.textContent=k==null?'':STAR(k);
  el.setAttribute('aria-label',k==null?'':k+' dari 4 bintang');
}
function fixSuccessText(el){if(!el)return;const t=el.innerHTML.replace(/(mendapat(?:kan)?\s+)\d(\s+(?:dari\s+4\s+)?bintang)/gi,'$14$2');if(t!==el.innerHTML)el.innerHTML=t}
function fixSnakePanel(){
  const qt=$('questionText');if(!qt)return;
  let h=qt.innerHTML.replace(/⭐\s*\d\s*\/\s*4\s*bintang/g,'⭐ 4 / 4 bintang').replace(/\d(\s+dari\s+4\s+bintang)/g,'4$1');
  h=h.replace(/(<div class="game-result-stars">)[★☆]+(<\/div>)/g,'$1★★★★$2');if(h!==qt.innerHTML)qt.innerHTML=h;
  const gm=$('gameMessage');if(gm)fixSuccessText(gm);
}
function onShown(kind){
  if(kind==='tm'){
    const m=/Level\s*(\d)/.exec(($('tmLevel')||{}).textContent||''),lv=m?+m[1]:0;
    if(lv&&mathLvOnScreen()===lv){recordFail('math',lv);const k=partial(mathProgress(lv));saveStarsFor('math',lv,k);starsRow($('tmScore'),'tmStars',k)}
    else starsRow($('tmScore'),'tmStars',null);
    return;
  }
  if(kind==='cp5'){
    const lv=mathLvOnScreen(),timeout=/WAKTU HABIS/i.test(($('cp5Kicker')||{}).textContent||'');
    if(timeout){recordFail('math',lv);const k=partial(mathProgress(lv));saveStarsFor('math',lv,k);starsRow($('cp5Meta'),'cp5PStars',k)}
    else{starsRow($('cp5Meta'),'cp5PStars',null);const meta=$('cp5Meta');if(meta){const h=meta.innerHTML.replace(/[★☆]{4}/,'★★★★');if(h!==meta.innerHTML)meta.innerHTML=h}fixSuccessText($('cp5Text'));if(lv)saveStarsFor('math',lv,4)}
    apply();return;
  }
  if(kind==='lo'){
    const kick=($('levelOutcomeKicker')||{}).textContent||'',lv=mathLvOnScreen();
    if(/BERHASIL|SELESAI/i.test(kick)){const st=$('levelOutcomeStars');if(st)setText(st,'★★★★');fixSuccessText($('levelOutcomeText'));if(lv===1)fixSnakePanel();if(lv)saveStarsFor('math',lv,4);apply()}
    else if(/WAKTU HABIS/i.test(kick)&&lv)recordFail('math',lv);
  }
}
const watched=new Set();
function watch(id,kind){
  const el=$(id);if(!el||watched.has(el))return;watched.add(el);
  let vis=!el.classList.contains('hidden');
  new MutationObserver(()=>{const v=!el.classList.contains('hidden');if(v&&!vis)onShown(kind);vis=v}).observe(el,{attributes:true,attributeFilter:['class']});
}
function watchAll(){watch('timeoutModalV3','tm');watch('levelOutcomeModal','lo');watch('cp5Outcome','cp5')}
watchAll();new MutationObserver(watchAll).observe(document.body,{childList:true});
window.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#cpExitYes'))recordFail('math',mathLvOnScreen())},true);

const sp=window.showPage;
if(typeof sp==='function'){window.showPage=function(p){const r=sp.apply(this,arguments);if(p==='levels'||p==='logic'||p==='dashboard'){setTimeout(apply,0);setTimeout(apply,150)}return r}}
window.addEventListener('storage',apply);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
window.addEventListener('load',()=>setTimeout(apply,200));
window.__cpApplyLevelCards=apply;
})();
