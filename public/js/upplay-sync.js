/* =====================================================================
   UpPlay Sync v2 — menyambungkan localStorage aplikasi ke server (server.js + Firestore)

   Beda dengan versi lama:
   - TIDAK ada error yang ditelan: kegagalan tampil di Console, dan perubahan masuk ANTREAN
     (outbox, disimpan di localStorage '__upOutbox') yang dicoba ulang sampai berhasil,
     juga setelah halaman di-refresh. Jadi pendaftaran siswa tidak hilang hanya karena
     server sempat error/cold start.
   - Daftar siswa dikirim sebagai perubahan per siswa (tambah/ubah/hapus), bukan seluruh array,
     sehingga hapus siswa benar-benar tersimpan dan dua perangkat tidak saling menimpa.
   - Server yang gagal dimuat saat halaman dibuka TIDAK mematikan sinkronisasi; data lokal tetap
     dipakai dan semua perubahan menunggu di antrean.
   - SSE diganti polling ringan (/version tiap 10 detik, hanya saat tab terlihat).
   - sessionStorage (sesi login per tab) TIDAK disinkronkan.
   - Harus dimuat di <head> SEBELUM skrip aplikasi.
   ===================================================================== */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return; // dibuka sebagai file:// → mode lokal saja

  var API = window.UPPLAY_API || 'https://api.upplay.my.id/api';
  var SYNC = /^(cerdasPlay|upplay)/i;
  var STU = 'cerdasPlayStudents', ROOM = 'cerdasPlayQuizRoomsV2';
  var OUTBOX = '__upOutbox';
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

  /* ---------- state ---------- */
  var base = {};      // nilai terakhir yang sudah "diwakili" server/antrean, dipakai untuk menghitung selisih
  var ver = null;     // versi data server terakhir yang diterapkan
  var sending = false, retryMs = 3000, timer = null;

  localKeys().forEach(function (k) { base[k] = rawGet(k); });

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

  /* 1) muat data server secara sinkron agar skrip aplikasi langsung membaca data terbaru */
  try {
    var x = new XMLHttpRequest();
    x.open('GET', API + '/kv', false);
    x.send(null);
    if (x.status === 200) {
      var all0 = JSON.parse(x.responseText || '{}');
      ver = all0.__v || null;
      applyServer(all0, false);
    } else {
      log('server menjawab HTTP ' + x.status + ' saat memuat data → memakai data lokal dulu.', String(x.responseText || '').slice(0, 200));
    }
  } catch (e) { log('tidak bisa menghubungi server (' + API + ') → memakai data lokal dulu.', e && e.message); }

  /* 2) kirim perubahan: setiap tulis ke localStorage masuk antrean lalu dikirim */
  function schedule(ms) { if (timer) return; timer = setTimeout(flush, ms == null ? 60 : ms); }
  function sameOp(a, b) { return a.m === b.m && a.p === b.p && a.b === b.b; }

  function flush() {
    timer = null;
    if (sending) return;
    var out = getOut();
    if (!out.length) return;
    var op = out[0];
    sending = true;
    var headers = { 'Content-Type': op.t || 'text/plain' };
    if (op.h) Object.keys(op.h).forEach(function (h) { headers[h] = op.h[h]; });
    fetch(API + op.p, {
      method: op.m, headers: headers, body: op.m === 'PUT' ? op.b : undefined,
      keepalive: !op.b || op.b.length < 60000
    }).then(function (r) {
      var permanent = !r.ok && r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429;
      if (!r.ok && !permanent) throw new Error('HTTP ' + r.status);
      if (permanent) log('server menolak ' + op.m + ' ' + op.p + ' (HTTP ' + r.status + ') — dilewati.');
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

  P.setItem = function (k, v) {
    if (this !== ls) return protoSet.call(this, k, v); // sessionStorage: tidak disinkronkan
    var before = rawGet(k);
    protoSet.call(ls, k, v);
    if (SYNC.test(k) && before !== String(v)) enqueueKey(k);
  };
  P.removeItem = function (k) {
    if (this !== ls) return protoRemove.call(this, k);
    var had = rawGet(k) != null;
    protoRemove.call(ls, k);
    if (SYNC.test(k) && had) enqueueKey(k);
  };

  /* 3) terima perubahan dari perangkat lain: polling ringan */
  var polling = false;
  function poll() {
    if (polling || document.hidden) return;
    polling = true;
    fetch(API + '/version', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (ver !== null && j.v === ver) return;
        return fetch(API + '/kv', { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function (all) {
            if (sending || getOut().length) return; // ada kiriman berjalan → tunda, ambil lagi pada polling berikutnya
            ver = all.__v || j.v;
            applyServer(all, true);
          });
      })
      .catch(function (e) { /* jaringan putus: coba lagi di polling berikutnya */ })
      .then(function () { polling = false; });
  }
  setInterval(poll, POLL_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  window.addEventListener('online', function () { schedule(0); poll(); });

  schedule(500); // kirim sisa antrean dari sesi sebelumnya (jika ada)

  window.__upSync = {
    api: API,
    flush: flush,
    poll: poll,
    status: function () { return { pending: getOut().length, version: ver, sending: sending }; },
    outbox: getOut
  };
})();