<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutboxEvent extends Model
{
    protected $fillable = [
        'workspace_id',
        'topic',
        'entity_type',
        'entity_id',
        'payload',
        'available_at',
        'attempts',
        'dispatched_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'available_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
