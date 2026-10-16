'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';

function ArrowUpRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

const DASHBOARD_MENUS = [
  {
    title: 'Absensi Wajah AI',
    desc: 'Catat kehadiran kerja harian dengan verifikasi biometrik wajah otomatis & lokasi GPS.',
    href: '/dashboard/attendance',
    badge: 'Biometrik',
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3m0 0l-1.5-1.5m1.5 1.5l1.5-1.5" />
      </svg>
    ),
    gradient: 'from-blue-500 via-indigo-600 to-cyan-500',
    bgLight: 'bg-blue-500/10 text-blue-500',
    tagColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  {
    title: 'Notes & Tugas',
    desc: 'Kelola ide kreatif, catatan meeting, dan checklist tugas dengan editor interaktif.',
    href: '/dashboard/notes',
    badge: 'Produktivitas',
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-500/10 text-amber-500',
    tagColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  {
    title: 'Agenda & Events',
    desc: 'Pantau jadwal meeting, deadline proyek, dan kalender penting dengan pengingat waktu.',
    href: '/dashboard/agenda',
    badge: 'Jadwal',
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-500/10 text-emerald-500',
    tagColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    title: 'AI Agent Tracker',
    desc: 'Monitor limit dan reset timer Claude, GPT-4, serta Gemini di berbagai akun AI terdaftar.',
    href: '/dashboard/ai-tracker',
    badge: 'AI Tracker',
    icon: (
      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    gradient: 'from-fuchsia-500 via-pink-500 to-rose-600',
    bgLight: 'bg-pink-500/10 text-pink-500',
    tagColor: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  // Dynamic live summary state
  const [attendanceToday, setAttendanceToday] = useState<{ checkedIn: boolean; time?: string } | null>(null);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [aiAgentsCount, setAiAgentsCount] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Load notes count from local storage
    try {
      const savedNotes = localStorage.getItem('codebymiguel_notes');
      if (savedNotes) {
        setNotesCount(JSON.parse(savedNotes).length);
      }
    } catch {
      // ignore
    }

    // Load Supabase summary stats
    const fetchStats = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Attendance
        if (user?.email) {
          const { data: att } = await supabase
            .from('attendance')
            .select('check_in')
            .eq('user_email', user.email)
            .eq('date', todayStr)
            .maybeSingle();

          if (att && att.check_in) {
            const checkInDate = new Date(att.check_in);
            const timeStr = checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setAttendanceToday({ checkedIn: true, time: timeStr });
          } else {
            setAttendanceToday({ checkedIn: false });
          }
        }

        // 2. Events Count
        const { count: evCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
        if (evCount !== null) setEventsCount(evCount);

        // 3. AI Agents Count
        const { count: aiCount } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true });
        if (aiCount !== null) setAiAgentsCount(aiCount);
      } catch (err) {
        console.warn('Error fetching live stats:', err);
      }
    };

    fetchStats();

    return () => clearInterval(timer);
  }, [user]);

  if (!mounted) return null;

  const currentHour = time.getHours();
  let greeting = 'Selamat Malam';
  let greetingIcon = '🌙';
  if (currentHour >= 5 && currentHour < 11) {
    greeting = 'Selamat Pagi';
    greetingIcon = '☀️';
  } else if (currentHour >= 11 && currentHour < 15) {
    greeting = 'Selamat Siang';
    greetingIcon = '🌤️';
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = 'Selamat Sore';
    greetingIcon = '🌅';
  }

  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const firstName = user?.name?.split(' ')[0] || 'Miguel';

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Hero Welcome Banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm glass"
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-hover border border-border text-[11px] font-bold text-muted uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Workspace Aktif
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
                {user?.role || 'Admin'}
              </span>
            </div>

            <h1
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {greeting}, <span className="text-gradient">{firstName}</span> {greetingIcon}
            </h1>

            <p className="text-muted text-xs sm:text-sm max-w-xl leading-relaxed">
              Semua operasional absensi, catatan kerja, agenda, dan pemantau limit AI Anda siap dalam satu dasbor terpadu.
            </p>
          </div>

          {/* Live Clock Card */}
          <div className="shrink-0 flex items-center gap-3.5 bg-surface/90 border border-border p-3.5 sm:p-4 rounded-2xl shadow-xs self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider">{dateStr}</div>
              <div className="text-lg sm:text-xl font-extrabold text-foreground font-mono tracking-tight">
                {timeStr} <span className="text-xs font-normal text-muted">WIB</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats Grid (4 Live Widgets) ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Absensi */}
        <Link href="/dashboard/attendance" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border hover:border-primary/40 transition-all duration-200 relative overflow-hidden shadow-xs h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted">Absensi Hari Ini</span>
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {attendanceToday?.checkedIn ? `Sudah (${attendanceToday.time})` : 'Belum Absen'}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1 truncate">
                {attendanceToday?.checkedIn ? 'Presensi tercatat' : 'Ketuk untuk check-in'}
              </p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 2: Notes */}
        <Link href="/dashboard/notes" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border hover:border-amber-500/40 transition-all duration-200 relative overflow-hidden shadow-xs h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted">Catatan & Tugas</span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-foreground font-mono">{notesCount}</span>
              <p className="text-[11px] text-muted mt-1 truncate">Catatan aktif tersimpan</p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 3: Agenda */}
        <Link href="/dashboard/agenda" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border hover:border-emerald-500/40 transition-all duration-200 relative overflow-hidden shadow-xs h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted">Agenda Terdaftar</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-foreground font-mono">{eventsCount}</span>
              <p className="text-[11px] text-muted mt-1 truncate">Acara & event penting</p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 4: AI Agents */}
        <Link href="/dashboard/ai-tracker" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border hover:border-pink-500/40 transition-all duration-200 relative overflow-hidden shadow-xs h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted">Akun AI Tracker</span>
              <div className="w-7 h-7 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-foreground font-mono">{aiAgentsCount}</span>
              <p className="text-[11px] text-muted mt-1 truncate">Akun AI dipantau</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ── Mobile Quick Action Pill Chips ──────────────────────── */}
      <div className="sm:hidden">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 px-1">Aksi Cepat</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href="/dashboard/attendance"
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold active:scale-95 transition-transform"
          >
            <span>📸</span>
            <span>Absen Wajah</span>
          </Link>
          <Link
            href="/dashboard/notes"
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold active:scale-95 transition-transform"
          >
            <span>📝</span>
            <span>Tulis Catatan</span>
          </Link>
          <Link
            href="/dashboard/agenda"
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold active:scale-95 transition-transform"
          >
            <span>📅</span>
            <span>Agenda Baru</span>
          </Link>
          <Link
            href="/dashboard/ai-tracker"
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 text-xs font-bold active:scale-95 transition-transform"
          >
            <span>🤖</span>
            <span>Cek Akun AI</span>
          </Link>
        </div>
      </div>

      {/* ── Core Feature Cards Grid ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-primary inline-block" />
            <h2
              className="text-lg sm:text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Fitur Workspace
            </h2>
          </div>
          <span className="text-xs text-muted font-medium">Pilih menu untuk mulai</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          {DASHBOARD_MENUS.map((menu, i) => (
            <Link href={menu.href} key={i} className="block group outline-none">
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-full bg-card border border-border p-5 sm:p-7 rounded-3xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-primary flex flex-col justify-between"
              >
                {/* Background decorative glow */}
                <div
                  className={`absolute top-0 right-0 w-36 h-36 opacity-15 blur-2xl rounded-full transition-transform duration-500 group-hover:scale-150 bg-gradient-to-br ${menu.gradient}`}
                />

                <div>
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${menu.bgLight} shadow-inner transition-transform duration-300 group-hover:scale-110`}
                    >
                      {menu.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${menu.tagColor}`}>
                        {menu.badge}
                      </span>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-hover flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>

                  <h3
                    className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {menu.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {menu.desc}
                  </p>
                </div>

                {/* Bottom line accent */}
                <div
                  className={`mt-4 sm:mt-6 h-1 w-8 group-hover:w-full bg-gradient-to-r ${menu.gradient} rounded-full transition-all duration-500`}
                />
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}