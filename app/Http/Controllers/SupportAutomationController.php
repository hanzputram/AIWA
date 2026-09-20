<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Workflow;
use App\Models\Ticket;
use App\Models\Contact;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Str;

class SupportAutomationController extends Controller
{
    // ==================== WORKFLOWS ====================

    public function workflows(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $workflows = Workflow::where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('automations/Index', [
            'workflows' => $workflows,
        ]);
    }

    public function storeWorkflow(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger' => ['required', 'string'],
            'action' => ['required', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $workflow = Workflow::create([
            'workspace_id' => $workspaceId,
            'name' => $data['name'],
            'definition' => [
                'trigger' => $data['trigger'],
                'action' => $data['action'],
                'description' => $data['description'] ?? '',
            ],
            'is_active' => true,
        ]);

        AuditLog::log('workflow.created', Workflow::class, $workflow->id, ['name' => $workflow->name]);

        return redirect()->back()->with('success', "Aturan Automasi [{$workflow->name}] berhasil dibuat.");
    }

    public function updateWorkflow(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $workflow = Workflow::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger' => ['required', 'string'],
            'action' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $workflow->name = $data['name'];
        $workflow->definition = [
            'trigger' => $data['trigger'],
            'action' => $data['action'],
            'description' => $data['description'] ?? '',
        ];
        if (isset($data['is_active'])) {
            $workflow->is_active = (bool) $data['is_active'];
        }
        $workflow->save();

        AuditLog::log('workflow.updated', Workflow::class, $workflow->id, ['name' => $workflow->name]);

        return redirect()->back()->with('success', "Aturan Automasi [{$workflow->name}] berhasil diperbarui.");
    }

    public function deleteWorkflow(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $workflow = Workflow::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $workflow->name;
        $workflow->delete();

        AuditLog::log('workflow.deleted', Workflow::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Aturan Automasi [{$name}] berhasil dihapus.");
    }

    // ==================== TICKETS ====================

    public function tickets(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $tickets = Ticket::with(['contact', 'assignedUser', 'conversation'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('sla_due_at', 'asc')
            ->get();

        $contacts = Contact::where('workspace_id', $workspaceId)->get();
        $users = User::whereHas('workspaces', fn($q) => $q->where('workspaces.id', $workspaceId))->get();

        return Inertia::render('support/Tickets', [
            'tickets' => $tickets,
            'contacts' => $contacts,
            'users' => $users,
        ]);
    }

    public function storeTicket(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'sla_hours' => ['nullable', 'integer', 'min:1'],
        ]);

        $slaHours = (int) ($data['sla_hours'] ?? ($data['priority'] === 'urgent' ? 4 : ($data['priority'] === 'high' ? 8 : 24)));
        $ticketNumber = 'TCK-' . strtoupper(Str::random(6));

        $ticket = Ticket::create([
            'workspace_id' => $workspaceId,
            'ticket_number' => $ticketNumber,
            'title' => $data['title'],
            'contact_id' => $data['contact_id'],
            'priority' => $data['priority'],
            'status' => 'new',
            'assigned_user_id' => $data['assigned_user_id'] ?? null,
            'sla_due_at' => now()->addHours($slaHours),
        ]);

        AuditLog::log('ticket.created', Ticket::class, $ticket->id, ['ticket_number' => $ticketNumber]);

        return redirect()->back()->with('success', "Tiket [{$ticketNumber}] berhasil dibuat.");
    }

    public function updateTicket(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $ticket = Ticket::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['required', 'in:new,in_progress,waiting_customer,resolved,closed'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
        ]);

        if ($data['status'] === 'resolved' && $ticket->status !== 'resolved') {
            $ticket->resolved_at = now();
        }

        $ticket->update($data);

        AuditLog::log('ticket.updated', Ticket::class, $ticket->id, ['ticket_number' => $ticket->ticket_number]);

        return redirect()->back()->with('success', "Tiket [{$ticket->ticket_number}] berhasil diperbarui.");
    }

    public function updateTicketStatus(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $ticket = Ticket::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:new,in_progress,waiting_customer,resolved,closed'],
        ]);

        $ticket->status = $data['status'];
        if ($data['status'] === 'resolved') {
            $ticket->resolved_at = now();
        }
        $ticket->save();

        return response()->json([
            'success' => true,
            'status' => $ticket->status,
        ]);
    }

    public function deleteTicket(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $ticket = Ticket::where('workspace_id', $workspaceId)->findOrFail($id);
        $num = $ticket->ticket_number;
        $ticket->delete();

        AuditLog::log('ticket.deleted', Ticket::class, $id, ['ticket_number' => $num]);

        return redirect()->back()->with('success', "Tiket [{$num}] berhasil dihapus.");
    }
}
