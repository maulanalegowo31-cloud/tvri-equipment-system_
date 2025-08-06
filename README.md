# 📺 Sistem Pencatatan Alat Digital TVRI World

Sistem manajemen inventaris alat digital yang dibuat khusus untuk TVRI World dengan teknologi PHP + MySQL dan XAMPP. Sistem ini memungkinkan pencatatan peminjaman dan pengembalian alat-alat broadcasting dengan tracking waktu yang detail.

## 🚀 Fitur Utama

- **📋 Manajemen Inventaris Lengkap**: 90+ item alat digital dari TVRI World (kamera, mikrofon, lighting, laptop, drone, dll.)
- **🕐 Tracking Waktu Detail**: Pencatatan waktu pengambilan dan pengembalian dengan presisi tinggi
- **⚡ Deteksi Konflik Jadwal**: Mencegah double booking alat untuk periode waktu yang sama
- **📊 Dashboard Statistik Real-time**: Monitoring status inventaris secara langsung
- **💾 Export Excel**: Export data peminjaman dan inventaris ke format Excel
- **📱 Responsive Design**: Interface yang mobile-friendly dengan desain TVRI branding
- **🔄 Auto Refresh**: Update data secara otomatis dari database

## 🛠️ Teknologi yang Digunakan

- **Backend**: PHP 8.0+ dengan PDO MySQL
- **Database**: MySQL/MariaDB
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Development Environment**: XAMPP (Apache + MySQL + PHP)
- **Icons**: Font Awesome 6
- **Styling**: Custom CSS dengan TVRI color scheme

## 📁 Struktur Proyek

```
tvri-equipment/
├── 📁 api/                    # API endpoints PHP
│   ├── equipment.php          # CRUD operations untuk equipment
│   ├── borrowings.php         # CRUD operations untuk peminjaman
│   ├── statistics.php         # API statistik real-time
│   └── export.php            # Export data ke Excel
├── 📁 assets/                 # Static assets
│   ├── css/
│   │   └── styles.css        # Custom styling TVRI theme
│   └── js/
│       └── app.js            # JavaScript aplikasi utama
├── 📁 config/                 # Konfigurasi database
│   └── database.php          # Koneksi PDO MySQL
├── 📁 database/               # Database schema dan data
│   └── tvri_equipment.sql    # Schema DB + 90+ equipment data
├── 📄 index.html             # Aplikasi utama
└── 📄 README.md              # Dokumentasi ini
```

## 🔧 Instalasi dan Setup

### Prasyarat
- **XAMPP** (Apache + MySQL + PHP 8.0+)
- **Web Browser** modern (Chrome, Firefox, Safari, Edge)
- **Text Editor** (VS Code, Sublime, Notepad++ - opsional)

### Langkah-langkah Instalasi

#### 1️⃣ Download dan Install XAMPP
1. Download XAMPP dari [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Install XAMPP di komputer Anda
3. Pastikan Apache dan MySQL dapat berjalan tanpa error

#### 2️⃣ Setup Database
1. Buka XAMPP Control Panel
2. Start **Apache** dan **MySQL**
3. Klik **Admin** pada MySQL untuk membuka phpMyAdmin
4. Buat database baru bernama `tvri_equipment`
5. Import file `database/tvri_equipment.sql` ke database tersebut:
   - Klik tab **Import**
   - Pilih file `tvri_equipment.sql`
   - Klik **Go** untuk mengimpor

#### 3️⃣ Setup Aplikasi
1. Copy seluruh folder project ke `htdocs` XAMPP:
   ```
   C:\xampp\htdocs\tvri-equipment\
   ```
2. Pastikan struktur folder sesuai dengan struktur di atas
3. Buka browser dan akses:
   ```
   http://localhost/tvri-equipment/
   ```

#### 4️⃣ Konfigurasi Database (jika diperlukan)
Jika menggunakan username/password MySQL yang berbeda, edit file `config/database.php`:
```php
$host = 'localhost';
$dbname = 'tvri_equipment';
$username = 'root';        // Ganti jika berbeda
$password = '';            // Ganti jika ada password
```

## 📋 Cara Penggunaan

### 🔄 Peminjaman Alat
1. Buka tab **"Peminjaman Alat"**
2. Isi form peminjaman:
   - Nama peminjam (wajib)
   - Email peminjam (opsional)
   - Nama acara/kegiatan (wajib)
   - Pilih jenis alat (wajib)
   - Pilih alat spesifik yang tersedia (wajib)
   - Tanggal & waktu pengambilan (wajib)
   - Tanggal & waktu pengembalian (wajib)
   - Kondisi alat saat dipinjam (wajib)
   - Catatan tambahan (opsional)
3. Klik **"Simpan Peminjaman"**

### ↩️ Pengembalian Alat
1. Buka tab **"Pengembalian Alat"**
2. Lihat daftar peminjaman aktif
3. Klik tombol **"Kembalikan"** pada alat yang akan dikembalikan
4. Isi form pengembalian:
   - Tanggal & waktu pengembalian aktual
   - Kondisi alat saat dikembalikan
   - Catatan pengembalian (jika ada masalah)
5. Klik **"Konfirmasi Pengembalian"**

### 📊 Monitoring Inventaris
1. Buka tab **"Status Inventaris"**
2. Gunakan fitur pencarian dan filter:
   - Cari berdasarkan nama alat atau serial number
   - Filter berdasarkan jenis alat
   - Filter berdasarkan kondisi alat
3. Lihat status real-time setiap alat

### 📈 Dashboard Statistik
Dashboard menampilkan:
- **Total Alat**: Jumlah keseluruhan inventaris
- **Tersedia**: Alat yang bisa dipinjam
- **Dipinjam**: Alat yang sedang dipinjam
- **Update Terakhir**: Waktu refresh data terakhir

### 💾 Export Data
1. Klik dropdown **"Export Excel"** di header
2. Pilih jenis data yang ingin di-export:
   - Semua Data Peminjaman
   - Peminjaman Aktif
   - Riwayat Pengembalian
   - Inventaris Alat
   - Ringkasan Statistik

## 🔍 Data Alat yang Tersedia

Sistem sudah termasuk 90+ item alat digital TVRI World:

### 📷 Camera & Video
- Canon XF605 (3 unit)
- Panasonic P2HD (2 unit)
- Panasonic AG-AC (1 unit)
- Sony Alpha A9 (1 unit)
- Sony FX3 (2 unit)

### 🎤 Audio Equipment
- Sennheizer SKM 100 G4 (6 set lengkap dengan receiver)

### 💡 Lighting Equipment
- Godox LF308 Bi (3 unit)
- Aputure Amaran FI (1 unit)
- Stand Lighting Takara (2 unit)

### 🔋 Power & Storage
- Baterai Canon BP-A30 (6 unit)
- Baterai Panasonic AG-VBR59 (2 unit)
- Baterai Sony FX3 (4 unit)
- Various chargers dan adapters

### 📐 Support Equipment
- Tripod Milibo (3 unit)
- Tripod Libec LX7 (2 unit)
- DJI RS 3 Stabilizer (1 unit)

### 💻 Computing
- Laptop Legion (2 unit)
- PC Capture (2 unit)

### 🚁 Drone & Accessories
- DJI Mavic 3 (1 unit)
- Memory cards Sony TOUGH (2 unit)
- Card readers dan accessories

## ⚙️ Konfigurasi Lanjutan

### 🔐 Keamanan Database
Untuk production, disarankan:
1. Ganti password default MySQL
2. Buat user database khusus dengan privilege terbatas
3. Aktifkan SSL untuk koneksi database

### 🎨 Customization
- **Warna tema**: Edit `assets/css/styles.css` bagian `:root` variables
- **Logo**: Ganti logo TVRI di `index.html`
- **Jenis alat**: Tambah/edit di database tabel `equipment`

### 📊 Backup Database
Rutin backup database dengan perintah:
```bash
mysqldump -u root -p tvri_equipment > backup_$(date +%Y%m%d).sql
```

## 🐛 Troubleshooting

### ❌ Error "Database Connection Failed"
1. Pastikan MySQL service berjalan di XAMPP
2. Cek username/password di `config/database.php`
3. Pastikan database `tvri_equipment` sudah dibuat

### ❌ Error "404 Not Found"
1. Pastikan Apache service berjalan
2. Cek folder project sudah benar di `htdocs`
3. Pastikan URL akses sudah benar

### ❌ Error "Permission Denied"
1. Pastikan folder `htdocs` memiliki permission yang benar
2. Disable antivirus sementara saat setup
3. Run XAMPP sebagai Administrator

### ❌ Data Tidak Muncul
1. Cek apakah file `tvri_equipment.sql` sudah di-import
2. Refresh browser atau clear cache
3. Cek console browser untuk error JavaScript

## 🔄 Update dan Maintenance

### Update Data Alat
1. Buka phpMyAdmin
2. Edit tabel `equipment` untuk menambah/edit alat
3. Atau gunakan API endpoint `api/equipment.php`

### Update Sistem
1. Backup database terlebih dahulu
2. Update file-file aplikasi
3. Test fungsionalitas setelah update

## 📞 Support dan Dokumentasi

Untuk bantuan teknis:
1. Cek bagian Troubleshooting di dokumentasi ini
2. Lihat log error di browser console (F12)
3. Cek error log Apache/MySQL di XAMPP

## 🚀 Deployment ke Production

### Untuk VPS/Shared Hosting:
1. Upload semua file ke public_html
2. Import database via cPanel/phpMyAdmin
3. Update `config/database.php` dengan credentials hosting
4. Set permission file yang tepat (644 untuk files, 755 untuk folders)

### Untuk Cloud Hosting (Heroku, etc):
1. Setup environment variables untuk database
2. Update connection string di `config/database.php`
3. Setup auto-deployment dari GitHub repository

## 📄 Lisensi

© 2025 TVRI World. Sistem ini dibuat khusus untuk kebutuhan internal TVRI World.

---

**Sistem Pencatatan Alat Digital TVRI World v1.0**  
*Jendela Dunia Untuk Indonesia* 🇮🇩