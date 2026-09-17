<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscountPolicy extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'version',
        'max_autonomous_discount_pct',
        'discount_step_pct',
        'max_discount_rounds',
        'stacking_rule',
        'minimum_gross_margin_pct',
        'requires_manager_approval_above_pct',
        'is_active',
    ];

    protected $casts = [
        'max_autonomous_discount_pct' => 'decimal:2',
        'discount_step_pct' => 'decimal:2',
        'minimum_gross_margin_pct' => 'decimal:2',
        'requires_manager_approval_above_pct' => 'decimal:2',
        'max_discount_rounds' => 'integer',
        'is_active' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Compute compound sequential discount.
     * E.g. [10, 5] => 1 - (1 - 0.10) * (1 - 0.05) = 1 - 0.855 = 0.145 (14.5%)
     */
    public static function calculateEffectiveDiscountPct(array $discountPcts, string $mode = 'sequential'): float
    {
        if (empty($discountPcts)) {
            return 0.0;
        }

        if ($mode === 'additive') {
            return (float) array_sum($discountPcts);
        }

        $multiplier = 1.0;
        foreach ($discountPcts as $pct) {
            $multiplier *= (1.0 - ($pct / 100.0));
        }

        return round((1.0 - $multiplier) * 100.0, 2);
    }

    public function calculateSequentialDiscount(array $discountPcts): float
    {
        return self::calculateEffectiveDiscountPct($discountPcts, 'sequential');
    }
}
