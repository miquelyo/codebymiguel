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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/* ─────────────────────── Nav config ────────────────────────── */
const NAV = [
  { label: 'Dashboard', shortLabel: 'Home', href: '/dashboard', icon: GridIcon, badge: null },
  { label: 'Absensi', shortLabel: 'Absen', href: '/dashboard/attendance', icon: AttendanceIcon, isHero: true },
  { label: 'Notes', shortLabel: 'Notes', href: '/dashboard/notes', icon: NoteIcon, badge: null },
  { label: 'Agenda & Events', shortLabel: 'Agenda', href: '/dashboard/agenda', icon: CalendarIcon, badge: null },
  { label: 'AI Agent Tracker', shortLabel: 'AI Model', href: '/dashboard/ai-tracker', icon: SparklesIcon, badge: 'AI' },
];

function getPageInfo(pathname: string): { title: string; subtitle: string } {
  const match = NAV.find((n) => n.href === pathname);
  if (match) return { title: match.label, subtitle: 'Pusat Kendali Workspace' };
  if (pathname.includes('/profile')) return { title: 'Profil Pengguna', subtitle: 'Pengaturan Akun' };
  return { title: 'Dashboard', subtitle: 'Pusat Kendali Workspace' };
}

/* ─────────────────────── Layout ────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageInfo = getPageInfo(pathname);

  // Sync dark mode
  useEffect(() => {
    // Check saved theme or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  // Close dropdowns on outside click
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
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <CodeIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-semibold text-muted tracking-wide uppercase">Memuat Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <div className="hidden lg:block shrink-0 w-[270px]" />
      <aside
        className="hidden lg:flex fixed top-3 left-3 bottom-3 z-50 w-[252px] flex-col bg-surface rounded-3xl sidebar-float transition-all duration-300"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 h-[72px] px-5 border-b border-border/60 shrink-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <CodeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[15px] font-bold text-foreground tracking-tight truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                CodebyMiguel
              </span>
            </div>
            <span className="text-[11px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pro Workspace
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted/60 px-3 mb-2.5">
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
                      flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium
                      transition-all duration-200 group relative
                      ${
                        active
                          ? 'text-white shadow-md shadow-primary/20 font-semibold'
                          : 'text-muted hover:text-foreground hover:bg-surface-hover'
                      }
                    `}
                    style={active ? { background: 'var(--gradient-primary)' } : {}}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        active ? 'text-white' : 'text-muted group-hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="flex-1 truncate">{label}</span>

                    {badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {badge}
                      </span>
                    )}

                    {isHero && !active && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar bottom profile pill */}
        <div className="p-3 border-t border-border/60 shrink-0">
          <div className="p-2.5 rounded-2xl bg-surface-hover/70 border border-border/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-primary shrink-0 overflow-hidden shadow-sm">
              {user.avatar.length > 2 ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.avatar
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted truncate">{user.role}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar Akun"
              className="p-1.5 rounded-xl text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ══════════ TOPBAR HEADER ══════════ */}
        <header className="sticky top-2 sm:top-3 z-30 mx-2 sm:mx-4 rounded-2xl sm:rounded-3xl glass flex items-center justify-between px-3.5 sm:px-5 shrink-0 gap-3 h-[60px] sm:h-[64px] transition-all">
          {/* Mobile Top Header */}
          <div className="flex items-center gap-2.5 lg:hidden min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="relative flex items-center gap-2 p-1 rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-primary overflow-hidden shadow-sm">
                {user.avatar.length > 2 ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.avatar
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-card" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[13px] font-bold text-foreground flex items-center gap-1">
                  Hai, {firstName}
                  <span className="text-[12px]">✨</span>
                </span>
                <span className="text-[10px] text-muted font-medium block truncate max-w-[120px]">
                  {pageInfo.title}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Left: Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-semibold text-muted">Workspace</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-muted/40" />
            <h2
              className="text-sm font-bold text-foreground truncate"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {pageInfo.title}
            </h2>
          </div>

          {/* Desktop Center: Search bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-auto">
            <div className="relative w-full group">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none group-focus-within:text-primary transition-colors" />
              <input
                id="topbar-search"
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Cari menu, catatan, agenda..."
                className="w-full h-9.5 pl-10 pr-11 rounded-2xl text-[13px] bg-surface/80 border border-border/80 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-foreground/20 transition-all duration-200"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted/40 bg-surface-hover border border-border/70 px-1.5 py-0.5 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Controls: Theme + Notifications + Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle Pill */}
            <button
              id="theme-toggle"
              type="button"
              onClick={handleToggleTheme}
              title={dark ? 'Mode Terang' : 'Mode Gelap'}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-muted hover:text-foreground hover:bg-surface-hover border border-transparent hover:border-border/60 transition-all"
            >
              {dark ? <SunIcon className="w-4.5 h-4.5 text-amber-400" /> : <MoonIcon className="w-4.5 h-4.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notifications-button"
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-muted hover:text-foreground hover:bg-surface-hover border border-transparent hover:border-border/60 transition-all"
              >
                <BellIcon className="w-4.5 h-4.5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-surface-hover/50">
                      <span className="text-xs font-bold text-foreground">Notifikasi</span>
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        1 Baru
                      </span>
                    </div>
                    <div className="divide-y divide-border/50">
                      <div className="p-3.5 hover:bg-surface-hover/50 transition-colors cursor-pointer flex gap-3 items-start">
                        <span className="text-lg">⏰</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground">Pengingat Absensi</p>
                          <p className="text-[11px] text-muted mt-0.5">Jangan lupa lakukan absensi harian Anda hari ini.</p>
                          <span className="text-[9px] text-muted/60 mt-1 inline-block">Baru saja</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Profile Dropdown */}
            <div className="hidden lg:block relative" ref={profileRef}>
              <button
                id="profile-button"
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-2xl hover:bg-surface-hover border border-transparent hover:border-border/60 transition-all"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-primary overflow-hidden shadow-sm">
                  {user.avatar.length > 2 ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.avatar
                  )}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted">{user.role}</p>
                </div>
                <ChevronRightIcon
                  className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                    profileOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <div className="p-3 rounded-2xl bg-surface-hover/70 mb-1 border border-border/50">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <AttendanceIcon className="w-4 h-4 text-primary" />
                      <span>Edit Profil</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ══════════ PAGE CONTENT ══════════ */}
        {/* pb-28 gives ample room for the floating mobile bottom nav */}
        <main className="flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-6 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ══════════ FLOATING MOBILE BOTTOM NAVIGATION ══════════ */}
      {/* Eye-candy, glassmorphic, iOS-like floating bar for mobile */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto lg:hidden"
      >
        <div className="bottom-nav-glass rounded-3xl p-1.5 flex items-center justify-around shadow-2xl">
          {NAV.map(({ label, shortLabel, href, icon: Icon, isHero }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all select-none group"
              >
                {/* Active Indicator Capsule */}
                {active && (
                  <motion.div
                    layoutId="mobileActivePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-2xl bg-primary/15 dark:bg-primary/20 border border-primary/20"
                  />
                )}

                {/* Icon wrapper */}
                <div
                  className={`relative z-10 transition-transform duration-200 ${
                    active ? 'scale-110 text-primary' : 'text-muted group-hover:text-foreground'
                  }`}
                >
                  {isHero && !active ? (
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Text Label */}
                <span
                  className={`relative z-10 text-[10px] font-bold tracking-tight mt-0.5 transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-muted/70 group-hover:text-foreground'
                  }`}
                >
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ══════════ MOBILE PROFILE DRAWER ══════════ */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute bottom-0 inset-x-0 bg-card rounded-t-3xl border-t border-border p-6 shadow-2xl max-w-md mx-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-muted/30 mx-auto mb-5" />

              <div className="flex items-center gap-3.5 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0 overflow-hidden shadow-md"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {user.avatar.length > 2 ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.avatar
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-foreground truncate">{user.name}</h4>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-hover/80 border border-border/60 text-xs font-semibold text-foreground active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <AttendanceIcon className="w-4 h-4" />
                    </div>
                    <span>Pengaturan Profil</span>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-muted" />
                </Link>

                <div
                  onClick={handleToggleTheme}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-hover/80 border border-border/60 text-xs font-semibold text-foreground cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </div>
                    <span>{dark ? 'Mode Gelap (Aktif)' : 'Mode Terang (Aktif)'}</span>
                  </div>
                  <span className="text-[10px] text-muted font-bold px-2 py-1 rounded-lg bg-surface border border-border">
                    Ubah
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full py-3 rounded-2xl bg-danger/10 text-danger font-semibold text-xs flex items-center justify-center gap-2 hover:bg-danger/20 active:scale-[0.98] transition-all"
              >
                <LogoutIcon className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
