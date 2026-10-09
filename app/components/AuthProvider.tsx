'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
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

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router                    = useRouter();
  const idleTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setUser(prev => {
        if (prev) {
          deleteCookie('admin_session');
          deleteCookie('session_last_active');
          window.location.href = '/login?reason=idle';
        }
        return null;
      });
    }, IDLE_TIMEOUT_MS);
    document.cookie = `session_last_active=${Date.now()}; path=/; SameSite=Lax`;
  }, []);

  // Cek cookie saat pertama load, periksa apakah sesi idle terlalu lama
  useEffect(() => {
    const raw = getCookieValue('admin_session');
    if (raw) {
      try {
        const lastActive = getCookieValue('session_last_active');
        const isIdle = lastActive && Date.now() - parseInt(lastActive) > IDLE_TIMEOUT_MS;
        if (isIdle) {
          deleteCookie('admin_session');
          deleteCookie('session_last_active');
        } else {
          setUser(JSON.parse(raw));
        }
      } catch {
        deleteCookie('admin_session');
      }
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pasang idle timer saat user login
  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      const trimmedInput    = usernameOrEmail.trim();
      const trimmedPassword = password.trim();

      // Jika kredensial supabase belum diisi (masih bawaan dari .env.local template)
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-url')) {
        await new Promise(r => setTimeout(r, 1000));

        if ((trimmedInput === 'admin' || trimmedInput === 'admin@admin.com') && trimmedPassword === 'admin123') {
          setCookie('admin_session', JSON.stringify(DEMO_USER), 7);
          setUser(DEMO_USER);
          router.replace('/dashboard');
          return true;
        }
        return false;
      }

      try {
        console.log('[Auth] Mencoba login dengan input:', trimmedInput);
        
        let emailToUse = trimmedInput;
        // Check if input is a username (doesn't contain '@')
        if (!trimmedInput.includes('@')) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('username', trimmedInput)
            .single();

          if (userError || !userData) {
            console.error('[Auth] Username tidak ditemukan:', userError?.message);
            return false;
          }
          emailToUse = userData.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email:    emailToUse,
          password: trimmedPassword,
        });

        if (error || !data.user) {
          console.error('[Auth] Supabase error detail:', error?.message);
          return false;
        }

        console.log('[Auth] Login berhasil, user:', data.user.id);

        let profileName = data.user.user_metadata?.name || trimmedInput;
        let profileRole = 'User';
        let profileAvatar = trimmedInput.charAt(0).toUpperCase();

        const { data: profile } = await supabase.from('profiles').select('*').eq('email', emailToUse).single();
        if (profile) {
          profileName = profile.display_name || profileName;
          profileRole = profile.role || profileRole;
          profileAvatar = profile.avatar_url || profileAvatar;
        }

        const loggedInUser: User = {
          email:  data.user.email || emailToUse,
          name:   profileName,
          avatar: profileAvatar,
          role:   profileRole,
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
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    deleteCookie('admin_session');
    deleteCookie('session_last_active');
    setUser(null);
    router.replace('/login');
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setCookie('admin_session', JSON.stringify(updated), 7);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
