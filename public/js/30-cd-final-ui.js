(function(){
  'use strict';
  /* Garis waktu lebar di bawah topbar untuk Level 1–5. Sumber angka = penghitung waktu milik
     masing-masing level (tidak mengubah logika game), ditampilkan sebagai garis yang menyusut
     dari kanan ke kiri (hijau → merah) dengan angka menit:detik di ujung kanan. */
  var SRC={snakeGamePage:'snakeLevelTimerText',memoryPage:'cp5TimerText',crosswordGamePage:'cp5TimerText',mathMazePage:'cerdasLevelTimerText',safeCrackerPage:'cerdasLevelTimerText'};
  var last={};
  function mount(){
    Object.keys(SRC).forEach(function(id){
      var page=document.getElementById(id);
      if(!page||page.querySelector('.cd-timebar'))return;
      var tb=document.createElement('div');
      tb.className='cd-timebar';tb.setAttribute('role','timer');tb.setAttribute('aria-label','Sisa waktu');
      tb.innerHTML='<div class="cd-track"><i></i></div><strong>⏱ 03:00</strong>';
      var head=page.querySelector('.topbar');
      if(head)head.after(tb);else page.prepend(tb);
    });
    /* tombol arah labirin dipindah ke panel kanan agar papan memenuhi tinggi layar */
    var pad=document.querySelector('#mathMazePage .maze-card .maze-controls'),pan=document.querySelector('#mathMazePage .maze-panel');
    if(pad&&pan)pan.appendChild(pad);
  }
  function parse(t){var m=/(\d+):(\d+)/.exec(t||'');return m?(+m[1])*60+(+m[2]):null}
  function pad2(n){return String(n).padStart(2,'0')}
  function tick(){
    var page=document.querySelector('.app-view:not(.hidden)');
    if(!page||!SRC[page.id])return;
    var src=document.getElementById(SRC[page.id]),tb=page.querySelector('.cd-timebar');
    if(!src||!tb)return;
    var sec=parse(src.textContent);
    if(sec===null)return;
    var MX=180;sec=Math.max(0,Math.min(MX,sec));
    var fill=tb.querySelector('.cd-track i'),label=tb.querySelector('strong');
    if(last[page.id]!==undefined&&sec>last[page.id]){tb.classList.add('cd-reset');void tb.offsetWidth;}
    fill.style.width=(sec/MX*100)+'%';
    fill.style.backgroundColor='hsl('+Math.round(120*Math.pow(sec/MX,0.85))+',72%,'+(sec>20?45:48)+'%)';
    label.textContent='⏱ '+pad2(Math.floor(sec/60))+':'+pad2(sec%60);
    tb.classList.toggle('cd-danger',sec<=10&&sec>0);
    if(tb.classList.contains('cd-reset'))requestAnimationFrame(function(){tb.classList.remove('cd-reset')});
    last[page.id]=sec;
  }
  mount();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  setInterval(tick,150);
})();
