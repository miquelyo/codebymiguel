'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── PWA Safe Area Hook ────────────────────────────────────── */
function usePWASafeArea() {
  const [safeTop, setSafeTop] = useState(0);
  const [isPWA, setIsPWA]     = useState(false);

  useEffect(() => {
    // Detect standalone / fullscreen PWA mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsPWA(standalone);

    if (standalone) {
      // Read safe-area-inset-top via CSS env()
      const el = document.createElement('div');
      el.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:0;' +
        'padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;';
      document.body.appendChild(el);
      const top = parseInt(getComputedStyle(el).paddingTop || '0', 10);
      setSafeTop(isNaN(top) ? 0 : top);
      document.body.removeChild(el);
    }
  }, []);

  return { safeTop, isPWA };
}

/* ──────────────────────────── Icons ──────────────────────── */
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
function AttendanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2 2 4-4" />
    </svg>
  );
}
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 16.5V21m3.75-18v1.5m0 16.5V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9a.75.75 0 01.75.75v9a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-9a.75.75 0 01.75-.75z" />
    </svg>
  );
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}
function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.75L9 5.25l4.5 13.5L17.25 9 19.5 12H21" />
    </svg>
  );
}

/* ──────────────────────────── Nav Config ─────────────────── */
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  isHero?: boolean;
}
export interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const DASHBOARD_ITEM: NavItem = { label: 'Dashboard', href: '/dashboard', icon: GridIcon };

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    icon: BriefcaseIcon,
    items: [
      { label: 'Notes & Tugas',    href: '/dashboard/notes',      icon: NoteIcon },
      { label: 'Agenda & Events',  href: '/dashboard/agenda',     icon: CalendarIcon },
    ],
  },
  {
    id: 'ai_system',
    label: 'AI & Sistem',
    icon: CpuIcon,
    items: [
      { label: 'Absensi Wajah AI', href: '/dashboard/attendance', icon: AttendanceIcon, badge: 'Live' },
      { label: 'AI Agent Tracker', href: '/dashboard/ai-tracker', icon: SparklesIcon, badge: 'Radar' },
    ],
  },
  {
    id: 'kehidupan',
    label: 'Kehidupan',
    icon: HeartIcon,
    items: [
      { label: 'Aktivitas & Kebiasaan', href: '/dashboard/kehidupan', icon: ActivityIcon, badge: 'New' },
    ],
  },
];

const SETTINGS_ITEM: NavItem = { label: 'Settings', href: '/dashboard/settings', icon: SettingsIcon };

function getPageInfo(pathname: string): { title: string; subtitle: string; category: string } {
  if (pathname === '/dashboard')             return { title: 'Dashboard',        subtitle: 'Ikhtisar aktivitas harian',         category: 'Overview'     };
  if (pathname.includes('/notes'))           return { title: 'Notes & Tugas',    subtitle: 'Catatan & manajemen tugas',          category: 'Workspace'    };
  if (pathname.includes('/agenda'))          return { title: 'Agenda & Events',  subtitle: 'Kalender & jadwal kegiatan',         category: 'Workspace'    };
  if (pathname.includes('/attendance'))      return { title: 'Absensi Wajah AI', subtitle: 'Verifikasi biometrik presensi',      category: 'AI & Sistem'  };
  if (pathname.includes('/ai-tracker'))      return { title: 'AI Agent Tracker', subtitle: 'Monitoring aktivitas & cooldown',    category: 'AI & Sistem'  };
  if (pathname.includes('/kehidupan'))       return { title: 'Pusat Hidup Sehat', subtitle: 'Kebiasaan harian, olahraga & bebas candu', category: 'Kehidupan' };
  if (pathname.includes('/settings'))        return { title: 'Settings',          subtitle: 'Pengaturan akun & preferensi',       category: 'Pengaturan'   };
  if (pathname.includes('/whatsapp'))        return { title: 'WhatsApp Gateway', subtitle: 'Koneksi OTP 2FA mandiri',            category: 'Sistem'       };
  return { title: 'Dashboard', subtitle: 'Ikhtisar aktivitas harian', category: 'Overview' };
}

/* ──────────────────────────── Sidebar Content ─────────────── */
function SidebarContent({
  pathname,
  user,
  openGroups,
  toggleGroup,
  logout,
  onNavClick,
}: {
  pathname: string;
  user: { name: string; email: string; role?: string; avatar?: string };
  openGroups: Record<string, boolean>;
  toggleGroup: (id: string) => void;
  logout: () => void;
  onNavClick?: () => void;
}) {
  const avatarContent =
    user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))
      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      : <span>{user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U'}</span>;

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50 shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-foreground shadow-sm shrink-0">
          <CodeIcon className="w-4 h-4 text-background" />
        </div>
        <div>
          <span className="text-[13px] font-bold text-foreground tracking-tight block" style={{ fontFamily: 'var(--font-heading)' }}>
            CodebyMiguel
          </span>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle inline-block" />
            Workspace
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Dashboard */}
        <Link
          href={DASHBOARD_ITEM.href}
          onClick={onNavClick}
          className={`nav-item ${pathname === DASHBOARD_ITEM.href ? 'active' : ''}`}
        >
          <span className="nav-item-icon">
            <DASHBOARD_ITEM.icon className="w-4 h-4" />
          </span>
          <span className="flex-1 truncate text-[13px]">{DASHBOARD_ITEM.label}</span>
        </Link>

        {/* Groups */}
        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.id] ?? false;
          const hasActiveChild = group.items.some((item) => pathname === item.href);
          return (
            <div key={group.id} className="pt-3">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer select-none ${
                  hasActiveChild ? 'text-foreground' : 'text-muted-foreground hover:text-muted'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pt-1 pb-1">
                      {group.items.map(({ label, href, icon: Icon, badge }) => {
                        const active = pathname === href;
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={onNavClick}
                            className={`nav-item ${active ? 'active' : ''}`}
                          >
                            <span className="nav-item-icon">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span className="flex-1 truncate text-[13px]">{label}</span>
                            {badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                                active
                                  ? 'bg-foreground/10 text-foreground'
                                  : 'bg-muted/10 text-muted'
                              }`}>
                                {badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Settings */}
        <div className="pt-3">
          <p className="section-label mb-1.5">Pengaturan</p>
          <Link
            href={SETTINGS_ITEM.href}
            onClick={onNavClick}
            className={`nav-item ${pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">
              <SettingsIcon className="w-4 h-4" />
            </span>
            <span className="flex-1 truncate text-[13px]">{SETTINGS_ITEM.label}</span>
          </Link>
        </div>
      </nav>

      {/* User Footer */}
      <div className="px-3 py-3 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-hover transition-colors group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] text-white bg-gradient-to-br from-slate-700 to-slate-900 shrink-0 overflow-hidden shadow-sm">
            {avatarContent}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted truncate">{user.role || 'Super Admin'}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
          >
            <LogoutIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Layout ─────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const { safeTop, isPWA } = usePWASafeArea();

  const [dark, setDark]           = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime]           = useState<string>('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    ai_system: false,
    kehidupan: false,
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const pageInfo = getPageInfo(pathname);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Auto-expand active group
  useEffect(() => {
    if (pathname.startsWith('/dashboard/notes') || pathname.startsWith('/dashboard/agenda')) {
      setOpenGroups((p) => ({ ...p, workspace: true }));
    } else if (pathname.startsWith('/dashboard/attendance') || pathname.startsWith('/dashboard/ai-tracker')) {
      setOpenGroups((p) => ({ ...p, ai_system: true }));
    } else if (pathname.startsWith('/dashboard/kehidupan')) {
      setOpenGroups((p) => ({ ...p, kehidupan: true }));
    }
  }, [pathname]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((p) => ({ ...p, [id]: !p[id] }));
  }, []);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // Live clock
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleToggleTheme = () => {
    setDark((p) => {
      const next = !p;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  // Close notif on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-foreground shadow-lg animate-breathe">
            <CodeIcon className="w-5 h-5 text-background" />
          </div>
          <span className="text-xs font-semibold text-muted tracking-widest uppercase animate-pulse">
            Memuat...
          </span>
        </div>
      </div>
    );
  }

  const avatarContent =
    user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))
      ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      : <span>{user.avatar || user.name?.charAt(0)?.toUpperCase() || 'U'}</span>;

  return (
    <div className="flex min-h-screen bg-background relative selection:bg-foreground/10">

      {/* ════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg+)
      ════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex fixed left-0 bottom-0 z-40 w-[248px] flex-col bg-surface border-r border-border/60 overflow-hidden"
        style={{ top: isPWA ? safeTop : 0 }}
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          logout={logout}
        />
      </aside>

      {/* ════════════════════════════════════════════════════
          MOBILE DRAWER (< lg)
      ════════════════════════════════════════════════════ */}
      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.8 }}
            className="lg:hidden fixed left-0 bottom-0 z-50 w-[280px] bg-surface border-r border-border/60 overflow-hidden flex flex-col shadow-2xl"
            style={{ top: isPWA && safeTop > 0 ? safeTop : 0 }}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 z-10 w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer"
              style={{ top: isPWA && safeTop > 0 ? `calc(1rem + ${safeTop}px)` : '1rem' }}
            >
              <XIcon className="w-4 h-4" />
            </button>

            <SidebarContent
              pathname={pathname}
              user={user}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              logout={logout}
              onNavClick={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[248px]">

        {/* Top Navbar */}
        <header
          className="pwa-header sticky top-0 z-30 px-3 sm:px-5 lg:px-8 flex flex-col justify-end glass-panel border-b border-border/50"
          style={isPWA && safeTop > 0 ? { paddingTop: safeTop } : undefined}
        >
          {/* inner row — sempre h-14 sm:h-16 */}
          <div className="h-14 sm:h-16 flex items-center justify-between w-full">

          {/* Left: Hamburger (mobile) + Page title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl hover:bg-surface-hover transition-all cursor-pointer shrink-0 group"
              aria-label="Open menu"
            >
              <span className="w-5 h-[1.5px] bg-foreground rounded-full transition-all group-hover:w-4" />
              <span className="w-4 h-[1.5px] bg-foreground rounded-full" />
              <span className="w-5 h-[1.5px] bg-foreground rounded-full transition-all group-hover:w-4" />
            </button>

            {/* Mobile brand wordmark (shows when drawer closed) */}
            <div className="lg:hidden shrink-0">
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                CodebyMiguel
              </span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                <span>{pageInfo.category}</span>
                <span className="opacity-40">/</span>
                <span className="text-foreground/70">{pageInfo.title}</span>
              </div>
              <h1
                className="text-base font-bold tracking-tight text-foreground truncate"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
              >
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right: Clock, Theme, Notif, Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Clock Pill — md+ */}
            {time && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface border border-border text-[11px] font-mono font-medium text-foreground shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                <span>{time}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer shadow-sm"
              title={dark ? 'Mode Terang' : 'Mode Gelap'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {dark ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                    <SunIcon className="w-4 h-4 text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                    <MoonIcon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer relative shadow-sm"
              >
                <BellIcon className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-surface" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-[300px] sm:w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl glass-panel shadow-xl border border-border z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Notifikasi</span>
                      <span className="badge badge-info">3 Baru</span>
                    </div>
                    <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                      {[
                        { icon: '✓', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10', title: 'Sistem Absensi Aktif',  desc: 'Verifikasi biometrik siap digunakan.',    time: 'Baru saja' },
                        { icon: '✦', color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10',  title: 'AI Agent Status OK',    desc: 'Semua model AI terpantau normal.',        time: '15m lalu'  },
                        { icon: '↑', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',        title: 'Sinkronisasi Cloud',    desc: 'Catatan tersimpan otomatis di Supabase.', time: '1j lalu'   },
                      ].map((n, i) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-surface-hover transition-colors cursor-pointer">
                          <div className={`w-7 h-7 rounded-lg ${n.color} flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold`}>{n.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            <p className="text-[11px] text-muted mt-0.5">{n.desc}</p>
                            <span className="text-[10px] text-muted/60 mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar → Settings */}
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all shadow-sm cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white bg-gradient-to-br from-slate-700 to-slate-900 shrink-0 overflow-hidden">
                {avatarContent}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-foreground max-w-[80px] truncate">
                {user.name?.split(' ')[0]}
              </span>
            </Link>
          </div>

          </div>{/* end inner row */}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
