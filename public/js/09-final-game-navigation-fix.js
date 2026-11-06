(function(){
  'use strict';

  function restoreStudentSession(){
    try{
      if(!window.currentSession){
        const raw=sessionStorage.getItem('cerdasPlaySession');
        if(raw) window.currentSession=JSON.parse(raw);
      }
    }catch(e){}
    return window.currentSession;
  }

  function directShow(pageName){
    const session=restoreStudentSession();
    if(!session || session.role!=='student'){
      alert('Silakan masuk sebagai siswa terlebih dahulu.');
      return false;
    }

    // Gunakan sistem navigasi utama jika tersedia.
    if(typeof window.showPage==='function'){
      try{
        window.showPage(pageName);
        return true;
      }catch(e){
        console.warn('Navigasi utama gagal, memakai fallback:',e);
      }
    }

    // Fallback: pastikan perpindahan halaman tetap terjadi walaupun
    // ada fungsi lama yang error.
    const ids={
      dashboard:'studentDashboard',
      levels:'mathLevelsPage',
      snake:'snakeGamePage',
      memory:'memoryPage',
      crossword:'crosswordGamePage',
      logic:'logicGamePage',
      picture:'pictureGamePage'
    };
    document.querySelectorAll('.app-view').forEach(el=>el.classList.add('hidden'));
    const target=document.getElementById(ids[pageName]);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
    return !!target;
  }

  function openMath(){
    if(typeof window.updateDashboardProgress==='function'){
      try{ window.updateDashboardProgress(); }catch(e){ console.warn(e); }
    }
    directShow('levels');
  }

  function openLogic(){
    directShow('logic');
    setTimeout(function(){
      if(typeof window.startLogicGame==='function'){
        try{ window.startLogicGame(1); }catch(e){ console.warn(e); }
      }
    },20);
  }

  function openPicture(){
    directShow('picture');
    setTimeout(function(){
      if(typeof window.startPictureGame==='function'){
        try{ window.startPictureGame(1); }catch(e){ console.warn(e); }
      }
    },20);
  }

  function bindCard(id,handler){
    const el=document.getElementById(id);
    if(!el) return;
    el.type='button';
    el.style.cursor='pointer';
    el.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      handler();
    },true);
    // Inline fallback untuk browser yang mempertahankan handler lama.
    el.dataset.gameNavigation='true';
  }

  function init(){
    bindCard('openMathBtn',openMath);
    bindCard('openLogicBtn',openLogic);
    bindCard('openPictureBtn',openPicture);

    // Pastikan tombol menu Game dari dashboard siswa membuka panel game.
    document.querySelectorAll('[data-open-student-view="game"]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        document.querySelectorAll('.student-view').forEach(v=>v.classList.add('hidden'));
        const game=document.getElementById('studentViewGame');
        if(game) game.classList.remove('hidden');
      },true);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  // Ekspos agar bisa diuji/diakses dari tombol HTML bila diperlukan.
  window.openCerdasPlayMath=openMath;
  window.openCerdasPlayLogic=openLogic;
  window.openCerdasPlayPicture=openPicture;
})();
