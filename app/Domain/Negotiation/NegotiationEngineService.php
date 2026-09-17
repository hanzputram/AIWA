<?php

namespace App\Domain\Negotiation;

use App\Models\Conversation;
use App\Models\NegotiationSession;
use App\Models\Concession;
use App\Models\DiscountPolicy;

class NegotiationEngineService
{
    /**
     * Get or initialize active negotiation session for the conversation
     */
    public function getOrCreateSession(Conversation $conversation, float $initialPrice): NegotiationSession
    {
        return NegotiationSession::firstOrCreate(
            [
                'conversation_id' => $conversation->id,
                'workspace_id' => $conversation->workspace_id,
            ],
            [
                'contact_id' => $conversation->contact_id,
                'asking_total' => $initialPrice,
                'current_offer_total' => $initialPrice,
                'customer_bid_total' => null,
                'rounds_count' => 0,
                'stalled_objection_count' => 0,
                'is_stalled' => false,
                'status' => 'active',
            ]
        );
    }

    /**
     * Record a customer objection and evaluate concession options
     */
    public function recordCustomerObjection(
        NegotiationSession $session,
        string $objectionType, // 'price', 'quantity', 'terms', 'competitor'
        ?float $customerBid = null,
        ?DiscountPolicy $discountPolicy = null
    ): array {
        $session->rounds_count++;
        $session->stalled_objection_count++;

        if ($customerBid !== null && $customerBid > 0) {
            $session->customer_bid_total = $customerBid;
        }

        // Stalled detection rule: 3 material rounds without progress or floor reached
        $isStalled = false;
        if ($session->stalled_objection_count >= 3) {
            $isStalled = true;
            $session->is_stalled = true;
            $session->status = 'stalled';
        }

        // Concession step calculation
        $stepPct = (float) ($discountPolicy?->discount_step_pct ?? 2.5);
        $maxAutoDiscount = (float) ($discountPolicy?->max_autonomous_discount_pct ?? 10.0);
        $totalConcessionPct = (float) $session->concessions()->sum('granted_pct');

        $canOfferConcession = false;
        $nextOfferTotal = (float) $session->current_offer_total;
        $nextDiscountPct = 0.0;

        if (!$isStalled && ($totalConcessionPct + $stepPct) <= $maxAutoDiscount) {
            $canOfferConcession = true;
            $nextDiscountPct = $stepPct;
            $nextOfferTotal = $session->current_offer_total * (1.0 - ($stepPct / 100.0));

            // Record concession into persistent ledger
            Concession::create([
                'negotiation_session_id' => $session->id,
                'round_number' => $session->rounds_count,
                'concession_type' => 'discount_step',
                'granted_pct' => $stepPct,
                'price_after' => $nextOfferTotal,
                'conditions' => "Tahap negosiasi putaran ke-{$session->rounds_count}",
            ]);

            $session->current_offer_total = $nextOfferTotal;
        } else {
            // At floor or limit reached
            if (($totalConcessionPct + $stepPct) > $maxAutoDiscount) {
                $isStalled = true;
                $session->is_stalled = true;
                $session->status = 'stalled';
            }
        }

        $session->save();

        return [
            'rounds_count' => $session->rounds_count,
            'stalled_objection_count' => $session->stalled_objection_count,
            'is_stalled' => $isStalled,
            'can_offer_concession' => $canOfferConcession,
            'granted_discount_pct' => $nextDiscountPct,
            'current_offer_total' => round($session->current_offer_total, 2),
            'total_accumulated_discount_pct' => round($totalConcessionPct + $nextDiscountPct, 2),
            'customer_bid_total' => $session->customer_bid_total,
        ];
    }

    /**
     * Record concession directly into session ledger
     */
    public function recordConcession(NegotiationSession $session, array $data): Concession
    {
        $session->rounds_count = $data['round_number'] ?? ($session->rounds_count + 1);
        if (isset($data['customer_bid'])) {
            $session->customer_bid_total = $data['customer_bid'];
        }
        if (isset($data['offered_price'])) {
            $session->current_offer_total = $data['offered_price'];
        }
        $session->stalled_objection_count++;
        if ($session->stalled_objection_count >= 3) {
            $session->is_stalled = true;
            $session->status = 'stalled';
        }
        $session->save();

        return Concession::create([
            'negotiation_session_id' => $session->id,
            'round_number' => $session->rounds_count,
            'concession_type' => 'discount_step',
            'granted_pct' => $data['granted_pct'] ?? 2.5,
            'price_after' => $session->current_offer_total,
            'conditions' => $data['issue'] ?? 'price_objection',
        ]);
    }

    /**
     * Check if the session is currently stalled
     */
    public function checkIfStalled(NegotiationSession $session): bool
    {
        return $session->is_stalled || $session->stalled_objection_count >= 3;
    }

    /**
     * Determine if customer message contains a material negotiation bid or objection (A42)
     */
    public function isMaterialNegotiationMessage(string $message): bool
    {
        $lower = strtolower($message);

        // Filter out polite closing, acknowledgments, or empty text
        if (preg_match('/^(terima kasih|makasih|ok|oke|siap|baik|thanks|thank you|sip|noted)\b/i', trim($lower))) {
            return false;
        }

        // Must contain price objection or counter-bid keywords
        return (bool) preg_match('/(diskon|kurang|mahal|nego|harga|tawar|bisa turun|potongan|harga nett|kemahalan)/i', $lower);
    }
}
