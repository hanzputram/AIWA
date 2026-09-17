<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\HandoffRequest;
use App\Models\Conversation;
use App\Domain\Handoff\HumanTakeoverService;
use App\Models\AuditLog;

class TakeoverController extends Controller
{
    protected HumanTakeoverService $takeoverService;

    public function __construct(HumanTakeoverService $takeoverService)
    {
        $this->takeoverService = $takeoverService;
    }

    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $tab = $request->query('tab', 'all');

        $query = HandoffRequest::with([
            'conversation.contact',
            'conversation.channel',
            'conversation.handoverBrief',
            'primaryHuman',
            'claimedBy',
        ])
        ->where('workspace_id', $workspaceId)
        ->whereIn('status', ['queued', 'assigned', 'claimed']);

        if ($tab === 'mine') {
            $query->where('claimed_by_user_id', $request->user()->id);
        } elseif ($tab === 'hot') {
            $query->whereJsonContains('reason_codes', 'buying_intent_high');
        } elseif ($tab === 'ready') {
            $query->whereJsonContains('reason_codes', 'ready_to_order');
        } elseif ($tab === 'stalled') {
            $query->whereJsonContains('reason_codes', 'negotiation_stalled');
        } elseif ($tab === 'discount') {
            $query->where(function ($q) {
                $q->whereJsonContains('reason_codes', 'discount_limit')
                  ->orWhereJsonContains('reason_codes', 'margin_risk');
            });
        } elseif ($tab === 'data') {
            $query->where(function ($q) {
                $q->whereJsonContains('reason_codes', 'knowledge_gap')
                  ->orWhereJsonContains('reason_codes', 'technical_complexity');
            });
        }

        $handoffs = $query->orderBy('priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($h) {
                return [
                    'id' => $h->id,
                    'conversation_id' => $h->conversation_id,
                    'contact' => $h->conversation->contact,
                    'channel' => $h->conversation->channel,
                    'priority' => $h->priority,
                    'status' => $h->status,
                    'reason_codes' => $h->reason_codes ?? [],
                    'intent_score' => $h->conversation->intent_score,
                    'intent_band' => $h->conversation->intent_band,
                    'sales_stage' => $h->conversation->sales_stage,
                    'negotiation_state' => $h->conversation->negotiation_state,
                    'primary_human' => $h->primaryHuman?->name,
                    'claimed_by' => $h->claimedBy?->name,
                    'claimed_at' => $h->claimed_at?->format('H:i'),
                    'sla_target_at' => $h->sla_target_at?->diffForHumans(),
                    'created_at' => $h->created_at->diffForHumans(),
                    'brief' => $h->conversation->handoverBrief,
                ];
            });

        return Inertia::render('takeover/Index', [
            'handoffs' => $handoffs,
            'current_tab' => $tab,
        ]);
    }

    public function claim(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $handoffRequest = HandoffRequest::where('workspace_id', $workspaceId)->findOrFail($id);

        $result = $this->takeoverService->claimTakeover($handoffRequest, $request->user());

        if (!$result['success']) {
            return response()->json([
                'error' => [
                    'code' => 'CLAIM_CONFLICT',
                    'message' => $result['message'],
                ]
            ], 409);
        }

        AuditLog::log('takeover.claimed', HandoffRequest::class, $handoffRequest->id, [
            'conversation_id' => $handoffRequest->conversation_id,
            'claimed_by' => $request->user()->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'epoch' => $result['epoch'],
        ]);
    }

    public function releaseToAi(Request $request, int $conversationId)
    {
        $workspaceId = session('current_workspace_id');
        $conversation = Conversation::where('workspace_id', $workspaceId)->findOrFail($conversationId);

        $data = $request->validate([
            'context_notes' => ['nullable', 'string'],
        ]);

        $result = $this->takeoverService->releaseToAi(
            $conversation,
            $request->user(),
            $data['context_notes'] ?? null
        );

        AuditLog::log('takeover.released_to_ai', Conversation::class, $conversation->id, [
            'released_by' => $request->user()->name,
            'notes' => $data['context_notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'epoch' => $result['epoch'],
        ]);
    }

    public function emergencyStop(Request $request)
    {
        $workspaceId = session('current_workspace_id');
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        $data = $request->validate([
            'emergency_stop' => ['required', 'boolean'],
        ]);

        $this->takeoverService->emergencyStop($workspace, $data['emergency_stop']);

        AuditLog::log('workspace.emergency_stop_toggled', \App\Models\Workspace::class, $workspace->id, [
            'emergency_stop' => $data['emergency_stop'],
        ]);

        return response()->json([
            'success' => true,
            'emergency_stop' => (bool) $workspace->emergency_stop,
            'message' => $data['emergency_stop']
                ? 'EMERGENCY STOP DIAKTIFKAN: Seluruh AI di workspace dihentikan seketika dan antrean dibatalkan.'
                : 'Emergency stop dicabut: AI siap beroperasi kembali.',
        ]);
    }
}
