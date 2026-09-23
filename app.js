(function initFloatingBackground() {
  const emojis = ['💊', '🩺', '🩵', '💉', '🩹', '⭐', '✨', '🏥', '📋', '🧊'];
  const container = document.getElementById('floaties');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'floatie';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.fontSize = (14 + Math.random() * 16) + 'px';
    el.style.animationDuration = (10 + Math.random() * 18) + 's';
    el.style.animationDelay = (Math.random() * 14) + 's';
    container.appendChild(el);
  }
})();

const JABATAN_OPTIONS = [
  'Ketua',
  'Koordinator',
  'Sekretaris',
  'Bendahara',
  'Komandan Lapangan',
  'Perlengkapan',
  'Humas',
  'Kreatif',
  'Anggota'
];

const JABATAN_HIERARCHY = {
  'Ketua': 1,
  'Koordinator': 2,
  'Sekretaris': 3,
  'Bendahara': 4,
  'Komandan Lapangan': 5,
  'Perlengkapan': 6,
  'Humas': 7,
  'Kreatif': 8,
  'Anggota': 9
};

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const SESI = ['07:00-10:00', '10:00-13:00', '13:00-15:00'];

const DB = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem('pmr_' + k) || 'null');
    } catch {
      return null;
    }
  },
  set(k, v) {
    localStorage.setItem('pmr_' + k, JSON.stringify(v));
    if (window._fb?.ready()) {
      const { db, doc, setDoc, serverTimestamp } = window._fb;
      setDoc(doc(db(), 'pmr_data', k), { value: v, updatedAt: serverTimestamp() })
        .catch(e => console.warn('Firebase sync error:', e));
    }
  },
  def(k, v) {
    if (this.get(k) === null) this.set(k, v);
  }
};

DB.def('anggota', [
  { id: 2, nama: 'Afnan Fauzan Faturochim', nis: '1001', jabatan: 'Ketua', kelas: 'XI TE B', angkatan: '10', jk: 'L', password: '' },
  { id: 3, nama: 'Faizal Rahman', nis: '1002', jabatan: 'Koordinator', kelas: 'XI-B', angkatan: '10', jk: 'L', password: '' },
  { id: 4, nama: 'Galuh Ayu Palupi', nis: '1003', jabatan: 'Sekretaris', kelas: 'XI PPLG B', angkatan: '10', jk: 'P', password: '' },
  { id: 5, nama: 'Nisa Amalia', nis: '1101', jabatan: 'Anggota', kelas: 'XI-A', angkatan: '11', jk: 'P', password: '' },
  { id: 6, nama: 'Rizki Aditya', nis: '1102', jabatan: 'Komandan Lapangan', kelas: 'X-C', angkatan: '11', jk: 'L', password: '' }
]);

(function ensureAnggotaJk() {
  try {
    const list = DB.get('anggota');
    if (Array.isArray(list)) {
      let changed = false;
      list.forEach(a => {
        if (!a.jk) {
          const n = (a.nama || '').toLowerCase();
          if (n.includes('galuh') || n.includes('nisa') || n.includes('ayu') || n.includes('siti') || n.includes('putri') || n.includes('rahma') || n.includes('amalia') || n.includes('cantika') || n.includes('safira')) {
            a.jk = 'P';
          } else {
            a.jk = 'L';
          }
          changed = true;
        }
      });
      if (changed) DB.set('anggota', list);
    }
  } catch (e) {
    console.warn('Migration JK error:', e);
  }
})();

DB.def('pasien', [
  { id: 1, tanggal: '2026-09-15', nama: 'Budi Santoso', kelas: 'X-A', keluhan: 'Pusing dan mual', tindakan: 'Paracetamol, istirahat', status: 'Sembuh' },
  { id: 2, tanggal: '2026-09-15', nama: 'Siti Rahayu', kelas: 'XI-B', keluhan: 'Luka lecet di lutut', tindakan: 'Betadine, plester', status: 'Sembuh' },
  { id: 3, tanggal: '2026-09-16', nama: 'Ahmad Fauzi', kelas: 'XII-A', keluhan: 'Sakit perut hebat', tindakan: 'Antasida, istirahat', status: 'Dirujuk' }
]);

DB.def('stok', [
  { id: 1, nama: 'Betadine 60ml', kategori: 'Obat', jumlah: 8, satuan: 'Botol', min: 5, kadaluarsa: '2026-08-01' },
  { id: 2, nama: 'Perban Elastis', kategori: 'Alat', jumlah: 15, satuan: 'Gulung', min: 5, kadaluarsa: '-' },
  { id: 3, nama: 'Plester Luka', kategori: 'Alat', jumlah: 3, satuan: 'Kotak', min: 5, kadaluarsa: '2026-03-01' },
  { id: 4, nama: 'Paracetamol 500mg', kategori: 'Obat', jumlah: 50, satuan: 'Tablet', min: 20, kadaluarsa: '2025-12-01' },
  { id: 5, nama: 'Antasida Doen', kategori: 'Obat', jumlah: 12, satuan: 'Tablet', min: 10, kadaluarsa: '2026-01-15' },
  { id: 6, nama: 'Termometer Digital', kategori: 'Alat', jumlah: 3, satuan: 'Unit', min: 1, kadaluarsa: '-' }
]);

DB.def('absensi', []);
DB.def('logs', []);

DB.def('upacara', [
  {
    id: 1,
    tanggal: '2026-09-15',
    nama: 'Upacara Bendera Hari Senin',
    keterangan: 'Penempatan petugas jaga upacara bendera',
    titikJaga: [
      { pos: 'Lapangan Utama (Depan Tiang)', anggota: ['Afnan Fauzan Faturochim', 'Faizal Rahman'] },
      { pos: 'Gerbang & Parkiran', anggota: ['Galuh Ayu Palupi'] },
      { pos: 'Tribun Tamu & Guru', anggota: ['Nisa Amalia'] }
    ]
  }
]);

DB.def('titik_jaga_template', [
  'Lapangan Utama (Depan Tiang)', 'Gerbang & Parkiran', 'Tribun Tamu & Guru', 'Aula & Selasar', 'Pos UKS Cadangan'
]);

async function syncFromFirebase() {
  if (!window._fb?.ready()) return;
  const { db, collection, getDocs } = window._fb;
  try {
    const snap = await getDocs(collection(db(), 'pmr_data'));
    snap.forEach(d => {
      const data = d.data();
      if (data.value !== undefined) {
        localStorage.setItem('pmr_' + d.id, JSON.stringify(data.value));
      }
    });
    updateFbStatus('connected');
    toast('✅ Data tersinkron dari Firebase!');
    refreshCurrentPage();
  } catch (e) {
    console.warn('Sync error:', e);
    updateFbStatus('error');
  }
}

function startFirebaseListener() {
  if (!window._fb?.ready()) return;
  const { db, collection, onSnapshot } = window._fb;
  onSnapshot(collection(db(), 'pmr_data'), (snap) => {
    snap.forEach(d => {
      const data = d.data();
      if (data.value !== undefined) {
        localStorage.setItem('pmr_' + d.id, JSON.stringify(data.value));
      }
    });
    updateFbStatus('connected');
  }, (err) => {
    console.warn('Realtime listener error:', err);
    updateFbStatus('error');
  });
}

function updateFbStatus(state) {
  const badges = [document.getElementById('fb-status-badge'), document.getElementById('sb-fb-badge')];
  const labels = { connected: 'Firebase', disconnected: 'Lokal', error: 'Error' };
  const dotClass = { connected: 'green', disconnected: 'amber', error: 'red' };

  badges.forEach(badge => {
    if (!badge) return;
    badge.className = `fb-status ${state}`;
    const textLabel = badge.id === 'sb-fb-badge' ? (state === 'connected' ? 'Firebase Cloud' : 'Database Lokal') : labels[state];
    badge.innerHTML = `<span class="fb-dot ${dotClass[state]}"></span>${textLabel}`;
  });
}

window.addEventListener('firebase-ready', () => {
  if (window._fb?.ready()) {
    updateFbStatus('connected');
    startFirebaseListener();
    syncFromFirebase();
  } else {
    updateFbStatus('disconnected');
  }
});

window.openFbModal = function () {
  const saved = JSON.parse(localStorage.getItem('pmr_fb_config') || '{}');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'fb-modal';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-brand-firebase" style="color:var(--primary)"></i> Konfigurasi Firebase</div>
        <div class="modal-sub">Hubungkan data aplikasi ke cloud Firestore untuk sinkronisasi otomatis</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('fb-modal').remove()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group"><label>API Key</label><input id="fb-apikey" placeholder="AIzaSy..." value="${saved.apiKey || ''}"></div>
      <div class="form-group"><label>Project ID</label><input id="fb-projectid" placeholder="sijaga-uks" value="${saved.projectId || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Auth Domain</label><input id="fb-authdomain" placeholder="sijaga-uks.firebaseapp.com" value="${saved.authDomain || ''}"></div>
      <div class="form-group"><label>App ID</label><input id="fb-appid" placeholder="1:xxx:web:xxx" value="${saved.appId || ''}"></div>
    </div>
    <div class="btn-row" style="margin-top:14px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="document.getElementById('fb-modal').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveFbConfig()"><i class="ti ti-check"></i>Simpan & Hubungkan</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveFbConfig = function () {
  const cfg = {
    apiKey: document.getElementById('fb-apikey').value.trim(),
    projectId: document.getElementById('fb-projectid').value.trim(),
    authDomain: document.getElementById('fb-authdomain').value.trim(),
    appId: document.getElementById('fb-appid').value.trim(),
  };
  if (!cfg.apiKey || !cfg.projectId) return toast('API Key dan Project ID wajib diisi!');
  localStorage.setItem('pmr_fb_config', JSON.stringify(cfg));
  document.getElementById('fb-modal')?.remove();
  toast('✅ Konfigurasi disimpan! Refresh halaman untuk mengaktifkan koneksi.');
};


let currentUser = null;

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('pmr_session') || 'null');
  } catch {
    return null;
  }
}

function setSession(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('pmr_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('pmr_session');
  }
}

function canEdit() {
  const session = getSession();
  if (!session) return false;
  if (session.role === 'admin') return true;
  const jab = (session.jabatan || '').trim().toLowerCase();
  return jab !== '' && jab !== 'anggota';
}

function isLeader() {
  const session = getSession();
  if (!session) return false;
  if (session.role === 'admin') return true;
  const jab = (session.jabatan || '').trim().toLowerCase();
  return jab === 'ketua' || jab === 'koordinator';
}

function logActivity(tipe, pesan, detail = '') {
  const session = getSession() || { nama: 'Pengguna', jabatan: 'Umum', nis: '-' };
  const logs = DB.get('logs') || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const logItem = {
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    timestamp: now.toISOString(),
    waktu: `${dateStr} ${timeStr}`,
    tipe: tipe, // 'LOGIN', 'TAMBAH', 'UBAH', 'HAPUS', 'GANTI_PASSWORD', 'ABSENSI'
    pelaku: session.nama || 'Pengguna',
    jabatan: session.role === 'admin' ? 'Admin' : (session.jabatan || 'Anggota'),
    nis: session.nis || '-',
    pesan,
    detail
  };

  logs.unshift(logItem);
  if (logs.length > 300) logs.length = 300; // Simpan 300 aktivitas terakhir
  DB.set('logs', logs);
}

window.handleLogin = function (e) {
  if (e) e.preventDefault();
  const unameInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');

  const username = unameInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    showLoginError('Harap isi Nama Lengkap / NIS dan Password!');
    return;
  }

  const anggotaList = DB.get('anggota') || [];
  const found = anggotaList.find(a =>
    a.nama.trim().toLowerCase() === username.toLowerCase() ||
    (a.nis && a.nis.trim() === username)
  );

  if (found) {
    const expectedPassword = found.password && found.password.trim() !== '' ? found.password : found.nis;

    if (password === expectedPassword) {
      const memberUser = {
        role: 'anggota',
        id: found.id,
        nama: found.nama,
        nis: found.nis,
        kelas: found.kelas,
        jabatan: found.jabatan,
        angkatan: found.angkatan
      };
      setSession(memberUser);
      logActivity('LOGIN', `Berhasil login ke aplikasi MY UKS`, `Jabatan: ${found.jabatan} | NIS: ${found.nis}`);
      renderAppLayout();
      toast(`👋 Selamat datang, ${found.nama}! (${found.jabatan})`);
      return;
    } else {
      showLoginError('Password salah! Password bawaan adalah NIS Anda (atau password baru jika telah diubah).');
      return;
    }
  }

  if (username.toLowerCase() === 'admin' && password === '123456') {
    const adminUser = {
      role: 'admin',
      nama: 'Administrator',
      username: 'admin',
      jabatan: 'Ketua',
      angkatan: 'Admin'
    };
    setSession(adminUser);
    logActivity('LOGIN', `Administrator login ke sistem`, `Akses penuh sistem`);
    renderAppLayout();
    toast('👋 Selamat datang, Administrator!');
    return;
  }

  showLoginError('Nama / NIS tidak ditemukan! Silakan periksa kembali atau hubungi Ketua / Koordinator.');
};

function showLoginError(msg) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  } else {
    toast('⚠️ ' + msg);
  }
}

window.fillQuickLogin = function (uname, pass) {
  const u = document.getElementById('login-username');
  const p = document.getElementById('login-password');
  if (u && p) {
    u.value = uname;
    p.value = pass;
    handleLogin();
  }
};

window.logout = function () {
  if (!confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) return;
  const session = getSession();
  if (session) {
    logActivity('LOGOUT', `${session.nama} telah logout dari aplikasi`, `Jabatan: ${session.jabatan || 'Anggota'}`);
  }
  setSession(null);
  renderAppLayout();
  toast('Anda telah logout');
};

window.openChangePasswordModal = function (targetMemberId) {
  const session = getSession();
  if (!session) return;

  const anggotaList = DB.get('anggota') || [];
  const isSelf = !targetMemberId || (session.role === 'anggota' && targetMemberId === session.id);
  const targetMember = targetMemberId ? anggotaList.find(a => a.id === targetMemberId) : (session.role === 'anggota' ? anggotaList.find(a => a.id === session.id) : null);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'pwd-modal';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-key" style="color:var(--primary)"></i> Ubah Password ${targetMember ? `— ${targetMember.nama}` : ''}</div>
        <div class="modal-sub">${targetMember ? `NIS: ${targetMember.nis} | Jabatan: ${targetMember.jabatan} | Angkatan ${targetMember.angkatan}` : 'Atur password baru'}</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('pwd-modal').remove()">✕</button>
    </div>
    
    ${isSelf && session.role === 'anggota' ? `
    <div class="form-group" style="margin-bottom:12px">
      <label>Password Saat Ini</label>
      <input type="password" id="pwd-old" placeholder="Masukkan password lama / NIS">
    </div>` : ''}

    <div class="form-group" style="margin-bottom:12px">
      <label>Password Baru</label>
      <input type="password" id="pwd-new" placeholder="Minimal 4 karakter">
    </div>

    <div class="form-group" style="margin-bottom:16px">
      <label>Konfirmasi Password Baru</label>
      <input type="password" id="pwd-confirm" placeholder="Ulangi password baru">
    </div>

    <div class="btn-row" style="justify-content:flex-end">
      <button class="btn btn-ghost" onclick="document.getElementById('pwd-modal').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveNewPassword(${targetMember ? targetMember.id : 0}, ${isSelf})">
        <i class="ti ti-check"></i>Simpan Password
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveNewPassword = function (memberId, isSelf) {
  const session = getSession();
  const list = DB.get('anggota') || [];
  const targetId = memberId || (session.role === 'anggota' ? session.id : 0);
  const member = list.find(a => a.id === targetId);

  if (!member) return toast('Data anggota tidak ditemukan!');

  const pwdNew = document.getElementById('pwd-new').value.trim();
  const pwdConfirm = document.getElementById('pwd-confirm').value.trim();

  if (isSelf && session.role === 'anggota') {
    const pwdOld = document.getElementById('pwd-old').value.trim();
    const currentExpected = member.password && member.password.trim() !== '' ? member.password : member.nis;
    if (pwdOld !== currentExpected) {
      return toast('Password lama salah!');
    }
  }

  if (pwdNew.length < 4) {
    return toast('Password baru minimal 4 karakter!');
  }

  if (pwdNew !== pwdConfirm) {
    return toast('Konfirmasi password tidak cocok!');
  }

  const prevPwdInfo = member.password ? 'Kustom' : `Default NIS (${member.nis})`;
  member.password = pwdNew;
  DB.set('anggota', list);

  logActivity(
    'GANTI_PASSWORD',
    `${member.nama} mengubah kata sandi akun`,
    `Kata Sandi Baru: "${pwdNew}" | Sebelumnya: ${prevPwdInfo} | NIS: ${member.nis}`
  );

  document.getElementById('pwd-modal')?.remove();
  toast('✅ Password berhasil diperbarui!');
  refreshCurrentPage();
};

window.togglePwdPeek = function (id, pwdVal) {
  if (!isLeader()) return;
  const el = document.getElementById('pwd-val-' + id);
  if (!el) return;
  if (el.textContent === '••••••') {
    el.textContent = pwdVal;
    el.style.fontWeight = '900';
    el.style.color = 'var(--primary-dark)';
  } else {
    el.textContent = '••••••';
    el.style.fontWeight = 'normal';
    el.style.color = 'inherit';
  }
};

window.openActivityLogModal = function () {
  if (!isLeader()) return;
  const logs = DB.get('logs') || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-act-logs';

  overlay.innerHTML = `
  <div class="modal" style="max-width:760px">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-bell-ringing" style="color:var(--primary)"></i> Log Aktivitas & Notifikasi</div>
        <div class="modal-sub">Rekam jejak login personil, perubahan data, dan kata sandi baru (Khusus Ketua & Koordinator)</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-act-logs').remove()">✕</button>
    </div>

    <div style="max-height:60vh;overflow-y:auto;border:1px solid var(--border);border-radius:12px">
      <table>
        <thead>
          <tr>
            <th>WAKTU</th>
            <th>TIPE</th>
            <th>PELAKU & JABATAN</th>
            <th>AKTIVITAS / DETAIL</th>
          </tr>
        </thead>
        <tbody>
          ${logs.length ? logs.slice(0, 30).map(l => {
    const badgeClass = l.tipe.toLowerCase();
    return `
            <tr>
              <td style="font-size:11.5px;color:var(--text2);white-space:nowrap">${l.waktu}</td>
              <td><span class="log-badge ${badgeClass}">${l.tipe}</span></td>
              <td>
                <strong>${l.pelaku}</strong>
                <div style="font-size:11px;color:var(--text3)">${l.jabatan} • NIS: ${l.nis}</div>
              </td>
              <td>
                <div style="font-size:13px;font-weight:700">${l.pesan}</div>
                ${l.detail ? `<div class="log-detail-box">${escapeHtml(l.detail)}</div>` : ''}
              </td>
            </tr>`;
  }).join('') : '<tr><td colspan="4"><div class="empty">Belum ada aktivitas tercatat</div></td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="btn-row" style="justify-content:space-between;margin-top:16px">
      <button class="btn btn-ghost" onclick="showPage('laporan');document.getElementById('modal-act-logs').remove()"><i class="ti ti-report"></i> Buka Halaman Laporan Lengkap</button>
      <button class="btn btn-primary" onclick="document.getElementById('modal-act-logs').remove()">Tutup</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(d) {
  if (!d || d === '-') return '-';
  const p = d.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function getMemberDutyCount(memberName) {
  if (!memberName) return 0;
  const upacara = DB.get('upacara') || [];
  let count = 0;
  upacara.forEach(u => {
    (u.titikJaga || []).forEach(t => {
      if ((t.anggota || []).includes(memberName)) count++;
    });
  });
  return count;
}

setInterval(() => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('clock-display');
  const sbClock = document.getElementById('sb-clock');
  if (el) el.textContent = timeStr;
  if (sbClock) sbClock.textContent = timeStr;
}, 1000);

function renderAppLayout() {
  const session = getSession();
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app');

  if (!session) {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    renderLoginScreen();
  } else {
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    updateHeaderUser(session);
    showPage('dashboard');
  }
}

function renderLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  const anggotaList = DB.get('anggota') || [];

  loginScreen.innerHTML = `
  <div class="login-card">
    <div class="login-header">
      <div class="login-icon-badge"><i class="ti ti-shield-heart"></i></div>
      <h1 class="login-title">MY UKS</h1>
      <div class="login-subtitle">Markas Digital Palang Merah Remaja (PMR)</div>
    </div>

    <form onsubmit="handleLogin(event)">
      <div class="form-group" style="margin-bottom:14px">
        <label>Nama Lengkap / NIS</label>
        <input type="text" id="login-username" placeholder="Masukkan Nama Lengkap atau NIS" autocomplete="username" required>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Kata Sandi</label>
        <input type="password" id="login-password" placeholder="NIS Anda / password yang telah diubah" autocomplete="current-password" required>
      </div>

      <div id="login-error" class="alert alert-red" style="display:none;margin-bottom:14px;padding:8px 12px;font-size:12px"></div>

      <button type="submit" class="btn btn-primary" style="width:100%;padding:11px;font-size:14px">
        <i class="ti ti-login"></i> Masuk ke Aplikasi
      </button>
    </form>

    <div class="login-hint-box">
      <strong>🔑 Panduan Masuk:</strong>
      <div style="margin-top:4px;color:var(--text2)">
        • Masuk menggunakan <strong>Nama Lengkap</strong> atau <strong>NIS</strong> Anda.<br>
        • Password bawaan adalah <strong>NIS masing-masing</strong> (atau kata sandi baru jika telah diubah).<br>
        • Khusus <strong>Ketua</strong> & <strong>Koordinator</strong> otomatis memiliki akses audit log & pengawasan aktivitas.
      </div>
      <div class="login-hint-list">
        ${anggotaList.slice(0, 3).map(a => `
        <div class="login-hint-item" onclick="fillQuickLogin('${a.nama}', '${a.password && a.password.trim() ? a.password : a.nis}')">
          <span>👤 ${a.nama} <strong>(${a.jabatan})</strong></span>
          <span style="color:var(--primary);font-weight:700">Masuk Cepat ➔</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function updateHeaderUser(user) {
  const leader = isLeader();

  const container = document.getElementById('header-user-info');
  if (container) {
    const isA10 = user.angkatan === '10';
    const roleClass = user.role === 'admin' ? 'badge-blue' : isA10 ? 'a10' : 'a11';
    const roleLabel = user.role === 'admin' ? 'Admin UKS' : `${user.jabatan || 'Anggota'}`;

    container.innerHTML = `
      <div class="user-header-pill">
        <i class="ti ti-user-circle" style="font-size:16px;flex-shrink:0"></i>
        <span class="user-header-name">${user.nama}</span>
        <span class="user-role-badge ${roleClass}">${roleLabel}</span>
        ${leader ? `
        <button class="notif-bell-btn" onclick="openActivityLogModal()" title="Lihat Aktivitas & Notifikasi">
          <i class="ti ti-bell"></i> Log
        </button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="openChangePasswordModal()" title="Ganti Password" style="padding:2px 6px;color:#fff;background:rgba(255,255,255,0.18);border:none;border-radius:6px;flex-shrink:0">
          <i class="ti ti-key"></i>
        </button>
        <button class="btn btn-ghost btn-sm" onclick="logout()" title="Keluar" style="padding:2px 6px;color:#fee2e2;background:rgba(239,68,68,0.3);border:none;border-radius:6px;flex-shrink:0">
          <i class="ti ti-logout"></i>
        </button>
      </div>`;
  }

  const sbName = document.getElementById('sb-user-name');
  const sbRole = document.getElementById('sb-user-role');
  if (sbName) sbName.textContent = user.nama;
  if (sbRole) {
    if (user.role === 'admin') {
      sbRole.textContent = 'Administrator • UKS';
    } else {
      sbRole.textContent = `${user.jabatan || 'Anggota'} • NIS: ${user.nis || '-'}`;
    }
  }

  const sbFooterCard = document.querySelector('.sidebar-user-card');
  const existingSbNotif = document.getElementById('sb-notif-btn-el');
  if (existingSbNotif) existingSbNotif.remove();

  if (leader && sbFooterCard) {
    const actionWrap = sbFooterCard.querySelector('div[style*="display:flex;gap:4px"]');
    if (actionWrap) {
      const notifBtn = document.createElement('button');
      notifBtn.id = 'sb-notif-btn-el';
      notifBtn.className = 'sidebar-icon-btn';
      notifBtn.title = 'Aktivitas & Notifikasi Realtime';
      notifBtn.innerHTML = `<i class="ti ti-bell"></i><span class="notif-pulse-dot"></span>`;
      notifBtn.onclick = openActivityLogModal;
      actionWrap.prepend(notifBtn);
    }
  }
}

function setNav(id) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('data-page') === id || b.id === 'nav-' + id) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

function showPage(p) {
  setNav(p);
  const m = document.getElementById('main-content');
  if (!m) return;
  m.style.opacity = '0';
  m.style.transform = 'translateY(6px)';
  m.style.transition = 'opacity .18s, transform .18s';
  setTimeout(() => {
    m.innerHTML = '';
    if (pages[p]) {
      pages[p](m);
    }
    m.style.opacity = '1';
    m.style.transform = 'translateY(0)';
  }, 120);
}

function refreshCurrentPage() {
  const activeNav = document.querySelector('.nav-btn.active');
  if (activeNav) {
    const page = activeNav.getAttribute('data-page') || activeNav.id.replace('nav-', '');
    if (pages[page]) pages[page](document.getElementById('main-content'));
  }
}

const pages = {};

pages.dashboard = function (m) {
  const pasien = DB.get('pasien') || [];
  const stok = DB.get('stok') || [];
  const absensi = DB.get('absensi') || [];
  const anggota = DB.get('anggota') || [];
  const upacara = DB.get('upacara') || [];
  const logs = DB.get('logs') || [];

  const a10Count = anggota.filter(a => a.angkatan === '10').length;
  const a11Count = anggota.filter(a => a.angkatan === '11').length;
  const stokKritis = stok.filter(s => s.jumlah <= s.min);
  const todayStr = today();
  const todayAbs = absensi.filter(a => a.tanggal === todayStr);
  const hadir = todayAbs.filter(a => a.status === 'Hadir').length;
  const session = getSession();
  const leader = isLeader();

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Beranda Utama</h1>
      <div class="page-subtitle">Ringkasan pelayanan medis, jadwal tugas, & personil PMR</div>
    </div>
    <span style="font-size:12.5px;color:var(--text2);font-weight:700;background:#e2edfb;padding:7px 16px;border-radius:20px;border:1px solid var(--border)">
      📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </span>
  </div>

  ${!canEdit() ? `
  <div class="alert alert-green" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534">
    <i class="ti ti-info-circle" style="font-size:20px"></i>
    <div><strong>Akun Anggota:</strong> Anda berada dalam mode lihat (*view-only*). Pengeditan dan penambahan data dikelola oleh Pengurus & Pemegang Jabatan.</div>
  </div>` : ''}

  ${stokKritis.length ? `
  <div class="alert alert-amber">
    <i class="ti ti-alert-triangle" style="font-size:20px"></i>
    <div><strong>Perhatian: ${stokKritis.length} item stok kritis!</strong> — ${stokKritis.map(s => s.nama).join(', ')}</div>
  </div>` : ''}

  <div class="grid4" style="margin-bottom:20px">
    <div class="stat">
      <div class="stat-label">🧑‍⚕️ Pasien Hari Ini</div>
      <div class="stat-val">${pasien.filter(p => p.tanggal === todayStr).length}</div>
      <div class="stat-sub">Total riwayat: ${pasien.length} pasien</div>
      <span class="stat-icon">🩺</span>
    </div>
    <div class="stat">
      <div class="stat-label">💊 Stok Kritis</div>
      <div class="stat-val" style="color:${stokKritis.length ? 'var(--red-text)' : 'var(--green-text)'}">${stokKritis.length}</div>
      <div class="stat-sub">dari ${stok.length} total item obat & alat</div>
      <span class="stat-icon">💉</span>
    </div>
    <div class="stat">
      <div class="stat-label">👥 Kehadiran Hari Ini</div>
      <div class="stat-val">${hadir}</div>
      <div class="stat-sub">dari ${anggota.length} total personil (A10: ${a10Count}, A11: ${a11Count})</div>
      <span class="stat-icon">✅</span>
    </div>
    <div class="stat">
      <div class="stat-label">🚩 Jadwal Jaga Pos</div>
      <div class="stat-val">${upacara.length}</div>
      <div class="stat-sub">Kegiatan penugasan pos</div>
      <span class="stat-icon">🗓️</span>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <div class="card-title">
        <i class="ti ti-stethoscope"></i>Pasien Terbaru 
        <span class="card-deco">🏥 ${pasien.length} total</span>
      </div>
      <div class="quick-list">
        ${pasien.slice(-4).reverse().map(p => `
        <div class="quick-item">
          <div>
            <div style="font-weight:800;font-size:14px">${p.nama} <span style="color:var(--text3);font-weight:600">(${p.kelas})</span></div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px">${p.keluhan} • <span style="color:var(--primary);font-weight:700">${fmt(p.tanggal)}</span></div>
          </div>
          <span class="badge ${p.status === 'Sembuh' ? 'badge-green' : p.status === 'Dirujuk' ? 'badge-amber' : 'badge-red'}">${p.status}</span>
        </div>`).join('') || '<div class="empty"><i class="ti ti-notes-off"></i>Belum ada pasien terdaftar</div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <i class="ti ti-medicine-syrup"></i>Status Persediaan Obat & Alat 
        <span class="card-deco">💊 ${stok.length} item</span>
      </div>
      <div class="quick-list">
        ${stok.slice(0, 5).map(s => {
    const pct = Math.min(100, Math.round((s.jumlah / Math.max(s.min * 2, 1)) * 100));
    const cls = s.jumlah <= s.min ? '' : 'green';
    return `
          <div class="quick-item">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between">
                <span style="font-weight:800;font-size:13.5px">${s.nama} <span class="badge ${s.kategori === 'Obat' ? 'badge-blue' : 'badge-amber'}" style="font-size:10px">${s.kategori}</span></span>
                <span style="font-size:12.5px;color:var(--text2);font-weight:800">${s.jumlah} ${s.satuan}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
            </div>
          </div>`;
  }).join('')}
      </div>
    </div>
  </div>

  ${leader ? `
  <div class="card" style="margin-top:6px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="card-title" style="margin:0"><i class="ti ti-bell-ringing"></i>Aktivitas Sistem Terkini (Khusus ${session?.jabatan || 'Ketua/Koordinator'})</div>
      <button class="btn btn-ghost btn-sm" onclick="openActivityLogModal()"><i class="ti ti-list"></i> Lihat Semua</button>
    </div>
    <div class="quick-list">
      ${logs.slice(0, 4).map(l => `
      <div class="quick-item" style="padding:10px 14px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="log-badge ${l.tipe.toLowerCase()}">${l.tipe}</span>
          <div>
            <div style="font-weight:800;font-size:13px">${l.pesan}</div>
            <div style="font-size:11.5px;color:var(--text3)">${l.pelaku} (${l.jabatan}) • ${l.waktu}</div>
          </div>
        </div>
        ${l.detail ? `<span class="log-detail-box" style="margin:0">${escapeHtml(l.detail)}</span>` : ''}
      </div>`).join('') || '<div class="empty">Belum ada aktivitas tercatat</div>'}
    </div>
  </div>` : ''}`;
};

let currentAnggotaTab = 'all';
let currentAnggotaSort = 'jabatan';
let currentAnggotaJabatan = 'all';
let currentAnggotaGender = 'all';

pages.anggota = function (m) {
  function render() {
    const list = DB.get('anggota') || [];
    const flt = (document.getElementById('srch-ang')?.value || '').toLowerCase();

    let filtered = list;
    if (currentAnggotaTab === '10') {
      filtered = filtered.filter(a => a.angkatan === '10');
    } else if (currentAnggotaTab === '11') {
      filtered = filtered.filter(a => a.angkatan === '11');
    }

    if (currentAnggotaJabatan !== 'all') {
      filtered = filtered.filter(a => a.jabatan === currentAnggotaJabatan);
    }
    if (currentAnggotaGender !== 'all') {
      filtered = filtered.filter(a => a.jk === currentAnggotaGender);
    }

    if (flt) {
      filtered = filtered.filter(a =>
        a.nama.toLowerCase().includes(flt) ||
        (a.nis && a.nis.toLowerCase().includes(flt)) ||
        (a.kelas && a.kelas.toLowerCase().includes(flt)) ||
        (a.jabatan && a.jabatan.toLowerCase().includes(flt))
      );
    }

    filtered.sort((a, b) => {
      if (currentAnggotaSort === 'jabatan') {
        const orderA = JABATAN_HIERARCHY[a.jabatan] || 99;
        const orderB = JABATAN_HIERARCHY[b.jabatan] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.nama.localeCompare(b.nama);
      } else if (currentAnggotaSort === 'nama_asc') {
        return a.nama.localeCompare(b.nama);
      } else if (currentAnggotaSort === 'nama_desc') {
        return b.nama.localeCompare(a.nama);
      } else if (currentAnggotaSort === 'angkatan_asc') {
        if (a.angkatan !== b.angkatan) return a.angkatan.localeCompare(b.angkatan);
        return a.nama.localeCompare(b.nama);
      } else if (currentAnggotaSort === 'angkatan_desc') {
        if (a.angkatan !== b.angkatan) return b.angkatan.localeCompare(a.angkatan);
        return a.nama.localeCompare(b.nama);
      } else if (currentAnggotaSort === 'jaga_desc') {
        const countA = getMemberDutyCount(a.nama);
        const countB = getMemberDutyCount(b.nama);
        if (countB !== countA) return countB - countA;
        return a.nama.localeCompare(b.nama);
      }
      return 0;
    });

    const a10Total = list.filter(a => a.angkatan === '10').length;
    const a11Total = list.filter(a => a.angkatan === '11').length;
    const cowoTotal = list.filter(a => a.jk !== 'P').length;
    const ceweTotal = list.filter(a => a.jk === 'P').length;

    const countAllEl = document.getElementById('ang-count-all');
    const count10El = document.getElementById('ang-count-10');
    const count11El = document.getElementById('ang-count-11');
    if (countAllEl) countAllEl.textContent = list.length;
    if (count10El) count10El.textContent = a10Total;
    if (count11El) count11El.textContent = a11Total;

    const statsEl = document.getElementById('ang-gender-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span class="badge badge-cowo"><i class="ti ti-gender-male"></i> 👦 ${cowoTotal} Cowo</span>
        <span class="badge badge-cewe"><i class="ti ti-gender-female"></i> 👧 ${ceweTotal} Cewe</span>
      `;
    }

    const tbody = document.getElementById('ang-tbl');
    if (!tbody) return;

    const leader = isLeader();
    const editable = canEdit();

    tbody.innerHTML = filtered.length
      ? filtered.map(a => {
        const dutyCount = getMemberDutyCount(a.nama);
        const dutyBadge = dutyCount > 0
          ? `<span class="badge-kali-jaga">${dutyCount} kali jaga</span>`
          : `<span class="badge-belum-jaga">Belum pernah</span>`;

        const isCewe = a.jk === 'P';
        const jkBadge = isCewe
          ? `<span class="badge-cewe"><i class="ti ti-gender-female"></i> 👧 Cewe</span>`
          : `<span class="badge-cowo"><i class="ti ti-gender-male"></i> 👦 Cowo</span>`;

        const passwordHtml = leader ? `
            <td>
              ${a.password && a.password.trim() !== '' ? `
                <span class="badge-pwd-custom" title="Kata sandi kustom telah diubah">
                  <i class="ti ti-lock"></i> <span id="pwd-val-${a.id}">••••••</span>
                  <button class="pwd-peek-btn" onclick="togglePwdPeek(${a.id}, '${escapeHtml(a.password)}')" title="Intip Sandi">👁️</button>
                </span>` : `
                <span class="badge-pwd-default" title="Kata sandi default NIS">
                  <i class="ti ti-key"></i> NIS (${a.nis})
                </span>`
          }
            </td>` : '';

        const actionHtml = editable ? `
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-action-edit" onclick="openModalAnggota(${a.id})" title="Ubah data"><i class="ti ti-edit"></i> Ubah</button>
                <button class="btn btn-action-delete" onclick="delAnggota(${a.id})" title="Hapus"><i class="ti ti-trash"></i> Hapus</button>
              </div>
            </td>` : `
            <td><span class="badge-readonly"><i class="ti ti-eye"></i> Hanya Lihat</span></td>`;

        return `
          <tr>
            <td><strong>${a.nama}</strong></td>
            <td><span class="badge-nis">${a.nis || '-'}</span></td>
            <td>${a.kelas || '-'}</td>
            <td>
              <span class="${a.angkatan === '10' ? 'badge-a10' : 'badge-a11'}">
                Angkatan ${a.angkatan}
              </span>
            </td>
            <td>${jkBadge}</td>
            <td><span class="badge-jabatan">${a.jabatan || 'Anggota'}</span></td>
            <td>${dutyBadge}</td>
            ${passwordHtml}
            ${actionHtml}
          </tr>`;
      }).join('')
      : `<tr><td colspan="${leader ? 9 : 8}"><div class="empty"><i class="ti ti-users"></i>Tidak ada anggota pada kriteria ini</div></td></tr>`;
  }

  const leader = isLeader();
  const editable = canEdit();

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Data Anggota</h1>
      <div class="page-subtitle">Kelola personil PMR, jabatan, angkatan (A10/A11), dan pemantauan akun</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div id="ang-gender-stats" style="display:flex;gap:6px"></div>
      ${editable ? `
      <button class="btn-header-add" onclick="openModalAnggota()">
        <i class="ti ti-plus"></i> Tambah Anggota
      </button>` : ''}
    </div>
  </div>

  <div class="card">
    <!-- Filter & Sort Bar (Feature 4) -->
    <div class="ang-filter-bar">
      <div class="filter-group-wrap">
        <!-- Sort Select -->
        <div class="filter-item">
          <label><i class="ti ti-arrows-sort"></i> URUTKAN:</label>
          <select id="sort-ang" onchange="changeAnggotaSort(this.value)">
            <option value="jabatan" ${currentAnggotaSort === 'jabatan' ? 'selected' : ''}>👑 Urutan Jabatan (Ketua ➔ Anggota)</option>
            <option value="nama_asc" ${currentAnggotaSort === 'nama_asc' ? 'selected' : ''}>🔤 Nama (A - Z)</option>
            <option value="nama_desc" ${currentAnggotaSort === 'nama_desc' ? 'selected' : ''}>🔤 Nama (Z - A)</option>
            <option value="angkatan_asc" ${currentAnggotaSort === 'angkatan_asc' ? 'selected' : ''}>⭐ Angkatan (A10 ➔ A11)</option>
            <option value="angkatan_desc" ${currentAnggotaSort === 'angkatan_desc' ? 'selected' : ''}>🌟 Angkatan (A11 ➔ A10)</option>
            <option value="jaga_desc" ${currentAnggotaSort === 'jaga_desc' ? 'selected' : ''}>🚩 Frekuensi Jaga Terbanyak</option>
          </select>
        </div>

        <!-- Filter Jabatan -->
        <div class="filter-item">
          <label><i class="ti ti-id-badge-2"></i> JABATAN:</label>
          <select id="flt-ang-jab" onchange="changeAnggotaJabatan(this.value)">
            <option value="all">Semua Jabatan</option>
            ${JABATAN_OPTIONS.map(j => `<option value="${j}" ${currentAnggotaJabatan === j ? 'selected' : ''}>${j}</option>`).join('')}
          </select>
        </div>

        <!-- Filter Gender -->
        <div class="filter-item">
          <label><i class="ti ti-gender-bigender"></i> GENDER:</label>
          <select id="flt-ang-gender" onchange="changeAnggotaGender(this.value)">
            <option value="all" ${currentAnggotaGender === 'all' ? 'selected' : ''}>Semua Gender</option>
            <option value="L" ${currentAnggotaGender === 'L' ? 'selected' : ''}>👦 Cowo (Laki-laki)</option>
            <option value="P" ${currentAnggotaGender === 'P' ? 'selected' : ''}>👧 Cewe (Perempuan)</option>
          </select>
        </div>
      </div>

      <div style="min-width:200px">
        <input type="text" id="srch-ang" placeholder="🔍 Cari nama / NIS / kelas..." oninput="renderAnggotaTbl()">
      </div>
    </div>

    <!-- Tabs Angkatan -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      <div class="tab-row" style="margin:0">
        <button class="tab-btn ${currentAnggotaTab === 'all' ? 'active' : ''}" id="tab-ang-all" onclick="switchAnggotaTab('all')">
          Semua Anggota (<span id="ang-count-all">0</span>)
        </button>
        <button class="tab-btn ${currentAnggotaTab === '10' ? 'active' : ''}" id="tab-ang-10" onclick="switchAnggotaTab('10')">
          Angkatan 10 (<span id="ang-count-10">0</span>)
        </button>
        <button class="tab-btn ${currentAnggotaTab === '11' ? 'active' : ''}" id="tab-ang-11" onclick="switchAnggotaTab('11')">
          Angkatan 11 (<span id="ang-count-11">0</span>)
        </button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="resetAnggotaFilters()"><i class="ti ti-refresh"></i> Reset Filter</button>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>NAMA LENGKAP</th>
            <th>NIS</th>
            <th>KELAS</th>
            <th>ANGKATAN</th>
            <th>GENDER</th>
            <th>JABATAN</th>
            <th>KALI JAGA</th>
            ${leader ? '<th>KATA SANDI (KETUA/KOOR)</th>' : ''}
            <th>AKSI</th>
          </tr>
        </thead>
        <tbody id="ang-tbl"></tbody>
      </table>
    </div>
  </div>`;

  window.renderAnggotaTbl = render;
  render();
};

window.switchAnggotaTab = function (tab) {
  currentAnggotaTab = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-ang-' + tab);
  if (btn) btn.classList.add('active');
  if (window.renderAnggotaTbl) renderAnggotaTbl();
};

window.changeAnggotaSort = function (val) {
  currentAnggotaSort = val;
  if (window.renderAnggotaTbl) renderAnggotaTbl();
};

window.changeAnggotaJabatan = function (val) {
  currentAnggotaJabatan = val;
  if (window.renderAnggotaTbl) renderAnggotaTbl();
};

window.changeAnggotaGender = function (val) {
  currentAnggotaGender = val;
  if (window.renderAnggotaTbl) renderAnggotaTbl();
};

window.resetAnggotaFilters = function () {
  currentAnggotaTab = 'all';
  currentAnggotaSort = 'jabatan';
  currentAnggotaJabatan = 'all';
  currentAnggotaGender = 'all';
  const srch = document.getElementById('srch-ang');
  if (srch) srch.value = '';
  const sortSel = document.getElementById('sort-ang');
  if (sortSel) sortSel.value = 'jabatan';
  const jabSel = document.getElementById('flt-ang-jab');
  if (jabSel) jabSel.value = 'all';
  const genSel = document.getElementById('flt-ang-gender');
  if (genSel) genSel.value = 'all';
  switchAnggotaTab('all');
};

window.openModalAnggota = function (editId) {
  if (!canEdit()) {
    return toast('⚠️ Akses ditolak: Hanya pengurus/pemegang jabatan yang dapat mengedit anggota!');
  }

  const list = DB.get('anggota') || [];
  const editItem = editId ? list.find(a => a.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-ang';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-user-plus" style="color:var(--primary)"></i> ${editItem ? 'Ubah Data Anggota' : 'Tambah Anggota Baru'}</div>
        <div class="modal-sub">Lengkapi identitas, gender, jabatan, dan angkatan anggota PMR</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-ang').remove()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label>Nama Lengkap</label>
        <input type="text" id="modal-ang-nama" placeholder="cth: Afnan Fauzan Faturochim" value="${editItem?.nama || ''}">
      </div>
      <div class="form-group">
        <label>NIS (Nomor Induk Siswa)</label>
        <input type="text" id="modal-ang-nis" placeholder="cth: 1001" value="${editItem?.nis || ''}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Kelas</label>
        <input type="text" id="modal-ang-kelas" placeholder="cth: XI TE B" value="${editItem?.kelas || ''}">
      </div>
      <div class="form-group">
        <label>Jenis Kelamin (Gender)</label>
        <select id="modal-ang-jk">
          <option value="L" ${(editItem?.jk || 'L') === 'L' ? 'selected' : ''}>👦 Laki-laki (Cowo)</option>
          <option value="P" ${editItem?.jk === 'P' ? 'selected' : ''}>👧 Perempuan (Cewe)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Jabatan</label>
        <select id="modal-ang-jab">
          ${JABATAN_OPTIONS.map(j => `<option value="${j}" ${editItem?.jabatan === j ? 'selected' : ''}>${j}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Angkatan</label>
        <select id="modal-ang-angkatan">
          <option value="10" ${editItem?.angkatan === '10' ? 'selected' : ''}>Angkatan 10 (A10)</option>
          <option value="11" ${editItem?.angkatan === '11' ? 'selected' : ''}>Angkatan 11 (A11)</option>
        </select>
      </div>
    </div>

    <!-- Opsi Password Kustom -->
    <div class="form-toggle-box">
      <div>
        <div style="font-weight:800;font-size:13px;color:var(--text)">🔐 Kata Sandi Akun Login</div>
        <div style="font-size:11.5px;color:var(--text3);margin-top:2px">
          Pilih "Pakai NIS" agar sandi bawaan menggunakan NIS, atau "Kustom" untuk menentukan password baru.
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px;font-weight:700">
          <input type="radio" name="modal_pwd_opt" value="no" ${!editItem?.password ? 'checked' : ''} onchange="toggleModalPwd(false)" style="width:auto"> Pakai NIS
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px;font-weight:700">
          <input type="radio" name="modal_pwd_opt" value="yes" ${editItem?.password ? 'checked' : ''} onchange="toggleModalPwd(true)" style="width:auto"> Kustom
        </label>
      </div>
    </div>

    <div id="modal-pwd-field" style="display:${editItem?.password ? 'block' : 'none'};margin-bottom:14px">
      <div class="form-group">
        <label>Password Kustom</label>
        <input type="password" id="modal-ang-pwd" placeholder="Minimal 4 karakter" value="${editItem?.password || ''}">
      </div>
    </div>

    <div class="btn-row" style="justify-content:flex-end;margin-top:16px">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-ang').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveModalAnggota(${editId || 0})">
        <i class="ti ti-device-floppy"></i> ${editItem ? 'Perbarui Anggota' : 'Simpan Anggota'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.toggleModalPwd = function (show) {
  const f = document.getElementById('modal-pwd-field');
  if (f) f.style.display = show ? 'block' : 'none';
};

window.saveModalAnggota = function (editId) {
  if (!canEdit()) {
    return toast('⚠️ Akses ditolak: Hanya pengurus/pemegang jabatan yang dapat menyimpan data!');
  }

  const nama = document.getElementById('modal-ang-nama').value.trim();
  const nis = document.getElementById('modal-ang-nis').value.trim();
  const kelas = document.getElementById('modal-ang-kelas').value.trim();
  const jk = document.getElementById('modal-ang-jk').value;
  const jabatan = document.getElementById('modal-ang-jab').value;
  const angkatan = document.getElementById('modal-ang-angkatan').value;

  if (!nama) return toast('Nama lengkap anggota wajib diisi!');
  if (!nis) return toast('NIS anggota wajib diisi!');

  const isCustom = document.querySelector('input[name="modal_pwd_opt"]:checked')?.value === 'yes';
  let pwd = '';
  if (isCustom) {
    pwd = document.getElementById('modal-ang-pwd').value.trim();
    if (pwd && pwd.length < 4) return toast('Password kustom minimal 4 karakter!');
  }

  const list = DB.get('anggota') || [];

  if (editId) {
    const item = list.find(a => a.id === editId);
    if (item) {
      item.nama = nama;
      item.nis = nis;
      item.kelas = kelas || '-';
      item.jk = jk;
      item.jabatan = jabatan;
      item.angkatan = angkatan;
      if (isCustom && pwd) item.password = pwd;
      else if (!isCustom) item.password = '';
      logActivity('UBAH', `Mengubah data anggota: ${nama} (${jabatan})`, `NIS: ${nis}, Kelas: ${kelas}, Angkatan: ${angkatan}`);
    }
  } else {
    list.push({
      id: Date.now(),
      nama,
      nis,
      kelas: kelas || '-',
      jk,
      jabatan,
      angkatan,
      password: pwd
    });
    logActivity('TAMBAH', `Menambahkan anggota baru: ${nama} (${jabatan})`, `NIS: ${nis}, Angkatan: ${angkatan}`);
  }

  DB.set('anggota', list);
  document.getElementById('modal-ang')?.remove();
  if (window.renderAnggotaTbl) renderAnggotaTbl();
  toast(`✅ Anggota berhasil ${editId ? 'diperbarui' : 'ditambahkan'}!`);
};

window.delAnggota = function (id) {
  if (!canEdit()) {
    return toast('⚠️ Akses ditolak: Hanya pengurus/pemegang jabatan yang dapat menghapus data!');
  }
  const list = DB.get('anggota') || [];
  const item = list.find(a => a.id === id);
  if (!confirm(`Hapus personil ${item?.nama || 'anggota'} dari sistem MY UKS?`)) return;

  DB.set('anggota', list.filter(a => a.id !== id));
  logActivity('HAPUS', `Menghapus anggota: ${item?.nama || 'Anggota'}`, `NIS: ${item?.nis || '-'}`);
  if (window.renderAnggotaTbl) renderAnggotaTbl();
  toast('Anggota dihapus 🗑️');
};

pages.pasien = function (m) {
  function render() {
    const list = DB.get('pasien') || [];
    const tglFilter = document.getElementById('flt-tgl-pasien')?.value || '';

    let filtered = list;
    if (tglFilter) {
      filtered = filtered.filter(p => p.tanggal === tglFilter);
    }

    const tbody = document.getElementById('pasien-tbl');
    if (!tbody) return;

    const editable = canEdit();

    tbody.innerHTML = filtered.length
      ? filtered.slice().reverse().map(p => {
        const actionHtml = editable ? `
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-action-edit" onclick="openModalPasien(${p.id})"><i class="ti ti-edit"></i> Ubah</button>
                <button class="btn btn-action-delete" onclick="delPasien(${p.id})"><i class="ti ti-trash"></i> Hapus</button>
              </div>
            </td>` : `
            <td><span class="badge-readonly"><i class="ti ti-eye"></i> Hanya Lihat</span></td>`;

        return `
          <tr>
            <td>${fmt(p.tanggal)}</td>
            <td><strong>${p.nama}</strong></td>
            <td>${p.kelas}</td>
            <td>${p.keluhan}</td>
            <td>${p.tindakan}</td>
            <td><span class="badge ${p.status === 'Sembuh' ? 'badge-green' : p.status === 'Dirujuk' ? 'badge-amber' : 'badge-red'}">${p.status}</span></td>
            ${actionHtml}
          </tr>`;
      }).join('')
      : `<tr><td colspan="7"><div class="empty"><i class="ti ti-notes-off"></i>Belum ada data kunjungan pasien</div></td></tr>`;
  }

  const editable = canEdit();

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Data Pasien</h1>
      <div class="page-subtitle">Catatan kunjungan dan tindakan medis di ruang UKS</div>
    </div>
    ${editable ? `
    <button class="btn-header-add" onclick="openModalPasien()">
      <i class="ti ti-plus"></i> Catat Pasien Baru
    </button>` : ''}
  </div>

  <div class="card">
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="form-group" style="max-width:240px">
        <label>Filter Tanggal Kunjungan</label>
        <input type="date" id="flt-tgl-pasien" onchange="renderPasienTbl()">
      </div>
      <button class="btn btn-ghost" onclick="document.getElementById('flt-tgl-pasien').value='';renderPasienTbl()" style="margin-top:18px">
        Reset Filter
      </button>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>TANGGAL</th>
            <th>NAMA PASIEN</th>
            <th>KELAS</th>
            <th>KELUHAN</th>
            <th>OBAT / TINDAKAN</th>
            <th>STATUS</th>
            <th>AKSI</th>
          </tr>
        </thead>
        <tbody id="pasien-tbl"></tbody>
      </table>
    </div>
  </div>`;

  window.renderPasienTbl = render;
  render();
};

window.openModalPasien = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus/pemegang jabatan yang dapat mencatat pasien!');

  const list = DB.get('pasien') || [];
  const editItem = editId ? list.find(p => p.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-pasien';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-stethoscope" style="color:var(--primary)"></i> ${editItem ? 'Ubah Catatan Pasien' : 'Catat Pasien Baru'}</div>
        <div class="modal-sub">Rekam kunjungan siswa dan penanganan medis di UKS</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-pasien').remove()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Tanggal Kunjungan</label><input type="date" id="m-p-tgl" value="${editItem?.tanggal || today()}"></div>
      <div class="form-group" style="flex:2"><label>Nama Pasien</label><input type="text" id="m-p-nama" placeholder="Nama lengkap siswa" value="${editItem?.nama || ''}"></div>
      <div class="form-group"><label>Kelas</label><input type="text" id="m-p-kelas" placeholder="cth: X-A" value="${editItem?.kelas || ''}"></div>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Keluhan / Gejala</label><input type="text" id="m-p-keluhan" placeholder="cth: Pusing, Demam, Sakit perut" value="${editItem?.keluhan || ''}"></div>
      <div class="form-group"><label>Obat / Tindakan Diberikan</label><input type="text" id="m-p-tindakan" placeholder="cth: Paracetamol, istirahat" value="${editItem?.tindakan || ''}"></div>
    </div>

    <div class="form-group" style="margin-bottom:14px">
      <label>Status Penanganan</label>
      <select id="m-p-status">
        <option ${editItem?.status === 'Sembuh' ? 'selected' : ''}>Sembuh</option>
        <option ${editItem?.status === 'Dalam Penanganan' ? 'selected' : ''}>Dalam Penanganan</option>
        <option ${editItem?.status === 'Dirujuk' ? 'selected' : ''}>Dirujuk</option>
      </select>
    </div>

    <div class="btn-row" style="justify-content:flex-end;margin-top:16px">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-pasien').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveModalPasien(${editId || 0})">
        <i class="ti ti-device-floppy"></i> ${editItem ? 'Perbarui Rekam Medis' : 'Simpan Data Pasien'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveModalPasien = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menyimpan rekam medis!');

  const nama = document.getElementById('m-p-nama').value.trim();
  if (!nama) return toast('Nama pasien wajib diisi!');

  const list = DB.get('pasien') || [];
  const tgl = document.getElementById('m-p-tgl').value;
  const kelas = document.getElementById('m-p-kelas').value.trim() || '-';
  const keluhan = document.getElementById('m-p-keluhan').value.trim() || '-';
  const tindakan = document.getElementById('m-p-tindakan').value.trim() || '-';
  const status = document.getElementById('m-p-status').value;

  if (editId) {
    const item = list.find(p => p.id === editId);
    if (item) {
      item.tanggal = tgl;
      item.nama = nama;
      item.kelas = kelas;
      item.keluhan = keluhan;
      item.tindakan = tindakan;
      item.status = status;
      logActivity('UBAH', `Mengubah rekam medis pasien: ${nama} (${kelas})`, `Status: ${status} | Tindakan: ${tindakan}`);
    }
  } else {
    list.push({
      id: Date.now(),
      tanggal: tgl,
      nama,
      kelas,
      keluhan,
      tindakan,
      status
    });
    logActivity('TAMBAH', `Mencatat pasien baru: ${nama} (${kelas})`, `Keluhan: ${keluhan} | Tindakan: ${tindakan}`);
  }

  DB.set('pasien', list);
  document.getElementById('modal-pasien')?.remove();
  if (window.renderPasienTbl) renderPasienTbl();
  toast(`✅ Data pasien berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delPasien = function (id) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menghapus data pasien!');

  const list = DB.get('pasien') || [];
  const item = list.find(p => p.id === id);
  if (!confirm(`Hapus catatan pasien ${item?.nama || ''}?`)) return;

  DB.set('pasien', list.filter(p => p.id !== id));
  logActivity('HAPUS', `Menghapus rekam medis pasien: ${item?.nama || 'Pasien'}`, `Tanggal: ${fmt(item?.tanggal)}`);
  if (window.renderPasienTbl) renderPasienTbl();
  toast('Data pasien dihapus 🗑️');
};

pages.stok = function (m) {
  function render() {
    const list = DB.get('stok') || [];
    const flt = (document.getElementById('srch-stok')?.value || '').toLowerCase();
    const filtered = list.filter(s =>
      s.nama.toLowerCase().includes(flt) || s.kategori.toLowerCase().includes(flt)
    );

    const tbody = document.getElementById('stok-tbl');
    if (!tbody) return;

    const editable = canEdit();

    tbody.innerHTML = filtered.length
      ? filtered.map(s => {
        const kritis = s.jumlah <= s.min;
        const actionHtml = editable ? `
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-action-edit" onclick="openModalStok(${s.id})"><i class="ti ti-edit"></i> Ubah</button>
                <button class="btn btn-action-delete" onclick="delStok(${s.id})"><i class="ti ti-trash"></i> Hapus</button>
              </div>
            </td>` : `
            <td><span class="badge-readonly"><i class="ti ti-eye"></i> Hanya Lihat</span></td>`;

        return `
          <tr>
            <td><strong>${s.nama}</strong></td>
            <td><span class="badge ${s.kategori === 'Obat' ? 'badge-blue' : 'badge-amber'}">${s.kategori === 'Obat' ? '💊' : '🩺'} ${s.kategori}</span></td>
            <td>
              <span style="color:${kritis ? 'var(--red-text)' : 'var(--text)'};font-weight:900">${s.jumlah}</span>
              ${kritis ? ' <span class="badge badge-red">⚠️ Kritis</span>' : ''}
            </td>
            <td>${s.satuan}</td>
            <td style="color:var(--text2)">${fmt(s.kadaluarsa)}</td>
            ${actionHtml}
          </tr>`;
      }).join('')
      : `<tr><td colspan="6"><div class="empty"><i class="ti ti-package-off"></i>Belum ada data stok</div></td></tr>`;
  }

  const kritis = (DB.get('stok') || []).filter(s => s.jumlah <= s.min);
  const editable = canEdit();

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Stok UKS</h1>
      <div class="page-subtitle">Persediaan obat-obatan dan peralatan medis UKS</div>
    </div>
    ${editable ? `
    <button class="btn-header-add" onclick="openModalStok()">
      <i class="ti ti-plus"></i> Tambah Stok
    </button>` : ''}
  </div>

  ${kritis.length ? `
  <div class="alert alert-amber">
    <i class="ti ti-alert-triangle"></i>
    <div>Peringatan Stok Kritis: <strong>${kritis.map(s => s.nama + ' (' + s.jumlah + ' ' + s.satuan + ')').join(', ')}</strong></div>
  </div>` : ''}

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      <div class="card-title" style="margin:0"><i class="ti ti-list"></i>Daftar Persediaan</div>
      <input type="text" id="srch-stok" placeholder="🔍 Cari nama obat / alat..." style="max-width:240px" oninput="renderStokTbl()">
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>NAMA ITEM</th>
            <th>KATEGORI</th>
            <th>JUMLAH</th>
            <th>SATUAN</th>
            <th>KADALUARSA</th>
            <th>AKSI</th>
          </tr>
        </thead>
        <tbody id="stok-tbl"></tbody>
      </table>
    </div>
  </div>`;

  window.renderStokTbl = render;
  render();
};

window.openModalStok = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menambah/mengedit stok!');

  const list = DB.get('stok') || [];
  const editItem = editId ? list.find(s => s.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-stok';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-medicine-syrup" style="color:var(--primary)"></i> ${editItem ? 'Ubah Item Stok' : 'Tambah Item Baru'}</div>
        <div class="modal-sub">Kelola persediaan obat atau peralatan medis UKS</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-stok').remove()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:2"><label>Nama Item</label><input type="text" id="m-s-nama" placeholder="cth: Betadine 60ml" value="${editItem?.nama || ''}"></div>
      <div class="form-group"><label>Kategori</label>
        <select id="m-s-kat">
          <option ${editItem?.kategori === 'Obat' ? 'selected' : ''}>Obat</option>
          <option ${editItem?.kategori === 'Alat' ? 'selected' : ''}>Alat</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Jumlah</label><input type="number" id="m-s-jml" min="0" placeholder="0" value="${editItem?.jumlah !== undefined ? editItem.jumlah : ''}"></div>
      <div class="form-group"><label>Satuan</label><input type="text" id="m-s-sat" placeholder="Tablet/Botol/Gulung" value="${editItem?.satuan || 'Pcs'}"></div>
      <div class="form-group"><label>Stok Minimum</label><input type="number" id="m-s-min" min="0" placeholder="5" value="${editItem?.min !== undefined ? editItem.min : 5}"></div>
      <div class="form-group"><label>Kadaluarsa</label><input type="date" id="m-s-exp" value="${editItem?.kadaluarsa !== '-' ? editItem?.kadaluarsa : ''}"></div>
    </div>

    <div class="btn-row" style="justify-content:flex-end;margin-top:16px">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-stok').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveModalStok(${editId || 0})">
        <i class="ti ti-device-floppy"></i> ${editItem ? 'Perbarui Item' : 'Simpan Item'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveModalStok = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menyimpan data stok!');

  const nama = document.getElementById('m-s-nama').value.trim();
  if (!nama) return toast('Nama item wajib diisi!');

  const list = DB.get('stok') || [];
  const kat = document.getElementById('m-s-kat').value;
  const jml = parseInt(document.getElementById('m-s-jml').value) || 0;
  const sat = document.getElementById('m-s-sat').value.trim() || 'Pcs';
  const min = parseInt(document.getElementById('m-s-min').value) || 5;
  const exp = document.getElementById('m-s-exp').value || '-';

  if (editId) {
    const item = list.find(s => s.id === editId);
    if (item) {
      item.nama = nama;
      item.kategori = kat;
      item.jumlah = jml;
      item.satuan = sat;
      item.min = min;
      item.kadaluarsa = exp;
      logActivity('UBAH', `Mengubah stok: ${nama}`, `Jumlah: ${jml} ${sat} | Kategori: ${kat}`);
    }
  } else {
    list.push({
      id: Date.now(),
      nama,
      kategori: kat,
      jumlah: jml,
      satuan: sat,
      min,
      kadaluarsa: exp
    });
    logActivity('TAMBAH', `Menambah item stok baru: ${nama}`, `Jumlah: ${jml} ${sat} | Kategori: ${kat}`);
  }

  DB.set('stok', list);
  document.getElementById('modal-stok')?.remove();
  if (window.renderStokTbl) renderStokTbl();
  toast(`✅ Item stok berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delStok = function (id) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menghapus stok!');

  const list = DB.get('stok') || [];
  const item = list.find(s => s.id === id);
  if (!confirm(`Hapus item persediaan ${item?.nama || ''}?`)) return;

  DB.set('stok', list.filter(s => s.id !== id));
  logActivity('HAPUS', `Menghapus item stok: ${item?.nama || 'Item'}`, `Kategori: ${item?.kategori}`);
  if (window.renderStokTbl) renderStokTbl();
  toast('Item stok dihapus 🗑️');
};

let currentAbsensiFilter = 'all';

pages.absensi = function (m) {
  function render() {
    const absensi = DB.get('absensi') || [];
    const anggota = DB.get('anggota') || [];
    const tgl = document.getElementById('abs-tgl').value;
    const todayAbs = absensi.filter(a => a.tanggal === tgl);

    let filteredAnggota = anggota;
    if (currentAbsensiFilter === '10') {
      filteredAnggota = filteredAnggota.filter(a => a.angkatan === '10');
    } else if (currentAbsensiFilter === '11') {
      filteredAnggota = filteredAnggota.filter(a => a.angkatan === '11');
    }

    const editable = canEdit();

    const rows = filteredAnggota.map(an => {
      const rec = todayAbs.find(a => a.anggotaId === an.id);

      const actionsCell = editable ? `
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['Hadir', 'Izin', 'Sakit', 'Alpha'].map(s =>
        `<button class="btn btn-ghost btn-sm" style="${rec?.status === s ? 'border-color:var(--primary);color:var(--primary);background:var(--primary-dim);font-weight:900' : ''}" onclick="setAbsen(${an.id},'${s}')">${s}</button>`
      ).join('')}
          </div>
        </td>` : `
        <td><span class="badge-readonly"><i class="ti ti-eye"></i> Hanya Pengurus</span></td>`;

      return `<tr>
        <td><strong>${an.nama}</strong></td>
        <td><span class="badge-nis">${an.nis || '-'}</span></td>
        <td>${an.kelas}</td>
        <td>
          <span class="${an.angkatan === '10' ? 'badge-a10' : 'badge-a11'}">
            Angkatan ${an.angkatan}
          </span>
        </td>
        <td><span class="badge-jabatan">${an.jabatan}</span></td>
        <td>${rec
          ? `<span class="badge ${rec.status === 'Hadir' ? 'badge-green' : rec.status === 'Izin' ? 'badge-amber' : 'badge-red'}">${rec.status}</span>`
          : '<span style="color:var(--text3);font-size:12px;font-weight:700">Belum diisi</span>'}</td>
        ${actionsCell}
      </tr>`;
    }).join('');

    const hadir = todayAbs.filter(a => a.status === 'Hadir').length;
    const izin = todayAbs.filter(a => a.status === 'Izin').length;
    const absen = todayAbs.filter(a => ['Sakit', 'Alpha'].includes(a.status)).length;

    document.getElementById('abs-tbl').innerHTML = rows ||
      '<tr><td colspan="7"><div class="empty">Belum ada anggota pada filter ini</div></td></tr>';
    document.getElementById('abs-summary').innerHTML = `
      <span class="badge badge-green">✅ ${hadir} Hadir</span>
      <span class="badge badge-amber">📝 ${izin} Izin</span>
      <span class="badge badge-red">❌ ${absen} Sakit / Alpha</span>`;
  }

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Absensi</h1>
      <div class="page-subtitle">Presensi dan kehadiran harian anggota PMR</div>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--text2);font-weight:800">TANGGAL:</label>
        <input type="date" id="abs-tgl" value="${today()}" onchange="renderAbsTbl()" style="width:160px">
        
        <div class="tab-row" style="margin:0">
          <button class="tab-btn ${currentAbsensiFilter === 'all' ? 'active' : ''}" id="tab-abs-all" onclick="filterAbsensi('all')">Semua</button>
          <button class="tab-btn ${currentAbsensiFilter === '10' ? 'active' : ''}" id="tab-abs-10" onclick="filterAbsensi('10')">Angkatan 10</button>
          <button class="tab-btn ${currentAbsensiFilter === '11' ? 'active' : ''}" id="tab-abs-11" onclick="filterAbsensi('11')">Angkatan 11</button>
        </div>
      </div>
      <div id="abs-summary" style="display:flex;gap:6px;flex-wrap:wrap"></div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>NAMA LENGKAP</th>
            <th>NIS</th>
            <th>KELAS</th>
            <th>ANGKATAN</th>
            <th>JABATAN</th>
            <th>STATUS</th>
            <th>TANDAI KEHADIRAN</th>
          </tr>
        </thead>
        <tbody id="abs-tbl"></tbody>
      </table>
    </div>
  </div>`;

  window.renderAbsTbl = render;
  render();
};

window.filterAbsensi = function (tab) {
  currentAbsensiFilter = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-abs-' + tab);
  if (btn) btn.classList.add('active');
  if (window.renderAbsTbl) renderAbsTbl();
};

window.setAbsen = function (anggotaId, status) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat mengubah presensi!');

  const tgl = document.getElementById('abs-tgl').value;
  const absensi = DB.get('absensi') || [];
  const anggota = DB.get('anggota') || [];
  const an = anggota.find(a => a.id === anggotaId);

  const idx = absensi.findIndex(a => a.anggotaId === anggotaId && a.tanggal === tgl);
  if (idx >= 0) {
    absensi[idx].status = status;
  } else {
    absensi.push({ id: Date.now(), tanggal: tgl, anggotaId, status });
  }
  DB.set('absensi', absensi);

  if (an) {
    logActivity('ABSENSI', `Presensi ${an.nama} ditandai sebagai "${status}"`, `Tanggal: ${tgl}`);
  }

  if (window.renderAbsTbl) renderAbsTbl();
};

pages.jadwal = function (m) {
  function render() {
    const list = DB.get('upacara') || [];
    const container = document.getElementById('upacara-list-view');

    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>Belum ada jadwal jaga upacara / kegiatan</div>';
      return;
    }

    const anggotaList = DB.get('anggota') || [];
    const editable = canEdit();

    container.innerHTML = list.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(u => {
      let totalPetugas = 0;
      let totA10 = 0;
      let totA11 = 0;
      let totCowo = 0;
      let totCewe = 0;

      (u.titikJaga || []).forEach(t => {
        (t.anggota || []).forEach(nama => {
          totalPetugas++;
          const ang = anggotaList.find(a => a.nama === nama);
          if (ang?.angkatan === '11') totA11++;
          else totA10++;
          if (ang?.jk === 'P') totCewe++;
          else totCowo++;
        });
      });

      const editActionsHtml = editable ? `
        <button class="btn btn-action-edit" onclick="openModalUpacara(${u.id})">
          <i class="ti ti-edit"></i> Ubah
        </button>
        <button class="btn btn-action-delete" onclick="delUpacara(${u.id})">
          <i class="ti ti-trash"></i> Hapus
        </button>` : '';

      return `
      <div class="jadwal-card">
        <div class="jadwal-card-header">
          <div>
            <div class="jadwal-title">🚩 ${u.nama}</div>
            <div class="jadwal-meta">${fmt(u.tanggal)} • ${u.titikJaga.length} Pos Jaga • ${totalPetugas} Petugas Bertugas</div>
            <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
              <span class="badge badge-a10">⭐ A10: ${totA10}</span>
              <span class="badge badge-a11">🌟 A11: ${totA11}</span>
              <span class="badge badge-cowo">👦 ${totCowo} Cowo</span>
              <span class="badge badge-cewe">👧 ${totCewe} Cewe</span>
            </div>
          </div>

          <!-- Action buttons (Salin Teks, Kirim WA, Ubah, Hapus) -->
          <div class="jadwal-actions">
            <button class="btn btn-copy" onclick="salinTeksJadwal(${u.id})">
              <i class="ti ti-copy"></i> Salin Teks
            </button>
            <button class="btn btn-wa" onclick="kirimWaJadwal(${u.id})">
              <i class="ti ti-brand-whatsapp"></i> Kirim ke WA
            </button>
            ${editActionsHtml}
          </div>
        </div>

        <div class="jadwal-table-wrap">
          <table class="jadwal-table">
            <thead>
              <tr>
                <th style="width:36%">POS / TITIK JAGA (MAKS 7 ORANG)</th>
                <th>PETUGAS YANG DITUGASKAN</th>
              </tr>
            </thead>
            <tbody>
              ${u.titikJaga.map(t => {
        const arr = t.anggota || [];
        const count = arr.length;
        const posA10 = arr.filter(n => (anggotaList.find(a => a.nama === n)?.angkatan === '10')).length;
        const posA11 = arr.filter(n => (anggotaList.find(a => a.nama === n)?.angkatan === '11')).length;
        const posCowo = arr.filter(n => (anggotaList.find(a => a.nama === n)?.jk !== 'P')).length;
        const posCewe = arr.filter(n => (anggotaList.find(a => a.nama === n)?.jk === 'P')).length;

        const capClass = count >= 7 ? 'full' : count > 0 ? 'available' : 'empty';
        const capLabel = count >= 7 ? `🔒 ${count}/7 (Penuh)` : `${count}/7 Petugas`;

        const chips = arr.map(nama => {
          const ang = anggotaList.find(a => a.nama === nama);
          const isCewe = ang?.jk === 'P';
          const isA10 = ang?.angkatan === '10';
          const icon = isCewe ? '👧' : '👦';
          const cls = isCewe ? 'cewe' : 'cowo';
          const angTag = isA10
            ? `<span class="chip-tag a10">A10</span>`
            : `<span class="chip-tag a11">A11</span>`;
          const kls = ang?.kelas ? `(${ang.kelas})` : '';

          return `
                  <span class="petugas-chip ${cls}">
                    <span>${icon}</span>
                    <span>${nama}</span>
                    ${angTag}
                    ${kls ? `<span style="font-size:11px;opacity:0.8">${kls}</span>` : ''}
                  </span>`;
        }).join('');

        return `
                <tr>
                  <td>
                    <div class="pos-title-label">
                      📍 <span>${t.pos}</span>
                      <span class="pos-capacity-badge ${capClass}">${capLabel}</span>
                    </div>
                    ${count > 0 ? `
                    <div class="pos-comp-bar">
                      <span class="pos-comp-pill">⭐ A10: ${posA10}</span>
                      <span class="pos-comp-pill">🌟 A11: ${posA11}</span>
                      <span class="pos-comp-pill">👦 ${posCowo} Cowo</span>
                      <span class="pos-comp-pill">👧 ${posCewe} Cewe</span>
                    </div>` : ''}
                  </td>
                  <td>
                    <div class="petugas-chips-wrap">
                      ${chips || '<span style="color:var(--text3);font-size:12px;font-style:italic">Belum ada petugas ditugaskan</span>'}
                    </div>
                  </td>
                </tr>`;
      }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }).join('');
  }

  const editable = canEdit();

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Jadwal Jaga</h1>
      <div class="page-subtitle">Penempatan petugas jaga pos upacara bendera & kegiatan (maksimal 7 personil per pos)</div>
    </div>
    ${editable ? `
    <div style="display:flex;gap:8px">
      <button class="btn-header-add" onclick="openModalUpacara()">
        <i class="ti ti-plus"></i> Tambah Jadwal Jaga
      </button>
    </div>` : ''}
  </div>

  <div id="upacara-list-view"></div>`;

  window.renderJadwalView = render;
  render();
};

function generateJadwalWaText(u) {
  const anggotaList = DB.get('anggota') || [];
  let text = `*JADWAL JAGA UPACARA / UKS PMR*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🚩 *Kegiatan:* ${u.nama}\n`;
  text += `📅 *Tanggal:* ${fmt(u.tanggal)}\n`;
  if (u.keterangan) text += ` *Keterangan:* ${u.keterangan}\n`;
  text += `\n📍 *PEMBAGIAN TITIK & POS JAGA (Maks 7 Orang/Pos):*\n`;

  let totalPetugas = 0;
  let totA10 = 0;
  let totA11 = 0;
  let totCowo = 0;
  let totCewe = 0;

  (u.titikJaga || []).forEach((t, i) => {
    const arr = t.anggota || [];
    const count = arr.length;
    text += `\n*${i + 1}. Pos: ${t.pos}* (${count}/7 Orang)\n`;
    if (arr.length > 0) {
      arr.forEach(nama => {
        totalPetugas++;
        const ang = anggotaList.find(a => a.nama === nama);
        const isCewe = ang?.jk === 'P';
        const isA10 = ang?.angkatan === '10';
        const icon = isCewe ? '👧' : '👦';
        const jkLabel = isCewe ? 'Cewe' : 'Cowo';
        const angLabel = isA10 ? 'A10' : 'A11';
        const kls = ang?.kelas ? ` - ${ang.kelas}` : '';

        if (isA10) totA10++; else totA11++;
        if (isCewe) totCewe++; else totCowo++;

        text += `   • ${icon} ${nama} [${angLabel} • ${jkLabel}${kls}]\n`;
      });
    } else {
      text += `   • _(Belum ada petugas ditugaskan)_\n`;
    }
  });

  text += `\n📊 *REKAPITULASI PETUGAS:*\n`;
  text += `• Total: ${totalPetugas} Petugas Bertugas\n`;
  text += `• Angkatan: A10 (${totA10}) | A11 (${totA11})\n`;
  text += `• Gender: ${totCowo} Cowo |  ${totCewe} Cewe\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Harap hadir tepat waktu dan menggunakan seragam PMR lengkap. Semangat bertugas!_ 💪✨`;
  return text;
}

window.salinTeksJadwal = function (id) {
  const u = (DB.get('upacara') || []).find(x => x.id === id);
  if (!u) return toast('Data jadwal tidak ditemukan!');

  const text = generateJadwalWaText(u);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast('📋 Teks jadwal berhasil disalin! Siap ditempel di WhatsApp.');
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
};

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  toast('📋 Teks jadwal berhasil disalin!');
}

window.kirimWaJadwal = function (id) {
  const u = (DB.get('upacara') || []).find(x => x.id === id);
  if (!u) return toast('Data jadwal tidak ditemukan!');

  const text = generateJadwalWaText(u);
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  toast('📲 Membuka WhatsApp...');
};

window._upacaraPosData = [];

window.openModalUpacara = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat mengatur jadwal jaga!');

  const list = DB.get('upacara') || [];
  const editItem = editId ? list.find(x => x.id === editId) : null;

  window._upacaraPosData = editItem?.titikJaga && editItem.titikJaga.length
    ? JSON.parse(JSON.stringify(editItem.titikJaga)).map(t => ({
      pos: t.pos || '',
      anggota: Array.isArray(t.anggota) ? t.anggota : [],
      filter: 'all'
    }))
    : [{ pos: 'Lapangan Utama (Depan Tiang)', anggota: [], filter: 'all' }];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-upacara';
  overlay.innerHTML = `
  <div class="modal" style="max-width:680px">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-flag" style="color:var(--primary)"></i> ${editItem ? 'Ubah Jadwal Jaga Upacara' : 'Tambah Jadwal Jaga Upacara'}</div>
        <div class="modal-sub">Atur agenda upacara, bagi titik pos & pilih petugas (maksimal 7 orang per pos)</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-upacara').remove()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Tanggal Upacara</label><input type="date" id="m-up-tgl" value="${editItem?.tanggal || today()}"></div>
      <div class="form-group" style="flex:2"><label>Nama Kegiatan</label><input type="text" id="m-up-nama" placeholder="cth: Upacara Bendera Hari Senin" value="${editItem?.nama || ''}"></div>
    </div>
    <div class="form-group" style="margin-bottom:14px"><label>Keterangan</label><input type="text" id="m-up-ket" placeholder="cth: Penempatan petugas jaga upacara bendera" value="${editItem?.keterangan || ''}"></div>

    <div style="font-weight:800;font-size:13px;color:var(--text);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <span style="display:flex;align-items:center;gap:6px">
        <i class="ti ti-map-pin" style="color:var(--primary)"></i> Pembagian Pos & Petugas
      </span>
      <span style="font-size:11px;color:var(--text3);font-weight:700">Maksimal 7 petugas per pos</span>
    </div>

    <div id="m-titik-builder"></div>

    <datalist id="pos-template-options">
      ${(DB.get('titik_jaga_template') || []).map(t => `<option value="${t}"></option>`).join('')}
    </datalist>

    <button class="btn btn-ghost btn-sm" onclick="addModalTitikRow()" style="margin-bottom:16px;width:100%;border-style:dashed">
      <i class="ti ti-plus"></i> Tambah Pos Jaga Baru
    </button>

    <div class="btn-row" style="justify-content:flex-end">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-upacara').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveModalUpacara(${editId || 0})">
        <i class="ti ti-device-floppy"></i> ${editItem ? 'Perbarui Jadwal' : 'Simpan Jadwal Jaga'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  renderModalTitikRows();
};

window.renderModalTitikRows = function () {
  const container = document.getElementById('m-titik-builder');
  if (!container) return;

  const anggotaList = DB.get('anggota') || [];

  container.innerHTML = window._upacaraPosData.map((t, idx) => {
    const arr = t.anggota || [];
    const count = arr.length;

    const posA10 = arr.filter(n => (anggotaList.find(a => a.nama === n)?.angkatan === '10')).length;
    const posA11 = arr.filter(n => (anggotaList.find(a => a.nama === n)?.angkatan === '11')).length;
    const posCowo = arr.filter(n => (anggotaList.find(a => a.nama === n)?.jk !== 'P')).length;
    const posCewe = arr.filter(n => (anggotaList.find(a => a.nama === n)?.jk === 'P')).length;

    const capClass = count > 7 ? 'overflow' : count === 7 ? 'full' : count > 0 ? 'available' : 'empty';
    const capLabel = count > 7 ? `⚠️ ${count}/7 Petugas (Kelebihan!)` : count === 7 ? `🔒 7/7 Petugas (Pos Penuh)` : `${count}/7 Petugas`;


    const curFilter = t.filter || 'all';
    let availableList = anggotaList;
    if (curFilter === '10') availableList = availableList.filter(a => a.angkatan === '10');
    else if (curFilter === '11') availableList = availableList.filter(a => a.angkatan === '11');
    else if (curFilter === 'cowo') availableList = availableList.filter(a => a.jk !== 'P');
    else if (curFilter === 'cewe') availableList = availableList.filter(a => a.jk === 'P');


    const selectedChipsHtml = arr.map(nama => {
      const ang = anggotaList.find(a => a.nama === nama);
      const isCewe = ang?.jk === 'P';
      const isA10 = ang?.angkatan === '10';
      const icon = isCewe ? '👧' : '👦';
      const cls = isCewe ? 'cewe' : 'cowo';
      const angLabel = isA10 ? 'A10' : 'A11';

      return `
      <span class="pos-active-chip ${cls}">
        <span>${icon}</span>
        <span>${nama}</span>
        <span class="chip-tag ${isA10 ? 'a10' : 'a11'}">${angLabel}</span>
        <button class="btn-del-chip" type="button" onclick="removeMemberFromPos(${idx}, '${escapeHtml(nama)}')" title="Hapus dari pos ini">✕</button>
      </span>`;
    }).join('');


    const pickerPillsHtml = availableList.map(a => {
      const isSelected = arr.includes(a.nama);
      const isCewe = a.jk === 'P';
      const isA10 = a.angkatan === '10';
      const icon = isCewe ? '👧' : '👦';
      const cls = isCewe ? 'cewe' : 'cowo';
      const angLabel = isA10 ? 'A10' : 'A11';

      if (isSelected) {
        return `
        <span class="picker-member-pill selected" title="Sudah dipilih">
          ${icon} ${a.nama} (${angLabel}) ✓
        </span>`;
      } else {
        return `
        <span class="picker-member-pill ${cls}" onclick="addMemberToPos(${idx}, '${escapeHtml(a.nama)}')" title="Klik untuk menugaskan">
          + ${icon} ${a.nama} (${angLabel} • ${a.kelas || '-'})
        </span>`;
      }
    }).join('');

    return `
    <div class="m-titik-box">
      <div class="form-row" style="margin-bottom:8px;align-items:center">
        <div class="form-group" style="flex:2">
          <label>Nama Pos / Titik Jaga</label>
          <input type="text" class="m-titik-pos" placeholder="cth: Lapangan Utama (Depan Tiang)" value="${escapeHtml(t.pos)}" list="pos-template-options" oninput="updatePosName(${idx}, this.value)">
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <label>&nbsp;</label>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="pos-capacity-badge ${capClass}">${capLabel}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteModalTitikRow(${idx})" title="Hapus pos ini"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>

      <!-- Active Assigned Chips -->
      <div style="font-size:11px;font-weight:800;color:var(--text2);margin-bottom:4px;display:flex;justify-content:space-between">
        <span>Petugas Ditugaskan (${count}/7):</span>
        ${count > 0 ? `<span style="color:var(--text3)">⭐ A10: ${posA10} | 🌟 A11: ${posA11} | 👦 ${posCowo} Cowo | 👧 ${posCewe} Cewe</span>` : ''}
      </div>
      <div class="pos-active-chips-wrap">
        ${selectedChipsHtml || '<span style="color:var(--text3);font-size:11.5px;font-style:italic">Belum ada petugas. Klik nama anggota di bawah untuk menambahkan.</span>'}
      </div>

      <!-- Member Picker with Filter Tabs -->
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px">
          <span style="font-size:11px;font-weight:800;color:var(--text2)">+ Tambah Petugas (Klik Nama):</span>
          <div style="display:flex;gap:3px">
            <button type="button" class="picker-filter-btn ${curFilter === 'all' ? 'active' : ''}" onclick="filterPosPicker(${idx}, 'all')">Semua</button>
            <button type="button" class="picker-filter-btn ${curFilter === '10' ? 'active' : ''}" onclick="filterPosPicker(${idx}, '10')">A10</button>
            <button type="button" class="picker-filter-btn ${curFilter === '11' ? 'active' : ''}" onclick="filterPosPicker(${idx}, '11')">A11</button>
            <button type="button" class="picker-filter-btn ${curFilter === 'cowo' ? 'active' : ''}" onclick="filterPosPicker(${idx}, 'cowo')">👦 Cowo</button>
            <button type="button" class="picker-filter-btn ${curFilter === 'cewe' ? 'active' : ''}" onclick="filterPosPicker(${idx}, 'cewe')">👧 Cewe</button>
          </div>
        </div>
        <div class="pos-quick-picker">
          ${pickerPillsHtml}
        </div>
      </div>
    </div>`;
  }).join('');
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

window.updatePosName = function (idx, val) {
  if (window._upacaraPosData[idx]) {
    window._upacaraPosData[idx].pos = val;
  }
};

window.addMemberToPos = function (idx, memberName) {
  if (!window._upacaraPosData[idx]) return;
  if (!window._upacaraPosData[idx].anggota) window._upacaraPosData[idx].anggota = [];

  if (window._upacaraPosData[idx].anggota.length >= 7) {
    return toast('⚠️ Pos ini sudah mencapai batas maksimal 7 petugas!');
  }
  if (!window._upacaraPosData[idx].anggota.includes(memberName)) {
    window._upacaraPosData[idx].anggota.push(memberName);
    renderModalTitikRows();
  }
};

window.removeMemberFromPos = function (idx, memberName) {
  if (!window._upacaraPosData[idx]) return;
  window._upacaraPosData[idx].anggota = (window._upacaraPosData[idx].anggota || []).filter(n => n !== memberName);
  renderModalTitikRows();
};

window.addModalTitikRow = function () {
  window._upacaraPosData.push({ pos: '', anggota: [], filter: 'all' });
  renderModalTitikRows();
};

window.deleteModalTitikRow = function (idx) {
  if (window._upacaraPosData.length <= 1) {
    window._upacaraPosData = [{ pos: '', anggota: [], filter: 'all' }];
  } else {
    window._upacaraPosData.splice(idx, 1);
  }
  renderModalTitikRows();
};

window.filterPosPicker = function (idx, filterType) {
  if (window._upacaraPosData[idx]) {
    window._upacaraPosData[idx].filter = filterType;
    renderModalTitikRows();
  }
};

window.saveModalUpacara = function (editId) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menyimpan jadwal jaga!');

  const nama = document.getElementById('m-up-nama').value.trim();
  if (!nama) return toast('Nama kegiatan upacara wajib diisi!');

  const overLimit = window._upacaraPosData.find(p => (p.anggota || []).length > 7);
  if (overLimit) {
    return toast(`⚠️ Pos "${overLimit.pos || 'Tanpa Nama'}" melebihi batas maksimal 7 petugas!`);
  }

  const titikJaga = window._upacaraPosData
    .filter(p => p.pos && p.pos.trim())
    .map(p => ({
      pos: p.pos.trim(),
      anggota: p.anggota || []
    }));

  if (!titikJaga.length) {
    return toast('Tambahkan minimal 1 pos jaga beserta namanya!');
  }

  const list = DB.get('upacara') || [];
  const tgl = document.getElementById('m-up-tgl').value;
  const ket = document.getElementById('m-up-ket').value.trim();

  if (editId) {
    const item = list.find(x => x.id === editId);
    if (item) {
      item.tanggal = tgl;
      item.nama = nama;
      item.keterangan = ket;
      item.titikJaga = titikJaga;
      logActivity('UBAH', `Mengubah jadwal jaga pos: ${nama}`, `Tanggal: ${fmt(tgl)} | ${titikJaga.length} Pos Jaga`);
    }
  } else {
    list.push({
      id: Date.now(),
      tanggal: tgl,
      nama,
      keterangan: ket,
      titikJaga
    });
    logActivity('TAMBAH', `Membuat jadwal jaga pos baru: ${nama}`, `Tanggal: ${fmt(tgl)} | ${titikJaga.length} Pos Jaga`);
  }

  DB.set('upacara', list);
  document.getElementById('modal-upacara')?.remove();
  if (window.renderJadwalView) renderJadwalView();
  toast(`✅ Jadwal jaga berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delUpacara = function (id) {
  if (!canEdit()) return toast('⚠️ Akses ditolak: Hanya pengurus yang dapat menghapus jadwal jaga!');

  const list = DB.get('upacara') || [];
  const item = list.find(u => u.id === id);
  if (!confirm(`Hapus jadwal jaga ${item?.nama || ''}?`)) return;

  DB.set('upacara', list.filter(u => u.id !== id));
  logActivity('HAPUS', `Menghapus jadwal jaga pos: ${item?.nama || 'Jadwal'}`, `Tanggal: ${fmt(item?.tanggal)}`);
  if (window.renderJadwalView) renderJadwalView();
  toast('Jadwal upacara dihapus 🗑️');
};


let currentLaporanTab = 'medis'; 
let currentLogTypeFilter = 'all';

pages.laporan = function (m) {
  const pasien = DB.get('pasien') || [];
  const stok = DB.get('stok') || [];
  const absensi = DB.get('absensi') || [];
  const anggota = DB.get('anggota') || [];
  const logs = DB.get('logs') || [];

  const a10 = anggota.filter(a => a.angkatan === '10').length;
  const a11 = anggota.filter(a => a.angkatan === '11').length;
  const totalHadir = absensi.filter(a => a.status === 'Hadir').length;
  const totalAlpha = absensi.filter(a => a.status === 'Alpha').length;
  const dirujuk = pasien.filter(p => p.status === 'Dirujuk').length;

  const keluhanMap = {};
  pasien.forEach(p => {
    const k = (p.keluhan || '').toLowerCase().split(/[,;.]/)[0].trim();
    if (k) keluhanMap[k] = (keluhanMap[k] || 0) + 1;
  });
  const topKeluhan = Object.entries(keluhanMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const leader = isLeader();

  function renderView() {
    const contentBox = document.getElementById('laporan-tab-content');
    if (!contentBox) return;

    if (currentLaporanTab === 'medis') {
      contentBox.innerHTML = `
      <div class="grid4" style="margin-bottom:20px">
        <div class="stat">
          <div class="stat-label">🏥 Total Pasien</div>
          <div class="stat-val">${pasien.length}</div>
          <div class="stat-sub">${dirujuk} pasien dirujuk ke RS/Puskesmas</div>
          <span class="stat-icon">🩺</span>
        </div>
        <div class="stat">
          <div class="stat-label">✅ Total Presensi Hadir</div>
          <div class="stat-val">${totalHadir}</div>
          <div class="stat-sub">${totalAlpha} catatan alpha</div>
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat">
          <div class="stat-label">💊 Item Persediaan</div>
          <div class="stat-val">${stok.length}</div>
          <div class="stat-sub">${stok.filter(s => s.jumlah <= s.min).length} item berstatus kritis</div>
          <span class="stat-icon">💉</span>
        </div>
        <div class="stat">
          <div class="stat-label">👥 Personil Anggota</div>
          <div class="stat-val">${anggota.length}</div>
          <div class="stat-sub">A10: ${a10} orang | A11: ${a11} orang</div>
          <span class="stat-icon">⭐</span>
        </div>
      </div>

      <div class="grid2">
        <div class="card">
          <div class="card-title"><i class="ti ti-chart-bar"></i>Keluhan Penyakit Terbanyak</div>
          ${topKeluhan.length
          ? topKeluhan.map(([k, v]) => {
            const pct = Math.round((v / Math.max(pasien.length, 1)) * 100);
            return `<div style="margin-bottom:12px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                    <span style="font-size:13.5px;text-transform:capitalize;font-weight:800">${k}</span>
                    <span style="font-size:12px;color:var(--text2);font-weight:700">${v} kali (${pct}%)</span>
                  </div>
                  <div class="progress-bar" style="height:8px">
                    <div class="progress-fill" style="width:${pct}%"></div>
                  </div>
                </div>`;
          }).join('')
          : '<div class="empty"><i class="ti ti-chart-off"></i>Belum ada data pasien</div>'}
        </div>

        <div class="card">
          <div class="card-title"><i class="ti ti-package"></i>Kondisi Stok Obat & Alat</div>
          ${stok.map(s => {
            const pct = Math.min(100, Math.round((s.jumlah / Math.max(s.min * 2, 1)) * 100));
            const cls = s.jumlah <= s.min ? '' : 'green';
            return `<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12.5px;font-weight:700">${s.nama}</span>
                <span style="font-size:12px;color:var(--text2);font-weight:800">${s.jumlah} ${s.satuan}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
            </div>`;
          }).join('') || '<div class="empty"><i class="ti ti-package-off"></i>Belum ada data stok</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-title"><i class="ti ti-clipboard-list"></i>Log Lengkap Pasien UKS</div>
        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>NAMA LENGKAP</th>
                <th>KELAS</th>
                <th>KELUHAN</th>
                <th>TINDAKAN / TERAPI</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${pasien.slice().reverse().map(p => `
              <tr>
                <td>${fmt(p.tanggal)}</td>
                <td><strong>${p.nama}</strong></td>
                <td>${p.kelas}</td>
                <td>${p.keluhan}</td>
                <td>${p.tindakan}</td>
                <td><span class="badge ${p.status === 'Sembuh' ? 'badge-green' : p.status === 'Dirujuk' ? 'badge-amber' : 'badge-red'}">${p.status}</span></td>
              </tr>`).join('') || '<tr><td colspan="6"><div class="empty">Belum ada catatan medis</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    } else if (currentLaporanTab === 'audit_logs') {
      let filteredLogs = logs;
      if (currentLogTypeFilter !== 'all') {
        filteredLogs = filteredLogs.filter(l => l.tipe.toLowerCase() === currentLogTypeFilter.toLowerCase());
      }

      contentBox.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div>
            <div class="card-title" style="margin:0"><i class="ti ti-activity"></i>Log Aktivitas & Audit Personil (Khusus Ketua & Koordinator)</div>
            <div style="font-size:12px;color:var(--text3);margin-top:2px">Catatan login, pengubahan data, dan aktivitas anggota real-time</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:11px;color:var(--text2);font-weight:800">FILTER TIPE:</label>
            <select onchange="changeLogFilter(this.value)" style="width:160px;padding:6px 10px;font-size:12px">
              <option value="all" ${currentLogTypeFilter === 'all' ? 'selected' : ''}>Semua Aktivitas</option>
              <option value="login" ${currentLogTypeFilter === 'login' ? 'selected' : ''}>🔐 Login</option>
              <option value="tambah" ${currentLogTypeFilter === 'tambah' ? 'selected' : ''}>➕ Penambahan Data</option>
              <option value="ubah" ${currentLogTypeFilter === 'ubah' ? 'selected' : ''}>✏️ Pengubahan Data</option>
              <option value="hapus" ${currentLogTypeFilter === 'hapus' ? 'selected' : ''}>🗑️ Penghapusan Data</option>
              <option value="ganti_password" ${currentLogTypeFilter === 'ganti_password' ? 'selected' : ''}>🔑 Pergantian Password</option>
              <option value="absensi" ${currentLogTypeFilter === 'absensi' ? 'selected' : ''}>📋 Presensi / Absensi</option>
            </select>
          </div>
        </div>

        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>TIPE</th>
                <th>PELAKU & JABATAN</th>
                <th>NIS</th>
                <th>AKTIVITAS</th>
                <th>DETAIL PERUBAHAN</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.length ? filteredLogs.map(l => `
              <tr>
                <td style="font-size:11.5px;color:var(--text2);white-space:nowrap">${l.waktu}</td>
                <td><span class="log-badge ${l.tipe.toLowerCase()}">${l.tipe}</span></td>
                <td>
                  <strong>${l.pelaku}</strong>
                  <div style="font-size:11px;color:var(--primary);font-weight:700">${l.jabatan}</div>
                </td>
                <td><span class="badge-nis">${l.nis}</span></td>
                <td style="font-weight:700">${l.pesan}</td>
                <td>
                  ${l.detail ? `<div class="log-detail-box">${escapeHtml(l.detail)}</div>` : '-'}
                </td>
              </tr>`).join('') : '<tr><td colspan="6"><div class="empty">Tidak ada log pada filter ini</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    } else if (currentLaporanTab === 'passwords') {
      contentBox.innerHTML = `
      <div class="card">
        <div class="card-title"><i class="ti ti-shield-lock"></i>Monitoring Kata Sandi Akun Anggota (Khusus Ketua & Koordinator)</div>
        <div style="font-size:12.5px;color:var(--text2);margin-bottom:16px">
          Sesuai ketentuan, password default anggota adalah <strong>NIS</strong>. Jika ada anggota yang telah mengubah kata sandinya, Ketua & Koordinator dapat memantau kata sandi baru tersebut di bawah ini:
        </div>

        <div class="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>NAMA LENGKAP</th>
                <th>NIS</th>
                <th>JABATAN</th>
                <th>ANGKATAN</th>
                <th>STATUS KATA SANDI</th>
                <th>KATA SANDI AKTIF</th>
              </tr>
            </thead>
            <tbody>
              ${anggota.map(a => {
        const isCustom = a.password && a.password.trim() !== '';
        const activePassword = isCustom ? a.password : a.nis;
        return `
                <tr>
                  <td><strong>${a.nama}</strong></td>
                  <td><span class="badge-nis">${a.nis}</span></td>
                  <td><span class="badge-jabatan">${a.jabatan || 'Anggota'}</span></td>
                  <td><span class="${a.angkatan === '10' ? 'badge-a10' : 'badge-a11'}">Angkatan ${a.angkatan}</span></td>
                  <td>
                    ${isCustom
            ? `<span class="badge-pwd-custom"><i class="ti ti-lock-check"></i> Telah Diubah (Kustom)</span>`
            : `<span class="badge-pwd-default"><i class="ti ti-key"></i> Bawaan (Sama dengan NIS)</span>`}
                  </td>
                  <td>
                    <span style="font-weight:800;font-family:monospace;font-size:13px;color:var(--primary-dark)">
                      <span id="pwd-report-${a.id}">••••••</span>
                      <button class="pwd-peek-btn" onclick="toggleReportPwdPeek(${a.id}, '${escapeHtml(activePassword)}')" title="Tampilkan / Sembunyikan Sandi">👁️</button>
                    </span>
                  </td>
                </tr>`;
      }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }
  }

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Laporan & Rekapitulasi</h1>
      <div class="page-subtitle">Ringkasan pelayanan medis, presensi, dan audit sistem UKS</div>
    </div>
    <button class="btn btn-ghost" onclick="window.print()"><i class="ti ti-printer"></i>Cetak Laporan</button>
  </div>

  ${leader ? `
  <div class="tab-row" style="margin-bottom:18px">
    <button class="tab-btn ${currentLaporanTab === 'medis' ? 'active' : ''}" id="tab-lap-medis" onclick="switchLaporanTab('medis')">
      📊 Rekap Medis & Pasien
    </button>
    <button class="tab-btn ${currentLaporanTab === 'audit_logs' ? 'active' : ''}" id="tab-lap-logs" onclick="switchLaporanTab('audit_logs')">
      📋 Log Aktivitas & Audit (${logs.length})
    </button>
    <button class="tab-btn ${currentLaporanTab === 'passwords' ? 'active' : ''}" id="tab-lap-pwd" onclick="switchLaporanTab('passwords')">
      🔑 Monitoring Kata Sandi Anggota
    </button>
  </div>` : ''}

  <div id="laporan-tab-content"></div>`;

  window.renderLaporanView = renderView;
  renderView();
};

window.switchLaporanTab = function (tab) {
  currentLaporanTab = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-lap-' + (tab === 'audit_logs' ? 'logs' : tab === 'passwords' ? 'pwd' : 'medis'));
  if (btn) btn.classList.add('active');
  if (window.renderLaporanView) renderLaporanView();
};

window.changeLogFilter = function (type) {
  currentLogTypeFilter = type;
  if (window.renderLaporanView) renderLaporanView();
};

window.toggleReportPwdPeek = function (id, pwdVal) {
  const el = document.getElementById('pwd-report-' + id);
  if (!el) return;
  if (el.textContent === '••••••') {
    el.textContent = pwdVal;
  } else {
    el.textContent = '••••••';
  }
};


document.addEventListener('DOMContentLoaded', () => {
  renderAppLayout();
});
