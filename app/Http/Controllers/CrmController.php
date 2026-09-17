<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\AuditLog;

class CrmController extends Controller
{
    public function contacts(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $contacts = Contact::with('company')
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        $companies = Company::where('workspace_id', $workspaceId)->get();

        return Inertia::render('crm/Contacts', [
            'contacts' => $contacts,
            'companies' => $companies,
        ]);
    }

    public function storeContact(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'job_title' => ['nullable', 'string'],
            'customer_tier' => ['required', 'in:standard,silver,gold,platinum'],
        ]);

        $normalizedPhone = Contact::normalizePhone($data['phone']);

        $contact = Contact::updateOrCreate(
            ['workspace_id' => $workspaceId, 'phone_e164' => $normalizedPhone],
            [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'company_id' => $data['company_id'] ?? null,
                'job_title' => $data['job_title'] ?? null,
                'customer_tier' => $data['customer_tier'],
            ]
        );

        return redirect()->back()->with('success', "Kontak [{$contact->name}] berhasil disimpan.");
    }

    public function companies(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $companies = Company::withCount('contacts', 'deals')
            ->where('workspace_id', $workspaceId)
            ->get();

        return Inertia::render('crm/Companies', [
            'companies' => $companies,
        ]);
    }

    public function deals(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $deals = Deal::with(['contact', 'company'])
            ->where('workspace_id', $workspaceId)
            ->get();

        $contacts = Contact::where('workspace_id', $workspaceId)->get();
        $companies = Company::where('workspace_id', $workspaceId)->get();

        return Inertia::render('crm/Deals', [
            'deals' => $deals,
            'contacts' => $contacts,
            'companies' => $companies,
        ]);
    }

    public function updateDealStage(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $deal = Deal::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'stage' => ['required', 'in:baru,kualifikasi,penawaran,negosiasi,menang,kalah'],
        ]);

        $deal->stage = $data['stage'];
        $deal->save();

        AuditLog::log('deal.stage_updated', Deal::class, $deal->id, ['stage' => $deal->stage]);

        return response()->json([
            'success' => true,
            'stage' => $deal->stage,
        ]);
    }
}
