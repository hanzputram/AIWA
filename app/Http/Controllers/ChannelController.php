<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Channel;
use App\Models\AgentProfile;
use App\Models\ChannelAgentBinding;
use App\Models\KnowledgeRelease;
use App\Models\PriceBook;
use App\Models\DiscountPolicy;
use App\Models\User;
use App\Models\Team;
use App\Models\Contact;
use App\Models\Conversation;
use App\Domain\AISales\AISalesOrchestrator;
use App\Domain\Handoff\HumanTakeoverService;
use App\Models\AuditLog;

class ChannelController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $channels = Channel::with(['primaryHuman', 'backupTeam', 'agentBinding.agentProfile'])
            ->where('workspace_id', $workspaceId)
            ->get();

        $agentProfiles = AgentProfile::where('workspace_id', $workspaceId)->get();
        $releases = KnowledgeRelease::where('workspace_id', $workspaceId)->get();
        $priceBooks = PriceBook::where('workspace_id', $workspaceId)->get();
        $discountPolicies = DiscountPolicy::where('workspace_id', $workspaceId)->get();
        $users = User::whereHas('workspaces', fn($q) => $q->where('workspaces.id', $workspaceId))->get();
        $teams = Team::where('workspace_id', $workspaceId)->get();

        return Inertia::render('numbers/Index', [
            'channels' => $channels,
            'agent_profiles' => $agentProfiles,
            'releases' => $releases,
            'price_books' => $priceBooks,
            'discount_policies' => $discountPolicies,
            'users' => $users,
            'teams' => $teams,
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone_e164' => ['required', 'string', 'max:30'],
            'display_number' => ['nullable', 'string', 'max:50'],
            'branch' => ['nullable', 'string', 'max:100'],
            'provider' => ['required', 'in:meta,fake_sandbox'],
            'waba_id' => ['nullable', 'string'],
            'phone_number_id' => ['nullable', 'string'],
            'secret_reference' => ['nullable', 'string'],
            'ai_mode' => ['required', 'in:off,assist,autonomous'],
            'primary_human_id' => ['nullable', 'exists:users,id'],
            'backup_team_id' => ['nullable', 'exists:teams,id'],
        ]);

        $hasCredentials = !empty($data['waba_id']) && !empty($data['phone_number_id']);
        $status = 'draft';
        if ($data['provider'] === 'fake_sandbox') {
            $status = 'connected';
        } elseif ($hasCredentials) {
            $status = 'connecting';
        }

        $channel = Channel::create(array_merge($data, [
            'workspace_id' => $workspaceId,
            'connection_status' => $status,
        ]));

        AuditLog::log('channel.created', Channel::class, $channel->id, ['name' => $channel->name]);

        return redirect()->back()->with('success', "Nomor WhatsApp [{$channel->name}] berhasil ditambahkan.");
    }

    public function update(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $channel = Channel::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone_e164' => ['required', 'string', 'max:30'],
            'display_number' => ['nullable', 'string', 'max:50'],
            'branch' => ['nullable', 'string', 'max:100'],
            'provider' => ['required', 'in:meta,fake_sandbox'],
            'waba_id' => ['nullable', 'string'],
            'phone_number_id' => ['nullable', 'string'],
            'secret_reference' => ['nullable', 'string'],
            'ai_mode' => ['required', 'in:off,assist,autonomous'],
            'primary_human_id' => ['nullable', 'exists:users,id'],
            'backup_team_id' => ['nullable', 'exists:teams,id'],
        ]);

        $channel->update($data);

        AuditLog::log('channel.updated', Channel::class, $channel->id, ['name' => $channel->name]);

        return redirect()->back()->with('success', "Nomor WhatsApp [{$channel->name}] berhasil diperbarui.");
    }

    public function destroy(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $channel = Channel::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $channel->name;
        $channel->delete();

        AuditLog::log('channel.deleted', Channel::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Nomor WhatsApp [{$name}] berhasil dihapus.");
    }

    public function updateAiMode(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $channel = Channel::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'ai_mode' => ['required', 'in:off,assist,autonomous'],
        ]);

        $channel->ai_mode = $data['ai_mode'];
        $channel->save();

        AuditLog::log('channel.ai_mode_updated', Channel::class, $channel->id, ['ai_mode' => $channel->ai_mode]);

        return response()->json([
            'success' => true,
            'ai_mode' => $channel->ai_mode,
            'message' => "Mode AI untuk {$channel->name} diubah menjadi [{$channel->ai_mode}].",
        ]);
    }

    public function toggleEmergencyPause(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $channel = Channel::where('workspace_id', $workspaceId)->findOrFail($id);

        $channel->is_emergency_paused = !$channel->is_emergency_paused;
        $channel->save();

        // Invalidate in-flight turns for this channel
        Conversation::where('channel_id', $channel->id)
            ->where('control_owner', 'ai_active')
            ->increment('control_epoch');

        return response()->json([
            'success' => true,
            'is_emergency_paused' => $channel->is_emergency_paused,
            'message' => $channel->is_emergency_paused ? "AI pada nomor {$channel->name} dihentikan darurat." : "AI pada nomor {$channel->name} diaktifkan kembali.",
        ]);
    }

    public function simulateInbound(Request $request, int $id, AISalesOrchestrator $orchestrator)
    {
        $workspaceId = session('current_workspace_id');
        $channel = Channel::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'customer_name' => ['required', 'string'],
            'customer_phone' => ['required', 'string'],
            'message_text' => ['required', 'string'],
        ]);

        $normalizedPhone = Contact::normalizePhone($data['customer_phone']);

        $contact = Contact::firstOrCreate(
            ['workspace_id' => $workspaceId, 'phone_e164' => $normalizedPhone],
            ['name' => $data['customer_name']]
        );

        $conversation = Conversation::firstOrCreate(
            ['workspace_id' => $workspaceId, 'channel_id' => $channel->id, 'contact_id' => $contact->id],
            [
                'control_owner' => $channel->ai_mode === 'autonomous' ? 'ai_active' : 'human_active',
                'control_epoch' => 1,
            ]
        );

        $result = $orchestrator->handleInboundMessage($conversation, $data['message_text']);

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->id,
            'orchestrator_result' => $result,
        ]);
    }
}
