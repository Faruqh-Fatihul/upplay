/* =====================================================================
   UpPlay — auth.js
   Fungsi murni (tanpa Express/Firestore): hash password, token sesi, dan kebijakan akses data.
   Dipakai oleh server.js dan diuji terpisah.
   ===================================================================== */
'use strict';
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const CLASSES = ['5A', '5B', '5C', '5D', '6A', '6B', '6C', '6D'];
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const norm = s => String(s == null ? '' : s).trim().toLowerCase();

/* ---------- password (scrypt bawaan Node, tanpa paket tambahan) ---------- */
async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(pw), salt, 32, SCRYPT);
  return 's1$' + salt.toString('base64') + '$' + key.toString('base64');
}
async function verifyPassword(pw, stored) {
  if (typeof stored !== 'string') return false;
  const p = stored.split('$');
  if (p.length !== 3 || p[0] !== 's1') return false;
  const salt = Buffer.from(p[1], 'base64'), want = Buffer.from(p[2], 'base64');
  const got = await scrypt(String(pw), salt, want.length, SCRYPT);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
let dummy = null;
async function dummyVerify(pw) { // menyamakan waktu respons saat akun tidak ditemukan
  if (!dummy) dummy = await hashPassword('dummy-password');
  await verifyPassword(pw, dummy);
}
function safeEqual(a, b) { // perbandingan waktu-konstan untuk password polos lama (migrasi)
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

/* ---------- token sesi (HMAC-SHA256, tanpa state → cocok untuk serverless) ---------- */
function signToken(payload, secret, ttlSec) {
  const body = Object.assign({}, payload, { exp: Math.floor(Date.now() / 1000) + ttlSec });
  const p = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  return p + '.' + sig;
}
function verifyToken(tok, secret) {
  if (typeof tok !== 'string' || !secret) return null;
  const i = tok.indexOf('.');
  if (i < 1) return null;
  const p = tok.slice(0, i);
  let got;
  try { got = Buffer.from(tok.slice(i + 1), 'base64url'); } catch (e) { return null; }
  const want = crypto.createHmac('sha256', secret).update(p).digest();
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  let body;
  try { body = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!body || typeof body.exp !== 'number' || body.exp < Date.now() / 1000) return null;
  return body;
}

/* ---------- bentuk data yang boleh dilihat klien ---------- */
const SECRET_FIELDS = ['passHash', 'password', 'nameLower', 'emailLower', 'u'];
function publicStudent(s, withEmail) {
  const o = Object.assign({}, s);
  SECRET_FIELDS.forEach(f => delete o[f]);
  if (!withEmail) delete o.email;
  return o;
}
function publicTeacher(t) {
  const o = Object.assign({}, t);
  SECRET_FIELDS.forEach(f => delete o[f]);
  return o;
}
function stripCfg(v) { // buang sisa hash akun admin lama dari pengaturan
  try {
    const o = JSON.parse(v);
    if (o && typeof o === 'object') { delete o.acc; return JSON.stringify(o); }
  } catch (e) { /* biarkan apa adanya */ }
  return v;
}

/* ---------- klasifikasi kunci & kebijakan akses ---------- */
const ADMIN_ONLY = new Set(['cerdasPlayAdminCfg', 'cerdasPlayAdminLog', 'cerdasPlayAdminTeachers', 'cerdasPlayAdminUsers', 'cerdasPlayTeachers']);
const SERVER_MANAGED = new Set(['cerdasPlayStudents', 'cerdasPlayTeachers', 'cerdasPlayAdminUsers', 'cerdasPlayAdminTeachers']);
const OWNED_RE = /^cerdasPlay:?(student-\d+)(?!\d)/;
const GAMES_RE = /^cerdasPlay:([56][A-D]):games$/;

function keyClass(key) {
  if (key === 'cerdasPlayStudents') return { t: 'students' };
  if (key === 'cerdasPlayStudentJabatan') return { t: 'jabatan' };
  if (ADMIN_ONLY.has(key)) return { t: 'admin' };
  const m = OWNED_RE.exec(key);
  if (m) return { t: 'owned', owner: m[1] };
  const g = GAMES_RE.exec(key);
  if (g) return { t: 'games', cls: g[1] };
  return { t: 'shared' };
}

/* Siapa yang boleh menulis kunci ini? (kunci yang dikelola server tidak pernah bisa ditulis lewat /kv) */
function canWrite(sess, key) {
  if (SERVER_MANAGED.has(key)) return false;
  const c = keyClass(key);
  if (sess.role === 'admin') return true;
  if (sess.role === 'teacher') {
    if (c.t === 'shared') return true;
    if (c.t === 'games') return c.cls === sess.className;
    if (c.t === 'jabatan') return true; // digabung terbatas ke murid kelasnya
    return false;
  }
  if (sess.role === 'student') {
    if (c.t === 'shared') return true;
    if (c.t === 'owned') return c.owner === sess.id;
    return false;
  }
  return false;
}
function canDelete(sess, key) {
  if (SERVER_MANAGED.has(key)) return false;
  const c = keyClass(key);
  if (sess.role === 'admin') return true;
  if (sess.role === 'teacher') return c.t === 'shared';
  if (sess.role === 'student') return c.t === 'owned' && c.owner === sess.id;
  return false;
}
function canRead(sess, key, classIds) {
  const c = keyClass(key);
  if (key === 'cerdasPlayAdminTeachers') return false; // data lama berisi password polos
  if (sess.role === 'admin') return true;
  if (c.t === 'admin') return false;
  if (c.t === 'owned') return sess.role === 'student' ? c.owner === sess.id : !!(classIds && classIds.has(c.owner));
  return true;
}

/* ---------- peta id → nilai (mis. jabatan siswa) ---------- */
function parseObj(v) { try { const o = JSON.parse(v); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
function filterMapByIds(v, ids) {
  if (!ids) return v;
  const o = parseObj(v), out = {};
  Object.keys(o).forEach(k => { if (ids.has(k)) out[k] = o[k]; });
  return JSON.stringify(out);
}
function mergeScopedMap(existingV, incomingV, ids) { // guru hanya boleh mengubah entri murid kelasnya
  const ex = parseObj(existingV), inc = parseObj(incomingV);
  ids.forEach(id => { if (id in inc) ex[id] = inc[id]; else delete ex[id]; });
  return JSON.stringify(ex);
}

/* Susun seluruh data yang boleh dilihat satu sesi.
   kv: {kunci: string}; students: daftar siswa yang relevan (admin: semua, guru: kelasnya, siswa: dirinya);
   teachers/users hanya dipakai untuk admin. */
function filterAll(input, sess) {
  const kv = input.kv || {}, students = input.students || [];
  const role = sess.role;
  const classIds = role === 'teacher' ? new Set(students.filter(s => s.className === sess.className).map(s => s.id)) : null;
  const ids = role === 'admin' ? null : role === 'teacher' ? classIds : new Set([sess.id]);
  const out = {};
  Object.keys(kv).forEach(k => {
    if (typeof kv[k] !== 'string') return;
    const c = keyClass(k);
    if (c.t === 'students' || k === 'cerdasPlayAdminTeachers') return;
    if (c.t === 'jabatan') { out[k] = filterMapByIds(kv[k], ids); return; }
    if (!canRead(sess, k, classIds)) return;
    out[k] = k === 'cerdasPlayAdminCfg' ? stripCfg(kv[k]) : kv[k];
  });
  const list = role === 'admin' ? students
    : role === 'teacher' ? students.filter(s => s.className === sess.className)
    : students.filter(s => s.id === sess.id);
  out.cerdasPlayStudents = JSON.stringify(list.map(s => publicStudent(s, role !== 'teacher')));
  if (role === 'admin') {
    out.cerdasPlayTeachers = JSON.stringify((input.teachers || []).map(publicTeacher));
    out.cerdasPlayAdminUsers = JSON.stringify(input.users || {});
  }
  return out;
}

/* ---------- siapa boleh mengubah field apa pada data siswa ---------- */
const ADMIN_FIELDS = ['name', 'email', 'className', 'absen', 'photo', 'disabled', 'createdAt'];
function updateStudent(existing, incoming, sess) {
  let allowed;
  if (sess.role === 'admin') allowed = ADMIN_FIELDS;
  else if (sess.role === 'teacher') { if (!existing || existing.className !== sess.className) return null; allowed = ['absen']; }
  else if (sess.role === 'student') { if (!existing || existing.id !== sess.id) return null; allowed = ['absen', 'photo', 'email']; }
  else return null;
  const doc = Object.assign({}, existing || { id: incoming.id });
  allowed.forEach(f => { if (f in incoming) doc[f] = incoming[f]; });
  if (typeof doc.name !== 'string' || !doc.name.trim()) return null;
  if (!CLASSES.includes(doc.className)) return null;
  if (doc.disabled != null) doc.disabled = !!doc.disabled;
  doc.nameLower = norm(doc.name);
  doc.emailLower = norm(doc.email);
  return doc;
}

module.exports = {
  CLASSES, norm,
  hashPassword, verifyPassword, dummyVerify, safeEqual,
  signToken, verifyToken,
  publicStudent, publicTeacher, stripCfg,
  keyClass, canWrite, canDelete, canRead, filterAll, filterMapByIds, mergeScopedMap, updateStudent,
  SERVER_MANAGED
};