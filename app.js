// ============================================
// KONFIGURASI & STATE APLIKASI
// ============================================
// ⚠️ GANTI DENGAN URL WEB APP /exec ANDA!
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwe-PLACEHOLDER-EXEC-URL/exec';

let currentUser = null;
let appData = {
  lembaga: {},
  spp_nominal: 0,
  halaqah: [],
  santri: [],
  kitab: [],
  users: [],
  kehadiran: [],
  hanca: [],
  spp_transaksi: []
};

let currentPresensi = {}; // Temp store untuk presensi hari ini

// ============================================
// FETCH HELPERS
// ============================================

async function fetchData(action = 'getInitialData', params = '') {
  try {
    showLoading(true);
    const res = await fetch(`${GAS_URL}?action=${action}${params}`);
    const json = await res.json();
    showLoading(false);
    if (!json.success) throw new Error(json.message);
    return json.data;
  } catch (err) {
    showLoading(false);
    showNotif('Gagal memuat data: ' + err.message, 'error');
    return null;
  }
}

async function postData(action, payload) {
  try {
    showLoading(true);
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Menghindari CORS preflight
      body: JSON.stringify({ action, data: payload })
    });
    const json = await res.json();
    showLoading(false);
    return json;
  } catch (err) {
    showLoading(false);
    showNotif('Gagal terhubung ke server: ' + err.message, 'error');
    return { success: false };
  }
}

// ============================================
// AUTHENTICATION & SESSION
// ============================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const result = await postData('login', { username, password });
  if (result.success) {
    currentUser = result.user;
    localStorage.setItem('diniyah_user', JSON.stringify(currentUser));
    initApp();
  } else {
    showNotif(result.message || 'Login gagal', 'error');
  }
});

function handleLogout() {
  localStorage.removeItem('diniyah_user');
  currentUser = null;
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  showNotif('Anda telah keluar.');
}

// ============================================
// INITIALIZATION & UI BINDING
// ============================================

async function initApp() {
  const savedUser = localStorage.getItem('diniyah_user');
  if (savedUser) currentUser = JSON.parse(savedUser);

  if (!currentUser) {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-wrapper').style.display = 'none';
    return;
  }

  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app-wrapper').style.display = 'flex';

  // Load All Master Data
  const data = await fetchData('getInitialData');
  if (data) {
    appData = data;
    renderHeaderAndRoleAccess();
    populateSelects();
    renderTables();
  }
}

function renderHeaderAndRoleAccess() {
  document.getElementById('header-title').textContent = appData.lembaga.nama || 'Madrasah Diniyah';
  document.getElementById('header-logo').src = appData.lembaga.logo || '';
  document.getElementById('user-badge').textContent = currentUser.role.toUpperCase();

  // Hide admin elements if user is not admin
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    el.style.display = (currentUser.role === 'admin') ? '' : 'none';
  });

  // Role Wali Santri View Constraint
  if (currentUser.role === 'wali') {
    // Directly focus on Laporan and filter for their child
    const navItems = document.querySelectorAll('.nav-item');
    switchTab('tab-laporan', navItems[3]);
    if (currentUser.related_id) {
      document.getElementById('laporan-santri').value = currentUser.related_id;
      document.getElementById('laporan-santri').disabled = true;
      renderLaporanSantri();
    }
  }
}

function populateSelects() {
  // Populate Halaqah Selects
  const hlqSelects = ['hanca-halaqah', 'kehadiran-halaqah', 'str-halaqah'];
  hlqSelects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Pilih Halaqah --</option>';
    appData.halaqah.forEach(h => {
      sel.innerHTML += `<option value="${h.id}">${h.nama_halaqah}</option>`;
    });
  });

  // Populate Kitab Select
  const ktbSel = document.getElementById('hanca-kitab');
  if (ktbSel) {
    ktbSel.innerHTML = '<option value="">-- Pilih Kitab --</option>';
    appData.kitab.forEach(k => {
      ktbSel.innerHTML += `<option value="${k.id}">${k.nama_kitab} (${k.target_hanca})</option>`;
    });
  }

  // Populate Santri Selects
  const strSelects = ['spp-santri', 'laporan-santri', 'usr-santri'];
  strSelects.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Pilih Santri --</option>';
    appData.santri.forEach(s => {
      sel.innerHTML += `<option value="${s.id}">${s.nama_santri}</option>`;
    });
  });

  // Default Presensi Date
  document.getElementById('kehadiran-tanggal').value = new Date().toISOString().split('T')[0];
}

function filterSantriByHalaqah(hlqSelectId, santriSelectId) {
  const hlqId = document.getElementById(hlqSelectId).value;
  const santriSel = document.getElementById(santriSelectId);
  santriSel.innerHTML = '<option value="">-- Pilih Santri --</option>';

  const filtered = appData.santri.filter(s => String(s.id_halaqah) === String(hlqId));
  filtered.forEach(s => {
    santriSel.innerHTML += `<option value="${s.id}">${s.nama_santri}</option>`;
  });
}

// ============================================
// HANCA HANDLER
// ============================================

document.getElementById('form-hanca').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_halaqah: document.getElementById('hanca-halaqah').value,
    id_santri: document.getElementById('hanca-santri').value,
    id_kitab: document.getElementById('hanca-kitab').value,
    pencapaian: document.getElementById('hanca-pencapaian').value,
    catatan: document.getElementById('hanca-catatan').value
  };

  const res = await postData('saveHanca', payload);
  if (res.success) {
    showNotif(res.message);
    e.target.reset();
    await initApp(); // Refresh data
  } else {
    showNotif(res.message, 'error');
  }
});

// ============================================
// KEHADIRAN HANDLER
// ============================================

function renderPresensiList() {
  const hlqId = document.getElementById('kehadiran-halaqah').value;
  const container = document.getElementById('presensi-container');
  const saveBtn = document.getElementById('btn-save-kehadiran');

  if (!hlqId) {
    container.innerHTML = '<p class="text-muted text-center">Silakan pilih Halaqah terlebih dahulu.</p>';
    saveBtn.style.display = 'none';
    return;
  }

  const santriList = appData.santri.filter(s => String(s.id_halaqah) === String(hlqId));
  if (santriList.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Tidak ada santri di halaqah ini.</p>';
    saveBtn.style.display = 'none';
    return;
  }

  currentPresensi = {};
  container.innerHTML = santriList.map(s => {
    currentPresensi[s.id] = 'Hadir'; // Default status Hadir
    return `
      <div class="presensi-item">
        <span>${s.nama_santri}</span>
        <div class="status-options">
          <button type="button" class="status-btn selected-Hadir" id="btn-hd-${s.id}" onclick="setPresensiStatus('${s.id}', 'Hadir')">H</button>
          <button type="button" class="status-btn" id="btn-sk-${s.id}" onclick="setPresensiStatus('${s.id}', 'Sakit')">S</button>
          <button type="button" class="status-btn" id="btn-iz-${s.id}" onclick="setPresensiStatus('${s.id}', 'Izin')">I</button>
          <button type="button" class="status-btn" id="btn-al-${s.id}" onclick="setPresensiStatus('${s.id}', 'Alpa')">A</button>
        </div>
      </div>
    `;
  }).join('');

  saveBtn.style.display = 'block';
}

function setPresensiStatus(santriId, status) {
  currentPresensi[santriId] = status;
  const statuses = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
  const prefixMap = { Hadir: 'hd', Sakit: 'sk', Izin: 'iz', Alpa: 'al' };

  statuses.forEach(st => {
    const btn = document.getElementById(`btn-${prefixMap[st]}-${santriId}`);
    if (st === status) {
      btn.className = `status-btn selected-${st}`;
    } else {
      btn.className = 'status-btn';
    }
  });
}

async function submitKehadiran() {
  const tanggal = document.getElementById('kehadiran-tanggal').value;
  const hlqId = document.getElementById('kehadiran-halaqah').value;

  const payloadList = Object.keys(currentPresensi).map(santriId => ({
    tanggal,
    id_halaqah: hlqId,
    id_santri: santriId,
    status: currentPresensi[santriId]
  }));

  const res = await postData('saveKehadiran', payloadList);
  if (res.success) {
    showNotif(res.message);
    await initApp();
  } else {
    showNotif(res.message, 'error');
  }
}

// ============================================
// SPP HANDLER
// ============================================

document.getElementById('form-spp-bayar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_santri: document.getElementById('spp-santri').value,
    bulan: document.getElementById('spp-bulan').value,
    tahun: document.getElementById('spp-tahun').value,
    jumlah_bayar: document.getElementById('spp-jumlah').value
  };

  const res = await postData('saveSppBayar', payload);
  if (res.success) {
    showNotif(res.message);
    e.target.reset();
    await initApp();
  } else {
    showNotif(res.message, 'error');
  }
});

async function promptUpdateSpp() {
  const newNominal = prompt('Masukkan Nominal SPP Bulanan Baru (Rp):', appData.spp_nominal);
  if (newNominal) {
    const res = await postData('saveSppSetup', { nominal: Number(newNominal) });
    if (res.success) {
      showNotif(res.message);
      await initApp();
    }
  }
}

// ============================================
// LAPORAN & PRINT PDF HANDLER
// ============================================

function renderLaporanSantri() {
  const santriId = document.getElementById('laporan-santri').value;
  const container = document.getElementById('laporan-detail-container');

  if (!santriId) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  // Calculate Kehadiran %
  const listKehadiran = appData.kehadiran.filter(k => String(k.id_santri) === String(santriId));
  const totalKehadiran = listKehadiran.length;
  const totalHadir = listKehadiran.filter(k => k.status === 'Hadir').length;
  const pct = totalKehadiran > 0 ? Math.round((totalHadir / totalKehadiran) * 100) : 0;

  document.getElementById('stat-hadir-pct').textContent = pct + '%';

  // Calculate Hanca Count
  const listHanca = appData.hanca.filter(h => String(h.id_santri) === String(santriId));
  document.getElementById('stat-hanca-count').textContent = listHanca.length + ' Kali';

  // Render Table Hanca
  const tbody = document.getElementById('tbody-laporan-hanca');
  tbody.innerHTML = listHanca.map(h => {
    const ktb = appData.kitab.find(k => String(k.id) === String(h.id_kitab));
    return `
      <tr>
        <td>${h.tanggal}</td>
        <td>${ktb ? ktb.nama_kitab : '-'}</td>
        <td><b>${h.pencapaian}</b></td>
        <td>${h.catatan || '-'}</td>
      </tr>
    `;
  }).join('');
}

function printOfficialReportPDF() {
  const santriId = document.getElementById('laporan-santri').value;
  if (!santriId) return showNotif('Pilih santri terlebih dahulu', 'error');

  const santri = appData.santri.find(s => String(s.id) === String(santriId));
  const hlq = appData.halaqah.find(h => String(h.id) === String(santri?.id_halaqah));

  // Populate Print Area Data
  document.getElementById('pdf-nama-lembaga').textContent = (appData.lembaga.nama || 'MADRASAH DINIYAH').toUpperCase();
  document.getElementById('pdf-logo').src = appData.lembaga.logo || '';
  document.getElementById('pdf-santri-nama').textContent = santri ? santri.nama_santri : '-';
  document.getElementById('pdf-halaqah-nama').textContent = hlq ? hlq.nama_halaqah : '-';
  document.getElementById('pdf-wali-nama').textContent = santri ? santri.nama_wali : '-';
  document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('id-ID');

  // Kehadiran Summary Table
  const listKhd = appData.kehadiran.filter(k => String(k.id_santri) === String(santriId));
  const h = listKhd.filter(k => k.status === 'Hadir').length;
  const s = listKhd.filter(k => k.status === 'Sakit').length;
  const i = listKhd.filter(k => k.status === 'Izin').length;
  const a = listKhd.filter(k => k.status === 'Alpa').length;

  document.getElementById('pdf-kehadiran-summary').innerHTML = `
    <p><b>Hadir:</b> ${h} hari | <b>Sakit:</b> ${s} hari | <b>Izin:</b> ${i} hari | <b>Alpa:</b> ${a} hari</p>
  `;

  // Hanca Table
  const listHnc = appData.hanca.filter(h => String(h.id_santri) === String(santriId));
  document.getElementById('pdf-hanca-tbody').innerHTML = listHnc.map(item => {
    const ktb = appData.kitab.find(k => String(k.id) === String(item.id_kitab));
    return `
      <tr>
        <td>${item.tanggal}</td>
        <td>${ktb ? ktb.nama_kitab : '-'}</td>
        <td>${item.pencapaian}</td>
        <td>${item.catatan || '-'}</td>
      </tr>
    `;
  }).join('');

  // SPP Table
  const listSpp = appData.spp_transaksi.filter(sp => String(sp.id_santri) === String(santriId));
  document.getElementById('pdf-spp-tbody').innerHTML = listSpp.map(sp => `
    <tr>
      <td>${sp.bulan} ${sp.tahun}</td>
      <td>${sp.timestamp}</td>
      <td>Rp ${Number(sp.jumlah_bayar).toLocaleString('id-ID')}</td>
      <td><b style="color:green;">${sp.status}</b></td>
    </tr>
  `).join('');

  // Trigger Print Browser Dialog
  window.print();
}

// ============================================
// RENDER MASTER TABLES & FORMS (ADMIN)
// ============================================

function renderTables() {
  // Config Lembaga
  document.getElementById('cfg-nama-lembaga').value = appData.lembaga.nama || '';
  document.getElementById('cfg-logo-lembaga').value = appData.lembaga.logo || '';
  document.getElementById('display-nominal-spp').textContent = 'Rp ' + Number(appData.spp_nominal || 0).toLocaleString('id-ID');
  document.getElementById('spp-jumlah').value = appData.spp_nominal;

  // Render Halaqah
  document.getElementById('tbody-master-halaqah').innerHTML = appData.halaqah.map(h => `
    <tr>
      <td>${h.nama_halaqah}</td>
      <td>${h.ustadz_pengampu || '-'}</td>
      <td><button class="btn btn-sm btn-gold" onclick="deleteMasterItem('Halaqah', '${h.id}')"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');

  // Render Santri
  document.getElementById('tbody-master-santri').innerHTML = appData.santri.map(s => {
    const hlq = appData.halaqah.find(h => String(h.id) === String(s.id_halaqah));
    return `
      <tr>
        <td><b>${s.nama_santri}</b></td>
        <td>${hlq ? hlq.nama_halaqah : '-'}</td>
        <td>${s.nama_wali || '-'}</td>
        <td><button class="btn btn-sm btn-gold" onclick="deleteMasterItem('Santri', '${s.id}')"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  }).join('');

  // Render Kitab
  document.getElementById('tbody-master-kitab').innerHTML = appData.kitab.map(k => `
    <tr>
      <td>${k.nama_kitab}</td>
      <td>${k.target_hanca}</td>
      <td><button class="btn btn-sm btn-gold" onclick="deleteMasterItem('Kitab', '${k.id}')"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');

  // Render Users
  document.getElementById('tbody-master-users').innerHTML = appData.users.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.name}</td>
      <td><span class="badge badge-gold">${u.role}</span></td>
      <td><button class="btn btn-sm btn-gold" onclick="deleteMasterItem('Users', '${u.id}')"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');

  // Render SPP Table Global
  document.getElementById('tbody-spp').innerHTML = appData.spp_transaksi.map(sp => {
    const s = appData.santri.find(st => String(st.id) === String(sp.id_santri));
    return `
      <tr>
        <td>${sp.timestamp}</td>
        <td><b>${s ? s.nama_santri : '-'}</b></td>
        <td>${sp.bulan} ${sp.tahun}</td>
        <td>Rp ${Number(sp.jumlah_bayar).toLocaleString('id-ID')}</td>
        <td><span class="badge badge-gold">Lunas</span></td>
      </tr>
    `;
  }).join('');
}

// Master Save Event Listeners
document.getElementById('form-master-lembaga').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postData('saveLembaga', {
    nama: document.getElementById('cfg-nama-lembaga').value,
    logo: document.getElementById('cfg-logo-lembaga').value
  });
  if (res.success) { showNotif(res.message); await initApp(); }
});

document.getElementById('form-master-halaqah').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postData('saveHalaqah', {
    nama_halaqah: document.getElementById('hlq-nama').value,
    ustadz_pengampu: document.getElementById('hlq-ustadz').value
  });
  if (res.success) { showNotif(res.message); e.target.reset(); await initApp(); }
});

document.getElementById('form-master-santri').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postData('saveSantri', {
    nama_santri: document.getElementById('str-nama').value,
    id_halaqah: document.getElementById('str-halaqah').value,
    nama_wali: document.getElementById('str-wali').value
  });
  if (res.success) { showNotif(res.message); e.target.reset(); await initApp(); }
});

document.getElementById('form-master-kitab').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postData('saveKitab', {
    nama_kitab: document.getElementById('ktb-nama').value,
    target_hanca: document.getElementById('ktb-target').value
  });
  if (res.success) { showNotif(res.message); e.target.reset(); await initApp(); }
});

document.getElementById('form-master-users').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await postData('saveUser', {
    username: document.getElementById('usr-username').value,
    password: document.getElementById('usr-password').value,
    role: document.getElementById('usr-role').value,
    name: document.getElementById('usr-name').value,
    related_id: document.getElementById('usr-santri').value
  });
  if (res.success) { showNotif(res.message); e.target.reset(); await initApp(); }
});

async function deleteMasterItem(sheetName, id) {
  if (confirm('Yakin ingin menghapus data ini?')) {
    const res = await postData('deleteMaster', { sheet_name: sheetName, id });
    if (res.success) { showNotif(res.message); await initApp(); }
  }
}

function toggleWaliSantriSelect() {
  const role = document.getElementById('usr-role').value;
  document.getElementById('group-usr-santri').style.display = (role === 'wali') ? 'block' : 'none';
}

// UI NAVIGATION HELPERS
function switchTab(tabId, btnEl) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  if (btnEl) btnEl.classList.add('active');
}

function switchSubTab(subtabId) {
  document.querySelectorAll('.subtab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(subtabId).classList.add('active');
  event.target.classList.add('active');
}

function showLoading(show = true) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showNotif(msg, type = 'success') {
  const notif = document.getElementById('notif');
  notif.textContent = msg;
  notif.className = `notif ${type === 'error' ? 'notif-error' : ''} show`;
  setTimeout(() => notif.classList.remove('show'), 3000);
}

// Auto Init on Page Load
document.addEventListener('DOMContentLoaded', initApp);
