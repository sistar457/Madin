/* =====================================================================
   pemantau.js — Pemantau Setoran: statistik global semua santri per jenjang/kelas, filter per jenis setoran,
   rincian per santri sebagai acuan perkembangan. Agregasi dihitung di server (di-cache); halaman ini hanya menyajikan.
   ===================================================================== */
'use strict';

const KUAL_WARNA = { Mumtaz: 'var(--primary)', Lancar: 'var(--secondary)', Jayyid: 'var(--amber)', "Muraaja'ah": 'var(--danger)' };
const STATUS_SETOR = { aktif: ['ok', 'Aktif'], perhatian: ['warn', 'Perlu perhatian'], tidak: ['bad', 'Tidak aktif'] };
const mundurHari = (iso, n) => { const p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] - n)).toISOString().slice(0, 10); };
const hariLalu = h => h == null ? 'belum pernah' : h === 0 ? 'hari ini' : h + ' hari lalu';
const persenBaik = (k, total) => total ? Math.round(((k.Mumtaz || 0) + (k.Lancar || 0)) * 1000 / total) / 10 : 0;

function barKualitas(kual, total) {
  if (!total) return '<div class="sb kosong" title="Belum ada setoran"></div>';
  const ks = Meta().kualitas;
  return `<div class="sb" role="img" aria-label="${esc(ks.map(k => k + ' ' + (kual[k] || 0)).join(', '))}">${ks.map(k => kual[k] ? `<i style="width:${kual[k] * 100 / total}%;background:${KUAL_WARNA[k] || 'var(--ink-3)'}" title="${esc(k)}: ${kual[k]}"></i>` : '').join('')}</div>`;
}
const legendaKualitas = () => `<div class="legend">${Meta().kualitas.map(k => `<span><i style="background:${KUAL_WARNA[k] || 'var(--ink-3)'}"></i>${esc(k)}</span>`).join('')}</div>`;
const ringkasJenis = j => { const ks = Object.keys(j || {}).sort((a, b) => j[b] - j[a]); return ks.length ? ks.slice(0, 3).map(k => `${esc(k)} <b>${j[k]}</b>`).join(' · ') + (ks.length > 3 ? ` · +${ks.length - 3} lainnya` : '') : ''; };

function pagePemantau(v) {
  let f = { rentang: '90', dari: '', sampai: '', lingkup: '', jenis: '' }, d = null, q = '', urut = { k: 'nama', dir: 1 }, mati = false;
  v.innerHTML = judul('Akademik', 'Pemantau Setoran Santri', `<button class="btn no-print" id="csv">${ico('download', 'sm')} Ekspor CSV</button><button class="btn no-print" onclick="window.print()">${ico('print', 'sm')} Cetak</button>`) + `
    <div class="card no-print" id="flt"></div><div id="kpi" class="mt"></div><div id="kls" class="mt"></div><div id="tbs" class="mt"></div>`;

  const jenjangList = () => { const o = []; Meta().kelas.forEach(k => { const j = k.split(' ')[0]; if (o.indexOf(j) < 0) o.push(j); }); return o; };
  const rentang = () => {
    const sampai = f.rentang === 'kustom' ? (f.sampai || hariIni()) : hariIni();
    const dari = f.rentang === '0' ? '2000-01-01' : f.rentang === 'kustom' ? (f.dari || mundurHari(sampai, 89)) : mundurHari(sampai, Number(f.rentang) - 1);
    return { dari, sampai };
  };
  const param = () => { const r = rentang(), p = { dari: r.dari, sampai: r.sampai, jenis: f.jenis };
    if (f.lingkup.indexOf('K:') === 0) p.kelas = f.lingkup.slice(2); else if (f.lingkup.indexOf('J:') === 0) p.jenjang = f.lingkup.slice(2); return p; };

  const drawFlt = () => {
    const names = Meta().jenisSetoran.slice(); let ada = {}; if (d) { ada = d.jenisAda; Object.keys(ada).forEach(n => { if (names.indexOf(n) < 0) names.push(n); }); }
    const totalAda = Object.keys(ada).reduce((a, k) => a + ada[k], 0), rr = rentang(), per = rr.dari === '2000-01-01' ? 'semua waktu s.d. ' + tglID(rr.sampai) : tglID(rr.dari) + ' – ' + tglID(rr.sampai);
    $('#flt').innerHTML = `<div class="row wrap">
      <label class="f"><span class="sr">Rentang waktu</span><select class="in" id="rg" aria-label="Rentang waktu">${[['30', '30 hari terakhir'], ['90', '90 hari terakhir'], ['180', '6 bulan terakhir'], ['365', '1 tahun terakhir'], ['0', 'Semua waktu'], ['kustom', 'Kustom…']].map(o => `<option value="${o[0]}" ${f.rentang === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
      ${f.rentang === 'kustom' ? `<label class="f"><span class="sr">Dari</span><input class="in" type="date" id="rd" value="${esc(f.dari || rentang().dari)}" max="${hariIni()}"></label><label class="f"><span class="sr">Sampai</span><input class="in" type="date" id="rs" value="${esc(f.sampai || hariIni())}" max="${hariIni()}"></label>` : ''}
      <label class="f"><span class="sr">Jenjang atau kelas</span><select class="in" id="lp" aria-label="Jenjang atau kelas"><option value="">Semua jenjang &amp; kelas</option>${jenjangList().map(j => `<optgroup label="${esc(j)}"><option value="J:${esc(j)}" ${f.lingkup === 'J:' + j ? 'selected' : ''}>Semua kelas ${esc(j)}</option>${Meta().kelas.filter(k => k.split(' ')[0] === j).map(k => `<option value="K:${esc(k)}" ${f.lingkup === 'K:' + k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <label class="f grow" style="min-width:180px"><span class="sr">Cari santri</span><span class="field-icon">${ico('search')}<input class="in" id="sq" placeholder="Cari nama / NIS…" value="${esc(q)}"></span></label></div>
    <div class="sub mt-s" style="font-weight:600">Jenis setoran</div>
    <div class="chips" role="group" aria-label="Filter jenis setoran">${[['', 'Semua jenis (' + totalAda + ')']].concat(names.map(n => [n, n + ' (' + (ada[n] || 0) + ')'])).map(c => `<button class="chip ${f.jenis === c[0] ? 'on' : ''}" data-j="${esc(c[0])}" aria-pressed="${f.jenis === c[0]}">${esc(c[1])}</button>`).join('')}</div>
    <div class="row between wrap mt-s"><span class="faint" style="font-size:12px">Periode ${per} · Baik = Mumtaz + Lancar · Status: aktif ≤ 7 hari, perlu perhatian 8–14 hari, tidak aktif &gt; 14 hari / belum pernah</span>${legendaKualitas()}</div>`;
  };
  const drawKpi = () => {
    const r = d.ringkas, kk = (l, ik, val, foot, cls) => `<div class="card kpi"><div class="l"><span>${l}</span><span class="ico">${ico(ik)}</span></div><div class="v ${cls || ''}">${val}</div><div class="sub">${foot}</div></div>`;
    const perlu = r.status.perhatian + r.status.tidak;
    $('#kpi').innerHTML = `<div class="grid g4">${kk('Santri sudah setor', 'task_alt', r.setor + '<small> / ' + r.santri + '</small>', persen(r.setor, r.santri) + '% pada periode ini')}
      ${kk('Total setoran', 'menu_book', r.total + '<small> setoran</small>', 'rata-rata ' + r.rata + ' per santri', 'blue')}
      ${kk('Kualitas baik', 'workspace_premium', r.persenBaik + '%', Meta().kualitas.map(k => (r.kualitas[k] || 0) + ' ' + esc(k)).join(' · '))}
      ${kk('Perlu perhatian', 'notification_important', perlu + '<small> santri</small>', r.status.tidak + ' tidak aktif · ' + r.status.perhatian + ' perlu perhatian · ' + r.muraaja + " terakhir muraaja'ah", perlu ? 'red' : '')}</div>`;
  };
  const baris = (o, sub) => `<tr class="${sub ? 'sub-row' : ''}"><td>${sub ? 'Jenjang ' : '&nbsp;&nbsp;'}${esc(o.nama)}</td><td>${o.santri}</td><td style="min-width:140px"><div class="row"><div class="bar grow"><i style="width:${persen(o.setor, o.santri)}%"></i></div><span style="font-size:12px;white-space:nowrap">${o.setor}/${o.santri} · ${persen(o.setor, o.santri)}%</span></div></td><td>${o.total}</td><td>${o.santri ? Math.round(o.total * 10 / o.santri) / 10 : 0}</td><td style="min-width:200px">${barKualitas(o.kualitas, o.total)}<div class="faint" style="font-size:11px;margin-top:3px">${persenBaik(o.kualitas, o.total)}% baik</div></td></tr>`;
  const drawKls = () => {
    const rows = []; d.jenjang.forEach(j => { rows.push(baris(j, true)); d.kelas.filter(k => k.nama.split(' ')[0] === j.nama).forEach(k => rows.push(baris(k, false))); });
    $('#kls').innerHTML = `<div class="card"><div class="row between wrap"><div><h3>Ringkasan per jenjang &amp; kelas</h3><p class="sub">Partisipasi dan kualitas setoran${f.jenis ? ' — jenis: <b>' + esc(f.jenis) + '</b>' : ' — semua jenis'}</p></div></div>
      <div class="tbl-wrap mt"><table class="t"><thead><tr><th>Jenjang / kelas</th><th>Santri</th><th>Sudah setor</th><th>Setoran</th><th>Rata-rata / santri</th><th>Sebaran kualitas</th></tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="6">${kosong('groups', 'Tidak ada santri pada filter ini.')}</td></tr>`}</tbody></table></div></div>`;
  };
  const urutan = () => {
    const key = { nama: s => s.Nama.toLowerCase(), kelas: s => s.Kelas + s.Nama.toLowerCase(), total: s => s.total, baik: s => persenBaik(s.kual, s.total), terakhir: s => s.hari == null ? 99999 : s.hari, status: s => ['aktif', 'perhatian', 'tidak'].indexOf(s.status) }[urut.k];
    const list = d.santri.filter(s => !q || (s.Nama + ' ' + s.NIS).toLowerCase().indexOf(q.toLowerCase()) > -1);
    return list.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * urut.dir || a.Nama.localeCompare(b.Nama); });
  };
  const th = (k, l) => `<th><button type="button" class="linkbtn" data-sort="${k}" aria-label="Urutkan menurut ${l}">${l}${urut.k === k ? (urut.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
  const drawTbs = () => {
    const list = urutan();
    $('#tbs').innerHTML = `<div class="card"><div class="row between wrap"><div><h3>Perkembangan per santri</h3><p class="sub">Klik nama santri untuk melihat capaian terakhir tiap jenis dan riwayat lengkap. ${list.length} santri ditampilkan.</p></div></div>
      <div class="tbl-wrap mt"><table class="t" style="min-width:860px"><thead><tr>${th('nama', 'Santri')}${th('kelas', 'Kelas')}${th('total', 'Setoran')}<th>Sebaran kualitas</th>${th('baik', '% baik')}${th('terakhir', 'Setoran terakhir')}${th('status', 'Status')}</tr></thead><tbody>${list.length ? list.map(s => `<tr><td><button type="button" class="linkbtn nm" data-nis="${esc(s.NIS)}">${esc(s.Nama)}<small>${esc(s.NIS)}</small></button></td><td>${esc(s.Kelas)}</td><td><b>${s.total}</b><div class="faint" style="font-size:11px">${ringkasJenis(s.jenis)}</div></td><td style="min-width:150px">${barKualitas(s.kual, s.total)}</td><td>${s.total ? persenBaik(s.kual, s.total) + '%' : '–'}</td><td>${s.terakhir ? `<div class="nm">${esc(s.terakhir.Capaian)}<small>${esc(s.terakhir.Jenis)} · ${tglID(s.terakhir.Tanggal)} (${hariLalu(s.hari)})</small></div>` : '<span class="faint">Belum ada setoran</span>'}</td><td><span class="badge ${STATUS_SETOR[s.status][0]}">${STATUS_SETOR[s.status][1]}</span></td></tr>`).join('') : `<tr><td colspan="7">${kosong('search_off', 'Tidak ada santri yang cocok.')}</td></tr>`}</tbody></table></div></div>`;
  };
  const muat = async () => {
    $('#kpi').innerHTML = `<div class="grid g4">${skelCards(4)}</div>`; $('#kls').innerHTML = ''; $('#tbs').innerHTML = '';
    const r = await api('hafalan.statistik', param(), { timeout: 90000 }); if (mati) return;
    if (!r.success) { $('#kpi').innerHTML = galat(r.message); return; }
    d = r.data; drawFlt(); drawKpi(); drawKls(); drawTbs();
  };
  drawFlt(); muat();

  on(v, 'change', '#rg', (e, s) => { f.rentang = s.value; if (f.rentang !== 'kustom') muat(); else drawFlt(); });
  on(v, 'change', '#rd', (e, i) => { if (i.value) { f.dari = i.value; muat(); } });
  on(v, 'change', '#rs', (e, i) => { if (i.value) { f.sampai = i.value; muat(); } });
  on(v, 'change', '#lp', (e, s) => { f.lingkup = s.value; muat(); });
  on(v, 'click', '[data-j]', (e, b) => { f.jenis = b.dataset.j; muat(); });
  on(v, 'input', '#sq', debounce((e) => { q = e.target.value; if (d) drawTbs(); }, 200));
  on(v, 'click', '[data-sort]', (e, b) => { const k = b.dataset.sort; urut = { k, dir: urut.k === k ? -urut.dir : 1 }; drawTbs(); });
  on(v, 'click', '[data-nis]', (e, b) => detailSantri(b.dataset.nis, rentang()));
  on(v, 'click', '#csv', () => { if (!d) return toast('Data belum dimuat.', 'warn'); const r = rentang(), ks = Meta().kualitas;
    unduhCSV('pemantau-setoran-' + r.dari + '_' + r.sampai + '.csv', [['NIS', 'Nama', 'Kelas', 'Jenis (filter)', 'Jumlah setoran'].concat(ks, ['% baik', 'Tanggal terakhir', 'Jenis terakhir', 'Capaian terakhir', 'Hari sejak terakhir', 'Status'])]
      .concat(urutan().map(s => [s.NIS, s.Nama, s.Kelas, f.jenis || 'Semua', s.total].concat(ks.map(k => s.kual[k] || 0), [s.total ? persenBaik(s.kual, s.total) : '', s.terakhir ? s.terakhir.Tanggal : '', s.terakhir ? s.terakhir.Jenis : '', s.terakhir ? s.terakhir.Capaian : '', s.hari == null ? '' : s.hari, STATUS_SETOR[s.status][1]])))); });
  on(v, 'click', '[data-act=muat-ulang]', muat);
  return () => { mati = true; };
}

/* ---------- Rincian satu santri: acuan perkembangan ---------- */
async function detailSantri(nis) {
  const r = await api('hafalan.statistikSantri', { nis }, { timeout: 90000 });
  if (!r.success) return toast(r.message, 'error');
  const x = r.data, s = x.santri, maks = Math.max(1, ...x.bulanan.map(b => b.total)), semuaJenis = x.perJenis.map(p => p.jenis);
  const riwayat = jenis => { const list = x.riwayat.filter(h => !jenis || h.Jenis === jenis); return list.length ? list.map(h => `<tr><td>${tglID(h.Tanggal)}</td><td>${esc(h.Jenis)}</td><td><b>${esc(h.Capaian)}</b></td><td><span class="badge ${h.Kualitas === "Muraaja'ah" ? 'warn' : 'ok'}">${esc(h.Kualitas)}</span></td><td>${esc(h.Catatan)}</td></tr>`).join('') : `<tr><td colspan="5">${kosong('menu_book', 'Belum ada setoran.')}</td></tr>`; };
  modal({ title: 'Perkembangan setoran', wide: true, noFocus: true, body: `
    <div class="row wrap">${av(s.Nama, 'lg')}<div class="grow"><h2>${esc(s.Nama)}</h2><p class="sub">NIS ${esc(s.NIS)} · ${esc(s.Kelas)}${s.Musyrif ? ' · Musyrif: ' + esc(s.Musyrif) : ''}</p></div><span class="badge ${STATUS_SETOR[statusDari(x.hari)][0]}">${STATUS_SETOR[statusDari(x.hari)][1]}</span></div>
    <div class="grid g4 mt">${[['Total setoran', x.total, ''], ['Setoran terakhir', hariLalu(x.hari), ''], ['Kualitas baik', persenBaik(x.kualitas, x.total) + '%', 'blue'], ["Muraaja'ah", x.kualitas["Muraaja'ah"] || 0, x.kualitas["Muraaja'ah"] ? 'red' : '']].map(k => `<div class="card flat kpi"><div class="l">${k[0]}</div><div class="v ${k[2]}" style="font-size:24px;line-height:30px">${k[1]}</div></div>`).join('')}</div>
    <h3 class="mt">Capaian terakhir per jenis</h3><div class="tbl-wrap mt-s"><table class="t" style="min-width:560px"><thead><tr><th>Jenis</th><th>Jumlah</th><th>Sejak</th><th>Capaian terakhir</th><th>Kualitas</th></tr></thead><tbody>${x.perJenis.length ? x.perJenis.map(p => `<tr><td>${esc(p.jenis)}</td><td><b>${p.total}</b></td><td>${tglID(p.pertama)}</td><td><div class="nm">${esc(p.terakhir.Capaian)}<small>${tglID(p.terakhir.Tanggal)}</small></div></td><td><span class="badge ${p.terakhir.Kualitas === "Muraaja'ah" ? 'warn' : 'ok'}">${esc(p.terakhir.Kualitas)}</span></td></tr>`).join('') : `<tr><td colspan="5">${kosong('menu_book', 'Belum ada setoran.')}</td></tr>`}</tbody></table></div>
    <h3 class="mt">Aktivitas 6 bulan terakhir</h3><div class="mini-bars mt-s">${x.bulanan.map(b => `<div class="mb-c"><div class="mb-bar" title="${b.total} setoran, ${b.baik} baik"><i style="height:${b.total * 100 / maks}%"><b style="height:${b.total ? b.baik * 100 / b.total : 0}%"></b></i></div><span class="mb-n">${b.total}</span><span class="faint">${BLN[+b.bulan.slice(5) - 1]}</span></div>`).join('')}</div><p class="faint" style="font-size:12px">Tinggi batang = jumlah setoran; bagian gelap = yang berkualitas baik (Mumtaz + Lancar).</p>
    <div class="row between wrap mt"><h3>Riwayat (100 terbaru)</h3><label class="f" style="min-width:180px"><span class="sr">Filter jenis</span><select class="in sm" id="rj"><option value="">Semua jenis</option>${semuaJenis.map(j => `<option>${esc(j)}</option>`).join('')}</select></label></div>
    <div class="tbl-wrap mt-s"><table class="t" style="min-width:560px"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Capaian</th><th>Kualitas</th><th>Catatan</th></tr></thead><tbody id="rb">${riwayat('')}</tbody></table></div>`,
    onOpen: bg => { $('#rj', bg).onchange = e => { $('#rb', bg).innerHTML = riwayat(e.target.value); }; }, actions: [{ label: 'Tutup', cls: 'primary' }] });
}
const statusDari = h => h == null || h > 14 ? 'tidak' : h > 7 ? 'perhatian' : 'aktif';
