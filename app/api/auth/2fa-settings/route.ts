import { NextResponse } from 'next/server';
import { getUser2FASettings, setUser2FASettings } from '@/lib/user-settings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || 'miguel';

    const settings = getUser2FASettings(user);
    return NextResponse.json({
      success: true,
      enabled: settings.wa2faEnabled,
      phone: settings.phone,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, enabled, phone } = body;

    if (!user) {
      return NextResponse.json({ success: false, message: 'Identitas user diperlukan' }, { status: 400 });
    }

    const payload: { wa2faEnabled?: boolean; phone?: string } = {};
    if (typeof enabled === 'boolean') payload.wa2faEnabled = enabled;
    if (typeof phone === 'string' && phone.trim() !== '') payload.phone = phone.trim();

    const updated = setUser2FASettings(user, payload);

    return NextResponse.json({
      success: true,
      enabled: updated.wa2faEnabled,
      phone: updated.phone,
      message: updated.wa2faEnabled
        ? 'Verifikasi WhatsApp (2FA) berhasil DIHIDUPKAN.'
        : 'Verifikasi WhatsApp (2FA) berhasil DIMATIKAN.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
