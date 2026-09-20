<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Template;
use App\Models\Campaign;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\AuditLog;

class CampaignController extends Controller
{
    // ==================== TEMPLATES ====================

    public function templates(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $templates = Template::with('channel')
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        $channels = Channel::where('workspace_id', $workspaceId)->get();

        return Inertia::render('campaigns/Templates', [
            'templates' => $templates,
            'channels' => $channels,
        ]);
    }

    public function storeTemplate(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel_id' => ['nullable', 'exists:channels,id'],
            'category' => ['required', 'in:marketing,utility,authentication'],
            'language' => ['required', 'string', 'max:10'],
            'header_type' => ['nullable', 'in:none,text,image,document'],
            'header_content' => ['nullable', 'string'],
            'body_content' => ['required', 'string'],
            'footer_content' => ['nullable', 'string'],
        ]);

        $template = Template::create(array_merge($data, [
            'workspace_id' => $workspaceId,
            'status' => 'approved',
        ]));

        AuditLog::log('template.created', Template::class, $template->id, ['name' => $template->name]);

        return redirect()->back()->with('success', "Template WhatsApp [{$template->name}] berhasil dibuat.");
    }

    public function updateTemplate(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $template = Template::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel_id' => ['nullable', 'exists:channels,id'],
            'category' => ['required', 'in:marketing,utility,authentication'],
            'language' => ['required', 'string', 'max:10'],
            'header_type' => ['nullable', 'in:none,text,image,document'],
            'header_content' => ['nullable', 'string'],
            'body_content' => ['required', 'string'],
            'footer_content' => ['nullable', 'string'],
        ]);

        $template->update($data);

        AuditLog::log('template.updated', Template::class, $template->id, ['name' => $template->name]);

        return redirect()->back()->with('success', "Template WhatsApp [{$template->name}] berhasil diperbarui.");
    }

    public function deleteTemplate(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $template = Template::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $template->name;
        $template->delete();

        AuditLog::log('template.deleted', Template::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Template [{$name}] berhasil dihapus.");
    }

    // ==================== CAMPAIGNS ====================

    public function campaigns(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $campaigns = Campaign::with(['channel', 'template'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        $channels = Channel::where('workspace_id', $workspaceId)->get();
        $templates = Template::where('workspace_id', $workspaceId)->where('status', 'approved')->get();
        $totalContacts = Contact::where('workspace_id', $workspaceId)->count();

        return Inertia::render('campaigns/Index', [
            'campaigns' => $campaigns,
            'channels' => $channels,
            'templates' => $templates,
            'total_contacts' => $totalContacts,
        ]);
    }

    public function storeCampaign(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel_id' => ['required', 'exists:channels,id'],
            'template_id' => ['required', 'exists:templates,id'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $campaign = Campaign::create([
            'workspace_id' => $workspaceId,
            'channel_id' => $data['channel_id'],
            'template_id' => $data['template_id'],
            'name' => $data['name'],
            'status' => 'scheduled',
            'scheduled_at' => $data['scheduled_at'] ?? now(),
            'total_recipients' => Contact::where('workspace_id', $workspaceId)->count(),
        ]);

        AuditLog::log('campaign.created', Campaign::class, $campaign->id, ['name' => $campaign->name]);

        return redirect()->back()->with('success', "Kampanye [{$campaign->name}] berhasil dijadwalkan.");
    }

    public function updateCampaign(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $campaign = Campaign::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel_id' => ['required', 'exists:channels,id'],
            'template_id' => ['required', 'exists:templates,id'],
            'scheduled_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,scheduled,running,paused,completed,cancelled'],
        ]);

        $campaign->update($data);

        AuditLog::log('campaign.updated', Campaign::class, $campaign->id, ['name' => $campaign->name]);

        return redirect()->back()->with('success', "Kampanye [{$campaign->name}] berhasil diperbarui.");
    }

    public function deleteCampaign(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $campaign = Campaign::where('workspace_id', $workspaceId)->findOrFail($id);
        $name = $campaign->name;
        $campaign->delete();

        AuditLog::log('campaign.deleted', Campaign::class, $id, ['name' => $name]);

        return redirect()->back()->with('success', "Kampanye [{$name}] berhasil dihapus.");
    }
}
