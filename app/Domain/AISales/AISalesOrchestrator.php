<?php

namespace App\Domain\AISales;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Product;
use App\Domain\Pricing\PricingEngineService;
use App\Domain\Negotiation\NegotiationEngineService;
use App\Domain\Handoff\HumanTakeoverService;
use App\Domain\Messaging\MessagingEligibilityService;
use App\Domain\Messaging\Providers\FakeWhatsAppSandboxProvider;
use App\Domain\Messaging\Providers\MetaCloudApiProvider;

class AISalesOrchestrator
{
    protected IntentScorerService $intentScorer;
    protected PricingEngineService $pricingEngine;
    protected NegotiationEngineService $negotiationEngine;
    protected HumanTakeoverService $takeoverService;
    protected MessagingEligibilityService $eligibilityService;

    public function __construct(
        ?IntentScorerService $intentScorer = null,
        ?PricingEngineService $pricingEngine = null,
        ?NegotiationEngineService $negotiationEngine = null,
        ?HumanTakeoverService $takeoverService = null,
        ?MessagingEligibilityService $eligibilityService = null
    ) {
        $this->intentScorer = $intentScorer ?? new IntentScorerService();
        $this->pricingEngine = $pricingEngine ?? new PricingEngineService();
        $this->negotiationEngine = $negotiationEngine ?? new NegotiationEngineService();
        $this->takeoverService = $takeoverService ?? new HumanTakeoverService();
        $this->eligibilityService = $eligibilityService ?? new MessagingEligibilityService();
    }

    /**
     * Process an incoming customer message through the 3-layer decision pipeline
     */
    public function processInboundMessage(Conversation $conversation, string $customerText, ?string $providerMessageId = null): array
    {
        return $this->handleInboundMessage($conversation, $customerText, $providerMessageId);
    }

    public function handleInboundMessage(Conversation $conversation, string $customerText, ?string $providerMessageId = null): array
    {
        $channel = $conversation->channel;
        $workspace = $conversation->workspace;

        // Check if human is in control
        if ($conversation->control_owner === 'human_active') {
            return [
                'outbound_text' => null,
                'status' => 'suppressed_by_human_active',
            ];
        }

        // 1. Record inbound message
        $inboundMessage = Message::create([
            'conversation_id' => $conversation->id,
            'workspace_id' => $workspace->id,
            'direction' => 'inbound',
            'sender_type' => 'customer',
            'kind' => 'text',
            'content' => $customerText,
            'provider_message_id' => $providerMessageId,
            'state' => 'delivered',
            'control_epoch_snapshot' => $conversation->control_epoch,
        ]);

        $conversation->last_customer_message_at = now();
        $conversation->last_message_at = now();
        $conversation->increment('unread_count');
        $conversation->save();

        // 2. Assess Intent (Explainable Intent Score 0 - 100)
        $intentResult = $this->intentScorer->assessIntent($conversation, $customerText);
        $conversation->intent_score = $intentResult['score'];
        $conversation->intent_band = $intentResult['intent_band'];
        $conversation->purchase_probability = null; // Always null per spec A39
        $conversation->save();

        // 3. Evaluate Takeover Triggers
        $takeoverReasons = [];

        if ($intentResult['explicit_human_request']) {
            $takeoverReasons[] = 'customer_requests_human';
        }

        if ($intentResult['is_hot']) {
            $takeoverReasons[] = 'buying_intent_high';
        }

        if (preg_match('/(siap order|minta invoice|buatkan invoice|kirim rekening|mau bayar|spk)/i', $customerText) && !$intentResult['has_negation']) {
            $takeoverReasons[] = 'ready_to_order';
        }

        // Check if message is a price objection
        $isPriceObjection = (bool) preg_match('/(mahal|kurang|diskon|bisa nego|kemahalan|potongan|harga pas)/i', $customerText);
        if ($isPriceObjection) {
            $negoSession = $this->negotiationEngine->getOrCreateSession($conversation, 100000);
            $negoResult = $this->negotiationEngine->recordCustomerObjection($negoSession, 'price');

            if ($negoResult['is_stalled']) {
                $takeoverReasons[] = 'negotiation_stalled';
            }
        }

        // 4. If ANY takeover trigger fired, freeze AI and route to human queue immediately
        if (!empty($takeoverReasons)) {
            $handoffRequest = $this->takeoverService->triggerTakeover(
                $conversation,
                $takeoverReasons,
                in_array('ready_to_order', $takeoverReasons) ? 'urgent' : 'high'
            );

            // Send standard polite acknowledgement from system without committing to numbers
            $ackText = "Terima kasih atas konfirmasi Anda. Pesan Anda telah diteruskan ke tim sales spesialis kami untuk penanganan langsung dan pembuatan dokumen resmi.";
            $this->dispatchSystemAcknowledgement($conversation, $ackText);

            return [
                'action' => 'takeover_queued',
                'handoff_id' => $handoffRequest->id,
                'reasons' => $takeoverReasons,
                'intent_score' => $intentResult['score'],
                'ai_paused' => true,
            ];
        }

        // 5. If AI is OFF or ASSIST, do not dispatch autonomous replies
        if ($channel->ai_mode === 'off') {
            return [
                'action' => 'ai_off',
                'intent_score' => $intentResult['score'],
            ];
        }

        if ($channel->ai_mode === 'assist') {
            return [
                'action' => 'assist_draft_created',
                'intent_score' => $intentResult['score'],
            ];
        }

        // 6. Autonomous AI Sales Response
        // Lookup products matching the query
        $matchedProduct = Product::where('workspace_id', $workspace->id)
            ->where(function ($q) use ($customerText) {
                $q->where('sku', 'like', "%{$customerText}%")
                  ->orWhere('name', 'like', "%{$customerText}%");
            })
            ->first();

        if (!$matchedProduct) {
            // Pick a default product for demonstration if none matched
            $matchedProduct = Product::where('workspace_id', $workspace->id)->first();
        }

        $replyText = "";
        if ($matchedProduct) {
            $calc = $this->pricingEngine->calculateLineItem($matchedProduct, 1);
            $priceFormatted = "Rp " . number_format($calc['unit_net_price'], 0, ',', '.');
            $replyText = "Halo! Terima kasih telah menghubungi {$channel->name}. Untuk produk {$matchedProduct->name} ({$matchedProduct->sku}), harga resmi kami adalah {$priceFormatted} / {$matchedProduct->unit}. Barang original, bergaransi resmi, dan siap dikirim. Apakah ada kebutuhan kuantitas tertentu yang ingin kami siapkan?";
        } else {
            $replyText = "Halo! Terima kasih telah menghubungi {$channel->name}. Kami siap membantu kebutuhan komponen listrik & sistem kelistrikan Anda. Boleh tahu tipe produk, spesifikasi, atau jumlah yang sedang dicari?";
        }

        // Check dispatch fence with current epoch before sending!
        $currentEpoch = $conversation->control_epoch;
        if ($this->takeoverService->checkDispatchFence($conversation, $currentEpoch, 'ai')) {
            $aiMessage = Message::create([
                'conversation_id' => $conversation->id,
                'workspace_id' => $workspace->id,
                'direction' => 'outbound',
                'sender_type' => 'ai',
                'kind' => 'text',
                'content' => $replyText,
                'state' => 'delivered',
                'control_epoch_snapshot' => $currentEpoch,
                'metadata' => [
                    'source' => 'Knowledge Base Release v1.0',
                    'product_sku' => $matchedProduct?->sku,
                    'intent_score' => $intentResult['score'],
                ],
            ]);

            return [
                'action' => 'ai_replied',
                'message_id' => $aiMessage->id,
                'intent_score' => $intentResult['score'],
                'reply' => $replyText,
            ];
        }

        return [
            'action' => 'ai_fenced_blocked',
            'intent_score' => $intentResult['score'],
        ];
    }

    /**
     * Dispatch brief system acknowledgment when handoff is triggered
     */
    protected function dispatchSystemAcknowledgement(Conversation $conversation, string $text): void
    {
        Message::create([
            'conversation_id' => $conversation->id,
            'workspace_id' => $conversation->workspace_id,
            'direction' => 'outbound',
            'sender_type' => 'system',
            'kind' => 'text',
            'content' => $text,
            'state' => 'delivered',
            'control_epoch_snapshot' => $conversation->control_epoch,
        ]);
    }
}
