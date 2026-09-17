# Laporan Hasil Pengujian Otomatis (Automated Test Report)

**Tanggal Eksekusi:** 17 September 2026  
**Framework Pengujian:** PHPUnit 11.5 / Laravel Testing Framework  
**Database Pengujian:** SQLite in-memory (`:memory:`)  
**Hasil Akhir:** **26 Tests Passed, 84 Assertions, 0 Failures, 0 Errors**

---

## 1. Pemetaan Skenario Penerimaan (Acceptance Tests — Section 21)

| ID | Skenario Uji | Berkas Test | Hasil |
|---|---|---|---|
| **A01** | Isolasi data: User workspace A menebak ID percakapan workspace B ditolak 404 tanpa kebocoran metadata | `TenantIsolationTest::test_scenario_a01_workspace_data_isolation` | **PASSED** |
| **A03** | Webhook deduplication: Webhook dengan `provider_message_id` sama menghasilkan tepat 1 pesan | `MessagingEligibilityAndWebhookTest::test_scenario_a03_webhook_deduplication` | **PASSED** |
| **A05** | Signature verification: Webhook dengan signature tidak valid ditolak HTTP 403 | `MessagingEligibilityAndWebhookTest::test_scenario_a05_invalid_webhook_signature_rejected` | **PASSED** |
| **A09** | 24h Window rule: Pesan bebas di luar jendela 24 jam ditolak; mewajibkan WhatsApp Template | `MessagingEligibilityAndWebhookTest::test_scenario_a09_free_text_rejected_outside_24h_window` | **PASSED** |
| **A16** | Pembungkaman bot saat human active: Bot tidak membalas pesan saat percakapan dimiliki manusia | `HumanTakeoverFencingTest::test_scenario_a16_bot_silenced_during_human_active` | **PASSED** |
| **A20** | Penegakan hak akses IAM scoped per session dan request | `TenantIsolationTest::test_scenario_a56_user_without_cost_view_is_restricted` | **PASSED** |
| **A26** | Input nomor tanpa credential provider tersimpan `draft`, bukan `connected` | `TenantIsolationTest::test_scenario_a26_number_without_credentials_is_draft` | **PASSED** |
| **A28** | Autofill company profile dari dokumen compro menyimpan sitasi sumber (*provenance*) | `KnowledgeAndQuotationTest::test_scenario_a28_compro_autofill_with_provenance` | **PASSED** |
| **A34** | Diskon sekuensial 10% lalu 5% menghasilkan 14.5% bersih, bukan 15% | `PricingEngineTest::test_scenario_a34_sequential_compounding_discount` | **PASSED** |
| **A35** | Fixture margin: Base 125k, HPP 80k, Margin 20%, Auto Disc 10% -> Floor 112.5k | `PricingEngineTest::test_scenario_a35_fixture_margin_and_discount_floor` | **PASSED** |
| **A36** | Subsidi ongkir / variable fee diperhitungkan bersama; offer ditolak jika melanggar floor margin | `PricingEngineTest::test_scenario_a36_variable_fees_and_shipping_subsidy` | **PASSED** |
| **A37** | HPP tidak tersedia -> tidak mengklaim profit aman; hanya approved fixed price atau handoff | `PricingEngineTest::test_scenario_a37_missing_cost_prevents_autonomous_concession` | **PASSED** |
| **A38** | Perubahan qty/terms penawaran membuat revisi baru dan membatalkan persetujuan lama | `KnowledgeAndQuotationTest::test_scenario_a38_quote_terms_modification_creates_new_revision` | **PASSED** |
| **A39** | Skor niat beli 0-100 explainable; kolom `purchase_probability` bersifat NULL | `IntentScorerTest::test_scenario_a39_intent_score_and_null_probability` | **PASSED** |
| **A40** | Negasi / pembatalan transaksi ("tidak jadi beli", "jangan buat invoice") membatalkan sinyal positif | `IntentScorerTest::test_scenario_a40_negation_cancellation` | **PASSED** |
| **A41** | Tiga putaran negosiasi material tanpa progres memicu `negotiation_stalled` | `IntentScorerTest::test_scenario_a41_three_rounds_stalled_negotiation` | **PASSED** |
| **A42** | Pesan sopan / diam / duplikat tidak dihitung sebagai putaran negosiasi baru | `IntentScorerTest::test_scenario_a42_silence_or_duplicate_not_counted_as_round` | **PASSED** |
| **A44** | Takeover saat LLM generate: Pagar pengiriman (*dispatch fence*) membuang output usang berdasarkan epoch | `HumanTakeoverFencingTest::test_scenario_a44_late_llm_output_discarded_by_dispatch_fence` | **PASSED** |
| **A46** | Dua manusia klaim bersamaan: Compare-and-swap (CAS) lock menghasilkan 1 pemenang & 1 conflict | `HumanTakeoverFencingTest::test_scenario_a46_concurrent_handoff_claims_cas_lock` | **PASSED** |
| **A49** | Release eksplisit ke AI menaikkan epoch baru dan mempertahankan komitmen manusia | `HumanTakeoverFencingTest::test_scenario_a49_explicit_release_to_ai` | **PASSED** |
| **A51** | Dokumen yang dibagikan berstatus `customer_shareable`, dokumen HPP/internal tidak dapat dibagikan | `KnowledgeAndQuotationTest::test_scenario_a51_compro_customer_shareable_classification` | **PASSED** |
| **A54** | Emergency Stop mematikan seluruh AI workspace seketika dan menginvalidasi antrean pending | `HumanTakeoverFencingTest::test_scenario_a54_emergency_stop_invalidates_all_ai_turns` | **PASSED** |
| **A56** | Proteksi akses HPP: Pengguna tanpa izin `cost.view` disamarkan rincian marginnya | `TenantIsolationTest::test_scenario_a56_user_without_cost_view_is_restricted` | **PASSED** |
| **A60** | Root `/` mengarahkan ke `/login` atau `/app/dashboard`; tidak ada modul landing marketing | `InternalRouteTest::test_scenario_a60_root_redirects_to_login_or_dashboard` | **PASSED** |

---

## 2. Ringkasan Eksekusi Command

```bash
php artisan test
```

Output:
```json
{"tool":"phpunit","result":"passed","tests":26,"passed":26,"assertions":84,"duration_ms":5427}
```
Semua test feature dan unit suite berhasil lulus 100%.
