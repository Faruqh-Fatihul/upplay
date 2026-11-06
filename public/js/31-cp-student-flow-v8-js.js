(function(){
  'use strict';
  if(window.__cpFlowV8) return; window.__cpFlowV8=true;
  var $=function(id){return document.getElementById(id)};
  var BTN={1:'startSnakeGameBtn',2:'level2Btn',3:'level3Btn',4:'level4Btn',5:'level5Btn'};
  var LV_OF={startSnakeGameBtn:1,level2Btn:2,level3Btn:3,level4Btn:4,level5Btn:5,openMathMazeBtn:4,openSafeCrackerBtn:5};
  var PAGES=['snakeGamePage','memoryPage','crosswordGamePage','mathMazePage','safeCrackerPage'];
  var bypass=0, gateOpen=false;

  var RULES={
    1:{name:'Ular Tangga Pintar',goal:'Capai kotak finish 25 sebelum waktu habis.',
       rules:['Jawab soal dengan benar untuk membuka dadu.','Kocok dadu dan gerakkan pion menuju kotak 25.','Tangga membantu naik, kepala ular memberi soal sulit.','Selesaikan level untuk mendapatkan hingga 4 bintang.']},
    2:{name:'Memory Card Angka',goal:'Temukan semua pasangan operasi hitung dan hasilnya.',
       rules:['Ada 8 kartu (4 pasangan) pada papan 2 × 4.','Buka dua kartu pada setiap giliran.','Pasangkan operasi hitung dengan hasil yang benar.','Temukan semua pasangan sebelum waktu habis untuk mendapat 4 bintang.']},
    3:{name:'TTS Hitung-Hitungan',goal:'Isi semua kata pada kotak mendatar dan menurun.',
       rules:['Baca petunjuk Mendatar dan Menurun.','Tulis jawaban dalam bentuk kata, contoh 4 × 2 = DELAPAN.','Perhatikan huruf yang bertemu pada kotak persilangan.','Gunakan Petunjuk jika buntu, lalu tekan Periksa Jawaban.']},
    4:{name:'Labirin Angka',goal:'Temukan jalan menuju 💎 sebelum waktu habis.',
       rules:['Gerakkan 🧒 dengan tombol panah di layar atau tombol panah keyboard.','Jebakan 💥 bisa muncul di jalan: jawab soal dengan benar agar bisa lanjut.','Jawaban benar membuka 5 petak hijau sebagai petunjuk menuju 💎.','Semua labirin bisa diselesaikan. Cari jalur yang tidak buntu!']},
    5:{name:'Misteri Brankas Angka',goal:'Pecahkan 5 teka-teki dan buka brankas.',
       rules:['Setiap ronde punya satu soal matematika.','Masukkan jawaban sebagai 4 digit lewat keypad, contoh 15 → 0015.','Tekan Buka untuk memeriksa. Kode salah? Soalnya tetap, coba lagi.','Selesaikan 5 ronde sebelum waktu habis.']}
  };

  /* ---------- jeda: timer 1 detik berhenti saat popup keluar tampil ---------- */
  if(!window.__cpIntervalWrap){
    window.__cpIntervalWrap=true;
    var _si=window.setInterval;
    window.setInterval=function(fn,ms){
      var a=Array.prototype.slice.call(arguments);
      if(typeof fn==='function'&&ms===1000){a[0]=function(){if(window.__cpPaused)return;return fn.apply(this,arguments)}}
      return _si.apply(window,a);
    };
  }

  function stopAll(){
    ['__stopSnakeTimer','__stopRequestedLevelTimer','stopLevelTimer','__cp5StopTimer','stopGameTimer'].forEach(function(n){
      try{if(typeof window[n]==='function')window[n]()}catch(e){}
    });
  }
  function show(m){m.classList.add('cp-show')}
  function hide(m){m.classList.remove('cp-show')}

  /* ---------- hitung mundur 3,2,1 (overlay yang sama dengan Level 1) ---------- */
  function countdown(cb){
    var ov=$('countdownOverlay'),num=$('countdownNumber');
    if(window.__cpSkipCD||window.__cpRoomBusy){window.__cpSkipCD=false;cb();return}
    if(!ov||!num){cb();return}
    ov.style.display='';ov.style.pointerEvents='';ov.classList.add('active');
    var n=3;
    (function tick(){
      if(n<=0){
        ov.classList.remove('active');ov.style.display='none';
        requestAnimationFrame(function(){ov.style.display='';try{cb()}catch(err){console.error(err)}});
        return;
      }
      num.textContent=n;num.style.animation='none';void num.offsetWidth;num.style.animation='countPulse .9s ease-in-out';
      n--;setTimeout(tick,850);
    })();
  }

  function clickBypass(el){bypass++;try{if(window.__cpRoomBusy&&el&&el.disabled)el.disabled=false;el.click()}finally{bypass--}}

  /* ---------- mulai game (tanpa rules) — dipakai juga untuk "Coba Lagi" ---------- */
  function launch(lv){
    stopAll();
    if(lv===1){
      /* Level 1: pakai jalur aslinya (tutorial lama disembunyikan, hitung mundur aslinya yang jalan) */
      document.body.classList.add('cp-hide-old-tut');
      clickBypass($('startSnakeGameBtn'));
      setTimeout(function(){
        var s=$('startTutorialGameBtn');if(s)s.click();
        setTimeout(function(){document.body.classList.remove('cp-hide-old-tut')},400);
      },0);
      return;
    }
    countdown(function(){
      if(lv===2||lv===3){if(window.__cpRoomBusy&&typeof window.__cp5LaunchLevel==='function')window.__cp5LaunchLevel(lv);else clickBypass($(BTN[lv]))}
      else if(lv===4&&typeof window.__startRequestedMaze==='function'){window.__startRequestedMaze()}
      else if(lv===5&&typeof window.__startRequestedSafe==='function'){window.__startRequestedSafe()}
      else{clickBypass($(BTN[lv]))}
    });
  }

  window.__cpLaunchMath=launch;
  /* ---------- popup rules ---------- */
  function onGamePage(){
    return PAGES.some(function(id){var e=$(id);return e&&!e.classList.contains('hidden')});
  }
  function openRules(lv){
    if(gateOpen||!RULES[lv])return;
    gateOpen=true;
    /* datang dari popup hasil level: kembali ke menu level dulu, rules tampil di atasnya */
    if(onGamePage()){stopAll();try{if(typeof window.showPage==='function')window.showPage('levels')}catch(e){}}
    var d=RULES[lv],m=$('cpRulesModal');
    $('cpRulesBadge').textContent='Level '+lv;
    $('cpRulesTitle').textContent=d.name;
    $('cpRulesGoal').textContent=d.goal;
    $('cpRulesTime').textContent='3 menit';
    $('cpRulesList').innerHTML=d.rules.map(function(x){return '<li>'+x+'</li>'}).join('');
    m.dataset.level=lv;show(m);
    setTimeout(function(){$('cpRulesStart').focus()},30);
  }
  function closeRules(){hide($('cpRulesModal'));gateOpen=false}
  $('cpRulesClose').addEventListener('click',closeRules);
  $('cpRulesStart').addEventListener('click',function(){
    var lv=+$('cpRulesModal').dataset.level;
    hide($('cpRulesModal'));
    launch(lv);
    setTimeout(function(){gateOpen=false},600);
  });

  /* ---------- popup keluar ---------- */
  function openExit(){
    var m=$('cpExitModal');if(m.classList.contains('cp-show'))return;
    window.__cpPaused=true;show(m);
    setTimeout(function(){$('cpExitNo').focus()},30);
  }
  function closeExit(){window.__cpPaused=false;hide($('cpExitModal'))}
  $('cpExitNo').addEventListener('click',closeExit);
  $('cpExitYes').addEventListener('click',function(){
    closeExit();stopAll();
    ['levelOutcomeModal','timeoutModalV3','cp5Outcome'].forEach(function(id){var e=$(id);if(e)e.classList.add('hidden')});
    var ov=$('countdownOverlay');if(ov)ov.classList.remove('active');
    try{if(typeof window.updateDashboardProgress==='function')window.updateDashboardProgress()}catch(e){}
    if(typeof window.showPage==='function')window.showPage('levels');
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    if($('cpExitModal').classList.contains('cp-show')){closeExit()}
    else if($('cpRulesModal').classList.contains('cp-show')){closeRules()}
  });

  /* ---------- panah keluar Level 5 ---------- */
  (function(){
    var sp=$('safeCrackerPage');
    if(sp&&!$('safeExitArrow')){
      var b=document.createElement('button');
      b.type='button';b.id='safeExitArrow';b.setAttribute('aria-label','Keluar dari permainan');b.textContent='←';
      sp.appendChild(b);
    }
  })();

  /* ---------- pencegat klik (level window = jalan paling awal) ---------- */
  var EXIT_SEL=PAGES.map(function(p){return '#'+p+' .topbar .brand'}).concat(
    ['snakeGamePage','memoryPage','crosswordGamePage','mathMazePage'].map(function(p){return '#'+p+' .page-head .back-btn'}),
    ['#safeExitArrow']).join(',');

  window.addEventListener('click',function(e){
    if(bypass>0)return;
    var t=e.target;if(!t||!t.closest)return;

    /* 1) tombol Mainkan Level -> rules dulu */
    var b=t.closest('#startSnakeGameBtn,#level2Btn,#level3Btn,#level4Btn,#level5Btn,#openMathMazeBtn,#openSafeCrackerBtn');
    if(b){
      e.preventDefault();e.stopImmediatePropagation();
      if(b.disabled)return;
      openRules(LV_OF[b.id]);
      return;
    }

    /* 2) panah kiri atas / logo di dalam game -> konfirmasi keluar */
    if(t.closest(EXIT_SEL)){
      e.preventDefault();e.stopImmediatePropagation();
      openExit();return;
    }

    /* 3) popup hasil Level 2/3 (cp5Outcome): Lanjut -> rules level berikutnya, Coba Lagi -> hitung mundur */
    var p=t.closest('#cp5Primary');
    if(p){
      var txt=p.textContent||'',mm=/Lanjut Level\s*(\d)/.exec(txt);
      if(mm){
        e.preventDefault();e.stopImmediatePropagation();
        var o=$('cp5Outcome');if(o)o.classList.add('hidden');
        stopAll();openRules(+mm[1]);return;
      }
      if(/Coba Lagi/i.test(txt)){
        e.preventDefault();e.stopImmediatePropagation();
        var o2=$('cp5Outcome');if(o2)o2.classList.add('hidden');
        var lvRetry=+(/Level\s*(\d)/.exec((($('cp5Title')||{}).textContent||'')+' '+(($('cp5Text')||{}).textContent||''))||[0,0])[1];
        stopAll();
        if(lvRetry>=1&&lvRetry<=5)launch(lvRetry);else clickBypass(p);
        return;
      }
    }

    /* 4) popup "Waktu Habis" (timeoutModalV3): Main Lagi -> mesin level yang benar + hitung mundur */
    var r=t.closest('#tmRetry');
    if(r){
      var lvT=(/Level\s*(\d)/.exec(($('tmLevel')||{}).textContent||'')||[0,0])[1];
      lvT=+lvT;
      if(lvT>=1&&lvT<=5){
        e.preventDefault();e.stopImmediatePropagation();
        var tm=$('timeoutModalV3');if(tm)tm.classList.add('hidden');
        stopAll();launch(lvT);return;
      }
    }
  },true);
})();
