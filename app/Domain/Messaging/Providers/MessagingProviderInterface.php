<?php

namespace App\Domain\Messaging\Providers;

use App\Models\Channel;
use App\Models\Message;

interface MessagingProviderInterface
{
    /**
     * Send free-form text message (only valid within 24h window)
     */
    public function sendText(Channel $channel, string $toPhoneE164, string $text, array $metadata = []): array;

    /**
     * Send official WhatsApp template message (valid anytime, outside 24h window)
     */
    public function sendTemplate(Channel $channel, string $toPhoneE164, string $templateName, string $language = 'id', array $components = []): array;

    /**
     * Send document message (e.g. Approved Compro PDF or Quotation PDF)
     */
    public function sendDocument(Channel $channel, string $toPhoneE164, string $documentUrl, string $filename, ?string $caption = null): array;

    /**
     * Verify inbound webhook signature
     */
    public function verifyWebhookSignature(string $payload, ?string $signature, string $secret): bool;

    /**
     * Parse inbound webhook payload into normalized events
     */
    public function parseWebhookPayload(array $payload): array;
}
