<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class MapController extends Controller
{
    public function index()
    {
        return view('pages.map');
    }

    /**
     * Search businesses in a bounding box using Overpass API (OpenStreetMap).
     * Returns businesses with name, address, phone, website, category.
     */
    public function apiBusinesses(Request $request): JsonResponse
    {
        $request->validate([
            'south' => 'required|numeric',
            'west' => 'required|numeric',
            'north' => 'required|numeric',
            'east' => 'required|numeric',
        ]);

        $south = $request->south;
        $west = $request->west;
        $north = $request->north;
        $east = $request->east;

        // Limit bounding box size to prevent huge queries
        $latDiff = abs($north - $south);
        $lngDiff = abs($east - $west);
        if ($latDiff > 0.6 || $lngDiff > 0.6) {
            return response()->json([
                'message' => 'Zoom in closer to search businesses',
                'businesses' => [],
            ]);
        }

        // Cache key based on rounded coordinates
        $cacheKey = 'osm_biz_' . round($south, 3) . '_' . round($west, 3) . '_' . round($north, 3) . '_' . round($east, 3);

        $businesses = Cache::remember($cacheKey, 600, function () use ($south, $west, $north, $east) {
            return $this->queryOverpass($south, $west, $north, $east);
        });

        return response()->json([
            'businesses' => $businesses,
            'count' => count($businesses),
        ]);
    }

    private function queryOverpass(float $south, float $west, float $north, float $east): array
    {
        $bbox = "{$south},{$west},{$north},{$east}";

        // Query for businesses: specifically offices, companies, and PT/Startups
        $query = <<<EOQ
[out:json][timeout:15];
(
  node["office"!="government"]["office"!="diplomatic"]["office"]({$bbox});
  node["building"="commercial"]["office"!="government"]({$bbox});
  node["name"~"^pt\\\\.? |^cv\\\\.? | pt\\\\.? | cv\\\\.? |startup|tech",i]["office"!="government"]({$bbox});
  way["office"!="government"]["office"!="diplomatic"]["office"]({$bbox});
  way["building"="commercial"]["office"!="government"]({$bbox});
  way["name"~"^pt\\\\.? |^cv\\\\.? | pt\\\\.? | cv\\\\.? |startup|tech",i]["office"!="government"]({$bbox});
);
out center tags 200;
EOQ;

        try {
            $response = Http::timeout(15)
                ->withoutVerifying()
                ->withHeaders(['User-Agent' => 'ProspectMapCRM/1.0'])
                ->asForm()
                ->post('https://overpass-api.de/api/interpreter', [
                    'data' => $query,
                ]);
            \Log::info('Overpass response: ' . $response->body());

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();
            $elements = $data['elements'] ?? [];

            $businesses = [];
            foreach ($elements as $el) {
                $tags = $el['tags'] ?? [];
                $name = $tags['name'] ?? $tags['brand'] ?? null;

                // Skip unnamed elements
                if (!$name) continue;

                // Get coordinates (for ways, use center)
                $lat = $el['lat'] ?? $el['center']['lat'] ?? null;
                $lon = $el['lon'] ?? $el['center']['lon'] ?? null;
                if (!$lat || !$lon) continue;
                
                // Anti-Government Name Filter
                $govKeywords = ['dinas', 'kementerian', 'kementrian', 'kelurahan', 'kecamatan', 'kabupaten', 'bupati', 'gubernur', 'walikota', 'puskesmas', 'polsek', 'polres', 'polda', 'mabes', 'koramil', 'kodim', 'instansi', 'badan pusat', 'bappeda', 'ptsp', 'bpjs', 'kanwil', 'kantor pajak', 'kpp', 'rutan', 'lapas', 'pengadilan', 'kejaksaan', 'kpu', 'bawaslu'];
                $isGov = false;
                foreach ($govKeywords as $kw) {
                    if (stripos($name, $kw) !== false) {
                        $isGov = true;
                        break;
                    }
                }
                if ($isGov) continue;

                // Determine category
                $category = $this->categorize($tags);

                // Build address
                $address = $this->buildAddress($tags);

                $businesses[] = [
                    'osm_id' => $el['id'],
                    'name' => $name,
                    'lat' => (float) $lat,
                    'lng' => (float) $lon,
                    'category' => $category,
                    'address' => $address,
                    'phone' => $tags['phone'] ?? $tags['contact:phone'] ?? null,
                    'website' => $tags['website'] ?? $tags['contact:website'] ?? null,
                    'email' => $tags['email'] ?? $tags['contact:email'] ?? null,
                    'opening_hours' => $tags['opening_hours'] ?? null,
                    'brand' => $tags['brand'] ?? null,
                    'province' => $tags['addr:province'] ?? null,
                ];
            }

            return $businesses;
        } catch (\Exception $e) {
            \Log::error('Overpass API error: ' . $e->getMessage());
            return [];
        }
    }

    private function categorize(array $tags): string
    {
        if (isset($tags['office'])) return 'Office: ' . ucfirst($tags['office']);
        if (isset($tags['shop'])) return 'Shop: ' . ucfirst($tags['shop']);
        if (isset($tags['amenity'])) return ucfirst($tags['amenity']);
        if (isset($tags['company'])) return 'Company';
        if (isset($tags['craft'])) return 'Craft: ' . ucfirst($tags['craft']);
        if (isset($tags['building']) && $tags['building'] === 'commercial') return 'Commercial Building';
        return 'Business';
    }

    private function buildAddress(array $tags): string
    {
        $parts = [];
        if (!empty($tags['addr:street'])) {
            $street = $tags['addr:street'];
            if (!empty($tags['addr:housenumber'])) $street .= ' No. ' . $tags['addr:housenumber'];
            $parts[] = $street;
        }
        if (!empty($tags['addr:city'])) $parts[] = $tags['addr:city'];
        if (!empty($tags['addr:postcode'])) $parts[] = $tags['addr:postcode'];

        return implode(', ', $parts) ?: ($tags['addr:full'] ?? '');
    }
}
