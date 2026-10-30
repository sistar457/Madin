/* =====================================================================
   akademik.js — Data Santri & Kartu QR, Presensi (scanner + batch), Hafalan & Hanca (batch per kelas)
   ===================================================================== */
'use strict';

/* ---------- Data Santri ---------- */
function formSantri(s, baru) {
  s = s || {}; const kelas = Meta().kelas;
  return `<div class="form-grid">
    <label class="f">NIS<input class="in" id="f-nis" value="${esc(s.NIS || '')}" ${baru ? '' : 'readonly'} placeholder="mis. 2026001" maxlength="20"></label>
    <label class="f">Nama lengkap<input class="in" id="f-nama" value="${esc(s.Nama || '')}" maxlength="80"></label>
    <label class="f">Kelas<select class="in" id="f-kelas">${kelas.map(k => `<option ${k === s.Kelas ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
    <label class="f">Jenis kelamin<select class="in" id="f-jk"><option value="L" ${s.JK !== 'P' ? 'selected' : ''}>Laki-laki (Banin)</option><option value="P" ${s.JK === 'P' ? 'selected' : ''}>Perempuan (Banat)</option></select></label>
    <label class="f">Nama wali<input class="in" id="f-wali" value="${esc(s.Wali || '')}" maxlength="80"></label>
    <label class="f">No. WhatsApp wali<input class="in" id="f-kontak" inputmode="tel" value="${esc(s.Kontak || '')}" placeholder="08xxxxxxxxxx"></label>
    <label class="f">Email wali (opsional)<input class="in" id="f-email" type="email" value="${esc(s.Email_Wali || '')}"></label>
    <label class="f">Musyrif / wali kelas<input class="in" id="f-musyrif" value="${esc(s.Musyrif || '')}" maxlength="80"></label>
    <label class="f full">Alamat<input class="in" id="f-alamat" value="${esc(s.Alamat || '')}" maxlength="200"></label>
    <label class="f">Status<select class="in" id="f-status">${['Aktif', 'Nonaktif', 'Lulus'].map(x => `<option ${x === (s.Status || 'Aktif') ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="chk" style="align-self:end"><input type="checkbox" id="f-bea" ${s.Beasiswa === 'YA' ? 'checked' : ''}><span>Penerima beasiswa (SPP gratis)</span></label></div>`;
}
const bacaFormSantri = bg => ({ NIS: $('#f-nis', bg).value.trim(), Nama: $('#f-nama', bg).value, Kelas: $('#f-kelas', bg).value, JK: $('#f-jk', bg).value, Wali: $('#f-wali', bg).value, Kontak: $('#f-kontak', bg).value, Email_Wali: $('#f-email', bg).value, Musyrif: $('#f-musyrif', bg).value, Alamat: $('#f-alamat', bg).value, Status: $('#f-status', bg).value, Beasiswa: $('#f-bea', bg).checked ? 'YA' : 'TIDAK' });

function kartuHtml(s, svg) {
  return `<div class="kartu"><div class="kh"><b>${esc(Meta().madrasah || 'MDT Tarbiyatul Huda')}</b><small>KARTU TANDA SANTRI & PRESENSI</small></div><div class="kb"><div class="qr">${svg}</div><div class="ki"><div class="nm">${esc(s.Nama)}</div><div>NIS <b>${esc(s.NIS)}</b></div><div>Kelas ${esc(s.Kelas)}</div>${s.Musyrif ? `<div>Musyrif: ${esc(s.Musyrif)}</div>` : ''}</div></div></div>`;
}
async function cetakKartu(daftar) {
  const w = window.open('', '_blank'); if (!w) { toast('Pop-up diblokir. Izinkan pop-up untuk mencetak.', 'warn'); return false; }
  w.document.write('<p style="font-family:sans-serif">Menyiapkan kartu…</p>');
  try { const bagian = []; for (const s of daftar) bagian.push(kartuHtml(s, await qrSvg(s.Kode, 4)));
    w.document.open(); w.document.write(`<!doctype html><html lang="id"><meta charset="utf-8"><title>Kartu Santri</title><style>@page{margin:10mm}body{margin:0;font-family:Arial,sans-serif;color:#111}.g{display:grid;grid-template-columns:repeat(2,85.6mm);gap:6mm}.kartu{width:85.6mm;height:54mm;border:1px solid #0f4c3a;border-radius:3mm;overflow:hidden;page-break-inside:avoid;display:flex;flex-direction:column}.kh{background:#0f4c3a;color:#fff;padding:2.5mm 4mm;line-height:1.2}.kh b{display:block;font-size:11pt}.kh small{font-size:6.5pt;letter-spacing:.05em;opacity:.85}.kb{display:flex;gap:4mm;padding:3mm 4mm;align-items:center;flex:1}.qr{width:30mm;flex:none}.qr svg{width:100%;height:auto}.ki{font-size:9pt;line-height:1.5}.nm{font-size:12pt;font-weight:bold;margin-bottom:1mm}</style><div class="g">${bagian.join('')}</div><script>setTimeout(function(){print()},500)<\/script></html>`); w.document.close(); return true;
  } catch (e) { w.close(); toast(e.message, 'error'); return false; }
}

function pageSantri(v) {
  const admin = Sesi.role === 'admin'; let rows = [], f = { q: '', kelas: '', fl: '' }, sel = new Set(), aktif = null, mati = false;
  v.innerHTML = judul('Madrasah / Master Data', 'Data Induk Santri', admin ? `<button class="btn primary" id="add">${ico('person_add', 'sm')} Tambah santri</button><button class="btn" id="imp">${ico('upload_file', 'sm')} Impor CSV</button><button class="btn" id="cetak">${ico('print', 'sm')} Cetak kartu</button><button class="btn" id="exp">${ico('download', 'sm')} Ekspor CSV</button>` : `<button class="btn" id="exp">${ico('download', 'sm')} Ekspor CSV</button>`) + '<div id="sv">' + `<div class="grid g4">${skelCards(4)}</div>` + '</div>';
  const filt = () => rows.filter(s => (!f.kelas || s.Kelas === f.kelas) && (!f.q || (s.Nama + ' ' + s.NIS + ' ' + s.Wali).toLowerCase().indexOf(f.q.toLowerCase()) > -1) && (f.fl === '' || (f.fl === 'L' && s.JK !== 'P') || (f.fl === 'P' && s.JK === 'P') || (f.fl === 'cetak' && s.Status_QR !== 'Tercetak')) && (s.Status !== 'Nonaktif' || f.fl === 'nonaktif') && (f.fl !== 'nonaktif' || s.Status === 'Nonaktif'));
  const draw = () => {
    if (mati) return; const aktifRows = rows.filter(s => s.Status === 'Aktif'), list = filt();
    const tercetak = aktifRows.filter(s => s.Status_QR === 'Tercetak').length, jj = {}; aktifRows.forEach(s => { const j = s.Kelas.split(' ')[0]; jj[j] = (jj[j] || 0) + 1; });
    const kpi = (l, ik, val, foot) => `<div class="card kpi"><div class="l"><span>${l}</span><span class="ico">${ico(ik)}</span></div><div class="v">${val}</div><div class="sub">${foot}</div></div>`;
    $('#sv').innerHTML = `<div class="grid g4">${kpi('Total santri aktif', 'groups', aktifRows.length + '<small> santri</small>', `${aktifRows.filter(s => s.JK !== 'P').length} banin · ${aktifRows.filter(s => s.JK === 'P').length} banat`)}
      ${kpi('Kartu QR', 'qr_code_2', tercetak + '<small> tercetak</small>', `${aktifRows.length - tercetak} belum cetak`)}${kpi('Jenjang', 'school', Object.keys(jj).length + '<small> jenjang</small>', Object.keys(jj).map(k => k + ': ' + jj[k]).join(' · ') || '–')}${kpi('Beasiswa', 'volunteer_activism', aktifRows.filter(s => s.Beasiswa === 'YA').length + '<small> santri</small>', 'SPP digratiskan')}</div>
    <div class="grid ${admin ? 'g-main' : ''} mt"><div class="col"><div class="card"><div class="row wrap"><label class="f grow" style="min-width:200px"><span class="sr">Cari</span><span class="field-icon">${ico('search')}<input class="in" id="q" placeholder="Cari nama, NIS, wali…" value="${esc(f.q)}"></span></label><select class="in" id="fk" style="max-width:200px" aria-label="Filter kelas">${kelasOpt(f.kelas, 'Semua kelas')}</select></div>
        <div class="chips mt-s">${[['', 'Semua (' + aktifRows.length + ')'], ['L', 'Banin'], ['P', 'Banat'], ['cetak', 'Perlu cetak (' + (aktifRows.length - tercetak) + ')'], ['nonaktif', 'Nonaktif']].map(c => `<button class="chip ${f.fl === c[0] ? 'on' : ''}" data-fl="${c[0]}">${c[1]}</button>`).join('')}</div></div>
      <div class="card"><div class="tbl-wrap"><table class="t"><thead><tr>${admin ? '<th style="width:36px"><input type="checkbox" id="all" aria-label="Pilih semua"></th>' : ''}<th>Santri</th><th>Kelas</th><th>Wali & kontak</th><th>Kartu QR</th>${admin ? '<th></th>' : ''}</tr></thead><tbody>${list.length ? list.map(s => `<tr class="${sel.has(s.NIS) ? 'sel' : ''}">${admin ? `<td><input type="checkbox" data-sel="${esc(s.NIS)}" ${sel.has(s.NIS) ? 'checked' : ''} aria-label="Pilih ${esc(s.Nama)}"></td>` : ''}<td><div class="row">${av(s.Nama, s.JK === 'P' ? 'amber' : '')}<div class="nm">${esc(s.Nama)}<small>${esc(s.NIS)} · ${s.JK === 'P' ? 'Banat' : 'Banin'}${s.Status !== 'Aktif' ? ' · ' + esc(s.Status) : ''}</small></div></div></td><td>${esc(s.Kelas)}</td><td><div class="nm">${esc(s.Wali || '-')}<small>${esc(s.Kontak || 'tanpa nomor')}</small></div></td><td><span class="badge ${s.Status_QR === 'Tercetak' ? 'ok' : 'warn'}">${s.Status_QR === 'Tercetak' ? 'Tercetak' : 'Belum cetak'}</span></td>${admin ? `<td class="right"><button class="btn sm icon" data-qr="${esc(s.NIS)}" aria-label="Lihat kartu">${ico('qr_code_2', 'sm')}</button> <button class="btn sm icon" data-ed="${esc(s.NIS)}" aria-label="Ubah">${ico('edit', 'sm')}</button></td>` : ''}</tr>`).join('') : `<tr><td colspan="6">${kosong('search_off', 'Tidak ada santri yang cocok.')}</td></tr>`}</tbody></table></div>
        <p class="faint mt-s" style="font-size:12px">${list.length} santri ditampilkan${sel.size ? ' · ' + sel.size + ' dipilih' : ''}</p></div></div>
      ${admin ? `<div class="card" id="insp" style="align-self:start;position:sticky;top:76px"><h3>Inspektor Kartu</h3><div id="insp-b" class="mt">${kosong('qr_code_2', 'Pilih ikon QR pada baris santri untuk melihat kartunya.')}</div></div>` : ''}</div>`;
    if (admin && aktif) tampilInspektor(aktif);
  };
  async function tampilInspektor(nis) {
    const s = rows.find(x => x.NIS === nis); const b = $('#insp-b'); if (!s || !b) return; aktif = nis;
    try { const svg = await qrSvg(s.Kode, 5); if (!$('#insp-b')) return;
      $('#insp-b').innerHTML = `<div class="id-card"><div class="row between"><b style="font-size:12px">${esc(Meta().madrasah)}</b><span class="badge">KARTU SANTRI</span></div><div class="row top mt" style="gap:14px"><div class="qr" style="width:120px;flex:none">${svg}</div><div class="col" style="gap:2px"><b style="font:700 16px var(--font-h)">${esc(s.Nama)}</b><span>NIS <b class="mono">${esc(s.NIS)}</b></span><span>${esc(s.Kelas)}</span><span class="faint" style="font-size:12px">${esc(s.Musyrif || '')}</span></div></div></div>
      <div class="col mt"><button class="btn primary" data-cetak1="${esc(s.NIS)}">${ico('print', 'sm')} Cetak kartu ini</button><button class="btn danger" id="regen">${ico('autorenew', 'sm')} Regenerasi semua kode QR</button></div><p class="faint mt-s" style="font-size:12px">Kode QR bertanda tangan digital; kartu palsu tidak akan diterima pemindai.</p>`;
    } catch (e) { b.innerHTML = `<div class="notice bad">${esc(e.message)}</div>`; }
  }
  const muat = () => swr('santri.list', { semua: true }, (d, c, r) => { if (!d) { $('#sv').innerHTML = galat(r && r.message); return; } rows = d.rows; draw(); }, { noCache: true });
  muat();
  on(v, 'input', '#q', debounce(e => { f.q = e.target.value; const pos = e.target.selectionStart; draw(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); }, 200));
  on(v, 'change', '#fk', (e, s) => { f.kelas = s.value; draw(); });
  on(v, 'click', '[data-fl]', (e, b) => { f.fl = b.dataset.fl; draw(); });
  on(v, 'change', '[data-sel]', (e, c) => { c.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel); draw(); });
  on(v, 'change', '#all', (e, c) => { filt().forEach(s => c.checked ? sel.add(s.NIS) : sel.delete(s.NIS)); draw(); });
  on(v, 'click', '[data-qr]', (e, b) => { tampilInspektor(b.dataset.qr); $('#insp').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  on(v, 'click', '[data-act=muat-ulang]', () => Router.render());
  const cetak = async daftar => { if (!daftar.length) return toast('Pilih santri terlebih dahulu.', 'warn'); if (await cetakKartu(daftar)) { const r = await api('santri.statusQR', { nis: daftar.map(s => s.NIS) }); if (r.success) { Api.epoch++; muat(); } } };
  on(v, 'click', '[data-cetak1]', (e, b) => cetak(rows.filter(s => s.NIS === b.dataset.cetak1)));
  on(v, 'click', '#regen', async () => { if (await konfirmasi('Semua kode QR lama akan <b>tidak berlaku</b> dan seluruh kartu harus dicetak ulang. Lanjutkan?', 'Regenerasi', true)) { const r = await api('qr.regen'); toast(r.message, r.success ? '' : 'error'); if (r.success) muat(); } });
  const tomb = id => $(id, v);
  if (tomb('#cetak')) tomb('#cetak').onclick = () => cetak(sel.size ? rows.filter(s => sel.has(s.NIS)) : rows.filter(s => s.Status === 'Aktif' && s.Status_QR !== 'Tercetak'));
  tomb('#exp').onclick = () => unduhCSV('data-santri.csv', [['NIS', 'Nama', 'Kelas', 'JK', 'Wali', 'Kontak', 'Musyrif', 'Status', 'Beasiswa']].concat(filt().map(s => [s.NIS, s.Nama, s.Kelas, s.JK, s.Wali, s.Kontak, s.Musyrif, s.Status, s.Beasiswa])));
  if (admin) {
    tomb('#add').onclick = () => modal({ title: 'Tambah santri baru', wide: true, body: formSantri(null, true) + '<p class="faint mt-s" style="font-size:12px">Akun wali dibuat otomatis (ID = NIS). Sandi awal ditampilkan sekali setelah disimpan.</p>', actions: [{ label: 'Batal' }, { label: 'Simpan santri', cls: 'primary', onClick: async bg => { const r = await api('santri.save', Object.assign(bacaFormSantri(bg), { baru: true })); if (!r.success) { toast(r.message, 'error'); return false; } toast(r.message); if (r.data.akun) tampilkanKredensial('Akun wali dibuat', [r.data.akun]); muat(); } }] });
    on(v, 'click', '[data-ed]', (e, b) => { const s = rows.find(x => x.NIS === b.dataset.ed); modal({ title: 'Ubah data santri', wide: true, body: formSantri(s, false), actions: [{ label: 'Batal' }, { label: 'Simpan perubahan', cls: 'primary', onClick: async bg => { const r = await api('santri.save', bacaFormSantri(bg)); if (!r.success) { toast(r.message, 'error'); return false; } toast(r.message); muat(); } }] }); });
    tomb('#imp').onclick = dialogImporSantri.bind(null, muat);
  }
  return () => { mati = true; };
}

function dialogImporSantri(selesai) {
  let parsed = [];
  modal({ title: 'Impor santri dari CSV', wide: true, body: `<p class="sub">Kolom yang dikenali: <b>NIS, Nama, Kelas, JK, Wali, Kontak</b> (opsional: Email_Wali, Musyrif, Beasiswa). Baris dengan NIS yang sudah ada akan diperbarui.</p><div class="row wrap mt"><label class="btn" for="cf">${ico('upload_file', 'sm')} Pilih berkas CSV</label><input type="file" id="cf" class="sr" accept=".csv,text/csv"><button class="btn" id="tpl">${ico('download', 'sm')} Unduh templat</button></div><div id="pv" class="mt"></div>`,
    onOpen: bg => {
      $('#tpl', bg).onclick = () => unduhCSV('templat-santri.csv', [['NIS', 'Nama', 'Kelas', 'JK', 'Wali', 'Kontak'], ['2026001', 'Ahmad Fulan', Meta().kelas[0] || 'Ula 1', 'L', 'Bpk. Gunawan', '081234567890']]);
      $('#cf', bg).onchange = async e => { const f = e.target.files[0]; if (!f) return; const t = parseCSV(await f.text()); if (t.length < 2) { $('#pv', bg).innerHTML = '<div class="notice bad">Berkas kosong.</div>'; return; }
        const h = t[0].map(x => x.trim().toLowerCase().replace(/[\s_]/g, '')), idx = k => h.indexOf(k);
        const map = { NIS: idx('nis'), Nama: idx('nama'), Kelas: idx('kelas'), JK: idx('jk'), Wali: idx('wali'), Kontak: Math.max(idx('kontak'), idx('hp'), idx('nowa')), Email_Wali: Math.max(idx('emailwali'), idx('email')), Musyrif: idx('musyrif'), Beasiswa: idx('beasiswa') };
        if (map.NIS < 0 || map.Nama < 0 || map.Kelas < 0) { $('#pv', bg).innerHTML = '<div class="notice bad">Header wajib: NIS, Nama, Kelas.</div>'; return; }
        parsed = t.slice(1).map(r => { const o = {}; Object.keys(map).forEach(k => { o[k] = map[k] > -1 ? (r[map[k]] || '').trim() : ''; }); if (o.Kontak && /^8/.test(o.Kontak)) o.Kontak = '0' + o.Kontak; if (/^(p|perempuan|banat)/i.test(o.JK)) o.JK = 'P'; else o.JK = 'L'; o.Beasiswa = /^(ya|y|1)$/i.test(o.Beasiswa) ? 'YA' : 'TIDAK'; return o; });
        $('#pv', bg).innerHTML = `<div class="notice info">${ico('info')}<span><b>${parsed.length}</b> baris siap diimpor. Contoh: ${esc(parsed.slice(0, 3).map(x => x.Nama).join(', '))}…</span></div>`; };
    },
    actions: [{ label: 'Batal' }, { label: 'Impor sekarang', cls: 'primary', onClick: async bg => {
      if (!parsed.length) { toast('Pilih berkas CSV dulu.', 'warn'); return false; }
      const akun = [], galatL = []; let tambah = 0, ubah = 0;
      for (let i = 0; i < parsed.length; i += 100) { const r = await api('santri.import', { rows: parsed.slice(i, i + 100) }, { timeout: 120000 }); if (!r.success) { toast(r.message, 'error'); return false; } tambah += r.data.ditambah; ubah += r.data.diperbarui; (r.data.galat || []).forEach(g => galatL.push(g)); (r.data.akun || []).forEach(a => akun.push(a)); }
      toast(`Impor selesai: ${tambah} baru, ${ubah} diperbarui.`);
      if (galatL.length) modal({ title: galatL.length + ' baris dilewati', body: `<ul>${galatL.slice(0, 30).map(g => `<li>${esc(g)}</li>`).join('')}</ul>`, actions: [{ label: 'Tutup' }] });
      if (akun.length) tampilkanKredensial('Akun wali baru (' + akun.length + ')', akun);
      selesai(); } }] });
}

/* ---------- Presensi ---------- */
function pagePresensi(v) {
  let tanggal = hariIni(), kelas = (Sesi.me.kelas && Meta().kelas.indexOf(Sesi.me.kelas) > -1) ? Sesi.me.kelas : '', rows = [], dirty = {}, fl = 'semua', scanner = null, kamera = false, terakhir = null, logs = [], cool = {}, mati = false;
  const W = { H: 'ok', I: 'info', S: 'warn', A: 'bad' }, L = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alfa' };
  v.innerHTML = judul('Presensi Santri', 'Terminal Presensi Terpadu', `<button class="btn" id="beep">${ico('volume_up', 'sm')} <span>Beeper: ${BEEP.on ? 'Aktif' : 'Mati'}</span></button><button class="btn" id="csv">${ico('download', 'sm')} Ekspor CSV</button>`) + `<div id="pv"></div>`;
  const rekap = () => { const r = { H: 0, I: 0, S: 0, A: 0, b: 0 }; rows.forEach(x => { x.Status ? r[x.Status]++ : r.b++; }); return r; };
  const buildShell = () => {
    $('#pv').innerHTML = `<div id="kp"></div><div class="grid g-main2 mt">
      <div class="col gap-lg"><div class="card"><div class="row between"><h3>${ico('photo_camera')} Pemindai QR</h3><button class="btn sm ${kamera ? 'danger' : 'primary'}" id="kam">${kamera ? 'Matikan kamera' : 'Nyalakan kamera'}</button></div>
          <div class="scan-box mt" id="sb"><div id="reader" style="width:100%"></div><div class="hint" id="sh">${ico('qr_code_scanner', 'lg')}<br>Kamera belum aktif.<br>Gunakan tombol di atas atau input NIS / pemindai USB di bawah.</div></div>
          <form class="row mt" id="mf" style="align-items:flex-end"><label class="f grow">Input alternatif (NIS / pemindai barcode USB)<span class="field-icon">${ico('badge')}<input class="in" id="nis" inputmode="text" autocomplete="off" placeholder="ketik NIS lalu Enter"></span></label><button class="btn primary" type="submit">${ico('check_circle', 'sm')} Tandai hadir</button></form></div>
        <div class="card" id="last"><h3>Hasil scan terakhir</h3><div id="lastb" class="mt">${kosong('qr_code', 'Belum ada pemindaian.')}</div></div>
        <div class="card"><h3>Audit stream</h3><div class="log inset mt" id="lg">${logs.length ? '' : '<span class="faint">Menunggu pemindaian…</span>'}</div></div></div>
      <div class="col gap-lg"><div class="card"><div class="row wrap"><label class="f"><span class="sr">Tanggal</span><input class="in" type="date" id="tg" value="${tanggal}" max="${hariIni()}"></label><label class="f grow" style="min-width:150px"><span class="sr">Kelas</span><select class="in" id="kl">${kelasOpt(kelas, 'Semua kelas')}</select></label><button class="btn" id="sisa">${ico('done_all', 'sm')} Tandai sisa hadir</button></div><div class="chips mt-s" id="chips"></div></div>
        <div class="card" id="lst"></div></div></div>`;
    renderKpi(); renderList(); renderLog();
  };
  const renderKpi = () => { const r = rekap(), n = rows.length; $('#kp').innerHTML = `<div class="grid g4">${[['Total kehadiran', 'groups', r.H + '<small> / ' + n + ' santri</small>', persen(r.H, n) + '% dari target', ''], ['Izin & sakit', 'medical_services', (r.I + r.S) + '<small> santri</small>', r.I + ' izin · ' + r.S + ' sakit', 'blue'], ['Tanpa keterangan (alfa)', 'warning', r.A + '<small> santri</small>', 'Wali diberi tahu otomatis bila WA aktif', 'red'], ['Belum dicatat', 'pending', r.b + '<small> santri</small>', 'Perlu ditandai sebelum simpan', 'amber']].map(k => `<div class="card kpi"><div class="l"><span>${k[0]}</span><span class="ico">${ico(k[1])}</span></div><div class="v ${k[4]}">${k[2]}</div><div class="sub">${k[3]}</div></div>`).join('')}</div>`; };
  const renderList = () => {
    const r = rekap(), nd = Object.keys(dirty).length;
    $('#chips').innerHTML = [['semua', 'Semua (' + rows.length + ')'], ['H', 'Hadir (' + r.H + ')'], ['I', 'Izin (' + r.I + ')'], ['S', 'Sakit (' + r.S + ')'], ['A', 'Alfa (' + r.A + ')'], ['b', 'Belum (' + r.b + ')']].map(c => `<button class="chip ${fl === c[0] ? 'on' : ''}" data-fl="${c[0]}">${c[1]}</button>`).join('');
    const list = rows.filter(x => fl === 'semua' || (fl === 'b' ? !x.Status : x.Status === fl));
    $('#lst').innerHTML = `${list.length ? list.map((x, i) => `<div class="pres-row"><span class="faint mono">${String(i + 1).padStart(2, '0')}</span><div class="nm">${esc(x.Nama)}<small>${esc(x.NIS)} · ${esc(x.Kelas)}${x.Waktu ? ' · ' + esc(String(x.Waktu).slice(0, 5)) : ''}${x.Metode ? ' · ' + esc(x.Metode) : ''}</small>${(x.Status === 'I' || x.Status === 'S') ? `<input class="in sm" style="margin-top:6px" data-ket="${esc(x.NIS)}" placeholder="Keterangan (opsional)" value="${esc(x.Keterangan || '')}" maxlength="120">` : ''}</div><div class="hias" role="group" aria-label="Status ${esc(x.Nama)}">${['H', 'I', 'S', 'A'].map(s => `<button data-nis="${esc(x.NIS)}" data-s="${s}" class="${x.Status === s ? 'on' : ''}" aria-pressed="${x.Status === s}" aria-label="${L[s]}">${s}</button>`).join('')}</div></div>`).join('') : kosong('groups', rows.length ? 'Tidak ada santri pada filter ini.' : 'Tidak ada santri pada kelas ini.')}
      <div class="inset row between wrap mt" style="padding:12px 14px"><span><b>Rekap:</b> ${r.H} hadir · ${r.I} izin · ${r.S} sakit · ${r.A} alfa · ${r.b} belum</span><button class="btn primary" id="simpan" ${nd ? '' : 'disabled'}>${ico('save', 'sm')} Simpan rekap${nd ? ' (' + nd + ')' : ''}</button></div>`;
  };
  const renderLog = () => { const el = $('#lg'); if (el && logs.length) el.innerHTML = logs.map(l => `<div class="${l.ok ? 'ok' : 'bad'}">[${l.t}] ${esc(l.m)}</div>`).join(''); };
  const catat = (ok, m) => { logs.unshift({ ok, m, t: new Date().toTimeString().slice(0, 8) }); logs = logs.slice(0, 30); renderLog(); };
  const muat = async () => { $('#lst') && ($('#lst').innerHTML = '<div class="skel" style="height:200px"></div>'); const r = await api('presensi.lembar', { tanggal, kelas }); if (mati) return; if (!r.success) { $('#lst').innerHTML = galat(r.message); return; } rows = r.data.rows; dirty = {}; renderKpi(); renderList(); };
  async function scan(kode) {
    kode = String(kode || '').trim(); if (!kode) return;
    if (tanggal !== hariIni()) { toast('Pemindaian hanya untuk hari ini. Ubah tanggal ke hari ini.', 'warn'); return; }
    if (cool[kode] && Date.now() - cool[kode] < 3500) return; cool[kode] = Date.now();
    const r = await api('presensi.scan', { kode });
    if (mati) return;
    if (!r.success) { BEEP.nada(false); toast(r.message, 'error'); catat(false, 'DITOLAK: ' + r.message); $('#lastb').innerHTML = `<div class="notice bad">${ico('error')}<span>${esc(r.message)}</span></div>`; return; }
    const s = r.data.santri; BEEP.nada(true); terakhir = r.data;
    const x = rows.find(z => z.NIS === s.NIS); if (x) { x.Status = 'H'; x.Waktu = r.data.waktu; x.Metode = 'QR'; delete dirty[s.NIS]; }
    $('#lastb').innerHTML = `<div class="inset row" style="padding:14px">${av(s.Nama, 'lg')}<div class="grow"><h3>${esc(s.Nama)}</h3><div class="sub">NIS ${esc(s.NIS)} · ${esc(s.Kelas)}</div><span class="badge ${r.data.sudah ? 'info' : r.data.terlambat ? 'warn' : 'ok'} mt-s">${r.data.sudah ? 'Sudah hadir sebelumnya' : r.data.terlambat ? 'Hadir — terlambat' : 'Hadir tepat waktu'} · ${esc(String(r.data.waktu).slice(0, 5))}</span></div></div>
      <div class="row wrap mt-s"><span class="sub">Koreksi cepat:</span><button class="btn sm blue" data-koreksi="I" data-nis="${esc(s.NIS)}">Ubah ke Izin</button><button class="btn sm" data-koreksi="S" data-nis="${esc(s.NIS)}">Ubah ke Sakit</button><button class="btn sm danger" data-koreksi="A" data-nis="${esc(s.NIS)}">Batal hadir</button></div>`;
    catat(true, `PASS: ${s.NIS} (${s.Nama})${r.data.sudah ? ' — duplikat' : ''}`); renderKpi(); renderList();
  }
  const mulaiKamera = async () => {
    try { await loadScript(CDN.scan); scanner = new Html5Qrcode('reader'); await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, t => scan(t), () => {}); kamera = true; const sh = $('#sh'); if (sh) sh.style.display = 'none'; const k = $('#kam'); if (k) { k.textContent = 'Matikan kamera'; k.className = 'btn sm danger'; } }
    catch (e) { kamera = false; toast('Kamera tidak dapat dibuka: ' + (e.message || e) + '. Pastikan izin kamera diberikan.', 'error'); }
  };
  const matiKamera = async () => { try { if (scanner) { await scanner.stop(); scanner.clear(); } } catch (e) {} scanner = null; kamera = false; const sh = $('#sh'), k = $('#kam'); if (sh) sh.style.display = ''; if (k) { k.textContent = 'Nyalakan kamera'; k.className = 'btn sm primary'; } };
  buildShell(); muat();
  on(v, 'click', '#kam', () => kamera ? matiKamera() : mulaiKamera());
  on(v, 'submit', '#mf', e => { e.preventDefault(); const i = $('#nis'); const k = i.value; i.value = ''; scan(k); i.focus(); });
  on(v, 'change', '#tg', (e, i) => { if (/^\d{4}-\d{2}-\d{2}$/.test(i.value)) { tanggal = i.value; muat(); } });
  on(v, 'change', '#kl', (e, s) => { kelas = s.value; muat(); });
  on(v, 'click', '[data-fl]', (e, b) => { fl = b.dataset.fl; renderList(); });
  on(v, 'click', '.hias button', (e, b) => { const x = rows.find(z => z.NIS === b.dataset.nis); if (!x) return; x.Status = b.dataset.s; dirty[x.NIS] = { nis: x.NIS, status: x.Status, ket: x.Keterangan || '', paksa: true }; renderKpi(); renderList(); });
  on(v, 'click', '[data-koreksi]', (e, b) => { const x = rows.find(z => z.NIS === b.dataset.nis); if (!x) return; x.Status = b.dataset.koreksi; dirty[x.NIS] = { nis: x.NIS, status: x.Status, ket: '', paksa: true }; renderKpi(); renderList(); toast('Koreksi ditandai — tekan "Simpan rekap".'); });
  on(v, 'input', '[data-ket]', (e, i) => { const x = rows.find(z => z.NIS === i.dataset.ket); if (x) { x.Keterangan = i.value; dirty[x.NIS] = { nis: x.NIS, status: x.Status, ket: i.value, paksa: true }; const b = $('#simpan'); if (b) b.disabled = false; } });
  on(v, 'click', '#sisa', () => { rows.forEach(x => { if (!x.Status) { x.Status = 'H'; dirty[x.NIS] = { nis: x.NIS, status: 'H', ket: '', paksa: true }; } }); renderKpi(); renderList(); });
  on(v, 'click', '#simpan', async (e, b) => { await tombolSibuk(b, async () => { const items = Object.keys(dirty).map(k => dirty[k]); const r = await api('presensi.batch', { tanggal, items }); toast(r.message, r.success ? '' : 'error'); if (r.success) { Api.epoch++; muat(); } }); });
  on(v, 'click', '#beep', (e, b) => { BEEP.on = !BEEP.on; $('span', b).textContent = 'Beeper: ' + (BEEP.on ? 'Aktif' : 'Mati'); });
  on(v, 'click', '#csv', () => unduhCSV('presensi-' + tanggal + '.csv', [['Tanggal', 'NIS', 'Nama', 'Kelas', 'Status', 'Waktu', 'Metode', 'Keterangan']].concat(rows.map(x => [tanggal, x.NIS, x.Nama, x.Kelas, x.Status, x.Waktu, x.Metode, x.Keterangan]))));
  on(v, 'click', '[data-act=muat-ulang]', muat);
  return () => { mati = true; matiKamera(); };
}

/* ---------- Hafalan & Hanca ---------- */
function pageHafalan(v) {
  let tanggal = hariIni(), kelas = (Sesi.me.kelas && Meta().kelas.indexOf(Sesi.me.kelas) > -1) ? Sesi.me.kelas : (Meta().kelas[0] || ''), data = null, isi = {}, mati = false;
  v.innerHTML = judul('Akademik', 'Buku Kendali Setoran & Hanca', '') + '<div id="hv"></div>';
  const J = () => Meta().jenisSetoran, K = () => Meta().kualitas;
  const draw = () => {
    if (mati || !data) return; const rg = data.ringkas;
    const kpi = (l, ik, val, foot, cls) => `<div class="card kpi"><div class="l"><span>${l}</span><span class="ico">${ico(ik)}</span></div><div class="v ${cls || ''}">${val}</div><div class="sub">${foot}</div></div>`;
    const nIsi = Object.keys(isi).filter(n => (isi[n].capaian || '').trim()).length;
    $('#hv').innerHTML = `<div class="grid g4">${kpi('Santri di kelas', 'groups', rg.total + '<small> santri</small>', esc(kelas || 'Semua kelas'))}${kpi('Sudah setor', 'task_alt', rg.setor + '<small> / ' + rg.total + '</small>', persen(rg.setor, rg.total) + '% hari ini')}${kpi('Mumtaz / Lancar', 'workspace_premium', (rg.kualitas.Mumtaz + rg.kualitas.Lancar) + '<small> setoran</small>', rg.kualitas.Jayyid + ' jayyid', 'blue')}${kpi("Perlu muraaja'ah", 'replay', rg.kualitas["Muraaja'ah"] + '<small> setoran</small>', 'Butuh pendampingan', 'red')}</div>
    <div class="card mt"><div class="row wrap"><label class="f"><span class="sr">Kelas</span><select class="in" id="hk">${kelasOpt(kelas)}</select></label><label class="f"><span class="sr">Tanggal</span><input class="in" type="date" id="ht" value="${tanggal}" max="${hariIni()}"></label></div></div>
    <div class="card mt"><div class="row between wrap"><div><h3>Lembar Setoran & Mutaba'ah</h3><p class="sub">Isi capaian santri yang setor hari ini; baris kosong diabaikan.</p></div><span class="badge info">${nIsi} baris terisi</span></div>
      <div class="setor-row setor-head"><span>Santri</span><span>Jenis</span><span>Surat/ayat · jilid/hal · bab</span><span>Kualitas</span><span>Catatan</span></div>
      ${data.rows.length ? data.rows.map(s => { const x = isi[s.NIS] || {}; return `<div class="setor-row" data-n="${esc(s.NIS)}"><div class="nm">${esc(s.Nama)}<small>${s.Terakhir ? 'Terakhir: ' + esc(s.Terakhir.Capaian) + ' (' + tglID(s.Terakhir.Tanggal) + ')' : 'Belum ada setoran'}</small>${s.HariIni.length ? `<span class="badge ok">${s.HariIni.length}× tercatat hari ini</span>` : ''}</div>
        <div><span class="lbl">Jenis</span><select class="in sm" data-f="jenis">${J().map(j => `<option ${(x.jenis || (s.Terakhir && s.Terakhir.Jenis) || J()[0]) === j ? 'selected' : ''}>${esc(j)}</option>`).join('')}</select></div>
        <div><span class="lbl">Capaian</span><input class="in sm" data-f="capaian" value="${esc(x.capaian || '')}" placeholder="mis. An-Naba' 1–40" maxlength="120"></div>
        <div><span class="lbl">Kualitas</span><select class="in sm" data-f="kualitas">${K().map(k => `<option ${(x.kualitas || 'Lancar') === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
        <div><span class="lbl">Catatan</span><input class="in sm" data-f="catatan" value="${esc(x.catatan || '')}" placeholder="opsional" maxlength="200"></div></div>`; }).join('') : kosong('groups', 'Tidak ada santri pada kelas ini.')}
      <div class="inset row between wrap mt" style="padding:12px 14px"><span class="muted">Panduan: <b>Mumtaz</b> sangat baik · <b>Lancar</b> baik · <b>Jayyid</b> cukup · <b>Muraaja'ah</b> perlu diulang.</span><button class="btn primary" id="simpan" ${nIsi ? '' : 'disabled'}>${ico('save', 'sm')} Simpan setoran</button></div></div>`;
  };
  const muat = async () => { $('#hv').innerHTML = skelCards(2); const r = await api('hafalan.lembar', { kelas, tanggal }); if (mati) return; if (!r.success) { $('#hv').innerHTML = galat(r.message); return; } data = r.data; draw(); };
  muat();
  on(v, 'change', '#hk', (e, s) => { kelas = s.value; isi = {}; muat(); });
  on(v, 'change', '#ht', (e, i) => { if (/^\d{4}/.test(i.value)) { tanggal = i.value; isi = {}; muat(); } });
  const simpan = (e) => { const row = e.target.closest('[data-n]'); if (!row || !e.target.dataset.f) return; const n = row.dataset.n; isi[n] = isi[n] || {}; isi[n][e.target.dataset.f] = e.target.value; if (!isi[n].jenis) isi[n].jenis = $('[data-f=jenis]', row).value; if (!isi[n].kualitas) isi[n].kualitas = $('[data-f=kualitas]', row).value;
    const nIsi = Object.keys(isi).filter(k => (isi[k].capaian || '').trim()).length, b = $('#simpan'); if (b) b.disabled = !nIsi; const bd = $('.badge.info', v); if (bd && /baris/.test(bd.textContent)) bd.textContent = nIsi + ' baris terisi'; };
  v.addEventListener('input', simpan); v.addEventListener('change', simpan);
  on(v, 'click', '#simpan', async (e, b) => { await tombolSibuk(b, async () => { const items = Object.keys(isi).filter(n => (isi[n].capaian || '').trim()).map(n => Object.assign({ nis: n, jenis: J()[0], kualitas: 'Lancar' }, isi[n])); const r = await api('hafalan.batch', { tanggal, items }); toast(r.message, r.success ? '' : 'error'); if (r.success) { isi = {}; Api.epoch++; muat(); } }); });
  on(v, 'click', '[data-act=muat-ulang]', muat);
  return () => { mati = true; };
}
