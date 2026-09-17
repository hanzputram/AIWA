<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChannelAgentBinding extends Model
{
    protected $fillable = [
        'channel_id',
        'agent_profile_id',
        'active_release_id',
        'price_book_id',
        'discount_policy_id',
        'primary_human_id',
        'backup_team_id',
        'takeover_thresholds',
    ];

    protected $casts = [
        'takeover_thresholds' => 'array',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function agentProfile(): BelongsTo
    {
        return $this->belongsTo(AgentProfile::class);
    }

    public function activeRelease(): BelongsTo
    {
        return $this->belongsTo(KnowledgeRelease::class, 'active_release_id');
    }

    public function priceBook(): BelongsTo
    {
        return $this->belongsTo(PriceBook::class);
    }

    public function discountPolicy(): BelongsTo
    {
        return $this->belongsTo(DiscountPolicy::class);
    }

    public function primaryHuman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_human_id');
    }

    public function backupTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'backup_team_id');
    }
}
