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

        \Log::info('Meta Webhook received', [
            'has_signature' => !empty($signature),
            'entry_count' => count($payload['entry'] ?? []),
            'payload' => $payload
        ]);

        if ($signature && $appSecret) {
            $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawContent, $appSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                \Log::warning('Meta Webhook Invalid signature rejected');
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

            // Status Updates (sent, delivered, read, failed)
            if ($event['type'] === 'message_status') {
                $providerMsgId = $event['message_id'] ?? null;
                $status = $event['status'] ?? null;
                if ($providerMsgId && $status) {
                    \App\Models\Message::where('provider_message_id', $providerMsgId)
                        ->update(['state' => $status]);
                    \Log::info("Message status updated: {$providerMsgId} -> {$status}");
                }
            }
        }

        $delivery->processed_at = now();
        $delivery->save();

        return response()->json(['status' => 'success'], 200);
    }

    /**
     * Inbound Baileys Multi-Device Webhook Processing (POST)
     */
    public function handleBaileys(Request $request)
    {
        $payload = $request->all();
        \Log::info('Baileys Webhook received', ['payload' => $payload]);

        $event = $payload['event'] ?? 'inbound_message';
        $sessionId = $payload['sessionId'] ?? '';

        // Extract channel ID from sessionId "channel_{id}"
        $channelId = null;
        if (preg_match('/channel_(\d+)/', $sessionId, $matches)) {
            $channelId = (int)$matches[1];
        }

        $channel = $channelId ? Channel::find($channelId) : Channel::where('provider', 'baileys')->first();
        if (!$channel) {
            $channel = Channel::first();
        }

        if (!$channel) {
            return response()->json(['error' => 'No active channel found'], 404);
        }

        if ($event === 'session_connected') {
            $channel->connection_status = 'connected';
            if (!empty($payload['userPhone']) && empty($channel->display_number)) {
                $channel->display_number = '+' . ltrim($payload['userPhone'], '+');
            }
            $channel->save();
            return response()->json(['status' => 'connected_acknowledged']);
        }

        if ($event === 'inbound_message') {
            $providerMsgId = $payload['messageId'] ?? null;

            // Deduplicate provider_message_id
            if ($providerMsgId && \App\Models\Message::where('provider_message_id', $providerMsgId)->exists()) {
                return response()->json(['status' => 'already_processed']);
            }

            $rawFrom = $payload['fromPhone'] ?? '';
            $normalizedPhone = Contact::normalizePhone($rawFrom);
            $pushName = trim($payload['pushName'] ?? '');
            $remoteJid = $payload['remoteJid'] ?? '';

            // Strictly ignore group messages, channels/newsletters, and broadcasts
            if (
                str_ends_with($remoteJid, '@g.us') ||
                str_contains($remoteJid, '@g.us') ||
                str_ends_with($remoteJid, '@newsletter') ||
                str_contains($remoteJid, '@broadcast')
            ) {
                return response()->json(['status' => 'ignored_group_message']);
            }

            $realPhone = !empty($payload['realPhone']) ? Contact::normalizePhone($payload['realPhone']) : null;

            // Preferred phone for contact record
            $finalPhone = $realPhone ?: $normalizedPhone;
            $contactName = $pushName ?: ($realPhone ?: $normalizedPhone);

            // Find existing contact by phone or remote_jid
            $contact = Contact::where('workspace_id', $channel->workspace_id)
                ->where(function ($q) use ($normalizedPhone, $realPhone, $remoteJid) {
                    $q->where('phone_e164', $normalizedPhone);
                    if ($realPhone) {
                        $q->orWhere('phone_e164', $realPhone);
                    }
                    if ($remoteJid) {
                        $q->orWhere('custom_fields->remote_jid', $remoteJid);
                    }
                })
                ->first();

            if (!$contact) {
                $contact = Contact::create([
                    'workspace_id' => $channel->workspace_id,
                    'phone_e164' => $finalPhone,
                    'name' => $contactName,
                    'custom_fields' => array_filter([
                        'remote_jid' => $remoteJid,
                        'push_name' => $pushName,
                        'real_phone' => $realPhone,
                    ]),
                ]);
            } else {
                $custom = $contact->custom_fields ?? [];
                $changed = false;
                if ($pushName && (str_starts_with($contact->name, 'Pelanggan ') || empty($contact->name))) {
                    $contact->name = $pushName;
                    $changed = true;
                }
                if ($remoteJid && ($custom['remote_jid'] ?? '') !== $remoteJid) {
                    $custom['remote_jid'] = $remoteJid;
                    $changed = true;
                }
                if ($realPhone) {
                    $custom['real_phone'] = $realPhone;
                    if (str_starts_with($contact->phone_e164, '+15') && strlen($contact->phone_e164) >= 15) {
                        $contact->phone_e164 = $realPhone;
                    }
                    $changed = true;
                }
                if ($changed) {
                    $contact->custom_fields = $custom;
                    $contact->save();
                }
            }

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

            $text = $payload['text'] ?? '';
            if (!empty($text)) {
                $this->orchestrator->handleInboundMessage($conversation, $text, $providerMsgId);
            }

            return response()->json(['status' => 'processed']);
        }

        return response()->json(['status' => 'ignored']);
    }
}
