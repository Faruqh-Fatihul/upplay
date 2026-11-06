(function(){
  'use strict';
  function hideTransitionLayers(){
    const modal=document.getElementById('gameTutorialModal');
    const overlay=document.getElementById('countdownOverlay');
    if(modal){ modal.classList.add('hidden'); modal.style.pointerEvents='none'; }
    if(overlay){ overlay.classList.remove('active'); overlay.style.display='none'; overlay.style.pointerEvents='none'; }
  }
  window.__cerdasPlayShowGame=function(page){
    hideTransitionLayers();
    try{ if(typeof window.showPage==='function') window.showPage(page); }catch(e){ console.error(e); }
    requestAnimationFrame(()=>{
      const ids={snake:'snakeGamePage',memory:'memoryPage',crossword:'crosswordGamePage'};
      document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
      const target=document.getElementById(ids[page]);
      if(target) target.classList.remove('hidden');
      window.scrollTo({top:0,behavior:'auto'});
      hideTransitionLayers();
    });
  };
})();
