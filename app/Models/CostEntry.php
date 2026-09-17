<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostEntry extends Model
{
    protected $fillable = [
        'workspace_id',
        'product_id',
        'sku',
        'hpp_cost',
        'landed_cost',
        'shipping_subsidy',
        'handling_fee',
        'margin_floor_pct',
        'version',
    ];

    protected $casts = [
        'hpp_cost' => 'decimal:2',
        'landed_cost' => 'decimal:2',
        'shipping_subsidy' => 'decimal:2',
        'handling_fee' => 'decimal:2',
        'margin_floor_pct' => 'decimal:2',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Total cost for calculating gross margin floor
     */
    public function getTotalFixedCost(): float
    {
        return (float) $this->hpp_cost + (float) $this->landed_cost + (float) $this->handling_fee + (float) $this->shipping_subsidy;
    }
}
