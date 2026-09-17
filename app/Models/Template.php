<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    protected $fillable = [
        'workspace_id',
        'channel_id',
        'name',
        'language',
        'category',
        'header_type',
        'header_content',
        'body_content',
        'footer_content',
        'buttons',
        'provider_template_id',
        'status',
    ];

    protected $casts = [
        'buttons' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }
}
