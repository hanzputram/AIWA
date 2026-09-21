<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Membership;

class InternalRouteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Skenario A60: Root / mengarahkan tamu ke /login, bukan landing page marketing publik.
     */
    public function test_scenario_a60_root_redirects_to_login_or_dashboard()
    {
        // Unauthenticated guest visiting root / must redirect to /login
        $response = $this->get('/');
        $response->assertRedirect('/login');

        // Authenticated user with active workspace visiting root / redirects to /app/dashboard
        $workspace = Workspace::create([
            'name' => 'ATS Electrical',
            'slug' => 'ats-electrical',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $user = User::create([
            'name' => 'Direktur ATS',
            'email' => 'owner@ats.co.id',
            'password' => bcrypt('password'),
        ]);

        Membership::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $authResponse = $this->actingAs($user)
            ->withSession(['current_workspace_id' => $workspace->id])
            ->get('/');

        $authResponse->assertRedirect('/app/dashboard');
    }

    /**
     * Skenario A60: Halaman login internal tersedia.
     */
    public function test_scenario_a60_login_page_renders_cleanly()
    {
        $response = $this->get('/login');
        $response->assertOk();
    }

    /**
     * Test login supports case-insensitivity and @ prefix
     */
    public function test_login_supports_case_insensitivity_and_at_prefix()
    {
        $this->withoutMiddleware();

        $workspace = Workspace::create([
            'name' => 'ATS Electrical',
            'slug' => 'ats-electrical',
        ]);

        $user = User::create([
            'name' => 'Admin Sistem',
            'username' => 'admin',
            'email' => 'admin@ats.co.id',
            'password' => bcrypt('password'),
        ]);

        // Login with uppercase "Admin"
        $res1 = $this->post('/login', [
            'username' => 'Admin',
            'password' => 'password',
        ]);
        $res1->assertRedirect('/app/dashboard');

        // Login with "@admin"
        $res2 = $this->post('/login', [
            'username' => '@admin',
            'password' => 'password',
        ]);
        $res2->assertRedirect('/app/dashboard');
    }
}
