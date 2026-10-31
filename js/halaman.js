/* =====================================================================
   halaman.js — Editor Halaman Depan: tambah/kurangi/urutkan bagian, ubah teks & gambar, pratinjau, terbitkan
   Formulir dibangun dari spesifikasi (FORM) agar semua jenis bagian memakai mesin yang sama.
   Server tetap memvalidasi ulang semuanya (tipe, panjang, tautan, URL gambar).
   ===================================================================== */
'use strict';

const ICONS = ['groups', 'school', 'domain', 'menu_book', 'auto_stories', 'book_2', 'qr_code_2', 'chat', 'receipt_long', 'verified', 'workspace_premium', 'mosque', 'volunteer_activism', 'event', 'campaign', 'schedule', 'location_on', 'call', 'mail', 'star', 'favorite', 'diversity_3', 'child_care', 'family_restroom', 'psychology', 'record_voice_over', 'headphones', 'edit_note', 'cast_for_education', 'history_edu', 'handshake', 'payments', 'lock', 'shield', 'thumb_up', 'lightbulb', 'public', 'language', 'translate', 'emoji_events', 'trending_up', 'check_circle', 'support_agent', 'photo_camera', 'play_circle', 'celebration', 'eco', 'wb_sunny', 'restaurant', 'directions_bus', 'wifi', 'sports_soccer'];
const BLOK_META = {
  hero: { n: 'Hero (banner utama)', i: 'campaign', d: 'Judul besar, tombol, gambar, dan poin singkat di bagian paling atas.' },
  statistik: { n: 'Angka / statistik', i: 'monitoring', d: 'Deretan angka penting. Tulis {santri}, {asatidz}, {kelas} agar terisi otomatis.' },
  fitur: { n: 'Kartu program / keunggulan', i: 'view_cozy', d: 'Kumpulan kartu berikon: program, fasilitas, atau keunggulan.' },
  teks: { n: 'Teks (tentang / sambutan)', i: 'article', d: 'Judul dan paragraf, boleh dengan gambar di samping.' },
  galeri: { n: 'Galeri foto', i: 'photo_library', d: 'Kumpulan foto kegiatan madrasah, bisa diperbesar.' },
  video: { n: 'Video YouTube', i: 'smart_display', d: 'Sematkan video profil atau kegiatan dari YouTube.' },
  agenda: { n: 'Agenda & pengumuman', i: 'event', d: 'Otomatis dari menu Berita & Agenda.' },
  faq: { n: 'Pertanyaan umum (FAQ)', i: 'help', d: 'Tanya-jawab yang bisa dibuka-tutup.' },
  cta: { n: 'Ajakan bertindak (CTA)', i: 'ads_click', d: 'Panel hijau berisi ajakan dan dua tombol, mis. pendaftaran santri baru.' }
};
const T = (k, l, max, o) => Object.assign({ k, l, t: 'text', max: max || 120 }, o || {});
const A = (k, l, max, rows, o) => Object.assign({ k, l, t: 'area', max: max || 400, rows: rows || 3, full: 1 }, o || {});
const BT = (k, l) => ({ k, l, t: 'btn' });
const KICKER = [T('kicker', 'Label kecil di atas judul', 50), T('judul', 'Judul', 120)];
const FORM = {
  hero: [T('lencana', 'Lencana kecil (di atas judul)', 80, { full: 1 }), A('judul', 'Judul utama', 160, 2), A('deskripsi', 'Deskripsi', 400, 3), BT('btn1', 'Tombol utama'), BT('btn2', 'Tombol kedua'), { k: 'gambar', l: 'Gambar (rasio 4:3, mis. 1600×1200 px)', t: 'img', full: 1 }, { k: 'poin', l: 'Poin singkat (satu baris satu poin, maks 4)', t: 'lines', max: 4, full: 1 }, { k: 'tampilJam', l: 'Tampilkan jam belajar di atas gambar', t: 'bool', full: 1 }],
  statistik: [{ k: 'items', l: 'Angka', t: 'list', max: 6, add: 'Tambah angka', full: 1, item: [{ k: 'ikon', l: 'Ikon', t: 'ikon' }, T('angka', 'Angka', 20, { h: 'Boleh {santri}, {asatidz}, {kelas}' }), T('label', 'Keterangan', 40)] }],
  fitur: KICKER.concat([A('deskripsi', 'Deskripsi pembuka (opsional)', 300, 2), { k: 'kolom', l: 'Jumlah kolom', t: 'select', o: [['3', '3 kolom'], ['2', '2 kolom'], ['4', '4 kolom']] }, { k: 'items', l: 'Kartu', t: 'list', max: 12, add: 'Tambah kartu', full: 1, item: [{ k: 'ikon', l: 'Ikon', t: 'ikon' }, T('judul', 'Judul kartu', 80), A('teks', 'Teks (opsional)', 300, 2), { k: 'poin', l: 'Poin-poin (satu baris satu poin)', t: 'lines', max: 6, full: 1 }] }]),
  teks: KICKER.concat([A('isi', 'Isi teks', 3000, 8, { h: 'Baris kosong = paragraf baru · awali baris dengan "- " untuk poin · **tebal**' }), { k: 'gambar', l: 'Gambar di samping (opsional)', t: 'img', full: 1 }, { k: 'posisi', l: 'Posisi gambar', t: 'select', o: [['kanan', 'Kanan'], ['kiri', 'Kiri']] }, BT('btn1', 'Tombol (opsional)')]),
  galeri: KICKER.concat([{ k: 'items', l: 'Foto', t: 'list', max: 12, add: 'Tambah foto', full: 1, item: [{ k: 'gambar', l: 'Foto', t: 'img', full: 1 }, T('ket', 'Keterangan foto', 100, { full: 1 })] }]),
  video: KICKER.concat([A('deskripsi', 'Deskripsi (opsional)', 300, 2), T('url', 'Tautan video YouTube', 200, { full: 1, h: 'Tempel alamat video, mis. https://youtu.be/xxxxxxxxxxx', ph: 'https://youtu.be/…' })]),
  agenda: KICKER.concat([{ k: 'jumlah', l: 'Jumlah pengumuman ditampilkan', t: 'select', o: [['3', '3'], ['6', '6'], ['9', '9']] }]),
  faq: KICKER.concat([{ k: 'items', l: 'Pertanyaan', t: 'list', max: 15, add: 'Tambah pertanyaan', full: 1, item: [T('tanya', 'Pertanyaan', 160, { full: 1 }), A('jawab', 'Jawaban', 800, 3)] }]),
  cta: [A('judul', 'Judul', 120, 2), A('teks', 'Teks pendukung', 300, 2), BT('btn1', 'Tombol 1'), BT('btn2', 'Tombol 2')]
};
const BARU = {
  hero: { lencana: '', judul: 'Judul utama halaman', deskripsi: '', btn1: { label: 'Masuk Portal', tautan: '#/login' }, btn2: { label: '', tautan: '' }, gambar: '', poin: [], tampilJam: true },
  statistik: { items: [{ ikon: 'groups', angka: '{santri}', label: 'Santri aktif' }, { ikon: 'school', angka: '{asatidz}', label: 'Asatidz' }] },
  fitur: { kicker: 'Label', judul: 'Judul bagian', deskripsi: '', kolom: '3', items: [{ ikon: 'star', judul: 'Judul kartu', teks: 'Penjelasan singkat.', poin: [] }] },
  teks: { kicker: 'Tentang kami', judul: 'Sambutan pengasuh', isi: 'Tulis isi di sini.', gambar: '', posisi: 'kanan', btn1: { label: '', tautan: '' } },
  galeri: { kicker: 'Dokumentasi', judul: 'Galeri Kegiatan', items: [] },
  video: { kicker: 'Video', judul: 'Profil Madrasah', deskripsi: '', url: '' },
  agenda: { kicker: 'Informasi terkini', judul: 'Agenda & Pengumuman', jumlah: '3' },
  faq: { kicker: 'FAQ', judul: 'Pertanyaan yang Sering Diajukan', items: [{ tanya: 'Pertanyaan pertama?', jawab: 'Jawaban.' }] },
  cta: { judul: 'Ajakan untuk Anda', teks: '', btn1: { label: 'Hubungi Kami', tautan: 'wa' }, btn2: { label: '', tautan: '' } }
};

/* ---------- Mesin formulir ---------- */
const getP = (o, path) => path.split('.').reduce((c, p) => (c == null ? c : c[p]), o);
function setP(o, parts, v) { let c = o; parts.forEach((p, i) => { if (i === parts.length - 1) { c[p] = v; return; } if (c[p] == null) c[p] = /^\d+$/.test(parts[i + 1]) ? [] : {}; c = c[p]; }); }
function bacaForm(root) {
  const o = {};
  $$('[data-p]', root).forEach(el => { const parts = el.dataset.p.split('.'); let v;
    if (el.type === 'checkbox') v = el.checked; else if (el.dataset.lines) v = el.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, Number(el.dataset.lines) || 99); else v = el.value;
    setP(o, parts, v); });
  return o;
}
const ikonOpts = sel => `<option value="">(tanpa ikon)</option>` + ICONS.map(i => `<option ${i === sel ? 'selected' : ''}>${i}</option>`).join('');
function fieldHtml(f, v, path) {
  const full = f.full ? 'full' : '', hint = f.h ? `<span class="hint">${esc(f.h)}</span>` : '';
  switch (f.t) {
    case 'text': return `<label class="f ${full}">${esc(f.l)}${hint}<input class="in" data-p="${path}" value="${esc(v)}" maxlength="${f.max}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}></label>`;
    case 'area': return `<label class="f ${full}">${esc(f.l)}${hint}<textarea class="in" data-p="${path}" rows="${f.rows}" maxlength="${f.max}">${esc(v)}</textarea></label>`;
    case 'select': return `<label class="f ${full}">${esc(f.l)}<select class="in" data-p="${path}">${f.o.map(o => `<option value="${o[0]}" ${String(v) === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
    case 'bool': return `<label class="chk ${full}"><input type="checkbox" data-p="${path}" ${v ? 'checked' : ''}><span>${esc(f.l)}</span></label>`;
    case 'ikon': return `<label class="f ${full}">${esc(f.l)}<select class="in" data-p="${path}">${ikonOpts(v)}</select></label>`;
    case 'lines': return `<label class="f ${full}">${esc(f.l)}<textarea class="in" data-p="${path}" data-lines="${f.max}" rows="3">${esc((Array.isArray(v) ? v : []).join('\n'))}</textarea></label>`;
    case 'btn': { const b = v || {}; return `<div class="f ${full}"><span>${esc(f.l)}</span><div class="form-grid"><input class="in" data-p="${path}.label" value="${esc(b.label)}" maxlength="40" placeholder="Teks tombol" aria-label="${esc(f.l)} — teks"><input class="in" data-p="${path}.tautan" value="${esc(b.tautan)}" list="dl-link" maxlength="300" placeholder="Tautan tujuan" aria-label="${esc(f.l)} — tautan"></div></div>`; }
    case 'img': return `<div class="f ${full} imgf"><span>${esc(f.l)}</span><div class="row wrap top"><div class="art-prev" style="width:150px;flex:none">${v ? `<img alt="" referrerpolicy="no-referrer" src="${esc(v)}">` : 'Belum ada'}</div><div class="col grow" style="min-width:180px"><input class="in sm" type="file" accept="image/jpeg,image/png,image/webp" data-imgfile><button type="button" class="btn sm danger" data-imgclear>Hapus gambar</button><span class="faint" style="font-size:12px">JPG/PNG/WEBP, maks 2,5 MB. Gambar bersifat publik.</span></div></div><input type="hidden" data-p="${path}" value="${esc(v)}"></div>`;
    case 'list': { const arr = Array.isArray(v) ? v : [];
      return `<div class="f full"><span>${esc(f.l)} <span class="faint">(${arr.length}/${f.max})</span></span>${arr.map((it, i) => `<div class="inset rep-i"><div class="row between"><b>${i + 1}</b><span class="row"><button type="button" class="btn sm icon" data-mv="${path}" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">${ico('arrow_upward', 'sm')}</button><button type="button" class="btn sm icon" data-mv="${path}" data-i="${i}" data-d="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Turunkan">${ico('arrow_downward', 'sm')}</button><button type="button" class="btn sm icon danger" data-rm="${path}" data-i="${i}" aria-label="Hapus item">${ico('delete', 'sm')}</button></span></div><div class="form-grid mt-s">${f.item.map(s => fieldHtml(s, (it || {})[s.k], path + '.' + i + '.' + s.k)).join('')}</div></div>`).join('')}
        <button type="button" class="btn sm mt-s" data-add="${path}" data-max="${f.max}" ${arr.length >= f.max ? 'disabled' : ''}>${ico('add', 'sm')} ${esc(f.add || 'Tambah')}</button></div>`; }
  }
  return '';
}
const bangunForm = (spec, data) => `<div class="form-grid">${spec.map(f => fieldHtml(f, (data || {})[f.k], f.k)).join('')}${fieldHtml(T('menu', 'Teks di menu navigasi (kosongkan jika tidak ingin muncul di menu)', 30, { full: 1 }), (data || {}).menu, 'menu')}</div>`;
function itemBaru(f) { const o = {}; f.item.forEach(s => { o[s.k] = s.t === 'ikon' ? 'star' : s.t === 'lines' ? [] : s.t === 'btn' ? { label: '', tautan: '' } : ''; }); return o; }
function specCari(spec, path) { const parts = path.split('.').filter(p => !/^\d+$/.test(p)); let list = spec, f = null; parts.forEach(p => { f = list.find(x => x.k === p); list = f && f.item ? f.item : []; }); return f; }
function aktifkanForm(box, spec) {
  const render = st => { box.innerHTML = bangunForm(spec, st); };
  const ubah = (path, fn) => { const st = bacaForm(box); const arr = (getP(st, path) || []).slice(); fn(arr); setP(st, path.split('.'), arr); render(st); };
  on(box, 'click', '[data-add]', (e, b) => { const f = specCari(spec, b.dataset.add); ubah(b.dataset.add, a => { if (a.length < Number(b.dataset.max)) a.push(itemBaru(f)); }); });
  on(box, 'click', '[data-rm]', (e, b) => ubah(b.dataset.rm, a => a.splice(+b.dataset.i, 1)));
  on(box, 'click', '[data-mv]', (e, b) => ubah(b.dataset.mv, a => { const i = +b.dataset.i, j = i + Number(b.dataset.d); if (j >= 0 && j < a.length) { const t = a[i]; a[i] = a[j]; a[j] = t; } }));
  on(box, 'click', '[data-imgclear]', (e, b) => { const w = b.closest('.imgf'); $('[data-p]', w).value = ''; $('.art-prev', w).textContent = 'Belum ada'; });
  on(box, 'change', '[data-imgfile]', async (e, inp) => {
    const f = inp.files[0]; if (!f) return; const w = inp.closest('.imgf'), prev = $('.art-prev', w); prev.innerHTML = '<span class="spin" style="width:20px;height:20px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:spin .7s linear infinite"></span>';
    try { const bk = await siapkanBerkas(f, 2.4); if (bk.mime === 'application/pdf') throw new Error('Gunakan gambar JPG/PNG/WEBP.'); const r = await api('media.unggah', { mime: bk.mime, base64: bk.base64 }, { timeout: 90000 });
      if (!r.success) throw new Error(r.message); $('[data-p]', w).value = r.data.url; prev.innerHTML = `<img alt="" referrerpolicy="no-referrer" src="${esc(r.data.url)}&t=${Date.now()}">`; toast('Gambar diunggah.'); }
    catch (err) { prev.textContent = 'Gagal'; toast(err.message, 'error'); } inp.value = ''; });
}

/* ---------- Halaman editor ---------- */
function pageHalaman(v) {
  let blok = [], ctx = null, dirty = false, bawaan = false, prev = false, mati = false;
  const ringkas = b => { const d = b.data; return d.judul || d.lencana || (d.items && d.items[0] && (d.items[0].judul || d.items[0].tanya || d.items[0].label)) || BLOK_META[b.tipe].n; };
  const idBaru = () => 'n' + Math.random().toString(36).slice(2, 9);
  window.onbeforeunload = () => dirty ? 'Perubahan belum diterbitkan.' : undefined;
  const aksiHead = () => `<button class="btn" id="add">${ico('add_box', 'sm')} Tambah bagian</button><button class="btn ${prev ? 'on' : ''}" id="prv">${ico('visibility', 'sm')} Pratinjau</button><a class="btn" href="#/" target="_blank" rel="noopener">${ico('open_in_new', 'sm')} Lihat situs</a><button class="btn danger" id="rst">${ico('restart_alt', 'sm')} Pulihkan bawaan</button>`;
  const draw = () => {
    if (mati) return;
    const sc = { s: ctx.setting, st: ctx.statistik, berita: ctx.berita };
    v.innerHTML = judul('Administrasi', 'Editor Halaman Depan', aksiHead()) + `
    ${bawaan ? `<div class="notice info mb">${ico('info')}<span>Anda masih memakai <b>susunan bawaan</b>. Ubah apa saja lalu tekan <b>Simpan &amp; terbitkan</b> — sebelum itu pengunjung tetap melihat susunan ini.</span></div>` : ''}
    <div class="card"><div class="row between wrap"><div><h3>Susunan halaman (${blok.length} bagian)</h3><p class="sub">Urutan di sini = urutan di halaman depan. Nama madrasah, alamat, kontak, dan jam belajar diatur di menu Pengaturan.</p></div></div>
    <div class="col mt">${blok.map((b, i) => `<div class="inset blk-row ${b.tampil ? '' : 'off'}" style="padding:12px" data-i="${i}"><span class="tipe">${ico(BLOK_META[b.tipe].i)}</span><div class="nm" style="min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ringkas(b))}</span><small>${esc(BLOK_META[b.tipe].n)}${b.data.menu ? ' · menu: ' + esc(b.data.menu) : ''}${b.tampil ? '' : ' · <b>disembunyikan</b>'}</small></div>
      <div class="tools"><button class="btn sm icon" data-a="up" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">${ico('arrow_upward', 'sm')}</button><button class="btn sm icon" data-a="down" ${i === blok.length - 1 ? 'disabled' : ''} aria-label="Turunkan">${ico('arrow_downward', 'sm')}</button><button class="btn sm icon" data-a="vis" aria-label="${b.tampil ? 'Sembunyikan' : 'Tampilkan'}">${ico(b.tampil ? 'visibility' : 'visibility_off', 'sm')}</button><button class="btn sm" data-a="edit">${ico('edit', 'sm')} Ubah</button><button class="btn sm icon danger" data-a="del" aria-label="Hapus bagian">${ico('delete', 'sm')}</button></div></div>`).join('')}</div></div>
    ${prev ? `<div class="card mt"><h3>Pratinjau</h3><p class="sub">Tampilan sebagai pengunjung (bagian yang disembunyikan tidak tampil).</p><div class="prev-wrap mt">${htmlLanding(blok, sc)}</div></div>` : ''}
    <div class="sticky-save mt" ${dirty ? '' : 'style="background:var(--canvas)"'}><span>${dirty ? `${ico('edit_note', 'sm')} <b>Ada perubahan yang belum diterbitkan.</b>` : 'Semua perubahan sudah diterbitkan.'}</span><button class="btn primary" id="save" ${dirty ? '' : 'disabled'}>${ico('publish', 'sm')} Simpan &amp; terbitkan</button></div>`;
  };
  const muat = async () => { v.innerHTML = judul('Administrasi', 'Editor Halaman Depan', '') + skelCards(2); const r = await api('halaman.get'); if (mati) return; if (!r.success) { v.innerHTML = judul('Administrasi', 'Editor Halaman Depan', '') + galat(r.message); return; } ctx = r.data; blok = r.data.blok; bawaan = r.data.bawaan; dirty = false; draw(); };
  const linkList = () => `<datalist id="dl-link"><option value="#/login">Halaman login portal</option><option value="wa">WhatsApp PPDB (dari Pengaturan)</option>${blok.map(b => `<option value="#b-${esc(b.id)}">Gulir ke: ${esc(ringkas(b))}</option>`).join('')}</datalist>`;
  const edit = (i, baru) => {
    const b = blok[i], spec = FORM[b.tipe]; let disimpan = false;
    modal({ title: (baru ? 'Bagian baru: ' : 'Ubah: ') + BLOK_META[b.tipe].n, wide: true, noFocus: true, body: linkList() + '<div id="fb"></div>',
      onOpen: bg => { const box = $('#fb', bg); box.innerHTML = bangunForm(spec, b.data); aktifkanForm(box, spec); },
      onClose: () => { if (!disimpan && baru) { blok.splice(i, 1); dirty = true; draw(); } },
      actions: [{ label: 'Batal' }, { label: 'Selesai', cls: 'primary', onClick: bg => { const st = bacaForm($('#fb', bg)), nd = { menu: st.menu || '' }; spec.forEach(f => { nd[f.k] = st[f.k] !== undefined ? st[f.k] : (f.t === 'list' || f.t === 'lines' ? [] : f.t === 'bool' ? false : f.t === 'btn' ? { label: '', tautan: '' } : ''); }); b.data = nd; disimpan = true; dirty = true; draw(); } }] });
  };
  on(v, 'click', '#add', () => modal({ title: 'Tambah bagian', wide: true, noFocus: true, body: `<div class="pick">${Object.keys(BLOK_META).map(k => `<button type="button" data-tipe="${k}"><span class="ms lg" style="color:var(--primary)">${BLOK_META[k].i}</span><span><b>${BLOK_META[k].n}</b><small>${BLOK_META[k].d}</small></span></button>`).join('')}</div>`,
    onOpen: bg => { on(bg, 'click', '[data-tipe]', (e, btn) => { const k = btn.dataset.tipe; $('[data-x]', bg).click(); blok.push({ id: idBaru(), tipe: k, tampil: true, data: JSON.parse(JSON.stringify(Object.assign({ menu: '' }, BARU[k]))) }); dirty = true; draw(); edit(blok.length - 1, true); }); } }));
  on(v, 'click', '#prv', () => { prev = !prev; draw(); });
  on(v, 'click', '[data-a]', async (e, b) => {
    const i = +b.closest('[data-i]').dataset.i, a = b.dataset.a;
    if (a === 'up' || a === 'down') { const j = a === 'up' ? i - 1 : i + 1; if (j >= 0 && j < blok.length) { const t = blok[i]; blok[i] = blok[j]; blok[j] = t; dirty = true; draw(); } }
    else if (a === 'vis') { blok[i].tampil = !blok[i].tampil; dirty = true; draw(); }
    else if (a === 'edit') edit(i, false);
    else if (a === 'del') { if (await konfirmasi(`Hapus bagian <b>${esc(ringkas(blok[i]))}</b>? Perubahan baru berlaku setelah Anda menerbitkan.`, 'Hapus', true)) { blok.splice(i, 1); dirty = true; draw(); } }
  });
  on(v, 'click', '#save', async (e, b) => { await tombolSibuk(b, async () => {
    const r = await api('halaman.save', { blok: blok.map(x => ({ id: x.id, tipe: x.tipe, tampil: x.tampil, data: x.data })) }, { timeout: 60000 });
    toast(r.message, r.success ? '' : 'error'); if (r.success) { Api.epoch++; Object.keys(localStorage).filter(k => k.indexOf('mdt.c.') === 0 && k.indexOf('publik.landing') > -1).forEach(k => localStorage.removeItem(k)); await muat(); } }); });
  on(v, 'click', '#rst', async () => { if (await konfirmasi('Kembalikan halaman depan ke <b>susunan bawaan</b>? Semua bagian buatan Anda akan hilang.', 'Pulihkan bawaan', true)) { const r = await api('halaman.reset'); toast(r.message, r.success ? '' : 'error'); if (r.success) { Api.epoch++; muat(); } } });
  on(v, 'click', '[data-act=muat-ulang]', muat);
  muat();
  return () => { mati = true; window.onbeforeunload = null; };
}
