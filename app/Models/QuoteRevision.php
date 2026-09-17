<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuoteRevision extends Model
{
    protected $fillable = [
        'quote_id',
        'revision_number',
        'subtotal',
        'total_discount',
        'shipping_fee',
        'tax_amount',
        'grand_total',
        'gross_margin_pct',
        'payment_terms',
        'delivery_terms',
        'status',
        'approved_by_user_id',
        'created_by',
    ];

    protected $casts = [
        'revision_number' => 'integer',
        'subtotal' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'gross_margin_pct' => 'decimal:2',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(QuoteLine::class);
    }
}
