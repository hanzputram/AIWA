<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'meta' => [
        'token' => env('META_SYSTEM_USER_TOKEN'),
        'verify_token' => env('META_VERIFY_TOKEN', 'ats_verify_token_2026'),
        'app_secret' => env('META_APP_SECRET', 'test_secret_meta_123'),
        'version' => env('META_GRAPH_VERSION', 'v21.0'),
    ],

    'baileys' => [
        'url' => env('BAILEYS_SERVICE_URL', 'http://127.0.0.1:3000'),
        'secret' => env('BAILEYS_SECRET', 'ats_baileys_secret_2026'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.6-flash'),
    ],

];
