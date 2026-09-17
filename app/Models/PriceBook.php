<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceBook extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'version',
        'currency',
        'tax_mode',
        'price_basis',
        'coefficient',
        'effective_from',
        'effective_until',
        'is_active',
    ];

    protected $casts = [
        'coefficient' => 'decimal:4',
        'effective_from' => 'date',
        'effective_until' => 'date',
        'is_active' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(PriceEntry::class);
    }
}
