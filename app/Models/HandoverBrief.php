<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandoverBrief extends Model
{
    protected $fillable = [
        'conversation_id',
        'customer_needs',
        'last_valid_quote_summary',
        'customer_last_bid',
        'concessions_summary',
        'trigger_reasons_summary',
        'evidence_quotes',
        'suggested_next_actions',
        'is_cost_guarded',
    ];

    protected $casts = [
        'evidence_quotes' => 'array',
        'is_cost_guarded' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
