<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Membership extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'role',
        'permissions',
        'status',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Standard role permission mappings
     */
    public static array $defaultRolePermissions = [
        'owner' => [
            'knowledge.edit', 'knowledge.publish', 'cost.view', 'price.manage',
            'discount.approve', 'ai.configure', 'ai.activate', 'chat.takeover',
            'chat.release_to_ai', 'quote.issue', 'campaign.manage', 'automation.publish',
            'data.export', 'workspace.manage', 'audit.view'
        ],
        'admin' => [
            'knowledge.edit', 'knowledge.publish', 'cost.view', 'price.manage',
            'discount.approve', 'ai.configure', 'ai.activate', 'chat.takeover',
            'chat.release_to_ai', 'quote.issue', 'campaign.manage', 'automation.publish',
            'data.export', 'workspace.manage', 'audit.view'
        ],
        'manager' => [
            'knowledge.edit', 'price.manage', 'discount.approve', 'ai.configure',
            'chat.takeover', 'chat.release_to_ai', 'quote.issue', 'team.manage'
        ],
        'agent' => [
            'chat.takeover', 'chat.release_to_ai', 'quote.issue'
        ],
        'marketing' => [
            'campaign.manage', 'template.manage'
        ],
        'knowledge_editor' => [
            'knowledge.edit', 'knowledge.publish'
        ],
        'pricing_approver' => [
            'cost.view', 'price.manage', 'discount.approve', 'quote.issue'
        ],
        'read_only' => [],
    ];

    public function getEffectivePermissions(): array
    {
        $base = self::$defaultRolePermissions[$this->role] ?? [];
        $custom = $this->permissions ?? [];
        return array_unique(array_merge($base, $custom));
    }

    public function hasPermission(string $permission): bool
    {
        if (in_array($this->role, ['owner', 'admin'])) {
            return true;
        }

        return in_array($permission, $this->getEffectivePermissions());
    }
}
