import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '..', 'baileys_auth_info');

const PORT = process.env.WA_GATEWAY_PORT || 3001;

// State tracking
let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let currentPairCode = null;
let currentPairPhone = null;
let connectionStatus = 'initializing'; // 'initializing' | 'connecting' | 'scan_qr' | 'connected' | 'disconnected'
let connectedUser = null;
let reconnectAttempts = 0;

function formatPhoneToJid(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return `${cleaned}@s.whatsapp.net`;
}

async function startWhatsApp() {
  connectionStatus = 'connecting';
  console.log('\n[WhatsApp Gateway] Inisialisasi Baileys WhatsApp Gateway...');

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version = [2, 3000, 1015901307];
  try {
    const vResult = await fetchLatestBaileysVersion();
    if (vResult && vResult.version) {
      version = vResult.version;
    }
  } catch (err) {
    // ignore version fetch error
  }

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    syncFullHistory: false,
    connectTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      connectionStatus = 'scan_qr';
      try {
        currentQRDataUrl = await QRCode.toDataURL(qr);
      } catch (e) {
        currentQRDataUrl = null;
      }

      console.log('\n==================================================');
      console.log('  SCAN QR CODE WHATSAPP INI DENGAN HP ANDA:');
      console.log('==================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\nAtau buka di browser: http://localhost:3000/dashboard/whatsapp');
      console.log('==================================================\n');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionStatus = 'disconnected';
      connectedUser = null;
      currentQR = null;
      currentQRDataUrl = null;
      currentPairCode = null;
      currentPairPhone = null;

      console.log(`[WhatsApp Gateway] Koneksi terputus. Kode: ${statusCode}. Auto reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        reconnectAttempts++;
        const delay = Math.min(reconnectAttempts * 3000, 15000);
        console.log(`[WhatsApp Gateway] Mencoba menghubungkan kembali dalam ${delay / 1000} detik...`);
        setTimeout(() => {
          startWhatsApp();
        }, delay);
      } else {
        console.log('[WhatsApp Gateway] Akun WhatsApp telah di-logout. Menghapus sesi lama...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {}
        setTimeout(() => {
          startWhatsApp();
        }, 3000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      reconnectAttempts = 0;
      currentQR = null;
      currentQRDataUrl = null;
      currentPairCode = null;
      currentPairPhone = null;
      connectedUser = sock.user?.id || 'Connected';
      console.log('\n✅ [WhatsApp Gateway] SUKSES! WhatsApp Terhubung!');
      console.log(`Akun: ${sock.user?.id || sock.user?.name || 'WhatsApp Web'}\n`);
    }
  });
}

// Simple HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. Status endpoint
  if (url.pathname === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        status: connectionStatus,
        user: connectedUser,
        hasQr: !!currentQR,
        pairCode: currentPairCode,
        pairPhone: currentPairPhone,
      })
    );
    return;
  }

  // 2. QR code endpoint
  if (url.pathname === '/qr' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        status: connectionStatus,
        qr: currentQR,
        qrDataUrl: currentQRDataUrl,
      })
    );
    return;
  }

  // 3. Send message endpoint
  if (url.pathname === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { phone, message } = payload;

        if (!phone || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Nomor telepon dan pesan harus diisi.' }));
          return;
        }

        if (connectionStatus !== 'connected' || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              message: 'WhatsApp Gateway belum terhubung. Silakan scan QR code terlebih dahulu.',
              status: connectionStatus,
            })
          );
          return;
        }

        const jid = formatPhoneToJid(phone);
        console.log(`[WhatsApp Gateway] Mengirim pesan ke ${jid}...`);

        const sent = await sock.sendMessage(jid, { text: message });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            message: 'Pesan berhasil terkirim melalui Baileys WhatsApp Gateway',
            messageId: sent?.key?.id,
          })
        );
      } catch (err) {
        console.error('[WhatsApp Gateway Error saat mengirim]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            message: `Gagal mengirim pesan: ${err.message || 'Error tidak diketahui'}`,
          })
        );
      }
    });
    return;
  }

  // 4. Restart / Logout
  if (url.pathname === '/logout' && req.method === 'POST') {
    try {
      if (sock) {
        await sock.logout().catch(() => {});
      }
      currentPairCode = null;
      currentPairPhone = null;
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      startWhatsApp();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Session di-reset. Silakan scan QR baru.' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: e.message }));
    }
    return;
  }

  // 5. Request Pairing Code (Alternative to QR Code)
  if (url.pathname === '/pair-code' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { phone } = JSON.parse(body || '{}');
        let clean = String(phone || '').replace(/\D/g, '');
        if (clean.startsWith('0')) clean = '62' + clean.slice(1);
        if (!sock) throw new Error('Socket belum siap');
        if (sock.authState?.creds?.registered) {
          throw new Error('Akun sudah terhubung. Klik Putus/Ganti Akun terlebih dahulu.');
        }
        console.log(`[WhatsApp Gateway] Meminta pairing code untuk nomor: ${clean}`);
        const code = await sock.requestPairingCode(clean);
        currentPairCode = code;
        currentPairPhone = clean;
        console.log(`[WhatsApp Gateway] Pairing code berhasil di-generate: ${code}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, code, phone: clean }));
      } catch (err) {
        console.error('[WhatsApp Gateway Pairing Code Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message || 'Gagal meminta pairing code' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 WhatsApp Baileys Gateway Server Aktif di:`);
  console.log(`👉 http://127.0.0.1:${PORT}`);
  console.log(`==================================================\n`);
  startWhatsApp();
});
