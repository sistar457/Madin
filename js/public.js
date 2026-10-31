/* =====================================================================
   public.js — landing page publik, login, akses darurat (tidak ditautkan dari mana pun)
   ===================================================================== */
'use strict';
const PUB_DEF = { NAMA_MADRASAH: 'Madrasah Diniyah Tarbiyatul Huda', SLOGAN: "Membina generasi Qur'ani, berakhlak karimah, dan unggul dalam kajian diniyah.", TA_AKTIF: '', ALAMAT: '', TELP: '', EMAIL: '', JAM_BELAJAR: '', HARI_BELAJAR: '', AKREDITASI: '', WA_PPDB: '', KELAS_DAFTAR: '' };
const temaBtn = () => `<button class="btn icon" data-act="tema" aria-label="Ganti tema terang/gelap">${ico('contrast')}</button>`;
function bindTema(root) { on(root, 'click', '[data-act=tema]', () => Tema.toggle()); }

/* ---------- Penyaji blok halaman depan (dipakai halaman publik DAN pratinjau editor) ---------- */
const waLink = s => { const wa = String((s || {}).WA_PPDB || '').replace(/\D/g, '').replace(/^0/, '62'); return wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang pendaftaran santri baru.") : ''; };
function tombolHtml(b, cls, s) {
  if (!b || !b.label || !b.tautan) return '';
  let h = b.tautan, at = '';
  if (h === 'wa') { h = waLink(s); if (h) at = ' target="_blank" rel="noopener"'; else h = '#/login'; }
  else if (/^https:/.test(h)) at = ' target="_blank" rel="noopener"';
  else if (/^#[A-Za-z0-9_-]+$/.test(h)) { at = ` data-go="${esc(h.slice(1))}"`; h = '#/'; }
  return `<a class="btn ${cls}" href="${esc(h)}"${at}>${esc(b.label)}</a>`;
}
/* Teks sederhana: baris kosong = paragraf, "- " = poin, **tebal**. Semua di-escape lebih dulu. */
function prosa(t) {
  return String(t || '').split(/\n{2,}/).map(par => { const baris = par.split('\n').filter(x => x.trim());
    const tb = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    if (baris.length && baris.every(x => /^\s*-\s+/.test(x))) return '<ul>' + baris.map(x => '<li>' + tb(x.replace(/^\s*-\s+/, '')) + '</li>').join('') + '</ul>';
    return baris.length ? '<p>' + baris.map(tb).join('<br>') + '</p>' : ''; }).join('');
}
const kepalaBlok = d => (d.kicker || d.judul || d.deskripsi) ? `<div class="sec-title">${d.kicker ? `<span class="pill">${esc(d.kicker)}</span>` : ''}${d.judul ? `<h2>${esc(d.judul)}</h2>` : ''}${d.deskripsi ? `<p class="muted lead">${esc(d.deskripsi)}</p>` : ''}</div>` : '';
function kartuBerita(x) { return `<article class="card flat col"><div class="row between"><span class="badge info">${esc(x.Kategori)}</span><span class="faint" style="font-size:12px">${tglID(x.Tanggal)}</span></div><h3>${esc(x.Judul)}</h3><p class="sub">${esc(x.Ringkasan)}</p>${x.Lokasi ? `<p class="faint row" style="font-size:12px">${ico('location_on', 'sm')} ${esc(x.Lokasi)}</p>` : ''}</article>`; }

function htmlBlok(b, c) {
  const d = b.data || {}, s = c.s || {}, st = c.st || {}, id = 'b-' + esc(b.id);
  const tpl = t => String(t == null ? '' : t).replace(/\{(santri|asatidz|kelas)\}/g, (m, k) => st[k] == null ? '–' : st[k]);
  switch (b.tipe) {
    case 'hero': {
      const img = d.gambar ? `<img class="art-img" src="${esc(d.gambar)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('has-img');this.remove()">` : '';
      const jam = d.tampilJam && s.JAM_BELAJAR ? `<span class="pill art-pill">${ico('schedule', 'sm')} <span>${esc((s.HARI_BELAJAR ? s.HARI_BELAJAR + ' • ' : '') + s.JAM_BELAJAR)}</span></span>` : '';
      return `<section class="s" id="${id}"><div class="card hero"><div class="col gap-lg">${d.lencana ? `<span class="pill">${ico('verified', 'sm')} ${esc(d.lencana)}</span>` : ''}<h1>${esc(d.judul)}</h1>${d.deskripsi ? `<p class="muted lead">${esc(d.deskripsi)}</p>` : ''}
        <div class="row wrap">${tombolHtml(d.btn1, 'primary', s)}${tombolHtml(d.btn2, '', s)}</div>${(d.poin || []).length ? `<div class="row wrap faint" style="font-size:13px;gap:8px 18px">${d.poin.map(x => `<span class="row">${ico('check_circle', 'sm')} ${esc(x)}</span>`).join('')}</div>` : ''}</div>
        <div class="art ${d.gambar ? 'has-img' : ''}">${img}<span class="ms art-ico" aria-hidden="true">mosque</span>${jam}</div></div></section>`; }
    case 'statistik': { const it = d.items || [];
      return `<section class="s" id="${id}"><div class="stat-grid" style="--n:${Math.min(Math.max(it.length, 1), 4)}">${it.map(x => `<div class="card kpi"><div class="l"><span>${esc(x.label)}</span>${x.ikon ? `<span class="ico">${ico(esc(x.ikon))}</span>` : ''}</div><div class="v">${esc(tpl(x.angka))}</div></div>`).join('')}</div></section>`; }
    case 'fitur': { const it = d.items || [];
      return `<section class="s" id="${id}">${kepalaBlok(d)}<div class="fit-grid" style="--n:${esc(d.kolom || '3')}">${it.map(x => `<article class="card feat">${x.ikon ? `<div class="ico">${ico(esc(x.ikon))}</div>` : ''}<h3>${esc(x.judul)}</h3>${x.teks ? `<p class="sub mt-s">${esc(x.teks)}</p>` : ''}${(x.poin || []).length ? `<ul>${x.poin.map(y => `<li>${ico('check_circle', 'sm')}<span>${esc(y)}</span></li>`).join('')}</ul>` : ''}</article>`).join('')}</div></section>`; }
    case 'teks': {
      const gm = d.gambar ? `<img class="split-img" loading="lazy" referrerpolicy="no-referrer" alt="${esc(d.judul)}" src="${esc(d.gambar)}" onerror="this.remove()">` : '';
      return `<section class="s" id="${id}"><div class="card split ${d.gambar ? '' : 'solo'} ${d.posisi === 'kiri' ? 'rev' : ''}"><div class="col">${kepalaBlok({ kicker: d.kicker, judul: d.judul })}<div class="prose">${prosa(d.isi)}</div>${d.btn1 && d.btn1.label ? `<div class="row wrap mt-s">${tombolHtml(d.btn1, 'primary', s)}</div>` : ''}</div>${gm}</div></section>`; }
    case 'galeri': { const it = d.items || [];
      return `<section class="s" id="${id}">${kepalaBlok(d)}<div class="gal">${it.map(x => `<figure><button type="button" class="gal-i" data-zoom="${esc(x.gambar)}" data-ket="${esc(x.ket)}" aria-label="Perbesar foto${x.ket ? ': ' + esc(x.ket) : ''}"><img loading="lazy" referrerpolicy="no-referrer" alt="${esc(x.ket)}" src="${esc(x.gambar)}"></button>${x.ket ? `<figcaption>${esc(x.ket)}</figcaption>` : ''}</figure>`).join('')}</div></section>`; }
    case 'video':
      return `<section class="s" id="${id}">${kepalaBlok(d)}${d.url ? `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${esc(d.url)}" title="${esc(d.judul || 'Video')}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ''}</section>`;
    case 'agenda': { const n = Number(d.jumlah) || 3, it = (c.berita || []).slice(0, n);
      return `<section class="s" id="${id}">${kepalaBlok(d)}<div class="fit-grid" style="--n:3">${it.length ? it.map(kartuBerita).join('') : `<div class="card empty" style="grid-column:1/-1">${ico('campaign')}Belum ada pengumuman.</div>`}</div></section>`; }
    case 'faq': { const it = d.items || [];
      return `<section class="s" id="${id}">${kepalaBlok(d)}<div class="col faq">${it.map(x => `<details class="card flat"><summary>${esc(x.tanya)}</summary><div class="prose">${prosa(x.jawab)}</div></details>`).join('')}</div></section>`; }
    case 'cta':
      return `<section class="s" id="${id}"><div class="cta"><div class="col"><h2>${esc(d.judul)}</h2>${d.teks ? `<p style="opacity:.88">${esc(d.teks)}</p>` : ''}</div><div class="row wrap">${tombolHtml(d.btn1, 'cta-b', s)}${tombolHtml(d.btn2, 'cta-b', s)}</div></div></section>`;
  }
  return '';
}
const htmlLanding = (blok, c) => blok.filter(b => b.tampil).map(b => htmlBlok(b, c)).join('');

function renderLanding() {
  const app = $('#app'); document.body.classList.remove('drawer');
  app.innerHTML = `
  <header class="pub-top"><div class="in-w">
    <a href="#/" class="row pub-brand"><span class="logo">${ico('mosque')}</span><b id="lp-nama">Tarbiyatul Huda</b></a>
    <nav class="pub-nav" id="pnav" aria-label="Navigasi utama"></nav>
    <span class="grow"></span>${temaBtn()}<a class="btn primary" href="#/login">${ico('login', 'sm')} <span><span class="hide-s">Portal </span>Login</span></a>
    <button class="btn icon pub-burger" id="pburger" aria-label="Buka menu" aria-expanded="false">${ico('menu')}</button>
  </div></header>
  <main class="pgw" id="lp-main"><section class="s"><div class="card" style="min-height:300px"><div class="skel" style="height:260px"></div></div></section></main>
  <footer class="foot" id="kontak"><div class="pgw">
    <div class="col"><b style="font:700 16px var(--font-h)" id="lp-fnama"></b><p class="sub" id="lp-falamat"></p></div>
    <div><h4>Tautan</h4><div id="lp-flink"></div><a href="#/login">Portal Akademik Santri &amp; Wali</a></div>
    <div><h4>Kontak</h4><span class="sub" id="lp-fkontak" style="display:block"></span></div>
  </div></footer>`;
  bindTema(app);
  on(app, 'click', '[data-go]', (e, a) => { e.preventDefault(); $('#pnav').classList.remove('open'); const el = document.getElementById(a.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth' }); });
  on(app, 'click', '[data-zoom]', (e, b) => modal({ title: b.dataset.ket || 'Foto', wide: true, noFocus: true, body: `<img src="${esc(b.dataset.zoom)}" alt="${esc(b.dataset.ket)}" referrerpolicy="no-referrer" style="width:100%;height:auto;border-radius:12px;display:block">`, actions: [{ label: 'Tutup', cls: 'primary' }] }));
  $('#pburger').onclick = e => { const n = $('#pnav'), o = n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };
  swr('publik.landing', null, (d, dariCache, r) => {
    if (!d) { $('#lp-main').innerHTML = `<section class="s"><div class="card"><div class="notice bad">${ico('cloud_off')}<span>${esc(r ? r.message : 'Gagal memuat halaman.')}</span></div></div></section>`; return; }
    const s = Object.assign({}, PUB_DEF, d.setting);
    document.title = s.NAMA_MADRASAH + ' — SIMADANI';
    const md = document.querySelector('meta[name=description]'); if (md && s.SLOGAN) md.content = s.SLOGAN;
    $('#lp-nama').textContent = s.NAMA_MADRASAH; $('#lp-fnama').textContent = s.NAMA_MADRASAH; $('#lp-falamat').textContent = s.ALAMAT;
    $('#lp-main').innerHTML = htmlLanding(d.blok || [], { s, st: d.statistik, berita: d.berita });
    const menu = (d.blok || []).filter(b => b.tampil && b.data && b.data.menu);
    $('#pnav').innerHTML = menu.map(b => `<a href="#/" data-go="b-${esc(b.id)}">${esc(b.data.menu)}</a>`).join('');
    $('#lp-flink').innerHTML = menu.map(b => `<a href="#/" data-go="b-${esc(b.id)}">${esc(b.data.menu)}</a>`).join('');
    $('#lp-fkontak').innerHTML = [s.TELP && 'Telp/WA: ' + esc(s.TELP), s.EMAIL && esc(s.EMAIL), s.JAM_BELAJAR && 'Belajar: ' + esc((s.HARI_BELAJAR ? s.HARI_BELAJAR + ' ' : '') + s.JAM_BELAJAR)].filter(Boolean).join('<br>') || '—';
  });
}

function renderLogin() {
  const app = $('#app');
  const roles = [{ k: 'wali', t: 'Santri • Wali', l: 'Nomor Induk Santri (NIS)', ph: 'mis. 2026001', h: 'Gunakan NIS santri yang tertera pada kartu.', i: 'badge' },
    { k: 'ustadz', t: 'Ustadz • Guru', l: 'Nama pengguna asatidz', ph: 'nama pengguna', h: 'Diberikan oleh Admin TU.', i: 'person' },
    { k: 'admin', t: 'Admin TU', l: 'Nama pengguna admin', ph: 'nama pengguna', h: 'Akun pengelola madrasah.', i: 'admin_panel_settings' }];
  let role = 'wali';
  app.innerHTML = `<div class="login-bg">
    <header class="pub-top"><div class="in-w"><a class="btn sm" href="#/">${ico('arrow_back', 'sm')} Kembali ke Beranda</a><span class="grow"></span>${temaBtn()}</div></header>
    <main class="grow" style="padding:8px 16px"><form class="card login-card" id="f" novalidate>
      <div class="center"><div class="login-emblem">${ico('menu_book', 'lg')}</div><h2>Portal Terpadu SIMADANI</h2><p class="sub mt-s" id="lg-sub">Sistem Informasi Manajemen Madrasah Diniyah</p></div>
      <div class="mt"><div class="sub" style="font-weight:600;margin-bottom:6px">Pilih akses pengguna</div><div class="seg fill" id="rl" role="tablist">${roles.map(r => `<button type="button" role="tab" data-r="${r.k}" class="${r.k === role ? 'on' : ''}">${r.t}</button>`).join('')}</div></div>
      <label class="f mt" id="l1"><span id="l1t"></span><span class="field-icon"><span class="ms" id="l1i"></span><input class="in" id="uid" autocomplete="username" autocapitalize="none" spellcheck="false" required></span><span class="hint" id="l1h"></span></label>
      <label class="f mt-s">Kata sandi<span class="field-icon">${ico('lock')}<input class="in" id="pw" type="password" autocomplete="current-password" required><button type="button" class="eye" id="eye" aria-label="Tampilkan sandi">${ico('visibility')}</button></span></label>
      <label class="chk mt-s"><input type="checkbox" id="ingat"><span>Ingat sesi login saya di perangkat ini</span></label>
      <div class="notice bad mt-s hide" id="err" role="alert">${ico('error')}<span id="errt"></span></div>
      <button class="btn primary block mt" id="go" type="submit" style="min-height:52px">Masuk ke Portal ${ico('login', 'sm')}</button>
      <div class="row between mt"><button type="button" class="btn sm" id="lupa">Lupa sandi?</button><span class="faint" style="font-size:12px">${ico('lock', 'sm')} Aktivitas login dicatat</span></div>
    </form></main></div>`;
  bindTema(app);
  const setRole = k => { role = k; const r = roles.find(x => x.k === k); $$('#rl button').forEach(b => b.classList.toggle('on', b.dataset.r === k)); $('#l1t').textContent = r.l; $('#uid').placeholder = r.ph; $('#l1h').textContent = r.h; $('#l1i').textContent = r.i; $('#uid').inputMode = k === 'wali' ? 'numeric' : 'text'; $('#err').classList.add('hide'); };
  setRole('wali');
  on(app, 'click', '#rl button', (e, b) => setRole(b.dataset.r));
  $('#eye').onclick = () => { const p = $('#pw'); const s = p.type === 'password'; p.type = s ? 'text' : 'password'; $('#eye .ms').textContent = s ? 'visibility_off' : 'visibility'; };
  $('#lupa').onclick = () => modal({ title: 'Lupa kata sandi', body: '<p>Demi keamanan, sandi hanya dapat direset oleh Admin TU. Hubungi sekretariat madrasah dan sebutkan NIS atau nama pengguna Anda — Anda akan menerima sandi sementara.</p>', actions: [{ label: 'Mengerti', cls: 'primary' }] });
  $('#f').onsubmit = async e => {
    e.preventDefault(); const err = $('#err');
    const id = $('#uid').value.trim(), pw = $('#pw').value;
    if (!id || !pw) { $('#errt').textContent = 'Isi ID pengguna dan kata sandi.'; err.classList.remove('hide'); return; }
    err.classList.add('hide');
    await tombolSibuk($('#go'), async () => {
      const r = await api('auth.login', { role, id, password: pw, ingat: $('#ingat').checked });
      if (!r.success) { $('#errt').textContent = r.message; err.classList.remove('hide'); $('#pw').value = ''; $('#pw').focus(); return; }
      await masukSesi(r.data, $('#ingat').checked);
    });
  };
}
async function masukSesi(d, ingat) {
  Sesi.token = d.token; Sesi.me = d.me; Sesi.save(ingat);
  const m = await api('auth.me'); if (m.success) { Sesi.meta = m.data; Sesi.me = m.data.me; Sesi.save(ingat); }
  Router.go(Shell.beranda());
}

/* Akses darurat — rute tersembunyi (#/darurat), tidak ditautkan dari antarmuka mana pun (R9) */
function renderDarurat() {
  const app = $('#app');
  app.innerHTML = `<div class="login-bg"><main class="grow" style="padding:24px 16px"><form class="card login-card" id="f">
    <div class="center"><div class="login-emblem" style="color:var(--danger)">${ico('emergency', 'lg')}</div><h2>Akses Darurat</h2><p class="sub mt-s">Hanya untuk pemulihan bila akun admin terkunci. Setiap pemakaian dicatat.</p></div>
    <label class="f mt">Nama pengguna<input class="in" id="du" autocomplete="off" autocapitalize="none" required></label>
    <label class="f mt-s">Kata sandi<input class="in" id="dp" type="password" autocomplete="off" required></label>
    <div class="notice bad mt-s hide" id="err" role="alert">${ico('error')}<span id="errt"></span></div>
    <button class="btn primary block mt" id="go" type="submit">Masuk</button><a class="btn block mt-s" href="#/">Batal</a></form></main></div>`;
  $('#f').onsubmit = async e => { e.preventDefault(); await tombolSibuk($('#go'), async () => { const r = await api('auth.darurat', { username: $('#du').value.trim(), password: $('#dp').value }); if (!r.success) { $('#errt').textContent = r.message; $('#err').classList.remove('hide'); return; } await masukSesi(r.data, false); }); };
}
