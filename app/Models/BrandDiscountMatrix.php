<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandDiscountMatrix extends Model
{
    protected $fillable = [
        'workspace_id',
        'brand',
        'category',
        'coefficient',
        'series_type',
        'standard_discount_pct',
        'max_1_discount_pct',
        'max_2_discount_pct',
        'khusus_discount_pct',
        'notes',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'coefficient' => 'decimal:4',
        'standard_discount_pct' => 'decimal:2',
        'max_1_discount_pct' => 'decimal:2',
        'max_2_discount_pct' => 'decimal:2',
        'khusus_discount_pct' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Find matching discount matrix rule for a given brand and product category/series.
     * Uses smart score-based matching supporting multi-token series (e.g. "IC, IK", "LC1D, LRD").
     */
    public static function findMatchingRule(int $workspaceId, ?string $brand, ?string $category, ?string $seriesOrSku): ?self
    {
        if (empty($brand) && empty($category) && empty($seriesOrSku)) {
            return null;
        }

        $allRules = self::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();

        if ($allRules->isEmpty()) {
            return null;
        }

        $brandClean = $brand ? strtolower(trim($brand)) : '';
        $catClean = $category ? strtolower(trim($category)) : '';
        $skuClean = $seriesOrSku ? strtolower(trim($seriesOrSku)) : '';

        $bestMatch = null;
        $bestScore = -1;

        foreach ($allRules as $rule) {
            $score = 0;
            $ruleBrand = strtolower(trim($rule->brand ?? ''));
            $ruleCategory = strtolower(trim($rule->category ?? ''));
            $ruleSeries = strtolower(trim($rule->series_type ?? ''));

            // 1. Brand match
            if ($brandClean !== '') {
                if ($ruleBrand !== '') {
                    if (str_contains($brandClean, $ruleBrand) || str_contains($ruleBrand, $brandClean)) {
                        $score += 10;
                    } else {
                        // Brand mismatch, skip
                        continue;
                    }
                }
            }

            // 2. Series / SKU match
            if ($skuClean !== '' && $ruleSeries !== '') {
                $tokens = preg_split('/[,\s\/]+/', $ruleSeries);
                foreach ($tokens as $token) {
                    $token = trim($token);
                    if ($token !== '' && strlen($token) >= 2 && (str_contains($skuClean, $token) || str_contains($token, $skuClean))) {
                        $score += 25;
                        break;
                    }
                }
            }

            // 3. Category match
            if ($catClean !== '') {
                if ($ruleCategory !== '') {
                    if (str_contains($catClean, $ruleCategory) || str_contains($ruleCategory, $catClean)) {
                        $score += 15;
                    }
                }
                if ($ruleSeries !== '' && (str_contains($catClean, $ruleSeries) || str_contains($ruleSeries, $catClean))) {
                    $score += 10;
                }
            }

            if ($score > $bestScore && $score > 0) {
                $bestScore = $score;
                $bestMatch = $rule;
            }
        }

        return $bestMatch;
    }
}
