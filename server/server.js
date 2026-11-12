/* =====================================================================
   UpPlay — Server (Express + Firebase Firestore)  ·  v2 (perbaikan)

   Perubahan utama dibanding versi sebelumnya:
   1. Error Firestore TIDAK lagi ditelan: kegagalan simpan → HTTP 500 (terlihat di klien & Vercel Logs).
   2. Siswa disimpan PER DOKUMEN di koleksi `students` (bukan satu string besar):
        - hapus siswa benar-benar terhapus (tidak "hidup lagi" karena merge),
        - dua perangkat yang mendaftar bersamaan tidak saling menimpa,
        - tidak kena batas 1 MiB per dokumen Firestore.
      Aplikasi lama tetap jalan: GET /kv tetap mengembalikan 'cerdasPlayStudents' sebagai array JSON.
   3. DELETE /kv/:key sekarang benar-benar menghapus (dulu memanggil persistFirestore tanpa nilai).
   4. /health tidak crash lagi; /version baru untuk polling ringan (pengganti SSE).
   5. /events (SSE) dimatikan: tidak cocok dengan Vercel serverless. Dibalas 204 agar EventSource berhenti menyambung ulang.
   6. Penghapusan room dari admin ikut tersimpan (header X-Removed).
   7. Jika Firebase gagal diinisialisasi (mis. env belum diisi), server tetap hidup dan
      menjawab 500 dengan pesan jelas; detail lengkap ada di Vercel Logs.
   ===================================================================== */
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');

/* ---------- Konfigurasi ---------- */
const PORT = +process.env.PORT || 5173;
const ROOT = path.join(__dirname, '..', 'public');
const KEY_RE = /^(cerdasPlay|upplay)/i;
const STUDENT_KEY = 'cerdasPlayStudents';
const ROOM_KEY = 'cerdasPlayQuizRoomsV2';
const NOTIF_KEY = 'cerdasPlayRoomNotifsV1';
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_BYTES = 900 * 1024; // batas aman < 1 MiB per dokumen Firestore
const DAY = 864e5;

/* ---------- Inisialisasi Firebase Admin ---------- */
let db = null;
let initError = null;
try {
  let sa;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const p = path.join(__dirname, 'serviceAccountKey.json');
    if (!fs.existsSync(p)) throw new Error('FIREBASE_SERVICE_ACCOUNT belum diisi dan serviceAccountKey.json tidak ada');
    sa = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n'); // jaga-jaga newline ter-escape
  const fbApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
  db = getFirestore(fbApp);
  try { db.settings({ ignoreUndefinedProperties: true }); } catch (_) { /* sudah pernah di-set */ }
  console.log('[UpPlay] Firebase Admin terhubung ke Firestore.');
} catch (e) {
  initError = e;
  console.error('[UpPlay] Firebase GAGAL diinisialisasi:', e.message);
}

/* ---------- Helper ---------- */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpError = (status, msg) => Object.assign(new Error(msg), { status });
const parse = (v, d) => { try { const r = JSON.parse(v); return r == null ? d : r; } catch (e) { return d; } };
const validKey = k => KEY_RE.test(k) && !k.includes('/') && k.length <= 200;

async function commitChunks(items, apply) {
  for (let i = 0; i < items.length; i += 400) {
    const b = db.batch();
    items.slice(i, i + 400).forEach(it => apply(b, it));
    await b.commit();
  }
}

/* Penanda versi: naik setiap ada perubahan data. Klien cukup membaca 1 dokumen ini untuk tahu ada yang baru. */
async function bump() {
  const v = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await db.collection('meta').doc('version').set({ v });
  return v;
}
async function getVersion() {
  const s = await db.collection('meta').doc('version').get();
  return s.exists ? s.data().v : '0';
}

/* ---------- Siswa (satu dokumen per siswa) ---------- */
let migrated = false;
async function migrateLegacyStudents() {
  if (migrated) return;
  const flag = db.collection('meta').doc('studentsMigrated');
  if (!(await flag.get()).exists) {
    const old = await db.collection('kv_store').doc(STUDENT_KEY).get();
    if (old.exists) {
      const arr = parse(old.data().value, []);
      const list = (Array.isArray(arr) ? arr : []).filter(s => s && ID_RE.test(s.id || ''));
      await commitChunks(list, (b, s) => b.set(db.collection('students').doc(s.id), s));
    }
    await flag.set({ at: Date.now() });
  }
  migrated = true;
}

async function listStudents() {
  await migrateLegacyStudents();
  const snap = await db.collection('students').get();
  const list = snap.docs.map(d => d.data());
  list.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  return list;
}

async function deleteStudent(id) {
  await db.collection('students').doc(id).delete();
  // hapus juga skor/progres siswa itu (kunci 'cerdasPlay:<id>:...' dan 'cerdasPlay<id>...')
  const col = db.collection('kv_store');
  for (const prefix of ['cerdasPlay:' + id + ':', 'cerdasPlay' + id]) {
    const snap = await col
      .where(FieldPath.documentId(), '>=', prefix)
      .where(FieldPath.documentId(), '<', prefix + '\uf8ff')
      .get();
    await commitChunks(snap.docs, (b, d) => b.delete(d.ref));
  }
}

/* ---------- Penggabungan kunci ruang & notifikasi ---------- */
const STATUS = { waiting: 1, playing: 2, finished: 3, closed: 4 };
function better(a, b) {
  const k = p => [p.finished ? 1 : 0, p.roundIndex || 0, p.lastAnswerAt || 0, (p.score || 0) + (p.live || 0)];
  const x = k(a), y = k(b);
  for (let i = 0; i < x.length; i++) { if (x[i] !== y[i]) return x[i] > y[i] ? a : b; }
  return Object.assign({}, a, b);
}
function mergeRooms(oldV, newV) {
  const o = parse(oldV, {}) || {}, n = parse(newV, {}) || {};
  const out = Object.assign({}, o);
  for (const code of Object.keys(n)) {
    const a = o[code], b = n[code];
    if (!a || !b) { out[code] = b || a; continue; }
    if ((b.createdAt || 0) > (a.createdAt || 0)) { out[code] = b; continue; }
    const r = Object.assign({}, a, b);
    if ((STATUS[a.status] || 0) > (STATUS[b.status] || 0)) { r.status = a.status; r.finishedAt = a.finishedAt || b.finishedAt; }
    const pa = a.players || [], pb = b.players || [], ids = [...new Set([...pa, ...pb].map(p => p.id))];
    r.players = ids.map(id => {
      const x = pa.find(p => p.id === id), y = pb.find(p => p.id === id);
      return x && y ? better(x, y) : (x || y);
    });
    if (r.status === 'playing' && r.players.length && r.players.every(p => p.finished)) { r.status = 'finished'; r.finishedAt = r.finishedAt || Date.now(); }
    out[code] = r;
  }
  return JSON.stringify(out);
}
function dropRooms(value, codes) {
  if (!codes || !codes.length) return value;
  const o = parse(value, {}) || {};
  codes.forEach(c => { delete o[c]; });
  return JSON.stringify(o);
}
function mergeNotifs(oldV, newV) {
  const o = parse(oldV, []) || [], n = parse(newV, []) || [], seen = new Set(), out = [];
  for (const x of [...n, ...o]) {
    const id = x.id || (x.ts + '|' + (x.code || '') + '|' + (x.title || ''));
    if (seen.has(id)) continue; seen.add(id);
    if (!x.ts || Date.now() - x.ts < DAY) out.push(x);
  }
  return JSON.stringify(out.sort((a, b) => (b.ts || 0) - (a.ts || 0)));
}

/* Simpan satu kunci (dengan merge di dalam transaksi supaya tidak balapan). Error TIDAK ditelan. */
async function putKey(key, value, removed) {
  if (Buffer.byteLength(value, 'utf8') > MAX_BYTES) throw httpError(413, 'Data terlalu besar untuk satu dokumen Firestore');
  const ref = db.collection('kv_store').doc(key);
  const saved = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    let v = value;
    if (snap.exists) {
      const old = snap.data().value;
      if (typeof old === 'string') {
        if (key === ROOM_KEY) v = mergeRooms(old, v);
        else if (key === NOTIF_KEY) v = mergeNotifs(old, v);
      }
    }
    if (key === ROOM_KEY) v = dropRooms(v, removed);
    tx.set(ref, { value: v });
    return v;
  });
  await bump();
  return saved;
}

/* ---------- Express ---------- */
const app = express();
app.use(express.text({ limit: '4mb', type: 'text/*' }));
app.use(express.json({ limit: '4mb' }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ maxAge: 600 }));

// Jika Firebase belum siap, jawab jelas (CORS sudah terpasang sehingga pesan terbaca di browser).
app.use((req, res, next) => {
  if (initError) return res.status(500).json({ error: 'Server belum terhubung ke Firestore. Periksa env FIREBASE_SERVICE_ACCOUNT di Vercel.' });
  next();
});

app.get('/health', wrap(async (req, res) => {
  const v = await getVersion(); // sekaligus membuktikan Firestore bisa dibaca
  res.json({ ok: true, app: 'UpPlay', firestore: true, version: v });
}));

app.get('/version', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ v: await getVersion() });
}));

// SSE dimatikan (tidak cocok dengan serverless). 204 = EventSource berhenti menyambung ulang.
app.get('/events', (req, res) => res.status(204).end());

/* --- semua data sekaligus (dibaca klien saat halaman dibuka) --- */
app.get('/kv', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const v = await getVersion(); // dibaca DULU: kalau ada tulis di tengah jalan, klien akan memuat ulang di polling berikutnya
  const snap = await db.collection('kv_store').get();
  const all = {};
  snap.forEach(d => {
    const val = d.data().value;
    if (d.id !== STUDENT_KEY && typeof val === 'string') all[d.id] = val;
  });
  all[STUDENT_KEY] = JSON.stringify(await listStudents());
  all.__v = v;
  res.json(all);
}));

app.get('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  res.set('Cache-Control', 'no-store');
  if (key === STUDENT_KEY) return res.type('text/plain').send(JSON.stringify(await listStudents()));
  const snap = await db.collection('kv_store').doc(key).get();
  if (!snap.exists) return res.status(404).json({ error: 'tidak ada' });
  res.type('text/plain').send(snap.data().value);
}));

app.put('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  if (typeof req.body !== 'string') throw httpError(400, 'body harus berupa teks (Content-Type: text/plain)');

  if (key === STUDENT_KEY) {
    // Jalur lama (klien versi lama mengirim seluruh daftar): hanya tambah/ubah, TIDAK menghapus.
    const arr = parse(req.body, []);
    const list = (Array.isArray(arr) ? arr : []).filter(s => s && ID_RE.test(s.id || '') && typeof s.name === 'string');
    await commitChunks(list, (b, s) => b.set(db.collection('students').doc(s.id), s));
    await bump();
    return res.type('text/plain').send(JSON.stringify(await listStudents()));
  }

  const removed = (req.get('x-removed') || '').split(',').map(s => s.trim()).filter(Boolean);
  const saved = await putKey(key, req.body, removed);
  res.type('text/plain').send(saved);
}));

app.delete('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  if (key === STUDENT_KEY) return res.json({ ok: true, ignored: true }); // hapus siswa lewat DELETE /students/:id
  await db.collection('kv_store').doc(key).delete();
  await bump();
  res.json({ ok: true });
}));

/* --- siswa per dokumen --- */
app.get('/students', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await listStudents());
}));

app.put('/students/:id', wrap(async (req, res) => {
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  const s = req.body;
  if (!s || typeof s !== 'object' || Array.isArray(s) || s.id !== id ||
      typeof s.name !== 'string' || !s.name.trim() ||
      typeof s.className !== 'string' || !s.className) {
    throw httpError(400, 'data siswa tidak valid (butuh id, name, className)');
  }
  if (Buffer.byteLength(JSON.stringify(s), 'utf8') > MAX_BYTES) throw httpError(413, 'data siswa terlalu besar (foto profil?)');
  await db.collection('students').doc(id).set(s);
  await bump();
  res.json({ ok: true });
}));

app.delete('/students/:id', wrap(async (req, res) => {
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  await deleteStudent(id);
  await bump();
  res.json({ ok: true });
}));

/* ---------- Berkas statis (hanya untuk pengembangan lokal; di Vercel disajikan oleh Vercel) ---------- */
app.use(express.static(ROOT));

/* ---------- Penanganan error ---------- */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  console.error('[UpPlay] ' + req.method + ' ' + req.originalUrl + ' → ' + status + ': ' + err.message);
  res.status(status).json({ error: status < 500 ? err.message : 'Kesalahan server (lihat Vercel Logs)' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('UpPlay (Express + Firestore) berjalan di http://localhost:' + PORT);
  });
}
// Vercel serverless membaca app ini lewat api/[...path].js
module.exports = app;