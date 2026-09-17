<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeRelease extends Model
{
    protected $fillable = [
        'workspace_id',
        'version_tag',
        'status',
        'summary',
        'item_count',
    ];

    protected $casts = [
        'item_count' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
