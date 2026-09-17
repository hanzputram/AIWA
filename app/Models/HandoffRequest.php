<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HandoffRequest extends Model
{
    protected $fillable = [
        'workspace_id',
        'conversation_id',
        'reason_codes',
        'priority',
        'primary_human_id',
        'backup_team_id',
        'claimed_by_user_id',
        'claimed_at',
        'sla_target_at',
        'escalated_at',
        'status',
        'control_epoch_snapshot',
    ];

    protected $casts = [
        'reason_codes' => 'array',
        'claimed_at' => 'datetime',
        'sla_target_at' => 'datetime',
        'escalated_at' => 'datetime',
        'control_epoch_snapshot' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function primaryHuman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_human_id');
    }

    public function backupTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'backup_team_id');
    }

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by_user_id');
    }
}
