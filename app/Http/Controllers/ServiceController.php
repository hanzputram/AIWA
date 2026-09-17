<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    public function index()
    {
        return view('pages.services');
    }

    public function apiIndex(): JsonResponse
    {
        return response()->json(Service::all());
    }

    public function apiStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:10',
            'description' => 'nullable|string',
            'price_range' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:10',
        ]);
        return response()->json(Service::create($data), 201);
    }

    public function apiUpdate(Request $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->update($request->only(['name', 'icon', 'description', 'price_range', 'color']));
        return response()->json($service);
    }

    public function apiDestroy(int $id): JsonResponse
    {
        Service::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
