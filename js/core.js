/* =====================================================================
   core.js — util, klien API (dedupe + SWR + pengukur), sesi, tema, router, modal, toast
   ===================================================================== */
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BLN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const tglID = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + ' ' + BLN[+m[2] - 1] + ' ' + m[1] : '-'; };
const hariID = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? HARI[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] : ''; };
const periodeID = p => { const m = String(p || '').match(/^(\d{4})-(\d{2})$/); return m ? BLN_PANJANG[+m[2] - 1] + ' ' + m[1] : p || '-'; };
/* Tanggal selalu mengikuti WIB (sama dengan server), apa pun zona waktu perangkat */
const hariIni = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const bulanIni = () => hariIni().slice(0, 7);
const inisial = n => String(n || '?').replace(/^(Ust\.|Ustadz|Ustdzh\.|Bpk\.|Ibu|Wali)\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const av = (n, cls) => `<span class="av ${cls || ''}" aria-hidden="true">${esc(inisial(n))}</span>`;
const ico = (n, cls) => `<span class="ms ${cls || ''}" aria-hidden="true">${n}</span>`;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tick = () => new Promise(r => requestAnimationFrame(() => r()));
function on(root, ev, sel, fn) { root.addEventListener(ev, e => { const t = e.target.closest(sel); if (t && root.contains(t)) fn(e, t); }); }
const persen = (a, b) => b ? Math.round(a * 1000 / b) / 10 : 0;

/* ---------- Pemuat skrip pihak ketiga (dipin versi, hanya cdnjs) ---------- */
const CDN = {
  chart: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  qrgen: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
  scan: 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
};
const _scripts = {};
function loadScript(url) {
  if (_scripts[url]) return _scripts[url];
  return _scripts[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.async = true; s.onload = res; s.onerror = () => { delete _scripts[url]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); }; document.head.appendChild(s); });
}
async function qrSvg(text, cell) { await loadScript(CDN.qrgen); const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell || 4, margin: 0, scalable: true }); }

/* ---------- Tema ---------- */
const Tema = {
  get() { return document.documentElement.getAttribute('data-theme') || 'light'; },
  toggle() { const t = this.get() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('mdt.tema', t); } catch (e) {} const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#1e2022' : '#0f4c3a'; return t; }
};

/* ---------- Toast & progres ---------- */
function toast(msg, tipe) {
  const el = document.createElement('div'); el.className = 'toast ' + (tipe || '');
  el.innerHTML = `${ico(tipe === 'error' ? 'error' : tipe === 'warn' ? 'warning' : 'check_circle')}<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), tipe === 'error' ? 6000 : 3500);
}
let _pend = 0;
function progres(d) { _pend = Math.max(0, _pend + d); const p = $('#ptop'); if (p) { p.style.width = _pend ? '70%' : '100%'; if (!_pend) setTimeout(() => { if (!_pend) p.style.width = '0'; }, 250); } }

/* ---------- Sesi ---------- */
const Sesi = {
  _k: 'mdt.sesi', token: '', me: null, meta: null,
  load() { try { const s = JSON.parse(localStorage.getItem(this._k) || sessionStorage.getItem(this._k) || 'null'); if (s && s.token) { this.token = s.token; this.me = s.me; } } catch (e) {} },
  save(ingat) { const j = JSON.stringify({ token: this.token, me: this.me }); try { (ingat ? localStorage : sessionStorage).setItem(this._k, j); (ingat ? sessionStorage : localStorage).removeItem(this._k); } catch (e) {} },
  clear() { this.token = ''; this.me = null; this.meta = null; try { localStorage.removeItem(this._k); sessionStorage.removeItem(this._k); Object.keys(localStorage).filter(k => k.indexOf('mdt.c.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {} },
  get role() { return this.me ? this.me.role : ''; }
};

/* ---------- Klien API (gas-pro-api + gas-scale-turbo) ---------- */
const Perf = {
  log: [],
  rec(a, total, server, cached) { this.log.push({ a, total, server, cached }); if (this.log.length > 200) this.log.shift(); },
  summary() { const o = {}; this.log.forEach(r => { const x = o[r.a] = o[r.a] || { n: 0, total: 0, server: 0, cache: 0 }; x.n++; x.total += r.total; x.server += r.server || 0; x.cache += r.cached ? 1 : 0; }); return Object.keys(o).map(k => ({ aksi: k, panggilan: o[k].n, rataTotalMs: Math.round(o[k].total / o[k].n), rataServerMs: Math.round(o[k].server / o[k].n), dariCache: o[k].cache })); },
  table() { console.table(this.summary()); }
};
const READ = /^(dashboard|beranda\.wali|batch|publik\.|santri\.list|presensi\.(lembar|riwayat)|hafalan\.(lembar|riwayat)|keuangan\.list|materi\.list|berita\.list|laporan\.|pengguna\.list|pengaturan\.get|notif\.(config|queue)|wa\.(audience|blastList|device)|crm\.(list|stats)|sistem\.status|audit\.list)/;
const Api = {
  inflight: {}, epoch: 0,
  ok() { const u = (window.APP_CONFIG || {}).GAS_URL || ''; return /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+\/|macros\/)s\/[A-Za-z0-9_-]+\/exec$/.test(u) && !/GANTI|XXXX/.test(u); },
  async raw(action, data, opsi) {
    opsi = opsi || {};
    const t0 = performance.now(); progres(1);
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), opsi.timeout || 45000);
    try {
      const url = window.APP_CONFIG.GAS_URL;
      const r = opsi.get ? await fetch(url + '?action=' + encodeURIComponent(action), { signal: ctl.signal })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: Sesi.token, data: data || {} }), signal: ctl.signal });
      const j = await r.json();
      Perf.rec(action, performance.now() - t0, j.ms, j.cached);
      if (j && j.code === 'AUTH' && Sesi.token) { Sesi.clear(); toast('Sesi berakhir. Silakan masuk kembali.', 'warn'); Router.go('/login'); }
      return j;
    } catch (e) {
      return { success: false, message: e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    } finally { clearTimeout(to); progres(-1); }
  },
  call(action, data, opsi) {
    if (!this.ok()) return Promise.resolve({ success: false, message: 'Konfigurasi belum lengkap: isi GAS_URL di js/config.js.' });
    if (!READ.test(action)) { this.epoch++; return this.raw(action, data, opsi); }
    const k = this.epoch + '|' + action + '|' + Sesi.token.slice(-8) + '|' + JSON.stringify(data || {});
    if (this.inflight[k]) return this.inflight[k];
    const p = this.raw(action, data, Object.assign({ get: /^publik\./.test(action) && !data }, opsi)); this.inflight[k] = p;
    const done = () => { delete this.inflight[k]; }; p.then(done, done); return p;
  }
};
const api = (a, d, o) => Api.call(a, d, o);

/* SWR: tampilkan cache lokal dulu (instan), segarkan di belakang layar, render ulang hanya bila berubah */
function swr(action, data, render, opsi) {
  opsi = opsi || {};
  const key = 'mdt.c.' + (Sesi.me ? Sesi.me.id : 'pub') + '.' + action + '.' + JSON.stringify(data || {}).slice(0, 120);
  let lama = null, hashLama = '';
  if (!opsi.noCache) try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < (opsi.maxAge || 600000)) { lama = c.v; hashLama = JSON.stringify(c.v); } } catch (e) {}
  if (lama) render(lama, true);
  return api(action, data).then(r => {
    if (!r.success) { if (!lama) render(null, false, r); return r; }
    const h = JSON.stringify(r.data);
    if (!opsi.noCache) try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: r.data })); } catch (e) {}
    if (h !== hashLama) render(r.data, false);
    return r;
  });
}

/* ---------- Modal ---------- */
function modal(o) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title || '')}"><header><h3>${esc(o.title || '')}</h3><button class="btn icon sm" data-x aria-label="Tutup">${ico('close')}</button></header><div class="body">${o.body || ''}</div>${o.actions ? '<footer></footer>' : ''}</div>`;
  const prev = document.activeElement;
  const close = () => { bg.remove(); document.removeEventListener('keydown', esc_); if (prev && prev.focus) prev.focus(); if (o.onClose) o.onClose(); };
  const esc_ = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc_);
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  $('[data-x]', bg).onclick = close;
  if (o.actions) { const f = $('footer', bg); o.actions.forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + (a.cls || ''); b.innerHTML = a.label; b.onclick = async () => { if (a.keep) return a.onClick && a.onClick(bg, close, b); b.disabled = true; const r = a.onClick ? await a.onClick(bg, close, b) : close(); if (r !== false && !a.stay) close(); else b.disabled = false; }; f.appendChild(b); }); }
  document.body.appendChild(bg);
  const f = $('input:not([type=hidden]),select,textarea', bg); if (f && !o.noFocus) setTimeout(() => f.focus(), 30);
  if (o.onOpen) o.onOpen(bg, close);
  return { el: bg, close };
}
function konfirmasi(pesan, label, bahaya) {
  return new Promise(res => { let sudah = false; modal({ title: 'Konfirmasi', body: `<p>${pesan}</p>`, onClose: () => { if (!sudah) res(false); }, actions: [{ label: 'Batal', onClick: () => { sudah = true; res(false); } }, { label: label || 'Ya, lanjutkan', cls: bahaya ? 'danger' : 'primary', onClick: () => { sudah = true; res(true); } }] }); });
}
async function tombolSibuk(btn, fn) {
  if (!btn) return fn(); const html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Memproses…';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
}
function salin(teks) { return (navigator.clipboard ? navigator.clipboard.writeText(teks) : Promise.reject()).then(() => toast('Disalin.'), () => { const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast('Disalin.'); } catch (e) { toast('Gagal menyalin.', 'error'); } t.remove(); }); }
function tampilkanKredensial(judul, daftar) {
  const baris = daftar.map(a => `${a.santri ? a.santri + ' — ' : ''}${a.wali || ''}\tID: ${a.username}\tSandi: ${a.sandi}`).join('\n');
  modal({ title: judul, body: `<div class="notice mb">${ico('warning')}<span>Sandi hanya tampil <b>sekali</b>. Catat atau unduh sekarang, lalu serahkan ke pemilik akun.</span></div>
    <div class="tbl-wrap"><table class="t" style="min-width:0"><thead><tr><th>Pemilik</th><th>ID</th><th>Sandi awal</th></tr></thead><tbody>${daftar.map(a => `<tr><td>${esc(a.santri || a.wali || '')}</td><td class="mono">${esc(a.username)}</td><td class="mono"><b>${esc(a.sandi)}</b></td></tr>`).join('')}</tbody></table></div>`,
    actions: [{ label: `${ico('content_copy', 'sm')} Salin`, onClick: () => { salin(baris); return false; }, stay: true }, { label: `${ico('download', 'sm')} Unduh CSV`, onClick: () => { unduhCSV('akun-baru.csv', [['Pemilik', 'ID', 'Sandi awal']].concat(daftar.map(a => [a.santri || a.wali || '', a.username, a.sandi]))); return false; }, stay: true }, { label: 'Selesai', cls: 'primary' }] });
}

/* ---------- CSV ---------- */
function unduhCSV(nama, baris) {
  const csv = '\ufeff' + baris.map(r => r.map(c => { let s = String(c == null ? '' : c); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function parseCSV(teks) {
  const rows = []; let r = [], c = '', q = false; const t = String(teks).replace(/^\ufeff/, '');
  const delim = (t.split('\n')[0].match(/;/g) || []).length > (t.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < t.length; i++) { const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
    else if (ch === '"') q = true; else if (ch === delim) { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x.trim() !== '')) rows.push(r); r = []; } else c += ch; }
  r.push(c); if (r.some(x => x.trim() !== '')) rows.push(r); return rows;
}
function berkasKeBase64(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = () => rej(new Error('Gagal membaca berkas.')); fr.readAsDataURL(file); }); }
/* Kompres foto bukti di browser (maks 1600px, JPEG 0.82) agar ringan & cepat diunggah */
async function siapkanBerkas(file, maksMB) {
  if (file.type === 'application/pdf') { if (file.size > maksMB * 1048576) throw new Error('PDF maksimal ' + maksMB + ' MB.'); return { mime: file.type, base64: await berkasKeBase64(file), nama: file.name }; }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Format harus JPG, PNG, WEBP, atau PDF.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const b64 = c.toDataURL('image/jpeg', 0.82).split(',')[1];
    if (b64.length * 0.75 > maksMB * 1048576) throw new Error('Foto terlalu besar. Gunakan foto yang lebih kecil.');
    return { mime: 'image/jpeg', base64: b64, nama: file.name.replace(/\.\w+$/, '') + '.jpg' };
  } finally { URL.revokeObjectURL(url); }
}
const BEEP = { on: true, ctx: null, nada(ok) { if (!this.on) return; try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = ok ? 880 : 220; g.gain.value = .08; o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + (ok ? .12 : .35)); } catch (e) {} } };

/* ---------- Router berbasis hash ---------- */
const Router = {
  routes: {}, cleanup: null, aktif: '',
  add(path, def) { this.routes[path] = def; },
  go(path) { if (location.hash === '#' + path) this.render(); else location.hash = path; },
  path() { return (location.hash || '#/').slice(1).split('?')[0] || '/'; },
  async render() {
    const p = this.path(); const def = this.routes[p] || this.routes['/404'];
    if (this.cleanup) { try { this.cleanup(); } catch (e) {} this.cleanup = null; }
    document.body.classList.remove('drawer');
    if (!def) return;
    if (!def.pub && !Sesi.token) { return this.go('/login'); }
    if (def.roles && Sesi.token && def.roles.indexOf(Sesi.role) < 0) { return this.go(Shell.beranda()); }
    this.aktif = p; window.scrollTo(0, 0);
    this.cleanup = (await def.render(p)) || null;
  }
};
window.addEventListener('hashchange', () => Router.render());
