<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'workspace_id',
        'direction',
        'sender_type',
        'sender_id',
        'kind',
        'content',
        'metadata',
        'provider_message_id',
        'state',
        'error_message',
        'control_epoch_snapshot',
    ];

    protected $casts = [
        'metadata' => 'array',
        'control_epoch_snapshot' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
