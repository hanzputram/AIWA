<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('industry')->nullable();
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('phone_e164');
            $table->string('email')->nullable();
            $table->string('job_title')->nullable();
            $table->string('customer_tier')->default('standard'); // standard, silver, gold, platinum
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('custom_fields')->nullable();
            $table->timestamp('last_inbound_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'phone_e164']);
        });

        Schema::create('contact_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('purpose')->default('sales_inquiries');
            $table->string('channel')->default('whatsapp');
            $table->string('state')->default('opted_in'); // opted_in, opted_out
            $table->string('source')->default('inbound_chat');
            $table->text('evidence')->nullable();
            $table->timestamps();
        });

        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('stage')->default('baru'); // baru, kualifikasi, penawaran, negosiasi, menang, kalah
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('currency')->default('IDR');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('expected_close_date')->nullable();
            $table->string('lost_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
        Schema::dropIfExists('contact_consents');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('companies');
    }
};
