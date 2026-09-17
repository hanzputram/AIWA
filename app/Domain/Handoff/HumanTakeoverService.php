<?php

namespace App\Domain\Handoff;

use App\Models\Conversation;
use App\Models\HandoffRequest;
use App\Models\HandoverBrief;
use App\Models\User;
use App\Models\Workspace;
use App\Models\InternalNote;
use Illuminate\Support\Facades\DB;
use Exception;

class HumanTakeoverService
{
    /**
     * Trigger a human takeover request with epoch bumping and reason codes
     */
    public function triggerTakeover(
        Conversation $conversation,
        array $reasonCodes,
        string $priority = 'high'
    ): HandoffRequest {
        return DB::transaction(function () use ($conversation, $reasonCodes, $priority) {
            // 1. Increment control epoch to invalidate pending AI turns
            $newEpoch = $conversation->bumpEpoch();

            // 2. Update conversation control owner
            $existingReasons = $conversation->handoff_reasons ?? [];
            $allReasons = array_unique(array_merge($existingReasons, $reasonCodes));

            $conversation->control_owner = 'handoff_requested';
            $conversation->handoff_state = 'queued';
            $conversation->handoff_reasons = $allReasons;
            $conversation->save();

            // 3. Resolve routing: channel primary human or backup team
            $channel = $conversation->channel;
            $binding = $channel?->agentBinding;
            $primaryHumanId = $binding?->primary_human_id ?? $channel?->primary_human_id;
            $backupTeamId = $binding?->backup_team_id ?? $channel?->backup_team_id;

            // 4. Create or update active HandoffRequest
            $handoffRequest = HandoffRequest::where('conversation_id', $conversation->id)
                ->whereIn('status', ['queued', 'assigned'])
                ->first();

            if (!$handoffRequest) {
                $handoffRequest = HandoffRequest::create([
                    'workspace_id' => $conversation->workspace_id,
                    'conversation_id' => $conversation->id,
                    'reason_codes' => $allReasons,
                    'priority' => $priority,
                    'primary_human_id' => $primaryHumanId,
                    'backup_team_id' => $backupTeamId,
                    'status' => 'queued',
                    'sla_target_at' => now()->addMinutes($priority === 'urgent' ? 2 : 5),
                    'control_epoch_snapshot' => $newEpoch,
                ]);
            } else {
                $handoffRequest->reason_codes = $allReasons;
                $handoffRequest->priority = $priority;
                $handoffRequest->control_epoch_snapshot = $newEpoch;
                $handoffRequest->save();
            }

            // 5. Generate / Update Handover Brief
            $this->refreshHandoverBrief($conversation, $allReasons);

            return $handoffRequest;
        });
    }

    /**
     * Atomic claim of a takeover request (Compare-and-Swap concurrency protection)
     */
    public function claimTakeover(HandoffRequest $handoffRequest, User $user): array
    {
        return DB::transaction(function () use ($handoffRequest, $user) {
            // Re-fetch with row lock to avoid race conditions (Acceptance test A02 & A46)
            $lockedRequest = HandoffRequest::where('id', $handoffRequest->id)->lockForUpdate()->first();

            if (!$lockedRequest) {
                throw new Exception('Permintaan takeover tidak ditemukan.');
            }

            if ($lockedRequest->status === 'claimed' && $lockedRequest->claimed_by_user_id !== $user->id) {
                $claimedByName = $lockedRequest->claimedBy?->name ?? 'operator lain';
                return [
                    'success' => false,
                    'conflict' => true,
                    'message' => "Percakapan ini telah diklaim oleh {$claimedByName}.",
                ];
            }

            // Perform atomic claim
            $lockedRequest->status = 'claimed';
            $lockedRequest->claimed_by_user_id = $user->id;
            $lockedRequest->claimed_at = now();
            $lockedRequest->save();

            // Update conversation to human active
            $conversation = $lockedRequest->conversation;
            $newEpoch = $conversation->bumpEpoch();

            $conversation->control_owner = 'human_active';
            $conversation->handoff_state = 'claimed';
            $conversation->assigned_user_id = $user->id;
            $conversation->save();

            // Record internal audit note
            InternalNote::create([
                'conversation_id' => $conversation->id,
                'workspace_id' => $conversation->workspace_id,
                'user_id' => $user->id,
                'content' => "Operator {$user->name} mengambil alih percakapan (Takeover Claimed). AI dinonaktifkan.",
            ]);

            return [
                'success' => true,
                'conflict' => false,
                'epoch' => $newEpoch,
                'message' => 'Percakapan berhasil diambil alih.',
            ];
        });
    }

    /**
     * Explicitly release conversation from human back to AI
     */
    public function releaseToAi($conversation, $userOrOptions = null, ?string $contextNotes = null)
    {
        $conv = is_numeric($conversation) ? Conversation::findOrFail($conversation) : $conversation;
        $user = ($userOrOptions instanceof User) ? $userOrOptions : ($conv->assignedUser ?? User::first());
        $notes = is_array($userOrOptions) ? ($userOrOptions['human_notes'] ?? null) : $contextNotes;

        return DB::transaction(function () use ($conv, $user, $notes) {
            // Bump epoch to start fresh AI context
            $newEpoch = $conv->bumpEpoch();

            $conv->control_owner = 'ai_active';
            $conv->handoff_state = 'completed';
            $conv->assigned_user_id = null;
            $conv->save();

            // Close active handoff requests
            HandoffRequest::where('conversation_id', $conv->id)
                ->whereIn('status', ['queued', 'assigned', 'claimed'])
                ->update(['status' => 'completed']);

            // Record internal note with context if user exists
            if ($user) {
                $noteText = "Operator {$user->name} mengembalikan percakapan ke AI (Released to AI).";
                if (!empty($notes)) {
                    $noteText .= " Catatan konteks: {$notes}";
                }

                InternalNote::create([
                    'conversation_id' => $conv->id,
                    'workspace_id' => $conv->workspace_id,
                    'user_id' => $user->id,
                    'content' => $noteText,
                ]);
            }

            return $conv;
        });
    }

    /**
     * Dispatch fence check: Verifies if message is allowed to be dispatched to customer
     */
    public function checkDispatchFence(Conversation $conversation, int $messageControlEpoch, string $senderType): bool
    {
        // Human messages are always allowed if conversation is active
        if ($senderType === 'human' || $senderType === 'system') {
            return true;
        }

        // Workspace emergency stop blocks all AI sends
        if ($conversation->workspace->emergency_stop) {
            return false;
        }

        // Channel emergency stop blocks AI sends
        if ($conversation->channel->is_emergency_paused) {
            return false;
        }

        // AI is only allowed if control_owner is 'ai_active' AND epoch matches exactly
        if ($conversation->control_owner !== 'ai_active') {
            return false;
        }

        if ($conversation->control_epoch !== $messageControlEpoch) {
            return false; // Late AI output discarded!
        }

        return true;
    }

    /**
     * Emergency Stop: workspace-wide AI shutdown
     */
    public function emergencyStop(Workspace $workspace, bool $stop = true): void
    {
        $workspace->emergency_stop = $stop;
        $workspace->save();

        // Bump epoch across all active conversations in the workspace
        Conversation::where('workspace_id', $workspace->id)
            ->where('control_owner', 'ai_active')
            ->update([
                'control_owner' => 'ai_paused',
                'control_epoch' => DB::raw('control_epoch + 1')
            ]);
    }

    public function emergencyStopWorkspace(int $workspaceId): void
    {
        $workspace = Workspace::findOrFail($workspaceId);
        $this->emergencyStop($workspace, true);

        // Also turn off channel AI modes
        \App\Models\Channel::where('workspace_id', $workspaceId)
            ->update(['ai_mode' => 'off']);
    }

    public function requestHandoff(Conversation $conversation, array $params = []): HandoffRequest
    {
        return $this->triggerTakeover(
            $conversation,
            $params['reason_codes'] ?? ['manual_request'],
            $params['priority'] ?? 'high'
        );
    }

    public function claimHandoff(int $handoffId, int $userId): array
    {
        $handoff = HandoffRequest::findOrFail($handoffId);
        $user = User::findOrFail($userId);

        if ($handoff->status === 'claimed' && $handoff->claimed_by_user_id !== $user->id) {
            throw new \RuntimeException('Handoff request already claimed or resolved.');
        }

        $res = $this->claimTakeover($handoff, $user);
        if ($res['conflict']) {
            throw new \RuntimeException('Handoff request already claimed or resolved.');
        }

        return [
            'success' => true,
            'claimed_by' => $user->id,
            'conversation' => $handoff->conversation,
        ];
    }

    public function verifyDispatchFence(int $conversationId, int $epochSnapshot): bool
    {
        $conversation = Conversation::find($conversationId);
        if (!$conversation) return false;

        return $this->checkDispatchFence($conversation, $epochSnapshot, 'ai');
    }

    /**
     * Build or refresh structured Handover Brief
     */
    public function refreshHandoverBrief(Conversation $conversation, array $reasonCodes): HandoverBrief
    {
        $brief = HandoverBrief::firstOrNew(['conversation_id' => $conversation->id]);

        $contact = $conversation->contact;
        $latestQuote = $conversation->quotes()->latest()->first();
        $negoSession = $conversation->negotiationSession;

        $brief->customer_needs = "Pelanggan {$contact->name} ({$contact->phone_e164}) membutuhkan penawaran produk pada channel {$conversation->channel->name}.";

        if ($latestQuote) {
            $brief->last_valid_quote_summary = "Quote #{$latestQuote->quote_number} (Rev {$latestQuote->current_revision_number}): Rp " . number_format($latestQuote->grand_total, 0, ',', '.') . " ({$latestQuote->status})";
        } else {
            $brief->last_valid_quote_summary = "Belum ada penawaran resmi yang diterbitkan.";
        }

        $brief->customer_last_bid = $negoSession?->customer_bid_total
            ? "Rp " . number_format($negoSession->customer_bid_total, 0, ',', '.')
            : "Tidak ada bid nominal eksplisit.";

        $concessionCount = $negoSession?->concessions()->count() ?? 0;
        $brief->concessions_summary = "Telah diberikan {$concessionCount} putaran konsesi diskon.";

        $reasonLabels = [
            'buying_intent_high' => 'Potensi Beli Tinggi (HOT Lead)',
            'ready_to_order' => 'Pelanggan Siap Order / Minta Invoice',
            'negotiation_stalled' => 'Negosiasi Alot (3 putaran tanpa kesepakatan)',
            'discount_limit' => 'Batas Diskon Maksimum Tercapai',
            'margin_risk' => 'Risiko Pelanggaran Margin Keuntungan',
            'terms_exception' => 'Permintaan Termin / Pengiriman Khusus',
            'high_value_deal' => 'Transaksi Bernilai Tinggi',
            'technical_complexity' => 'Spesifikasi Teknis Rumit / Butuh Sales Engineer',
            'knowledge_gap' => 'Data Produk / Harga Belum Valid',
            'customer_requests_human' => 'Pelanggan Meminta Berbicara dengan Manusia',
            'complaint' => 'Keluhan / Komplain Layanan',
            'ai_failure' => 'Gangguan Sistem / AI Fallback',
        ];

        $reasonsText = [];
        foreach ($reasonCodes as $code) {
            $reasonsText[] = $reasonLabels[$code] ?? $code;
        }
        $brief->trigger_reasons_summary = implode(', ', $reasonsText);

        $brief->suggested_next_actions = "1. Buka timeline chat dan periksa kebutuhan spesifik pelanggan.\n2. Lakukan konfirmasi stok & penawaran resmi.\n3. Berikan instruksi transfer rekening resmi perusahaan.";
        $brief->is_cost_guarded = true; // HPP & margin detail are strictly guarded for cost.view role
        $brief->save();

        return $brief;
    }
}
