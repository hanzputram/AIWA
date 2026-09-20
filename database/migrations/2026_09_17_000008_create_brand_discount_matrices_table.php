<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brand_discount_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('brand')->default('Schneider');
            $table->string('category')->index(); // MCB, MCCB, ACB, Contactor, etc.
            $table->decimal('coefficient', 8, 4)->default(1.0000); // 1.13, 1.20, 1.10, etc.
            $table->string('series_type')->index(); // Domae, IC, IK, NSX BARU C1F, etc.
            $table->decimal('standard_discount_pct', 5, 2)->nullable();
            $table->decimal('max_1_discount_pct', 5, 2)->nullable();
            $table->decimal('max_2_discount_pct', 5, 2)->nullable();
            $table->decimal('khusus_discount_pct', 5, 2)->nullable(); // Floor Limit
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_discount_matrices');
    }
};
