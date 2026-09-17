<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\NegotiationSession;
use App\Models\Concession;
use App\Domain\AISales\IntentScorerService;
use App\Domain\Negotiation\NegotiationEngineService;

class IntentScorerTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Channel $channel;
    protected Contact $contact;
    protected Conversation $conversation;
    protected IntentScorerService $intentScorer;
    protected NegotiationEngineService $negotiationEngine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->intentScorer = new IntentScorerService();
        $this->negotiationEngine = new NegotiationEngineService();

        $this->workspace = Workspace::create([
            'name' => 'Test ATS Electrical',
            'slug' => 'test-ats',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->channel = Channel::create([
            'workspace_id' => $this->workspace->id,
            'phone_e164' => '+628111222333',
            'name' => 'Sales WA',
            'provider' => 'fake_sandbox',
            'status' => 'connected',
        ]);

        $this->contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Pak Rudi Kontraktor',
            'phone_e164' => '+6281299998888',
            'customer_tier' => 'standard',
        ]);

        $this->conversation = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $this->contact->id,
            'control_owner' => 'ai_active',
            'control_epoch' => 1,
            'sales_stage' => 'negotiating',
            'negotiation_state' => 'active',
            'intent_band' => 'warm',
        ]);
    }

    /**
     * Skenario A39: Skor niat beli 0-100 explainable dan purchase_probability null (bukan score / 100).
     */
    public function test_scenario_a39_intent_score_and_null_probability()
    {
        $message = "Tolong siapkan penawaran resmi untuk MCB Schneider iC60N 2P 16A sebanyak 50 pcs proyek minggu depan, kami siap order";
        
        $assessment = $this->intentScorer->assessIntent($this->conversation, $message);

        $this->assertGreaterThanOrEqual(75, $assessment['score']);
        $this->assertEquals('hot', $assessment['intent_band']);
        $this->assertNull($assessment['purchase_probability'], 'purchase_probability MUST be null until a calibrated predictive model exists (A39).');
        $this->assertNotEmpty($assessment['evidence']);
    }

    /**
     * Skenario A40: Kalimat negatif "jangan buat invoice, saya tidak jadi beli" membatalkan sinyal positif terkait.
     */
    public function test_scenario_a40_negation_cancellation()
    {
        $message = "Jangan buat invoice atau penawaran dulu mas, kami tidak jadi beli MCB tersebut";

        $assessment = $this->intentScorer->assessIntent($this->conversation, $message);

        $this->assertLessThan(40, $assessment['score']);
        $this->assertEquals('cold', $assessment['intent_band']);
        $this->assertTrue($assessment['has_negation']);
    }

    /**
     * Skenario A41: 3 putaran keberatan/counteroffer material tanpa progres -> negotiation_stalled.
     */
    public function test_scenario_a41_three_rounds_stalled_negotiation()
    {
        $deal = Deal::create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $this->contact->id,
            'title' => 'Pengadaan Panel MCB Rudi',
            'stage' => 'negosiasi',
            'amount' => 5000000,
            'currency' => 'IDR',
        ]);

        $session = NegotiationSession::create([
            'workspace_id' => $this->workspace->id,
            'conversation_id' => $this->conversation->id,
            'contact_id' => $this->contact->id,
            'asking_total' => 125000,
            'current_offer_total' => 115000,
            'rounds_count' => 0,
            'status' => 'active',
        ]);

        // Round 1: Customer asks 100k
        $this->negotiationEngine->recordConcession($session, [
            'round_number' => 1,
            'customer_bid' => 100000,
            'offered_price' => 120000,
            'granted_pct' => 4.0,
            'issue' => 'price_too_high',
        ]);

        // Round 2: Customer still insists 100k
        $this->negotiationEngine->recordConcession($session, [
            'round_number' => 2,
            'customer_bid' => 100000,
            'offered_price' => 115000,
            'granted_pct' => 4.0,
            'issue' => 'price_too_high',
        ]);

        // Round 3: Customer refuses again
        $this->negotiationEngine->recordConcession($session, [
            'round_number' => 3,
            'customer_bid' => 100000,
            'offered_price' => 112500,
            'granted_pct' => 2.0,
            'issue' => 'price_too_high',
        ]);

        $isStalled = $this->negotiationEngine->checkIfStalled($session);
        $this->assertTrue($isStalled, '3 consecutive material rounds without progress must trigger negotiation_stalled.');
    }

    /**
     * Skenario A42: Pelanggan diam / duplicate webhook tidak dihitung sebagai putaran negosiasi baru.
     */
    public function test_scenario_a42_silence_or_duplicate_not_counted_as_round()
    {
        $message = "Terima kasih infonya ya";
        $isNegotiationRound = $this->negotiationEngine->isMaterialNegotiationMessage($message);
        $this->assertFalse($isNegotiationRound, 'Polite message or silence does not count as material negotiation bid.');
    }
}
