'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────── Icons ─────────────────────────────── */
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function AttendanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3m0 0l-1.5-1.5m1.5 1.5l1.5-1.5" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

/* ─────────────────────── Nav config ────────────────────────── */
const NAV = [
  { label: 'Dashboard', shortLabel: 'Home', href: '/dashboard', icon: GridIcon, badge: null },
  { label: 'Notes & Tugas', shortLabel: 'Notes', href: '/dashboard/notes', icon: NoteIcon, badge: null },
  { label: 'Absensi Wajah AI', shortLabel: 'Absen', href: '/dashboard/attendance', icon: AttendanceIcon, isHero: true, badge: 'Live' },
  { label: 'Agenda & Events', shortLabel: 'Agenda', href: '/dashboard/agenda', icon: CalendarIcon, badge: null },
  { label: 'AI Agent Tracker', shortLabel: 'AI Radar', href: '/dashboard/ai-tracker', icon: SparklesIcon, badge: 'Radar' },
];

function getPageInfo(pathname: string): { title: string; subtitle: string } {
  const match = NAV.find((n) => n.href === pathname);
  if (match) return { title: match.label, subtitle: 'Pusat Kendali Operasional' };
  if (pathname.includes('/profile')) return { title: 'Profil Akun', subtitle: 'Informasi & Kredensial Keamanan' };
  return { title: 'Dashboard', subtitle: 'Pusat Kendali Operasional' };
}

/* ─────────────────────── Layout ────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState<string>('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageInfo = getPageInfo(pathname);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 shadow-xl shadow-indigo-500/25 animate-pulse">
            <CodeIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-semibold text-muted tracking-widest uppercase">
            Memuat Workspace...
          </span>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-4 left-4 bottom-4 z-40 w-[265px] flex-col rounded-3xl glass-panel p-4 overflow-hidden border border-border/70 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 shadow-md shadow-indigo-500/30">
            <CodeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-foreground tracking-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              CodebyMiguel
            </span>
            <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Workspace
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted/60 px-3 mb-2">
            Menu Utama
          </p>
          <ul className="space-y-1.5">
            {NAV.map(({ label, href, icon: Icon, badge, isHero }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] font-medium
                      transition-all duration-200 group relative
                      ${
                        active
                          ? 'text-white shadow-lg shadow-indigo-500/25 font-semibold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500'
                          : 'text-muted hover:text-foreground hover:bg-surface-hover/80'
                      }
                    `}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        active ? 'text-white' : 'text-muted group-hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 truncate">{label}</span>

                    {badge && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          active
                            ? 'bg-white/20 text-white border border-white/30'
                            : isHero
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* System Telemetry Capsule */}
        <div className="my-3 p-3.5 rounded-2xl bg-surface/50 border border-border/60 text-xs space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold">Security Shield</span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
          </div>
          <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full w-[94%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>Face AI Descriptors</span>
            <span className="font-mono font-medium text-foreground">v0.22</span>
          </div>
        </div>

        {/* User Profile Mini Bar */}
        <div className="pt-2 border-t border-border/60">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-surface-hover transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shrink-0 overflow-hidden">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.avatar || 'MA'
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {user.name}
              </span>
              <span className="text-[10px] text-muted truncate">{user.role || 'Super Admin'}</span>
            </div>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-muted group-hover:text-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main Content Shell ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[295px] pb-32 lg:pb-8">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between glass-panel border-b border-border/60 backdrop-blur-xl">
          {/* Left: Mobile Brand & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="lg:hidden w-8.5 h-8.5 rounded-xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <CodeIcon className="w-4.5 h-4.5" />
            </div>

            <div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-primary">{pageInfo.title}</span>
              </div>
              <h1 className="text-sm sm:text-xl font-extrabold tracking-tight text-foreground truncate max-w-[130px] sm:max-w-none" style={{ fontFamily: 'var(--font-heading)' }}>
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right: Clock, Theme Switch, Notification, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Live Clock Pill */}
            {time && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/70 border border-border/70 text-xs font-mono font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{time}</span>
                <span className="text-[10px] text-muted font-sans font-semibold">WIB</span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-muted hover:text-foreground bg-surface/80 hover:bg-surface-hover border border-border/70 transition-all cursor-pointer shadow-sm"
              title={dark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {dark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SunIcon className="w-4.5 h-4.5 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MoonIcon className="w-4.5 h-4.5 text-indigo-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-muted hover:text-foreground bg-surface/80 hover:bg-surface-hover border border-border/70 transition-all cursor-pointer relative shadow-sm"
              >
                <BellIcon className="w-4.5 h-4.5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-background" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-[-10px] sm:right-0 mt-3 w-[min(340px,calc(100vw-2rem))] sm:w-96 rounded-3xl glass-panel p-4 shadow-2xl border border-border/80 z-50"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <span className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                        Notifikasi & Update
                      </span>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        3 Baru
                      </span>
                    </div>
                    <div className="py-2 divide-y divide-border/40 max-h-72 overflow-y-auto">
                      <div className="py-2.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <AttendanceIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">Sistem Absensi Aktif</p>
                          <p className="text-[11px] text-muted">Verifikasi biometrik siap digunakan hari ini.</p>
                          <span className="text-[10px] text-muted/60 mt-1 block">Baru saja</span>
                        </div>
                      </div>

                      <div className="py-2.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                          <SparklesIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">AI Agent Status OK</p>
                          <p className="text-[11px] text-muted">Semua model AI terpantau normal tanpa kendala.</p>
                          <span className="text-[10px] text-muted/60 mt-1 block">15m lalu</span>
                        </div>
                      </div>

                      <div className="py-2.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                          <NoteIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">Sinkronisasi Cloud Aktif</p>
                          <p className="text-[11px] text-muted">Catatan dan event tersimpan otomatis di Supabase.</p>
                          <span className="text-[10px] text-muted/60 mt-1 block">1 jam lalu</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-2xl bg-surface/80 hover:bg-surface-hover border border-border/70 transition-all cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-sm overflow-hidden shrink-0">
                  {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.avatar || 'MA'
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[100px] truncate">
                  {firstName}
                </span>
                <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-60 max-w-[calc(100vw-2rem)] rounded-3xl glass-panel p-2 shadow-2xl border border-border/80 z-50"
                  >
                    <div className="px-3 py-2.5 mb-1 border-b border-border/60">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-muted" />
                      <span>Pengaturan Profil</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors mt-1 cursor-pointer"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── Single Unified Mobile Floating Bottom Navigation ─────── */}
      <nav
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-md z-40 rounded-3xl floating-bottom-nav px-2 py-2 flex items-center justify-between shadow-2xl border border-border/80"
      >
        {NAV.map(({ shortLabel, href, icon: Icon, isHero }) => {
          const active = pathname === href;

          if (isHero) {
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center group relative -mt-6"
              >
                <div
                  className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                    active
                      ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white shadow-indigo-500/40 ring-4 ring-background scale-105'
                      : 'bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-indigo-500/30 ring-4 ring-background hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight ${active ? 'text-primary' : 'text-muted'}`}>
                  {shortLabel}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-2xl transition-all relative ${
                active ? 'text-primary font-bold' : 'text-muted hover:text-foreground'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted group-hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{shortLabel}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary absolute bottom-0.5" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
