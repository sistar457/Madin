# SIMADANI — MDT Tarbiyatul Huda (Frontend)

Frontend statis (HTML/CSS/JS vanilla) untuk sistem informasi Madrasah Diniyah.
Backend: Google Apps Script sebagai REST API (berkas terpisah — lihat PANDUAN-INSTALASI.md).

- Isi satu-satunya konfigurasi: `js/config.js` → `GAS_URL`.
- `index.html` HARUS berada di root repository (folder ini).
- Deploy: GitHub Pages (branch `main`, folder `/ (root)`) atau Netlify.
- Pustaka pihak ketiga (dimuat saat dibutuhkan, versi dipin dari cdnjs): Chart.js 4.4.1, qrcode-generator 1.4.4, html5-qrcode 2.3.8.
- Rute tersembunyi pemulihan: `#/darurat` (tidak ditautkan dari antarmuka).

Panduan lengkap: `PANDUAN-INSTALASI.md`.
