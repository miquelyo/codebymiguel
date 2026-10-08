'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
  email: string;
  name: string;
  avatar: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}

const DEMO_USER: User = {
  email:  'admin@admin.com',
  name:   'Miguel Admin',
  avatar: 'MA',
  role:   'Super Admin',
};

// ─── Cookie helpers (client-side) ───────────────────────────────
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}
// ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router                    = useRouter();

  // Cek cookie saat pertama load
  useEffect(() => {
    const raw = getCookieValue('admin_session');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        deleteCookie('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Trim whitespace untuk menghindari masalah spasi tersembunyi
      const trimmedEmail    = email.trim();
      const trimmedPassword = password.trim();

      // Jika kredensial supabase belum diisi (masih bawaan dari .env.local template)
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-url')) {
        await new Promise(r => setTimeout(r, 1000));

        if (trimmedEmail === 'admin@admin.com' && trimmedPassword === 'admin123') {
          setCookie('admin_session', JSON.stringify(DEMO_USER), 7);
          setUser(DEMO_USER);
          router.replace('/dashboard');
          return true;
        }
        return false;
      }

      // Supabase Auth (Menggunakan Authentication Email bawaan)
      try {
        console.log('[Auth] Mencoba login dengan Supabase untuk:', trimmedEmail);
        console.log('[Auth] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

        const { data, error } = await supabase.auth.signInWithPassword({
          email:    trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          console.error('[Auth] Supabase error detail:', {
            message: error.message,
            status:  error.status,
            name:    error.name,
          });
          return false;
        }

        if (!data.user) {
          console.error('[Auth] Login gagal: data.user null meski tidak ada error');
          return false;
        }

        console.log('[Auth] Login berhasil, user:', data.user.id);

        const loggedInUser: User = {
          email:  data.user.email || trimmedEmail,
          name:   data.user.user_metadata?.name || trimmedEmail.split('@')[0],
          avatar: trimmedEmail.charAt(0).toUpperCase(),
          role:   'Admin',
        };

        setCookie('admin_session', JSON.stringify(loggedInUser), 7);
        setUser(loggedInUser);
        router.replace('/dashboard');
        return true;
      } catch (err) {
        console.error('[Auth] Exception tidak terduga:', err);
        return false;
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    deleteCookie('admin_session');
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
