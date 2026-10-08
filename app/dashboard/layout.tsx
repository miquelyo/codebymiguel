'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─────────────────────── Icons ─────────────────────────────── */
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375c0 .621-.504 1.125-1.125 1.125H6.75A1.125 1.125 0 015.625 19.5V10.125c0-.621.504-1.125 1.125-1.125z" />
    </svg>
  );
}
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
  { label: 'Dashboard',        href: '/dashboard',               icon: GridIcon           },
  { label: 'Absensi',          href: '/dashboard/attendance',    icon: ClipboardCheckIcon },
  { label: 'Notes',            href: '/dashboard/notes',         icon: NoteIcon           },
];

/* Helper: get page label from pathname */
function getPageInfo(pathname: string): { title: string; subtitle: string } {
  const match = NAV.find(n => n.href === pathname);
  if (match) return { title: match.label, subtitle: 'Selamat datang kembali 👋' };
  return { title: 'Halaman', subtitle: '' };
}

/* ─────────────────────── Layout ────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [dark, setDark]                 = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [searchVal, setSearchVal]       = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const pageInfo = getPageInfo(pathname);

  // Toggle dark mode on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black dark:bg-white">
            <CodeIcon className="w-5 h-5 text-white dark:text-black" />
          </div>
          <svg className="w-5 h-5 animate-spin text-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Mobile backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[240px]
          border-r border-border flex flex-col bg-surface
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-[70px] px-5 border-b border-border/50 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-foreground">
            <CodeIcon className="w-4.5 h-4.5 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
              CodebyMiguel
            </span>
            <span className="text-[10px] text-muted/50 font-medium" style={{ letterSpacing: '0.02em' }}>
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-6 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted/40 px-3 mb-3">
            Menu Utama
          </p>
          <ul className="space-y-1">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                      transition-all duration-200 group relative
                      ${active
                        ? 'text-background bg-foreground'
                        : 'text-muted hover:text-foreground hover:bg-surface-hover'}
                    `}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200
                      ${active ? 'text-background' : 'bg-transparent text-muted group-hover:text-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar bottom */}
        <div className="px-4 py-4 border-t border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <p className="text-[11px] text-muted/50">v1.0.0 · CodebyMiguel</p>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ══════════ TOPBAR ══════════ */}
        <header className="sticky top-0 z-30 h-[70px] glass
                           flex items-center justify-between px-4 lg:px-6 shrink-0 gap-4"
                style={{ borderBottom: '1px solid var(--border-color)' }}>

          {/* LEFT — mobile toggle + page breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-muted hover:bg-surface-hover hover:text-foreground transition-all shrink-0"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Page title breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-[12px] text-muted font-medium shrink-0">CodebyMiguel</span>
              <ChevronRightIcon className="w-3 h-3 text-muted/30 shrink-0" />
              <span
                className="text-[14px] font-bold text-foreground truncate"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                {pageInfo.title}
              </span>
            </div>
            {/* Mobile: just page title */}
            <span
              className="sm:hidden text-[15px] font-bold text-foreground"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              {pageInfo.title}
            </span>
          </div>

          {/* CENTER — Search bar */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full group">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none
                                     group-focus-within:text-foreground transition-colors" />
              <input
                id="topbar-search"
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Cari sesuatu..."
                className="w-full h-10 pl-10 pr-12 rounded-xl text-[13px] bg-surface border border-border
                           text-foreground placeholder:text-muted/35
                           focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground
                           hover:border-foreground/30
                           transition-all duration-200"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono
                              text-muted/30 bg-surface-hover border border-border/60 px-1.5 py-0.5 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* RIGHT — Dark mode + Notif + Profile */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

            {/* Dark mode toggle */}
            <button
              id="theme-toggle"
              onClick={() => setDark(d => !d)}
              title={dark ? 'Switch to Light' : 'Switch to Dark'}
              className="p-2 rounded-xl text-muted/60 hover:text-foreground hover:bg-surface-hover
                         transition-all duration-200"
            >
              {dark
                ? <SunIcon  className="w-[18px] h-[18px]" />
                : <MoonIcon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notifications-button"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                className="relative p-2 rounded-xl text-muted/60 hover:text-foreground hover:bg-surface-hover
                           transition-all duration-200"
              >
                <BellIcon className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-foreground border-2 border-card" />
              </button>

              {/* Notif dropdown */}
              {notifOpen && (
                <div className="absolute right-[-40px] sm:right-0 top-full mt-2 w-72 sm:w-80 bg-card border border-border rounded-2xl
                                shadow-xl shadow-foreground/5 overflow-hidden animate-fade-up z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between"
                       style={{ background: 'var(--gradient-card)' }}>
                    <p className="text-[13px] font-bold text-foreground"
                       style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                      Notifikasi
                    </p>
                    <span className="text-[11px] bg-foreground/10 text-foreground font-semibold px-2 py-0.5 rounded-full">1 baru</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {[
                      { icon: '🔔', title: 'Pengingat Absensi', desc: 'Jangan lupa absen hari ini!', time: 'Baru saja', unread: true },
                    ].map((n, i) => (
                      <div key={i}
                           className={`px-4 py-3 hover:bg-surface-hover/50 transition-colors cursor-pointer
                             ${n.unread ? 'bg-foreground/[0.02]' : ''}`}>
                        <div className="flex gap-3 items-start">
                          <span className="text-[18px] mt-0.5">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">{n.title}</p>
                            <p className="text-[11px] text-muted truncate mt-0.5">{n.desc}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-[10px] text-muted/60">{n.time}</p>
                            {n.unread && <span className="w-2 h-2 rounded-full bg-foreground" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border text-center">
                    <p className="text-[12px] text-foreground font-medium cursor-pointer hover:underline">
                      Lihat semua notifikasi
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-0.5 sm:mx-1" />

            {/* Profile button */}
            <div className="relative" ref={profileRef}>
              <button
                id="profile-button"
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                className="flex items-center gap-2 sm:gap-2.5 pl-1 pr-1 sm:pr-3 py-1.5 rounded-xl
                           hover:bg-surface-hover transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-background bg-foreground shrink-0">
                  {user.avatar}
                </div>
                {/* Name & role — hidden on small screens */}
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-[13px] font-semibold text-foreground"
                     style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    {user.name}
                  </p>
                  <p className="text-[11px] text-muted/60">{user.role}</p>
                </div>
                {/* Chevron */}
                <ChevronRightIcon className={`hidden lg:block w-3.5 h-3.5 text-muted/40 transition-transform duration-200
                  ${profileOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl
                                shadow-xl shadow-foreground/5 overflow-hidden animate-fade-up z-50">
                  {/* Profile header */}
                  <div className="px-4 py-4 border-b border-border"
                       style={{ background: 'var(--gradient-card)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-bold text-background bg-foreground shrink-0">
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-foreground truncate"
                           style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                          {user.name}
                        </p>
                        <p className="text-[11px] text-muted truncate">{user.email}</p>
                        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                         bg-foreground/10 text-foreground border border-foreground/15">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <button
                      id="profile-logout"
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                 text-[13px] font-medium text-danger hover:bg-danger/10
                                 transition-colors duration-150"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Keluar dari Akun
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
