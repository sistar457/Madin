/* boot.js — daftar rute & mulai aplikasi */
'use strict';
(function () {
  async function pastikanMeta() {
    if (Sesi.token && !Sesi.meta) { const m = await api('auth.me'); if (m.success) { Sesi.meta = m.data; Sesi.me = m.data.me; } }
  }
  function halaman(path, judulHal, fn, roles) {
    Router.add(path, { roles: roles, render: async () => { await pastikanMeta(); if (!Sesi.token) return; const v = Shell.mount(judulHal); return fn(v); } });
  }
  Router.add('/', { pub: true, render: () => { renderLanding(); } });
  Router.add('/login', { pub: true, render: () => { if (Sesi.token) return Router.go(Shell.beranda()); renderLogin(); } });
  Router.add('/darurat', { pub: true, render: () => { renderDarurat(); } });
  Router.add('/404', { pub: true, render: () => Router.go('/') });
  halaman('/dashboard', 'Dashboard', pageDashboard, STAF);
  halaman('/beranda', 'Beranda', pageBeranda, ['wali']);
  halaman('/santri', 'Data Santri', pageSantri, STAF);
  halaman('/presensi', 'Presensi QR', pagePresensi, STAF);
  halaman('/hafalan', 'Hafalan & Hanca', pageHafalan, STAF);
  halaman('/keuangan', 'Keuangan SPP', pageKeuangan, ['admin']);
  halaman('/materi', 'Materi Belajar', pageMateri, SEMUA);
  halaman('/laporan', 'Laporan', pageLaporan, STAF);
  halaman('/halaman', 'Halaman Depan', pageHalaman, ['admin']);
  halaman('/notifikasi', 'WhatsApp & Notifikasi', pageNotifikasi, ['admin']);
  halaman('/crm', 'CRM Kontak', pageCRM, ['admin']);
  halaman('/berita', 'Berita & Agenda', pageBerita, ['admin']);
  halaman('/pengguna', 'Pengguna', pagePengguna, ['admin']);
  halaman('/migrasi', 'Migrasi Data', pageMigrasi, ['admin']);
  halaman('/pengaturan', 'Pengaturan', pagePengaturan, ['admin']);
  halaman('/anak/presensi', 'Presensi', pageAnakPresensi, ['wali']);
  halaman('/anak/hafalan', 'Hafalan', pageAnakHafalan, ['wali']);
  halaman('/spp', 'SPP', pageSPPWali, ['wali']);
  halaman('/akun', 'Akun', pageAkun, SEMUA);

  Sesi.load();
  if (Sesi.token && !Sesi.me) Sesi.clear();
  Router.render();
  // Pemanasan server (GAS cold start) — ringan, hanya saat halaman terbuka
  if (Api.ok()) setTimeout(() => { fetch(window.APP_CONFIG.GAS_URL + '?w=1').catch(() => {}); }, 1500);
})();
