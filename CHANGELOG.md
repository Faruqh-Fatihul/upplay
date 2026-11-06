# Perubahan

## V14
- **Waktu permainan:** Perhitungan dan Logika Sederhana 3 menit per level, Tebak-Tebakan 2 menit, di siswa, guru, uji coba admin/master, popup aturan, dan Gabung Ruang.
- **Ikon:** Logika Sederhana memakai ikon otak dan Tebak-Tebakan ikon kaca pembesar di keempat pengguna dan landing page.
- **Bintang** berwarna kuning cerah (satu-satunya warna di luar palet). Popup menampilkan bintang percobaan ini, kartu level menyimpan bintang terbaik. Kedip pada kartu level dihilangkan.
- **Guru:** progres Perhitungan kini tersimpan, jadi setelah Level 1 selesai tombol **Lanjut Level 2** membuka popup aturan lalu hitung mundur (sebelumnya Level 1 terulang).
- **Level 5** di ketiga permainan: tombol **Main Lagi** dan **Kembali ke Menu Level**. Judul popup hasil tanpa emoji ganda.
- **Balok Logika (HP):** papan dan daftar kepingan dibuat ringkas, dan slot kepingan tidak hilang saat diseret, sehingga papan tidak bergeser di bawah jari.
- **Gabung Ruang:**
  - Ronde diacak sistem (permainan + level unik, tidak sama berturut-turut). Siswa boleh memainkan level yang belum terbuka.
  - Ruang tunggu menampilkan ketiga kartu permainan (Perhitungan sebelumnya tidak muncul).
  - Guru yang mengakhiri lebih awal mendapat konfirmasi Ya/Tidak; skor yang masuk tetap tersimpan.
  - Kolom kode dan tombol masuk tidak lagi keluar dari popup di HP.
- **Tarik Tambang:** popup aturan → hitung mundur 3, 2, 1 → layar penuh tanpa sidebar. Banyak tombol bisa ditekan bersamaan. Akhiri lebih awal → Ya/Tidak; Ya kembali ke halaman isi nama (nama tetap terisi).
- **Panjat Pinang** dihapus seluruhnya (markup, gaya, skrip). Permainan lain tidak terpengaruh.
- **Pemeliharaan / akun nonaktif:** popup langsung muncul dengan satu tombol **Oke** lalu kembali ke landing page, tanpa hitung mundur. Teks baru sesuai permintaan. Pesan login saat pemeliharaan: "Aplikasi sedang dalam pemeliharaan. Coba beberapa saat lagi."
- **Notifikasi:** tombol teks "Tutup" dihapus. Tombol × kembali ke menu burger (dengan Terang/Gelap). Di HP panel muncul di atas dengan gaya Dynamic Island.
- **Foto profil bawaan** siswa dan guru: siluet kepala dan bahu di dalam lingkaran (tetap bisa diganti).
- **Form Daftar:** contoh isian (nama, `contoh@gmail.com`), surel wajib `@gmail.com`, kata sandi minimal 6 karakter dengan huruf dan angka, beserta peringatannya. Aturan sama di Lupa kata sandi dan Profil.
- **Landing page:** menu Tentang/Fitur/Cara Bermain menggulir rapi tepat di bawah header (tidak terpotong, tidak ada warna bagian lain yang mengintip). Cara Bermain ditulis ulang dengan langkah nyata per permainan. Carousel dan popup Masuk/Daftar rata tengah di HP.
- **Kerangka muat (skeleton)** saat internet lambat, terang dan gelap, desktop dan HP.
- **Tampilan lain:** logo header HP diberi latar palet; tabel klasemen terisi warna selebar tabel; semua popup diberi margin rapi dan tidak sempit di HP.
- **Repo:** lapisan baru `upz14-*`; dokumen palet (bintang, siluet, popup, skeleton) dan huruf serif untuk frontend & backend diperbarui.

## V13
- **Sidebar:**
  - Halaman game yang dibuka dari menu Permainan guru kini menandai menu **Permainan** (sebelumnya tidak ada yang aktif).
  - Atribut item aktif tidak lagi ditulis ulang terus-menerus, jadi tidak ada kedip.
  - Saat sidebar tertutup, mengarahkan kursor ke ikon memunculkan kotak keterangan kecil di semua pengguna, termasuk logo, avatar, Bantuan, dan tema.
- **Form Masuk/Daftar/Lupa sandi:**
  - Pesan galat berupa teks merah dengan ikon kecil, tanpa latar.
  - Pesan berhasil berupa teks hijau dengan centang hijau kecil, tanpa latar.
  - Status hijau lama tidak lagi tertinggal saat terjadi galat.
- **Tombol "Masuk"** di form dan pojok kanan atas landing page kini tanpa panah.
- **Kontrol Permainan:** kalimat keterangan hanya satu (di header) dan menyesuaikan kartu Siswa/Guru.
- **Admin & master:** kartu "Rata-rata Skor" dihapus.
- **Portal guru:**
  - Oval "Portal Guru" di bawah tanggal dihapus.
  - Teks Permainan disesuaikan: Permainan Pembelajaran, Permainan yang tersedia untukmu, "Permainan untuk ditinjau guru", dan tombol Buka Permainan.
  - Kartu Profil, Permainan, dan Grafik ikut animasi Staggered Slide-Up.
- **Foto profil bawaan** siswa dan guru diganti avatar abstrak donat tergigit. Pengguna tetap bisa mengganti foto.
- **Grafik kelas** dibangun ulang:
  - Garis bantu melebar dan angka muncul bergantian.
  - Garis guru hitam dan siswa coklat, masing-masing dengan bayangan transparan.
  - Kurva lentur dan tanpa kedip.
- **Landing page:** emoji diganti ikon abstrak, termasuk pada slide carousel.
- **Repo:** HTML, CSS, dan JS kini dipisah (`public/css`, `public/js`). Versi satu file tersedia di `dist/`.

## V12
- **Lupa kata sandi (siswa):** tautan kecil di atas pesan galat form Masuk membuka form surel, kata sandi baru, dan ulangannya, dengan tombol Batal | Simpan. Setelah disimpan, siswa kembali ke form Masuk dan masuk dengan kata sandi baru. Perubahan langsung terlihat di admin dan master, termasuk catatan log.
- **Guru lupa kata sandi:** diarahkan untuk menghubungi admin / operator sekolah.
- **Portal guru:** menu baru **Profil** dan **Permainan** di bawah Beranda.
  - Profil memuat foto (ganti, hapus, klik untuk memperbesar), surel, no. HP, dan NIP. Nama, kelas, dan kata sandi dikunci abu-abu.
  - Permainan berisi 3 modul (Numerasi, Penalaran Logis, Literasi Visual) yang isinya sama persis dengan game siswa. Levelnya terbuka bertahap seperti siswa.
- **Admin & Master:**
  - Menu "Ringkasan" berganti nama menjadi **Beranda**.
  - Grafik kelas kini naik dari 0 dengan animasi yang sama seperti di siswa dan guru.
  - Kontrol Permainan punya dua kartu: **Permainan Siswa** (per kelas) dan **Permainan Guru** (8 wali kelas).
  - Uji Permainan admin/master tetap tanpa kunci level.
- **Tema:**
  - Disimpan per akun, akun baru selalu terang.
  - Landing page serta form Masuk, Daftar, dan Lupa kata sandi selalu terang.
  - Transisi diubah menjadi bulan yang berevolusi mengelilingi "bumi" (tampilan pengguna), dan bumi yang berevolusi terhadap matahari.
- **Kontras mode gelap:** judul kartu Logika Sederhana memakai ink palet, dan teks kartu Tebak-Tebakan dibuat lebih terang.

## V11
- **Logo baru:** bentuk U saat sidebar tertutup, berputar menjadi P saat sidebar dibuka. Logo tanpa latar belakang dan dipakai di landing page, sidebar keempat pengguna, header HP, topbar game, serta favicon.
- **Grafik kelas dengan dua garis kurva:** Jumlah Siswa dan Jumlah Guru (Wali Kelas).
  - Sumbu Y 0–50 dengan kelipatan 5, sumbu X 5A–6D.
  - Saat kursor diarahkan atau layar disentuh, muncul garis putus-putus dan dua kotak keterangan.
  - Tampilannya sama persis di siswa, guru, admin, dan master.
- **Admin & Master:** tabel "Per kelas" di Ringkasan diganti grafik kelas. Bagian lain tidak diubah.
- **Transisi tema:**
  - Ke gelap: bulan sabit lewat dari kiri bawah ke kanan atas, sementara matahari tenggelam berputar ke kanan bawah.
  - Ke terang: kebalikannya.
  - Bulan dan matahari tanpa latar belakang.
- **Gabung Ruang di HP:** penanda "Ruang • Ronde • Skor" kini berada di bawah garis waktu, tidak lagi menutupi judul permainan. Pilihan BENAR/SALAH dan TTS juga sudah muat di layar.
- **Repo baru:** server Node tanpa dependensi untuk sinkron realtime antarperangkat, token desain, dan dokumentasi backend.
