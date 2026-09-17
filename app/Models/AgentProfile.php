<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentProfile extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'persona',
        'tone',
        'system_instructions',
        'model_name',
        'temperature',
        'max_tokens_per_turn',
        'token_budget',
        'allowed_tools',
    ];

    protected $casts = [
        'allowed_tools' => 'array',
        'temperature' => 'float',
        'max_tokens_per_turn' => 'integer',
        'token_budget' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
