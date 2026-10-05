import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Buat client dengan dummy string jika belum diset di .env
// (Ini mencegah error crash saat aplikasi pertama kali dimuat tanpa .env)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
