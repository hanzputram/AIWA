<?php

namespace App\Domain\Messaging;

use App\Models\Conversation;
use App\Models\ContactConsent;

class MessagingEligibilityService
{
    /**
     * Check if a message is eligible to be sent to the customer
     */
    public function checkEligibility(Conversation $conversation, string $messageKind = 'text'): array
    {
        $contact = $conversation->contact;

        // 1. Check Opt-out / Consent
        $consent = ContactConsent::where('contact_id', $contact->id)->latest()->first();
        if ($consent && $consent->state === 'opted_out') {
            return [
                'eligible' => false,
                'reason' => 'Pelanggan telah meminta berhenti (opted-out). Pesan tidak dapat dikirim.',
                'code' => 'CONTACT_OPTED_OUT',
            ];
        }

        // 2. Check 24-hour official WhatsApp Customer Service Window
        $isWithinWindow = $conversation->isWithinCustomerWindow();

        if (!$isWithinWindow && $messageKind === 'text') {
            return [
                'eligible' => false,
                'reason' => 'Jendela layanan pelanggan 24 jam telah berakhir. Anda harus menggunakan WhatsApp Template resmi yang telah disetujui.',
                'code' => 'WINDOW_EXPIRED_TEMPLATE_REQUIRED',
            ];
        }

        return [
            'eligible' => true,
            'reason' => 'Memenuhi syarat pengiriman.',
            'code' => 'ELIGIBLE',
            'is_within_window' => $isWithinWindow,
        ];
    }

    public function canSendFreeTextMessage(Conversation $conversation): array
    {
        $res = $this->checkEligibility($conversation, 'text');
        return [
            'can_send' => $res['eligible'],
            'reason' => strtolower($res['code']),
            'window_expires_at' => $conversation->last_customer_message_at ? $conversation->last_customer_message_at->addHours(24) : null,
        ];
    }

    public function canSendTemplateMessage(Conversation $conversation, string $templateName): array
    {
        $res = $this->checkEligibility($conversation, 'template');
        return [
            'can_send' => $res['eligible'],
            'reason' => strtolower($res['code']),
        ];
    }
}
