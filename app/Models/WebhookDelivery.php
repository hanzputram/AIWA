<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $fillable = [
        'workspace_id',
        'provider',
        'payload',
        'signature',
        'is_verified',
        'processed_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'processed_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
