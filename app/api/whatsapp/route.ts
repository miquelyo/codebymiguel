import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://127.0.0.1:3001';

export async function GET() {
  try {
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
      const sendRes = await fetch(`${GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          message: `👋 *Halo Miguel!*\n\nKoneksi WhatsApp Gateway Baileys di *CodeByMiguel* berhasil terhubung 100% dan siap mengirimkan kode OTP secara instan & tanpa batas!\n\nWaktu: ${new Date().toLocaleString('id-ID')}`,
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

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Gagal memproses aksi WhatsApp: ${err.message}` },
      { status: 500 }
    );
  }
}
