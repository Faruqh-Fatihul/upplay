(function(){
  const root=document.getElementById('mathLevelsPage');
  if(!root) return;

  function getCardButton(card){
    return card.querySelector('button:not([disabled]), a, [role="button"]');
  }

  root.querySelectorAll('.level-grid > .level-card').forEach(card=>{
    card.style.cursor = 'pointer';

    /* Jika user klik area card, teruskan ke tombol level.
       Tombol asli tetap dipakai agar logic game yang sudah ada tidak dihapus. */
    card.addEventListener('click', function(e){
      const target=e.target;
      if(target.closest('button,a,input,select,textarea')) return;
      const btn=getCardButton(card);
      if(btn && !btn.disabled){
        btn.click();
      }
    });

    card.querySelectorAll('button,a').forEach(el=>{
      el.style.pointerEvents='auto';
      el.style.position='relative';
      el.style.zIndex='30';
    });
  });

  /* Paksa card tidak terpotong oleh parent overflow. */
  let grid=root.querySelector('.level-grid');
  if(grid){
    grid.style.overflowY='visible';
    grid.style.overflowX=window.innerWidth>=1180?'hidden':'auto';
  }
})();
