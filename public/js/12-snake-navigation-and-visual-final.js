(function(){
  'use strict';
  function stopAllTimers(){
    try{ if(typeof window.stopGameTimer==='function') window.stopGameTimer(); }catch(e){}
    try{ if(typeof window.stopLevelTimer==='function') window.stopLevelTimer(); }catch(e){}
    try{ if(typeof window.__stopSnakeTimer==='function') window.__stopSnakeTimer(); }catch(e){}
  }
  function goLevels(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    stopAllTimers();
    try{ if(typeof window.updateDashboardProgress==='function') window.updateDashboardProgress(); }catch(err){}
    document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
    const levels=document.getElementById('mathLevelsPage');
    if(levels) levels.classList.remove('hidden');
    try{ if(typeof window.showPage==='function') window.showPage('levels'); }catch(err){}
    window.scrollTo({top:0,behavior:'auto'});
  }
  function goDashboard(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    stopAllTimers();
    document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
    const dash=document.getElementById('studentDashboard');
    if(dash) dash.classList.remove('hidden');
    try{ if(typeof window.showPage==='function') window.showPage('dashboard'); }catch(err){}
    window.scrollTo({top:0,behavior:'auto'});
  }
  function bind(){
    const levelsBtn=document.getElementById('backToLevelsBtn');
    const iconBtn=document.getElementById('backToLevelsIconBtn');
    const home=document.getElementById('snakeHome');
    if(levelsBtn) levelsBtn.addEventListener('click',goLevels,true);
    if(iconBtn) iconBtn.addEventListener('click',goLevels,true);
    if(home) home.addEventListener('click',goDashboard,true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
})();
