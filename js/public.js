/* =====================================================================
   public.js — landing page publik, login, akses darurat (tidak ditautkan dari mana pun)
   ===================================================================== */
'use strict';
const PUB_DEF = { NAMA_MADRASAH: 'Madrasah Diniyah Tarbiyatul Huda', SLOGAN: "Membina generasi Qur'ani, berakhlak karimah, dan unggul dalam kajian diniyah.", TA_AKTIF: '', ALAMAT: '', TELP: '', EMAIL: '', JAM_BELAJAR: '', HARI_BELAJAR: '', AKREDITASI: '', WA_PPDB: '', KELAS_DAFTAR: '' };
const temaBtn = () => `<button class="btn icon" data-act="tema" aria-label="Ganti tema terang/gelap">${ico('contrast')}</button>`;
function bindTema(root) { on(root, 'click', '[data-act=tema]', () => Tema.toggle()); }

function renderLanding() {
  const app = $('#app'); document.body.classList.remove('drawer');
  app.innerHTML = `
  <header class="pub-top"><div class="in-w">
    <a href="#/" class="row" style="color:inherit"><span class="logo">${ico('mosque')}</span><b style="font:700 16px var(--font-h)" id="lp-nama">Tarbiyatul Huda</b></a>
    <nav class="pub-nav" aria-label="Navigasi utama"><a href="#/">Beranda</a><a href="#/" data-go="program">Program</a><a href="#/" data-go="agenda">Agenda</a><a href="#/" data-go="kontak">Kontak</a></nav>
    <span class="grow"></span>${temaBtn()}<a class="btn primary" href="#/login">${ico('login', 'sm')} <span>Portal Login</span></a>
  </div></header>
  <main class="wrap">
    <section class="s"><div class="card hero">
      <div class="col gap-lg">
        <span class="pill" id="lp-akr">${ico('verified', 'sm')} Sistem Informasi Madrasah Diniyah</span>
        <h1 id="lp-slogan">${esc(PUB_DEF.SLOGAN)}</h1>
        <p class="muted" style="font-size:16px;line-height:26px">Satu portal untuk presensi QR, catatan hafalan &amp; hanca, SPP, dan materi belajar — transparan bagi wali santri, ringan bagi asatidz.</p>
        <div class="row wrap"><a class="btn primary" id="lp-ppdb" href="#/login">${ico('login', 'sm')} Masuk Portal</a><a class="btn" href="#/" data-go="program">${ico('menu_book', 'sm')} Lihat Program</a></div>
        <div class="row wrap faint" style="font-size:13px;gap:18px"><span class="row">${ico('qr_code_scanner', 'sm')} Presensi QR</span><span class="row">${ico('auto_stories', 'sm')} Hafalan &amp; Hanca</span><span class="row">${ico('account_balance_wallet', 'sm')} SPP Digital</span></div>
      </div>
      <div class="art" aria-hidden="true">${ico('mosque')}<span class="pill" style="position:absolute;left:16px;bottom:16px;background:rgba(0,0,0,.25);color:#fff;box-shadow:none" id="lp-jam">${ico('schedule', 'sm')} <span>Jam belajar</span></span></div>
    </div></section>
    <section class="s"><div class="grid g3" id="lp-stat">${[0, 1, 2].map(() => '<div class="card kpi"><div class="skel" style="height:44px"></div></div>').join('')}</div></section>
    <section class="s" id="program">
      <div class="sec-title"><span class="pill">Kurikulum komprehensif</span><h2>Program Unggulan Madrasah</h2></div>
      <div class="grid g3">
        ${[['menu_book', "Ngaji Al-Qur'an & Talaqqi Iqro", ['Bimbingan privat per kelompok kecil', 'Evaluasi kelancaran makhraj berkala', 'Ujian kenaikan jilid']],
          ['auto_stories', "Hafalan Juz 'Amma & Muraaja'ah", ['Setoran harian tercatat per santri', "Muraaja'ah berkala", 'Capaian terpantau wali secara real-time']],
          ['school', 'Materi Diniyah & Kitab Kuning', ['Fiqih ibadah, akhlak, dan adab', 'Nahwu-shorof dasar', 'Materi PDF tersedia di portal']]]
          .map(p => `<article class="card feat"><div class="ico">${ico(p[0])}</div><h3>${esc(p[1])}</h3><ul>${p[2].map(x => `<li>${ico('check_circle', 'sm')}<span>${esc(x)}</span></li>`).join('')}</ul></article>`).join('')}
      </div>
    </section>
    <section class="s"><div class="card"><div class="sec-title"><span class="pill">Keunggulan sistem digital</span><h2>Transparan, akurat, terpercaya</h2></div>
      <div class="grid g3">${[['qr_code_2', 'Presensi Kartu QR', 'Santri cukup menunjukkan kartu; kehadiran tercatat otomatis dan wali dapat memantaunya.'], ['chat', 'Pemberitahuan WhatsApp', 'Informasi tagihan dan kehadiran dikirim ke wali tanpa merepotkan pengurus.'], ['receipt_long', 'SPP & Kuitansi Digital', 'Unggah bukti transfer dari ponsel, verifikasi oleh TU, kuitansi dapat dicetak.']]
        .map(f => `<div class="card flat feat"><div class="ico">${ico(f[0])}</div><h3>${f[1]}</h3><p class="sub mt-s">${f[2]}</p></div>`).join('')}</div></div></section>
    <section class="s" id="agenda"><div class="sec-title"><span class="pill">Informasi terkini</span><h2>Agenda &amp; Pengumuman</h2></div><div class="grid g3" id="lp-berita"><div class="card"><div class="skel" style="height:90px"></div></div></div></section>
    <section class="s"><div class="cta"><div class="col"><h2>Daftarkan putra-putri Anda</h2><p id="lp-cta-sub" style="opacity:.85">Hubungi sekretariat untuk informasi pendaftaran santri baru.</p></div><div class="row wrap" id="lp-cta-btn"></div></div></section>
  </main>
  <footer class="foot" id="kontak"><div class="wrap">
    <div class="col"><b style="font:700 16px var(--font-h)" id="lp-fnama"></b><p class="sub" id="lp-falamat"></p></div>
    <div><h4>Tautan</h4><a href="#/" data-go="program">Program</a><a href="#/" data-go="agenda">Agenda</a><a href="#/login">Portal Akademik Santri &amp; Wali</a></div>
    <div><h4>Kontak</h4><span class="sub" id="lp-fkontak" style="display:block"></span></div>
  </div></footer>`;
  bindTema(app);
  on(app, 'click', '[data-go]', (e, a) => { e.preventDefault(); const el = document.getElementById(a.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth' }); });
  swr('publik.landing', null, (d, dariCache, r) => {
    const pesanErr = !d && r ? r.message : '';
    if (pesanErr) { $('#lp-stat').innerHTML = `<div class="card full" style="grid-column:1/-1"><div class="notice bad">${ico('cloud_off')}<span>${esc(pesanErr)}</span></div></div>`; return; }
    const s = Object.assign({}, PUB_DEF, d.setting);
    document.title = s.NAMA_MADRASAH + ' — SIMADANI';
    $('#lp-nama').textContent = s.NAMA_MADRASAH; $('#lp-slogan').textContent = s.SLOGAN; $('#lp-fnama').textContent = s.NAMA_MADRASAH;
    if (s.AKREDITASI) $('#lp-akr').innerHTML = `${ico('verified', 'sm')} ${esc(s.AKREDITASI)}${s.TA_AKTIF ? ' • T.A. ' + esc(s.TA_AKTIF) : ''}`;
    if (s.JAM_BELAJAR) $('#lp-jam span').textContent = (s.HARI_BELAJAR ? s.HARI_BELAJAR + ' • ' : '') + s.JAM_BELAJAR;
    $('#lp-falamat').textContent = s.ALAMAT;
    $('#lp-fkontak').innerHTML = [s.TELP && 'Telp/WA: ' + esc(s.TELP), s.EMAIL && esc(s.EMAIL), s.HARI_BELAJAR && 'Belajar: ' + esc(s.HARI_BELAJAR) + ' ' + esc(s.JAM_BELAJAR)].filter(Boolean).join('<br>') || '—';
    const st = d.statistik || {};
    $('#lp-stat').innerHTML = [['groups', st.santri, 'Santri aktif'], ['school', st.asatidz, 'Asatidz'], ['domain', st.kelas, 'Kelas diniyah']].map(x => `<div class="card kpi"><div class="l"><span>${x[2]}</span><span class="ico">${ico(x[0])}</span></div><div class="v">${x[1] == null ? '–' : x[1]}</div></div>`).join('');
    const b = d.berita || [];
    $('#lp-berita').innerHTML = b.length ? b.slice(0, 3).map(x => `<article class="card flat col"><div class="row between"><span class="badge info">${esc(x.Kategori)}</span><span class="faint" style="font-size:12px">${tglID(x.Tanggal)}</span></div><h3>${esc(x.Judul)}</h3><p class="sub">${esc(x.Ringkasan)}</p>${x.Lokasi ? `<p class="faint row" style="font-size:12px">${ico('location_on', 'sm')} ${esc(x.Lokasi)}</p>` : ''}</article>`).join('') : `<div class="card empty" style="grid-column:1/-1">${ico('campaign')}Belum ada pengumuman.</div>`;
    const wa = String(s.WA_PPDB || '').replace(/\D/g, '').replace(/^0/, '62');
    $('#lp-cta-btn').innerHTML = (wa ? `<a class="btn" href="https://wa.me/${wa}?text=${encodeURIComponent('Assalamu\'alaikum, saya ingin bertanya tentang pendaftaran santri baru.')}" target="_blank" rel="noopener">${ico('chat', 'sm')} Konsultasi via WhatsApp</a>` : '') + `<a class="btn" href="#/login">${ico('login', 'sm')} Portal Wali</a>`;
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
