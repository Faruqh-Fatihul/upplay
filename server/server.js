/* =====================================================================
   UpPlay — Server Pengembangan dengan Express.js & Firebase Firestore
   ===================================================================== */
'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inisialisasi Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
}

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  firebaseApp = getApps()[0];
}

const dbFirestore = getFirestore(firebaseApp);
console.log("Firebase Admin SDK berhasil terhubung ke Firestore!");

// Inisialisasi Express
const app = express();

// Aktifkan helmet (dengan konfigurasi aman untuk SSE & Statis)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Middleware CORS
app.use(cors());

const PORT = +process.env.PORT || 5173;
const ROOT = path.join(__dirname, '..', 'public');
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const ROOM_KEY = 'cerdasPlayQuizRoomsV2';
const NOTIF_KEY = 'cerdasPlayRoomNotifsV1';
const DAY = 864e5;

let db = {};
// Memuat data dari Firestore saat server pertama kali dinyalakan
async function loadDbFromFirestore() {
  try {
    const snapshot = await dbFirestore.collection('kv_store').get();
    snapshot.forEach(doc => {
      db[doc.id] = doc.data().value;
    });
    console.log("Data berhasil dimuat dari Cloud Firestore. Total kunci:", Object.keys(db).length);
  } catch (e) {
    console.error("Gagal memuat data dari Firestore:", e.message);
  }
}

// Menyimpan data secara asinkron ke Firestore
async function persistFirestore(key, value) {
  try {
    await dbFirestore.collection('kv_store').doc(key).set({ value: value });
  } catch (e) {
    console.error("Gagal menyimpan ke Firestore:", e.message);
  }
}

// Menghapus data dari Firestore
async function deleteFirestore(key) {
  try {
    await dbFirestore.collection('kv_store').doc(key).delete();
  } catch (e) {
    console.error("Gagal menghapus dari Firestore:", e.message);
  }
}

/* ---------- Penggabungan Kunci Ruang ---------- */
const STATUS = { waiting: 1, playing: 2, finished: 3, closed: 4 };
const parse = (v, d) => { try { return JSON.parse(v); } catch (e) { return d; } };
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

async function put(key, value) {
  if (key === ROOM_KEY && db[key]) value = mergeRooms(db[key], value);
  else if (key === NOTIF_KEY && db[key]) value = mergeNotifs(db[key], value);
  else if (/students|siswa/i.test(key) && db[key]) value = mergeStudents(db[key], value);
  db[key] = value; 
  await persistFirestore(key, value); 
  broadcast({ key, value });
  return value;
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

// Fungsi penggabungan aman untuk data siswa agar tidak saling overwrite
function mergeStudents(oldV, newV) {
  const o = parse(oldV, []) || [], n = parse(newV, []) || [];
  const map = new Map();
  // Masukkan data lama dan baru, gabungkan berdasarkan id atau email yang unik
  [...o, ...n].forEach(item => {
    const uniqueKey = item.id || item.email || JSON.stringify(item);
    map.set(uniqueKey, item); // Data terbaru / terakhir akan memperbarui yang lama
  });
  return JSON.stringify(Array.from(map.values()));
}
/* ---------- Realtime (SSE) ---------- */
const clients = new Set();
function broadcast(msg) {
  const line = 'data: ' + JSON.stringify(msg) + '\n\n';
  for (const res of clients) res.write(line);
}
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 20000);

/* ---------- Express Middleware & Routes ---------- */
app.use(express.text({ type: '*/*' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'UpPlay', keys: Object.keys(db).length });
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 2000\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

app.get('/api/kv', (req, res) => {
  res.json(db);
});

app.get('/api/kv/:key', (req, res) => {
  const key = req.params.key;
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }
  if (key in db) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(db[key]);
  } else {
    res.status(404).send({ error: 'tidak ada' });
  }
});

app.put('/api/kv/:key', async (req, res) => {
  const key = req.params.key;
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }
  const v = await put(key, req.body || '');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(v);
});

app.delete('/api/kv/:key', async (req, res) => {
  const key = req.params.key;
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }
  delete db[key];
  await persistFirestore(key);
  broadcast({ key, value: null });
  res.json({ ok: true });
});

/* ---------- Berkas Statis Frontend ---------- */
app.use(express.static(ROOT));

// Jalankan server setelah data Firestore berhasil dimuat ke cache lokal
loadDbFromFirestore().then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log('UpPlay (Express + Firestore) berjalan di http://localhost:' + PORT);
      console.log('Buka di HP (satu Wi-Fi): http://<IP-laptop>:' + PORT);
    });
  }
});

// WAJIB: Ekspor app agar bisa dibaca oleh Vercel Serverless
module.exports = app;