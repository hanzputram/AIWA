<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user) {
            $workspaceId = session('current_workspace_id');
            if (!$workspaceId) {
                $workspace = $user->workspaces()->first();
                if ($workspace) {
                    session(['current_workspace_id' => $workspace->id]);
                }
            }
        }

        return $next($request);
    }
}
