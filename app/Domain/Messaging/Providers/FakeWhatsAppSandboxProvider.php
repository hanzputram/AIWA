<?php

namespace App\Domain\Messaging\Providers;

use App\Models\Channel;
use App\Models\Message;
use Illuminate\Support\Str;

class FakeWhatsAppSandboxProvider implements MessagingProviderInterface
{
    public function sendText(Channel $channel, string $toPhoneE164, string $text, array $metadata = []): array
    {
        $fakeMessageId = 'wamid.DEMO.' . strtoupper(Str::random(16));

        return [
            'success' => true,
            'provider' => 'fake_sandbox',
            'is_demo' => true,
            'provider_message_id' => $fakeMessageId,
            'status' => 'delivered', // simulated instant delivery in sandbox
            'timestamp' => now()->timestamp,
            'recipient_id' => $toPhoneE164,
        ];
    }

    public function sendTemplate(Channel $channel, string $toPhoneE164, string $templateName, string $language = 'id', array $components = []): array
    {
        $fakeMessageId = 'wamid.DEMO.TPL.' . strtoupper(Str::random(16));

        return [
            'success' => true,
            'provider' => 'fake_sandbox',
            'is_demo' => true,
            'provider_message_id' => $fakeMessageId,
            'status' => 'delivered',
            'template_name' => $templateName,
            'timestamp' => now()->timestamp,
            'recipient_id' => $toPhoneE164,
        ];
    }

    public function sendDocument(Channel $channel, string $toPhoneE164, string $documentUrl, string $filename, ?string $caption = null): array
    {
        $fakeMessageId = 'wamid.DEMO.DOC.' . strtoupper(Str::random(16));

        return [
            'success' => true,
            'provider' => 'fake_sandbox',
            'is_demo' => true,
            'provider_message_id' => $fakeMessageId,
            'status' => 'delivered',
            'filename' => $filename,
            'timestamp' => now()->timestamp,
            'recipient_id' => $toPhoneE164,
        ];
    }

    public function verifyWebhookSignature(string $payload, ?string $signature, string $secret): bool
    {
        if (empty($signature)) {
            return false;
        }

        // Check if signature starts with sha256=
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expectedSignature, $signature);
    }

    public function parseWebhookPayload(array $payload): array
    {
        $events = [];

        // Parse standard Meta WhatsApp webhook structure
        $entries = $payload['entry'] ?? [];
        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $value = $change['value'] ?? [];

                // 1. Inbound Messages
                if (!empty($value['messages'])) {
                    foreach ($value['messages'] as $msg) {
                        $events[] = [
                            'type' => 'inbound_message',
                            'phone_number_id' => $value['metadata']['phone_number_id'] ?? null,
                            'display_phone_number' => $value['metadata']['display_phone_number'] ?? null,
                            'from_phone' => '+' . ltrim($msg['from'] ?? '', '+'),
                            'message_id' => $msg['id'] ?? null,
                            'timestamp' => $msg['timestamp'] ?? now()->timestamp,
                            'text' => $msg['text']['body'] ?? ($msg['button']['text'] ?? ''),
                            'kind' => $msg['type'] ?? 'text',
                        ];
                    }
                }

                // 2. Status Updates (sent, delivered, read, failed)
                if (!empty($value['statuses'])) {
                    foreach ($value['statuses'] as $status) {
                        $events[] = [
                            'type' => 'message_status',
                            'message_id' => $status['id'] ?? null,
                            'status' => $status['status'] ?? 'unknown',
                            'recipient_id' => $status['recipient_id'] ?? null,
                            'timestamp' => $status['timestamp'] ?? now()->timestamp,
                        ];
                    }
                }
            }
        }

        return $events;
    }
}
