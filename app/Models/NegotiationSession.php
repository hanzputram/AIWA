<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NegotiationSession extends Model
{
    protected $fillable = [
        'workspace_id',
        'conversation_id',
        'contact_id',
        'asking_total',
        'current_offer_total',
        'customer_bid_total',
        'rounds_count',
        'stalled_objection_count',
        'is_stalled',
        'status',
    ];

    protected $casts = [
        'asking_total' => 'decimal:2',
        'current_offer_total' => 'decimal:2',
        'customer_bid_total' => 'decimal:2',
        'rounds_count' => 'integer',
        'stalled_objection_count' => 'integer',
        'is_stalled' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function concessions(): HasMany
    {
        return $this->hasMany(Concession::class)->orderBy('round_number', 'asc');
    }
}
