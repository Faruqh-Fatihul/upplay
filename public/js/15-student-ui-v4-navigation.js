(function(){
  "use strict";

  const $ = id => document.getElementById(id);

  function stopAllGameTimers(){
    try{ window.stopGameTimer?.(); }catch(e){}
    try{ window.stopLevelTimer?.(); }catch(e){}
    try{ window.__stopSnakeTimer?.(); }catch(e){}
  }

  function moveGameCardsCorrectly(){
    const source = document.querySelector("#studentViewGame .game-mini-grid");
    const target = $("dashboardGameGrid");
    if(!source || !target) return;

    /* Never append the grid wrapper into itself. Move only its cards. */
    const cards = Array.from(source.querySelectorAll(":scope > .subject-card"));
    cards.forEach(card => {
      if(card.parentElement !== target) target.appendChild(card);
    });

    target.classList.add("dashboard-game-grid");
  }

  function showStudentView(view){
    view = view === "profile" ? "profile" : "dashboard";

    /* Student portal only: never expose the old standalone Game view here. */
    document.querySelectorAll("#studentDashboard .student-view").forEach(v => {
      v.classList.add("hidden");
      v.setAttribute("aria-hidden","true");
    });

    const target = view === "profile" ? $("studentViewProfile") : $("studentViewDashboard");
    if(target){
      target.classList.remove("hidden");
      target.setAttribute("aria-hidden","false");
    }

    document.querySelectorAll("#studentDashboard .student-menu").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.studentView === view);
    });

    const title = $("studentPageTitle");
    const subtitle = $("studentPageSubtitle");
    if(title) title.textContent = view === "profile" ? "Profil Siswa" : "Dashboard";
    if(subtitle) subtitle.textContent = view === "profile"
      ? "Kelola data pribadi dan keamanan akunmu."
      : "Selamat datang di dashboard belajarmu.";

    /* Keep profile content completely isolated to the Profile view. */
    const oldGame = $("studentViewGame");
    if(oldGame) oldGame.classList.add("hidden");

    try{ window.renderStudentGameAvailability?.(); }catch(e){}
    window.scrollTo({top:0,behavior:"auto"});
  }

  function goDashboardFromGame(event){
    if(event){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    stopAllGameTimers();

    document.querySelectorAll(".app-view").forEach(v => v.classList.add("hidden"));
    const dash = $("studentDashboard");
    if(dash) dash.classList.remove("hidden");

    /* When returning to the student dashboard, always show Dashboard, never Profile. */
    showStudentView("dashboard");
    try{ window.showPage?.("dashboard"); }catch(e){}
    window.scrollTo({top:0,behavior:"auto"});
  }

  function goLevelsFromGame(event){
    if(event){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    stopAllGameTimers();

    document.querySelectorAll(".app-view").forEach(v => v.classList.add("hidden"));
    const levels = $("mathLevelsPage");
    if(levels) levels.classList.remove("hidden");

    try{ window.updateDashboardProgress?.(); }catch(e){}
    try{ window.showPage?.("levels"); }catch(e){}
    window.scrollTo({top:0,behavior:"auto"});
  }

  function bindCapture(id, handler){
    const el = $(id);
    if(!el || el.dataset.v4Bound === "1") return;
    el.dataset.v4Bound = "1";
    el.addEventListener("click", handler, true);
  }

  function bindNavigation(){
    moveGameCardsCorrectly();

    document.querySelectorAll("#studentDashboard .student-menu").forEach(btn=>{
      if(btn.dataset.v4Menu === "1") return;
      btn.dataset.v4Menu = "1";
      btn.addEventListener("click",function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        showStudentView(this.dataset.studentView);
      },true);
    });

    /* Dashboard buttons/cards: preserve the actual game-opening handlers. */
    ["openMathBtn","openLogicBtn","openPictureBtn"].forEach(id=>{
      const el=$(id);
      if(el && el.dataset.v4Move!=="1"){
        el.dataset.v4Move="1";
        /* Only ensure it is a real button; do not replace its original game listener. */
        el.setAttribute("type","button");
      }
    });

    /* Level page -> Dashboard */
    document.querySelectorAll("#mathLevelsPage .back-dashboard").forEach(el=>{
      if(el.dataset.v4Back==="1") return;
      el.dataset.v4Back="1";
      el.addEventListener("click",goDashboardFromGame,true);
    });
    bindCapture("levelsHome",goDashboardFromGame);

    /* Snake / Memory / Crossword / Logic / Picture back buttons. */
    ["snakeHome","backToLevelsBtn","backToLevelsIconBtn",
     "backToLevelsFromMemory","backMemoryIconBtn",
     "backLogicDashboard","backLogicIconBtn",
     "backPictureDashboard","backPictureIconBtn"].forEach(id=>{
       const el=$(id);
       if(!el || el.dataset.v4Back==="1") return;
       el.dataset.v4Back="1";
       el.addEventListener("click",function(e){
         /* Home goes Dashboard; level buttons go Level selector. */
         if(id==="snakeHome"){
           goDashboardFromGame(e);
         }else{
           goLevelsFromGame(e);
         }
       },true);
    });
  }

  function boot(){
    bindNavigation();
    /* A second pass is intentional: some original scripts render cards after DOM ready. */
    setTimeout(moveGameCardsCorrectly,100);
    setTimeout(moveGameCardsCorrectly,500);
    setTimeout(moveGameCardsCorrectly,1200);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot);
  }else{
    boot();
  }
})();
