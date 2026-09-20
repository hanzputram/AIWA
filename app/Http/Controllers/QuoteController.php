<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Quote;
use App\Models\QuoteRevision;
use App\Models\QuoteLine;
use App\Models\NegotiationSession;
use App\Models\Product;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Channel;
use App\Domain\Pricing\PricingEngineService;
use App\Models\AuditLog;
use Illuminate\Support\Str;

class QuoteController extends Controller
{
    protected PricingEngineService $pricingEngine;

    public function __construct(PricingEngineService $pricingEngine)
    {
        $this->pricingEngine = $pricingEngine;
    }

    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $quotes = Quote::with(['contact', 'conversation.channel', 'currentRevision.lines'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        $contacts = Contact::where('workspace_id', $workspaceId)->get();
        $products = Product::where('workspace_id', $workspaceId)->get();

        return Inertia::render('quotes/Index', [
            'quotes' => $quotes,
            'contacts' => $contacts,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = session('current_workspace_id');

        $data = $request->validate([
            'contact_id' => ['required', 'exists:contacts,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.discount_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_terms' => ['nullable', 'string'],
            'delivery_terms' => ['nullable', 'string'],
        ]);

        $contact = Contact::findOrFail($data['contact_id']);
        $channel = Channel::where('workspace_id', $workspaceId)->first();

        $conversation = Conversation::firstOrCreate(
            [
                'workspace_id' => $workspaceId,
                'channel_id' => $channel?->id ?? 1,
                'contact_id' => $contact->id,
            ],
            [
                'control_owner' => 'human_active',
                'control_epoch' => 1,
            ]
        );

        $quoteNumber = 'QUO-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $quote = Quote::create([
            'workspace_id' => $workspaceId,
            'conversation_id' => $conversation->id,
            'contact_id' => $contact->id,
            'quote_number' => $quoteNumber,
            'current_revision_number' => 1,
            'status' => 'draft',
            'grand_total' => 0,
            'currency' => 'IDR',
            'issued_at' => now(),
            'expires_at' => now()->addDays(14),
        ]);

        $subtotal = 0;
        $revision = QuoteRevision::create([
            'quote_id' => $quote->id,
            'revision_number' => 1,
            'subtotal' => 0,
            'total_discount' => 0,
            'shipping_fee' => 0,
            'tax_amount' => 0,
            'grand_total' => 0,
            'payment_terms' => $data['payment_terms'] ?? 'Cash Before Delivery',
            'delivery_terms' => $data['delivery_terms'] ?? 'Franco Jabodetabek',
            'status' => 'draft',
            'created_by' => 'human',
        ]);

        foreach ($data['items'] as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) continue;

            $qty = (int) $item['quantity'];
            $disc = (float) ($item['discount_pct'] ?? 0.0);
            $listPrice = (float) ($product->price_list > 0 ? $product->price_list : ($product->floor_price > 0 ? $product->floor_price : 100000));
            $netPrice = round($listPrice * (1.0 - ($disc / 100.0)), 2);
            $totalPrice = round($netPrice * $qty, 2);

            QuoteLine::create([
                'quote_revision_id' => $revision->id,
                'product_id' => $product->id,
                'sku' => $product->sku,
                'product_name' => $product->name,
                'quantity' => $qty,
                'unit' => $product->unit ?? 'pcs',
                'unit_list_price' => $listPrice,
                'unit_discount_pct' => $disc,
                'unit_net_price' => $netPrice,
                'total_price' => $totalPrice,
            ]);

            $subtotal += $totalPrice;
        }

        $tax = round($subtotal * 0.11, 2);
        $grandTotal = $subtotal + $tax;

        $revision->update([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'grand_total' => $grandTotal,
        ]);

        $quote->update(['grand_total' => $grandTotal]);

        AuditLog::log('quote.created', Quote::class, $quote->id, ['quote_number' => $quoteNumber, 'grand_total' => $grandTotal]);

        return redirect()->back()->with('success', "Penawaran #{$quoteNumber} berhasil dibuat.");
    }

    public function show(Request $request, int $id): Response
    {
        $workspaceId = session('current_workspace_id');

        $quote = Quote::with(['contact', 'conversation.channel', 'revisions.lines', 'revisions.approver'])
            ->where('workspace_id', $workspaceId)
            ->findOrFail($id);

        return Inertia::render('quotes/Show', [
            'quote' => $quote,
        ]);
    }

    public function approveRevision(Request $request, int $quoteId, int $revisionId)
    {
        $workspaceId = session('current_workspace_id');
        $quote = Quote::where('workspace_id', $workspaceId)->findOrFail($quoteId);
        $revision = QuoteRevision::where('quote_id', $quote->id)->findOrFail($revisionId);

        $revision->approved_by_user_id = $request->user()->id;
        $revision->save();

        $quote->status = 'approved';
        $quote->save();

        AuditLog::log('quote.approved', Quote::class, $quote->id, [
            'revision_number' => $revision->revision_number,
            'approved_by' => $request->user()->name,
        ]);

        return redirect()->back()->with('success', "Penawaran #{$quote->quote_number} Rev {$revision->revision_number} berhasil disetujui.");
    }

    public function destroy(int $id)
    {
        $workspaceId = session('current_workspace_id');
        $quote = Quote::where('workspace_id', $workspaceId)->findOrFail($id);
        $num = $quote->quote_number;
        $quote->delete();

        AuditLog::log('quote.deleted', Quote::class, $id, ['quote_number' => $num]);

        return redirect()->back()->with('success', "Penawaran #{$num} berhasil dihapus.");
    }

    public function negotiations(Request $request): Response
    {
        $workspaceId = session('current_workspace_id');

        $negotiations = NegotiationSession::with(['contact', 'conversation.channel', 'concessions'])
            ->where('workspace_id', $workspaceId)
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('negotiations/Index', [
            'negotiations' => $negotiations,
        ]);
    }
}
