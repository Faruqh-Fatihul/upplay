/* =====================================================================
   UpPlay Sync — menyambungkan localStorage aplikasi ke server (server/server.js)
   sehingga guru & siswa di perangkat berbeda melihat ruang yang sama secara realtime.

   - Hanya aktif bila halaman dibuka lewat http(s) DAN /api/health menjawab.
     Dibuka langsung sebagai file (file://) → tidak melakukan apa-apa,
     aplikasi tetap berjalan dengan localStorage seperti biasa.
   - Harus dimuat di <head> SEBELUM skrip aplikasi (dipasang otomatis di public/index.html).
   - sessionStorage (sesi login per tab) TIDAK disinkronkan.
   ===================================================================== */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;
  var API = 'https://api.upplay.my.id/api';
  var SYNC = /^(cerdasPlay|upplay)/i;
  var ls = window.localStorage;
  var rawSet = Storage.prototype.setItem.bind(ls), rawRemove = Storage.prototype.removeItem.bind(ls), rawGet = Storage.prototype.getItem.bind(ls);

  /* 1) muat data server secara sinkron agar skrip aplikasi langsung membaca data terbaru */
  try {
    var x = new XMLHttpRequest();
    x.open('GET', API + '/kv', false);
    x.send(null);
    if (x.status !== 200) return;
    var all = JSON.parse(x.responseText || '{}');
    Object.keys(all).forEach(function (k) { if (SYNC.test(k) && typeof all[k] === 'string') rawSet(k, all[k]); });
  } catch (e) { return; /* server tidak ada → mode lokal */ }

  /* 2) setiap tulis ke localStorage dikirim ke server (digabung per kunci) */
  var pending = {}, timer = null;
  function flush() {
    timer = null;
    var keys = Object.keys(pending); pending = {};
    keys.forEach(function (k) {
      var v = rawGet(k);
      fetch(API + '/kv/' + encodeURIComponent(k), { method: v == null ? 'DELETE' : 'PUT', body: v == null ? undefined : v, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    });
  }
  function queue(k) { if (!SYNC.test(k)) return; pending[k] = 1; if (!timer) timer = setTimeout(flush, 60); }
  var protoSet = Storage.prototype.setItem, protoRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    if (this !== ls) return protoSet.call(this, k, v); /* sessionStorage: tidak disinkronkan */
    var before = rawGet(k); protoSet.call(ls, k, v); if (before !== String(v)) queue(k);
  };
  Storage.prototype.removeItem = function (k) {
    if (this !== ls) return protoRemove.call(this, k);
    protoRemove.call(ls, k); queue(k);
  };

  /* 3) terima perubahan dari perangkat lain (SSE) → tulis lokal + picu event "storage" */
  function listen() {
    var es = new EventSource(API + '/events');
    es.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || !SYNC.test(m.key)) return;
      var old = rawGet(m.key);
      if (m.value == null) { if (old == null) return; rawRemove(m.key); }
      else { if (old === m.value) return; rawSet(m.key, m.value); }
      try { window.dispatchEvent(new StorageEvent('storage', { key: m.key, oldValue: old, newValue: m.value, storageArea: ls })); } catch (e) {}
    };
    es.onerror = function () { /* EventSource menyambung ulang otomatis */ };
  }
  listen();
  window.__upSync = { api: API, flush: flush };
})();
