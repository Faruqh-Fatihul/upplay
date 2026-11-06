(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------- Kartu level ---------- */
  const c4=$('level4Card'), c5=$('level5Card');
  if(c4){
    c4.style.display='block';
    c4.querySelector('h2').textContent='Labirin Angka';
    c4.querySelector('p').textContent='Telusuri labirin yang lebih panjang. Jebakan matematika bisa muncul tiba-tiba; jawab untuk mendapatkan 5 langkah menuju harta karun.';
    c4.querySelector('.game-preview').textContent='🧭💥🗺️💎';
  }
  if(c5){
    c5.style.display='block';
    c5.querySelector('h2').textContent='Misteri Brankas Angka';
    c5.querySelector('p').textContent='Boss level: pecahkan 5 teka-teki matematika, masukkan kode 4 digit, lalu buka loker harta karun.';
    c5.querySelector('.game-preview').textContent='🔐🔢🕵️🏆';
  }

  /* ---------- Timer 3 menit untuk Level 2–5 ---------- */
  let timerId=null, timerLeft=180, timerLevel=null;
  function ensureTimer(){
    let el=$('cerdasLevelTimer');
    if(!el){
      el=document.createElement('div');
      el.id='cerdasLevelTimer';
      el.className='cerdas-level-timer';
      el.innerHTML='⏱️ <span>Waktu</span> <strong class="timer-number" id="cerdasLevelTimerText">03:00</strong>';
      document.body.appendChild(el);
    }
    return el;
  }
  function addInlineTimer(pageId,labelId){
    const host=$(pageId);
    if(!host) return null;
    const target=host.querySelector('.game-panel,.memory-info,.crossword-panel,.maze-panel,.safe-card');
    if(!target) return null;
    let box=host.querySelector('.game-inline-timer');
    if(!box){
      box=document.createElement('div');
      box.className='game-inline-timer';
      box.innerHTML=`<span>⏱️ 3 menit</span><strong id="${labelId}">03:00</strong>`;
      if(target.firstElementChild) target.insertBefore(box,target.firstElementChild);
      else target.prepend(box);
    }
    return box;
  }
  addInlineTimer('memoryPage','memoryInlineTimer');
  addInlineTimer('crosswordGamePage','crosswordInlineTimer');
  addInlineTimer('mathMazePage','mazeInlineTimer');
  addInlineTimer('safeCrackerPage','safeInlineTimer');

  function stopUnifiedTimer(){
    if(timerId){clearInterval(timerId);timerId=null;}
    timerLevel=null;
    const el=$('cerdasLevelTimer'); if(el)el.classList.remove('active','warning','danger');
    try{window.stopLevelTimer?.();}catch(e){}
    try{window.stopGameTimer?.();}catch(e){}
  }
  window.__stopRequestedLevelTimer=stopUnifiedTimer;

  function fmt(s){s=Math.max(0,s);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function renderUnifiedTimer(){
    const text=fmt(timerLeft);
    const el=ensureTimer(), top=$('cerdasLevelTimerText');
    if(top)top.textContent=text;
    el.classList.toggle('warning',timerLeft<=20&&timerLeft>10);
    el.classList.toggle('danger',timerLeft<=10);
    const map={2:'memoryInlineTimer',3:'crosswordInlineTimer',4:'mazeInlineTimer',5:'safeInlineTimer'};
    const inline=$(map[timerLevel]);
    if(inline){
      inline.textContent=text;
      const box=inline.closest('.game-inline-timer');
      box?.classList.toggle('warning',timerLeft<=20&&timerLeft>10);
      box?.classList.toggle('danger',timerLeft<=10);
    }
    if(timerLevel===3 && $('crosswordTimeText')) $('crosswordTimeText').textContent=text;
  }
  function timeoutUnified(level){
    stopUnifiedTimer();
    if(level===4){
      window.showTimeoutPopup?.(4,{title:'⏰ Waktu Labirin Habis',reason:'Waktu 3 menit habis sebelum harta karun ditemukan.'});
    }else if(level===5){
      window.showTimeoutPopup?.(5,{title:'⏰ Waktu Brankas Habis',reason:'Waktu 3 menit habis sebelum semua 5 sandi matematika selesai.'});
    }else{
      window.showTimeoutPopup?.(level);
    }
  }
  function startUnifiedTimer(level){
    stopUnifiedTimer();
    timerLevel=level; timerLeft=180;
    const el=ensureTimer(); el.classList.add('active');
    renderUnifiedTimer();
    timerId=setInterval(()=>{
      timerLeft--;
      renderUnifiedTimer();
      if(timerLeft<=0) timeoutUnified(level);
    },1000);
  }
  window.__startRequestedLevelTimer=startUnifiedTimer;

  /* Saat masuk halaman Level 2/3, selalu gunakan timer baru yang sama dengan Level 1. */
  const oldShow=window.showPage;
  if(oldShow && !window.__requestedShowPageWrap){
    window.__requestedShowPageWrap=true;
    window.showPage=function(page){
      oldShow.apply(this,arguments);
      if(page==='memory') setTimeout(()=>startUnifiedTimer(2),30);
      else if(page==='crossword') setTimeout(()=>startUnifiedTimer(3),30);
      else if(page==='mathMaze') setTimeout(()=>startUnifiedTimer(4),30);
      else if(page==='safeCracker') setTimeout(()=>startUnifiedTimer(5),30);
      else if(page==='levels'||page==='dashboard') stopUnifiedTimer();
    };
  }

  /* ---------- LEVEL 2: tepat 8 kartu / 2 x 4 ---------- */
  const memoryPairs=[
    ['6 × 7','42'],
    ['8 + 9','17'],
    ['25 − 10','15'],
    ['36 ÷ 6','6']
  ];
  let memoryDone=false;
  window.startMemoryGame=function(){
    const board=$('memoryBoard'); if(!board)return;
    board.classList.remove('memory-3x3');
    board.classList.add('memory-2x4');
    window.flippedCards=[]; window.matchedPairs=0; window.memoryMoves=0; window.lockMemoryBoard=false;
    memoryDone=false;
    $('memoryPairs').textContent='0'; $('memoryMoves').textContent='0';
    board.innerHTML='';
    const cards=[];
    memoryPairs.forEach((pair,i)=>{
      cards.push({pairId:i,type:'question',content:pair[0]});
      cards.push({pairId:i,type:'answer',content:pair[1]});
    });
    cards.sort(()=>Math.random()-.5);
    cards.forEach(card=>{
      const b=document.createElement('button');
      b.type='button'; b.className='memory-card';
      b.dataset.pairId=card.pairId; b.dataset.type=card.type;
      b.innerHTML=`<span class="memory-card-inner"><span class="memory-front">?</span><span class="memory-back">${card.content}</span></span>`;
      b.addEventListener('click',()=>flipMemory(b));
      board.appendChild(b);
    });
    setTimeout(()=>startUnifiedTimer(2),40);
  };
  function flipMemory(card){
    if(memoryDone||window.lockMemoryBoard||card.classList.contains('flipped')||card.classList.contains('matched'))return;
    card.classList.add('flipped'); window.flippedCards.push(card);
    if(window.flippedCards.length!==2)return;
    window.memoryMoves++; $('memoryMoves').textContent=window.memoryMoves;
    window.lockMemoryBoard=true;
    const [a,b]=window.flippedCards;
    const ok=a.dataset.pairId===b.dataset.pairId && a.dataset.type!==b.dataset.type;
    if(ok){
      setTimeout(()=>{
        a.classList.remove('flipped');b.classList.remove('flipped');
        a.classList.add('matched');b.classList.add('matched');
        window.matchedPairs++;$('memoryPairs').textContent=window.matchedPairs;
        window.flippedCards=[];window.lockMemoryBoard=false;
        if(window.matchedPairs===memoryPairs.length)finishMemory();
      },320);
    }else{
      setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');window.flippedCards=[];window.lockMemoryBoard=false;},650);
    }
  }
  function finishMemory(){
    if(memoryDone)return;
    memoryDone=true;stopUnifiedTimer();
    const moves=window.memoryMoves||0;
    const stars=moves<=6?4:moves<=8?3:moves<=11?2:1;
    window.saveStars?.(2,stars);
    window.markMathLevelDone?.(2);
    window.saveStudentScore?.('Memory Card Level 2',stars*25);
    window.updateDashboardProgress?.();
    setTimeout(()=>{
      window.showRealLevelOutcome?.(2,'success','🎉 Level 2 Selesai!',`Semua 4 pasangan ditemukan dalam ${moves} langkah.`,stars);
    },120);
  }

  /* ---------- LEVEL 3: TTS matematika ---------- */
  /*
     TTS dibuat sebagai crossword sungguhan: setiap kata memiliki jumlah kotak
     tepat sesuai panjang jawabannya, dan setiap persilangan memakai HURUF YANG SAMA.

     Susunan 4 x 8 (baris x kolom):
       3 MENURUN  TIGA
       4 MENDATAR LIMA
       2 MENURUN  DUA
       1 MENDATAR DELAPAN

     Persilangan penting:
       DELAPAN[4] = A dengan DUA[3] = A
       DELAPAN[6] = A dengan TIGA[4] = A
       TIGA[2]    = I dengan LIMA[2] = I
  */
  const cwWords=[
    {num:1,dir:'across',row:3,col:0,word:'DELAPAN', clue:'4 × 2 = ....'},
    {num:2,dir:'down',  row:1,col:3,word:'DUA',     clue:'1 + 1 = ....'},
    {num:3,dir:'down',  row:0,col:5,word:'TIGA',    clue:'1 + 2 = ....'},
    {num:4,dir:'across',row:1,col:4,word:'LIMA',    clue:'2 + 3 = ....'}
  ];

  // Ukuran papan dihitung dari posisi kata, bukan dipaksa 7×7.
  const cwRows=Math.max(...cwWords.map(w=>w.row+(w.dir==='down'?w.word.length:1)));
  const cwCols=Math.max(...cwWords.map(w=>w.col+(w.dir==='across'?w.word.length:1)));
  const cwGrid=Array.from({length:cwRows},()=>Array(cwCols).fill(null));
  let cwLayoutValid=true;
  cwWords.forEach(w=>[...w.word].forEach((ch,i)=>{
    const r=w.row+(w.dir==='down'?i:0);
    const c=w.col+(w.dir==='across'?i:0);
    if(cwGrid[r][c] && cwGrid[r][c]!==ch) cwLayoutValid=false;
    cwGrid[r][c]=ch;
  }));

  let crosswordDone=false;
  window.startCrossword=function(){
    const board=$('crosswordBoard'); if(!board)return;
    crosswordDone=false; board.innerHTML='';
    $('crosswordFeedback').textContent='Isi seluruh kotak putih sesuai petunjuk, lalu tekan Periksa Jawaban.';
    $('crosswordCorrect').textContent='0 / 4';

    // Papan otomatis mengikuti bounding box TTS: 4 baris × 8 kolom.
    board.style.setProperty('--cw-cols',cwCols);
    board.style.gridTemplateColumns=`repeat(${cwCols}, minmax(0,1fr))`;
    board.style.gridTemplateRows=`repeat(${cwRows}, minmax(0,1fr))`;
    board.style.aspectRatio=`${cwCols} / ${cwRows}`;

    for(let r=0;r<cwRows;r++)for(let c=0;c<cwCols;c++){
      const cell=document.createElement('div');
      cell.className='crossword-cell';
      cell.dataset.row=r; cell.dataset.col=c;

      if(!cwGrid[r][c]){
        // Kotak hitam adalah area kosong TTS, bukan kotak jawaban.
        cell.classList.add('block');
      }else{
        const input=document.createElement('input');
        input.maxLength=1;
        input.autocomplete='off';
        input.inputMode='text';
        input.dataset.row=r;
        input.dataset.col=c;
        input.setAttribute('aria-label',`Baris ${r+1}, kolom ${c+1}`);

        input.addEventListener('focus',()=>{
          board.querySelectorAll('.active').forEach(x=>x.classList.remove('active'));
          cell.classList.add('active');
        });
        input.addEventListener('input',()=>{
          input.value=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,1);
          cell.classList.remove('wrong','correct');
          if(input.value){
            const next=[...board.querySelectorAll('input')].find(x=>
              x!==input && +x.dataset.row===r && +x.dataset.col===c+1
            );
            next?.focus();
          }
        });
        input.addEventListener('keydown',ev=>{
          if(ev.key==='Backspace' && !input.value){
            const prev=[...board.querySelectorAll('input')].find(x=>
              +x.dataset.row===r && +x.dataset.col===c-1
            );
            prev?.focus();
          }
        });

        cell.appendChild(input);

        // Nomor hanya ditaruh di awal kata, seperti TTS nyata.
        cwWords.filter(w=>w.row===r&&w.col===c).forEach(w=>{
          const n=document.createElement('span');
          n.className='cw-num';
          n.textContent=w.num;
          cell.appendChild(n);
        });
      }
      board.appendChild(cell);
    }

    if(!cwLayoutValid){
      console.error('Layout TTS Level 3 memiliki persilangan huruf yang tidak valid.');
      $('crosswordFeedback').textContent='Layout TTS bermasalah. Silakan muat ulang permainan.';
    }
    setTimeout(()=>startUnifiedTimer(3),40);
  };

  $('checkCrosswordBtn')?.addEventListener('click',function(e){
    e.preventDefault();e.stopImmediatePropagation();
    if(crosswordDone)return;

    let correct=0;
    cwWords.forEach(w=>{
      let attempt='';
      [...w.word].forEach((_,i)=>{
        const r=w.row+(w.dir==='down'?i:0);
        const c=w.col+(w.dir==='across'?i:0);
        attempt+=document.querySelector(`.crossword-cell input[data-row="${r}"][data-col="${c}"]`)?.value||'';
      });
      if(attempt===w.word)correct++;
    });

    $('crosswordCorrect').textContent=`${correct} / ${cwWords.length}`;

    // Validasi PER KOTAK harus sama persis dengan huruf jawaban pada posisi itu.
    document.querySelectorAll('.crossword-cell input').forEach(inp=>{
      const r=+inp.dataset.row,c=+inp.dataset.col;
      const expected=cwGrid[r][c]||'';
      const good=inp.value===expected;
      inp.parentElement.classList.toggle('correct',!!inp.value&&good);
      inp.parentElement.classList.toggle('wrong',!!inp.value&&!good);
    });

    if(correct===cwWords.length){
      crosswordDone=true;stopUnifiedTimer();
      window.saveStars?.(3,4);
      window.markMathLevelDone?.(3);
      window.saveStudentScore?.('TTS Hitung-Hitungan Level 3',100);
      window.updateDashboardProgress?.();
      $('crosswordFeedback').innerHTML='🎉 Semua jawaban TTS benar!<div class="game-result-stars">★★★★</div>';
      setTimeout(()=>window.showRealLevelOutcome?.(3,'success','🎉 Level 3 Selesai!','Semua jawaban mendatar dan menurun benar.',4),150);
    }else{
      $('crosswordFeedback').textContent=`Masih ada ${cwWords.length-correct} jawaban yang perlu diperbaiki. Perhatikan huruf pada kotak persilangan.`;
    }
  },true);

  /* ---------- LEVEL 4: labirin besar 25×25 + jebakan soal + 5 langkah bonus ---------- */
  let maze=null;
  const MAZE_SIZE=17;
  const MAZE_MIN=26, MAZE_MAX=44; /* jarak jalur terpendek (langkah): cukup menantang tapi pasti selesai < 1 menit */
  const mzNeighbors=(r,c)=>[[r+1,c],[r-1,c],[r,c+1],[r,c-1]];
  /* Jalur terpendek (BFS) dari (sr,sc) ke tujuan; mengembalikan array [r,c] termasuk titik awal & tujuan. */
  function mazeRoute(grid,sr,sc,gr,gc){
    const n=grid.length,prev=new Map([[sr+','+sc,null]]),q=[[sr,sc]];
    for(let i=0;i<q.length;i++){
      const [r,c]=q[i];
      if(r===gr&&c===gc){const out=[];let k=r+','+c;while(k){out.push(k.split(',').map(Number));k=prev.get(k)}return out.reverse()}
      for(const [rr,cc] of mzNeighbors(r,c)){
        const k=rr+','+cc;
        if(rr>=0&&cc>=0&&rr<n&&cc<n&&grid[rr][cc]===0&&!prev.has(k)){prev.set(k,r+','+c);q.push([rr,cc])}
      }
    }
    return [];
  }
  /* Satu kali bangun: "growing tree" (70% ujung terbaru, 30% acak) → banyak cabang & jalan buntu. */
  function mazeBuild(size){
    const g=Array.from({length:size},()=>Array(size).fill(1));
    const list=[[1,1]];g[1][1]=0;
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
    while(list.length){
      const i=Math.random()<0.55?list.length-1:Math.floor(Math.random()*list.length);
      const [r,c]=list[i];
      const opts=dirs.filter(([dr,dc])=>{const nr=r+dr,nc=c+dc;return nr>0&&nr<size-1&&nc>0&&nc<size-1&&g[nr][nc]===1});
      if(!opts.length){list.splice(i,1);continue}
      const [dr,dc]=opts[Math.floor(Math.random()*opts.length)];
      g[r+dr/2][c+dc/2]=0;g[r+dr][c+dc]=0;list.push([r+dr,c+dc]);
    }
    /* Sebagian besar ujung buntu dibuka lagi supaya ada jalan alternatif (labirin tidak buntu semua). */
    const ends=[];
    for(let r=1;r<size-1;r+=2)for(let c=1;c<size-1;c+=2){
      if(mzNeighbors(r,c).filter(([a,b])=>g[a][b]===0).length===1)ends.push([r,c]);
    }
    for(let i=ends.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ends[i],ends[j]]=[ends[j],ends[i]];}
    const target=Math.ceil(ends.length*0.7);
    for(let k=0;k<target;k++){
      const [r,c]=ends[k];
      const opts=dirs.filter(([dr,dc])=>{const nr=r+dr,nc=c+dc;return nr>0&&nr<size-1&&nc>0&&nc<size-1&&g[r+dr/2][c+dc/2]===1});
      if(opts.length){const [dr,dc]=opts[Math.floor(Math.random()*opts.length)];g[r+dr/2][c+dc/2]=0;}
    }
    return g;
  }
  /* Hitung percabangan & jalan buntu untuk memastikan labirin benar-benar membingungkan. */
  function mazeStats(g){
    let dead=0,junc=0;
    for(let r=1;r<g.length-1;r++)for(let c=1;c<g.length-1;c++){
      if(g[r][c])continue;
      const open=mzNeighbors(r,c).filter(([a,b])=>g[a][b]===0).length;
      if(open===1)dead++;else if(open>=3)junc++;
    }
    return {dead,junc};
  }
  /* Jarak (jumlah langkah) dari satu petak ke semua petak lain. */
  function mazeDist(g,sr,sc){
    const n=g.length,d=Array.from({length:n},()=>Array(n).fill(-1));d[sr][sc]=0;const q=[[sr,sc]];
    for(let i=0;i<q.length;i++){const [r,c]=q[i];for(const [rr,cc] of mzNeighbors(r,c))if(rr>=0&&cc>=0&&rr<n&&cc<n&&g[rr][cc]===0&&d[rr][cc]<0){d[rr][cc]=d[r][c]+1;q.push([rr,cc])}}
    return d;
  }
  /* Labirin diundi ulang setiap main: bentuk dinding acak, posisi 🧒 acak, posisi 💎 acak.
     Syarat: harta bisa dijangkau, jalur terpendek 55–95 langkah (cukup sulit tapi tetap bisa
     diselesaikan dalam 1 menit), banyak jalan buntu & percabangan, dan 💎 tidak berdekatan dengan 🧒. */
  function makeMaze(size=MAZE_SIZE){
    const rooms=[];for(let r=1;r<size-1;r+=2)for(let c=1;c<size-1;c+=2)rooms.push([r,c]);
    let best=null;
    for(let t=0;t<300;t++){
      const g=mazeBuild(size);
      for(let k=0;k<8;k++){
        const s=rooms[Math.floor(Math.random()*rooms.length)],d=mazeDist(g,s[0],s[1]);
        const cands=rooms.filter(([r,c])=>d[r][c]>=MAZE_MIN&&d[r][c]<=MAZE_MAX&&Math.abs(r-s[0])+Math.abs(c-s[1])>=12);
        if(cands.length){cands.sort((a,b)=>d[b[0]][b[1]]-d[a[0]][a[1]]);g.start=s;g.goal=cands[Math.floor(Math.random()*Math.ceil(cands.length/2))];return g}
        const far=rooms.filter(([r,c])=>d[r][c]>0&&d[r][c]<=MAZE_MAX).sort((a,b)=>d[b[0]][b[1]]-d[a[0]][a[1]])[0];
        if(far&&(!best||d[far[0]][far[1]]>best.len))best={g:g,start:s,goal:far,len:d[far[0]][far[1]]};
      }
    }
    best.g.start=best.start;best.g.goal=best.goal;return best.g;
  }
  const trapQuestions=[
    {q:'48 ÷ 6 = ?',a:8,o:[6,7,8,9]},
    {q:'7 × 8 − 6 = ?',a:50,o:[46,48,50,56]},
    {q:'25 + 37 = ?',a:62,o:[52,60,62,72]},
    {q:'144 ÷ 12 = ?',a:12,o:[10,11,12,14]},
    {q:'9 × 9 = ?',a:81,o:[72,79,81,91]},
    {q:'(30 + 18) ÷ 6 = ?',a:8,o:[6,7,8,9]},
    {q:'15 × 4 = ?',a:60,o:[45,54,60,64]},
    {q:'200 − 87 = ?',a:113,o:[103,113,123,117]},
    {q:'6 × 7 + 8 = ?',a:50,o:[48,50,52,56]},
    {q:'96 ÷ 8 = ?',a:12,o:[11,12,13,14]}
  ];
  function pathCells(grid){
    const out=[];
    for(let r=1;r<grid.length-1;r++)for(let c=1;c<grid.length-1;c++)if(grid[r][c]===0)out.push([r,c]);
    return out;
  }
  /* 4 jebakan tepat di jalur menuju harta (±20/40/60/80%) + 3 jebakan umpan di cabang buntu. */
  function pickTraps(grid){
    const n=grid.length,route=mazeRoute(grid,grid.start[0],grid.start[1],grid.goal[0],grid.goal[1]),onRoute=new Set(route.map(p=>p.join(',')));
    const traps=new Set();
    [0.2,0.4,0.6,0.8].forEach(f=>{
      const i=Math.min(route.length-3,Math.max(4,Math.round(route.length*f)));
      traps.add(route[i].join(','));
    });
    const decoys=pathCells(grid).filter(([r,c])=>{
      if(onRoute.has(r+','+c)||Math.abs(r-grid.start[0])+Math.abs(c-grid.start[1])<8||(r===grid.goal[0]&&c===grid.goal[1]))return false;
      return mzNeighbors(r,c).filter(([a,b])=>grid[a][b]===0).length===2;
    });
    for(let i=0;i<2&&decoys.length;i++){
      const j=Math.floor(Math.random()*decoys.length);
      const x=decoys.splice(j,1)[0];
      traps.add(x.join(','));
    }
    return traps;
  }
  /* Langkah bonus = 5 petak berikutnya pada jalur terpendek dari posisi pemain ke harta. */
  function bonusCells(){
    const n=maze.grid.length,route=mazeRoute(maze.grid,maze.r,maze.c,maze.goal[0],maze.goal[1]);
    return new Set(route.slice(1,1+maze.bonusMoves).map(p=>p.join(',')));
  }
  function renderMaze(){
    const g=maze.grid, board=$('mazeGrid'); board.classList.add('real-maze');board.innerHTML='';board.style.gridTemplateColumns='repeat('+g.length+',minmax(0,1fr))';board.style.gridTemplateRows='repeat('+g.length+',minmax(0,1fr))';board.style.setProperty('--mz',g.length);const bonusSet=maze.bonusMoves>0?bonusCells():new Set();
    for(let r=0;r<g.length;r++)for(let c=0;c<g.length;c++){
      const cell=document.createElement('div');
      const key=`${r},${c}`;
      cell.className='maze-cell '+(g[r][c]?'wall':'path');
      if(maze.visited.has(key))cell.classList.add('visited');
      if(maze.traps.has(key)&&maze.revealedTraps.has(key))cell.classList.add('trap');
      if(bonusSet.has(key))cell.classList.add('bonus-path');
      if(r===maze.r&&c===maze.c)cell.classList.add('player');
      if(r===maze.goal[0]&&c===maze.goal[1])cell.classList.add('goal');
      if(r===maze.r&&c===maze.c)cell.textContent='🧒';
      else if(r===maze.goal[0]&&c===maze.goal[1])cell.textContent='💎';
      else if(maze.traps.has(key)&&maze.revealedTraps.has(key))cell.textContent='💥';
      board.appendChild(cell);
    }
    $('mazeScore').textContent=String(maze.score);
    $('mazeLives').textContent=`${maze.bonusMoves>0?'👟'.repeat(Math.min(5,maze.bonusMoves))+' ':''}⭐ ${maze.steps}`;
    const status=$('mazeStatus');
    status.textContent=maze.activeQuestion?'💥 Jebakan aktif! Jawab soal untuk membuka 5 langkah.':(maze.bonusMoves>0?`✨ Jawaban benar! Ikuti ${maze.bonusMoves} petak hijau menuju 💎.`:'Cari 💎. Hati-hati, jebakan bisa muncul tiba-tiba!');
  }
  function askTrap(key){
    const q=trapQuestions[maze.questionIndex%trapQuestions.length];
    maze.activeQuestion={key,q};
    maze.revealedTraps.add(key);
    $('mazeQuestion').innerHTML=`<div class="trap-title">💥 JEBakan muncul!</div><h3>Soal Matematika</h3><p>${q.q}</p><div>${q.o.map(v=>`<button data-maze-answer="${v}">${v}</button>`).join('')}</div><p class="maze-trap-hint">Jawaban salah tidak mengurangi nyawa. Kamu tetap harus menjawab benar agar bisa berjalan lagi.</p>`;
    $('mazeQuestion').querySelectorAll('[data-maze-answer]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const ans=Number(btn.dataset.mazeAnswer);
        if(ans===q.a){
          maze.score+=15;maze.questionIndex++;maze.activeQuestion=null;maze.bonusMoves=5;
          maze.bonusPath.clear();
          $('mazeQuestion').innerHTML='<h3>✅ Benar!</h3><p>Jebakan terbuka. Kamu mendapat <strong>5 langkah bonus</strong>. Teruskan menuju 💎.</p><div class="bonus-note">👟 5 langkah bonus aktif</div>';
          renderMaze();
          if(maze.r===maze.goal[0]&&maze.c===maze.goal[1])finishMaze();
        }else{
          const fb=document.createElement('div');fb.className='trap-answer-wrong';fb.textContent='❌ Belum benar. Coba soal ini lagi.';
          $('mazeQuestion').appendChild(fb);
        }
      });
    });
    renderMaze();
  }
  function finishMaze(){
    if(!maze||maze.done)return;
    maze.done=true;stopUnifiedTimer();
    window.saveStars?.(4,4);window.markMathLevelDone?.(4);window.saveStudentScore?.('Labirin Angka Level 4',100);window.updateDashboardProgress?.();
    setTimeout(()=>window.showRealLevelOutcome?.(4,'success','💎 Level 4 Selesai!','Kamu berhasil melewati labirin, menjawab jebakan matematika, dan menemukan harta karun.',4),150);
  }
  function moveMaze(dir){
    if(!maze||maze.done||maze.activeQuestion||window.__cpPaused)return;
    let r=maze.r,c=maze.c;
    if(dir==='up')r--; if(dir==='down')r++; if(dir==='left')c--; if(dir==='right')c++;
    if(r<0||c<0||r>=maze.grid.length||c>=maze.grid.length||maze.grid[r][c]===1)return;
    maze.r=r;maze.c=c;maze.steps++;
    const key=`${r},${c}`;maze.visited.add(key);
    if(maze.bonusMoves>0)maze.bonusMoves--;
    renderMaze();
    if(r===maze.goal[0]&&c===maze.goal[1]){finishMaze();return;}
    if(maze.traps.has(key)&&!maze.triggered.has(key)){maze.triggered.add(key);askTrap(key);}
  }
  function startMazeRequested(){
    stopUnifiedTimer();
    window.showPage?.('mathMaze');
    const size=MAZE_SIZE,grid=makeMaze(size);
    maze={grid,r:grid.start[0],c:grid.start[1],goal:grid.goal,visited:new Set([grid.start.join(',')]),traps:pickTraps(grid),revealedTraps:new Set(),triggered:new Set(),questionIndex:0,activeQuestion:null,bonusMoves:0,bonusPath:new Set(),steps:0,score:0,done:false};
    $('mazeQuestion').innerHTML='<h3>🧭 Misi Labirin</h3><p>Telusuri lorong labirin. Gerakkan 🧒 menuju 💎 sebelum 3 menit habis. Jebakan akan muncul tiba-tiba. Saat terjebak, jawab benar untuk membuka 5 petak jalan (hijau) menuju harta karun.</p>';
    renderMaze();startUnifiedTimer(4);
  }
  document.querySelectorAll('#mathMazePage [data-move]').forEach(b=>{
    b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();moveMaze(b.dataset.move);},true);
  });
  document.addEventListener('keydown',e=>{
    if($('mathMazePage')?.classList.contains('hidden'))return;
    const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];
    if(d){e.preventDefault();moveMaze(d);}
  },true);

  /* ---------- LEVEL 5: brankas 5 ronde ---------- */
  const bossQuestions=[
    {q:'(15 × 2) ÷ 3 + 5 = ?',a:15},
    {q:'84 ÷ 7 + 8 = ?',a:20},
    {q:'54 − 14 = ?',a:40},
    {q:'(25 + 15) ÷ 5 = ?',a:8},
    {q:'7 × 8 − 6 = ?',a:50}
  ];
  let safe=null;
  function renderSafe(){
    $('safeDigits').innerHTML=[0,1,2,3].map(i=>`<span class="safe-digit">${safe.input[i]||'_'}</span>`).join('');
    $('safeQuestion').innerHTML=`<strong>RONDE ${safe.round+1} / 5</strong><br>${bossQuestions[safe.round].q}<br><small>Masukkan jawaban sebagai 4 digit.</small>`;
    $('safeResult').textContent='Masukkan 4 digit jawaban lalu tekan Buka.';
    $('safeResult').className='safe-result';
  }
  function startSafeRequested(){
    window.showPage?.('safeCracker');
    safe={round:0,input:'',done:false};
    $('safeCard').classList.remove('opened','shake');
    $('safeResult').className='safe-result';
    $('safeResult').textContent='Masukkan jawaban sebagai 4 digit.';
    $('safeKeypad').innerHTML='';
    [1,2,3,4,5,6,7,8,9,0].forEach(n=>{
      const b=document.createElement('button');b.type='button';b.textContent=n;
      b.addEventListener('click',()=>{if(!safe.done&&safe.input.length<4){safe.input+=String(n);renderSafe();}});
      $('safeKeypad').appendChild(b);
    });
    $('safeClear').onclick=()=>{safe.input='';renderSafe();};
    $('safeSubmit').onclick=()=>{
      if(safe.input.length!==4){$('safeResult').className='safe-result bad';$('safeResult').textContent='⚠️ Isi 4 digit terlebih dahulu.';return;}
      const q=bossQuestions[safe.round];
      if(Number(safe.input)===q.a){
        safe.round++;safe.input='';
        if(safe.round>=5){
          safe.done=true;stopUnifiedTimer();$('safeCard').classList.add('opened');
          $('safeResult').className='safe-result success';
          $('safeResult').innerHTML='🔓 <strong>BRANKAS TERBUKA!</strong> Semua 5 teka-teki benar. 🏆';
          window.saveStars?.(5,4);window.markMathLevelDone?.(5);window.saveStudentScore?.('Misteri Brankas Angka Level 5',100);window.updateDashboardProgress?.();
          setTimeout(()=>window.showRealLevelOutcome?.(5,'success','🏆 Level 5 Selesai!','Semua 5 teka-teki matematika berhasil. Brankas terbuka dan misi selesai.',4),180);
        }else{
          $('safeResult').className='safe-result success';
          $('safeResult').textContent='🟢 Kode benar! Ronde berikutnya terbuka.';
          renderSafe();
        }
      }else{
        $('safeCard').classList.remove('shake');void $('safeCard').offsetWidth;$('safeCard').classList.add('shake');
        $('safeResult').className='safe-result bad';
        $('safeResult').textContent='🔴 Kode salah. Soal tetap sama, coba lagi sebelum waktu habis.';
      }
    };
    renderSafe();startUnifiedTimer(5);
  }

  /* Tombol Level 4/5 dan retry timeout diarahkan ke game yang benar. */
  window.__launchLevel45=function(level){
    const modal=$('gameTutorialModal'), cd=$('countdownOverlay'), num=$('countdownNumber');
    if(modal)modal.classList.add('hidden');
    if(cd){
      cd.classList.add('active');cd.style.display='';
      let n=3;num.textContent=n;
      const id=setInterval(()=>{
        n--;
        if(n>0)num.textContent=n;
        else{clearInterval(id);cd.classList.remove('active');cd.style.display='none';if(level===4)startMazeRequested();else startSafeRequested();}
      },650);
    }else if(level===4)startMazeRequested();else startSafeRequested();
  };
  window.__startRequestedMaze=startMazeRequested;
  /* Kontrol labirin: handler lama (layer "real-level45") menangkap tombol panah lebih dulu lalu error,
     sehingga 🧒 tidak bisa bergerak. Listener level window (capture) ini berjalan paling awal dan
     langsung memanggil moveMaze milik labirin besar. */
  if(!window.__mazeCtl){
    window.__mazeCtl=true;
    const mazeVisible=()=>{const pg=document.getElementById('mathMazePage');return pg&&!pg.classList.contains('hidden')};
    window.addEventListener('keydown',e=>{
      if(!mazeVisible())return;
      const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'}[e.key];
      if(!d||e.ctrlKey||e.metaKey||e.altKey)return;
      e.preventDefault();e.stopImmediatePropagation();moveMaze(d);
    },true);
    window.addEventListener('click',e=>{
      const b=e.target&&e.target.closest&&e.target.closest('#mathMazePage [data-move]');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();moveMaze(b.dataset.move);
    },true);
  }
  window.__startRequestedSafe=startSafeRequested;

  /* Intercept old Level 4/5 click handlers before mereka mengarah ke game lama. */
  $('level4Btn')?.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(!$('level4Btn').disabled)window.__launchLevel45(4);
  },true);
  $('level5Btn')?.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(!$('level5Btn').disabled)window.__launchLevel45(5);
  },true);

  /* Tangkap klik dari document agar handler Level 4/5 lama tidak sempat menjalankan jalur ular tangga. */
  document.addEventListener('click',e=>{
    const id=e.target?.closest?.('#level4Btn,#level5Btn')?.id;
    if(id==='level4Btn'){
      e.preventDefault();e.stopImmediatePropagation();
      if(!$('level4Btn').disabled)window.__launchLevel45(4);
    }else if(id==='level5Btn'){
      e.preventDefault();e.stopImmediatePropagation();
      if(!$('level5Btn').disabled)window.__launchLevel45(5);
    }
  },true);

  /* Pastikan semua game non-Level-1 punya label waktu yang terlihat. */
  setTimeout(()=>{
    addInlineTimer('memoryPage','memoryInlineTimer');
    addInlineTimer('crosswordGamePage','crosswordInlineTimer');
    addInlineTimer('mathMazePage','mazeInlineTimer');
    addInlineTimer('safeCrackerPage','safeInlineTimer');
  },50);
})();
