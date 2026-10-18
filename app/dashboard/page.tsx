'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function ArrowUpRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  // Dynamic live summary state
  const [attendanceToday, setAttendanceToday] = useState<{ checkedIn: boolean; time?: string } | null>(null);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [aiAgentsCount, setAiAgentsCount] = useState<number>(0);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [recentNotes, setRecentNotes] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const [recentEvents, setRecentEvents] = useState<Array<{ id: string; title: string; event_date: string }>>([]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Load notes count & recent notes from local storage
    try {
      const savedNotes = localStorage.getItem('codebymiguel_notes');
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        setNotesCount(parsed.length);
        setRecentNotes(parsed.slice(0, 3));
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

        // 2. Events Count & Recent
        const { data: evList, count: evCount } = await supabase
          .from('events')
          .select('id, title, event_date', { count: 'exact' })
          .order('event_date', { ascending: true })
          .limit(3);

        if (evCount !== null) setEventsCount(evCount);
        if (evList) setRecentEvents(evList);

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

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle.trim()) return;

    try {
      const saved = localStorage.getItem('codebymiguel_notes');
      const current = saved ? JSON.parse(saved) : [];
      const newNote = {
        id: Date.now().toString(),
        title: quickNoteTitle.trim(),
        content: 'Catatan cepat dari dashboard overview.',
        date: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      const updated = [newNote, ...current];
      localStorage.setItem('codebymiguel_notes', JSON.stringify(updated));
      setNotesCount(updated.length);
      setRecentNotes(updated.slice(0, 3));
      setQuickNoteTitle('');
      toast.success('Catatan cepat tersimpan!');
    } catch {
      toast.error('Gagal menyimpan catatan');
    }
  };

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
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Hero Welcome Banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl glass-panel p-4.5 sm:p-7 lg:p-9 border border-border/80 shadow-2xl"
      >
        {/* Ambient Glow mesh */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/15 dark:bg-cyan-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-hover/80 border border-border/70 text-[11px] font-bold text-muted uppercase tracking-wider backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Workspace Online
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
                {user?.role || 'Super Admin'}
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {greeting}, <span className="text-gradient-primary">{firstName}</span> {greetingIcon}
            </h1>

            <p className="text-muted text-xs sm:text-sm max-w-xl leading-relaxed">
              Selamat datang di kendali utama. Pantau kehadiran biometrik AI, lacak limit AI agent, kelola agenda dan catatan dalam satu antarmuka modern.
            </p>
          </div>

          {/* Quick Actions & Live Time */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-surface/90 border border-border/70 p-3 sm:p-3.5 rounded-2xl shadow-sm w-full sm:w-auto justify-between sm:justify-start">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider">{dateStr}</div>
                <div className="text-base sm:text-lg font-bold text-foreground font-mono tracking-tight">
                  {timeStr} <span className="text-xs font-normal text-muted">WIB</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/attendance"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Buka Presensi Wajah</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Key Metrics Grid (4 Bento Cards) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Stat 1: Absensi */}
        <Link href="/dashboard/attendance" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-3.5 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-muted truncate">Absensi Hari Ini</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${attendanceToday?.checkedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs sm:text-base font-extrabold text-foreground truncate">
                  {attendanceToday?.checkedIn ? `Sudah (${attendanceToday.time})` : 'Belum Absen'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted mt-1 truncate">
                {attendanceToday?.checkedIn ? 'Presensi biometrik valid' : 'Mulai scan wajah'}
              </p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 2: AI Agents */}
        <Link href="/dashboard/ai-tracker" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-3.5 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-muted truncate">AI Agent Tracker</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-foreground font-mono">{aiAgentsCount}</span>
              <p className="text-[10px] sm:text-[11px] text-muted mt-1 truncate">Akun AI dipantau cooldown</p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 3: Notes */}
        <Link href="/dashboard/notes" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-3.5 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-muted truncate">Notes & Tugas</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-foreground font-mono">{notesCount}</span>
              <p className="text-[10px] sm:text-[11px] text-muted mt-1 truncate">Catatan aktif tersimpan</p>
            </div>
          </motion.div>
        </Link>

        {/* Stat 4: Agenda */}
        <Link href="/dashboard/agenda" className="block group">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-card p-3.5 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-muted truncate">Agenda Terjadwal</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-foreground font-mono">{eventsCount}</span>
              <p className="text-[10px] sm:text-[11px] text-muted mt-1 truncate">Acara & deadline aktif</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ── Interactive Bento Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Bento: Biometric Attendance Terminal Preview */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Terminal Biometrik</span>
              </div>
              <Link href="/dashboard/attendance" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>Buka Kamera</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Verifikasi Presensi Berbasis Wajah AI
            </h3>
            <p className="text-muted text-xs sm:text-sm leading-relaxed mb-6">
              Sistem pencatatan biometrik otomatis mencocokkan deskriptor wajah melalui kamera perangkat dan memvalidasi koordinat lokasi GPS secara real-time.
            </p>

            {/* Viewfinder simulation mockup */}
            <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-slate-900 border border-indigo-500/30 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Radar grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

              {/* Laser animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-laser" />

              {/* Viewfinder corner brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />

              {/* Center crosshair */}
              <div className="relative flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/60 flex items-center justify-center animate-spin-slow mb-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold uppercase tracking-wider">
                  AI Biometric Ready
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Model TinyFaceDetector & 68-Landmark Active</span>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>GPS Lokasi Otomatis Terdeteksi</span>
            </div>

            <Link
              href="/dashboard/attendance"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center text-center"
            >
              Mulai Presensi Sekarang
            </Link>
          </div>
        </div>

        {/* Right Bento: Multi-Model AI Cooldown Radar */}
        <div className="lg:col-span-5 glass-card p-4.5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Multi-Model AI Status</span>
              <Link href="/dashboard/ai-tracker" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>Kelola Akun</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              AI Cooldown Radar
            </h3>
            <p className="text-muted text-xs leading-relaxed mb-6">
              Pantau siklus refresh token dan batas rate-limit model AI agar produktivitas coding tidak terputus.
            </p>

            {/* Model list */}
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                    CL
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Claude 3.5 Sonnet</p>
                    <p className="text-[10px] text-muted">Anthropic Session Limit</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                  Ready (No Wait)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    GPT
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">OpenAI GPT-4o</p>
                    <p className="text-[10px] text-muted">3-Hour Cooldown Cycle</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                    GEM
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Gemini 1.5 Pro</p>
                    <p className="text-[10px] text-muted">Google AI Studio</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/20">
                  Standby
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            <Link
              href="/dashboard/ai-tracker"
              className="w-full h-10 rounded-xl bg-surface-hover hover:bg-border/60 text-xs font-bold text-foreground flex items-center justify-center gap-2 transition-all"
            >
              <span>Buka AI Agent Tracker Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lower Bento: Quick Scratchpad + Upcoming Agenda ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Scratchpad Note */}
        <div className="lg:col-span-6 glass-card p-4.5 sm:p-6 lg:p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Scratchpad Cepat</span>
            </div>
            <Link href="/dashboard/notes" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Semua Catatan ({notesCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <form onSubmit={handleQuickNoteSubmit} className="mb-4 sm:mb-5 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={quickNoteTitle}
              onChange={(e) => setQuickNoteTitle(e.target.value)}
              placeholder="Tulis ide atau tugas cepat di sini..."
              className="flex-1 h-11 px-4 rounded-xl bg-surface/80 border border-border text-xs text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
            >
              Simpan
            </button>
          </form>

          {/* Recent Notes Preview */}
          <div className="space-y-2">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <div key={note.id} className="p-3 rounded-xl bg-surface/50 border border-border/60 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-foreground truncate">{note.title}</p>
                    <p className="text-[10px] text-muted">{note.date}</p>
                  </div>
                  <Link href="/dashboard/notes" className="text-[11px] font-semibold text-primary hover:underline shrink-0">
                    Buka
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted">
                Belum ada catatan. Buat ide pertama Anda di atas!
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Agenda */}
        <div className="lg:col-span-6 glass-card p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Agenda Mendatang</span>
            </div>
            <Link href="/dashboard/agenda" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Kalender ({eventsCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentEvents.length > 0 ? (
              recentEvents.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-surface/50 border border-border/60 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-foreground truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted mt-0.5">Tanggal: {ev.event_date}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                    Jadwal Aktif
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span>Tidak ada event dekat. Tambahkan agenda baru di kalender!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}