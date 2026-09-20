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
use App\Models\QuoteLine;
use App\Models\Message;
use App\Models\Contact;
use App\Models\Ticket;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        // 1. Core Real Sales & Orders KPIs
        $wonDealsSum = (float) Deal::where('workspace_id', $workspaceId)->where('stage', 'won')->sum('amount');
        $approvedQuotesSum = (float) Quote::where('workspace_id', $workspaceId)->whereIn('status', ['approved', 'accepted'])->sum('grand_total');
        $totalSalesReal = $wonDealsSum > 0 ? $wonDealsSum : $approvedQuotesSum;

        $totalQuotesCount = Quote::where('workspace_id', $workspaceId)->count();
        $totalDealsCount = Deal::where('workspace_id', $workspaceId)->count();
        $totalOrdersCount = $totalQuotesCount + $totalDealsCount;

        $productsSoldCount = (int) QuoteLine::whereHas('quoteRevision.quote', fn($q) => $q->where('workspace_id', $workspaceId)->whereIn('status', ['approved', 'accepted', 'issued']))->sum('quantity');

        $totalContactsCount = Contact::where('workspace_id', $workspaceId)->count();
        $hotLeadsCount = Conversation::where('workspace_id', $workspaceId)->where('intent_band', 'hot')->count();

        // 2. Active Conversations & Takeover
        $activeConversationsCount = Conversation::where('workspace_id', $workspaceId)
            ->whereIn('lifecycle', ['open', 'pending'])
            ->count();

        $pendingTakeoverCount = HandoffRequest::where('workspace_id', $workspaceId)
            ->whereIn('status', ['queued', 'assigned'])
            ->count();

        // 3. AI vs Human Message Metrics
        $aiMessagesCount = Message::where('workspace_id', $workspaceId)
            ->where('sender_type', 'ai')
            ->count();

        $humanMessagesCount = Message::where('workspace_id', $workspaceId)
            ->where('sender_type', 'human')
            ->count();

        $inboundMessagesCount = Message::where('workspace_id', $workspaceId)
            ->where('sender_type', 'contact')
            ->count();

        $totalOutbound = max(1, $aiMessagesCount + $humanMessagesCount);
        $aiAutomationPct = ($aiMessagesCount + $humanMessagesCount) > 0 ? round(($aiMessagesCount / ($aiMessagesCount + $humanMessagesCount)) * 100, 1) : 0.0;

        // 4. Real Visitor & Chat Activity (Last 7 Days)
        $chatInsights = [];
        $startDate = now()->subDays(6)->startOfDay();

        for ($i = 0; $i < 7; $i++) {
            $date = (clone $startDate)->addDays($i);
            $dayKey = $date->format('Y-m-d');
            $dayName = match ((int) $date->format('N')) {
                1 => 'Sen', 2 => 'Sel', 3 => 'Rab', 4 => 'Kam', 5 => 'Jum', 6 => 'Sab', 7 => 'Min'
            };

            $inbound = Message::where('workspace_id', $workspaceId)
                ->where('sender_type', 'contact')
                ->whereDate('created_at', $dayKey)
                ->count();

            $aiOut = Message::where('workspace_id', $workspaceId)
                ->where('sender_type', 'ai')
                ->whereDate('created_at', $dayKey)
                ->count();

            $humanOut = Message::where('workspace_id', $workspaceId)
                ->where('sender_type', 'human')
                ->whereDate('created_at', $dayKey)
                ->count();

            $chatInsights[] = [
                'day' => $dayName,
                'date' => $dayKey,
                'inbound' => $inbound,
                'ai' => $aiOut,
                'human' => $humanOut,
                'total' => $inbound + $aiOut + $humanOut,
            ];
        }

        // 5. Real Weekly Revenue (Monday to Sunday)
        $weeklyRevenue = [];
        $startOfWeek = now()->startOfWeek();

        for ($i = 0; $i < 7; $i++) {
            $dayDate = (clone $startOfWeek)->addDays($i);
            $dayKey = $dayDate->format('Y-m-d');
            $dayName = match ($i + 1) {
                1 => 'Sen', 2 => 'Sel', 3 => 'Rab', 4 => 'Kam', 5 => 'Jum', 6 => 'Sab', 7 => 'Min'
            };

            $waAi = (float) Quote::where('workspace_id', $workspaceId)
                ->whereDate('created_at', $dayKey)
                ->whereIn('status', ['approved', 'accepted', 'issued'])
                ->sum('grand_total');

            $direct = (float) Deal::where('workspace_id', $workspaceId)
                ->whereDate('created_at', $dayKey)
                ->where('stage', 'won')
                ->sum('amount');

            $weeklyRevenue[] = [
                'day' => $dayName,
                'date' => $dayKey,
                'wa_ai' => $waAi,
                'direct' => $direct,
                'total' => $waAi + $direct,
            ];
        }

        // 6. Real Customer Satisfaction & Tickets
        $totalTickets = Ticket::where('workspace_id', $workspaceId)->count();
        $resolvedTickets = Ticket::where('workspace_id', $workspaceId)->where('status', 'resolved')->count();
        $satisfactionRate = $totalTickets > 0 ? round(($resolvedTickets / $totalTickets) * 100, 1) : 100.0;

        // 7. Real Target vs Realization
        $monthlyTarget = 100000000.0; // Rp 100 Juta default target
        $realizationPct = $monthlyTarget > 0 ? min(100.0, round(($totalSalesReal / $monthlyTarget) * 100, 1)) : 0.0;

        // 8. Urgent Takeover list
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
                    'contact_name' => $req->conversation->contact?->name ?? 'Pelanggan WhatsApp',
                    'channel_name' => $req->conversation->channel?->name ?? 'WhatsApp ATS',
                    'priority' => $req->priority,
                    'reasons' => $req->reason_codes ?? [],
                    'intent_score' => $req->conversation->intent_score ?? 0,
                    'status' => $req->status,
                    'created_at' => $req->created_at->diffForHumans(),
                ];
            });

        // 9. Channels overview
        $channels = Channel::where('workspace_id', $workspaceId)
            ->select('id', 'name', 'phone_e164', 'connection_status', 'ai_mode', 'is_emergency_paused')
            ->get();

        return Inertia::render('dashboard/Index', [
            'metrics' => [
                'total_sales' => $totalSalesReal,
                'total_orders' => $totalOrdersCount,
                'products_sold' => $productsSoldCount,
                'total_contacts' => $totalContactsCount,
                'hot_leads' => $hotLeadsCount,
                'active_conversations' => $activeConversationsCount,
                'pending_takeovers' => $pendingTakeoverCount,
                'quotes_issued' => $totalQuotesCount,
                'ai_messages_count' => $aiMessagesCount,
                'human_messages_count' => $humanMessagesCount,
                'inbound_messages_count' => $inboundMessagesCount,
                'ai_automation_pct' => $aiAutomationPct,
                'satisfaction_rate' => $satisfactionRate,
                'total_tickets' => $totalTickets,
                'resolved_tickets' => $resolvedTickets,
                'monthly_target' => $monthlyTarget,
                'realization_pct' => $realizationPct,
            ],
            'chat_insights' => $chatInsights,
            'weekly_revenue' => $weeklyRevenue,
            'urgent_takeovers' => $urgentTakeovers,
            'channels' => $channels,
            'emergency_stop' => (bool) $workspace->emergency_stop,
        ]);
    }
}
