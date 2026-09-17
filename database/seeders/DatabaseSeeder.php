<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Workspace;
use App\Models\Membership;
use App\Models\Team;
use App\Models\Channel;
use App\Models\AgentProfile;
use App\Models\ChannelAgentBinding;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Product;
use App\Models\ProductSpec;
use App\Models\PriceBook;
use App\Models\PriceEntry;
use App\Models\CostEntry;
use App\Models\DiscountPolicy;
use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Models\KnowledgeRelease;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\HandoffRequest;
use App\Models\HandoverBrief;
use App\Models\Quote;
use App\Models\QuoteRevision;
use App\Models\QuoteLine;
use App\Models\NegotiationSession;
use App\Models\Concession;
use App\Models\Template;
use App\Models\Deal;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Workspace
        $workspace = Workspace::create([
            'name' => 'ATS Workspace Utama',
            'slug' => 'ats-utama',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
            'emergency_stop' => false,
        ]);

        // 2. Create Users with Roles
        $usersData = [
            ['name' => 'Owner ATS', 'email' => 'owner@ats.co.id', 'role' => 'owner'],
            ['name' => 'Admin Sistem', 'email' => 'admin@ats.co.id', 'role' => 'admin'],
            ['name' => 'Bambang Manager', 'email' => 'manager@ats.co.id', 'role' => 'manager'],
            ['name' => 'Rian Utama (Sales Senior)', 'email' => 'sales1@ats.co.id', 'role' => 'agent'],
            ['name' => 'Siti Backup (Sales Junior)', 'email' => 'sales2@ats.co.id', 'role' => 'agent'],
            ['name' => 'Dewi Pricing Approver', 'email' => 'pricing@ats.co.id', 'role' => 'pricing_approver'],
        ];

        $users = [];
        foreach ($usersData as $u) {
            $user = User::create([
                'name' => $u['name'],
                'email' => $u['email'],
                'password' => Hash::make('password'),
                'current_workspace_id' => $workspace->id,
            ]);

            Membership::create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => $u['role'],
                'status' => 'active',
            ]);

            $users[$u['email']] = $user;
        }

        // 3. Create Teams
        $salesTeam = Team::create([
            'workspace_id' => $workspace->id,
            'name' => 'Tim Sales Industri & Panel',
            'description' => 'Penanganan lead proyek B2B dan kontraktor panel',
            'routing_policy' => 'least_open',
            'working_hours' => [
                'monday_friday' => '08:00 - 17:00',
                'saturday' => '08:00 - 13:00',
            ],
        ]);

        $salesTeam->members()->attach([
            $users['sales1@ats.co.id']->id => ['is_lead' => true],
            $users['sales2@ats.co.id']->id => ['is_lead' => false],
        ]);

        // 4. Create AI Agent Profile
        $agentProfile = AgentProfile::create([
            'workspace_id' => $workspace->id,
            'name' => 'ATS AI Sales Specialist',
            'persona' => 'Sales Engineer spesialis komponen listrik industri yang profesional, responsif, dan ramah.',
            'tone' => 'professional_friendly',
            'system_instructions' => 'Jawab kebutuhan spesifikasi teknis pelanggan dengan akurat berbasis data approved. Berikan penawaran harga resmi dan jaga margin keuntungan perusahaan.',
            'model_name' => 'gemini-1.5-flash',
            'temperature' => 0.3,
            'token_budget' => 50000,
            'allowed_tools' => ['product_lookup', 'pricing_engine', 'request_takeover', 'share_compro'],
        ]);

        // 5. Create Price Book & Discount Policy
        $priceBook = PriceBook::create([
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

        $discountPolicy = DiscountPolicy::create([
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

        $release = KnowledgeRelease::create([
            'workspace_id' => $workspace->id,
            'version_tag' => 'rel-202609-01',
            'status' => 'ready',
            'summary' => 'Rilis approved katalog komponen listrik dan daftar harga Q3 2026.',
            'item_count' => 3,
        ]);

        // 6. Create WhatsApp Business Channels
        $channel1 = Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'ATS Sales Division',
            'phone_e164' => '+6281210002000',
            'display_number' => '0812-1000-2000',
            'branch' => 'Jakarta Barat',
            'provider' => 'fake_sandbox',
            'waba_id' => 'WABA-ATS-001',
            'phone_number_id' => 'PNID-ATS-001',
            'connection_status' => 'connected',
            'ai_mode' => 'autonomous',
            'primary_human_id' => $users['sales1@ats.co.id']->id,
            'backup_team_id' => $salesTeam->id,
            'last_webhook_at' => now(),
            'health_metrics' => ['uptime_pct' => 99.9, 'latency_ms' => 120],
        ]);

        ChannelAgentBinding::create([
            'channel_id' => $channel1->id,
            'agent_profile_id' => $agentProfile->id,
            'active_release_id' => $release->id,
            'price_book_id' => $priceBook->id,
            'discount_policy_id' => $discountPolicy->id,
            'primary_human_id' => $users['sales1@ats.co.id']->id,
            'backup_team_id' => $salesTeam->id,
            'takeover_thresholds' => [
                'intent_score' => 75,
                'stalled_rounds' => 3,
                'high_value_amount' => 50000000,
            ],
        ]);

        $channel2 = Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'ATS CS & Support',
            'phone_e164' => '+6281210003000',
            'display_number' => '0812-1000-3000',
            'branch' => 'Surabaya',
            'provider' => 'fake_sandbox',
            'waba_id' => 'WABA-ATS-002',
            'phone_number_id' => 'PNID-ATS-002',
            'connection_status' => 'connected',
            'ai_mode' => 'assist',
            'primary_human_id' => $users['sales2@ats.co.id']->id,
            'backup_team_id' => $salesTeam->id,
            'last_webhook_at' => now(),
            'health_metrics' => ['uptime_pct' => 99.8, 'latency_ms' => 140],
        ]);

        // 7. Create Products, Specs, Price Entries & Cost Entries
        $productsData = [
            [
                'sku' => 'A9F74216',
                'name' => 'Schneider Acti9 iC60N MCB 2P 16A 6kA',
                'brand' => 'Schneider Electric',
                'category' => 'MCB Miniature Circuit Breaker',
                'unit' => 'pcs',
                'base_price' => 125000.0, // Matches specification fixture A35!
                'hpp_cost' => 80000.0,   // Base Rp 125k, HPP Rp 80k, Margin Floor 20%
                'margin_floor_pct' => 20.0,
                'specs' => ['Poles' => '2P', 'Rated Current' => '16A', 'Breaking Capacity' => '6kA', 'Curve' => 'C'],
            ],
            [
                'sku' => 'LC1D32M7',
                'name' => 'Schneider TeSys D Contactor 32A 3P 220VAC',
                'brand' => 'Schneider Electric',
                'category' => 'Magnetic Contactor',
                'unit' => 'pcs',
                'base_price' => 480000.0,
                'hpp_cost' => 320000.0,
                'margin_floor_pct' => 20.0,
                'specs' => ['Poles' => '3P', 'Rated Current' => '32A (AC-3)', 'Coil Voltage' => '220VAC 50/60Hz', 'Aux Contacts' => '1NO + 1NC'],
            ],
            [
                'sku' => 'EZC100F3100',
                'name' => 'Schneider EasyPact EZC MCCB 3P 100A 18kA',
                'brand' => 'Schneider Electric',
                'category' => 'MCCB Moulded Case Circuit Breaker',
                'unit' => 'pcs',
                'base_price' => 650000.0,
                'hpp_cost' => 450000.0,
                'margin_floor_pct' => 20.0,
                'specs' => ['Poles' => '3P', 'Rated Current' => '100A', 'Breaking Capacity' => '18kA at 380/415VAC'],
            ],
        ];

        foreach ($productsData as $p) {
            $product = Product::create([
                'workspace_id' => $workspace->id,
                'sku' => $p['sku'],
                'name' => $p['name'],
                'brand' => $p['brand'],
                'category' => $p['category'],
                'unit' => $p['unit'],
                'description' => "Komponen original {$p['brand']} bergaransi resmi.",
                'is_active' => true,
            ]);

            foreach ($p['specs'] as $k => $v) {
                ProductSpec::create([
                    'product_id' => $product->id,
                    'spec_name' => $k,
                    'spec_value' => $v,
                ]);
            }

            PriceEntry::create([
                'price_book_id' => $priceBook->id,
                'product_id' => $product->id,
                'sku' => $product->sku,
                'base_price' => $p['base_price'],
                'tier' => 'standard',
                'min_quantity' => 1,
                'currency' => 'IDR',
            ]);

            CostEntry::create([
                'workspace_id' => $workspace->id,
                'product_id' => $product->id,
                'sku' => $product->sku,
                'hpp_cost' => $p['hpp_cost'],
                'landed_cost' => 0.0,
                'shipping_subsidy' => 0.0,
                'handling_fee' => 0.0,
                'margin_floor_pct' => $p['margin_floor_pct'],
                'version' => 'v1.0',
            ]);
        }

        // 8. Create Business Profile & Compro Document
        $profile = BusinessProfile::create([
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
                'Cabang Surabaya: Rungkut Industri',
                'Workshop: Cikarang, Jawa Barat',
            ],
            'contact_info' => [
                'telepon' => '+62 21 5566 7788',
                'email' => 'sales@arthateknik.co.id',
                'whatsapp' => '+62 812 1000 2000',
            ],
            'working_hours' => [
                'hari_kerja' => 'Senin - Jumat: 08.00 - 17.00 WIB',
                'sabtu' => '08.00 - 13.00 WIB',
            ],
            'website' => 'https://www.arthateknik.co.id',
            'portfolio_highlights' => [
                'Pengadaan Switchgear Gedung Wisma Sudirman',
                'Suplai Panel MCC Pabrik Makanan Cikande',
                'Proyek Jalur LRT Jabodebek',
            ],
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

        // 9. Create Sample Companies & Contacts
        $company1 = Company::create([
            'workspace_id' => $workspace->id,
            'name' => 'PT Cahaya Mega Elektro',
            'industry' => 'Panel Maker & Kontraktor ME',
            'website' => 'https://cahayamega.com',
            'phone' => '+62 21 8899 1122',
            'owner_id' => $users['sales1@ats.co.id']->id,
        ]);

        $contact1 = Contact::create([
            'workspace_id' => $workspace->id,
            'company_id' => $company1->id,
            'name' => 'Ir. Hendra Wijaya',
            'phone_e164' => '+628119876543',
            'email' => 'hendra@cahayamega.com',
            'job_title' => 'Procurement Manager',
            'customer_tier' => 'gold',
            'owner_id' => $users['sales1@ats.co.id']->id,
            'last_inbound_at' => now()->subMinutes(15),
        ]);

        $company2 = Company::create([
            'workspace_id' => $workspace->id,
            'name' => 'CV Surya Mandiri Panel',
            'industry' => 'Panel Maker Lokal',
            'phone' => '+62 31 7766 5544',
            'owner_id' => $users['sales1@ats.co.id']->id,
        ]);

        $contact2 = Contact::create([
            'workspace_id' => $workspace->id,
            'company_id' => $company2->id,
            'name' => 'Agus Pratama',
            'phone_e164' => '+6281355443322',
            'email' => 'agus@suryamandiri.co.id',
            'job_title' => 'Owner',
            'customer_tier' => 'standard',
            'owner_id' => $users['sales1@ats.co.id']->id,
            'last_inbound_at' => now()->subMinutes(45),
        ]);

        // 10. Seed Conversations:
        // Conversation 1: HOT Lead / Ready to Order -> In Takeover Queue!
        $conv1 = Conversation::create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel1->id,
            'contact_id' => $contact1->id,
            'control_epoch' => 2,
            'lifecycle' => 'open',
            'control_owner' => 'handoff_requested',
            'sales_stage' => 'ready_to_order',
            'intent_band' => 'hot',
            'intent_score' => 88,
            'purchase_probability' => null,
            'negotiation_state' => 'resolved',
            'handoff_state' => 'queued',
            'handoff_reasons' => ['buying_intent_high', 'ready_to_order'],
            'last_customer_message_at' => now()->subMinutes(5),
            'last_message_at' => now()->subMinutes(5),
            'unread_count' => 1,
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'workspace_id' => $workspace->id,
            'direction' => 'inbound',
            'sender_type' => 'customer',
            'content' => 'Halo ATS, kami butuh Schneider TeSys D LC1D32M7 sebanyak 20 unit untuk proyek minggu ini. Mohon info harga dan ketersediaan.',
            'state' => 'delivered',
            'created_at' => now()->subMinutes(15),
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'workspace_id' => $workspace->id,
            'direction' => 'outbound',
            'sender_type' => 'ai',
            'content' => 'Halo Pak Hendra! Untuk Schneider TeSys D Contactor LC1D32M7 (32A 3P 220VAC), stok kami tersedia 50 unit. Harga resmi Rp 480.000 / pcs, siap kirim hari ini.',
            'state' => 'delivered',
            'created_at' => now()->subMinutes(12),
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'workspace_id' => $workspace->id,
            'direction' => 'inbound',
            'sender_type' => 'customer',
            'content' => 'Baik kami setuju harga itu, tolong buatkan invoice dan kirim nomor rekening resmi BCA PT ATS, kami mau transfer sekarang.',
            'state' => 'delivered',
            'created_at' => now()->subMinutes(5),
        ]);

        HandoffRequest::create([
            'workspace_id' => $workspace->id,
            'conversation_id' => $conv1->id,
            'reason_codes' => ['buying_intent_high', 'ready_to_order'],
            'priority' => 'urgent',
            'primary_human_id' => $users['sales1@ats.co.id']->id,
            'backup_team_id' => $salesTeam->id,
            'status' => 'queued',
            'sla_target_at' => now()->addMinutes(2),
            'control_epoch_snapshot' => 2,
        ]);

        HandoverBrief::create([
            'conversation_id' => $conv1->id,
            'customer_needs' => '20 unit Schneider LC1D32M7 Contactor 220VAC untuk proyek mendesak.',
            'last_valid_quote_summary' => 'Penawaran 20 unit @ Rp 480.000 = Rp 9.600.000 (Ready)',
            'customer_last_bid' => 'Menyetujui harga penawaran Rp 480.000',
            'concessions_summary' => 'Belum ada konsesi diskon yang diberikan (Full margin).',
            'trigger_reasons_summary' => 'Potensi Beli Tinggi (HOT Lead 88/100), Pelanggan Siap Order / Minta Invoice Resmi.',
            'evidence_quotes' => ['tolong buatkan invoice dan kirim nomor rekening resmi BCA PT ATS'],
            'suggested_next_actions' => "1. Terbitkan invoice resmi dari sistem billing.\n2. Verifikasi bukti transfer bank.\n3. Buat surat jalan pengiriman gudang.",
            'is_cost_guarded' => true,
        ]);

        // Conversation 2: Stalled Negotiation (3 objection rounds without progress) -> In Takeover Queue!
        $conv2 = Conversation::create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel1->id,
            'contact_id' => $contact2->id,
            'control_epoch' => 3,
            'lifecycle' => 'open',
            'control_owner' => 'handoff_requested',
            'sales_stage' => 'negotiating',
            'intent_band' => 'warm',
            'intent_score' => 55,
            'purchase_probability' => null,
            'negotiation_state' => 'stalled',
            'handoff_state' => 'queued',
            'handoff_reasons' => ['negotiation_stalled', 'discount_limit'],
            'last_customer_message_at' => now()->subMinutes(10),
            'last_message_at' => now()->subMinutes(10),
            'unread_count' => 1,
        ]);

        $nego2 = NegotiationSession::create([
            'workspace_id' => $workspace->id,
            'conversation_id' => $conv2->id,
            'contact_id' => $contact2->id,
            'asking_total' => 6500000.0,
            'current_offer_total' => 5850000.0,
            'customer_bid_total' => 5000000.0,
            'rounds_count' => 3,
            'stalled_objection_count' => 3,
            'is_stalled' => true,
            'status' => 'stalled',
        ]);

        Concession::create([
            'negotiation_session_id' => $nego2->id,
            'round_number' => 1,
            'concession_type' => 'discount_step',
            'granted_pct' => 5.0,
            'price_after' => 6175000.0,
            'conditions' => 'Diskon awal negosiasi',
        ]);

        Concession::create([
            'negotiation_session_id' => $nego2->id,
            'round_number' => 2,
            'concession_type' => 'discount_step',
            'granted_pct' => 5.0,
            'price_after' => 5850000.0,
            'conditions' => 'Batas maksimal otonom 10%',
        ]);

        Message::create([
            'conversation_id' => $conv2->id,
            'workspace_id' => $workspace->id,
            'direction' => 'inbound',
            'sender_type' => 'customer',
            'content' => 'Harga Rp 5.850.000 masih kemahalan mas, toko sebelah berani 5 juta bulat. Bisa lepas 5 juta gak?',
            'state' => 'delivered',
            'created_at' => now()->subMinutes(10),
        ]);

        HandoffRequest::create([
            'workspace_id' => $workspace->id,
            'conversation_id' => $conv2->id,
            'reason_codes' => ['negotiation_stalled', 'discount_limit'],
            'priority' => 'high',
            'primary_human_id' => $users['sales1@ats.co.id']->id,
            'backup_team_id' => $salesTeam->id,
            'status' => 'queued',
            'sla_target_at' => now()->addMinutes(5),
            'control_epoch_snapshot' => 3,
        ]);

        HandoverBrief::create([
            'conversation_id' => $conv2->id,
            'customer_needs' => '10 unit Schneider EZC100F3100 MCCB 100A.',
            'last_valid_quote_summary' => 'Penawaran terakhir Rp 5.850.000 (Diskon 10% - Batas Maksimal AI)',
            'customer_last_bid' => 'Menawar Rp 5.000.000 (Di bawah floor margin perusahaan)',
            'concessions_summary' => 'Telah diberikan 2 putaran diskon hingga batas 10%. Pelanggan masih menawar di bawah HPP/floor.',
            'trigger_reasons_summary' => 'Negosiasi Alot (3 kali keberatan harga tanpa progres), Batas Diskon Maksimum Tercapai.',
            'evidence_quotes' => ['toko sebelah berani 5 juta bulat. Bisa lepas 5 juta gak?'],
            'suggested_next_actions' => "1. Hubungi pelanggan via telepon/chat untuk menjelaskan keaslian garansi distributor resmi.\n2. Tawarkan kompensasi non-harga (free ongkir atau termin pembayaran).\n3. Ajukan permohonan diskon khusus ke Manager jika kuantitas ditambah.",
            'is_cost_guarded' => true,
        ]);

        // 11. Create Standard Templates
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
