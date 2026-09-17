<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Conversation;
use App\Models\HandoffRequest;
use App\Models\Message;
use App\Models\NegotiationSession;
use App\Models\Concession;
use App\Models\Quote;
use App\Models\User;
use App\Models\Membership;
use App\Models\Team;
use App\Models\AuditLog;

class ReportSettingsController extends Controller
{
    public function reports(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $user = $request->user();

        // Check if user has cost.view permission
        $membership = Membership::where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->first();
        $canViewCost = $membership ? $membership->hasPermission('cost.view') : false;

        $conversations = Conversation::where('workspace_id', $workspaceId)->get();

        $intentDistribution = [
            'hot' => $conversations->where('intent_band', 'hot')->count(),
            'warm' => $conversations->where('intent_band', 'warm')->count(),
            'cold' => $conversations->where('intent_band', 'cold')->count(),
            'unknown' => $conversations->where('intent_band', 'unknown')->count(),
        ];

        $takeoversByReason = [
            'buying_intent_high' => HandoffRequest::where('workspace_id', $workspaceId)->whereJsonContains('reason_codes', 'buying_intent_high')->count(),
            'ready_to_order' => HandoffRequest::where('workspace_id', $workspaceId)->whereJsonContains('reason_codes', 'ready_to_order')->count(),
            'negotiation_stalled' => HandoffRequest::where('workspace_id', $workspaceId)->whereJsonContains('reason_codes', 'negotiation_stalled')->count(),
            'discount_limit' => HandoffRequest::where('workspace_id', $workspaceId)->whereJsonContains('reason_codes', 'discount_limit')->count(),
            'customer_requests_human' => HandoffRequest::where('workspace_id', $workspaceId)->whereJsonContains('reason_codes', 'customer_requests_human')->count(),
        ];

        $totalConcessions = Concession::whereHas('session', fn($q) => $q->where('workspace_id', $workspaceId))->count();
        $avgConcessionPct = Concession::whereHas('session', fn($q) => $q->where('workspace_id', $workspaceId))->avg('granted_pct') ?? 0;

        $quotes = Quote::where('workspace_id', $workspaceId)->get();
        $totalQuotesVal = $quotes->sum('grand_total');

        return Inertia::render('reports/Index', [
            'intent_distribution' => $intentDistribution,
            'takeovers_by_reason' => $takeoversByReason,
            'negotiation_stats' => [
                'total_concessions' => $totalConcessions,
                'avg_concession_pct' => round($avgConcessionPct, 2),
                'total_quotes_val' => $totalQuotesVal,
            ],
            'can_view_cost' => $canViewCost,
        ]);
    }

    public function settings(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        $memberships = Membership::with('user')
            ->where('workspace_id', $workspaceId)
            ->get();

        $teams = Team::with('members')->where('workspace_id', $workspaceId)->get();
        $auditLogs = AuditLog::with('user')
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('settings/Index', [
            'workspace' => $workspace,
            'memberships' => $memberships,
            'teams' => $teams,
            'audit_logs' => $auditLogs,
        ]);
    }
}
