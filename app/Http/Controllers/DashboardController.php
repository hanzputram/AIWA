<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Conversation;
use App\Models\HandoffRequest;
use App\Models\Channel;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\Message;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        // Calculate real KPIs (no fabricated demo numbers)
        $activeConversationsCount = Conversation::where('workspace_id', $workspaceId)
            ->whereIn('lifecycle', ['open', 'pending'])
            ->count();

        $hotLeadsCount = Conversation::where('workspace_id', $workspaceId)
            ->where('intent_band', 'hot')
            ->count();

        $pendingTakeoverCount = HandoffRequest::where('workspace_id', $workspaceId)
            ->whereIn('status', ['queued', 'assigned'])
            ->count();

        $totalQuotesIssued = Quote::where('workspace_id', $workspaceId)->count();
        $totalDealsValue = Deal::where('workspace_id', $workspaceId)->sum('amount');

        // AI vs Human message metrics
        $aiMessagesCount = Message::where('workspace_id', $workspaceId)
            ->where('sender_type', 'ai')
            ->count();

        $humanMessagesCount = Message::where('workspace_id', $workspaceId)
            ->where('sender_type', 'human')
            ->count();

        $totalOutbound = max(1, $aiMessagesCount + $humanMessagesCount);
        $aiAutomationPct = round(($aiMessagesCount / $totalOutbound) * 100, 1);

        // Urgent takeover items for quick action
        $urgentTakeovers = HandoffRequest::with(['conversation.contact', 'conversation.channel'])
            ->where('workspace_id', $workspaceId)
            ->whereIn('status', ['queued', 'assigned'])
            ->orderBy('priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'conversation_id' => $req->conversation_id,
                    'contact_name' => $req->conversation->contact->name,
                    'channel_name' => $req->conversation->channel->name,
                    'priority' => $req->priority,
                    'reasons' => $req->reason_codes,
                    'intent_score' => $req->conversation->intent_score,
                    'status' => $req->status,
                    'created_at' => $req->created_at->diffForHumans(),
                ];
            });

        // Connected channels overview
        $channels = Channel::where('workspace_id', $workspaceId)
            ->select('id', 'name', 'phone_e164', 'connection_status', 'ai_mode', 'is_emergency_paused')
            ->get();

        return Inertia::render('dashboard/Index', [
            'metrics' => [
                'active_conversations' => $activeConversationsCount,
                'hot_leads' => $hotLeadsCount,
                'pending_takeovers' => $pendingTakeoverCount,
                'quotes_issued' => $totalQuotesIssued,
                'total_deals_value' => $totalDealsValue,
                'ai_messages_count' => $aiMessagesCount,
                'human_messages_count' => $humanMessagesCount,
                'ai_automation_pct' => $aiAutomationPct,
            ],
            'urgent_takeovers' => $urgentTakeovers,
            'channels' => $channels,
            'emergency_stop' => (bool) $workspace->emergency_stop,
        ]);
    }
}
