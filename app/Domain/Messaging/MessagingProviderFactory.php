<?php

namespace App\Domain\Messaging;

use App\Models\Channel;
use App\Domain\Messaging\Providers\MessagingProviderInterface;
use App\Domain\Messaging\Providers\BaileysProvider;
use App\Domain\Messaging\Providers\MetaCloudApiProvider;
use App\Domain\Messaging\Providers\FakeWhatsAppSandboxProvider;

class MessagingProviderFactory
{
    /**
     * Resolve the appropriate messaging provider for a given channel
     */
    public static function make(?Channel $channel): MessagingProviderInterface
    {
        if (!$channel) {
            return new FakeWhatsAppSandboxProvider();
        }

        return match ($channel->provider) {
            'baileys' => new BaileysProvider(),
            'meta' => new MetaCloudApiProvider(),
            'fake_sandbox' => new FakeWhatsAppSandboxProvider(),
            default => !empty($channel->secret_reference) ? new MetaCloudApiProvider() : new BaileysProvider(),
        };
    }
}
