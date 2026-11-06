(function(){
'use strict';
const $=id=>document.getElementById(id);
const sid=()=>window.currentSession?.id||'demo';
const doneKey=n=>`cerdasPlay:${sid()}:logicLevel${n}Completed`;
const starsKey=()=>`cerdasPlay${sid()}logicStars`;
const isDone=n=>localStorage.getItem(doneKey(n))==='true';
const getStars=()=>{try{return JSON.parse(localStorage.getItem(starsKey())||'{}')}catch(e){return {}}};
const IMPL={1:true,2:true,3:true,4:true,5:true};
const LV={
 1:{name:'Tebak Pola',desc:'Lanjutkan pola angka, kelipatan, warna, bentuk, dan emoji untuk menemukan jawaban yang tepat.',prev:'🔮🔢🔴',goal:'Lengkapi 10 pola dengan jawaban yang tepat sebelum waktu habis.',
   rules:['Ada 10 soal pola: angka, kelipatan, warna, bentuk, dan emoji.','Pilih satu jawaban (A–D) untuk melengkapi tanda tanya.','Jawaban salah boleh dicoba lagi sampai benar.','Jawab semua soal dengan benar sebelum waktu habis untuk mendapatkan hingga 4 bintang.']},
 2:{name:'Memory Match',desc:'Cocokkan pasangan kartu gambar dengan mengingat letaknya. Gunakan ingatan dan kecepatanmu.',prev:'🧠🃏',goal:'Temukan semua 6 pasangan kartu emoji sebelum waktu habis.',
   rules:['Ada 12 kartu emoji tersusun 3 baris × 4 kolom, berisi 6 pasang gambar yang sama.','Klik dua kartu untuk membukanya. Jika gambarnya sama, kartu tetap terbuka.','Jika berbeda, kartu menutup lagi, jadi ingat letaknya.','Temukan semua pasangan sebelum waktu 3 menit habis untuk mendapat 4 bintang.','Gambar dan posisi kartu diacak setiap kali kamu bermain.']},
 3:{name:'Balok Logika',desc:'Susun kepingan balok menjadi bentuk yang diminta tanpa celah dan tanpa tumpang tindih.',prev:'🧩🟦',goal:'Susun semua kepingan bangun datar sampai siluet terisi penuh sebelum waktu habis.',
   rules:['Ada siluet sebuah benda (rumah, pohon, gedung, roket, atau kapal) dan 8 kepingan bangun datar di daftar.','Seret setiap kepingan ke siluet sampai pas, tanpa celah dan tanpa tumpang tindih.','Putar kepingan dengan tombol Putar 90° (atau tombol R / klik dua kali). Kepingan yang sudah terpasang boleh diseret lagi.','Kepingan yang tidak muat penuh di dalam siluet akan kembali ke daftar. Kamu juga bisa menyeretnya keluar papan untuk mengembalikannya.','Selesaikan sebelum waktu 3 menit habis. Siluet dan kepingan diacak setiap kali kamu bermain.']},
 4:{name:'Benar atau Salah',desc:'Baca pernyataan matematika dan logika, lalu tentukan apakah pernyataannya BENAR atau SALAH.',prev:'✅❌🤔',goal:'Tentukan BENAR atau SALAH untuk 10 pernyataan sebelum waktu habis.',
   rules:['Ada 10 pernyataan matematika dan logika. Urutannya diacak setiap kali bermain.','Baca pernyataan dengan teliti, lalu pilih ✓ BENAR atau ✕ SALAH.','Jika jawabanmu salah, coba lagi sampai benar. Pernyataan berikutnya muncul setelah kamu menjawab benar.','Selesaikan 10 pernyataan sebelum waktu habis. Selesai sebelum waktu habis mendapat 4 bintang.']},
 5:{name:'Detektif Logika',desc:'Boss level: pecahkan 10 kasus detektif dengan membaca setiap petunjuk secara teliti.',prev:'🕵️🔍🏆',goal:'Pecahkan 10 kasus detektif dengan membaca petunjuknya sebelum waktu habis.',
   rules:['Ada 10 kasus detektif. Urutan kasus dan pilihan jawabannya diacak setiap kali bermain.','Baca cerita dan petunjuknya, lalu pilih satu jawaban (A, B, atau C).','Jika jawabanmu salah, coba lagi sampai benar. Kasus berikutnya muncul setelah kamu menjawab benar.','Pecahkan 10 kasus sebelum waktu habis. Selesai sebelum waktu habis mendapat 4 bintang.']}
};

/* ---------- pembuat soal Level 1 (acak setiap main) ---------- */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[rnd(0,a.length-1)];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const COLORS=['🔴','🔵','🟢','🟡','🟣','🟠'],SHAPES=['▲','●','■','◆','★','♥'],FRUITS=['🍎','🍌','🍇','🍊','🍓','🍉'],ANIM=['🐶','🐱','🐰','🐸','🐵','🐼'];
function build(label,prompt,tiles,ans,opts){const o=opts.map(String);return{label,prompt,tiles:tiles.map(String),opts:o,ans:o.indexOf(String(ans))}}
function numOpts(ans){const s=new Set([ans]);shuf([ans+1,ans-1,ans+2,ans-2,ans+3,ans-3,ans+5,ans-5,ans+10]).forEach(c=>{if(s.size<4&&c>0&&c!==ans)s.add(c)});let k=1;while(s.size<4)s.add(ans+10+k++);return shuf([...s])}
const seqQ=(label,prompt,t,ans)=>build(label,prompt,t,ans,numOpts(ans));
const gen={
 numAdd(){const d=rnd(2,6),s=rnd(1,12);return seqQ('Pola angka','Angka berapa yang tepat?',[0,1,2,3].map(i=>s+i*d),s+4*d)},
 multiple(){const n=rnd(3,9);return seqQ('Kelipatan','Lanjutkan kelipatan '+n+'!',[1,2,3,4].map(i=>n*i),n*5)},
 mult2(){const r=pick([2,3]),s=rnd(1,3);return seqQ('Pola kali','Angka berapa yang tepat?',[0,1,2,3].map(i=>s*Math.pow(r,i)),s*Math.pow(r,4))},
 altStep(){const a=rnd(1,4),b=rnd(a+1,6),s=rnd(1,8);return seqQ('Pola angka','Angka berapa yang tepat?',[s,s+a,s+a+b,s+2*a+b],s+2*a+2*b)},
 growing(){const s=rnd(1,4);return seqQ('Pola angka','Angka berapa yang tepat?',[s,s+1,s+3,s+6],s+10)},
 squares(){const k=rnd(1,3);return seqQ('Bilangan kuadrat','Angka berapa yang tepat?',[0,1,2,3].map(i=>(k+i)*(k+i)),(k+4)*(k+4))},
 fib(){const a=rnd(1,3),b=rnd(1,3);return seqQ('Pola angka','Angka berapa yang tepat?',[a,b,a+b,a+2*b],2*a+3*b)}
};
function patt(pool,unitLen,label,form){
  const s=shuf(pool).slice(0,unitLen);let unit;
  if(form==='AAB')unit=[s[0],s[0],s[1]];else if(form==='ABC')unit=[s[0],s[1],s[2]];else unit=[s[0],s[1]];
  const n=unit.length===2?4:5,tiles=[];for(let i=0;i<n;i++)tiles.push(unit[i%unit.length]);
  const ans=unit[n%unit.length],others=shuf(pool.filter(x=>x!==ans)).slice(0,3);
  return build(label,'Apa yang tepat menggantikan tanda tanya?',tiles,ans,shuf([ans,...others]));
}
const P=(pool,len,label,form)=>()=>patt(pool,len,label,form);
/* ---------- bank soal Level 4 & 5 (diacak setiap main) ---------- */
const QZ_PASS=6;
const TF_BANK=[
 {s:'Hasil dari 7 × 8 adalah 54.',a:false,e:'7 × 8 = 56, bukan 54.'},
 {s:'Semua bilangan yang habis dibagi 4 pasti habis dibagi 2.',a:true,e:'4 = 2 × 2, jadi bilangan yang habis dibagi 4 pasti juga habis dibagi 2.'},
 {s:'Jika 5 × 6 = 30, maka 30 ÷ 5 = 5.',a:false,e:'30 ÷ 5 = 6, karena 5 × 6 = 30.'},
 {s:'Pola angka 2, 6, 12, 20, 30 dilanjutkan dengan angka 42.',a:true,e:'Selisihnya bertambah 2: +4, +6, +8, +10, lalu +12. Jadi 30 + 12 = 42.'},
 {s:'Dua persegi dengan ukuran berbeda selalu memiliki keliling yang sama.',a:false,e:'Persegi yang sisinya lebih panjang memiliki keliling yang lebih besar.'},
 {s:'Jika semua burung memiliki sayap dan ayam adalah burung, maka ayam memiliki sayap.',a:true,e:'Ayam termasuk burung, jadi ayam juga memiliki sayap.'},
 {s:'Pecahan 3/5 lebih besar daripada 2/3.',a:false,e:'3/5 = 9/15 dan 2/3 = 10/15, jadi 3/5 lebih kecil daripada 2/3.'},
 {s:'Sebuah bilangan jika dikalikan 3 lalu ditambah 4 menghasilkan 19. Bilangan tersebut adalah 5.',a:true,e:'5 × 3 = 15, lalu 15 + 4 = 19.'},
 {s:'Jika semua siswa kelas A bisa berenang dan Rina adalah siswa kelas A, maka Rina bisa berenang.',a:true,e:'Rina termasuk siswa kelas A, jadi Rina juga bisa berenang.'},
 {s:'Sebuah jam menunjukkan pukul 14.45. Empat puluh menit kemudian, jam menunjukkan pukul 15.15.',a:false,e:'14.45 + 40 menit = 15.25, bukan 15.15.'}
];
const DET_BANK=[
 {t:'Siapa Pemilik Kotak Pensil?',s:'Tiga siswa memiliki kotak pensil dengan warna berbeda, yaitu merah, biru, dan kuning. Kotak pensil milik Rina bukan kuning. Kotak pensil milik Budi berwarna biru. Sari memiliki kotak pensil berwarna kuning.',q:'Pernyataan mana yang benar?',o:['Rina memiliki kotak pensil kuning.','Budi memiliki kotak pensil biru.','Sari memiliki kotak pensil merah.'],a:1,e:'Petunjuk menyebutkan secara langsung bahwa kotak pensil Budi berwarna biru.'},
 {t:'Kode Rahasia',s:'Seorang detektif menemukan kode angka 2, 4, 8, 16, dan satu angka yang hilang. Setiap angka mengikuti pola yang sama.',q:'Angka berapa yang hilang?',o:['20','24','32'],a:2,e:'Setiap angka dikalikan 2 untuk mendapatkan angka berikutnya. 16 × 2 = 32.'},
 {t:'Mencari Kucing yang Hilang',s:'Milo bersembunyi di salah satu dari tiga tempat: bawah meja, belakang sofa, atau dalam lemari. Milo tidak berada di bawah meja. Milo juga tidak berada dalam lemari.',q:'Di mana Milo bersembunyi?',o:['Bawah meja','Belakang sofa','Dalam lemari'],a:1,e:'Milo tidak berada di dua tempat lainnya, jadi tempat yang tersisa adalah belakang sofa.'},
 {t:'Urutan Buku di Rak',s:'Tiga buku diletakkan berjajar di rak. Buku Matematika berada di sebelah kiri buku IPA. Buku Bahasa Indonesia berada di sebelah kanan buku IPA.',q:'Bagaimana urutan buku dari kiri ke kanan?',o:['Matematika, IPA, Bahasa Indonesia','IPA, Matematika, Bahasa Indonesia','Bahasa Indonesia, IPA, Matematika'],a:0,e:'Buku Matematika berada sebelum IPA, sedangkan Bahasa Indonesia berada setelah IPA.'},
 {t:'Siapa yang Mendapat Hadiah?',s:'Empat siswa mengikuti lomba. Hadiah diberikan kepada siswa dengan nilai tertinggi. Dita mendapat nilai lebih tinggi daripada Riko. Riko mendapat nilai lebih tinggi daripada Tono. Tono mendapat nilai lebih tinggi daripada Maya.',q:'Siapa yang mendapat hadiah?',o:['Riko','Dita','Tono'],a:1,e:'Urutan nilai dari yang tertinggi adalah Dita, Riko, Tono, lalu Maya.'},
 {t:'Menemukan Jalan Keluar',s:'Seorang detektif berada di sebuah ruangan dengan tiga pintu. Pintu pertama menuju ruangan gelap tanpa jalan keluar. Pintu kedua menuju halaman yang aman. Pintu ketiga menuju ruangan yang terkunci. Detektif ingin keluar dengan aman.',q:'Pintu mana yang harus dipilih?',o:['Pintu pertama','Pintu kedua','Pintu ketiga'],a:1,e:'Hanya pintu kedua yang menuju halaman yang aman.'},
 {t:'Siapa yang Datang Paling Awal?',s:'Pagi ini tiga siswa datang ke sekolah. Ani datang sebelum Beni. Cici datang setelah Beni.',q:'Siapa yang datang paling awal?',o:['Ani','Beni','Cici'],a:0,e:'Urutan kedatangannya adalah Ani, Beni, lalu Cici.'},
 {t:'Jejak Sepatu Berlumpur',s:'Di lantai dapur ditemukan jejak sepatu bot berlumpur. Hari itu Pak Udin memakai sepatu bot karena baru selesai berkebun. Bu Ani memakai sandal, dan Kak Rudi memakai sepatu sekolah.',q:'Siapa yang meninggalkan jejak di dapur?',o:['Bu Ani','Kak Rudi','Pak Udin'],a:2,e:'Jejaknya berasal dari sepatu bot, dan hanya Pak Udin yang memakai sepatu bot hari itu.'},
 {t:'Teka-Teki Umur',s:'Adi berumur 2 tahun lebih tua daripada Bima. Bima berumur 9 tahun.',q:'Berapa umur Adi?',o:['7 tahun','9 tahun','11 tahun'],a:2,e:'Umur Adi = 9 + 2 = 11 tahun.'},
 {t:'Membuka Brankas',s:'Sebuah brankas dibuka dengan kode tiga angka. Angka pertama adalah 4. Angka kedua adalah dua kali angka pertama. Angka ketiga adalah angka kedua dikurangi 5.',q:'Berapa kode brankas tersebut?',o:['483','438','485'],a:0,e:'Angka pertama 4, angka kedua 4 × 2 = 8, angka ketiga 8 − 5 = 3. Kodenya 483.'}
];
function makeQz(lv){
  if(lv===4)return shuf(TF_BANK).map(x=>({kind:'tf',s:x.s,ans:x.a?0:1,e:x.e}));
  return shuf(DET_BANK).map(x=>{const idx=shuf([0,1,2]);return {kind:'det',t:x.t,s:x.s,q:x.q,opts:idx.map(i=>x.o[i]),ans:idx.indexOf(x.a),e:x.e}});
}
const qzStars=w=>w===0?4:w<=2?3:w<=4?2:1;
const escQ=v=>String(v).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function makeSet(){
  const slots=[[gen.numAdd],[P(COLORS,2,'Pola warna','AB'),P(FRUITS,2,'Pola gambar','AB')],[P(SHAPES,2,'Pola bentuk','AB'),P(ANIM,2,'Pola gambar','AB')],[gen.multiple,gen.numAdd],
   [P(FRUITS,2,'Pola gambar','AAB'),P(COLORS,2,'Pola warna','AAB'),P(SHAPES,2,'Pola bentuk','AAB')],[gen.mult2,gen.multiple],[P(COLORS,3,'Pola warna','ABC'),P(SHAPES,3,'Pola bentuk','ABC')],
   [gen.altStep,gen.growing],[P(ANIM,3,'Pola gambar','ABC'),P(FRUITS,3,'Pola gambar','ABC')],[gen.squares,gen.fib,gen.growing]];
  return slots.map(s=>pick(s)());
}

/* ---------- DOM ---------- */
document.body.insertAdjacentHTML('beforeend',`
<section id="lgLevelsPage" class="app-view hidden">
  <header class="topbar"><a href="#" class="brand" id="lgLvHome"><span class="brand-icon">✦</span>UpPlay</a><button class="btn btn-outline" id="lgLvDash">← Dashboard</button></header>
  <main class="levels-page">
    <div class="page-head"><button class="back-btn" id="lgLvBack" aria-label="Kembali ke dashboard">←</button><div><h1>Game Logika Sederhana</h1><p>Pilih level. Selesaikan level sebelumnya untuk membuka level berikutnya.</p></div></div>
    <div class="level-grid" id="lgGrid"></div>
  </main>
</section>
<section id="lgPlayPage" class="app-view hidden">
  <header class="topbar"><a href="#" class="brand" id="lgPlayHome"><span class="brand-icon">✦</span>UpPlay</a><button class="btn btn-outline">← Pilih Level</button></header>
  <div class="cd-timebar" role="timer" aria-label="Sisa waktu"><div class="cd-track"><i></i></div><strong>⏱ 03:00</strong></div>
  <main class="game-page">
    <div class="page-head"><button class="back-btn" id="lgPlayBack" aria-label="Kembali ke level">←</button><div><h1 id="lgPlayTitle">Level 1: Tebak Pola</h1><p id="lgPlaySub">Lengkapi pola dengan jawaban yang tepat.</p></div></div>
    <div class="lg-layout">
      <section class="lg-card" id="lgPatCard">
        <div class="lg-qhead"><h2 id="lgPrompt">Angka berapa yang tepat?</h2><span class="lg-chip" id="lgLabel">Pola angka</span></div>
        <div class="lg-stage" id="lgStage"></div>
        <div class="lg-opts" id="lgOpts"></div>
        <div class="lg-fb" id="lgFb">Pilih salah satu jawaban.</div>
      </section>
      <section class="lg-card lg-blk" id="lgBlkCard">
        <div class="lg-qhead"><h2 id="lgBlkTitle">Susun kepingan menjadi siluet!</h2><span class="lg-chip" id="lgBlkChip">8 kepingan</span></div>
        <div class="lg-bwrap" id="lgBWrap"><div class="lg-board" id="lgBoard"></div></div>
        <div class="lg-fb" id="lgBlkFb">Seret kepingan ke siluet.</div>
      </section>
      <section class="lg-card lg-qz" id="lgQzCard">
        <div class="lg-qhead"><h2 id="lgQzPrompt">Benar atau salah?</h2><span class="lg-chip" id="lgQzChip">Pernyataan 1 / 10</span></div>
        <div class="lg-case" id="lgQzCase"></div>
        <div class="lg-qz-opts" id="lgQzOpts"></div>
        <div class="lg-fb" id="lgQzFb">Pilih salah satu jawaban.</div>
      </section>
      <section class="lg-card lg-mem" id="lgMemCard">
        <div class="lg-qhead"><h2>Temukan semua pasangan kartu!</h2><span class="lg-chip">12 kartu · 6 pasangan</span></div>
        <div class="lg-mboard" id="lgMemBoard"></div>
        <div class="lg-fb" id="lgMemFb">Buka dua kartu dan cari gambar yang sama.</div>
      </section>
      <aside class="game-panel">
        <h2 id="lgPanelH">🎯 Tantangan Logika</h2>
        <p id="lgPanelP">Jawab pola dengan benar untuk maju ke soal berikutnya.</p>
        <div class="score-row"><div class="mini-stat"><small id="lgSL1">Soal</small><strong id="lgNo">1 / 10</strong></div><div class="mini-stat"><small id="lgSL2">Soal Benar</small><strong id="lgOk">0</strong></div></div>
        <div class="lg-dots" id="lgDots"></div>
        <div class="lg-trayw" id="lgTrayW"><div class="lg-trayh"><b>Kepingan</b><small id="lgSelLbl">Pilih kepingan</small></div><div class="lg-tray" id="lgTray"></div>
          <div class="lg-blkbtns"><button type="button" class="btn btn-primary" id="lgRot">↻ Putar 90°</button><button type="button" class="btn btn-outline" id="lgRst">Kembalikan semua</button></div></div>
        <p class="lg-note" id="lgNote">Jawaban salah boleh dicoba lagi sampai benar.</p>
      </aside>
    </div>
  </main>
</section>
<div id="lgRulesModal" class="cp-ov" role="dialog" aria-modal="true"><div class="cp-bubble">
  <button type="button" id="lgRulesClose" class="cp-close" aria-label="Tutup">✕</button>
  <span id="lgRulesBadge" class="cp-badge">Level 1</span><h2 id="lgRulesTitle"></h2><p id="lgRulesGoal" class="cp-goal"></p>
  <div class="cp-time"><span>⏱️ Waktu pengerjaan</span><strong>3 menit</strong></div><ul id="lgRulesList" class="cp-list"></ul>
  <div class="cp-actions"><button type="button" id="lgRulesStart" class="btn btn-primary">Saya Mengerti, Mulai</button></div></div></div>
<div id="lgExitModal" class="cp-ov" role="dialog" aria-modal="true"><div class="cp-bubble cp-small">
  <div class="cp-emoji">🚪</div><h2>Keluar dari permainan?</h2><p class="cp-sub">Level ini belum selesai. Kamu akan kembali ke menu level.</p>
  <div class="cp-actions"><button type="button" id="lgExitNo" class="btn btn-primary">Tidak</button><button type="button" id="lgExitYes" class="btn btn-outline">Ya</button></div></div></div>
<div id="lgOutcome" class="level-outcome-overlay hidden" role="dialog" aria-modal="true"><div class="level-outcome-card">
  <div class="level-outcome-icon" id="lgOIcon">🎉</div><div class="level-outcome-kicker" id="lgOKicker">LEVEL BERHASIL</div><h2 id="lgOTitle"></h2><p id="lgOText"></p>
  <div class="lg-level" id="lgOLevel"></div><div class="lg-score" id="lgOScore" style="display:none"></div><div class="level-outcome-stars" id="lgOStars"></div>
  <div class="level-outcome-actions"><button id="lgOPrimary" class="btn btn-primary" type="button"></button><button id="lgOSecondary" class="btn btn-outline" type="button"></button></div></div></div>`);

/* ---------- navigasi ---------- */
const hideAll=()=>document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
const show=m=>m.classList.add('cp-show'),hide=m=>m.classList.remove('cp-show');
const home=()=>{try{return homePageForSession()}catch(e){return 'dashboard'}};
function showLevels(){hideAll();renderLevels();$('lgLevelsPage').classList.remove('hidden');window.scrollTo({top:0,behavior:'instant'})}
function renderLevels(){
  const st=getStars();
  $('lgGrid').innerHTML=[1,2,3,4,5].map(i=>{const d=LV[i],done=isDone(i),n=st[i]||0,open=!!IMPL[i]&&(i===1||isDone(i-1));
    return `<article class="level-card ${open?'active':'locked'}"><div class="level-number">${open?i:'🔒'}</div><h2>${d.name}</h2><p>${d.desc}</p><div class="game-preview">${d.prev}</div><div class="level-stars">Bintang: <span class="game-stars">${[1,2,3,4].map(k=>`<span class="${k<=n?'earned':''}">★</span>`).join('')}</span></div><div class="level-time">⏱ 3 menit</div><button class="btn ${open?'btn-primary':'btn-secondary'}" data-lg-play="${i}" ${open?'':'disabled'}>${open?'Mainkan Level '+i:(IMPL[i]?'Selesaikan Level '+(i-1):'Segera hadir')}</button></article>`}).join('');
}
function openRules(lv){
  const d=LV[lv],m=$('lgRulesModal');
  $('lgRulesBadge').textContent='Level '+lv;$('lgRulesTitle').textContent=d.name;$('lgRulesGoal').textContent=d.goal;
  $('lgRulesList').innerHTML=d.rules.map(x=>'<li>'+x+'</li>').join('');m.dataset.level=lv;show(m);
  setTimeout(()=>$('lgRulesStart').focus(),30);
}
function countdown(cb){
  const ov=$('countdownOverlay'),num=$('countdownNumber');if(window.__cpSkipCD||window.__cpRoomBusy){window.__cpSkipCD=false;cb();return}if(!ov||!num){cb();return}
  ov.style.display='';ov.style.pointerEvents='';ov.classList.add('active');let n=3;
  (function tick(){
    if(n<=0){ov.classList.remove('active');ov.style.display='none';requestAnimationFrame(()=>{ov.style.display='';cb()});return}
    num.textContent=n;num.style.animation='none';void num.offsetWidth;num.style.animation='countPulse .9s ease-in-out';n--;setTimeout(tick,850);
  })();
}

/* ---------- permainan ---------- */
let S=null,T=null,left=180;
function paintTime(){
  const p=$('lgPlayPage'),tb=p.querySelector('.cd-timebar'),fill=tb.querySelector('.cd-track i'),sec=Math.max(0,left);
  fill.style.width=(sec/180*100)+'%';fill.style.backgroundColor='hsl('+Math.round(120*Math.pow(sec/180,0.85))+',72%,'+(sec>20?45:48)+'%)';
  tb.querySelector('strong').textContent='⏱ '+String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  tb.classList.toggle('cd-danger',sec<=10&&sec>0);
}
function stopTimer(){if(T){clearInterval(T);T=null}}
function startTimer(){stopTimer();left=180;paintTime();T=setInterval(()=>{
  if($('lgPlayPage').classList.contains('hidden')){stopTimer();return}
  left--;paintTime();if(left<=0){stopTimer();finish(false)}},1000)}
const MEMO=['🐶','🐱','🐰','🐸','🐵','🐼','🦊','🐯','🦁','🐮','🐷','🐔','🦋','🐢','🐙','🐬','🍎','🍌','🍇','🍊','🍓','🍉','🍒','🍍','🚗','🚀','⚽','🎈','🎸','⭐','🌈','🌻'];
const memStars=m=>m<=9?4:m<=13?3:m<=18?2:1;
function setupMem(){
  const icons=shuf(MEMO).slice(0,6),cards=shuf([...icons,...icons]);
  S={lv:2,mem:true,cards,open:[],done:new Set(),moves:0,found:0,lock:false,qs:[],i:0,ok:0,wrong:0};
  $('lgMemBoard').innerHTML=cards.map((c,i)=>`<button type="button" class="lg-mcard" data-lg-mem="${i}" aria-label="Kartu ${i+1}"><span class="lg-min"><span class="lg-mf">?</span><span class="lg-mb">${c}</span></span></button>`).join('');
  const f=$('lgMemFb');f.className='lg-fb';f.textContent='Buka dua kartu dan cari gambar yang sama.';
  paintMem();
}
function paintMem(){
  $('lgNo').textContent=S.found+' / 6';$('lgOk').textContent=S.moves;
  $('lgDots').innerHTML=[0,1,2,3,4,5].map(i=>`<i class="${i<S.found?'d':''}"></i>`).join('');
}
function flipMem(i){
  if(!S||!S.mem||S.lock||S.done.has(i)||S.open.includes(i))return;
  const el=$('lgMemBoard').children[i];if(!el)return;
  el.classList.add('flip');S.open.push(i);
  if(S.open.length<2)return;
  S.moves++;S.lock=true;const [a,b]=S.open,A=$('lgMemBoard').children[a],B=$('lgMemBoard').children[b],f=$('lgMemFb');
  if(S.cards[a]===S.cards[b]){
    setTimeout(()=>{if(!S||!S.mem)return;A.classList.add('match');B.classList.add('match');S.done.add(a);S.done.add(b);S.found++;S.open=[];S.lock=false;
      f.className='lg-fb ok';f.textContent='✓ Cocok! '+S.cards[a]+' Tinggal '+(6-S.found)+' pasangan lagi.';paintMem();
      if(S.found>=6)setTimeout(()=>{if(S&&S.mem&&!$('lgPlayPage').classList.contains('hidden'))finish(true)},550)},350);
  }else{
    paintMem();f.className='lg-fb bad';f.textContent='↻ Belum cocok. Ingat letaknya!';
    setTimeout(()=>{if(!S||!S.mem)return;A.classList.remove('flip');B.classList.remove('flip');S.open=[];S.lock=false},750);
  }
}
function setup(lv){
  const mem=lv===2,blk=lv===3,qz=lv===4||lv===5;blkCancelDrag();B=null;
  $('lgPlayPage').dataset.mode=mem?'mem':blk?'blk':qz?'qz':'pat';
  $('lgPlayPage').dataset.lv=lv;
  $('lgPanelH').textContent=mem?'🃏 Memory Match':blk?'🧩 Balok Logika':qz?(lv===4?'✅ Benar atau Salah':'🕵️ Detektif Logika'):'🎯 Tantangan Logika';
  $('lgPanelP').textContent=mem?'Buka dua kartu dan temukan gambar yang sama.':blk?'Seret bangun datar sampai siluet terisi penuh.':qz?(lv===4?'Tentukan apakah setiap pernyataan BENAR atau SALAH.':'Baca petunjuk setiap kasus, lalu pilih jawaban yang tepat.'):'Jawab pola dengan benar untuk maju ke soal berikutnya.';
  $('lgSL1').textContent=mem?'Pasangan':blk?'Terpasang':qz?(lv===4?'Pernyataan':'Kasus'):'Soal';$('lgSL2').textContent=mem?'Percobaan':blk?'Salah letak':qz?'Jawaban Benar':'Soal Benar';
  $('lgNote').textContent=(mem?'Posisi kartu diacak tiap main. ':blk?'Siluet diacak tiap main. ':'Jawaban salah boleh dicoba lagi sampai benar. ')+'Selesai sebelum waktu habis = 4 bintang. Jika waktu habis, bintang dihitung dari kemajuanmu.';
  if(mem)setupMem();else if(blk)S={lv:3,blk:true,qs:[],i:0,ok:0,wrong:0,lock:false};else if(qz)S={lv,qz:true,qs:makeQz(lv),i:0,ok:0,wrong:0,lock:false,res:[]};else S={lv,qs:makeSet(),i:0,ok:0,wrong:0,lock:false};
  hideAll();$('lgPlayPage').classList.remove('hidden');window.scrollTo({top:0,behavior:'instant'});
  $('lgPlayTitle').textContent='Level '+lv+': '+LV[lv].name;if($('lgPlaySub'))$('lgPlaySub').textContent=LV[lv].desc;
  const tb=$('lgPlayPage').querySelector('.cd-timebar');tb.classList.add('cd-reset');left=180;paintTime();requestAnimationFrame(()=>tb.classList.remove('cd-reset'));
  if(qz)renderQz();else if(!mem&&!blk)renderQ();
  if(blk)setupBlk();
}
function renderQ(){
  const q=S.qs[S.i];S.lock=false;
  $('lgPrompt').textContent=q.prompt;$('lgLabel').textContent=q.label;
  $('lgStage').innerHTML=q.tiles.map(t=>`<div class="lg-tile">${t}</div>`).join('<span class="lg-arrow" style="display:none"></span>')+'<span class="lg-arrow">→</span><div class="lg-tile q">?</div>';
  $('lgOpts').innerHTML=q.opts.map((o,i)=>`<button class="lg-opt" data-lg-opt="${i}"><b>${'ABCD'[i]}</b>${o}</button>`).join('');
  const f=$('lgFb');f.className='lg-fb';f.textContent='Pilih salah satu jawaban.';
  $('lgNo').textContent=(S.i+1)+' / 10';$('lgOk').textContent=S.ok;
  $('lgDots').innerHTML=S.qs.map((_,i)=>`<i class="${i<S.i?'d':i===S.i?'c':''}"></i>`).join('');
}
function choose(i){
  if(!S||S.lock)return;const q=S.qs[S.i],b=$('lgOpts').children[i],f=$('lgFb');if(!b||b.disabled)return;
  if(i===q.ans){
    S.lock=true;S.ok++;b.classList.add('ok');[...$('lgOpts').children].forEach(x=>x.disabled=true);
    f.className='lg-fb ok';f.textContent='✓ Benar! 🎉';$('lgOk').textContent=S.ok;
    setTimeout(()=>{if(!S||$('lgPlayPage').classList.contains('hidden'))return;S.i++;if(S.i>=10)finish(true);else renderQ()},650);
  }else{
    S.wrong++;b.classList.add('bad');b.disabled=true;f.className='lg-fb bad';f.textContent='↻ Belum tepat! Coba lagi.';
  }
}
function renderQz(){
  const q=S.qs[S.i],tf=q.kind==='tf',n=S.qs.length;S.lock=false;
  $('lgQzPrompt').textContent=tf?'Benar atau salah?':'🕵️ '+q.t;
  $('lgQzChip').textContent=(tf?'Pernyataan ':'Kasus ')+(S.i+1)+' / '+n;
  $('lgQzCase').innerHTML='<p class="lg-case-text">'+escQ(q.s)+'</p>'+(tf?'':'<p class="lg-case-q">❓ '+escQ(q.q)+'</p>');
  const o=$('lgQzOpts');o.className='lg-qz-opts'+(tf?' tf':'');
  o.innerHTML=tf?'<button class="lg-opt tfb t" data-lg-qz="0"><b>✓</b>BENAR</button><button class="lg-opt tfb f" data-lg-qz="1"><b>✕</b>SALAH</button>'
    :q.opts.map((x,i)=>'<button class="lg-opt txt" data-lg-qz="'+i+'"><b>'+'ABC'[i]+'</b>'+escQ(x)+'</button>').join('');
  const f=$('lgQzFb');f.className='lg-fb';f.textContent=tf?'Pilih BENAR atau SALAH.':'Pilih jawaban A, B, atau C.';
  $('lgNo').textContent=(S.i+1)+' / '+n;$('lgOk').textContent=S.ok;
  $('lgDots').innerHTML=S.qs.map((_,k)=>'<i class="'+(k<S.i?'d':k===S.i?'c':'')+'"></i>').join('');
}
function answerQz(i){
  if(!S||!S.qz||S.lock||S.over||window.__cpPaused)return;
  const q=S.qs[S.i],btns=[...$('lgQzOpts').children],b=btns[i];if(!b||b.disabled)return;
  const f=$('lgQzFb'),cur=S;
  if(i!==q.ans){S.wrong++;b.classList.add('bad');b.disabled=true;f.className='lg-fb bad';f.textContent='↻ Belum tepat! Coba lagi.';return}
  S.lock=true;S.ok++;btns.forEach(x=>x.disabled=true);b.classList.add('ok');
  f.className='lg-fb ok';f.textContent='✓ Benar! '+q.e;$('lgOk').textContent=S.ok;
  const dots=$('lgDots').children;if(dots[S.i])dots[S.i].className='d';
  setTimeout(()=>{if(S!==cur||S.over||$('lgPlayPage').classList.contains('hidden'))return;S.i++;if(S.i>=S.qs.length)finish(true);else renderQz()},1100);
}
document.addEventListener('keydown',e=>{
  if(!S||!S.qz||S.lock||S.over||e.ctrlKey||e.metaKey||e.altKey||$('lgPlayPage').classList.contains('hidden'))return;
  if(document.querySelector('.cp-ov.cp-show')||!$('lgOutcome').classList.contains('hidden'))return;
  const k=e.key.toLowerCase(),m=S.lv===4?{b:0,s:1,'1':0,'2':1}:{a:0,b:1,c:2,'1':0,'2':1,'3':2};
  if(k in m){e.preventDefault();answerQz(m[k])}
});
function starsFor(w){return w<=1?4:w<=3?3:w<=5?2:1}
function outcome(cfg){
  const m=$('lgOutcome');
  $('lgOIcon').textContent=cfg.icon;$('lgOKicker').textContent=cfg.kicker;$('lgOTitle').textContent=cfg.title;$('lgOText').textContent=cfg.text;
  $('lgOLevel').textContent=cfg.level||'';$('lgOLevel').style.display=cfg.level?'':'none';
  const sc=$('lgOScore');sc.style.display=cfg.score?'':'none';sc.textContent=cfg.score||'';
  const st=$('lgOStars');const hasSt=cfg.stars!=null;st.style.display=hasSt?'':'none';st.textContent=hasSt?'★'.repeat(cfg.stars)+'☆'.repeat(4-cfg.stars):'';
  $('lgOPrimary').textContent=cfg.primary;$('lgOSecondary').textContent=cfg.secondary;
  $('lgOPrimary').onclick=()=>{m.classList.add('hidden');cfg.onPrimary()};
  $('lgOSecondary').onclick=()=>{m.classList.add('hidden');showLevels()};
  m.classList.remove('hidden');
}
function finish(ok){
  if(!S||S.over)return;S.over=true;stopTimer();S.lock=true;blkCancelDrag();if(B)blkRender();const lv=S.lv,d=LV[lv];
  const qzUnit=S.qz?(lv===4?'pernyataan':'kasus'):'';
  if(ok){
    const n=4,all=getStars();all[lv]=4;
    localStorage.setItem(starsKey(),JSON.stringify(all));localStorage.setItem(doneKey(lv),'true');localStorage.setItem('cerdasPlayLogicLevel'+lv,'true');
    try{window.saveStudentScore&&window.saveStudentScore('Logika Level '+lv,n*25)}catch(e){}
    try{window.updateDashboardProgress&&window.updateDashboardProgress()}catch(e){}
    const next=IMPL[lv+1]&&lv<5;
    const okTxt='';
    outcome({icon:lv===5?'🏆':'🎉',kicker:'LEVEL BERHASIL',title:'Level '+lv+' Selesai!',text:'Hebat! Kamu berhasil menyelesaikan Level '+lv+okTxt+' dan mendapatkan '+n+' bintang. '+(lv===5?'Kamu sudah menamatkan semua level Logika! ':'')+'Pilih '+(next?'Lanjut Level '+(lv+1):'Main Lagi')+' atau kembali ke menu level.',stars:n,
      primary:next?'Lanjut Level '+(lv+1):'🔄 Main Lagi',secondary:'Kembali ke Menu Level',onPrimary:()=>next?openRules(lv+1):begin(lv)});
  }else{
    try{window.__cpRecordFail&&window.__cpRecordFail('logic',lv)}catch(e){}
    const prog=S.mem?S.found/6:S.blk?(B&&B.pcs.length?B.pcs.filter(q=>q.state==='board').length/B.pcs.length:0):(S.qs.length?S.i/S.qs.length:0);
    const ps=Math.max(0,Math.min(3,Math.floor(prog*4+1e-9))),allS=getStars();
    if(!isDone(lv)){allS[lv]=Math.max(Number(allS[lv])||0,ps);localStorage.setItem(starsKey(),JSON.stringify(allS))}
    outcome({icon:'⏰',kicker:'WAKTU HABIS',stars:ps,title:'Waktu Habis!',text:S.qz?'Waktu pengerjaan habis sebelum semua '+qzUnit+' selesai dijawab.':S.mem?'Waktu pengerjaan habis sebelum semua pasangan kartu ditemukan.':S.blk?'Waktu pengerjaan habis sebelum siluet terisi penuh.':'Waktu pengerjaan habis sebelum semua soal selesai dijawab.',level:'Level '+lv+': '+d.name,score:S.qz?'📝 '+S.ok+' dari '+S.qs.length+' '+qzUnit+' terjawab benar':S.mem?'🃏 '+S.found+' dari 6 pasangan ditemukan':S.blk?'🧩 '+B.pcs.filter(q=>q.state==='board').length+' dari '+B.pcs.length+' kepingan terpasang':'📝 '+S.ok+' soal terjawab benar',
      primary:'🔄 Main Lagi',secondary:'🏠 Kembali ke Menu',onPrimary:()=>begin(lv)});
  }
}
function begin(lv){stopTimer();hideAll();$('lgLevelsPage').classList.remove('hidden');countdown(()=>{setup(lv);startTimer()})}

/* ---------- Level 3: Balok Logika (siluet + seret bangun datar) ---------- */
const BLK_COLORS=['#6d4aff','#b45f2e','#f4b183','#ffb703','#06b6d4','#ef476f','#22c55e','#8338ec','#fb8500','#3a86ff'];
const SA=[0.16,0.49,0.84],SB=[0.11,0.53,0.88];           /* titik uji tidak pernah jatuh tepat di sisi diagonal */
const R4=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const DESIGNS=[
 {name:'Rumah',polys:[[[1,4],[9,4],[5,0]],R4(7,0,1,2),[[7,2],[8,2],[8,3]],R4(1,4,3,2),R4(1,6,3,3),R4(4,4,2,2),R4(4,6,2,3),R4(6,4,3,5)]},
 {name:'Pohon',polys:[[[5,0],[7,2],[3,2]],[[2,2],[8,2],[10,4],[0,4]],R4(2,4,6,2),[[0,6],[2,6],[2,4]],[[8,4],[8,6],[10,6]],R4(4,6,2,3),R4(0,9,4,1),R4(4,9,6,1)]},
 {name:'Gedung',polys:[R4(5,0,1,2),[[2,2],[8,2],[9,3],[1,3]],R4(1,3,2,6),R4(7,3,2,6),R4(3,3,4,4),R4(4,7,2,2),R4(3,7,1,2),R4(6,7,1,2)]},
 {name:'Roket',polys:[[[4,0],[6,3],[2,3]],R4(2,3,4,2),R4(2,5,4,1),R4(2,6,4,1),[[0,7],[2,7],[2,5]],[[6,5],[6,7],[8,7]],R4(3,7,2,1),[[3,8],[5,8],[4,10]]]},
 {name:'Kapal',polys:[R4(2,6,7,2),[[0,6],[2,6],[2,8]],[[9,6],[11,6],[9,8]],R4(5,0,1,3),R4(5,3,1,3),[[1,5],[5,5],[5,1]],[[6,5],[9,5],[6,2]],R4(6,0,2,1)]}
];
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const xi=P[i][0],yi=P[i][1],xj=P[j][0],yj=P[j][1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c}
function samplesOf(P,w,h){const o=[];for(let cx=0;cx<w;cx++)for(let cy=0;cy<h;cy++)for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(inPoly(cx+SA[a],cy+SB[b],P))o.push([cx*3+a,cy*3+b]);return o}
const rotPts=(P,h)=>P.map(q=>[h-q[1],q[0]]);
function geoOf(p){
  p._g=p._g||{};if(p._g[p.rot])return p._g[p.rot];
  let P=p.base.pts,w=p.base.w,h=p.base.h;
  for(let k=0;k<p.rot;k++){P=rotPts(P,h);const t=w;w=h;h=t}
  return (p._g[p.rot]={pts:P,w,h,s:samplesOf(P,w,h)});
}
let B=null,DR=null,lastDesign=-1;
const bkey=(gx,gy,s)=>(gx*3+s[0])+','+(gy*3+s[1]);
function svgPiece(g,fill,scale,extra){
  return `<svg class="lg-pc" width="${g.w*scale}" height="${g.h*scale}" viewBox="0 0 ${g.w} ${g.h}" aria-hidden="true"><polygon points="${g.pts.map(q=>q.join(',')).join(' ')}" fill="${fill}" stroke="${extra||'rgba(40,24,110,.45)'}" stroke-width="0.07" stroke-linejoin="round"/></svg>`;
}
function newDesign(){
  let k;do{k=rnd(0,DESIGNS.length-1)}while(k===lastDesign&&DESIGNS.length>1);lastDesign=k;
  const d=DESIGNS[k],flip=Math.random()<.5;
  let polys=d.polys.map(P=>P.map(q=>q.slice()));
  const mx=Math.max(...polys.flat().map(q=>q[0])),mn=Math.min(...polys.flat().map(q=>q[0])),my=Math.min(...polys.flat().map(q=>q[1])),My=Math.max(...polys.flat().map(q=>q[1]));
  polys=polys.map(P=>P.map(q=>[(flip?mx-q[0]:q[0]-mn),q[1]-my]));
  return {name:d.name,polys,cols:mx-mn,rows:My-my};
}
function setupBlk(){
  const d=newDesign(),colors=shuf(BLK_COLORS);
  const pcs=d.polys.map((P,i)=>{
    const x0=Math.min(...P.map(q=>q[0])),y0=Math.min(...P.map(q=>q[1])),x1=Math.max(...P.map(q=>q[0])),y1=Math.max(...P.map(q=>q[1]));
    return {id:i,color:colors[i%colors.length],base:{pts:P.map(q=>[q[0]-x0,q[1]-y0]),w:x1-x0,h:y1-y0},sx:x0,sy:y0,rot:0,state:'tray',gx:0,gy:0};
  });
  const sil=new Set();
  pcs.forEach(p=>{const g=geoOf(p);g.s.forEach(s=>sil.add(bkey(p.sx,p.sy,s)))});
  const order=shuf(pcs.map(p=>p.id));
  order.forEach((id,n)=>{const p=pcs[id];p.letter='ABCDEFGHIJ'[n];if(Math.random()<.75)p.rot=rnd(1,3)});
  B={name:d.name,cols:d.cols,rows:d.rows,pcs,order,sil,sel:null,u:30,ts:16,fails:0};
  S={lv:3,blk:true,qs:[],i:0,ok:0,wrong:0,lock:false};
  $('lgBlkTitle').textContent='Susun kepingan menjadi siluet '+d.name+'!';
  $('lgBlkChip').textContent=pcs.length+' kepingan';
  blkMsg('Seret kepingan ke siluet. Putar dengan tombol Putar 90° atau tombol R.','');
  blkLayout();
}
function blkMsg(t,c){const f=$('lgBlkFb');if(f){f.className='lg-fb'+(c?' '+c:'');f.textContent=t}}
function blkLayout(){
  if(!B)return;
  const w=$('lgBWrap'),cw=w.clientWidth-20,ch=w.clientHeight-20;
  B.u=Math.max(16,Math.min(64,Math.floor(Math.min(cw/B.cols,ch/B.rows))));
  B.ts=Math.max(13,Math.floor(B.u*.5));
  const bd=$('lgBoard');bd.style.width=B.cols*B.u+'px';bd.style.height=B.rows*B.u+'px';
  blkRender();
}
function buildOcc(ex){
  const o=new Set();
  B.pcs.forEach(p=>{if(p.state==='board'&&p.id!==ex){const g=geoOf(p);g.s.forEach(s=>o.add(bkey(p.gx,p.gy,s)))}});
  return o;
}
function blkFits(g,gx,gy,occ){for(const s of g.s){const k=bkey(gx,gy,s);if(!B.sil.has(k)||occ.has(k))return false}return true}
function blkRender(){
  if(!B)return;
  const u=B.u,bd=$('lgBoard');
  let grid='';for(let i=1;i<B.cols;i++)grid+=`<line x1="${i}" y1="0" x2="${i}" y2="${B.rows}"/>`;for(let j=1;j<B.rows;j++)grid+=`<line x1="0" y1="${j}" x2="${B.cols}" y2="${j}"/>`;
  const sil=B.pcs.map(p=>{const g=geoOf0(p);return `<polygon points="${g.map(q=>(q[0]+p.sx)+','+(q[1]+p.sy)).join(' ')}"/>`}).join('');
  let h=`<svg class="lg-sil" width="${B.cols*u}" height="${B.rows*u}" viewBox="0 0 ${B.cols} ${B.rows}" aria-hidden="true"><g fill="#cfd2e6" stroke="#cfd2e6" stroke-width="0.05" stroke-linejoin="round">${sil}</g><g stroke="rgba(255,255,255,.75)" stroke-width="0.04">${grid}</g></svg>`;
  B.pcs.forEach(p=>{if(p.state!=='board')return;const g=geoOf(p);
    h+=`<div class="lg-bp${B.sel===p.id?' sel':''}" data-pid="${p.id}" style="left:${p.gx*u}px;top:${p.gy*u}px">${svgPiece(g,p.color,u)}</div>`});
  bd.innerHTML=h;
  const tray=B.order.map(id=>B.pcs[id]).filter(p=>p.state==='tray'||(p.state==='drag'&&DR&&DR.from==='tray'));
  $('lgTray').innerHTML=tray.length?tray.map(p=>{const g=geoOf(p);return p.state==='drag'?`<div class="lg-ti lg-tslot" aria-hidden="true">${svgPiece(g,p.color,B.ts)}<small>${p.letter}</small></div>`:`<div class="lg-ti${B.sel===p.id?' sel':''}" data-pid="${p.id}">${svgPiece(g,p.color,B.ts)}<small>${p.letter}</small></div>`}).join(''):'<div class="lg-tdone">Semua kepingan sudah terpasang ✓</div>';
  const placed=B.pcs.filter(p=>p.state==='board').length;
  $('lgNo').textContent=placed+' / '+B.pcs.length;$('lgOk').textContent=B.fails;
  $('lgDots').innerHTML=B.pcs.map((_,i)=>`<i class="${i<placed?'d':''}"></i>`).join('');
  const sp=B.sel!==null?B.pcs[B.sel]:null;$('lgSelLbl').textContent=sp?'Kepingan dipilih: '+sp.letter:'Pilih kepingan lalu putar bila perlu';
}
const geoOf0=p=>p.base.pts;
function blkSelect(id){B.sel=id;blkRender()}
function blkCancelDrag(){if(DR){if(DR.el)DR.el.remove();if(DR.ghost)DR.ghost.remove();document.body.classList.remove('lg-dragging');DR=null}}
function blkCand(p,cx,cy){
  const r=$('lgBoard').getBoundingClientRect(),g=geoOf(p),u=B.u;
  if(cx<r.left-u||cx>r.right+u||cy<r.top-u||cy>r.bottom+u)return {over:false};
  const fx=(cx-r.left)/u-g.w/2,fy=(cy-r.top)/u-g.h/2,occ=buildOcc(p.id),list=[];
  for(let dx=-1;dx<=2;dx++)for(let dy=-1;dy<=2;dy++){const gx=Math.floor(fx)+dx,gy=Math.floor(fy)+dy,d=Math.hypot(gx-fx,gy-fy);if(d<=1.35)list.push([d,gx,gy])}
  list.sort((a,b)=>a[0]-b[0]);
  for(const q of list)if(blkFits(g,q[1],q[2],occ))return {over:true,ok:true,gx:q[1],gy:q[2]};
  return {over:true,ok:false,gx:Math.round(fx),gy:Math.round(fy)};
}
function dragVisual(){
  if(!DR)return;const p=DR.p,g=geoOf(p),u=B.u;
  DR.el.innerHTML=svgPiece(g,p.color,u);
  DR.el.style.left=(DR.x-g.w*u/2)+'px';DR.el.style.top=(DR.y-g.h*u/2)+'px';
  const c=blkCand(p,DR.x,DR.y);DR.c=c;
  const bd=$('lgBoard');
  if(c.over){
    if(!DR.ghost){DR.ghost=document.createElement('div');DR.ghost.className='lg-ghost';bd.appendChild(DR.ghost)}
    DR.ghost.innerHTML=svgPiece(g,c.ok?'rgba(34,197,94,.5)':'rgba(239,68,68,.45)',u,c.ok?'#16a34a':'#dc2626');
    DR.ghost.style.left=c.gx*u+'px';DR.ghost.style.top=c.gy*u+'px';
  }else if(DR.ghost){DR.ghost.remove();DR.ghost=null}
}
function blkDown(e){
  if(!B||!S||!S.blk||S.lock||window.__cpPaused||(e.button!==undefined&&e.button!==0))return;
  const t=e.target.closest&&e.target.closest('[data-pid]');if(!t||!$('lgPlayPage').contains(t))return;
  const p=B.pcs[+t.dataset.pid];if(!p)return;
  e.preventDefault();
  B.sel=p.id;
  DR={p,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,moved:false,from:p.state,old:{gx:p.gx,gy:p.gy,rot:p.rot},el:null,ghost:null,c:null};
  blkRender();
}
function blkMove(e){
  if(!DR)return;
  DR.x=e.clientX;DR.y=e.clientY;
  if(!DR.moved){if(Math.hypot(DR.x-DR.sx,DR.y-DR.sy)<5)return;
    DR.moved=true;const p=DR.p;
    p.state='drag';
    DR.el=document.createElement('div');DR.el.className='lg-float';document.body.appendChild(DR.el);document.body.classList.add('lg-dragging');
    blkRender();
  }
  e.preventDefault();dragVisual();
}
function blkUp(e){
  if(!DR)return;
  const d=DR;
  if(!d.moved){DR=null;return}
  d.x=e.clientX;d.y=e.clientY;const p=d.p,c=blkCand(p,d.x,d.y);
  if(d.el)d.el.remove();if(d.ghost)d.ghost.remove();document.body.classList.remove('lg-dragging');DR=null;
  if(c.over&&c.ok){p.state='board';p.gx=c.gx;p.gy=c.gy;blkMsg('✓ Terpasang! '+(B.pcs.filter(q=>q.state==='board').length)+' dari '+B.pcs.length+' kepingan.','ok')}
  else if(d.from==='board'&&c.over){p.state='board';p.gx=d.old.gx;p.gy=d.old.gy;p.rot=d.old.rot;B.fails++;blkMsg('Tidak muat di sana, kepingan kembali ke posisi semula.','bad')}
  else{p.state='tray';if(c.over){B.fails++;blkMsg('Kepingan harus masuk penuh ke siluet dan tidak boleh bertumpuk.','bad')}else blkMsg('Kepingan dikembalikan ke daftar.','')}
  blkRender();blkCheckWin();
}
function blkCheckWin(){
  if(!B||!S||!S.blk||S.lock)return;
  if(B.pcs.every(p=>p.state==='board')){S.lock=true;setTimeout(()=>{if(S&&S.blk&&!$('lgPlayPage').classList.contains('hidden'))finish(true)},600)}
}
function blkRotate(){
  if(!B||!S||!S.blk||S.lock||window.__cpPaused)return;
  if(DR&&DR.moved){DR.p.rot=(DR.p.rot+1)%4;dragVisual();return}
  const p=B.sel!==null?B.pcs[B.sel]:null;if(!p){blkMsg('Pilih kepingan dulu, lalu tekan Putar 90°.','');return}
  if(p.state==='tray'){p.rot=(p.rot+1)%4;blkRender();return}
  const g0=geoOf(p),cx=p.gx+g0.w/2,cy=p.gy+g0.h/2,occ=buildOcc(p.id);
  p.rot=(p.rot+1)%4;const g=geoOf(p);
  const fx=cx-g.w/2,fy=cy-g.h/2,list=[];
  for(let dx=-2;dx<=3;dx++)for(let dy=-2;dy<=3;dy++){const gx=Math.floor(fx)+dx,gy=Math.floor(fy)+dy;list.push([Math.hypot(gx-fx,gy-fy),gx,gy])}
  list.sort((a,b)=>a[0]-b[0]);
  for(const q of list)if(q[0]<=2.2&&blkFits(g,q[1],q[2],occ)){p.gx=q[1];p.gy=q[2];blkRender();return}
  p.state='tray';B.fails++;blkMsg('Setelah diputar tidak muat, kepingan dikembalikan ke daftar.','bad');blkRender();
}
function blkReset(){
  if(!B||!S||!S.blk||S.lock||window.__cpPaused)return;
  B.pcs.forEach(p=>{p.state='tray'});blkMsg('Semua kepingan dikembalikan ke daftar.','');blkRender();
}
function blkStars(){return left>=25?4:left>=15?3:left>=6?2:1}
document.addEventListener('pointerdown',blkDown,true);
document.addEventListener('pointermove',blkMove,{passive:false});
document.addEventListener('pointerup',blkUp,true);
document.addEventListener('pointercancel',()=>{if(DR&&DR.moved&&DR.p.state==='drag'){DR.p.state=DR.from==='board'?'board':'tray'}blkCancelDrag();blkRender()},true);
document.addEventListener('keydown',e=>{if((e.key==='r'||e.key==='R')&&S&&S.blk&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();blkRotate()}});
document.addEventListener('dblclick',e=>{const t=e.target.closest&&e.target.closest('[data-pid]');if(t&&B&&S&&S.blk&&$('lgPlayPage').contains(t)){B.sel=+t.dataset.pid;blkRotate()}});
window.addEventListener('resize',()=>{if(B&&S&&S.blk&&!$('lgPlayPage').classList.contains('hidden'))blkLayout()});

/* ---------- keluar ---------- */
function openExit(){const m=$('lgExitModal');if(m.classList.contains('cp-show'))return;window.__cpPaused=true;show(m);setTimeout(()=>$('lgExitNo').focus(),30)}
function closeExit(){window.__cpPaused=false;hide($('lgExitModal'))}
$('lgExitNo').onclick=closeExit;
$('lgExitYes').onclick=()=>{if(S&&!S.over){try{window.__cpRecordFail&&window.__cpRecordFail('logic',S.lv)}catch(e){}}closeExit();stopTimer();blkCancelDrag();S=null;B=null;$('lgOutcome').classList.add('hidden');showLevels()};
$('lgRulesClose').onclick=()=>hide($('lgRulesModal'));
$('lgRulesStart').onclick=()=>{const lv=+$('lgRulesModal').dataset.level;hide($('lgRulesModal'));begin(lv)};
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('lgExitModal').classList.contains('cp-show'))closeExit();else if($('lgRulesModal').classList.contains('cp-show'))hide($('lgRulesModal'))});

document.addEventListener('click',e=>{
  const t=e.target;if(!t||!t.closest)return;
  if(t.closest('#openLogicBtn')){e.preventDefault();e.stopImmediatePropagation();window.showPage('logic');return}
  const pl=t.closest('[data-lg-play]');if(pl){if(!pl.disabled)openRules(+pl.dataset.lgPlay);return}
  const op=t.closest('[data-lg-opt]');if(op){choose(+op.dataset.lgOpt);return}
  const qb=t.closest('[data-lg-qz]');if(qb){answerQz(+qb.dataset.lgQz);return}
  const mc=t.closest('[data-lg-mem]');if(mc){flipMem(+mc.dataset.lgMem);return}
  if(t.closest('#lgRot')){blkRotate();return}
  if(t.closest('#lgRst')){blkReset();return}
  if(t.closest('#lgLvDash,#lgLvBack,#lgLvHome')){e.preventDefault();window.showPage(home());return}
  if(t.closest('#lgPlayBack,#lgPlayHome')){e.preventDefault();openExit();return}
},true);

window.__lgLogika={begin,stop:stopTimer}; /* stop dipakai Join Room agar timer ronde lama tidak memunculkan popup */
/* rute showPage('logic') -> menu level Logika baru */
const sp=window.showPage;
window.showPage=function(n){
  const r=sp.apply(this,arguments);
  if(n==='logic'){const s=window.currentSession;if(s&&(s.role==='student'||s.role==='teacher')){const old=$('logicGamePage');if(old)old.classList.add('hidden');showLevels()}}
  return r;
};
})();
