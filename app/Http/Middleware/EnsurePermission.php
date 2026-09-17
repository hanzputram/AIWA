<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json(['error' => ['code' => 'UNAUTHENTICATED', 'message' => 'Silakan login terlebih dahulu.']], 401);
            }
            return redirect()->route('login');
        }

        $workspaceId = session('current_workspace_id') ?? $user->current_workspace_id;
        if (!$workspaceId) {
            $workspace = $user->workspaces()->first();
            if ($workspace) {
                $workspaceId = $workspace->id;
                session(['current_workspace_id' => $workspaceId]);
            }
        }

        if (!$workspaceId) {
            abort(403, 'Tidak ada workspace aktif.');
        }

        $membership = \App\Models\Membership::where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership || !$membership->hasPermission($permission)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => [
                        'code' => 'FORBIDDEN',
                        'message' => "Anda tidak memiliki hak akses [$permission] pada workspace ini."
                    ]
                ], 403);
            }
            abort(403, "Anda tidak memiliki hak akses [$permission] pada workspace ini.");
        }

        return $next($request);
    }
}
