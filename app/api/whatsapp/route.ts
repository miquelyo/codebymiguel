import { NextResponse } from 'next/server';
import { ensureWhatsAppGateway } from '@/lib/whatsapp-auto';

const GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://127.0.0.1:3001';

export async function GET() {
  try {
    // Pastikan gateway menyala otomatis jika sebelumnya mati
    await ensureWhatsAppGateway();

    const statusRes = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
      cache: 'no-store',
    });

    if (!statusRes.ok) {
      return NextResponse.json({
        running: false,
        status: 'offline',
        message: 'WhatsApp Gateway tidak merespon.',
      });
    }

    const statusData = await statusRes.json();

    let qrDataUrl = null;
    let qr = null;
    if (statusData.hasQr || statusData.status === 'scan_qr') {
      try {
        const qrRes = await fetch(`${GATEWAY_URL}/qr`, {
          method: 'GET',
          signal: AbortSignal.timeout(2500),
          cache: 'no-store',
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrDataUrl = qrData.qrDataUrl;
          qr = qrData.qr;
        }
      } catch (e) {
        // ignore
      }
    }

    const targetPhone = process.env.ADMIN_WHATSAPP_PHONE || '081214412001';

    return NextResponse.json({
      running: true,
      status: statusData.status,
      user: statusData.user,
      hasQr: statusData.hasQr,
      qrDataUrl,
      qr,
      pairCode: statusData.pairCode || null,
      pairPhone: statusData.pairPhone || null,
      targetPhone,
    });
  } catch (error: any) {
    return NextResponse.json({
      running: false,
      status: 'offline',
      message: 'Layanan WhatsApp Gateway offline. Jalankan: npm run wa di terminal.',
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const targetPhone = process.env.ADMIN_WHATSAPP_PHONE || '081214412001';

    if (action === 'test') {
      const nowFormatted = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const sendRes = await fetch(`${GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          message: `🚀 *CODEBYMIGUEL | UJI COBA GATEWAY*
━━━━━━━━━━━━━━━━━━━━━

Halo, *Miguel*! 👋

Koneksi *WhatsApp Gateway Baileys* di *CodebyMiguel* berhasil terhubung 100% dan siap mengirimkan kode OTP secara instan!

📱 *Nomor Pengirim (Bot):* 08993210362
🎯 *Nomor Penerima (Utama):* ${targetPhone}
⚡ *Status Layanan:* Siap Kirim OTP
⏱️ *Waktu Uji Coba:* ${nowFormatted} WIB

━━━━━━━━━━━━━━━━━━━━━
_Pesan otomatis dari sistem keamanan CodebyMiguel. Mohon jangan membalas pesan ini._`,
        }),
        signal: AbortSignal.timeout(6000),
      });

      const sendData = await sendRes.json();
      return NextResponse.json(sendData, { status: sendRes.status });
    }

    if (action === 'logout') {
      const logoutRes = await fetch(`${GATEWAY_URL}/logout`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      });
      const logoutData = await logoutRes.json();
      return NextResponse.json(logoutData);
    }

    if (action === 'pair_code') {
      const { phone } = body;
      const pairRes = await fetch(`${GATEWAY_URL}/pair-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(10000),
      });
      const pairData = await pairRes.json();
      return NextResponse.json(pairData, { status: pairRes.status });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Gagal memproses aksi WhatsApp: ${err.message}` },
      { status: 500 }
    );
  }
}
