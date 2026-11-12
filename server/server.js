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
// Middleware untuk membaca body teks dan JSON dari request client
app.use(express.text({ limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

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
const ROOM_KEY = 'cerdasPlayQuizRoomsV2';
const NOTIF_KEY = 'cerdasPlayRoomNotifsV1';
const DAY = 864e5;

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
  try {
    // 1. Ambil data eksisting langsung dari Firestore
    const docRef = dbFirestore.collection('kv_store').doc(key);
    const docSnap = await docRef.get();
    let existingValue = docSnap.exists ? docSnap.data().value : null;

    // 2. Lakukan pengecekan dan merge jika kuncinya spesifik
    if (existingValue) {
      if (key === ROOM_KEY) {
        value = mergeRooms(existingValue, value);
      } else if (key === NOTIF_KEY) {
        value = mergeNotifs(existingValue, value);
      } else if (/students|siswa/i.test(key)) {
        value = mergeStudents(existingValue, value);
      }
    }

    // 3. Simpan hasil merge terbaru ke Firestore
    await persistFirestore(key, value); 
    broadcast({ key, value });
    return value;
  } catch (e) {
    console.error("Gagal di fungsi put:", e.message);
    throw e;
  }
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
app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'UpPlay', keys: Object.keys(db).length });
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 2000\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

app.get('/kv', async (req, res) => {
  try {
    const snapshot = await dbFirestore.collection('kv_store').get();
    const allData = {};
    snapshot.forEach(doc => {
      allData[doc.id] = doc.data().value;
    });
    res.json(allData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/kv/:key', async (req, res) => {
  const key = req.params.key;

  // Validasi pola kunci
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }

  try {
    // Ambil langsung dari koleksi Firestore 'kv_store'
    const docRef = dbFirestore.collection('kv_store').doc(key);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(docSnap.data().value);
    } else {
      return res.status(404).send({ error: 'tidak ada' });
    }
  } catch (error) {
    console.error("Error reading Firestore:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.put('/kv/:key', async (req, res) => {
  const key = req.params.key;
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }
  
  const value = req.body || '';
  
  try {
    // GUNAKAN FUNGSI put() AGAR LOGIKA MERGE (students, rooms, notifs) BERJALAN!
    const savedValue = await put(key, value);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(savedValue);
  } catch (error) {
    console.error("Error saving data:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/kv/:key', async (req, res) => {
  const key = req.params.key;
  if (!/^cerdasPlay|^upplay/i.test(key)) {
    return res.status(400).json({ error: 'kunci tidak dikenal' });
  }
  await persistFirestore(key);
  broadcast({ key, value: null });
  res.json({ ok: true });
});

/* ---------- Berkas Statis Frontend ---------- */
app.use(express.static(ROOT));

// Jalankan server setelah data Firestore berhasil dimuat ke cache lokal
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log('UpPlay (Express + Firestore) berjalan di http://localhost:' + PORT);
      console.log('Buka di HP (satu Wi-Fi): http://<IP-laptop>:' + PORT);
    });
  }
// WAJIB: Ekspor app agar bisa dibaca oleh Vercel Serverless
module.exports = app;