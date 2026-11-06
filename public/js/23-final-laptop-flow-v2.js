(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const sid=()=>window.currentSession?.id||'demo';
  const doneKey=lv=>`cerdasPlay:${sid()}:mathLevel${lv}Completed`;

  /* Remove the old prototype block from layout, without touching the actual
     Labirin/Brankas game pages or Level 4/5 cards. */
  const proto=$('mathPrototypeStrip');
  if(proto) proto.remove();

  /* Keep Level 1-5 in one horizontal row. */
  const grid=document.querySelector('#mathLevelsPage .level-grid');
  if(grid){
    const c4=$('level4Card'),c5=$('level5Card');
    if(c4)grid.appendChild(c4);
    if(c5)grid.appendChild(c5);
  }

  /* Make Level 4/5 point to the real converted games, never the retired prototypes. */
  function refreshCards(){
    const c4=$('level4Card'),c5=$('level5Card'),b4=$('level4Btn'),b5=$('level5Btn');
    if(!c4||!c5)return;
    [c4,c5].forEach(c=>c.style.display='block');
    const ok4=localStorage.getItem(doneKey(3))==='true';
    const ok5=localStorage.getItem(doneKey(4))==='true';
    c4.classList.toggle('locked',!ok4);c4.classList.toggle('active',ok4);
    c5.classList.toggle('locked',!ok5);c5.classList.toggle('active',ok5);
    if($('level4Number'))$('level4Number').textContent=ok4?(localStorage.getItem(doneKey(4))==='true'?'✓':'4'):'🔒';
    if($('level5Number'))$('level5Number').textContent=ok5?'✓':'🔒';
    if(b4){b4.disabled=!ok4;b4.textContent=ok4?'Mainkan Level 4':'Selesaikan Level 3'}
    if(b5){b5.disabled=!ok5;b5.textContent=ok5?'Mainkan Level 5':'Selesaikan Level 4'}
  }
  refreshCards();
  window.addEventListener('load',refreshCards);

  /* A dedicated Level-1 timer. The old timer remains untouched for other
     games; this one guarantees Level 1 gets the requested 1-minute flow. */
  let l1Timer=null,l1Left=180,l1Started=false,l1ResultShown=false;
  function setTimerText(sec){
    const __s=Math.max(0,sec),t=`${String(Math.floor(__s/60)).padStart(2,'0')}:${String(__s%60).padStart(2,'0')}`;
    const a=$('gameTimerText');if(a)a.textContent=t;
    const g=$('gameTimer');if(g)g.classList.add('active');
  }
  function stopL1Timer(){
    if(l1Timer)clearInterval(l1Timer);
    l1Timer=null;l1Started=false;
    const g=$('gameTimer');if(g)g.classList.remove('active','warning','danger');
  }
  function level1Timeout(){
    if(l1ResultShown)return;
    l1ResultShown=true;stopL1Timer();
    if(typeof window.showLevelOutcome==='function'){
      window.showLevelOutcome({
        type:'timeout',level:1,
        title:'⏰ Waktu Habis',
        text:'Semua soal belum terjawab. Mau mencoba lagi atau kembali ke menu level?',
        primary:'Coba Lagi',secondary:'Kembali ke Menu Level'
      });
    }
  }
  function startL1Timer(){
    stopL1Timer();l1Left=180;l1ResultShown=false;l1Started=true;setTimerText(l1Left);
    l1Timer=setInterval(()=>{
      l1Left--;setTimerText(l1Left);
      if(l1Left<=0)level1Timeout();
    },1000);
  }

  /* Start timer after the existing 3-2-1 launch. */
  document.addEventListener('click',function(e){
    const id=e.target?.id;
    if(id==='startTutorialGameBtn')return;
    if(id==='startSnakeGameBtn' && !e.defaultPrevented){
      /* countdown/tutorial handlers will actually launch the game; timer starts
         only once the snake page becomes visible. */
      setTimeout(()=>{
        if(!$('snakeGamePage')?.classList.contains('hidden'))startL1Timer();
      },2900);
    }
  },true);

  /* Reliable finish detection: local processSpecialCell is not exposed by
     the original game, so observe the actual position UI. */
  let finishWatcher=null;
  function watchL1Finish(){
    clearInterval(finishWatcher);
    finishWatcher=setInterval(()=>{
      if($('snakeGamePage')?.classList.contains('hidden'))return;
      const pos=($('positionText')?.textContent||'').trim();
      if(/^25\s*\/\s*25$/.test(pos) && !l1ResultShown){
        l1ResultShown=true;stopL1Timer();
        const stars=Math.max(1,Math.min(4,Math.ceil((Number(window.correctAnswers||$('correctText')?.textContent||0)/4)*4)));
        localStorage.setItem(doneKey(1),'true');
        let data={};try{data=JSON.parse(localStorage.getItem(`cerdasPlay${sid()}mathStars`)||'{}')}catch(_){}
        data[1]=Math.max(Number(data[1]||0),stars);
        localStorage.setItem(`cerdasPlay${sid()}mathStars`,JSON.stringify(data));
        if(typeof window.markMathLevelDone==='function')window.markMathLevelDone(1);
        if(typeof window.updateDashboardProgress==='function')window.updateDashboardProgress();
        if(typeof window.showLevelOutcome==='function'){
          window.showLevelOutcome({
            type:'success',level:1,stars:stars,
            title:'🎉 Level 1 Selesai!',
            text:'Berhasil! Semua tantangan Level 1 selesai dan Level 2 sekarang terbuka.',
            primary:'Lanjut Level 2',secondary:'Kembali ke Menu Level'
          });
        }
        refreshCards();
      }
    },180);
  }
  watchL1Finish();

  /* Catch the original browser alert used by the legacy timer as a safety net. */
  const nativeAlert=window.alert.bind(window);
  window.alert=function(msg){
    const text=String(msg||'');
    if(/Waktu \d+ menit habis/i.test(text)){
      const page=$('snakeGamePage')?.classList.contains('hidden')?null:1;
      if(page){level1Timeout();return;}
      if(typeof window.showLevelOutcome==='function'){
        window.showLevelOutcome({type:'timeout',level:1,title:'⏰ Waktu Habis',text:'Semua soal belum terjawab. Mau mencoba lagi atau kembali ke menu level?',primary:'Coba Lagi',secondary:'Kembali ke Menu Level'});
        return;
      }
    }
    return nativeAlert(msg);
  };

  /* Popup button logic: Level 1 -> Level 2. Timeout retry restarts Level 1. */
  const primary=$('levelOutcomePrimary'),secondary=$('levelOutcomeSecondary');
  if(primary){
    primary.addEventListener('click',function(){
      const title=$('levelOutcomeTitle')?.textContent||'';
      if(title.includes('Level 1')){
        $('levelOutcomeModal')?.classList.add('hidden');
        refreshCards();
        setTimeout(()=>{
          const b=$('level2Btn');
          if(b&&!b.disabled)b.click();
        },80);
      }
    },true);
  }
  if(secondary){
    secondary.addEventListener('click',function(){
      /* Existing handler returns to menu. This guard only refreshes cards. */
      setTimeout(refreshCards,50);
    },true);
  }

  /* Ensure any completion flag immediately unlocks the next card. */
  const oldUpdate=window.updateDashboardProgress;
  if(oldUpdate && !window.__level45RefreshWrapped){
    window.__level45RefreshWrapped=true;
    window.updateDashboardProgress=function(){
      const r=oldUpdate.apply(this,arguments);refreshCards();return r;
    };
  }
})();
