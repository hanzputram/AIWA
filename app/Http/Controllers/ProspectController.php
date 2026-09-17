<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\Service;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProspectController extends Controller
{
    public function index()
    {
        return view('pages.prospects');
    }

    // API: List all prospects with optional filters
    public function apiIndex(Request $request): JsonResponse
    {
        $query = Prospect::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }
        if ($request->filled('service')) {
            $query->whereJsonContains('services', $request->service);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qb) use ($q) {
                $qb->where('company_name', 'like', "%{$q}%")
                   ->orWhere('industry', 'like', "%{$q}%")
                   ->orWhere('pic_name', 'like', "%{$q}%")
                   ->orWhere('address', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $prospects = $query->orderByDesc('created_at')->get();

        return response()->json($prospects);
    }

    // API: Get single prospect
    public function apiShow(int $id): JsonResponse
    {
        $prospect = Prospect::with('activities')->findOrFail($id);
        return response()->json($prospect);
    }

    // API: Create prospect
    public function apiStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_role' => 'nullable|string|max:255',
            'pic_phone' => 'nullable|string|max:50',
            'pic_email' => 'nullable|email|max:255',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'services' => 'nullable|array',
            'deal_value' => 'nullable|integer',
            'priority' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'next_follow_up' => 'nullable|date',
        ]);

        $prospect = Prospect::create($data);

        // Auto-log activity
        Activity::create([
            'prospect_id' => $prospect->id,
            'type' => 'status',
            'note' => "Prospect \"{$prospect->company_name}\" added as New Lead",
            'created_at' => now(),
        ]);

        return response()->json($prospect, 201);
    }

    // API: Update prospect
    public function apiUpdate(Request $request, int $id): JsonResponse
    {
        $prospect = Prospect::findOrFail($id);
        $oldStatus = $prospect->status;

        $data = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'industry' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_role' => 'nullable|string|max:255',
            'pic_phone' => 'nullable|string|max:50',
            'pic_email' => 'nullable|email|max:255',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'services' => 'nullable|array',
            'deal_value' => 'nullable|integer',
            'priority' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'next_follow_up' => 'nullable|date',
            'last_contacted_at' => 'nullable|date',
        ]);

        $prospect->update($data);

        // Log status change
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $labels = [
                'lead' => 'New Lead', 'contacted' => 'Contacted', 'proposal' => 'Proposal Sent',
                'negotiation' => 'Negotiation', 'won' => 'Won', 'lost' => 'Lost',
            ];
            Activity::create([
                'prospect_id' => $prospect->id,
                'type' => 'status',
                'note' => 'Status changed from "' . ($labels[$oldStatus] ?? $oldStatus) . '" to "' . ($labels[$data['status']] ?? $data['status']) . '"',
                'created_at' => now(),
            ]);
        }

        return response()->json($prospect->fresh());
    }

    // API: Delete prospect
    public function apiDestroy(int $id): JsonResponse
    {
        Prospect::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // API: Analytics
    public function apiAnalytics(): JsonResponse
    {
        $prospects = Prospect::all();
        $activities = Activity::all();
        $services = Service::all();

        $totalProspects = $prospects->count();
        $totalContacted = $prospects->where('status', '!=', 'lead')->count();

        $byStatus = [];
        foreach (['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'] as $s) {
            $byStatus[$s] = $prospects->where('status', $s)->count();
        }

        $totalPipelineValue = $prospects->where('status', '!=', 'lost')->sum('deal_value');
        $wonValue = $prospects->where('status', 'won')->sum('deal_value');
        $winRate = $totalProspects > 0 ? round(($byStatus['won'] / $totalProspects) * 100, 1) : 0;

        // Revenue by service
        $revenueByService = [];
        $prospectsByService = [];
        foreach ($services as $svc) {
            $revenueByService[$svc->name] = 0;
            $prospectsByService[$svc->name] = 0;
        }
        foreach ($prospects as $p) {
            $svcList = $p->services ?? [];
            foreach ($svcList as $svcName) {
                if (isset($prospectsByService[$svcName])) $prospectsByService[$svcName]++;
                if ($p->status === 'won' && isset($revenueByService[$svcName])) {
                    $revenueByService[$svcName] += $p->deal_value / max(count($svcList), 1);
                }
            }
        }

        // Monthly activities (last 6 months)
        $monthlyActivities = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $key = $date->format('Y-m');
            $monthlyActivities[$key] = $activities->filter(function ($a) use ($key) {
                return $a->created_at?->format('Y-m') === $key;
            })->count();
        }

        // Overdue & today follow-ups
        $now = now();
        $today = $now->toDateString();
        $overdueFollowups = $prospects->filter(fn($p) => $p->next_follow_up && $p->next_follow_up->lt($now->startOfDay()) && !in_array($p->status, ['won', 'lost']))->values();
        $todayFollowups = $prospects->filter(fn($p) => $p->next_follow_up && $p->next_follow_up->toDateString() === $today && !in_array($p->status, ['won', 'lost']))->values();

        // Recent activities
        $recentActivities = Activity::with('prospect')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'note' => $a->note,
                'created_at' => $a->created_at,
                'prospect' => $a->prospect ? ['id' => $a->prospect->id, 'company_name' => $a->prospect->company_name] : null,
            ]);

        // Top prospects
        $topProspects = $prospects->where('status', '!=', 'lost')
            ->where('deal_value', '>', 0)
            ->sortByDesc('deal_value')
            ->take(5)
            ->values();

        return response()->json([
            'totalProspects' => $totalProspects,
            'totalContacted' => $totalContacted,
            'byStatus' => $byStatus,
            'totalPipelineValue' => $totalPipelineValue,
            'wonValue' => $wonValue,
            'winRate' => $winRate,
            'revenueByService' => $revenueByService,
            'prospectsByService' => $prospectsByService,
            'monthlyActivities' => $monthlyActivities,
            'overdueFollowups' => $overdueFollowups,
            'todayFollowups' => $todayFollowups,
            'recentActivities' => $recentActivities,
            'topProspects' => $topProspects,
        ]);
    }
}
