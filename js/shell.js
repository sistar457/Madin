/* =====================================================================
   shell.js — kerangka aplikasi (sidebar/bottom-nav), dashboard staf, portal wali, akun
   ===================================================================== */
'use strict';
const STAF = ['admin', 'ustadz'], SEMUA = ['admin', 'ustadz', 'wali'];
const NAV = [
  { r: '/dashboard', t: 'Dashboard', i: 'grid_view', roles: STAF },
  { r: '/beranda', t: 'Beranda', i: 'home', roles: ['wali'] },
  { r: '/santri', t: 'Data Santri', i: 'groups', roles: STAF },
  { r: '/presensi', t: 'Presensi QR', i: 'qr_code_scanner', roles: STAF },
  { r: '/anak/presensi', t: 'Presensi', i: 'event_available', roles: ['wali'] },
  { r: '/hafalan', t: 'Hafalan & Hanca', i: 'menu_book', roles: STAF },
  { r: '/anak/hafalan', t: 'Hafalan', i: 'menu_book', roles: ['wali'] },
  { r: '/keuangan', t: 'Keuangan SPP', i: 'account_balance_wallet', roles: ['admin'] },
  { r: '/spp', t: 'SPP', i: 'account_balance_wallet', roles: ['wali'] },
  { r: '/materi', t: 'Materi Belajar', i: 'auto_stories', roles: SEMUA },
  { r: '/laporan', t: 'Laporan', i: 'bar_chart', roles: STAF },
  { sec: 'Administrasi', roles: ['admin'] },
  { r: '/halaman', t: 'Halaman Depan', i: 'web', roles: ['admin'] },
  { r: '/notifikasi', t: 'WhatsApp & Notifikasi', i: 'forum', roles: ['admin'] },
  { r: '/crm', t: 'CRM Kontak', i: 'contacts', roles: ['admin'] },
  { r: '/berita', t: 'Berita & Agenda', i: 'campaign', roles: ['admin'] },
  { r: '/pengguna', t: 'Pengguna', i: 'manage_accounts', roles: ['admin'] },
  { r: '/migrasi', t: 'Migrasi Data', i: 'sync_alt', roles: ['admin'] },
  { r: '/pengaturan', t: 'Pengaturan', i: 'tune', roles: ['admin'] },
  { r: '/akun', t: 'Akun Saya', i: 'person', roles: SEMUA }
];
const urlAman = u => /^https:\/\/(drive|docs)\.google\.com\//.test(u) || /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(u) ? u : /^https:\/\//.test(u) ? u : '';
const STATUS_BADGE = { Lunas: 'ok', Menunggu: 'info', 'Belum Bayar': 'bad', Ditolak: 'warn' };
const badgeBayar = s => `<span class="badge ${STATUS_BADGE[s] || ''}">${esc(s)}</span>`;
const Meta = () => Sesi.meta || { kelas: [], kualitas: ['Mumtaz', 'Lancar', 'Jayyid', "Muraaja'ah"], jenisSetoran: ["Tahfidz Al-Qur'an", "Muraaja'ah", "Hanca Al-Qur'an", 'Iqro', 'Hanca Kitab Kuning'], tahunAjaran: '', madrasah: 'MDT Tarbiyatul Huda' };
const kelasOpt = (sel, semua) => (semua ? `<option value="">${semua}</option>` : '') + Meta().kelas.map(k => `<option ${k === sel ? 'selected' : ''}>${esc(k)}</option>`).join('');
const galat = (m, aksi) => `<div class="card empty">${ico('cloud_off')}<p>${esc(m || 'Gagal memuat data.')}</p>${aksi === false ? '' : '<button class="btn mt" data-act="muat-ulang">Coba lagi</button>'}</div>`;
const kosong = (ikon, teks) => `<div class="empty">${ico(ikon)}<p>${esc(teks)}</p></div>`;
const skelCards = n => Array.from({ length: n }, () => '<div class="card"><div class="skel" style="height:80px"></div></div>').join('');
const judul = (crumb, h, aksi) => `<div class="head"><div><div class="crumb">${esc(crumb)}</div><h1>${esc(h)}</h1></div><div class="row wrap">${aksi || ''}</div></div>`;

const Shell = {
  uid: null,
  beranda() { return Sesi.role === 'wali' ? '/beranda' : '/dashboard'; },
  items() { return NAV.filter(n => n.roles.indexOf(Sesi.role) > -1); },
  build() {
    if (this.uid === Sesi.me.id && $('#view')) return;
    this.uid = Sesi.me.id;
    const it = this.items(), bot = it.filter(n => n.r).slice(0, 4);
    $('#app').innerHTML = `<div class="app">
      <aside class="side" id="side" aria-label="Menu utama"><div class="brand"><span class="logo">${ico('mosque')}</span><div><b>SIMADANI</b><small>Tarbiyatul Huda</small></div></div>
        <nav class="nav">${it.map(n => n.sec ? `<div class="sec">${n.sec}</div>` : `<a href="#${n.r}" data-r="${n.r}">${ico(n.i)}<span>${n.t}</span></a>`).join('')}</nav>
        <div class="me">${av(Sesi.me.nama)}<div class="grow"><b style="display:block;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(Sesi.me.nama)}</b><small class="faint">${Sesi.role === 'admin' ? 'Admin TU' : Sesi.role === 'ustadz' ? 'Ustadz / Ustadzah' : 'Wali Santri'}</small></div><button class="btn icon sm" data-act="keluar" aria-label="Keluar">${ico('logout', 'sm')}</button></div></aside>
      <div class="scrim" data-act="tutup-menu"></div>
      <div class="main"><header class="topbar"><button class="btn icon menu-btn" data-act="menu" aria-label="Buka menu">${ico('menu')}</button><span class="title" id="ttl"></span><span class="grow"></span>
        <span class="ta hide-m"><i class="dot"></i>T.A. ${esc(Meta().tahunAjaran || '')}</span><button class="btn icon" data-act="tema" aria-label="Ganti tema">${ico('contrast')}</button></header>
        <main class="view" id="view"></main></div>
      <nav class="bottom" aria-label="Navigasi bawah">${bot.map(n => `<a href="#${n.r}" data-r="${n.r}">${ico(n.i)}<span>${n.t.split(' ')[0]}</span></a>`).join('')}<a href="#${Router.path()}" data-act="menu" role="button">${ico('apps')}<span>Menu</span></a></nav></div>`;
    const app = $('#app');
    on(app, 'click', '[data-act=tema]', () => Tema.toggle());
    on(app, 'click', '[data-act=menu]', e => { e.preventDefault(); document.body.classList.toggle('drawer'); });
    on(app, 'click', '[data-act=tutup-menu]', () => document.body.classList.remove('drawer'));
    on(app, 'click', '.nav a', () => document.body.classList.remove('drawer'));
    on(app, 'click', '[data-act=keluar]', async () => { if (await konfirmasi('Keluar dari SIMADANI di perangkat ini?', 'Keluar')) { Sesi.clear(); Shell.uid = null; Router.go('/'); } });
  },
  mount(title) {
    this.build();
    $$('[data-r]').forEach(a => a.classList.toggle('on', Router.path() === a.dataset.r || (a.dataset.r !== '/' && Router.path().indexOf(a.dataset.r + '/') === 0 && false)));
    const t = $('#ttl'); if (t) t.textContent = title || '';
    document.title = (title ? title + ' — ' : '') + 'SIMADANI';
    const lama = $('#view'), v = lama.cloneNode(false); lama.replaceWith(v); return v;   // elemen baru: listener halaman lama tidak terbawa
  }
};

/* ---------- Dashboard staf ---------- */
function pageDashboard(v) {
  const admin = Sesi.role === 'admin'; let chart = null, pekan = 'ini', data = null, mati = false;
  v.innerHTML = judul('Madrasah / Dashboard Operasional', 'Dashboard ' + (admin ? 'Tata Usaha' : 'Asatidz'), `<a class="btn primary" href="#/presensi">${ico('qr_code_scanner', 'sm')} Presensi Cepat</a><a class="btn" href="#/hafalan">${ico('menu_book', 'sm')} Input Setoran</a><button class="btn" onclick="window.print()">${ico('print', 'sm')} Cetak</button>`) + `<div id="dv">${`<div class="grid g4">${skelCards(4)}</div>`}</div>`;
  const draw = () => {
    if (mati || !data) return; const d = data, pr = d.presensi, sp = d.spp;
    const kpi = (l, ik, val, foot, cls) => `<div class="card kpi"><div class="l"><span>${l}</span><span class="ico">${ico(ik)}</span></div><div class="v ${cls || ''}">${val}</div><div class="sub">${foot}</div></div>`;
    const tren = pekan === 'ini' ? d.trenIni : d.trenLalu, rata = tren.filter(x => x.persen != null);
    const rataV = rata.length ? Math.round(rata.reduce((a, x) => a + x.persen, 0) / rata.length * 10) / 10 : 0;
    $('#dv').innerHTML = `<div class="grid g4">
      ${kpi('Presensi hari ini', 'how_to_reg', d.persenHadir + '%<small> (' + pr.H + '/' + d.totalSantri + ')</small>', `${pr.I} izin · ${pr.S} sakit · ${pr.A} alfa`)}
      ${kpi('Setoran hari ini', 'record_voice_over', d.setoran.santri + '<small> santri</small>', Object.keys(d.setoran.kualitas).filter(k => d.setoran.kualitas[k]).map(k => d.setoran.kualitas[k] + ' ' + k).join(' · ') || 'Belum ada setoran')}
      ${kpi('SPP terbayar bulan ini', 'payments', rp(sp.terbayar), `${sp.lunas}/${sp.total} lunas · ${sp.menunggu} menunggu TU`, 'blue')}
      ${kpi('Materi belajar', 'auto_stories', d.materi + '<small> modul</small>', 'Tersedia di portal wali')}</div>
    <div class="grid g-main mt"><div class="card"><div class="row between wrap"><div><h3>Tren Kehadiran Mingguan</h3><p class="sub">Persentase santri hadir terhadap total santri aktif</p></div><div class="seg" id="sg"><button data-p="ini" class="${pekan === 'ini' ? 'on' : ''}">Pekan ini</button><button data-p="lalu" class="${pekan === 'lalu' ? 'on' : ''}">Pekan lalu</button></div></div>
      <div style="height:240px;margin-top:14px"><canvas id="ch" aria-label="Grafik kehadiran"></canvas></div><div class="inset row between" style="padding:10px 14px;margin-top:12px"><span>Rata-rata pekan: <b>${rataV}%</b></span><span class="faint">Ambang 85%</span></div></div>
      <div class="card"><h3>Capaian Kelancaran Setoran</h3><p class="sub">30 hari terakhir, per jenjang (di luar penilaian muraaja'ah)</p>
        <div class="col mt">${d.capaian.length ? d.capaian.map(c => `<div><div class="row between"><span>${esc(c.jenjang)}</span><b>${c.persen}%</b></div><div class="bar ${c.persen < 60 ? 'amber' : ''}"><i style="width:${c.persen}%"></i></div></div>`).join('') : kosong('hourglass_empty', 'Belum ada data setoran.')}</div></div></div>
    ${admin ? `<div class="grid g-main mt"><div class="card"><div class="row between"><div><h3>Antrean Validasi SPP</h3><p class="sub">${d.antreanValidasi.length} bukti transfer menunggu konfirmasi</p></div><a class="btn sm" href="#/keuangan">Buka keuangan ${ico('arrow_forward', 'sm')}</a></div>
      <div class="col mt">${d.antreanValidasi.length ? d.antreanValidasi.map(k => `<div class="inset row between wrap" style="padding:10px 14px"><div class="nm">${esc(k.Nama)}<small>${esc(k.Kelas)} · ${periodeID(k.Periode)}</small></div><b>${rp(k.Nominal)}</b><div class="row">${urlAman(k.URL_Bukti) ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(urlAman(k.URL_Bukti))}">${ico('receipt', 'sm')} Struk</a>` : ''}<button class="btn sm primary" data-v="${esc(k.ID_Transaksi)}" data-a="terima">Validasi</button><button class="btn sm danger" data-v="${esc(k.ID_Transaksi)}" data-a="tolak">Tolak</button></div></div>`).join('') : kosong('task_alt', 'Semua bukti transfer sudah diproses.')}</div></div>
      <div class="card"><h3>Log Aktivitas</h3><div class="col mt" style="max-height:340px;overflow:auto">${d.log.length ? d.log.map(l => `<div class="inset" style="padding:8px 12px"><div class="row between"><b style="font-size:12px">${esc(l.User === 'darurat' ? 'Akses darurat' : l.Role)}</b><span class="faint" style="font-size:11px">${esc(String(l.Waktu).slice(11, 16))}</span></div><div style="font-size:13px">${esc(l.Aksi)} ${l.Entitas ? '· ' + esc(l.Entitas) : ''}</div></div>`).join('') : kosong('history', 'Belum ada aktivitas.')}</div></div></div>` : ''}`;
    const lib = loadScript(CDN.chart).then(() => {
      if (mati || !$('#ch')) return; if (chart) chart.destroy();
      const css = getComputedStyle(document.documentElement), pri = css.getPropertyValue('--primary').trim(), ink = css.getPropertyValue('--ink-2').trim(), amb = css.getPropertyValue('--amber').trim();
      chart = new Chart($('#ch'), { type: 'bar', data: { labels: tren.map(x => HARI[new Date(x.tanggal + 'T00:00:00Z').getUTCDay()].slice(0, 3)), datasets: [{ type: 'bar', label: 'Hadir (%)', data: tren.map(x => x.persen), backgroundColor: pri, borderRadius: 8, maxBarThickness: 44 }, { type: 'line', label: 'Ambang 85%', data: tren.map(() => 85), borderColor: amb, borderDash: [6, 4], pointRadius: 0, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, ticks: { color: ink }, grid: { color: 'rgba(128,128,128,.15)' } }, x: { ticks: { color: ink }, grid: { display: false } } }, plugins: { legend: { labels: { color: ink } } } } });
    }).catch(() => { const c = $('#ch'); if (c) c.parentNode.innerHTML = '<div class="notice">Grafik tidak dapat dimuat (periksa koneksi).</div>'; });
    return lib;
  };
  swr('dashboard', {}, (d, cache, r) => { if (!d) { $('#dv').innerHTML = galat(r && r.message); return; } data = d; draw(); });
  on(v, 'click', '#sg button', (e, b) => { pekan = b.dataset.p; draw(); });
  on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  on(v, 'click', '[data-v]', async (e, b) => {
    const id = b.dataset.v, aksi = b.dataset.a;
    let catatan = '';
    if (aksi === 'tolak') { catatan = await mintaAlasan(); if (catatan == null) return; }
    await tombolSibuk(b, async () => { const r = await api('keuangan.validasi', { id, aksi, catatan }); toast(r.message, r.success ? '' : 'error'); if (r.success) { Api.epoch++; Router.render(); } });
  });
  return () => { mati = true; if (chart) chart.destroy(); };
}
function mintaAlasan() {
  return new Promise(res => { let ok = false; modal({ title: 'Tolak bukti transfer', body: '<label class="f">Alasan penolakan<span class="hint">Wali akan menerima alasan ini agar dapat mengunggah ulang.</span><textarea class="in" id="alasan" maxlength="150" placeholder="mis. Foto buram / nominal tidak sesuai"></textarea></label>', onClose: () => { if (!ok) res(null); },
    actions: [{ label: 'Batal' }, { label: 'Tolak bukti', cls: 'danger', onClick: (bg) => { const t = $('#alasan', bg).value.trim(); if (!t) { toast('Isi alasan penolakan.', 'warn'); return false; } ok = true; res(t); } }] }); });
}

/* ---------- Kuitansi (cetak) ---------- */
function cetakKuitansi(k, anak) {
  const w = window.open('', '_blank'); if (!w) { toast('Pop-up diblokir. Izinkan pop-up untuk mencetak.', 'warn'); return; }
  const nm = Meta().madrasah || 'MDT Tarbiyatul Huda';
  w.document.write(`<!doctype html><html lang="id"><meta charset="utf-8"><title>Kuitansi ${esc(k.ID_Transaksi)}</title><style>body{font:14px/1.6 Arial,sans-serif;margin:0;padding:24px;color:#111}.k{max-width:560px;margin:auto;border:2px solid #0f4c3a;border-radius:12px;padding:24px}h2{margin:0 0 4px;color:#0f4c3a}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:6px 0;border-bottom:1px dashed #bbb}td:last-child{text-align:right;font-weight:bold}.lunas{display:inline-block;border:3px solid #0f4c3a;color:#0f4c3a;padding:4px 14px;border-radius:8px;font-weight:bold;transform:rotate(-4deg);margin-top:8px}@media print{button{display:none}}</style>
  <div class="k"><h2>${esc(nm)}</h2><div>Kuitansi Pembayaran ${esc(k.Jenis_Iuran)}</div><table><tr><td>No. Transaksi</td><td>${esc(k.ID_Transaksi)}</td></tr><tr><td>Nama santri</td><td>${esc(k.Nama)}</td></tr><tr><td>NIS / Kelas</td><td>${esc(k.NIS)} / ${esc(k.Kelas)}</td></tr><tr><td>Periode</td><td>${esc(periodeID(k.Periode))}</td></tr><tr><td>Tanggal lunas</td><td>${esc(tglID(k.Tanggal))}</td></tr><tr><td>Nominal</td><td>${esc(rp(k.Nominal))}</td></tr></table><span class="lunas">LUNAS</span><p style="font-size:12px;color:#555;margin-top:18px">Kuitansi ini dicetak dari sistem SIMADANI dan sah tanpa tanda tangan basah.</p></div><p style="text-align:center"><button onclick="print()">Cetak</button></p><script>setTimeout(function(){print()},400)<\/script></html>`);
  w.document.close();
}

/* ---------- Portal wali ---------- */
let _anakIdx = 0;
function pilihAnakHtml(anak) { return anak.length > 1 ? `<label class="f" style="min-width:220px"><span class="sr">Pilih anak</span><select class="in" id="pa">${anak.map((a, i) => `<option value="${i}" ${i === _anakIdx ? 'selected' : ''}>${esc(a.santri.Nama)} — ${esc(a.santri.Kelas)}</option>`).join('')}</select></label>` : ''; }

function pageBeranda(v) {
  v.innerHTML = judul('Portal Wali', 'Beranda') + `<div id="bv">${skelCards(2)}</div>`; let mati = false;
  swr('beranda.wali', {}, (d, cache, r) => {
    if (mati) return; const bv = $('#bv'); if (!bv) return;
    if (!d) { bv.innerHTML = galat(r && r.message); return; }
    if (!d.anak.length) { bv.innerHTML = `<div class="card">${kosong('child_care', 'Belum ada santri yang tertaut ke akun ini. Hubungi Admin TU.')}</div>`; return; }
    if (_anakIdx >= d.anak.length) _anakIdx = 0;
    const a = d.anak[_anakIdx], s = a.santri, bln = bulanIni();
    const tg = a.tagihan.find(t => t.Periode === bln) || a.tagihan[0], hariLbl = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alfa' }, warna = { H: 'ok', I: 'info', S: 'warn', A: 'bad' };
    const bukaTagihan = a.tagihan.filter(t => t.Status === 'Belum Bayar' || t.Status === 'Ditolak');
    bv.innerHTML = `${d.anak.length > 1 ? `<div class="mb">${pilihAnakHtml(d.anak)}</div>` : ''}
    <div class="card"><div class="row top wrap">${av(s.Nama, 'lg')}<div class="grow"><h2>${esc(s.Nama)}</h2><p class="sub">NIS ${esc(s.NIS)} · ${esc(s.Kelas)}${s.Musyrif ? ' · Musyrif: ' + esc(s.Musyrif) : ''}</p>
      <div class="row wrap mt-s">${tg ? `<span class="badge ${STATUS_BADGE[tg.Status] || ''}">SPP ${esc(periodeID(tg.Periode))}: ${esc(tg.Status)}</span>` : '<span class="badge">Belum ada tagihan</span>'}</div></div></div></div>
    <div class="grid g4 mt">${[['qr_code_2', 'Kartu QR', 'qr'], ['auto_stories', 'Setoran', '#/anak/hafalan'], ['event_available', 'Presensi', '#/anak/presensi'], ['receipt_long', 'Kuitansi & SPP', '#/spp']].map(x => `<a class="card flat col center" style="align-items:center;color:inherit;padding:14px" ${x[2] === 'qr' ? 'href="#/beranda" data-qr="1"' : `href="${x[2]}"`}><span class="ico kpi" style="display:contents"><span class="ms lg" style="color:var(--primary)">${x[0]}</span></span><b style="font-size:13px">${x[1]}</b></a>`).join('')}</div>
    <div class="grid g2 mt">
      <div class="card"><div class="row between"><h3>Presensi & Mutaba'ah</h3><span class="badge ok">${a.persenHadir}% hadir</span></div><p class="sub">7 pencatatan terakhir</p>
        <div class="week mt">${a.presensi.length ? a.presensi.slice().reverse().map(p => `<div class="d"><div class="faint">${hariID(p.Tanggal).slice(0, 3)}</div><div class="mt-s"><span class="badge ${warna[p.Status] || ''}">${p.Status}</span></div><div class="faint" style="font-size:10px;margin-top:4px">${p.Tanggal.slice(8)}/${p.Tanggal.slice(5, 7)}</div></div>`).join('') : kosong('event_busy', 'Belum ada catatan presensi.')}</div>
        <p class="faint mt-s" style="font-size:12px">30 hari: ${a.rekap.H} hadir · ${a.rekap.I} izin · ${a.rekap.S} sakit · ${a.rekap.A} alfa</p></div>
      <div class="card"><div class="row between"><h3>Setoran Terakhir</h3><a href="#/anak/hafalan" class="btn sm">Buku kendali ${ico('arrow_forward', 'sm')}</a></div>
        ${a.setoran.length ? `<div class="inset mt" style="padding:14px"><div class="row between"><b>${esc(a.setoran[0].Capaian)}</b><span class="badge ${a.setoran[0].Kualitas === "Muraaja'ah" ? 'warn' : 'ok'}">${esc(a.setoran[0].Kualitas)}</span></div><p class="sub">${esc(a.setoran[0].Jenis)} · ${tglID(a.setoran[0].Tanggal)}</p>${a.setoran[0].Catatan ? `<p class="mt-s" style="font-style:italic">“${esc(a.setoran[0].Catatan)}”</p>` : ''}</div>` : kosong('menu_book', 'Belum ada setoran tercatat.')}</div>
      <div class="card"><div class="row between"><h3>Syahriah / SPP</h3><a href="#/spp" class="btn sm">Semua tagihan</a></div>
        ${bukaTagihan.length ? `<div class="notice mt">${ico('info')}<span>${bukaTagihan.length} tagihan perlu dibayar: ${bukaTagihan.map(t => periodeID(t.Periode) + ' (' + rp(t.Nominal) + ')').join(', ')}.</span></div><a class="btn primary block mt" href="#/spp">${ico('upload', 'sm')} Unggah bukti pembayaran</a>` : `<div class="notice info mt">${ico('check_circle')}<span>Tidak ada tunggakan.</span></div>`}</div>
      <div class="card"><h3>Agenda & Wara-wara</h3><div class="col mt">${d.agenda.length ? d.agenda.map(b => `<div class="inset" style="padding:12px"><div class="row between"><span class="badge info">${esc(b.Kategori)}</span><span class="faint" style="font-size:12px">${tglID(b.Tanggal)}</span></div><b style="display:block;margin-top:6px">${esc(b.Judul)}</b><p class="sub">${esc(b.Ringkasan)}</p></div>`).join('') : kosong('campaign', 'Belum ada pengumuman.')}</div></div></div>`;
  });
  on(v, 'change', '#pa', (e, s) => { _anakIdx = +s.value; Router.render(); });
  on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  on(v, 'click', '[data-qr]', async (e) => { e.preventDefault(); const d = (await api('beranda.wali')).data; const s = d && d.anak[_anakIdx] && d.anak[_anakIdx].santri; if (s) kartuDigital(s.NIS); });
  return () => { mati = true; };
}
async function kartuDigital(nis) {
  const r = await api('santri.kartu', { nis }); if (!r.success) return toast(r.message, 'error');
  const s = r.data, svg = await qrSvg(s.Kode, 5);
  modal({ title: 'Kartu QR Digital', body: `<div class="id-card"><div class="row between"><b>${esc(Meta().madrasah)}</b><span class="badge">Kartu Santri</span></div><div class="row mt top" style="gap:16px"><div class="qr" style="width:150px;flex:none">${svg}</div><div class="col"><h3>${esc(s.Nama)}</h3><span>NIS: <b class="mono">${esc(s.NIS)}</b></span><span>Kelas: ${esc(s.Kelas)}</span>${s.Musyrif ? `<span>Musyrif: ${esc(s.Musyrif)}</span>` : ''}</div></div></div><p class="sub mt">Tunjukkan kode ini kepada petugas presensi. Jangan dibagikan ke orang lain.</p>`, actions: [{ label: 'Tutup', cls: 'primary' }] });
}

async function ambilAnak() { const r = await api('beranda.wali'); return r.success ? r.data : null; }
function pageAnakPresensi(v) {
  v.innerHTML = judul('Portal Wali', 'Riwayat Presensi') + '<div id="pv">' + skelCards(1) + '</div>'; let mati = false;
  (async () => {
    const d = await ambilAnak(); if (mati) return; const pv = $('#pv');
    if (!d || !d.anak.length) { pv.innerHTML = `<div class="card">${kosong('child_care', 'Belum ada santri tertaut.')}</div>`; return; }
    const a = d.anak[_anakIdx] || d.anak[0], r = await api('presensi.riwayat', { nis: a.santri.NIS }); if (mati) return;
    if (!r.success) { pv.innerHTML = galat(r.message); return; }
    const x = r.data, W = { H: 'ok', I: 'info', S: 'warn', A: 'bad' }, L = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alfa' };
    pv.innerHTML = `${pilihAnakHtml(d.anak) ? `<div class="mb">${pilihAnakHtml(d.anak)}</div>` : ''}<div class="grid g4">${[['Hadir', x.rekap.H, ''], ['Izin', x.rekap.I, 'blue'], ['Sakit', x.rekap.S, 'amber'], ['Alfa', x.rekap.A, 'red']].map(k => `<div class="card kpi"><div class="l">${k[0]}</div><div class="v ${k[2]}">${k[1]}</div></div>`).join('')}</div>
      <div class="card mt"><div class="row between"><h3>30 hari terakhir — ${esc(a.santri.Nama)}</h3><span class="badge ok">${x.persen}% hadir</span></div><div class="tbl-wrap mt"><table class="t"><thead><tr><th>Tanggal</th><th>Status</th><th>Waktu</th><th>Keterangan</th></tr></thead><tbody>${x.rows.length ? x.rows.map(p => `<tr><td>${hariID(p.Tanggal)}, ${tglID(p.Tanggal)}</td><td><span class="badge ${W[p.Status]}">${L[p.Status]}</span></td><td>${esc(p.Waktu)}</td><td>${esc(p.Keterangan)}</td></tr>`).join('') : `<tr><td colspan="4">${kosong('event_busy', 'Belum ada catatan.')}</td></tr>`}</tbody></table></div></div>`;
  })();
  on(v, 'change', '#pa', (e, s) => { _anakIdx = +s.value; Router.render(); }); on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  return () => { mati = true; };
}
function pageAnakHafalan(v) {
  v.innerHTML = judul('Portal Wali', 'Buku Kendali Hafalan & Hanca') + '<div id="pv">' + skelCards(1) + '</div>'; let mati = false;
  (async () => {
    const d = await ambilAnak(); if (mati) return; const pv = $('#pv');
    if (!d || !d.anak.length) { pv.innerHTML = `<div class="card">${kosong('child_care', 'Belum ada santri tertaut.')}</div>`; return; }
    const a = d.anak[_anakIdx] || d.anak[0], r = await api('hafalan.riwayat', { nis: a.santri.NIS }); if (mati) return;
    if (!r.success) { pv.innerHTML = galat(r.message); return; }
    pv.innerHTML = `${pilihAnakHtml(d.anak) ? `<div class="mb">${pilihAnakHtml(d.anak)}</div>` : ''}<div class="card"><h3>Riwayat setoran — ${esc(a.santri.Nama)}</h3><div class="tbl-wrap mt"><table class="t"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Capaian</th><th>Kualitas</th><th>Catatan ustadz</th></tr></thead><tbody>${r.data.rows.length ? r.data.rows.map(h => `<tr><td>${tglID(h.Tanggal)}</td><td>${esc(h.Jenis)}</td><td><b>${esc(h.Capaian)}</b></td><td><span class="badge ${h.Kualitas === "Muraaja'ah" ? 'warn' : 'ok'}">${esc(h.Kualitas)}</span></td><td>${esc(h.Catatan)}</td></tr>`).join('') : `<tr><td colspan="5">${kosong('menu_book', 'Belum ada setoran tercatat.')}</td></tr>`}</tbody></table></div></div>`;
  })();
  on(v, 'change', '#pa', (e, s) => { _anakIdx = +s.value; Router.render(); }); on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  return () => { mati = true; };
}
function pageSPPWali(v) {
  v.innerHTML = judul('Portal Wali', 'Syahriah / SPP') + '<div id="pv">' + skelCards(2) + '</div>'; let mati = false;
  (async () => {
    const d = await ambilAnak(); if (mati) return; const pv = $('#pv');
    if (!d || !d.anak.length) { pv.innerHTML = `<div class="card">${kosong('child_care', 'Belum ada santri tertaut.')}</div>`; return; }
    const r = await api('keuangan.list', {}); if (mati) return;
    if (!r.success) { pv.innerHTML = galat(r.message); return; }
    const rek = r.data.rekening || {}, rows = r.data.rows;
    pv.innerHTML = `${rek.nomor ? `<div class="card flat mb"><div class="row between wrap"><div><div class="sub">Transfer ke rekening madrasah</div><b style="font:700 18px var(--font-h)">${esc(rek.bank)} · <span class="mono">${esc(rek.nomor)}</span></b><div class="sub">a.n. ${esc(rek.atasNama)}</div></div><button class="btn sm" data-salin="${esc(rek.nomor)}">${ico('content_copy', 'sm')} Salin nomor</button></div></div>` : ''}
    <div class="grid g2">${rows.length ? rows.map(k => `<div class="card bukti-card"><div class="row between"><b>${esc(k.Jenis_Iuran)} · ${periodeID(k.Periode)}</b>${badgeBayar(k.Status)}</div><div class="sub">${esc(k.Nama)} · ${esc(k.Kelas)}</div><div style="font:700 24px var(--font-h);color:var(--primary)">${rp(k.Nominal)}</div>${k.Catatan ? `<div class="notice ${k.Status === 'Ditolak' ? 'bad' : 'info'}">${ico('info')}<span>${esc(k.Catatan)}</span></div>` : ''}<div class="row wrap">${(k.Status === 'Belum Bayar' || k.Status === 'Ditolak') ? `<button class="btn primary" data-up="${esc(k.ID_Transaksi)}">${ico('upload', 'sm')} Unggah bukti</button>` : ''}${urlAman(k.URL_Bukti) ? `<a class="btn" target="_blank" rel="noopener" href="${esc(urlAman(k.URL_Bukti))}">${ico('image', 'sm')} Lihat bukti</a>` : ''}${k.Status === 'Lunas' && num_(k.Nominal) > 0 ? `<button class="btn" data-kw="${esc(k.ID_Transaksi)}">${ico('print', 'sm')} Kuitansi</button>` : ''}</div></div>`).join('') : `<div class="card" style="grid-column:1/-1">${kosong('receipt_long', 'Belum ada tagihan.')}</div>`}</div>`;
    pv._rows = rows;
    on(pv, 'click', '[data-salin]', (e, b) => salin(b.dataset.salin));
    on(pv, 'click', '[data-kw]', (e, b) => cetakKuitansi(rows.find(x => x.ID_Transaksi === b.dataset.kw)));
    on(pv, 'click', '[data-up]', (e, b) => dialogUnggahBukti(rows.find(x => x.ID_Transaksi === b.dataset.up), () => { Api.epoch++; Router.render(); }));
  })();
  on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  return () => { mati = true; };
}
const num_ = n => Number(n) || 0;
function dialogUnggahBukti(k, selesai) {
  modal({ title: 'Unggah bukti transfer', body: `<div class="notice info mb">${ico('info')}<span>${esc(k.Nama)} · ${periodeID(k.Periode)} · <b>${rp(k.Nominal)}</b></span></div><label class="drop" for="bf" id="drop">${ico('cloud_upload', 'lg')}<div>Pilih foto/screenshot bukti atau PDF</div><div class="faint" style="font-size:12px">JPG, PNG, WEBP, PDF · maks 3 MB (foto dikompres otomatis)</div><div id="fn" class="mt-s" style="font-weight:600"></div></label><input type="file" id="bf" class="sr" accept="image/jpeg,image/png,image/webp,application/pdf">`,
    onOpen: bg => { $('#bf', bg).onchange = e => { const f = e.target.files[0]; $('#fn', bg).textContent = f ? f.name : ''; }; },
    actions: [{ label: 'Batal' }, { label: `${ico('upload', 'sm')} Kirim bukti`, cls: 'primary', onClick: async bg => {
      const f = $('#bf', bg).files[0]; if (!f) { toast('Pilih berkas terlebih dahulu.', 'warn'); return false; }
      try { const b = await siapkanBerkas(f, 3); const r = await api('keuangan.upload', { id: k.ID_Transaksi, namaFile: b.nama.slice(0, 40), mime: b.mime, base64: b.base64 }, { timeout: 90000 }); if (!r.success) { toast(r.message, 'error'); return false; } toast(r.message); selesai(); } catch (e) { toast(e.message, 'error'); return false; } } }] });
}

/* ---------- Akun ---------- */
function pageAkun(v) {
  const me = Sesi.me;
  v.innerHTML = judul(Sesi.role === 'wali' ? 'Portal Wali' : 'Pengaturan', 'Akun Saya') + `<div class="grid g2"><div class="card"><div class="row">${av(me.nama, 'lg')}<div><h3>${esc(me.nama)}</h3><p class="sub">${esc(me.username)} · ${Sesi.role === 'wali' ? 'Wali santri' : Sesi.role === 'ustadz' ? 'Ustadz' : 'Admin'}</p></div></div>
    <div class="sep"></div><div class="col"><button class="btn block" data-act="tema">${ico('contrast', 'sm')} Ganti tema terang / gelap</button><button class="btn block" id="outall">${ico('devices', 'sm')} Keluar dari semua perangkat</button><button class="btn block danger" id="out">${ico('logout', 'sm')} Keluar</button></div></div>
    <form class="card" id="pf"><h3>Ubah kata sandi</h3><div class="col mt"><label class="f">Sandi saat ini<input class="in" type="password" id="s0" autocomplete="current-password" required></label><label class="f">Sandi baru<span class="hint">Minimal 8 karakter, kombinasi huruf dan angka.</span><input class="in" type="password" id="s1" autocomplete="new-password" required minlength="8"></label><label class="f">Ulangi sandi baru<input class="in" type="password" id="s2" autocomplete="new-password" required></label><button class="btn primary" type="submit">Simpan sandi</button></div></form></div>`;
  on(v, 'click', '[data-act=tema]', () => Tema.toggle());
  $('#out').onclick = async () => { if (await konfirmasi('Keluar dari SIMADANI?', 'Keluar')) { Sesi.clear(); Shell.uid = null; Router.go('/'); } };
  $('#outall').onclick = async () => { if (await konfirmasi('Semua perangkat (termasuk ini) akan dikeluarkan.', 'Keluarkan semua')) { await api('auth.keluarSemua'); Sesi.clear(); Shell.uid = null; Router.go('/login'); } };
  $('#pf').onsubmit = async e => { e.preventDefault(); if ($('#s1').value !== $('#s2').value) return toast('Konfirmasi sandi tidak sama.', 'error');
    await tombolSibuk($('#pf button'), async () => { const r = await api('auth.ubahSandi', { lama: $('#s0').value, baru: $('#s1').value }); toast(r.message, r.success ? '' : 'error'); if (r.success) { Sesi.clear(); Shell.uid = null; Router.go('/login'); } }); };
}
