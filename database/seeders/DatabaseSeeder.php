<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Workspace;
use App\Models\Membership;
use App\Models\Team;
use App\Models\AgentProfile;
use App\Models\PriceBook;
use App\Models\DiscountPolicy;
use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Models\KnowledgeRelease;
use App\Models\Template;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Main Workspace
        $workspace = Workspace::create([
            'name' => 'ATS Workspace Utama',
            'slug' => 'ats-utama',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
            'emergency_stop' => false,
        ]);

        // 2. Create Single Admin User with requested credentials
        $admin = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'email' => 'admin@ats.co.id',
            'password' => Hash::make('Hanz72006#'),
            'current_workspace_id' => $workspace->id,
        ]);

        Membership::create([
            'workspace_id' => $workspace->id,
            'user_id' => $admin->id,
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 3. Create Operational Team
        $team = Team::create([
            'workspace_id' => $workspace->id,
            'name' => 'Tim Operasional & Sales',
            'description' => 'Penanganan lead operasional WhatsApp dan manual handover',
            'routing_policy' => 'least_open',
            'working_hours' => [
                'monday_friday' => '08:00 - 17:00',
                'saturday' => '08:00 - 13:00',
            ],
        ]);

        $team->members()->attach([
            $admin->id => ['is_lead' => true],
        ]);

        // 4. Create AI Agent Profile (Engine configuration for incoming WhatsApp chats)
        AgentProfile::create([
            'workspace_id' => $workspace->id,
            'name' => 'ATS AI Sales Specialist',
            'persona' => 'Sales Engineer spesialis komponen listrik industri yang profesional, responsif, dan ramah.',
            'tone' => 'professional_friendly',
            'system_instructions' => 'Jawab kebutuhan spesifikasi teknis pelanggan dengan akurat berbasis data approved. Berikan penawaran harga resmi dan jaga margin keuntungan perusahaan.',
            'model_name' => 'gemini-3.6-flash',
            'temperature' => 0.3,
            'token_budget' => 50000,
            'allowed_tools' => ['product_lookup', 'pricing_engine', 'request_takeover', 'share_compro'],
        ]);

        // 5. Create Price Book & Discount Policy
        PriceBook::create([
            'workspace_id' => $workspace->id,
            'name' => 'Price List Resmi ATS 2026',
            'version' => 'v2026.1',
            'currency' => 'IDR',
            'tax_mode' => 'exclusive',
            'price_basis' => 'net',
            'coefficient' => 1.0,
            'effective_from' => '2026-01-01',
            'effective_until' => '2026-12-31',
            'is_active' => true,
        ]);

        DiscountPolicy::create([
            'workspace_id' => $workspace->id,
            'name' => 'Kebijakan Diskon Standar ATS',
            'version' => 'v1.0',
            'max_autonomous_discount_pct' => 10.00,
            'discount_step_pct' => 2.50,
            'max_discount_rounds' => 3,
            'stacking_rule' => 'sequential',
            'minimum_gross_margin_pct' => 20.00,
            'requires_manager_approval_above_pct' => 10.00,
            'is_active' => true,
        ]);

        KnowledgeRelease::create([
            'workspace_id' => $workspace->id,
            'version_tag' => 'rel-202609-01',
            'status' => 'ready',
            'summary' => 'Rilis approved sistem katalog ATS.',
            'item_count' => 0,
        ]);

        // 6. Create Business Profile & Document
        BusinessProfile::create([
            'workspace_id' => $workspace->id,
            'legal_name' => 'PT Artha Teknik Sejahtera',
            'brand_name' => 'ATS',
            'description' => 'Penyedia dan distributor resmi komponen listrik industri, perakitan panel maker, otomasi, dan suku cadang switchgear terkemuka di Indonesia.',
            'services' => [
                'Distribusi Komponen Listrik & Switchgear',
                'Perakitan Panel Maker (LVMDP, Capacitor Bank, Motor Starter)',
                'Konsultasi Teknis & Pengadaan Spare Part Industri',
            ],
            'branches' => [
                'Head Office: Komplek Pergudangan Daan Mogot, Jakarta Barat',
            ],
            'contact_info' => [
                'telepon' => '+62 21 5566 7788',
                'email' => 'sales@arthateknik.co.id',
            ],
            'working_hours' => [
                'hari_kerja' => 'Senin - Jumat: 08.00 - 17.00 WIB',
                'sabtu' => '08.00 - 13.00 WIB',
            ],
            'website' => 'https://www.arthateknik.co.id',
            'portfolio_highlights' => [],
            'source_document_name' => 'Company-Profile-ATS-2026.pdf',
            'is_approved' => true,
        ]);

        CompanyDocument::create([
            'workspace_id' => $workspace->id,
            'title' => 'Company Profile Resmi PT Artha Teknik Sejahtera',
            'document_type' => 'compro_pdf',
            'classification' => 'customer_shareable',
            'file_content_text' => "PROFIL PERUSAHAAN: PT Artha Teknik Sejahtera (ATS)\nDistributor resmi komponen kelistrikan industri.",
            'file_path' => '/documents/ats-company-profile.pdf',
            'is_approved' => true,
        ]);

        // 7. Create Standard WhatsApp Message Templates
        Template::create([
            'workspace_id' => $workspace->id,
            'name' => 'follow_up_penawaran',
            'language' => 'id',
            'category' => 'utility',
            'body_content' => 'Halo {{1}}, kami dari PT Artha Teknik Sejahtera ingin menindaklanjuti penawaran {{2}} yang kami kirimkan sebelumnya. Apakah ada hal yang perlu kami bantu?',
            'status' => 'approved',
        ]);

        Template::create([
            'workspace_id' => $workspace->id,
            'name' => 'konfirmasi_order_resmi',
            'language' => 'id',
            'category' => 'utility',
            'body_content' => 'Yth. {{1}}, pesanan Anda dengan nomor {{2}} telah kami terima dan sedang diproses di gudang. Terima kasih telah bermitra dengan ATS.',
            'status' => 'approved',
        ]);
    }
}
