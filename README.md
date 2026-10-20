# 🏥 MY UKS — Markas Digital Palang Merah Remaja (PMR)
> **Sistem Informasi Manajemen UKS, Inventarisasi Medis, Presensi & Penugasan Markas PMR Wira**  
> Dideploy di **Vercel** dengan Database Real-time **Google Cloud Firestore**.

---

## 📌 Daftar Isi
1. [Tentang Website & Fitur Utama](#1-tentang-website--fitur-utama)
2. [Panduan Menjalankan Proyek Secara Lokal](#2-panduan-menjalankan-proyek-secara-lokal)
3. [Struktur Folder & Komponen Utama](#3-struktur-folder--komponen-utama)
4. [Struktur Koleksi Firestore & Skema Data](#4-struktur-koleksi-firestore--skema-data)
5. [Sistem Role & Tingkatan Hak Akses](#5-sistem-role--tingkatan-hak-akses)
6. [Konfigurasi Firebase & Environment Variables](#6-konfigurasi-firebase--environment-variables)
7. [Panduan Deployment ke Vercel](#7-panduan-deployment-ke-vercel)
8. [Panduan Backup & Pemulihan Data (Disaster Recovery)](#8-panduan-backup--pemulihan-data)
9. [Panduan Pergantian Kepengurusan & Tambah Angkatan Baru](#9-panduan-pergantian-kepengurusan--tambah-angkatan-baru)
10. [Troubleshooting (Mengatasi Kendala yang Sering Terjadi)](#10-troubleshooting)

---

## 1. Tentang Website & Fitur Utama
**MY UKS** adalah aplikasi web modern (*Single Page Application*) yang dirancang khusus untuk operasional Palang Merah Remaja (PMR). Aplikasi ini mengintegrasikan seluruh operasional fisik UKS ke dalam format digital yang rapi, transparan, dan mudah digunakan oleh seluruh anggota maupun pimpinan.

### ✨ Fitur Unggulan:
- **Beranda & Statistik Real-time**: Ringkasan jumlah personil, rekam medis harian, status stok obat kritis, dan kehadiran hari ini.
- **Data Anggota**: Manajemen basis data personil PMR (Angkatan, Kelas, Jabatan, Jenis Kelamin, dan status akun).
- **Rekam Medis Pasien UKS**: Pencatatan siswa yang sakit, keluhan, obat/tindakan medis yang diberikan, serta status penanganan.
- **Inventaris Stok UKS**: Pemantauan kuantitas obat, masa kadaluarsa (*expiry date*), dan indikator stok menipis.
- **Absensi & Presensi Mandiri**: Pencatatan kehadiran latihan rutin (Hadir, Menyusul, Mendahului, Izin, Sakit, Alpha).
- **Jadwal Jaga Upacara & TTD**: Penugasan pos jaga upacara bendera hari Senin dan pembagian ruang pendataan TTD.
- **📊 Frekuensi Jaga Upacara**: Panel analisis pemerataan beban tugas yang otomatis mengurutkan personil dari yang paling jarang bertugas (0x) ke yang paling sering.
- **📢 Agenda & Informasi**: Pusat materi latihan, forum musyawarah, dan siaran pengumuman resmi dengan generator pesan siaran WhatsApp otomatis dan kalkulator hari berbahasa Indonesia (`Asia/Jakarta`).
- **📈 Laporan & Rekapitulasi Presisi**: Rekapitulasi kehadiran harian per tanggal kegiatan, rincian hadir per angkatan (A10 vs A11), ekspor CSV, serta fitur pengelolaan & pembersihan log audit aman.
- **👤 Profil & Akun Pengguna**: Pengaturan tema (*Dark / Light Mode*), penggantian kata sandi yang aman tanpa pencatatan teks biasa, dan sesi keluar (*logout*).

---

## 2. Panduan Menjalankan Proyek Secara Lokal
Aplikasi ini dibangun menggunakan **Vanilla Web Standards** (HTML5, CSS3, JavaScript ES6) tanpa perlu build step yang rumit. Siapa pun (termasuk adik kelas jurusan non-IT seperti Geomatika) dapat menjalankannya dengan mudah!

### Cara Cepat (Menggunakan VS Code / Browser):
1. **Unduh atau Clone Repositori**:
   ```bash
   git clone https://github.com/ayuuuu04/MYUKS.git
   cd MYUKS
   ```
2. **Jalankan Web Server Lokal**:
   - Jika menggunakan **VS Code**, pasang ekstensi **Live Server**, klik kanan pada file `index.html` lalu pilih **"Open with Live Server"**.
   - Atau jika memiliki **Node.js** terpasang di komputer:
     ```bash
     npx serve .
     ```
   - Buka browser di alamat: `http://localhost:3000` (atau port yang ditampilkan).

---

## 3. Struktur Folder & Komponen Utama
```text
MYUKS/
├── index.html          # Kerangka utama aplikasi (Sidebar, Mobile Header, Nav, Main Container)
├── app.js              # Otak logika aplikasi (Router, DB Store, Session, Form, Modal & View)
├── style.css           # Desain antarmuka, tema warna, Dark/Light mode tokens, responsivitas HP
├── api/
│   └── config.js       # Vercel Serverless Function untuk menyalurkan konfigurasi Firebase aman
├── .env.example        # Panduan variabel lingkungan untuk deployment produksi
└── .gitignore          # Daftar file yang diabaikan dari Git (.env, cache, dll)
```

---

## 4. Struktur Koleksi Firestore & Skema Data
Database utama disimpan pada layanan **Google Cloud Firestore**. Seluruh data disimpan dalam satu koleksi utama bernama **`pmr_data`**, dengan masing-masing dokumen mewakili modul aplikasi:

| ID Dokumen di `pmr_data` | Key LocalStorage | Isi & Fungsi Dokumen |
|---|---|---|
| `anggota` | `pmr_anggota` | Array data personil: `{ id, nama, nis, kelas, angkatan, jk, jabatan, password }` |
| `pasien` | `pmr_pasien` | Array rekam medis: `{ id, tanggal, nama, kelas, keluhan, tindakan, status }` |
| `stok` | `pmr_stok` | Array obat & alat: `{ id, nama, kategori, jumlah, satuan, min, kadaluarsa }` |
| `absensi` | `pmr_absensi` | Array riwayat presensi: `{ id, tanggal, anggotaId, status }` |
| `logs` | `pmr_logs` | Array log audit: `{ id, timestamp, waktu, tipe, pelaku, jabatan, nis, pesan, detail }` |
| `upacara` | `pmr_upacara` | Array jadwal upacara: `{ id, tanggal, nama, titikJaga: [{ pos, anggota }] }` |
| `ttd` | `pmr_ttd` | Array jadwal TTD: `{ id, tanggal, nama, kelompok: [{ nama, kelas, anggota }] }` |
| `agenda` | `pmr_agenda` | Array gabungan agenda & info: `{ id, kategori, tujuan, tanggal, hariTanggal, jam, tempat, kegiatan, urgensi, seragam, note }` |
| `jadwal_materi` | `pmr_jadwal_materi` | Arsip data jadwal materi (tersinkronisasi dengan `agenda`) |
| `jadwal_forum` | `pmr_jadwal_forum` | Arsip data jadwal forum (tersinkronisasi dengan `agenda`) |
| `pengumuman` | `pmr_pengumuman` | Arsip siaran pengumuman (tersinkronisasi dengan `agenda`) |

> [!NOTE]
> Aplikasi menggunakan pola **Dual Storage (Offline-First)**: Data pertama kali dibaca dari `localStorage` perangkat untuk kecepatan instan, kemudian tersinkronisasi secara real-time dua arah (*two-way sync*) ke Firestore melalui `onSnapshot` dan `setDoc`.

---

## 5. Sistem Role & Tingkatan Hak Akses

| Tingkat Role | Siapa Saja? | Kewenangan & Hak Akses |
|---|---|---|
| **Admin Utama** | Akun `admin` | Akses absolut ke seluruh data, CRUD anggota/stok/pasien, bersihkan log audit, dan konfigurasi database. |
| **Pimpinan** | Ketua & Koordinator | Akses operasional penuh: melihat log audit & notifikasi lonceng, kunci/buka absensi, buat/ubah/hapus jadwal upacara & agenda, kelola log audit. |
| **Pimpinan Inti** | Sekretaris | Membuat, mengubah, dan menghapus Agenda & Informasi, Jadwal Materi, Jadwal Forum, dan Pengumuman Resmi. |
| **Pengurus** | Komandan Lapangan, Bendahara, Humas, dll. | Mencatat pasien UKS, mengelola stok obat, membuka presensi kegiatan, dan mengatur penugasan pos jaga. |
| **Anggota Biasa** | Personil PMR umum | Melihat Beranda, Data Pasien, Stok, Jadwal Jaga, Agenda & Info, menyalin pesan broadcast WA, presensi mandiri, mengganti password akun pribadi, dan mengatur tema (Dark/Light). |

---

## 6. Konfigurasi Firebase & Environment Variables

### Daftar Variabel Lingkungan (Vercel):
Variabel ini wajib diatur pada dashboard proyek di **Vercel** (`Settings > Environment Variables`):

| Nama Variabel | Fungsi | Contoh Nilai (Bukan Rahasia) |
|---|---|---|
| `FIREBASE_API_KEY` | Kunci Web API Project Firebase | `AIzaSyBZmAP...` |
| `FIREBASE_AUTH_DOMAIN` | Domain autentikasi Firebase | `sijaga-uks.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | ID Unik Project Firebase | `sijaga-uks` |
| `FIREBASE_STORAGE_BUCKET`| Bucket penyimpanan file | `sijaga-uks.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | ID pengirim notifikasi | `105432...` |
| `FIREBASE_APP_ID` | Identitas aplikasi web Firebase | `1:105432...:web:...` |

---

## 7. Panduan Deployment ke Vercel

Setiap pembaruan kode yang di-*push* ke branch `main` di GitHub akan **otomatis dideploy oleh Vercel** dalam hitungan detik.

### Langkah Menyambungkan ke Vercel untuk Kepengurusan Baru:
1. Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub organisasi/pengurus.
2. Klik tombol **"Add New..." > "Project"**.
3. Pilih repositori **`MYUKS`**.
4. Pada bagian **Environment Variables**, masukkan 6 variabel Firebase di atas.
5. Klik **"Deploy"**. Website akan langsung aktif dan memiliki tautan HTTPS otomatis.

---

## 8. Panduan Backup & Pemulihan Data
Untuk menjamin keamanan data historis anggota dan rekam medis:

### A. Cadangan Rutin (CSV Export):
1. Masuk sebagai **Ketua / Koordinator / Admin**.
2. Buka menu **Laporan**:
   - Klik **Ekspor Data Pasien (CSV)** untuk arsip medis siswa.
   - Klik **Ekspor Stok Obat (CSV)** untuk laporan pertanggungjawaban barang UKS.
   - Klik **Ekspor Rekap Presensi (CSV)** untuk rekapitulasi kehadiran per tanggal kegiatan.
   - Di tab **Audit Log**, klik tombol **Kelola Log** > **Unduh Arsip CSV** sebelum melakukan pembersihan log.

### B. Cadangan Kode Sumber (Git):
Sebelum melakukan pembaruan besar, selalu buat branch backup:
```bash
git checkout -b backup-sebelum-update-besar
git push origin backup-sebelum-update-besar
```

---

## 9. Panduan Pergantian Kepengurusan & Tambah Angkatan Baru

Saat pergantian tahun ajaran baru atau pelantikan pengurus baru:

1. **Menambah Anggota Angkatan Baru (misal: Angkatan 12)**:
   - Masuk sebagai **Ketua / Koordinator / Admin**.
   - Buka menu **Anggota** > Klik **"+ Tambah Anggota"**.
   - Masukkan Nama, NIS, Kelas, Angkatan (`12`), Jenis Kelamin (`L` / `P`), dan Jabatan (`Anggota`).
   - Kata sandi bawaan anggota baru otomatis adalah **NIS** mereka masing-masing.
2. **Memperbarui Jabatan Pengurus Baru**:
   - Buka menu **Anggota** > Cari nama anggota terpilih > Klik **"Ubah"**.
   - Ubah jabatannya menjadi `Ketua`, `Koordinator`, `Sekretaris`, dll.
   - Izin akses pimpinan akan otomatis aktif begitu jabatan diperbarui!
3. **Menonaktifkan / Menandai Alumni**:
   - Anggota angkatan lama (misal Angkatan 10 yang telah lulus) **jangan dihapus** agar riwayat tugas upacara dan rekapitulasi presensi mereka di masa lalu tetap utuh. Cukup tandai kelas mereka atau biarkan tercatat sebagai alumni.

---

## 10. Troubleshooting

### ❓ Mengapa muncul peringatan "Firebase Disconnected" atau titik kuning?
- Periksa koneksi internet Anda.
- Jika menggunakan hosting Vercel, pastikan Environment Variables di Vercel sudah terisi dengan benar.
- Pengguna dapat mengklik badge **Firebase** di pojok kanan atas untuk memasukkan konfigurasi manual jika diperlukan.

### ❓ Anggota lupa kata sandi akunnya?
- Masuk sebagai **Ketua**, **Koordinator**, atau **Admin**.
- Buka menu **Anggota** > Cari nama anggota yang lupa kata sandi.
- Klik tombol kunci / **"Ubah Password"** pada baris anggota tersebut untuk mereset kata sandi mereka.

### ❓ Hari dan tanggal di pesan WhatsApp berbeda dengan kalender?
- Seluruh sistem tanggal di aplikasi MY UKS telah disetel ke zona waktu **`Asia/Jakarta` (WIB)** dengan perhitungan otomatis. Pastikan jam pada perangkat HP/laptop Anda tidak disetel manual ke zona waktu luar negeri.

---
**Siamo Tutti Fratelli! ⛑️**  
*Dikelola dengan bangga oleh Palang Merah Remaja (PMR) Wira SMK Negeri 2 Surakarta.*