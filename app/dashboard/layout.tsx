'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── PWA Safe Area Hook ─────────────────────────────────────── */
function usePWASafeArea() {
  const [safeTop, setSafeTop] = useState(0);
  const [isPWA, setIsPWA]     = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsPWA(standalone);
    if (standalone) {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;';
      document.body.appendChild(el);
      const top = parseInt(getComputedStyle(el).paddingTop || '0', 10);
      setSafeTop(isNaN(top) ? 0 : top);
      document.body.removeChild(el);
    }
  }, []);
  return { safeTop, isPWA };
}

/* ──────────────────────────── Icons ──────────────────────────── */
function CodeIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>);
}
function GridIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>);
}
function NoteIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>);
}
function CalendarIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>);
}
function SparklesIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>);
}
function AttendanceIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2 2 4-4" /></svg>);
}
function ActivityIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.75L9 5.25l4.5 13.5L17.25 9 19.5 12H21" /></svg>);
}
function CpuIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 16.5V21m3.75-18v1.5m0 16.5V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9a.75.75 0 01.75.75v9a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-9a.75.75 0 01.75-.75z" /></svg>);
}
function UserIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
}
function SettingsIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
}
function LogoutIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>);
}

/* ──────────────────────────── Nav Config ───────────────────── */
interface NavItem { label: string; href: string; icon: React.ComponentType<{ className?: string }>; }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',             href: '/dashboard',            icon: GridIcon },
  { label: 'Agenda & Events',       href: '/dashboard/agenda',     icon: CalendarIcon },
  { label: 'Attendance',            href: '/dashboard/attendance', icon: AttendanceIcon },
  { label: 'Limit Agent Tracker',   href: '/dashboard/ai-tracker', icon: SparklesIcon },
  { label: 'Aktivitas & Kebiasaan', href: '/dashboard/kehidupan',  icon: ActivityIcon },
];

/* ──────────────────────────── Floating Sidebar ──────────────── */
function FloatingSidebar({
  pathname, user, logout,
}: {
  pathname: string;
  user: { name: string; email: string; role?: string; avatar?: string };
  logout: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const avatarContent =
    user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))
      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      : <span className="text-[11px] font-bold text-white">{user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U'}</span>;

  return (
    <aside className="floating-sidebar hidden lg:flex fixed z-40 flex-col items-center py-3 gap-0.5">
      {/* Logo */}
      <div className="w-9 h-9 rounded-[14px] flex items-center justify-center bg-zinc-900 text-white shadow-xs shrink-0">
        <CodeIcon className="w-[18px] h-[18px]" />
      </div>

      {/* Avatar User (di bawah logo) */}
      <div className="relative my-2" onMouseEnter={() => setHovered('profile-avatar')} onMouseLeave={() => setHovered(null)}>
        <Link
          href="/dashboard/settings"
          className="w-9 h-9 rounded-[12px] overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center ring-2 ring-zinc-200/90 hover:ring-zinc-400 transition-all shrink-0 cursor-pointer block"
        >
          {avatarContent}
        </Link>
        {hovered === 'profile-avatar' && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-zinc-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-zinc-800">
              {user.name || 'Profil & Pengaturan'}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-zinc-900" />
            </div>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="w-5 h-px bg-zinc-200/90 mb-2" />

      {/* Main Nav */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 w-full px-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <div
              key={item.href}
              className="relative w-full flex justify-center"
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link
                href={item.href}
                className={`relative w-9 h-9 rounded-[12px] flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {isActive && (
                  <motion.div
                    layoutId="floating-nav"
                    className="absolute inset-0 rounded-[12px] ring-1 ring-zinc-900"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
              </Link>
              {/* Tooltip */}
              {hovered === item.href && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <div className="bg-zinc-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-zinc-800">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-zinc-900" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="w-5 h-px bg-zinc-200/90 my-1" />

      {/* Bottom (Hanya Setting dan Logout) */}
      <div className="flex flex-col items-center gap-0.5 w-full px-1.5">
        {/* Settings */}
        <div className="relative w-full flex justify-center" onMouseEnter={() => setHovered('settings')} onMouseLeave={() => setHovered(null)}>
          <Link href="/dashboard/settings" className={`w-9 h-9 rounded-[12px] flex items-center justify-center transition-all duration-200 ${pathname.startsWith('/dashboard/settings') ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/80'}`}>
            <SettingsIcon className="w-[18px] h-[18px]" />
          </Link>
          {hovered === 'settings' && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-zinc-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-zinc-800">Settings</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="relative w-full flex justify-center" onMouseEnter={() => setHovered('logout')} onMouseLeave={() => setHovered(null)}>
          <button onClick={logout} className="w-9 h-9 rounded-[12px] flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer" aria-label="Logout">
            <LogoutIcon className="w-[18px] h-[18px]" />
          </button>
          {hovered === 'logout' && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-zinc-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-zinc-800">Keluar</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ──────────────────────────── Mobile Top Bar ───────────────── */
function MobileTopBar({
  user,
}: {
  user: { name: string; email: string; avatar?: string };
}) {
  const avatarContent =
    user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))
      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      : <span className="text-[11px] font-bold text-white">{user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U'}</span>;

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
          <CodeIcon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[13px] font-bold font-heading text-zinc-900 tracking-tight block leading-tight">
            CodeByMiguel
          </span>
          <span className="text-[10px] font-mono text-zinc-400 block leading-tight">
            Workspace
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/settings"
          className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center ring-2 ring-zinc-200/80 hover:ring-zinc-400 transition-all shrink-0 cursor-pointer"
          title="Pengaturan & Profil"
        >
          {avatarContent}
        </Link>
      </div>
    </header>
  );
}

/* ──────────────────────────── Mobile Bottom Nav ────────────── */
function MobileBottomNav({ pathname }: { pathname: string }) {
  const items = NAV_ITEMS.slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/90 flex items-center justify-around px-1 py-1.5 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {items.map((item) => {
        const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-700 font-medium'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isActive ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-400'
              }`}
            >
              <item.icon className="w-4 h-4" />
            </div>
            <span className="text-[9px] tracking-tight truncate max-w-[56px] text-center">
              {item.label === 'Limit Agent Tracker'
                ? 'Tracker'
                : item.label === 'Aktivitas & Kebiasaan'
                ? 'Aktivitas'
                : item.label === 'Agenda & Events'
                ? 'Agenda'
                : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ──────────────────────────── Layout ─────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const { safeTop, isPWA } = usePWASafeArea();

  useEffect(() => {
    // Pastikan mode tema bersih dan konsisten
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?reason=idle');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-foreground shadow-lg animate-breathe">
            <CodeIcon className="w-5 h-5 text-background" />
          </div>
          <span className="text-xs font-semibold text-muted tracking-widest uppercase animate-pulse">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background relative flex-col lg:flex-row">
      {/* Floating Sidebar (Desktop Only) */}
      <FloatingSidebar pathname={pathname} user={user} logout={logout} />

      {/* Mobile Top Bar (Mobile Only) */}
      <MobileTopBar user={user} />

      {/* Mobile Bottom Nav (Mobile Only) */}
      <MobileBottomNav pathname={pathname} />

      {/* Main Content — offset by sidebar on desktop + safe bottom padding for mobile */}
      <div
        className="flex-1 min-w-0 lg:ml-[76px] pb-28 lg:pb-8"
        style={isPWA && safeTop > 0 ? { paddingTop: safeTop } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
