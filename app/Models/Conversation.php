<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class Conversation extends Model
{
    protected $fillable = [
        'workspace_id',
        'channel_id',
        'contact_id',
        'control_epoch',
        'lifecycle',
        'control_owner',
        'sales_stage',
        'intent_band',
        'intent_score',
        'purchase_probability',
        'negotiation_state',
        'handoff_state',
        'handoff_reasons',
        'assigned_user_id',
        'assigned_team_id',
        'last_customer_message_at',
        'last_message_at',
        'unread_count',
    ];

    protected $casts = [
        'control_epoch' => 'integer',
        'intent_score' => 'integer',
        'purchase_probability' => 'float',
        'handoff_reasons' => 'array',
        'last_customer_message_at' => 'datetime',
        'last_message_at' => 'datetime',
        'unread_count' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function assignedTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'assigned_team_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function internalNotes(): HasMany
    {
        return $this->hasMany(InternalNote::class)->orderBy('created_at', 'asc');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function negotiationSession(): HasOne
    {
        return $this->hasOne(NegotiationSession::class);
    }

    public function handoffRequests(): HasMany
    {
        return $this->hasMany(HandoffRequest::class);
    }

    public function activeHandoffRequest(): HasOne
    {
        return $this->hasOne(HandoffRequest::class)->whereIn('status', ['queued', 'assigned', 'claimed']);
    }

    public function handoverBrief(): HasOne
    {
        return $this->hasOne(HandoverBrief::class);
    }

    /**
     * Check if conversation is within 24-hour official WhatsApp messaging window
     */
    public function isWithinCustomerWindow(): bool
    {
        if (!$this->last_customer_message_at) {
            return false;
        }

        return $this->last_customer_message_at->diffInHours(now()) < 24;
    }

    /**
     * Increment control epoch to invalidate pending AI turns and scheduled jobs
     */
    public function bumpEpoch(): int
    {
        $this->increment('control_epoch');
        return $this->control_epoch;
    }
}
