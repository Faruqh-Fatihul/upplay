(function(){
  const outcome=document.getElementById('levelOutcomeModal');
  const oIcon=document.getElementById('levelOutcomeIcon'), oKick=document.getElementById('levelOutcomeKicker'), oTitle=document.getElementById('levelOutcomeTitle'), oText=document.getElementById('levelOutcomeText'), oStars=document.getElementById('levelOutcomeStars'), oPrimary=document.getElementById('levelOutcomePrimary'), oSecondary=document.getElementById('levelOutcomeSecondary');
  let outcomeLevel=1, outcomeType='success';
  window.showLevelOutcome=function(cfg){
    outcomeLevel=cfg.level||1; outcomeType=cfg.type||'success';
    oIcon.textContent=cfg.type==='timeout'?'⏰':(cfg.type==='success'?'🏆':'💡');
    oKick.textContent=cfg.type==='timeout'?'WAKTU HABIS':'LEVEL BERHASIL';
    oTitle.textContent=cfg.title||'Hebat!'; oText.textContent=cfg.text||'';
    oStars.innerHTML=cfg.stars?('★'.repeat(cfg.stars)+'☆'.repeat(4-cfg.stars)):'';
    oPrimary.textContent=cfg.primary||'Lanjut'; oSecondary.textContent=cfg.secondary||'Kembali ke Menu Level';
    oPrimary.style.display=cfg.primary===false?'none':''; outcome.classList.remove('hidden');
  };
  function hide(){outcome.classList.add('hidden')}
  oSecondary.onclick=function(){hide(); if(window.stopLevelTimer)window.stopLevelTimer(); if(window.showPage)window.showPage('levels');};
  oPrimary.onclick=function(){hide(); if(window.stopLevelTimer)window.stopLevelTimer(); if(outcomeType==='timeout'){ if(window.showPage)window.showPage('levels'); setTimeout(()=>{const b=document.getElementById('startSnakeGameBtn');const m={1:b,2:document.getElementById('level2Btn'),3:document.getElementById('level3Btn')}[outcomeLevel]; if(m)m.click();},50); return;} if(outcomeLevel<3){ if(window.showPage)window.showPage('levels'); setTimeout(()=>{const m={1:document.getElementById('level2Btn'),2:document.getElementById('level3Btn')}[outcomeLevel]; if(m)m.click();},50); } else {if(window.showPage)window.showPage('levels');} };
  // Intercept legacy alerts that belong to the 1-minute level flow.
  const nativeAlert=window.alert;
  window.alert=function(msg){
    const t=String(msg||'');
    if(/Waktu \d+ menit habis/i.test(t)) { window.showLevelOutcome({type:'timeout',level:window.__activeMathLevel||1,title:'⏰ Waktu Habis',text:'Semua soal belum terjawab. Mau mencoba level ini lagi atau kembali ke menu level?',primary:'Coba Lagi'}); return; }
    if(/Memory Card selesai/i.test(t)) { const m=t.match(/mendapat (\d+) dari 4/); const st=m?Number(m[1]):4; window.showLevelOutcome({type:'success',level:2,stars:st,title:'🎉 Level 2 Selesai!',text:'Semua pasangan Memory Card 3 × 3 berhasil ditemukan.',primary:'Lanjut Level 3'}); return; }
    nativeAlert(msg);
  };

  // Patch the level-1 finish hook after the original script has installed it.
  const patchFinish=()=>{
    if(typeof window.processSpecialCell!=='function'||window.__outcomeFinishPatched)return;
    const old=window.processSpecialCell; window.processSpecialCell=function(){ const before=window.playerPosition; const r=old.apply(this,arguments); if(window.playerPosition===25 && before!==25){ const stars=Math.max(1,Math.min(4,Math.ceil((window.correctAnswers||0)/4*4))); window.__activeMathLevel=1; setTimeout(()=>window.showLevelOutcome({type:'success',level:1,stars:stars,title:'🎉 Level 1 Selesai!',text:'Kamu berhasil mencapai kotak 25. Pilih lanjut ke Memory Card atau kembali ke menu level.',primary:'Lanjut Level 2'}),180); } return r;}; window.__outcomeFinishPatched=true;
  };
  setTimeout(patchFinish,100);
  const oldStart=window.startLevelTimer;
  // The local startLevelTimer is intentionally not exported in the original file.
  // Track active level from launch buttons instead.
  document.addEventListener('click',e=>{const id=e.target?.id;if(id==='startSnakeGameBtn')window.__activeMathLevel=1;if(id==='level2Btn')window.__activeMathLevel=2;if(id==='level3Btn')window.__activeMathLevel=3;},true);

  // Patch Memory finish to use the bubble instead of alert when the original function runs.
  const patchMemory=()=>{
    if(window.__memoryOutcomePatched)return;
    const oldStartMemory=window.startMemoryGame;
    if(!oldStartMemory)return;
    // The final implementation already calls alert; our alert interception above converts it.
    window.__memoryOutcomePatched=true;
  };
  setTimeout(patchMemory,100);

  // Labirin Angka
  const maze=document.getElementById('mathMazePage'), mazeGrid=document.getElementById('mazeGrid'), mazeQuestion=document.getElementById('mazeQuestion'), mazeStatus=document.getElementById('mazeStatus');
  let mp={r:0,c:0,score:0,lives:3,challenge:false};
  const mazeMap=[[0,0,0,1,0],[1,1,0,1,0],[0,0,0,0,0],[0,1,1,1,0],[0,0,0,0,2]];
  const mazeQs=[{q:'6 × 7 = ?',a:42,opts:[36,42,48,54]},{q:'72 ÷ 8 = ?',a:9,opts:[7,8,9,12]},{q:'15 × 3 = ?',a:45,opts:[35,40,45,50]},{q:'96 ÷ 12 = ?',a:8,opts:[6,7,8,9]}]; let mq=0;
  function renderMaze(){if(!mazeGrid)return;mazeGrid.innerHTML='';mazeMap.forEach((row,r)=>row.forEach((v,c)=>{const cell=document.createElement('div');cell.className='maze-cell'+(v===1?' wall':'')+(v===2?' goal':'');cell.textContent=(r===mp.r&&c===mp.c)?'🧒':(v===2?'⭐':'');mazeGrid.appendChild(cell)}));}
  function showMazeQuestion(){const q=mazeQs[mq%mazeQs.length];mp.challenge=true;mazeQuestion.innerHTML='<h3>🧠 Tantangan Matematika</h3><div class="expr">'+q.q+'</div><div class="maze-answers">'+q.opts.map(x=>`<button data-ma=${x}>${x}</button>`).join('')+'</div>';mazeQuestion.querySelectorAll('[data-ma]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.ma)===q.a){mp.score+=25;mq++;mp.challenge=false;mazeStatus.textContent='✅ Benar! Jalan terbuka.';renderMaze();}else{mp.lives--;mazeStatus.textContent='❌ Belum tepat. Coba lagi!';document.getElementById('mazeLives').textContent='❤️'.repeat(mp.lives)+'🖤'.repeat(3-mp.lives);if(mp.lives<=0){mazeStatus.textContent='💡 Nyawa habis. Tekan tombol arah untuk mencoba rute lagi.';mp.lives=3;}}});}
  function moveMaze(dir){if(mp.challenge)return;let r=mp.r,c=mp.c;if(dir==='up')r--;if(dir==='down')r++;if(dir==='left')c--;if(dir==='right')c++;if(r<0||r>4||c<0||c>4||mazeMap[r][c]===1)return;mp.r=r;mp.c=c;renderMaze();if(mazeMap[r][c]===2){mazeStatus.textContent='🏆 Labirin selesai! Skor '+mp.score;return;}if((r+c)%3===0)showMazeQuestion();}
  document.querySelectorAll('#mathMazePage [data-move]').forEach(b=>b.onclick=()=>moveMaze(b.dataset.move));document.addEventListener('keydown',e=>{if(!maze.classList.contains('hidden')){const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(m){e.preventDefault();moveMaze(m)}}});
  function openMaze(){if(window.showPage)window.showPage('mathMaze');mp={r:0,c:0,score:0,lives:3,challenge:false};mq=0;document.getElementById('mazeScore').textContent='0';document.getElementById('mazeLives').textContent='❤️❤️❤️';mazeStatus.textContent='Capai kotak ⭐ untuk menang.';renderMaze();}

  // Safe Cracker
  const safeCard=document.getElementById('safeCard'), safeDigits=document.getElementById('safeDigits'), safeResult=document.getElementById('safeResult');let safeCode='0020',safeInput='';
  function renderSafe(){safeDigits.innerHTML=[0,1,2,3].map(i=>`<span class="safe-digit">${safeInput[i]||'_'}</span>`).join('');}
  function openSafe(){if(window.showPage)window.showPage('safeCracker');safeInput='';safeCard.classList.remove('opened','shake');safeResult.textContent='Masukkan kode 4 digit.';renderSafe();const pad=document.getElementById('safeKeypad');pad.innerHTML='';[1,2,3,4,5,6,7,8,9,0].forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{if(safeInput.length<4){safeInput+=n;renderSafe()}};pad.appendChild(b)});}
  document.getElementById('safeClear').onclick=()=>{safeInput='';renderSafe();safeResult.textContent='Kode dihapus.'};document.getElementById('safeSubmit').onclick=()=>{if(safeInput.length!==4){safeResult.textContent='⚠️ Isi 4 digit terlebih dahulu.';return}if(safeInput===safeCode){safeCard.classList.remove('shake');safeCard.classList.add('opened');safeResult.innerHTML='🔓 <strong>BRANKAS TERBUKA!</strong> Jawaban benar. 🎉';}else{safeCard.classList.remove('shake');void safeCard.offsetWidth;safeCard.classList.add('shake');safeResult.textContent='🔴 Kode salah. Pecahkan soal lagi dan coba kembali.';}};
  const navBack=()=>window.showPage&&window.showPage('levels');['mazeHome','mazeBack','mazeBackIcon','safeHome','safeBack'].forEach(id=>document.getElementById(id)?.addEventListener('click',e=>{e.preventDefault();navBack()}));document.getElementById('openMathMazeBtn')?.addEventListener('click',openMaze);document.getElementById('openSafeCrackerBtn')?.addEventListener('click',openSafe);
})();
