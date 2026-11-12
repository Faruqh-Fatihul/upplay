/* =====================================================================
   UpPlay — Server (Express + Firebase Firestore)  ·  v3 (login di server)

   Yang baru dibanding v2:
   - Login & pendaftaran diproses di SERVER (POST /auth/login, /auth/register).
     Password disimpan sebagai hash scrypt (passHash), tidak pernah dikirim balik ke klien.
   - Server memberi TOKEN sesi bertanda tangan (HMAC). Semua endpoint data wajib memakai token.
   - GET /kv hanya mengembalikan data yang berhak dilihat peran pemegang token:
        siswa → miliknya + data bersama; guru → kelasnya; admin/master → semuanya (tanpa hash).
   - Penulisan dibatasi per peran (siswa hanya kuncinya sendiri, dst).
   - Akun admin/master disimpan di server (koleksi `accounts`), password awal dari env.
   - Guru disimpan di koleksi `teachers` (hash), dikelola admin lewat /admin/teachers.
   - Pembatasan percobaan login (kunci 5 menit setelah 6 kali gagal per perangkat+nama).

   ENV WAJIB di Vercel:  FIREBASE_SERVICE_ACCOUNT, AUTH_SECRET (≥32 karakter acak),
                         MASTER_PASSWORD, ADMIN_PASSWORD (≥8 karakter; dipakai sekali saat akun dibuat)
   ENV opsional:         ALLOWED_ORIGINS (daftar origin dipisah koma, mis. https://upplay.my.id)
   ===================================================================== */
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldPath, FieldValue } = require('firebase-admin/firestore');
const A = require('./auth');

/* ---------- Konfigurasi ---------- */
const PORT = +process.env.PORT || 5173;
const ROOT = path.join(__dirname, '..', 'public');
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const STUDENT_KEY = 'cerdasPlayStudents';
const ROOM_KEY = 'cerdasPlayQuizRoomsV2';
const NOTIF_KEY = 'cerdasPlayRoomNotifsV1';
const CFG_KEY = 'cerdasPlayAdminCfg';
const JAB_KEY = 'cerdasPlayStudentJabatan';
const KEY_RE = /^(cerdasPlay|upplay)/i;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_BYTES = 900 * 1024;
const DAY = 864e5;
const TTL = { student: 12 * 3600, teacher: 12 * 3600, admin: 6 * 3600 };
const MAX_FAILS = 6, LOCK_MS = 5 * 60 * 1000;

/* ---------- Firebase Admin ---------- */
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
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  const fbApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
  db = getFirestore(fbApp);
  try { db.settings({ ignoreUndefinedProperties: true }); } catch (_) { /* sudah pernah di-set */ }
  console.log('[UpPlay] Firebase Admin terhubung ke Firestore.');
} catch (e) {
  initError = e;
  console.error('[UpPlay] Firebase GAGAL diinisialisasi:', e.message);
}

/* ---------- Helper umum ---------- */
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpError = (status, msg, code) => Object.assign(new Error(msg), { status, code });
const parse = (v, d) => { try { const r = JSON.parse(v); return r == null ? d : r; } catch (e) { return d; } };
const validKey = k => KEY_RE.test(k) && !k.includes('/') && k.length <= 200;
const col = n => db.collection(n);

async function commitChunks(items, apply) {
  for (let i = 0; i < items.length; i += 400) {
    const b = db.batch();
    items.slice(i, i + 400).forEach(it => apply(b, it));
    await b.commit();
  }
}
async function bump() {
  const v = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await col('meta').doc('version').set({ v });
  return v;
}
async function getVersion() {
  const s = await col('meta').doc('version').get();
  return s.exists ? s.data().v : '0';
}

/* ---------- Siswa ---------- */
let studentsReady = false;
async function ensureStudents() { // sekali: impor data lama dari kv_store & isi nameLower/emailLower
  if (studentsReady) return;
  const flag = col('meta').doc('studentsReady');
  if (!(await flag.get()).exists) {
    const old = await col('kv_store').doc(STUDENT_KEY).get();
    if (old.exists) {
      const arr = parse(old.data().value, []);
      const list = (Array.isArray(arr) ? arr : []).filter(s => s && ID_RE.test(s.id || '') && typeof s.name === 'string');
      await commitChunks(list, (b, s) => b.set(col('students').doc(s.id), s, { merge: true }));
    }
    const snap = await col('students').get();
    const need = snap.docs.filter(d => !d.data().nameLower);
    await commitChunks(need, (b, d) => { const s = d.data(); b.update(d.ref, { nameLower: A.norm(s.name), emailLower: A.norm(s.email) }); });
    await flag.set({ at: Date.now() });
  }
  studentsReady = true;
}
async function listStudentsRaw() {
  await ensureStudents();
  const snap = await col('students').get();
  const list = snap.docs.map(d => d.data());
  list.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  return list;
}
async function studentsFor(sess) { // hanya baca yang berhak → hemat pembacaan Firestore
  if (sess.role === 'admin') return listStudentsRaw();
  await ensureStudents();
  if (sess.role === 'teacher') return (await col('students').where('className', '==', sess.className).get()).docs.map(d => d.data());
  const s = await col('students').doc(sess.id).get();
  return s.exists ? [s.data()] : [];
}
async function createStudent(v, strict) {
  const name = String(v.name || '').trim().replace(/\s+/g, ' ');
  const email = String(v.email || '').trim();
  const className = String(v.className || '');
  const password = String(v.password || '');
  if (name.length < 3 || name.length > 60 || !/^[A-Za-z\u00C0-\u024F' .-]+$/.test(name)) throw httpError(400, 'Nama minimal 3 huruf dan hanya berisi huruf, spasi, titik, atau tanda petik.');
  const emailOk = strict ? /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) throw httpError(400, strict ? 'Surel harus memakai akun Gmail, contoh: contoh@gmail.com' : 'Format email tidak valid.');
  if (!A.CLASSES.includes(className)) throw httpError(400, 'Kelas tidak valid.');
  if (password.length < 6 || password.length > 100) throw httpError(400, 'Kata sandi minimal 6 karakter.');
  const all = await listStudentsRaw();
  if (all.some(s => A.norm(s.email) === A.norm(email))) throw httpError(409, 'Email sudah terdaftar.');
  if (all.some(s => A.norm(s.name) === A.norm(name))) throw httpError(409, 'Nama tersebut sudah digunakan.');
  let n = Date.now();
  while (all.some(s => s.id === 'student-' + n)) n++;
  const id = 'student-' + n;
  const doc = {
    id, name, nameLower: A.norm(name), email, emailLower: A.norm(email), className,
    absen: '', photo: '', createdAt: new Date().toISOString(), passHash: await A.hashPassword(password)
  };
  await col('students').doc(id).create(doc);
  await bump();
  return doc;
}
async function deleteStudent(id) {
  await col('students').doc(id).delete();
  const kv = col('kv_store');
  for (const prefix of ['cerdasPlay:' + id + ':', 'cerdasPlay' + id]) { // skor/progres siswa itu
    const snap = await kv.where(FieldPath.documentId(), '>=', prefix).where(FieldPath.documentId(), '<', prefix + '\uf8ff').get();
    await commitChunks(snap.docs, (b, d) => b.delete(d.ref));
  }
}

/* ---------- Guru ---------- */
let teachersReady = false;
async function ensureTeachers() { // sekali: buat 8 akun guru bawaan (password bawaan sama seperti sebelumnya → ganti lewat Data Guru)
  if (teachersReady) return;
  const flag = col('meta').doc('teachersSeeded');
  if (!(await flag.get()).exists) {
    for (const cls of A.CLASSES) {
      const id = 'teacher-' + cls + '-1', ref = col('teachers').doc(id);
      if (!(await ref.get()).exists) {
        await ref.set({ id, name: 'Guru ' + cls, nameLower: 'guru ' + cls.toLowerCase(), className: cls, base: true, disabled: false, passHash: await A.hashPassword('Guru' + cls + '123') });
      }
    }
    await flag.set({ at: Date.now() });
  }
  teachersReady = true;
}
async function listTeachersRaw() {
  await ensureTeachers();
  return (await col('teachers').get()).docs.map(d => d.data());
}

/* ---------- Akun admin / master ---------- */
async function loadAccounts() {
  const out = {};
  for (const lv of ['master', 'admin']) {
    const ref = col('accounts').doc(lv);
    let s = await ref.get();
    if (!s.exists) {
      const pw = process.env[lv === 'master' ? 'MASTER_PASSWORD' : 'ADMIN_PASSWORD'];
      if (pw && pw.length >= 8) {
        try { await ref.create({ user: lv, hash: await A.hashPassword(pw) }); } catch (e) { /* sudah dibuat instance lain */ }
        s = await ref.get();
      }
    }
    if (s.exists) out[lv] = s.data();
  }
  return out;
}
async function loadAdminUsers() {
  const a = await loadAccounts();
  return { master: (a.master && a.master.user) || 'master', admin: (a.admin && a.admin.user) || 'admin' };
}

/* ---------- Autentikasi ---------- */
function requireSecret() {
  if (AUTH_SECRET.length < 32) throw httpError(500, 'Server belum dikonfigurasi (AUTH_SECRET). Hubungi admin.');
}
async function authenticate(name, password) {
  const lower = A.norm(name);
  const accounts = await loadAccounts();
  for (const lv of ['master', 'admin']) {
    const a = accounts[lv];
    if (a && a.user === lower) {
      if (await A.verifyPassword(password, a.hash)) return { role: 'admin', session: { role: 'admin', id: lv, name: lv === 'master' ? 'Master' : 'Admin', adminLevel: lv } };
      return null;
    }
  }
  await ensureTeachers();
  for (const d of (await col('teachers').where('nameLower', '==', lower).get()).docs) {
    const t = d.data();
    if (await A.verifyPassword(password, t.passHash)) return { role: 'teacher', disabled: !!t.disabled, session: { role: 'teacher', id: t.id, name: t.name, className: t.className } };
  }
  await ensureStudents();
  for (const d of (await col('students').where('nameLower', '==', lower).get()).docs) {
    const s = d.data();
    let ok = false;
    if (s.passHash) ok = await A.verifyPassword(password, s.passHash);
    else if (typeof s.password === 'string') { // data lama (password polos): cocokkan lalu ubah ke hash
      ok = A.safeEqual(password, s.password);
      if (ok) await d.ref.update({ passHash: await A.hashPassword(password), password: FieldValue.delete() });
    }
    if (ok) return { role: 'student', disabled: !!s.disabled, session: { role: 'student', id: s.id, name: s.name, className: s.className, email: s.email || '', absen: s.absen || '', photo: s.photo || '' } };
  }
  await A.dummyVerify(password);
  return null;
}
function bearer(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  return m ? m[1] : null;
}
function sessionFrom(req) {
  requireSecret();
  const b = A.verifyToken(bearer(req), AUTH_SECRET);
  if (!b) throw httpError(401, 'Sesi tidak valid atau sudah berakhir. Silakan masuk lagi.', 'token');
  return { role: b.r, id: b.s, name: b.n, className: b.c, adminLevel: b.l };
}
async function assertActive(sess) { // akun yang sudah dihapus/dinonaktifkan tidak boleh memakai token lama
  if (sess.role === 'admin') return;
  const s = await col(sess.role === 'teacher' ? 'teachers' : 'students').doc(sess.id).get();
  if (!s.exists) throw httpError(401, 'Akun tidak ditemukan. Data siswa/guru ini sudah dihapus oleh admin.', 'account_gone');
  if (s.data().disabled) throw httpError(401, 'Akun dinonaktifkan. Hubungi admin sekolah.', 'disabled');
}
const requireAdmin = sess => { if (sess.role !== 'admin') throw httpError(403, 'Hanya admin yang boleh melakukan ini.'); };
async function isMaintenance() {
  const s = await col('kv_store').doc(CFG_KEY).get();
  return !!(s.exists && parse(s.data().value, {}).maintenance);
}

/* Pembatasan percobaan login (per perangkat + nama) */
const lockKey = (req, name) => crypto.createHash('sha256').update((req.ip || '') + '|' + A.norm(name)).digest('hex').slice(0, 40);
async function checkLock(key) {
  const s = await col('loginFails').doc(key).get();
  if (s.exists && (s.data().until || 0) > Date.now()) throw httpError(429, 'Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.');
}
async function noteFail(key) {
  const ref = col('loginFails').doc(key);
  await db.runTransaction(async tx => {
    const s = await tx.get(ref);
    const d = s.exists ? s.data() : { n: 0 };
    const stale = s.exists && Date.now() - (d.t || 0) > LOCK_MS * 2;
    const n = (stale ? 0 : d.n || 0) + 1;
    tx.set(ref, { n, t: Date.now(), until: n >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
  });
}
const clearFails = key => col('loginFails').doc(key).delete().catch(() => {});

const regHits = new Map();
function regLimit(ip) { // pembatas pendaftaran per perangkat (per instance serverless; cukup untuk mencegah spam sederhana)
  const now = Date.now();
  if (regHits.size > 500) regHits.clear();
  const h = regHits.get(ip) || { n: 0, t: now };
  if (now - h.t > 3600e3) { h.n = 0; h.t = now; }
  h.n++; regHits.set(ip, h);
  if (h.n > 15) throw httpError(429, 'Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.');
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

/* Simpan satu kunci (merge di dalam transaksi). Error TIDAK ditelan. */
async function putKey(key, value, opt) {
  opt = opt || {};
  if (Buffer.byteLength(value, 'utf8') > MAX_BYTES) throw httpError(413, 'Data terlalu besar untuk satu dokumen Firestore');
  const ref = col('kv_store').doc(key);
  const saved = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const old = snap.exists && typeof snap.data().value === 'string' ? snap.data().value : null;
    let v = value;
    if (old != null) {
      if (key === ROOM_KEY) v = mergeRooms(old, v);
      else if (key === NOTIF_KEY) v = mergeNotifs(old, v);
    }
    if (key === ROOM_KEY) v = dropRooms(v, opt.removed);
    if (opt.scopeIds) v = A.mergeScopedMap(old || '{}', v, opt.scopeIds);
    if (key === CFG_KEY) v = A.stripCfg(v);
    tx.set(ref, { value: v });
    return v;
  });
  await bump();
  return saved;
}
async function loadKv() {
  const out = {};
  (await col('kv_store').get()).forEach(d => { const v = d.data().value; if (typeof v === 'string') out[d.id] = v; });
  return out;
}

/* ---------- Express ---------- */
const app = express();
app.set('trust proxy', true);
app.use(express.text({ limit: '4mb', type: 'text/*' }));
app.use(express.json({ limit: '4mb' }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ maxAge: 600, origin: origins.length ? origins : true }));

app.use((req, res, next) => {
  if (initError) return res.status(500).json({ error: 'Server belum terhubung ke Firestore. Periksa env FIREBASE_SERVICE_ACCOUNT di Vercel.' });
  next();
});

app.get('/health', wrap(async (req, res) => {
  const v = await getVersion();
  res.json({
    ok: true, app: 'UpPlay', firestore: true, version: v,
    config: { authSecret: AUTH_SECRET.length >= 32, masterPassword: !!process.env.MASTER_PASSWORD, adminPassword: !!process.env.ADMIN_PASSWORD }
  });
}));
app.get('/version', wrap(async (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ v: await getVersion() }); }));
app.get('/events', (req, res) => res.status(204).end());

/* --- login & pendaftaran (tanpa token) --- */
app.post('/auth/login', wrap(async (req, res) => {
  requireSecret();
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const name = String(b.name || '').trim(), password = String(b.password || '');
  if (!name || !password) throw httpError(400, 'Nama dan password wajib diisi.');
  if (password.length > 200 || name.length > 100) throw httpError(400, 'Data masuk tidak valid.');
  const lk = lockKey(req, name);
  await checkLock(lk);
  const found = await authenticate(name, password);
  if (!found) { await noteFail(lk); throw httpError(401, 'Nama atau password salah. Periksa kembali data masuk Anda.'); }
  if (found.role !== 'admin') {
    if (await isMaintenance()) throw httpError(503, 'Aplikasi sedang dalam pemeliharaan. Coba beberapa saat lagi.');
    if (found.disabled) throw httpError(403, 'Akun dinonaktifkan. Hubungi admin sekolah.');
  }
  await clearFails(lk);
  const s = found.session;
  const token = A.signToken({ r: s.role, s: s.id, n: s.name, c: s.className, l: s.adminLevel }, AUTH_SECRET, TTL[s.role]);
  res.json({ session: Object.assign({}, s, { token }) });
}));

app.post('/auth/register', wrap(async (req, res) => {
  regLimit(req.ip || 'x');
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  if (await isMaintenance()) throw httpError(503, 'Aplikasi sedang dalam pemeliharaan. Coba beberapa saat lagi.');
  const doc = await createStudent(b, true);
  res.json({ ok: true, name: doc.name });
}));

app.post('/auth/password', wrap(async (req, res) => { // ganti password sendiri
  const sess = sessionFrom(req);
  await assertActive(sess);
  const b = req.body || {};
  const cur = String(b.currentPassword || ''), np = String(b.newPassword || '');
  if (np.length < 6 || np.length > 100) throw httpError(400, 'Kata sandi baru minimal 6 karakter.');
  let ref, hash;
  if (sess.role === 'admin') { ref = col('accounts').doc(sess.id); const s = await ref.get(); hash = s.exists && s.data().hash; if (np.length < 8) throw httpError(400, 'Password admin minimal 8 karakter.'); }
  else { ref = col(sess.role === 'teacher' ? 'teachers' : 'students').doc(sess.id); const s = await ref.get(); hash = s.exists && s.data().passHash; }
  if (!(await A.verifyPassword(cur, hash))) throw httpError(403, 'Password saat ini salah.');
  await ref.update(sess.role === 'admin' ? { hash: await A.hashPassword(np) } : { passHash: await A.hashPassword(np) });
  res.json({ ok: true });
}));

/* --- data (wajib token) --- */
app.get('/kv', wrap(async (req, res) => {
  const sess = sessionFrom(req);
  await assertActive(sess);
  res.set('Cache-Control', 'no-store');
  const v = await getVersion(); // dibaca DULU supaya klien memuat ulang bila ada tulis di tengah jalan
  const isAdm = sess.role === 'admin';
  const [kv, students, teachers, users] = await Promise.all([
    loadKv(), studentsFor(sess), isAdm ? listTeachersRaw() : [], isAdm ? loadAdminUsers() : {}
  ]);
  const out = A.filterAll({ kv, students, teachers, users }, sess);
  out.__v = v;
  res.json(out);
}));

app.get('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  const sess = sessionFrom(req);
  await assertActive(sess);
  res.set('Cache-Control', 'no-store');
  const students = await studentsFor(sess);
  const kv = {};
  if (!A.SERVER_MANAGED.has(key)) {
    const s = await col('kv_store').doc(key).get();
    if (s.exists && typeof s.data().value === 'string') kv[key] = s.data().value;
  }
  const all = A.filterAll({ kv, students, teachers: sess.role === 'admin' ? await listTeachersRaw() : [], users: sess.role === 'admin' ? await loadAdminUsers() : {} }, sess);
  if (!(key in all)) throw httpError(404, 'tidak ada');
  res.type('text/plain').send(all[key]);
}));

app.put('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  const sess = sessionFrom(req);
  if (A.SERVER_MANAGED.has(key)) return res.json({ ok: true, ignored: true }); // dikelola server (siswa/guru/akun)
  if (!A.canWrite(sess, key)) throw httpError(403, 'Tidak diizinkan mengubah data ini.');
  if (typeof req.body !== 'string') throw httpError(400, 'body harus berupa teks (Content-Type: text/plain)');
  const opt = { removed: (req.get('x-removed') || '').split(',').map(s => s.trim()).filter(Boolean) };
  if (key === JAB_KEY && sess.role === 'teacher') opt.scopeIds = new Set((await studentsFor(sess)).map(s => s.id));
  const saved = await putKey(key, req.body, opt);
  res.type('text/plain').send(saved);
}));

app.delete('/kv/:key', wrap(async (req, res) => {
  const key = req.params.key;
  if (!validKey(key)) throw httpError(400, 'kunci tidak dikenal');
  const sess = sessionFrom(req);
  if (A.SERVER_MANAGED.has(key)) return res.json({ ok: true, ignored: true });
  if (!A.canDelete(sess, key)) throw httpError(403, 'Tidak diizinkan menghapus data ini.');
  await col('kv_store').doc(key).delete();
  await bump();
  res.json({ ok: true });
}));

/* --- siswa per dokumen (edit profil/penghapusan; password tidak pernah lewat sini) --- */
app.put('/students/:id', wrap(async (req, res) => {
  const sess = sessionFrom(req);
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.id !== id) throw httpError(400, 'data siswa tidak valid');
  await ensureStudents();
  const ref = col('students').doc(id);
  const snap = await ref.get();
  const doc = A.updateStudent(snap.exists ? snap.data() : null, body, sess);
  if (!doc) throw httpError(403, 'Tidak diizinkan mengubah data siswa ini.');
  if (Buffer.byteLength(JSON.stringify(doc), 'utf8') > MAX_BYTES) throw httpError(413, 'data siswa terlalu besar (foto profil?)');
  await ref.set(doc);
  await bump();
  res.json({ ok: true });
}));

app.delete('/students/:id', wrap(async (req, res) => {
  const sess = sessionFrom(req);
  requireAdmin(sess);
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  await deleteStudent(id);
  await bump();
  res.json({ ok: true });
}));

/* --- khusus admin --- */
app.post('/admin/students', wrap(async (req, res) => {
  requireAdmin(sessionFrom(req));
  const doc = await createStudent(req.body || {}, false);
  res.json({ ok: true, id: doc.id });
}));

app.post('/admin/students/:id/password', wrap(async (req, res) => {
  requireAdmin(sessionFrom(req));
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  const pw = String((req.body || {}).password || '');
  if (pw.length < 6 || pw.length > 100) throw httpError(400, 'Password minimal 6 karakter.');
  const ref = col('students').doc(id);
  if (!(await ref.get()).exists) throw httpError(404, 'Siswa tidak ditemukan.');
  await ref.update({ passHash: await A.hashPassword(pw), password: FieldValue.delete() });
  res.json({ ok: true });
}));

async function teacherNameTaken(name, exceptId) {
  return (await listTeachersRaw()).some(t => t.id !== exceptId && A.norm(t.name) === A.norm(name));
}
app.post('/admin/teachers', wrap(async (req, res) => {
  requireAdmin(sessionFrom(req));
  const b = req.body || {};
  const name = String(b.name || '').trim(), className = String(b.className || ''), pw = String(b.password || '');
  if (!name || name.length > 60) throw httpError(400, 'Nama wajib diisi.');
  if (!A.CLASSES.includes(className)) throw httpError(400, 'Kelas tidak valid.');
  if (pw.length < 6 || pw.length > 100) throw httpError(400, 'Password minimal 6 karakter.');
  if (await teacherNameTaken(name)) throw httpError(409, 'Nama guru sudah ada.');
  const id = 'teacher-custom-' + Date.now();
  await col('teachers').doc(id).set({ id, name, nameLower: A.norm(name), className, base: false, disabled: false, passHash: await A.hashPassword(pw) });
  await bump();
  res.json({ ok: true, id });
}));

app.put('/admin/teachers/:id', wrap(async (req, res) => {
  requireAdmin(sessionFrom(req));
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  const ref = col('teachers').doc(id), snap = await ref.get();
  if (!snap.exists) throw httpError(404, 'Guru tidak ditemukan.');
  const t = snap.data(), b = req.body || {}, upd = {};
  if (typeof b.name === 'string') {
    const name = b.name.trim();
    if (!name || name.length > 60) throw httpError(400, 'Nama wajib diisi.');
    if (await teacherNameTaken(name, id)) throw httpError(409, 'Nama guru sudah ada.');
    upd.name = name; upd.nameLower = A.norm(name);
  }
  if (typeof b.className === 'string' && !t.base) {
    if (!A.CLASSES.includes(b.className)) throw httpError(400, 'Kelas tidak valid.');
    upd.className = b.className;
  }
  if (typeof b.disabled === 'boolean') upd.disabled = b.disabled;
  if (b.password) {
    const pw = String(b.password);
    if (pw.length < 6 || pw.length > 100) throw httpError(400, 'Password minimal 6 karakter.');
    upd.passHash = await A.hashPassword(pw);
  }
  if (Object.keys(upd).length) { await ref.update(upd); await bump(); }
  res.json({ ok: true });
}));

app.delete('/admin/teachers/:id', wrap(async (req, res) => {
  requireAdmin(sessionFrom(req));
  const id = req.params.id;
  if (!ID_RE.test(id)) throw httpError(400, 'id tidak valid');
  const ref = col('teachers').doc(id), snap = await ref.get();
  if (!snap.exists) throw httpError(404, 'Guru tidak ditemukan.');
  if (snap.data().base) throw httpError(400, 'Akun guru bawaan tidak bisa dihapus (nonaktifkan saja).');
  await ref.delete();
  await bump();
  res.json({ ok: true });
}));

app.post('/admin/account', wrap(async (req, res) => { // Master mengganti akun Master / Admin
  const sess = sessionFrom(req);
  if (sess.role !== 'admin' || sess.adminLevel !== 'master') throw httpError(403, 'Hanya Master yang boleh mengelola akun ini.');
  const b = req.body || {};
  const level = b.level;
  if (level !== 'master' && level !== 'admin') throw httpError(400, 'Akun tidak dikenal.');
  const accounts = await loadAccounts();
  const cur = accounts[level];
  if (!cur) throw httpError(404, 'Akun belum dibuat (isi env MASTER_PASSWORD / ADMIN_PASSWORD).');
  if (!(await A.verifyPassword(String(b.currentPassword || ''), cur.hash))) throw httpError(403, 'Password saat ini salah.');
  const nu = A.norm(b.newUser || cur.user), np = String(b.newPassword || '');
  if (np && np.length < 8) throw httpError(400, 'Password baru minimal 8 karakter.');
  if (!/^[a-z0-9._-]{3,30}$/.test(nu)) throw httpError(400, 'Username 3–30 karakter: huruf kecil, angka, titik, garis bawah.');
  const other = accounts[level === 'master' ? 'admin' : 'master'];
  if (other && other.user === nu) throw httpError(409, 'Username itu sudah dipakai akun lain.');
  if (nu === cur.user && !np) throw httpError(400, 'Tidak ada perubahan untuk disimpan.');
  await col('accounts').doc(level).set({ user: nu, hash: np ? await A.hashPassword(np) : cur.hash });
  await bump();
  res.json({ ok: true });
}));

/* ---------- Berkas statis (hanya pengembangan lokal; di Vercel disajikan oleh Vercel) ---------- */
app.use(express.static(ROOT));

/* ---------- Penanganan error ---------- */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  console.error('[UpPlay] ' + req.method + ' ' + req.originalUrl + ' → ' + status + ': ' + err.message);
  const known = !!err.status; // error buatan kita (httpError) aman ditampilkan; error Firestore/lainnya tidak
  const body = { error: known && status < 500 ? err.message : (known ? err.message : 'Kesalahan server (lihat Vercel Logs)') };
  if (known && typeof err.code === 'string') body.code = err.code;
  res.status(status).json(body);
});

if (require.main === module) {
  app.listen(PORT, () => console.log('UpPlay (Express + Firestore) berjalan di http://localhost:' + PORT));
}
module.exports = app;