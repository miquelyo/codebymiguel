import { NextResponse } from 'next/server';
import { getUser2FASettings } from '@/lib/user-settings';

interface OtpData {
  code: string;
  expiresAt: number;
  attempts: number;
  phone: string;
}

// In-memory global store across requests in Node server runtime
const globalOtpStore = new Map<string, OtpData>();

function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return 'WhatsApp Anda';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-2);
  return `${prefix} •••• ••${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, identifier, code } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, message: 'Identitas user diperlukan' }, { status: 400 });
    }

    const key = identifier.toLowerCase().trim();
    const userSettings = getUser2FASettings(key);

    // ─── ACTION 0: CHECK IF 2FA IS ENABLED FOR THIS USER ─────────
    if (action === 'check') {
      return NextResponse.json({
        success: true,
        enabled: userSettings.wa2faEnabled,
        phone: userSettings.phone,
        maskedPhone: maskPhone(userSettings.phone),
      });
    }

    // ─── ACTION 1: SEND OTP ───────────────────────────────────────
    if (action === 'send') {
      const now = Date.now();
      const existing = globalOtpStore.get(key);

      // Rate limiting: can only request new OTP every 30 seconds
      if (existing && existing.expiresAt - now > 4.5 * 60 * 1000) {
        return NextResponse.json({
          success: false,
          message: 'Harap tunggu 30 detik sebelum meminta kode baru.',
        });
      }

      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = now + 5 * 60 * 1000; // Valid for 5 minutes

      // Determine destination phone dynamically for this specific user
      const targetPhone = userSettings.phone || process.env.ADMIN_WHATSAPP_PHONE || '081214412001';
      const gatewayUrl = process.env.WA_GATEWAY_URL || 'http://127.0.0.1:3001';

      globalOtpStore.set(key, {
        code: otp,
        expiresAt,
        attempts: 0,
        phone: targetPhone,
      });

      const otpMessage = `🔐 *KODE KEAMANAN CODEBYMIGUEL*\n\nKode verifikasi login Anda adalah: *${otp}*\n\nKode ini berlaku selama 5 menit. Jangan pernah membagikan kode ini kepada siapa pun demi keamanan akun Anda.`;

      // ─── 1. Kirim via Baileys WhatsApp Gateway Lokal (100% Gratis & Unlimited) ───
      try {
        const baileysRes = await fetch(`${gatewayUrl}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: targetPhone,
            message: otpMessage,
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (baileysRes.ok) {
          const baileysData = await baileysRes.json();
          if (baileysData.success) {
            console.log(`[Baileys WhatsApp Gateway] Sukses mengirim OTP ke ${targetPhone}`);
            return NextResponse.json({
              success: true,
              mode: 'whatsapp',
              provider: 'baileys',
              maskedPhone: maskPhone(targetPhone),
              message: `Kode autentikasi telah dikirim ke WhatsApp ${maskPhone(targetPhone)} via Baileys`,
            });
          }
        } else {
          const errData = await baileysRes.json().catch(() => ({}));
          return NextResponse.json(
            {
              success: false,
              message: errData.message || 'WhatsApp Gateway belum terhubung. Silakan scan QR terlebih dahulu di menu WhatsApp.',
            },
            { status: 503 }
          );
        }
      } catch (baileysErr: any) {
        console.warn('[Baileys Gateway] Belum terhubung / offline:', baileysErr?.message || baileysErr);
        return NextResponse.json(
          {
            success: false,
            message: 'Layanan WhatsApp Gateway offline. Harap buka http://localhost:3000/dashboard/whatsapp untuk menghubungkan WhatsApp.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Gagal mengirim kode ke WhatsApp. Pastikan perangkat WhatsApp Anda sudah terhubung.',
        },
        { status: 500 }
      );
    }

    // ─── ACTION 2: VERIFY OTP ─────────────────────────────────────
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ success: false, message: 'Kode OTP harus diisi' }, { status: 400 });
      }

      const otpEntry = globalOtpStore.get(key);

      if (!otpEntry) {
        return NextResponse.json({
          success: false,
          message: 'Kode OTP tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.',
        });
      }

      if (Date.now() > otpEntry.expiresAt) {
        globalOtpStore.delete(key);
        return NextResponse.json({
          success: false,
          message: 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan minta kode baru.',
        });
      }

      if (otpEntry.attempts >= 5) {
        globalOtpStore.delete(key);
        return NextResponse.json({
          success: false,
          message: 'Terlalu banyak percobaan salah. Silakan minta kode baru.',
        });
      }

      if (otpEntry.code !== code.trim()) {
        otpEntry.attempts += 1;
        globalOtpStore.set(key, otpEntry);
        return NextResponse.json({
          success: false,
          message: `Kode OTP salah. Sisa kesempatan: ${5 - otpEntry.attempts} kali.`,
        });
      }

      // Valid OTP: delete entry and return success
      globalOtpStore.delete(key);
      return NextResponse.json({
        success: true,
        message: 'Verifikasi 2FA berhasil!',
      });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('[OTP API Exception]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem saat memproses OTP.' }, { status: 500 });
  }
}
