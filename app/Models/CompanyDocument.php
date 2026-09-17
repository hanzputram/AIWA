<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyDocument extends Model
{
    protected $fillable = [
        'workspace_id',
        'title',
        'document_type',
        'classification',
        'file_path',
        'file_content_text',
        'is_approved',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isShareableWithCustomer(): bool
    {
        return $this->is_approved && $this->classification === 'customer_shareable';
    }

    public function isCustomerShareable(): bool
    {
        return $this->isShareableWithCustomer();
    }
}
