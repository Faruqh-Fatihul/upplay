(function(){
  "use strict";
  const $=id=>document.getElementById(id);

  function getSession(){
    try{return JSON.parse(sessionStorage.getItem("cerdasPlaySession")||"null")}catch(e){return null}
  }

  function esc(v){
    return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function avatar(photo,fallback="👤"){
    return photo ? '<img src="'+esc(photo)+'" alt="Foto profil">' : fallback;
  }

  function syncIdentity(){
    const s=getSession();
    if(!s||s.role!=="student")return;

    const name=s.name||"Siswa";
    const cls=s.className||"-";
    const email=s.email||"-";
    const absen=s.absen||"-";

    if($("studentSidebarName"))$("studentSidebarName").textContent=name;
    if($("studentSidebarClass"))$("studentSidebarClass").textContent="Siswa Aktif • Kelas "+cls;
    if($("studentGreetingName"))$("studentGreetingName").textContent=name;
    if($("studentSidebarAvatar"))$("studentSidebarAvatar").innerHTML=avatar(s.photo);
    if($("profileAvatarPreview"))$("profileAvatarPreview").innerHTML=avatar(s.photo);
    if($("profileSummaryAvatar"))$("profileSummaryAvatar").innerHTML=avatar(s.photo);

    if($("profileSummaryName"))$("profileSummaryName").textContent=name;
    if($("profileSummaryEmail"))$("profileSummaryEmail").textContent=email;
    if($("profileSummaryClass"))$("profileSummaryClass").textContent=cls;
    if($("profileSummaryAbsen"))$("profileSummaryAbsen").textContent=absen;

    if($("profileName"))$("profileName").value=name;
    if($("profileEmail"))$("profileEmail").value=email;
    if($("profileClass"))$("profileClass").value=cls;
    if($("profileAbsen"))$("profileAbsen").value=absen;

    if($("studentTotalGameStat"))$("studentTotalGameStat").textContent="3";
  }

  function showView(view){
    view=view==="profile"?"profile":"dashboard";

    document.querySelectorAll("#studentDashboard .student-menu").forEach(b=>{
      b.classList.toggle("active",b.dataset.studentView===view);
    });

    document.querySelectorAll("#studentDashboard .student-view").forEach(v=>v.classList.add("hidden"));

    const target=$(view==="profile"?"studentViewProfile":"studentViewDashboard");
    if(target)target.classList.remove("hidden");

    if($("studentPageTitle"))$("studentPageTitle").textContent=view==="profile"?"Profil Siswa":"Dashboard";
    if($("studentPageSubtitle"))$("studentPageSubtitle").textContent=
      view==="profile"?"Kelola data pribadi dan keamanan akunmu.":"Selamat datang di dashboard belajarmu.";

    syncIdentity();

    if(view==="dashboard"){
      try{window.renderStudentGameAvailability?.()}catch(e){}
    }
  }

  function moveGameCards(){
    const source=document.querySelector("#studentViewGame .game-mini-grid");
    const target=$("dashboardGameGrid");
    if(source&&target){
      if(source.parentElement!==target)target.appendChild(source);
      source.classList.add("dashboard-game-grid");
    }
  }

  function togglePassword(btn){
    const input=$(btn.dataset.target);
    if(!input)return;
    const visible=input.type==="password";
    input.type=visible?"text":"password";
    btn.textContent=visible?"◉":"◌";
    btn.setAttribute("aria-label",visible?"Sembunyikan password":"Tampilkan password");
    btn.title=visible?"Sembunyikan password":"Tampilkan password";
  }

  function bind(){
    moveGameCards();

    document.querySelectorAll("#studentDashboard .student-menu").forEach(btn=>{
      if(btn.dataset.v6==="1")return;
      btn.dataset.v6="1";
      btn.addEventListener("click",function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        showView(this.dataset.studentView);
      },true);
    });

    document.querySelectorAll("#studentDashboard .password-toggle").forEach(btn=>{
      if(btn.dataset.v6==="1")return;
      btn.dataset.v6="1";
      btn.addEventListener("click",function(e){
        e.preventDefault();
        e.stopPropagation();
        togglePassword(this);
      },true);
    });

    const photo=$("profilePhotoInput");
    if(photo&&photo.dataset.v6!=="1"){
      photo.dataset.v6="1";
      photo.addEventListener("change",function(){
        const f=this.files?.[0];
        if(!f)return;
        if(!f.type.startsWith("image/")||f.size>2*1024*1024){
          alert("Foto harus berupa gambar dan maksimal 2 MB.");
          this.value="";
          return;
        }
        const reader=new FileReader();
        reader.onload=()=>{
          const s=getSession();
          if(!s)return;
          s.photo=reader.result;
          sessionStorage.setItem("cerdasPlaySession",JSON.stringify(s));
          syncIdentity();
        };
        reader.readAsDataURL(f);
      });
    }

    const form=$("studentProfileForm");
    if(form&&form.dataset.v6!=="1"){
      form.dataset.v6="1";
      form.addEventListener("submit",function(e){
        e.preventDefault();

        const s=getSession();
        if(!s)return;

        const current=$("profileCurrentPassword")?.value||"";
        const np=$("profileNewPassword")?.value||"";
        const cp=$("profileConfirmPassword")?.value||"";
        const msg=$("profileFormMessage");

        const fail=t=>{
          if(msg){msg.textContent=t;msg.style.color="#c04b3f"}
        };
        const ok=t=>{
          if(msg){msg.textContent=t;msg.style.color="#18713f"}
        };

        let accounts=[];
        try{accounts=JSON.parse(localStorage.getItem("cerdasPlayStudents")||"[]")}catch(_){}

        const idx=accounts.findIndex(a=>a.id===s.id);
        const account=idx>=0?accounts[idx]:null;

        if(!account){fail("⚠️ Data akun siswa tidak ditemukan.");return}
        if(!current){fail("⚠️ Masukkan password saat ini.");return}
        if(String(account.password||"")!==current){fail("⚠️ Password saat ini salah.");return}
        if(np.length<6){fail("⚠️ Password baru minimal 6 karakter.");return}
        if(np!==cp){fail("⚠️ Konfirmasi password baru tidak sama.");return}

        account.name=$("profileName")?.value.trim()||s.name;
        account.email=$("profileEmail")?.value.trim()||s.email;
        account.className=$("profileClass")?.value||s.className;
        account.absen=$("profileAbsen")?.value.trim()||s.absen||"";
        account.password=np;
        account.photo=s.photo||"";

        accounts[idx]=account;
        localStorage.setItem("cerdasPlayStudents",JSON.stringify(accounts));

        s.name=account.name;
        s.email=account.email;
        s.className=account.className;
        s.absen=account.absen;
        s.photo=account.photo;
        sessionStorage.setItem("cerdasPlaySession",JSON.stringify(s));

        $("profileCurrentPassword").value="";
        $("profileNewPassword").value="";
        $("profileConfirmPassword").value="";

        syncIdentity();
        ok("✓ Data profil dan password berhasil disimpan.");
      });
    }

    syncIdentity();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>requestAnimationFrame(bind));
  }else{
    requestAnimationFrame(bind);
  }
})();
