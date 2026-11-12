/* =====================================================================
   UpPlay Sync v3 — menyambungkan localStorage aplikasi ke server (server/server.js + Firestore)

   Baru di v3 (login di server):
   - Semua permintaan membawa token sesi (Authorization: Bearer ...) dari sessionStorage['cerdasPlaySession'].token.
   - Tanpa token (belum login) tidak ada data yang dimuat.
   - window.__upSync.begin()   → panggil SETELAH login berhasil: bersihkan data lokal lama lalu muat data milik akun ini.
   - window.__upSync.logout()  → panggil saat keluar: kirim sisa antrean (maks. 4 dtk) lalu hapus data dari perangkat.
   - window.__upSync.request(metode, path, body, tanpaToken) → panggilan API (login, daftar, aksi admin).
   - window.__upSync.refresh() → muat ulang data dari server (dipakai setelah aksi admin).
   - Token kedaluwarsa / akun dihapus / dinonaktifkan → sesi dibersihkan, tampil pesan, halaman dimuat ulang.
   Tetap ada: antrean (outbox) yang dicoba ulang, pengiriman per siswa, polling ringan.
   - Harus dimuat di <head> SEBELUM skrip aplikasi.
   ===================================================================== */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;

  /* Alamat API selalu berakhiran '/api' (rute /api/... dilayani Vercel lewat api/[...path].js tanpa
     bergantung pada vercel.json). Jika UPPLAY_API di tempat lain ditulis tanpa '/api', ditambahkan otomatis. */
  // Ubah bagian ini di upplay-sync.js baris awal:
var API = String(window.UPPLAY_API || 'https://api.upplay.my.id').replace(/\/+$/, '');
window.UPPLAY_API = API;
  var SYNC = /^(cerdasPlay|upplay)/i;
  var STU = 'cerdasPlayStudents', ROOM = 'cerdasPlayQuizRoomsV2';
  var OUTBOX = '__upOutbox', SESSION = 'cerdasPlaySession';
  var POLL_MS = 10000;

  var ls = window.localStorage;
  var P = Storage.prototype;
  var protoSet = P.setItem, protoRemove = P.removeItem;
  var rawSet = protoSet.bind(ls), rawRemove = protoRemove.bind(ls), rawGet = P.getItem.bind(ls);
  var enc = encodeURIComponent;

  function parse(v, d) { try { var r = JSON.parse(v); return r == null ? d : r; } catch (e) { return d; } }
  function parseArr(v) { var r = parse(v, []); return Array.isArray(r) ? r : []; }
  function log() { try { console.warn.apply(console, ['[UpPlay Sync]'].concat([].slice.call(arguments))); } catch (e) {} }
  function localKeys() { var a = []; for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (SYNC.test(k)) a.push(k); } return a; }
  function token() { try { var s = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); return (s && s.token) || null; } catch (e) { return null; } }

  /* ---------- state ---------- */
  var base = {};      // nilai terakhir yang sudah "diwakili" server/antrean (untuk menghitung selisih)
  var ver = null;     // versi data server terakhir yang diterapkan
  var sending = false, retryMs = 3000, timer = null, expiring = false;

  function wipeLocal() {
    localKeys().forEach(function (k) { rawRemove(k); });
    rawRemove(OUTBOX);
    base = {}; ver = null;
  }
  function authExpired(data) {
    if (expiring) return;
    expiring = true;
    var msg = (data && data.error) || 'Sesi berakhir. Silakan masuk lagi.';
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
    wipeLocal();
    try { alert(msg); } catch (e) {}
    location.reload();
  }

  /* ---------- panggilan API umum ---------- */
  function request(method, path, body, noAuth) {
    var h = {}, t = token();
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (t && !noAuth) h.Authorization = 'Bearer ' + t;
    return fetch(API + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401 && !noAuth) authExpired(d);
          return { ok: r.ok, status: r.status, data: d };
        });
      })
      .catch(function () { return { ok: false, status: 0, data: { error: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' } }; });
  }

  /* ---------- outbox (antrean perubahan yang belum sampai server) ---------- */
  function getOut() { return parse(rawGet(OUTBOX), []); }
  function setOut(a) { if (a.length) rawSet(OUTBOX, JSON.stringify(a)); else rawRemove(OUTBOX); }
  function addOp(op) {
    var keep = [], removed = {};
    getOut().forEach(function (o) {
      if (o.p === op.p) { if (o.h && o.h['X-Removed']) o.h['X-Removed'].split(',').forEach(function (c) { removed[c] = 1; }); }
      else keep.push(o);
    });
    if (op.h && op.h['X-Removed']) op.h['X-Removed'].split(',').forEach(function (c) { removed[c] = 1; });
    var rk = Object.keys(removed);
    if (rk.length) { op.h = op.h || {}; op.h['X-Removed'] = rk.join(','); }
    keep.push(op);
    if (keep.length > 300) keep = keep.slice(-300);
    setOut(keep);
  }

  /* ---------- selisih lama → baru ---------- */
  function diffStudents(oldStr, newStr) {
    var om = {}, nm = {}, up = [], del = [];
    parseArr(oldStr).forEach(function (s) { if (s && s.id) om[s.id] = s; });
    parseArr(newStr).forEach(function (s) { if (s && s.id) nm[s.id] = s; });
    Object.keys(nm).forEach(function (id) { if (!om[id] || JSON.stringify(om[id]) !== JSON.stringify(nm[id])) up.push(nm[id]); });
    Object.keys(om).forEach(function (id) { if (!nm[id]) del.push(id); });
    return { up: up, del: del };
  }
  function removedRooms(oldStr, newStr) {
    var o = parse(oldStr, {}), n = parse(newStr, {});
    return Object.keys(o).filter(function (c) { return !(c in n); });
  }

  /* ---------- terapkan data server ke localStorage ---------- */
  function overlayStudents(val, out) {
    var ops = out.filter(function (o) { return /^\/students\//.test(o.p); });
    if (!ops.length) return val;
    var arr = parseArr(val);
    ops.forEach(function (o) {
      var id = decodeURIComponent(o.p.replace('/students/', ''));
      arr = arr.filter(function (s) { return s && s.id !== id; });
      if (o.m === 'PUT') { var s = parse(o.b, null); if (s) arr.push(s); }
    });
    return JSON.stringify(arr);
  }
  function applyServer(all, notify) {
    var out = getOut();
    Object.keys(all).forEach(function (k) {
      if (!SYNC.test(k) || typeof all[k] !== 'string') return;
      var val = all[k];
      if (k === STU) val = overlayStudents(val, out);
      else if (out.some(function (o) { return o.p === '/kv/' + enc(k); })) return; // ada perubahan lokal yang belum terkirim
      base[k] = val;
      var old = rawGet(k);
      if (old === val) return;
      rawSet(k, val);
      if (notify) { try { window.dispatchEvent(new StorageEvent('storage', { key: k, oldValue: old, newValue: val, storageArea: ls })); } catch (e) {} }
    });
  }

  /* ---------- muat data (sinkron, agar skrip aplikasi langsung membaca data terbaru) ---------- */
  function loadAll() {
    var t = token();
    if (!t) return false;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', API + '/kv', false);
      x.setRequestHeader('Authorization', 'Bearer ' + t);
      x.send(null);
      if (x.status === 200) {
        var all = JSON.parse(x.responseText || '{}');
        ver = all.__v || null;
        applyServer(all, false);
        return true;
      }
      if (x.status === 401) { authExpired(parse(x.responseText, {})); return false; }
      log('server menjawab HTTP ' + x.status + ' saat memuat data → memakai data lokal dulu.', String(x.responseText || '').slice(0, 200));
    } catch (e) { log('tidak bisa menghubungi server (' + API + ') → memakai data lokal dulu.', e && e.message); }
    return false;
  }
  function begin() { wipeLocal(); return loadAll(); }
  function refresh() {
    return request('GET', '/kv').then(function (r) {
      if (r.ok && r.data) { ver = r.data.__v || ver; applyServer(r.data, true); }
      return r.ok;
    });
  }

  /* ---------- kirim perubahan ---------- */
  function schedule(ms) { if (timer) return; timer = setTimeout(flush, ms == null ? 60 : ms); }
  function sameOp(a, b) { return a.m === b.m && a.p === b.p && a.b === b.b; }

  function sendOne(op) { // resolve 'ok' | 'drop'; reject bila perlu dicoba lagi
    var headers = { 'Content-Type': op.t || 'text/plain' }, t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    if (op.h) Object.keys(op.h).forEach(function (h) { headers[h] = op.h[h]; });
    return fetch(API + op.p, {
      method: op.m, headers: headers, body: op.m === 'PUT' ? op.b : undefined,
      keepalive: !op.b || op.b.length < 60000
    }).then(function (r) {
      if (r.ok) return 'ok';
      if (r.status === 401) { return r.json().catch(function () { return {}; }).then(function (d) { authExpired(d); return 'drop'; }); }
      if (r.status === 404 || r.status === 405) { // rute tidak ada = salah konfigurasi, BUKAN penolakan data → jangan dibuang, coba lagi
        throw new Error('HTTP ' + r.status + ' — rute tidak ditemukan di server (periksa vercel.json / alamat API)');
      }
      if (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429) {
        log('server menolak ' + op.m + ' ' + op.p + ' (HTTP ' + r.status + ') — dilewati.');
        return 'drop';
      }
      throw new Error('HTTP ' + r.status);
    });
  }
  function flush() {
    timer = null;
    if (sending) return;
    var out = getOut();
    if (!out.length || !token()) return;
    var op = out[0];
    sending = true;
    sendOne(op).then(function () {
      setOut(getOut().filter(function (o) { return !sameOp(o, op); }));
      sending = false; retryMs = 3000;
      if (getOut().length) schedule(0);
    }).catch(function (e) {
      sending = false;
      retryMs = Math.min(retryMs * 2, 30000);
      log('gagal mengirim ' + op.m + ' ' + op.p + ' (' + (e && e.message) + ') — dicoba lagi ' + Math.round(retryMs / 1000) + ' detik lagi. Menunggu: ' + getOut().length);
      schedule(retryMs);
    });
  }
  function drain(deadline) {
    return new Promise(function (resolve) {
      (function step() {
        if (Date.now() > deadline || !getOut().length || !token()) return resolve();
        if (sending) return setTimeout(step, 100);
        sending = true;
        var op = getOut()[0];
        sendOne(op).then(function () {
          setOut(getOut().filter(function (o) { return !sameOp(o, op); }));
          sending = false; step();
        }).catch(function () { sending = false; resolve(); });
      })();
    });
  }
  function logout() {
    return drain(Date.now() + 4000).then(wipeLocal, wipeLocal);
  }

  function enqueueKey(k) {
    var cur = rawGet(k), old = base[k];
    if (k === STU) {
      if (cur == null) {
        parseArr(old).forEach(function (s) { if (s && s.id) addOp({ m: 'DELETE', p: '/students/' + enc(s.id) }); });
      } else {
        var d = diffStudents(old, cur);
        d.up.forEach(function (s) { addOp({ m: 'PUT', p: '/students/' + enc(s.id), b: JSON.stringify(s), t: 'application/json' }); });
        d.del.forEach(function (id) { addOp({ m: 'DELETE', p: '/students/' + enc(id) }); });
      }
    } else if (cur == null) {
      addOp({ m: 'DELETE', p: '/kv/' + enc(k) });
    } else {
      var op = { m: 'PUT', p: '/kv/' + enc(k), b: cur, t: 'text/plain' };
      if (k === ROOM) { var rm = removedRooms(old, cur); if (rm.length) op.h = { 'X-Removed': rm.join(',') }; }
      addOp(op);
    }
    base[k] = cur;
    schedule();
  }

  /* ---------- inisialisasi ---------- */
  if (token()) { localKeys().forEach(function (k) { base[k] = rawGet(k); }); loadAll(); }
  else rawRemove(OUTBOX); // tanpa login, antrean lama tidak bisa dikirim

  P.setItem = function (k, v) {
    if (this !== ls) return protoSet.call(this, k, v); // sessionStorage: tidak disinkronkan
    var before = rawGet(k);
    protoSet.call(ls, k, v);
    if (SYNC.test(k) && before !== String(v) && token()) enqueueKey(k);
  };
  P.removeItem = function (k) {
    if (this !== ls) return protoRemove.call(this, k);
    var had = rawGet(k) != null;
    protoRemove.call(ls, k);
    if (SYNC.test(k) && had && token()) enqueueKey(k);
  };

  /* ---------- terima perubahan dari perangkat lain: polling ringan ---------- */
  var polling = false;
  function poll() {
    if (polling || document.hidden || !token()) return;
    polling = true;
    fetch(API + '/version', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (ver !== null && j.v === ver) return;
        return request('GET', '/kv').then(function (r) {
          if (!r.ok) return;
          if (sending || getOut().length) return; // ada kiriman berjalan → tunda ke polling berikutnya
          ver = r.data.__v || j.v;
          applyServer(r.data, true);
        });
      })
      .catch(function () { /* jaringan putus: coba lagi di polling berikutnya */ })
      .then(function () { polling = false; });
  }
  setInterval(poll, POLL_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  window.addEventListener('online', function () { schedule(0); poll(); });
  if (token()) schedule(500); // kirim sisa antrean dari sesi sebelumnya (jika ada)

  window.__upSync = {
    api: API,
    request: request,
    begin: begin,
    logout: logout,
    refresh: refresh,
    flush: flush,
    poll: poll,
    status: function () { return { pending: getOut().length, version: ver, sending: sending, loggedIn: !!token() }; },
    outbox: getOut
  };
})();