(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let current=null;
  const num=id=>parseInt(($(id)?.textContent||'').trim())||0;

  function info(lv){
    if(lv===1) return {name:'Level 1: Ular Tangga Pintar',detail:num('correctText')+' soal terjawab benar'};
    if(lv===2) return {name:'Level 2: Memory Card',detail:num('memoryPairs')+' dari 4 pasangan kartu ditemukan'};
    if(lv===3) return {name:'Level 3: TTS Hitung-Hitungan',detail:(window.__cwProgress?window.__cwProgress():0)+' dari 4 jawaban benar'};
    if(lv===4) return {name:'Level 4: Labirin Angka',detail:((window.__progress45&&window.__progress45().maze)||0)+' tantangan terjawab benar'};
    if(lv===5) return {name:'Level 5: Misteri Brankas Angka',detail:((window.__progress45&&window.__progress45().boss)||0)+' dari 5 teka-teki terjawab benar'};
    if(lv==='logic') return {name:'Game Logika',detail:Math.round(num('logicScore')/20)+' dari 5 soal terjawab benar'};
    if(lv==='picture') return {name:'Game Tebak Gambar',detail:Math.round(num('pictureScore')/20)+' dari 5 soal terjawab benar'};
    return {name:'',detail:''};
  }

  window.showTimeoutPopup=function(level,opts){
    if(level==='snake') level=1;
    const m=$('timeoutModalV3'); if(!m) return;
    if(!m.classList.contains('hidden')) return;               // sudah tampil
    const done=$('levelOutcomeModal');
    if(done && !done.classList.contains('hidden')) return;    // level sudah berhasil
    try{window.stopLevelTimer&&window.stopLevelTimer();}catch(e){}
    try{window.stopGameTimer&&window.stopGameTimer();}catch(e){}
    const g=$('gameTimer'); if(g) g.classList.remove('active','warning','danger');
    current=level;
    const i=info(level);
    const nyawa=opts&&opts.title&&/nyawa/i.test(opts.title);
    $('tmKicker').textContent=nyawa?'NYAWA HABIS':'WAKTU HABIS';
    $('tmTitle').textContent=nyawa?'Nyawa Habis!':'Waktu Habis!';
    $('tmText').textContent=nyawa?'Kamu kehabisan nyawa sebelum level selesai.':'Waktu pengerjaan habis sebelum semua soal selesai dijawab.';
    $('tmLevel').textContent=i.name;
    $('tmScore').textContent='📝 '+i.detail;
    m.classList.remove('hidden');
  };

  function hide(){ $('timeoutModalV3').classList.add('hidden'); }

  $('tmRetry').addEventListener('click',function(){
    const lv=current; hide();
    try{
      if(lv==='logic'){ if(typeof startLogicGame==='function') startLogicGame(typeof logicCurrentLevel!=='undefined'?logicCurrentLevel:1); window.showPage('logic'); return; }
      if(lv==='picture'){ if(typeof startPictureGame==='function') startPictureGame(typeof pictureCurrentLevel!=='undefined'?pictureCurrentLevel:1); window.showPage('picture'); return; }
      if(lv===4||lv===5){ window.__launchLevel45&&window.__launchLevel45(lv); return; }
      window.__replayLevel&&window.__replayLevel(lv);
    }catch(e){ console.error(e); }
  });

  $('tmMenu').addEventListener('click',function(){
    const lv=current; hide();
    try{window.stopLevelTimer&&window.stopLevelTimer();}catch(e){}
    try{window.stopGameTimer&&window.stopGameTimer();}catch(e){}
    if(lv==='logic'||lv==='picture'){ window.showPage(typeof homePageForSession==='function'?homePageForSession():'dashboard'); return; }
    try{window.updateDashboardProgress&&window.updateDashboardProgress();}catch(e){}
    window.showPage('levels');
  });

  // Popup timeout lama (generik) dimatikan; hanya popup di atas yang dipakai.
  const prev=window.showLevelOutcome;
  window.showLevelOutcome=function(cfg){
    if(cfg && cfg.type==='timeout') return;
    return prev && prev.apply(this,arguments);
  };
})();
