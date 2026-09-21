<?php

namespace App\Domain\AISales;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected ?string $apiKey;
    protected string $model;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-3.6-flash');
    }

    /**
     * Check if Gemini API is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Generate content from Google Gemini
     *
     * @param string $systemInstruction
     * @param array $history Array of ['role' => 'user'|'model', 'text' => string]
     * @param string $userMessage
     * @param array $options
     * @return string|null
     */
    public function generateReply(string $systemInstruction, array $history, string $userMessage, array $options = []): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $model = $options['model'] ?? $this->model;
        $url = "{$this->baseUrl}/models/{$model}:generateContent?key={$this->apiKey}";

        $contents = [];
        foreach ($history as $h) {
            $contents[] = [
                'role' => $h['role'] === 'ai' ? 'model' : 'user',
                'parts' => [
                    ['text' => $h['text']]
                ]
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $userMessage]
            ]
        ];

        $payload = [
            'contents' => $contents,
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ],
            'generationConfig' => [
                'temperature' => $options['temperature'] ?? 0.3,
                'maxOutputTokens' => $options['maxTokens'] ?? 800,
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $this->apiKey,
            ])
            ->withoutVerifying()
            ->timeout(15)
            ->post($url, $payload);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($reply) {
                    return trim($reply);
                }
            } else {
                Log::warning('Gemini API Error: ' . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
        }

        return null;
    }
}
