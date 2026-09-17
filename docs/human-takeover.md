# Protokol Human Takeover, Atomic Fencing & Handover Brief

Dokumen ini menjelaskan mekanisme pengalihan kontrol percakapan dari AI Sales ke operator manusia (*Human Takeover*), proteksi konkurensi (CAS Lock), dan pagar pengiriman pesan (*Dispatch Fence*).

---

## 1. Hak Asasi Manusia & Fleksibilitas Takeover

1. **Takeover Kapan Pun:** Manusia Utama, backup, atau manager dapat mengambil alih percakapan kapan saja tanpa tergantung pada skor niat beli atau status negosiasi.
2. **Kategori Pemicu Otomatis (Reason Codes):**
   - `buying_intent_high`: Skor niat beli $\ge 75$ (HOT lead).
   - `ready_to_order`: Pelanggan mengonfirmasi jumlah atau meminta nomor rekening / invoice.
   - `negotiation_stalled`: Terjadi $\ge 3$ putaran negosiasi alot tanpa progres.
   - `discount_limit`: Permintaan harga di bawah floor margin kebijakan.
   - `customer_requests_human`: Permintaan eksplisit pelanggan untuk berbicara dengan manusia.
   - `knowledge_gap`: Informasi produk tidak tersedia di knowledge release approved.

---

## 2. Pagar Pengiriman & Invalidation Epoch (A44 & A45)

### Masalah Race Condition:
Ketika manusia menekan tombol **Ambil Alih** tepat pada saat LLM sedang melakukan inferensi output, balasan LLM yang terlambat (*late output*) berisiko terkirim ke pelanggan dan mengganggu komunikasi agen manusia.

### Solusi Teknis:
1. Setiap percakapan memiliki kolom `control_epoch` (integer bertambah naik).
2. Setiap tugas AI membawa snapshot `control_epoch_snapshot`.
3. Pada saat takeover dieksekusi:
   - Nilai `control_epoch` di database langsung dinaikkan $+1$.
   - Kolom `control_owner` diubah menjadi `handoff_requested` atau `human_active`.
4. Sebelum pesan AI dikirimkan ke WhatsApp Provider (Meta API), `checkDispatchFence()` memeriksa:
   - Apakah `control_owner === 'ai_active'`?
   - Apakah `message.control_epoch_snapshot === conversation.control_epoch`?
5. Karena epoch telah bertambah, pesan AI lama yang baru selesai digenerasi langsung **dibuang** (*discarded*) dan tidak pernah sampai ke pelanggan (A44).

---

## 3. Klaim Atomik Bergaransi (CAS Lock — A02 & A46)

Jika dua agen manusia mencoba menekan tombol **Klaim Percakapan** secara bersamaan:
- Transaksi database menggunakan baris `SELECT ... FOR UPDATE`.
- Sistem memeriksa status klaim sebelum update dilakukan.
- Hanya agen pertama yang berhasil mengklaim (`claimed_by_user_id`).
- Agen kedua menerima respon konflik HTTP 409 yang jelas dan antarmuka disinkronkan secara realtime bahwa chat telah ditangani rekan kerjanya.

---

## 4. Handover Brief Terstruktur (Panel Informasi Agen)

Saat membuka ruang percakapan yang dialihkan, panel kanan secara instan menampilkan **Handover Brief**:
- **Kebutuhan Pelanggan:** SKU yang diminati, jumlah kuantitas, estimasi jadwal pemakaian.
- **Penawaran Terakhir:** Nomor Quotation, revisi aktif, dan nominal penawaran sah.
- **Riwayat Tawar-Menawar:** Bid terakhir pelanggan, jumlah putaran diskon yang sudah diberikan.
- **Alasan Pengalihan:** Mengapa chat dialihkan ke manusia (disertai kutipan pesan pemicu).
- **Proteksi Akses Biaya (A56):** Data HPP dan margin detail hanya tampak bagi user yang memiliki permission `cost.view`. Bagi agen biasa, status margin ditampilkan sebagai *"Dalam batas kebijakan"* demi keamanan rahasia dagang.

---

## 5. Pengembalian Eksplisit ke AI (A49)

- Percakapan yang sudah berada dalam status `human_active` **hanya dapat dikembalikan ke AI secara eksplisit oleh operator manusia** melalui tombol *Kembalikan ke AI*.
- Tidak ada batas waktu otomatis (*auto-timeout*) yang mengembalikan percakapan ke AI tanpa persetujuan manusia.
- Saat dilepaskan kembali ke AI:
  - Nilai `control_epoch` kembali dinaikkan $+1$.
  - Catatan konteks dari operator disimpan ke dalam `internal_notes`.
  - Komitmen harga dan kuantitas yang telah disepakati manusia tetap dipertahankan.
