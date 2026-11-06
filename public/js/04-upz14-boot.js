(function(){var el=document.getElementById('upBoot');try{var s=JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null');if(s&&s.role){el.className='ub-app';var k='upplayTheme:'+(s.tester?'admin:'+(s.adminLevel||'admin'):s.role+':'+s.id);if(localStorage.getItem(k)==='dark')el.classList.add('ub-dark')}}catch(e){}
window.__upBootDone=function(){if(!el||el.__done)return;el.__done=1;document.documentElement.classList.remove('ub-dk');el.classList.add('ub-out');setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el)},420)};
setTimeout(window.__upBootDone,15000);})();
