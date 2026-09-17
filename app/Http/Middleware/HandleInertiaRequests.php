<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $currentWorkspace = null;
        $permissions = [];
        $userRole = null;

        if ($user) {
            $workspaceId = session('current_workspace_id') ?? $user->current_workspace_id;
            if ($workspaceId) {
                $currentWorkspace = \App\Models\Workspace::find($workspaceId);
            }
            if (!$currentWorkspace) {
                $currentWorkspace = $user->workspaces()->first();
                if ($currentWorkspace) {
                    session(['current_workspace_id' => $currentWorkspace->id]);
                }
            }

            if ($currentWorkspace) {
                $membership = \App\Models\Membership::where('workspace_id', $currentWorkspace->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($membership) {
                    $userRole = $membership->role;
                    $permissions = $membership->getEffectivePermissions();
                }
            }
        }

        $urgentHandoffsCount = 0;
        if ($currentWorkspace) {
            $urgentHandoffsCount = \App\Models\HandoffRequest::where('workspace_id', $currentWorkspace->id)
                ->whereIn('status', ['queued', 'assigned'])
                ->count();
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $userRole,
                    'permissions' => $permissions,
                ] : null,
                'workspace' => $currentWorkspace ? [
                    'id' => $currentWorkspace->id,
                    'name' => $currentWorkspace->name,
                    'slug' => $currentWorkspace->slug,
                    'timezone' => $currentWorkspace->timezone,
                    'emergency_stop' => (bool) $currentWorkspace->emergency_stop,
                ] : null,
                'workspaces' => $user ? $user->workspaces()->select('workspaces.id', 'workspaces.name', 'workspaces.slug')->get() : [],
            ],
            'stats' => [
                'urgent_handoffs_count' => $urgentHandoffsCount,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ]);
    }
}
