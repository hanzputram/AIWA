<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Quote extends Model
{
    protected $fillable = [
        'workspace_id',
        'conversation_id',
        'contact_id',
        'quote_number',
        'current_revision_number',
        'status',
        'grand_total',
        'currency',
        'signed_token',
        'issued_at',
        'expires_at',
    ];

    protected $casts = [
        'current_revision_number' => 'integer',
        'grand_total' => 'decimal:2',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
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

    public function revisions(): HasMany
    {
        return $this->hasMany(QuoteRevision::class)->orderBy('revision_number', 'asc');
    }

    public function currentRevision(): HasOne
    {
        return $this->hasOne(QuoteRevision::class)->where('revision_number', $this->current_revision_number);
    }
}
