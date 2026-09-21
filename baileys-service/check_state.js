import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionDir = path.resolve(__dirname, '..', 'storage', 'baileys_auth', 'channel_1');

async function check() {
    const { state } = await useMultiFileAuthState(sessionDir);
    console.log('Creds ME:', state.creds?.me);
    
    // Check keys or signal state
    const keys = Object.keys(state);
    console.log('State keys:', keys);
}

check().catch(console.error);
