<?php

namespace App\Domain\Pricing;

use App\Models\Product;
use App\Models\PriceBook;
use App\Models\PriceEntry;
use App\Models\CostEntry;
use App\Models\DiscountPolicy;
use App\Models\BrandDiscountMatrix;
use App\Models\Quote;
use App\Models\QuoteRevision;
use App\Models\QuoteLine;
use App\Models\Conversation;
use Illuminate\Support\Str;

class PricingEngineService
{
    /**
     * Compute line item pricing deterministically
     */
    public function calculateLineItem(
        Product $product,
        int $quantity,
        ?PriceBook $priceBook = null,
        ?DiscountPolicy $discountPolicy = null,
        array $discountPcts = [],
        string $tier = 'standard'
    ): array {
        $quantity = max(1, $quantity);

        // 1. Resolve base price from PriceBook
        $basePrice = 0.0;
        if ($priceBook) {
            $entry = PriceEntry::where('price_book_id', $priceBook->id)
                ->where('product_id', $product->id)
                ->where('tier', $tier)
                ->where('min_quantity', '<=', $quantity)
                ->orderBy('min_quantity', 'desc')
                ->first();

            if ($entry) {
                $basePrice = (float) $entry->base_price;
                if ($priceBook->price_basis === 'list_with_coefficient') {
                    $basePrice = $basePrice * (float) $priceBook->coefficient;
                }
            }
        }

        // Fallback default if price book entry not found
        if ($basePrice <= 0) {
            $basePrice = 100000.0; // fallback base price for simulation
        }

        // 2. Resolve discount stacking
        $stackingRule = $discountPolicy?->stacking_rule ?? 'sequential';
        $effectiveDiscountPct = DiscountPolicy::calculateEffectiveDiscountPct($discountPcts, $stackingRule);

        // Cap discount by autonomous policy limit if applicable
        $maxAutoDiscount = (float) ($discountPolicy?->max_autonomous_discount_pct ?? 10.0);
        $appliedDiscountPct = min($effectiveDiscountPct, $maxAutoDiscount);

        // 3. Compute net price
        $unitNetPrice = $basePrice * (1.0 - ($appliedDiscountPct / 100.0));
        $totalPrice = $unitNetPrice * $quantity;

        // 4. Resolve Internal Cost and Gross Margin Floor
        $costEntry = CostEntry::where('product_id', $product->id)->latest()->first();
        $hasKnownCost = false;
        $unitFixedCost = 0.0;
        $marginFloorPct = (float) ($discountPolicy?->minimum_gross_margin_pct ?? 20.0);
        $actualMarginPct = null;
        $sellFloor = 0.0;

        if ($costEntry && $costEntry->hpp_cost > 0) {
            $hasKnownCost = true;
            $unitFixedCost = $costEntry->getTotalFixedCost();
            $marginFloorPct = (float) $costEntry->margin_floor_pct;

            // Gross Margin: m = (R - C) / R
            if ($unitNetPrice > 0) {
                $actualMarginPct = round((($unitNetPrice - $unitFixedCost) / $unitNetPrice) * 100.0, 2);
            }

            // Sell Floor: max(cost / (1 - min_margin), base_price * (1 - max_auto_discount))
            $marginCostFloor = $unitFixedCost / (1.0 - ($marginFloorPct / 100.0));
            $policyDiscountFloor = $basePrice * (1.0 - ($maxAutoDiscount / 100.0));
            $sellFloor = max($marginCostFloor, $policyDiscountFloor);
        } else {
            // Missing cost: Sell floor is the policy discount floor; margin cannot be claimed safe
            $sellFloor = $basePrice * (1.0 - ($maxAutoDiscount / 100.0));
        }

        // Enforce product base floor price from Excel PL * coefficient * (1 - discount)
        if ($product->floor_price && (float) $product->floor_price > 0) {
            $sellFloor = max($sellFloor, (float) $product->floor_price);
        }

        // Look up Brand Discount Matrix (Brand, Kategori, Seri)
        $matrixRule = BrandDiscountMatrix::findMatchingRule($product->workspace_id, $product->brand, $product->category, $product->sku);
        if ($matrixRule) {
            if ($matrixRule->khusus_discount_pct !== null && (float) $matrixRule->khusus_discount_pct > 0) {
                $khususFloor = $basePrice * (1.0 - ((float) $matrixRule->khusus_discount_pct / 100.0));
                $sellFloor = max($sellFloor, $khususFloor);
            }
        }

        $violatesMarginFloor = false;
        if (($hasKnownCost || ($product->floor_price && (float) $product->floor_price > 0) || ($matrixRule && $matrixRule->khusus_discount_pct !== null)) && $unitNetPrice < $sellFloor) {
            $violatesMarginFloor = true;
        }

        return [
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'quantity' => $quantity,
            'unit' => $product->unit,
            'unit_list_price' => round($basePrice, 2),
            'discount_pcts' => $discountPcts,
            'effective_discount_pct' => $effectiveDiscountPct,
            'applied_discount_pct' => $appliedDiscountPct,
            'unit_net_price' => round($unitNetPrice, 2),
            'total_price' => round($totalPrice, 2),
            'has_known_cost' => $hasKnownCost,
            'unit_fixed_cost' => round($unitFixedCost, 2),
            'margin_floor_pct' => $marginFloorPct,
            'actual_margin_pct' => $actualMarginPct,
            'sell_floor' => round($sellFloor, 2),
            'violates_margin_floor' => $violatesMarginFloor,
        ];
    }

    /**
     * Calculate quote for single product with margin and floor validation (for tests & simulation)
     */
    public function calculateQuote(array $params): array
    {
        $workspaceId = $params['workspace_id'];
        $product = Product::findOrFail($params['product_id']);
        $quantity = $params['quantity'] ?? 1;
        $tier = $params['customer_tier'] ?? 'standard';
        $discountPct = (float) ($params['discount_percentage'] ?? 0.0);
        $shippingSubsidy = (float) ($params['shipping_subsidy'] ?? 0.0);

        $priceBook = PriceBook::where('workspace_id', $workspaceId)->where('is_active', true)->first();
        $policy = DiscountPolicy::where('workspace_id', $workspaceId)->where('is_active', true)->first();
        $costEntry = CostEntry::where('workspace_id', $workspaceId)->where('product_id', $product->id)->latest()->first();

        $entry = PriceEntry::where('product_id', $product->id)
            ->where('tier', $tier)
            ->first();
        $basePrice = $entry ? (float) $entry->base_price : 125000.0;

        $maxAutoDiscount = (float) ($policy?->max_autonomous_discount_pct ?? 10.0);
        $minMarginPct = (float) ($policy?->minimum_gross_margin_pct ?? 20.0);

        $netPrice = $basePrice * (1.0 - ($discountPct / 100.0));
        $netRevenueAfterSubsidy = $netPrice - $shippingSubsidy;

        $hasHpp = ($costEntry && $costEntry->hpp_cost > 0);
        $hppCost = $hasHpp ? (float) $costEntry->hpp_cost : null;

        $marginFloorPrice = $hasHpp ? ($hppCost / (1.0 - ($minMarginPct / 100.0))) : null;
        $discountFloorPrice = $basePrice * (1.0 - ($maxAutoDiscount / 100.0));
        $effectiveFloorPrice = $hasHpp ? max($marginFloorPrice, $discountFloorPrice) : $discountFloorPrice;
        if ($product->floor_price && (float) $product->floor_price > 0) {
            $effectiveFloorPrice = max($effectiveFloorPrice, (float) $product->floor_price);
        }

        $matrixRule = BrandDiscountMatrix::findMatchingRule($workspaceId, $product->brand, $product->category, $product->sku);
        if ($matrixRule && $matrixRule->khusus_discount_pct !== null && (float) $matrixRule->khusus_discount_pct > 0) {
            $khususFloor = $basePrice * (1.0 - ((float) $matrixRule->khusus_discount_pct / 100.0));
            $effectiveFloorPrice = max($effectiveFloorPrice, $khususFloor);
        }

        $isPermissible = true;
        $requiresApproval = false;
        $reasonCode = 'ok';

        if (!$hasHpp && $discountPct > 0) {
            $isPermissible = false;
            $requiresApproval = true;
            $reasonCode = 'missing_cost_basis';
        } elseif ($discountPct > $maxAutoDiscount) {
            $isPermissible = false;
            $requiresApproval = true;
            $reasonCode = 'exceeds_max_auto_discount';
        } elseif ($hasHpp) {
            $realizedMargin = ($netRevenueAfterSubsidy - $hppCost) / $netRevenueAfterSubsidy;
            if ($realizedMargin < ($minMarginPct / 100.0) || $netPrice < $effectiveFloorPrice || $netRevenueAfterSubsidy < $marginFloorPrice) {
                $isPermissible = false;
                $requiresApproval = true;
                $reasonCode = 'breaches_margin_floor';
            }
        }

        return [
            'base_price' => $basePrice,
            'hpp_cost' => $hppCost,
            'margin_floor_price' => $marginFloorPrice,
            'effective_floor_price' => $effectiveFloorPrice,
            'net_price' => $netPrice,
            'is_permissible_autonomous' => $isPermissible,
            'requires_human_approval' => $requiresApproval,
            'reason_code' => $reasonCode,
        ];
    }

    /**
     * Evaluate whether a concession or discount is safe against Brand Discount Matrix floor and Cost Floor
     */
    public function evaluateConcessionSafety(
        int $workspaceId,
        float $basePrice,
        ?float $hppCost,
        float $requestedDiscountPct,
        ?string $productBrand = null,
        ?string $productCategory = null,
        ?string $productSkuOrSeries = null
    ): array {
        $netPrice = $basePrice * (1.0 - ($requestedDiscountPct / 100.0));

        // 1. Check Brand Discount Matrix hard floor
        $matrixRule = BrandDiscountMatrix::findMatchingRule($workspaceId, $productBrand, $productCategory, $productSkuOrSeries);
        if ($matrixRule && $matrixRule->khusus_discount_pct !== null) {
            $khususFloorPct = (float) $matrixRule->khusus_discount_pct;
            if ($requestedDiscountPct > $khususFloorPct) {
                return [
                    'is_safe' => false,
                    'reason_code' => 'matrix_floor_breached',
                    'message' => "Requested discount {$requestedDiscountPct}% breaches matrix floor limit of {$khususFloorPct}%.",
                    'matrix_rule' => $matrixRule,
                ];
            }
        }

        // 2. Check HPP Cost margin floor
        if ($hppCost !== null && $hppCost > 0) {
            $policy = DiscountPolicy::where('workspace_id', $workspaceId)->where('is_active', true)->first();
            $minMarginPct = (float) ($policy?->minimum_gross_margin_pct ?? 20.0);
            $marginFloor = $hppCost / (1.0 - ($minMarginPct / 100.0));
            if ($netPrice < $marginFloor) {
                return [
                    'is_safe' => false,
                    'reason_code' => 'margin_floor_breached',
                    'message' => "Net price {$netPrice} breaches minimum gross margin floor.",
                    'matrix_rule' => $matrixRule,
                ];
            }
        }

        return [
            'is_safe' => true,
            'reason_code' => 'ok',
            'net_price' => $netPrice,
            'matrix_rule' => $matrixRule,
        ];
    }

    /**
     * Create or revise a formal quotation with cryptographic signed token
     */
    public function createQuote(
        Conversation $conversation,
        array $lineItemsData,
        string $createdBy = 'system_policy',
        ?int $approvedByUserId = null
    ): Quote {
        $workspace = $conversation->workspace;
        $contact = $conversation->contact;

        $quote = Quote::firstOrNew([
            'conversation_id' => $conversation->id,
            'status' => 'issued',
        ]);

        if (!$quote->exists) {
            $quote->workspace_id = $workspace->id;
            $quote->contact_id = $contact->id;
            $quote->quote_number = 'QUO-' . date('Ymd') . '-' . strtoupper(Str::random(4));
            $quote->current_revision_number = 1;
        } else {
            $quote->current_revision_number++;
        }

        // Calculate totals across all lines
        $subtotal = 0.0;
        $totalDiscount = 0.0;
        $grandTotal = 0.0;
        $totalCost = 0.0;
        $hasAnyKnownCost = false;

        $linesToSave = [];
        foreach ($lineItemsData as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) continue;

            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $discountPcts = $item['discount_pcts'] ?? [];

            $calc = $this->calculateLineItem($product, $qty, null, null, $discountPcts);

            $lineSubtotal = $calc['unit_list_price'] * $qty;
            $lineTotal = $calc['total_price'];
            $lineDiscount = $lineSubtotal - $lineTotal;

            $subtotal += $lineSubtotal;
            $totalDiscount += $lineDiscount;
            $grandTotal += $lineTotal;

            if ($calc['has_known_cost']) {
                $hasAnyKnownCost = true;
                $totalCost += ($calc['unit_fixed_cost'] * $qty);
            }

            $linesToSave[] = [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'product_name' => $product->name,
                'quantity' => $qty,
                'unit' => $product->unit,
                'unit_list_price' => $calc['unit_list_price'],
                'unit_discount_pct' => $calc['applied_discount_pct'],
                'unit_net_price' => $calc['unit_net_price'],
                'total_price' => $calc['total_price'],
            ];
        }

        $overallMarginPct = null;
        if ($hasAnyKnownCost && $grandTotal > 0) {
            $overallMarginPct = round((($grandTotal - $totalCost) / $grandTotal) * 100.0, 2);
        }

        $quote->grand_total = $grandTotal;
        $quote->currency = 'IDR';
        $quote->issued_at = now();
        $quote->expires_at = now()->addDays(7); // default 7 days validity
        $quote->signed_token = hash_hmac('sha256', $quote->quote_number . '|' . $grandTotal . '|' . $quote->current_revision_number, config('app.key'));
        $quote->save();

        $revision = QuoteRevision::create([
            'quote_id' => $quote->id,
            'revision_number' => $quote->current_revision_number,
            'subtotal' => $subtotal,
            'total_discount' => $totalDiscount,
            'shipping_fee' => 0.0,
            'tax_amount' => 0.0,
            'grand_total' => $grandTotal,
            'gross_margin_pct' => $overallMarginPct,
            'payment_terms' => 'Cash Before Delivery / Transfer Bank Resmi',
            'delivery_terms' => 'Franco Gudang / Estimasi 2-3 Hari Kerja',
            'approved_by_user_id' => $approvedByUserId,
            'created_by' => $createdBy,
        ]);

        foreach ($linesToSave as $line) {
            $line['quote_revision_id'] = $revision->id;
            QuoteLine::create($line);
        }

        return $quote;
    }
}
