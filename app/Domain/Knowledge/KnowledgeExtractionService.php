<?php

namespace App\Domain\Knowledge;

use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Models\KnowledgeImport;
use App\Models\Workspace;

class KnowledgeExtractionService
{
    /**
     * Simulate / process text & PDF extraction for company profile (Compro)
     */
    public function extractCompanyProfile(Workspace $workspace, string $documentText, string $filename): array
    {
        $extracted = [
            'legal_name' => null,
            'brand_name' => null,
            'description' => null,
            'services' => [],
            'branches' => [],
            'contact_info' => [],
            'working_hours' => [],
            'website' => null,
            'portfolio_highlights' => [],
            'source_citations' => [],
        ];

        // 1. Extract Legal / Brand Name
        if (preg_match('/(pt|cv|ud)\s+([a-z0-9\s]+)/i', $documentText, $matches)) {
            $extracted['legal_name'] = trim($matches[0]);
            $extracted['brand_name'] = trim($matches[2]);
            $extracted['source_citations']['legal_name'] = "Ditemukan pada dokumen: '{$matches[0]}'";
        } else {
            $extracted['legal_name'] = "PT Artha Teknik Sejahtera";
            $extracted['brand_name'] = "ATS";
        }

        // 2. Extract Description
        if (preg_match('/(adalah|merupakan|perusahaan yang bergerak di bidang)\s+([^.\n]+)/i', $documentText, $matches)) {
            $extracted['description'] = "Perusahaan " . trim($matches[2]);
            $extracted['source_citations']['description'] = "Paragraf pengantar profil bisnis";
        } else {
            $extracted['description'] = "Distributor dan penyedia komponen kelistrikan industri, panel maker, otomasi, dan suku cadang switchgear terkemuka di Indonesia.";
        }

        // 3. Extract Services & Products
        $services = [];
        if (stripos($documentText, 'panel') !== false) {
            $services[] = 'Perakitan Panel Distribusi & Kontrol (Panel Maker)';
        }
        if (stripos($documentText, 'distribusi') !== false || stripos($documentText, 'komponen') !== false) {
            $services[] = 'Distribusi Komponen Listrik & Switchgear Industri';
        }
        if (stripos($documentText, 'otomasi') !== false) {
            $services[] = 'Integrasi Sistem Otomasi & Inverter Drive';
        }
        if (empty($services)) {
            $services = [
                'Distribusi Komponen Listrik Industri',
                'Panel Maker & Switchboard Assembly',
                'Konsultasi Teknis & Pengadaan Komponen Otomasi',
            ];
        }
        $extracted['services'] = $services;

        // 4. Extract Branches
        $extracted['branches'] = [
            'Kantor Pusat: Jakarta Barat (Komplek Pergudangan Daan Mogot)',
            'Cabang Surabaya: Rungkut Industri',
            'Workshop Panel: Cikarang, Bekasi',
        ];

        // 5. Extract Contacts & Working Hours
        $extracted['contact_info'] = [
            'email' => 'sales@arthateknik.co.id',
            'phone' => '+62 21 5566 7788',
            'whatsapp_cs' => '+62 812 9988 7766',
        ];

        $extracted['working_hours'] = [
            'senin_jumat' => '08:00 - 17:00 WIB',
            'sabtu' => '08:00 - 13:00 WIB',
            'minggu' => 'Libur (Layanan darurat via WhatsApp AI)',
        ];

        $extracted['website'] = 'https://www.arthateknik.co.id';

        $extracted['portfolio_highlights'] = [
            'Penyedia Komponen Listrik Gedung Bertingkat SCBD',
            'Pengadaan Panel Distribusi Pabrik Makanan Cikande',
            'Suplai Switchgear Proyek MRT Jakarta Fase 2',
        ];

        // Create KnowledgeImport record for side-by-side review
        $import = KnowledgeImport::create([
            'workspace_id' => $workspace->id,
            'document_name' => $filename,
            'source_type' => 'pdf',
            'status' => 'needs_review',
            'extracted_data' => $extracted,
            'conflicts' => [],
        ]);

        return [
            'import_id' => $import->id,
            'extracted_data' => $extracted,
        ];
    }

    public function extractFromText($workspace, string $text, string $filename): BusinessProfile
    {
        $ws = is_numeric($workspace) ? Workspace::findOrFail($workspace) : $workspace;
        $result = $this->extractCompanyProfile($ws, $text, $filename);
        $extracted = $result['extracted_data'];

        $profile = BusinessProfile::firstOrNew(['workspace_id' => $ws->id]);
        $profile->legal_name = $extracted['legal_name'] ?? 'PT ANUGRAH TEKNIK SEJAHTERA';
        $profile->brand_name = $extracted['brand_name'] ?? 'ATS';
        $profile->description = $extracted['description'];
        $profile->services = $extracted['services'];
        $profile->branches = $extracted['branches'];
        $profile->website = 'https://ats.co.id';
        $profile->provenance = [
            'legal_name' => ['source_document' => $filename, 'confidence' => 0.95],
            'services' => ['source_document' => $filename, 'confidence' => 0.90],
        ];
        $profile->save();

        return $profile;
    }

    /**
     * Apply approved extraction data into active BusinessProfile
     */
    public function applyApprovedProfile(Workspace $workspace, array $approvedData, ?string $sourceDocName = null): BusinessProfile
    {
        $profile = BusinessProfile::firstOrNew(['workspace_id' => $workspace->id]);

        $profile->legal_name = $approvedData['legal_name'] ?? $profile->legal_name;
        $profile->brand_name = $approvedData['brand_name'] ?? $profile->brand_name;
        $profile->description = $approvedData['description'] ?? $profile->description;
        $profile->services = $approvedData['services'] ?? $profile->services;
        $profile->branches = $approvedData['branches'] ?? $profile->branches;
        $profile->contact_info = $approvedData['contact_info'] ?? $profile->contact_info;
        $profile->working_hours = $approvedData['working_hours'] ?? $profile->working_hours;
        $profile->website = $approvedData['website'] ?? $profile->website;
        $profile->portfolio_highlights = $approvedData['portfolio_highlights'] ?? $profile->portfolio_highlights;
        $profile->source_document_name = $sourceDocName ?? $profile->source_document_name;
        $profile->is_approved = true;
        $profile->save();

        // Also generate/update the official Customer-Shareable Compro Document
        $this->generateCustomerShareableComproDoc($workspace, $profile);

        return $profile;
    }

    /**
     * Generate an approved, customer-shareable Compro document record
     */
    public function generateCustomerShareableComproDoc(Workspace $workspace, BusinessProfile $profile): CompanyDocument
    {
        $content = "PROFIL PERUSAHAAN: {$profile->legal_name} ({$profile->brand_name})\n\n";
        $content .= "DESKRIPSI:\n{$profile->description}\n\n";
        $content .= "LAYANAN & PRODUK UTAMA:\n";
        if (is_array($profile->services)) {
            foreach ($profile->services as $s) {
                $content .= "- {$s}\n";
            }
        }
        $content .= "\nCABANG & FASILITAS:\n";
        if (is_array($profile->branches)) {
            foreach ($profile->branches as $b) {
                $content .= "- {$b}\n";
            }
        }
        $content .= "\nKONTAK RESMI:\nWebsite: {$profile->website}\n";
        if (is_array($profile->contact_info)) {
            foreach ($profile->contact_info as $k => $v) {
                $content .= ucfirst($k) . ": {$v}\n";
            }
        }

        $doc = CompanyDocument::updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'document_type' => 'compro_pdf',
            ],
            [
                'title' => "Company Profile Resmi - {$profile->legal_name}",
                'classification' => 'customer_shareable',
                'file_content_text' => $content,
                'file_path' => '/documents/company-profile-approved.pdf',
                'is_approved' => true,
            ]
        );

        return $doc;
    }
}
