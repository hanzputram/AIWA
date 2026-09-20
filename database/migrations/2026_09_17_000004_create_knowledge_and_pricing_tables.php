<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->index();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->string('category')->nullable();
            $table->string('unit')->default('pcs');
            $table->integer('pack_size')->default(1);
            $table->integer('moq')->default(1);
            $table->text('description')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('datasheet_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['workspace_id', 'sku']);
        });

        Schema::create('product_aliases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('alias')->index();
            $table->timestamps();
        });

        Schema::create('product_specs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('spec_name'); // e.g. "Poles", "Amperage", "Coil Voltage", "Breaking Capacity"
            $table->string('spec_value'); // e.g. "3P", "32A", "220VAC", "10kA"
            $table->timestamps();
        });

        Schema::create('price_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('version')->default('v1.0');
            $table->string('currency')->default('IDR');
            $table->string('tax_mode')->default('exclusive'); // inclusive, exclusive
            $table->string('price_basis')->default('net'); // list_with_coefficient, net
            $table->decimal('coefficient', 5, 4)->default(1.0000);
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('price_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->index();
            $table->decimal('base_price', 15, 2);
            $table->string('tier')->default('standard'); // standard, tier1, tier2
            $table->integer('min_quantity')->default(1);
            $table->string('currency')->default('IDR');
            $table->timestamps();
        });

        // Restricted Internal Cost & Fee table (Guarded by cost.view permission)
        Schema::create('cost_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->index();
            $table->decimal('hpp_cost', 15, 2)->default(0); // Cost basis / HPP
            $table->decimal('landed_cost', 15, 2)->default(0);
            $table->decimal('shipping_subsidy', 15, 2)->default(0);
            $table->decimal('handling_fee', 15, 2)->default(0);
            $table->decimal('margin_floor_pct', 5, 2)->default(20.00); // e.g. 20% minimum gross margin
            $table->string('version')->default('v1.0');
            $table->timestamps();

            $table->unique(['workspace_id', 'product_id', 'version']);
        });

        Schema::create('discount_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('version')->default('v1.0');
            $table->decimal('max_autonomous_discount_pct', 5, 2)->default(10.00); // e.g. 10%
            $table->decimal('discount_step_pct', 5, 2)->default(2.50); // e.g. 2.5% per concession step
            $table->integer('max_discount_rounds')->default(3); // e.g. 3 rounds of concession
            $table->string('stacking_rule')->default('sequential'); // sequential (10% + 5% = 14.5%), additive
            $table->decimal('minimum_gross_margin_pct', 5, 2)->default(15.00);
            $table->decimal('requires_manager_approval_above_pct', 5, 2)->default(10.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('business_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('legal_name')->nullable();
            $table->string('brand_name')->nullable();
            $table->text('description')->nullable();
            $table->json('services')->nullable();
            $table->json('branches')->nullable();
            $table->json('contact_info')->nullable();
            $table->json('working_hours')->nullable();
            $table->string('website')->nullable();
            $table->json('portfolio_highlights')->nullable();
            $table->string('source_document_name')->nullable();
            $table->json('provenance')->nullable();
            $table->text('raw_extracted_text')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });

        Schema::create('company_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('document_type')->default('compro_pdf'); // compro_pdf, catalog, datasheet, certificate, policy
            $table->string('classification')->default('customer_shareable'); // customer_shareable, internal, restricted
            $table->string('file_path')->nullable();
            $table->text('file_content_text')->nullable();
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
        });

        Schema::create('knowledge_releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('version_tag'); // e.g. "rel-20260917-1"
            $table->string('status')->default('ready'); // indexing, ready, revoked
            $table->text('summary')->nullable();
            $table->integer('item_count')->default(0);
            $table->timestamps();
        });

        Schema::create('knowledge_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('document_name');
            $table->string('source_type')->default('pdf'); // pdf, docx, csv, xlsx, manual_form, url
            $table->string('status')->default('needs_review'); // uploaded, scanning, extracting, needs_review, approved, indexing, ready, failed
            $table->json('extracted_data')->nullable();
            $table->json('conflicts')->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_imports');
        Schema::dropIfExists('knowledge_releases');
        Schema::dropIfExists('company_documents');
        Schema::dropIfExists('business_profiles');
        Schema::dropIfExists('discount_policies');
        Schema::dropIfExists('cost_entries');
        Schema::dropIfExists('price_entries');
        Schema::dropIfExists('price_books');
        Schema::dropIfExists('product_specs');
        Schema::dropIfExists('product_aliases');
        Schema::dropIfExists('products');
    }
};
