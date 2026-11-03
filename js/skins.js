/* =====================================================================
   skins.js — DAFTAR tampilan yang bisa dipilih. Gaya aslinya ada di css/themes.css.
   Menambah tampilan baru: tambahkan blok di css/themes.css, lalu satu baris di sini.
   warna = [warna permukaan, warna utama, warna aksen] hanya untuk kotak contoh di dialog.
   ===================================================================== */
window.SKIN_BAWAAN = 'klasik';
window.SKINS = [
  { id: 'klasik', nama: 'Klasik Hijau', ket: 'Bawaan: krem hangat dan hijau hutan, efek timbul lembut.', warna: ['#EFEAD8', '#0F4C3A', '#D97706'] },
  { id: 'samudra', nama: 'Biru Samudra', ket: 'Biru laut yang tenang, tetap bergaya timbul.', warna: ['#E4ECF2', '#0B4F6C', '#C2610F'] },
  { id: 'senja', nama: 'Senja', ket: 'Marun hangat dengan latar krem kemerahan.', warna: ['#F1E4DD', '#7A1F2B', '#B45309'] },
  { id: 'flat', nama: 'Flat Modern', ket: 'Bersih tanpa efek timbul; sudut lebih tegas dan ringan.', warna: ['#FFFFFF', '#0F4C3A', '#B45309'] },
  { id: 'kontras', nama: 'Kontras Tinggi', ket: 'Garis tegas dan kontras maksimal untuk keterbacaan.', warna: ['#FFFFFF', '#004D2C', '#000000'] }
];
