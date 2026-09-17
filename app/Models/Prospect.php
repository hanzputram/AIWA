<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prospect extends Model
{
    protected $fillable = [
        'company_name', 'industry', 'address', 'lat', 'lng',
        'phone', 'email', 'website',
        'pic_name', 'pic_role', 'pic_phone', 'pic_email',
        'source', 'status', 'services', 'deal_value', 'priority',
        'notes', 'tags', 'next_follow_up', 'last_contacted_at',
    ];

    protected function casts(): array
    {
        return [
            'services' => 'array',
            'tags' => 'array',
            'lat' => 'float',
            'lng' => 'float',
            'deal_value' => 'integer',
            'next_follow_up' => 'date',
            'last_contacted_at' => 'datetime',
        ];
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->orderByDesc('created_at');
    }
}
