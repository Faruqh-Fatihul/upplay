# UpPlay — Catatan Warna, Huruf, dan Logo (V14)

Catatan ini menjadi acuan bersama untuk tim frontend dan backend. Nilai yang sama juga ada di `design/tokens.css` dan `design/tokens.json`.

## 1. Palet inti (dari pemilik produk)

| Nama | Hex | Dipakai untuk |
|---|---|---|
| color 1 | `#d3b99d` | Sorotan, tombol utama di mode gelap, garis guru di grafik (mode gelap) |
| accent | `#ba9d7f` | Dekorasi dan garis lembut. **Jangan dipakai untuk teks di latar terang** (kontras hanya 2.31:1) |
| ground | `#e5e0d9` | Latar halaman mode terang, garis logo di mode gelap |
| ink | `#1e1f1f` | Teks utama, tombol utama mode terang, permukaan kartu mode gelap |
| color 5 | `#4a4a49` | Teks sekunder |
| color 6 | `#84817d` | Teks keterangan, ikon pasif (hanya untuk teks ≥ 14px tebal) |

## 2. Warna turunan (ditambahkan supaya kontras cukup)

Warna turunan dibuat sedikit lebih terang atau lebih gelap dari palet inti.

| Nama | Hex | Asal | Alasan |
|---|---|---|---|
| paper | `#f6f3ee` | ground lebih terang | Permukaan kartu mode terang |
| mist | `#efe9e1` | ground lebih terang | Teks utama mode gelap |
| accent-deep | `#8a6d50` | accent lebih gelap | Garis grafik guru dan tab logo di mode terang (accent asli terlalu pudar) |
| muted-deep | `#5f5c58` | color 6 lebih gelap | Teks keterangan kecil di mode terang |
| night | `#141413` | ink lebih gelap | Latar halaman mode gelap |
| ink-2 | `#2a2a29` | ink lebih terang | Permukaan kedua mode gelap |
| line / line-dark | `#d8d0c5` / `#3a3936` | — | Garis dan border |

Warna status permainan (benar/salah) **tidak** diambil dari palet agar arti hijau = benar dan merah = salah tetap jelas bagi anak: `#2f6b3d` di atas `#d3e6d6`, dan `#a3442f` di atas `#f1d6cd`.

## 2b. Warna pesan form (V13)

| Pesan | Warna | Di atas | Rasio |
|---|---|---|---|
| Galat (merah) | `#b42318` | `#f6f3ee` / putih | 6.0 / 6.5 |
| Berhasil (hijau) | `#1f7a3d` | `#f6f3ee` / putih | 5.1 / 5.6 |

Pesan hanya berupa teks berwarna dengan ikon kecil 16px, tanpa kotak latar.

## 2c. Foto profil bawaan (V14)

Siswa dan guru yang belum memasang foto mendapat siluet orang botak (kepala dan bahu) di dalam lingkaran. Foto tetap bisa diganti.

| Bagian | Warna |
|---|---|
| Lingkaran latar | ground `#e5e0d9` |
| Kepala dan bahu | `#a8a29b` (color 6 sedikit lebih terang) |

Siluet ini dekoratif (rasio 1.93:1), jadi tidak membawa informasi yang harus dibaca. Admin dan master tetap memakai ikon kunci.

## 2d. Bintang hadiah (V14) — satu-satunya warna di luar palet

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--up-star` | `#ffc61a` | Bintang yang didapat (kartu level, popup hasil, Gabung Ruang) |
| `--up-star-edge` | `rgba(120,78,0,.55)` terang / `rgba(0,0,0,.55)` gelap | Tepi tipis bintang supaya tetap terlihat di kertas terang |
| `--up-star-off` | `#cbc3b8` terang / `#57554f` gelap | Bintang yang belum didapat |

- Kuning di atas ink `#1e1f1f`: 10.5:1. Di atas kertas `#f6f3ee` kuning sendiri hanya 1.42:1, karena itu bintang selalu diberi tepi `--up-star-edge`.
- Popup hasil menampilkan bintang **percobaan ini**. Kartu level menyimpan dan menampilkan bintang **terbaik**.

## 2e. Popup pemeliharaan dan akun nonaktif (V14)

| Bagian | Terang | Gelap |
|---|---|---|
| Lapisan belakang | `rgba(30,31,31,.55)` + blur 6px | sama |
| Kotak | paper `#f6f3ee`, garis ground `#e5e0d9` | ink `#1e1f1f`, garis `#3a3936` |
| Lingkaran ikon | ink dengan ikon color 1 | color 1 dengan ikon ink |
| Judul / isi | ink / color 5 (8.02:1) | mist (13.7:1) / `#c9c2b8` |
| Tombol **Oke** | ink, teks paper (14.93:1) | color 1, teks ink (8.81:1) |

## 2f. Kerangka muat / skeleton (V14)

Tampil saat internet lambat, sampai aplikasi selesai dimuat (maksimal 15 detik).

| Bagian | Terang | Gelap |
|---|---|---|
| Latar | paper `#f6f3ee` | night `#141413` |
| Balok kerangka | `#e7e1d8` → kilau `#efe9e1` | `#2c2c2a` → kilau `#262625` |
| Kartu / garis | `#fbf9f6` / `#ebe5dc` | `#1b1b1a` / `#2a2a28` |

## 2g. Logo di header HP (V14)

Tombol logo di kiri atas tampilan HP diberi latar dari palet: ink `#1e1f1f` dengan logo paper/color 1 (terang), dan color 1 `#d3b99d` dengan logo ink/color 5 (gelap).

## 3. Uji kontras (WCAG 2.1)

Syaratnya: teks biasa ≥ 4.5:1, teks besar/garis grafik/ikon ≥ 3:1.

| Pasangan | Rasio | Hasil |
|---|---|---|
| ink `#1e1f1f` di atas paper `#f6f3ee` | 14.93 | ✅ AAA |
| ink di atas ground `#e5e0d9` | 12.59 | ✅ AAA |
| color 5 `#4a4a49` di atas paper | 8.02 | ✅ AAA |
| muted-deep `#5f5c58` di atas paper | 6.01 | ✅ AA |
| color 6 `#84817d` di atas paper | 3.50 | ⚠️ hanya teks besar/ikon |
| accent-deep `#8a6d50` di atas paper | 4.33 | ✅ garis/ikon (≥3), teks besar |
| accent `#ba9d7f` di atas paper | 2.31 | ❌ dekorasi saja |
| mist `#efe9e1` di atas ink (gelap) | 13.70 | ✅ AAA |
| ground di atas night `#141413` | 14.04 | ✅ AAA |
| color 1 `#d3b99d` di atas ink | 8.81 | ✅ AAA |
| accent di atas ink | 6.47 | ✅ AA |
| muted gelap `#a9a49e` di atas ink | 6.68 | ✅ AA |
| ink di atas color 1 (tombol mode gelap) | 8.81 | ✅ AAA |
| bintang `#ffc61a` di atas ink | 10.50 | ✅ ikon |
| bintang `#ffc61a` di atas paper | 1.42 | ⚠️ dibantu tepi `--up-star-edge` |

## 4. Huruf (serif) — frontend dan backend

Seluruh UpPlay memakai dua huruf serif. Backend memakai huruf yang sama untuk apa pun yang dibuat server (surel, PDF rapor/rekap, ekspor).

- **Judul / angka besar:** Playfair Display, tebal 600–900
- **Isi / tombol / tabel / form:** Lora, tebal 400–700
- CSS: `--up-font-display:'Playfair Display','Lora',Georgia,serif;` dan `--up-font-body:'Lora',Georgia,'Times New Roman',serif;`
- Backend (surel HTML): tulis `font-family:'Lora',Georgia,'Times New Roman',serif` langsung di elemen, karena banyak aplikasi surel mengabaikan Google Fonts.
- Backend (PDF/ekspor): sertakan berkas TTF Playfair Display dan Lora (lisensi SIL Open Font License, boleh dibundel).
- Cadangan bila Google Fonts tidak termuat: `Georgia, 'Times New Roman', serif`
- Tautan: `https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Playfair+Display:wght@600..900&display=swap`

## 5. Logo

- **Sidebar tertutup:** bentuk **U** (garis tebal dan tab kecil di kiri atas).
- **Sidebar dibuka:** logo berputar −90° menjadi **P**, karena tab berubah menjadi kaki huruf P. Animasinya 0.7 detik dengan sedikit pantulan.
- Logo tanpa latar belakang. Warnanya mengikuti tema:
  - Terang: garis `#1e1f1f`, tab `#8a6d50`
  - Gelap: garis `#e5e0d9`, tab `#d3b99d`
- Berkas logo: `public/assets/logo-u.svg`, `logo-p.svg`, dan versi `-dark`.
- Di landing page dan topbar game, logo U berputar menjadi P saat kursor diarahkan ke merek.

## 6. Grafik kelas (sama di siswa, guru, admin, master)

**Diperbarui di V13.**

- Garis **siswa** berwarna coklat (accent-deep `#8a6d50`; gelap `#d3b99d`) dengan bayangan coklat transparan.
- Garis **guru** berwarna hitam (ink `#1e1f1f`; gelap `#efe9e1`) dengan bayangan hitam transparan.
- Kedua bayangan memakai gradasi dari 16–20% ke 0%, sehingga garis kelipatan 5 tetap terlihat.
- Tebal garis data 1.6px dan garis bantu 1px. Kurva memakai *monotone cubic*: lentur, tetapi tidak melewati titik data dan tidak turun di bawah 0.
- Urutan animasi:
  1. Kartu naik (Staggered Slide-Up).
  2. Garis bantu sumbu Y melebar dari kiri satu per satu, dengan jeda 80ms.
  3. Angka kelipatan 5 muncul bergantian (genap dulu, lalu ganjil).
  4. Label kelas muncul.
  5. Garis guru dan siswa naik lentur dari 0 dalam 1.3 detik.
- Animasi dimulai saat grafik terlihat di layar. SVG dibangun sekali dan hanya atributnya yang berubah, jadi tidak ada kedip.
- Garis bantu: terang `#dcd4c9` / `#e8e2d9`, gelap `#3a3936` / `#302f2d`.

### Lama (V11–V12)


- Sumbu Y: 0–50 dengan kelipatan 5. Sumbu X: 5A, 5B, 5C, 5D, 6A, 6B, 6C, 6D.
- Garis **Jumlah Siswa**: ink (terang) / mist (gelap), titik bulat.
- Garis **Jumlah Guru (Wali Kelas)**: accent-deep (terang) / color 1 (gelap), titik kotak.
- Tebal garis 2px. Tinggi plot 330px di desktop dan 270px di HP.
- Saat kursor diarahkan atau layar disentuh, muncul garis vertikal putus-putus yang sangat tipis dan dua kotak keterangan (siswa di atas, guru di bawah).

## 7. Gerak

- **Kartu menu (semua pengguna):** Staggered Slide-Up. Tiap kartu naik 36px sambil muncul, durasinya 760ms, dengan jeda 75ms antar-kartu (`cubic-bezier(.22,1,.36,1)`).
- **Grafik kelas:** garis siswa dan guru naik dari 0 ke nilainya dalam 1300ms (*ease-out cubic*). Animasinya sama di siswa, guru, admin, dan master, dan diputar ulang setiap kali Beranda dibuka.
- **Ganti tema ke gelap (bulan berevolusi):** tampilan pengguna dianggap bumi. Bulan sabit menempuh satu putaran orbit elips miring (garis orbit putus-putus tipis terlihat sesaat). Di sisi belakang orbit bulan kecil, redup, dan sedikit kabur. Di sisi depan bulan besar dan lewat di depan kartu, lalu berhenti di kanan atas.
- **Ganti tema ke terang (bumi berevolusi terhadap matahari):** matahari menempuh orbit besar dari belakang ke depan. Cahayanya menyapu layar dari posisi matahari, lalu bersinar di kanan atas.
- Bulan dan matahari tidak memiliki kotak latar.
- Bila pengguna memilih "kurangi gerakan", animasi dimatikan.

## 8. Aturan tema

- Tema disimpan **per akun** (`upplayTheme:<peran>:<id>`). Akun baru selalu mulai dengan **mode terang**.
- Bila pengguna keluar saat mode gelap, ia kembali ke mode gelap ketika masuk lagi.
- Mode gelap satu akun **tidak** memengaruhi akun lain (siswa, guru, admin, master saling terpisah).
- Landing page serta form **Masuk**, **Daftar**, dan **Lupa kata sandi** selalu terang.

## 9. Kontras kartu permainan di mode gelap

| Kartu | Latar | Teks | Rasio |
|---|---|---|---|
| Perhitungan | ink `#1e1f1f` | mist `#efe9e1` | 13.70 |
| Logika Sederhana | color 1 `#d3b99d` | ink `#1e1f1f` | 8.81 |
| Tebak-Tebakan | `#3a3936` | judul mist, isi `#c9c2b8` | 9.6 / 6.9 |

## 10. Waktu permainan (V14)

| Permainan | Waktu per level | Dipakai di |
|---|---|---|
| Perhitungan | 3 menit | siswa, guru, uji coba admin/master, popup aturan, Gabung Ruang |
| Logika Sederhana | 3 menit | sama |
| Tebak-Tebakan | 2 menit | sama |

Nilai ini disimpan di satu tempat: `window.UP_DUR = {math:180, logic:180, picture:120}` (berkas `js/02-upz14-dur.js`).

## 11. Ikon permainan (V14)

- Perhitungan: kalkulator garis.
- Logika Sederhana: **otak** (garis).
- Tebak-Tebakan: **kaca pembesar** (garis).

Ikon yang sama dipakai di siswa, guru, admin, master, landing page, dan kartu Gabung Ruang.
