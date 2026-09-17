<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Quote;
use App\Models\QuoteRevision;
use App\Models\NegotiationSession;
use App\Models\Product;
use App\Domain\Pricing\PricingEngineService;
use App\Models\AuditLog;

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

        return Inertia::render('quotes/Index', [
            'quotes' => $quotes,
        ]);
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
