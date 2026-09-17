<?php

namespace App\Domain\AISales;

use App\Models\Conversation;
use App\Models\Message;

class IntentScorerService
{
    /**
     * Score buying intent based on explainable weighted signals.
     */
    public function assessIntent(Conversation $conversation, ?string $latestCustomerText = null): array
    {
        $score = 0;
        $evidence = [];

        // Collect recent customer messages for context
        $customerMessages = $conversation->messages()
            ->where('direction', 'inbound')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get();

        $allText = strtolower($latestCustomerText ?? '');
        foreach ($customerMessages as $msg) {
            $allText .= ' ' . strtolower($msg->content);
        }

        // Check for strong negative / negation signals first
        $hasNegation = false;
        $negationPatterns = [
            '/tidak jadi (beli|pesan|order|ambil)/i',
            '/batal (beli|pesan|order)/i',
            '/jangan buat (invoice|penawaran|po)/i',
            '/kemahalan.*(gak jadi|batal)/i',
            '/hanya (tanya|survey|tengok|lihat-lihat)/i',
            '/cuma riset/i',
        ];

        foreach ($negationPatterns as $pattern) {
            if (preg_match($pattern, $allText)) {
                $hasNegation = true;
                $score -= 15;
                $evidence[] = [
                    'signal' => 'Pernyataan riset / pembatalan transaksi',
                    'weight' => -15,
                    'excerpt' => 'Pelanggan menyatakan pembatalan atau sekadar riset',
                ];
                break;
            }
        }

        // Positive Signal 1: SKU / Specific Product Mention (+15)
        if (preg_match('/(sku|tipe|model|kontaktor|mcb|mccb|schneider|abb|chint|lc1|gv2|ezc|nsx|[a-z0-9]{3,}-[a-z0-9]{2,})/i', $allText)) {
            $score += 15;
            $evidence[] = [
                'signal' => 'Spesifikasi / SKU produk spesifik',
                'weight' => +15,
                'excerpt' => 'Menyebutkan tipe/SKU/merk barang',
            ];
        }

        // Positive Signal 2: Quantity & Unit Mention (+15)
        if (preg_match('/(\b\d+\s*(pcs|unit|buah|set|roll|dus|box|pack|batang)\b)/i', $allText)) {
            $score += 15;
            $evidence[] = [
                'signal' => 'Jumlah kuantitas dan satuan jelas',
                'weight' => +15,
                'excerpt' => 'Menyebutkan jumlah unit yang diinginkan',
            ];
        }

        // Positive Signal 3: Concrete Deadline / Urgency (+10)
        if (preg_match('/(besok|lusa|minggu ini|segera|urgent|proyek|deadline|hari ini|butuh cepat)/i', $allText)) {
            $score += 10;
            $evidence[] = [
                'signal' => 'Kebutuhan waktu konkret / urgensi',
                'weight' => +10,
                'excerpt' => 'Menyebutkan target jadwal pemakaian',
            ];
        }

        // Positive Signal 4: Asking for Quotation / Invoice / PO (+20) - Only if NOT negated
        if (!$hasNegation && preg_match('/(minta|buatkan|kirim|bikinkan|siapkan|butuh|tolong|ajukan).*?(penawaran|quotation|invoice|proforma|po|spk)/i', $allText)) {
            $score += 20;
            $evidence[] = [
                'signal' => 'Permintaan formal penawaran / invoice / PO',
                'weight' => +20,
                'excerpt' => 'Meminta dokumen komersial formal',
            ];
        }

        // Positive Signal 5: Accepting Offer / Confirming Order (+30) - Only if NOT negated
        if (!$hasNegation && preg_match('/(deal|setuju|oke harga itu|saya ambil|siap order|mau order|mau pesan|mau transfer|nomor rekening|pesan sekarang)/i', $allText)) {
            $score += 30;
            $evidence[] = [
                'signal' => 'Persetujuan harga / konfirmasi beli',
                'weight' => +30,
                'excerpt' => 'Menyatakan setuju penawaran atau siap transfer',
            ];
        }

        // Positive Signal 6: Specific Payment / Delivery Inquiry (+10)
        if (preg_match('/(rekening|transfer|bca|mandiri|bri|ongkir|ekspedisi|diantar|kirim ke)/i', $allText)) {
            $score += 10;
            $evidence[] = [
                'signal' => 'Menanyakan teknis pembayaran / ekspedisi pengiriman',
                'weight' => +10,
                'excerpt' => 'Menanyakan nomor rekening atau ongkos kirim',
            ];
        }

        // Clamp score between 0 and 100
        $finalScore = max(0, min(100, $score));

        // Determine Intent Band
        $band = 'unknown';
        if (empty($evidence)) {
            $band = 'unknown';
        } elseif ($finalScore >= 75) {
            $band = 'hot';
        } elseif ($finalScore >= 40) {
            $band = 'warm';
        } else {
            $band = 'cold';
        }

        // Check if customer explicitly requested a human
        $explicitHumanRequest = (bool) preg_match('/(bicara.*manusia|sambungkan.*sales|bukan.*bot|admin asli|orang asli|bicara.*orang|telepon saya)/i', $allText);

        return [
            'score' => $finalScore,
            'intent_band' => $band,
            'purchase_probability' => null, // Explicitly NULL per specification A39
            'evidence' => $evidence,
            'explicit_human_request' => $explicitHumanRequest,
            'is_hot' => ($finalScore >= 75),
            'has_negation' => $hasNegation,
        ];
    }
}
