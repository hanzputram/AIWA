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
    public function templates(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $templates = Template::with('channel')
            ->where('workspace_id', $workspaceId)
            ->get();

        $channels = Channel::where('workspace_id', $workspaceId)->get();

        return Inertia::render('campaigns/Templates', [
            'templates' => $templates,
            'channels' => $channels,
        ]);
    }

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
            'name' => ['required', 'string'],
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

        return redirect()->back()->with('success', "Campaign [{$campaign->name}] berhasil dijadwalkan.");
    }
}
