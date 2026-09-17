<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\TakeoverController;
use App\Http\Controllers\KnowledgeController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\SupportAutomationController;
use App\Http\Controllers\ReportSettingsController;
use App\Http\Controllers\WebhookController;

/*
|--------------------------------------------------------------------------
| Web Routes — ATS AI Sales Workspace (Internal App Only)
|--------------------------------------------------------------------------
| No public marketing or landing pages per Revision 2 specification.
| Root route redirects directly to login or dashboard.
*/

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Webhook Ingress (Public, CSRF-excepted, verified by signature)
Route::get('/webhooks/meta', [WebhookController::class, 'verify']);
Route::post('/webhooks/meta', [WebhookController::class, 'handle']);
Route::get('/api/v1/webhooks/meta', [WebhookController::class, 'verify']);
Route::post('/api/v1/webhooks/meta', [WebhookController::class, 'handle']);

// Authenticated Application Routes
Route::middleware(['auth'])->prefix('app')->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Multi-Number WhatsApp
    Route::get('/numbers', [ChannelController::class, 'index'])->name('numbers.index');
    Route::post('/numbers', [ChannelController::class, 'store'])->name('numbers.store');

    // 3. Multi-Agent Inbox
    Route::get('/inbox/{id?}', [InboxController::class, 'index'])->name('inbox.index');

    // 4. Human Takeover Priority Queue
    Route::get('/takeover', [TakeoverController::class, 'index'])->name('takeover.index');

    // 5. CRM (Contacts, Companies, Deals Pipeline)
    Route::get('/contacts', [CrmController::class, 'contacts'])->name('crm.contacts');
    Route::post('/contacts', [CrmController::class, 'storeContact'])->name('crm.contacts.store');
    Route::get('/companies', [CrmController::class, 'companies'])->name('crm.companies');
    Route::get('/deals', [CrmController::class, 'deals'])->name('crm.deals');

    // 6. Business Knowledge Center
    Route::get('/knowledge/products', [KnowledgeController::class, 'products'])->name('knowledge.products');
    Route::get('/knowledge/prices', [KnowledgeController::class, 'prices'])->name('knowledge.prices');
    Route::get('/knowledge/discounts', [KnowledgeController::class, 'discounts'])->name('knowledge.discounts');
    Route::get('/knowledge/company', [KnowledgeController::class, 'company'])->name('knowledge.company');

    // 7. Quotations & Negotiations
    Route::get('/quotes', [QuoteController::class, 'index'])->name('quotes.index');
    Route::get('/quotes/{id}', [QuoteController::class, 'show'])->name('quotes.show');
    Route::post('/quotes/{quoteId}/revisions/{revisionId}/approve', [QuoteController::class, 'approveRevision'])->name('quotes.approve');
    Route::get('/negotiations', [QuoteController::class, 'negotiations'])->name('negotiations.index');

    // 8. Campaigns & Templates
    Route::get('/templates', [CampaignController::class, 'templates'])->name('campaigns.templates');
    Route::get('/campaigns', [CampaignController::class, 'campaigns'])->name('campaigns.index');
    Route::post('/campaigns', [CampaignController::class, 'storeCampaign'])->name('campaigns.store');

    // 9. Automations & Support Tickets
    Route::get('/automations', [SupportAutomationController::class, 'workflows'])->name('automations.index');
    Route::get('/tickets', [SupportAutomationController::class, 'tickets'])->name('tickets.index');

    // 10. Reports & Settings
    Route::get('/reports', [ReportSettingsController::class, 'reports'])->name('reports.index');
    Route::get('/settings', [ReportSettingsController::class, 'settings'])->name('settings.index');
});

// Internal Scoped API Endpoints
Route::middleware(['auth'])->prefix('api/v1')->group(function () {
    // Numbers
    Route::patch('/numbers/{id}/ai-mode', [ChannelController::class, 'updateAiMode']);
    Route::post('/numbers/{id}/emergency-pause', [ChannelController::class, 'toggleEmergencyPause']);
    Route::post('/numbers/{id}/simulate', [ChannelController::class, 'simulateInbound']);

    // Workspace Emergency Stop
    Route::post('/ai/emergency-stop', [TakeoverController::class, 'emergencyStop']);

    // Inbox & Messages
    Route::post('/conversations/{id}/messages', [InboxController::class, 'sendMessage']);
    Route::post('/conversations/{id}/notes', [InboxController::class, 'addNote']);
    Route::patch('/conversations/{id}/status', [InboxController::class, 'updateStatus']);

    // Takeover Actions
    Route::post('/handoffs/{id}/claim', [TakeoverController::class, 'claim']);
    Route::post('/conversations/{id}/release-to-ai', [TakeoverController::class, 'releaseToAi']);

    // Knowledge & Compro
    Route::post('/knowledge/compro/upload', [KnowledgeController::class, 'uploadCompro']);
    Route::post('/knowledge/compro/approve', [KnowledgeController::class, 'approveProfile']);

    // Deals
    Route::patch('/deals/{id}/stage', [CrmController::class, 'updateDealStage']);

    // Tickets
    Route::patch('/tickets/{id}/status', [SupportAutomationController::class, 'updateTicketStatus']);
});
