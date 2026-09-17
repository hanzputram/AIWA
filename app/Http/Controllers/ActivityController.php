<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Prospect;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActivityController extends Controller
{
    public function index()
    {
        return view('pages.activities');
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $query = Activity::with('prospect')->orderByDesc('created_at');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('prospect_id')) {
            $query->where('prospect_id', $request->prospect_id);
        }

        $activities = $query->limit(100)->get()->map(fn($a) => [
            'id' => $a->id,
            'prospect_id' => $a->prospect_id,
            'type' => $a->type,
            'note' => $a->note,
            'created_at' => $a->created_at,
            'prospect' => $a->prospect ? ['id' => $a->prospect->id, 'company_name' => $a->prospect->company_name] : null,
        ]);

        return response()->json($activities);
    }

    public function apiStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prospect_id' => 'required|exists:prospects,id',
            'type' => 'required|string|max:20',
            'note' => 'required|string',
        ]);

        $data['created_at'] = now();
        $activity = Activity::create($data);

        // Update lastContactedAt if contact activity
        if (in_array($data['type'], ['call', 'email', 'meeting', 'whatsapp'])) {
            Prospect::where('id', $data['prospect_id'])->update(['last_contacted_at' => now()]);
        }

        return response()->json($activity, 201);
    }

    public function apiDestroy(int $id): JsonResponse
    {
        Activity::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
