(function(){
  var $=function(id){return document.getElementById(id)};
  var NS='http://www.w3.org/2000/svg';
  var GAME_PAGES={levels:1,snake:1,memory:1,crossword:1,logic:1,picture:1,mathMaze:1,safeCracker:1,tug:1};
  var current='dashboard';

  /* ================= data ================= */
  function session(){try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}}
  function classCounts(){
    var classes=['5A','5B','5C','5D','6A','6B','6C','6D'],list=[];
    try{var d=JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]');if(Array.isArray(d))list=d}catch(e){}
    if(!list.length){try{var u=JSON.parse(localStorage.getItem('cerdasPlayUsers')||'[]');if(Array.isArray(u))list=u.filter(function(x){return x.role==='student'})}catch(e){}}
    return {classes:classes,counts:classes.map(function(c){return list.filter(function(s){return s.className===c}).length})};
  }
  function category(name){
    if(/^logika/i.test(name))return 'logic';
    if(/^tebak/i.test(name))return 'picture';
    return 'math';
  }
  function scoreData(){
    var s=session(),res={math:[null,null,null,null,null],logic:[null,null,null,null,null],picture:[null,null,null,null,null],done:0};
    if(!s||s.role!=='student')return res;
    var sc={};try{sc=JSON.parse(localStorage.getItem('cerdasPlay:'+s.id+':scores')||'{}')}catch(e){}
    Object.keys(sc).forEach(function(k){
      var m=k.match(/Level\s*(\d)/i);if(!m)return;
      var lv=+m[1];if(lv<1||lv>5)return;
      var v=Number(sc[k]&&sc[k].score);if(!isFinite(v))return;
      v=Math.max(0,Math.min(100,v));
      var c=category(k),cur=res[c][lv-1];
      res[c][lv-1]=cur===null?v:Math.max(cur,v);
    });
    ['math','logic','picture'].forEach(function(c){res[c].forEach(function(v){if(v!==null)res.done++})});
    return res;
  }

  /* ================= garis halus (monotone cubic, tidak meluap) ================= */
  function smoothPath(p){
    var n=p.length;if(n<2)return '';
    var dx=[],m=[],t=[],i;
    for(i=0;i<n-1;i++){dx[i]=p[i+1].x-p[i].x;m[i]=(p[i+1].y-p[i].y)/dx[i]}
    t[0]=m[0];t[n-1]=m[n-2];
    for(i=1;i<n-1;i++)t[i]=(m[i-1]*m[i]<=0)?0:(m[i-1]+m[i])/2;
    for(i=0;i<n-1;i++){
      if(m[i]===0){t[i]=0;t[i+1]=0;continue}
      var a=t[i]/m[i],b=t[i+1]/m[i],s=a*a+b*b;
      if(s>9){var k=3/Math.sqrt(s);t[i]=k*a*m[i];t[i+1]=k*b*m[i]}
    }
    var d='M'+p[0].x.toFixed(1)+','+p[0].y.toFixed(1);
    for(i=0;i<n-1;i++){
      var h=dx[i]/3;
      d+=' C'+(p[i].x+h).toFixed(1)+','+(p[i].y+t[i]*h).toFixed(1)+' '+(p[i+1].x-h).toFixed(1)+','+(p[i+1].y-t[i+1]*h).toFixed(1)+' '+p[i+1].x.toFixed(1)+','+p[i+1].y.toFixed(1);
    }
    return d;
  }
  var FONT='Nunito,Arial,sans-serif';
  function tx(x,y,txt,o){o=o||{};return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" font-size="'+(o.size||11)+'" font-weight="'+(o.w||700)+'" text-anchor="'+(o.a||'middle')+'" fill="'+(o.c||'#84817d')+'" font-family="'+FONT+'">'+txt+'</text>'}

  /* ================= grafik 1: jumlah siswa per kelas ================= */
  function renderClassChart(){
    var box=$('sdClassChart');if(!box)return;
    var d=classCounts(),F=window.__upxF==null?1:window.__upxF;
    var __h=(window.__upChartMarkup||chartMarkup)(d.counts.map(function(v){return v*F}),d.classes);if(box.__upH!==__h||!box.querySelector('.upcc-plot')){box.innerHTML=__h;box.__upH=__h}
  }
  /* markup grafik yang SAMA dipakai dashboard siswa dan dashboard guru */
  function chartMarkup(counts,classes){
    var W=680,H=500,L=44,R=26,T=24,B=40,pw=W-L-R,ph=H-T-B,step=pw/(classes.length-1);
    var ys=function(v){return T+ph-(v/50)*ph};
    var pts=counts.map(function(v,i){return {x:L+i*step,y:ys(Math.min(50,v)),v:v}});
    var base=ys(0).toFixed(1),line=smoothPath(pts),grid='';
    for(var v=0;v<=50;v+=5){
      var y=ys(v),major=v%10===0;
      grid+='<line x1="'+L+'" y1="'+y.toFixed(1)+'" x2="'+(W-R)+'" y2="'+y.toFixed(1)+'" stroke="'+(major?'#e5e0d9':'#efe9e1')+'"/>'+tx(L-8,y+3.6,v,{a:'end',size:10.5,c:major?'#84817d':'#a9a49e',w:major?800:700});
    }
    return '<svg class="up-class-chart" viewBox="0 0 '+W+' '+H+'" xmlns="'+NS+'" role="img" aria-label="Grafik jumlah siswa kelas 5A sampai 6D">'+grid+
      '<line x1="'+L+'" y1="'+base+'" x2="'+(W-R)+'" y2="'+base+'" stroke="#d4ccc1" stroke-width="1.4"/>'+
      '<path d="'+line+' L'+pts[pts.length-1].x.toFixed(1)+','+base+' L'+pts[0].x.toFixed(1)+','+base+' Z" fill="rgba(30,31,31,.09)"/>'+
      '<path d="'+line+'" fill="none" stroke="#1e1f1f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'+
      pts.map(function(p,i){return '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="4.8" fill="#fff" stroke="#1e1f1f" stroke-width="2.8"><title>Kelas '+classes[i]+': '+Math.round(p.v)+' siswa</title></circle>'+
        tx(p.x,p.y-11,Math.round(p.v),{size:12,w:800,c:'#1e1f1f'})+tx(p.x,H-14,classes[i],{size:12,w:800,c:'#2a2a29'})}).join('')+
      '</svg>';
  }
  window.__upChartMarkup=chartMarkup;

  function renderStats(){
    var sd=scoreData(),el=$('studentGameStat');
    if(el&&el.textContent!==String(sd.done))el.textContent=sd.done;
    if($('studentTotalGameStat'))$('studentTotalGameStat').textContent='3';
    if($('studentLevelPerGameStat'))$('studentLevelPerGameStat').textContent='5';
  }
  function renderDash(){try{renderStats();renderClassChart()}catch(e){console.error('Dashboard siswa:',e)}}
  window.renderStudentDashboardCharts=renderDash;

  /* pertahankan hitungan "Game Selesai" walau skrip lama menimpanya */
  (function(){
    var el=$('studentGameStat');if(!el||!window.MutationObserver)return;
    new MutationObserver(function(){var v=String(scoreData().done);if(el.textContent!==v)el.textContent=v}).observe(el,{childList:true,characterData:true,subtree:true});
  })();

  /* ================= navigasi 3 menu ================= */
  var TITLES={dashboard:['Dashboard','Selamat datang di dashboard belajarmu.'],
              profile:['Profil Siswa','Kelola data pribadi dan keamanan akunmu.'],
              game:['Game','Pilih game dan mulai belajar sambil bermain.']};
  var VIEW_ID={dashboard:'studentViewDashboard',profile:'studentViewProfile',game:'studentViewGames'};
  function setView(view){
    if(!VIEW_ID[view])view='dashboard';
    current=view;
    try{activeStudentView=(view==='profile')?'profile':'dashboard'}catch(e){}
    document.querySelectorAll('#studentDashboard .student-view').forEach(function(v){v.classList.add('hidden');v.setAttribute('aria-hidden','true')});
    var t=$(VIEW_ID[view]);if(t){t.classList.remove('hidden');t.setAttribute('aria-hidden','false')}
    document.querySelectorAll('#studentDashboard .student-menu').forEach(function(b){b.classList.toggle('active',b.dataset.studentView===view)});
    if($('studentPageTitle'))$('studentPageTitle').textContent=TITLES[view][0];
    if($('studentPageSubtitle'))$('studentPageSubtitle').textContent=TITLES[view][1];
    try{window.renderStudentGameAvailability&&window.renderStudentGameAvailability()}catch(e){}
    if(view==='dashboard')renderDash();
    window.scrollTo({top:0,behavior:'auto'});
  }
  window.cerdasStudentSetView=setView;

  /* capture di level window = jalan paling awal, mengalahkan semua handler lama */
  window.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('#studentDashboard .student-menu, #studentDashboard .password-toggle'):null;
    if(!el)return;
    if(el.classList.contains('student-menu')){
      e.preventDefault();e.stopImmediatePropagation();
      setView(el.dataset.studentView);
      return;
    }
    /* ikon mata */
    e.preventDefault();e.stopImmediatePropagation();
    var input=$(el.dataset.target);if(!input)return;
    var show=input.type==='password';
    input.type=show?'text':'password';
    el.setAttribute('aria-pressed',show?'true':'false');
    el.setAttribute('aria-label',show?'Sembunyikan password':'Tampilkan password');
    el.title=show?'Sembunyikan password':'Tampilkan password';
    el.innerHTML=show?EYE_OFF:EYE_ON;
  },true);
  var EYE_ON='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 4.1-4.9M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/></svg>';

  /* kembali dari game -> halaman Game; masuk/login -> Dashboard */
  var lastPage=null,prev=window.showPage;
  if(typeof prev==='function'&&!window.__studentV7Nav){
    window.__studentV7Nav=true;
    window.showPage=function(p){
      var fromGame=!!GAME_PAGES[lastPage];
      var r=prev.apply(this,arguments);
      lastPage=p;
      if(p==='dashboard')setView(fromGame?'game':'dashboard');
      return r;
    };
  }


  /* ================= avatar bawaan, Hapus Foto, teks kelas ================= */
  var DEFAULT_AV="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3CclipPath id='a'%3E%3Ccircle cx='50' cy='50' r='50'/%3E%3C/clipPath%3E%3C/defs%3E%3Cg clip-path='url(%23a)'%3E%3Crect width='100' height='100' fill='%23e5e0d9'/%3E%3Ccircle cx='50' cy='39' r='18' fill='%23a8a29b'/%3E%3Cpath d='M13 104c1.6-21.5 17.4-37 37-37s35.4 15.5 37 37z' fill='%23a8a29b'/%3E%3C/g%3E%3C/svg%3E";
  function defaultImg(){return '<img src="'+DEFAULT_AV+'" alt="Foto profil">'}
  ['studentSidebarAvatar','profileAvatarPreview','profileSummaryAvatar'].forEach(function(id){
    var el=$(id);if(!el||!window.MutationObserver)return;
    var fix=function(){if(el.textContent.trim()==='👤'&&!el.querySelector('img'))el.innerHTML=defaultImg()};
    new MutationObserver(fix).observe(el,{childList:true,characterData:true,subtree:true});fix();
  });
  (function(){
    var el=$('studentSidebarClass');if(!el||!window.MutationObserver)return;
    var fix=function(){var t=el.textContent.replace(/^\s*Siswa Aktif\s*•\s*/i,'');if(t!==el.textContent)el.textContent=t};
    new MutationObserver(fix).observe(el,{childList:true,characterData:true,subtree:true});fix();
  })();
  window.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('#removeProfilePhotoBtn'):null;if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    var s=session();if(!s)return;
    s.photo='';sessionStorage.setItem('cerdasPlaySession',JSON.stringify(s));
    try{var acc=JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]'),i=acc.findIndex(function(a){return a.id===s.id});if(i>=0){acc[i].photo='';localStorage.setItem('cerdasPlayStudents',JSON.stringify(acc))}}catch(_){}
    ['studentSidebarAvatar','profileAvatarPreview','profileSummaryAvatar'].forEach(function(id){if($(id))$(id).innerHTML=defaultImg()});
    var inp=$('profilePhotoInput');if(inp)inp.value='';
  },true);

  /* hindari "tersangkut" jika skrip lama membuka ulang tampilan */
  window.addEventListener('storage',function(){if(current==='dashboard')renderDash()});
  var wrapSave=window.saveStudentScore;
  if(typeof wrapSave==='function'&&!wrapSave.__v7){
    var f=function(){var r=wrapSave.apply(this,arguments);setTimeout(renderDash,0);return r};f.__v7=1;window.saveStudentScore=f;
  }
  function boot(){renderDash()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
