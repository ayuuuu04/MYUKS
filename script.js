const firebaseConfig = {
  apiKey: "AIzaSyDQJM11w8EMfoGSecJ25bZtMva9yNVLp_0",
  authDomain: "myuks-94a60.firebaseapp.com",
  projectId: "myuks-94a60",
  storageBucket: "myuks-94a60.firebasestorage.app",
  messagingSenderId: "1080625985085",
  appId: "1:1080625985085:web:824caf8e74ca8c0f0c1c54"
};

const API_KEY = (typeof firebaseConfig !== "undefined" && firebaseConfig.apiKey) ? firebaseConfig.apiKey : "";
const API_BASE_URL = "";

let firestoreDb = null;
try {
  if (typeof firebase !== "undefined" && typeof firebaseConfig !== "undefined" && firebaseConfig.apiKey) {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firestoreDb = firebase.firestore();
  }
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

const JABATAN_LIST = ["Ketua", "Koordinator", "Sekretaris", "Bendahara", "Komandan Lapangan", "Humas", "Perkab", "Kreatif", "Anggota"];
const ANGKATAN_LIST = ["10", "11"];
const STATUS_LIST = ["Hadir", "Sakit", "Izin", "Alpha"];
const STOCK_LOW_THRESHOLD = 5;
const EXPIRY_WARN_DAYS = 30;

const KEYS = {
  members: "myuks_members",
  patients: "myuks_patients",
  medStock: "myuks_medStock",
  equipStock: "myuks_equipStock",
  attendance: "myuks_attendance",
  guardSchedules: "myuks_guardSchedules"
};

let state = {
  members: [],
  patients: [],
  medStock: [],
  equipStock: [],
  attendance: [],
  guardSchedules: []
};

let currentTab = "beranda";
let lastSnapshot = "";
let saving = false;
let currentUser = null;


const DEFAULT_MEMBERS = [];
const DEFAULT_PATIENTS = [];
const DEFAULT_MED_STOCK = [];
const DEFAULT_EQUIP_STOCK = [];
const DEFAULT_SCHEDULES = [];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function esc(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function esc_plain(str) {
  return String(str == null ? "" : str);
}

function fmtDate(iso) {
  if (!iso || iso === "-") return "-";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(iso) {
  if (!iso || iso === "-") return null;
  const d = new Date(iso + "T00:00:00");
  const now = new Date(todayISO() + "T00:00:00");
  return Math.round((d - now) / 86400000);
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = `<span>${msg}</span>`;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2600);
}

function memberById(id) {
  return state.members.find(m => m.id === id);
}

function membersByAngkatan(ang) {
  return state.members
    .filter(m => String(m.angkatan) === String(ang))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

function withTimeout(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
}

function getApiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
    headers["X-Master-Key"] = API_KEY;
    headers["x-api-key"] = API_KEY;
    headers["apikey"] = API_KEY;
  }
  return headers;
}

const DB_SERVICE = {
  async get(key) {
    
    let localData = null;
    try {
      const cached = localStorage.getItem(KEYS[key] || key);
      localData = cached ? JSON.parse(cached) : null;
    } catch (e) {
      localData = null;
    }

    if (firestoreDb) {
      try {
        const doc = await withTimeout(firestoreDb.collection("myuks_data").doc(key).get(), 2000);
        if (doc && doc.exists) {
          const data = doc.data();
          if (data && data.val !== undefined) {
            try { localStorage.setItem(KEYS[key] || key, JSON.stringify(data.val)); } catch (e) { }
            return data.val;
          }
        }
      } catch (err) {
        console.warn(`[Firestore GET notice for ${key}]:`, err.message || err);
      }
    }

    if (API_KEY && API_BASE_URL) {
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/${key}`;
        const res = await withTimeout(fetch(url, { method: "GET", headers: getApiHeaders() }), 2000);
        if (res.ok) {
          const data = await res.json();
          const val = data.record || data.value || data.data || data;
          if (val) {
            try { localStorage.setItem(KEYS[key] || key, JSON.stringify(val)); } catch (e) { }
            return val;
          }
        }
      } catch (err) {
        console.warn(`[API GET Failed for ${key}, using cache]:`, err.message || err);
      }
    }

    return localData;
  },

  async set(key, val) {
    try {
      localStorage.setItem(KEYS[key] || key, JSON.stringify(val));
    } catch (e) {
      console.error("[LocalStorage Error]:", e);
    }

    if (firestoreDb) {
      withTimeout(
        firestoreDb.collection("myuks_data").doc(key).set({
          val: val,
          updatedAt: new Date().toISOString()
        }),
        3000
      ).catch(err => {
        console.warn(`[Firestore SET notice for ${key}]:`, err.message || err);
      });
    }

    if (API_KEY && API_BASE_URL) {
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/${key}`;
        fetch(url, {
          method: "PUT",
          headers: getApiHeaders(),
          body: JSON.stringify({ key, value: val, updatedAt: new Date().toISOString() })
        }).catch(err => console.warn(`[API Sync Warning for ${key}]:`, err));
      } catch (err) {
        console.warn(`[API Sync Warning for ${key}]:`, err);
      }
    }
  }
};

async function loadAll() {
  const keysList = Object.keys(KEYS);

  for (const k of keysList) {
    try {
      const cached = localStorage.getItem(KEYS[k]);
      state[k] = cached ? JSON.parse(cached) : [];
    } catch (e) {
      state[k] = [];
    }
  }
  lastSnapshot = JSON.stringify(state);

  // 2. Muat pembaruan dari cloud secara paralel di background
  if (firestoreDb || (API_KEY && API_BASE_URL)) {
    try {
      await Promise.all(keysList.map(async (k) => {
        const val = await DB_SERVICE.get(k);
        if (val && Array.isArray(val)) {
          state[k] = val;
        }
      }));
      lastSnapshot = JSON.stringify(state);
    } catch (e) {
      console.warn("Cloud loadAll notice:", e);
    }
  }
}

async function saveKey(k) {
  saving = true;
  try {
    await DB_SERVICE.set(k, state[k]);
    lastSnapshot = JSON.stringify(state);
  } catch (e) {
    showToast("Gagal menyimpan data ke database. Coba lagi.");
    console.error(e);
  } finally {
    saving = false;
  }
}

async function pollForUpdates() {
  if (saving || !API_KEY || !API_BASE_URL) return;
  try {
    const keysList = Object.keys(KEYS);
    const fresh = { ...state };
    for (const k of keysList) {
      const val = await DB_SERVICE.get(k);
      if (val && Array.isArray(val)) fresh[k] = val;
    }
    const freshSnap = JSON.stringify(fresh);
    if (freshSnap !== lastSnapshot) {
      state = fresh;
      lastSnapshot = freshSnap;
      renderApp();
      showToast("Data diperbarui dari cloud database");
    }
  } catch (e) { /* silent */ }
}
setInterval(pollForUpdates, 15000);

function checkAuth() {
  const sessionStr = localStorage.getItem("myuks_session");
  const loginScreen = document.getElementById("loginScreen");
  const appShell = document.getElementById("appShell");

  if (sessionStr) {
    try {
      currentUser = JSON.parse(sessionStr);
    } catch (e) {
      currentUser = null;
    }
  } else {
    currentUser = null;
  }

  if (currentUser) {
    if (loginScreen) loginScreen.style.display = "none";
    if (appShell) appShell.style.display = "flex";
    renderApp();
  } else {
    if (loginScreen) loginScreen.style.display = "flex";
    if (appShell) appShell.style.display = "none";
    const errEl = document.getElementById("loginError");
    if (errEl) errEl.style.display = "none";
  }
}

function handleLogin(e) {
  if (e) e.preventDefault();
  const usernameInput = document.getElementById("loginUsername").value.trim();
  const passEl = document.getElementById("loginPassword") || document.getElementById("loginNis");
  const passwordInput = passEl ? passEl.value.trim() : "";
  const errEl = document.getElementById("loginError");

  if (!usernameInput || !passwordInput) {
    if (errEl) {
      errEl.textContent = "Harap isi Username dan Password!";
      errEl.style.display = "block";
    }
    showToast("Harap isi semua kolom login");
    return;
  }

  const uLower = usernameInput.toLowerCase();

  if ((uLower === "admin" || uLower === "admin pmr" || uLower === "ketua") && (passwordInput === "12345" || passwordInput === "admin")) {
    const adminUser = {
      id: "admin",
      nama: "Admin PMR",
      nis: "-",
      kelas: "UKS",
      angkatan: "10",
      jabatan: "Ketua"
    };
    loginSuccess(adminUser);
    return;
  }

  // 2. Cocokkan dengan data anggota yang terdaftar
  const matchedMember = state.members.find(m => {
    const matchName = m.nama.toLowerCase() === uLower || m.nama.toLowerCase().includes(uLower);
    const expectedPass = m.password ? String(m.password).trim() : String(m.nis).trim();
    return matchName && expectedPass === passwordInput;
  });

  if (matchedMember) {
    loginSuccess(matchedMember);
  } else {
    if (errEl) {
      errEl.innerHTML = `⚠️ <strong>Akses Ditolak!</strong><br>Username atau Password tidak sesuai. Silakan periksa kembali atau hubungi Admin UKS.`;
      errEl.style.display = "block";
    }
    showToast("Login gagal: Username atau Password salah! ❌");
  }
}

function loginSuccess(user) {
  currentUser = user;
  localStorage.setItem("myuks_session", JSON.stringify(user));
  showToast(`Selamat datang, ${user.nama}! 👋`);
  checkAuth();
}

function handleLogout() {
  if (!confirm("Apakah Anda yakin ingin keluar dari MY UKS?")) return;
  localStorage.removeItem("myuks_session");
  currentUser = null;
  showToast("Anda telah keluar 👋");
  checkAuth();
}

function quickFillLogin(username, pass) {
  const u = document.getElementById("loginUsername");
  const p = document.getElementById("loginPassword") || document.getElementById("loginNis");
  if (u) u.value = username;
  if (p) p.value = pass;
  handleLogin();
}

const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", icon: "home" },
  { id: "anggota", label: "Anggota", icon: "users" },
  { id: "pasien", label: "Data Pasien", icon: "heart" },
  { id: "stok", label: "Stok UKS", icon: "box" },
  { id: "absensi", label: "Absensi", icon: "check" },
  { id: "jadwal", label: "Jadwal Jaga", icon: "flag" },
  { id: "laporan", label: "Laporan", icon: "file" }
];

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="8" r="2.6"/><path d="M17 14c2.8.3 5 2.5 5 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.5-9.5-9C1 7 3 3.5 6.5 3.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8C19 3.5 21 7 19.5 11c-2.5 4.5-7.5 9-7.5 9z"/><path d="M8 11h2l1.5-3 2 5 1.5-2H17"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M8 12l2.5 2.5L16 9"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>'
};

function renderShell() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const dbBadgeLabel = firestoreDb ? "🔥 Firebase Cloud" : (API_KEY && API_BASE_URL ? "🌐 Cloud API" : "💾 Penyimpanan Lokal");

  sidebar.innerHTML = `
    <div class="brand">
      <div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 3v18M4 8h16M6 8c0 6 3 10 6 13 3-3 6-7 6-13"/></svg></div>
      <div class="brand-text"><h1>MY UKS</h1><span>Markas Digital PMR</span></div>
    </div>

    <nav class="nav">
      ${NAV_ITEMS.map(n => `<button class="nav-item ${currentTab === n.id ? 'active' : ''}" onclick="navigate('${n.id}')">${ICONS[n.icon]}${n.label}</button>`).join("")}
    </nav>

    ${currentUser ? `
    <div class="sidebar-user">
      <div class="sidebar-user-info">
        <span class="sidebar-user-name">👤 ${esc(currentUser.nama)}</span>
        <span class="sidebar-user-role">${esc(currentUser.jabatan || 'Petugas')} &bull; NIS: ${esc(currentUser.nis || '-')}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="handleLogout()" title="Keluar Akun" style="padding:4px 8px; font-size:11px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>` : ''}

    <div class="sidebar-foot">
      <span><span class="sync-dot"></span>${dbBadgeLabel}</span>
    </div>
  `;

  const mobNav = document.getElementById("mobileNav");
  if (mobNav) {
    mobNav.innerHTML = NAV_ITEMS.map(n =>
      `<button class="${currentTab === n.id ? 'active' : ''}" onclick="navigate('${n.id}')">${n.label}</button>`
    ).join("");
  }
}

function navigate(tab) {
  currentTab = tab;
  renderApp();
  window.scrollTo(0, 0);
}

const PAGE_META = {
  beranda: ["Beranda", "Ringkasan pelayanan dan operasional UKS hari ini"],
  anggota: ["Data Anggota", "Kelola data anggota PMR & petugas UKS"],
  pasien: ["Data Pasien", "Catatan kunjungan dan tindakan medis di UKS"],
  stok: ["Stok UKS", "Ketersediaan obat-obatan dan peralatan medis"],
  absensi: ["Absensi", "Kehadiran anggota per angkatan"],
  jadwal: ["Jadwal Jaga", "Penempatan petugas jaga upacara bendera"],
  laporan: ["Laporan", "Rekapitulasi kondisi operasional PMR & UKS"]
};

function renderApp() {
  if (!currentUser) return;
  renderShell();

  const [title, sub] = PAGE_META[currentTab] || ["MY UKS", ""];
  const pageTitleEl = document.getElementById("pageTitle");
  const pageSubEl = document.getElementById("pageSub");
  if (pageTitleEl) pageTitleEl.textContent = title;
  if (pageSubEl) pageSubEl.textContent = sub;

  const actions = document.getElementById("pageActions");
  if (actions) {
    actions.innerHTML = `
      <div class="user-chip">
        <span class="user-avatar">👤</span>
        <span>${esc(currentUser.nama)} <small style="color:var(--muted); font-weight:700">(${esc(currentUser.jabatan || 'Petugas')})</small></span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="handleLogout()" title="Keluar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Keluar
      </button>
    `;
  }

  const content = document.getElementById("content");
  if (!content) return;

  if (currentTab === "beranda") renderBeranda(content, actions);
  else if (currentTab === "anggota") renderAnggota(content, actions);
  else if (currentTab === "pasien") renderPasien(content, actions);
  else if (currentTab === "stok") renderStok(content, actions);
  else if (currentTab === "absensi") renderAbsensi(content, actions);
  else if (currentTab === "jadwal") renderJadwal(content, actions);
  else if (currentTab === "laporan") renderLaporan(content, actions);
}

function openModal(title, bodyHtml, footHtml) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("modalFoot").innerHTML = footHtml || "";
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

document.getElementById("modalOverlay")?.addEventListener("click", e => {
  if (e.target.id === "modalOverlay") closeModal();
});

function emptyState(icon, title, sub) {
  return `<div class="empty-state">${ICONS[icon]}<h4>${title}</h4><p>${sub}</p></div>`;
}

function renderBeranda(content) {
  const today = todayISO();
  const patientsToday = state.patients.filter(p => p.tanggal === today);
  const a10 = membersByAngkatan("10").length;
  const a11 = membersByAngkatan("11").length;
  const lowMed = state.medStock.filter(m => Number(m.stock) <= STOCK_LOW_THRESHOLD).length;
  const expiringSoon = state.medStock.filter(m => {
    const d = daysUntil(m.kadaluarsa);
    return d !== null && d <= EXPIRY_WARN_DAYS;
  });
  const notLayak = state.equipStock.filter(e => e.kondisi === "Tidak Layak").length;

  const upcoming = [...state.guardSchedules]
    .filter(s => s.tanggal >= today)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, 3);

  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card accent">
        <div class="label">Pasien Hari Ini</div>
        <div class="value">${patientsToday.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Anggota Angkatan 10</div>
        <div class="value">${a10}</div>
      </div>
      <div class="stat-card">
        <div class="label">Anggota Angkatan 11</div>
        <div class="value">${a11}</div>
      </div>
      <div class="stat-card">
        <div class="label">Obat Menipis / Exp</div>
        <div class="value" style="${lowMed > 0 ? 'color:var(--danger)' : ''}">${lowMed} <small>item</small></div>
      </div>
      <div class="stat-card">
        <div class="label">Peralatan Rusak</div>
        <div class="value" style="${notLayak > 0 ? 'color:var(--warn)' : ''}">${notLayak} <small>item</small></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <h3>Jadwal Jaga Terdekat</h3>
        <button class="btn btn-ghost btn-sm" onclick="navigate('jadwal')">Lihat Semua Jadwal &rarr;</button>
      </div>
      ${upcoming.length === 0 ? emptyState("flag", "Belum ada jadwal jaga mendatang", "Tambahkan jadwal baru di menu Jadwal Jaga.") : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tanggal</th><th>Nama Upacara</th><th>Titik Jaga</th><th>Total Petugas</th></tr></thead>
          <tbody>
          ${upcoming.map(s => {
    const totalPetugas = s.points.reduce((a, p) => a + (p.anggotaIds ? p.anggotaIds.length : 0), 0);
    return `<tr>
              <td>${fmtDate(s.tanggal)}</td>
              <td><strong>${esc(s.namaUpacara)}</strong></td>
              <td><span class="badge badge-teal">${s.points.length} titik</span></td>
              <td><span class="badge badge-primary">${totalPetugas} orang</span></td>
            </tr>`;
  }).join("")}
          </tbody>
        </table>
      </div>`}
    </div>

    <div class="card">
      <div class="section-title">
        <h3>Peringatan Stok Obat</h3>
        <span class="hint">Menipis (&le;${STOCK_LOW_THRESHOLD}) atau kadaluarsa &le; ${EXPIRY_WARN_DAYS} hari</span>
      </div>
      ${expiringSoon.length === 0 && lowMed === 0 ? emptyState("box", "Stok obat dalam kondisi aman", "Tidak ada obat yang menipis atau mendekati kadaluarsa.") : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nama Obat</th><th>Stok</th><th>Kadaluarsa</th><th>Status</th></tr></thead>
          <tbody>
          ${state.medStock.filter(m => Number(m.stock) <= STOCK_LOW_THRESHOLD || (daysUntil(m.kadaluarsa) !== null && daysUntil(m.kadaluarsa) <= EXPIRY_WARN_DAYS)).map(m => {
    const d = daysUntil(m.kadaluarsa);
    let statusBadge = "";
    if (d !== null && d < 0) statusBadge = `<span class="badge badge-danger">Kadaluarsa</span>`;
    else if (d !== null && d <= EXPIRY_WARN_DAYS) statusBadge = `<span class="badge badge-warn">${d} hari lagi</span>`;
    else if (Number(m.stock) <= STOCK_LOW_THRESHOLD) statusBadge = `<span class="badge badge-warn">Stok Menipis</span>`;
    return `<tr>
              <td><strong>${esc(m.nama)}</strong></td>
              <td>${esc(m.stock)}</td>
              <td>${fmtDate(m.kadaluarsa)}</td>
              <td>${statusBadge}</td>
            </tr>`;
  }).join("")}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

let anggotaFilter = "all";
function renderAnggota(content, actions) {
  actions.innerHTML = `
    <button class="btn btn-primary" onclick="openMemberModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Tambah Anggota
    </button>
  `;

  const list = state.members
    .filter(m => anggotaFilter === "all" || String(m.angkatan) === String(anggotaFilter))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  content.innerHTML = `
    <div class="card">
      <div class="tabs">
        <button class="tab-btn ${anggotaFilter === 'all' ? 'active' : ''}" onclick="setAnggotaFilter('all')">Semua (${state.members.length})</button>
        <button class="tab-btn ${anggotaFilter === '10' ? 'active' : ''}" onclick="setAnggotaFilter('10')">Angkatan 10 (${membersByAngkatan('10').length})</button>
        <button class="tab-btn ${anggotaFilter === '11' ? 'active' : ''}" onclick="setAnggotaFilter('11')">Angkatan 11 (${membersByAngkatan('11').length})</button>
      </div>

      ${list.length === 0 ? emptyState("users", "Belum ada anggota", "Tambahkan data anggota PMR untuk mengelola absensi dan jadwal jaga.") : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Angkatan</th>
              <th>Jabatan</th>
              <th>Kali Jaga</th>
              <th style="text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
          ${list.map(m => `
            <tr>
              <td><strong>${esc(m.nama)}</strong></td>
              <td><span class="badge badge-muted">${esc(m.nis || '-')}</span></td>
              <td>${esc(m.kelas)}</td>
              <td><span class="badge badge-muted">Angkatan ${esc(m.angkatan)}</span></td>
              <td><span class="badge badge-primary">${esc(m.jabatan)}</span></td>
              <td>${dutyBadge(computeDutyCount(m.id))}</td>
              <td style="text-align:right;">
                <button class="btn btn-ghost btn-sm" onclick="openMemberModal('${m.id}')" title="Ubah Data">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Ubah
                </button>
                <button class="btn btn-danger-text btn-sm" onclick="deleteMember('${m.id}')" title="Hapus Data">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Hapus
                </button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function setAnggotaFilter(f) {
  anggotaFilter = f;
  renderApp();
}

function computeDutyCount(memberId) {
  let count = 0;
  state.guardSchedules.forEach(s => {
    s.points.forEach(p => {
      if (p.anggotaIds && p.anggotaIds.includes(memberId)) count++;
    });
  });
  return count;
}

function dutyBadge(count) {
  const cls = count === 0 ? "duty-badge-0" : count === 1 ? "duty-badge-1" : count === 2 ? "duty-badge-2" : "duty-badge-3";
  const text = count === 0 ? "Belum pernah" : `${count} kali`;
  return `<span class="badge ${cls}">${text}</span>`;
}

function openMemberModal(id) {
  const existing = id ? memberById(id) : null;
  openModal(existing ? "Ubah Data Anggota" : "Tambah Anggota Baru", `
    <div class="field">
      <label>Nama Lengkap Anggota</label>
      <input id="fm_nama" value="${existing ? esc(existing.nama) : ''}" placeholder="cth: Afnan Fauzan" />
    </div>
    <div class="field-row">
      <div class="field">
        <label>NIS (Nomor Induk Siswa)</label>
        <input id="fm_nis" value="${existing ? esc(existing.nis || '') : ''}" placeholder="cth: 1001" />
      </div>
      <div class="field">
        <label>Kelas</label>
        <input id="fm_kelas" value="${existing ? esc(existing.kelas) : ''}" placeholder="cth: X-A / XI PPLG B" />
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Angkatan</label>
        <select id="fm_angkatan">
          ${ANGKATAN_LIST.map(a => `<option value="${a}" ${existing && String(existing.angkatan) === String(a) ? 'selected' : ''}>Angkatan ${a}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Jabatan</label>
        <select id="fm_jabatan">
          ${JABATAN_LIST.map(j => `<option value="${j}" ${existing && existing.jabatan === j ? 'selected' : ''}>${j}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="field">
      <label>Password Akun (Opsional)</label>
      <input type="password" id="fm_password" value="${existing && existing.password ? esc(existing.password) : ''}" placeholder="Kosongkan jika default sama dengan NIS" />
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveMember(${existing ? `'${id}'` : 'null'})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Simpan Anggota
    </button>
  `);
}

async function saveMember(id) {
  const nama = document.getElementById("fm_nama").value.trim();
  const nis = document.getElementById("fm_nis").value.trim();
  const kelas = document.getElementById("fm_kelas").value.trim();
  const angkatan = document.getElementById("fm_angkatan").value;
  const jabatan = document.getElementById("fm_jabatan").value;
  const passInput = document.getElementById("fm_password") ? document.getElementById("fm_password").value.trim() : "";

  if (!nama || !kelas || !nis) {
    showToast("Nama, NIS, dan Kelas wajib diisi!");
    return;
  }

  const dup = state.members.find(m => m.id !== id && String(m.nis).trim() === nis);
  if (dup) {
    showToast(`NIS ${nis} sudah digunakan oleh ${dup.nama}!`);
    return;
  }

  const memberData = { nama, nis, kelas, angkatan, jabatan };
  if (passInput) {
    memberData.password = passInput;
  }

  if (id) {
    const m = memberById(id);
    if (m) {
      if (!passInput && m.password) {
        memberData.password = m.password;
      }
      Object.assign(m, memberData);
    }
  } else {
    state.members.push({ id: uid(), ...memberData });
  }

  await saveKey("members");
  closeModal();
  renderApp();
  showToast(id ? "Data anggota berhasil diperbarui! " : "Anggota baru berhasil ditambahkan! ");
}

async function deleteMember(id) {
  const m = memberById(id);
  if (!confirm(`Hapus anggota "${m ? m.nama : 'ini'}"?`)) return;

  state.members = state.members.filter(x => x.id !== id);
  await saveKey("members");
  renderApp();
  showToast("Data anggota dihapus 🗑️");
}

let pasienDateFilter = "";
function renderPasien(content, actions) {
  actions.innerHTML = `
    <button class="btn btn-primary" onclick="openPatientModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Catat Pasien Baru
    </button>
  `;

  const list = state.patients
    .filter(p => !pasienDateFilter || p.tanggal === pasienDateFilter)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  content.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <div class="field">
          <label>Filter Tanggal Kunjungan</label>
          <input type="date" id="pasienDateInput" value="${pasienDateFilter}" onchange="setPasienFilter(this.value)" />
        </div>
        ${pasienDateFilter ? `<button class="btn btn-ghost" style="margin-top:18px" onclick="setPasienFilter('')">Tampilkan Semua</button>` : ""}
      </div>

      ${list.length === 0 ? emptyState("heart", "Belum ada catatan pasien", "Catat kunjungan dan penanganan pasien UKS di sini.") : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Pasien</th>
              <th>Kelas</th>
              <th>Keluhan</th>
              <th>Obat / Tindakan</th>
              <th style="text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
          ${list.map(p => `
            <tr>
              <td>${fmtDate(p.tanggal)}</td>
              <td><strong>${esc(p.nama)}</strong></td>
              <td>${esc(p.kelas)}</td>
              <td>${esc(p.keluhan)}</td>
              <td>${esc(p.obat) || "-"}</td>
              <td style="text-align:right;">
                <button class="btn btn-ghost btn-sm" onclick="openPatientModal('${p.id}')" title="Ubah Catatan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Ubah
                </button>
                <button class="btn btn-danger-text btn-sm" onclick="deletePatient('${p.id}')" title="Hapus Catatan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Hapus
                </button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

function setPasienFilter(v) {
  pasienDateFilter = v;
  renderApp();
}

function openPatientModal(id) {
  const existing = id ? state.patients.find(p => p.id === id) : null;
  openModal(existing ? "Ubah Catatan Pasien" : "Catat Pasien Baru", `
    <div class="field-row">
      <div class="field">
        <label>Nama Pasien</label>
        <input id="fp_nama" value="${existing ? esc(existing.nama) : ''}" placeholder="Nama lengkap siswa" />
      </div>
      <div class="field">
        <label>Kelas</label>
        <input id="fp_kelas" value="${existing ? esc(existing.kelas) : ''}" placeholder="cth: X-A / XI-2" />
      </div>
    </div>
    <div class="field">
      <label>Keluhan / Gejala</label>
      <textarea id="fp_keluhan" placeholder="cth: Pusing, mual, luka lecet di tangan">${existing ? esc(existing.keluhan) : ''}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Obat / Tindakan Medis</label>
        <input id="fp_obat" value="${existing ? esc(existing.obat) : ''}" placeholder="cth: Diberi Paracetamol, diplester" />
      </div>
      <div class="field">
        <label>Tanggal Kunjungan</label>
        <input type="date" id="fp_tanggal" value="${existing ? existing.tanggal : todayISO()}" />
      </div>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="savePatient(${existing ? `'${id}'` : 'null'})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Simpan Data Pasien
    </button>
  `);
}

async function savePatient(id) {
  const nama = document.getElementById("fp_nama").value.trim();
  const kelas = document.getElementById("fp_kelas").value.trim();
  const keluhan = document.getElementById("fp_keluhan").value.trim();
  const obat = document.getElementById("fp_obat").value.trim();
  const tanggal = document.getElementById("fp_tanggal").value || todayISO();

  if (!nama || !keluhan) {
    showToast("Nama dan keluhan pasien wajib diisi!");
    return;
  }

  if (id) {
    const p = state.patients.find(x => x.id === id);
    if (p) Object.assign(p, { nama, kelas, keluhan, obat, tanggal });
  } else {
    state.patients.push({ id: uid(), nama, kelas, keluhan, obat, tanggal });
  }

  await saveKey("patients");
  closeModal();
  renderApp();
  showToast(id ? "Data pasien diperbarui! 🩺" : "Data pasien disimpan! 🌸");
}

async function deletePatient(id) {
  if (!confirm("Hapus catatan pasien ini?")) return;
  state.patients = state.patients.filter(p => p.id !== id);
  await saveKey("patients");
  renderApp();
  showToast("Catatan pasien dihapus 🗑️");
}

let stokTab = "obat";
function renderStok(content, actions) {
  actions.innerHTML = stokTab === "obat"
    ? `<button class="btn btn-primary" onclick="openMedModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tambah Obat</button>`
    : `<button class="btn btn-primary" onclick="openEquipModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tambah Peralatan</button>`;

  content.innerHTML = `
    <div class="tabs">
      <button class="tab-btn ${stokTab === 'obat' ? 'active' : ''}" onclick="setStokTab('obat')">Obat-Obatan (${state.medStock.length})</button>
      <button class="tab-btn ${stokTab === 'alat' ? 'active' : ''}" onclick="setStokTab('alat')">Peralatan Medis (${state.equipStock.length})</button>
    </div>
    <div id="stokBody"></div>
  `;

  document.getElementById("stokBody").innerHTML = stokTab === "obat" ? renderMedTable() : renderEquipTable();
}

function setStokTab(t) {
  stokTab = t;
  renderApp();
}

function renderMedTable() {
  if (state.medStock.length === 0) return `<div class="card">${emptyState("box", "Belum ada data obat", "Tambahkan data stok obat UKS.")}</div>`;

  return `
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama Obat</th>
            <th>Kegunaan</th>
            <th>Kadaluarsa</th>
            <th>Jumlah Stok</th>
            <th>Status</th>
            <th style="text-align:right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
        ${state.medStock.map(m => {
    const d = daysUntil(m.kadaluarsa);
    let status = `<span class="badge badge-good">Aman</span>`;
    if (d !== null && d < 0) status = `<span class="badge badge-danger">Kadaluarsa</span>`;
    else if (d !== null && d <= EXPIRY_WARN_DAYS) status = `<span class="badge badge-warn">${d} hari lagi</span>`;
    else if (Number(m.stock) <= STOCK_LOW_THRESHOLD) status = `<span class="badge badge-warn">Menipis</span>`;
    if (Number(m.stock) <= 0) status = `<span class="badge badge-danger">Habis</span>`;

    return `
          <tr>
            <td><strong>${esc(m.nama)}</strong></td>
            <td>${esc(m.untuk)}</td>
            <td>${fmtDate(m.kadaluarsa)}</td>
            <td><strong>${esc(m.stock)}</strong> item</td>
            <td>${status}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-sm" onclick="openMedModal('${m.id}')" title="Ubah Obat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Ubah
              </button>
              <button class="btn btn-danger-text btn-sm" onclick="deleteMed('${m.id}')" title="Hapus Obat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Hapus
              </button>
            </td>
          </tr>`;
  }).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderEquipTable() {
  if (state.equipStock.length === 0) return `<div class="card">${emptyState("box", "Belum ada data peralatan", "Tambahkan inventaris peralatan UKS.")}</div>`;

  return `
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama Peralatan</th>
            <th>Kondisi</th>
            <th>Keterangan</th>
            <th style="text-align:right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
        ${state.equipStock.map(e => `
          <tr>
            <td><strong>${esc(e.nama)}</strong></td>
            <td>${e.kondisi === "Layak" ? '<span class="badge badge-good">✅ Layak Pakai</span>' : '<span class="badge badge-danger">⚠️ Tidak Layak</span>'}</td>
            <td>${esc(e.keterangan) || "-"}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-sm" onclick="openEquipModal('${e.id}')" title="Ubah Alat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Ubah
              </button>
              <button class="btn btn-danger-text btn-sm" onclick="deleteEquip('${e.id}')" title="Hapus Alat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Hapus
              </button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openMedModal(id) {
  const existing = id ? state.medStock.find(m => m.id === id) : null;
  openModal(existing ? "Ubah Data Obat" : "Tambah Data Obat", `
    <div class="field">
      <label>Nama Obat</label>
      <input id="fmed_nama" value="${existing ? esc(existing.nama) : ''}" placeholder="cth: Paracetamol 500mg" />
    </div>
    <div class="field">
      <label>Untuk Mengatasi (Kegunaan)</label>
      <input id="fmed_untuk" value="${existing ? esc(existing.untuk) : ''}" placeholder="cth: Demam, pusing, sakit kepala" />
    </div>
    <div class="field-row">
      <div class="field">
        <label>Masa Kadaluarsa</label>
        <input type="date" id="fmed_kadaluarsa" value="${existing ? existing.kadaluarsa : ''}" />
      </div>
      <div class="field">
        <label>Jumlah Stok</label>
        <input type="number" min="0" id="fmed_stock" value="${existing ? existing.stock : ''}" placeholder="0" />
      </div>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveMed(${existing ? `'${id}'` : 'null'})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Simpan Obat
    </button>
  `);
}

async function saveMed(id) {
  const nama = document.getElementById("fmed_nama").value.trim();
  const untuk = document.getElementById("fmed_untuk").value.trim();
  const kadaluarsa = document.getElementById("fmed_kadaluarsa").value;
  const stock = document.getElementById("fmed_stock").value;

  if (!nama || stock === "") {
    showToast("Nama obat dan jumlah stok wajib diisi!");
    return;
  }

  if (id) {
    const m = state.medStock.find(x => x.id === id);
    if (m) Object.assign(m, { nama, untuk, kadaluarsa, stock: Number(stock) });
  } else {
    state.medStock.push({ id: uid(), nama, untuk, kadaluarsa, stock: Number(stock) });
  }

  await saveKey("medStock");
  closeModal();
  renderApp();
  showToast(id ? "Data obat diperbarui! 💊" : "Data obat disimpan! 🌸");
}

async function deleteMed(id) {
  if (!confirm("Hapus data obat ini?")) return;
  state.medStock = state.medStock.filter(m => m.id !== id);
  await saveKey("medStock");
  renderApp();
  showToast("Data obat dihapus 🗑️");
}

function openEquipModal(id) {
  const existing = id ? state.equipStock.find(e => e.id === id) : null;
  openModal(existing ? "Ubah Data Peralatan" : "Tambah Peralatan", `
    <div class="field">
      <label>Nama Peralatan</label>
      <input id="feq_nama" value="${existing ? esc(existing.nama) : ''}" placeholder="cth: Tandu Lipat" />
    </div>
    <div class="field">
      <label>Kondisi Alat</label>
      <select id="feq_kondisi">
        <option value="Layak" ${existing && existing.kondisi === "Layak" ? "selected" : ""}>Layak Pakai</option>
        <option value="Tidak Layak" ${existing && existing.kondisi === "Tidak Layak" ? "selected" : ""}>Tidak Layak / Rusak</option>
      </select>
    </div>
    <div class="field">
      <label>Keterangan Tambahan</label>
      <textarea id="feq_ket" placeholder="cth: Perlu ganti kain / baterai">${existing ? esc(existing.keterangan) : ''}</textarea>
    </div>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveEquip(${existing ? `'${id}'` : 'null'})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Simpan Peralatan
    </button>
  `);
}

async function saveEquip(id) {
  const nama = document.getElementById("feq_nama").value.trim();
  const kondisi = document.getElementById("feq_kondisi").value;
  const keterangan = document.getElementById("feq_ket").value.trim();

  if (!nama) {
    showToast("Nama peralatan wajib diisi!");
    return;
  }

  if (id) {
    const e = state.equipStock.find(x => x.id === id);
    if (e) Object.assign(e, { nama, kondisi, keterangan });
  } else {
    state.equipStock.push({ id: uid(), nama, kondisi, keterangan });
  }

  await saveKey("equipStock");
  closeModal();
  renderApp();
  showToast(id ? "Data peralatan diperbarui! 🩺" : "Data peralatan disimpan! 🌸");
}

async function deleteEquip(id) {
  if (!confirm("Hapus data peralatan ini?")) return;
  state.equipStock = state.equipStock.filter(e => e.id !== id);
  await saveKey("equipStock");
  renderApp();
  showToast("Peralatan dihapus 🗑️");
}

let absensiAngkatan = "10";
let absensiTanggal = todayISO();

function findAttendance(tanggal, angkatan) {
  return state.attendance.find(a => a.tanggal === tanggal && String(a.angkatan) === String(angkatan));
}

function renderAbsensi(content) {
  const members = membersByAngkatan(absensiAngkatan);
  const record = findAttendance(absensiTanggal, absensiAngkatan);
  const records = record ? record.records : {};

  let hadir = 0, sakit = 0, izin = 0, alpha = 0, belum = 0;
  members.forEach(m => {
    const s = records[m.id];
    if (s === "Hadir") hadir++;
    else if (s === "Sakit") sakit++;
    else if (s === "Izin") izin++;
    else if (s === "Alpha") alpha++;
    else belum++;
  });

  content.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <div class="field">
          <label>Tanggal Absensi</label>
          <input type="date" id="absTanggalInput" value="${absensiTanggal}" onchange="setAbsensiTanggal(this.value)" />
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn ${absensiAngkatan === '10' ? 'active' : ''}" onclick="setAbsensiAngkatan('10')">Angkatan 10</button>
        <button class="tab-btn ${absensiAngkatan === '11' ? 'active' : ''}" onclick="setAbsensiAngkatan('11')">Angkatan 11</button>
      </div>

      ${members.length === 0 ? emptyState("users", `Belum ada anggota Angkatan ${absensiAngkatan}`, "Tambahkan anggota terlebih dahulu.") : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Jabatan</th>
              <th>Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
          ${members.map(m => {
    const cur = records[m.id] || "";
    return `
            <tr>
              <td><strong>${esc(m.nama)}</strong></td>
              <td><span class="badge badge-teal">${esc(m.nis || '-')}</span></td>
              <td>${esc(m.kelas)}</td>
              <td>${esc(m.jabatan)}</td>
              <td>
                <select class="status-select status-${cur}" onchange="markAttendance('${m.id}', this.value); this.className='status-select status-'+this.value;">
                  <option value="" ${cur === "" ? "selected" : ""}>— Belum ditandai —</option>
                  ${STATUS_LIST.map(s => `<option value="${s}" ${cur === s ? "selected" : ""}>${s}</option>`).join("")}
                </select>
              </td>
            </tr>`;
  }).join("")}
          </tbody>
        </table>
      </div>`}
    </div>

    ${members.length > 0 ? `
    <div class="stat-grid" style="margin-top:16px">
      <div class="stat-card"><div class="label">Hadir</div><div class="value" style="color:var(--good)">${hadir}</div></div>
      <div class="stat-card"><div class="label">Sakit</div><div class="value" style="color:var(--warn)">${sakit}</div></div>
      <div class="stat-card"><div class="label">Izin</div><div class="value" style="color:var(--teal)">${izin}</div></div>
      <div class="stat-card"><div class="label">Alpha</div><div class="value" style="color:var(--danger)">${alpha}</div></div>
      <div class="stat-card"><div class="label">Belum Ditandai</div><div class="value">${belum}</div></div>
    </div>` : ""}
  `;
}

function setAbsensiAngkatan(a) {
  absensiAngkatan = a;
  renderApp();
}

function setAbsensiTanggal(v) {
  absensiTanggal = v || todayISO();
  renderApp();
}

async function markAttendance(memberId, status) {
  let record = findAttendance(absensiTanggal, absensiAngkatan);
  if (!record) {
    record = { id: uid(), tanggal: absensiTanggal, angkatan: absensiAngkatan, records: {} };
    state.attendance.push(record);
  }
  if (status === "") {
    delete record.records[memberId];
  } else {
    record.records[memberId] = status;
  }
  await saveKey("attendance");
  renderApp();
}

let scheduleDraft = null;
let jadwalView = "list";

function renderJadwal(content, actions) {
  actions.innerHTML = `
    <button class="btn btn-primary" onclick="openScheduleModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Tambah Jadwal Jaga
    </button>
  `;

  const sorted = [...state.guardSchedules].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  content.innerHTML = `
    <div class="tabs">
      <button class="tab-btn ${jadwalView === 'list' ? 'active' : ''}" onclick="setJadwalView('list')">Daftar Jadwal (${sorted.length})</button>
      <button class="tab-btn ${jadwalView === 'riwayat' ? 'active' : ''}" onclick="setJadwalView('riwayat')">Riwayat Penugasan Petugas</button>
    </div>
    <div id="jadwalBody"></div>
  `;

  document.getElementById("jadwalBody").innerHTML = jadwalView === "list" ? renderScheduleList(sorted) : renderDutyHistory();
}

function setJadwalView(v) {
  jadwalView = v;
  renderApp();
}

function renderScheduleList(list) {
  if (list.length === 0) return `<div class="card">${emptyState("flag", "Belum ada jadwal jaga", "Tambahkan jadwal penugasan upacara bendera pertama.")}</div>`;

  return list.map(s => {
    const total = s.points.reduce((a, p) => a + (p.anggotaIds ? p.anggotaIds.length : 0), 0);
    return `
    <div class="card">
      <div class="section-title">
        <div>
          <h3>🚩 ${esc(s.namaUpacara)}</h3>
          <span class="hint">${fmtDate(s.tanggal)} &bull; ${s.points.length} titik jaga &bull; ${total} petugas bertugas</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-teal btn-sm" onclick="copyScheduleText('${s.id}')" title="Salin format pesan WhatsApp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Salin Teks
          </button>
          <button class="btn btn-ghost btn-sm" onclick="openScheduleModal('${s.id}')" title="Ubah Jadwal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Ubah
          </button>
          <button class="btn btn-danger-text btn-sm" onclick="deleteSchedule('${s.id}')" title="Hapus Jadwal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Hapus
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:250px;">Pos / Titik Jaga</th>
              <th>Petugas yang Ditugaskan</th>
            </tr>
          </thead>
          <tbody>
          ${s.points.map(p => `
            <tr>
              <td style="white-space:normal;"><strong>📍 ${esc(p.titik) || "(belum ada nama pos)"}</strong></td>
              <td style="white-space:normal;">
                ${(!p.anggotaIds || p.anggotaIds.length === 0)
        ? '<span class="hint-text">Belum ada petugas ditugaskan</span>'
        : p.anggotaIds.map(id => {
          const m = memberById(id);
          return m ? `<span class="badge badge-primary" style="margin:2px 4px 2px 0;">👤 ${esc(m.nama)} (${esc(m.kelas)})</span>` : "";
        }).join("")}
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }).join("");
}

function renderDutyHistory() {
  const sorted = [...state.members].sort((a, b) => computeDutyCount(a.id) - computeDutyCount(b.id));
  if (sorted.length === 0) return `<div class="card">${emptyState("users", "Belum ada anggota", "Tambahkan anggota terlebih dahulu.")}</div>`;

  return `
  <div class="card">
    <div class="section-title">
      <h3>Riwayat Penugasan Jaga Anggota</h3>
      <span class="hint">Diurutkan dari anggota yang paling jarang bertugas</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama Lengkap</th>
            <th>NIS</th>
            <th>Angkatan</th>
            <th>Kelas</th>
            <th>Total Kali Bertugas</th>
          </tr>
        </thead>
        <tbody>
        ${sorted.map(m => `
          <tr>
            <td><strong>${esc(m.nama)}</strong></td>
            <td><span class="badge badge-teal">${esc(m.nis || '-')}</span></td>
            <td>Angkatan ${esc(m.angkatan)}</td>
            <td>${esc(m.kelas)}</td>
            <td>${dutyBadge(computeDutyCount(m.id))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openScheduleModal(id) {
  const existing = id ? state.guardSchedules.find(s => s.id === id) : null;
  scheduleDraft = existing
    ? JSON.parse(JSON.stringify(existing))
    : {
      id: uid(),
      tanggal: todayISO(),
      namaUpacara: "",
      points: [{ id: uid(), titik: "Lapangan Utama", anggotaIds: [] }]
    };

  openModal(existing ? "Ubah Jadwal Jaga Upacara" : "Tambah Jadwal Jaga Baru", `
    <div class="field-row">
      <div class="field">
        <label>Tanggal Upacara</label>
        <input type="date" id="fs_tanggal" value="${scheduleDraft.tanggal}" onchange="scheduleDraft.tanggal=this.value" />
      </div>
      <div class="field">
        <label>Nama Kegiatan / Upacara</label>
        <input id="fs_nama" value="${esc(scheduleDraft.namaUpacara)}" placeholder="cth: Upacara HUT RI / Upacara Senin" oninput="scheduleDraft.namaUpacara=this.value" />
      </div>
    </div>

    <div class="section-title" style="margin-top:10px;">
      <h4>Pembagian Pos / Titik Jaga</h4>
    </div>
    <div id="pointsContainer"></div>
    <button class="btn btn-ghost btn-sm" onclick="addSchedulePoint()" style="margin-top:6px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Tambah Titik Jaga
    </button>
  `, `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-primary" onclick="saveSchedule(${existing ? `'${id}'` : 'null'})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Simpan Jadwal
    </button>
  `);

  renderPointsContainer();
}

function renderPointsContainer() {
  const c = document.getElementById("pointsContainer");
  if (!c || !scheduleDraft) return;

  c.innerHTML = scheduleDraft.points.map((p, idx) => `
    <div class="point-block">
      <div class="point-head">
        <input placeholder="Nama pos titik jaga, cth: Lapangan Utama / Tribun" value="${esc(p.titik)}" oninput="scheduleDraft.points[${idx}].titik=this.value" />
        ${scheduleDraft.points.length > 1 ? `<button class="btn btn-danger-text btn-sm" onclick="removeSchedulePoint(${idx})">Hapus Pos</button>` : ""}
      </div>
      <label style="font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:4px; display:block;">Pilih Petugas Bertugas:</label>
      <div class="member-check-grid">
        ${state.members.length === 0 ? `<span class="hint-text">Belum ada anggota terdaftar</span>` : state.members.slice().sort((a, b) => a.nama.localeCompare(b.nama)).map(m => `
          <label class="member-check">
            <input type="checkbox" ${p.anggotaIds && p.anggotaIds.includes(m.id) ? "checked" : ""} onchange="toggleSchedulePointMember(${idx}, '${m.id}')" />
            <span>${esc(m.nama)} <span class="hint-text">(${esc(m.kelas)}, ${computeDutyCount(m.id)}x)</span></span>
          </label>`).join("")}
      </div>
    </div>
  `).join("");
}

function addSchedulePoint() {
  if (!scheduleDraft) return;
  scheduleDraft.points.push({ id: uid(), titik: "", anggotaIds: [] });
  renderPointsContainer();
}

function removeSchedulePoint(idx) {
  if (!scheduleDraft) return;
  scheduleDraft.points.splice(idx, 1);
  renderPointsContainer();
}

function toggleSchedulePointMember(idx, memberId) {
  if (!scheduleDraft || !scheduleDraft.points[idx]) return;
  if (!scheduleDraft.points[idx].anggotaIds) scheduleDraft.points[idx].anggotaIds = [];
  const arr = scheduleDraft.points[idx].anggotaIds;
  const pos = arr.indexOf(memberId);
  if (pos > -1) arr.splice(pos, 1);
  else arr.push(memberId);
}

async function saveSchedule(id) {
  if (!scheduleDraft.namaUpacara.trim()) {
    showToast("Nama kegiatan/upacara wajib diisi!");
    return;
  }
  if (!scheduleDraft.tanggal) {
    showToast("Tanggal upacara wajib diisi!");
    return;
  }

  if (id) {
    const idx = state.guardSchedules.findIndex(s => s.id === id);
    if (idx > -1) state.guardSchedules[idx] = scheduleDraft;
  } else {
    state.guardSchedules.push(scheduleDraft);
  }

  await saveKey("guardSchedules");
  closeModal();
  scheduleDraft = null;
  renderApp();
  showToast(id ? "Jadwal jaga diperbarui! 🚩" : "Jadwal jaga baru disimpan! 📅");
}

async function deleteSchedule(id) {
  if (!confirm("Hapus jadwal upacara ini?")) return;
  state.guardSchedules = state.guardSchedules.filter(s => s.id !== id);
  await saveKey("guardSchedules");
  renderApp();
  showToast("Jadwal jaga dihapus 🗑️");
}

function buildScheduleText(s) {
  let txt = `*🚩 JADWAL JAGA PETUGAS PMR*\n*Kegiatan:* ${esc_plain(s.namaUpacara)}\n*Tanggal:* ${fmtDate(s.tanggal)}\n`;
  s.points.forEach(p => {
    txt += `\n📍 *${esc_plain(p.titik) || "(Titik Jaga)"}*\n`;
    if (!p.anggotaIds || p.anggotaIds.length === 0) {
      txt += `- (Belum ada petugas)\n`;
    } else {
      p.anggotaIds.forEach(id => {
        const m = memberById(id);
        if (m) txt += `- 👤 ${m.nama} (Kelas: ${m.kelas})\n`;
      });
    }
  });
  txt += `\n_Dimohon seluruh petugas hadir 15 menit sebelum kegiatan dimulai. Salam Kemanusiaan! 🏥_`;
  return txt;
}

function copyScheduleText(id) {
  const s = state.guardSchedules.find(x => x.id === id);
  if (!s) return;
  const text = buildScheduleText(s);
  tryCopy(text);
}

function tryCopy(text) {
  const finish = (ok) => {
    if (ok) showToast("Teks jadwal berhasil disalin! Siap dibagikan ke WhatsApp 📲");
    else openCopyFallback(text);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => finish(true)).catch(() => finish(false));
  } else {
    finish(false);
  }
}

function openCopyFallback(text) {
  openModal("Salin Teks Jadwal", `
    <p class="hint-text" style="margin-bottom:10px;">Salin manual teks di bawah ini untuk dibagikan ke grup:</p>
    <textarea class="copy-textarea" readonly onclick="this.select()">${text}</textarea>
  `, `<button class="btn btn-primary" onclick="closeModal()">Selesai</button>`);
}

let laporanTanggal = todayISO();
function renderLaporan(content, actions) {
  actions.innerHTML = `
    <button class="btn btn-primary" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Cetak Laporan
    </button>
  `;

  const patientsOnDate = state.patients.filter(p => p.tanggal === laporanTanggal);
  const keluhanCount = {};
  state.patients.forEach(p => {
    const key = p.keluhan ? p.keluhan.trim().toLowerCase() : "";
    if (!key) return;
    keluhanCount[key] = (keluhanCount[key] || 0) + 1;
  });
  const topKeluhan = Object.entries(keluhanCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const a10 = membersByAngkatan("10").length;
  const a11 = membersByAngkatan("11").length;

  const lowStock = state.medStock.filter(m => Number(m.stock) <= STOCK_LOW_THRESHOLD).length;
  const expired = state.medStock.filter(m => {
    const d = daysUntil(m.kadaluarsa);
    return d !== null && d < 0;
  }).length;
  const expiringSoon = state.medStock.filter(m => {
    const d = daysUntil(m.kadaluarsa);
    return d !== null && d >= 0 && d <= EXPIRY_WARN_DAYS;
  }).length;
  const equipNotLayak = state.equipStock.filter(e => e.kondisi === "Tidak Layak").length;

  const attA10 = findAttendance(laporanTanggal, "10");
  const attA11 = findAttendance(laporanTanggal, "11");

  function tally(rec, members) {
    let hadir = 0, sakit = 0, izin = 0, alpha = 0;
    members.forEach(m => {
      const s = rec ? rec.records[m.id] : undefined;
      if (s === "Hadir") hadir++;
      else if (s === "Sakit") sakit++;
      else if (s === "Izin") izin++;
      else if (s === "Alpha") alpha++;
    });
    return { hadir, sakit, izin, alpha };
  }

  const t10 = tally(attA10, membersByAngkatan("10"));
  const t11 = tally(attA11, membersByAngkatan("11"));

  content.innerHTML = `
    <div class="card no-print">
      <div class="toolbar" style="margin-bottom:0;">
        <div class="field" style="max-width:240px; margin-bottom:0;">
          <label>Pilih Tanggal Laporan</label>
          <input type="date" value="${laporanTanggal}" onchange="setLaporanTanggal(this.value)" />
        </div>
        <button class="btn btn-primary" onclick="window.print()" style="margin-top:18px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Cetak Dokumen Laporan
        </button>
      </div>
    </div>

    <!-- Kop Surat Khusus Cetak / Print -->
    <div class="print-header print-only">
      <div class="print-kop">
        <div class="print-logo">🏥</div>
        <div class="print-kop-text">
          <h2>UNIT KESEHATAN SEKOLAH (UKS)</h2>
          <h3>LAPORAN OPERASIONAL & PELAYANAN HARIAN</h3>
          <p>Tanggal: <strong>${fmtDate(laporanTanggal)}</strong> &bull; Dicetak oleh: <strong>${esc(currentUser?.nama || 'Petugas UKS')}</strong> (${esc(currentUser?.jabatan || 'Petugas')})</p>
        </div>
      </div>
      <div class="print-divider"></div>
    </div>

    <div class="stat-grid">
      <div class="stat-card accent">
        <div class="label">Pasien Pada Tanggal Ini</div>
        <div class="value">${patientsOnDate.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Anggota A10</div>
        <div class="value">${a10}</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Anggota A11</div>
        <div class="value">${a11}</div>
      </div>
      <div class="stat-card">
        <div class="label">Obat Menipis / Habis</div>
        <div class="value" style="${lowStock > 0 ? 'color:var(--warn)' : ''}">${lowStock}</div>
      </div>
      <div class="stat-card">
        <div class="label">Peralatan Rusak</div>
        <div class="value" style="${equipNotLayak > 0 ? 'color:var(--danger)' : ''}">${equipNotLayak}</div>
      </div>
    </div>

    <!-- Tabel Kunjungan Pasien Hari Ini -->
    <div class="card">
      <div class="section-title">
        <h3>Daftar Kunjungan Pasien &mdash; ${fmtDate(laporanTanggal)}</h3>
        <span class="hint">${patientsOnDate.length} pasien tercatat</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:40px;">No</th>
              <th>Nama Pasien</th>
              <th>Kelas</th>
              <th>Keluhan</th>
              <th>Obat / Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${patientsOnDate.length === 0
      ? '<tr><td colspan="5" style="text-align:center; padding:16px; color:var(--muted)">Tidak ada catatan kunjungan pasien pada tanggal ini.</td></tr>'
      : patientsOnDate.map((p, i) => `<tr><td>${i + 1}</td><td><strong>${esc(p.nama)}</strong></td><td>${esc(p.kelas)}</td><td>${esc(p.keluhan)}</td><td>${esc(p.obat) || '-'}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="section-title"><h3>Ringkasan Absensi Kehadiran &mdash; ${fmtDate(laporanTanggal)}</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Angkatan</th>
              <th>Hadir</th>
              <th>Sakit</th>
              <th>Izin</th>
              <th>Alpha</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Angkatan 10</strong></td><td><span class="badge badge-good">${t10.hadir}</span></td><td><span class="badge badge-warn">${t10.sakit}</span></td><td><span class="badge badge-teal">${t10.izin}</span></td><td><span class="badge badge-danger">${t10.alpha}</span></td></tr>
            <tr><td><strong>Angkatan 11</strong></td><td><span class="badge badge-good">${t11.hadir}</span></td><td><span class="badge badge-warn">${t11.sakit}</span></td><td><span class="badge badge-teal">${t11.izin}</span></td><td><span class="badge badge-danger">${t11.alpha}</span></td></tr>
          </tbody>
        </table>
      </div>
      ${(!attA10 && !attA11) ? `<p class="hint-text" style="margin-top:10px;">Belum ada data absensi tercatat untuk tanggal ${fmtDate(laporanTanggal)}.</p>` : ""}
    </div>

    <div class="card">
      <div class="section-title"><h3>Kondisi Stok Obat & Peralatan</h3></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total Jenis Obat</div><div class="value">${state.medStock.length}</div></div>
        <div class="stat-card"><div class="label">Sudah Kadaluarsa</div><div class="value" style="color:var(--danger)">${expired}</div></div>
        <div class="stat-card"><div class="label">Akan Kadaluarsa (&le;${EXPIRY_WARN_DAYS}h)</div><div class="value" style="color:var(--warn)">${expiringSoon}</div></div>
        <div class="stat-card"><div class="label">Stok Menipis (&le;${STOCK_LOW_THRESHOLD})</div><div class="value" style="color:var(--warn)">${lowStock}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        <h3>Keluhan Pasien Terbanyak</h3>
        <span class="hint">Berdasarkan seluruh riwayat pasien di database</span>
      </div>
      ${topKeluhan.length === 0 ? `<p class="hint-text">Belum ada data pasien tercatat.</p>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jenis Keluhan</th><th>Jumlah Kasus</th></tr></thead>
          <tbody>
            ${topKeluhan.map(([k, v]) => `<tr><td style="text-transform:capitalize"><strong>${esc(k)}</strong></td><td>${v} pasien</td></tr>`).join("")}
          </tbody>
        </table>
      </div>`}
    </div>

    <!-- Lembar Tanda Tangan Cetak -->
    <div class="print-signatures print-only">
      <div class="print-sig-box">
        <p>Petugas Jaga UKS,</p>
        <div class="print-sig-space"></div>
        <p class="print-sig-name"><strong>${esc(currentUser?.nama || 'Petugas')}</strong></p>
        <p class="print-sig-id">NIS: ${esc(currentUser?.nis || '..........')}</p>
      </div>
      <div class="print-sig-box">
        <p>Mengetahui,</p>
        <p>Pembina PMR / UKS</p>
        <div class="print-sig-space"></div>
        <p class="print-sig-name"><strong>..................................................</strong></p>
        <p class="print-sig-id">NIP: .......................................</p>
      </div>
    </div>
  `;
}

function setLaporanTanggal(v) {
  laporanTanggal = v || todayISO();
  renderApp();
}

async function init() {
  checkAuth();
  await loadAll();
  if (currentUser) {
    renderApp();
  }
}

init();
