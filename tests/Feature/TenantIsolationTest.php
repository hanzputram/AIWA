<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Membership;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Quote;
use App\Models\Product;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;
    protected Workspace $workspaceB;
    protected User $userA;
    protected User $userB;
    protected Contact $contactA;
    protected Contact $contactB;

    protected function setUp(): void
    {
        parent::setUp();

        // Workspace A
        $this->workspaceA = Workspace::create([
            'name' => 'Workspace A - Jakarta',
            'slug' => 'workspace-a',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->userA = User::create([
            'name' => 'User A',
            'email' => 'user_a@ats.co.id',
            'password' => bcrypt('password'),
        ]);

        Membership::create([
            'workspace_id' => $this->workspaceA->id,
            'user_id' => $this->userA->id,
            'role' => 'agent',
            'permissions' => ['chat.takeover', 'quote.issue'],
            'status' => 'active',
        ]);

        $this->contactA = Contact::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Client A',
            'phone_e164' => '+628111111111',
            'customer_tier' => 'standard',
        ]);

        // Workspace B
        $this->workspaceB = Workspace::create([
            'name' => 'Workspace B - Surabaya',
            'slug' => 'workspace-b',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->userB = User::create([
            'name' => 'User B',
            'email' => 'user_b@ats.co.id',
            'password' => bcrypt('password'),
        ]);

        Membership::create([
            'workspace_id' => $this->workspaceB->id,
            'user_id' => $this->userB->id,
            'role' => 'agent',
            'permissions' => ['chat.takeover'],
            'status' => 'active',
        ]);

        $this->contactB = Contact::create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Secret Client B',
            'phone_e164' => '+628222222222',
            'customer_tier' => 'platinum',
        ]);
    }

    /**
     * Skenario A01: User workspace A menebak ID data B -> ditolak / 404; tidak bocor metadata.
     */
    public function test_scenario_a01_workspace_data_isolation()
    {
        $this->actingAs($this->userA)
            ->withSession(['current_workspace_id' => $this->workspaceA->id]);

        // Attempting to access conversation or quote belonging to Workspace B
        $channelB = Channel::create([
            'workspace_id' => $this->workspaceB->id,
            'phone_e164' => '+628999999999',
            'name' => 'Secret Channel B',
            'provider' => 'fake_sandbox',
            'connection_status' => 'connected',
        ]);

        $conversationB = Conversation::create([
            'workspace_id' => $this->workspaceB->id,
            'channel_id' => $channelB->id,
            'contact_id' => $this->contactB->id,
            'control_owner' => 'ai_active',
            'control_epoch' => 1,
            'sales_stage' => 'new',
            'negotiation_state' => 'none',
            'intent_band' => 'cold',
        ]);

        // Accessing conversation B via workspace A session must fail with 404 (not found in workspace A)
        $response = $this->get("/app/inbox/{$conversationB->id}");
        $response->assertNotFound();
    }

    /**
     * Skenario A26: Input nomor bisnis tanpa setup provider -> tersimpan draft, tidak connected.
     */
    public function test_scenario_a26_number_without_credentials_is_draft()
    {
        $this->actingAs($this->userA)
            ->withSession(['current_workspace_id' => $this->workspaceA->id]);

        $response = $this->post('/app/numbers', [
            'phone_e164' => '+6281234567890',
            'name' => 'Nomor Cabang Baru',
            'provider' => 'meta',
            'ai_mode' => 'off',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('channels', [
            'workspace_id' => $this->workspaceA->id,
            'phone_e164' => '+6281234567890',
            'connection_status' => 'draft', // Must not claim connected
        ]);
    }

    /**
     * Skenario A56: User tanpa cost.view membuka laporan/brief -> HPP dan margin terproteksi.
     */
    public function test_scenario_a56_user_without_cost_view_is_restricted()
    {
        $this->actingAs($this->userA)
            ->withSession(['current_workspace_id' => $this->workspaceA->id]);

        $membership = Membership::where('workspace_id', $this->workspaceA->id)
            ->where('user_id', $this->userA->id)
            ->first();

        $this->assertFalse($membership->hasPermission('cost.view'), 'Agent User A should not have cost.view by default.');

        $response = $this->get('/app/reports');
        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('reports/Index')
                ->where('can_view_cost', false)
        );
    }
}
