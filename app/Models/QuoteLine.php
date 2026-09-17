<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteLine extends Model
{
    protected $fillable = [
        'quote_revision_id',
        'product_id',
        'sku',
        'product_name',
        'quantity',
        'unit',
        'unit_list_price',
        'unit_discount_pct',
        'unit_net_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_list_price' => 'decimal:2',
        'unit_discount_pct' => 'decimal:2',
        'unit_net_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function quoteRevision(): BelongsTo
    {
        return $this->belongsTo(QuoteRevision::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
