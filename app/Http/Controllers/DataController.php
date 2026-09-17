<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use App\Models\Service;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DataController extends Controller
{
    public function index()
    {
        return view('pages.data');
    }

    public function exportJson(): JsonResponse
    {
        return response()->json([
            'prospects' => Prospect::all(),
            'services' => Service::all(),
            'activities' => Activity::all(),
            'exportedAt' => now()->toIso8601String(),
        ]);
    }

    public function exportCsv()
    {
        $prospects = Prospect::all();

        $headers = ['ID', 'Company', 'Industry', 'Status', 'Priority', 'Deal Value',
                     'Services', 'Address', 'Phone', 'Email', 'Website',
                     'PIC Name', 'PIC Role', 'PIC Phone', 'PIC Email',
                     'Source', 'Tags', 'Next Follow-Up', 'Created At'];

        $callback = function () use ($prospects, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($prospects as $p) {
                fputcsv($file, [
                    $p->id, $p->company_name, $p->industry, $p->status, $p->priority,
                    $p->deal_value, implode(', ', $p->services ?? []),
                    $p->address, $p->phone, $p->email, $p->website,
                    $p->pic_name, $p->pic_role, $p->pic_phone, $p->pic_email,
                    $p->source, implode(', ', $p->tags ?? []),
                    $p->next_follow_up, $p->created_at,
                ]);
            }
            fclose($file);
        };

        $filename = 'prospects-' . now()->format('Y-m-d') . '.csv';

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function importJson(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:json,txt']);

        $content = json_decode(file_get_contents($request->file('file')->getRealPath()), true);
        if (!$content) {
            return response()->json(['message' => 'Invalid JSON file'], 422);
        }

        $imported = ['prospects' => 0, 'services' => 0, 'activities' => 0];

        if (!empty($content['services'])) {
            foreach ($content['services'] as $svc) {
                unset($svc['id']);
                Service::create($svc);
                $imported['services']++;
            }
        }

        if (!empty($content['prospects'])) {
            foreach ($content['prospects'] as $p) {
                $oldId = $p['id'] ?? null;
                unset($p['id']);
                $prospect = Prospect::create($p);

                // Import related activities
                if ($oldId && !empty($content['activities'])) {
                    foreach ($content['activities'] as $a) {
                        if (($a['prospect_id'] ?? null) == $oldId) {
                            Activity::create([
                                'prospect_id' => $prospect->id,
                                'type' => $a['type'] ?? 'note',
                                'note' => $a['note'] ?? '',
                                'created_at' => $a['created_at'] ?? now(),
                            ]);
                            $imported['activities']++;
                        }
                    }
                }
                $imported['prospects']++;
            }
        }

        return response()->json([
            'message' => 'Import successful',
            'imported' => $imported,
        ]);
    }

    public function clearAll(): JsonResponse
    {
        Activity::truncate();
        Prospect::truncate();
        Service::truncate();

        return response()->json(['message' => 'All data cleared']);
    }
}
