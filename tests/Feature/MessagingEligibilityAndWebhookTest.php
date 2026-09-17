<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\WebhookDelivery;
use App\Domain\Messaging\MessagingEligibilityService;

class MessagingEligibilityAndWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Channel $channel;
    protected Contact $contact;
    protected Conversation $conversation;
    protected MessagingEligibilityService $eligibilityService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->eligibilityService = new MessagingEligibilityService();

        $this->workspace = Workspace::create([
            'name' => 'Test ATS Electrical',
            'slug' => 'test-ats',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->channel = Channel::create([
            'workspace_id' => $this->workspace->id,
            'phone_e164' => '+628111222333',
            'name' => 'ATS WhatsApp Sales',
            'provider' => 'meta',
            'phone_number_id' => 'PN_123',
            'secret_reference' => 'test_secret_meta_123',
            'connection_status' => 'connected',
        ]);

        $this->contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Pak Bambang Contractor',
            'phone_e164' => '+6281987654321',
            'customer_tier' => 'standard',
        ]);

        $this->conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $this->contact->id,
            'control_owner' => 'ai_active',
            'control_epoch' => 1,
            'sales_stage' => 'new',
            'negotiation_state' => 'none',
            'intent_band' => 'cold',
        ]);
    }

    /**
     * Skenario A09: Free text ketika 24-hour customer service window berakhir -> ditolak eligibility.
     */
    public function test_scenario_a09_free_text_rejected_outside_24h_window()
    {
        // Set last customer inbound to 25 hours ago
        $this->conversation->last_customer_message_at = now()->subHours(25);
        $this->conversation->save();

        $check = $this->eligibilityService->canSendFreeTextMessage($this->conversation);

        $this->assertFalse($check['can_send'], 'Free text must be forbidden when 24h customer window has elapsed.');
        $this->assertEquals('window_expired_template_required', $check['reason']);
        $this->assertNotNull($check['window_expires_at']);

        // But sending an approved template message is allowed
        $templateCheck = $this->eligibilityService->canSendTemplateMessage($this->conversation, 'mcb_product_catalog_update');
        $this->assertTrue($templateCheck['can_send']);
    }

    /**
     * Skenario A03: Webhook pesan yang sama dikirim berulang -> deduplikasi provider_message_id.
     */
    public function test_scenario_a03_webhook_deduplication()
    {
        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'WABA_123',
                'changes' => [[
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => ['display_phone_number' => '+628111222333', 'phone_number_id' => 'PN_123'],
                        'messages' => [[
                            'from' => '6281987654321',
                            'id' => 'wamid.HBgLMjI1MTA=',
                            'timestamp' => '1758100000',
                            'text' => ['body' => 'Berapa harga MCB 16A?'],
                            'type' => 'text',
                        ]]
                    ]
                ]]
            ]]
        ];

        $rawBody = json_encode($payload);
        $validSignature = 'sha256=' . hash_hmac('sha256', $rawBody, 'test_secret_meta_123');

        // 1st Webhook delivery
        $response1 = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $validSignature,
        ], $rawBody);

        $response1->assertOk();

        // 2nd Duplicate Webhook delivery
        $response2 = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $validSignature,
        ], $rawBody);

        $response2->assertOk();

        // Check that exactly ONE message exists in the database
        $messagesCount = Message::where('provider_message_id', 'wamid.HBgLMjI1MTA=')->count();
        $this->assertEquals(1, $messagesCount, 'Duplicate webhook deliveries must be deduplicated into exactly one Message record.');
    }

    /**
     * Skenario A05: Signature salah -> ditolak sebagai event tidak valid (403).
     */
    public function test_scenario_a05_invalid_webhook_signature_rejected()
    {
        $payload = ['test' => 'bad_data'];
        $rawBody = json_encode($payload);
        $invalidSignature = 'sha256=invalid_hash_value_here';

        $response = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $invalidSignature,
        ], $rawBody);

        $response->assertStatus(403);
    }
}
