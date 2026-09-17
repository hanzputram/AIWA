<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('control_epoch')->default(1); // Crucial for atomic takeover fence
            $table->string('lifecycle')->default('open'); // open, pending, resolved
            $table->string('control_owner')->default('ai_active'); // ai_active, handoff_requested, human_active, ai_paused
            $table->string('sales_stage')->default('new'); // new, qualifying, qualified, quoted, negotiating, ready_to_order, won, lost, follow_up
            $table->string('intent_band')->default('unknown'); // unknown, cold, warm, hot
            $table->integer('intent_score')->default(0); // 0 - 100 explainable score
            $table->float('purchase_probability')->nullable(); // MUST be nullable unless calibrated
            $table->string('negotiation_state')->default('none'); // none, active, awaiting_customer, price_objection, terms_objection, needs_approval, at_floor, stalled, resolved
            $table->string('handoff_state')->default('none'); // none, queued, assigned, claimed, completed, cancelled
            $table->json('handoff_reasons')->nullable(); // array of reason codes
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->timestamp('last_customer_message_at')->nullable(); // 24-hour customer window anchor
            $table->timestamp('last_message_at')->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestamps();

            $table->index(['workspace_id', 'channel_id', 'contact_id']);
            $table->index(['workspace_id', 'control_owner', 'handoff_state']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('direction')->default('inbound'); // inbound, outbound
            $table->string('sender_type')->default('customer'); // customer, ai, human, system
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->string('kind')->default('text'); // text, template, image, document, quote
            $table->text('content');
            $table->json('metadata')->nullable(); // token costs, model version, sources, tool calls
            $table->string('provider_message_id')->nullable()->index();
            $table->string('state')->default('delivered'); // queued, sending, accepted, sent, delivered, read, failed, unknown
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('control_epoch_snapshot')->default(1);
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });

        Schema::create('internal_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });

        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('quote_number')->unique(); // e.g. "QUO-20260917-001"
            $table->integer('current_revision_number')->default(1);
            $table->string('status')->default('issued'); // draft, pending_approval, approved, issued, accepted_pending_confirmation, superseded, expired, cancelled
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('currency')->default('IDR');
            $table->string('signed_token')->nullable()->index();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quote_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->integer('revision_number')->default(1);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('total_discount', 15, 2)->default(0);
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('gross_margin_pct', 5, 2)->nullable(); // Restricted for cost.view
            $table->string('payment_terms')->default('Cash Before Delivery');
            $table->string('delivery_terms')->default('Franco Jakarta');
            $table->string('status')->default('draft');
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('created_by')->default('system_policy'); // system_policy, human
            $table->timestamps();
        });

        Schema::create('quote_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_revision_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku');
            $table->string('product_name');
            $table->integer('quantity')->default(1);
            $table->string('unit')->default('pcs');
            $table->decimal('unit_list_price', 15, 2);
            $table->decimal('unit_discount_pct', 5, 2)->default(0);
            $table->decimal('unit_net_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();
        });

        Schema::create('negotiation_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->decimal('asking_total', 15, 2)->default(0);
            $table->decimal('current_offer_total', 15, 2)->default(0);
            $table->decimal('customer_bid_total', 15, 2)->nullable();
            $table->integer('rounds_count')->default(0);
            $table->integer('stalled_objection_count')->default(0);
            $table->boolean('is_stalled')->default(false);
            $table->string('status')->default('active'); // active, stalled, agreed, abandoned
            $table->timestamps();
        });

        Schema::create('concessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('negotiation_session_id')->constrained()->cascadeOnDelete();
            $table->integer('round_number')->default(1);
            $table->string('concession_type')->default('discount_step'); // discount_step, quantity_tier, bundle, payment_term
            $table->decimal('granted_pct', 5, 2)->default(0);
            $table->decimal('price_after', 15, 2)->default(0);
            $table->string('conditions')->nullable(); // e.g. "Min order 50 pcs"
            $table->timestamps();
        });

        Schema::create('handoff_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->json('reason_codes'); // e.g. ["buying_intent_high", "negotiation_stalled"]
            $table->string('priority')->default('high'); // low, medium, high, urgent
            $table->foreignId('primary_human_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('backup_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('claimed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('sla_target_at')->nullable();
            $table->timestamp('escalated_at')->nullable();
            $table->string('status')->default('queued'); // queued, assigned, claimed, completed, cancelled
            $table->unsignedBigInteger('control_epoch_snapshot')->default(1);
            $table->timestamps();

            $table->index(['workspace_id', 'status', 'priority']);
        });

        Schema::create('handover_briefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->text('customer_needs')->nullable();
            $table->text('last_valid_quote_summary')->nullable();
            $table->text('customer_last_bid')->nullable();
            $table->text('concessions_summary')->nullable();
            $table->text('trigger_reasons_summary')->nullable();
            $table->json('evidence_quotes')->nullable();
            $table->text('suggested_next_actions')->nullable();
            $table->boolean('is_cost_guarded')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('handover_briefs');
        Schema::dropIfExists('handoff_requests');
        Schema::dropIfExists('concessions');
        Schema::dropIfExists('negotiation_sessions');
        Schema::dropIfExists('quote_lines');
        Schema::dropIfExists('quote_revisions');
        Schema::dropIfExists('quotes');
        Schema::dropIfExists('internal_notes');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
