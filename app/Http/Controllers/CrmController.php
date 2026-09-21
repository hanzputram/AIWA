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
    // ==================== CONTACTS ====================

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

        AuditLog::log('contact.saved', Contact::class, $contact->id, ['name' => $contact->name]);

        return redirect()->back()->with('success', "Kontak [{$contact->name}] berhasil disimpan.");
    }

    public function updateContact(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $contact = Contact::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'job_title' => ['nullable', 'string'],
            'customer_tier' => ['required', 'in:standard,silver,gold,platinum'],
        ]);

        $contact->update([
            'name' => $data['name'],
            'phone_e164' => Contact::normalizePhone($data['phone']),
            'email' => $data['email'] ?? null,
            'company_id' => $data['company_id'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'customer_tier' => $data['customer_tier'],
        ]);

        AuditLog::log('contact.updated', Contact::class, $contact->id, ['name' => $contact->name]);

        return redirect()->back()->with('success', "Kontak [{$contact->name}] berhasil diperbarui.");
    }

    public function deleteContact(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $contact = Contact::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $contact->name;
        $contact->delete();

        AuditLog::log('contact.deleted', Contact::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Kontak [{$name}] berhasil dihapus.");
    }

    // ==================== COMPANIES ====================

    public function companies(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $companies = Company::withCount('contacts', 'deals')
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('crm/Companies', [
            'companies' => $companies,
        ]);
    }

    public function storeCompany(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
        ]);

        $company = Company::create(array_merge($data, [
            'workspace_id' => $workspaceId,
        ]));

        AuditLog::log('company.created', Company::class, $company->id, ['name' => $company->name]);

        return redirect()->back()->with('success', "Perusahaan [{$company->name}] berhasil ditambahkan.");
    }

    public function updateCompany(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $company = Company::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
        ]);

        $company->update($data);

        AuditLog::log('company.updated', Company::class, $company->id, ['name' => $company->name]);

        return redirect()->back()->with('success', "Perusahaan [{$company->name}] berhasil diperbarui.");
    }

    public function deleteCompany(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $company = Company::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $company->name;
        $company->delete();

        AuditLog::log('company.deleted', Company::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Perusahaan [{$name}] berhasil dihapus.");
    }

    // ==================== DEALS ====================

    public function deals(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $deals = Deal::with(['contact', 'company'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        $contacts = Contact::where('workspace_id', $workspaceId)->get();
        $companies = Company::where('workspace_id', $workspaceId)->get();

        return Inertia::render('crm/Deals', [
            'deals' => $deals,
            'contacts' => $contacts,
            'companies' => $companies,
        ]);
    }

    public function storeDeal(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'stage' => ['required', 'in:baru,kualifikasi,penawaran,negosiasi,menang,kalah'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
        ]);

        $deal = Deal::create(array_merge($data, [
            'workspace_id' => $workspaceId,
            'currency' => 'IDR',
        ]));

        AuditLog::log('deal.created', Deal::class, $deal->id, ['title' => $deal->title, 'amount' => $deal->amount]);

        return redirect()->back()->with('success', "Deal [{$deal->title}] berhasil dibuat.");
    }

    public function updateDeal(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $deal = Deal::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'stage' => ['required', 'in:baru,kualifikasi,penawaran,negosiasi,menang,kalah'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
            'lost_reason' => ['nullable', 'string'],
        ]);

        $deal->update($data);

        AuditLog::log('deal.updated', Deal::class, $deal->id, ['title' => $deal->title, 'stage' => $deal->stage]);

        return redirect()->back()->with('success', "Deal [{$deal->title}] berhasil diperbarui.");
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

    public function deleteDeal(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $deal = Deal::where('workspace_id', $workspaceId)->findOrFail($id);
        $title = $deal->title;
        $deal->delete();

        AuditLog::log('deal.deleted', Deal::class, $id, ['title' => $title]);

        return redirect()->back()->with('success', "Deal [{$title}] berhasil dihapus.");
    }

    public function quickUpdateContact(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;
        $contact = Contact::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'phone_e164' => ['nullable', 'string', 'max:50'],
        ]);

        if (isset($data['name']) && trim($data['name']) !== '') {
            $contact->name = trim($data['name']);
        }

        if (!empty($data['phone_e164'])) {
            $rawPhone = trim($data['phone_e164']);
            $normalized = Contact::normalizePhone($rawPhone);
            
            $custom = $contact->custom_fields ?? [];
            // Preserve the original WhatsApp Multi-Device LID for message delivery
            if (empty($custom['remote_jid']) && (str_starts_with($contact->phone_e164, '+15') || strlen($contact->phone_e164) >= 15)) {
                $custom['remote_jid'] = ltrim($contact->phone_e164, '+') . '@lid';
            }
            $custom['real_phone'] = $normalized;
            $contact->custom_fields = $custom;
            $contact->phone_e164 = $normalized;
        }

        $contact->save();

        AuditLog::log('contact.quick_updated', Contact::class, $contact->id, [
            'name' => $contact->name,
            'phone' => $contact->phone_e164,
        ]);

        return response()->json([
            'success' => true,
            'contact' => $contact,
        ]);
    }
}

