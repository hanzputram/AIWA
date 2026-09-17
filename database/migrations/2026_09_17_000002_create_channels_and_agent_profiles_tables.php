<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('persona')->nullable();
            $table->string('tone')->default('professional_friendly'); // professional_friendly, formal, consultive, persuasive
            $table->text('system_instructions')->nullable();
            $table->string('model_name')->default('gemini-1.5-flash');
            $table->decimal('temperature', 3, 2)->default(0.3);
            $table->integer('max_tokens_per_turn')->default(800);
            $table->integer('token_budget')->default(50000);
            $table->json('allowed_tools')->nullable();
            $table->timestamps();
        });

        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. "ATS Sales Division", "ATS CS Support"
            $table->string('phone_e164'); // e.g. "+628123456789"
            $table->string('display_number')->nullable();
            $table->string('branch')->nullable();
            $table->string('provider')->default('fake_sandbox'); // meta, fake_sandbox
            $table->string('waba_id')->nullable();
            $table->string('phone_number_id')->nullable();
            $table->string('secret_reference')->nullable();
            $table->string('connection_status')->default('draft'); // draft, connecting, connected, degraded, disconnected, disabled
            $table->string('ai_mode')->default('off'); // off, assist, autonomous
            $table->boolean('is_emergency_paused')->default(false);
            $table->foreignId('primary_human_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('backup_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->timestamp('last_webhook_at')->nullable();
            $table->json('health_metrics')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'phone_e164']);
        });

        Schema::create('channel_agent_bindings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agent_profile_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('active_release_id')->nullable();
            $table->unsignedBigInteger('price_book_id')->nullable();
            $table->unsignedBigInteger('discount_policy_id')->nullable();
            $table->foreignId('primary_human_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('backup_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->json('takeover_thresholds')->nullable(); // intent_score_threshold, max_objection_rounds, high_value_deal_threshold
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_agent_bindings');
        Schema::dropIfExists('channels');
        Schema::dropIfExists('agent_profiles');
    }
};
