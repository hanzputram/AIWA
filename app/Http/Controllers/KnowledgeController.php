<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Product;
use App\Models\ProductSpec;
use App\Models\PriceBook;
use App\Models\PriceEntry;
use App\Models\CostEntry;
use App\Models\DiscountPolicy;
use App\Models\BrandDiscountMatrix;
use App\Models\BusinessProfile;
use App\Models\CompanyDocument;
use App\Models\KnowledgeImport;
use App\Domain\Knowledge\KnowledgeExtractionService;
use App\Domain\Knowledge\ProductKnowledgeService;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Storage;

class KnowledgeController extends Controller
{
    protected KnowledgeExtractionService $extractionService;
    protected ProductKnowledgeService $productService;

    public function __construct(
        KnowledgeExtractionService $extractionService,
        ProductKnowledgeService $productService
    ) {
        $this->extractionService = $extractionService;
        $this->productService = $productService;
    }

    protected function getWorkspaceId(?Request $request = null): int
    {
        $workspaceId = session('current_workspace_id')
            ?? $request?->user()?->current_workspace_id
            ?? auth()->user()?->current_workspace_id
            ?? auth()->user()?->workspaces()->first()?->id
            ?? \App\Models\Workspace::first()?->id
            ?? 1;

        if (!session()->has('current_workspace_id')) {
            session(['current_workspace_id' => $workspaceId]);
        }

        return (int) $workspaceId;
    }

    public function products(Request $request): Response
    {
        $workspaceId = $this->getWorkspaceId($request);
        $products = Product::with(['specs', 'priceEntries', 'costEntries'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('knowledge/Products', [
            'products' => $products,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'sku' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:20'],
            'moq' => ['nullable', 'integer', 'min:1'],
            'price_list' => ['nullable', 'numeric', 'min:0'],
            'coefficient' => ['nullable', 'numeric', 'min:0'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
            'datasheet_url' => ['nullable', 'string'],
            'datasheet_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
        ]);

        $pl = (float) ($data['price_list'] ?? 0);
        $coeff = (float) ($data['coefficient'] ?? 1.0);
        if ($coeff <= 0) $coeff = 1.0;
        $disc = (float) ($data['discount_pct'] ?? 0.0);
        $floorPrice = round($pl * $coeff * max(0.0, 1.0 - ($disc / 100.0)), 2);

        $datasheetPath = null;
        if ($request->hasFile('datasheet_pdf')) {
            $datasheetPath = $request->file('datasheet_pdf')->store('datasheets', 'public');
        }

        $product = Product::create([
            'workspace_id' => $workspaceId,
            'sku' => strtoupper(trim($data['sku'])),
            'name' => trim($data['name']),
            'brand' => $data['brand'] ?? 'Schneider Electric',
            'category' => $data['category'] ?? 'Komponen Distribusi',
            'unit' => $data['unit'] ?? 'pcs',
            'moq' => $data['moq'] ?? 1,
            'price_list' => $pl,
            'coefficient' => $coeff,
            'discount_pct' => $disc,
            'floor_price' => $floorPrice,
            'description' => $data['description'] ?? null,
            'datasheet_url' => $data['datasheet_url'] ?? null,
            'datasheet_path' => $datasheetPath,
            'is_active' => true,
        ]);

        // Create default price entry & cost entry
        $defaultBook = PriceBook::firstOrCreate(
            ['workspace_id' => $workspaceId, 'name' => 'Price List Resmi 2026'],
            ['price_basis' => 'list_with_coefficient', 'coefficient' => 1.0000, 'currency' => 'IDR']
        );

        PriceEntry::updateOrCreate(
            ['price_book_id' => $defaultBook->id, 'product_id' => $product->id, 'tier' => 'standard'],
            ['sku' => $product->sku, 'base_price' => $pl > 0 ? $pl : $floorPrice, 'min_quantity' => 1, 'currency' => 'IDR']
        );

        CostEntry::updateOrCreate(
            ['workspace_id' => $workspaceId, 'product_id' => $product->id, 'version' => 'v1.0'],
            ['sku' => $product->sku, 'hpp_cost' => $floorPrice, 'landed_cost' => 0, 'margin_floor_pct' => 15.00]
        );

        AuditLog::log('product.created', Product::class, $product->id, ['sku' => $product->sku, 'floor_price' => $floorPrice]);

        return redirect()->back()->with('success', "Produk [{$product->sku}] berhasil ditambahkan dengan Base Price Rp " . number_format($floorPrice, 0, ',', '.'));
    }

    public function updateProduct(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $product = Product::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'sku' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:20'],
            'moq' => ['nullable', 'integer', 'min:1'],
            'price_list' => ['nullable', 'numeric', 'min:0'],
            'coefficient' => ['nullable', 'numeric', 'min:0'],
            'discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
            'datasheet_url' => ['nullable', 'string'],
            'datasheet_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $pl = (float) ($data['price_list'] ?? $product->price_list ?? 0);
        $coeff = (float) ($data['coefficient'] ?? $product->coefficient ?? 1.0);
        if ($coeff <= 0) $coeff = 1.0;
        $disc = (float) ($data['discount_pct'] ?? $product->discount_pct ?? 0.0);
        $floorPrice = round($pl * $coeff * max(0.0, 1.0 - ($disc / 100.0)), 2);

        if ($request->hasFile('datasheet_pdf')) {
            $product->datasheet_path = $request->file('datasheet_pdf')->store('datasheets', 'public');
        }

        $product->sku = strtoupper(trim($data['sku']));
        $product->name = trim($data['name']);
        $product->brand = $data['brand'] ?? $product->brand;
        $product->category = $data['category'] ?? $product->category;
        $product->unit = $data['unit'] ?? $product->unit;
        $product->moq = $data['moq'] ?? $product->moq;
        $product->price_list = $pl;
        $product->coefficient = $coeff;
        $product->discount_pct = $disc;
        $product->floor_price = $floorPrice;
        $product->description = $data['description'] ?? $product->description;
        $product->datasheet_url = $data['datasheet_url'] ?? $product->datasheet_url;
        if (isset($data['is_active'])) $product->is_active = (bool) $data['is_active'];
        $product->save();

        // Sync price entry & cost entry
        PriceEntry::where('product_id', $product->id)->update([
            'sku' => $product->sku,
            'base_price' => $pl > 0 ? $pl : $floorPrice,
        ]);
        CostEntry::where('product_id', $product->id)->update([
            'sku' => $product->sku,
            'hpp_cost' => $floorPrice,
        ]);

        AuditLog::log('product.updated', Product::class, $product->id, ['sku' => $product->sku, 'floor_price' => $floorPrice]);

        return redirect()->back()->with('success', "Produk [{$product->sku}] berhasil diperbarui.");
    }

    public function deleteProduct(Request $request, int $id)
    {
        $workspaceId = $this->getWorkspaceId($request);
        $product = Product::where('workspace_id', $workspaceId)->find($id)
            ?? Product::find($id);

        if (!$product) {
            return redirect()->back()->with('info', "Produk sudah tidak ada atau telah dihapus sebelumnya.");
        }

        $sku = $product->sku;
        $product->delete();

        AuditLog::log('product.deleted', Product::class, $id, ['sku' => $sku]);

        return redirect()->back()->with('success', "Produk [{$sku}] berhasil dihapus.");
    }

    public function importProductsExcel(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $request->validate([
            'file' => ['required', 'file', 'max:20480'], // max 20MB
        ]);

        try {
            $result = $this->productService->importFromCsvOrExcel($request->file('file'), $workspaceId);
            return redirect()->back()->with('success', "Berhasil mengimpor {$result['total']} produk ({$result['created']} baru, {$result['updated']} diperbarui).");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Gagal mengimpor file: " . $e->getMessage());
        }
    }

    public function downloadProductTemplate()
    {
        $xlsx = $this->productService->generateProductXlsxTemplate();
        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template_katalog_produk_aiwa.xlsx"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function learnProductSpecs(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $product = Product::where('workspace_id', $workspaceId)->findOrFail($id);

        try {
            $result = $this->productService->learnProductSpecs($product);
            return response()->json([
                'success' => true,
                'message' => "AI berhasil mempelajari spesifikasi untuk [{$product->sku}].",
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal mempelajari spesifikasi: " . $e->getMessage(),
            ], 500);
        }
    }

    public function prices(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');
        $priceBooks = PriceBook::with('entries.product')
            ->where('workspace_id', $workspaceId)
            ->get();
        $products = Product::where('workspace_id', $workspaceId)->select('id', 'sku', 'name', 'price_list')->get();

        return Inertia::render('knowledge/Prices', [
            'price_books' => $priceBooks,
            'products' => $products,
        ]);
    }

    public function storePriceBook(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:20'],
            'price_basis' => ['required', 'in:list_with_coefficient,net'],
            'coefficient' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
        ]);

        $book = PriceBook::create([
            'workspace_id' => $workspaceId,
            'name' => $data['name'],
            'version' => $data['version'] ?? 'v1.0',
            'price_basis' => $data['price_basis'],
            'coefficient' => $data['coefficient'] ?? 1.0,
            'currency' => $data['currency'] ?? 'IDR',
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Price Book [{$book->name}] berhasil dibuat.");
    }

    public function updatePriceBook(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $book = PriceBook::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:20'],
            'price_basis' => ['required', 'in:list_with_coefficient,net'],
            'coefficient' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $book->update($data);

        return redirect()->back()->with('success', "Price Book [{$book->name}] berhasil diperbarui.");
    }

    public function deletePriceBook(Request $request, int $id)
    {
        $workspaceId = $this->getWorkspaceId($request);
        $book = PriceBook::where('workspace_id', $workspaceId)->find($id)
            ?? PriceBook::find($id);

        if (!$book) {
            return redirect()->back()->with('info', "Price Book sudah tidak ada atau telah dihapus sebelumnya.");
        }

        $name = $book->name;
        $book->delete();

        return redirect()->back()->with('success', "Price Book [{$name}] berhasil dihapus.");
    }

    public function storePriceEntry(Request $request)
    {
        $data = $request->validate([
            'price_book_id' => ['required', 'exists:price_books,id'],
            'product_id' => ['required', 'exists:products,id'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'tier' => ['required', 'string'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $product = Product::findOrFail($data['product_id']);

        PriceEntry::updateOrCreate(
            [
                'price_book_id' => $data['price_book_id'],
                'product_id' => $product->id,
                'tier' => $data['tier'],
            ],
            [
                'sku' => $product->sku,
                'base_price' => $data['base_price'],
                'min_quantity' => $data['min_quantity'] ?? 1,
            ]
        );

        return redirect()->back()->with('success', "Entri harga untuk SKU [{$product->sku}] berhasil disimpan.");
    }

    public function deletePriceEntry(Request $request, int $id)
    {
        $entry = PriceEntry::find($id);

        if (!$entry) {
            return redirect()->back()->with('info', "Entri harga sudah tidak ada atau telah dihapus sebelumnya.");
        }

        $sku = $entry->sku;
        $entry->delete();

        return redirect()->back()->with('success', "Entri harga [{$sku}] berhasil dihapus.");
    }

    public function discounts(Request $request): Response
    {
        $workspaceId = $this->getWorkspaceId($request);
        $policies = DiscountPolicy::where('workspace_id', $workspaceId)->get();

        $matrices = BrandDiscountMatrix::where('workspace_id', $workspaceId)
            ->orderBy('brand')
            ->orderBy('sort_order')
            ->orderBy('category')
            ->get();

        $brands = BrandDiscountMatrix::where('workspace_id', $workspaceId)
            ->distinct()
            ->pluck('brand')
            ->values();

        return Inertia::render('knowledge/Discounts', [
            'discount_policies' => $policies,
            'discount_matrices' => $matrices,
            'available_brands' => $brands,
        ]);
    }

    public function storeDiscountMatrix(Request $request)
    {
        $workspaceId = $this->getWorkspaceId($request);

        $data = $request->validate([
            'brand' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:100'],
            'coefficient' => ['required', 'numeric', 'min:0.1', 'max:10'],
            'series_type' => ['required', 'string', 'max:255'],
            'standard_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'max_1_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'max_2_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'khusus_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $matrix = BrandDiscountMatrix::create(array_merge($data, [
            'workspace_id' => $workspaceId,
            'is_active' => true,
        ]));

        return redirect()->back()->with('success', "Aturan diskon matrix [{$matrix->brand} - {$matrix->category} ({$matrix->series_type})] berhasil ditambahkan.");
    }

    public function updateDiscountMatrix(Request $request, int $id)
    {
        $workspaceId = $this->getWorkspaceId($request);
        $matrix = BrandDiscountMatrix::where('workspace_id', $workspaceId)->find($id)
            ?? BrandDiscountMatrix::find($id);

        if (!$matrix) {
            return redirect()->back()->with('error', "Aturan diskon matrix tidak ditemukan atau sudah dihapus.");
        }

        $data = $request->validate([
            'brand' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:100'],
            'coefficient' => ['required', 'numeric', 'min:0.1', 'max:10'],
            'series_type' => ['required', 'string', 'max:255'],
            'standard_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'max_1_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'max_2_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'khusus_discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $matrix->update($data);

        return redirect()->back()->with('success', "Aturan diskon matrix [{$matrix->brand} - {$matrix->category} ({$matrix->series_type})] berhasil diperbarui.");
    }

    public function deleteDiscountMatrix(Request $request, $id = null)
    {
        $matrixId = (int) ($id ?? $request->route('id') ?? 0);
        $workspaceId = $this->getWorkspaceId($request);
        $matrix = BrandDiscountMatrix::where('workspace_id', $workspaceId)->find($matrixId)
            ?? BrandDiscountMatrix::find($matrixId);

        if (!$matrix) {
            return redirect()->back()->with('info', "Aturan diskon matrix sudah tidak ada atau telah dihapus sebelumnya.");
        }

        $label = "{$matrix->brand} - {$matrix->category} ({$matrix->series_type})";
        $matrix->delete();

        return redirect()->back()->with('success', "Aturan diskon matrix [{$label}] berhasil dihapus.");
    }

    public function importDiscountMatrix(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        try {
            $result = $this->productService->importDiscountMatrixFromExcel($request->file('file'), $workspaceId);
            return redirect()->back()->with('success', "Berhasil mengimpor {$result['total']} aturan diskon matrix ({$result['created']} baru, {$result['updated']} diperbarui).");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Gagal mengimpor file matrix: " . $e->getMessage());
        }
    }

    public function downloadDiscountMatrixTemplate()
    {
        $xlsx = $this->productService->generateDiscountMatrixXlsxTemplate();
        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="template_matriks_diskon_agustus_2026.xlsx"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function storeDiscountPolicy(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:20'],
            'max_autonomous_discount_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'discount_step_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'max_discount_rounds' => ['required', 'integer', 'min:1', 'max:10'],
            'stacking_rule' => ['required', 'in:sequential,additive'],
            'minimum_gross_margin_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'requires_manager_approval_above_pct' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $policy = DiscountPolicy::create(array_merge($data, [
            'workspace_id' => $workspaceId,
            'is_active' => true,
        ]));

        return redirect()->back()->with('success', "Kebijakan Diskon [{$policy->name}] berhasil dibuat.");
    }

    public function updateDiscountPolicy(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id');
        $policy = DiscountPolicy::where('workspace_id', $workspaceId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:20'],
            'max_autonomous_discount_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'discount_step_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'max_discount_rounds' => ['required', 'integer', 'min:1', 'max:10'],
            'stacking_rule' => ['required', 'in:sequential,additive'],
            'minimum_gross_margin_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'requires_manager_approval_above_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $policy->update($data);

        return redirect()->back()->with('success', "Kebijakan Diskon [{$policy->name}] berhasil diperbarui.");
    }

    public function deleteDiscountPolicy(Request $request, int $id)
    {
        $workspaceId = $this->getWorkspaceId($request);
        $policy = DiscountPolicy::where('workspace_id', $workspaceId)->find($id)
            ?? DiscountPolicy::find($id);

        if (!$policy) {
            return redirect()->back()->with('info', "Kebijakan Diskon sudah tidak ada atau telah dihapus sebelumnya.");
        }

        $name = $policy->name;
        $policy->delete();

        return redirect()->back()->with('success', "Kebijakan Diskon [{$name}] berhasil dihapus.");
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
