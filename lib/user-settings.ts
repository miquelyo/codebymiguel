import fs from 'fs';
import path from 'path';

interface User2FASettings {
  wa2faEnabled: boolean;
  phone: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'user_settings.json');

const ADMIN_ALIASES = new Set([
  'miguel',
  'miquel',
  'yosafat',
  'yosafatmiquel',
  'yosafatmiquel@gmail.com',
  'codebymiguel',
  'admin',
  'admin@admin.com',
  'default',
  '',
]);

export function normalizeKey(identifier: string = ''): string {
  const clean = (identifier || '').toLowerCase().trim();
  if (
    !clean ||
    ADMIN_ALIASES.has(clean) ||
    clean.startsWith('admin') ||
    clean.includes('miguel') ||
    clean.includes('miquel') ||
    clean.includes('yosafat')
  ) {
    return 'miguel';
  }
  return clean;
}

export function getAllUserSettings(): Record<string, User2FASettings> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.error('[User Settings] Gagal membaca user_settings.json:', err);
  }

  // Default initial configuration for Miguel (OFF by default)
  return {
    miguel: {
      wa2faEnabled: false,
      phone: process.env.ADMIN_WHATSAPP_PHONE || '081214412001',
    },
  };
}

export function getUser2FASettings(identifier: string): User2FASettings {
  const all = getAllUserSettings();
  const key = normalizeKey(identifier);

  if (all[key]) {
    return all[key];
  }

  // Fallback ke canonical key 'miguel' jika key variasi belum ada
  if (all['miguel']) {
    return all['miguel'];
  }

  // Fallback defaults for any user
  const defaultPhone = process.env.ADMIN_WHATSAPP_PHONE || '081214412001';
  return {
    wa2faEnabled: false,
    phone: defaultPhone,
  };
}

export function setUser2FASettings(
  identifier: string,
  settings: Partial<User2FASettings>
): User2FASettings {
  const all = getAllUserSettings();
  const key = normalizeKey(identifier);
  const current = all[key] || all['miguel'] || {
    wa2faEnabled: false,
    phone: process.env.ADMIN_WHATSAPP_PHONE || '081214412001',
  };

  const updated: User2FASettings = {
    ...current,
    ...settings,
  };

  all[key] = updated;

  // Sinkronkan ke canonical key dan alias umum agar selalu konsisten
  if (key === 'miguel') {
    all['miguel'] = updated;
    all['admin'] = updated;
    all['admin@admin.com'] = updated;
    all['yosafatmiquel@gmail.com'] = updated;
  }

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('[User Settings] Gagal menulis user_settings.json:', err);
  }

  return updated;
}
