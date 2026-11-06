(function(){
  'use strict';
  const ROOM_KEY='cerdasPlayQuizRoomsV2';
  const GROUP_KEY='cerdasPlayPvpGroupScoresV4';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const $=id=>document.getElementById(id);
  const teacher=()=>{try{return JSON.parse(sessionStorage.getItem('cerdasPlaySession')||'null')}catch(e){return null}};
  const rooms=()=>{try{return JSON.parse(localStorage.getItem(ROOM_KEY)||'{}')}catch(e){return {}}};
  /* BACKEND: guru membuat/mengubah room -> POST /api/rooms, PATCH /api/rooms/:code (status waiting|playing|finished|closed) */
  const saveRooms=o=>localStorage.setItem(ROOM_KEY,JSON.stringify(o));
  const groupResults=()=>{try{return (JSON.parse(localStorage.getItem(GROUP_KEY)||'[]')||[]).filter(x=>Date.now()-(x.finishedAt||0)<864e5)}catch(e){return []}};
  /* BACKEND: hasil PVP Tarik Tambang -> POST /api/pvp-results */
  const saveGroupResults=a=>localStorage.setItem(GROUP_KEY,JSON.stringify(a));
  const students=cls=>{try{const a=JSON.parse(localStorage.getItem('cerdasPlayStudents')||'[]');return Array.isArray(a)?a.filter(s=>s.className===cls):[]}catch(e){return []}};
  const jabatan=id=>{try{return JSON.parse(localStorage.getItem('cerdasPlayStudentJabatan')||'{}')[id]||'-'}catch(e){return '-'}};
  const codeFor=cls=>{const rs=rooms();let c;do{c=String(cls||'ROOM').toUpperCase()+String(Math.floor(100+Math.random()*900))}while(rs[c]);return c};
  const gameDefs=[
    {id:'math',name:'Perhitungan',icon:'🔢'},
    {id:'logic',name:'Logika Sederhana',icon:'🧠'},
    {id:'picture',name:'Tebak-Tebakan',icon:'🖼️'}
  ];

  function getRoomForTeacher(){const s=teacher();if(!s)return null;const code=sessionStorage.getItem('cerdasPlayTeacherQuizRoom:'+s.id);return code?rooms()[code]||null:null}
  function setRoomCode(code){const s=teacher();if(!s)return; if(code)sessionStorage.setItem('cerdasPlayTeacherQuizRoom:'+s.id,code);else sessionStorage.removeItem('cerdasPlayTeacherQuizRoom:'+s.id)}
  function getRoomRankings(cls){
    const map={};
    students(cls).forEach(s=>map[s.id]={id:s.id,name:s.name,absen:s.absen||'-',jabatan:jabatan(s.id),score:0});
    Object.values(rooms()).filter(r=>r.className===cls&&r.status==='finished').forEach(r=>{
      (r.players||[]).forEach(p=>{
        if(!map[p.id])map[p.id]={id:p.id,name:p.name,absen:p.absen||'-',jabatan:jabatan(p.id),score:0};
        map[p.id].name=p.name;map[p.id].score+=Number(p.score)||0;
      });
    });
    return Object.values(map).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  }

  /* ---------------- DASHBOARD ---------------- */
  function chartSvg(){
    const cls=['5A','5B','5C','5D','6A','6B','6C','6D'];
    const __F=window.__upxF==null?1:window.__upxF;const data=cls.map(c=>students(c).length*__F);
    if(typeof window.__upChartMarkup==='function')return window.__upChartMarkup(data,cls);
    const W=760,H=410,L=55,R=25,T=22,B=55,pw=W-L-R,ph=H-T-B,step=pw/(cls.length-1);
    const y=v=>T+ph-(Math.max(0,Math.min(50,v))/50)*ph;
    let grid='';
    for(let v=0;v<=50;v+=5){const yy=y(v);const major=v%10===0;grid+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="${major?'#e5e0d9':'#efe9e1'}" stroke-width="${major?1.2:1}"/><text x="${L-9}" y="${yy+4}" text-anchor="end" font-size="10" font-weight="${major?800:700}" fill="${major?'#84817d':'#a3a8b9'}">${v}</text>`}
    const pts=data.map((v,i)=>({x:L+i*step,y:y(v),v}));
    const path=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
    const base=y(0);
    return `<svg class="tg4-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik jumlah siswa per kelas dengan sumbu 0 sampai 50 kelipatan 5"><rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="#fff"/>${grid}<line x1="${L}" y1="${base}" x2="${W-R}" y2="${base}" stroke="#d4ccc1" stroke-width="1.5"/><path d="${path} L${pts[pts.length-1].x},${base} L${pts[0].x},${base} Z" fill="rgba(30,31,31,.08)"/><path d="${path}" fill="none" stroke="#1e1f1f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#1e1f1f" stroke-width="2.8"/><text x="${p.x}" y="${p.y-11}" text-anchor="middle" font-size="11.5" font-weight="900" fill="#1e1f1f">${Math.round(p.v)}</text><text x="${p.x}" y="${H-18}" text-anchor="middle" font-size="12" font-weight="900" fill="#2a2a29">${cls[i]}</text>`).join('')}</svg>`;
  }
  window.__tgChartRefresh=function(){var w=document.querySelector('#teacherGuruV4 .tg4-chart-wrap');if(!w)return;var h=chartSvg();if(w.__upH!==h||!w.querySelector('.upcc-plot')){w.innerHTML=h;w.__upH=h}};
  function renderDashboard(){
    const s=teacher();if(!s||s.role!=='teacher')return;
    const ss=students(s.className), r=getRoomForTeacher();
    const rankings=getRoomRankings(s.className);
    const host=$('teacherGuruV4');if(!host)return;
    host.innerHTML=`
      <div class="tg4-head"><div><span class="badge">👩‍🏫 Portal Guru</span><h1>Dashboard</h1><p>Ringkasan kelas ${esc(s.className)}. Nilai mandiri dan nilai kelompok dipisahkan.</p></div><span class="tg4-chip">Kelas ${esc(s.className)}</span></div>
      <div class="tg4-cards">
        <div class="tg4-stat"><span>Jumlah siswa</span><strong>${ss.length}</strong><small>Siswa terdaftar di ${esc(s.className)}</small></div>
        <div class="tg4-stat"><span>Jumlah game</span><strong>4</strong><small>3 game mandiri + 1 PVP</small></div>
        <div class="tg4-stat"><span>Room aktif</span><strong>${r&&r.status!=='closed'?'1':'0'}</strong><small>Join Room kelas</small></div>
      </div>
      <div class="tg4-panel up-chart-card"><span class="up-kicker">📊 GRAFIK SELURUH KELAS</span><h3 class="up-chart-title">Jumlah Siswa per Kelas (5A–6D)</h3><div class="tg4-chart-wrap">${chartSvg()}</div><div class="up-legend"><span class="up-dot"></span>Jumlah Siswa Terdaftar</div></div>
      <div class="tg4-panel"><h2>🎮 Game & Level</h2><p>Setiap game mandiri memiliki 5 level. Room Game dapat menjalankan maksimal 15 ronde.</p><div class="tg4-game-grid">${gameDefs.map(g=>`<div class="tg4-game-card"><span class="tg4-game-icon">${g.icon}</span><b>${g.name}</b><span class="tg4-chart-note">5 level</span><div class="tg4-levels">${[1,2,3,4,5].map(n=>`<span class="tg4-level">Level ${n}</span>`).join('')}</div></div>`).join('')}</div><div class="tg4-game-grid"><div class="tg4-game-card"><span class="tg4-game-icon">⚔️</span><b>PVP Tarik Tambang</b><span class="tg4-chart-note">1–5 lawan 1–5 • 50 soal matematika • tanpa waktu</span></div></div></div>
      `;
  }
  function studentTable(ss,rankings){
    const rank={};rankings.forEach((r,i)=>rank[r.id]=i+1);
    return `<div class="tg4-table-wrap"><table class="tg4-table"><thead><tr><th>No</th><th>Nama</th><th>No. Absen</th><th>Jabatan</th><th>Score</th></tr></thead><tbody>${ss.length?ss.map((x,i)=>`<tr><td class="tg4-rank">${rank[x.id]||'-'}</td><td>${esc(x.name)}</td><td>${esc(x.absen||'-')}</td><td>${esc(jabatan(x.id))}</td><td class="tg4-score">${rankings.find(r=>r.id===x.id)?.score||0}</td></tr>`).join(''):`<tr><td colspan="5">Belum ada siswa terdaftar.</td></tr>`}</tbody></table></div>`;
  }

  /* ---------------- ROOM GAME ---------------- */
  function sequenceFor(n){
    const seq=[];
    const __cls=(window.currentSession||{}).className,__all=gameDefs.slice(0,3),__on=__all.filter(x=>!window.__upGameOn||window.__upGameOn(__cls,x.id)),__G=__on.length?__on:__all;
    /* setiap kombinasi permainan+level dipakai paling banyak sekali (3 permainan x 5 level = 15),
       semua permainan aktif muncul minimal sekali, dan permainan yang sama tidak berurutan bila bisa */
    const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
    let pool=[];__G.forEach(g=>{for(let lv=1;lv<=5;lv++)pool.push({g,level:lv})});
    let picks=[];
    sh(__G).forEach(g=>{if(picks.length<n){const c=sh(pool.filter(x=>x.g===g))[0];picks.push(c);pool=pool.filter(x=>x!==c)}});
    while(picks.length<n){if(!pool.length){__G.forEach(g=>{for(let lv=1;lv<=5;lv++)pool.push({g,level:lv})})}const c=sh(pool)[0];picks.push(c);pool=pool.filter(x=>x!==c)}
    let best=sh(picks),bad=Infinity;
    for(let t=0;t<60;t++){const o=sh(picks);let b=0;for(let i=1;i<o.length;i++)if(o[i].g===o[i-1].g)b++;if(b<bad){bad=b;best=o}if(!b)break}
    best.forEach((c,i)=>seq.push({round:i+1,game:c.g.id,gameName:c.g.name,icon:c.g.icon,level:c.level}));
    return seq;
  }
  function renderRoom(){
    const s=teacher();if(!s||s.role!=='teacher')return;const host=$('teacherGuruV4');if(!host)return;
    const r=getRoomForTeacher();
    if(r&&window.__cpRoomPanel){window.__cpRoomPanel(host,r,s);return}
    if(!r){
      host.innerHTML=`<div class="tg4-head"><div><span class="badge">🎯 ROOM GAME</span><h1>Room Game</h1><p>Guru menentukan jumlah ronde 1–15. Durasi tiap ronde: Perhitungan & Logika Sederhana 3 menit, Tebak-Tebakan 2 menit.</p></div><span class="tg4-chip">${esc(s.className)}</span></div><div class="tg4-panel"><div class="tg4-form-row"><div class="tg4-field"><label>Jumlah ronde</label><select id="tg4RoundCount">${Array.from({length:15},(_,i)=>`<option value="${i+1}" ${i===2?'selected':''}>${i+1} ronde</option>`).join('')}</select></div><button id="tg4CreateRoom" class="btn btn-primary">🚀 Buat Room</button></div><div class="tg4-note" style="margin-top:15px">Guru cukup menentukan jumlah ronde. Sistem mengacak permainan dan level setiap ronde (Perhitungan, Logika Sederhana, Tebak-Tebakan; level 1–5) tanpa urutan tetap. Siswa tetap bisa memainkan level yang belum ia buka di permainan mandiri.</div></div>`;
      $('tg4CreateRoom').onclick=()=>{
        const n=Math.max(1,Math.min(15,Number($('tg4RoundCount').value||3)));const code=codeFor(s.className);const rs=rooms();rs[code]={code,className:s.className,teacherId:s.id,teacherName:s.name,status:'waiting',levelCount:n,sequence:sequenceFor(n),players:[],createdAt:Date.now()};saveRooms(rs);setRoomCode(code);renderRoom();
      };
      return;
    }
    const status=r.status==='waiting'?'Menunggu siswa':r.status==='playing'?'Sedang bermain':'Selesai';
    host.innerHTML=`<div class="tg4-head"><div><span class="badge">🎯 ROOM GAME</span><h1>Room Game</h1><p>Ronde maksimal 15. Durasi tiap ronde: Perhitungan & Logika Sederhana 3 menit, Tebak-Tebakan 2 menit.</p></div><span class="tg4-chip">${esc(s.className)}</span></div><div class="tg4-panel"><div class="tg4-room-top"><div><small>KODE ROOM</small><div class="tg4-room-code">${esc(r.code)}</div></div><span class="tg4-status ${r.status==='playing'?'live':''} ${r.status==='finished'?'done':''}">${status}</span></div><p style="margin-top:12px">${(r.players||[]).length} siswa sudah bergabung. Nilai yang masuk dari room ini hanya menjadi <b>Nilai Individu</b>.</p><div class="tg4-round-grid">${(r.sequence||[]).map(x=>`<div class="tg4-round"><b>Ronde ${x.round}</b><small>${x.icon} ${esc(x.gameName)} • Level ${x.level} • ${window.__upDurTxt?window.__upDurTxt(x.game):'3 menit'}</small></div>`).join('')}</div><div class="room-player-grid" style="margin-top:15px">${(r.players||[]).map(p=>`<span class="room-player-chip">${p.avatar||'👤'} ${esc(p.name)} <b>${Number(p.score)||0}</b></span>`).join('')||'<span class="room-player-chip">Belum ada siswa</span>'}</div><div class="tg4-actions">${r.status==='waiting'?`<button id="tg4StartRoom" class="btn btn-success" ${(r.players||[]).length<1?'disabled':''}>▶ Mulai Permainan</button>`:''}<button id="tg4CloseRoom" class="btn btn-outline">Tutup Room</button></div></div>`;
    $('tg4StartRoom')?.addEventListener('click',()=>{const rs=rooms();const rr=rs[r.code];if(!rr||rr.status!=='waiting')return;rr.status='playing';rr.startedAt=Date.now();(rr.players||[]).forEach(p=>{p.score=0;p.roundIndex=0;p.finished=false});rs[r.code]=rr;saveRooms(rs);renderRoom();});
    $('tg4CloseRoom')?.addEventListener('click',()=>{const rs=rooms();if(rs[r.code]){rs[r.code].status='closed';saveRooms(rs)}setRoomCode(null);renderRoom();});
  }

  /* ---------------- NILAI SISWA: INDIVIDU (Join Room) + KELOMPOK (PVP) ---------------- */
  function groupTable(res,side){
    const members=res[side+'Members']||(res[side]||[]).map(n=>({name:n,correct:null,wrong:null}));
    const score=side==='red'?res.redScore:res.blueScore;
    const win=res.winner===(side==='red'?'Tim Merah':'Tim Biru');
    return `<div class="tg5-gt-box ${side}"><div class="tg5-gt-title">${side==='red'?'Tim merah':'Tim biru'}${win?' 🏆':''}</div><table class="tg5-gt"><thead><tr><th>nama</th><th>Jawab benar</th><th>Jawab salah</th></tr></thead><tbody>${members.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.correct??'-'}</td><td>${m.wrong??'-'}</td></tr>`).join('')}<tr class="sc"><td>score</td><td>${score}</td><td></td></tr></tbody></table></div>`;
  }
  function renderScores(selId){
    const s=teacher();if(!s||s.role!=='teacher')return;const host=$('teacherGuruV4');if(!host)return;const rows=getRoomRankings(s.className);
    const data=groupResults().filter(x=>x.className===s.className).slice().reverse();
    const cur=data.find(x=>x.id===selId)||data[0];
    host.innerHTML=`<div class="tg4-head"><div><span class="badge">🏆 NILAI SISWA</span><h1>Nilai Siswa</h1><p>Nilai individu (Join Room) dan nilai kelompok (PVP Tarik Tambang) dipisahkan. Keduanya tidak saling masuk.</p></div><span class="tg4-chip">${esc(s.className)}</span></div>
    <div class="tg4-panel"><h2>Nilai individu</h2><p>Ini hanya nilai individu yang diambil dari game Join Room (ranking mandiri).</p><div class="tg4-table-wrap"><table class="tg4-table"><thead><tr><th>Peringkat</th><th>Nama</th><th>No. Absen</th><th>Jabatan</th><th>Score</th></tr></thead><tbody>${rows.length?rows.map((p,i)=>`<tr><td class="tg4-rank"><span class="cp-rk r${i+1}">${i+1}</span></td><td>${esc(p.name)}</td><td>${esc(p.absen)}</td><td>${esc(p.jabatan)}</td><td class="tg4-score"><span class="cp-pill">${p.score}</span></td></tr>`).join(''):`<tr><td colspan="5">Belum ada nilai individu dari Join Room.</td></tr>`}</tbody></table></div><div class="tg4-note" style="margin-top:14px">Jawaban benar = 100 poin + bonus kecepatan (maks. +100). Jawaban salah atau waktu habis = 0 poin. Skor imbang diurutkan dari total waktu tercepat.</div></div>
    <div class="tg4-panel"><h2>Nilai kelompok</h2><p>Tampil dari hasil konversi game PVP Tarik Tambang. Tidak masuk ke nilai individu. Riwayat hanya disimpan 24 jam terakhir.</p>${cur?`${data.length>1?`<div class="tg4-field tg4-pvp-select" style="margin-bottom:14px"><label>Pertandingan</label><select id="tg5Match">${data.map(x=>`<option value="${esc(x.id)}" ${x.id===cur.id?'selected':''}>${new Date(x.finishedAt).toLocaleString('id-ID')} • ${esc(x.winner)}</option>`).join('')}</select></div>`:''}<div class="tg5-gt-grid">${groupTable(cur,'red')}${groupTable(cur,'blue')}</div><div class="tg4-note" style="margin-top:14px">${esc(cur.winner==='Seri'?'Pertandingan seri':cur.winner+' menang')} • ${esc(cur.reason||'')}</div>`:'<div class="tg4-note">Belum ada pertandingan PVP. Mainkan PVP Tarik Tambang, hasilnya muncul di sini.</div>'}</div>`;
    $('tg5Match')?.addEventListener('change',e=>renderScores(e.target.value));
    try{if(window.__cpScoresExtra)window.__cpScoresExtra(host,s)}catch(err){console.error(err)}
  }
  function goScores(){
    document.querySelectorAll('#teacherPortalPage .teacher-menu[data-teacher-vnext]').forEach(b=>b.classList.toggle('active',b.dataset.teacherVnext==='scores'));
    renderScores();window.scrollTo({top:0,behavior:'auto'});
  }

  /* ---------------- PVP TARIK TAMBANG ---------------- */
  const MATH50=[
    ['12 + 8',['18','20','22','24'],1],['25 - 9',['14','15','16','17'],2],['7 × 8',['54','56','58','64'],1],['72 ÷ 9',['6','7','8','9'],2],['15 + 27',['40','41','42','43'],2],
    ['60 - 28',['30','32','34','36'],1],['9 × 6',['45','54','56','63'],1],['81 ÷ 9',['7','8','9','10'],2],['35 + 19',['52','53','54','55'],2],['100 - 37',['61','62','63','64'],2],
    ['14 × 5',['60','65','70','75'],2],['96 ÷ 12',['6','8','10','12'],1],['45 + 38',['81','82','83','84'],2],['90 - 46',['42','43','44','45'],2],['11 × 7',['66','77','78','88'],1],
    ['144 ÷ 12',['10','11','12','13'],2],['28 + 47',['73','74','75','76'],2],['83 - 29',['52','53','54','55'],2],['13 × 4',['48','50','52','54'],1],['121 ÷ 11',['9','10','11','12'],2],
    ['32 + 56',['86','87','88','89'],2],['70 - 35',['30','35','40','45'],1],['8 × 9',['64','72','81','88'],1],['63 ÷ 7',['7','8','9','10'],2],['17 + 26',['41','42','43','44'],2],
    ['95 - 48',['45','46','47','48'],2],['12 × 6',['60','66','72','78'],1],['84 ÷ 6',['12','13','14','15'],2],['29 + 34',['61','62','63','64'],2],['76 - 39',['35','36','37','38'],2],
    ['15 × 8',['100','110','120','130'],2],['108 ÷ 9',['10','11','12','13'],2],['46 + 28',['72','73','74','75'],2],['88 - 27',['59','60','61','62'],2],['9 × 12',['96','108','112','120'],1],
    ['132 ÷ 11',['10','11','12','13'],1],['57 + 36',['91','92','93','94'],2],['100 - 64',['34','35','36','37'],2],['14 × 7',['84','96','98','104'],0],['90 ÷ 10',['7','8','9','10'],3],
    ['23 + 49',['70','71','72','73'],2],['65 - 28',['35','36','37','38'],2],['16 × 6',['86','96','106','116'],1],['126 ÷ 9',['12','13','14','15'],2],['38 + 27',['63','64','65','66'],2],
    ['92 - 57',['33','34','35','36'],2],['18 × 5',['80','90','100','110'],1],['150 ÷ 15',['8','9','10','11'],2],['44 + 39',['81','82','83','84'],2],['120 - 55',['63','64','65','66'],2]
  ].map(x=>({text:x[0],options:x[1],answer:x[2]}));
  let pvpState=null,pullTimers={};
  const VB={w:840,h:330,cx:420,gy:286},D_TOE=70,WIN_LEAD=8,UNIT=D_TOE/WIN_LEAD;
  const SC=[1.5,1.35,1.2,1.06,.95],SKIN=['#f2c09a','#dca27a','#f6cfa8','#c98f66','#f0b78c'];
  const TEAM={blue:{shirt:'#2f6fed',band:'#1d4ed8',pants:'#e8892b',pantsD:'#c9701a'},red:{shirt:'#e23b3b',band:'#dc2626',pants:'#f4f1ea',pantsD:'#d8d3c6'}};
  function shuffled(n){const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function figureMarkup(t,k){
    const skin=SKIN[k%5];
    const leg=(cls,col)=>`<g transform="translate(0,-58)"><g class="tg5-th ${cls}"><path d="M0 0V30" stroke="${col}" stroke-width="12" stroke-linecap="round"/><g transform="translate(0,30)"><g class="tg5-sh ${cls}"><path d="M0 0V27" stroke="${col}" stroke-width="10" stroke-linecap="round"/><path d="M-4 26h17a4.5 4.5 0 0 1 0 9H-4z" fill="#2b2b2b"/></g></g></g></g>`;
    const arm=(cls,off)=>`<g transform="translate(${off},-102)"><g class="tg5-ua ${cls}"><path d="M0 0V28" stroke="${t.shirt}" stroke-width="10" stroke-linecap="round"/><g transform="translate(0,28)"><g class="tg5-fa ${cls}"><path d="M0 0V25" stroke="${skin}" stroke-width="8" stroke-linecap="round"/><circle cy="27" r="5.5" fill="${skin}"/></g></g></g></g>`;
    return `<g class="tg5-body">${arm('b',-4)}${leg('b',t.pantsD)}<path d="M-12 -106q12-7 24 0l-1 46h-22z" fill="${t.shirt}"/><rect x="-12" y="-63" width="24" height="12" rx="4" fill="${t.pants}"/>${leg('f',t.pants)}
      <g transform="translate(3,-126)"><circle cx="-11" cy="3" r="3.6" fill="${skin}"/><circle r="14" fill="${skin}"/><path d="M-14 -6A14 14 0 0 1 14 -6Z" fill="#241712"/><path class="tg5-tail" d="M-14 -5l-13-5 2 9z" fill="${t.band}"/><path d="M-14.5 -7L15 -10l.5 7-30 3z" fill="${t.band}"/><circle cx="3" cy="-6" r="3" fill="#fff" fill-opacity=".92"/><path d="M3 1.5L11 4" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round"/><circle cx="7.5" cy="6" r="1.8" fill="#1b1b1b"/><path d="M4 11q5 4 10-1" stroke="#7a2a1a" fill="none" stroke-width="2" stroke-linecap="round"/></g>
      ${arm('f',2)}</g>`;
  }
  function arenaSvg(n){
    const s=SC[n-1],step=60*s,toe=24*s,gy=VB.gy,cx=VB.cx,ry=gy-95*s,span=D_TOE+toe+(n-1)*step;
    const names={blue:pvpState.blue,red:pvpState.red};
    let teams='';
    ['blue','red'].forEach(side=>{
      let f='',lab='';
      for(let i=0;i<n;i++){
        const dx=D_TOE+toe+i*step,x=side==='blue'?cx-dx:cx+dx,flip=side==='blue'?1:-1;
        f+=`<g transform="translate(${x.toFixed(1)},${gy}) scale(${flip*s},${s})"><g class="tg5-fig f${i%3}">${figureMarkup(TEAM[side],i)}</g></g>`;
        lab+=`<text id="tg5N-${side}-${i}" class="tg5-nm ${side}" x="${x.toFixed(1)}" y="${(gy-158*s).toFixed(1)}" text-anchor="middle">${esc(names[side][i])}</text>`;
      }
      teams+=`<g class="tg5-team ${side}" id="tg5T-${side}">${f}${lab}</g>`;
    });
    const xa=cx-span+30*s-8,xb=cx+span-30*s+8;
    return `<svg class="tg5-svg" viewBox="${(cx-(span+D_TOE+46)).toFixed(1)} 34 ${(2*(span+D_TOE+46)).toFixed(1)} ${gy+16-34}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Arena tarik tambang">
      <defs><linearGradient id="tg5grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd27a"/><stop offset="1" stop-color="#5fb65a"/></linearGradient></defs>
      <rect x="-400" y="${gy}" width="${VB.w+800}" height="${VB.h-gy+40}" fill="url(#tg5grass)"/>
      <ellipse cx="${cx}" cy="${gy+2}" rx="${span+40}" ry="7" fill="rgba(0,0,0,.12)"/>
      <g id="tg5Pull" class="tg5-pull" style="transform:translateX(0px)">
        <g class="tg5-rope"><line x1="${xa}" y1="${ry}" x2="${xb}" y2="${ry}" stroke="#7a4a1f" stroke-width="7" stroke-linecap="round"/><line x1="${xa}" y1="${ry}" x2="${xb}" y2="${ry}" stroke="#d9a05b" stroke-width="7" stroke-dasharray="5 7" stroke-linecap="round"/>
        <path d="M${cx-7} ${ry-4}h14v30l-7-6-7 6z" fill="#e11d2e" stroke="#fff" stroke-width="1.5"/></g>
        ${teams}
      </g>
      <line x1="${cx}" y1="52" x2="${cx}" y2="${gy+28}" stroke="#4b5563" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round"/>
      <text x="${cx}" y="44" text-anchor="middle" class="tg5-lineLabel">GARIS TENGAH</text></svg>`;
  }
  function padHtml(side){
    const name=side==='blue'?'Tim Biru':'Tim Merah',ic=side==='blue'?'🔵':'🔴';
    return `<div class="tg5-pad ${side}" id="tg5P-${side}"><div class="tg5-who" id="tg5W-${side}"></div><div class="tg5-q" id="tg5Q-${side}">…</div><div class="tg5-disp" id="tg5D-${side}"></div><div class="tg5-keys">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" class="tg5-key" data-side="${side}" data-k="${n}">${n}</button>`).join('')}<button type="button" class="tg5-key c" data-side="${side}" data-k="C">C</button><button type="button" class="tg5-key" data-side="${side}" data-k="0">0</button><button type="button" class="tg5-key go" data-side="${side}" data-k="GO">Go</button></div><div class="tg5-meta" id="tg5M-${side}">${ic} ${name}</div><div class="tg5-hint">${side==='blue'?'⌨ Angka • Enter • ⌫':'⌨ Numpad • Enter'}</div></div>`;
  }
  const qOf=side=>{const i=side==='red'?pvpState.ri:pvpState.bi;return i>=50?null:MATH50[pvpState.order[side][i]]};
  const ansOf=q=>Number(q.options[q.answer]);
  function renderPvpBattle(){
    const s=teacher();if(!s||!pvpState)return;const host=$('teacherGuruV4');const n=pvpState.red.length;
    host.innerHTML=`<div class="tg4-head"><div><span class="badge">⚔️ PERTANDINGAN BERLANGSUNG</span><h1>Tarik Tambang</h1><p>${n} lawan ${n} • 50 soal matematika per tim • tanpa batas waktu. Kaki yang lebih dulu menyentuh garis tengah = kalah.</p></div><span class="tg4-chip">${esc(s.className)}</span></div>
    <div class="tg5-wrap"><div class="tg5-grid">${padHtml('blue')}<div class="tg5-center"><div class="tg5-title">Tarik Tambang Matematika</div><div class="tg5-stage">${arenaSvg(n)}</div><div class="tg5-end hidden" id="tg5End"></div><div class="tg5-cap">Jawab soal untuk menarik tali!</div><div class="tg5-chips"><span class="tg5-chip blue" id="tg5C-blue"></span><span class="tg5-chip red" id="tg5C-red"></span></div><button type="button" class="btn btn-outline tg5-abort" id="tg5Abort">✖ Batalkan pertandingan</button></div>${padHtml('red')}</div></div>`;
    host.querySelectorAll('.tg5-key').forEach(b=>{
      const down=ev=>{ev.preventDefault();b.classList.add('pressed');pressKey(b.dataset.side,b.dataset.k)};
      const up=()=>b.classList.remove('pressed');
      b.addEventListener('pointerdown',down);
      ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(t=>b.addEventListener(t,up));
      b.addEventListener('click',ev=>{if(ev.detail===0)pressKey(b.dataset.side,b.dataset.k)});
      b.addEventListener('contextmenu',ev=>ev.preventDefault());
    });
    $('tg5Abort').onclick=()=>{if(pvpState&&!pvpState.finished&&!confirm('Batalkan pertandingan? Hasil tidak disimpan.'))return;pvpState=null;renderPvpSetup()};
    updateBattle();
  }
  function curMember(side){const st=pvpState,i=side==='red'?st.ri:st.bi,n=st.red.length;return i%n}
  function updateBattle(){
    const st=pvpState;if(!st||!$('tg5Pull'))return;const n=st.red.length;
    $('tg5Pull').style.transform=`translateX(${(-(st.blueCorrect-st.redCorrect)*UNIT).toFixed(1)}px)`;
    ['blue','red'].forEach(side=>{
      const q=qOf(side),done=!q,i=side==='red'?st.ri:st.bi,names=st[side],cm=curMember(side);
      $('tg5Q-'+side).textContent=done?'Selesai ✔':q.text+' = ?';
      $('tg5D-'+side).textContent=st.typed[side]||'';
      $('tg5W-'+side).innerHTML=done?'50 soal selesai':`${side==='blue'?'🔵':'🔴'} Giliran: <b>${esc(names[cm])}</b>`;
      $('tg5M-'+side).textContent=`Soal ${Math.min(i+1,50)}/50 • ✔ ${side==='red'?st.redCorrect:st.blueCorrect} • ✖ ${side==='red'?st.redWrong:st.blueWrong}`;
      $('tg5C-'+side).textContent=`${side==='blue'?'🔵 Biru':'🔴 Merah'}: ${(side==='red'?st.redCorrect:st.blueCorrect)*100}`;
      for(let k=0;k<n;k++)$(`tg5N-${side}-${k}`)?.classList.toggle('cur',!st.finished&&!done&&k===cm);
      $('tg5P-'+side).classList.toggle('off',st.finished||done);
    });
  }
  function pressKey(side,k){
    const st=pvpState;if(!st||st.finished||!qOf(side))return;
    if(k==='C'){st.typed[side]='';}
    else if(k==='GO'){submitAnswer(side);return}
    else if(st.typed[side].length<4){st.typed[side]+=k}
    updateBattle();
  }
  document.addEventListener('keydown',function(e){
    const st=pvpState;if(!st||st.finished||!document.getElementById('tg5Pull')||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
    const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
    const c=e.code;let side=null,k=null,m;
    if(m=/^Digit(\d)$/.exec(c)){side='blue';k=m[1]}
    else if(m=/^Numpad(\d)$/.exec(c)){side='red';k=m[1]}
    else if(c==='Enter'){side='blue';k='GO'}
    else if(c==='NumpadEnter'){side='red';k='GO'}
    else if(c==='Backspace'){side='blue';k='C'}
    else if(c==='NumpadDecimal'||c==='NumpadSubtract'||c==='NumpadAdd'){side='red';k='C'}
    if(!side)return;
    e.preventDefault();pressKey(side,k);
    const kb=document.querySelector('.tg5-key[data-side="'+side+'"][data-k="'+k+'"]');
    if(kb){kb.classList.add('pressed');setTimeout(()=>kb.classList.remove('pressed'),110)}
  });
  function flash(side,ok){const d=$('tg5D-'+side);if(!d)return;d.classList.remove('ok','bad');void d.offsetWidth;d.classList.add(ok?'ok':'bad');setTimeout(()=>d.classList.remove('ok','bad'),420)}
  function pullAnim(side){const g=$('tg5T-'+side);if(!g)return;g.classList.add('pull');clearTimeout(pullTimers[side]);pullTimers[side]=setTimeout(()=>g.classList.remove('pull'),900)}
  function submitAnswer(side){
    const st=pvpState,q=qOf(side);if(!st||st.finished||!q)return;
    const t=st.typed[side];if(t==='')return;
    const ok=Number(t)===ansOf(q),m=(side==='red'?st.rm:st.bm)[curMember(side)];
    if(ok){m.correct++;side==='red'?st.redCorrect++:st.blueCorrect++}else{m.wrong++;side==='red'?st.redWrong++:st.blueWrong++}
    side==='red'?st.ri++:st.bi++;st.typed[side]='';
    flash(side,ok);if(ok)pullAnim(side);
    const lead=st.blueCorrect-st.redCorrect;
    if(lead>=WIN_LEAD){updateBattle();finishPvp('Tim Biru','Kaki Tim Merah menyentuh garis tengah.');return}
    if(-lead>=WIN_LEAD){updateBattle();finishPvp('Tim Merah','Kaki Tim Biru menyentuh garis tengah.');return}
    if(st.ri>=50&&st.bi>=50){updateBattle();finishPvp(st.redCorrect>st.blueCorrect?'Tim Merah':st.blueCorrect>st.redCorrect?'Tim Biru':'Seri','Kedua tim menyelesaikan 50 soal.');return}
    updateBattle();
  }
  function startPvp(red,blue){
    const mk=a=>a.map(name=>({name,correct:0,wrong:0}));
    pvpState={red,blue,rm:mk(red),bm:mk(blue),ri:0,bi:0,redCorrect:0,redWrong:0,blueCorrect:0,blueWrong:0,order:{red:shuffled(50),blue:shuffled(50)},typed:{red:'',blue:''},finished:false,winner:null};
    renderPvpBattle();
  }
  function finishPvp(winner,reason){
    const st=pvpState;if(!st||st.finished)return;st.finished=true;st.winner=winner;
    const s=teacher();
    const result={id:'pvp-'+Date.now(),className:s.className,red:[...st.red],blue:[...st.blue],redMembers:st.rm.map(x=>({...x})),blueMembers:st.bm.map(x=>({...x})),redCorrect:st.redCorrect,redWrong:st.redWrong,blueCorrect:st.blueCorrect,blueWrong:st.blueWrong,redScore:st.redCorrect*100,blueScore:st.blueCorrect*100,winner:winner||'Seri',reason,finishedAt:Date.now()};
    const list=groupResults();list.push(result);saveGroupResults(list);
    const loser=winner==='Tim Biru'?'red':winner==='Tim Merah'?'blue':null,win=winner==='Tim Biru'?'blue':winner==='Tim Merah'?'red':null;
    if(loser&&reason.includes('garis'))$('tg5T-'+loser)?.classList.add('lose');
    if(win)$('tg5T-'+win)?.classList.add('win');
    updateBattle();
    const end=$('tg5End');
    if(end){end.classList.remove('hidden');end.innerHTML=`<div class="tg5-end-card"><div class="tg5-end-ic">${winner==='Seri'?'🤝':'🏆'}</div><h3>${winner==='Seri'?'Pertandingan Seri':esc(winner)+' Menang!'}</h3><p>${esc(reason)}</p><p class="tg5-end-sc">🔵 Biru ${result.blueScore} • 🔴 Merah ${result.redScore}</p><div class="tg4-actions" style="justify-content:center"><button class="btn btn-primary" id="tg5Again">Main Lagi</button><button class="btn btn-outline" id="tg5ToScores">Lihat Nilai Siswa</button></div></div>`;
      $('tg5Again').onclick=()=>{pvpState=null;renderPvpSetup()};$('tg5ToScores').onclick=goScores;}
  }

  function renderPvpSetup(){
    const s=teacher();if(!s||s.role!=='teacher')return;const host=$('teacherGuruV4');
    host.innerHTML=`<div class="tg4-head"><div><span class="badge">⚔️ PVP TARIK TAMBANG</span><h1>PVP Tarik Tambang</h1><p>Tanpa waktu. Pilih jumlah pemain 1–5 per tim, lalu isi nama anggota sebelum pertandingan dimulai.</p></div><span class="tg4-chip">${esc(s.className)}</span></div><div class="tg4-panel"><div class="tg4-field tg4-pvp-select"><label>Jumlah pemain per tim</label><select id="tg4TeamSize"><option value="1">1 lawan 1</option><option value="2">2 lawan 2</option><option value="3">3 lawan 3</option><option value="4">4 lawan 4</option><option value="5">5 lawan 5</option></select></div><div id="tg4Members" class="tg4-members"></div><div id="tg4PvpError" class="tg4-error"></div><div class="tg4-actions"><button id="tg4StartPvp" class="btn btn-primary">⚔️ Mulai Tarik Tambang</button></div><div class="tg4-note" style="margin-top:14px">Aturan: setiap tim memiliki 50 soal matematika dan menjawab bergiliran antar anggota. Jawaban benar menarik tali ke arah tim; jawaban salah tidak menambah tarikan dan langsung berganti soal berikutnya. Pertandingan berakhir saat kaki pemain terdepan sebuah tim menyentuh garis tengah (tim itu kalah), atau kedua tim selesai 50 soal.</div></div>`;
    const size=$('tg4TeamSize');const members=$('tg4Members');
    const draw=()=>{const n=Number(size.value);members.innerHTML=`<div class="tg4-team red"><h3>🔴 Tim Merah</h3>${Array.from({length:n},(_,i)=>`<div class="tg4-member-row"><span class="tg4-member-num">${i+1}</span><input id="tg4Red${i}" placeholder="Nama anggota ${i+1}" autocomplete="off"></div>`).join('')}</div><div class="tg4-team blue"><h3>🔵 Tim Biru</h3>${Array.from({length:n},(_,i)=>`<div class="tg4-member-row"><span class="tg4-member-num">${i+1}</span><input id="tg4Blue${i}" placeholder="Nama anggota ${i+1}" autocomplete="off"></div>`).join('')}</div>`};
    size.onchange=draw;draw();
    $('tg4StartPvp').onclick=()=>{const n=Number(size.value);const red=Array.from({length:n},(_,i)=>$(`tg4Red${i}`).value.trim());const blue=Array.from({length:n},(_,i)=>$(`tg4Blue${i}`).value.trim());const err=$('tg4PvpError');if(red.some(x=>!x)||blue.some(x=>!x)){err.textContent='⚠️ Semua nama anggota harus diisi.';err.classList.add('show');return}if(new Set([...red,...blue].map(x=>x.toLowerCase())).size<red.length+blue.length){err.textContent='⚠️ Nama anggota tidak boleh sama antar pemain.';err.classList.add('show');return}(window.__upPvpGate?window.__upPvpGate(function(){startPvp(red,blue)}):startPvp(red,blue));};
  }
  function renderGuru(){
    const s=teacher();if(!s||s.role!=='teacher')return;
    const page=$('teacherPortalPage');if(!page)return;
    document.querySelectorAll('#teacherPortalPage .teacher-section,#teacherPortalPage #teacherVNextRoot').forEach(x=>x.style.display='none');
    let root=$('teacherGuruV4');if(!root){root=document.createElement('div');root.id='teacherGuruV4';page.querySelector('.teacher-main').appendChild(root)}
    const active=document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext].active')?.dataset.teacherVnext||'dashboard';
    if(active==='dashboard')renderDashboard();
    else if(active==='room')renderRoom();
    else if(active==='scores')renderScores();
    else if(active==='pvp'){if(pvpState&&!pvpState.finished)renderPvpBattle();else renderPvpSetup();}
    else if(active==='profile'&&window.__upTeacherProfile)window.__upTeacherProfile(root);
    else if(active==='games'&&window.__upTeacherGames)window.__upTeacherGames(root);
  }

  function bind(){
    const page=$('teacherPortalPage');if(!page)return;
    /* document capture runs before the old button capture handler. */
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('#teacherPortalPage .teacher-menu[data-teacher-vnext]');
      if(!btn)return;
      const s=teacher();if(!s||s.role!=='teacher')return;
      e.preventDefault();e.stopImmediatePropagation();
      document.querySelectorAll('#teacherPortalPage .teacher-menu[data-teacher-vnext]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      renderGuru();window.scrollTo({top:0,behavior:'auto'});
    },true);
    const oldShow=window.showPage;
    if(typeof oldShow==='function'&&!window.__teacherGuruV4ShowWrapped){
      window.__teacherGuruV4ShowWrapped=true;
      window.showPage=function(name){const out=oldShow.apply(this,arguments);if(name==='teacher')setTimeout(renderGuru,0);return out};
    }
    const obs=new MutationObserver(()=>{const s=teacher();if(s?.role==='teacher'&&!page.classList.contains('hidden')){if(!$('teacherGuruV4'))renderGuru();}});
    obs.observe(page,{attributes:true,attributeFilter:['class']});
    window.addEventListener('storage',e=>{if(e.key===ROOM_KEY||e.key===GROUP_KEY){const s=teacher();if(s?.role==='teacher'&&!page.classList.contains('hidden')){const act=document.querySelector('#teacherPortalPage .teacher-menu[data-teacher-vnext].active')?.dataset.teacherVnext;if(act==='pvp')return;renderGuru()}}});
    if(!page.classList.contains('hidden')&&teacher()?.role==='teacher')renderGuru();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
