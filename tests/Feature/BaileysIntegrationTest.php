<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use App\Models\Channel;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class BaileysIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected User $user;
    protected Channel $channel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'name' => 'Test Workspace ATS',
            'slug' => 'test-ats',
        ]);

        $this->user = User::factory()->create([
            'email' => 'agent@ats.co.id',
        ]);
        $this->user->workspaces()->attach($this->workspace->id, ['role' => 'agent']);

        $this->channel = Channel::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'ATS Sales Multi-Device',
            'phone_e164' => '+6281234567890',
            'provider' => 'baileys',
            'ai_mode' => 'autonomous',
            'connection_status' => 'draft',
        ]);

        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    /**
     * Test creating a channel with Baileys provider without Meta credentials
     */
    public function test_can_create_baileys_channel_without_meta_credentials()
    {
        $this->withoutMiddleware();

        $response = $this->actingAs($this->user)
            ->withSession(['current_workspace_id' => $this->workspace->id])
            ->post('/app/numbers', [
                'name' => 'Cabang Bandung WA',
                'phone_e164' => '+6281999888777',
                'provider' => 'baileys',
                'ai_mode' => 'autonomous',
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('channels', [
            'name' => 'Cabang Bandung WA',
            'provider' => 'baileys',
            'connection_status' => 'draft',
        ]);
    }

    /**
     * Test Baileys session_connected webhook updates channel status
     */
    public function test_baileys_session_connected_webhook()
    {
        $response = $this->postJson('/api/v1/webhooks/baileys', [
            'event' => 'session_connected',
            'sessionId' => 'channel_' . $this->channel->id,
            'userPhone' => '6281234567890',
        ]);

        $response->assertOk();
        $response->assertJson(['status' => 'connected_acknowledged']);

        $this->channel->refresh();
        $this->assertEquals('connected', $this->channel->connection_status);
        $this->assertEquals('+6281234567890', $this->channel->display_number);
    }

    /**
     * Test Baileys inbound_message webhook creates conversation and message
     */
    public function test_baileys_inbound_message_webhook_and_deduplication()
    {
        $payload = [
            'event' => 'inbound_message',
            'sessionId' => 'channel_' . $this->channel->id,
            'fromPhone' => '6281299887766',
            'messageId' => 'BAE5_MSG_12345',
            'text' => 'Halo, apakah ada stok MCB 16A?',
            'timestamp' => time(),
        ];

        // 1. First webhook delivery
        $res1 = $this->postJson('/api/v1/webhooks/baileys', $payload);
        $res1->assertOk();
        $res1->assertJson(['status' => 'processed']);

        $this->assertDatabaseHas('messages', [
            'provider_message_id' => 'BAE5_MSG_12345',
            'content' => 'Halo, apakah ada stok MCB 16A?',
        ]);

        // 2. Duplicate webhook delivery should be deduplicated
        $res2 = $this->postJson('/api/v1/webhooks/baileys', $payload);
        $res2->assertOk();
        $res2->assertJson(['status' => 'already_processed']);

        $count = Message::where('provider_message_id', 'BAE5_MSG_12345')->count();
        $this->assertEquals(1, $count);
    }

    /**
     * Test Baileys status endpoint returns live connection status
     */
    public function test_baileys_status_api_endpoint()
    {
        Http::fake([
            'http://127.0.0.1:3000/sessions/*' => Http::response([
                'status' => 'connected',
                'userPhone' => '6281234567890',
                'qr' => null,
            ], 200),
        ]);

        $response = $this->actingAs($this->user)
            ->withSession(['current_workspace_id' => $this->workspace->id])
            ->getJson("/api/v1/numbers/{$this->channel->id}/baileys/status");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'channel_id' => $this->channel->id,
            'baileys_status' => 'connected',
        ]);
    }

    /**
     * Test Baileys provider outbound dispatch
     */
    public function test_baileys_outbound_send_text()
    {
        Http::fake([
            'http://127.0.0.1:3000/messages/send' => Http::response([
                'success' => true,
                'provider' => 'baileys',
                'provider_message_id' => 'BAE5_OUTBOUND_99',
                'status' => 'sent',
            ], 200),
        ]);

        $provider = new \App\Domain\Messaging\Providers\BaileysProvider();
        $result = $provider->sendText($this->channel, '+6281299887766', 'Halo dari ATS Sales');

        $this->assertTrue($result['success']);
        $this->assertEquals('baileys', $result['provider']);
        $this->assertEquals('BAE5_OUTBOUND_99', $result['provider_message_id']);
    }
}
