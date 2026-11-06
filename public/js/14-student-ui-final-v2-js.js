(function(){
  function ensureDashboardGames(){
    const target=document.getElementById("dashboardGameGrid");
    if(!target)return;
    const source=document.querySelector("#studentViewGame .game-mini-grid");
    if(source && source !== target){
      while(source.firstElementChild){
        target.appendChild(source.firstElementChild);
      }
    }
    target.querySelectorAll(".subject-card").forEach(card=>{
      card.style.width="100%";
      card.style.height="";
      card.style.minHeight="";
      card.style.maxHeight="";
    });
  }

  function bindProfileEye(){
    document.querySelectorAll("#studentViewProfile .password-toggle").forEach(btn=>{
      if(btn.dataset.finalV2==="1")return;
      btn.dataset.finalV2="1";
      btn.addEventListener("click",function(e){
        e.preventDefault();
        e.stopPropagation();
        const input=document.getElementById(this.dataset.target);
        if(!input)return;
        const show=input.type==="password";
        input.type=show?"text":"password";
        this.textContent=show?"◉":"◌";
      });
    });
  }

  function boot(){
    ensureDashboardGames();
    bindProfileEye();
    setTimeout(ensureDashboardGames,250);
    setTimeout(ensureDashboardGames,1000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
