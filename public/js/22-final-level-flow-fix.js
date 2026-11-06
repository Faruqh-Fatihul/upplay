(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const levelGrid=$('mathLevelsPage')?.querySelector('.level-grid');
  const prototype=$('mathPrototypeStrip');

  /* Jadikan Level 1-5 satu barisan horizontal. */
  if(levelGrid){
    const c4=$('level4Card'), c5=$('level5Card');
    if(c4) levelGrid.appendChild(c4);
    if(c5) levelGrid.appendChild(c5);
    if(prototype && prototype.parentElement===levelGrid){
      prototype.remove();
      $('mathLevelsPage')?.querySelector('main')?.appendChild(prototype);
    }
  }

  const sessionId=()=>window.currentSession?.id||'demo';
  const doneKey=lv=>`cerdasPlay:${sessionId()}:mathLevel${lv}Completed`;
  const starsKey=()=>`cerdasPlay${sessionId()}mathStars`;

  function unlockCard(lv){
    const card=$(`level${lv}Card`),num=$(`level${lv}Number`),btn=$(`level${lv}Btn`);
    if(!card||!btn)return;
    card.style.display='block';
    card.classList.remove('locked'); card.classList.add('active');
    if(num)num.textContent=String(lv);
    btn.disabled=false;
    btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary');
    btn.textContent=`Mainkan Level ${lv}`;
  }

  function syncUnlocks(){
    for(let lv=2;lv<=5;lv++){
      if(localStorage.getItem(doneKey(lv-1))!=='true')break;
      unlockCard(lv);
      if(localStorage.getItem(doneKey(lv))==='true'){
        const n=$(`level${lv}Number`); if(n)n.textContent='✓';
      }
    }
  }

  function completeLevel1(){
    localStorage.setItem(doneKey(1),'true');
    let data={};
    try{data=JSON.parse(localStorage.getItem(starsKey())||'{}')}catch(e){}
    data[1]=Math.max(Number(data[1]||0),4);
    localStorage.setItem(starsKey(),JSON.stringify(data));
    unlockCard(2);
    try{window.updateDashboardProgress?.()}catch(e){}
    unlockCard(2);
  }

  let successShown=false, timeoutShown=false;

  function openSuccess(){
    if(successShown)return;
    successShown=true;
    completeLevel1();
    const m=$('levelOutcomeModal');
    if(!m)return;
    $('levelOutcomeIcon').textContent='🎉';
    $('levelOutcomeKicker').textContent='LEVEL BERHASIL';
    $('levelOutcomeTitle').textContent='Level 1 Selesai!';
    $('levelOutcomeText').textContent='Hebat! Kamu berhasil menyelesaikan Level 1 dan mendapatkan 4 bintang. Pilih Lanjut Level 2 atau kembali ke menu level.';
    $('levelOutcomeStars').innerHTML='★★★★';
    $('levelOutcomePrimary').textContent='Lanjut Level 2';
    $('levelOutcomeSecondary').textContent='Kembali ke Menu Level';
    $('levelOutcomePrimary').style.display='';
    $('levelOutcomeSecondary').style.display='';
    m.classList.remove('hidden');
  }

  function openTimeout(level){
    if(timeoutShown)return;
    timeoutShown=true;
    const m=$('levelOutcomeModal');
    if(!m)return;
    $('levelOutcomeIcon').textContent='⏰';
    $('levelOutcomeKicker').textContent='WAKTU HABIS';
    $('levelOutcomeTitle').textContent='Semua soal belum terjawab';
    $('levelOutcomeText').textContent=`Waktu 3 menit habis. Level ${level} belum selesai. Mau mencoba lagi atau kembali ke menu level?`;
    $('levelOutcomeStars').innerHTML='';
    $('levelOutcomePrimary').textContent='Coba Lagi';
    $('levelOutcomeSecondary').textContent='Kembali ke Menu Level';
    $('levelOutcomePrimary').style.display='';
    $('levelOutcomeSecondary').style.display='';
    m.classList.remove('hidden');
  }

  /* Engine final menandai finish dengan teks ini. Ini memperbaiki popup
     yang sebelumnya tidak muncul karena state game berada di closure lain. */
  const ql=$('questionLabel'), qt=$('questionText');
  if(ql){
    const obs=new MutationObserver(()=>{
      const a=(ql.textContent||'').toUpperCase();
      const b=(qt?.textContent||'').toUpperCase();
      if(a.includes('LEVEL 1 SELESAI') || (a.includes('LEVEL BERHASIL')&&b.includes('KOTAK 25'))) openSuccess();
    });
    obs.observe(ql,{childList:true,subtree:true,characterData:true});
    if(qt)obs.observe(qt,{childList:true,subtree:true,characterData:true});
  }

  /* Reset popup flag ketika Level 1 dimainkan lagi. */
  $('startSnakeGameBtn')?.addEventListener('click',()=>{
    successShown=false; timeoutShown=false;
  },true);

  /* Tombol popup Level 1 sekarang membuka Memory Card secara langsung. */
  /* listener ganda dihapus: alur Level 1 -> Level 2 lewat tutorial + countdown */

  /* Saat kembali ke menu level, baca progress dari localStorage lagi. */
  const oldShow=window.showPage;
  if(typeof oldShow==='function'){
    window.showPage=function(page){
      const r=oldShow.apply(this,arguments);
      if(page==='levels')setTimeout(syncUnlocks,40);
      return r;
    };
  }

  /* Pastikan timeout lama tidak menjadi alert browser. */
  const nativeAlert=window.alert;
  window.alert=function(msg){
    const t=String(msg||'');
    if(/Waktu \d+ menit habis/i.test(t)){
      openTimeout(window.__activeMathLevel||1);
      return;
    }
    return nativeAlert(msg);
  };

  syncUnlocks();
})();
