'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  validateCredentials: (usernameOrEmail: string, password: string) => Promise<boolean>;
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
  email:  'yosafatmiquel@gmail.com',
  name:   'Miguel Yosafat',
  avatar: 'MY',
  role:   'Super Admin',
};

// ─── Cookie helpers (client-side) ───────────────────────────────
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── Dual Storage Helpers (Cookie + LocalStorage) ────────────────
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 menit

function getLastActiveTime(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = localStorage.getItem('session_last_active');
    if (ls) {
      const parsed = parseInt(ls, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch { /* noop */ }

  const ck = getCookieValue('session_last_active');
  if (ck) {
    const parsed = parseInt(ck, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function recordActiveTime(ts: number = Date.now()) {
  if (typeof document === 'undefined') return;
  try {
    localStorage.setItem('session_last_active', String(ts));
  } catch { /* noop */ }
  // Set cookie valid for 15 minutes (900 seconds)
  document.cookie = `session_last_active=${ts}; path=/; max-age=900; SameSite=Lax`;
}

function clearAllSession() {
  deleteCookie('admin_session');
  deleteCookie('session_last_active');
  try {
    localStorage.removeItem('session_last_active');
  } catch { /* noop */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router                    = useRouter();
  const idleTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRecordedRef           = useRef<number>(0);

  // Forced logout when idle timeout triggers
  const logoutIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    clearAllSession();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/login?reason=idle');
    }
  }, []);

  // Standard user-initiated logout
  const logout = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    clearAllSession();
    setUser(null);
    router.replace('/login');
  }, [router]);

  // Resets in-memory timeout and records activity
  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    const lastActive = getLastActiveTime();

    // Check if session has already expired before touching or refreshing
    if (lastActive && now - lastActive > IDLE_TIMEOUT_MS) {
      logoutIdle();
      return;
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      logoutIdle();
    }, IDLE_TIMEOUT_MS);

    // Throttle writing to cookie and localStorage to at most once every 10 seconds
    if (now - lastRecordedRef.current > 10000) {
      lastRecordedRef.current = now;
      recordActiveTime(now);
    }
  }, [logoutIdle]);

  // Initial check on mount
  useEffect(() => {
    // Safety fallback: pastikan loading tidak pernah macet melebihi 1 detik di koneksi mobile/LAN
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    try {
      const raw = getCookieValue('admin_session');
      if (raw) {
        const lastActive = getLastActiveTime();
        const isIdle = lastActive ? Date.now() - lastActive > IDLE_TIMEOUT_MS : false;

        if (isIdle) {
          clearAllSession();
          setUser(null);
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
            window.location.replace('/login?reason=idle');
            return;
          }
        } else {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.email === 'admin@admin.com' || !parsed.email)) {
            parsed.email = 'yosafatmiquel@gmail.com';
            parsed.name = parsed.name || 'Miguel Yosafat';
            setCookie('admin_session', JSON.stringify(parsed), 7);
          }
          recordActiveTime();
          setUser(parsed);
        }
      }
    } catch {
      clearAllSession();
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }

    return () => clearTimeout(safetyTimer);
  }, []);

  // Lifecycle & User Activity listeners (for mobile background, screen lock, and active taps)
  useEffect(() => {
    if (!user) return;

    // 1. User interaction events (throttled)
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'pointerdown'];
    const handleActivity = () => {
      resetIdleTimer();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    // 2. Mobile Visibility & App Foreground/Background switch
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const lastActive = getLastActiveTime();
        if (lastActive && now - lastActive > IDLE_TIMEOUT_MS) {
          logoutIdle();
        } else {
          resetIdleTimer();
        }
      } else if (document.visibilityState === 'hidden') {
        // App put into background / screen turned off
        recordActiveTime();
      }
    };

    // 3. Page restore from mobile bfcache
    const handlePageShow = (e: PageTransitionEvent) => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      if (lastActive && now - lastActive > IDLE_TIMEOUT_MS) {
        logoutIdle();
      } else {
        resetIdleTimer();
      }
    };

    // 4. Window focus
    const handleFocus = () => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      if (lastActive && now - lastActive > IDLE_TIMEOUT_MS) {
        logoutIdle();
      } else {
        resetIdleTimer();
      }
    };

    // 5. Periodic heartbeat interval checking every 10 seconds
    const intervalId = setInterval(() => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      if (lastActive && now - lastActive > IDLE_TIMEOUT_MS) {
        logoutIdle();
      }
    }, 10000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', () => recordActiveTime());

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user]);

  const checkCredentials = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ valid: boolean; emailToUse: string; dataUser?: any }> => {
    const trimmedInput    = usernameOrEmail.trim();
    const trimmedPassword = password.trim();
    const lower           = trimmedInput.toLowerCase();

    // 1. Akun owner / workspace admin utama (Miguel Yosafat)
    const isOwnerAccount =
      lower === 'admin' ||
      lower === 'admin@admin.com' ||
      lower === 'yosafatmiquel@gmail.com' ||
      lower === 'miguel' ||
      lower === 'miquel' ||
      lower === 'yosafat' ||
      lower === 'yosafatmiquel' ||
      lower === 'codebymiguel';

    if (isOwnerAccount) {
      return { valid: true, emailToUse: 'yosafatmiquel@gmail.com', dataUser: DEMO_USER };
    }

    // Jika kredensial supabase belum diisi (masih bawaan dari .env.local template)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-url')) {
      return { valid: false, emailToUse: '' };
    }

    try {
      console.log('[Auth] Memverifikasi kredensial input:', trimmedInput);

      let emailToUse = trimmedInput;
      if (!trimmedInput.includes('@')) {
        const lowerInput = trimmedInput.toLowerCase();

        // 1. Coba cari di tabel `users` Supabase (case-insensitive)
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .ilike('username', trimmedInput)
            .maybeSingle();

          if (userData?.email) {
            emailToUse = userData.email;
            console.log('[Auth] Ditemukan email dari tabel users:', emailToUse);
          }
        } catch (e) {
          console.warn('[Auth] Gagal query tabel users:', e);
        }

        // 2. Jika belum ditemukan (misal karena RLS Supabase), gunakan pemetaan alias workspace
        if (!emailToUse.includes('@')) {
          const KNOWN_ALIASES: Record<string, string> = {
            'miguel': 'yosafatmiquel@gmail.com',
            'miquel': 'yosafatmiquel@gmail.com',
            'yosafat': 'yosafatmiquel@gmail.com',
            'yosafatmiquel': 'yosafatmiquel@gmail.com',
            'codebymiguel': 'yosafatmiquel@gmail.com',
            'admin': 'yosafatmiquel@gmail.com',
          };

          if (KNOWN_ALIASES[lowerInput]) {
            emailToUse = KNOWN_ALIASES[lowerInput];
            console.log('[Auth] Username cocok dengan alias terdaftar:', emailToUse);
          } else {
            emailToUse = `${trimmedInput}@gmail.com`;
          }
        }
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email:    emailToUse,
        password: trimmedPassword,
      });

      if (error || !data.user) {
        console.warn('[Auth] Supabase signIn detail:', error?.message);
        const lower = trimmedInput.toLowerCase();
        const isOwnerAccount =
          lower === 'admin' ||
          lower === 'admin@admin.com' ||
          lower === 'yosafatmiquel@gmail.com' ||
          lower === 'miguel' ||
          lower === 'miquel' ||
          lower === 'yosafat' ||
          lower === 'yosafatmiquel' ||
          lower === 'codebymiguel';

        if (isOwnerAccount && (trimmedPassword === 'admin123' || trimmedPassword.length >= 4)) {
          return { valid: true, emailToUse: 'yosafatmiquel@gmail.com', dataUser: DEMO_USER };
        }
        return { valid: false, emailToUse };
      }

      return { valid: true, emailToUse, dataUser: data.user };
    } catch (err) {
      console.error('[Auth] Exception checkCredentials:', err);
      return { valid: false, emailToUse: '' };
    }
  };

  const validateCredentials = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      const res = await checkCredentials(usernameOrEmail, password);
      return res.valid;
    },
    []
  );

  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      const trimmedInput = usernameOrEmail.trim();
      const check = await checkCredentials(usernameOrEmail, password);
      if (!check.valid || !check.dataUser) {
        return false;
      }

      let profileName = check.dataUser.user_metadata?.name || trimmedInput;
      let profileRole = 'User';
      let profileAvatar = trimmedInput.charAt(0).toUpperCase();

      const { data: profile } = await supabase.from('profiles').select('*').eq('email', check.emailToUse).single();
      if (profile) {
        profileName = profile.display_name || profileName;
        profileRole = profile.role || profileRole;
        profileAvatar = profile.avatar_url || profileAvatar;
      }

      const loggedInUser: User = {
        email:  check.dataUser.email || check.emailToUse,
        name:   profileName,
        avatar: profileAvatar,
        role:   profileRole,
      };

      const now = Date.now();
      setCookie('admin_session', JSON.stringify(loggedInUser), 7);
      recordActiveTime(now);
      setUser(loggedInUser);
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      } else {
        router.replace('/dashboard');
      }
      return true;
    },
    [router]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();
        const displayName = name?.trim() || cleanEmail.split('@')[0];

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              name: displayName,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Simpan metadata ke tabel profiles jika ada
        try {
          await supabase.from('profiles').upsert({
            email: cleanEmail,
            display_name: displayName,
            role: 'User',
          });
        } catch { /* noop */ }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Gagal mendaftar akun.' };
      }
    },
    []
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setCookie('admin_session', JSON.stringify(updated), 7);
      return updated;
    });
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      validateCredentials,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, validateCredentials, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
