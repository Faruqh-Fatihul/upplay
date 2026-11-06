# UpPlay — Panduan Menyambungkan Backend

Aplikasi saat ini menyimpan semua data di `localStorage` browser. Kode sudah diberi penanda `BACKEND:` di tempat-tempat yang nanti diganti dengan panggilan API. Cari teks `BACKEND:` di `public/index.html` untuk menemukannya.

## Tahap 1 — sudah berjalan: jembatan key-value + realtime

`npm start` menjalankan `server/server.js` (Node.js 18+, tanpa paket tambahan).

- `public/js/upplay-sync.js` dimuat paling awal di `<head>`. Skrip ini:
  1. mengambil semua data dari server sebelum aplikasi berjalan,
  2. mengirim setiap perubahan `localStorage` ke `PUT /api/kv/:key`,
  3. mendengarkan `GET /api/events` (Server-Sent Events) lalu memicu event `storage`. Aplikasi sudah mendengarkan event ini untuk Gabung Ruang, klasemen realtime, dan notifikasi.
- Sesi login (`sessionStorage`) tidak dikirim ke server, jadi tiap tab atau perangkat tetap punya akun sendiri.
- Kunci ruang `cerdasPlayQuizRoomsV2` **digabung** di server, bukan ditimpa. Akibatnya banyak siswa bisa mengirim progres bersamaan tanpa saling menghapus. Untuk setiap pemain, server memilih data dengan progres terjauh.
- Riwayat notifikasi `cerdasPlayRoomNotifsV1` disaring di server: data yang lebih dari 24 jam dibuang.
- Guru dan siswa di perangkat berbeda bisa saling terhubung bila berada dalam satu Wi-Fi. Buka `http://<IP-laptop>:5173`.

## Tahap 2 — produksi: endpoint per tabel

| Kunci localStorage | Endpoint yang disarankan |
|---|---|
| `cerdasPlayStudents` | `GET/POST /api/students`, `PATCH /api/students/:id` |
| `cerdasPlayAdminTeachers` | `GET/POST /api/teachers`, `PATCH /api/teachers/:id` |
| `cerdasPlayStudentJabatan` | `PUT /api/classes/:cls/roles` |
| `cerdasPlayQuizRoomsV2` | `POST /api/rooms`, `PATCH /api/rooms/:code` (status `waiting`, `playing`, `finished`, atau `closed`), `PATCH /api/rooms/:code/players/:studentId` (skor, ronde, `live`, `finished`) dan siaran via WebSocket |
| `cerdasPlayRoomNotifsV1` | `GET /api/notifications?since=24h` |
| `cerdasPlay:<id>:scores` | `POST /api/students/:id/scores {game, level, score}` |
| `cerdasPlay:<id>:*Level*Completed` / `*Stars` | `GET/PUT /api/students/:id/progress` |
| `cerdasPlayPvpGroupScoresV4`, `cerdasPlayLocalPvpScoresV3` | `POST /api/pvp-results` |
| `cerdasPlayTeacherProfiles` | `GET/PATCH /api/teachers/:id/profile` (surel, no. HP, NIP, foto). Kata sandi guru **tidak** ikut, karena hanya admin yang boleh mengubahnya. |
| `cerdasPlayTeacherGames` | `GET/PUT /api/teachers/:id/games {math, logic, picture}` (diatur dari Kontrol Permainan → Permainan Guru) |
| `upplayTheme:<peran>:<id>` | `PUT /api/users/:id/preferences {theme}` |
| `cerdasPlayAdminCfg` | `GET/PUT /api/admin/config` (mode pemeliharaan, game aktif per kelas) |
| `cerdasPlayAdminLog` | `GET/POST /api/admin/logs` |
| pesan admin | `GET /api/messages?role=&class=`, `POST /api/messages` (kedaluwarsa 24 jam) |

### Alur lupa kata sandi (siswa)

1. Siswa menekan **Lupa kata sandi?** di form Masuk.
2. Siswa mengisi surel terdaftar, kata sandi baru (minimal 6 karakter), dan ulangannya, lalu menekan Simpan.
3. Saat ini sistem mencari siswa berdasarkan surel, mengganti `password`, mengisi `passwordChangedAt`, dan mencatat log admin. Data di admin dan master ikut berubah otomatis lewat event `storage`.
4. Produksi: `POST /api/auth/forgot-password {email}` → kirim kode/tautan ke surel → `POST /api/auth/reset-password {token, newPassword}`. Jangan izinkan reset hanya dengan surel tanpa verifikasi.
5. Guru tidak bisa mengatur ulang kata sandi sendiri. Kata sandi guru diubah dari portal Admin (`PATCH /api/teachers/:id`).

### Pemeliharaan dan akun nonaktif secara langsung (V14)

- Frontend memeriksa `cerdasPlayAdminCfg.maintenance`, `cerdasPlayStudents[].disabled`, dan `cerdasPlayAdminTeachers.edits[id].disabled` setiap 0,7 detik dan setiap ada event `storage`.
- Bila master mengaktifkan pemeliharaan, atau admin/master menonaktifkan akun yang sedang masuk, pengguna langsung melihat popup dengan satu tombol **Oke** (tanpa hitung mundur). Oke → sesi dihapus → landing page. Progres yang sudah tersimpan tidak dihapus.
- Login saat pemeliharaan ditolak dengan pesan "Aplikasi sedang dalam pemeliharaan. Coba beberapa saat lagi."
- Produksi: kirim event `maintenance` / `account-disabled` lewat WebSocket/SSE dan tolak token sesi di server (HTTP 403/423) supaya tidak bisa diakali dari browser.

### Aturan form Daftar dan kata sandi (V14)

- Surel wajib `@gmail.com`.
- Kata sandi minimal 6 karakter, memuat huruf **dan** angka, tidak boleh satu karakter berulang, dan tidak boleh kata sandi umum (`123456`, `password`, `qwerty123`, dll). Aturan yang sama dipakai di Lupa kata sandi dan Profil (`window.__upPwCheck(pw)` → pesan galat atau `''`).
- Produksi: ulangi validasi yang sama di `POST /api/auth/register` dan `POST /api/auth/reset-password`.

### Gabung Ruang — ronde acak (V14)

- Guru hanya memilih jumlah ronde (1–15). Sistem mengacak pasangan (permainan, level) yang unik, setiap permainan aktif muncul paling sedikit sekali bila jumlah ronde cukup, dan permainan yang sama tidak muncul berturut-turut.
- Level dalam ruang boleh dimainkan walau belum terbuka di akun siswa, dan **tidak** mengubah progres level mandiri.
- Skor ronde: benar = 100 poin + bonus kecepatan dari sisa waktu (Perhitungan & Logika 180 detik, Tebak-Tebakan 120 detik).
- Produksi: urutan ronde dibuat di server saat `POST /api/rooms` supaya semua perangkat mendapat urutan yang sama.
- Guru yang mengakhiri ruang lebih awal mendapat konfirmasi Ya/Tidak. Skor yang sudah masuk tetap tersimpan.

### Tarik Tambang (V14)

- Alur: halaman isi nama → tombol main → popup aturan (**Saya mengerti**) → hitung mundur 3, 2, 1 → layar penuh tanpa sidebar.
- Banyak tombol bisa ditekan bersamaan (2 tim atau lebih di smart TV/layar sentuh).
- Akhiri lebih awal → Ya/Tidak. Tidak = lanjut main, Ya = kembali ke halaman isi nama (nama tetap terisi).
- Hasil disimpan di `cerdasPlayPvpGroupScoresV4` → `POST /api/pvp-results`.

### Kait yang sudah disediakan di frontend

- `window.__upNotify({title, text})`: tampilkan notifikasi yang datang dari server.
- `window.__cpRoomRun()`: paksa siswa memeriksa status ruang (misalnya setelah pesan WebSocket "room started").
- `window.__upzAsk(...)`: dialog konfirmasi Ya/Tidak bergaya UpPlay.
- `window.__upDur('math'|'logic'|'picture')`: durasi level dalam detik.
- `window.__upPwCheck(pw)`: validasi kata sandi.
- `window.__upBootDone()`: sembunyikan kerangka muat (dipanggil otomatis saat aplikasi siap).
- `window.__tgChartRefresh()` / `window.renderStudentDashboardCharts()`: gambar ulang grafik kelas.

### Hal yang perlu diperhatikan

- **Keamanan:** kata sandi guru, admin, dan master saat ini disimpan atau dicek di browser. Di produksi, pengecekan ini wajib dipindah ke server dan kata sandi disimpan dengan bcrypt/argon2.
- **Ranking ruang:** urutkan berdasarkan skor (tertinggi), lalu total waktu (tercepat), lalu waktu jawaban terakhir. Server juga sebaiknya menghitung ranking supaya tidak bisa diubah dari browser.
