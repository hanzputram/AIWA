<?php

namespace App\Domain\Messaging\Providers;

use App\Models\Channel;
use Illuminate\Support\Facades\Http;
use Exception;

class MetaCloudApiProvider implements MessagingProviderInterface
{
    protected string $apiVersion;

    public function __construct(string $apiVersion = 'v21.0')
    {
        $this->apiVersion = $apiVersion;
    }

    public function sendText(Channel $channel, string $toPhoneE164, string $text, array $metadata = []): array
    {
        $phoneNumberId = $channel->phone_number_id;
        $token = $channel->secret_reference ?? config('services.meta.token');

        if (empty($phoneNumberId) || empty($token)) {
            throw new Exception('Kredensial Meta WhatsApp Cloud API belum lengkap pada channel ini.');
        }

        $cleanTo = ltrim($toPhoneE164, '+');
        $endpoint = "https://graph.facebook.com/{$this->apiVersion}/{$phoneNumberId}/messages";

        $response = Http::withToken($token)->post($endpoint, [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $cleanTo,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $text,
            ],
        ]);

        if (!$response->successful()) {
            return [
                'success' => false,
                'error' => $response->json(),
                'status' => 'failed',
            ];
        }

        $data = $response->json();
        $messageId = $data['messages'][0]['id'] ?? null;

        return [
            'success' => true,
            'provider' => 'meta',
            'provider_message_id' => $messageId,
            'status' => 'sent',
            'recipient_id' => $cleanTo,
        ];
    }

    public function sendTemplate(Channel $channel, string $toPhoneE164, string $templateName, string $language = 'id', array $components = []): array
    {
        $phoneNumberId = $channel->phone_number_id;
        $token = $channel->secret_reference ?? config('services.meta.token');

        if (empty($phoneNumberId) || empty($token)) {
            throw new Exception('Kredensial Meta WhatsApp Cloud API belum lengkap.');
        }

        $cleanTo = ltrim($toPhoneE164, '+');
        $endpoint = "https://graph.facebook.com/{$this->apiVersion}/{$phoneNumberId}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $cleanTo,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => $language],
                'components' => $components,
            ],
        ];

        $response = Http::withToken($token)->post($endpoint, $payload);

        if (!$response->successful()) {
            return [
                'success' => false,
                'error' => $response->json(),
                'status' => 'failed',
            ];
        }

        $data = $response->json();
        return [
            'success' => true,
            'provider' => 'meta',
            'provider_message_id' => $data['messages'][0]['id'] ?? null,
            'status' => 'sent',
        ];
    }

    public function sendDocument(Channel $channel, string $toPhoneE164, string $documentUrl, string $filename, ?string $caption = null): array
    {
        $phoneNumberId = $channel->phone_number_id;
        $token = $channel->secret_reference ?? config('services.meta.token');

        $cleanTo = ltrim($toPhoneE164, '+');
        $endpoint = "https://graph.facebook.com/{$this->apiVersion}/{$phoneNumberId}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $cleanTo,
            'type' => 'document',
            'document' => [
                'link' => $documentUrl,
                'filename' => $filename,
                'caption' => $caption,
            ],
        ];

        $response = Http::withToken($token)->post($endpoint, $payload);
        return [
            'success' => $response->successful(),
            'provider' => 'meta',
            'provider_message_id' => $response->json()['messages'][0]['id'] ?? null,
        ];
    }

    public function verifyWebhookSignature(string $payload, ?string $signature, string $secret): bool
    {
        if (empty($signature)) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }

    public function parseWebhookPayload(array $payload): array
    {
        $fakeSandbox = new FakeWhatsAppSandboxProvider();
        return $fakeSandbox->parseWebhookPayload($payload);
    }

    public function markAsRead(Channel $channel, string $providerMessageId): bool
    {
        $phoneNumberId = $channel->phone_number_id;
        $token = $channel->secret_reference ?? config('services.meta.token');

        if (empty($phoneNumberId) || empty($token) || empty($providerMessageId)) {
            return false;
        }

        $endpoint = "https://graph.facebook.com/{$this->apiVersion}/{$phoneNumberId}/messages";

        try {
            $response = Http::withToken($token)->post($endpoint, [
                'messaging_product' => 'whatsapp',
                'status' => 'read',
                'message_id' => $providerMessageId,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            \Log::warning('Failed to mark message as read on Meta: ' . $e->getMessage());
            return false;
        }
    }
}

