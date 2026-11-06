(() => {
  // Final visual/behavior fixes for the requested Hitung-Hitungan games.
  const style = document.createElement('style');
  style.textContent = `
    #memoryBoard.memory-3x3{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-width:520px;margin:0 auto;gap:12px}
    #memoryBoard.memory-3x3 .memory-card{aspect-ratio:1/1;min-height:0;height:auto;font-size:1rem}
    #memoryBoard.memory-3x3 .memory-back{font-size:clamp(.85rem,2vw,1.25rem);padding:8px;text-align:center}
    .level-stars{margin:8px 0 2px;font-size:1.2rem;letter-spacing:2px}
    .level-stars .earned{filter:drop-shadow(0 2px 3px rgba(245,158,11,.35))}
    .memory-bonus{opacity:.85}
  `;
  document.head.appendChild(style);

  const memoryItems = [
    ['6 × 7','42'],
    ['8 + 9','17'],
    ['25 − 10','15'],
    ['36 ÷ 6','6']
  ];
  let memoryFinished = false;

  window.startMemoryGame = function(){
    const board=document.getElementById('memoryBoard');
    if(!board) return;
    board.classList.add('memory-3x3');
    window.flippedCards=[]; window.matchedPairs=0; window.memoryMoves=0;
    window.lockMemoryBoard=false; memoryFinished=false;
    const pairs=document.getElementById('memoryPairs'), moves=document.getElementById('memoryMoves');
    if(pairs) pairs.textContent='0'; if(moves) moves.textContent='0';
    board.innerHTML='';

    const cards=[];
    memoryItems.forEach((item,i)=>{
      cards.push({pairId:i,content:item[0],type:'question'});
      cards.push({pairId:i,content:item[1],type:'answer'});
    });
    // 8 matching cards + 1 bonus card so the board is truly 3 × 3.
    cards.push({pairId:'bonus',content:'★ BONUS',type:'bonus'});
    cards.sort(()=>Math.random()-.5);

    cards.forEach(card=>{
      const b=document.createElement('button');
      b.type='button'; b.className='memory-card'+(card.type==='bonus'?' memory-bonus':'');
      b.dataset.pairId=card.pairId; b.dataset.type=card.type;
      b.innerHTML=`<span class="memory-card-inner"><span class="memory-front">?</span><span class="memory-back">${card.content}</span></span>`;
      b.addEventListener('click',()=>memoryFlipFinal(b));
      board.appendChild(b);
    });
  };

  function memoryFlipFinal(card){
    if(memoryFinished || window.lockMemoryBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    window.flippedCards.push(card);
    // Bonus card occupies the ninth cell and does not form a pair.
    if(card.dataset.type==='bonus'){
      setTimeout(()=>{
        card.classList.remove('flipped');
        window.flippedCards=[];
      },650);
      return;
    }
    if(window.flippedCards.length!==2) return;
    window.memoryMoves++;
    const moves=document.getElementById('memoryMoves'); if(moves) moves.textContent=window.memoryMoves;
    window.lockMemoryBoard=true;
    const [a,b]=window.flippedCards;
    const ok=a.dataset.pairId===b.dataset.pairId && a.dataset.type!==b.dataset.type;
    if(ok){
      setTimeout(()=>{
        a.classList.remove('flipped'); b.classList.remove('flipped');
        a.classList.add('matched'); b.classList.add('matched');
        window.matchedPairs++;
        const pairs=document.getElementById('memoryPairs'); if(pairs) pairs.textContent=window.matchedPairs;
        window.flippedCards=[]; window.lockMemoryBoard=false;
        if(window.matchedPairs===memoryItems.length) finishMemoryFinal();
      },350);
    } else {
      setTimeout(()=>{a.classList.remove('flipped');b.classList.remove('flipped');window.flippedCards=[];window.lockMemoryBoard=false;},650);
    }
  }

  function finishMemoryFinal(){
    if(memoryFinished) return;
    memoryFinished=true;
    if(window.stopLevelTimer) window.stopLevelTimer();
    const moves=window.memoryMoves||0;
    const stars=moves<=5?4:moves<=7?3:moves<=9?2:1;
    if(window.saveStars) window.saveStars(2,stars);
    if(window.markMathLevelDone) window.markMathLevelDone(2);
    if(window.saveStudentScore) window.saveStudentScore('Memory Card Level 2',stars*25);
    if(window.updateDashboardProgress) window.updateDashboardProgress();
    const fb=document.getElementById('memoryFeedback');
    if(fb) fb.innerHTML=`Hebat! Semua pasangan ditemukan dalam ${moves} langkah.<div class="game-result-stars">${'★'.repeat(stars)}${'☆'.repeat(4-stars)}</div><strong>${stars} dari 4 bintang</strong>`;
    alert(`Memory Card selesai! Kamu mendapat ${stars} dari 4 bintang.`);
  }

  // Keep the requested 3 × 3 board whenever the memory page is opened.
  const oldShow=window.showPage;
  if(oldShow && !window.__finalShowWrapped){
    window.__finalShowWrapped=true;
    window.showPage=function(page){ oldShow.apply(this,arguments); if(page==='memory') window.startMemoryGame(); };
  }
})();
