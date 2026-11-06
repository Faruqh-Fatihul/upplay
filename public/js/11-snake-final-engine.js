(function(){
  'use strict';

  const LADDERS = {3:8, 6:13, 11:18};
  const SNAKES  = {15:9, 21:14, 24:17};
  /* Setiap permainan baru (selesai maupun belum) tangga & ular diacak lagi.
     Aturan: 3–4 tangga naik (min. 1 baris), 3 ular turun (min. 1 baris), semua ujung berbeda,
     tidak memakai kotak 1 (start) dan 25 (finish). */
  function randomizeSnakeLayout(){
    const rnd=n=>Math.floor(Math.random()*n);
    for(let attempt=0;attempt<300;attempt++){
      const used=new Set([1,25]),L={},S={};let ok=true;
      const free=(lo,hi,skip)=>{const c=[];for(let i=Math.max(2,lo);i<=Math.min(24,hi);i++)if(!used.has(i)&&i!==skip)c.push(i);return c};
      const nl=3+rnd(2);
      for(let i=0;i<nl&&ok;i++){
        const as=free(2,19);if(!as.length){ok=false;break}
        const a=as[rnd(as.length)],bs=free(a+5,Math.min(a+13,24),a);if(!bs.length){ok=false;break}
        const b=bs[rnd(bs.length)];used.add(a);used.add(b);L[a]=b;
      }
      for(let i=0;i<3&&ok;i++){
        const hs=free(8,24);if(!hs.length){ok=false;break}
        const h=hs[rnd(hs.length)],ts=free(Math.max(2,h-13),h-5,h);if(!ts.length){ok=false;break}
        const t=ts[rnd(ts.length)];used.add(h);used.add(t);S[h]=t;
      }
      if(!ok)continue;
      Object.keys(LADDERS).forEach(k=>delete LADDERS[k]);Object.keys(SNAKES).forEach(k=>delete SNAKES[k]);
      Object.assign(LADDERS,L);Object.assign(SNAKES,S);return;
    }
  }

  const QUESTIONS = [
    {text:"12 × 4 = ...", answer:48},
    {text:"144 ÷ 12 = ...", answer:12},
    {text:"25 + 37 = ...", answer:62},
    {text:"90 − 36 = ...", answer:54},
    {text:"15 × 6 = ...", answer:90},
    {text:"72 ÷ 8 = ...", answer:9},
    {text:"125 + 75 = ...", answer:200},
    {text:"9 × 9 = ...", answer:81},
    {text:"250 − 125 = ...", answer:125},
    {text:"56 ÷ 7 = ...", answer:8}
  ];

  const HARD = [
    {text:"Luas persegi panjang 12 cm × 8 cm = ... cm²", answer:96},
    {text:"3/4 dari 120 = ...", answer:90},
    {text:"Keliling persegi sisi 15 cm = ... cm", answer:60},
    {text:"6 buku seharga Rp42.000. Harga 1 buku = ... rupiah", answer:7000},
    {text:"Rata-rata 12, 16, 20, 24 = ...", answer:18},
    {text:"2,5 jam = ... menit", answer:150}
  ];

  let state = {
    position:1, correct:0, question:null, questionType:"normal",
    diceUnlocked:false, moving:false, finished:false,
    timer:180, interval:null, runId:0
  };

  const $ = id => document.getElementById(id);

  function hideOldTimer(){
    try{ if(typeof window.stopLevelTimer==="function") window.stopLevelTimer(); }catch(e){}
    const old=$("gameTimer");
    if(old){ old.classList.remove("active"); old.style.display="none"; }
  }

  function ensureInlineTimer(){
    const panel=document.querySelector("#snakeGamePage .game-panel");
    if(!panel) return null;
    let box=$("snakeLevelTimer");
    if(!box){
      box=document.createElement("div");
      box.id="snakeLevelTimer";
      box.className="snake-level-timer";
      box.innerHTML='<span class="timer-label">⏱ WAKTU PENGERJAAN</span><strong class="timer-value" id="snakeLevelTimerText">03:00</strong>';
      const h2=panel.querySelector("h2");
      if(h2) h2.after(box); else panel.prepend(box);
    }
    return box;
  }

  function timerText(){
    const m=String(Math.floor(state.timer/60)).padStart(2,"0");
    const s=String(state.timer%60).padStart(2,"0");
    return m+":"+s;
  }

  function updateTimer(){
    const box=ensureInlineTimer();
    if(!box) return;
    $("snakeLevelTimerText").textContent=timerText();
    box.classList.toggle("warning",state.timer<=20 && state.timer>10);
    box.classList.toggle("danger",state.timer<=10);
  }

  function stopTimer(){
    if(state.interval){clearInterval(state.interval);state.interval=null;}
  }

  function timeout(){
    stopTimer();
    state.finished=true;
    state.diceUnlocked=false;
    state.moving=false;
    const roll=$("rollDiceBtn"); if(roll) roll.disabled=true;
    const check=$("checkAnswerBtn"); if(check) check.disabled=true;
    const input=$("answerInput"); if(input) input.disabled=true;
    setMessage("⏰ Waktu 3 menit habis. Permainan selesai. Coba lagi dari Level 1.", "warning");
    const label=$("questionLabel"); if(label) label.textContent="WAKTU HABIS";
    const text=$("questionText"); if(text) text.textContent="Kamu belum mencapai kotak 25.";
    if(window.showTimeoutPopup) window.showTimeoutPopup(1);
  }

  function startTimer(){
    stopTimer();
    state.timer=180;
    updateTimer();
    state.interval=setInterval(function(){
      if(state.finished) return;
      state.timer--;
      updateTimer();
      if(state.timer<=0) timeout();
    },1000);
  }

  function posToGrid(pos){
    const idx=pos-1;
    const rowFromBottom=Math.floor(idx/5);
    const colInRow=idx%5;
    const col=(rowFromBottom%2===0)?colInRow:4-colInRow;
    const row=4-rowFromBottom;
    return {row:row+1,col:col+1,x:col*100+50,y:row*100+50};
  }

  function buildBoard(){
    const board=$("snakeBoard");
    const svg=$("boardSvg");
    if(!board || !svg) return;

    board.querySelectorAll(".cell").forEach(c=>c.remove());

    for(let pos=1;pos<=25;pos++){
      const g=posToGrid(pos);
      const cell=document.createElement("div");
      cell.className="cell";
      cell.dataset.position=pos;
      cell.style.gridRow=String(g.row);
      cell.style.gridColumn=String(g.col);
      cell.innerHTML='<span class="cell-number">'+pos+'</span>';
      if(pos===1) cell.classList.add("start");
      if(pos===25) cell.classList.add("finish");
      if(LADDERS[pos]) cell.classList.add("cell-ladder");
      if(SNAKES[pos]) cell.classList.add("cell-snake");
      board.insertBefore(cell,svg);
    }

    const esc=s=>String(s);
    let out="";
    Object.entries(LADDERS).forEach(([a,b])=>{
      const p1=posToGrid(+a),p2=posToGrid(+b);
      const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.sqrt(dx*dx+dy*dy)||1;
      const ox=-dy/len*7,oy=dx/len*7;
      out+=`<g class="ladder-art">
        <line x1="${p1.x+ox}" y1="${p1.y+oy}" x2="${p2.x+ox}" y2="${p2.y+oy}" stroke="#b7791f" stroke-width="5" stroke-linecap="round"/>
        <line x1="${p1.x-ox}" y1="${p1.y-oy}" x2="${p2.x-ox}" y2="${p2.y-oy}" stroke="#d69e2e" stroke-width="5" stroke-linecap="round"/>
      `;
      for(let i=1;i<6;i++){
        const t=i/6, x=p1.x+(p2.x-p1.x)*t, y=p1.y+(p2.y-p1.y)*t;
        out+=`<line x1="${x+ox}" y1="${y+oy}" x2="${x-ox}" y2="${y-oy}" stroke="#8c5b17" stroke-width="3" stroke-linecap="round"/>`;
      }
      out+="</g>";
    });

    Object.entries(SNAKES).forEach(([a,b],i)=>{
      const p1=posToGrid(+a), p2=posToGrid(+b);
      const sign=i%2===0?1:-1;
      const dx=p2.x-p1.x, dy=p2.y-p1.y;
      const len=Math.sqrt(dx*dx+dy*dy)||1;
      const nx=-dy/len, ny=dx/len;
      const bend=32*sign;
      const c1x=p1.x+dx*.34+nx*bend, c1y=p1.y+dy*.34+ny*bend;
      const c2x=p1.x+dx*.70-nx*bend, c2y=p1.y+dy*.70-ny*bend;
      const headR=12;
      const tongueX=p1.x + (p1.x-p2.x)*0.16;
      const tongueY=p1.y + (p1.y-p2.y)*0.16;
      out+=`<g class="snake-art" aria-label="Ular dari kotak ${a} ke kotak ${b}">
        <path d="M ${p2.x} ${p2.y} C ${c2x} ${c2y} ${c1x} ${c1y} ${p1.x} ${p1.y}"
          fill="none" stroke="#7f1d1d" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity=".22"/>
        <path d="M ${p2.x} ${p2.y} C ${c2x} ${c2y} ${c1x} ${c1y} ${p1.x} ${p1.y}"
          fill="none" stroke="#ef4444" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M ${p2.x} ${p2.y} C ${c2x} ${c2y} ${c1x} ${c1y} ${p1.x} ${p1.y}"
          fill="none" stroke="#f87171" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 13" opacity=".8"/>
        <ellipse cx="${p1.x}" cy="${p1.y}" rx="${headR}" ry="${headR*.82}" fill="#dc2626" stroke="#7f1d1d" stroke-width="2.5"/>
        <circle cx="${p1.x-4}" cy="${p1.y-3}" r="2.5" fill="white"/>
        <circle cx="${p1.x+4}" cy="${p1.y-3}" r="2.5" fill="white"/>
        <circle cx="${p1.x-4}" cy="${p1.y-3}" r="1.2" fill="#111827"/>
        <circle cx="${p1.x+4}" cy="${p1.y-3}" r="1.2" fill="#111827"/>
        <path d="M ${p1.x} ${p1.y+4} Q ${p1.x+sign*4} ${p1.y+7} ${tongueX} ${tongueY}"
          fill="none" stroke="#991b1b" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M ${tongueX} ${tongueY} l ${sign*4} ${-3} M ${tongueX} ${tongueY} l ${sign*4} ${3}"
          fill="none" stroke="#991b1b" stroke-width="1.5" stroke-linecap="round"/>
      </g>`;
    });
    svg.innerHTML=out;
  }

  function moveToken(pos){
    const g=posToGrid(pos);
    const token=$("playerToken");
    if(token){
      token.style.left=(g.x/5)+"%";
      token.style.top=(g.y/5)+"%";
    }
    const p=$("positionText"); if(p) p.textContent=state.position+" / 25";
    const c=$("correctText"); if(c) c.textContent=state.correct;
  }

  function setMessage(message,type){
    const el=$("gameMessage");
    if(!el)return;
    el.textContent=message;
    if(type==="success"){el.style.background="#e8faef";el.style.color="#16713c";}
    else if(type==="error"){el.style.background="#fff0f0";el.style.color="#b4232b";}
    else if(type==="warning"){el.style.background="#fff6df";el.style.color="#9a5b00";}
    else {el.style.background="#f4f5fb";el.style.color="#545b7a";}
  }

  function showQuestion(type){
    state.questionType=type;
    const pool=type==="hard"?HARD:QUESTIONS;
    state.question=pool[Math.floor(Math.random()*pool.length)];
    const label=$("questionLabel"),text=$("questionText"),input=$("answerInput"),roll=$("rollDiceBtn");
    if(label) label.textContent=type==="hard"?"SOAL SULIT — KEPALA ULAR":"SOAL UNTUK MEMBUKA DADU";
    if(text) text.textContent=state.question.text;
    if(input){input.value="";input.disabled=false;}
    if(roll) roll.disabled=true;
    state.diceUnlocked=false;
  }

  function answer(){
    if(state.finished || state.moving || !state.question)return;
    const input=$("answerInput");
    if(!input || input.value.trim()===""){setMessage("Masukkan jawaban terlebih dahulu.","warning");return;}
    const value=Number(input.value);

    if(value===state.question.answer){
      if(state.questionType==="hard"){
        state.correct++;
        setMessage("✅ Benar! Kamu selamat dari ular dan tetap di kotak "+state.position+".","success");
        showQuestion("normal");
        return;
      }
      state.correct++;
      state.diceUnlocked=true;
      if($("rollDiceBtn")) $("rollDiceBtn").disabled=false;
      setMessage("✅ Jawaban benar. Dadu terbuka, sekarang kocok dadu.","success");
      input.value="";
    }else{
      if(state.questionType==="hard"){
        const tail=SNAKES[state.position];
        state.position=tail;
        moveToken(state.position);
        setMessage("🐍 Jawaban salah. Pion turun mengikuti ular ke kotak "+tail+".","error");
        setTimeout(()=>{if(!state.finished)showQuestion("normal");},500);
      }else{
        setMessage("❌ Belum tepat. Hitung lagi agar dadu terbuka.","error");
        input.focus();
      }
    }
  }

  function diceFace(n){
    try{
      if(typeof window.tampilkanDadu==="function") window.tampilkanDadu(n);
    }catch(e){}
    const d=$("diceDisplay");
    if(d){
      d.classList.remove("show-1","show-2","show-3","show-4","show-5","show-6");
      if(n)d.classList.add("show-"+n);
      const v=d.querySelector(".dice-value"); if(v)v.textContent=n||"?";
    }
  }

  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

  async function roll(){
    if(state.finished || state.moving || !state.diceUnlocked)return;
    state.moving=true;
    const rollBtn=$("rollDiceBtn"); if(rollBtn) rollBtn.disabled=true;
    diceFace(null);
    await sleep(220);

    const n=Math.floor(Math.random()*6)+1;
    diceFace(n);
    setMessage("🎲 Dadu menunjukkan "+n+". Pion bergerak...");

    const target=state.position+n;
    if(target>25){
      setMessage("🎲 Kamu mendapat "+n+". Langkah melewati 25, jadi pion tetap di kotak "+state.position+".","warning");
      state.moving=false;
      showQuestion("normal");
      return;
    }

    for(let p=state.position+1;p<=target;p++){
      state.position=p;
      moveToken(p);
      await sleep(180);
    }

    await sleep(220);

    if(state.position===25){
      finish();
      return;
    }

    if(LADDERS[state.position]){
      const from=state.position,to=LADDERS[state.position];
      setMessage("🪜 Tangga! Naik dari kotak "+from+" ke kotak "+to+".","success");
      await sleep(500);
      state.position=to;
      moveToken(to);
      await sleep(400);
      showQuestion("normal");
      state.moving=false;
      return;
    }

    if(SNAKES[state.position]){
      setMessage("🐍 Kepala ular! Jawab soal sulit. Benar = tetap, salah = turun.","warning");
      state.moving=false;
      showQuestion("hard");
      return;
    }

    state.moving=false;
    showQuestion("normal");
    setMessage("Posisi aman. Jawab soal berikutnya untuk membuka dadu.");
  }

  function finish(){
    stopTimer();
    state.finished=true;
    state.moving=false;
    state.diceUnlocked=false;
    if($("rollDiceBtn"))$("rollDiceBtn").disabled=true;
    if($("checkAnswerBtn"))$("checkAnswerBtn").disabled=true;
    if($("answerInput"))$("answerInput").disabled=true;

    const stars=state.correct>=8?4:state.correct>=6?3:state.correct>=4?2:1;
    try{
      if(typeof window.markMathLevelDone==="function") window.markMathLevelDone(1);
      if(typeof window.saveStudentScore==="function") window.saveStudentScore("Ular Tangga Level 1",stars*25);
      if(typeof window.updateDashboardProgress==="function") window.updateDashboardProgress();
      const sid=window.currentSession?.id||"demo";
      const key=`cerdasPlay${sid}mathStars`;
      const data=JSON.parse(localStorage.getItem(key)||"{}");
      data[1]=Math.max(data[1]||0,stars);
      localStorage.setItem(key,JSON.stringify(data));
    }catch(e){console.warn(e);}

    $("questionLabel").textContent="🏆 LEVEL 1 SELESAI";
    $("questionText").innerHTML=`Kamu mencapai kotak 25!<br><strong>⭐ ${stars} / 4 bintang</strong>`;
    setMessage("🎉 Selamat! Kotak 25 adalah finish. Level 2 sekarang dapat dimainkan.","success");
  }

  function reset(){
    hideOldTimer();
    state.runId++;
    stopTimer();
    state={position:1,correct:0,question:null,questionType:"normal",diceUnlocked:false,moving:false,finished:false,timer:180,interval:null,runId:state.runId};
    ensureInlineTimer();
    randomizeSnakeLayout();
    buildBoard();
    moveToken(1);
    if($("checkAnswerBtn"))$("checkAnswerBtn").disabled=false;
    if($("answerInput"))$("answerInput").disabled=false;
    showQuestion("normal");
    diceFace(null);
    setMessage("Jawab soal terlebih dahulu agar dadu terbuka.");
    const title=document.querySelector("#snakeGamePage .page-head h1");
    const sub=document.querySelector("#snakeGamePage .page-head p");
    if(title)title.textContent="Level 1: Ular Tangga Pintar";
    if(sub)sub.textContent="Jawab soal, buka dadu, lalu capai kotak 25 sebelum waktu habis.";
    startTimer();
  }

  function openGameAfterTutorial(){
    const modal=$("gameTutorialModal"), overlay=$("countdownOverlay");
    if(modal){modal.classList.add("hidden");modal.style.pointerEvents="none";}
    if(overlay){overlay.classList.remove("active");overlay.style.display="none";overlay.style.pointerEvents="none";}

    try{
      if(typeof window.showPage==="function")window.showPage("snake");
    }catch(e){console.warn(e);}

    document.querySelectorAll(".app-view").forEach(v=>v.classList.add("hidden"));
    const page=$("snakeGamePage");
    if(page)page.classList.remove("hidden");
    window.scrollTo({top:0,behavior:"auto"});

    requestAnimationFrame(()=>{
      reset();
      window.scrollTo({top:0,behavior:"auto"});
    });
  }

  function countdownAndStart(){
    const modal=$("gameTutorialModal"),overlay=$("countdownOverlay"),num=$("countdownNumber");
    if(window.__cpRoomBusy){if(modal){modal.classList.add("hidden");modal.style.pointerEvents="none";}openGameAfterTutorial();return;}
    if(modal){modal.classList.add("hidden");modal.style.pointerEvents="none";}
    if(!overlay){openGameAfterTutorial();return;}
    overlay.classList.add("active");
    overlay.style.display="grid";
    overlay.style.pointerEvents="auto";
    let n=3;
    function tick(){
      if(n<=0){openGameAfterTutorial();return;}
      if(num)num.textContent=n;
      n--;
      setTimeout(tick,850);
    }
    tick();
  }

  function bind(){
    const start=$("startTutorialGameBtn");
    if(start){
      start.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        const title=($("gameTutorialTitle")||{}).textContent||"";
        if(title.includes("Level 1") || window.__forceSnakeLevel1){
          countdownAndStart();
        }else{
          // Biarkan level 2/3 memakai engine tutorial lama.
          try{
            if(/Level\s*[45]/.test(title) && typeof window.__launchLevel45==="function"){ window.__launchLevel45(/Level\s*4/.test(title)?4:5); }
          else if(typeof window.__cerdasPlayOriginalTutorialStart==="function") window.__cerdasPlayOriginalTutorialStart(e);
          }catch(err){console.warn(err);}
        }
      };
    }

    // PENTING: tombol/input ini sudah punya listener lama dari skrip awal
    // (handleAnswer/rollDice versi papan 10x10). Kalau dibiarkan, klik "Jawab"
    // atau "Kocok Dadu" akan memproses DUA logika berbeda sekaligus (state ganda),
    // itulah penyebab alur permainan terasa salah/tidak konsisten. Kloning node
    // menghapus SEMUA listener lama sebelum engine final ini mengambil alih.
    function takeOverExclusively(id){
      const original=$(id);
      if(!original||original.dataset.snakeFinalOwned==="1")return original;
      const fresh=original.cloneNode(true);
      fresh.dataset.snakeFinalOwned="1";
      original.parentNode.replaceChild(fresh,original);
      return fresh;
    }

    const check=takeOverExclusively("checkAnswerBtn");
    const rollBtn=takeOverExclusively("rollDiceBtn");
    const input=takeOverExclusively("answerInput");

    if(check){check.onclick=function(e){e.preventDefault();answer();};}
    if(rollBtn){rollBtn.onclick=function(e){e.preventDefault();roll();};}
    if(input){input.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();answer();}};}

    const backs=["backToLevelsBtn","backToLevelsIconBtn","snakeHome"];
    backs.forEach(id=>{
      const el=$(id); if(!el)return;
      el.addEventListener("click",function(e){
        e.preventDefault();
        stopTimer();
        hideOldTimer();
      },true);
    });
  }

  function init(){
    bind();
    ensureInlineTimer();
    // Do not start the 1-minute timer while the tutorial/menu is open.
    stopTimer();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();

  window.__startSnake25Final=openGameAfterTutorial;
  window.__stopSnakeTimer=function(){stopTimer();};
})();
