import fs from 'fs';
import path from 'path';

interface User2FASettings {
  wa2faEnabled: boolean;
  phone: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'user_settings.json');

function normalizeKey(identifier: string): string {
  const clean = identifier.toLowerCase().trim();
  // Map aliases like miguel/miquel to canonical key
  if (clean === 'miguel' || clean === 'miquel' || clean === 'yosafatmiquel@gmail.com') {
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

  // Fallback defaults for any user (OFF by default)
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
  const current = all[key] || {
    wa2faEnabled: false,
    phone: process.env.ADMIN_WHATSAPP_PHONE || '081214412001',
  };

  const updated: User2FASettings = {
    ...current,
    ...settings,
  };

  all[key] = updated;

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('[User Settings] Gagal menulis user_settings.json:', err);
  }

  return updated;
}
