<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Product;
use App\Models\PriceBook;
use App\Models\DiscountPolicy;
use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Models\KnowledgeImport;
use App\Domain\Knowledge\KnowledgeExtractionService;
use App\Models\AuditLog;

class KnowledgeController extends Controller
{
    protected KnowledgeExtractionService $extractionService;

    public function __construct(KnowledgeExtractionService $extractionService)
    {
        $this->extractionService = $extractionService;
    }

    public function products(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $products = Product::with(['specs', 'priceEntries', 'costEntries'])
            ->where('workspace_id', $workspaceId)
            ->get();

        return Inertia::render('knowledge/Products', [
            'products' => $products,
        ]);
    }

    public function prices(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $priceBooks = PriceBook::with('entries.product')
            ->where('workspace_id', $workspaceId)
            ->get();

        return Inertia::render('knowledge/Prices', [
            'price_books' => $priceBooks,
        ]);
    }

    public function discounts(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $policies = DiscountPolicy::where('workspace_id', $workspaceId)->get();

        return Inertia::render('knowledge/Discounts', [
            'discount_policies' => $policies,
        ]);
    }

    public function company(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        $profile = BusinessProfile::firstOrCreate(
            ['workspace_id' => $workspaceId],
            [
                'legal_name' => 'PT Artha Teknik Sejahtera',
                'brand_name' => 'ATS',
                'description' => 'Penyedia komponen listrik dan panel maker industri terpercaya.',
                'website' => 'https://www.arthateknik.co.id',
            ]
        );

        $documents = CompanyDocument::where('workspace_id', $workspaceId)->get();
        $recentImports = KnowledgeImport::where('workspace_id', $workspaceId)->latest()->take(5)->get();

        return Inertia::render('knowledge/Company', [
            'profile' => $profile,
            'documents' => $documents,
            'recent_imports' => $recentImports,
        ]);
    }

    public function uploadCompro(Request $request)
    {
        $workspaceId = session('current_workspace_id');
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        $data = $request->validate([
            'document_text' => ['required', 'string'],
            'filename' => ['nullable', 'string'],
        ]);

        $filename = $data['filename'] ?? 'Company-Profile-Upload.pdf';
        $result = $this->extractionService->extractCompanyProfile($workspace, $data['document_text'], $filename);

        return response()->json([
            'success' => true,
            'import_id' => $result['import_id'],
            'extracted_data' => $result['extracted_data'],
            'message' => 'Ekstraksi dokumen compro selesai. Silakan periksa hasil preview berdampingan sebelum publish.',
        ]);
    }

    public function approveProfile(Request $request)
    {
        $workspaceId = session('current_workspace_id');
        $workspace = \App\Models\Workspace::findOrFail($workspaceId);

        $data = $request->validate([
            'legal_name' => ['required', 'string'],
            'brand_name' => ['required', 'string'],
            'description' => ['required', 'string'],
            'services' => ['nullable', 'array'],
            'branches' => ['nullable', 'array'],
            'contact_info' => ['nullable', 'array'],
            'working_hours' => ['nullable', 'array'],
            'website' => ['nullable', 'string'],
            'portfolio_highlights' => ['nullable', 'array'],
        ]);

        $profile = $this->extractionService->applyApprovedProfile($workspace, $data);

        AuditLog::log('knowledge.profile_approved', BusinessProfile::class, $profile->id, [
            'brand_name' => $profile->brand_name,
        ]);

        return redirect()->back()->with('success', 'Profil bisnis berhasil diapprove dan dokumen compro resmi telah diperbarui.');
    }
}
