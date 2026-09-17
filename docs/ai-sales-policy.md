# Kebijakan AI Sales, Pricing Engine & Perlindungan Margin Keuntungan

Dokumen ini mendefinisikan aturan operasional, rumus perhitungan deterministik, dan batasan kewenangan model percakapan AI pada **ATS AI Sales Workspace**.

---

## 1. Tiga Lapisan Keputusan (Mandat Arsitektur)

| Lapisan | Komponen | Batas Kewenangan |
|---|---|---|
| **1. AI Percakapan** | LLM (Prompt & Context) | Memahami kebutuhan pelanggan, mengekstrak SKU/kuantitas, menyusun kalimat penawaran, menjawab pertanyaan spesifikasi berbasis Knowledge approved. **Dilarang keras memutuskan HPP, margin floor, atau diskon maksimum.** |
| **2. Business Rules Engine** | `PricingEngineService` | Menghitung harga dasar, diskon sekuensial, floor margin, dan mengecek eligibility pengiriman secara deterministik. Diaudit dan diuji terpisah dari model. |
| **3. Manusia** | Admin / Manager / Sales | Menetapkan margin policy, menyetujui quotation di luar batas otonom AI, mengambil alih (takeover) percakapan, dan mengonfirmasi kesepakatan final. |

---

## 2. Rumus Perhitungan Deterministik

### 2.1 Diskon Sekuensial Bertingkat (A34)
Diskon dihitung secara majemuk berurutan (*sequential compounding*), bukan penjumlahan sederhana (*additive*):

$$\text{Net Multiplier} = (1 - d_1) \times (1 - d_2) \times \dots \times (1 - d_n)$$
$$\text{Total Diskon} = 1 - \text{Net Multiplier}$$

**Contoh:** Diskon $10\%$ dilanjutkan diskon $5\%$:
$$\text{Net Multiplier} = (1 - 0.10) \times (1 - 0.05) = 0.90 \times 0.95 = 0.855$$
$$\text{Total Diskon Efektif} = 1 - 0.855 = 14.5\% \quad (\text{bukan } 15\%)$$

### 2.2 Gross Margin & Floor Price (A35)
Margin kotor dihitung dari pendapatan bersih:
$$m = \frac{R - C}{R} \quad \text{untuk } R > 0$$

Harga jual minimum (*Sell Floor*) yang diizinkan untuk otonom AI:
$$\text{Floor Margin} = \frac{C_{\text{HPP}}}{1 - m_{\text{min}}}$$
$$\text{Floor Diskon} = \text{Base Price} \times (1 - \text{Max Auto Discount})$$
$$\text{Effective Floor} = \max(\text{Floor Margin}, \text{Floor Diskon})$$

**Uji Fixture ATS:**
- Base Price: Rp 125.000
- HPP (Cost basis): Rp 80.000
- Minimum Gross Margin ($m_{\text{min}}$): $20\%$
- Max Autonomous Discount: $10\%$
- $\text{Floor Margin} = 80.000 / (1 - 0.20) = \text{Rp } 100.000$
- $\text{Floor Diskon} = 125.000 \times (1 - 0.10) = \text{Rp } 112.500$
- **Harga Penawaran Minimum AI:** $\max(100.000, 112.500) = \text{Rp } 112.500$. AI tidak boleh memberikan penawaran di bawah Rp 112.500.

### 2.3 Biaya Tambahan & Subsidi Ongkir (A36)
Seluruh subsidi ongkir, bonus kredit, atau fee transaksi diperhitungkan bersama total order. Jika subsidi ongkir menyebabkan margin jatuh di bawah $20\%$, penawaran otonom ditolak dan dialihkan ke approval manusia.

### 2.4 Perlindungan Ketiadaan HPP (A37)
Jika data HPP/biaya suatu produk tidak tersedia atau belum diinput oleh admin:
- Sistem **tidak boleh** mengklaim bahwa margin aman.
- AI hanya boleh menawarkan harga *approved fixed list price*.
- Setiap permohonan diskon otomatis dialihkan ke antrean persetujuan manusia (*needs approval* / handoff).

---

## 3. Sistem Skor Niat Beli (Intent Scoring 0–100)

Skor niat beli dievaluasi secara explainable menggunakan sinyal transaksi bernilai bobot:

| Sinyal Terverifikasi | Bobot | Bukti yang Dibutuhkan |
|---|---|---|
| SKU / Tipe produk spesifik | +15 | Menyebutkan SKU, seri, atau merk terdaftar |
| Kuantitas & satuan jelas | +15 | Menyebutkan angka + pcs/unit/set |
| Kebutuhan waktu / urgensi konkret | +10 | Menyebutkan deadline/proyek/kapan barang tiba |
| Meminta penawaran / invoice / PO | +20 | Permintaan dokumen komersial formal |
| Menyetujui harga / konfirmasi siap order | +30 | Kata sepakat atau siap transfer |
| Menanyakan rekening / ekspedisi | +10 | Menanyakan nomor rekening bank atau ongkir |
| **Negasi / Pembatalan Transaksi (A40)** | **-15** | "tidak jadi beli", "jangan buat invoice", "cuma riset" |

### Kategori Niat Beli:
- **HOT:** Skor $\ge 75$ (Otomatis masuk antrean prioritas Takeover Manusia)
- **WARM:** Skor $40 - 74$
- **COLD:** Skor $< 40$
- **UNKNOWN:** Belum ada sinyal transaksi yang memadai.

> **Catatan Kritis (A39):** Kolom `purchase_probability` bersifat `NULL` dan tidak diisi dengan membagi skor niat dengan 100. Probabilitas hanya ditampilkan bila model prediksi telah dikalibrasi pada data outcome nyata.

---

## 4. Deteksi Negosiasi Alot (A41 & A42)

- Setiap permohonan diskon dicatat ke dalam **Persistent Concession Ledger** (tabel `concessions`).
- **Negosiasi Alot:** Jika terjadi $\ge 3$ putaran keberatan atau penawaran balik material pada isu yang sama tanpa progres, sesi ditandai sebagai `stalled` dan percakapan dibekukan untuk dialihkan ke Manusia Utama.
- **Pesan Sopan / Diam (A42):** Pesan terima kasih, konfirmasi penerimaan pesan, atau webhook duplikat **tidak dihitung** sebagai putaran negosiasi baru.
