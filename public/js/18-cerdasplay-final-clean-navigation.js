(function(){
  'use strict';

  /* ==================================================================
     SATU-SATUNYA "OTORITAS" NAVIGASI TOMBOL BACK/HOME.
     Sebelumnya ada banyak skrip perbaikan bertumpuk yang saling menimpa
     event listener tombol back (ada yang capture:true, ada yang tidak,
     ada yang stopImmediatePropagation, ada yang tidak) sehingga hasilnya
     tidak konsisten. Skrip ini didaftarkan PALING AKHIR pada `document`
     dengan capture:true, sehingga pasti dijalankan lebih dulu daripada
     listener apa pun yang menempel langsung di tombolnya, lalu langsung
     menghentikan propagasi supaya hanya alur ini yang menentukan halaman
     berikutnya. Alur permainan/skor/timer pada skrip-skrip lama TETAP
     dipakai apa adanya — yang diperbaiki di sini HANYA "kemana tombol
     back/home ini harus membawa pengguna", supaya selalu benar.
  ================================================================== */

  const DASHBOARD_TARGETS = new Set([
    "dashboardHome","levelsHome","snakeHome","logicHome",
    "pictureHome","memoryHome","crosswordHome",
    "backLogicDashboard","backLogicIconBtn",
    "backPictureDashboard","backPictureIconBtn"
  ]);

  const LEVELS_TARGETS = new Set([
    "backToLevelsBtn","backToLevelsIconBtn",
    "backToLevelsFromMemory","backMemoryIconBtn",
    "backCrosswordLevels","backCrosswordIcon"
  ]);

  function stopAllRunningTimers(){
    try{ typeof window.stopGameTimer==="function" && window.stopGameTimer(); }catch(e){}
    try{ typeof window.stopLevelTimer==="function" && window.stopLevelTimer(); }catch(e){}
    try{ typeof window.__stopSnakeTimer==="function" && window.__stopSnakeTimer(); }catch(e){}
  }

  function hideAnyLeftoverOverlay(){
    const modal=document.getElementById("gameTutorialModal");
    const overlay=document.getElementById("countdownOverlay");
    if(modal){ modal.classList.add("hidden"); modal.style.pointerEvents=""; }
    if(overlay){ overlay.classList.remove("active"); overlay.style.display=""; overlay.style.pointerEvents=""; }
  }

  function goTo(page){
    stopAllRunningTimers();
    hideAnyLeftoverOverlay();

    if(page==="levels" && typeof window.updateDashboardProgress==="function"){
      try{ window.updateDashboardProgress(); }catch(e){}
    }

    if(typeof window.showPage==="function"){
      window.showPage(page);
    }else{
      document.querySelectorAll(".app-view").forEach(v=>v.classList.add("hidden"));
      const fallbackIds={dashboard:"studentDashboard",levels:"mathLevelsPage"};
      const el=document.getElementById(fallbackIds[page]);
      if(el) el.classList.remove("hidden");
    }
    window.scrollTo({top:0,behavior:"auto"});
  }

  document.addEventListener("click", function(e){
    const el = e.target.closest("a,button");
    if(!el) return;
    const id = el.id;

    if(id && DASHBOARD_TARGETS.has(id)){
      e.preventDefault();
      e.stopPropagation();
      // Guru dan siswa memakai tombol Home/Dashboard yang sama di halaman game;
      // arahkan pulang sesuai peran yang sedang login (guru -> portal guru).
      goTo(typeof homePageForSession==="function" ? homePageForSession() : "dashboard");
      return;
    }
    if(id && LEVELS_TARGETS.has(id)){
      e.preventDefault();
      e.stopPropagation();
      goTo("levels");
      return;
    }
    if(el.classList.contains("back-dashboard")){
      e.preventDefault();
      e.stopPropagation();
      goTo(typeof homePageForSession==="function" ? homePageForSession() : "dashboard");
      return;
    }
  }, true);
})();
