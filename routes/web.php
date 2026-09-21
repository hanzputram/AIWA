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
use App\Http\Controllers\UserController;
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
Route::post('/webhooks/baileys', [WebhookController::class, 'handleBaileys']);
Route::post('/api/v1/webhooks/baileys', [WebhookController::class, 'handleBaileys']);

// Authenticated Application Routes
Route::middleware(['auth'])->prefix('app')->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Multi-Number WhatsApp
    Route::get('/numbers', [ChannelController::class, 'index'])->name('numbers.index');
    Route::post('/numbers', [ChannelController::class, 'store'])->name('numbers.store');
    Route::put('/numbers/{id}', [ChannelController::class, 'update'])->name('numbers.update');
    Route::delete('/numbers/{id}', [ChannelController::class, 'destroy'])->name('numbers.destroy');

    // 3. Multi-Agent Inbox
    Route::get('/inbox/{id?}', [InboxController::class, 'index'])->name('inbox.index');

    // 4. Human Takeover Priority Queue
    Route::get('/takeover', [TakeoverController::class, 'index'])->name('takeover.index');

    // 5. CRM (Contacts, Companies, Deals Pipeline)
    Route::get('/contacts', [CrmController::class, 'contacts'])->name('crm.contacts');
    Route::post('/contacts', [CrmController::class, 'storeContact'])->name('crm.contacts.store');
    Route::put('/contacts/{id}', [CrmController::class, 'updateContact'])->name('crm.contacts.update');
    Route::delete('/contacts/{id}', [CrmController::class, 'deleteContact'])->name('crm.contacts.destroy');

    Route::get('/companies', [CrmController::class, 'companies'])->name('crm.companies');
    Route::post('/companies', [CrmController::class, 'storeCompany'])->name('crm.companies.store');
    Route::put('/companies/{id}', [CrmController::class, 'updateCompany'])->name('crm.companies.update');
    Route::delete('/companies/{id}', [CrmController::class, 'deleteCompany'])->name('crm.companies.destroy');

    Route::get('/deals', [CrmController::class, 'deals'])->name('crm.deals');
    Route::post('/deals', [CrmController::class, 'storeDeal'])->name('crm.deals.store');
    Route::put('/deals/{id}', [CrmController::class, 'updateDeal'])->name('crm.deals.update');
    Route::delete('/deals/{id}', [CrmController::class, 'deleteDeal'])->name('crm.deals.destroy');

    // 6. Business Knowledge Center
    Route::get('/knowledge/products', [KnowledgeController::class, 'products'])->name('knowledge.products');
    Route::post('/knowledge/products', [KnowledgeController::class, 'storeProduct'])->name('knowledge.products.store');
    Route::put('/knowledge/products/{id}', [KnowledgeController::class, 'updateProduct'])->name('knowledge.products.update');
    Route::delete('/knowledge/products/{id}', [KnowledgeController::class, 'deleteProduct'])->name('knowledge.products.destroy');
    Route::post('/knowledge/products/import', [KnowledgeController::class, 'importProductsExcel'])->name('knowledge.products.import');
    Route::get('/knowledge/products/template', [KnowledgeController::class, 'downloadProductTemplate'])->name('knowledge.products.template');
    Route::post('/knowledge/products/{id}/learn', [KnowledgeController::class, 'learnProductSpecs'])->name('knowledge.products.learn');

    Route::get('/knowledge/prices', [KnowledgeController::class, 'prices'])->name('knowledge.prices');
    Route::post('/knowledge/prices/books', [KnowledgeController::class, 'storePriceBook'])->name('knowledge.prices.books.store');
    Route::put('/knowledge/prices/books/{id}', [KnowledgeController::class, 'updatePriceBook'])->name('knowledge.prices.books.update');
    Route::delete('/knowledge/prices/books/{id}', [KnowledgeController::class, 'deletePriceBook'])->name('knowledge.prices.books.destroy');
    Route::post('/knowledge/prices/entries', [KnowledgeController::class, 'storePriceEntry'])->name('knowledge.prices.entries.store');
    Route::delete('/knowledge/prices/entries/{id}', [KnowledgeController::class, 'deletePriceEntry'])->name('knowledge.prices.entries.destroy');

    Route::get('/knowledge/discounts', [KnowledgeController::class, 'discounts'])->name('knowledge.discounts');
    Route::post('/knowledge/discounts', [KnowledgeController::class, 'storeDiscountPolicy'])->name('knowledge.discounts.store');
    Route::put('/knowledge/discounts/{id}', [KnowledgeController::class, 'updateDiscountPolicy'])->name('knowledge.discounts.update');
    Route::delete('/knowledge/discounts/{id}', [KnowledgeController::class, 'deleteDiscountPolicy'])->name('knowledge.discounts.destroy');
    Route::post('/knowledge/discount-matrices', [KnowledgeController::class, 'storeDiscountMatrix'])->name('knowledge.discount-matrices.store');
    Route::put('/knowledge/discount-matrices/{id}', [KnowledgeController::class, 'updateDiscountMatrix'])->name('knowledge.discount-matrices.update');
    Route::delete('/knowledge/discount-matrices/{id}', [KnowledgeController::class, 'deleteDiscountMatrix'])->name('knowledge.discount-matrices.destroy');
    Route::post('/knowledge/discount-matrices/import', [KnowledgeController::class, 'importDiscountMatrix'])->name('knowledge.discount-matrices.import');
    Route::get('/knowledge/discount-matrices/template', [KnowledgeController::class, 'downloadDiscountMatrixTemplate'])->name('knowledge.discount-matrices.template');

    Route::get('/knowledge/company', [KnowledgeController::class, 'company'])->name('knowledge.company');

    // 7. Quotations & Negotiations
    Route::get('/quotes', [QuoteController::class, 'index'])->name('quotes.index');
    Route::post('/quotes', [QuoteController::class, 'store'])->name('quotes.store');
    Route::get('/quotes/{id}', [QuoteController::class, 'show'])->name('quotes.show');
    Route::delete('/quotes/{id}', [QuoteController::class, 'destroy'])->name('quotes.destroy');
    Route::post('/quotes/{quoteId}/revisions/{revisionId}/approve', [QuoteController::class, 'approveRevision'])->name('quotes.approve');
    Route::get('/negotiations', [QuoteController::class, 'negotiations'])->name('negotiations.index');

    // 8. Campaigns & Templates
    Route::get('/templates', [CampaignController::class, 'templates'])->name('campaigns.templates');
    Route::post('/templates', [CampaignController::class, 'storeTemplate'])->name('campaigns.templates.store');
    Route::put('/templates/{id}', [CampaignController::class, 'updateTemplate'])->name('campaigns.templates.update');
    Route::delete('/templates/{id}', [CampaignController::class, 'deleteTemplate'])->name('campaigns.templates.destroy');

    Route::get('/campaigns', [CampaignController::class, 'campaigns'])->name('campaigns.index');
    Route::post('/campaigns', [CampaignController::class, 'storeCampaign'])->name('campaigns.store');
    Route::put('/campaigns/{id}', [CampaignController::class, 'updateCampaign'])->name('campaigns.update');
    Route::delete('/campaigns/{id}', [CampaignController::class, 'deleteCampaign'])->name('campaigns.destroy');

    // 9. Automations & Support Tickets
    Route::get('/automations', [SupportAutomationController::class, 'workflows'])->name('automations.index');
    Route::post('/automations', [SupportAutomationController::class, 'storeWorkflow'])->name('automations.store');
    Route::put('/automations/{id}', [SupportAutomationController::class, 'updateWorkflow'])->name('automations.update');
    Route::delete('/automations/{id}', [SupportAutomationController::class, 'deleteWorkflow'])->name('automations.destroy');

    Route::get('/tickets', [SupportAutomationController::class, 'tickets'])->name('tickets.index');
    Route::post('/tickets', [SupportAutomationController::class, 'storeTicket'])->name('tickets.store');
    Route::put('/tickets/{id}', [SupportAutomationController::class, 'updateTicket'])->name('tickets.update');
    Route::delete('/tickets/{id}', [SupportAutomationController::class, 'deleteTicket'])->name('tickets.destroy');

    // 10. Reports & Settings
    Route::get('/reports', [ReportSettingsController::class, 'reports'])->name('reports.index');
    Route::get('/settings', [ReportSettingsController::class, 'settings'])->name('settings.index');

    // 11. User Management
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
});

// Internal Scoped API Endpoints
Route::middleware(['auth'])->prefix('api/v1')->group(function () {
    // Numbers & Baileys Connection
    Route::patch('/numbers/{id}/ai-mode', [ChannelController::class, 'updateAiMode']);
    Route::post('/numbers/{id}/emergency-pause', [ChannelController::class, 'toggleEmergencyPause']);
    Route::post('/numbers/{id}/simulate', [ChannelController::class, 'simulateInbound']);
    Route::post('/numbers/{id}/baileys/connect', [ChannelController::class, 'connectBaileys']);
    Route::get('/numbers/{id}/baileys/status', [ChannelController::class, 'baileysStatus']);
    Route::post('/numbers/{id}/baileys/disconnect', [ChannelController::class, 'disconnectBaileys']);

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
    Route::post('/knowledge/products/{id}/learn-specs', [KnowledgeController::class, 'learnProductSpecs']);

    // Contacts
    Route::patch('/contacts/{id}', [CrmController::class, 'quickUpdateContact']);

    // Deals
    Route::patch('/deals/{id}/stage', [CrmController::class, 'updateDealStage']);

    // Tickets
    Route::patch('/tickets/{id}/status', [SupportAutomationController::class, 'updateTicketStatus']);
});
