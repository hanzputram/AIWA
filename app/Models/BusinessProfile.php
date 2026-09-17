<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessProfile extends Model
{
    protected $fillable = [
        'workspace_id',
        'legal_name',
        'brand_name',
        'description',
        'services',
        'branches',
        'contact_info',
        'working_hours',
        'website',
        'portfolio_highlights',
        'source_document_name',
        'provenance',
        'is_approved',
    ];

    protected $casts = [
        'services' => 'array',
        'branches' => 'array',
        'contact_info' => 'array',
        'working_hours' => 'array',
        'portfolio_highlights' => 'array',
        'provenance' => 'array',
        'is_approved' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
