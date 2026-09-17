<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeImport extends Model
{
    protected $fillable = [
        'workspace_id',
        'document_name',
        'source_type',
        'status',
        'extracted_data',
        'conflicts',
        'reviewer_id',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'conflicts' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
