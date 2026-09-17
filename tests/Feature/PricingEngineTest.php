<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Workspace;
use App\Models\Product;
use App\Models\PriceBook;
use App\Models\PriceEntry;
use App\Models\CostEntry;
use App\Models\DiscountPolicy;
use App\Domain\Pricing\PricingEngineService;

class PricingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Product $product;
    protected PriceBook $priceBook;
    protected DiscountPolicy $policy;
    protected PricingEngineService $pricingEngine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pricingEngine = new PricingEngineService();

        $this->workspace = Workspace::create([
            'name' => 'Test ATS Electrical',
            'slug' => 'test-ats',
            'timezone' => 'Asia/Jakarta',
            'locale' => 'id',
        ]);

        $this->product = Product::create([
            'workspace_id' => $this->workspace->id,
            'sku' => 'A9F74216',
            'brand' => 'Schneider Electric',
            'name' => 'iC60N 2P 16A Miniature Circuit Breaker',
            'unit' => 'pcs',
            'moq' => 1,
        ]);

        $this->priceBook = PriceBook::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Standard Price Book',
            'currency' => 'IDR',
            'is_active' => true,
        ]);

        // Base price 125.000
        PriceEntry::create([
            'price_book_id' => $this->priceBook->id,
            'product_id' => $this->product->id,
            'sku' => $this->product->sku,
            'tier' => 'standard',
            'min_quantity' => 1,
            'base_price' => 125000,
            'currency' => 'IDR',
        ]);

        // Cost 80.000
        CostEntry::create([
            'workspace_id' => $this->workspace->id,
            'product_id' => $this->product->id,
            'sku' => $this->product->sku,
            'hpp_cost' => 80000,
            'currency' => 'IDR',
            'version' => 'v1.0',
        ]);

        // Policy: sequential discount, min gross margin 20%, max auto discount 10%
        $this->policy = DiscountPolicy::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'ATS Strict Margin Policy',
            'stacking_rule' => 'sequential',
            'max_autonomous_discount_pct' => 10.0,
            'minimum_gross_margin_pct' => 20.0,
            'is_active' => true,
        ]);
    }

    /**
     * Skenario A34: Diskon 10% lalu 5% secara sekuensial menghasilkan 14.5%, bukan 15%.
     */
    public function test_scenario_a34_sequential_compounding_discount()
    {
        // Net multiplier = (1 - 0.10) * (1 - 0.05) = 0.90 * 0.95 = 0.855
        // Total discount = 1 - 0.855 = 0.145 = 14.5%
        $calculatedDiscount = $this->policy->calculateSequentialDiscount([10.0, 5.0]);

        $this->assertEquals(14.5, $calculatedDiscount, 'Sequential compounding discount must yield 14.5% instead of additive 15%.');
    }

    /**
     * Skenario A35: Base Rp 125.000, HPP Rp 80.000, margin 20%, auto disc 10%.
     * Floor margin = 80.000 / (1 - 0.20) = 100.000
     * Floor auto discount = 125.000 * (1 - 0.10) = 112.500
     * AI tidak boleh menawarkan di bawah Rp 112.500.
     */
    public function test_scenario_a35_fixture_margin_and_discount_floor()
    {
        $quote = $this->pricingEngine->calculateQuote([
            'workspace_id' => $this->workspace->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'customer_tier' => 'standard',
            'discount_percentage' => 10.0,
        ]);

        $this->assertEquals(125000, $quote['base_price']);
        $this->assertEquals(80000, $quote['hpp_cost']);
        $this->assertEquals(100000, $quote['margin_floor_price']);
        $this->assertEquals(112500, $quote['effective_floor_price']);
        $this->assertEquals(112500, $quote['net_price']);
        $this->assertTrue($quote['is_permissible_autonomous'], '10% discount reaches exact permissible floor (112.500) and should be autonomous.');
        $this->assertFalse($quote['requires_human_approval']);

        // Test attempting 15% discount (which is below the 10% auto limit)
        $quoteOverDiscount = $this->pricingEngine->calculateQuote([
            'workspace_id' => $this->workspace->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'customer_tier' => 'standard',
            'discount_percentage' => 15.0,
        ]);

        $this->assertFalse($quoteOverDiscount['is_permissible_autonomous'], '15% exceeds max autonomous discount and must require human approval.');
        $this->assertTrue($quoteOverDiscount['requires_human_approval']);
    }

    /**
     * Skenario A36: Subsidi ongkir / bonus / fee diperhitungkan bersamaan, menolak offer jika melanggar floor.
     */
    public function test_scenario_a36_variable_fees_and_shipping_subsidy()
    {
        // If selling at floor 112.500 with 15.000 shipping subsidy,
        // Revenue net without subsidy = 112.500 - 15.000 = 97.500.
        // Cost = 80.000. Realized margin = (97.500 - 80.000) / 97.500 = 17.9% < 20% floor.
        $quoteWithShipping = $this->pricingEngine->calculateQuote([
            'workspace_id' => $this->workspace->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'customer_tier' => 'standard',
            'discount_percentage' => 10.0,
            'shipping_subsidy' => 15000,
        ]);

        $this->assertFalse($quoteWithShipping['is_permissible_autonomous'], 'Shipping subsidy breaching margin floor must trigger human approval.');
        $this->assertTrue($quoteWithShipping['requires_human_approval']);
    }

    /**
     * Skenario A37: HPP / Biaya tidak tersedia -> tidak mengklaim profit aman; hanya approved fixed sell price atau handoff.
     */
    public function test_scenario_a37_missing_cost_prevents_autonomous_concession()
    {
        // Create product without HPP / CostEntry
        $unknownCostProduct = Product::create([
            'workspace_id' => $this->workspace->id,
            'sku' => 'CUSTOM-PANEL-01',
            'brand' => 'Custom ATS',
            'name' => 'Custom Switchboard Assembly',
            'unit' => 'unit',
            'moq' => 1,
        ]);

        PriceEntry::create([
            'price_book_id' => $this->priceBook->id,
            'product_id' => $unknownCostProduct->id,
            'sku' => $unknownCostProduct->sku,
            'tier' => 'standard',
            'min_quantity' => 1,
            'base_price' => 5000000,
            'currency' => 'IDR',
        ]);

        $quote = $this->pricingEngine->calculateQuote([
            'workspace_id' => $this->workspace->id,
            'product_id' => $unknownCostProduct->id,
            'quantity' => 1,
            'customer_tier' => 'standard',
            'discount_percentage' => 5.0, // attempting discount on missing cost item
        ]);

        $this->assertNull($quote['hpp_cost']);
        $this->assertFalse($quote['is_permissible_autonomous']);
        $this->assertTrue($quote['requires_human_approval']);
        $this->assertEquals('missing_cost_basis', $quote['reason_code']);
    }
}
