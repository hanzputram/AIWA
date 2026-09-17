<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    protected $fillable = [
        'workspace_id',
        'company_id',
        'name',
        'phone_e164',
        'email',
        'job_title',
        'customer_tier',
        'owner_id',
        'custom_fields',
        'last_inbound_at',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'last_inbound_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    /**
     * Normalize Indonesian phone numbers to E.164
     */
    public static function normalizePhone(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        $cleaned = preg_replace('/[^0-9+]/', '', trim($phone));

        if (str_starts_with($cleaned, '08')) {
            return '+62' . substr($cleaned, 1);
        }

        if (str_starts_with($cleaned, '628')) {
            return '+' . $cleaned;
        }

        if (str_starts_with($cleaned, '8')) {
            return '+62' . $cleaned;
        }

        if (!str_starts_with($cleaned, '+')) {
            return '+' . $cleaned;
        }

        return $cleaned;
    }
}
