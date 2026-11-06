(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sid = () => window.currentSession?.id || 'demo';
  const doneKey = lv => `cerdasPlay:${sid()}:mathLevel${lv}Completed`;
  const starsKey = () => `cerdasPlay${sid()}mathStars`;
  const pageIds = ['levels','snakeGame','memory','crossword','mathMaze','safeCracker'];
  let activeLevel = 0, timer = null, timeLeft = 180, gameFinished = false;

  function readStars(){try{return JSON.parse(localStorage.getItem(starsKey())||'{}')}catch(e){return {}}}
  function writeStars(lv,n){const d=readStars();d[lv]=Math.max(Number(d[lv]||0),n);localStorage.setItem(starsKey(),JSON.stringify(d))}
  function complete(lv,stars){localStorage.setItem(doneKey(lv),'true');writeStars(lv,stars);try{window.markMathLevelDone?.(lv)}catch(e){}try{window.saveStars?.(lv,stars)}catch(e){}try{window.saveStudentScore?.(`Level ${lv}`,stars*25)}catch(e){}refreshLevelCards()}

  /* Centralized, fail-safe screen router. Every playable level has an explicit
     DOM id so a typo can never leave the player on a blank screen. */
  const PAGE_IDS={
    levels:'mathLevelsPage',
    memory:'memoryPage',
    crossword:'crosswordGamePage',
    mathMaze:'mathMazePage',
    safeCracker:'safeCrackerPage',
    snake:'snakeGamePage'
  };
  function hardShow(page){
    document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
    const targetId=PAGE_IDS[page] || (page.endsWith('Page')?page:page+'Page');
    const target=$(targetId);
    if(!target){
      console.error('[CerdasPlay] Halaman game tidak ditemukan:',page,targetId);
      const levels=$(PAGE_IDS.levels);
      if(levels) levels.classList.remove('hidden');
      return false;
    }
    target.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'instant'});
    return true;
  }

  function ensureTimer(){
    let t=$('cp5Timer');
    if(!t){
      t=document.createElement('div');t.id='cp5Timer';t.className='cp5-timer';
      t.innerHTML='⏱️ <span>Waktu</span><strong id="cp5TimerText">03:00</strong>';
      document.body.appendChild(t);
    }
    return t;
  }
  function addInlineTimer(page,id){
    const host=$(page+'Page'); if(!host)return;
    const target=host.querySelector('.memory-info,.crossword-panel,.maze-panel,.safe-card'); if(!target)return;
    let box=host.querySelector('[data-cp5-inline]');
    if(!box){box=document.createElement('div');box.className='cp5-inline-timer';box.dataset.cp5Inline='1';box.innerHTML='<span>⏱️ Batas waktu</span><strong>03:00</strong>';target.prepend(box)}
    box.dataset.timerId=id;
  }
  addInlineTimer('memory','memory');addInlineTimer('crossword','crossword');addInlineTimer('mathMaze','maze');addInlineTimer('safeCracker','safe');

  function timerText(){const t=Math.max(0,timeLeft);return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`}
  function renderTimer(){
    const txt=timerText(),t=ensureTimer(),n=$('cp5TimerText');n.textContent=txt;t.classList.toggle('warning',timeLeft<=20&&timeLeft>10);t.classList.toggle('danger',timeLeft<=10);
    document.querySelectorAll('[data-cp5-inline] strong').forEach(e=>e.textContent=txt);
    document.querySelectorAll('[data-cp5-inline]').forEach(e=>{e.classList.toggle('warning',timeLeft<=20&&timeLeft>10);e.classList.toggle('danger',timeLeft<=10)});
    if($('crosswordTimeText'))$('crosswordTimeText').textContent=txt;
    document.querySelectorAll('[data-cp5-bar]').forEach(e=>{e.style.width=(Math.max(0,timeLeft)/180*100)+'%'});
  }
  function stopTimer(){if(timer){clearInterval(timer);timer=null}ensureTimer().classList.remove('active','warning','danger')}
  function startTimer(level){stopTimer();activeLevel=level;timeLeft=180;gameFinished=false;ensureTimer().classList.add('active');renderTimer();timer=setInterval(()=>{timeLeft--;renderTimer();if(timeLeft<=0){stopTimer();showOutcome(level,'timeout')}} ,1000)}

  let outcome=$('cp5Outcome');
  function ensureOutcome(){
    if(outcome)return outcome;
    outcome=document.createElement('div');outcome.id='cp5Outcome';outcome.className='level-outcome-overlay hidden';outcome.innerHTML=`<div class="level-outcome-card"><div id="cp5Icon" class="level-outcome-icon">🏆</div><div id="cp5Kicker" class="level-outcome-kicker">LEVEL BERHASIL</div><h2 id="cp5Title">Hebat!</h2><p id="cp5Text"></p><div id="cp5Meta" class="cp5-outcome-meta"></div><div class="level-outcome-actions"><button id="cp5Primary" class="btn btn-primary">Lanjut</button><button id="cp5Secondary" class="btn btn-outline">Kembali ke Menu Level</button></div></div>`;document.body.appendChild(outcome);
    return outcome;
  }
  function showOutcome(level,type,customText=''){
    stopTimer();if(level===3&&type==='timeout')cwOnTimeout();const m=ensureOutcome();const timeout=type==='timeout';
    $('cp5Icon').textContent=timeout?'⏰':level===5?'🏆':'🎉';$('cp5Kicker').textContent=timeout?'WAKTU HABIS':'LEVEL BERHASIL';
    $('cp5Title').textContent=timeout?'Waktu 3 Menit Habis!':`Level ${level} Selesai!`;
    $('cp5Text').textContent=timeout?(customText||`Level ${level} belum selesai. Kamu bisa mencoba lagi atau kembali ke menu level.`):(customText||`Kamu berhasil menyelesaikan Level ${level}.`);
    const s=timeout?0:(readStars()[level]||4);$('cp5Meta').innerHTML=timeout?((level===3?`📝 ${cwProgressText()}<br>`:'')+'⏳ Progres belum disimpan sebagai selesai.'):`Bintang: <span style="color:#f5a000">${'★'.repeat(s)}${'☆'.repeat(4-s)}</span>`;
    const p=$('cp5Primary'),sec=$('cp5Secondary');p.textContent=timeout?'🔄 Coba Lagi':level<5?`Lanjut Level ${level+1}`:'🏠 Kembali ke Menu Level';sec.textContent='Kembali ke Menu Level';
    p.onclick=()=>{m.classList.add('hidden');if(timeout){launchLevel(level)}else if(level<5){launchLevel(level+1)}else{refreshLevelCards();hardShow('levels')}};
    sec.onclick=()=>{m.classList.add('hidden');refreshLevelCards();hardShow('levels')};m.classList.remove('hidden');
  }

  function refreshLevelCards(){
    for(let lv=2;lv<=5;lv++){
      const card=$(`level${lv}Card`),btn=$(`level${lv}Btn`),num=$(`level${lv}Number`);if(!card||!btn)continue;
      const unlocked=lv===2?localStorage.getItem(doneKey(1))==='true':localStorage.getItem(doneKey(lv-1))==='true';
      const done=localStorage.getItem(doneKey(lv))==='true';card.style.display='block';card.classList.toggle('locked',!unlocked);card.classList.toggle('active',unlocked);btn.disabled=!unlocked;btn.textContent=unlocked?(done?`Mainkan Level ${lv} ✓`:`Mainkan Level ${lv}`):`Selesaikan Level ${lv-1}`;if(num)num.textContent=done?'✓':unlocked?String(lv):'🔒';
    }
  }

  /* ---------- LEVEL 2: 8 cards, 2 x 4 ---------- */
  const memPool=[['6 × 7','42'],['8 + 9','17'],['25 − 10','15'],['36 ÷ 6','6'],['7 × 8','56'],['9 × 6','54'],['48 ÷ 8','6'],['13 + 29','42'],['50 − 17','33'],['72 ÷ 9','8'],['12 × 5','60'],['15 + 18','33'],['81 ÷ 9','9'],['64 − 28','36'],['11 × 4','44'],['27 + 36','63'],['100 − 45','55'],['9 × 9','81'],['5 × 13','65'],['90 ÷ 15','6'],['14 + 19','33'],['8 × 7','56'],['40 − 13','27'],['45 ÷ 9','5']];
  let memPairs=[];
  /* 4 pasangan soal–jawaban dipilih acak (jawaban tidak boleh kembar) setiap level dimulai. */
  function memNewPairs(){
    const pool=memPool.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    const out=[],seen=new Set();for(const p of pool){if(seen.has(p[1]))continue;seen.add(p[1]);out.push(p);if(out.length===4)break}
    return out;
  }
  let mem={cards:[],open:[],moves:0,matches:0,locked:false,done:false};
  function startMemory(){
    if(!hardShow('memory'))return;
    gameFinished=false;mem={cards:[],open:[],moves:0,matches:0,locked:false,done:false};memPairs=memNewPairs();
    const b=$('memoryBoard');b.className='memory-board cp5-memory';b.innerHTML='';$('memoryPairs').textContent='0';$('memoryMoves').textContent='0';
    const cards=[];memPairs.forEach((p,i)=>{cards.push({id:i,type:'q',text:p[0]},{id:i,type:'a',text:p[1]})});
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}mem.cards=cards;
    cards.forEach((c,i)=>{const el=document.createElement('button');el.type='button';el.className='memory-card';el.dataset.idx=i;el.innerHTML=`<span class="memory-card-inner"><span class="memory-front">?</span><span class="memory-back">${c.text}</span></span>`;el.onclick=()=>flipMemory(el);b.appendChild(el)});
    let hint=b.parentElement.querySelector('.cp5-memory-hint');if(!hint){hint=document.createElement('div');hint.className='cp5-memory-hint';hint.textContent='Cocokkan operasi hitung dengan hasilnya. Hanya 8 kartu: 2 baris × 4 kolom.';b.after(hint)}
    startTimer(2);
  }
  function flipMemory(el){if(mem.done||mem.locked||el.classList.contains('flipped')||el.classList.contains('matched'))return;el.classList.add('flipped');mem.open.push(el);if(mem.open.length<2)return;mem.moves++;$('memoryMoves').textContent=mem.moves;mem.locked=true;const [a,b]=mem.open,ca=mem.cards[+a.dataset.idx],cb=mem.cards[+b.dataset.idx];if(ca.id===cb.id&&ca.type!==cb.type){setTimeout(()=>{a.classList.add('matched');b.classList.add('matched');a.classList.remove('flipped');b.classList.remove('flipped');mem.matches++;$('memoryPairs').textContent=mem.matches;mem.open=[];mem.locked=false;if(mem.matches===4)finishMemory()},280)}else{setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');mem.open=[];mem.locked=false},650)}}
  function finishMemory(){if(mem.done)return;mem.done=true;const s=mem.moves<=6?4:mem.moves<=8?3:mem.moves<=11?2:1;complete(2,s);showOutcome(2,'success',`Semua 4 pasangan ditemukan dalam ${mem.moves} langkah. Level berikutnya sekarang terbuka.`)}

  /* ---------- LEVEL 3: Teka-teki silang (TTS) acak ---------- */
  /* Setiap kali level dimulai (menang, kalah, atau main lagi) papan TTS dibuat ulang:
     10 kata dipilih acak, disusun saling bersilang, lalu soal hitungannya dibuat acak
     dari jawaban kata itu sendiri. Susunan selalu divalidasi (cwBuildModel): tidak boleh
     ada huruf bertetangga yang membentuk deretan selain kata-kata yang dipasang. */
  let CW_ROWS=11, CW_COLS=9;
  const CW_HINT_MAX=3, CW_WORD_COUNT=10, CW_MAX_SIDE=11;
  const CW_NUMS=[['NOL',0],['SATU',1],['DUA',2],['TIGA',3],['EMPAT',4],['LIMA',5],['ENAM',6],['TUJUH',7],['DELAPAN',8],['SEMBILAN',9],['SEPULUH',10],['SEBELAS',11],['SERATUS',100],['SERIBU',1000]];
  let cwEntries=[];
  const cwRnd=n=>Math.floor(Math.random()*n);
  const cwPick=a=>a[cwRnd(a.length)];
  const cwShuffle=a=>{for(let i=a.length-1;i>0;i--){const j=cwRnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};

  /* Soal hitungan acak yang hasilnya PASTI sama dengan angka jawaban (dihitung, bukan ditebak). */
  function cwMakeClue(n){
    const forms=[];
    if(n===0){
      const k=2+cwRnd(8);forms.push(()=>k+' − '+k);
      const a=2+cwRnd(4),b=2+cwRnd(4);forms.push(()=>(a*b)+' − '+a+' × '+b);
      forms.push(()=>(3+cwRnd(8))+' × 0');
    }else if(n===100){
      ['10 × 10','50 + 50','200 ÷ 2','4 × 25','1.000 ÷ 10','150 − 50','5 × 20','(60 + 40)'].forEach(t=>forms.push(()=>t));
    }else if(n===1000){
      ['10 × 10 × 10','500 + 500','2.000 ÷ 2','100 × 10','1.500 − 500','250 × 4','8 × 125'].forEach(t=>forms.push(()=>t));
    }else{
      if(n>=2) forms.push(()=>{const a=1+cwRnd(n-1);return a+' + '+(n-a)});
      forms.push(()=>{const b=2+cwRnd(8);return (n+b)+' − '+b});
      forms.push(()=>{const b=2+cwRnd(8);return (n*b)+' ÷ '+b});
      const fp=[];for(let a=2;a<=9;a++)if(n%a===0&&n/a>=2&&n/a<=9)fp.push([a,n/a]);
      if(fp.length) forms.push(()=>{const f=cwPick(fp);return f[0]+' × '+f[1]});
      // dua langkah (lebih sulit)
      forms.push(()=>{const a=2+cwRnd(4),b=2+cwRnd(4),c=n-a*b;return c>=1&&c<=12?a+' × '+b+' + '+c:null});
      forms.push(()=>{const a=2+cwRnd(5),b=2+cwRnd(5),c=a*b-n;return c>=1&&c<=12?a+' × '+b+' − '+c:null});
      forms.push(()=>{const c=2+cwRnd(4),t=n*c,a=1+cwRnd(t-1);return '('+a+' + '+(t-a)+') ÷ '+c});
      forms.push(()=>{const c=2+cwRnd(4),b=2+cwRnd(4),a=n-b*c;return a>=1?a+' + '+b+' × '+c:null});
      forms.push(()=>{const c=2+cwRnd(3),d=1+cwRnd(8);return '('+(n+d)+' − '+d+') × '+c+' ÷ '+c});
    }
    for(let t=0;t<40;t++){const f=cwPick(forms)(); if(f) return f+' = ....';}
    return n+' = ....';
  }

  /* Pasang kata satu per satu pada kanvas 21×21, hanya jika persilangan & ketetanggaan valid. */
  function cwTryLayout(words){
    const N=21,cell=new Map(),placed=[];
    const key=(r,c)=>r+','+c;
    const runsOk=()=>{
      const found=[];
      cell.forEach((ch,k)=>{
        const [r,c]=k.split(',').map(Number);
        if(!cell.has(key(r,c-1))&&cell.has(key(r,c+1))){let s='',x=c;while(cell.has(key(r,x))){s+=cell.get(key(r,x));x++}found.push(s+'|'+r+'|'+c+'|A')}
        if(!cell.has(key(r-1,c))&&cell.has(key(r+1,c))){let s='',y=r;while(cell.has(key(y,c))){s+=cell.get(key(y,c));y++}found.push(s+'|'+r+'|'+c+'|D')}
      });
      const want=placed.map(p=>p.word+'|'+p.r+'|'+p.c+'|'+p.dir);
      return found.length===want.length&&found.slice().sort().join('#')===want.slice().sort().join('#');
    };
    const options=(w)=>{
      const out=[];
      ['A','D'].forEach(dir=>{
        for(let r=0;r<N;r++)for(let c=0;c<N;c++){
          if(dir==='A'&&c+w.length>N)continue;
          if(dir==='D'&&r+w.length>N)continue;
          let cross=0,ok=true;
          for(let k=0;k<w.length;k++){
            const rr=r+(dir==='D'?k:0),cc=c+(dir==='A'?k:0),ex=cell.get(key(rr,cc));
            if(ex!==undefined){if(ex!==w[k]){ok=false;break}cross++}
          }
          if(!ok||cross===0)continue;
          const br=r-(dir==='D'?1:0),bc=c-(dir==='A'?1:0),ar=r+(dir==='D'?w.length:0),ac=c+(dir==='A'?w.length:0);
          if(cell.has(key(br,bc))||cell.has(key(ar,ac)))continue;
          // coba pasang, validasi, lalu batalkan bila tidak valid
          const added=[];
          for(let k=0;k<w.length;k++){const kk=key(r+(dir==='D'?k:0),c+(dir==='A'?k:0));if(!cell.has(kk)){cell.set(kk,w[k]);added.push(kk)}}
          placed.push({word:w,r:r,c:c,dir:dir});
          const valid=runsOk();
          placed.pop();added.forEach(kk=>cell.delete(kk));
          if(valid)out.push({r:r,c:c,dir:dir,cross:cross});
        }
      });
      return out;
    };
    const first=words[0],fr=Math.floor(N/2)+cwRnd(3)-1,fdir=Math.random()<0.5?'A':'D',fc=Math.floor((N-first.length)/2)+cwRnd(3)-1;
    for(let k=0;k<first.length;k++)cell.set(key(fdir==='A'?fr:fc+k,fdir==='A'?fc+k:fr),first[k]);
    placed.push({word:first,r:fdir==='A'?fr:fc,c:fdir==='A'?fc:fr,dir:fdir});
    for(let i=1;i<words.length;i++){
      const w=words[i],opts=options(w);
      if(!opts.length)continue;
      // utamakan posisi yang menjaga papan tetap kompak
      const sc=o=>{let minR=99,maxR=-1,minC=99,maxC=-1;
        const upd=(r,c)=>{minR=Math.min(minR,r);maxR=Math.max(maxR,r);minC=Math.min(minC,c);maxC=Math.max(maxC,c)};
        cell.forEach((_,k)=>{const [r,c]=k.split(',').map(Number);upd(r,c)});
        for(let k=0;k<w.length;k++)upd(o.r+(o.dir==='D'?k:0),o.c+(o.dir==='A'?k:0));
        return Math.max(maxR-minR+1,maxC-minC+1)*10-o.cross*2+Math.random()*6};
      opts.sort((x,y)=>sc(x)-sc(y));
      const o=opts[0];
      for(let k=0;k<w.length;k++)cell.set(key(o.r+(o.dir==='D'?k:0),o.c+(o.dir==='A'?k:0)),w[k]);
      placed.push({word:w,r:o.r,c:o.c,dir:o.dir});
    }
    return placed;
  }

  function cwGenerate(){
    let best=null;
    for(let attempt=0;attempt<60;attempt++){
      // pilih kata acak; kata panjang diutamakan agar mudah bersilangan
      const pool=cwShuffle(CW_NUMS.slice());
      const words=pool.slice(0,CW_WORD_COUNT).map(x=>x[0]);
      words.sort((a,b)=>b.length-a.length+(Math.random()-.5)*3);
      const placed=cwTryLayout(words);
      if(placed.length<CW_WORD_COUNT)continue;
      const use=placed;
      let minR=99,minC=99,maxR=-1,maxC=-1;
      use.forEach(p=>{const L=p.word.length;minR=Math.min(minR,p.r);minC=Math.min(minC,p.c);maxR=Math.max(maxR,p.r+(p.dir==='D'?L-1:0));maxC=Math.max(maxC,p.c+(p.dir==='A'?L-1:0))});
      const rows=maxR-minR+1,cols=maxC-minC+1;
      if(rows>CW_MAX_SIDE||cols>CW_MAX_SIDE)continue;
      const nA=use.filter(p=>p.dir==='A').length,nD=use.length-nA;
      if(Math.abs(nA-nD)>2)continue;
      const cand={use:use,minR:minR,minC:minC,rows:rows,cols:cols,score:use.length*10-(rows+cols)-Math.abs(nA-nD)*2};
      if(!best||cand.score>best.score)best=cand;
      if(attempt>=8&&best)break;
    }
    if(!best)throw new Error('TTS: gagal menyusun papan');
    CW_ROWS=best.rows;CW_COLS=best.cols;
    cwEntries=best.use.map(p=>({dir:p.dir,r:p.r-best.minR,c:p.c-best.minC,word:p.word,clue:cwMakeClue(CW_NUMS.find(x=>x[0]===p.word)[1])}));
    cwNumber();
  }
  function cwNumber(){ /* penomoran standar TTS: kiri-atas ke kanan-bawah */
    const starts=[];cwEntries.forEach(e=>{const k=e.r+','+e.c;if(starts.indexOf(k)<0)starts.push(k)});
    starts.sort((x,y)=>{const a=x.split(',').map(Number),b=y.split(',').map(Number);return a[0]-b[0]||a[1]-b[1]});
    cwEntries.forEach(e=>{e.n=starts.indexOf(e.r+','+e.c)+1});
  }
  let cw=null;

  function cwBuildModel(){
    const words=cwEntries.map((e,i)=>({idx:i,n:e.n,dir:e.dir,word:e.word,clue:e.clue,keys:[],solved:false}));
    const cells={};
    words.forEach(w=>{
      const e=cwEntries[w.idx];
      for(let k=0;k<w.word.length;k++){
        const r=e.r+(w.dir==='D'?k:0), c=e.c+(w.dir==='A'?k:0), key=r+','+c, ch=w.word[k];
        if(r>=CW_ROWS||c>=CW_COLS) throw new Error('TTS: kata keluar dari papan ('+w.word+')');
        if(cells[key]&&cells[key].ch!==ch) throw new Error('TTS: huruf bersilangan tidak sama di '+key);
        const cell=cells[key]||(cells[key]={key:key,r:r,c:c,ch:ch,w:{},nums:[]});
        cell.w[w.dir]=w.idx; w.keys.push(key);
      }
      cells[w.keys[0]].nums.push(w.n);
    });
    const runs=[];
    Object.keys(cells).forEach(key=>{
      const c0=cells[key];
      if(!cells[c0.r+','+(c0.c-1)]&&cells[c0.r+','+(c0.c+1)]){let s='',c=c0.c;while(cells[c0.r+','+c]){s+=cells[c0.r+','+c].ch;c++}runs.push(s)}
      if(!cells[(c0.r-1)+','+c0.c]&&cells[(c0.r+1)+','+c0.c]){let s='',r=c0.r;while(cells[r+','+c0.c]){s+=cells[r+','+c0.c].ch;r++}runs.push(s)}
    });
    if(runs.slice().sort().join('|')!==words.map(w=>w.word).sort().join('|')) throw new Error('TTS: susunan kotak tidak valid ('+runs.join(',')+')');
    return {words:words,cells:cells};
  }

  const cwWordAt=key=>{const c=cw.cells[key],i=c&&c.w[cw.dir];return i===undefined?null:cw.words[i]};
  const cwUniqueWords=cell=>[cell.w.A,cell.w.D].filter((v,i,a)=>v!==undefined&&a.indexOf(v)===i).map(i=>cw.words[i]);

  function cwPanelHTML(){
    const across=cw.words.filter(w=>w.dir==='A').sort((a,b)=>a.n-b.n), down=cw.words.filter(w=>w.dir==='D').sort((a,b)=>a.n-b.n);
    const li=w=>`<li class="cw3-clue" data-w="${w.idx}" role="button" tabindex="0"><b class="cw3-n">${w.n}.</b><span class="cw3-q">${w.clue}</span><em>(${w.word.length} huruf)</em><span class="cw3-ck" aria-hidden="true">✓</span></li>`;
    return `<div id="crosswordFeedback" class="game-message crossword-result cw3-fb" role="status" aria-live="polite">Isi semua ${cw.words.length} kata sebelum waktu 3 menit habis. Kata yang benar langsung berwarna hijau.</div>
      <div class="score-row"><div class="mini-stat"><small>Kata benar</small><strong id="crosswordCorrect">0 / ${cw.words.length}</strong></div><div class="mini-stat"><small>Kotak terisi</small><strong id="cwFilledText">0 / ${Object.keys(cw.cells).length}</strong></div></div>
      <div class="cw3-cols"><div class="cw3-clues"><h3>↔ Mendatar</h3><ol>${across.map(li).join('')}</ol></div>
      <div class="cw3-clues"><h3>↕ Menurun</h3><ol>${down.map(li).join('')}</ol></div></div>
      <div class="cw3-actions"><button id="cwHintBtn" type="button" class="btn btn-outline">💡 Petunjuk (${CW_HINT_MAX})</button><button id="checkCrosswordBtn" type="button" class="btn btn-primary">Periksa Jawaban</button></div>
      <p class="cw3-help">Klik kotak lalu ketik hurufnya; klik lagi di kotak persilangan untuk ganti arah ↔ ↕. Jawaban berupa <strong>kata</strong> (contoh: 2 + 2 = <strong>EMPAT</strong>).</p>`;
  }

  function startCrossword(){
    if(!hardShow('crossword')) return;
    const board=$('crosswordBoard'), page=$('crosswordGamePage'), panel=page&&page.querySelector('.crossword-panel');
    if(!board||!panel) return;
    let model=null,lastErr=null;
    for(let t=0;t<8&&!model;t++){try{cwGenerate();model=cwBuildModel()}catch(err){lastErr=err;model=null}}
    if(!model){console.error('[CerdasPlay] '+(lastErr&&lastErr.message));board.textContent='Papan TTS gagal dimuat.';return}
    cw={words:model.words,cells:model.cells,dir:'A',cur:null,locked:false,hints:0,flashTimers:[]};
    panel.innerHTML=cwPanelHTML();
    board.className='cw3-board';board.style.setProperty('--cols',CW_COLS);board.style.setProperty('--rows',CW_ROWS);board.innerHTML='';
    let idx=0;
    for(let r=0;r<CW_ROWS;r++)for(let c=0;c<CW_COLS;c++){
      const key=r+','+c,cell=cw.cells[key];
      if(!cell){const b=document.createElement('div');b.className='cw3-block';board.appendChild(b);continue}
      const el=document.createElement('div');el.className='cw3-cell';el.style.setProperty('--i',idx++);
      if(cell.nums.length){const n=document.createElement('span');n.className='cw3-num';n.textContent=cell.nums.join('/');el.appendChild(n)}
      const inp=document.createElement('input');
      inp.type='text';inp.maxLength=2;inp.autocomplete='off';inp.autocapitalize='characters';inp.spellcheck=false;
      inp.setAttribute('aria-label','Kotak baris '+(r+1)+' kolom '+(c+1));inp.dataset.r=r;inp.dataset.c=c;
      el.appendChild(inp);board.appendChild(el);cell.el=el;cell.input=inp;
      inp.addEventListener('click',()=>cwSelect(key,true));
      inp.addEventListener('input',()=>cwOnInput(cell));
      inp.addEventListener('keydown',e=>cwOnKey(e,cell));
    }
    panel.querySelectorAll('.cw3-clue').forEach(li=>{
      const go=()=>{if(cw.locked)return;const w=cw.words[+li.dataset.w];cw.dir=w.dir;cwSelect(w.keys[0],false)};
      li.addEventListener('click',go);
      li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
    });
    $('cwHintBtn').addEventListener('click',cwHint);
    cwCount();cwSelect(cw.words[0].keys[0],false);
    startTimer(3);
  }

  function cwSelect(key,toggle){
    if(!cw)return;const cell=cw.cells[key];if(!cell)return;
    cwResetPass(key);
    if(toggle&&cw.cur===key&&cell.w.A!==undefined&&cell.w.D!==undefined) cw.dir=cw.dir==='A'?'D':'A';
    else if(cell.w[cw.dir]===undefined) cw.dir=cw.dir==='A'?'D':'A';
    cw.cur=key;cwPaint();
    cwArmPass(key);
    if(document.activeElement!==cell.input) cell.input.focus({preventScroll:true});
    try{cell.input.select()}catch(e){}
  }
  function cwPaint(){
    Object.keys(cw.cells).forEach(k=>cw.cells[k].el.classList.remove('cw3-active','cw3-cur'));
    const w=cwWordAt(cw.cur);
    if(w) w.keys.forEach(k=>cw.cells[k].el.classList.add('cw3-active'));
    cw.cells[cw.cur].el.classList.add('cw3-cur');
    document.querySelectorAll('#crosswordGamePage .cw3-clue').forEach(li=>li.classList.toggle('on',!!w&&+li.dataset.w===w.idx));
  }
  /* Kotak yang sudah terkunci (benar) tetap "dilewati" saat mengetik satu kata penuh:
     kursor mendarat di situ, huruf yang sama langsung dianggap lewat, huruf lain loncat ke kotak kosong berikutnya. */
  function cwArmPass(key){const c=cw.cells[key];if(c&&c.input.readOnly){c.input.readOnly=false;c.input.dataset.pass='1';c.input.value=c.ch}}
  function cwResetPass(except){Object.keys(cw.cells).forEach(k=>{if(k===except)return;const i=cw.cells[k].input;if(i.dataset.pass){delete i.dataset.pass;i.readOnly=true;i.value=cw.cells[k].ch}})}
  function cwEditable(key){return !cw.cells[key].input.readOnly}
  function cwAdvance(cell){
    const w=cwWordAt(cell.key);if(!w)return;
    const i=w.keys.indexOf(cell.key);
    if(i+1<w.keys.length){cwSelect(w.keys[i+1],false);return}
    const empty=w.keys.find(k=>cwEditable(k)&&!cw.cells[k].input.value);
    if(empty) cwSelect(empty,false);
  }
  function cwNextWord(step){
    const order=cw.words.slice().sort((a,b)=>a.n-b.n),cur=cwWordAt(cw.cur),start=Math.max(0,order.indexOf(cur));
    for(let k=1;k<=order.length;k++){
      const w=order[(((start+step*k)%order.length)+order.length)%order.length];
      if(!w.solved){cw.dir=w.dir;cwSelect(w.keys[0],false);return}
    }
  }
  function cwMove(cell,dr,dc){
    let r=cell.r+dr,c=cell.c+dc;
    while(r>=0&&c>=0&&r<CW_ROWS&&c<CW_COLS){
      const k=r+','+c;
      if(cw.cells[k]){cw.dir=dr?'D':'A';cwSelect(k,false);return}
      r+=dr;c+=dc;
    }
  }

  function cwOnKey(e,cell){
    if(!cw||cw.locked){return}
    const k=e.key,inp=cell.input;
    if(k==='ArrowRight'){e.preventDefault();cwMove(cell,0,1)}
    else if(k==='ArrowLeft'){e.preventDefault();cwMove(cell,0,-1)}
    else if(k==='ArrowDown'){e.preventDefault();cwMove(cell,1,0)}
    else if(k==='ArrowUp'){e.preventDefault();cwMove(cell,-1,0)}
    else if(k==='Enter'||(k==='Tab'&&!e.shiftKey)){e.preventDefault();cwNextWord(1)}
    else if(k==='Tab'&&e.shiftKey){e.preventDefault();cwNextWord(-1)}
    else if(k===' '){e.preventDefault();if(cell.w.A!==undefined&&cell.w.D!==undefined){cw.dir=cw.dir==='A'?'D':'A';cwSelect(cell.key,false)}}
    else if(k==='Backspace'||k==='Delete'){
      e.preventDefault();
      if(!inp.readOnly&&!inp.dataset.pass&&inp.value){inp.value='';cell.el.classList.remove('cw3-bad','cw3-chk-ok','cw3-chk-bad');cwCount();return}
      if(k==='Backspace'){
        const w=cwWordAt(cell.key),i=w?w.keys.indexOf(cell.key):-1;
        for(let j=i-1;j>=0;j--) if(cwEditable(w.keys[j])){const p=cw.cells[w.keys[j]];cwResetPass();p.input.value='';p.el.classList.remove('cw3-bad','cw3-chk-ok','cw3-chk-bad');cwSelect(w.keys[j],false);cwCount();return}
      }
    }
  }
  function cwOnInput(cell){
    const inp=cell.input;
    if(inp.dataset.pass){
      const typed=(inp.value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(-1);
      inp.value=cell.ch;
      if(!cw||cw.locked||!typed)return;
      if(typed===cell.ch){cwAdvance(cell);return}
      const w=cwWordAt(cell.key),i=w?w.keys.indexOf(cell.key):-1;
      let tgt=null;for(let j=i+1;w&&j<w.keys.length;j++) if(cwEditable(w.keys[j])){tgt=w.keys[j];break}
      if(tgt){cwSelect(tgt,false);const t=cw.cells[tgt];t.input.value=typed;cwOnInput(t)}
      return;
    }
    if(!cw||cw.locked||inp.readOnly){inp.value=inp.readOnly?cell.ch:'';return}
    const v=(inp.value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(-1);inp.value=v;
    cell.el.classList.remove('cw3-bad','cw3-chk-ok','cw3-chk-bad');
    cwCount();
    if(!v)return;
    let solvedNow=false;
    cwUniqueWords(cell).forEach(w=>{if(cwCheckWord(w)===true)solvedNow=true});
    if(cw.locked)return;
    if(solvedNow) cwNextWord(1); else cwAdvance(cell);
  }

  function cwCount(){
    const all=Object.keys(cw.cells),filled=all.filter(k=>cw.cells[k].input.value).length,solved=cw.words.filter(w=>w.solved).length;
    const a=$('crosswordCorrect'),b=$('cwFilledText');
    if(a)a.textContent=solved+' / '+cw.words.length;
    if(b)b.textContent=filled+' / '+all.length;
  }
  function cwSay(t,kind){const f=$('crosswordFeedback');if(!f)return;f.textContent=t;f.dataset.kind=kind||''}
  /* true = benar & baru selesai, false = penuh tapi salah, null = belum penuh / sudah selesai */
  function cwCheckWord(w){
    if(w.solved)return null;
    const vals=w.keys.map(k=>cw.cells[k].input.value);
    if(vals.some(v=>!v))return null;
    if(vals.join('')===w.word){
      w.solved=true;
      w.keys.forEach(k=>{const c=cw.cells[k];c.input.readOnly=true;c.el.classList.remove('cw3-bad','cw3-chk-bad','cw3-chk-ok','cw3-hint');c.el.classList.add('cw3-ok')});
      document.querySelectorAll('#crosswordGamePage .cw3-clue').forEach(li=>{if(+li.dataset.w===w.idx)li.classList.add('done')});
      cwCount();
      const left=cw.words.filter(x=>!x.solved).length;
      if(left===0){cwWin()}
      else cwSay('✅ Kata nomor '+w.n+' ('+w.word+') benar! Tinggal '+left+' kata lagi.','ok');
      return true;
    }
    w.keys.forEach(k=>{const c=cw.cells[k];if(!c.input.readOnly){c.el.classList.remove('cw3-bad');void c.el.offsetWidth;c.el.classList.add('cw3-bad')}});
    cw.flashTimers.push(setTimeout(()=>{w.keys.forEach(k=>cw.cells[k]&&cw.cells[k].el.classList.remove('cw3-bad'))},900));
    cwSay('❌ Kata nomor '+w.n+' belum tepat. Hitung lagi, lalu periksa huruf yang bersilangan.','bad');
    return false;
  }

  function cwHint(){
    if(!cw||cw.locked)return;
    if(cw.hints>=CW_HINT_MAX){cwSay('💡 Petunjuk sudah habis.','');return}
    let w=cwWordAt(cw.cur);if(!w||w.solved)w=cw.words.find(x=>!x.solved);if(!w)return;
    const key=w.keys.find(k=>{const c=cw.cells[k];return !c.input.readOnly&&c.input.value!==c.ch});
    if(!key){cwSay('Kata ini sudah benar semua.','');return}
    const c=cw.cells[key];
    c.input.value=c.ch;c.input.readOnly=true;c.el.classList.remove('cw3-bad','cw3-chk-bad','cw3-chk-ok');c.el.classList.add('cw3-hint');
    cw.hints++;
    const btn=$('cwHintBtn');if(btn){const left=CW_HINT_MAX-cw.hints;btn.textContent='💡 Petunjuk ('+left+')';btn.disabled=left<=0}
    cwCount();
    cwSay('💡 Petunjuk: satu huruf dibuka. Bintang akhir berkurang 1 untuk tiap petunjuk.','hint');
    let solvedNow=false;
    cwUniqueWords(c).forEach(x=>{if(cwCheckWord(x)===true)solvedNow=true});
    if(!cw.locked){if(solvedNow)cwNextWord(1);else cwSelect(w.keys.find(k=>cwEditable(k)&&!cw.cells[k].input.value)||key,false)}
  }

  /* dipanggil tombol "Periksa Jawaban" (lewat handler capture di bawah) */
  function checkCrossword(){
    if(!cw||cw.locked)return;
    Object.keys(cw.cells).forEach(k=>{
      const c=cw.cells[k],v=c.input.value;
      if(c.input.readOnly)return;
      c.el.classList.toggle('cw3-chk-ok',!!v&&v===c.ch);
      c.el.classList.toggle('cw3-chk-bad',!!v&&v!==c.ch);
    });
    const s=cw.words.filter(w=>w.solved).length,n=cw.words.length;
    const empty=Object.keys(cw.cells).some(k=>!cw.cells[k].input.value);
    cwSay(s+' dari '+n+' kata benar. '+(empty?'Masih ada kotak kosong. ':'')+'Kotak merah masih salah, kotak hijau sudah tepat.','check');
  }

  function cwProgressText(){
    if(!cw)return '0 dari '+cwEntries.length+' kata benar';
    const all=Object.keys(cw.cells),filled=all.filter(k=>cw.cells[k].input.value).length;
    return cw.words.filter(w=>w.solved).length+' dari '+cw.words.length+' kata benar • '+filled+' dari '+all.length+' kotak terisi';
  }
  function cwOnTimeout(){
    if(!cw||cw.locked)return;
    cw.locked=true;
    cw.flashTimers.forEach(clearTimeout);
    Object.keys(cw.cells).forEach(k=>{cw.cells[k].input.readOnly=true;cw.cells[k].input.blur()});
    cwSay('⏰ Waktu habis! '+cwProgressText()+'.','bad');
  }
  function cwWin(){
    if(!cw||cw.locked)return;
    cw.locked=true;stopTimer();
    cw.flashTimers.forEach(clearTimeout);
    const left=Math.max(0,timeLeft);
    let stars=left>=20?4:left>=12?3:left>=5?2:1;
    stars=Math.max(1,stars-cw.hints);
    Object.keys(cw.cells).forEach(k=>cw.cells[k].input.blur());
    const board=$('crosswordBoard');if(board)board.classList.add('cw3-win');
    cwSay('🎉 Semua kata benar!','ok');
    complete(3,stars);
    const used=180-left,msg='Semua '+cw.words.length+' kata benar dalam '+used+' detik'+(cw.hints?' dengan '+cw.hints+' petunjuk':'')+'. Labirin Angka sekarang terbuka.';
    setTimeout(()=>showOutcome(3,'success',msg),900);
  }

  /* ---------- LEVEL 4: solvable maze + trap questions + 5 bonus steps ---------- */
  let maze={};
  const trapQs=[{q:'7 × 8 = ?',a:56,o:[48,54,56,64]},{q:'81 ÷ 9 = ?',a:9,o:[7,8,9,12]},{q:'25 + 37 = ?',a:62,o:[52,60,62,72]},{q:'90 − 46 = ?',a:44,o:[34,42,44,54]},{q:'12 × 6 = ?',a:72,o:[62,68,72,84]}];
  function makeMaze(n=15){const g=Array.from({length:n},()=>Array(n).fill(1)),stack=[[1,1]];g[1][1]=0;const dirs=[[2,0],[-2,0],[0,2],[0,-2]];while(stack.length){const [r,c]=stack[stack.length-1],opts=dirs.filter(([dr,dc])=>{const rr=r+dr,cc=c+dc;return rr>0&&rr<n-1&&cc>0&&cc<n-1&&g[rr][cc]===1});if(!opts.length){stack.pop();continue}const [dr,dc]=opts[Math.floor(Math.random()*opts.length)],rr=r+dr,cc=c+dc;g[r+dr/2][c+dc/2]=0;g[rr][cc]=0;stack.push([rr,cc])}return g}
  function mazePath(g){const n=g.length,q=[[1,1]],prev=new Map([['1,1',null]]);while(q.length){const [r,c]=q.shift();if(r===n-2&&c===n-2){const out=[];let k=`${r},${c}`;while(k){const [rr,cc]=k.split(',').map(Number);out.push([rr,cc]);k=prev.get(k)}return out.reverse()}for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc,k=`${rr},${cc}`;if(rr>=0&&rr<n&&cc>=0&&cc<n&&g[rr][cc]===0&&!prev.has(k)){prev.set(k,`${r},${c}`);q.push([rr,cc])}}}return []}
  function startMaze(){if(!hardShow('mathMaze'))return;const g=makeMaze(),path=mazePath(g),trapCells=new Set();for(let i=5;i<path.length-2;i+=Math.max(5,Math.floor(path.length/5)))trapCells.add(path[i].join(','));maze={g,path,r:1,c:1,goal:[13,13],traps:trapCells,revealed:new Set(),triggered:new Set(),bonus:0,qIndex:0,score:0,steps:0,done:false};$('mazeGrid').className='cp5-maze-grid';$('mazeQuestion').className='cp5-maze-question';$('mazeQuestion').innerHTML='<h3>🧭 Misi Labirin</h3><p>Gerakkan 🧒 menuju 💎. Jebakan muncul di petak tertentu. Jika terkena jebakan, kamu harus menjawab soal dengan benar. Jawaban benar memberi 5 langkah bonus.</p>';$('mazeStatus').textContent='Mulai dari 🧒 dan cari 💎.';renderMaze();startTimer(4)}
  function renderMaze(){const b=$('mazeGrid');b.innerHTML='';maze.g.forEach((row,r)=>row.forEach((v,c)=>{const cell=document.createElement('div');const k=`${r},${c}`;cell.className='cp5-maze-cell '+(v?'wall':'path');if(maze.revealed.has(k)&&maze.traps.has(k))cell.classList.add('trap');if(maze.bonus>0&&maze.path.some(p=>p[0]===r&&p[1]===c)&&!v)cell.classList.add('bonus');if(r===maze.r&&c===maze.c){cell.classList.add('player');cell.textContent='🧒'}else if(r===maze.goal[0]&&c===maze.goal[1]){cell.classList.add('goal');cell.textContent='💎'}else if(maze.revealed.has(k)&&maze.traps.has(k))cell.textContent='💥';else if(maze.visited?.has(k))cell.textContent='·';b.appendChild(cell)}));$('mazeScore').textContent=String(maze.score);$('mazeLives').textContent=maze.bonus>0?`👟 × ${maze.bonus}`:'⭐ 0';}
  function askMazeTrap(k){const q=trapQs[maze.qIndex%trapQs.length];maze.active=k;maze.revealed.add(k);renderMaze();$('mazeQuestion').innerHTML=`<h3>💥 Jebakan ditemukan!</h3><p><strong>${q.q}</strong></p><div class="cp5-maze-answer">${q.o.map(v=>`<button type="button" data-cp5-maze="${v}">${v}</button>`).join('')}</div><div class="cp5-bonus">Jawaban salah tidak mengurangi nyawa. Kamu harus menjawab benar untuk melanjutkan.</div>`;$('mazeQuestion').querySelectorAll('[data-cp5-maze]').forEach(btn=>btn.onclick=()=>{if(Number(btn.dataset.cp5Maze)===q.a){maze.active=null;maze.qIndex++;maze.bonus=5;maze.score+=20;$('mazeStatus').textContent='✅ Benar! Kamu mendapat 5 langkah bonus. Teruskan menuju 💎.';$('mazeQuestion').innerHTML='<h3>🔓 Jebakan terbuka!</h3><p>Gunakan 5 langkah bonusmu untuk melanjutkan.</p>';renderMaze()}else{$('mazeStatus').textContent='❌ Belum benar. Coba lagi.';}})}
  function moveMaze(dir){if(!maze.g||maze.done||maze.active)return;let r=maze.r,c=maze.c;if(dir==='up')r--;if(dir==='down')r++;if(dir==='left')c--;if(dir==='right')c++;if(r<0||r>=15||c<0||c>=15||maze.g[r][c]===1)return;maze.r=r;maze.c=c;maze.steps++;maze.visited=maze.visited||new Set();maze.visited.add(`${r},${c}`);if(maze.bonus>0)maze.bonus--;renderMaze();if(r===maze.goal[0]&&c===maze.goal[1]){maze.done=true;complete(4,4);showOutcome(4,'success','💎 Harta Karun Ditemukan!','Kamu melewati labirin, memecahkan jebakan matematika, dan berhasil mencapai harta karun.')}else{const k=`${r},${c}`;if(maze.traps.has(k)&&!maze.triggered.has(k)){maze.triggered.add(k);askMazeTrap(k)}}}
  function bindMazeControls(){document.querySelectorAll('#mathMazePage [data-move]').forEach(btn=>{btn.onclick=()=>moveMaze(btn.dataset.move)});if(!window.__cp5MazeKey){window.__cp5MazeKey=true;document.addEventListener('keydown',e=>{if($('mathMazePage')?.classList.contains('hidden'))return;const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(d){e.preventDefault();moveMaze(d)}})}}
  bindMazeControls();

  /* ---------- LEVEL 5: 5-round safe ---------- */
  const safeQs=[{q:'(15 × 2) ÷ 3 + 5 = ?',a:15},{q:'84 ÷ 7 + 8 = ?',a:20},{q:'54 − 14 = ?',a:40},{q:'(25 + 15) ÷ 5 = ?',a:8},{q:'7 × 8 − 6 = ?',a:50}];
  let safe={};
  function startSafe(){if(!hardShow('safeCracker'))return;safe={round:0,input:'',done:false};$('safeCard').classList.remove('opened','shake');buildSafePad();renderSafe();startTimer(5)}
  function buildSafePad(){const p=$('safeKeypad');p.innerHTML='';[1,2,3,4,5,6,7,8,9,0].forEach(n=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.onclick=()=>{if(safe.input.length<4){safe.input+=n;renderSafe()}};p.appendChild(b)})}
  function renderSafe(){const q=safeQs[safe.round];$('safeDigits').innerHTML=[0,1,2,3].map(i=>`<span class="safe-digit">${safe.input[i]||'_'}</span>`).join('');$('safeQuestion').innerHTML=`<div class="cp5-safe-rounds">${safeQs.map((_,i)=>`<span class="cp5-safe-round ${i<safe.round?'done':''} ${i===safe.round?'active':''}"></span>`).join('')}</div><strong>RONDE ${safe.round+1} / 5</strong><div class="cp5-safe-question">${q.q}<div class="cp5-safe-sub">Masukkan hasil sebagai 4 digit. Contoh: 0040.</div></div>`;if($('safeResult')&&!$('safeResult').classList.contains('bad')){$('safeResult').textContent='Masukkan jawaban, lalu tekan Buka.';$('safeResult').className='safe-result'}}
  function submitSafe(){if(safe.done)return;if(safe.input.length!==4){$('safeResult').className='safe-result bad';$('safeResult').textContent='⚠️ Masukkan tepat 4 digit.';return}const q=safeQs[safe.round];if(Number(safe.input)===q.a){safe.round++;safe.input='';if(safe.round===5){safe.done=true;stopTimer();$('safeCard').classList.add('opened');$('safeResult').className='safe-result success';$('safeResult').innerHTML='🔓 <strong>BRANKAS TERBUKA!</strong> Semua 5 ronde benar.';complete(5,4);setTimeout(()=>showOutcome(5,'success','🏆 Brankas Berhasil Dibuka!','Kamu menyelesaikan kelima teka-teki matematika dan menuntaskan seluruh rangkaian UpPlay.'),300)}else{$('safeResult').className='safe-result success';$('safeResult').textContent='🟢 Benar! Ronde berikutnya terbuka.';renderSafe()}}else{$('safeCard').classList.remove('shake');void $('safeCard').offsetWidth;$('safeCard').classList.add('shake');$('safeResult').className='safe-result bad';$('safeResult').textContent='🔴 Jawaban belum tepat. Soal tetap sama — coba lagi sebelum waktu habis.'}}
  $('safeClear')?.addEventListener('click',()=>{safe.input='';renderSafe()});$('safeSubmit')?.addEventListener('click',submitSafe);

  function launchLevel(level){if(level===2)startMemory();else if(level===3)startCrossword();else if(level===4)startMaze();else if(level===5)startSafe()}

  /* Capture phase: prevents the many legacy handlers in the old HTML from
     launching duplicate games or stale prototypes. */
  document.addEventListener('click',e=>{
    const id=e.target?.closest?.('#level2Btn,#level3Btn,#level4Btn,#level5Btn')?.id;
    if(id){e.preventDefault();e.stopImmediatePropagation();const lv=Number(id.replace('level','').replace('Btn',''));const unlocked=lv===2?localStorage.getItem(doneKey(1))==='true':localStorage.getItem(doneKey(lv-1))==='true';if(unlocked)launchLevel(lv);return}
    const back=e.target?.closest?.('#backToLevelsFromMemory,#backMemoryIconBtn,#backCrosswordLevels,#backCrosswordIcon,#mazeHome,#mazeBack,#mazeBackIcon,#safeHome,#safeBack')?.id;
    if(back){e.preventDefault();e.stopImmediatePropagation();stopTimer();refreshLevelCards();hardShow('levels');return}

    /* Neutralize legacy handlers on the shared controls. */
    if(e.target?.closest?.('#checkCrosswordBtn')){e.preventDefault();e.stopImmediatePropagation();checkCrossword();return}
    if(e.target?.closest?.('#safeClear')){e.preventDefault();e.stopImmediatePropagation();safe.input='';renderSafe();return}
    if(e.target?.closest?.('#safeSubmit')){e.preventDefault();e.stopImmediatePropagation();submitSafe();return}
    const move=e.target?.closest?.('#mathMazePage [data-move]');
    if(move){e.preventDefault();e.stopImmediatePropagation();moveMaze(move.dataset.move);return}
  },true);

  /* Also expose deterministic entry points for future buttons. */
  window.__cp5LaunchLevel=launchLevel;window.__cp5ShowOutcome=showOutcome;window.__cp5StopTimer=stopTimer;
  refreshLevelCards();
})();
