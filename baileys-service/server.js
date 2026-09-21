import express from 'express';
import cors from 'cors';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.BAILEYS_PORT || 3000;
const LARAVEL_WEBHOOK_URL = process.env.LARAVEL_WEBHOOK_URL || 'http://127.0.0.1:8000/api/v1/webhooks/baileys';
const STORAGE_DIR = path.resolve(__dirname, '..', 'storage', 'baileys_auth');

// Ensure base storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Logger
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// In-memory session tracking
// sessionId -> { sock, qr, qrDataUrl, status, userPhone, lastError, jidMap, contacts }
const sessions = new Map();

/**
 * Normalizes phone number or LID to appropriate WhatsApp JID
 */
function formatToJid(to, sessionData) {
    if (!to) return '';
    const raw = String(to).trim();

    // Already a complete JID
    if (raw.includes('@s.whatsapp.net') || raw.includes('@lid') || raw.includes('@g.us')) {
        return raw;
    }

    const clean = raw.replace(/[^0-9]/g, '');

    // 1. Check known mapped JID from previous inbound messages or contacts
    if (sessionData?.jidMap?.has(clean)) {
        return sessionData.jidMap.get(clean);
    }
    if (sessionData?.jidMap?.has(raw)) {
        return sessionData.jidMap.get(raw);
    }
    if (sessionData?.jidMap?.has('+' + clean)) {
        return sessionData.jidMap.get('+' + clean);
    }

    // 2. WhatsApp Multi-Device LID format (14-16 digits starting with 1, not matching country code 62)
    if (clean.length >= 14 && !clean.startsWith('62')) {
        return `${clean}@lid`;
    }

    // 3. Standard Phone Number format (e.g. Indonesian 08xx -> 628xx)
    let norm = clean;
    if (norm.startsWith('0')) {
        norm = '62' + norm.slice(1);
    }
    return `${norm}@s.whatsapp.net`;
}

/**
 * Initializes or restarts a Baileys session
 */
async function initSession(sessionId) {
    const sessionDir = path.join(STORAGE_DIR, sessionId);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Starting Baileys session [${sessionId}] with WA version v${version.join('.')}`);

    const sessionData = sessions.get(sessionId) || {
        sock: null,
        qr: null,
        qrDataUrl: null,
        status: 'connecting',
        userPhone: null,
        lastError: null,
        jidMap: new Map(),
        contacts: new Map()
    };

    // Ensure maps exist
    if (!sessionData.jidMap) sessionData.jidMap = new Map();
    if (!sessionData.contacts) sessionData.contacts = new Map();

    // Close existing socket if present
    if (sessionData.sock) {
        try {
            sessionData.sock.end();
        } catch (e) {
            // ignore
        }
    }

    sessionData.status = 'connecting';
    sessions.set(sessionId, sessionData);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['ATS AI Sales Multi-Device', 'Chrome', '124.0.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: true
    });

    sessionData.sock = sock;

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Track contacts & LID-to-phone mappings from WhatsApp sync
    const handleContacts = (contactList) => {
        if (!Array.isArray(contactList)) return;
        for (const c of contactList) {
            const lid = c.lid ? c.lid.split('@')[0] : null;
            const pn = (c.id || c.jid) ? (c.id || c.jid).split('@')[0] : null;
            const name = c.name || c.notify;

            if (lid && pn) {
                sessionData.contacts.set(lid, { phone: pn, name });
                sessionData.contacts.set(pn, { lid, name });
                sessionData.jidMap.set(pn, `${lid}@lid`);
                sessionData.jidMap.set(lid, `${lid}@lid`);
                sessionData.jidMap.set('+' + pn, `${lid}@lid`);
            } else if (pn) {
                sessionData.contacts.set(pn, { phone: pn, name });
            }
        }
    };

    sock.ev.on('contacts.upsert', handleContacts);
    sock.ev.on('contacts.update', handleContacts);

    // Connection events (QR, open, close)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sessionData.qr = qr;
            try {
                sessionData.qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
                sessionData.status = 'qr_ready';
                logger.info(`Session [${sessionId}] QR Code generated`);
            } catch (err) {
                logger.error(`Error generating QR data URL: ${err.message}`);
            }
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            logger.warn(`Session [${sessionId}] closed. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

            if (statusCode === DisconnectReason.loggedOut) {
                sessionData.status = 'disconnected';
                sessionData.qr = null;
                sessionData.qrDataUrl = null;
                // Delete auth directory
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                } catch (e) {}
            } else if (shouldReconnect) {
                sessionData.status = 'connecting';
                setTimeout(() => initSession(sessionId), 3000);
            } else {
                sessionData.status = 'disconnected';
            }
        } else if (connection === 'open') {
            sessionData.status = 'connected';
            sessionData.qr = null;
            sessionData.qrDataUrl = null;
            sessionData.userPhone = sock.user?.id ? sock.user.id.split(':')[0] : null;
            logger.info(`Session [${sessionId}] successfully connected! User: ${sessionData.userPhone}`);

            // Notify Laravel Webhook of connection state
            try {
                await fetch(LARAVEL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'session_connected',
                        sessionId,
                        userPhone: sessionData.userPhone
                    })
                });
            } catch (e) {
                logger.warn(`Could not notify Laravel of session open: ${e.message}`);
            }
        }
    });

    // Inbound Messages Listener
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Ignore messages sent by ourselves
            if (msg.key.fromMe) continue;

            // Strictly ignore group chats, newsletters/channels, broadcasts, and status updates
            const remoteJid = msg.key.remoteJid || '';
            const isGroup = remoteJid.endsWith('@g.us') || remoteJid.includes('@g.us') || Boolean(msg.key.participant);
            const isNewsletter = remoteJid.endsWith('@newsletter') || remoteJid.includes('@newsletter');
            const isBroadcast = remoteJid.includes('@broadcast') || remoteJid.includes('status@broadcast');

            if (isGroup || isNewsletter || isBroadcast) {
                // Silently skip non-private messages
                continue;
            }

            const isLid = remoteJid.endsWith('@lid');
            const rawId = remoteJid.split('@')[0];
            const pushName = msg.pushName || '';

            // Check if senderPn or participantPn is present on msg.key
            let realPhone = null;
            if (msg.key?.senderPn) {
                realPhone = msg.key.senderPn.split('@')[0];
            } else if (msg.key?.participantPn) {
                realPhone = msg.key.participantPn.split('@')[0];
            } else if (sessionData.contacts.has(rawId)) {
                realPhone = sessionData.contacts.get(rawId).phone;
            } else if (!isLid) {
                realPhone = rawId;
            }

            // Always store exact JID mapping so outbound replies reach the exact WhatsApp recipient
            sessionData.jidMap.set(rawId, remoteJid);
            sessionData.jidMap.set('+' + rawId, remoteJid);
            if (realPhone) {
                sessionData.jidMap.set(realPhone, remoteJid);
                sessionData.jidMap.set('+' + realPhone, remoteJid);
            }

            const messageId = msg.key.id;
            const messageTimestamp = msg.messageTimestamp;

            // Extract message body
            const messageContent = msg.message;
            let text = '';

            if (messageContent?.conversation) {
                text = messageContent.conversation;
            } else if (messageContent?.extendedTextMessage?.text) {
                text = messageContent.extendedTextMessage.text;
            } else if (messageContent?.imageMessage?.caption) {
                text = messageContent.imageMessage.caption;
            } else if (messageContent?.documentMessage?.caption) {
                text = messageContent.documentMessage.caption;
            }

            if (!text || text.trim() === '') continue;

            console.log(`[INBOUND] Session [${sessionId}] from [${realPhone || rawId}] (${remoteJid}), PushName: "${pushName}", text: "${text}"`);

            // Forward to Laravel Webhook with complete context
            try {
                await fetch(LARAVEL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'inbound_message',
                        sessionId,
                        fromPhone: realPhone || rawId,
                        realPhone: realPhone,
                        remoteJid,
                        isLid,
                        pushName,
                        messageId,
                        text,
                        timestamp: messageTimestamp
                    })
                });
            } catch (err) {
                logger.error(`Failed to forward inbound message to Laravel webhook: ${err.message}`);
            }
        }
    });

    return sessionData;
}

// Auto-restore any existing sessions on disk on boot
async function restoreExistingSessions() {
    try {
        if (!fs.existsSync(STORAGE_DIR)) return;
        const dirs = fs.readdirSync(STORAGE_DIR, { withFileTypes: true });
        for (const d of dirs) {
            if (d.isDirectory()) {
                const credsPath = path.join(STORAGE_DIR, d.name, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    console.log(`[BOOT] Auto-restoring existing session: ${d.name}`);
                    await initSession(d.name);
                }
            }
        }
    } catch (e) {
        console.warn('Could not auto-restore sessions:', e.message);
    }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        active_sessions: sessions.size
    });
});

/**
 * List all sessions
 */
app.get('/sessions', (req, res) => {
    const list = [];
    for (const [id, data] of sessions.entries()) {
        list.push({
            sessionId: id,
            status: data.status,
            userPhone: data.userPhone,
            hasQr: !!data.qrDataUrl
        });
    }
    res.json({ sessions: list });
});

/**
 * Start or connect session (Generates QR Code)
 */
app.post('/sessions/start', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    try {
        const sessionData = await initSession(sessionId);
        // Wait brief delay for initial connection/QR emit
        await new Promise(r => setTimeout(r, 1200));

        res.json({
            success: true,
            sessionId,
            status: sessionData.status,
            qr: sessionData.qrDataUrl,
            userPhone: sessionData.userPhone
        });
    } catch (err) {
        logger.error(`Error starting session [${sessionId}]: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Get session status & QR code
 */
app.get('/sessions/:sessionId/status', (req, res) => {
    const { sessionId } = req.params;
    const sessionData = sessions.get(sessionId);

    if (!sessionData) {
        // Check if credentials exist on disk
        const sessionDir = path.join(STORAGE_DIR, sessionId);
        const hasCreds = fs.existsSync(sessionDir) && fs.existsSync(path.join(sessionDir, 'creds.json'));

        return res.json({
            sessionId,
            status: hasCreds ? 'saved_offline' : 'draft',
            qr: null,
            userPhone: null
        });
    }

    res.json({
        sessionId,
        status: sessionData.status,
        qr: sessionData.qrDataUrl,
        userPhone: sessionData.userPhone,
        lastError: sessionData.lastError
    });
});

/**
 * Logout & disconnect session
 */
app.post('/sessions/:sessionId/logout', async (req, res) => {
    const { sessionId } = req.params;
    const sessionData = sessions.get(sessionId);

    if (sessionData && sessionData.sock) {
        try {
            await sessionData.sock.logout();
        } catch (e) {
            try { sessionData.sock.end(); } catch (_) {}
        }
    }

    const sessionDir = path.join(STORAGE_DIR, sessionId);
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (e) {}

    sessions.delete(sessionId);

    res.json({
        success: true,
        message: `Session [${sessionId}] successfully disconnected and auth cleared.`
    });
});

/**
 * Send text message
 */
app.post('/messages/send', async (req, res) => {
    const { sessionId, to, text } = req.body;

    if (!sessionId || !to || !text) {
        return res.status(400).json({ error: 'sessionId, to, and text are required' });
    }

    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.sock || sessionData.status !== 'connected') {
        return res.status(400).json({
            success: false,
            error: `Session [${sessionId}] is not connected (current status: ${sessionData?.status || 'none'}). Please scan QR first.`
        });
    }

    try {
        const jid = formatToJid(to, sessionData);
        console.log(`[OUTBOUND] Sending to [${to}] -> Resolved JID [${jid}]`);

        const result = await sessionData.sock.sendMessage(jid, { text });
        console.log(`[OUTBOUND SUCCESS] Message sent to [${jid}], id: ${result?.key?.id}`);

        res.json({
            success: true,
            provider: 'baileys',
            provider_message_id: result?.key?.id,
            status: 'sent',
            recipient_id: to,
            resolved_jid: jid
        });
    } catch (err) {
        console.error(`[OUTBOUND ERROR] Failed to send to [${to}]: ${err.message}`);
        logger.error(`Failed to send message via Baileys: ${err.message}`);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Send document message (e.g., Quotation PDF, Company Profile)
 */
app.post('/messages/send-document', async (req, res) => {
    const { sessionId, to, documentUrl, filename, caption } = req.body;

    if (!sessionId || !to || !documentUrl || !filename) {
        return res.status(400).json({ error: 'sessionId, to, documentUrl, and filename are required' });
    }

    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.sock || sessionData.status !== 'connected') {
        return res.status(400).json({
            success: false,
            error: `Session [${sessionId}] is not connected.`
        });
    }

    try {
        const jid = formatToJid(to, sessionData);
        const result = await sessionData.sock.sendMessage(jid, {
            document: { url: documentUrl },
            fileName: filename,
            caption: caption || '',
            mimetype: 'application/pdf'
        });

        res.json({
            success: true,
            provider: 'baileys',
            provider_message_id: result?.key?.id,
            status: 'sent',
            resolved_jid: jid
        });
    } catch (err) {
        logger.error(`Failed to send document via Baileys: ${err.message}`);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 ATS Baileys Multi-Device Service running on port ${PORT}`);
    console.log(`   Webhook Target: ${LARAVEL_WEBHOOK_URL}`);
    console.log(`   Auth Storage:   ${STORAGE_DIR}`);
    console.log(`====================================================`);
    await restoreExistingSessions();
});
