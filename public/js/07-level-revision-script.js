(() => {
  const originalShowPage = window.showPage;
  const originalStartSnake = window.startSnakeGameBtn?.onclick;
  const tutorialModal = document.getElementById('gameTutorialModal');
  const tutorialTitle = document.getElementById('gameTutorialTitle');
  const tutorialText = document.getElementById('gameTutorialText');
  const tutorialRules = document.getElementById('gameTutorialRules');
  const startTutorialBtn = document.getElementById('startTutorialGameBtn');
  const countdown = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  let pendingLevel = null;
  let levelTimer = null;
  let allowGameLaunch = 0;
  let levelSeconds = 180;
  let activeGame = null;

  const tutorials = {
    1: { title:'Tutorial Level 1 — Ular Tangga 25', text:'Capai kotak finish 25 sebelum waktu 3 menit habis.', rules:['Jawab soal dengan benar untuk membuka dadu.','Kocok dadu dan gerakkan pion menuju kotak 25.','Tangga membantu naik, kepala ular memberi soal sulit.','Selesaikan level untuk mendapatkan hingga 4 bintang.'] },
    2: { title:'Tutorial Level 2 — Memory Card 3 × 3', text:'Temukan pasangan operasi hitung dan jawaban dalam papan 3 × 3.', rules:['Buka dua kartu pada setiap giliran.','Pasangkan operasi dengan hasil yang benar.','Selesaikan semua pasangan sebelum 3 menit habis.','Semakin sedikit langkah, semakin banyak bintang.'] },
    3: { title:'Tutorial Level 3 — TTS Hitung-Hitungan', text:'Isi jawaban hitungan dalam bentuk kata pada kotak mendatar dan menurun. Perhatikan huruf yang bersilangan.', rules:['Baca petunjuk Mendatar dan Menurun.','Tulis jawaban dalam bentuk kata, contoh 4 × 2 = DELAPAN.','Perhatikan huruf yang bertemu pada kotak persilangan.','Tekan Periksa Jawaban setelah semua kotak terisi.','Selesaikan sebelum 3 menit habis untuk mendapatkan hingga 4 bintang.'] }
  };

  function studentId(){ return window.currentSession?.id || 'demo'; }
  function starsFor(correct,total,finished){ if(!finished) return 0; const ratio=correct/total; if(ratio >= 1) return 4; if(ratio >= .75) return 3; if(ratio >= .5) return 2; return 1; }
  function starHTML(n){ return `<span class="game-stars" aria-label="${n} bintang">${[1,2,3,4].map(i=>`<span class="${i<=n?'earned':''}">★</span>`).join('')}</span>`; }
  function saveStars(level,stars){ const key=`cerdasPlay${studentId()}mathStars`; let data={}; try{data=JSON.parse(localStorage.getItem(key))||{}}catch(e){} data[level]=Math.max(data[level]||0,stars); localStorage.setItem(key,JSON.stringify(data)); renderStars(); }
  function renderStars(){ const key=`cerdasPlay${studentId()}mathStars`; let data={}; try{data=JSON.parse(localStorage.getItem(key))||{}}catch(e){} [1,2,3].forEach(level=>{ const card=document.getElementById(`mathLevelCard${level}`)||document.getElementById(`level${level}Card`); if(!card)return; let holder=card.querySelector('.level-stars'); if(!holder){ holder=document.createElement('div'); holder.className='level-stars'; const preview=card.querySelector('.game-preview'); if(preview) preview.after(holder); else card.appendChild(holder); } holder.innerHTML=`Bintang: ${starHTML(data[level]||0)}`; let time=card.querySelector('.level-time'); if(!time){time=document.createElement('div');time.className='level-time';time.textContent='⏱ 3 menit';holder.after(time);} }); }

  function stopLevelTimer(){ if(levelTimer) clearInterval(levelTimer); levelTimer=null; activeGame=null; }
  window.stopLevelTimer=stopLevelTimer; window.saveStars=saveStars; window.markMathLevelDone=(level)=>{ const sid=studentId(); localStorage.setItem(`cerdasPlay:${sid}:mathLevel${level}Completed`,"true"); };
  function updateTimerText(){ const text=`${String(Math.floor(levelSeconds/60)).padStart(2,'0')}:${String(levelSeconds%60).padStart(2,'0')}`; const global=document.getElementById('gameTimerText'); if(global) global.textContent=text; const cw=document.getElementById('crosswordTimeText'); if(cw && activeGame==='crossword') cw.textContent=text; }
  function startLevelTimer(game){ stopLevelTimer(); activeGame=game; levelSeconds=180; updateTimerText(); const global=document.getElementById('gameTimer'); if(global) global.classList.add('active'); levelTimer=setInterval(()=>{levelSeconds--;updateTimerText(); if(levelSeconds<=0){ stopLevelTimer(); const global2=document.getElementById('gameTimer'); if(global2)global2.classList.remove('active'); finishTimeout(game); }},1000); }
  function finishTimeout(game){ if(window.showTimeoutPopup){ window.showTimeoutPopup(game==='snake'?1:game==='memory'?2:3); return; }
    showLevelOutcome({
      type:'timeout',
      level: pendingLevel || (game==='snake'?1:game==='memory'?2:3),
      title:'⏰ Waktu Habis',
      text:'Semua soal belum terjawab. Mau mencoba level ini lagi atau kembali ke menu level?',
      primary:'Coba Lagi', secondary:'Kembali ke Menu Level'
    });
  }
  function countdownThen(callback){ if(window.__cpSkipCD||window.__cpRoomBusy){window.__cpSkipCD=false;try{callback()}catch(err){console.error(err)}return} countdown.style.display=''; countdown.style.pointerEvents='';
    countdown.classList.add('active');
    let n=3;
    function tick(){
      if(n<=0){
        countdown.classList.remove('active');
        countdown.style.display='none';
        requestAnimationFrame(()=>{
          countdown.style.display='';
          try{ callback(); }catch(err){
            console.error('Gagal membuka game setelah countdown:',err);
            if(pendingLevel===1) originalShowPage('snake');
            if(pendingLevel===2) originalShowPage('memory');
            if(pendingLevel===3) originalShowPage('crossword');
          }
        });
        return;
      }
      countdownNumber.textContent=n;
      countdownNumber.style.animation='none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation='countPulse .9s ease-in-out';
      n--;
      setTimeout(tick,850);
    }
    tick();
  }
  function openTutorial(level){ pendingLevel=level; tutorialModal.style.pointerEvents=''; tutorialModal.style.display=''; countdown.style.pointerEvents=''; countdown.style.display=''; countdown.classList.remove('active'); const t=tutorials[level]; tutorialTitle.textContent=t.title; tutorialText.textContent=t.text; tutorialRules.innerHTML=t.rules.map(r=>`<li>${r}</li>`).join(''); tutorialModal.classList.remove('hidden'); }
  function closeTutorial(){tutorialModal.classList.add('hidden');pendingLevel=null;}
  document.getElementById('closeTutorialBtn').onclick=closeTutorial;
  startTutorialBtn.onclick=()=>{ const level=pendingLevel; tutorialModal.classList.add('hidden'); countdownThen(()=>launchLevel(level)); };
  window.__cerdasPlayOriginalTutorialStart=startTutorialBtn.onclick;
  window.__replayLevel=function(lv){ pendingLevel=lv; countdownThen(()=>{ if(lv===1 && typeof window.__startSnake25Final==='function') window.__startSnake25Final(); else launchLevel(lv); }); };
  function launchLevel(level){
    // Buka game secara langsung. Jangan memanggil .click() pada tombol level,
    // karena tombol tersebut juga memiliki guard tutorial/capture listener.
    allowGameLaunch=0;
    try{
      if(level===1){
        if(typeof resetSnakeGame==='function') resetSnakeGame(1);
        originalShowPage('snake');
        startLevelTimer('snake');
        return;
      }
      if(level===2){
        if(typeof startMemoryGame==='function') startMemoryGame();
        originalShowPage('memory');
        startLevelTimer('memory');
        return;
      }
      if(level===3){
        if(typeof startCrossword==='function') startCrossword();
        originalShowPage('crossword');
        startLevelTimer('crossword');
        return;
      }
    }catch(err){
      console.error('launchLevel error:',err);
      if(level===1) originalShowPage('snake');
      if(level===2) originalShowPage('memory');
      if(level===3) originalShowPage('crossword');
    }
  }

  // Ubah tombol level 1-3 agar selalu melalui tutorial dan countdown.
  window.addEventListener('load',()=>{
    const l1=document.getElementById('startSnakeGameBtn'); const l2=document.getElementById('level2Btn'); const l3=document.getElementById('level3Btn');
    const guard=(btn,level)=>{ if(!btn) return; btn.addEventListener('click',(e)=>{ if(allowGameLaunch===level){ allowGameLaunch=0; return; } e.preventDefault(); e.stopImmediatePropagation(); openTutorial(level); },true); };
    guard(l1,1); guard(l2,2); guard(l3,3);
    renderStars();
  });

  // Ganti finish ular tangga menjadi kotak 25 dan beri akumulasi bintang.
  const oldProcess=window.processSpecialCell;
  window.processSpecialCell=function(){
    if(window.playerPosition===20){ window.playerPosition=25; window.updateTokenPosition?.(); }
    if(window.playerPosition===25){
      stopLevelTimer(); const stars=starsFor(window.correctAnswers||0,4,true); saveStars(1,stars);
      if(window.markMathLevelDone)window.markMathLevelDone(1);
      if(window.saveStudentScore)window.saveStudentScore('Ular Tangga Level 1',stars*25);
      if(window.updateDashboardProgress)window.updateDashboardProgress();
      const ql=document.getElementById('questionLabel'),qt=document.getElementById('questionText'),msg=document.getElementById('gameMessage');
      if(ql)ql.textContent='LEVEL 1 SELESAI'; if(qt)qt.innerHTML=`Finish kotak 25 tercapai!<div class="game-result-stars">${'★'.repeat(stars)}${'☆'.repeat(4-stars)}</div>`; if(msg)msg.textContent=`Kamu mendapat ${stars} dari 4 bintang.`; const rb=document.getElementById('rollDiceBtn');if(rb)rb.disabled=true; return;
    }
    return oldProcess?.apply(this,arguments);
  };

  // Board Level 1 harus 25 kotak (5x5) dan finish kotak 25.
  const oldCreate=window.createBoard;
  window.createBoard=function(){
    if(!document.getElementById('snakeBoard'))return oldCreate?.();
    const board=document.getElementById('snakeBoard'); const svg=document.getElementById('boardSvg'); board.querySelectorAll('.cell').forEach(c=>c.remove());
    const ladders={3:10,6:15,9:18}; const snakes={14:8,19:12};
    for(let row=0;row<5;row++) for(let col=0;col<5;col++){ const bottom=4-row; const inRow=bottom%2===0?col:4-col; const p=bottom*5+inRow+1; const cell=document.createElement('div'); cell.className='cell'; cell.textContent=p; if(p===1)cell.classList.add('start');if(p===25)cell.classList.add('finish');if(ladders[p])cell.classList.add('cell-ladder');if(snakes[p])cell.classList.add('cell-snake');board.insertBefore(cell,svg); }
    // SVG lama dibuat untuk koordinat 5 x 4; gambar sederhana tetap dipakai jika fungsi ada.
    if(svg){let content=''; if(window.drawLadder)Object.entries(ladders).forEach(([a,b])=>content+=window.drawLadder(+a,+b)); if(window.drawSnake)Object.entries(snakes).forEach(([a,b],i)=>content+=window.drawSnake(+a,+b,i)); svg.innerHTML=content;}
  };
  const oldCoord=window.getCoordinate;
  window.getCoordinate=function(position){ const idx=position-1,bottom=Math.floor(idx/5),inRow=idx%5,col=bottom%2===1?4-inRow:inRow; return {x:col*100+50,y:(4-bottom)*100+50}; };
  const oldUpdate=window.updateTokenPosition;
  window.updateTokenPosition=function(){ const c=window.getCoordinate(window.playerPosition); const token=document.getElementById('playerToken');if(token){token.style.left=c.x/5+'%';token.style.top=c.y/5+'%';} const pos=document.getElementById('positionText');if(pos)pos.textContent=`${window.playerPosition} / 25`; const corr=document.getElementById('correctText');if(corr)corr.textContent=window.correctAnswers; };

  // Memory Card 3x3: 9 pasang = 18 kartu, grid 3 kolom.
  const memoryStyle=document.createElement('style'); memoryStyle.textContent='#memoryBoard.memory-3x3{grid-template-columns:repeat(3,1fr)!important}#memoryBoard.memory-3x3 .memory-card{min-height:100px}';document.head.appendChild(memoryStyle);
  const memoryItems9=[
    ['6 × 7','42'],['8 × 9','72'],['144 ÷ 12','12'],['25 + 37','62'],['90 - 36','54'],['15 × 6','90'],['72 ÷ 8','9'],['125 + 75','200'],['9 × 9','81']
  ];
  window.startMemoryGame=function(){
    const board=document.getElementById('memoryBoard'); if(!board)return; board.classList.add('memory-3x3'); window.flippedCards=[];window.matchedPairs=0;window.memoryMoves=0;window.lockMemoryBoard=false;
    document.getElementById('memoryPairs').textContent='0'; document.getElementById('memoryMoves').textContent='0'; board.innerHTML='';
    let cards=[]; memoryItems9.forEach((x,i)=>{cards.push({pairId:i,content:x[0],type:'question'});cards.push({pairId:i,content:x[1],type:'answer'});}); cards.sort(()=>Math.random()-.5);
    cards.forEach(card=>{const b=document.createElement('button');b.className='memory-card';b.dataset.pairId=card.pairId;b.dataset.type=card.type;b.innerHTML=`<span class="memory-card-inner"><span class="memory-front">?</span><span class="memory-back">${card.content}</span></span>`;b.onclick=()=>memoryFlip(b);board.appendChild(b);});
  };
  function memoryFlip(card){ if(window.lockMemoryBoard||card.classList.contains('flipped')||card.classList.contains('matched'))return;card.classList.add('flipped');window.flippedCards.push(card);if(window.flippedCards.length!==2)return;window.memoryMoves++;document.getElementById('memoryMoves').textContent=window.memoryMoves;window.lockMemoryBoard=true;const[a,b]=window.flippedCards,ok=a.dataset.pairId===b.dataset.pairId&&a.dataset.type!==b.dataset.type;if(ok){setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');a.classList.add('matched');b.classList.add('matched');window.matchedPairs++;document.getElementById('memoryPairs').textContent=window.matchedPairs;window.flippedCards=[];window.lockMemoryBoard=false;if(window.matchedPairs===9){stopLevelTimer();const st=starsFor(Math.max(0,9-(window.memoryMoves-9)),9,true);saveStars(2,st);if(window.markMathLevelDone)window.markMathLevelDone(2);if(window.saveStudentScore)window.saveStudentScore('Memory Card Level 2',st*25);if(window.updateDashboardProgress)window.updateDashboardProgress();alert(`Hebat! Kamu menyelesaikan Memory Card 3 × 3 dan mendapat ${st} dari 4 bintang.`);}},420);}else{setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');window.flippedCards=[];window.lockMemoryBoard=false;},700);}}

  // TTS Level 3 — semua soal hanya penjumlahan/perkalian.
  // Pola dibuat seperti TTS nyata: jawaban MENDATAR dan MENURUN saling bersilangan pada huruf yang sama.
  // 1 Mendatar: 4 × 2 = DELAPAN
  // 2 Menurun : 1 + 1 = DUA (bersilang dengan DELAPAN pada huruf A)
  // 3 Menurun : 1 + 2 = TIGA (bersilang dengan DELAPAN pada huruf A)
  // 4 Mendatar: 2 + 3 = LIMA (bersilang dengan TIGA pada huruf I dan DUA pada huruf A)
  const cwWords=[
    {num:1,dir:'across',row:5,col:1,word:'DELAPAN', clue:'4 × 2 = ....'},
    {num:2,dir:'down',row:1,col:6,word:'DUA', clue:'1 + 1 = ....'},
    {num:3,dir:'down',row:2,col:4,word:'TIGA', clue:'1 + 2 = ....'},
    {num:4,dir:'across',row:3,col:3,word:'LIMA', clue:'2 + 3 = ....'}
  ];
  const cwGrid=Array.from({length:7},()=>Array(7).fill(null));
  cwWords.forEach(w=>[...w.word].forEach((ch,i)=>{const r=w.row+(w.dir==='down'?i:0),c=w.col+(w.dir==='across'?i:0);if(r<7&&c<7)cwGrid[r][c]=(cwGrid[r][c]||'')+ch;}));
  function startCrossword(){ const board=document.getElementById('crosswordBoard');board.innerHTML='';document.getElementById('crosswordFeedback').textContent='Isi seluruh kotak, lalu tekan Periksa Jawaban.';document.getElementById('crosswordCorrect').textContent='0 / 4'; for(let r=0;r<7;r++)for(let c=0;c<7;c++){const cell=document.createElement('div');cell.className='crossword-cell';if(!cwGrid[r][c]){cell.classList.add('block');}else{const input=document.createElement('input');input.maxLength=1;input.dataset.row=r;input.dataset.col=c;input.addEventListener('input',()=>{input.value=input.value.toUpperCase().replace(/[^A-Z]/g,'');});cell.appendChild(input);cwWords.forEach(w=>{if(w.row===r&&w.col===c&&!cell.querySelector('.cw-num')){const n=document.createElement('span');n.className='cw-num';n.textContent=w.num;cell.appendChild(n);}})}board.appendChild(cell);} }
  document.getElementById('checkCrosswordBtn').onclick=()=>{let correct=0; cwWords.forEach(w=>{let attempt='';[...w.word].forEach((_,i)=>{const r=w.row+(w.dir==='down'?i:0),c=w.col+(w.dir==='across'?i:0);const inp=document.querySelector(`.crossword-cell input[data-row="${r}"][data-col="${c}"]`);attempt+=(inp?.value||'');});if(attempt===w.word)correct++;}); document.getElementById('crosswordCorrect').textContent=`${correct} / 4`; const allInputs=document.querySelectorAll('.crossword-cell input');allInputs.forEach(inp=>{const r=+inp.dataset.row,c=+inp.dataset.col;const expected=cwGrid[r][c];const isGood=expected.includes(inp.value)&&inp.value!=='';inp.parentElement.classList.toggle('correct',isGood);inp.parentElement.classList.toggle('wrong',!isGood&&inp.value!=='');}); const fb=document.getElementById('crosswordFeedback');if(correct===4){stopLevelTimer();const st=4;saveStars(3,st);if(window.markMathLevelDone)window.markMathLevelDone(3);if(window.saveStudentScore)window.saveStudentScore('TTS Hitung-Hitungan Level 3',100);if(window.updateDashboardProgress)window.updateDashboardProgress();fb.innerHTML=`Hebat! Semua jawaban benar. <div class="game-result-stars">★★★★</div>Kamu mendapat 4 bintang.`;}else{fb.textContent=`Masih ada ${4-correct} jawaban yang perlu diperbaiki. Coba lagi sebelum waktu habis.`;}};
  window.__cwProgress=function(){let ok=0;cwWords.forEach(w=>{let a='';[...w.word].forEach((_,i)=>{const r=w.row+(w.dir==='down'?i:0),c=w.col+(w.dir==='across'?i:0);const inp=document.querySelector(`.crossword-cell input[data-row="${r}"][data-col="${c}"]`);a+=(inp?.value||'');});if(a===w.word)ok++;});return ok;};
  document.getElementById('backCrosswordLevels').onclick=()=>{stopLevelTimer();originalShowPage('levels');};document.getElementById('backCrosswordIcon').onclick=()=>{stopLevelTimer();originalShowPage('levels');};document.getElementById('crosswordHome').onclick=e=>{e.preventDefault();stopLevelTimer();originalShowPage('dashboard');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!tutorialModal.classList.contains('hidden'))closeTutorial();});
})();
