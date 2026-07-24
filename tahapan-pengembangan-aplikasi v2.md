# Tahapan Pengembangan Aplikasi Kasir

Dokumen ini menjelaskan gambaran umum aplikasi dan langkah-langkah membangunnya, ditulis untuk yang belum familiar dengan proses development.

---

## Bagian 1: Informasi Umum Aplikasi

### Apa aplikasi ini
Aplikasi kasir berbasis web untuk UMKM dan warung, bisa dipakai lewat browser di HP, tablet, atau komputer — tidak perlu instal aplikasi terpisah.

### Fitur utama
- **Kasir**: transaksi penjualan, riwayat transaksi, cetak/kirim struk
- **Manajemen stok**: data produk, stok masuk, stok opname
- **Laporan**: penjualan, laba rugi, stok, kas
- **Pengaturan**: info toko, kelola user, status langganan, panduan penggunaan
- **Multi-user dengan peran berbeda**: Owner (akses penuh) dan Kasir (tidak bisa lihat laporan atau ubah info toko/langganan)

### Model bisnis
- Pengguna daftar lebih dulu, akun berstatus "menunggu aktivasi"
- Setelah bayar (manual, transfer), kamu selaku pemilik aplikasi kirim kode aktivasi lewat email/WhatsApp
- Kode aktivasi berlaku 1 tahun, setelah itu perlu diperpanjang

### Teknologi yang dipakai
Ini istilah teknis, tapi cukup tahu perannya masing-masing:

| Bagian | Teknologi | Fungsinya |
|---|---|---|
| Tampilan aplikasi (yang dilihat pengguna) | Next.js, di-hosting di Vercel | "Wajah" aplikasi — halaman kasir, stok, laporan, dll |
| Data (produk, transaksi, stok) | Supabase (database) | Tempat semua data disimpan dan diambil |
| Login dan aktivasi | Supabase Auth | Mengatur siapa yang boleh masuk dan mengakses data toko masing-masing |

Kedua layanan ini punya paket gratis yang cukup untuk memulai, baru perlu upgrade berbayar kalau pengguna sudah banyak.

### Catatan penting
Karena kamu masih awam soal development, ada dua jalur yang bisa ditempuh:
1. **Kamu belajar sedikit dan pakai bantuan AI (seperti Claude Code) untuk menulis kodenya**, sambil saya bantu rancang tiap bagian
2. **Kamu mempekerjakan developer**, dan dokumen-dokumen yang sudah kita buat (wireframe, panduan penggunaan, nanti skema database) dipakai sebagai acuan supaya developer paham persis yang kamu mau

Kedua jalur itu sama-sama valid — dokumen ini disusun supaya bisa dipakai untuk keduanya.

---

## Bagian 2: Tahapan Pengembangan

### Tahap 0 — Persiapan akun dan tools
Sebelum mulai coding, siapkan:
- Akun Supabase (gratis)
- Akun Vercel (gratis)
- Akun GitHub (tempat menyimpan kode, gratis)

*Belum perlu dikerjakan sekarang — nanti kita lakukan bersama saat mulai membangun.*

### Tahap 1 — Rancang skema database
Menentukan tabel apa saja yang dibutuhkan (produk, transaksi, stok, user, kode aktivasi, dll) dan bagaimana tabel-tabel itu saling terhubung. **Ini langkah berikutnya yang akan kita kerjakan setelah dokumen ini.**

### Tahap 2 — Bangun sistem autentikasi dan aktivasi
- Halaman daftar dan masuk
- Alur menunggu aktivasi
- Input kode aktivasi
- Sistem masa berlaku 1 tahun dan penguncian otomatis kalau sudah habis masa aktif

### Tahap 3 — Bangun modul manajemen stok
- Halaman daftar produk
- Tambah/edit produk
- Stok masuk
- Stok opname

*Dikerjakan lebih dulu dari Kasir karena kasir butuh data produk yang sudah ada untuk bisa dijual.*

### Tahap 4 — Bangun modul kasir
- Pencarian produk dan keranjang
- Metode pembayaran
- Struk (kirim WhatsApp / unduh)
- Riwayat transaksi

### Tahap 5 — Bangun modul laporan
- Laporan penjualan, laba rugi, stok, kas
- Filter periode dan fitur export

### Tahap 6 — Bangun modul pengaturan dan hak akses
- Info toko
- Kelola user dan kasir, dengan pembatasan akses sesuai peran (Owner vs Kasir)
- Status langganan
- Panduan penggunaan (isi dari dokumen panduan yang sudah kita buat, dimasukkan ke dalam aplikasi)

### Tahap 6.5 — Bangun dashboard admin (untuk pemilik aplikasi)
Ini dashboard terpisah, khusus buat kamu selaku pemilik aplikasi — bukan untuk toko/pengguna. Aksesnya juga beda: bukan lewat sistem peran Owner/Kasir yang dipakai toko, tapi mekanisme akses tersendiri karena dashboard ini perlu melihat data lintas-toko.

Fungsi minimal yang dibutuhkan:
- **Daftar toko**: lihat semua toko yang terdaftar beserta status langganannya (menunggu aktivasi / aktif / kedaluwarsa)
- **Generate kode aktivasi**: untuk toko yang sudah bayar dan menunggu aktivasi
- **Perpanjang langganan**: memperbarui masa aktif toko yang bayar perpanjangan
- **Lihat detail toko**: info dasar tiap toko untuk keperluan monitoring

*Ditempatkan di sini (bukan di awal) karena testing alur aktivasi bisa dilakukan manual lewat Supabase dulu — tapi harus selesai sebelum Tahap 8 (rilis ke pengguna pertama), karena begitu ada toko sungguhan, generate kode aktivasi manual lewat SQL Editor jadi berisiko dan tidak scalable.*

### Tahap 7 — Uji coba (testing)
- Coba semua alur sebagai Owner dan sebagai Kasir
- Coba alur dashboard admin: generate kode aktivasi → toko input kode → akun aktif
- Uji di HP, tablet, dan komputer untuk memastikan tampilan menyesuaikan dengan baik
- Perbaiki bug yang ditemukan

### Tahap 8 — Rilis ke pengguna pertama
- Pilih beberapa warung/UMKM untuk coba pakai lebih dulu (uji coba terbatas)
- Kumpulkan masukan mereka
- Perbaiki berdasarkan masukan sebelum dipakai lebih luas

---

## Ringkasan urutan kerja

```
Skema database
     ↓
Autentikasi & aktivasi
     ↓
Manajemen stok
     ↓
Kasir
     ↓
Laporan
     ↓
Pengaturan & hak akses
     ↓
Dashboard admin (untuk pemilik aplikasi)
     ↓
Testing
     ↓
Rilis ke pengguna pertama
```

Setiap tahap tidak harus selesai 100% sebelum lanjut ke tahap berikutnya — tapi urutan di atas paling masuk akal karena tahap belakang bergantung pada data yang dibuat tahap sebelumnya (misalnya kasir butuh data produk yang sudah ada). Dashboard admin ditempatkan menjelang testing karena selama tahap-tahap awal, kode aktivasi masih bisa digenerate manual lewat Supabase — tapi harus sudah siap sebelum rilis ke pengguna pertama.
