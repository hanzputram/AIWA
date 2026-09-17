<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Concession extends Model
{
    protected $fillable = [
        'negotiation_session_id',
        'round_number',
        'concession_type',
        'granted_pct',
        'price_after',
        'conditions',
    ];

    protected $casts = [
        'round_number' => 'integer',
        'granted_pct' => 'decimal:2',
        'price_after' => 'decimal:2',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(NegotiationSession::class, 'negotiation_session_id');
    }
}
