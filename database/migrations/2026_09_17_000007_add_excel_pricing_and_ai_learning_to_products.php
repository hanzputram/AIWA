<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price_list', 15, 2)->nullable()->after('moq');
            $table->decimal('coefficient', 5, 4)->default(1.0000)->after('price_list');
            $table->decimal('discount_pct', 5, 2)->default(0.00)->after('coefficient');
            $table->decimal('floor_price', 15, 2)->nullable()->after('discount_pct');
            $table->string('datasheet_path')->nullable()->after('datasheet_url');
            $table->string('brand_url')->nullable()->after('datasheet_path');
            $table->string('specs_source')->default('manual')->after('brand_url'); // manual, datasheet_pdf, brand_web
            $table->timestamp('ai_learned_at')->nullable()->after('specs_source');
            $table->text('ai_learning_notes')->nullable()->after('ai_learned_at');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'price_list',
                'coefficient',
                'discount_pct',
                'floor_price',
                'datasheet_path',
                'brand_url',
                'specs_source',
                'ai_learned_at',
                'ai_learning_notes',
            ]);
        });
    }
};
