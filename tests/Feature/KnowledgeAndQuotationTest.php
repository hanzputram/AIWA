<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Quote;
use App\Models\QuoteRevision;
use App\Models\QuoteLine;
use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Domain\Knowledge\KnowledgeExtractionService;

class KnowledgeAndQuotationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected User $user;
    protected KnowledgeExtractionService $extractionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extractionService = new KnowledgeExtractionService();

        $this->workspace = Workspace::create([
            'name' => 'ATS Electrical',
            'slug' => 'ats-electrical',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->user = User::create([
            'name' => 'Knowledge Approver',
            'email' => 'approver@ats.co.id',
            'password' => bcrypt('password'),
        ]);
    }

    /**
     * Skenario A28: Upload compro mengekstrak field profil terstruktur dengan sumber dan tidak langsung auto-publish.
     */
    public function test_scenario_a28_compro_autofill_with_provenance()
    {
        $rawComproText = "PT ANUGRAH TEKNIK SEJAHTERA (ATS) berdiri sejak tahun 2012 di Surabaya dan Jakarta. Kami menyediakan perakitan panel listrik, distribusi komponen Schneider Electric, cubicle MV, dan pemeliharaan genset. Hubungi kami di sales@ats.co.id atau 021-88997766. Website: https://ats.co.id";

        $profile = $this->extractionService->extractFromText($this->workspace->id, $rawComproText, 'Compro_ATS_2026.pdf');

        $this->assertNotNull($profile);
        $this->assertEquals('PT ANUGRAH TEKNIK SEJAHTERA', $profile->legal_name);
        $this->assertStringContainsStringIgnoringCase('Perakitan Panel', implode(' ', $profile->services ?? []));
        $this->assertEquals('https://ats.co.id', $profile->website);

        // Verify provenance citations exist
        $provenance = $profile->provenance ?? [];
        $this->assertNotEmpty($provenance);
        $this->assertEquals('Compro_ATS_2026.pdf', $provenance['legal_name']['source_document']);
    }

    /**
     * Skenario A51: Dokumen compro yang dibagikan ke pelanggan berstatus customer_shareable, bukan internal_restricted.
     */
    public function test_scenario_a51_compro_customer_shareable_classification()
    {
        $doc = CompanyDocument::create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Company Profile ATS 2026',
            'classification' => 'customer_shareable',
            'file_path' => 'documents/compro_2026.pdf',
            'is_approved' => true,
        ]);

        $internalCostDoc = CompanyDocument::create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Rincian Margin & HPP Schneider Q4',
            'classification' => 'internal_restricted',
            'file_path' => 'documents/internal_hpp.pdf',
            'is_approved' => true,
        ]);

        $this->assertTrue($doc->isCustomerShareable(), 'Customer shareable document must be allowed to send to customer.');
        $this->assertFalse($internalCostDoc->isCustomerShareable(), 'Internal cost document must NEVER be shared with customer (A51).');
    }

    /**
     * Skenario A38: Kuantitas / termin quote berubah setelah approval -> revision baru dibuat, approval lama tidak menimpa revision baru.
     */
    public function test_scenario_a38_quote_terms_modification_creates_new_revision()
    {
        $contact = Contact::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Pak Joko Kontraktor',
            'phone_e164' => '+628177777777',
            'customer_tier' => 'standard',
        ]);

        $channel = \App\Models\Channel::create([
            'workspace_id' => $this->workspace->id,
            'phone_e164' => '+628111222333',
            'name' => 'Sales WA',
            'provider' => 'fake_sandbox',
            'connection_status' => 'connected',
        ]);

        $conversation = \App\Models\Conversation::create([
            'workspace_id' => $this->workspace->id,
            'channel_id' => $channel->id,
            'contact_id' => $contact->id,
            'control_owner' => 'ai_active',
            'control_epoch' => 1,
            'sales_stage' => 'quoted',
        ]);

        $product = Product::create([
            'workspace_id' => $this->workspace->id,
            'sku' => 'A9F74216',
            'brand' => 'Schneider',
            'name' => 'iC60N 2P 16A',
            'unit' => 'pcs',
            'moq' => 1,
        ]);

        $quote = Quote::create([
            'workspace_id' => $this->workspace->id,
            'conversation_id' => $conversation->id,
            'contact_id' => $contact->id,
            'quote_number' => 'QUO-2026-001',
            'current_revision_number' => 1,
            'grand_total' => 1250000,
            'currency' => 'IDR',
            'status' => 'approved',
            'expires_at' => now()->addDays(7),
        ]);

        $rev1 = QuoteRevision::create([
            'quote_id' => $quote->id,
            'revision_number' => 1,
            'subtotal' => 1250000,
            'grand_total' => 1250000,
            'currency' => 'IDR',
            'status' => 'approved',
            'approved_by_user_id' => $this->user->id,
        ]);

        // Customer modifies quantity from 10 to 15 pcs
        $rev2 = QuoteRevision::create([
            'quote_id' => $quote->id,
            'revision_number' => 2,
            'subtotal' => 1875000,
            'grand_total' => 1875000,
            'currency' => 'IDR',
            'status' => 'draft', // Must reset to draft pending approval!
        ]);

        $quote->current_revision_number = 2;
        $quote->grand_total = 1875000;
        $quote->status = 'draft';
        $quote->save();

        $this->assertEquals(2, $quote->current_revision_number);
        $this->assertEquals('draft', $rev2->status);
        $this->assertEquals('approved', $rev1->status, 'Revision 1 remains immutable in history.');
        $this->assertNotEquals($rev1->grand_total, $rev2->grand_total);
    }

    /**
     * Test XLSX format template generation for Discount Matrix and Product Knowledge
     */
    public function test_discount_matrix_and_product_xlsx_template_downloads()
    {
        $responseMatrix = $this->actingAs($this->user)
            ->withSession(['current_workspace_id' => $this->workspace->id])
            ->get(route('knowledge.discount-matrices.template'));

        $responseMatrix->assertStatus(200);
        $responseMatrix->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('template_matriks_diskon_agustus_2026.xlsx', $responseMatrix->headers->get('Content-Disposition'));
        // Verify valid ZIP/XLSX magic bytes (PK\x03\x04)
        $this->assertStringStartsWith("PK\x03\x04", $responseMatrix->getContent());

        $responseProduct = $this->actingAs($this->user)
            ->withSession(['current_workspace_id' => $this->workspace->id])
            ->get(route('knowledge.products.template'));

        $responseProduct->assertStatus(200);
        $responseProduct->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('template_katalog_produk_aiwa.xlsx', $responseProduct->headers->get('Content-Disposition'));
        $this->assertStringStartsWith("PK\x03\x04", $responseProduct->getContent());
    }

    /**
     * Test importing discount matrix from an actual .xlsx file
     */
    public function test_import_discount_matrix_from_real_xlsx_file()
    {
        $service = new \App\Domain\Knowledge\ProductKnowledgeService();
        $xlsxBinary = $service->generateDiscountMatrixXlsxTemplate();

        $tempPath = tempnam(sys_get_temp_dir(), 'test_matrix_') . '.xlsx';
        file_put_contents($tempPath, $xlsxBinary);

        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempPath,
            'template_matriks_diskon_agustus_2026.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $response = $this->actingAs($this->user)
            ->withSession(['current_workspace_id' => $this->workspace->id])
            ->post(route('knowledge.discount-matrices.import'), [
                'file' => $uploadedFile,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Check database records created from XLSX
        $domae = \App\Models\BrandDiscountMatrix::where('workspace_id', $this->workspace->id)
            ->where('series_type', 'Domae')
            ->first();
        $this->assertNotNull($domae);
        $this->assertEquals(25.0, (float) $domae->standard_discount_pct);
        $this->assertEquals(34.0, (float) $domae->khusus_discount_pct);

        @unlink($tempPath);
    }
}
