/* Kontrol Kelas & Game: game yang dimatikan Admin/Master untuk sebuah kelas */
/* Hentikan semua timer game (dipakai saat ronde Join Room berakhir) */
window.__upStopAllTimers=function(){
  ['stopGameTimer','stopLevelTimer','__stopSnakeTimer','__stopRequestedLevelTimer'].forEach(function(f){try{typeof window[f]==='function'&&window[f]()}catch(e){}});
  try{window.__lgLogika&&window.__lgLogika.stop&&window.__lgLogika.stop()}catch(e){}
  try{window.__ttTebak&&window.__ttTebak.stop&&window.__ttTebak.stop()}catch(e){}
};
/* Notifikasi gaya pesan (atas tengah). Dipakai siswa, guru, admin, master.
   BACKEND: notifikasi realtime dari server cukup memanggil window.__upNotify({title,text}). */
window.__upNotify=function(o){
  o=o||{};var box=document.getElementById('upNotifs');
  if(!box){box=document.createElement('div');box.id='upNotifs';box.setAttribute('aria-live','polite');document.body.appendChild(box)}
  if(o.id){var old=document.getElementById(o.id);if(old)old.remove()}
  var n=document.createElement('div');n.className='up-notif';if(o.id)n.id=o.id;n.setAttribute('role','status');
  var e=function(v){return String(v==null?'':v).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})};
  n.innerHTML='<span class="up-n-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(o.kind==='room'?'<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>':o.kind==='ok'?'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>':o.kind==='warn'?'<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>':'<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>')+'</svg></span>'+
    '<div class="up-n-body"><div class="up-n-top"><b>UpPlay</b><time>sekarang</time></div>'+(o.title?'<strong>'+e(o.title)+'</strong>':'')+'<p>'+e(o.text||'')+'</p></div>';
  var gone=false,close=function(){if(gone)return;gone=true;n.classList.add('out');setTimeout(function(){n.remove()},320)};
  n.addEventListener('click',function(){close();if(typeof o.onclick==='function')o.onclick()});
  var y0=null;n.addEventListener('touchstart',function(ev){y0=ev.touches[0].clientY},{passive:true});
  n.addEventListener('touchend',function(ev){if(y0!=null&&y0-ev.changedTouches[0].clientY>30)close();y0=null});
  box.insertBefore(n,box.firstChild);while(box.children.length>3)box.lastChild.remove();
  setTimeout(close,o.ms||4200);return n;
};
window.__upGameOn=function(cls,game){try{var g=JSON.parse(localStorage.getItem('cerdasPlay:'+cls+':games')||'null');return !g||g[game]!==false}catch(e){return true}};
