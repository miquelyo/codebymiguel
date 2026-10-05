'use client';

import { useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── Icons ─────────────────────────────────── */
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

/* ── Nav (Dashboard only) ───────────────────── */
const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: GridIcon },
  { label: 'Absensi', href: '/dashboard/attendance', icon: ClipboardCheckIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="w-6 h-6 animate-spin text-primary/50" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Mobile backdrop ──────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[220px]
          bg-white border-r border-border flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-14 px-5 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <GridIcon className="w-[15px] h-[15px] text-primary" />
          </div>
          <span className="text-[14px] font-semibold text-foreground tracking-tight">
            AdminPanel
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/40 px-2 mb-2">
            Menu
          </p>
          <ul className="space-y-0.5">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
                      transition-colors duration-100
                      ${active
                        ? 'bg-primary/8 text-primary'
                        : 'text-muted hover:text-foreground hover:bg-surface-hover'}
                    `}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                    {label}
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/60" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-3 py-3 shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center
                            text-[11px] font-semibold text-primary shrink-0">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-muted/60 truncate leading-tight">{user.role}</p>
            </div>
            <button
              id="logout-button"
              onClick={logout}
              title="Keluar"
              className="p-1.5 rounded-md text-muted/50 hover:text-danger hover:bg-danger/5
                         transition-colors duration-100"
            >
              <LogoutIcon className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-border
                           flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* mobile toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-muted hover:bg-surface-hover transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* search bar */}
            <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg
                            bg-background border border-border text-[13px] w-52 cursor-text">
              <SearchIcon className="w-3.5 h-3.5 text-muted/40 shrink-0" />
              <span className="text-muted/35 flex-1">Cari sesuatu...</span>
              <kbd className="text-[10px] font-mono text-muted/30 bg-white border border-border/60 px-1 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* bell */}
            <button
              id="notifications-button"
              className="relative p-2 rounded-md text-muted/60 hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <BellIcon className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger/60" />
            </button>

            {/* avatar (mobile only) */}
            <div className="lg:hidden w-7 h-7 rounded-md bg-primary/8 flex items-center
                            justify-center text-[10px] font-semibold text-primary">
              {user.avatar}
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
