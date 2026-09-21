<?php

namespace App\Domain\Messaging\Providers;

use App\Models\Channel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class BaileysProvider implements MessagingProviderInterface
{
    protected string $serviceUrl;

    public function __construct(?string $serviceUrl = null)
    {
        $this->serviceUrl = rtrim($serviceUrl ?? config('services.baileys.url', 'http://127.0.0.1:3000'), '/');
    }

    /**
     * Get unique session ID for channel
     */
    public function getSessionId(Channel $channel): string
    {
        return 'channel_' . $channel->id;
    }

    /**
     * Send free-form text message via Baileys Multi-Device
     */
    public function sendText(Channel $channel, string $toPhoneE164, string $text, array $metadata = []): array
    {
        $sessionId = $this->getSessionId($channel);
        $endpoint = "{$this->serviceUrl}/messages/send";

        $to = $metadata['remote_jid'] ?? $toPhoneE164;

        try {
            $response = Http::timeout(10)->post($endpoint, [
                'sessionId' => $sessionId,
                'to' => $to,
                'text' => $text,
            ]);

            if (!$response->successful()) {
                Log::error("Baileys sendText failed: " . $response->body());
                return [
                    'success' => false,
                    'error' => $response->json()['error'] ?? 'Gagal mengirim pesan via Baileys',
                    'status' => 'failed',
                ];
            }

            $data = $response->json();

            return [
                'success' => true,
                'provider' => 'baileys',
                'provider_message_id' => $data['provider_message_id'] ?? null,
                'status' => 'sent',
                'recipient_id' => $toPhoneE164,
            ];
        } catch (\Throwable $e) {
            Log::error("Baileys sendText exception: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 'failed',
            ];
        }
    }

    /**
     * Send template message (In Baileys, no Meta template approvals or 24h restrictions!)
     */
    public function sendTemplate(Channel $channel, string $toPhoneE164, string $templateName, string $language = 'id', array $components = []): array
    {
        // Extract any body parameter text from components if provided
        $bodyText = "Pesan otomatis ({$templateName})";
        foreach ($components as $component) {
            if (($component['type'] ?? '') === 'body' && !empty($component['parameters'])) {
                $params = array_column($component['parameters'], 'text');
                $bodyText .= "\n" . implode(' ', $params);
            }
        }

        return $this->sendText($channel, $toPhoneE164, $bodyText);
    }

    /**
     * Send document message (e.g. Quotation PDF, Catalog, Company Profile)
     */
    public function sendDocument(Channel $channel, string $toPhoneE164, string $documentUrl, string $filename, ?string $caption = null): array
    {
        $sessionId = $this->getSessionId($channel);
        $endpoint = "{$this->serviceUrl}/messages/send-document";

        try {
            $response = Http::timeout(15)->post($endpoint, [
                'sessionId' => $sessionId,
                'to' => $toPhoneE164,
                'documentUrl' => $documentUrl,
                'filename' => $filename,
                'caption' => $caption,
            ]);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'error' => $response->json()['error'] ?? 'Gagal mengirim dokumen via Baileys',
                    'status' => 'failed',
                ];
            }

            $data = $response->json();

            return [
                'success' => true,
                'provider' => 'baileys',
                'provider_message_id' => $data['provider_message_id'] ?? null,
                'status' => 'sent',
            ];
        } catch (\Throwable $e) {
            Log::error("Baileys sendDocument exception: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 'failed',
            ];
        }
    }

    /**
     * Start session to generate QR code for linking device
     */
    public function startSession(Channel $channel): array
    {
        $sessionId = $this->getSessionId($channel);
        $endpoint = "{$this->serviceUrl}/sessions/start";

        try {
            $response = Http::timeout(10)->post($endpoint, [
                'sessionId' => $sessionId,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [
                'success' => false,
                'error' => $response->json()['error'] ?? 'Gagal menginisialisasi sesi Baileys',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => "Tidak dapat terhubung ke microservice Baileys di {$this->serviceUrl}. Pastikan service Baileys sedang berjalan.",
            ];
        }
    }

    /**
     * Query live status and QR code from Baileys microservice
     */
    public function getSessionStatus(Channel $channel): array
    {
        $sessionId = $this->getSessionId($channel);
        $endpoint = "{$this->serviceUrl}/sessions/{$sessionId}/status";

        try {
            $response = Http::timeout(5)->get($endpoint);
            if ($response->successful()) {
                return $response->json();
            }

            return [
                'sessionId' => $sessionId,
                'status' => 'offline',
                'qr' => null,
            ];
        } catch (\Throwable $e) {
            return [
                'sessionId' => $sessionId,
                'status' => 'offline',
                'qr' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Disconnect / Unpair WhatsApp Multi-Device session
     */
    public function logoutSession(Channel $channel): array
    {
        $sessionId = $this->getSessionId($channel);
        $endpoint = "{$this->serviceUrl}/sessions/{$sessionId}/logout";

        try {
            $response = Http::timeout(5)->post($endpoint);
            return $response->json() ?? ['success' => true];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Webhook verification (Local Baileys service)
     */
    public function verifyWebhookSignature(string $payload, ?string $signature, string $secret): bool
    {
        // Internal microservice webhook can use shared token or open local loopback
        return true;
    }

    /**
     * Parse inbound payload from Baileys microservice into normalized events
     */
    public function parseWebhookPayload(array $payload): array
    {
        $event = $payload['event'] ?? 'inbound_message';

        if ($event === 'session_connected') {
            return [[
                'type' => 'session_connected',
                'session_id' => $payload['sessionId'] ?? null,
                'user_phone' => $payload['userPhone'] ?? null,
            ]];
        }

        if ($event === 'inbound_message') {
            return [[
                'type' => 'inbound_message',
                'session_id' => $payload['sessionId'] ?? null,
                'from_phone' => $payload['fromPhone'] ?? '',
                'id' => $payload['messageId'] ?? null,
                'message_id' => $payload['messageId'] ?? null,
                'text' => $payload['text'] ?? '',
                'timestamp' => $payload['timestamp'] ?? time(),
            ]];
        }

        return [];
    }
}
