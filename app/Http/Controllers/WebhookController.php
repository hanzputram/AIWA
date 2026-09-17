<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\WebhookDelivery;
use App\Domain\Messaging\Providers\FakeWhatsAppSandboxProvider;
use App\Domain\AISales\AISalesOrchestrator;

class WebhookController extends Controller
{
    protected FakeWhatsAppSandboxProvider $provider;
    protected AISalesOrchestrator $orchestrator;

    public function __construct(
        FakeWhatsAppSandboxProvider $provider,
        AISalesOrchestrator $orchestrator
    ) {
        $this->provider = $provider;
        $this->orchestrator = $orchestrator;
    }

    /**
     * Meta Webhook Verification (GET)
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expectedToken = config('services.meta.verify_token', 'ats_verify_token_2026');

        if ($mode === 'subscribe' && $token === $expectedToken) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    /**
     * Inbound Webhook Processing (POST)
     */
    public function handle(Request $request)
    {
        $payload = $request->all();
        $rawContent = $request->getContent();
        $signature = $request->header('X-Hub-Signature-256');
        $appSecret = config('services.meta.app_secret', 'test_secret_meta_123');
        if ($signature) {
            $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawContent, $appSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                return response()->json(['error' => 'Invalid webhook signature'], 403);
            }
        }

        // Store webhook delivery durable record
        $delivery = WebhookDelivery::create([
            'provider' => 'meta',
            'payload' => $rawContent,
            'signature' => $signature,
            'is_verified' => true,
        ]);

        $events = $this->provider->parseWebhookPayload($payload);

        foreach ($events as $event) {
            if ($event['type'] === 'inbound_message') {
                $providerMsgId = $event['id'] ?? ($event['message_id'] ?? null);

                // Deduplicate provider_message_id (A03)
                if ($providerMsgId && \App\Models\Message::where('provider_message_id', $providerMsgId)->exists()) {
                    continue;
                }

                $phoneId = $event['phone_number_id'] ?? null;
                $channel = Channel::where('phone_number_id', $phoneId)->first() ?? Channel::first();

                if (!$channel) continue;

                $normalizedPhone = Contact::normalizePhone($event['from_phone']);
                $contact = Contact::firstOrCreate(
                    ['workspace_id' => $channel->workspace_id, 'phone_e164' => $normalizedPhone],
                    ['name' => 'Pelanggan ' . substr($normalizedPhone, -4)]
                );

                $conversation = Conversation::firstOrCreate(
                    [
                        'workspace_id' => $channel->workspace_id,
                        'channel_id' => $channel->id,
                        'contact_id' => $contact->id,
                    ],
                    [
                        'control_owner' => $channel->ai_mode === 'autonomous' ? 'ai_active' : 'human_active',
                        'control_epoch' => 1,
                    ]
                );

                // Run orchestrator with provider message ID
                $this->orchestrator->handleInboundMessage($conversation, $event['text'], $providerMsgId);
            }
        }

        $delivery->processed_at = now();
        $delivery->save();

        return response()->json(['status' => 'success'], 200);
    }
}
