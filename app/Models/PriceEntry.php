<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceEntry extends Model
{
    protected $fillable = [
        'price_book_id',
        'product_id',
        'sku',
        'base_price',
        'tier',
        'min_quantity',
        'currency',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'min_quantity' => 'integer',
    ];

    public function priceBook(): BelongsTo
    {
        return $this->belongsTo(PriceBook::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
