<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\InternalNote;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Product;
use App\Domain\Messaging\MessagingEligibilityService;
use App\Domain\Messaging\Providers\FakeWhatsAppSandboxProvider;
use App\Domain\Handoff\HumanTakeoverService;
use App\Models\AuditLog;

class InboxController extends Controller
{
    protected MessagingEligibilityService $eligibilityService;
    protected HumanTakeoverService $takeoverService;

    public function __construct(
        MessagingEligibilityService $eligibilityService,
        HumanTakeoverService $takeoverService
    ) {
        $this->eligibilityService = $eligibilityService;
        $this->takeoverService = $takeoverService;
    }

    public function index(Request $request, ?int $id = null): Response
    {
        $workspaceId = session('current_workspace_id');
        $userId = $request->user()->id;

        $conversations = Conversation::with(['contact', 'channel', 'assignedUser'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($c) {
                $lastMsg = $c->messages()->latest('id')->first();
                return [
                    'id' => $c->id,
                    'contact_name' => $c->contact->name,
                    'contact_phone' => $c->contact->phone_e164,
                    'channel_name' => $c->channel->name,
                    'lifecycle' => $c->lifecycle,
                    'control_owner' => $c->control_owner,
                    'sales_stage' => $c->sales_stage,
                    'intent_score' => $c->intent_score,
                    'intent_band' => $c->intent_band,
                    'negotiation_state' => $c->negotiation_state,
                    'unread_count' => $c->unread_count,
                    'last_message' => $lastMsg?->content,
                    'last_message_state' => $lastMsg?->state,
                    'last_message_direction' => $lastMsg?->direction,
                    'last_message_time' => $c->last_message_at?->diffForHumans(),
                    'is_within_window' => $c->isWithinCustomerWindow(),
                    'assigned_to' => $c->assignedUser?->name,
                ];
            });

        $activeConversation = null;
        $messages = [];
        $internalNotes = [];
        $handoverBrief = null;
        $activeQuote = null;

        $convModel = null;
        if ($id !== null) {
            $convModel = Conversation::with(['contact', 'channel', 'assignedUser', 'handoverBrief'])
                ->where('workspace_id', $workspaceId)
                ->findOrFail($id);
        } else {
            $selectedId = $conversations->first()['id'] ?? null;
            if ($selectedId) {
                $convModel = Conversation::with(['contact', 'channel', 'assignedUser', 'handoverBrief'])
                    ->where('workspace_id', $workspaceId)
                    ->find($selectedId);
            }
        }

        if ($convModel) {
            // Clear unread count on open
            if ($convModel->unread_count > 0) {
                $convModel->unread_count = 0;
                $convModel->save();
            }

            // Mark unread inbounds as read on Meta Cloud API
            if ($convModel->channel && ($convModel->channel->provider === 'meta' || !empty($convModel->channel->secret_reference))) {
                $unreadInbounds = $convModel->messages()
                    ->where('direction', 'inbound')
                    ->whereNotNull('provider_message_id')
                    ->where('state', '!=', 'read')
                    ->get();

                if ($unreadInbounds->isNotEmpty()) {
                    $metaProvider = new \App\Domain\Messaging\Providers\MetaCloudApiProvider();
                    foreach ($unreadInbounds as $inboundMsg) {
                        try {
                            $metaProvider->markAsRead($convModel->channel, $inboundMsg->provider_message_id);
                            $inboundMsg->state = 'read';
                            $inboundMsg->save();
                        } catch (\Throwable $e) {
                            // ignore
                        }
                    }
                }
            }

            $activeConversation = [
                'id' => $convModel->id,
                'contact' => $convModel->contact,
                'channel' => $convModel->channel,
                'lifecycle' => $convModel->lifecycle,
                'control_owner' => $convModel->control_owner,
                'sales_stage' => $convModel->sales_stage,
                'intent_score' => $convModel->intent_score,
                'intent_band' => $convModel->intent_band,
                'negotiation_state' => $convModel->negotiation_state,
                'handoff_state' => $convModel->handoff_state,
                'handoff_reasons' => $convModel->handoff_reasons ?? [],
                'is_within_window' => $convModel->isWithinCustomerWindow(),
                'last_customer_message_at' => $convModel->last_customer_message_at?->format('d M Y H:i'),
                'assigned_user' => $convModel->assignedUser,
                'control_epoch' => $convModel->control_epoch,
            ];

            $messages = $convModel->messages()->get();
            $internalNotes = $convModel->internalNotes()->with('user')->get();
            $handoverBrief = $convModel->handoverBrief;
            $activeQuote = $convModel->quotes()->with('currentRevision.lines')->latest()->first();
        }

        $products = Product::where('workspace_id', $workspaceId)->where('is_active', true)->get();

        return Inertia::render('inbox/Index', [
            'conversations' => $conversations,
            'active_conversation' => $activeConversation,
            'messages' => $messages,
            'internal_notes' => $internalNotes,
            'handover_brief' => $handoverBrief,
            'active_quote' => $activeQuote,
            'products' => $products,
        ]);
    }

    public function sendMessage(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $conversation = Conversation::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'content' => ['required', 'string'],
            'kind' => ['nullable', 'string', 'in:text,template,document,quote'],
        ]);

        $kind = $data['kind'] ?? 'text';

        // Check 24-hour eligibility rule
        $eligibility = $this->eligibilityService->checkEligibility($conversation, $kind);
        if (!$eligibility['eligible']) {
            return response()->json([
                'error' => [
                    'code' => $eligibility['code'],
                    'message' => $eligibility['reason'],
                ]
            ], 422);
        }

        // Outbound message from human agent
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'workspace_id' => $workspaceId,
            'direction' => 'outbound',
            'sender_type' => 'human',
            'sender_id' => $request->user()->id,
            'kind' => $kind,
            'content' => $data['content'],
            'state' => 'sent',
            'control_epoch_snapshot' => $conversation->control_epoch,
        ]);

        $conversation->last_message_at = now();
        $conversation->save();

        // Dispatch to real WhatsApp Cloud API if channel is Meta
        if ($conversation->channel->provider === 'meta' || !empty($conversation->channel->secret_reference)) {
            try {
                $metaProvider = new \App\Domain\Messaging\Providers\MetaCloudApiProvider();
                $res = $metaProvider->sendText($conversation->channel, $conversation->contact->phone_e164, $data['content']);
                if (!empty($res['provider_message_id'])) {
                    $message->provider_message_id = $res['provider_message_id'];
                    $message->state = $res['status'] ?? 'sent';
                    $message->save();
                }
            } catch (\Throwable $e) {
                \Log::error('Failed to send Meta Cloud API message from human inbox: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }

    public function addNote(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $conversation = Conversation::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'content' => ['required', 'string'],
        ]);

        // Internal notes are strictly stored internally and NEVER sent to the customer
        $note = InternalNote::create([
            'conversation_id' => $conversation->id,
            'workspace_id' => $workspaceId,
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        return response()->json([
            'success' => true,
            'note' => $note->load('user'),
        ]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $conversation = Conversation::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'lifecycle' => ['nullable', 'in:open,pending,resolved'],
            'sales_stage' => ['nullable', 'in:new,qualifying,qualified,quoted,negotiating,ready_to_order,won,lost,follow_up'],
        ]);

        if (isset($data['lifecycle'])) {
            $conversation->lifecycle = $data['lifecycle'];
        }
        if (isset($data['sales_stage'])) {
            $conversation->sales_stage = $data['sales_stage'];
        }
        $conversation->save();

        return response()->json([
            'success' => true,
            'lifecycle' => $conversation->lifecycle,
            'sales_stage' => $conversation->sales_stage,
        ]);
    }
}
