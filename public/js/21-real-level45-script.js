(() => {
  const $ = id => document.getElementById(id);
  const levelsPage = $('mathLevelsPage');
  const level4Card = $('level4Card'), level5Card = $('level5Card');
  const level4Btn = $('level4Btn'), level5Btn = $('level5Btn');
  const level4Number = $('level4Number'), level5Number = $('level5Number');

  /* ---------- Card Level 4/5: jangan disembunyikan lagi ---------- */
  if(level4Card){
    level4Card.style.display='block';
    level4Card.querySelector('h2').textContent='Labirin Angka';
    level4Card.querySelector('p').textContent='Telusuri labirin yang lebih panjang, pecahkan tantangan matematika, dan temukan bintang sebelum waktu habis.';
    level4Card.querySelector('.game-preview').textContent='🧭🧩⭐';
    level4Btn.textContent='Selesaikan Level 3';
  }
  if(level5Card){
    level5Card.style.display='block';
    level5Card.querySelector('h2').textContent='Misteri Brankas Angka';
    level5Card.querySelector('p').textContent='Boss level: pecahkan 5 teka-teki matematika dan buka brankas dengan kode 4 digit.';
    level5Card.querySelector('.game-preview').textContent='🔐🕵️🏆';
    level5Btn.textContent='Selesaikan Level 4';
  }

  /* Override hanya navigasi Level 4/5. Level 1–3 tidak disentuh. */
  function unlocked(level){
    const s=window.currentSession;
    if(level===1) return true; /* V12: guru bertahap seperti siswa */
    return localStorage.getItem(`cerdasPlay:${s?.id||'demo'}:mathLevel${level-1}Completed`)==='true';
  }
  function done(level){
    const s=window.currentSession;
    return localStorage.getItem(`cerdasPlay:${s?.id||'demo'}:mathLevel${level}Completed`)==='true';
  }
  function refresh45(){
    [[4,level4Card,level4Number,level4Btn],[5,level5Card,level5Number,level5Btn]].forEach(([lv,card,num,btn])=>{
      if(!card)return;
      const ok=unlocked(lv),dn=done(lv);
      card.classList.toggle('locked',!ok); card.classList.toggle('active',ok);
      if(num)num.textContent=ok?(dn?'✓':String(lv)):'🔒';
      if(btn){btn.disabled=!ok;btn.textContent=dn?`Mainkan Level ${lv} ✓`:`Mainkan Level ${lv}`;if(!ok)btn.textContent=`Selesaikan Level ${lv-1}`;}
    });
  }
  window.addEventListener('load',refresh45);
  const originalUpdate=window.updateDashboardProgress;
  window.updateDashboardProgress=function(){ try{originalUpdate?.();}catch(e){} refresh45(); };

  /* ---------- Tutorial + countdown untuk Level 4/5 ---------- */
  const tutorialModal=$('gameTutorialModal'), tutorialTitle=$('gameTutorialTitle'), tutorialText=$('gameTutorialText'), tutorialRules=$('gameTutorialRules'), startTutorial=$('startTutorialGameBtn'), countdown=$('countdownOverlay'), countdownNumber=$('countdownNumber');
  let pending45=0;
  function openTutorial45(level){
    pending45=level;
    const data=level===4?{
      title:'Tutorial Level 4 — Labirin Angka',
      text:'Temukan jalan keluar dari labirin besar sebelum 3 menit habis.',
      rules:['Gerakkan avatar dengan tombol arah atau tombol panah keyboard.','Kotak kuning adalah tantangan: jawab soal untuk membuka jalan.','Jika salah, nyawa berkurang. Kamu memiliki 3 nyawa.','Capai ⭐ untuk menyelesaikan Level 4 dan mendapatkan hingga 4 bintang.']
    }:{
      title:'Tutorial Level 5 — Misteri Brankas Angka',
      text:'Pecahkan 5 teka-teki matematika dan masukkan kode 4 digit setiap ronde.',
      rules:['Setiap ronde memiliki satu soal matematika/logika.','Masukkan jawaban sebagai 4 digit melalui keypad.','Selesaikan 5 ronde sebelum waktu 3 menit habis.','Semua ronde benar memberikan 4 bintang dan membuka akhir Boss Level.']
    };
    tutorialModal.style.pointerEvents='';tutorialModal.style.display='';tutorialTitle.textContent=data.title;tutorialText.textContent=data.text;tutorialRules.innerHTML=data.rules.map(x=>`<li>${x}</li>`).join('');
    tutorialModal.classList.remove('hidden');
  }
  function launch45(level){ pending45=0; if(window.__cpRoomBusy){tutorialModal.classList.add('hidden');if(level===4)startMazeLevel4();else startSafeLevel5();return} countdown.style.display=''; countdown.style.pointerEvents='';
    tutorialModal.classList.add('hidden');
    countdown.classList.add('active');
    let n=3; countdownNumber.textContent=n;
    const timer=setInterval(()=>{
      n--; if(n>0)countdownNumber.textContent=n;
      else {clearInterval(timer);countdown.classList.remove('active');if(level===4)startMazeLevel4();else startSafeLevel5();}
    },700);
  }
  if(startTutorial){
    const legacyTutorialClick=startTutorial.onclick;
    startTutorial.onclick=function(e){
      if(pending45){ e?.preventDefault(); launch45(pending45); }
      else if(typeof legacyTutorialClick==='function'){ legacyTutorialClick.call(this,e); }
    };
  }

  window.__launchLevel45=launch45;
  /* Capture listener mencegah handler lama mengarahkan Level 4/5 ke ular tangga. */
  level4Btn?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!level4Btn.disabled)openTutorial45(4);},true);
  level5Btn?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!level5Btn.disabled)openTutorial45(5);},true);

  /* ---------- Outcome popup: semua level 1–5 memakai satu alur ---------- */
  const outcome=$('levelOutcomeModal'), oIcon=$('levelOutcomeIcon'), oKick=$('levelOutcomeKicker'), oTitle=$('levelOutcomeTitle'), oText=$('levelOutcomeText'), oStars=$('levelOutcomeStars'), oPrimary=$('levelOutcomePrimary'), oSecondary=$('levelOutcomeSecondary');
  let resultLevel=1,resultType='success';
  function result(level,type,title,text,stars=0){
    if(type==='timeout' && window.showTimeoutPopup){ stopTimers(); return window.showTimeoutPopup(level,{title:title,reason:text}); }
    resultLevel=level;resultType=type;oIcon.textContent=type==='timeout'?'⏰':'🏆';oKick.textContent=type==='timeout'?'WAKTU HABIS':'LEVEL BERHASIL';oTitle.textContent=String(title).replace(/^[^A-Za-z0-9]+/,'');oText.textContent=text;oStars.innerHTML=stars?('★'.repeat(stars)+'☆'.repeat(4-stars)):'';
    oPrimary.style.display='';oSecondary.style.display='';
    if(type==='timeout'){oPrimary.textContent='Coba Lagi';oSecondary.textContent='Kembali ke Menu Level';}
    else if(level<5){oPrimary.textContent=`Lanjut Level ${level+1}`;oSecondary.textContent='Kembali ke Menu Level';}
    else{oPrimary.textContent='Main Lagi';oSecondary.textContent='Kembali ke Menu Level';}
    outcome.classList.remove('hidden');
  }
  window.showRealLevelOutcome=result;
  oSecondary.onclick=()=>{outcome.classList.add('hidden');stopTimers();window.updateDashboardProgress?.();window.showPage?.('levels');};
  oPrimary.onclick=()=>{
    outcome.classList.add('hidden');stopTimers();window.updateDashboardProgress?.();
    if(resultType==='timeout'){setTimeout(()=>{if(resultLevel===4)startMazeLevel4();else if(resultLevel===5)startSafeLevel5();else if(resultLevel===1)$('startSnakeGameBtn')?.click();else if(resultLevel===2)$('level2Btn')?.click();else if(resultLevel===3)$('level3Btn')?.click();},50);return;}
    if(resultLevel<5){setTimeout(()=>{const b=$(`level${resultLevel+1}Btn`);if(b)b.click();},50);}else{window.showPage?.('levels');setTimeout(()=>{if(typeof window.__cpLaunchMath==='function')window.__cpLaunchMath(5);else if(typeof window.__startRequestedSafe==='function')window.__startRequestedSafe();},60);}
  };

  /* ---------- Timer khusus Level 4/5 ---------- */
  let timerId=null,timerLeft=180;
  function stopTimers(){if(timerId)clearInterval(timerId);timerId=null;window.stopLevelTimer?.();window.stopGameTimer?.();}
  function startTimer45(level){
    stopTimers();timerLeft=180;updateTimer45();
    timerId=setInterval(()=>{timerLeft--;updateTimer45();if(timerLeft<=0){stopTimers();if(level===4)result(4,'timeout','⏰ Waktu Labirin Habis','Semua tantangan belum terjawab. Mau mencoba Level 4 lagi atau kembali ke menu level?');else result(5,'timeout','⏰ Waktu Boss Habis','Belum semua teka-teki brankas terjawab. Mau mencoba lagi atau kembali ke menu level?');}},1000);
  }
  function updateTimer45(){const __s=Math.max(0,timerLeft),t=`${String(Math.floor(__s/60)).padStart(2,'0')}:${String(__s%60).padStart(2,'0')}`;const el=$('gameTimerText');if(el)el.textContent=t;const gt=$('gameTimer');if(gt)gt.classList.add('active');}

  /* ---------- LEVEL 4: LABIRIN ANGKA BESAR ---------- */
  const mazePage=$('mathMazePage'),mazeGrid=$('mazeGrid'),mazeQuestion=$('mazeQuestion'),mazeStatus=$('mazeStatus');
  let mazeState={grid:[],r:1,c:1,goal:[9,9],score:0,lives:3,challenge:false,challengeIndex:0,visited:new Set(),done:false};
  const mazeQuestions=[
    {q:'7 × 8 = ?',a:56,o:[48,54,56,64]},
    {q:'81 ÷ 9 = ?',a:9,o:[7,8,9,12]},
    {q:'12 × 6 = ?',a:72,o:[62,68,72,84]},
    {q:'96 ÷ 12 = ?',a:8,o:[6,7,8,9]},
    {q:'25 + 37 = ?',a:62,o:[52,60,62,72]},
    {q:'90 − 46 = ?',a:44,o:[34,42,44,54]},
    {q:'9 × 9 = ?',a:81,o:[72,79,81,91]},
    {q:'144 ÷ 12 = ?',a:12,o:[10,11,12,14]}
  ];
  function generateMaze(size=11){
    const g=Array.from({length:size},()=>Array(size).fill(1));
    const stack=[[1,1]];g[1][1]=0;
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
    while(stack.length){const [r,c]=stack[stack.length-1];let opts=dirs.filter(([dr,dc])=>{const nr=r+dr,nc=c+dc;return nr>0&&nr<size-1&&nc>0&&nc<size-1&&g[nr][nc]===1;});if(!opts.length){stack.pop();continue;}const [dr,dc]=opts[Math.floor(Math.random()*opts.length)],nr=r+dr,nc=c+dc;g[r+dr/2][c+dc/2]=0;g[nr][nc]=0;stack.push([nr,nc]);}
    g[9][9]=0;g[9][10]=0;g[10][9]=0;
    return g;
  }
  function renderRealMaze(){
    mazeGrid.classList.add('real-maze');mazeGrid.innerHTML='';
    mazeState.grid.forEach((row,r)=>row.forEach((v,c)=>{
      const cell=document.createElement('div');let cls='maze-cell '+(v===1?'wall':'path');
      if(r===mazeState.r&&c===mazeState.c)cls+=' player';
      if(r===9&&c===9)cls+=' goal';
      if(mazeState.visited.has(`${r},${c}`))cls+=' visited';
      if(mazeState.grid[r][c]===0 && mazeState.challengeIndex>0 && (r+c)%7===0 && !(r===1&&c===1) && !(r===9&&c===9))cls+=' challenge';
      cell.className=cls;cell.textContent=(r===mazeState.r&&c===mazeState.c)?'🧒':(r===9&&c===9?'⭐':'');mazeGrid.appendChild(cell);
    }));
    $('mazeScore').textContent=mazeState.score;
    $('mazeLives').textContent='❤️'.repeat(mazeState.lives)+'🖤'.repeat(3-mazeState.lives);
  }
  function startMazeLevel4(){
    window.showPage?.('mathMaze');mazeState={grid:generateMaze(11),r:1,c:1,goal:[9,9],score:0,lives:3,challenge:false,challengeIndex:0,visited:new Set(['1,1']),done:false};
    mazeStatus.textContent='Temukan ⭐. Kotak kuning adalah tantangan matematika.';mazeQuestion.innerHTML='<h3>🚩 Level 4</h3><p>Gerakkan avatar melewati labirin 11 × 11. Jawab tantangan untuk membuka jalan.</p>';
    startTimer45(4);renderRealMaze();
  }
  function mazeChallenge(){
    const q=mazeQuestions[mazeState.challengeIndex%mazeQuestions.length];mazeState.challenge=true;mazeQuestion.innerHTML=`<h3>🧠 Tantangan ${mazeState.challengeIndex+1}</h3><div class="expr">${q.q}</div><div class="maze-answers">${q.o.map(x=>`<button data-real-ma="${x}">${x}</button>`).join('')}</div>`;
    mazeQuestion.querySelectorAll('[data-real-ma]').forEach(b=>b.onclick=()=>{const ans=Number(b.dataset.realMa);if(ans===q.a){mazeState.score+=12;mazeState.challengeIndex++;mazeState.challenge=false;mazeStatus.textContent='✅ Benar! Jalan terbuka.';mazeQuestion.innerHTML='<h3>✨ Benar!</h3><p>Lanjutkan mencari jalan menuju ⭐.</p>';renderRealMaze();if(mazeState.r===9&&mazeState.c===9)finishMaze();}else{mazeState.lives--;mazeStatus.textContent='❌ Jawaban belum tepat. Coba lagi!';$('mazeLives').textContent='❤️'.repeat(Math.max(0,mazeState.lives))+'🖤'.repeat(3-Math.max(0,mazeState.lives));if(mazeState.lives<=0){stopTimers();result(4,'timeout','💡 Nyawa Habis','Tantangan belum selesai. Coba lagi Level 4 atau kembali ke menu level.');}}});
  }
  function finishMaze(){if(mazeState.done)return;mazeState.done=true;stopTimers();localStorage.setItem(`cerdasPlay:${window.currentSession?.id||'demo'}:mathLevel4Completed`,'true');window.saveStars?.(4,4);window.markMathLevelDone?.(4);window.saveStudentScore?.('Labirin Angka Level 4',100);window.updateDashboardProgress?.();result(4,'success','🎉 Level 4 Selesai!','Kamu berhasil melewati labirin dan menyelesaikan semua tantangan matematika.',4);}
  function moveRealMaze(dir){if(mazeState.challenge||mazeState.done)return;let r=mazeState.r,c=mazeState.c;if(dir==='up')r--;if(dir==='down')r++;if(dir==='left')c--;if(dir==='right')c++;if(r<0||r>=11||c<0||c>=11||mazeState.grid[r][c]===1)return;mazeState.r=r;mazeState.c=c;mazeState.visited.add(`${r},${c}`);renderRealMaze();if(r===9&&c===9){finishMaze();return;}if((r*11+c)%5===0)mazeChallenge();}
  document.querySelectorAll('#mathMazePage [data-move]').forEach(b=>{b.onclick=()=>moveRealMaze(b.dataset.move);});
  document.addEventListener('keydown',e=>{if(!mazePage?.classList.contains('hidden')){const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(d){e.preventDefault();e.stopImmediatePropagation();moveRealMaze(d);}}},true);

  /* ---------- LEVEL 5: BOSS BRANKAS, 5 RONDE ---------- */
  const safeCard=$('safeCard'),safeDigits=$('safeDigits'),safeResult=$('safeResult'),safeQuestion=$('safeQuestion'),safeKeypad=$('safeKeypad');
  const bossRounds=[
    {q:'Berapa hasil dari (15 × 2) ÷ 3 + 5?',a:15},
    {q:'Berapa hasil dari 84 ÷ 7 + 8?',a:20},
    {q:'Jika 6 × 9 = 54, lalu 54 − 14 = ...?',a:40},
    {q:'(25 + 15) ÷ 5 = ...?',a:8},
    {q:'7 × 8 − 6 = ...?',a:50}
  ];
  let boss={round:0,input:'',done:false};
  function renderBoss(){safeDigits.innerHTML=[0,1,2,3].map(i=>`<span class="safe-digit">${boss.input[i]||'_'}</span>`).join('');}
  function buildBossKeypad(){safeKeypad.innerHTML='';[1,2,3,4,5,6,7,8,9,0].forEach(n=>{const b=document.createElement('button');b.textContent=n;b.addEventListener('click',()=>{if(boss.input.length<4){boss.input+=String(n);renderBoss();}});safeKeypad.appendChild(b);});}
  function startSafeLevel5(){
    window.showPage?.('safeCracker');boss={round:0,input:'',done:false};safeCard.classList.remove('opened','shake');safeResult.className='safe-result';safeResult.textContent='Masukkan jawaban sebagai 4 digit.';buildBossKeypad();renderBoss();renderBossQuestion();startTimer45(5);
  }
  function renderBossQuestion(){const q=bossRounds[boss.round];safeQuestion.innerHTML=`<strong>RONDE ${boss.round+1} / 5</strong><br>${q.q}<br><small>Jawaban ${q.a.toString().padStart(4,'0')} digit</small>`;}
  function submitBoss(){if(boss.input.length!==4){safeResult.className='safe-result bad';safeResult.textContent='⚠️ Isi 4 digit terlebih dahulu.';return;}const q=bossRounds[boss.round];if(Number(boss.input)===q.a){boss.round++;boss.input='';safeCard.classList.remove('shake');safeResult.className='safe-result success';safeResult.textContent='🟢 Kode benar! Ronde berikutnya terbuka.';if(boss.round>=bossRounds.length){finishBoss();}else{renderBoss();setTimeout(()=>{if(!boss.done)renderBossQuestion();},250);}}else{safeCard.classList.remove('shake');void safeCard.offsetWidth;safeCard.classList.add('shake');safeResult.className='safe-result bad';safeResult.textContent='🔴 Kode salah. Baca soal dan coba lagi.';}}
  function finishBoss(){if(boss.done)return;boss.done=true;stopTimers();safeCard.classList.add('opened');safeResult.className='safe-result success';safeResult.innerHTML='🔓 <strong>BRANKAS TERBUKA!</strong> Semua 5 ronde benar. 🏆';localStorage.setItem(`cerdasPlay:${window.currentSession?.id||'demo'}:mathLevel5Completed`,'true');window.saveStars?.(5,4);window.markMathLevelDone?.(5);window.saveStudentScore?.('Misteri Brankas Angka Level 5',100);window.updateDashboardProgress?.();setTimeout(()=>result(5,'success','🏆 Boss Level Ditaklukkan!','Semua 5 teka-teki matematika berhasil diselesaikan dan brankas terbuka.',4),500);}
  if($('safeClear')) $('safeClear').onclick=()=>{boss.input='';renderBoss();safeResult.className='safe-result';safeResult.textContent='Kode dihapus.';};
  if($('safeSubmit')) $('safeSubmit').onclick=submitBoss;

  /* Back buttons Level 4/5 harus kembali ke menu level. */
  ['mazeHome','mazeBack','mazeBackIcon','safeHome','safeBack'].forEach(id=>$(id)?.addEventListener('click',e=>{e.preventDefault();stopTimers();window.updateDashboardProgress?.();window.showPage?.('levels');},true));

  /* Jangan pakai prototype launch buttons sebagai jalur utama lagi; card Level 4/5 adalah game sebenarnya. */
  $('openMathMazeBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openTutorial45(4);},true);
  $('openSafeCrackerBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openTutorial45(5);},true);

  /* Level 3: setelah semua TTS benar, tampilkan popup hasil. */
  const cwBtn=$('checkCrosswordBtn');
  if(cwBtn){const old=cwBtn.onclick;cwBtn.onclick=function(e){old?.call(this,e);setTimeout(()=>{if(($('crosswordCorrect')?.textContent||'')==='4 / 4'){result(3,'success','🎉 Level 3 Selesai!','Semua jawaban TTS mendatar dan menurun benar. Kamu mendapatkan 4 bintang.',4);}},30);};}

  /* Level 1–3 tetap memakai modal hasil lama, tetapi tombolnya dibuat konsisten. */
  const oldShow=window.showLevelOutcome;
  window.showLevelOutcome=function(cfg){
    resultLevel=cfg.level||1;resultType=cfg.type||'success';
    if((cfg.level||1)>=4)return result(cfg.level,cfg.type,cfg.title,cfg.text,cfg.stars||0);
    return oldShow?.(cfg);
  };

  /* Tambahkan level 4/5 ke daftar bintang tanpa mengubah kartu lama. */
  function render45Stars(){
    const sid=window.currentSession?.id||'demo';let data={};try{data=JSON.parse(localStorage.getItem(`cerdasPlay${sid}mathStars`))||{};}catch(e){}
    [[4,level4Card],[5,level5Card]].forEach(([lv,card])=>{if(!card)return;let h=card.querySelector('.level-stars');if(!h){h=document.createElement('div');h.className='level-stars';card.querySelector('.game-preview')?.after(h);}const n=data[lv]||0;h.innerHTML=`Bintang: <span class="earned">${'★'.repeat(n)}</span><span>${'☆'.repeat(4-n)}</span>`;});
  }
  const oldRefresh=window.updateDashboardProgress; // wrapped above; refresh stars whenever menu is shown
  document.addEventListener('click',e=>{if(e.target?.id==='openMathBtn'||e.target?.id==='backToLevelsBtn'||e.target?.id==='backToLevelsIconBtn')setTimeout(render45Stars,60);});
  setTimeout(()=>{refresh45();render45Stars();},150);
  window.__progress45=()=>({maze:mazeState.challengeIndex||0,boss:boss.round||0});
})();
