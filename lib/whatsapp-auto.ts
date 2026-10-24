import { spawn } from 'child_process';
import path from 'path';

let isStarting = false;

export async function ensureWhatsAppGateway(): Promise<boolean> {
  const GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://127.0.0.1:3001';

  // 1. Cek apakah gateway port 3001 sudah aktif merespon
  try {
    const res = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(1200),
      cache: 'no-store',
    });
    if (res.ok) {
      return true;
    }
  } catch {
    // Service offline, lanjutkan ke auto-start
  }

  if (isStarting) {
    return false;
  }
  isStarting = true;

  try {
    console.log('[WhatsApp Auto-Start] Gateway belum berjalan di port 3001, memulai proses di latar belakang...');
    const scriptPath = path.join(process.cwd(), 'scripts', 'whatsapp-service.mjs');
    
    const child = spawn(process.execPath, [scriptPath], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
      env: process.env,
    });
    child.unref();

    // Tunggu hingga gateway siap (maksimal 4 detik)
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const check = await fetch(`${GATEWAY_URL}/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000),
          cache: 'no-store',
        });
        if (check.ok) {
          console.log('[WhatsApp Auto-Start] Gateway berhasil aktif!');
          isStarting = false;
          return true;
        }
      } catch {
        // belum siap, loop lagi
      }
    }
  } catch (err) {
    console.error('[WhatsApp Auto-Start] Gagal menjalankan child process:', err);
  } finally {
    isStarting = false;
  }

  return false;
}
