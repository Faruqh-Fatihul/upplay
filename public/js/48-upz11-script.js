/* =====================================================================
   UpPlay V11 — logo U→P, grafik 2 garis, langit transisi tema, HUD ruang di HP.
   Lapisan ini hanya menambah tampilan; isi & alur game tidak diubah.
   ===================================================================== */
(function(){
'use strict';
if(window.__upz11)return;window.__upz11=true;
var NS='http://www.w3.org/2000/svg';
var CLASSES=['5A','5B','5C','5D','6A','6B','6C','6D'];
var esc=function(v){return String(v==null?'':v).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})};

/* ================= 1. LOGO U → P =================
   Bentuk U (garis tebal + "tab" di kiri atas). Diputar -90° menjadi P
   (tab berubah menjadi kaki huruf P). Tanpa latar belakang. */
var LOGO='<svg class="up-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke-width="3.1" stroke-linecap="butt" stroke-linejoin="miter">'+
  '<path class="ul-main" d="M9.5 6.5V18.5H19.5V5.5"/><path class="ul-tab" d="M4.5 6.5H11"/></g></svg>';
window.__upLogoSvg=LOGO;
window.__upDonut="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3CclipPath id='a'%3E%3Ccircle cx='50' cy='50' r='50'/%3E%3C/clipPath%3E%3C/defs%3E%3Cg clip-path='url(%23a)'%3E%3Crect width='100' height='100' fill='%23e5e0d9'/%3E%3Ccircle cx='50' cy='39' r='18' fill='%23a8a29b'/%3E%3Cpath d='M13 104c1.6-21.5 17.4-37 37-37s35.4 15.5 37 37z' fill='%23a8a29b'/%3E%3C/g%3E%3C/svg%3E";
function paintLogos(){
  var els=document.querySelectorAll('.brand-icon:not([data-uplogo]),.upx-mlogo:not([data-uplogo]),.upx-logo > span:not([data-uplogo])');
  for(var i=0;i<els.length;i++){var e=els[i];if(e.textContent.trim()==='✦'||!e.querySelector('svg')){e.innerHTML=LOGO;e.setAttribute('data-uplogo','1')}}
}
paintLogos();setInterval(paintLogos,600);
new MutationObserver(function(){paintLogos()}).observe(document.body,{childList:true,subtree:true});
/* favicon mengikuti logo baru */
try{
  var fav='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke-width="3.1"><path d="M9.5 6.5V18.5H19.5V5.5" stroke="#1e1f1f"/><path d="M4.5 6.5H11" stroke="#8a6d50"/></g></svg>');
  var ln=document.querySelector('link[rel~="icon"]');if(!ln){ln=document.createElement('link');ln.rel='icon';document.head.appendChild(ln)}ln.href=fav;
}catch(e){}

/* ================= 2. GRAFIK KURVA =================
   Satu mesin grafik untuk siswa, guru, admin, master.
   SVG dibangun SEKALI per kartu, animasi hanya mengubah atribut (tanpa innerHTML per frame)
   sehingga tidak ada kedip. Urutan animasi:
   garis bantu sumbu Y melebar satu per satu → angka kelipatan 5 muncul bergantian →
   label kelas muncul → garis guru & siswa naik lentur dari 0 bersama bayangan transparannya. */
function studentCounts(){
  var list=[];
  try{var d=JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]');if(Array.isArray(d))list=d}catch(e){}
  if(!list.length){try{var u=JSON.parse(localStorage.getItem('cerdasPlayUsers')||'[]');if(Array.isArray(u))list=u.filter(function(x){return x.role==='student'})}catch(e){}}
  return CLASSES.map(function(c){return list.filter(function(s){return s.className===c}).length});
}
function teacherCounts(){
  var td=null;try{td=teacherData}catch(e){} /* global dari skrip utama, sudah disaring admin (guru nonaktif tidak dihitung) */
  return CLASSES.map(function(c){return td&&td[c]?td[c].length:0});
}
var ICON_BAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
function block(siswa,guru){
  return '<div class="upcc" data-upcc="1">'+
    '<div class="upcc-kick">'+ICON_BAR+'GRAFIK SELURUH KELAS</div>'+
    '<h3 class="upcc-title">Jumlah Siswa dan Guru (Wali Kelas) di Kelas (5A–6D)</h3>'+
    '<div class="upcc-plot" data-s="'+siswa.join(',')+'" data-g="'+guru.join(',')+'" role="img" aria-label="Grafik jumlah siswa dan guru wali kelas per kelas 5A sampai 6D"></div>'+
    '<div class="upcc-legend"><span><i></i>Jumlah Siswa</span><span><i class="g"></i>Jumlah Guru (Wali Kelas)</span></div>'+
  '</div>';
}
window.__upChartCard=function(){return block(studentCounts(),teacherCounts())};
window.__upChartMarkup=function(){return block(studentCounts(),teacherCounts())};

/* kurva lentur tanpa "tumpah" (monotone cubic / Fritsch–Carlson) */
function curve(p){
  var n=p.length;if(n<2)return '';
  var dx=[],m=[],t=[];
  for(var i=0;i<n-1;i++){dx[i]=p[i+1].x-p[i].x;m[i]=(p[i+1].y-p[i].y)/dx[i]}
  t[0]=m[0];t[n-1]=m[n-2];
  for(i=1;i<n-1;i++){t[i]=(m[i-1]*m[i]<=0)?0:(m[i-1]+m[i])/2}
  for(i=0;i<n-1;i++){
    if(m[i]===0){t[i]=0;t[i+1]=0;continue}
    var a=t[i]/m[i],b=t[i+1]/m[i],h=a*a+b*b;
    if(h>9){var k=3/Math.sqrt(h);t[i]=k*a*m[i];t[i+1]=k*b*m[i]}
  }
  var d='M'+p[0].x.toFixed(2)+','+p[0].y.toFixed(2);
  for(i=0;i<n-1;i++){
    var c=dx[i]/3;
    d+=' C'+(p[i].x+c).toFixed(2)+','+(p[i].y+t[i]*c).toFixed(2)+' '+(p[i+1].x-c).toFixed(2)+','+(p[i+1].y-t[i+1]*c).toFixed(2)+' '+p[i+1].x.toFixed(2)+','+p[i+1].y.toFixed(2);
  }
  return d;
}
var easeOut=function(t){return 1-Math.pow(1-t,3)},easeIO=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
var seq=0,lastNav=0;
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#upxSide .upx-item,#upxMenu,.teacher-menu,#adMenu button,.student-menu,[data-student-view]'))lastNav=performance.now()},true);
function hostOf(plot){return plot.closest('#sdClassChart,.tg4-chart-wrap,#adMain')||plot.parentNode}
var T={grid:80,gridDur:560,tick:110,xl:420,series:700,seriesDur:1300}; /* ms */
var TOTAL=T.series+T.seriesDur+40;

function build(plot){
  var W=Math.round(plot.clientWidth),H=Math.round(plot.clientHeight);if(W<60||H<60)return false;
  var small=W<520,L=small?30:40,R=small?14:22,Tp=16,B=small?30:34,pw=W-L-R,ph=H-Tp-B,step=pw/(CLASSES.length-1);
  var id='upcc'+(++seq),yv=function(v){return Tp+ph-(Math.max(0,Math.min(50,v))/50)*ph};
  var fs=small?9.5:10.5,xs=small?10.5:12;
  var h='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" aria-hidden="true">'+
    '<defs>'+
      '<linearGradient id="'+id+'s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--upcc-siswa);stop-opacity:.20"/><stop offset="1" style="stop-color:var(--upcc-siswa);stop-opacity:0"/></linearGradient>'+
      '<linearGradient id="'+id+'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--upcc-guru);stop-opacity:.16"/><stop offset="1" style="stop-color:var(--upcc-guru);stop-opacity:0"/></linearGradient>'+
    '</defs><g class="cc-grid">';
  for(var v=0;v<=50;v+=5){var y=yv(v).toFixed(1),mj=v%10===0;
    h+='<line class="cc-gl" x1="'+L+'" x2="'+L+'" y1="'+y+'" y2="'+y+'" stroke="var(--'+(v===0?'upcc-axis':mj?'upcc-grid':'upcc-grid-2')+')" stroke-width="'+(v===0?1.2:1)+'"/>'+
       '<text class="cc-yt" x="'+(L-8)+'" y="'+(+y+3.5)+'" text-anchor="end" font-size="'+fs+'" font-weight="700" fill="var(--'+(mj?'upcc-text':'upcc-text-2')+')" opacity="0">'+v+'</text>'}
  h+='</g><g class="cc-x">'+CLASSES.map(function(c,i){return '<text class="cc-xt" x="'+(L+i*step).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" font-size="'+xs+'" font-weight="700" fill="var(--upcc-text)" opacity="0">'+c+'</text>'}).join('')+'</g>'+
    '<path class="cc-area g" fill="url(#'+id+'g)" d=""/><path class="cc-area s" fill="url(#'+id+'s)" d=""/>'+
    '<path class="cc-line g" fill="none" stroke="var(--upcc-guru)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d=""/>'+
    '<path class="cc-line s" fill="none" stroke="var(--upcc-siswa)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d=""/>'+
    '<g class="cc-dots">'+CLASSES.map(function(c,i){return '<rect class="upcc-pt g" data-i="'+i+'" width="6" height="6" rx="1.5" fill="var(--upcc-dot-bg)" stroke="var(--upcc-guru)" stroke-width="1.4" opacity="0"/><circle class="upcc-pt s" data-i="'+i+'" r="3.2" fill="var(--upcc-dot-bg)" stroke="var(--upcc-siswa)" stroke-width="1.4" opacity="0"/>'}).join('')+'</g>'+
    '</svg><div class="upcc-hair" style="top:'+Tp+'px;height:'+ph+'px"></div><div class="upcc-tip"><b><small></small><span></span><em class="ts"></em></b><b class="g"><span></span><em class="tg"></em></b></div>';
  plot.innerHTML=h;
  var svg=plot.querySelector('svg');
  plot.__m={W:W,H:H,L:L,R:R,T:Tp,ph:ph,step:step,yv:yv,
    gl:[].slice.call(svg.querySelectorAll('.cc-gl')),yt:[].slice.call(svg.querySelectorAll('.cc-yt')),xt:[].slice.call(svg.querySelectorAll('.cc-xt')),
    areaS:svg.querySelector('.cc-area.s'),areaG:svg.querySelector('.cc-area.g'),lineS:svg.querySelector('.cc-line.s'),lineG:svg.querySelector('.cc-line.g'),
    dotS:[].slice.call(svg.querySelectorAll('circle.upcc-pt')),dotG:[].slice.call(svg.querySelectorAll('rect.upcc-pt'))};
  plot.querySelectorAll('em').forEach(function(e){e.style.fontStyle='normal'});
  return true;
}
function readData(plot){return {S:plot.dataset.s.split(',').map(Number),G:plot.dataset.g.split(',').map(Number)}}
/* gambar satu frame pada waktu animasi t (ms sejak mulai) */
function frame(plot,t){
  var m=plot.__m;if(!m)return;
  var right=m.W-m.R;
  m.gl.forEach(function(l,i){var k=easeOut(Math.max(0,Math.min(1,(t-i*T.grid)/T.gridDur)));l.setAttribute('x2',(m.L+(right-m.L)*k).toFixed(1))});
  m.yt.forEach(function(x,i){var d=i*T.grid+(i%2?T.tick*2:T.tick),k=Math.max(0,Math.min(1,(t-d)/300));x.setAttribute('opacity',k.toFixed(3));x.setAttribute('transform','translate('+(-6*(1-k)).toFixed(2)+',0)')});
  m.xt.forEach(function(x,i){var k=Math.max(0,Math.min(1,(t-T.xl-i*45)/300));x.setAttribute('opacity',k.toFixed(3));x.setAttribute('transform','translate(0,'+(6*(1-k)).toFixed(2)+')')});
  var k=easeOut(Math.max(0,Math.min(1,(t-T.series)/T.seriesDur)));
  series(plot,k,1);
}
/* nilai seri saat ini = dari (prev) menuju (target) dengan faktor k */
function series(plot,k){
  var m=plot.__m,D=readData(plot),P=plot.__from||{S:D.S.map(function(){return 0}),G:D.G.map(function(){return 0})};
  var cur={S:D.S.map(function(v,i){return P.S[i]+(v-P.S[i])*k}),G:D.G.map(function(v,i){return P.G[i]+(v-P.G[i])*k})};
  plot.__cur=cur;
  var base=m.yv(0),ps=cur.S.map(function(v,i){return {x:m.L+i*m.step,y:m.yv(v)}}),pg=cur.G.map(function(v,i){return {x:m.L+i*m.step,y:m.yv(v)}});
  var cs=curve(ps),cg=curve(pg),last=(m.L+(CLASSES.length-1)*m.step).toFixed(2),first=m.L.toFixed(2);
  m.lineS.setAttribute('d',cs);m.lineG.setAttribute('d',cg);
  m.areaS.setAttribute('d',cs+' L'+last+','+base.toFixed(2)+' L'+first+','+base.toFixed(2)+' Z');
  m.areaG.setAttribute('d',cg+' L'+last+','+base.toFixed(2)+' L'+first+','+base.toFixed(2)+' Z');
  var op=Math.min(1,k*1.6).toFixed(3);
  m.lineS.setAttribute('opacity',k>0?1:0);m.lineG.setAttribute('opacity',k>0?1:0);m.areaS.setAttribute('opacity',op);m.areaG.setAttribute('opacity',op);
  m.dotS.forEach(function(c,i){c.setAttribute('cx',ps[i].x.toFixed(2));c.setAttribute('cy',ps[i].y.toFixed(2));c.setAttribute('opacity',op)});
  m.dotG.forEach(function(r,i){var s=+r.getAttribute('width');r.setAttribute('x',(pg[i].x-s/2).toFixed(2));r.setAttribute('y',(pg[i].y-s/2).toFixed(2));r.setAttribute('opacity',op)});
}
var running=new Set(),raf=0;
function loop(){
  raf=0;var now=performance.now();
  running.forEach(function(plot){
    if(!plot.isConnected){running.delete(plot);return}
    if(plot.__mode==='intro'){var t=now-plot.__t0;frame(plot,t);if(t>=TOTAL){frame(plot,TOTAL);plot.__mode='done';plot.__from=null;running.delete(plot)}}
    else if(plot.__mode==='tween'){var k=Math.min(1,(now-plot.__t0)/600);series(plot,easeIO(k));if(k>=1){plot.__mode='done';plot.__from=null;running.delete(plot)}}
  });
  if(running.size)raf=requestAnimationFrame(loop);
}
function kick(plot){running.add(plot);if(!raf)raf=requestAnimationFrame(loop)}
function setup(plot){
  if(!plot.getClientRects().length)return;
  var W=Math.round(plot.clientWidth),H=Math.round(plot.clientHeight);
  if(plot.__m&&plot.__m.W===W&&plot.__m.H===H)return;
  var rebuilt=!!plot.__m,pm=plot.__mode,pt=plot.__t0,pf=plot.__from;
  if(!build(plot))return;
  /* ukuran berubah saat animasi berjalan (scrollbar/sidebar): lanjutkan timeline yang sama, jangan lompat */
  if(rebuilt&&pm==='wait'){plot.__mode='wait';frame(plot,0);watchView(plot);return}
  if(rebuilt&&(pm==='intro'||pm==='tween')){plot.__mode=pm;plot.__t0=pt;plot.__from=pf;if(pm==='intro')frame(plot,performance.now()-pt);kick(plot);return}
  var host=hostOf(plot),now=performance.now();
  /* ditampilkan ulang oleh skrip lama (bukan oleh klik menu) setelah grafik sebelumnya selesai: jangan animasi ulang */
  var quiet=rebuilt||(host.__upccDoneAt&&now-lastNav>1200&&now-host.__upccDoneAt<600000&&host.__upccData===plot.dataset.s+'|'+plot.dataset.g);
  if(quiet){plot.__mode='done';frame(plot,TOTAL)}
  else{plot.__mode='wait';plot.__from=null;frame(plot,0);watchView(plot)}
  host.__upccData=plot.dataset.s+'|'+plot.dataset.g;
  if(quiet)host.__upccDoneAt=now;
}
/* animasi dimulai saat grafik benar-benar terlihat (setelah kartu selesai naik) */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){
  var p=e.target;if(!e.isIntersecting||p.__mode!=='wait')return;io.unobserve(p);
  p.__mode='intro';p.__t0=performance.now()+320;kick(p);
  var h=hostOf(p);setTimeout(function(){h.__upccDoneAt=performance.now()},TOTAL+320);
})},{threshold:.35}):null;
function watchView(p){if(io)io.observe(p);else{p.__mode='intro';p.__t0=performance.now();kick(p)}}
function scan(){document.querySelectorAll('.upcc-plot').forEach(setup)}
new MutationObserver(function(ms){
  for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){var n=a[j];if(n.nodeType===1&&(n.classList.contains('upcc')||n.querySelector&&n.querySelector('.upcc-plot'))){requestAnimationFrame(scan);return}}}
}).observe(document.body,{childList:true,subtree:true});
var rz=0;window.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(scan,120)});
setInterval(scan,400);
/* kembali ke Beranda (halaman disembunyikan lalu tampil lagi) -> animasi diputar ulang */
setInterval(function(){document.querySelectorAll('.upcc-plot').forEach(function(p){var v=!!p.getClientRects().length;if(p.__vis===true&&!v){p.__m=null;var h=hostOf(p);h.__upccDoneAt=0}p.__vis=v})},250);
/* data berubah (admin menambah guru, siswa baru daftar): garis bergeser halus ke nilai baru */
setInterval(function(){
  var ss=studentCounts().join(','),gg=teacherCounts().join(',');
  document.querySelectorAll('.upcc-plot').forEach(function(p){
    if(p.dataset.s===ss&&p.dataset.g===gg)return;
    var cur=p.__cur;p.dataset.s=ss;p.dataset.g=gg;
    if(!p.__m||p.__mode==='intro'||p.__mode==='wait')return;
    p.__from=cur;p.__mode='tween';p.__t0=performance.now();kick(p);
    hostOf(p).__upccData=ss+'|'+gg;
  });
},1500);
/* hover / sentuh: garis putus-putus + 2 kotak keterangan */
function hover(e){
  var t=e.target;if(!t||!t.closest)return;
  var plot=t.closest('.upcc-plot');
  document.querySelectorAll('.upcc.hover').forEach(function(c){if(!plot||c!==plot.closest('.upcc'))c.classList.remove('hover')});
  if(!plot||!plot.__m||plot.__mode==='intro'||plot.__mode==='wait')return;
  var m=plot.__m,D=readData(plot),r=plot.getBoundingClientRect(),pt=e.touches?e.touches[0]:e,x=pt.clientX-r.left;
  var i=Math.max(0,Math.min(CLASSES.length-1,Math.round((x-m.L)/m.step))),px=m.L+i*m.step;
  var card=plot.closest('.upcc');card.classList.add('hover');
  var hair=plot.querySelector('.upcc-hair'),tip=plot.querySelector('.upcc-tip');
  hair.style.left=px+'px';
  tip.querySelector('small').textContent='Kelas '+CLASSES[i];
  tip.querySelector('.ts').textContent=D.S[i]+' siswa';
  tip.querySelector('.tg').textContent=D.G[i]+' guru (wali kelas)';
  var tw=tip.offsetWidth||130,left=px+12;if(left+tw>m.W)left=px-12-tw;if(left<0)left=0;
  var top=Math.max(0,Math.min(m.yv(D.S[i]),m.yv(D.G[i]))-58);
  tip.style.left=left+'px';tip.style.top=top+'px';
  m.dotS.forEach(function(c,k){c.setAttribute('r',k===i?5:3.2)});
  m.dotG.forEach(function(rc,k){var s=k===i?9:6,p=+rc.getAttribute('x')+(+rc.getAttribute('width'))/2,q=+rc.getAttribute('y')+(+rc.getAttribute('height'))/2;rc.setAttribute('width',s);rc.setAttribute('height',s);rc.setAttribute('x',(p-s/2).toFixed(2));rc.setAttribute('y',(q-s/2).toFixed(2))});
}
document.addEventListener('mousemove',hover,{passive:true});
document.addEventListener('touchstart',hover,{passive:true});
document.addEventListener('touchmove',hover,{passive:true});
document.addEventListener('mouseleave',function(){document.querySelectorAll('.upcc.hover').forEach(function(c){c.classList.remove('hover')})});

/* ================= 3. LANGIT TRANSISI TEMA =================
   Roda berputar searah jarum jam (ke gelap):
   bulan sabit naik dari kiri bawah, lewat di depan kartu, ke kanan atas;
   matahari dari kanan atas turun (tenggelam) ke kanan bawah.
   Ke terang: roda berputar balik — matahari terbit dari kanan bawah ke kanan atas,
   bulan turun kembali ke kiri bawah. Tanpa latar pada bulan & matahari. */
var MOON='<svg viewBox="0 0 100 100" aria-hidden="true"><defs>'+
  '<radialGradient id="ukMoonG" cx="38%" cy="40%" r="70%"><stop offset="0" stop-color="#fbf6ee"/><stop offset=".6" stop-color="#e9dcc8"/><stop offset="1" stop-color="#d3b99d"/></radialGradient>'+
  '<filter id="ukGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>'+
  '<path d="M62 12a40 40 0 1 0 26 66A33 33 0 1 1 62 12z" fill="#efe3d0" opacity=".55" filter="url(#ukGlow)"/>'+
  '<path d="M62 12a40 40 0 1 0 26 66A33 33 0 1 1 62 12z" fill="url(#ukMoonG)"/>'+
  '<circle cx="34" cy="56" r="3.2" fill="#c9ad8f" opacity=".45"/><circle cx="42" cy="72" r="2.2" fill="#c9ad8f" opacity=".4"/><circle cx="28" cy="40" r="1.8" fill="#c9ad8f" opacity=".4"/></svg>';
var ease=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
/* Tampilan pengguna = BUMI.
   Ke gelap : bulan BEREVOLUSI mengelilingi bumi — satu putaran orbit elips miring; saat di sisi
              belakang ia kecil & redup, saat di sisi depan ia besar & lewat di depan kartu,
              lalu berhenti sejenak di kanan atas.
   Ke terang: bumi berevolusi terhadap MATAHARI — matahari tampak bergerak menempuh orbit besar
              dari belakang (redup) ke depan, cahayanya membesar menyapu layar, lalu bersinar
              di kanan atas. Tidak ada kotak latar pada bulan & matahari. */
window.__upSky=function(to,setTheme,setBusy){
  var old=document.getElementById('upSky');if(old)old.remove();
  setBusy&&setBusy(true);
  var W=window.innerWidth,H=window.innerHeight,dark=to==='dark',small=W<700;
  var sky=document.createElement('div');sky.id='upSky';
  sky.innerHTML='<div class="uk-veil"></div><svg class="uk-orbit" aria-hidden="true"></svg><div class="uk-body uk-sun"></div><div class="uk-body uk-moon">'+MOON+'</div>';
  document.body.appendChild(sky);
  var veil=sky.querySelector('.uk-veil'),orbit=sky.querySelector('.uk-orbit'),sun=sky.querySelector('.uk-sun'),moon=sky.querySelector('.uk-moon');
  var body=dark?moon:sun,other=dark?sun:moon;other.style.opacity='0';
  /* orbit elips miring berpusat di tengah layar (bumi) */
  var C={x:W/2,y:H*(small?.5:.52)},Rx=W*(dark?(small?.40:.42):(small?.46:.48)),Ry=H*(dark?(small?.26:.30):(small?.32:.36)),TILT=(dark?-14:-10)*Math.PI/180;
  var ct=Math.cos(TILT),st=Math.sin(TILT);
  var pt=function(a){var x=Rx*Math.cos(a),y=Ry*Math.sin(a);return {x:C.x+x*ct-y*st,y:C.y+x*st+y*ct,front:Math.sin(a)}};
  /* titik akhir: kanan atas */
  var END=-0.70; /* radian, sisi kanan atas orbit */
  var A0=END-(dark?2*Math.PI:2*Math.PI); /* satu putaran penuh searah jarum jam */
  var pts=[];for(var k=0;k<=96;k++){var q=pt(k/96*2*Math.PI);pts.push(q.x.toFixed(1)+','+q.y.toFixed(1))}
  orbit.setAttribute('viewBox','0 0 '+W+' '+H);orbit.setAttribute('width',W);orbit.setAttribute('height',H);
  orbit.innerHTML='<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+(dark?'rgba(239,233,225,.55)':'rgba(138,109,80,.55)')+'" stroke-width="1.4" stroke-dasharray="2 7" stroke-linecap="round"/>'+
    (dark?'':'<circle cx="'+C.x+'" cy="'+C.y+'" r="'+(small?5:6)+'" fill="rgba(138,109,80,.5)"/>');
  veil.style.background=dark?'radial-gradient(140% 120% at 50% 52%,rgba(20,20,19,.55),rgba(20,20,19,.25))':'radial-gradient(120% 120% at 50% 50%,rgba(255,246,222,.9),rgba(246,243,238,.4))';
  var dur=small?2000:2300,t0=performance.now(),switched=false,base=small?.78:1;
  function frame(now){
    var t=Math.min(1,(now-t0)/dur),e=ease(t),a=A0+(END-A0)*e,p=pt(a);
    /* kedalaman: sisi depan (bawah orbit) besar & terang, sisi belakang kecil & redup */
    var depth=(p.front+1)/2,sc=base*(.55+.6*depth),op=.35+.65*depth;
    if(t<.08)op*=t/.08;
    if(t>.9){var f=(1-t)/.1;op*=f}
    body.style.transform='translate('+p.x.toFixed(1)+'px,'+p.y.toFixed(1)+'px) scale('+sc.toFixed(3)+')'+(dark?' rotate('+((a-A0)*180/Math.PI*.25-30).toFixed(1)+'deg)':'');
    body.style.opacity=op.toFixed(3);
    body.style.filter=depth<.35?'blur('+((.35-depth)*4).toFixed(2)+'px)':'none';
    orbit.style.opacity=(Math.sin(Math.PI*t)*.9).toFixed(3);
    if(dark)veil.style.opacity=(Math.sin(Math.PI*Math.min(1,t*1.1))*.8).toFixed(3);
    else{
      /* cahaya matahari menyapu layar dari posisi matahari */
      veil.style.background='radial-gradient(circle at '+p.x.toFixed(0)+'px '+p.y.toFixed(0)+'px,rgba(255,250,236,.95) 0,rgba(255,240,205,.6) '+(10+40*e).toFixed(0)+'%,rgba(246,243,238,0) '+(30+70*e).toFixed(0)+'%)';
      veil.style.opacity=(Math.sin(Math.PI*t)*.95).toFixed(3);
    }
    if(!switched&&t>=.55){switched=true;try{setTheme(to)}catch(err){}}
    if(t<1)requestAnimationFrame(frame);
    else{if(!switched)try{setTheme(to)}catch(err){}sky.remove();setBusy&&setBusy(false)}
  }
  requestAnimationFrame(frame);
};

/* admin/master yang sudah tampil sebelum lapisan ini dimuat: gambar ulang ringkasan */
setTimeout(function(){try{var a=document.getElementById('adMain');if(a&&!a.querySelector('.upcc')&&/Ringkasan|Beranda/.test(a.textContent)&&window.currentSession&&window.currentSession.role==='admin')window.showPage('admin')}catch(e){}},0);

/* ================= 4. HUD ruang di HP ================= */
function placeHud(){
  var h=document.getElementById('cpRoomHud'),room=document.body.classList.contains('cp-room-mode');
  var mob=window.innerWidth<=760;
  document.body.classList.toggle('up-hud-flow',!!(room&&h&&mob));
  if(!h)return;
  if(!room||!mob){h.style.top='';return}
  var v=document.querySelector('.app-view:not(.hidden)'),tb=v&&v.querySelector('.cd-timebar'),top=8;
  if(tb){var r=tb.getBoundingClientRect();if(r.height>0&&r.bottom>0)top=Math.round(r.bottom+6)}
  h.style.top=top+'px';
  document.body.style.setProperty('--up-hud-gap',(h.offsetHeight+12)+'px');
}
setInterval(placeHud,250);window.addEventListener('resize',placeHud);window.addEventListener('scroll',placeHud,{passive:true});
})();
