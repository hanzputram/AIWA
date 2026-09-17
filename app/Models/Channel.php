<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Channel extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'phone_e164',
        'display_number',
        'branch',
        'provider',
        'waba_id',
        'phone_number_id',
        'secret_reference',
        'connection_status',
        'ai_mode',
        'is_emergency_paused',
        'primary_human_id',
        'backup_team_id',
        'last_webhook_at',
        'health_metrics',
    ];

    protected $casts = [
        'is_emergency_paused' => 'boolean',
        'last_webhook_at' => 'datetime',
        'health_metrics' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function primaryHuman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_human_id');
    }

    public function backupTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'backup_team_id');
    }

    public function agentBinding(): HasOne
    {
        return $this->hasOne(ChannelAgentBinding::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
