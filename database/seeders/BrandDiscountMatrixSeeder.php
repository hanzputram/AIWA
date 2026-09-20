<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BrandDiscountMatrix;
use App\Models\Workspace;

class BrandDiscountMatrixSeeder extends Seeder
{
    public function run(): void
    {
        $workspaces = Workspace::all();
        if ($workspaces->isEmpty()) {
            return;
        }

        $globalNotes = '(EXC PPN) (Jika Barang Ready Add 10%) (Contactor Add 20%)';

        $rules = [
            // MCB (Koef X 1.13)
            [
                'brand' => 'Schneider',
                'category' => 'MCB',
                'coefficient' => 1.1300,
                'series_type' => 'Domae',
                'standard_discount_pct' => 25.00,
                'max_1_discount_pct' => 30.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 34.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'MCB',
                'coefficient' => 1.1300,
                'series_type' => 'IC',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => 50.00,
                'khusus_discount_pct' => 52.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'MCB',
                'coefficient' => 1.1300,
                'series_type' => 'IK',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => 50.00,
                'khusus_discount_pct' => 52.00,
                'notes' => $globalNotes,
            ],

            // MCCB (Koef X 1.2)
            [
                'brand' => 'Schneider',
                'category' => 'MCCB',
                'coefficient' => 1.0800,
                'series_type' => 'NSX TIPE LAMA LV (PAKAI PL 2022 KOEF X1.08)',
                'standard_discount_pct' => null,
                'max_1_discount_pct' => null,
                'max_2_discount_pct' => 55.00,
                'khusus_discount_pct' => 57.00,
                'notes' => 'PAKAI PL 2022 KOEF X1.08',
            ],
            [
                'brand' => 'Schneider',
                'category' => 'MCCB',
                'coefficient' => 1.2000,
                'series_type' => 'NSX BARU C1F',
                'standard_discount_pct' => 45.00,
                'max_1_discount_pct' => 48.00,
                'max_2_discount_pct' => 52.00,
                'khusus_discount_pct' => 55.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'MCCB',
                'coefficient' => 1.2000,
                'series_type' => 'CVS',
                'standard_discount_pct' => 45.00,
                'max_1_discount_pct' => 48.00,
                'max_2_discount_pct' => 52.00,
                'khusus_discount_pct' => 55.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'MCCB',
                'coefficient' => 1.2000,
                'series_type' => 'EZC',
                'standard_discount_pct' => 45.00,
                'max_1_discount_pct' => 48.00,
                'max_2_discount_pct' => 52.00,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],

            // ACB (Koef X 1.2)
            [
                'brand' => 'Schneider',
                'category' => 'ACB',
                'coefficient' => 1.2000,
                'series_type' => 'ACB (Masterpact MTZ / NW / NT)',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => 50.00,
                'khusus_discount_pct' => 52.00,
                'notes' => $globalNotes,
            ],

            // Contactor (Koef X 1.2)
            [
                'brand' => 'Schneider',
                'category' => 'Contactor',
                'coefficient' => 1.2000,
                'series_type' => 'LC1D, LRD, LC1E, LRE, LADN, LADT',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 46.00,
                'notes' => 'Jika ready add 20%',
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Contactor',
                'coefficient' => 1.2000,
                'series_type' => 'LC1F, LX9, GV',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 46.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Contactor',
                'coefficient' => 1.2000,
                'series_type' => 'LE1M35',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 46.00,
                'notes' => $globalNotes,
            ],

            // Capacitor (Koef X 1.1)
            [
                'brand' => 'Schneider',
                'category' => 'Capacitor',
                'coefficient' => 1.1000,
                'series_type' => 'BLRCH, BLRCS, LVR',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 45.00,
                'max_2_discount_pct' => 50.00,
                'khusus_discount_pct' => 55.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Capacitor',
                'coefficient' => 1.2000,
                'series_type' => 'LC1DWK (Koef X 1.2)',
                'standard_discount_pct' => 40.00,
                'max_1_discount_pct' => 46.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 47.00,
                'notes' => 'Koefisien khusus X 1.2',
            ],

            // Plug + Socket (Koef X 1.1)
            [
                'brand' => 'Schneider',
                'category' => 'Plug + Socket',
                'coefficient' => 1.1000,
                'series_type' => 'Semua Bab 10',
                'standard_discount_pct' => 30.00,
                'max_1_discount_pct' => 35.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],

            // Meter + Management (Koef X 1.1)
            [
                'brand' => 'Schneider',
                'category' => 'Meter + Management',
                'coefficient' => 1.1000,
                'series_type' => 'CT',
                'standard_discount_pct' => 30.00,
                'max_1_discount_pct' => 35.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Meter + Management',
                'coefficient' => 1.1000,
                'series_type' => 'KWH Meter, PM 2000',
                'standard_discount_pct' => 38.00,
                'max_1_discount_pct' => 43.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Meter + Management',
                'coefficient' => 1.1000,
                'series_type' => 'PM 5000 & 8000',
                'standard_discount_pct' => 35.00,
                'max_1_discount_pct' => 38.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],

            // Panel Industri & Kontrol Temperature (Koef X 1.1)
            [
                'brand' => 'Schneider',
                'category' => 'Panel Industri & Kontrol Temperature',
                'coefficient' => 1.1000,
                'series_type' => 'Box Panel, NSYCVF, NSYCR, NSYCCO',
                'standard_discount_pct' => 30.00,
                'max_1_discount_pct' => null,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Panel Industri & Kontrol Temperature',
                'coefficient' => 1.1000,
                'series_type' => 'NSYTR (Terminal Block)',
                'standard_discount_pct' => 35.00,
                'max_1_discount_pct' => 40.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => 45.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Panel Industri & Kontrol Temperature',
                'coefficient' => 1.1000,
                'series_type' => 'DZ5',
                'standard_discount_pct' => 30.00,
                'max_1_discount_pct' => 33.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],

            // Pilot Lamp & Push Button (Koef X 1.1)
            [
                'brand' => 'Schneider',
                'category' => 'Pilot Lamp & Push Button',
                'coefficient' => 1.1000,
                'series_type' => 'XB4, XB5, XB7',
                'standard_discount_pct' => 35.00,
                'max_1_discount_pct' => 40.00,
                'max_2_discount_pct' => 45.00,
                'khusus_discount_pct' => 46.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Pilot Lamp & Push Button',
                'coefficient' => 1.1000,
                'series_type' => 'XA2, XAP',
                'standard_discount_pct' => 35.00,
                'max_1_discount_pct' => 40.00,
                'max_2_discount_pct' => 45.00,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Pilot Lamp & Push Button',
                'coefficient' => 1.1000,
                'series_type' => 'XAL',
                'standard_discount_pct' => 35.00,
                'max_1_discount_pct' => 40.00,
                'max_2_discount_pct' => 45.00,
                'khusus_discount_pct' => 46.00,
                'notes' => $globalNotes,
            ],
            [
                'brand' => 'Schneider',
                'category' => 'Pilot Lamp & Push Button',
                'coefficient' => 1.1000,
                'series_type' => 'Tower Light, XACA',
                'standard_discount_pct' => 30.00,
                'max_1_discount_pct' => 33.00,
                'max_2_discount_pct' => null,
                'khusus_discount_pct' => null,
                'notes' => $globalNotes,
            ],
        ];

        foreach ($workspaces as $ws) {
            foreach ($rules as $idx => $r) {
                BrandDiscountMatrix::updateOrCreate(
                    [
                        'workspace_id' => $ws->id,
                        'brand' => $r['brand'],
                        'category' => $r['category'],
                        'series_type' => $r['series_type'],
                    ],
                    array_merge($r, [
                        'sort_order' => $idx + 1,
                        'is_active' => true,
                    ])
                );
            }
        }
    }
}
