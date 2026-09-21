# ATS AI Sales Workspace — Internal WhatsApp AI Sales & Human Takeover

Aplikasi internal enterprise untuk mengelola multi-nomor WhatsApp bisnis, melayani pelanggan secara otonom dengan AI berbasis knowledge perusahaan, melakukan negosiasi harga di dalam batas margin keuntungan yang ketat, dan menyerahkan percakapan kepada operator manusia pada waktu yang tepat melalui pagar atomik (*control epoch fencing*).

> **Catatan Kepatuhan Ruang Lingkup:**  
> Sesuai spesifikasi Revisi 2, aplikasi ini murni **aplikasi internal operasional (tanpa website publik, landing page, SEO, atau marketing CMS)**. Root `/` mengarahkan pengguna langsung ke `/login` atau `/app/dashboard`.

---

## 1. Fitur Utama Rilis Inti

1. **Multi-Number WhatsApp Bisnis (`/app/numbers`):**
   - **WhatsApp Multi-Device (Baileys QR Code — Default):** Hubungkan nomor WhatsApp fisik Anda (nomor pribadi atau WhatsApp Business) langsung dari ponsel hanya dengan **Scan QR Code** (*Linked Devices*), tanpa perlu mendaftar di Meta for Developer, tanpa WABA ID, dan tanpa biaya pesan percakapan Meta.
   - Mendukung Fake Sandbox Provider (`DEMO`) untuk simulasi tanpa kuota, serta Meta Cloud API opsional.
   - Konfigurasi persona AI, mode (`off`, `assist`, `autonomous`), jam operasional, dan alokasi Manusia Utama serta Tim Backup per nomor.
   - Dilengkapi *Sandbox Simulasi Chat* untuk menguji persona dan harga sebelum live.

2. **Knowledge Center & Autofill Profil Perusahaan (`/app/knowledge/*`):**
   - Katalog produk teknis (contoh data nyata: Schneider Electric MCB, MCCB, Kontaktor, Thermal Overload).
   - Ekstraksi otomatis dokumen Company Profile (PDF/DOCX) ke draft profil bisnis terstruktur dengan sitasi sumber (*provenance*).
   - Price list bertingkat (*quantity tiers*), kebijakan diskon sekuensial, dan tabel HPP internal yang terproteksi hak akses `cost.view`.

3. **Pricing Engine Deterministik & Perlindungan Margin Keuntungan:**
   - Diskon majemuk berurutan: diskon $10\%$ lalu $5\%$ menghasilkan diskon efektif **$14.5\%$**, bukan $15\%$.
   - Validasi floor margin: $\text{Sell Floor} = \max(\text{Floor Margin}, \text{Floor Diskon})$. Penawaran otonom di bawah floor otomatis diblokir.
   - Proteksi ketiadaan HPP: jika biaya tidak terdefinisi, AI dilarang mengklaim margin aman dan hanya dapat mengutip harga list resmi.

4. **Intent Scoring 0–100 & Deteksi Negosiasi Alot:**
   - Skor niat beli *explainable* dengan bobot sinyal transaksi (SKU spesifik $+15$, kuantitas $+15$, urgensi $+10$, minta penawaran $+20$, siap order $+30$).
   - Pembatalan negasi otomatis: kata-kata "tidak jadi beli" atau "jangan buat invoice" langsung membatalkan deteksi closing.
   - Deteksi negosiasi alot: $\ge 3$ putaran tawar-menawar tanpa progres langsung menandai status `negotiation_stalled` dan membekukan giliran AI.

5. **Antrean Prioritas & Human Takeover Atomik (`/app/takeover`):**
   - Operator manusia dapat mengambil alih percakapan **kapan pun**.
   - **Control Epoch & Dispatch Fence:** Pagar pengiriman membuang balasan AI yang terlambat digenerasi jika manusia telah melakukan takeover saat LLM sedang berjalan.
   - **Compare-and-Swap (CAS Lock):** Mencegah perebutan chat antar dua agen (hanya 1 pemenang klaim, lainnya menerima notifikasi konflik 409).
   - **Handover Brief:** Panel ringkasan instan menyajikan kebutuhan, penawaran sah terakhir, bid pelanggan, dan alasan pengalihan.

6. **Inbox Multiagen (`/app/inbox`):**
   - Tata letak 3 kolom: Daftar percakapan (320px), Ruang chat dinamis, dan Panel Handover Brief / Quote (304px).
   - Penegakan jendela 24 jam resmi WhatsApp (*Customer Service Window*).

---

## 2. Tech Stack

- **Backend:** Laravel 13 (PHP 8.4)
- **Database:** SQLite / PostgreSQL kompatibel
- **Frontend:** React 19, TypeScript, Inertia.js, Tailwind CSS v4, Lucide Icons
- **Bundler:** Vite
- **Integrasi WhatsApp:** Meta Cloud API Adapter + Fake WhatsApp Sandbox Provider (`DEMO`)
- **Pengujian:** PHPUnit / Laravel Test Suite (26 automated feature tests)

---

## 3. Akun Pengguna Bawaan (Database Seeder)

Semua akun menggunakan kata sandi: `password`

| Email | Peran / Hak Akses | Keterangan |
|---|---|---|
| `owner@ats.co.id` | **Owner** | Akses penuh seluruh sistem & konfigurasi |
| `manager@ats.co.id` | **Manager** | Manajemen tim penjualan, penugasan, dan approval |
| `sales1@ats.co.id` | **Agent (Manusia Utama)** | Penanganan inbox percakapan dan takeover |
| `pricing@ats.co.id` | **Pricing Approver** | Akses `cost.view`, kelola HPP dan persetujuan margin |

---

## 4. Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- PHP 8.2+
- Composer
- Node.js 20+ & npm

### Langkah Instalasi
```bash
# 1. Masuk ke direktori proyek
cd ats-ai-sales-workspace

# 2. Install dependensi backend & frontend
composer install
npm install

# 3. Konfigurasi environment
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi dan seeder data bisnis
touch database/database.sqlite
php artisan migrate:fresh --seed

# 5. Build aset antarmuka
npm run build

# 6. Jalankan server lokal Laravel
php artisan serve

# 7. Jalankan microservice WhatsApp Baileys (di terminal terpisah)
npm run baileys
```
Aplikasi dapat diakses melalui browser di `http://127.0.0.1:8000/`.
Untuk menautkan nomor WhatsApp Anda:
1. Buka menu **Nomor WhatsApp (`/app/numbers`)**.
2. Klik tombol **"Scan QR WA"** pada nomor yang terdaftar.
3. Buka WhatsApp di smartphone Anda > **Perangkat Tertaut (Linked Devices)** > **Tautkan Perangkat**, lalu pindai QR Code di layar.
4. WhatsApp akan otomatis terhubung dan AI Sales langsung aktif melayani pesan pelanggan!

---

## 5. Menjalankan Pengujian Otomatis

Untuk memverifikasi seluruh 26 acceptance tests skenario A01–A60:

```bash
php artisan test
```

---

## 6. Dokumentasi Lengkap
- [Panduan Setup Meta for Developers (Cloud API)](docs/META_DEVELOPER_SETUP.md) *(Langkah demi langkah registrasi WABA, System User Token, Webhook & Real Number)*
- [Panduan Setup WhatsApp & Sandbox](docs/setup-whatsapp.md)
- [Kebijakan AI Sales & Margin Protection](docs/ai-sales-policy.md)
- [Protokol Human Takeover & Fencing](docs/human-takeover.md)
- [Laporan Hasil Pengujian Otomatis](docs/test-report.md)
