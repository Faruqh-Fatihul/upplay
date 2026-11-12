/* ==================================================
       AKUN, SESSION & PORTAL
    =================================================== */
    /* Peta ID halaman dicari ULANG setiap showPage() dipanggil (bukan referensi statis),
       supaya section yang ditulis lebih bawah di HTML (mis. #crosswordGamePage) tetap
       ditemukan dengan benar. Ini memperbaiki bug lama: Level 3 TTS tidak pernah tampil
       karena elemen-nya belum ada di DOM saat dict lama dibuat. */
    const pageIds = {
      landing: "landingPage",
      dashboard: "studentDashboard",
      levels: "mathLevelsPage",
      snake: "snakeGamePage",
      memory: "memoryPage",
      crossword: "crosswordGamePage",
      logic: "logicGamePage",
      picture: "pictureGamePage",
      teacher: "teacherPortalPage",
      admin: "adminPortalPage",
      role: "simpleRolePage",
      tug: "tugWarPage",
      mathMaze: "mathMazePage",
      safeCracker: "safeCrackerPage"
    };

    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    const roomModal = document.getElementById("roomModal");
    const openLoginBtn = document.getElementById("openLoginBtn");
    const openRegisterBtn = document.getElementById("openRegisterBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const closeRegisterBtn = document.getElementById("closeRegisterBtn");

    const classData = {
      "5A":["Siswa 5A-01","Siswa 5A-02","Siswa 5A-03","Siswa 5A-04","Siswa 5A-05","Siswa 5A-06"],
      "5B":["Siswa 5B-01","Siswa 5B-02","Siswa 5B-03","Siswa 5B-04","Siswa 5B-05","Siswa 5B-06"],
      "5C":["Siswa 5C-01","Siswa 5C-02","Siswa 5C-03","Siswa 5C-04","Siswa 5C-05","Siswa 5C-06"],
      "5D":["Siswa 5D-01","Siswa 5D-02","Siswa 5D-03","Siswa 5D-04","Siswa 5D-05","Siswa 5D-06"],
      "6A":["Siswa 6A-01","Siswa 6A-02","Siswa 6A-03","Siswa 6A-04","Siswa 6A-05","Siswa 6A-06"],
      "6B":["Siswa 6B-01","Siswa 6B-02","Siswa 6B-03","Siswa 6B-04","Siswa 6B-05","Siswa 6B-06"],
      "6C":["Siswa 6C-01","Siswa 6C-02","Siswa 6C-03","Siswa 6C-04","Siswa 6C-05","Siswa 6C-06"],
      "6D":["Siswa 6D-01","Siswa 6D-02","Siswa 6D-03","Siswa 6D-04","Siswa 6D-05","Siswa 6D-06"]
    };

    const teacherData = {};
    [5,6].forEach(grade => ["A","B","C","D"].forEach(type => {
      const cls=`${grade}${type}`;
      /* Akun guru (8 akun, tanpa pendaftaran) kini disimpan di SERVER dalam bentuk hash.
         Di sini hanya id & nama untuk tampilan. Login guru memakai nama (contoh: "Guru 5A").
         Password dikelola admin/master di menu Data Guru. */
      teacherData[cls]=[1].map(i=>({
        id:`teacher-${cls}-${i}`,
        name:`Guru ${cls}`
      }));
    }));

    function getRegisteredStudents(){
      try { return JSON.parse(localStorage.getItem("cerdasPlayStudents") || "[]"); }
      catch { return []; }
    }
    function saveRegisteredStudents(list){
      localStorage.setItem("cerdasPlayStudents", JSON.stringify(list));
    }

    let currentSession = null;
    let activeStudentView = "dashboard";

    function getStoredSession(){
      try{return JSON.parse(sessionStorage.getItem("cerdasPlaySession")||"null");}catch{return null;}
    }
    function setSession(session){
      currentSession=session;
      window.currentSession=session; // beberapa skrip belakangan membaca window.currentSession,
                                      // sinkronkan supaya ID siswa yang dipakai selalu sama persis.
      sessionStorage.setItem("cerdasPlaySession",JSON.stringify(session));
    }
    function clearSession(){
      currentSession=null;
      window.currentSession=null;
      sessionStorage.removeItem("cerdasPlaySession");
    }

    function guardPage(pageName){
      if(pageName==="landing") return true;
      // Halaman pembelajaran (matematika/logika/tebak gambar) boleh dibuka
      // siswa MAUPUN guru — guru perlu bisa mencoba sendiri game yang akan
      // dimainkan muridnya. Halaman "dashboard" tetap khusus siswa.
      if(["levels","snake","memory","crossword","logic","picture","mathMaze","safeCracker"].includes(pageName)){
        return currentSession?.role==="student" || currentSession?.role==="teacher";
      }
      if(pageName==="dashboard") return currentSession?.role==="student";
      // Tarik Tambang PvP: dua-duanya boleh (guru memantau, siswa bermain).
      if(pageName==="tug") return currentSession?.role==="teacher";
      if(pageName==="teacher") return currentSession?.role==="teacher";
      if(pageName==="admin") return currentSession?.role==="admin";
      return false;
    }

    // Tombol back dari halaman game harus tahu kembali ke "dashboard" (siswa)
    // atau ke "teacher" (guru) — dipakai oleh skrip navigasi di akhir file.
    function homePageForSession(){
      if(currentSession?.role==="teacher") return "teacher";
      if(currentSession?.role==="student") return "dashboard";
      return "landing";
    }

    function showPage(pageName){
      /* Jaga-jaga: jika variabel session sempat kosong tapi sessionStorage masih ada,
         pulihkan dulu supaya guardPage tidak salah menolak navigasi (penyebab tombol
         back kadang terasa "tidak berfungsi"). */
      if(!currentSession){
        const restored=getStoredSession();
        if(restored) currentSession=restored;
      }

      if(!guardPage(pageName)){
        if(pageName!=="landing") alert("Akses ditolak. Silakan masuk dengan akun yang sesuai.");
        pageName=homePageForSession();
      }

      // Sembunyikan SEMUA halaman (.app-view), bukan hanya yang ada di pageIds,
      // supaya section baru yang ditambahkan di HTML tetap ikut tersembunyi/ditampilkan dengan benar.
      document.querySelectorAll(".app-view").forEach(page=>page.classList.add("hidden"));
      const targetPage=document.getElementById(pageIds[pageName]);
      if(targetPage) targetPage.classList.remove("hidden");

      window.scrollTo({top:0,behavior:"smooth"});
      if(pageName!=="snake" && pageName!=="memory" && pageName!=="logic" && pageName!=="picture" && pageName!=="crossword") { try{ stopGameTimer(); }catch(_e){} }

      if(pageName==="dashboard"){
        // Setiap kembali ke Dashboard, selalu tampilkan sub-menu "Dashboard" dulu
        // (bukan tersangkut di halaman "Profil").
        activeStudentView="dashboard";
        renderStudentPortal();
      }
      if(pageName==="teacher") renderTeacherPortal();
    }

    function openModal(){
      loginModal.classList.remove("hidden");
      const notice=document.getElementById("loginError");
      notice.textContent="";
      notice.classList.remove("success-message");
      document.getElementById("loginName").focus();
    }
    function closeModal(){
      loginModal.classList.add("hidden");
      const notice=document.getElementById("loginError");
      notice.textContent="";
      notice.classList.remove("success-message");
    }

    function openRegister(){
      registerModal.classList.remove("hidden");
      document.getElementById("registerError").textContent="";
      document.getElementById("registerName").focus();
    }
    function closeRegister(){registerModal.classList.add("hidden");document.getElementById("registerError").textContent="";}

    async function loginAutomatically(){
      const name=document.getElementById("loginName").value.trim();
      const password=document.getElementById("loginPassword").value;
      if(!name||!password) throw new Error("Nama dan password wajib diisi.");
      if(!window.__upSync) throw new Error("Tidak dapat terhubung ke server. Muat ulang halaman lalu coba lagi.");
      /* Login diproses di SERVER: password dicek terhadap hash, server mengembalikan sesi + token. */
      const res=await window.__upSync.request("POST","/auth/login",{name,password},true);
      if(!res.ok) throw new Error((res.data&&res.data.error)||"Gagal masuk. Coba lagi.");
      const session=res.data.session;
      setSession(session);
      window.__upSync.begin(); /* muat data milik akun ini dari server sebelum halaman ditampilkan */
      document.getElementById("loginPassword").value="";
      if(window.__upAfterLogin) window.__upAfterLogin(session);
      closeModal();
      showPage(session.role==="student"?"dashboard":session.role==="teacher"?"teacher":"admin");
    }

    document.getElementById("loginForm").addEventListener("submit",async event=>{
      event.preventDefault();
      const __e=document.getElementById("loginError");
      const __btn=event.target.querySelector('button[type="submit"]');
      if(__btn)__btn.disabled=true;
      try{await loginAutomatically();}
      catch(error){__e.classList.remove("success-message");__e.textContent="⚠️ "+error.message;}
      finally{if(__btn)__btn.disabled=false;}
    });

    document.getElementById("registerForm").addEventListener("submit",async event=>{
      event.preventDefault();
      const email=document.getElementById("registerEmail").value.trim();
      const name=document.getElementById("registerName").value.trim();
      const className=document.getElementById("registerClass").value;
      const password=document.getElementById("registerPassword").value;
      const confirm=document.getElementById("registerConfirmPassword").value;
      const error=document.getElementById("registerError");
      error.textContent="";

      if(!name || !className || !email){error.textContent="⚠️ Nama, kelas, dan surel wajib diisi.";return;}
      if(name.length<3||!/^[A-Za-z\u00C0-\u024F' .-]+$/.test(name)){error.textContent="⚠️ Nama minimal 3 huruf dan hanya berisi huruf, spasi, titik, atau tanda petik.";return;}
      if(!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email)){error.textContent="⚠️ Surel harus memakai akun Gmail, contoh: contoh@gmail.com";return;}
      {const __pw=window.__upPwCheck?window.__upPwCheck(password):(password.length<6?"Kata sandi minimal 6 karakter.":"");if(__pw){error.textContent="⚠️ "+__pw;return;}}
      if(password!==confirm){error.textContent="⚠️ Konfirmasi password tidak sama.";return;}

      const submitBtn=event.target.querySelector('button[type="submit"]');
      if(submitBtn)submitBtn.disabled=true;
      const res=window.__upSync
        ? await window.__upSync.request("POST","/auth/register",{name,email,className,password},true)
        : {ok:false,data:{error:"Tidak dapat terhubung ke server. Muat ulang halaman lalu coba lagi."}};
      if(submitBtn)submitBtn.disabled=false;
      if(!res.ok){error.textContent="⚠️ "+((res.data&&res.data.error)||"Pendaftaran gagal. Coba lagi.");return;}

      closeRegister();
      document.getElementById("loginName").value=name;
      document.getElementById("loginPassword").value="";
      openModal();
      const loginNotice=document.getElementById("loginError"); loginNotice.innerHTML='<span class="success-check">✓</span><span><strong>Pendaftaran berhasil. Silakan masukkan password yang baru dibuat.</strong></span>'; loginNotice.classList.add("success-message");
    });

    document.querySelectorAll(".toggle-password").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const input=document.getElementById(btn.dataset.target);
        if(!input)return;
        input.type=input.type==="password"?"text":"password";
        btn.textContent=input.type==="password"?"👁":"🙈";
      });
    });

    openLoginBtn.addEventListener("click",openModal);
    openRegisterBtn.addEventListener("click",openRegister);
    closeModalBtn.addEventListener("click",closeModal);
    closeRegisterBtn.addEventListener("click",closeRegister);

    loginModal.addEventListener("click",event=>{if(event.target===loginModal)closeModal();});
    registerModal.addEventListener("click",event=>{if(event.target===registerModal)closeRegister();});

    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"){
        if(!loginModal.classList.contains("hidden"))closeModal();
        if(!registerModal.classList.contains("hidden"))closeRegister();
        if(!roomModal.classList.contains("hidden"))roomModal.classList.add("hidden");
      }
    });

    function scoreKey() {
      return currentSession?.role === "student" ? `cerdasPlay:${currentSession.id}:scores` : null;
    }

    function readStudentScores() {
      if (!scoreKey()) return {};
      try { return JSON.parse(localStorage.getItem(scoreKey()) || "{}"); }
      catch { return {}; }
    }

    /* BACKEND: skor game mandiri siswa -> POST /api/students/:id/scores {game, level, score} */
    function saveStudentScore(game, score) {
      if (!currentSession || currentSession.role !== "student") return;
      const scores = readStudentScores();
      scores[game] = {score, updatedAt:new Date().toISOString()};
      localStorage.setItem(scoreKey(), JSON.stringify(scores));
      renderStudentScores();
    }

    function renderStudentScores() {
      if (!currentSession || currentSession.role !== "student") return;
      const scores = readStudentScores();
      const entries = Object.entries(scores);
      const tbody = document.getElementById("studentScoreTable");
      if (!entries.length) {
        tbody.innerHTML = `<tr><td>Belum ada permainan</td><td>-</td><td>Belum dimainkan</td></tr>`;
      } else {
        tbody.innerHTML = entries.map(([game,data]) =>
          `<tr><td>${game}</td><td><strong>${data.score}</strong></td><td>Sudah dimainkan</td></tr>`
        ).join("");
      }
      const values = entries.map(([,d]) => Number(d.score)).filter(Number.isFinite);
      document.getElementById("studentScoreStat").textContent = values.length ? Math.max(...values) : "-";
      document.getElementById("studentGameStat").textContent = entries.length;
      document.getElementById("scoreOwnerName").textContent = currentSession.name;
    }

    function renderStudentPortal() {
      if (!currentSession || currentSession.role !== "student") return;
      document.getElementById("studentSidebarName").textContent = currentSession.name;
      document.getElementById("studentSidebarClass").textContent = `Kelas ${currentSession.className}`;
      document.getElementById("studentGreetingName").textContent = currentSession.name;
      document.getElementById("studentClassStat").textContent = currentSession.className;
      document.getElementById("scoreOwnerName").textContent = currentSession.name;
      document.querySelectorAll(".student-menu").forEach(btn => btn.classList.toggle("active", btn.dataset.studentView === activeStudentView));
      document.querySelectorAll(".student-view").forEach(v => v.classList.add("hidden"));
      document.getElementById(`studentView${activeStudentView[0].toUpperCase()+activeStudentView.slice(1)}`).classList.remove("hidden");
      const title = {dashboard:"Dashboard",game:"Game Pembelajaran",nilai:"Nilai Saya",profile:"Profil Siswa"}[activeStudentView] || "Dashboard";
      document.getElementById("studentPageTitle").textContent = title;
      renderStudentScores();
      renderStudentGameAvailability();
    }

    document.querySelectorAll(".student-menu").forEach(btn => {
      btn.addEventListener("click", () => {
        // Catatan: dulu di sini ada pemanggilan window.cerdasStudentModernView("profile")
        // yang fungsinya tidak pernah didefinisikan di mana pun (dead code), sehingga
        // saat tombol "Profil" diklik, tampilan hanya berganti berkat skrip lain yang
        // kebetulan menimpanya. Sekarang renderStudentPortal() dipanggil langsung supaya
        // perpindahan Dashboard <-> Profil selalu konsisten dari satu sumber yang jelas.
        activeStudentView = btn.dataset.studentView === "profile" ? "profile" : "dashboard";
        renderStudentPortal();
      });
    });

    document.querySelectorAll("[data-open-student-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeStudentView = btn.dataset.openStudentView;
        renderStudentPortal();
      });
    });

    function logoutToLanding() {
      const finish=()=>{clearSession();activeStudentView="dashboard";showPage("landing");};
      /* kirim sisa perubahan ke server lalu hapus data akun ini dari perangkat (penting di komputer bersama) */
      if(window.__upSync&&window.__upSync.logout){window.__upSync.logout().then(finish,finish);}else{finish();}
    }

    document.getElementById("logoutBtn").addEventListener("click", logoutToLanding);
    document.getElementById("teacherLogoutBtn").addEventListener("click", logoutToLanding);
    document.getElementById("adminLogoutBtn").addEventListener("click", logoutToLanding);
    document.getElementById("dashboardHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });

    document.getElementById("joinRoomBtn").addEventListener("click", () => {
      if (currentSession?.role !== "student") return;
      roomModal.classList.remove("hidden");
      document.getElementById("roomCodeInput").focus();
    });
    document.getElementById("closeRoomModalBtn").addEventListener("click", () => roomModal.classList.add("hidden"));
    document.getElementById("roomForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const code = document.getElementById("roomCodeInput").value.trim().toUpperCase();
      const error = document.getElementById("roomError");
      if (!code) { error.textContent = "Masukkan kode room."; return; }
      error.textContent = "";
      roomModal.classList.add("hidden");
      alert(`Room ${code} berhasil diminta untuk akun ${currentSession.name}. Realtime lintas perangkat perlu backend/WebSocket.`);
    });

    function getClassGames(className) {
      try {
        const saved = JSON.parse(localStorage.getItem(`cerdasPlay:${className}:games`) || "null");
        return saved || {math:true, logic:true, picture:true};
      } catch { return {math:true, logic:true, picture:true}; }
    }

    function saveClassGames(className, games) {
      localStorage.setItem(`cerdasPlay:${className}:games`, JSON.stringify(games));
    }

    function renderStudentGameAvailability() {
      if (!currentSession || currentSession.role !== "student") return;
      const games = getClassGames(currentSession.className);
      const map = {math:"openMathBtn", logic:"openLogicBtn", picture:"openPictureBtn"};
      Object.entries(map).forEach(([key,id]) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle("hidden", !games[key]);
      });
    }

    // Siswa yang benar-benar terdaftar (dari form Daftar) khusus untuk satu kelas.
    // Ini menggantikan data contoh "classData" yang dulu dipakai di portal guru,
    // supaya wali kelas melihat murid NYATA di kelasnya, bukan nama contoh.
    function getClassStudents(className){
      return getRegisteredStudents().filter(s => s.className === className);
    }

    function renderTeacherPortal() {
      if (!currentSession || currentSession.role !== "teacher") return;
      const className = currentSession.className;
      const students = getClassStudents(className);

      document.getElementById("teacherPortalTitle").textContent = `Kelas ${className}`;
      document.getElementById("teacherPortalSubtitle").textContent = `${currentSession.name} • hanya akses ${className}`;
      document.getElementById("teacherClassChip").textContent = className;
      document.getElementById("teacherStudentCount").textContent = students.length;

      document.getElementById("teacherStudentList").innerHTML = students.length
        ? students.map(s =>
            `<div class="student-item"><strong>${s.name}</strong><small>No. Absen ${s.absen || "-"} • Nilai hanya terlihat oleh guru kelas ${className}</small></div>`
          ).join("")
        : `<div class="student-item"><strong>Belum ada siswa</strong><small>Siswa kelas ${className} yang mendaftar akan muncul di sini secara otomatis.</small></div>`;

      document.getElementById("teacherSidebarName").textContent = currentSession.name;
      document.getElementById("teacherSidebarClass").textContent = `Kelas ${className}`;
      document.getElementById("teacherGameCount").textContent = Object.values(getClassGames(className)).filter(Boolean).length;
      const roomCountEl = document.getElementById("teacherRoomCount");
      if (roomCountEl && typeof window.cerdasPvpActiveRoomForClass === "function") {
        roomCountEl.textContent = window.cerdasPvpActiveRoomForClass(className) ? 1 : 0;
      }

      renderTeacherScores();
      const games = getClassGames(className);
      document.querySelectorAll(".teacher-game-toggle").forEach(btn => {
        const enabled = games[btn.dataset.game];
        btn.classList.toggle("btn-primary", enabled);
        btn.classList.toggle("btn-secondary", !enabled);
      });

      if (typeof window.cerdasPvpRenderTeacherPanel === "function") window.cerdasPvpRenderTeacherPanel();
    }

    document.querySelectorAll(".teacher-game-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        if (currentSession?.role !== "teacher") return;
        const games = getClassGames(currentSession.className);
        const key = btn.dataset.game;
        games[key] = !games[key];
        saveClassGames(currentSession.className, games);
        renderTeacherPortal();
        btn.classList.toggle("btn-primary", games[key]);
        btn.classList.toggle("btn-secondary", !games[key]);
      });
    });

    document.querySelectorAll(".teacher-menu:not([data-teacher-vnext])").forEach(btn => {
      btn.addEventListener("click", () => {
        if (currentSession?.role !== "teacher") return;
        document.querySelectorAll(".teacher-menu").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.teacherTarget)?.scrollIntoView({behavior:"smooth", block:"start"});
      });
    });

    function renderTeacherScores(){
      if (!currentSession || currentSession.role !== "teacher") return;
      const cls=currentSession.className;
      const list=document.getElementById("teacherScoreList");
      const clsStudents=getClassStudents(cls);
      document.getElementById("teacherScoreClass").textContent=cls;

      if(!clsStudents.length){
        list.innerHTML = `<div class="student-item"><strong>Belum ada siswa</strong><small>Nilai akan tampil setelah siswa kelas ${cls} mendaftar dan bermain.</small></div>`;
        return;
      }

      list.innerHTML=clsStudents.map(s=>{
        let scores={};
        // Kunci skor memakai id asli siswa (student-...), sama persis dengan yang
        // dipakai saat siswa bermain (lihat scoreKey()), supaya nilai yang tampil
        // di portal guru benar-benar data nyata, bukan selalu "Belum bermain".
        try{scores=JSON.parse(localStorage.getItem(`cerdasPlay:${s.id}:scores`)||"{}")}catch{}
        const entries=Object.entries(scores);
        const vals=entries.map(([,d])=>Number(d?.score)).filter(Number.isFinite);
        const avg=vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
        return `<div class="student-item"><strong>${s.name}</strong><small>No. Absen ${s.absen||"-"} • ${avg===null?'Belum bermain':`${entries.length} game • Rata-rata nilai: ${avg}`}</small></div>`;
      }).join("");
    }

    const savedSession = getStoredSession();
    if (savedSession) {
      currentSession = savedSession;
      window.currentSession = savedSession; // lihat catatan di setSession()
      showPage(savedSession.role === "student" ? "dashboard" : savedSession.role);
    } else {
      showPage("landing");
    }

    /* ==================================================
       KOMPATIBILITAS NAVIGASI GAME
    =================================================== */
    document.getElementById("levelsHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });
    document.getElementById("snakeHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });
    document.getElementById("memoryHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });
    document.getElementById("logicHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });
    document.getElementById("pictureHome").addEventListener("click", (event) => { event.preventDefault(); showPage("dashboard"); });
    document.getElementById("backLogicDashboard").addEventListener("click", () => showPage("dashboard"));
    document.getElementById("backLogicIconBtn").addEventListener("click", () => showPage("dashboard"));

    /* ==================================================
       DASHBOARD DAN LEVEL
    =================================================== */
    const openMathBtn = document.getElementById("openMathBtn");
    const openLogicBtn = document.getElementById("openLogicBtn");
    const openPictureBtn = document.getElementById("openPictureBtn");
    const startSnakeGameBtn = document.getElementById("startSnakeGameBtn");
    const level2Btn = document.getElementById("level2Btn");
    const level2Card = document.getElementById("level2Card");
    const level2Number = document.getElementById("level2Number");
    const level3Btn = document.getElementById("level3Btn");
    const level3Card = document.getElementById("level3Card");
    const level3Number = document.getElementById("level3Number");
    const level4Btn = document.getElementById("level4Btn");
    const level4Card = document.getElementById("level4Card");
    const level4Number = document.getElementById("level4Number");
    const level5Btn = document.getElementById("level5Btn");
    const level5Card = document.getElementById("level5Card");
    const level5Number = document.getElementById("level5Number");

    function mathLevelDone(level){
      return (currentSession?.role==="student"||currentSession?.role==="teacher") &&
        localStorage.getItem(`cerdasPlay:${currentSession.id}:mathLevel${level}Completed`)==="true";
    }
    function markMathLevelDone(level){
      if(currentSession?.role!=="student"&&currentSession?.role!=="teacher") return;
      localStorage.setItem(`cerdasPlay:${currentSession.id}:mathLevel${level}Completed`,"true");
      updateDashboardProgress();
    }
    function updateLevelCard(card, numberEl, button, level, title){
      if(!card||!button||!numberEl)return;
      // Guru boleh mencoba semua level bebas (tanpa harus "menyelesaikan" level
      // sebelumnya) karena perannya mengecek materi, bukan bermain berjenjang.
      const isTeacher = false; /* V12: guru membuka level bertahap seperti siswa */
      const unlocked = isTeacher || level===1 || mathLevelDone(level-1);
      const done = mathLevelDone(level);
      card.classList.toggle("locked",!unlocked);
      card.classList.toggle("active",unlocked);
      numberEl.textContent = unlocked ? (done ? "✓" : String(level)) : "🔒";
      button.disabled = !unlocked;
      button.textContent = done ? `Mainkan Level ${level} ✓` : `Mainkan Level ${level}`;
      button.classList.toggle("btn-primary",unlocked);
      button.classList.toggle("btn-secondary",!unlocked);
      if(!unlocked) button.textContent=`Selesaikan Level ${level-1}`;
    }
    function updateDashboardProgress(){
      const completed=[1,2,3,4,5].filter(mathLevelDone).length;
      const progressBar=document.getElementById("dashboardProgress");
      const progressText=document.getElementById("dashboardProgressText");
      if(progressBar) progressBar.style.width=Math.max(20,completed*20)+"%";
      if(progressText) progressText.textContent=`${completed} dari 5 level matematika selesai`;
      updateLevelCard(document.getElementById("mathLevelCard1"),document.querySelector("#mathLevelCard1 .level-number"),startSnakeGameBtn,1);
      updateLevelCard(level2Card,level2Number,level2Btn,2);
      updateLevelCard(level3Card,level3Number,level3Btn,3);
      updateLevelCard(level4Card,level4Number,level4Btn,4);
      updateLevelCard(level5Card,level5Number,level5Btn,5);
    }

    openMathBtn.addEventListener("click", () => {
      updateDashboardProgress();
      showPage("levels");
    });

    openLogicBtn.addEventListener("click", () => {
      startLogicGame(1);
      showPage("logic");
    });

    openPictureBtn.addEventListener("click", () => {
      startPictureGame(1);
      showPage("picture");
    });

    document.getElementById("backPictureDashboard").addEventListener("click", () => showPage("dashboard"));
    document.getElementById("backPictureIconBtn").addEventListener("click", () => showPage("dashboard"));

    document.querySelectorAll(".back-dashboard").forEach((button) => {
      button.addEventListener("click", () => showPage("dashboard"));
    });

    startSnakeGameBtn.addEventListener("click", () => {
      resetSnakeGame(1);
      showPage("snake");
    });

    level2Btn.addEventListener("click", () => {
      if (!level2Btn.disabled) { startMemoryGame(2); showPage("memory"); }
    });

    level3Btn.addEventListener("click", () => {
      if (!level3Btn.disabled) {
        startCrossword();
        showPage("crossword");
        startLevelTimer("crossword");
      }
    });

    level4Btn.addEventListener("click", () => {
      if (!level4Btn.disabled) { resetSnakeGame(4); showPage("snake"); startGameTimer("snake"); }
    });

    level5Btn.addEventListener("click", () => {
      if (!level5Btn.disabled) { resetSnakeGame(5); showPage("snake"); startGameTimer("snake"); }
    });

    document.getElementById("backToLevelsBtn").addEventListener("click", () => {
      updateDashboardProgress();
      showPage("levels");
    });

    document.getElementById("backToLevelsIconBtn").addEventListener("click", () => {
      updateDashboardProgress();
      showPage("levels");
    });


    document.getElementById("backToLevelsFromMemory").addEventListener("click", () => {
      updateDashboardProgress();
      showPage("levels");
    });

    document.getElementById("backMemoryIconBtn").addEventListener("click", () => {
      updateDashboardProgress();
      showPage("levels");
    });

    document.getElementById("backLogicDashboard").addEventListener("click", () => {
      showPage("dashboard");
    });

    document.getElementById("backLogicIconBtn").addEventListener("click", () => {
      showPage("dashboard");
    });

    /* ==================================================
       GAME LOGIKA SEDERHANA
    =================================================== */
    const logicLevels = {
      1: [
        {
          text: "Lanjutkan pola berikut: 2, 4, 6, 8, ...",
          options: ["9", "10", "11", "12"],
          answer: 1,
          explanation: "Setiap angka bertambah 2, jadi setelah 8 adalah 10."
        },
        {
          text: "Rani lebih tinggi dari Budi. Budi lebih tinggi dari Sinta. Siapa yang paling pendek?",
          options: ["Rani", "Budi", "Sinta", "Tidak dapat diketahui"],
          answer: 2,
          explanation: "Urutannya dari tinggi ke pendek adalah Rani, Budi, lalu Sinta."
        },
        {
          text: "Manakah yang berbeda dari kelompok berikut?",
          options: ["Segitiga", "Persegi", "Lingkaran", "Kubus"],
          answer: 3,
          explanation: "Kubus adalah bangun ruang, sedangkan tiga lainnya adalah bangun datar."
        },
        {
          text: "Jika hari ini Senin, 3 hari lagi adalah hari ...",
          options: ["Selasa", "Rabu", "Kamis", "Jumat"],
          answer: 2,
          explanation: "Selasa hari ke-1, Rabu hari ke-2, dan Kamis hari ke-3."
        },
        {
          text: "Ada 3 kotak. Kotak A berisi lebih banyak bola daripada B. Kotak B lebih banyak daripada C. Kotak mana yang berisi paling sedikit?",
          options: ["Kotak A", "Kotak B", "Kotak C", "Semua sama"],
          answer: 2,
          explanation: "Jika A > B dan B > C, maka C adalah yang paling sedikit."
        }
      ],
      2: [
        {
          text: "Lanjutkan pola: 3, 6, 12, 24, ...",
          options: ["30", "36", "48", "54"],
          answer: 2,
          explanation: "Setiap angka dikali 2, jadi 24 × 2 = 48."
        },
        {
          text: "Dina memiliki 3 kartu: merah, biru, dan hijau. Kartu merah bukan yang pertama. Kartu hijau berada setelah kartu biru. Urutan yang mungkin adalah ...",
          options: ["Merah-Biru-Hijau", "Biru-Hijau-Merah", "Hijau-Biru-Merah", "Biru-Merah-Hijau"],
          answer: 1,
          explanation: "Biru harus sebelum hijau, dan merah bukan pertama. Jadi Biru-Hijau-Merah memenuhi semua petunjuk."
        },
        {
          text: "Semua burung memiliki sayap. Elang adalah burung. Kesimpulan yang tepat adalah ...",
          options: ["Elang memiliki sayap", "Semua yang bersayap adalah elang", "Elang tidak bisa terbang", "Burung bukan hewan"],
          answer: 0,
          explanation: "Karena elang termasuk burung dan semua burung memiliki sayap, elang memiliki sayap."
        },
        {
          text: "Budi lebih tua dari Andi. Andi lebih tua dari Cici. Dodi lebih muda dari Cici. Siapa yang paling muda?",
          options: ["Budi", "Andi", "Cici", "Dodi"],
          answer: 3,
          explanation: "Urutan usia dari tua ke muda: Budi, Andi, Cici, lalu Dodi."
        },
        {
          text: "Jika 5 pensil dibagi sama rata kepada 5 anak, setiap anak mendapat ...",
          options: ["0 pensil", "1 pensil", "2 pensil", "5 pensil"],
          answer: 1,
          explanation: "5 pensil ÷ 5 anak = 1 pensil untuk setiap anak."
        }
      ],
      3: [
        {
          text: "Pola: 1, 4, 9, 16, ... Angka berikutnya adalah ...",
          options: ["20", "24", "25", "30"],
          answer: 2,
          explanation: "Polanya adalah 1², 2², 3², 4², sehingga berikutnya 5² = 25."
        },
        {
          text: "Ada tiga anak: Ali, Beni, dan Caca. Ali bukan yang paling cepat. Beni lebih cepat dari Caca. Siapa yang paling cepat?",
          options: ["Ali", "Beni", "Caca", "Tidak dapat ditentukan"],
          answer: 1,
          explanation: "Ali bukan yang tercepat dan Beni lebih cepat dari Caca, sehingga Beni adalah yang paling cepat."
        },
        {
          text: "Sebuah angka lebih besar dari 20 tetapi lebih kecil dari 30. Angka itu genap dan angka satuannya 6. Angka tersebut adalah ...",
          options: ["22", "24", "26", "28"],
          answer: 2,
          explanation: "Angka antara 20 dan 30 yang memiliki angka satuan 6 adalah 26.",
        },
        {
          text: "Aku punya 4 sisi sama panjang dan 4 sudut siku-siku. Aku adalah ...",
          options: ["Segitiga", "Persegi", "Lingkaran", "Trapesium"],
          answer: 1,
          explanation: "Bangun dengan 4 sisi sama panjang dan 4 sudut siku-siku adalah persegi."
        },
        {
          text: "Jika semua buku di rak kiri lebih berat daripada buku di rak kanan, dan Buku X berada di rak kiri sedangkan Buku Y di rak kanan, maka ...",
          options: ["X lebih berat dari Y", "Y lebih berat dari X", "X dan Y pasti sama berat", "Tidak ada hubungan"],
          answer: 0,
          explanation: "Karena semua buku di rak kiri lebih berat daripada buku di rak kanan, X lebih berat daripada Y."
        }
      ]
 ,
      4: [
        {text:"Jika 4 anak masing-masing membawa 3 buku, berapa jumlah buku semuanya?",options:["7","10","12","14"],answer:2,explanation:"4 × 3 = 12 buku."},
        {text:"Urutan dari terkecil: 0,2,4,6. Angka berikutnya adalah ...",options:["7","8","9","10"],answer:1,explanation:"Pola bertambah 2, jadi jawabannya 8."},
        {text:"Ani datang sebelum Beni. Cici datang setelah Beni. Siapa yang berada di tengah?",options:["Ani","Beni","Cici","Tidak diketahui"],answer:1,explanation:"Urutannya Ani, Beni, Cici."},
        {text:"Sebuah jam menunjukkan pukul 07.00. Dua jam kemudian pukul ...",options:["08.00","09.00","10.00","11.00"],answer:1,explanation:"07.00 + 2 jam = 09.00."},
        {text:"Jika semua apel adalah buah dan benda X adalah apel, maka X adalah ...",options:["Sayur","Buah","Minuman","Tidak diketahui"],answer:1,explanation:"Karena apel termasuk buah, X juga buah."}
      ],
      5: [
        {text:"Pola: 5, 10, 20, 40, ...",options:["45","50","60","80"],answer:3,explanation:"Setiap angka dikali 2, jadi 40 × 2 = 80."},
        {text:"Dina lebih tua dari Eko. Fajar lebih muda dari Eko. Siapa yang paling muda?",options:["Dina","Eko","Fajar","Tidak dapat diketahui"],answer:2,explanation:"Urutan usia Dina, Eko, lalu Fajar."},
        {text:"Ada 12 permen dibagi sama rata kepada 4 anak. Masing-masing mendapat ...",options:["2","3","4","6"],answer:1,explanation:"12 ÷ 4 = 3."},
        {text:"Semua burung pada aturan ini memiliki sayap. Elang adalah burung. Maka elang memiliki ...",options:["Sirip","Sayap","Tanduk","Belalai"],answer:1,explanation:"Elang termasuk burung, sehingga memiliki sayap."},
        {text:"Jika hari ini Rabu, 10 hari lagi adalah hari ...",options:["Jumat","Sabtu","Minggu","Senin"],answer:1,explanation:"10 hari setelah Rabu jatuh pada Sabtu."}
      ]
    };

    let logicCurrentLevel = 1;
    let logicQuestionIndex = 0;
    let logicScore = 0;
    let logicAnswered = false;
    const logicCompleted = {};
    for(let i=1;i<=5;i++) logicCompleted[i]=localStorage.getItem(`cerdasPlayLogicLevel${i}`)==="true";

    const logicQuestionText = document.getElementById("logicQuestionText");
    const logicOptions = document.getElementById("logicOptions");
    const logicFeedback = document.getElementById("logicFeedback");
    const logicScoreText = document.getElementById("logicScore");
    const logicQuestionNumber = document.getElementById("logicQuestionNumber");
    const logicProgressFill = document.getElementById("logicProgressFill");
    const logicNextBtn = document.getElementById("logicNextBtn");
    const logicQuestionArea = document.getElementById("logicQuestionArea");
    const logicResult = document.getElementById("logicResult");

    function updateLogicLevelButtons() {
      document.querySelectorAll(".logic-level-btn").forEach((button) => {
        const level = Number(button.dataset.logicLevel);
        const unlocked = level === 1 || logicCompleted[level - 1];
        button.disabled = !unlocked;
        button.classList.toggle("active", level === logicCurrentLevel);

        const title = button.querySelector("strong");
        const labels={2:"🧩 Level 2: Menengah",3:"🎯 Level 3: Strategi",4:"🔥 Level 4: Ahli",5:"🏆 Level 5: Master"};
        if(labels[level]) title.textContent=unlocked?labels[level]:labels[level]+" 🔒";
      });
    }

    function startLogicGame(level) {
      startGameTimer("logic");
      logicCurrentLevel = level;
      logicQuestionIndex = 0;
      logicScore = 0;
      logicAnswered = false;

      document.getElementById("logicGameTitle").textContent =
        level === 1 ? "🧠 Tantangan Logika Pemula" :
        level === 2 ? "🧩 Tantangan Logika Menengah" :
        level === 3 ? "🎯 Tantangan Logika Strategi" :
        level === 4 ? "🔥 Tantangan Logika Ahli" :
        "🏆 Tantangan Logika Master";

      document.getElementById("logicGameSubtitle").textContent =
        "Baca petunjuk dengan teliti, lalu pilih jawaban yang paling tepat.";

      logicResult.classList.add("hidden");
      logicQuestionArea.classList.remove("hidden");
      logicScoreText.textContent = "0";
      updateLogicLevelButtons();
      renderLogicQuestion();
    }

    function renderLogicQuestion() {
      const questions = logicLevels[logicCurrentLevel];
      const question = questions[logicQuestionIndex];

      logicAnswered = false;
      logicQuestionNumber.textContent = logicQuestionIndex + 1;
      logicQuestionText.textContent = question.text;
      logicFeedback.textContent = "Pilih salah satu jawaban untuk melanjutkan.";
      logicNextBtn.disabled = true;
      logicNextBtn.textContent =
        logicQuestionIndex === questions.length - 1
          ? "Lihat Hasil 🏆"
          : "Soal Berikutnya →";

      logicOptions.innerHTML = "";

      question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "logic-option";
        button.textContent = option;
        button.addEventListener("click", () => answerLogicQuestion(index, button));
        logicOptions.appendChild(button);
      });

      logicProgressFill.style.width =
        (logicQuestionIndex / questions.length) * 100 + "%";
    }

    function answerLogicQuestion(selectedIndex, selectedButton) {
      if (logicAnswered) return;
      logicAnswered = true;

      const question = logicLevels[logicCurrentLevel][logicQuestionIndex];
      const optionButtons = [...logicOptions.querySelectorAll(".logic-option")];

      optionButtons.forEach((button) => {
        button.disabled = true;
      });

      const isCorrect = question.overrideCorrect !== false && selectedIndex === question.answer;

      if (isCorrect) {
        logicScore += 20;
        selectedButton.classList.add("correct");
        logicFeedback.textContent = "🎉 Benar! " + question.explanation;
      } else {
        selectedButton.classList.add("wrong");
        optionButtons[question.answer]?.classList.add("correct");
        logicFeedback.textContent = "💡 Belum tepat. " + question.explanation;
      }

      logicScoreText.textContent = logicScore;
      logicNextBtn.disabled = false;
      logicProgressFill.style.width =
        ((logicQuestionIndex + 1) / logicLevels[logicCurrentLevel].length) * 100 + "%";
    }

    function showLogicResult() {
      const level = logicCurrentLevel;
      saveStudentScore(`Logika Level ${level}`, logicScore);
      logicCompleted[level] = true;
      localStorage.setItem("cerdasPlayLogicLevel" + level, "true");

      if (level < 5) {
        logicCompleted[level + 1] = logicCompleted[level + 1] || false;
      }

      const message =
        logicScore === 100 ? "Luar biasa! Semua jawabanmu benar." :
        logicScore >= 60 ? "Hebat! Kamu sudah memahami sebagian besar tantangan." :
        "Tetap semangat! Coba lagi dan baca setiap petunjuk dengan teliti.";

      logicQuestionArea.classList.add("hidden");
      logicResult.classList.remove("hidden");
      logicResult.innerHTML = `
        <div class="result-emoji">${logicScore === 100 ? "🏆" : logicScore >= 60 ? "🌟" : "💪"}</div>
        <h2>Level ${level} selesai!</h2>
        <p>Skormu <strong>${logicScore}/100</strong>. ${message}</p>
        <button id="logicRetryBtn" class="btn btn-primary">🔄 Main Lagi</button>
        ${level < 5 ? `<button id="logicNextLevelBtn" class="btn btn-success" style="margin-left:8px;">Level Berikutnya →</button>` : ""}
      `;

      document.getElementById("logicRetryBtn").addEventListener("click", () => startLogicGame(level));

      if (level < 3) {
        document.getElementById("logicNextLevelBtn").addEventListener("click", () => {
          startLogicGame(level + 1);
        });
      }

      updateLogicLevelButtons();
    }

    logicNextBtn.addEventListener("click", () => {
      if (logicQuestionIndex < logicLevels[logicCurrentLevel].length - 1) {
        logicQuestionIndex++;
        renderLogicQuestion();
      } else {
        showLogicResult();
      }
    });

    document.querySelectorAll(".logic-level-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const level = Number(button.dataset.logicLevel);
        const unlocked = level === 1 || logicCompleted[level - 1];

        if (unlocked) {
          startLogicGame(level);
        }
      });
    });

    /* ==================================================
       GAME TEBAK GAMBAR
    =================================================== */
    const pictureLevels = {
      1: [
        {subject:"IPA", visual:"🌱 ☀️ 💧", clue:"Tumbuhan menggunakan cahaya matahari dan air untuk membuat makanan. Proses apakah ini?", options:["Fotosintesis","Evaporasi","Erosi","Kondensasi"], answer:0, explanation:"Tumbuhan membuat makanan dengan bantuan cahaya matahari melalui fotosintesis."},
        {subject:"IPS", visual:"🗺️ 🧭", clue:"Benda ini membantu kita mengetahui lokasi dan arah. Apa yang dimaksud?", options:["Peta dan kompas","Termometer","Mikroskop","Jam pasir"], answer:0, explanation:"Peta menunjukkan lokasi, sedangkan kompas membantu menentukan arah."},
        {subject:"PPKn", visual:"🇮🇩 🦅", clue:"Lambang negara Indonesia pada gambar adalah ...", options:["Garuda Pancasila","Bhinneka Tunggal Ika","Burung Cenderawasih","Merah Putih"], answer:0, explanation:"Garuda Pancasila adalah lambang negara Indonesia."},
        {subject:"Bahasa Indonesia", visual:"📖 ✏️", clue:"Kegiatan pada gambar paling dekat dengan kegiatan ...", options:["Membaca dan menulis","Bermain sepak bola","Berkebun","Memasak"], answer:0, explanation:"Buku dan pensil merupakan alat yang umum digunakan untuk membaca dan menulis."},
        {subject:"IPA", visual:"💧 ☁️ 🌧️", clue:"Urutan gambar menunjukkan air yang menguap, membentuk awan, lalu turun sebagai hujan. Ini adalah ...", options:["Siklus air","Rantai makanan","Daur hidup","Fotosintesis"], answer:0, explanation:"Penguapan, pembentukan awan, dan hujan merupakan bagian dari siklus air."}
      ],
      2: [
        {subject:"IPA", visual:"🫁 👃 💨", clue:"Gambar menunjukkan organ yang bekerja mengambil oksigen dan mengeluarkan karbon dioksida. Sistem apakah ini?", options:["Pernapasan","Pencernaan","Peredaran darah","Gerak"], answer:0, explanation:"Hidung dan paru-paru bekerja dalam sistem pernapasan."},
        {subject:"IPS", visual:"🌾 🍚 🍽️", clue:"Dari gambar, bahan makanan pokok ini berasal dari tanaman ...", options:["Padi","Jagung","Kedelai","Kelapa"], answer:0, explanation:"Padi diolah menjadi beras, kemudian menjadi nasi."},
        {subject:"PPKn", visual:"🗣️ 🤝 👨‍👩‍👧‍👦", clue:"Berdiskusi bersama untuk mencapai keputusan yang disepakati disebut ...", options:["Musyawarah","Persaingan","Perkelahian","Pelanggaran"], answer:0, explanation:"Musyawarah dilakukan untuk membahas masalah dan mencapai kesepakatan bersama."},
        {subject:"IPA", visual:"♻️ 🗑️ 🌳", clue:"Memilah sampah dan menggunakan kembali barang merupakan contoh menjaga ...", options:["Lingkungan","Kecepatan","Ketinggian","Suhu"], answer:0, explanation:"Mengurangi dan memilah sampah membantu menjaga kebersihan lingkungan."},
        {subject:"IPS", visual:"🏝️ 🌊 🇮🇩", clue:"Indonesia memiliki banyak pulau. Negara dengan kondisi seperti ini disebut negara ...", options:["Kepulauan","Gurun","Kutub","Benua"], answer:0, explanation:"Indonesia dikenal sebagai negara kepulauan karena terdiri atas banyak pulau."}
      ],
      3: [
        {subject:"IPA", visual:"🐛 🦋 🌼", clue:"Ulat berubah menjadi kepompong lalu menjadi kupu-kupu. Peristiwa ini disebut ...", options:["Metamorfosis sempurna","Fotosintesis","Adaptasi","Evaporasi"], answer:0, explanation:"Kupu-kupu mengalami metamorfosis sempurna: telur, larva, pupa, lalu dewasa."},
        {subject:"IPS", visual:"🌋 🏔️ 🔥", clue:"Gunung yang dapat mengeluarkan lava, abu, dan gas disebut ...", options:["Gunung api","Bukit","Lembah","Dataran rendah"], answer:0, explanation:"Gunung api dapat mengalami erupsi dan mengeluarkan material vulkanik."},
        {subject:"IPA", visual:"☀️ 💧 ☁️ 🌧️", clue:"Cahaya matahari memanaskan air, air menguap, lalu membentuk awan dan turun sebagai hujan. Proses ini adalah ...", options:["Siklus air","Rantai makanan","Metamorfosis","Pelapukan"], answer:0, explanation:"Rangkaian penguapan, kondensasi, dan hujan merupakan siklus air."},
        {subject:"Bahasa Indonesia", visual:"😊 ❤️ 👍", clue:"Jika gambar menunjukkan perasaan senang, kata yang paling tepat adalah ...", options:["Gembira","Sedih","Marah","Takut"], answer:0, explanation:"Gembira merupakan kata yang bermakna senang atau bahagia."},
        {subject:"PPKn", visual:"🤝 ⚖️ 👥", clue:"Gambar menunjukkan memperlakukan semua orang secara seimbang dan tidak membeda-bedakan. Sikap ini disebut ...", options:["Adil","Egois","Ceroboh","Boros"], answer:0, explanation:"Bersikap adil berarti memperlakukan orang lain secara seimbang dan sesuai haknya."}
      ]
 ,
      4: [
        {subject:"IPA",visual:"🌳 🐛 🐦",clue:"Urutan makhluk hidup yang saling memakan disebut ...",options:["Rantai makanan","Siklus air","Daur hidup","Fotosintesis"],answer:0,explanation:"Hubungan makan dan dimakan dalam ekosistem membentuk rantai makanan."},
        {subject:"IPS",visual:"🏪 💰 🛒",clue:"Kegiatan membeli dan menggunakan barang untuk memenuhi kebutuhan disebut ...",options:["Produksi","Konsumsi","Distribusi","Migrasi"],answer:1,explanation:"Konsumsi adalah kegiatan menggunakan barang atau jasa."},
        {subject:"PPKn",visual:"🤝 🇮🇩",clue:"Bekerja bersama untuk kepentingan bersama merupakan contoh ...",options:["Gotong royong","Persaingan","Pertengkaran","Pengasingan"],answer:0,explanation:"Gotong royong berarti bekerja bersama untuk mencapai tujuan bersama."},
        {subject:"Bahasa Indonesia",visual:"📰 🔎",clue:"Teks yang berisi informasi tentang suatu peristiwa disebut ...",options:["Berita","Puisi","Dongeng","Pantun"],answer:0,explanation:"Berita menyampaikan informasi mengenai suatu peristiwa."},
        {subject:"IPA",visual:"🌡️ ☀️",clue:"Alat untuk mengukur suhu adalah ...",options:["Barometer","Termometer","Kompas","Mikroskop"],answer:1,explanation:"Termometer digunakan untuk mengukur suhu."}
      ],
      5: [
        {subject:"IPA",visual:"🌙 🌍 ☀️",clue:"Peristiwa bumi mengelilingi matahari disebut ...",options:["Rotasi","Revolusi","Evaporasi","Kondensasi"],answer:1,explanation:"Bumi mengelilingi matahari dalam gerak revolusi."},
        {subject:"IPS",visual:"🏝️ 🗺️",clue:"Gambaran permukaan bumi pada bidang datar disebut ...",options:["Peta","Termometer","Kamus","Kalender"],answer:0,explanation:"Peta menggambarkan permukaan bumi pada bidang datar dengan skala tertentu."},
        {subject:"PPKn",visual:"⚖️ 🤝",clue:"Menghargai perbedaan suku, budaya, dan agama merupakan sikap ...",options:["Toleransi","Egois","Acuh","Memaksa"],answer:0,explanation:"Toleransi berarti menghargai perbedaan yang ada."},
        {subject:"Bahasa Indonesia",visual:"💬 ✍️",clue:"Kalimat yang digunakan untuk meminta informasi disebut kalimat ...",options:["Tanya","Perintah","Berita","Seru"],answer:0,explanation:"Kalimat tanya digunakan untuk memperoleh informasi."},
        {subject:"IPA",visual:"❤️ 🩸",clue:"Organ yang memompa darah ke seluruh tubuh adalah ...",options:["Paru-paru","Jantung","Lambung","Ginjal"],answer:1,explanation:"Jantung memompa darah agar beredar ke seluruh tubuh."}
      ]
    };

    let pictureCurrentLevel=1, pictureQuestionIndex=0, pictureScore=0, pictureAnswered=false;
    const pictureCompleted={};
    for(let i=1;i<=5;i++) pictureCompleted[i]=localStorage.getItem(`cerdasPlayPictureLevel${i}`)==="true";
    const pictureVisual=document.getElementById("pictureVisual"), pictureClue=document.getElementById("pictureClue"), pictureOptions=document.getElementById("pictureOptions"), pictureFeedback=document.getElementById("pictureFeedback"), pictureScoreText=document.getElementById("pictureScore"), pictureQuestionNumber=document.getElementById("pictureQuestionNumber"), pictureProgressFill=document.getElementById("pictureProgressFill"), pictureNextBtn=document.getElementById("pictureNextBtn"), pictureResult=document.getElementById("pictureResult"), pictureQuestionArea=document.getElementById("pictureQuestionArea");

    function updatePictureLevelButtons(){
      document.querySelectorAll(".picture-level-btn").forEach(btn=>{
        const level=Number(btn.dataset.pictureLevel), unlocked=level===1||pictureCompleted[level-1];
        btn.disabled=!unlocked; btn.classList.toggle("active",level===pictureCurrentLevel);
        const title=btn.querySelector("strong");
        const labels={2:"🧩 Level 2: Petualang",3:"🎯 Level 3: Detektif",4:"🔥 Level 4: Ahli",5:"🏆 Level 5: Master"};
        if(labels[level]) title.textContent=unlocked?labels[level]:labels[level]+" 🔒";
      });
    }

    function startPictureGame(level){
      startGameTimer("picture");
      pictureCurrentLevel=level; pictureQuestionIndex=0; pictureScore=0; pictureAnswered=false;
      document.getElementById("pictureGameTitle").textContent=level===1?"🔍 Tebak Apa Ini?":level===2?"🧩 Tebak Lebih Jeli!":level===3?"🎯 Detektif Gambar":level===4?"🔥 Ahli Gambar":"🏆 Master Gambar";
      document.getElementById("pictureGameSubtitle").textContent="Amati gambar, baca petunjuk, lalu pilih jawabanmu.";
      pictureScoreText.textContent="0"; pictureResult.classList.add("hidden"); pictureQuestionArea.classList.remove("hidden");
      updatePictureLevelButtons(); renderPictureQuestion();
    }

    function renderPictureQuestion(){
      const q=pictureLevels[pictureCurrentLevel][pictureQuestionIndex]; pictureAnswered=false;
      document.getElementById("pictureSubjectTag").textContent=q.subject; pictureVisual.textContent=q.visual; pictureClue.textContent=q.clue;
      pictureQuestionNumber.textContent=pictureQuestionIndex+1; pictureFeedback.textContent="Pilih jawaban yang paling tepat."; pictureNextBtn.disabled=true;
      pictureNextBtn.textContent=pictureQuestionIndex===4?"Lihat Hasil 🏆":"Soal Berikutnya →"; pictureOptions.innerHTML="";
      q.options.forEach((opt,i)=>{const b=document.createElement("button"); b.className="picture-option"; b.textContent=opt; b.addEventListener("click",()=>answerPictureQuestion(i,b)); pictureOptions.appendChild(b);});
      pictureProgressFill.style.width=(pictureQuestionIndex/5*100)+"%";
    }

    function answerPictureQuestion(selected,button){
      if(pictureAnswered)return; pictureAnswered=true; const q=pictureLevels[pictureCurrentLevel][pictureQuestionIndex]; const buttons=[...pictureOptions.children]; buttons.forEach(b=>b.disabled=true);
      if(selected===q.answer){pictureScore+=20; button.classList.add("correct"); pictureFeedback.textContent="🎉 Benar! "+q.explanation;}
      else{button.classList.add("wrong"); buttons[q.answer].classList.add("correct"); pictureFeedback.textContent="💡 Belum tepat. "+q.explanation;}
      pictureScoreText.textContent=pictureScore; pictureNextBtn.disabled=false; pictureProgressFill.style.width=((pictureQuestionIndex+1)/5*100)+"%";
    }

    function showPictureResult(){
      const level=pictureCurrentLevel; saveStudentScore(`Tebak Gambar Level ${level}`, pictureScore); pictureCompleted[level]=true; localStorage.setItem("cerdasPlayPictureLevel"+level,"true");
      const message=pictureScore===100?"Luar biasa! Kamu jeli sekali.":pictureScore>=60?"Hebat! Kamu sudah mengenali banyak konsep.":"Tetap semangat! Coba lagi dan perhatikan petunjuknya.";
      pictureQuestionArea.classList.add("hidden"); pictureResult.classList.remove("hidden");
      pictureResult.innerHTML=`<div class="result-emoji">${pictureScore===100?"🏆":pictureScore>=60?"🌟":"💪"}</div><h2>Level ${level} selesai!</h2><p>Skormu <strong>${pictureScore}/100</strong>. ${message}</p><button id="pictureRetryBtn" class="btn btn-primary">🔄 Main Lagi</button>${level<5?`<button id="pictureNextLevelBtn" class="btn btn-success" style="margin-left:8px;">Level Berikutnya →</button>`:""}`;
      document.getElementById("pictureRetryBtn").addEventListener("click",()=>startPictureGame(level));
      if(level<5) document.getElementById("pictureNextLevelBtn").addEventListener("click",()=>startPictureGame(level+1));
      updatePictureLevelButtons();
    }

    pictureNextBtn.addEventListener("click",()=>{if(pictureQuestionIndex<4){pictureQuestionIndex++;renderPictureQuestion();}else showPictureResult();});
    document.querySelectorAll(".picture-level-btn").forEach(btn=>btn.addEventListener("click",()=>{const level=Number(btn.dataset.pictureLevel);if(level===1||pictureCompleted[level-1])startPictureGame(level);}));

    /* ==================================================
       DATA ULAR TANGGA
    =================================================== */
    const ladders = { 3: 8, 6: 14, 11: 19 };

    const snakes = { 17: 10, 23: 15 };

    const normalQuestions = [
      { text: "12 × 4 = ...", answer: 48 },
      { text: "144 ÷ 12 = ...", answer: 12 },
      { text: "25 + 37 = ...", answer: 62 },
      { text: "90 - 36 = ...", answer: 54 },
      { text: "15 × 6 = ...", answer: 90 },
      { text: "72 ÷ 8 = ...", answer: 9 },
      { text: "125 + 75 = ...", answer: 200 },
      { text: "9 × 9 = ...", answer: 81 },
      { text: "250 - 125 = ...", answer: 125 },
      { text: "56 ÷ 7 = ...", answer: 8 }
    ];

    const hardQuestions = [
      { text: "Sebuah persegi panjang memiliki panjang 12 cm dan lebar 8 cm. Berapa luasnya?", answer: 96 },
      { text: "3/4 dari 120 adalah ...", answer: 90 },
      { text: "Keliling persegi dengan sisi 15 cm adalah ... cm.", answer: 60 },
      { text: "Jika 6 buku berharga Rp42.000, harga satu buku adalah ... rupiah.", answer: 7000 },
      { text: "Rata-rata dari 12, 16, 20, dan 24 adalah ...", answer: 18 },
      { text: "2,5 jam sama dengan ... menit.", answer: 150 }
    ];

    let playerPosition = 1;
    let correctAnswers = 0;
    let snakeGameLevel = 1;
    let currentQuestion = null;
    let currentQuestionType = "normal";
    let diceUnlocked = false;
    let isMoving = false;

    const snakeBoard = document.getElementById("snakeBoard");
    const boardSvg = document.getElementById("boardSvg");
    const playerToken = document.getElementById("playerToken");
    const questionLabel = document.getElementById("questionLabel");
    const questionText = document.getElementById("questionText");
    const answerInput = document.getElementById("answerInput");
    const checkAnswerBtn = document.getElementById("checkAnswerBtn");
    const rollDiceBtn = document.getElementById("rollDiceBtn");
    const diceDisplay = document.getElementById("diceDisplay");
    const diceValueText = diceDisplay.querySelector(".dice-value");
    const gameMessage = document.getElementById("gameMessage");
    const positionText = document.getElementById("positionText");
    const correctText = document.getElementById("correctText");

    function tampilkanDadu(nilai) {
      diceDisplay.classList.remove(
        "show-1",
        "show-2",
        "show-3",
        "show-4",
        "show-5",
        "show-6"
      );

      if (!nilai) {
        diceValueText.textContent = "?";
        return;
      }

      diceDisplay.classList.add(`show-${nilai}`);
      diceValueText.textContent = nilai;
    }

    function getCoordinate(position) {
  const index = position - 1;
  const rowFromBottom = Math.floor(index / 5);
  const columnInRow = index % 5;

  /*
    Baris bawah:
    1 2 3 4 5 6 7 8 9 10

    Baris kedua:
    20 19 18 17 16 15 14 13 12 11

    Baris ketiga:
    21 22 23 24 25 26 27 28 29 30
  */
  const rowFromTop = 4 - rowFromBottom;

  let column = columnInRow;

  if (rowFromBottom % 2 === 1) {
    column = 4 - columnInRow;
  }

  return {
    x: column * 100 + 50,
    y: rowFromTop * 100 + 50
  };
}

    function drawLadder(start, end) {
      const a = getCoordinate(start);
      const b = getCoordinate(end);

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / length) * 15;
      const offsetY = (dx / length) * 15;

      let ladderSvg = `
        <g>
          <line x1="${a.x + offsetX}" y1="${a.y + offsetY}"
                x2="${b.x + offsetX}" y2="${b.y + offsetY}"
                stroke="#8c5526" stroke-width="12" stroke-linecap="round"/>
          <line x1="${a.x - offsetX}" y1="${a.y - offsetY}"
                x2="${b.x - offsetX}" y2="${b.y - offsetY}"
                stroke="#8c5526" stroke-width="12" stroke-linecap="round"/>
      `;

      const steps = Math.max(3, Math.floor(length / 60));

      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x1 = a.x + offsetX + (b.x - a.x) * t;
        const y1 = a.y + offsetY + (b.y - a.y) * t;
        const x2 = a.x - offsetX + (b.x - a.x) * t;
        const y2 = a.y - offsetY + (b.y - a.y) * t;

        ladderSvg += `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                stroke="#dca560" stroke-width="9" stroke-linecap="round"/>
        `;
      }

      ladderSvg += `</g>`;
      return ladderSvg;
    }

    function drawSnake(start, end, index) {
      const a = getCoordinate(start);
      const b = getCoordinate(end);

      const midX = (a.x + b.x) / 2 + (index % 2 === 0 ? 70 : -70);
      const midY = (a.y + b.y) / 2 + 30;

      return `
        <g>
          <path
            d="M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}"
            fill="none"
            stroke="#d63d4d"
            stroke-width="27"
            stroke-linecap="round"
          />
          <path
            d="M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}"
            fill="none"
            stroke="#ff7880"
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray="5 24"
          />
          <circle cx="${a.x}" cy="${a.y}" r="29" fill="#ef5964" />
          <circle cx="${a.x - 10}" cy="${a.y - 6}" r="4.5" fill="white" />
          <circle cx="${a.x + 10}" cy="${a.y - 6}" r="4.5" fill="white" />
          <circle cx="${a.x - 10}" cy="${a.y - 6}" r="2.2" fill="#1d243e" />
          <circle cx="${a.x + 10}" cy="${a.y - 6}" r="2.2" fill="#1d243e" />
          <path d="M ${a.x - 9} ${a.y + 10} Q ${a.x} ${a.y + 17} ${a.x + 9} ${a.y + 10}"
                fill="none" stroke="#6f1020" stroke-width="3" stroke-linecap="round"/>
        </g>
      `;
    }

    function positionAtGrid(rowFromTop, column) {
      const rowFromBottom = 4 - rowFromTop;
      const columnInRow = rowFromBottom % 2 === 0 ? column : 4 - column;
      const index = rowFromBottom * 5 + columnInRow;
      return index + 1;
    }

    function createBoard() {
      const oldCells = snakeBoard.querySelectorAll(".cell");
      oldCells.forEach((cell) => cell.remove());

      const ladderPositions = Object.keys(ladders).map(Number);
      const snakePositions = Object.keys(snakes).map(Number);

      for (let rowFromTop = 0; rowFromTop < 5; rowFromTop++) {
        for (let column = 0; column <= 4; column++) {
          const position = positionAtGrid(rowFromTop, column);
          const cell = document.createElement("div");
          cell.className = "cell";
          cell.dataset.position = position;
          cell.textContent = position;

          if (position === 1) cell.classList.add("start");
          if (position === 25) cell.classList.add("finish");
          if (ladderPositions.includes(position)) cell.classList.add("cell-ladder");
          if (snakePositions.includes(position)) cell.classList.add("cell-snake");

          snakeBoard.insertBefore(cell, boardSvg);
        }
      }

      let svgContent = "";

      Object.entries(ladders).forEach(([start, end]) => {
        svgContent += drawLadder(Number(start), Number(end));
      });

      Object.entries(snakes).forEach(([start, end], index) => {
        svgContent += drawSnake(Number(start), Number(end), index);
      });

      boardSvg.innerHTML = svgContent;
    }

    function updateTokenPosition() {
      const coord = getCoordinate(playerPosition);
      playerToken.style.left = coord.x / 10 + "%";
      playerToken.style.top = coord.y / 10 + "%";
      positionText.textContent = `${playerPosition} / 25`;
      correctText.textContent = correctAnswers;
    }

    function chooseQuestion(type = "normal") {
      currentQuestionType = type;
      const source = type === "hard" ? hardQuestions : normalQuestions;
      currentQuestion = source[Math.floor(Math.random() * source.length)];

      questionLabel.textContent =
        type === "hard"
          ? "SOAL SULIT — KEPALA ULAR"
          : "SOAL UNTUK MEMBUKA DADU";

      questionText.textContent = currentQuestion.text;
      answerInput.value = "";
      answerInput.focus();
      diceUnlocked = false;
      rollDiceBtn.disabled = true;
      tampilkanDadu(null);
    }

    function setMessage(message, type = "normal") {
      gameMessage.textContent = message;

      if (type === "success") {
        gameMessage.style.background = "#e8faef";
        gameMessage.style.color = "#16713c";
      } else if (type === "error") {
        gameMessage.style.background = "#fff0f0";
        gameMessage.style.color = "#b4232b";
      } else if (type === "warning") {
        gameMessage.style.background = "#fff6df";
        gameMessage.style.color = "#9a5b00";
      } else {
        gameMessage.style.background = "#f6f3ee";
        gameMessage.style.color = "#4a4a49";
      }
    }

    let gameTimerInterval=null;
let gameTimerSeconds=180;
let activeTimedPage=null;

function ensureGameTimer(){
  let el=document.getElementById("gameTimer");
  if(el)return el;
  el=document.createElement("div");
  el.id="gameTimer";
  el.className="game-timer-fixed";
  el.innerHTML='⏱️ <span>Waktu</span> <span id="gameTimerText" class="timer-number">03:00</span>';
  document.body.appendChild(el);
  return el;
}
function stopGameTimer(){
  if(gameTimerInterval){clearInterval(gameTimerInterval);gameTimerInterval=null;}
  activeTimedPage=null;
  const el=document.getElementById("gameTimer");
  if(el)el.classList.remove("active","warning","danger");
}
function startGameTimer(pageName){
  stopGameTimer();
  const el=ensureGameTimer();
  const text=document.getElementById("gameTimerText");
  activeTimedPage=pageName; gameTimerSeconds=window.__upDur(pageName);
  el.classList.add("active");
  text.textContent=gameTimerSeconds===120?"02:00":"03:00";
  gameTimerInterval=setInterval(()=>{
    gameTimerSeconds--;
    const min=String(Math.floor(gameTimerSeconds/60)).padStart(2,"0");
    const sec=String(gameTimerSeconds%60).padStart(2,"0");
    text.textContent=`${min}:${sec}`;
    el.classList.toggle("warning",gameTimerSeconds<=20 && gameTimerSeconds>10);
    el.classList.toggle("danger",gameTimerSeconds<=10);
    if(gameTimerSeconds<=0){
      const timedPage=activeTimedPage;
      stopGameTimer();
      if(window.showTimeoutPopup){ window.showTimeoutPopup(timedPage); }
      else { alert("⏰ Waktu "+(window.__upDur(timedPage)/60)+" menit habis. Level belum selesai. Silakan coba lagi."); if(timedPage!=="logic" && timedPage!=="picture") showPage("levels"); else showPage("dashboard"); }
    }
  },1000);
}

function resetSnakeGame(level=1) {
      snakeGameLevel=level;
      playerPosition=1; correctAnswers=0; diceUnlocked=false; isMoving=false;
      tampilkanDadu(null); createBoard(); updateTokenPosition(); chooseQuestion("normal");
      const title=document.querySelector("#snakeGamePage .page-head h1");
      const sub=document.querySelector("#snakeGamePage .page-head p");
      if(title) title.textContent=level===1?"Level 1: Ular Tangga Pintar":level===4?"Level 4: Misi Soal Cerita":"Level 5: Boss Matematika";
      if(sub) sub.textContent=level===1?"Jawab dengan benar, kemudian kocok dadu dan menuju kotak 25.":"Jawab 5 tantangan dengan benar untuk menuntaskan level ini.";
      setMessage(level===1?"Jawab soal terlebih dahulu agar dadu terbuka.":"Jawab soal untuk mendapatkan poin. Setiap jawaban benar membuka gerakan.");
    }

    function handleAnswer() {
      if (isMoving) return;

      const value = Number(answerInput.value);

      if (answerInput.value.trim() === "") {
        setMessage("Masukkan jawaban terlebih dahulu.", "warning");
        return;
      }

      if (value === currentQuestion.answer) {
        correctAnswers++;

        if (snakeGameLevel>=4 && currentQuestionType!=="hard" && correctAnswers>=5) {
          markMathLevelDone(snakeGameLevel);
          saveStudentScore(`Matematika Level ${snakeGameLevel}`, 100);
          questionLabel.textContent="LEVEL SELESAI 🏆";
          questionText.textContent=`Keren! Kamu menyelesaikan Level ${snakeGameLevel} dengan 5 jawaban benar.`;
          setMessage("🎉 Level selesai! Level berikutnya sekarang terbuka.","success");
          rollDiceBtn.disabled=true;
          diceUnlocked=false;
          return;
        }

        if (currentQuestionType === "hard") {
          setMessage(
            "Hebat! Jawabanmu benar. Kamu aman dan tidak turun mengikuti ular.",
            "success"
          );

          chooseQuestion("normal");
          return;
        }

        diceUnlocked = true;
        rollDiceBtn.disabled = false;
        setMessage("Jawaban benar! Dadu sudah terbuka. Sekarang kocok dadu!", "success");
        answerInput.value = "";
      } else {
        if (currentQuestionType === "hard") {
          const snakeTail = snakes[playerPosition];
          playerPosition = snakeTail;
          updateTokenPosition();

          setMessage(
            `Jawaban belum tepat. Kamu turun mengikuti ular ke kotak ${snakeTail}.`,
            "error"
          );

          setTimeout(() => {
            chooseQuestion("normal");
            setMessage("Coba soal berikutnya untuk membuka dadu kembali.");
          }, 900);

          return;
        }

        setMessage("Jawaban belum tepat. Coba hitung lagi ya!", "error");
        answerInput.focus();
      }
    }

    async function rollDice() {
      if (!diceUnlocked || isMoving) return;

      isMoving = true;
      rollDiceBtn.disabled = true;

      diceDisplay.classList.add("rolling");

      const rollingAnimation = setInterval(() => {
        const angkaSementara = Math.floor(Math.random() * 6) + 1;
        tampilkanDadu(angkaSementara);
      }, 100);

      await new Promise((resolve) => setTimeout(resolve, 850));

      clearInterval(rollingAnimation);
      diceDisplay.classList.remove("rolling");

      const diceValue = Math.floor(Math.random() * 6) + 1;
      tampilkanDadu(diceValue);

      if (playerPosition + diceValue > 20) {
        setMessage(
          `Kamu mendapat dadu ${diceValue}, tetapi harus mendapatkan angka yang tepat untuk mencapai kotak 20.`,
          "warning"
        );

        chooseQuestion("normal");
        isMoving = false;
        return;
      }

      playerPosition += diceValue;
      updateTokenPosition();

      await new Promise((resolve) => setTimeout(resolve, 650));

      processSpecialCell();
      isMoving = false;
    }

    function processSpecialCell() {
      if (playerPosition === 25) {
        if (typeof stopGameTimer === "function") stopGameTimer();
        markMathLevelDone(1);
        const level1Stars = correctAnswers >= 4 ? 4 : correctAnswers >= 3 ? 3 : correctAnswers >= 2 ? 2 : 1;
        try {
          const sid = currentSession?.id || "demo";
          const key = `cerdasPlay${sid}mathStars`;
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          data[1] = Math.max(data[1] || 0, level1Stars);
          localStorage.setItem(key, JSON.stringify(data));
        } catch(e) {}
        saveStudentScore("Ular Tangga Level 1", level1Stars * 25);
        updateDashboardProgress();

        setMessage(
          "🎉 Selamat! Kamu berhasil mencapai kotak 25 dan membuka Level 2: Memory Card Angka.",
          "success"
        );

        questionText.innerHTML = `Level 1 selesai! Kamu sekarang bisa membuka Level 2.<div class="game-result-stars">${"★".repeat(level1Stars)}${"☆".repeat(4-level1Stars)}</div><strong>${level1Stars} dari 4 bintang</strong>`;
        questionLabel.textContent = "LEVEL BERHASIL DISELESAIKAN";
        rollDiceBtn.disabled = true;
        return;
      }

      if (ladders[playerPosition]) {
        const start = playerPosition;
        const end = ladders[playerPosition];

        setMessage(
          `🪜 Hore! Kamu berhenti di tangga dan naik dari kotak ${start} ke kotak ${end}.`,
          "success"
        );

        playerPosition = end;
        updateTokenPosition();

        setTimeout(() => {
          chooseQuestion("normal");
          setMessage("Jawab soal berikutnya untuk membuka dadu lagi.");
        }, 800);

        return;
      }

      if (snakes[playerPosition]) {
        setMessage(
          "🐍 Oh tidak! Kamu berada di kepala ular. Jawab soal sulit untuk tetap berada di kotak ini.",
          "warning"
        );

        chooseQuestion("hard");
        return;
      }

      chooseQuestion("normal");
      setMessage("Posisimu aman. Jawab soal berikutnya untuk mengocok dadu.");
    }

    checkAnswerBtn.addEventListener("click", handleAnswer);

    answerInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleAnswer();
      }
    });

    rollDiceBtn.addEventListener("click", rollDice);

    /* ==================================================
       MEMORY CARD GAME
    =================================================== */
    const memoryBoard = document.getElementById("memoryBoard");
    const memoryPairsText = document.getElementById("memoryPairs");
    const memoryMovesText = document.getElementById("memoryMoves");

    let flippedCards = [];
    let matchedPairs = 0;
    let memoryMoves = 0;
    let lockMemoryBoard = false;

    const memoryItems = [
      { id: 1, value: "6 × 7", pair: "42" },
      { id: 2, value: "8 × 9", pair: "72" },
      { id: 3, value: "144 ÷ 12", pair: "12" },
      { id: 4, value: "25 + 37", pair: "62" },
      { id: 5, value: "90 - 36", pair: "54" },
      { id: 6, value: "15 × 6", pair: "90" },
      { id: 7, value: "72 ÷ 8", pair: "9" },
      { id: 8, value: "125 + 75", pair: "200" }
    ];

    function shuffle(array) {
      return [...array].sort(() => Math.random() - 0.5);
    }

    function startMemoryGame() {
      if (typeof stopGameTimer === "function") stopGameTimer();
      flippedCards = [];
      matchedPairs = 0;
      memoryMoves = 0;
      lockMemoryBoard = false;

      memoryPairsText.textContent = "0";
      memoryMovesText.textContent = "0";
      memoryBoard.innerHTML = "";

      const cards = [];

      memoryItems.forEach((item) => {
        cards.push({
          pairId: item.id,
          content: item.value,
          type: "question"
        });

        cards.push({
          pairId: item.id,
          content: item.pair,
          type: "answer"
        });
      });

      shuffle(cards).forEach((card, index) => {
        const button = document.createElement("button");
        button.className = "memory-card";
        button.dataset.pairId = card.pairId;
        button.dataset.type = card.type;
        button.dataset.index = index;

        button.innerHTML = `
          <span class="memory-card-inner">
            <span class="memory-front">?</span>
            <span class="memory-back">${card.content}</span>
          </span>
        `;

        button.addEventListener("click", () => flipMemoryCard(button));
        memoryBoard.appendChild(button);
      });
    }

    function flipMemoryCard(card) {
      if (
        lockMemoryBoard ||
        card.classList.contains("flipped") ||
        card.classList.contains("matched")
      ) {
        return;
      }

      card.classList.add("flipped");
      flippedCards.push(card);

      if (flippedCards.length !== 2) return;

      memoryMoves++;
      memoryMovesText.textContent = memoryMoves;
      lockMemoryBoard = true;

      const [first, second] = flippedCards;
      const isPair =
        first.dataset.pairId === second.dataset.pairId &&
        first.dataset.type !== second.dataset.type;

      if (isPair) {
        setTimeout(() => {
          first.classList.remove("flipped");
          second.classList.remove("flipped");
          first.classList.add("matched");
          second.classList.add("matched");

          matchedPairs++;
          memoryPairsText.textContent = matchedPairs;
          flippedCards = [];
          lockMemoryBoard = false;

          if (matchedPairs === memoryItems.length) {
            setTimeout(() => {
              const memoryScore=Math.max(0, 100 - Math.max(0, memoryMoves - memoryItems.length) * 5);
              saveStudentScore("Memory Card Level 2", memoryScore);
              markMathLevelDone(2);
              /* V14: pemberitahuan lama dihapus */
            }, 300);
          }
        }, 520);
      } else {
        setTimeout(() => {
          first.classList.remove("flipped");
          second.classList.remove("flipped");
          flippedCards = [];
          lockMemoryBoard = false;
        }, 850);
      }
    }

    /* ==================================================
       INISIALISASI
    =================================================== */
    updateDashboardProgress();
    resetSnakeGame();x