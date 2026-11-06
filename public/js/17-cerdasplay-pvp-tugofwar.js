(function(){
  'use strict';

  /* ==================================================================
     PVP TARIK TAMBANG — room dibuat guru, siswa bergabung pakai kode,
     tim A/B DIACAK OTOMATIS oleh sistem saat guru menekan "Mulai".
     Isolasi kelas: room hanya menerima siswa dari className yang sama
     dengan guru pembuatnya (guru 5A <-> siswa 5A, dst — kelas lain
     ditolak dengan pesan yang jelas).
     Data room disimpan di localStorage supaya bisa disinkronkan antar
     tab/perangkat pada browser yang sama lewat event "storage" (realtime
     asli antar tab) ditambah polling ringan tiap 1 detik sebagai cadangan.
  ================================================================== */

  const ROOMS_KEY = "cerdasPlayPvpRooms";
  const ROPE_LIMIT = 8; // selisih total tarikan Tim A vs Tim B untuk menang

  function loadRooms(){
    try{ return JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}"); }catch(e){ return {}; }
  }
  function saveRooms(rooms){
    try{ localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)); }catch(e){}
  }
  function getRoom(code){ return code ? (loadRooms()[code] || null) : null; }
  function putRoom(room){ const rooms=loadRooms(); rooms[room.code]=room; saveRooms(rooms); return room; }
  function deleteRoom(code){ const rooms=loadRooms(); delete rooms[code]; saveRooms(rooms); }

  function generateRoomCode(className){
    const rooms=loadRooms();
    let code;
    do{ code = className + String(Math.floor(100+Math.random()*900)); }while(rooms[code]);
    return code;
  }

  function computeScores(room){
    const a=(room.teamA||[]).reduce((sum,p)=>sum+(room.pulls[p.id]||0),0);
    const b=(room.teamB||[]).reduce((sum,p)=>sum+(room.pulls[p.id]||0),0);
    return {a,b,rope:a-b};
  }

  function session(){ return (typeof currentSession!=="undefined") ? currentSession : null; }
  function goHome(){
    if(typeof showPage==="function") showPage(typeof homePageForSession==="function" ? homePageForSession() : "dashboard");
  }

  /* ---------------- GURU: buat & kendalikan room ---------------- */
  function teacherRoomKey(){ const s=session(); return s ? `cerdasPlayTeacherRoom:${s.id}` : null; }
  function getTeacherRoomCode(){ const k=teacherRoomKey(); return k ? sessionStorage.getItem(k) : null; }
  function setTeacherRoomCode(code){ const k=teacherRoomKey(); if(!k)return; if(code) sessionStorage.setItem(k,code); else sessionStorage.removeItem(k); }

  window.cerdasPvpActiveRoomForClass = function(className){
    const rooms=loadRooms();
    return Object.values(rooms).find(r=>r.className===className) || null;
  };

  function createPvpRoom(){
    const s=session();
    if(!s || s.role!=="teacher") return;
    const code=generateRoomCode(s.className);
    putRoom({
      code, className:s.className, teacherId:s.id, teacherName:s.name,
      status:"waiting", players:[], teamA:[], teamB:[], pulls:{},
      createdAt:Date.now()
    });
    setTeacherRoomCode(code);
    renderTeacherPvpPanel();
  }

  function closePvpRoom(){
    const code=getTeacherRoomCode();
    if(code) deleteRoom(code);
    setTeacherRoomCode(null);
    renderTeacherPvpPanel();
  }

  function startPvpRoom(){
    const room=getRoom(getTeacherRoomCode());
    if(!room || room.status!=="waiting" || room.players.length<2) return;
    // ACAK OTOMATIS: urutan pemain diacak lalu dibagi selang-seling ke Tim A/B
    // supaya jumlah tiap tim tetap seimbang berapa pun jumlah pemainnya.
    const shuffled=[...room.players].sort(()=>Math.random()-0.5);
    room.teamA=[]; room.teamB=[]; room.pulls={};
    shuffled.forEach((p,i)=>{
      (i%2===0 ? room.teamA : room.teamB).push(p);
      room.pulls[p.id]=0;
    });
    room.status="playing";
    room.startedAt=Date.now();
    putRoom(room);
    renderTeacherPvpPanel();
  }

  function renderTeacherPvpPanel(){
    const s=session();
    if(!s || s.role!=="teacher") return;
    const noRoomBox=document.getElementById("teacherPvpNoRoom");
    const roomBox=document.getElementById("teacherPvpRoomBox");
    const classLabel=document.getElementById("pvpTeacherClassLabel");
    if(classLabel) classLabel.textContent=s.className;
    if(!noRoomBox || !roomBox) return;

    const code=getTeacherRoomCode();
    const room=getRoom(code);

    if(!room){
      setTeacherRoomCode(null);
      noRoomBox.classList.remove("hidden");
      roomBox.classList.add("hidden");
      const rc=document.getElementById("teacherRoomCount"); if(rc) rc.textContent="0";
      return;
    }

    noRoomBox.classList.add("hidden");
    roomBox.classList.remove("hidden");

    document.getElementById("pvpRoomCodeText").textContent=room.code;
    const badge=document.getElementById("pvpRoomStatusBadge");
    badge.textContent = room.status==="waiting" ? "Menunggu pemain" : room.status==="playing" ? "Sedang bertanding" : "Selesai";
    badge.classList.toggle("live", room.status==="playing");
    badge.classList.toggle("done", room.status==="finished");

    const listEl=document.getElementById("pvpTeacherPlayerList");
    if(room.status==="waiting"){
      listEl.innerHTML = room.players.length
        ? room.players.map(p=>`<span class="pvp-player-chip">${p.name}</span>`).join("")
        : `<span class="pvp-player-chip">Belum ada siswa bergabung</span>`;
    }else{
      listEl.innerHTML =
        room.teamA.map(p=>`<span class="pvp-player-chip team-a">🔵 ${p.name}</span>`).join("") +
        room.teamB.map(p=>`<span class="pvp-player-chip team-b">🔴 ${p.name}</span>`).join("");
    }

    const startBtn=document.getElementById("pvpStartBtn");
    startBtn.disabled = room.status!=="waiting" || room.players.length<2;
    startBtn.textContent = room.status==="waiting" ? "🎲 Acak Tim & Mulai" : "Sudah Dimulai";

    const liveBox=document.getElementById("pvpTeacherLiveBox");
    if(room.status==="waiting"){
      liveBox.classList.add("hidden");
    }else{
      liveBox.classList.remove("hidden");
      const {a,b}=computeScores(room);
      const pct=Math.max(-50,Math.min(50,((a-b)/ROPE_LIMIT)*50));
      const finishedLine = room.status==="finished"
        ? `<div class="pvp-live-row"><span>🏆 Tim ${room.winner} menang!</span><button id="pvpNewRoomAfterBtn" class="btn btn-outline" type="button">Buat Room Baru</button></div>`
        : "";
      liveBox.innerHTML = `
        <div class="pvp-live-row"><span>🔵 Tim A: ${a}</span><span>🔴 Tim B: ${b}</span></div>
        <div class="pvp-live-track"><div class="pvp-live-fill" style="left:calc(50% + ${pct}%)"></div></div>
        ${finishedLine}
      `;
      const afterBtn=document.getElementById("pvpNewRoomAfterBtn");
      if(afterBtn) afterBtn.addEventListener("click", closePvpRoom);
    }

    const rc=document.getElementById("teacherRoomCount");
    if(rc) rc.textContent = room.status==="finished" ? "0" : "1";
  }
  window.cerdasPvpRenderTeacherPanel = renderTeacherPvpPanel;

  /* ---------------- SISWA: gabung & bermain ---------------- */
  function studentRoomKey(){ const s=session(); return s ? `cerdasPlayStudentRoom:${s.id}` : null; }
  function getStudentRoomCode(){ const k=studentRoomKey(); return k ? sessionStorage.getItem(k) : null; }
  function setStudentRoomCode(code){ const k=studentRoomKey(); if(!k)return; if(code) sessionStorage.setItem(k,code); else sessionStorage.removeItem(k); }

  function joinPvpRoom(rawCode){
    const s=session();
    const code=String(rawCode||"").trim().toUpperCase();
    if(!code) throw new Error("Masukkan kode room.");
    const room=getRoom(code);
    if(!room) throw new Error("Kode room tidak ditemukan. Periksa kembali kode dari gurumu.");
    if(room.status==="finished") throw new Error("Room ini sudah selesai bermain.");
    // ISOLASI KELAS: siswa kelas lain tidak bisa ikut room kelas ini sama sekali.
    if(room.className !== s.className){
      throw new Error(`Room ini khusus kelas ${room.className}. Akunmu terdaftar di kelas ${s.className}, jadi tidak bisa bergabung.`);
    }
    if(room.status==="waiting"){
      if(!room.players.some(p=>p.id===s.id)){
        room.players.push({id:s.id, name:s.name});
        putRoom(room);
      }
    }else if(room.status==="playing"){
      const already = room.teamA.some(p=>p.id===s.id) || room.teamB.some(p=>p.id===s.id);
      if(!already) throw new Error("Pertandingan di room ini sudah dimulai tanpa kamu. Minta guru membuat room baru.");
    }
    setStudentRoomCode(code);
    return room;
  }

  function renderTugWarPage(){
    const s=session();
    if(!s || s.role!=="student") return;
    const waitingView=document.getElementById("tugWarWaiting");
    const playingView=document.getElementById("tugWarPlaying");
    const finishedView=document.getElementById("tugWarFinished");
    if(!waitingView || !playingView || !finishedView) return;

    const room=getRoom(getStudentRoomCode());

    if(!room){
      waitingView.classList.remove("hidden");
      playingView.classList.add("hidden");
      finishedView.classList.add("hidden");
      document.getElementById("tugWarWaitingCode").textContent="-----";
      document.getElementById("tugWarWaitingCount").textContent="0";
      document.getElementById("tugWarWaitingPlayers").innerHTML=`<span class="pvp-player-chip">Room sudah ditutup oleh guru.</span>`;
      return;
    }

    if(room.status==="waiting"){
      waitingView.classList.remove("hidden");
      playingView.classList.add("hidden");
      finishedView.classList.add("hidden");
      document.getElementById("tugWarWaitingCode").textContent=room.code;
      document.getElementById("tugWarWaitingCount").textContent=room.players.length;
      document.getElementById("tugWarWaitingPlayers").innerHTML=room.players.map(p=>
        `<span class="pvp-player-chip${p.id===s.id?' team-a':''}">${p.name}${p.id===s.id?' (kamu)':''}</span>`
      ).join("");
      return;
    }

    const myTeam = room.teamA.some(p=>p.id===s.id) ? "A" : room.teamB.some(p=>p.id===s.id) ? "B" : null;

    if(room.status==="playing"){
      waitingView.classList.add("hidden");
      playingView.classList.remove("hidden");
      finishedView.classList.add("hidden");
      document.getElementById("tugWarPlayingCode").textContent=room.code;
      document.getElementById("tugWarTeamA").innerHTML=room.teamA.map(p=>`<div>${p.name}${p.id===s.id?' (kamu)':''}</div>`).join("") || "<div>-</div>";
      document.getElementById("tugWarTeamB").innerHTML=room.teamB.map(p=>`<div>${p.name}${p.id===s.id?' (kamu)':''}</div>`).join("") || "<div>-</div>";
      const {a,b}=computeScores(room);
      document.getElementById("tugWarScoreA").textContent=a;
      document.getElementById("tugWarScoreB").textContent=b;
      const pct=Math.max(-45,Math.min(45,((a-b)/ROPE_LIMIT)*45));
      document.getElementById("tugWarRopeFlag").style.left=`calc(50% + ${pct}%)`;
      document.getElementById("tugWarYourTeamLabel").textContent = myTeam ? `Timmu: ${myTeam==="A"?"🔵 Tim A":"🔴 Tim B"}` : "Kamu hanya menonton";
      document.getElementById("tugWarPullBtn").disabled = !myTeam;
      return;
    }

    if(room.status==="finished"){
      waitingView.classList.add("hidden");
      playingView.classList.add("hidden");
      finishedView.classList.remove("hidden");
      const won = myTeam && myTeam===room.winner;
      document.getElementById("tugWarResultEmoji").textContent = won ? "🏆" : (myTeam ? "😅" : "🏁");
      document.getElementById("tugWarResultTitle").textContent = `Tim ${room.winner} Menang!`;
      document.getElementById("tugWarResultText").textContent = myTeam
        ? (won ? "Selamat, timmu menang berkat kerja sama yang kompak!" : "Belum beruntung kali ini — ayo coba lagi di room berikutnya!")
        : "Pertandingan telah selesai.";
    }
  }

  function pullRope(){
    const s=session();
    const room=getRoom(getStudentRoomCode());
    if(!s || !room || room.status!=="playing") return;
    const inA=room.teamA.some(p=>p.id===s.id);
    const inB=room.teamB.some(p=>p.id===s.id);
    if(!inA && !inB) return;
    room.pulls[s.id]=(room.pulls[s.id]||0)+1;
    const {rope}=computeScores(room);
    if(Math.abs(rope)>=ROPE_LIMIT){
      room.status="finished";
      room.winner = rope>0 ? "A" : "B";
      room.finishedAt=Date.now();
    }
    putRoom(room);
    renderTugWarPage();
  }

  function exitTugWar(){
    setStudentRoomCode(null);
    goHome();
  }

  /* ---------------- Pasang semua event setelah DOM siap ---------------- */
  function init(){
    document.getElementById("createPvpRoomBtn")?.addEventListener("click", createPvpRoom);
    document.getElementById("pvpStartBtn")?.addEventListener("click", startPvpRoom);
    document.getElementById("pvpCloseRoomBtn")?.addEventListener("click", ()=>{
      if(confirm("Tutup room ini? Semua siswa yang bergabung akan terputus.")) closePvpRoom();
    });

    // Guru bisa mencoba 3 game yang sama seperti siswa.
    document.getElementById("teacherOpenMathBtn")?.addEventListener("click", ()=>{
      if(typeof updateDashboardProgress==="function") updateDashboardProgress();
      showPage("levels");
    });
    document.getElementById("teacherOpenLogicBtn")?.addEventListener("click", ()=>{
      if(typeof startLogicGame==="function") startLogicGame(1);
      showPage("logic");
    });
    document.getElementById("teacherOpenPictureBtn")?.addEventListener("click", ()=>{
      if(typeof startPictureGame==="function") startPictureGame(1);
      showPage("picture");
    });

    document.getElementById("tugWarPullBtn")?.addEventListener("click", pullRope);
    document.getElementById("tugWarExitBtn")?.addEventListener("click", exitTugWar);
    document.getElementById("tugWarBackBtn")?.addEventListener("click", exitTugWar);
    document.getElementById("tugWarHome")?.addEventListener("click", (e)=>{ e.preventDefault(); exitTugWar(); });

    // Form "Join Room" lama cuma menampilkan alert placeholder. Node-nya
    // di-clone dulu (membuang listener lama) supaya hanya logika room yang
    // sungguhan ini yang berjalan saat submit.
    const oldRoomForm=document.getElementById("roomForm");
    if(oldRoomForm){
      const freshForm=oldRoomForm.cloneNode(true);
      oldRoomForm.parentNode.replaceChild(freshForm, oldRoomForm);
      freshForm.addEventListener("submit", (event)=>{
        event.preventDefault();
        const input=document.getElementById("roomCodeInput");
        const error=document.getElementById("roomError");
        error.textContent="";
        const s=session();
        try{
          if(!s || s.role!=="student") throw new Error("Hanya akun siswa yang dapat bergabung ke room PvP.");
          joinPvpRoom(input.value);
          document.getElementById("roomModal")?.classList.add("hidden");
          input.value="";
          renderTugWarPage();
          showPage("tug");
        }catch(err){
          error.textContent="⚠️ "+err.message;
        }
      });
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ---------------- Sinkronisasi semi-realtime ---------------- */
  function liveTick(){
    const s=session();
    if(!s) return;
    if(s.role==="teacher") renderTeacherPvpPanel();
    if(s.role==="student"){
      const tugPage=document.getElementById("tugWarPage");
      if(tugPage && !tugPage.classList.contains("hidden")) renderTugWarPage();
    }
  }
  window.addEventListener("storage", (e)=>{ if(e.key===ROOMS_KEY) liveTick(); });
  setInterval(liveTick, 1000);

})();
