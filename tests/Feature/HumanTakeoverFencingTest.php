<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\HandoffRequest;
use App\Domain\Handoff\HumanTakeoverService;
use App\Domain\AISales\AISalesOrchestrator;
use App\Domain\Messaging\Providers\FakeWhatsAppSandboxProvider;

class HumanTakeoverFencingTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected User $agent1;
    protected User $agent2;
    protected Channel $channel;
    protected Contact $contact;
    protected Conversation $conversation;
    protected HumanTakeoverService $takeoverService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->takeoverService = new HumanTakeoverService();

        $this->workspace = Workspace::create([
            'name' => 'Test ATS Electrical',
            'slug' => 'test-ats',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->agent1 = User::create([
            'name' => 'Sales Budi',
            'email' => 'budi@ats.co.id',
            'password' => bcrypt('secret123'),
        ]);

        $this->agent2 = User::create([
            'name' => 'Sales Siti',
            'email' => 'siti@ats.co.id',
            'password' => bcrypt('secret123'),
        ]);

        $this->channel = Channel::create([
            'workspace_id' => $this->workspace->id,
            'phone_e164' => '+628111222333',
            'name' => 'ATS Sales Office',
            'provider' => 'fake_sandbox',
            'connection_status' => 'connected',
            'ai_mode' => 'autonomous',
            'primary_human_id' => $this->agent1->id,
        ]);

        $this->contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Pak Hendra Panel',
            'phone_e164' => '+6281311112222',
            'customer_tier' => 'standard',
        ]);

        $this->conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $this->contact->id,
            'control_owner' => 'ai_active',
            'control_epoch' => 1,
            'sales_stage' => 'qualifying',
            'negotiation_state' => 'none',
            'intent_band' => 'warm',
        ]);
    }

    /**
     * Skenario A44: Manusia takeover saat LLM sedang generate -> late output dibuang oleh dispatch fence.
     */
    public function test_scenario_a44_late_llm_output_discarded_by_dispatch_fence()
    {
        // 1. Snapshot taken by AI at epoch 1
        $epochSnapshot = $this->conversation->control_epoch;
        $this->assertEquals(1, $epochSnapshot);

        // 2. Human triggers takeover while LLM is generating
        $handoff = $this->takeoverService->requestHandoff($this->conversation, [
            'reason_codes' => ['buying_intent_high'],
            'priority' => 'high',
        ]);

        // Conversation epoch is now bumped to 2, control_owner is 'handoff_requested'
        $this->conversation->refresh();
        $this->assertEquals(2, $this->conversation->control_epoch);
        $this->assertEquals('handoff_requested', $this->conversation->control_owner);

        // 3. Late LLM generation finishes and attempts to dispatch using old epoch snapshot (1)
        $dispatchAllowed = $this->takeoverService->verifyDispatchFence(
            $this->conversation->id,
            $epochSnapshot
        );

        $this->assertFalse($dispatchAllowed, 'Dispatch fence MUST reject late LLM output when control_epoch has been bumped by takeover.');
    }

    /**
     * Skenario A46: Dua manusia claim handoff bersamaan (CAS Lock) -> satu pemenang, lainnya conflict 409.
     */
    public function test_scenario_a46_concurrent_handoff_claims_cas_lock()
    {
        $handoff = $this->takeoverService->requestHandoff($this->conversation, [
            'reason_codes' => ['customer_requests_human'],
            'priority' => 'urgent',
        ]);

        // Agent 1 claims first
        $result1 = $this->takeoverService->claimHandoff($handoff->id, $this->agent1->id);
        $this->assertTrue($result1['success']);
        $this->assertEquals($this->agent1->id, $result1['claimed_by']);

        // Agent 2 attempts to claim the already claimed handoff
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Handoff request already claimed or resolved.');
        $this->takeoverService->claimHandoff($handoff->id, $this->agent2->id);
    }

    /**
     * Skenario A49: Release eksplisit ke AI -> epoch baru, konteks baru, komitmen manusia dipertahankan.
     */
    public function test_scenario_a49_explicit_release_to_ai()
    {
        // 1. Put into human active
        $this->conversation->control_owner = 'human_active';
        $this->conversation->assigned_user_id = $this->agent1->id;
        $this->conversation->control_epoch = 2;
        $this->conversation->save();

        // 2. Human explicitly releases back to AI with instruction
        $resumedConversation = $this->takeoverService->releaseToAi($this->conversation->id, [
            'human_notes' => 'Pelanggan sudah setuju spesifikasi iC60N, silakan lanjutkan quotation harga list.',
        ]);

        $this->assertEquals('ai_active', $resumedConversation->control_owner);
        $this->assertEquals(3, $resumedConversation->control_epoch, 'Control epoch must increment on release to AI.');
        $this->assertNull($resumedConversation->assigned_user_id);
    }

    /**
     * Skenario A16: Flow handoff aktif dan pelanggan mengirim lagi -> bot tidak membalas selama human_active.
     */
    public function test_scenario_a16_bot_silenced_during_human_active()
    {
        $this->conversation->control_owner = 'human_active';
        $this->conversation->control_epoch = 2;
        $this->conversation->save();

        $orchestrator = new AISalesOrchestrator();
        $response = $orchestrator->processInboundMessage($this->conversation, "Halo mas, rekeningnya mana?");

        $this->assertNull($response['outbound_text'], 'Bot MUST NOT reply while human_active is in control.');
        $this->assertEquals('suppressed_by_human_active', $response['status']);
    }

    /**
     * Skenario A54: Emergency stop mematikan seluruh AI workspace dan menginvalidasi pending output.
     */
    public function test_scenario_a54_emergency_stop_invalidates_all_ai_turns()
    {
        $this->takeoverService->emergencyStopWorkspace($this->workspace->id);

        $this->channel->refresh();
        $this->conversation->refresh();

        $this->assertEquals('off', $this->channel->ai_mode, 'Channel AI mode must be switched off by emergency stop.');
        $this->assertEquals('ai_paused', $this->conversation->control_owner);
        $this->assertGreaterThan(1, $this->conversation->control_epoch, 'Control epoch must be bumped to invalidate pending turns.');
    }
}
