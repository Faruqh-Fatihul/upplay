(function(){
  'use strict';
  const GAME_PAGES=new Set(['levels','snake','memory','crossword','logic','picture']);
  const get=id=>document.getElementById(id);
  const hide=el=>{if(el){el.classList.add('hidden');el.setAttribute('aria-hidden','true');}};
  const show=el=>{if(el){el.classList.remove('hidden');el.setAttribute('aria-hidden','false');}};

  function forceStudentView(mode){
    const dash=get('studentDashboard');
    const dashboardView=get('studentViewDashboard');
    const profileView=get('studentViewProfile');
    if(!dash) return;
    show(dash);
    if(mode==='profile'){
      hide(dashboardView);
      show(profileView);
    }else{
      show(dashboardView);
      hide(profileView);
      /* Never leave the old standalone game container visible inside the dashboard. */
      hide(get('studentViewGame'));
      hide(get('studentViewNilai'));
    }
  }

  function isolateOutsideStudentPortal(){
    const dash=get('studentDashboard');
    if(!dash) return;
    /* Critical rule: any real game/level page means the entire student dashboard is hidden. */
    hide(dash);
    document.querySelectorAll('#studentDashboard .student-view').forEach(hide);
  }

  function repairCurrentPage(pageName){
    if(pageName==='dashboard'){
      forceStudentView('dashboard');
      try{window.renderStudentGameAvailability?.()}catch(e){}
      return;
    }
    if(GAME_PAGES.has(pageName)){
      isolateOutsideStudentPortal();
      return;
    }
    if(pageName==='landing' || pageName==='teacher' || pageName==='admin' || pageName==='role'){
      isolateOutsideStudentPortal();
    }
  }

  /* Wrap the original navigator once, after every older navigation script has loaded. */
  const original=window.showPage;
  if(typeof original==='function' && !window.__cerdasPlayNavigationAuthorityV5){
    window.__cerdasPlayNavigationAuthorityV5=true;
    window.showPage=function(pageName){
      const result=original.apply(this,arguments);
      repairCurrentPage(pageName);
      return result;
    };
  }

  /* Public navigation functions used by Back/Home controls. */
  window.cerdasPlayBackToDashboard=function(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    try{window.stopGameTimer?.();}catch(_){}
    try{window.stopLevelTimer?.();}catch(_){}
    try{window.__stopSnakeTimer?.();}catch(_){}
    try{window.showPage('dashboard');}catch(_){}
    forceStudentView('dashboard');
    window.scrollTo({top:0,behavior:'auto'});
    return false;
  };

  window.cerdasPlayBackToLevels=function(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    try{window.stopGameTimer?.();}catch(_){}
    try{window.stopLevelTimer?.();}catch(_){}
    try{window.__stopSnakeTimer?.();}catch(_){}
    try{window.showPage('levels');}catch(_){}
    isolateOutsideStudentPortal();
    const levels=get('mathLevelsPage');
    if(levels)show(levels);
    window.scrollTo({top:0,behavior:'auto'});
    return false;
  };

  /* Directly guard clicks on game/level back buttons. Capture phase wins over old handlers. */
  function bind(){
    const dashboardIds=['dashboardHome'];
    dashboardIds.forEach(id=>{
      const el=get(id);
      if(!el || el.dataset.v5==='1')return;
      el.dataset.v5='1';
      el.addEventListener('click',window.cerdasPlayBackToDashboard,true);
    });

    const levelBack=['levelsHome'];
    levelBack.forEach(id=>{
      const el=get(id);
      if(!el || el.dataset.v5==='1')return;
      el.dataset.v5='1';
      el.addEventListener('click',window.cerdasPlayBackToDashboard,true);
    });

    ['backToLevelsBtn','backToLevelsIconBtn','backToLevelsFromMemory','backMemoryIconBtn'].forEach(id=>{
      const el=get(id);
      if(!el || el.dataset.v5==='1')return;
      el.dataset.v5='1';
      el.addEventListener('click',window.cerdasPlayBackToLevels,true);
    });

    ['snakeHome','backLogicDashboard','backLogicIconBtn','backPictureDashboard','backPictureIconBtn'].forEach(id=>{
      const el=get(id);
      if(!el || el.dataset.v5==='1')return;
      el.dataset.v5='1';
      el.addEventListener('click',window.cerdasPlayBackToDashboard,true);
    });

    /* Initial state: if a game page is already open, profile must not be rendered above it. */
    const visibleGame=document.querySelector('.app-view:not(.hidden)');
    if(visibleGame && visibleGame.id!=='studentDashboard') repairCurrentPage(visibleGame.id==='mathLevelsPage'?'levels':null);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();
