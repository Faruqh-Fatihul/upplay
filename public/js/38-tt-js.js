(function(){
'use strict';
/* ===== Game Tebak-Tebakan (khusus portal siswa) — pola sama dengan Game Logika ===== */
const $=id=>document.getElementById(id);
const sid=()=>window.currentSession?.id||'demo';
const isStudent=()=>{const s=window.currentSession;return !!s&&s.role==='student'};
const doneKey=n=>`cerdasPlay:${sid()}:tebakLevel${n}Completed`;
const failKey=n=>`cerdasPlay:${sid()}:tebakLevel${n}Failed`;
const starsKey=()=>`cerdasPlay${sid()}tebakStars`;
const isDone=n=>localStorage.getItem(doneKey(n))==='true';
const fails=n=>Number(localStorage.getItem(failKey(n)))||0;
const getStars=()=>{try{return JSON.parse(localStorage.getItem(starsKey())||'{}')||{}}catch(e){return {}}};
const putStars=o=>{try{localStorage.setItem(starsKey(),JSON.stringify(o))}catch(e){}};
const esc=v=>String(v).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[rnd(0,a.length-1)];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};

const LV={
 1:{name:'Tebak Kata',desc:'Gabungkan beberapa petunjuk gambar, lalu susun huruf menjadi kata yang tepat.',prev:'👁️➕☀️',mode:'kata',
   goal:'Tebak 10 kata dari gabungan gambar sebelum waktu habis.',
   rules:['Ada 10 soal. Setiap soal berisi 2–3 gambar yang digabung menjadi satu kata atau ungkapan.','Huruf dari gambar pertama sudah terpasang. Klik huruf di bawah (atau ketik lewat keyboard) untuk melengkapi jawaban.','Jika salah, huruf dikosongkan dan kamu mencoba lagi sampai benar. Soal berikutnya muncul setelah jawabanmu benar.','Semakin jauh, gambar petunjuk dan huruf pengecohnya makin banyak. Soal diacak setiap kali bermain.','Selesaikan 10 soal sebelum waktu 2 menit habis untuk mendapat 4 bintang.']},
 2:{name:'Tebak Tempat',desc:'Amati petunjuk gambar, lalu pilih foto lokasi yang paling cocok.',prev:'🏥🏫🏖️',mode:'tempat',
   goal:'Tebak 10 tempat dari petunjuk gambar sebelum waktu habis.',
   rules:['Ada 10 soal. Amati emoji petunjuk dan baca pertanyaannya.','Klik satu dari 4 kartu foto lokasi (A–D) yang paling cocok.','Jika salah, coba lagi sampai benar. Soal berikutnya muncul setelah jawabanmu benar.','Soal dan pilihan tempat diacak setiap kali bermain.','Selesaikan 10 soal sebelum waktu 2 menit habis untuk mendapat 4 bintang.']},
 3:{name:'Tebak Ungkapan',desc:'Pasangkan petunjuk emoji dengan ungkapan atau peribahasa yang tepat.',prev:'✋🪶💬',mode:'match',
   goal:'Pasangkan 10 petunjuk emoji dengan ungkapan atau peribahasanya sebelum waktu habis.',
   rules:['Ada 10 petunjuk emoji dan 10 ungkapan/peribahasa dalam satu layar.','Klik satu petunjuk emoji, lalu klik ungkapan atau peribahasa yang cocok (boleh juga sebaliknya).','Pasangan yang benar berubah hijau dan diberi nomor. Jika salah, pilih lagi sampai benar.','Ungkapan dan peribahasa diacak setiap kali bermain.','Pasangkan semuanya sebelum waktu 2 menit habis untuk mendapat 4 bintang.']},
 4:{name:'Tebak Benda',desc:'Perhatikan benda yang buram seperti dilihat tanpa kacamata, lalu pilih gambar benda yang sama.',prev:'👓☂️💡',mode:'quiz',
   goal:'Tebak 10 benda yang buram sebelum waktu habis.',
   rules:['Ada 10 soal. Setiap soal menampilkan sebuah benda yang buram, seperti pandangan mata minus tanpa kacamata.','Makin ke belakang, gambar makin buram. Amati warna dan bentuk besarnya.','Klik satu dari 4 gambar benda (A–D) yang sama dengan benda buram itu.','Jika salah, coba lagi sampai benar. Soal berikutnya muncul setelah jawabanmu benar.','Soal dan pilihan jawaban diacak setiap kali bermain. Selesaikan 10 soal sebelum waktu 2 menit habis untuk mendapat 4 bintang.']},
 5:{name:'Tebak Peribahasa',desc:'Baca cerita gambar, lalu pilih peribahasa yang sesuai dengan ceritanya.',prev:'🐜🍬☂️',mode:'quiz',
   goal:'Tebak 10 peribahasa dari cerita gambar sebelum waktu habis.',
   rules:['Ada 10 soal. Amati gambar dan baca ceritanya dengan teliti.','Klik satu dari 3 peribahasa (A–C) yang paling sesuai dengan cerita gambar.','Jika salah, coba lagi sampai benar. Soal berikutnya muncul setelah jawabanmu benar.','Soal dan pilihan peribahasa diacak setiap kali bermain.','Selesaikan 10 soal sebelum waktu 2 menit habis untuk mendapat 4 bintang.']}
};

/* ---------- bank soal Level 1: Tebak Kata ---------- */
const KATA2=[
 {p:[['👁️','MATA'],['☀️','HARI']],a:'MATAHARI',h:'Benda langit yang bersinar terang pada siang hari.'},
 {p:[['🪟','KACA'],['👁️','MATA']],a:'KACAMATA',h:'Dipakai di depan mata agar penglihatan lebih jelas.'},
 {p:[['🧹','SAPU'],['✋','TANGAN']],a:'SAPUTANGAN',h:'Kain kecil untuk menyeka keringat.'},
 {p:[['🐍','ULAR'],['🪜','TANGGA']],a:'ULAR TANGGA',h:'Permainan papan yang memakai dadu.'},
 {p:[['🎈','BALON'],['💨','UDARA']],a:'BALON UDARA',h:'Kendaraan terbang dengan keranjang dan api.'},
 {p:[['🐴','KUDA'],['🌊','LAUT']],a:'KUDA LAUT',h:'Ikan kecil yang kepalanya mirip kuda.'},
 {p:[['⭐','BINTANG'],['🌊','LAUT']],a:'BINTANG LAUT',h:'Hewan laut berbentuk bintang berlengan lima.'},
 {p:[['🐦','BURUNG'],['👻','HANTU']],a:'BURUNG HANTU',h:'Burung bermata besar yang aktif di malam hari.'},
 {p:[['🍚','NASI'],['🍳','GORENG']],a:'NASI GORENG',h:'Makanan dari nasi yang dimasak dengan kecap.'},
 {p:[['📖','BUKU'],['✏️','TULIS']],a:'BUKU TULIS',h:'Tempat kamu mencatat pelajaran.'},
 {p:[['⏰','JAM'],['🧱','DINDING']],a:'JAM DINDING',h:'Penunjuk waktu yang digantung di tembok.'},
 {p:[['🦶','KAKI'],['🌈','LANGIT']],a:'KAKI LANGIT',h:'Garis tempat langit seolah bertemu bumi.'},
 {p:[['🐻','BERUANG'],['🍯','MADU']],a:'BERUANG MADU',h:'Beruang kecil dari hutan Kalimantan dan Sumatra.'},
 {p:[['🚲','SEPEDA'],['⚙️','MOTOR']],a:'SEPEDA MOTOR',h:'Kendaraan roda dua yang memakai mesin.'},
 {p:[['💧','AIR'],['🪂','TERJUN']],a:'AIR TERJUN',h:'Air yang jatuh dari tebing yang tinggi.'},
 {p:[['🏔️','GUNUNG'],['🔥','BERAPI']],a:'GUNUNG BERAPI',h:'Gunung yang bisa meletus dan mengeluarkan lava.'},
 {p:[['🏠','RUMAH'],['🌳','POHON']],a:'RUMAH POHON',h:'Rumah kecil yang dibangun di atas pohon.'}
];
const KATA3=[
 {p:[['🌸','BUNGA'],['👁️','MATA'],['☀️','HARI']],a:'BUNGA MATAHARI',h:'Bunga besar berwarna kuning yang menghadap matahari.'},
 {p:[['🌑','GERHANA'],['👁️','MATA'],['☀️','HARI']],a:'GERHANA MATAHARI',h:'Saat bulan menutupi cahaya matahari.'},
 {p:[['🥚','TELUR'],['👁️','MATA'],['🐄','SAPI']],a:'TELUR MATA SAPI',h:'Telur goreng yang kuningnya tetap utuh di tengah.'},
 {p:[['🚂','KERETA'],['🔥','API'],['⚡','LISTRIK']],a:'KERETA API LISTRIK',h:'Kereta yang bergerak dengan tenaga listrik.'},
 {p:[['🧊','ES'],['🥥','KELAPA'],['🍃','MUDA']],a:'ES KELAPA MUDA',h:'Minuman segar dari buah kelapa.'},
 {p:[['🧊','ES'],['🍵','TEH'],['🍬','MANIS']],a:'ES TEH MANIS',h:'Minuman dingin yang manis dari daun teh.'},
 {p:[['👁️','MATA'],['☀️','HARI'],['🌅','TERBIT']],a:'MATAHARI TERBIT',h:'Pemandangan pagi hari di ufuk timur.'},
 {p:[['👁️','MATA'],['💧','AIR'],['♨️','PANAS']],a:'MATA AIR PANAS',h:'Sumber air hangat yang keluar dari dalam tanah.'}
];
const nLet=s=>s.replace(/ /g,'').length;
function makeKata(){
  const two=shuf(KATA2).slice(0,7).sort((a,b)=>nLet(a.a)-nLet(b.a));
  const three=shuf(KATA3).slice(0,3).sort((a,b)=>nLet(a.a)-nLet(b.a));
  return two.concat(three).map((q,i)=>{
    const ans=q.a.replace(/ /g,''),pre=q.p[0][1].length,rest=ans.slice(pre).split('');
    const nd=i<4?2:i<7?3:4,extra=[];for(let k=0;k<nd;k++)extra.push(pick('ABDEGIKLMNOPRSTU'.split('')));
    return {p:q.p,a:q.a,h:q.h,ans,pre,bank:shuf(rest.concat(extra)).map(c=>({c,used:false})),typed:[]};
  });
}

/* ---------- bank soal Level 2: Tebak Tempat ---------- */
const PLACES=[
 {e:'🏥',n:'Rumah Sakit',c:['🤒','🚑'],q:'Ke mana kita pergi saat sakit parah?',d:'Di tempat ini, dokter dan perawat merawat pasien.',h:'Cari gedung yang memiliki tanda palang medis.',bg:'city'},
 {e:'🏫',n:'Sekolah',c:['🎒','📚'],q:'Di mana kita belajar bersama guru setiap pagi?',d:'Ada ruang kelas, papan tulis, dan teman-teman.',h:'Gedung dengan jam besar dan banyak ruang kelas.',bg:'city'},
 {e:'🏖️',n:'Pantai',c:['🌊','🏄'],q:'Di mana kita bisa bermain pasir dan ombak?',d:'Tempat ini berada di tepi laut.',h:'Ada payung, pasir, dan air laut.',bg:'sea'},
 {e:'🏦',n:'Bank',c:['💰','💳'],q:'Di mana kita bisa menabung uang dengan aman?',d:'Petugasnya melayani simpanan dan pinjaman uang.',h:'Gedung dengan lambang uang.',bg:'city'},
 {e:'📚',n:'Perpustakaan',c:['📖','🤫'],q:'Di mana kita bisa meminjam banyak buku?',d:'Pengunjung harus tenang saat membaca di sini.',h:'Tempatnya penuh rak buku.',bg:'in'},
 {e:'🏛️',n:'Museum',c:['🦖','🏺'],q:'Di mana kita melihat benda-benda bersejarah?',d:'Ada fosil, guci kuno, dan peninggalan masa lalu.',h:'Gedung bertiang besar yang menyimpan benda kuno.',bg:'city'},
 {e:'🏟️',n:'Stadion',c:['⚽','📣'],q:'Di mana pertandingan sepak bola besar digelar?',d:'Ribuan penonton bersorak di tribun.',h:'Lapangan besar yang dikelilingi kursi penonton.',bg:'nature'},
 {e:'🛫',n:'Bandara',c:['🧳','✈️'],q:'Dari mana kita berangkat naik pesawat?',d:'Ada landasan pacu dan ruang tunggu penumpang.',h:'Tempat pesawat lepas landas.',bg:'city'},
 {e:'🚉',n:'Stasiun',c:['🚆','🎫'],q:'Di mana kita menunggu kereta api?',d:'Penumpang naik dan turun di peron.',h:'Ada rel dan papan jadwal kereta.',bg:'city'},
 {e:'⛽',n:'Pom Bensin',c:['🚗','🛢️'],q:'Ke mana kendaraan pergi saat bensinnya hampir habis?',d:'Petugas mengisi bahan bakar ke tangki kendaraan.',h:'Ada mesin pengisi bahan bakar.',bg:'city'},
 {e:'🏤',n:'Kantor Pos',c:['✉️','📦'],q:'Ke mana kita mengirim surat dan paket?',d:'Petugas menimbang dan mengirim kiriman ke alamat tujuan.',h:'Tempat perangko dan amplop.',bg:'city'},
 {e:'🚒',n:'Pos Pemadam Kebakaran',c:['🔥','🧯'],q:'Dari mana petugas berangkat saat ada kebakaran?',d:'Mobil merah dan selang air selalu siap di sini.',h:'Ada mobil merah bertangga panjang.',bg:'city'},
 {e:'🎡',n:'Taman Bermain',c:['🎢','🎠'],q:'Di mana kita naik komidi putar dan roller coaster?',d:'Tempat rekreasi yang penuh wahana seru.',h:'Ada kincir raksasa yang berputar.',bg:'nature'},
 {e:'🏕️',n:'Perkemahan',c:['⛺','🔥'],q:'Di mana pramuka mendirikan tenda?',d:'Malam harinya ada api unggun.',h:'Tempat berkemah di alam terbuka.',bg:'nature'},
 {e:'🏨',n:'Hotel',c:['🛏️','🧳'],q:'Di mana wisatawan menginap saat berlibur?',d:'Ada banyak kamar dengan nomor di pintunya.',h:'Gedung tinggi tempat menginap.',bg:'city'},
 {e:'🏬',n:'Mal',c:['🛍️','👟'],q:'Di mana ada banyak toko dalam satu gedung besar?',d:'Orang datang untuk berbelanja dan jalan-jalan.',h:'Gedung belanja bertingkat.',bg:'city'},
 {e:'🎦',n:'Bioskop',c:['🍿','🎬'],q:'Di mana kita menonton film di layar lebar?',d:'Lampunya dimatikan saat film diputar.',h:'Tempat menonton film bersama.',bg:'in'},
 {e:'🏊',n:'Kolam Renang',c:['🩱','💦'],q:'Di mana kita belajar berenang?',d:'Airnya jernih dan ada papan loncat.',h:'Tempat berenang di dalam kolam.',bg:'sea'},
 {e:'💈',n:'Pangkas Rambut',c:['✂️','💇'],q:'Ke mana kita pergi saat rambut sudah panjang?',d:'Ada kursi putar dan cermin besar.',h:'Tempat memotong rambut.',bg:'in'},
 {e:'🏭',n:'Pabrik',c:['⚙️','👷'],q:'Di mana barang dibuat dengan mesin-mesin besar?',d:'Cerobongnya mengeluarkan asap.',h:'Gedung dengan cerobong asap.',bg:'city'},
 {e:'🌾',n:'Sawah',c:['🧑‍🌾','🐃'],q:'Di mana petani menanam padi?',d:'Tanahnya berlumpur dan berpetak-petak.',h:'Hamparan tanaman padi menguning.',bg:'nature'},
 {e:'🦁',n:'Kebun Binatang',c:['🦒','🐘'],q:'Di mana kita bisa melihat banyak hewan liar?',d:'Hewan-hewan dirawat di kandang yang luas.',h:'Ada raja hutan yang mengaum.',bg:'nature'},
 {e:'🏔️',n:'Gunung',c:['🥾','🧗'],q:'Ke mana pendaki pergi untuk mencapai puncak?',d:'Udaranya sejuk dan jalannya menanjak.',h:'Puncaknya tinggi dan bersalju.',bg:'nature'},
 {e:'🚓',n:'Kantor Polisi',c:['👮','🚨'],q:'Ke mana kita melapor saat kehilangan barang?',d:'Petugas berseragam menjaga keamanan.',h:'Ada mobil patroli dengan lampu sirene.',bg:'city'}
];
function makeTempat(){
  return shuf(PLACES).slice(0,10).map(p=>{const opts=shuf([p,...shuf(PLACES.filter(x=>x!==p)).slice(0,3)]);return {p,opts,ans:opts.indexOf(p)}});
}

/* ---------- bank soal Level 3: Tebak Ungkapan & Peribahasa ---------- */
const UNG=[
 {e:['✋','🪶'],p:'Ringan tangan',m:'Suka membantu orang lain'},
 {e:['⭐','🏫'],p:'Bintang kelas',m:'Murid yang berprestasi di kelas'},
 {e:['🐘','❤️'],p:'Besar hati',m:'Merasa bangga dan senang'},
 {e:['🍊','✋'],p:'Buah tangan',m:'Oleh-oleh untuk orang lain'},
 {e:['🧑','❄️'],p:'Kepala dingin',m:'Tetap tenang saat ada masalah'},
 {e:['🌸','😴'],p:'Bunga tidur',m:'Mimpi'},
 {e:['🐜','📚'],p:'Kutu buku',m:'Orang yang gemar membaca'},
 {e:['🪨','🧑'],p:'Keras kepala',m:'Tidak mau mendengar nasihat'},
 {e:['❤️','⬆️'],p:'Tinggi hati',m:'Sombong'},
 {e:['🐐','⚫'],p:'Kambing hitam',m:'Orang yang dijadikan sasaran kesalahan'},
 {e:['👶','🥇'],p:'Anak emas',m:'Anak yang paling disayang'},
 {e:['👄','🍬'],p:'Mulut manis',m:'Perkataannya enak didengar'},
 {e:['👂','🧱'],p:'Tebal telinga',m:'Tidak peduli pada teguran'},
 {e:['👁️','💰'],p:'Mata duitan',m:'Sangat menyukai uang'}
];
const PERI=[
 {e:['☂️','🌧️'],p:'Sedia payung sebelum hujan',m:'Berjaga-jaga sebelum terjadi sesuatu'},
 {e:['🪙','⛰️'],p:'Sedikit demi sedikit, lama-lama menjadi bukit',m:'Yang kecil jika dikumpulkan menjadi banyak'},
 {e:['🐸','🥥'],p:'Seperti katak dalam tempurung',m:'Pengetahuannya sempit'},
 {e:['💧','🍃'],p:'Bagai air di daun talas',m:'Pendiriannya tidak tetap'},
 {e:['🍚','🥣'],p:'Nasi sudah menjadi bubur',m:'Sudah terlanjur, tidak bisa diubah'},
 {e:['🌾','🙇'],p:'Ilmu padi, makin berisi makin merunduk',m:'Makin pandai makin rendah hati'},
 {e:['🐶','🐱'],p:'Seperti anjing dan kucing',m:'Selalu bertengkar'},
 {e:['🍎','🌳'],p:'Buah jatuh tidak jauh dari pohonnya',m:'Sifat anak mirip orang tuanya'},
 {e:['🥜','😶'],p:'Seperti kacang lupa kulitnya',m:'Lupa pada asal-usulnya'},
 {e:['🛶','🏝️'],p:'Sekali dayung, dua tiga pulau terlampaui',m:'Sekali berusaha, banyak hasil didapat'},
 {e:['💨','🔥'],p:'Tak ada asap kalau tak ada api',m:'Setiap kejadian pasti ada sebabnya'},
 {e:['🗣️','🐯'],p:'Mulutmu harimaumu',m:'Berhati-hatilah saat berbicara'},
 {e:['🤝','💪'],p:'Bersatu kita teguh, bercerai kita runtuh',m:'Kerja sama membuat kita kuat'},
 {e:['📚','💡'],p:'Rajin pangkal pandai',m:'Rajin belajar membuat pintar'},
 {e:['🐷','💰'],p:'Hemat pangkal kaya',m:'Suka menabung membuat hidup cukup'},
 {e:['🏋️','👫'],p:'Berat sama dipikul, ringan sama dijinjing',m:'Susah dan senang dirasakan bersama'}
];
function makeMatch(){
  /* hindari dua petunjuk yang memakai emoji sama dalam satu permainan */
  const items=[],used=new Set();
  const take=(pool,n)=>{let k=0;for(const x of shuf(pool)){if(k>=n)break;if(x.e.some(e=>used.has(e)))continue;x.e.forEach(e=>used.add(e));items.push(Object.assign({kind:pool===UNG?'UNGKAPAN':'PERIBAHASA'},x));k++}};
  take(UNG,5);take(PERI,5);
  const ids=items.map((_,i)=>i);
  return {items,clues:shuf(ids),phr:shuf(ids),done:{},sel:null,n:0};
}

/* ---------- bank soal Level 4: Tebak Benda (buram) ---------- */
const BENDA=[['☂️','Payung'],['💡','Lampu'],['🧢','Topi'],['⏰','Jam Weker'],['🔑','Kunci'],['✂️','Gunting'],['📚','Buku'],['🎒','Tas Sekolah'],['🚲','Sepeda'],['⚽','Bola'],
 ['🍎','Apel'],['🍌','Pisang'],['🐟','Ikan'],['🚗','Mobil'],['✈️','Pesawat'],['🏠','Rumah'],['🌳','Pohon'],['🎸','Gitar'],['📷','Kamera'],['👟','Sepatu'],
 ['🕶️','Kacamata'],['🔔','Lonceng'],['🧸','Boneka Beruang'],['🪑','Kursi'],['🥁','Drum'],['🚀','Roket'],['🍕','Pizza'],['🐘','Gajah'],['🦋','Kupu-kupu'],['⌚','Jam Tangan']].map(x=>({e:x[0],n:x[1]}));
const BLUR=[3,4,5.5,7,8.5,10,11.5,13,14.5,16];
function makeBenda(){return shuf(BENDA).slice(0,10).map((t,i)=>{const opts=shuf([t,...shuf(BENDA.filter(x=>x!==t)).slice(0,3)]);return {kind:'benda',t,opts,ans:opts.indexOf(t),blur:BLUR[i]}})}

/* ---------- bank soal Level 5: Tebak Peribahasa ---------- */
const PERIS=[
 {s:['🫙🍬','🐜🐜🐜🐜🐜'],cap:'Gula tumpah, semut berdatangan.',sub:'Semut-semut berkumpul di dekat gula yang manis.',p:'Ada gula, ada semut.',h:'Perhatikan apa yang membuat semut datang berkumpul.'},
 {s:['☁️🌧️☁️','🧒☂️🎒'],cap:'Anak membawa payung saat langit mendung.',sub:'Hujan belum turun, tetapi ia sudah bersiap.',p:'Sedia payung sebelum hujan.',h:'Ia bersiap sebelum hujan benar-benar turun.'},
 {s:['🪙🪙🪙🪙','⛰️'],cap:'Koin dikumpulkan satu demi satu hingga menggunung.',sub:'Yang kecil, jika dikumpulkan, menjadi besar.',p:'Sedikit demi sedikit, lama-lama menjadi bukit.',h:'Hal kecil yang dilakukan terus-menerus.'},
 {s:['📚✏️💡','🧒📖'],cap:'Anak rajin belajar setiap malam.',sub:'Nilainya semakin baik dan ia menjadi pintar.',p:'Rajin pangkal pandai.',h:'Apa yang membuat anak itu menjadi pintar?'},
 {s:['🐷🪙','💵💵💵'],cap:'Ia menyisihkan uang jajan dan tidak boros.',sub:'Tabungannya terus bertambah.',p:'Hemat pangkal kaya.',h:'Ia tidak menghabiskan semua uangnya.'},
 {s:['👷🧑‍🌾👩‍🔧','🤝🌉'],cap:'Warga bekerja sama membangun jembatan.',sub:'Pekerjaan berat terasa ringan jika dikerjakan bersama.',p:'Bersatu kita teguh, bercerai kita runtuh.',h:'Mereka mengerjakan pekerjaan secara bersama-sama.'},
 {s:['🧒🧒','📦🪣'],cap:'Dua anak mengangkat ember dan kardus bersama.',sub:'Beban terasa lebih ringan karena dibagi dua.',p:'Berat sama dipikul, ringan sama dijinjing.',h:'Susah dan senang dirasakan bersama.'},
 {s:['🌳🍎','🍎🧒'],cap:'Apel jatuh tepat di bawah pohonnya.',sub:'Sifat anak sering mirip dengan orang tuanya.',p:'Buah jatuh tidak jauh dari pohonnya.',h:'Perhatikan di mana buah itu jatuh.'},
 {s:['🥥🐸','🌍❓'],cap:'Katak hanya melihat dunia dari dalam batok kelapa.',sub:'Ia mengira dunia hanya sebesar itu.',p:'Seperti katak dalam tempurung.',h:'Pandangannya sangat terbatas.'},
 {s:['🍃💧','💧💧'],cap:'Tetesan air menggelinding di atas daun talas.',sub:'Air itu tidak menempel dan mudah berpindah.',p:'Bagai air di daun talas.',h:'Air itu tidak bisa diam di tempatnya.'},
 {s:['🍚➡️🥣','😢'],cap:'Nasi sudah dimasak menjadi bubur.',sub:'Tidak bisa kembali seperti semula, penyesalan datang terlambat.',p:'Nasi sudah menjadi bubur.',h:'Sesuatu yang sudah terjadi tidak dapat diulang.'},
 {s:['🌾🌾🌾','🙇🎓'],cap:'Padi yang penuh bulir semakin menunduk.',sub:'Orang yang pandai tetap rendah hati.',p:'Ilmu padi, makin berisi makin merunduk.',h:'Perhatikan padi yang sarat dengan isi.'},
 {s:['💨💨💨','🔥🏕️'],cap:'Asap mengepul dari api unggun.',sub:'Setiap kejadian pasti ada sebabnya.',p:'Tak ada asap kalau tak ada api.',h:'Asap muncul karena ada penyebabnya.'},
 {s:['🗣️💬💥','🐯'],cap:'Kata-kata yang tidak dijaga bisa mencelakakan.',sub:'Ucapan harus dipikirkan dulu sebelum diucapkan.',p:'Mulutmu harimaumu.',h:'Kata-kata bisa berbahaya seperti harimau.'},
 {s:['🐶😠','🐱😾'],cap:'Dua hewan saling menggeram setiap bertemu.',sub:'Mereka tidak pernah akur.',p:'Seperti anjing dan kucing.',h:'Keduanya selalu bertengkar.'},
 {s:['🥜➡️🥜','🧑‍💼🙈🏠'],cap:'Anak yang sudah sukses melupakan orang yang menolongnya.',sub:'Ia tidak mengingat asal-usulnya.',p:'Seperti kacang lupa kulitnya.',h:'Ia melupakan asal-usulnya.'}
];
function makePeri(){return shuf(PERIS).slice(0,10).map(t=>{const opts=shuf([t,...shuf(PERIS.filter(x=>x!==t)).slice(0,2)]);return {kind:'peri',t,opts,ans:opts.indexOf(t)}})}

/* ---------- DOM ---------- */
document.body.insertAdjacentHTML('beforeend',`
<section id="ttLevelsPage" class="app-view hidden">
  <header class="topbar"><a href="#" class="brand" id="ttLvHome"><span class="brand-icon">✦</span>UpPlay</a><button class="btn btn-outline" id="ttLvDash">← Dashboard</button></header>
  <main class="levels-page">
    <div class="page-head"><button class="back-btn" id="ttLvBack" aria-label="Kembali ke dashboard">←</button><div><h1>Game Tebak-Tebakan</h1><p>Pilih level. Selesaikan level sebelumnya untuk membuka level berikutnya.</p></div></div>
    <div class="level-grid" id="ttGrid"></div>
  </main>
</section>
<section id="ttPlayPage" class="app-view hidden" data-mode="kata">
  <header class="topbar"><a href="#" class="brand" id="ttPlayHome"><span class="brand-icon">✦</span>UpPlay</a><button class="btn btn-outline">← Pilih Level</button></header>
  <div class="cd-timebar" role="timer" aria-label="Sisa waktu"><div class="cd-track"><i></i></div><strong>⏱ 02:00</strong></div>
  <main class="game-page">
    <div class="page-head"><button class="back-btn" id="ttPlayBack" aria-label="Kembali ke level">←</button><div><h1 id="ttPlayTitle">Level 1: Tebak Kata</h1><p id="ttPlaySub">Gabungkan petunjuk gambar menjadi satu kata.</p></div></div>
    <div class="tt-layout">
      <section class="tt-card" id="ttKataCard">
        <div class="lg-qhead"><span class="lg-chip">GABUNGKAN GAMBAR</span><span class="lg-chip" id="ttKataChip">8 huruf • 1 kata</span></div>
        <h2 class="tt-kata-title">Kata apa yang terbentuk?</h2>
        <div class="tt-pics" id="ttPics"></div>
        <div class="tt-slots" id="ttSlots"></div>
        <p class="tt-sub">Pilih huruf di bawah (atau ketik di keyboard) untuk melengkapi jawaban.</p>
        <div class="tt-bank" id="ttBank"></div>
        <div class="lg-fb" id="ttKataFb">Lengkapi kata dari kiri ke kanan.</div>
      </section>
      <section class="tt-card" id="ttTempatCard">
        <div class="tt-banner"><div class="tt-clues" id="ttPlaceClues"></div><div><small>TEBAK LOKASINYA</small><h3 id="ttPlaceQ"></h3><p id="ttPlaceD"></p></div></div>
        <p class="tt-pick">Pilih satu tempat:</p>
        <div class="tt-places" id="ttPlaces"></div>
        <div class="lg-fb" id="ttPlaceFb">Klik kartu foto lokasi yang paling cocok.</div>
      </section>
      <section class="tt-card" id="ttMatchCard">
        <div class="lg-qhead"><span class="lg-chip">COCOKKAN PASANGAN</span><div class="tt-chips"><span class="lg-chip tt-chip-ok" id="ttMatchOk">0 / 10 pasangan</span><span class="lg-chip tt-chip-bad" id="ttMatchBad">Salah: 0</span></div></div>
        <div class="tt-sec">PETUNJUK EMOJI</div>
        <div class="tt-clue-grid" id="ttClues"></div>
        <div class="tt-sec">UNGKAPAN &amp; PERIBAHASA</div>
        <div class="tt-phr-grid" id="ttPhr"></div>
        <div class="lg-fb" id="ttMatchFb">Klik satu petunjuk emoji, lalu klik ungkapan atau peribahasa yang cocok.</div>
      </section>
      <section class="tt-card" id="ttQuizCard">
        <div class="lg-qhead"><h2 id="ttQuizH">Teka-teki</h2><span class="lg-chip" id="ttQuizChip">Soal 1 / 10</span></div>
        <div class="tt-riddle" id="ttRiddle"></div>
        <div class="tt-opts4" id="ttQuizOpts"></div>
        <div class="lg-fb" id="ttQuizFb">Pilih satu jawaban.</div>
      </section>
      <aside class="game-panel">
        <h2 id="ttPanelH">🔤 Susun Jawabanmu</h2>
        <p id="ttPanelP">Jawab dengan benar untuk maju ke soal berikutnya.</p>
        <div class="score-row"><div class="mini-stat"><small>Soal</small><strong id="ttNo">1 / 10</strong></div><div class="mini-stat"><small>Soal Benar</small><strong id="ttOk">0</strong></div></div>
        <div class="lg-dots" id="ttDots"></div>
        <div class="tt-fill" id="ttFill">0 dari 0 huruf terisi</div>
        <div class="tt-tools"><button type="button" class="btn btn-primary" id="ttCheck">Periksa Jawaban</button><button type="button" class="btn btn-outline" id="ttDel">⌫ Hapus Huruf</button></div>
        <div class="tt-hint"><b>💡 Petunjuk</b><p id="ttHint">-</p></div>
        <p class="lg-note" id="ttNote">Jawaban salah boleh dicoba lagi sampai benar.</p>
      </aside>
    </div>
  </main>
</section>
<div id="ttRulesModal" class="cp-ov" role="dialog" aria-modal="true"><div class="cp-bubble">
  <button type="button" id="ttRulesClose" class="cp-close" aria-label="Tutup">✕</button>
  <span id="ttRulesBadge" class="cp-badge">Level 1</span><h2 id="ttRulesTitle"></h2><p id="ttRulesGoal" class="cp-goal"></p>
  <div class="cp-time"><span>⏱️ Waktu pengerjaan</span><strong>2 menit</strong></div><ul id="ttRulesList" class="cp-list"></ul>
  <div class="cp-actions"><button type="button" id="ttRulesStart" class="btn btn-primary">Saya Mengerti, Mulai</button></div></div></div>
<div id="ttExitModal" class="cp-ov" role="dialog" aria-modal="true"><div class="cp-bubble cp-small">
  <div class="cp-emoji">🚪</div><h2>Keluar dari permainan?</h2><p class="cp-sub">Level ini belum selesai. Kamu akan kembali ke menu level.</p>
  <div class="cp-actions"><button type="button" id="ttExitNo" class="btn btn-primary">Tidak</button><button type="button" id="ttExitYes" class="btn btn-outline">Ya</button></div></div></div>
<div id="ttOutcome" class="level-outcome-overlay hidden" role="dialog" aria-modal="true"><div class="level-outcome-card">
  <div class="level-outcome-icon" id="ttOIcon">🎉</div><div class="level-outcome-kicker" id="ttOKicker">LEVEL BERHASIL</div><h2 id="ttOTitle"></h2><p id="ttOText"></p>
  <div class="lg-level" id="ttOLevel"></div><div class="lg-score" id="ttOScore" style="display:none"></div><div class="level-outcome-stars" id="ttOStars"></div>
  <div class="level-outcome-actions"><button id="ttOPrimary" class="btn btn-primary" type="button"></button><button id="ttOSecondary" class="btn btn-outline" type="button"></button></div></div></div>`);

/* ---------- navigasi ---------- */
const hideAll=()=>document.querySelectorAll('.app-view').forEach(v=>v.classList.add('hidden'));
const show=m=>m.classList.add('cp-show'),hide=m=>m.classList.remove('cp-show');
const home=()=>{try{return homePageForSession()}catch(e){return 'dashboard'}};
const playing=()=>!$('ttPlayPage').classList.contains('hidden');
function showLevels(){hideAll();renderLevels();$('ttLevelsPage').classList.remove('hidden');window.scrollTo({top:0,behavior:'instant'})}
function renderLevels(){
  const st=getStars();let dirty=false;
  for(let n=1;n<=5;n++)if(isDone(n)&&st[n]!==4){st[n]=4;dirty=true}
  if(dirty)putStars(st);
  $('ttGrid').innerHTML=[1,2,3,4,5].map(i=>{
    const d=LV[i],done=isDone(i),failed=!done&&fails(i)>0,k=done?4:Math.max(0,Math.min(3,Number(st[i])||0)),open=i===1||isDone(i-1);
    const badge=done?'<span class="lv-status done">Selesai</span>':failed?'<span class="lv-status fail">Belum Selesai</span>':'';
    return `<article class="level-card ${open?'active':'locked'}${done?' lv-done':failed?' lv-fail':''}"><div class="level-number">${open?i:'🔒'}</div><h2>${d.name}</h2><p>${d.desc}</p><div class="game-preview">${d.prev}</div><div class="level-stars">Bintang: <span class="game-stars" aria-label="${k} dari 4 bintang">${[1,2,3,4].map(x=>`<span class="${x<=k?'earned':''}">★</span>`).join('')}</span></div><div class="level-time">⏱ 2 menit</div><button class="btn ${open?'btn-primary':'btn-secondary'}" data-tt-play="${i}" ${open?'':'disabled'}>${open?'Mainkan Level '+i:'Selesaikan Level '+(i-1)}</button>${badge}</article>`}).join('');
}
function openRules(lv){
  const d=LV[lv],m=$('ttRulesModal');
  $('ttRulesBadge').textContent='Level '+lv;$('ttRulesTitle').textContent=d.name;$('ttRulesGoal').textContent=d.goal;
  $('ttRulesList').innerHTML=d.rules.map(x=>'<li>'+x+'</li>').join('');m.dataset.level=lv;show(m);
  setTimeout(()=>$('ttRulesStart').focus(),30);
}
function countdown(cb){
  const ov=$('countdownOverlay'),num=$('countdownNumber');if(window.__cpSkipCD||window.__cpRoomBusy){window.__cpSkipCD=false;cb();return}if(!ov||!num){cb();return}
  ov.style.display='';ov.style.pointerEvents='';ov.classList.add('active');let n=3;
  (function tick(){
    if(n<=0){ov.classList.remove('active');ov.style.display='none';requestAnimationFrame(()=>{ov.style.display='';cb()});return}
    num.textContent=n;num.style.animation='none';void num.offsetWidth;num.style.animation='countPulse .9s ease-in-out';n--;setTimeout(tick,850);
  })();
}

/* ---------- waktu ---------- */
let S=null,T=null,left=120;
function paintTime(){
  const tb=$('ttPlayPage').querySelector('.cd-timebar'),fill=tb.querySelector('.cd-track i'),sec=Math.max(0,left);
  fill.style.width=(sec/120*100)+'%';fill.style.backgroundColor='hsl('+Math.round(120*Math.pow(sec/120,0.85))+',72%,'+(sec>20?45:48)+'%)';
  tb.querySelector('strong').textContent='⏱ '+String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  tb.classList.toggle('cd-danger',sec<=10&&sec>0);
}
function stopTimer(){if(T){clearInterval(T);T=null}}
function startTimer(){stopTimer();left=120;paintTime();T=setInterval(()=>{
  if(!playing()){stopTimer();return}
  left--;paintTime();if(left<=0){stopTimer();finish(false)}},1000)}
const busy=()=>!S||S.lock||S.over||window.__cpPaused;

/* ---------- panel umum ---------- */
function fb(id,t,c){const f=$(id);if(!f)return;f.className='lg-fb'+(c?' '+c:'');f.textContent=t}
function paintPanel(){
  const total=S.mode==='match'?10:S.qs.length;
  $('ttNo').textContent=(S.mode==='match'?S.m.n:Math.min(S.i+1,total))+' / '+total;
  $('ttOk').textContent=S.ok;
  const cur=S.mode==='match'?S.m.n:S.i;
  $('ttDots').innerHTML=Array.from({length:total},(_,k)=>`<i class="${k<cur?'d':k===cur&&S.mode!=='match'?'c':''}"></i>`).join('');
}
const PANEL={
  kata:['🔤 Susun Jawabanmu','Gabungkan nama setiap gambar menjadi satu kata.'],
  tempat:['📍 Tebak Tempat','Amati petunjuknya, lalu pilih foto lokasi yang paling cocok.'],
  match:['💬 Tebak Ungkapan','Pasangkan petunjuk emoji dengan ungkapannya.'],
  benda:['👓 Tebak Benda','Perhatikan benda yang buram, lalu pilih gambar yang sama.'],
  peri:['📜 Tebak Peribahasa','Baca cerita gambar, lalu pilih peribahasa yang cocok.']
};

/* ---------- mulai level ---------- */
function setup(lv){
  const mode=LV[lv].mode;
  S={lv,mode,i:0,ok:0,wrong:0,lock:false,over:false,qs:[]};
  if(mode==='kata')S.qs=makeKata();
  else if(mode==='tempat')S.qs=makeTempat();
  else if(mode==='match')S.m=makeMatch();
  else S.qs=lv===4?makeBenda():makePeri();
  const pg=$('ttPlayPage');pg.dataset.mode=mode;pg.dataset.lv=lv;
  const pk=lv===4?'benda':lv===5?'peri':mode;
  $('ttPanelH').textContent=PANEL[pk][0];$('ttPanelP').textContent=PANEL[pk][1];
  $('ttPlayTitle').textContent='Level '+lv+': '+LV[lv].name;$('ttPlaySub').textContent=LV[lv].desc;
  $('ttNote').textContent=(mode==='match'?'Pilih lagi jika pasangannya salah. ':'Jawaban salah boleh dicoba lagi sampai benar. ')+'Selesai sebelum waktu habis = 4 bintang. Jika waktu habis, bintang dihitung dari kemajuanmu.';
  hideAll();pg.classList.remove('hidden');window.scrollTo({top:0,behavior:'instant'});
  const tb=pg.querySelector('.cd-timebar');tb.classList.add('cd-reset');left=120;paintTime();requestAnimationFrame(()=>tb.classList.remove('cd-reset'));
  if(mode==='kata')renderKata();else if(mode==='tempat')renderTempat();else if(mode==='match')renderMatch();else renderQuiz();
}
function begin(lv){stopTimer();hideAll();$('ttLevelsPage').classList.remove('hidden');countdown(()=>{setup(lv);startTimer()})}
function next(render){const cur=S;setTimeout(()=>{if(S!==cur||S.over||!playing())return;S.i++;if(S.i>=S.qs.length)finish(true);else render()},700)}

/* ---------- Level 1: Tebak Kata ---------- */
function renderKata(){
  const q=S.qs[S.i];S.lock=false;
  $('ttKataChip').textContent=q.ans.length+' huruf • '+q.a.split(' ').length+' kata';
  $('ttPics').innerHTML=q.p.map((x,k)=>`<div class="tt-pic c${k}"><span>${x[0]}</span><small>${k===0?x[1]:x[1].length+' huruf'}</small></div>`).join('<span class="tt-plus">+</span>');
  $('ttHint').textContent=q.h;
  $('ttSlots').className='tt-slots';
  fb('ttKataFb',q.pre+' huruf sudah terpasang. Lengkapi '+(q.ans.length-q.pre)+' huruf lagi.','');
  paintKata();paintPanel();
}
function paintKata(){
  const q=S.qs[S.i],words=q.a.split(' ');let idx=0;
  const w=Math.min(660,($('ttSlots').clientWidth||620)),s=Math.max(20,Math.min(46,Math.floor((w-16*(words.length-1))/q.ans.length)-5));
  $('ttSlots').style.setProperty('--s',s+'px');
  $('ttSlots').innerHTML=words.map(w=>`<div class="tt-word">${w.split('').map(()=>{const j=idx++;let cls='tt-slot',ch='';
    if(j<q.pre){cls+=' pre';ch=q.ans[j]}else{const t=q.typed[j-q.pre];if(t!=null){cls+=' typed';ch=q.bank[t].c}else if(j-q.pre===q.typed.length)cls+=' cur'}
    return `<div class="${cls}">${ch}</div>`}).join('')}</div>`).join('');
  $('ttBank').innerHTML=q.bank.map((b,k)=>`<button type="button" class="tt-key" data-tt-key="${k}" ${b.used?'disabled':''}>${b.c}</button>`).join('');
  $('ttFill').textContent=(q.pre+q.typed.length)+' dari '+q.ans.length+' huruf terisi';
}
function typeKey(k){
  if(busy()||S.mode!=='kata')return;const q=S.qs[S.i],b=q.bank[k];if(!b||b.used)return;
  if(q.typed.length>=q.ans.length-q.pre)return;
  b.used=true;q.typed.push(k);$('ttSlots').className='tt-slots';paintKata();
  if(q.typed.length===q.ans.length-q.pre){const cur=S,qi=S.i;setTimeout(()=>{if(S===cur&&S.i===qi&&!S.lock)checkKata()},160)}
}
function delKey(){
  if(busy()||S.mode!=='kata')return;const q=S.qs[S.i];if(!q.typed.length)return;
  q.bank[q.typed.pop()].used=false;$('ttSlots').className='tt-slots';paintKata();
}
function checkKata(){
  if(busy()||S.mode!=='kata')return;const q=S.qs[S.i],need=q.ans.length-q.pre;
  if(q.typed.length<need){fb('ttKataFb','Lengkapi dulu semua kotak hurufnya.','');return}
  const guess=q.typed.map(t=>q.bank[t].c).join('');
  if(guess===q.ans.slice(q.pre)){
    S.lock=true;S.ok++;$('ttSlots').className='tt-slots ok';fb('ttKataFb','✓ Benar! '+q.a+' 🎉','ok');
    const d=$('ttDots').children;if(d[S.i])d[S.i].className='d';$('ttOk').textContent=S.ok;
    next(renderKata);
  }else{
    S.wrong++;$('ttSlots').className='tt-slots bad';fb('ttKataFb','↻ Belum tepat! Huruf dikosongkan, coba lagi.','bad');
    const cur=S,qi=S.i;S.lock=true;
    setTimeout(()=>{if(S!==cur||S.i!==qi||S.over)return;q.typed.forEach(t=>q.bank[t].used=false);q.typed=[];S.lock=false;$('ttSlots').className='tt-slots';paintKata()},450);
  }
}

/* ---------- Level 2: Tebak Tempat ---------- */
function renderTempat(){
  const q=S.qs[S.i];S.lock=false;
  $('ttPlaceClues').innerHTML=q.p.c.join('<i>+</i>');
  $('ttPlaceQ').textContent=q.p.q;$('ttPlaceD').textContent=q.p.d;$('ttHint').textContent=q.p.h;
  $('ttPlaces').innerHTML=q.opts.map((o,k)=>`<button type="button" class="tt-place" data-tt-place="${k}"><span class="tt-ltr">${'ABCD'[k]}</span><span class="tt-radio"></span><div class="tt-photo bg-${o.bg}">${o.e}</div><b>${esc(o.n)}</b></button>`).join('');
  fb('ttPlaceFb','Klik kartu foto lokasi yang paling cocok.','');paintPanel();
}
function answerTempat(k){
  if(busy()||S.mode!=='tempat')return;const q=S.qs[S.i],b=$('ttPlaces').children[k];if(!b||b.disabled)return;
  if(k!==q.ans){S.wrong++;b.classList.add('bad');b.disabled=true;fb('ttPlaceFb','↻ Bukan '+q.opts[k].n+'. Coba lagi!','bad');return}
  S.lock=true;S.ok++;b.classList.add('ok');[...$('ttPlaces').children].forEach(x=>x.disabled=true);
  fb('ttPlaceFb','✓ Benar! Pilihanmu: '+'ABCD'[k]+' • '+q.p.n+' 🎉','ok');
  const d=$('ttDots').children;if(d[S.i])d[S.i].className='d';$('ttOk').textContent=S.ok;
  next(renderTempat);
}

/* ---------- Level 3: Tebak Ungkapan (cocokkan) ---------- */
function renderMatch(){paintMatch();fb('ttMatchFb','Klik satu petunjuk emoji, lalu klik ungkapan atau peribahasa yang cocok.','')}
function paintMatch(){
  const m=S.m,sel=m.sel;
  $('ttClues').innerHTML=m.clues.map(id=>{const it=m.items[id],dn=m.done[id];
    return `<button type="button" class="tt-clue${dn?' done':''}${sel&&sel.s==='c'&&sel.id===id?' sel':''}" data-tt-clue="${id}" ${dn?'disabled':''} aria-label="Petunjuk ${it.e.join(' ')}">${it.e.join('<i>+</i>')}${dn?`<span class="tt-num">${dn}</span>`:''}</button>`}).join('');
  $('ttPhr').innerHTML=m.phr.map(id=>{const it=m.items[id],dn=m.done[id];
    return `<button type="button" class="tt-phr${dn?' done':''}${sel&&sel.s==='p'&&sel.id===id?' sel':''}" data-tt-phr="${id}" ${dn?'disabled':''}><b>${esc(it.p)}</b><small>${esc(it.m)}</small>${dn?`<span class="tt-num">${dn}</span>`:''}</button>`}).join('');
  $('ttMatchOk').textContent=m.n+' / 10 pasangan';$('ttMatchBad').textContent='Salah: '+S.wrong;
}
function pickMatch(side,id){
  if(busy()||S.mode!=='match')return;const m=S.m;if(m.done[id])return;
  if(!m.sel||m.sel.s===side){m.sel=(m.sel&&m.sel.s===side&&m.sel.id===id)?null:{s:side,id};paintMatch();
    if(m.sel)fb('ttMatchFb',side==='c'?'Sekarang klik ungkapan atau peribahasa yang cocok.':'Sekarang klik petunjuk emoji yang cocok.','');return}
  const c=side==='c'?id:m.sel.id,p=side==='p'?id:m.sel.id;m.sel=null;
  if(c===p){
    m.done[c]=++m.n;S.ok=m.n;const it=m.items[c];paintMatch();
    fb('ttMatchFb','✓ Cocok! "'+it.p+'" artinya '+it.m.charAt(0).toLowerCase()+it.m.slice(1)+'.','ok');
    if(m.n>=10){S.lock=true;const cur=S;setTimeout(()=>{if(S===cur&&!S.over&&playing())finish(true)},700)}
  }else{
    S.wrong++;paintMatch();
    const a=$('ttClues').querySelector(`[data-tt-clue="${c}"]`),b=$('ttPhr').querySelector(`[data-tt-phr="${p}"]`);
    [a,b].forEach(x=>x&&x.classList.add('bad'));setTimeout(()=>[a,b].forEach(x=>x&&x.classList.remove('bad')),500);
    fb('ttMatchFb','↻ Belum cocok! Amati lagi emojinya, lalu coba pasangan lain.','bad');
  }
}

/* ---------- Level 4: Tebak Benda (buram) & Level 5: Tebak Peribahasa ---------- */
const SCN=['linear-gradient(135deg,#fff3c4,#ffe0b2)','linear-gradient(135deg,#dff6ff,#e0e7ff)','linear-gradient(135deg,#e5fbe9,#d9f4ff)','linear-gradient(135deg,#ffe8ef,#fff1d6)'];
function renderQuiz(){
  const q=S.qs[S.i],n=S.qs.length,pg=$('ttPlayPage');S.lock=false;pg.dataset.kind=q.kind;
  $('ttQuizChip').textContent='Soal '+(S.i+1)+' / '+n;
  $('ttQuizH').textContent=q.kind==='benda'?'Pilih benda yang cocok':'Peribahasa mana yang cocok?';
  paintRiddle();
  const o=$('ttQuizOpts');
  if(q.kind==='benda'){o.className='tt-opts4';o.innerHTML=q.opts.map((x,k)=>`<button type="button" class="tt-optc" data-tt-opt="${k}"><em>${'ABCD'[k]}</em><span>${x.e}</span><b>${esc(x.n)}</b></button>`).join('')}
  else{o.className='tt-optsP';o.innerHTML=q.opts.map((x,k)=>`<button type="button" class="tt-optp" data-tt-opt="${k}"><em>${'ABC'[k]}</em><span>${esc(x.p)}</span></button>`).join('')}
  $('ttHint').textContent=q.kind==='benda'?'Perhatikan warna dan bentuk besarnya. Makin ke belakang gambar makin buram.':q.t.h;
  fb('ttQuizFb','Pilih satu jawaban.','');paintPanel();
}
function paintRiddle(){
  const q=S.qs[S.i],r=$('ttRiddle');
  if(q.kind==='benda'){
    r.innerHTML=`<span class="lg-chip">MISTERI BURAM</span><h3 class="tt-rtitle">Benda apakah ini?</h3><div class="tt-blurbox"><div class="tt-blurem" id="ttBlurEm" style="filter:blur(${q.blur}px)">${q.t.e}</div></div><p class="tt-rsub">Seperti dilihat tanpa kacamata. Makin ke belakang, makin buram!</p>`;return}
  r.innerHTML=`<span class="lg-chip">BACA CERITA GAMBAR</span><h3 class="tt-rtitle">Apa yang terjadi di gambar ini?</h3><div class="tt-scene" style="background:${SCN[S.i%4]}">${q.t.s.map(x=>`<div>${x}</div>`).join('')}</div><div class="tt-cap"><b>${esc(q.t.cap)}</b><span>${esc(q.t.sub)}</span></div>`;
}
function answerQuiz(k){
  if(busy()||S.mode!=='quiz')return;const q=S.qs[S.i],b=$('ttQuizOpts').children[k];if(!b||b.disabled)return;
  if(k!==q.ans){S.wrong++;b.classList.add('bad');b.disabled=true;
    fb('ttQuizFb',q.kind==='benda'?'↻ Bukan '+q.opts[k].n+'. Coba lagi!':'↻ Belum tepat! Coba pilih peribahasa yang lain.','bad');return}
  S.lock=true;S.ok++;b.classList.add('ok');[...$('ttQuizOpts').children].forEach(x=>x.disabled=true);
  if(q.kind==='benda'){const em=$('ttBlurEm');if(em)em.style.filter='blur(0px)';fb('ttQuizFb','✓ Benar! Itu '+q.t.n+' '+q.t.e,'ok')}
  else fb('ttQuizFb','✓ Benar! \u201C'+q.t.p+'\u201D 🎉','ok');
  const d=$('ttDots').children;if(d[S.i])d[S.i].className='d';$('ttOk').textContent=S.ok;
  next(renderQuiz);
}

/* ---------- hasil ---------- */
function outcome(cfg){
  const m=$('ttOutcome');
  $('ttOIcon').textContent=cfg.icon;$('ttOKicker').textContent=cfg.kicker;$('ttOTitle').textContent=cfg.title;$('ttOText').textContent=cfg.text;
  $('ttOLevel').textContent=cfg.level||'';$('ttOLevel').style.display=cfg.level?'':'none';
  const sc=$('ttOScore');sc.style.display=cfg.score?'':'none';sc.textContent=cfg.score||'';
  const st=$('ttOStars');st.textContent='★'.repeat(cfg.stars)+'☆'.repeat(4-cfg.stars);
  $('ttOPrimary').textContent=cfg.primary;$('ttOSecondary').textContent=cfg.secondary;
  $('ttOPrimary').onclick=()=>{m.classList.add('hidden');cfg.onPrimary()};
  $('ttOSecondary').onclick=()=>{m.classList.add('hidden');showLevels()};
  m.classList.remove('hidden');
}
function recordFail(lv){if(!lv||isDone(lv))return;try{localStorage.setItem(failKey(lv),String(fails(lv)+1))}catch(e){}}
function finish(ok){
  if(!S||S.over)return;S.over=true;S.lock=true;stopTimer();const lv=S.lv,d=LV[lv];
  if(ok){
    const all=getStars();all[lv]=4;putStars(all);
    try{localStorage.setItem(doneKey(lv),'true');localStorage.setItem('cerdasPlayPictureLevel'+lv,'true')}catch(e){}
    try{window.saveStudentScore&&window.saveStudentScore('Tebak-tebakan Level '+lv,100)}catch(e){}
    try{window.updateDashboardProgress&&window.updateDashboardProgress()}catch(e){}
    const nx=lv<5;
    outcome({icon:lv===5?'🏆':'🎉',kicker:'LEVEL BERHASIL',title:'Level '+lv+' Selesai!',stars:4,
      text:'Hebat! Kamu berhasil menyelesaikan Level '+lv+' dan mendapatkan 4 bintang. '+(lv===5?'Kamu sudah menamatkan semua level Tebak-Tebakan! ':'')+'Pilih '+(nx?'Lanjut Level '+(lv+1):'Main Lagi')+' atau kembali ke menu level.',
      primary:nx?'Lanjut Level '+(lv+1):'🔄 Main Lagi',secondary:'Kembali ke Menu Level',onPrimary:()=>nx?openRules(lv+1):begin(lv)});
  }else{
    recordFail(lv);
    const done=S.mode==='match'?S.m.n:S.i,total=S.mode==='match'?10:S.qs.length;
    const ps=Math.max(0,Math.min(3,Math.floor(done/total*4+1e-9))),all=getStars();
    if(!isDone(lv)){all[lv]=Math.max(Number(all[lv])||0,ps);putStars(all)}
    const unit=S.mode==='match'?'pasangan':lv===4?'benda':lv===5?'peribahasa':'soal';
    outcome({icon:'⏰',kicker:'WAKTU HABIS',stars:ps,title:'Waktu Habis!',
      text:S.mode==='match'?'Waktu pengerjaan habis sebelum semua pasangan ditemukan.':'Waktu pengerjaan habis sebelum semua '+unit+' selesai dijawab.',
      level:'Level '+lv+': '+d.name,score:(S.mode==='match'?'💬 ':'📝 ')+done+' dari '+total+' '+unit+' terjawab benar',
      primary:'🔄 Main Lagi',secondary:'🏠 Kembali ke Menu',onPrimary:()=>begin(lv)});
  }
}

/* ---------- keluar ---------- */
function openExit(){const m=$('ttExitModal');if(m.classList.contains('cp-show'))return;window.__cpPaused=true;show(m);setTimeout(()=>$('ttExitNo').focus(),30)}
function closeExit(){window.__cpPaused=false;hide($('ttExitModal'))}
$('ttExitNo').onclick=closeExit;
$('ttExitYes').onclick=()=>{if(S&&!S.over)recordFail(S.lv);closeExit();stopTimer();S=null;$('ttOutcome').classList.add('hidden');showLevels()};
$('ttRulesClose').onclick=()=>hide($('ttRulesModal'));
$('ttRulesStart').onclick=()=>{const lv=+$('ttRulesModal').dataset.level;hide($('ttRulesModal'));begin(lv)};

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if($('ttExitModal').classList.contains('cp-show'))closeExit();else if($('ttRulesModal').classList.contains('cp-show'))hide($('ttRulesModal'));return}
  if(!S||!playing()||e.ctrlKey||e.metaKey||e.altKey)return;
  if(document.querySelector('.cp-ov.cp-show')||!$('ttOutcome').classList.contains('hidden'))return;
  const k=e.key;
  if(S.mode==='kata'){
    if(k==='Backspace'){e.preventDefault();delKey();return}
    if(k==='Enter'){e.preventDefault();checkKata();return}
    if(/^[a-zA-Z]$/.test(k)){const q=S.qs[S.i],up=k.toUpperCase(),idx=q.bank.findIndex(b=>!b.used&&b.c===up);if(idx>=0){e.preventDefault();typeKey(idx)}}
    return;
  }
  const map={a:0,b:1,c:2,d:3,'1':0,'2':1,'3':2,'4':3};const n=map[k.toLowerCase()];
  if(n==null)return;
  if(S.mode==='tempat'){e.preventDefault();answerTempat(n)}else if(S.mode==='quiz'){e.preventDefault();answerQuiz(n)}
});

document.addEventListener('click',e=>{
  const t=e.target;if(!t||!t.closest)return;
  if(t.closest('#openPictureBtn')&&isStudent()){e.preventDefault();e.stopImmediatePropagation();window.showPage('picture');return}
  const pl=t.closest('[data-tt-play]');if(pl){if(!pl.disabled)openRules(+pl.dataset.ttPlay);return}
  const ky=t.closest('[data-tt-key]');if(ky){typeKey(+ky.dataset.ttKey);return}
  const pc=t.closest('[data-tt-place]');if(pc){answerTempat(+pc.dataset.ttPlace);return}
  const cl=t.closest('[data-tt-clue]');if(cl){pickMatch('c',+cl.dataset.ttClue);return}
  const ph=t.closest('[data-tt-phr]');if(ph){pickMatch('p',+ph.dataset.ttPhr);return}
  const op=t.closest('[data-tt-opt]');if(op){answerQuiz(+op.dataset.ttOpt);return}
  if(t.closest('#ttCheck')){checkKata();return}
  if(t.closest('#ttDel')){delKey();return}
  if(t.closest('#ttLvDash,#ttLvBack,#ttLvHome')){e.preventDefault();window.showPage(home());return}
  if(t.closest('#ttPlayBack,#ttPlayHome')){e.preventDefault();openExit();return}
},true);

/* rute showPage('picture') untuk SISWA -> menu level Tebak-Tebakan (guru tetap memakai halaman lama) */
const sp=window.showPage;
window.showPage=function(n){
  const r=sp.apply(this,arguments);
  if(n==='picture'&&(isStudent()||(window.currentSession&&window.currentSession.role==='teacher'))){
    try{if(typeof stopGameTimer==='function')stopGameTimer()}catch(e){}
    const old=$('pictureGamePage');if(old)old.classList.add('hidden');showLevels();
  }
  return r;
};
window.__ttTebak={showLevels,begin,stop:stopTimer};
})();
