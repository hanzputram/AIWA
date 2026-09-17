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

class SupportAutomationController extends Controller
{
    public function workflows(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $workflows = Workflow::where('workspace_id', $workspaceId)->get();

        return Inertia::render('automations/Index', [
            'workflows' => $workflows,
        ]);
    }

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
}
