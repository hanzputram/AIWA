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
                $workspace = $user->workspaces()->first()
                    ?? ($user->current_workspace_id ? \App\Models\Workspace::find($user->current_workspace_id) : null)
                    ?? \App\Models\Workspace::first();
                if ($workspace) {
                    session(['current_workspace_id' => $workspace->id]);
                    if (!$user->current_workspace_id) {
                        $user->current_workspace_id = $workspace->id;
                        $user->save();
                    }
                }
            }
        }

        return $next($request);
    }
}
