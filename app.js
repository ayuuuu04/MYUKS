
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

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
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
    if (!this.get(k)) this.set(k, v);
  }
};

// =====================
//   DEFAULT DATA
// =====================
DB.def('anggota', [
  { id: 1, nama: 'Admin PMR', nis: '12345', jabatan: 'Ketua', kelas: 'UKS', angkatan: '10', jk: 'L', password: '' },
  { id: 2, nama: 'Afnan Fauzan Faturochim', nis: '1001', jabatan: 'Ketua', kelas: 'XI TE B', angkatan: '10', jk: 'L', password: '' },
  { id: 3, nama: 'Faizal Rahman', nis: '1002', jabatan: 'Koordinator', kelas: 'XI-B', angkatan: '10', jk: 'L', password: '' },
  { id: 4, nama: 'Galuh Ayu Palupi', nis: '1003', jabatan: 'Sekretaris', kelas: 'XI PPLG B', angkatan: '10', jk: 'P', password: '' },
  { id: 5, nama: 'Nisa Amalia', nis: '1101', jabatan: 'Anggota', kelas: 'XI-A', angkatan: '11', jk: 'P', password: '' },
  { id: 6, nama: 'Rizki Aditya', nis: '1102', jabatan: 'Komandan Lapangan', kelas: 'X-C', angkatan: '11', jk: 'L', password: '' }
]);

// Auto-migration to ensure all anggota have 'jk' (Jenis Kelamin: L = Cowo, P = Cewe)
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
  } catch(e) {
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

DB.def('jadwal', [
  { id: 1, hari: 'Senin', sesi: '07:00-10:00', anggota: 'Afnan Fauzan Faturochim', lokasi: 'UKS' },
  { id: 2, hari: 'Senin', sesi: '10:00-13:00', anggota: 'Faizal Rahman', lokasi: 'UKS' },
  { id: 3, hari: 'Selasa', sesi: '07:00-10:00', anggota: 'Galuh Ayu Palupi', lokasi: 'UKS' },
  { id: 4, hari: 'Rabu', sesi: '10:00-13:00', anggota: 'Nisa Amalia', lokasi: 'UKS' },
  { id: 5, hari: 'Kamis', sesi: '07:00-10:00', anggota: 'Rizki Aditya', lokasi: 'UKS' }
]);

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

// =====================
//   FIREBASE REALTIME & SYNC
// =====================
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

// Firebase Modal
window.openFbModal = function() {
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
      <div class="form-group"><label>API Key</label><input id="fb-apikey" placeholder="AIzaSy..." value="${saved.apiKey||''}"></div>
      <div class="form-group"><label>Project ID</label><input id="fb-projectid" placeholder="sijaga-uks" value="${saved.projectId||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Auth Domain</label><input id="fb-authdomain" placeholder="sijaga-uks.firebaseapp.com" value="${saved.authDomain||''}"></div>
      <div class="form-group"><label>App ID</label><input id="fb-appid" placeholder="1:xxx:web:xxx" value="${saved.appId||''}"></div>
    </div>
    <div class="btn-row" style="margin-top:14px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="document.getElementById('fb-modal').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveFbConfig()"><i class="ti ti-check"></i>Simpan & Hubungkan</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveFbConfig = function() {
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

// =====================
//   AUTHENTICATION & SESSION
// =====================
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

window.handleLogin = function(e) {
  if (e) e.preventDefault();
  const unameInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');

  const username = unameInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    showLoginError('Harap isi Nama / Username dan Password!');
    return;
  }

  // 1. Cek Admin
  if (username.toLowerCase() === 'admin' && password === '123456') {
    const adminUser = {
      role: 'admin',
      nama: 'Administrator',
      username: 'admin',
      angkatan: 'Admin'
    };
    setSession(adminUser);
    renderAppLayout();
    toast('👋 Selamat datang, Admin!');
    return;
  }

  // 2. Cek Anggota
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
      renderAppLayout();
      toast(`👋 Selamat datang, ${found.nama}!`);
      return;
    } else {
      showLoginError('Password salah! Password default anggota adalah NIS masing-masing.');
      return;
    }
  }

  showLoginError('Nama / Akun tidak ditemukan! Silakan periksa kembali atau hubungi Admin.');
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

window.fillQuickLogin = function(uname, pass) {
  const u = document.getElementById('login-username');
  const p = document.getElementById('login-password');
  if (u && p) {
    u.value = uname;
    p.value = pass;
    handleLogin();
  }
};

window.logout = function() {
  if (!confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) return;
  setSession(null);
  renderAppLayout();
  toast('Anda telah logout');
};

// Ganti Password Modal
window.openChangePasswordModal = function(targetMemberId) {
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
        <div class="modal-sub">${targetMember ? `NIS: ${targetMember.nis} | Angkatan ${targetMember.angkatan}` : 'Atur password baru'}</div>
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

window.saveNewPassword = function(memberId, isSelf) {
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

  member.password = pwdNew;
  DB.set('anggota', list);
  document.getElementById('pwd-modal')?.remove();
  toast('✅ Password berhasil diperbarui!');
};

// =====================
//   UTILITIES & HELPERS
// =====================
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
  const jadwal = DB.get('jadwal') || [];
  
  let count = 0;
  // Hitung di upacara
  upacara.forEach(u => {
    (u.titikJaga || []).forEach(t => {
      if ((t.anggota || []).includes(memberName)) count++;
    });
  });
  // Hitung di piket
  jadwal.forEach(j => {
    if (j.anggota === memberName) count++;
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

// =====================
//   LAYOUT RENDERER
// =====================
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
      <div class="login-subtitle">Aplikasi Manajemen Palang Merah Remaja (PMR)</div>
    </div>

    <form onsubmit="handleLogin(event)">
      <div class="form-group" style="margin-bottom:14px">
        <label>Nama Lengkap / Username</label>
        <input type="text" id="login-username" placeholder="cth: Afnan Fauzan atau admin" autocomplete="username" required>
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Password</label>
        <input type="password" id="login-password" placeholder="NIS Anda / password admin" autocomplete="current-password" required>
      </div>

      <div id="login-error" class="alert alert-red" style="display:none;margin-bottom:14px;padding:8px 12px;font-size:12px"></div>

      <button type="submit" class="btn btn-primary" style="width:100%;padding:11px;font-size:14px">
        <i class="ti ti-login"></i> Masuk ke Aplikasi
      </button>
    </form>

    <div class="login-hint-box">
      <strong>🔑 Panduan Login:</strong>
      <div style="margin-top:4px">
        • <strong>Admin:</strong> Username: <code>admin</code>, Password: <code>123456</code><br>
        • <strong>Anggota:</strong> Username: <em>Nama Lengkap</em>, Password: <em>NIS masing-masing</em>.
      </div>
      <div class="login-hint-list">
        <div class="login-hint-item" onclick="fillQuickLogin('admin', '123456')">
          <span>👑 <strong>Akun Admin</strong></span>
          <span style="color:var(--primary);font-weight:700">Login Cepat ➔</span>
        </div>
        ${anggotaList.slice(0, 2).map(a => `
        <div class="login-hint-item" onclick="fillQuickLogin('${a.nama}', '${a.password && a.password.trim() ? a.password : a.nis}')">
          <span>👤 ${a.nama} (A${a.angkatan})</span>
          <span style="color:var(--primary);font-weight:700">NIS: ${a.nis} ➔</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function updateHeaderUser(user) {
  // 1. Update Mobile Top Header
  const container = document.getElementById('header-user-info');
  if (container) {
    const isA10 = user.angkatan === '10';
    const roleClass = user.role === 'admin' ? 'badge-blue' : isA10 ? 'a10' : 'a11';
    const roleLabel = user.role === 'admin' ? 'Admin UKS' : `Angkatan ${user.angkatan}`;

    container.innerHTML = `
      <div class="user-header-pill">
        <i class="ti ti-user-circle" style="font-size:16px;flex-shrink:0"></i>
        <span class="user-header-name">${user.nama}</span>
        <span class="user-role-badge ${roleClass}">${roleLabel}</span>
        <button class="btn btn-ghost btn-sm" onclick="openChangePasswordModal()" title="Ganti Password" style="padding:2px 6px;color:#fff;background:rgba(255,255,255,0.18);border:none;border-radius:6px;flex-shrink:0">
          <i class="ti ti-key"></i>
        </button>
        <button class="btn btn-ghost btn-sm" onclick="logout()" title="Keluar" style="padding:2px 6px;color:#fee2e2;background:rgba(239,68,68,0.3);border:none;border-radius:6px;flex-shrink:0">
          <i class="ti ti-logout"></i>
        </button>
      </div>`;
  }

  // 2. Update Desktop Sidebar User Card
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
}

// =====================
//   ROUTER & NAVIGATION
// =====================
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
    const page = activeNav.id.replace('nav-', '');
    if (pages[page]) pages[page](document.getElementById('main-content'));
  }
}

const pages = {};

// =====================
//   PAGE 1: BERANDA / DASHBOARD
// =====================
pages.dashboard = function(m) {
  const pasien = DB.get('pasien') || [];
  const stok = DB.get('stok') || [];
  const absensi = DB.get('absensi') || [];
  const anggota = DB.get('anggota') || [];
  const jadwal = DB.get('jadwal') || [];

  const a10Count = anggota.filter(a => a.angkatan === '10').length;
  const a11Count = anggota.filter(a => a.angkatan === '11').length;
  const stokKritis = stok.filter(s => s.jumlah <= s.min);
  const todayStr = today();
  const todayAbs = absensi.filter(a => a.tanggal === todayStr);
  const hadir = todayAbs.filter(a => a.status === 'Hadir').length;

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Beranda Utama</h1>
      <div class="page-subtitle">Ringkasan aktivitas harian pelayanan & personil UKS</div>
    </div>
    <span style="font-size:12.5px;color:var(--text2);font-weight:700;background:#e2edfb;padding:7px 16px;border-radius:20px;border:1px solid var(--border)">
      📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </span>
  </div>

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
      <div class="stat-sub">dari ${anggota.length} total anggota (A10: ${a10Count}, A11: ${a11Count})</div>
      <span class="stat-icon">✅</span>
    </div>
    <div class="stat">
      <div class="stat-label">📅 Jadwal Piket</div>
      <div class="stat-val">${jadwal.length}</div>
      <div class="stat-sub">Sesi aktif terjadwal</div>
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
                <span style="font-weight:800;font-size:13.5px">${s.nama} <span class="badge ${s.kategori==='Obat'?'badge-blue':'badge-amber'}" style="font-size:10px">${s.kategori}</span></span>
                <span style="font-size:12.5px;color:var(--text2);font-weight:800">${s.jumlah} ${s.satuan}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
};

// =====================
//   PAGE 2: DATA ANGGOTA (A10 & A11) - MATCHING SCREENSHOT 1
// =====================
let currentAnggotaTab = 'all';

pages.anggota = function(m) {
  function render() {
    const list = DB.get('anggota') || [];
    const flt = (document.getElementById('srch-ang')?.value || '').toLowerCase();
    
    let filtered = list;
    if (currentAnggotaTab === '10') {
      filtered = filtered.filter(a => a.angkatan === '10');
    } else if (currentAnggotaTab === '11') {
      filtered = filtered.filter(a => a.angkatan === '11');
    }

    if (flt) {
      filtered = filtered.filter(a =>
        a.nama.toLowerCase().includes(flt) ||
        (a.nis && a.nis.toLowerCase().includes(flt)) ||
        (a.kelas && a.kelas.toLowerCase().includes(flt)) ||
        (a.jabatan && a.jabatan.toLowerCase().includes(flt))
      );
    }

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
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-action-edit" onclick="openModalAnggota(${a.id})" title="Ubah data"><i class="ti ti-edit"></i> Ubah</button>
                <button class="btn btn-action-delete" onclick="delAnggota(${a.id})" title="Hapus"><i class="ti ti-trash"></i> Hapus</button>
              </div>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="8"><div class="empty"><i class="ti ti-users"></i>Tidak ada anggota pada kategori ini</div></td></tr>`;
  }

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Data Anggota</h1>
      <div class="page-subtitle">Kelola data personil PMR, angkatan (A10/A11), dan jenis kelamin (Cowo/Cewe)</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div id="ang-gender-stats" style="display:flex;gap:6px"></div>
      <button class="btn-header-add" onclick="openModalAnggota()">
        <i class="ti ti-plus"></i> Tambah Anggota
      </button>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      <!-- Tabs (Matching Screenshot 1) -->
      <div class="tab-row" style="margin:0">
        <button class="tab-btn ${currentAnggotaTab === 'all' ? 'active' : ''}" id="tab-ang-all" onclick="switchAnggotaTab('all')">
          Semua (<span id="ang-count-all">0</span>)
        </button>
        <button class="tab-btn ${currentAnggotaTab === '10' ? 'active' : ''}" id="tab-ang-10" onclick="switchAnggotaTab('10')">
          Angkatan 10 (<span id="ang-count-10">0</span>)
        </button>
        <button class="tab-btn ${currentAnggotaTab === '11' ? 'active' : ''}" id="tab-ang-11" onclick="switchAnggotaTab('11')">
          Angkatan 11 (<span id="ang-count-11">0</span>)
        </button>
      </div>

      <input type="text" id="srch-ang" placeholder="🔍 Cari nama / NIS / kelas..." style="max-width:240px" oninput="renderAnggotaTbl()">
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

window.switchAnggotaTab = function(tab) {
  currentAnggotaTab = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-ang-' + tab);
  if (btn) btn.classList.add('active');
  if (window.renderAnggotaTbl) renderAnggotaTbl();
};

// Modal Tambah / Edit Anggota
window.openModalAnggota = function(editId) {
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
        <div style="font-weight:800;font-size:13px;color:var(--text)">🔐 Password Akun Login</div>
        <div style="font-size:11.5px;color:var(--text3);margin-top:2px">
          Pilih "Tidak" agar password otomatis menggunakan NIS, atau "Ya" untuk mengatur password baru.
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

window.toggleModalPwd = function(show) {
  const f = document.getElementById('modal-pwd-field');
  if (f) f.style.display = show ? 'block' : 'none';
};

window.saveModalAnggota = function(editId) {
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
  }

  DB.set('anggota', list);
  document.getElementById('modal-ang')?.remove();
  if (window.renderAnggotaTbl) renderAnggotaTbl();
  toast(`✅ Anggota berhasil ${editId ? 'diperbarui' : 'ditambahkan'}!`);
};

window.delAnggota = function(id) {
  if (!confirm('Hapus anggota ini dari sistem?')) return;
  DB.set('anggota', (DB.get('anggota') || []).filter(a => a.id !== id));
  if (window.renderAnggotaTbl) renderAnggotaTbl();
  toast('Anggota dihapus 🗑️');
};

// =====================
//   PAGE 3: DATA PASIEN - MATCHING SCREENSHOT 2
// =====================
pages.pasien = function(m) {
  function render() {
    const list = DB.get('pasien') || [];
    const tglFilter = document.getElementById('flt-tgl-pasien')?.value || '';
    
    let filtered = list;
    if (tglFilter) {
      filtered = filtered.filter(p => p.tanggal === tglFilter);
    }

    const tbody = document.getElementById('pasien-tbl');
    if (!tbody) return;

    tbody.innerHTML = filtered.length
      ? filtered.slice().reverse().map(p => `
        <tr>
          <td>${fmt(p.tanggal)}</td>
          <td><strong>${p.nama}</strong></td>
          <td>${p.kelas}</td>
          <td>${p.keluhan}</td>
          <td>${p.tindakan}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-action-edit" onclick="openModalPasien(${p.id})"><i class="ti ti-edit"></i> Ubah</button>
              <button class="btn btn-action-delete" onclick="delPasien(${p.id})"><i class="ti ti-trash"></i> Hapus</button>
            </div>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="6"><div class="empty"><i class="ti ti-notes-off"></i>Belum ada data kunjungan pasien</div></td></tr>`;
  }

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Data Pasien</h1>
      <div class="page-subtitle">Catatan kunjungan dan tindakan medis di UKS</div>
    </div>
    <button class="btn-header-add" onclick="openModalPasien()">
      <i class="ti ti-plus"></i> Catat Pasien Baru
    </button>
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

window.openModalPasien = function(editId) {
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

window.saveModalPasien = function(editId) {
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
  }

  DB.set('pasien', list);
  document.getElementById('modal-pasien')?.remove();
  if (window.renderPasienTbl) renderPasienTbl();
  toast(`✅ Data pasien berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delPasien = function(id) {
  if (!confirm('Hapus rekam medis pasien ini?')) return;
  DB.set('pasien', (DB.get('pasien') || []).filter(p => p.id !== id));
  if (window.renderPasienTbl) renderPasienTbl();
  toast('Data pasien dihapus 🗑️');
};

// =====================
//   PAGE 4: STOK UKS
// =====================
pages.stok = function(m) {
  function render() {
    const list = DB.get('stok') || [];
    const flt = (document.getElementById('srch-stok')?.value || '').toLowerCase();
    const filtered = list.filter(s =>
      s.nama.toLowerCase().includes(flt) || s.kategori.toLowerCase().includes(flt)
    );

    const tbody = document.getElementById('stok-tbl');
    if (!tbody) return;

    tbody.innerHTML = filtered.length
      ? filtered.map(s => {
          const kritis = s.jumlah <= s.min;
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
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-action-edit" onclick="openModalStok(${s.id})"><i class="ti ti-edit"></i> Ubah</button>
                <button class="btn btn-action-delete" onclick="delStok(${s.id})"><i class="ti ti-trash"></i> Hapus</button>
              </div>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="6"><div class="empty"><i class="ti ti-package-off"></i>Belum ada data stok</div></td></tr>`;
  }

  const kritis = (DB.get('stok') || []).filter(s => s.jumlah <= s.min);

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Stok UKS</h1>
      <div class="page-subtitle">Persediaan obat-obatan dan peralatan medis UKS</div>
    </div>
    <button class="btn-header-add" onclick="openModalStok()">
      <i class="ti ti-plus"></i> Tambah Stok
    </button>
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

window.openModalStok = function(editId) {
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
        <div class="modal-sub">Kelola obat atau peralatan medis UKS</div>
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

window.saveModalStok = function(editId) {
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
  }

  DB.set('stok', list);
  document.getElementById('modal-stok')?.remove();
  if (window.renderStokTbl) renderStokTbl();
  toast(`✅ Item stok berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delStok = function(id) {
  if (!confirm('Hapus item persediaan ini?')) return;
  DB.set('stok', (DB.get('stok') || []).filter(s => s.id !== id));
  if (window.renderStokTbl) renderStokTbl();
  toast('Item stok dihapus 🗑️');
};

// =====================
//   PAGE 5: ABSENSI
// =====================
let currentAbsensiFilter = 'all';

pages.absensi = function(m) {
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

    const rows = filteredAnggota.map(an => {
      const rec = todayAbs.find(a => a.anggotaId === an.id);
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
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['Hadir', 'Izin', 'Sakit', 'Alpha'].map(s =>
              `<button class="btn btn-ghost btn-sm" style="${rec?.status === s ? 'border-color:var(--primary);color:var(--primary);background:var(--primary-dim);font-weight:900' : ''}" onclick="setAbsen(${an.id},'${s}')">${s}</button>`
            ).join('')}
          </div>
        </td>
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

window.filterAbsensi = function(tab) {
  currentAbsensiFilter = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-abs-' + tab);
  if (btn) btn.classList.add('active');
  if (window.renderAbsTbl) renderAbsTbl();
};

window.setAbsen = function(anggotaId, status) {
  const tgl = document.getElementById('abs-tgl').value;
  const absensi = DB.get('absensi') || [];
  const idx = absensi.findIndex(a => a.anggotaId === anggotaId && a.tanggal === tgl);
  if (idx >= 0) {
    absensi[idx].status = status;
  } else {
    absensi.push({ id: Date.now(), tanggal: tgl, anggotaId, status });
  }
  DB.set('absensi', absensi);
  if (window.renderAbsTbl) renderAbsTbl();
};

// =====================
//   PAGE 6: JADWAL JAGA (MATCHING SCREENSHOT 3 + WA SHARE)
// =====================
let currentJadwalTab = 'upacara'; // 'upacara', 'piket'

pages.jadwal = function(m) {
  function render() {
    const list = DB.get('upacara') || [];
    const container = document.getElementById('upacara-list-view');
    const piketContainer = document.getElementById('piket-list-view');

    if (currentJadwalTab === 'upacara') {
      if (container) container.style.display = 'block';
      if (piketContainer) piketContainer.style.display = 'none';

      if (!container) return;
      if (!list.length) {
        container.innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>Belum ada jadwal jaga upacara</div>';
        return;
      }

      const anggotaList = DB.get('anggota') || [];

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
              <button class="btn btn-action-edit" onclick="openModalUpacara(${u.id})">
                <i class="ti ti-edit"></i> Ubah
              </button>
              <button class="btn btn-action-delete" onclick="delUpacara(${u.id})">
                <i class="ti ti-trash"></i> Hapus
              </button>
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

    } else {
      if (container) container.style.display = 'none';
      if (piketContainer) piketContainer.style.display = 'block';
      renderPiketGrid();
    }
  }

  function renderPiketGrid() {
    const jadwal = DB.get('jadwal') || [];
    const heads = HARI.map(h => `<div class="sched-head">${h}</div>`).join('');
    const rows = SESI.map(sesi => {
      const cells = HARI.map(hari => {
        const js = jadwal.filter(j => j.hari === hari && j.sesi === sesi);
        return `<div class="sched-cell">${js.map(j =>
          `<div class="sched-block" title="Klik untuk hapus" onclick="delJadwal(${j.id})">🗑 ${j.anggota}</div>`
        ).join('')}</div>`;
      }).join('');
      return `<div class="sched-time">${sesi}</div>${cells}`;
    }).join('');
    
    const gridEl = document.getElementById('sched-grid');
    if (gridEl) {
      gridEl.innerHTML = `<div class="sched-head" style="background:var(--bg3)"></div>${heads}${rows}`;
    }
  }

  const listUpacara = DB.get('upacara') || [];

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Jadwal Jaga</h1>
      <div class="page-subtitle">Penempatan petugas jaga upacara bendera (maks 7 per pos) & piket UKS</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-header-add" onclick="openModalUpacara()">
        <i class="ti ti-plus"></i> Tambah Jadwal Jaga
      </button>
    </div>
  </div>

  <!-- Tabs Nav (Matching Screenshot 3) -->
  <div class="tab-row" style="margin-bottom:18px">
    <button class="tab-btn ${currentJadwalTab === 'upacara' ? 'active' : ''}" id="tab-jadwal-upacara" onclick="switchJadwalTab('upacara')">
      Daftar Jadwal (${listUpacara.length})
    </button>
    <button class="tab-btn ${currentJadwalTab === 'piket' ? 'active' : ''}" id="tab-jadwal-piket" onclick="switchJadwalTab('piket')">
      Jadwal Piket Ruang UKS
    </button>
  </div>

  <div id="upacara-list-view"></div>

  <div id="piket-list-view" style="display:none">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="card-title" style="margin:0"><i class="ti ti-calendar-week"></i>Matriks Piket Jaga Harian UKS</div>
        <button class="btn btn-primary btn-sm" onclick="openModalPiket()"><i class="ti ti-plus"></i>Tambah Sesi Piket</button>
      </div>
      <div style="overflow-x:auto">
        <div id="sched-grid" class="sched-grid"></div>
      </div>
    </div>
  </div>`;

  window.renderJadwalView = render;
  render();
};

window.switchJadwalTab = function(tab) {
  currentJadwalTab = tab;
  document.querySelectorAll('.tab-row .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-jadwal-' + tab);
  if (btn) btn.classList.add('active');
  if (window.renderJadwalView) renderJadwalView();
};

// =====================
//   WHATSAPP TEXT & SHARE FEATURE
// =====================
function generateJadwalWaText(u) {
  const anggotaList = DB.get('anggota') || [];
  let text = `🏥 *JADWAL JAGA UPACARA / UKS PMR*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🚩 *Kegiatan:* ${u.nama}\n`;
  text += `📅 *Tanggal:* ${fmt(u.tanggal)}\n`;
  if (u.keterangan) text += `📝 *Keterangan:* ${u.keterangan}\n`;
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
  text += `• Angkatan: ⭐ A10 (${totA10}) | 🌟 A11 (${totA11})\n`;
  text += `• Gender: 👦 ${totCowo} Cowo | 👧 ${totCewe} Cewe\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Harap hadir tepat waktu dan menggunakan seragam PMR lengkap. Semangat bertugas!_ 💪✨`;
  return text;
}

window.salinTeksJadwal = function(id) {
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

window.kirimWaJadwal = function(id) {
  const u = (DB.get('upacara') || []).find(x => x.id === id);
  if (!u) return toast('Data jadwal tidak ditemukan!');

  const text = generateJadwalWaText(u);
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  toast('📲 Membuka WhatsApp...');
};

// =====================
//   MODAL JADWAL JAGA UPACARA (INTERACTIVE BUILDER - MAX 7 PETUGAS)
// =====================
window._upacaraPosData = [];

window.openModalUpacara = function(editId) {
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

window.renderModalTitikRows = function() {
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

    // Filtered available members for picker
    const curFilter = t.filter || 'all';
    let availableList = anggotaList;
    if (curFilter === '10') availableList = availableList.filter(a => a.angkatan === '10');
    else if (curFilter === '11') availableList = availableList.filter(a => a.angkatan === '11');
    else if (curFilter === 'cowo') availableList = availableList.filter(a => a.jk !== 'P');
    else if (curFilter === 'cewe') availableList = availableList.filter(a => a.jk === 'P');

    // Selected Chips
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

    // Member selection pills
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

window.updatePosName = function(idx, val) {
  if (window._upacaraPosData[idx]) {
    window._upacaraPosData[idx].pos = val;
  }
};

window.addMemberToPos = function(idx, memberName) {
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

window.removeMemberFromPos = function(idx, memberName) {
  if (!window._upacaraPosData[idx]) return;
  window._upacaraPosData[idx].anggota = (window._upacaraPosData[idx].anggota || []).filter(n => n !== memberName);
  renderModalTitikRows();
};

window.addModalTitikRow = function() {
  window._upacaraPosData.push({ pos: '', anggota: [], filter: 'all' });
  renderModalTitikRows();
};

window.deleteModalTitikRow = function(idx) {
  if (window._upacaraPosData.length <= 1) {
    window._upacaraPosData = [{ pos: '', anggota: [], filter: 'all' }];
  } else {
    window._upacaraPosData.splice(idx, 1);
  }
  renderModalTitikRows();
};

window.filterPosPicker = function(idx, filterType) {
  if (window._upacaraPosData[idx]) {
    window._upacaraPosData[idx].filter = filterType;
    renderModalTitikRows();
  }
};

window.saveModalUpacara = function(editId) {
  const nama = document.getElementById('m-up-nama').value.trim();
  if (!nama) return toast('Nama kegiatan upacara wajib diisi!');

  // Check if any pos exceeds 7 members
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
    }
  } else {
    list.push({
      id: Date.now(),
      tanggal: tgl,
      nama,
      keterangan: ket,
      titikJaga
    });
  }

  DB.set('upacara', list);
  document.getElementById('modal-upacara')?.remove();
  if (window.renderJadwalView) renderJadwalView();
  toast(`✅ Jadwal jaga berhasil ${editId ? 'diperbarui' : 'disimpan'}!`);
};

window.delUpacara = function(id) {
  if (!confirm('Hapus jadwal upacara ini?')) return;
  DB.set('upacara', (DB.get('upacara') || []).filter(u => u.id !== id));
  if (window.renderJadwalView) renderJadwalView();
  toast('Jadwal upacara dihapus 🗑️');
};

// Modal Piket
window.openModalPiket = function() {
  const anggota = DB.get('anggota') || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-piket';
  overlay.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-title"><i class="ti ti-calendar-plus" style="color:var(--primary)"></i> Tambah Piket Ruang UKS</div>
        <div class="modal-sub">Pilih personil, hari, dan sesi waktu piket</div>
      </div>
      <button class="modal-close-btn" onclick="document.getElementById('modal-piket').remove()">✕</button>
    </div>

    <div class="form-group" style="margin-bottom:12px">
      <label>Anggota Bertugas</label>
      <select id="m-piket-ang">
        ${anggota.map(a => `<option value="${a.nama}">${a.jk === 'P' ? '👧' : '👦'} ${a.nama} (A${a.angkatan} - ${a.kelas})</option>`).join('')}
      </select>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Hari</label><select id="m-piket-hari">${HARI.map(h => `<option>${h}</option>`).join('')}</select></div>
      <div class="form-group"><label>Sesi Waktu</label><select id="m-piket-sesi">${SESI.map(s => `<option>${s}</option>`).join('')}</select></div>
    </div>

    <div class="btn-row" style="justify-content:flex-end;margin-top:16px">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-piket').remove()">Batal</button>
      <button class="btn btn-primary" onclick="saveModalPiket()"><i class="ti ti-plus"></i>Tambah Piket</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
};

window.saveModalPiket = function() {
  const ang = document.getElementById('m-piket-ang').value;
  if (!ang) return toast('Pilih anggota!');
  const list = DB.get('jadwal') || [];
  list.push({
    id: Date.now(),
    anggota: ang,
    hari: document.getElementById('m-piket-hari').value,
    sesi: document.getElementById('m-piket-sesi').value,
    lokasi: 'Ruang UKS'
  });
  DB.set('jadwal', list);
  document.getElementById('modal-piket')?.remove();
  if (window.renderJadwalView) renderJadwalView();
  toast('✅ Jadwal piket ditambahkan!');
};

window.delJadwal = function(id) {
  DB.set('jadwal', (DB.get('jadwal') || []).filter(j => j.id !== id));
  if (window.renderJadwalView) renderJadwalView();
  toast('Jadwal dihapus 🗑️');
};

// =====================
//   PAGE 7: LAPORAN
// =====================
pages.laporan = function(m) {
  const pasien = DB.get('pasien') || [];
  const stok = DB.get('stok') || [];
  const absensi = DB.get('absensi') || [];
  const anggota = DB.get('anggota') || [];

  const a10 = anggota.filter(a => a.angkatan === '10').length;
  const a11 = anggota.filter(a => a.angkatan === '11').length;
  const cowo = anggota.filter(a => a.jk !== 'P').length;
  const cewe = anggota.filter(a => a.jk === 'P').length;
  const totalHadir = absensi.filter(a => a.status === 'Hadir').length;
  const totalAlpha = absensi.filter(a => a.status === 'Alpha').length;
  const dirujuk = pasien.filter(p => p.status === 'Dirujuk').length;

  const keluhanMap = {};
  pasien.forEach(p => {
    const k = (p.keluhan || '').toLowerCase().split(/[,;.]/)[0].trim();
    if (k) keluhanMap[k] = (keluhanMap[k] || 0) + 1;
  });
  const topKeluhan = Object.entries(keluhanMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  m.innerHTML = `
  <div class="page-hero">
    <div class="page-title-wrap">
      <h1 class="page-title">Laporan & Rekapitulasi</h1>
      <div class="page-subtitle">Ringkasan pelayanan medis, presensi, dan log lengkap UKS</div>
    </div>
    <button class="btn btn-ghost" onclick="window.print()"><i class="ti ti-printer"></i>Cetak Laporan</button>
  </div>

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
      <div class="stat-sub">A10: ${a10} | A11: ${a11} • 👦 ${cowo} | 👧 ${cewe}</div>
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
};

// =====================
//   INITIALIZE
// =====================
document.addEventListener('DOMContentLoaded', () => {
  renderAppLayout();
});
