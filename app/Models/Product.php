<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'workspace_id',
        'sku',
        'name',
        'brand',
        'category',
        'unit',
        'pack_size',
        'moq',
        'description',
        'photo_url',
        'datasheet_url',
        'price_list',
        'coefficient',
        'discount_pct',
        'floor_price',
        'datasheet_path',
        'brand_url',
        'specs_source',
        'ai_learned_at',
        'ai_learning_notes',
        'is_active',
    ];

    protected $casts = [
        'price_list' => 'decimal:2',
        'coefficient' => 'decimal:4',
        'discount_pct' => 'decimal:2',
        'floor_price' => 'decimal:2',
        'ai_learned_at' => 'datetime',
        'pack_size' => 'integer',
        'moq' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Compute and sync floor price based on: PL * coefficient * (1 - discount_pct / 100)
     */
    public function calculateFloorPrice(): float
    {
        $pl = (float) ($this->price_list ?? 0);
        $coeff = (float) ($this->coefficient ?? 1.0);
        $discount = (float) ($this->discount_pct ?? 0.0);

        if ($pl <= 0) {
            return 0.0;
        }

        $effectiveMultiplier = max(0.0, 1.0 - ($discount / 100.0));
        return round($pl * $coeff * $effectiveMultiplier, 2);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(ProductAlias::class);
    }

    public function specs(): HasMany
    {
        return $this->hasMany(ProductSpec::class);
    }

    public function priceEntries(): HasMany
    {
        return $this->hasMany(PriceEntry::class);
    }

    public function costEntries(): HasMany
    {
        return $this->hasMany(CostEntry::class);
    }
}
