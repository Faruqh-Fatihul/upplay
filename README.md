# UpPlay

Media belajar berbasis permainan untuk siswa kelas 5 dan 6 SD, dengan empat jenis pengguna: **siswa**, **guru**, **admin**, dan **master**.

Permainan yang tersedia:
- **Perhitungan** (5 level)
- **Logika Sederhana** (5 level)
- **Tebak-Tebakan** (5 level)
- **Gabung Ruang** (kuis realtime dengan klasemen)
- **Tarik Tambang** (PVP, layar penuh, cocok untuk smart TV)

## Isi repo

```
upplay/
├─ public/                   ← aplikasi (HTML, CSS, JS terpisah)
│  ├─ index.html             ← kerangka halaman (markup saja)
│  ├─ css/NN-*.css           ← 52 lembar gaya, dimuat berurutan (urutan = prioritas)
│  ├─ js/NN-*.js             ← 51 skrip, dimuat berurutan (jangan diubah urutannya)
│  ├─ js/upplay-sync.js      ← jembatan localStorage ⇄ server (realtime)
│  └─ assets/                ← logo U / P (terang & gelap)
├─ server/server.js          ← server Node tanpa dependensi: berkas statis + API + SSE
├─ dist/UpPlay_V14.html      ← versi SATU FILE (bisa dibuka langsung tanpa server)
├─ design/tokens.css|json    ← warna & huruf
├─ docs/DESIGN-TOKENS.md     ← palet, uji kontras, logo, grafik, animasi
├─ docs/BACKEND.md           ← peta kunci data → endpoint API
└─ .vscode/                  ← rekomendasi ekstensi & konfigurasi jalan
```

### Cara membaca CSS & JS

Nomor di depan nama berkas menunjukkan **urutan muat**. Urutannya sama persis dengan urutan di versi satu file, jadi tampilan dan perilaku keduanya identik.

- Lapisan terbaru ada di nomor paling besar: `upz11-*` sampai `upz14-*`. Lapisan V14: `css/52-upz14-style.css`, `js/51-upz14-script.js`, ditambah `js/02-upz14-dur.js` (waktu permainan) dan `js/03-upz14-pw.js` (aturan kata sandi) di `<head>`.
- Untuk mengubah tampilan, tambahkan aturan di berkas lapisan terakhir. Jangan menyunting berkas lama, supaya isi, alur, dan logika game siswa tetap utuh.

## Menjalankan di VS Code

1. Pasang **Node.js 18 atau lebih baru**.
2. Buka folder `upplay` di VS Code.
3. Buka terminal (`Ctrl+\``) lalu jalankan:
   ```bash
   npm start
   ```
4. Buka `http://localhost:5173` di browser.
   - Untuk mencoba guru dan siswa sekaligus, buka satu jendela biasa dan satu jendela penyamaran (incognito). Atau gunakan HP dalam Wi-Fi yang sama dengan alamat `http://<IP-laptop>:5173`.
   - Data tersimpan di `server/data/db.json`. Hapus berkas itu untuk mengulang dari awal.

**Tanpa server:** buka `dist/UpPlay_V14.html` langsung, atau klik kanan `public/index.html` lalu pilih **Open with Live Server**. Aplikasi tetap jalan, tetapi datanya hanya ada di browser itu sendiri (tidak realtime antarperangkat).

## Akun bawaan

- Master: `master` / `Master@2026`
- Admin: `admin` / `Admin@2026`
- Guru: dikelola dari portal Admin (satu wali kelas untuk tiap kelas 5A–6D). Contoh bawaan: `Guru 5A` / `Guru5A123`.
- Siswa lupa kata sandi: klik **Lupa kata sandi?** di form Masuk. Guru yang lupa kata sandi menghubungi admin/operator sekolah.
- Siswa: daftar sendiri lewat tombol **Daftar** di landing page.

## Waktu permainan

| Permainan | Waktu per level |
|---|---|
| Perhitungan | 3 menit |
| Logika Sederhana | 3 menit |
| Tebak-Tebakan | 2 menit |

Ubah di satu tempat saja: `public/js/02-upz14-dur.js` (`window.UP_DUR`).

## Catatan pengembangan

- Lihat `docs/DESIGN-TOKENS.md` sebelum mengubah warna, huruf, logo, atau animasi.
- Lihat `docs/BACKEND.md` untuk memindahkan data dari `localStorage` ke database.
- Isi, alur, dan logika game siswa (Perhitungan, Logika Sederhana, Tebak-Tebakan) **tidak boleh dihapus**. Perubahan tampilan ditambahkan sebagai lapisan baru di akhir `index.html` (lihat lapisan `upz11-*` sampai `upz14-*`).

## Alat bantu

`tools/split.py`: memecah versi satu file menjadi `index.html`, `css/`, dan `js/`.

```bash
python tools/split.py dist/UpPlay_V14.html public-baru
```
