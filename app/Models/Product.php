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
        'is_active',
    ];

    protected $casts = [
        'pack_size' => 'integer',
        'moq' => 'integer',
        'is_active' => 'boolean',
    ];

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
