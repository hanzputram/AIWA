# Panduan Setup Integrasi WhatsApp Resmi (WABA & Cloud API)

Aplikasi **ATS AI Sales Workspace** dirancang untuk bekerja langsung dengan WhatsApp Business API resmi (Meta Cloud API) serta dilengkapi Fake Sandbox Provider berlabel `DEMO` untuk lingkungan staging, CI/CD, dan simulasi tanpa risiko pengiriman pesan live.

---

## 1. Persyaratan Akun Meta Developer & WABA

1. **Meta Business Account (WABA)** terverifikasi.
2. **App ID & App Secret** yang dibuat di [developers.facebook.com](https://developers.facebook.com).
3. Produk **WhatsApp** yang terhubung dengan akun WABA.
4. **Phone Number ID** resmi dari nomor bisnis perusahaan yang telah lolos verifikasi nomor.
5. **System User Access Token** permanen dengan permission:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

---

## 2. Konfigurasi Environment (`.env`)

```env
# Meta WhatsApp Cloud API Configuration
META_GRAPH_VERSION=v20.0
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=ats_verify_token_2026
META_SYSTEM_USER_TOKEN=EAAG...your_token_here
```

---

## 3. Pendaftaran Nomor WhatsApp Bisnis

Admin workspace mendaftarkan nomor bisnis melalui menu **Nomor WhatsApp** (`/app/numbers`):
- **Label Nomor:** Contoh: *ATS Sales Division — Schneider Electric*
- **Nomor E.164:** `+6281234567890` (disimpan sebagai string terstandarisasi)
- **Provider:** `meta` atau `fake_sandbox`
- **WABA ID:** ID akun bisnis resmi Meta
- **Phone Number ID:** ID nomor telepon spesifik dari portal Meta
- **Mode AI:** `off`, `assist`, atau `autonomous`
- **Manusia Utama & Tim Backup:** Ditugaskan spesifik per nomor bisnis.

> **Peringatan (A26):** Input nomor tanpa credential provider tersimpan dengan status `draft` dan tidak akan pernah menampilkan status `connected` palsu atau mengirim pesan mengatasnamakan nomor tersebut.

---

## 4. Webhook Ingress & Keandalan

### Endpoint URL Webhook:
- **Verification URL:** `https://your-domain.com/webhooks/meta` (atau `/api/v1/webhooks/meta`)
- **Metode:** `GET` (Verifikasi token) & `POST` (Penerimaan event)

### Mekanisme Keamanan:
1. **Verifikasi Challenge (GET):** Server mencocokkan `hub.verify_token` dengan `META_VERIFY_TOKEN` dan mengembalikan `hub.challenge`.
2. **Signature Validation (POST):** Memeriksa header `X-Hub-Signature-256` menggunakan raw body dan `META_APP_SECRET`. Signature tidak valid ditolak dengan HTTP 403 (A05).
3. **Deduplikasi Pesan (A03):** Berdasarkan `provider_message_id`. Webhook pesan yang dikirim ulang tidak akan menduplikasi pesan atau memicu putaran negosiasi baru.

---

## 5. Kepatuhan Aturan WhatsApp Resmi (24-Hour Window)

Sistem mengimplementasikan `MessagingEligibilityService` untuk menegakkan aturan resmi WhatsApp:
- **Jendela 24 Jam (Customer Service Window):** Pesan bebas hanya diizinkan dalam rentang 24 jam sejak pesan masuk pelanggan terakhir (`last_customer_message_at`).
- **Di Luar 24 Jam:** Pesan teks bebas ditolak secara otomatis (A09). Pengiriman hanya diizinkan menggunakan Template WhatsApp Resmi yang berstatus `approved` oleh Meta.
- **Opt-out:** Permintaan berhenti dari pelanggan dihormati secara mutlak dan memblokir pengiriman berikutnya.
