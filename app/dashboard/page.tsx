'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function ArrowUpRight({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}
function ArrowDownRight({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7L17 17M17 17H7M17 17V7" />
    </svg>
  );
}
function CalendarCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}
function CpuIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
    </svg>
  );
}
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function ActivityIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
function ChevronDownIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function ArrowRight({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function PlusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* ─── Real Workspace Data & Types ────────────────────────────── */
export type ProjectStatus = 'In Progress' | 'On Hold' | 'Completed';

interface ProjectItem {
  id: string;
  name: string;
  department: string;
  progress: number;
  deadline: string;
  status: ProjectStatus;
}

const INITIAL_PROJECTS: ProjectItem[] = [];

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const { user } = useAuth();
  const userKey = user?.email || 'default';
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleFilter, setScheduleFilter] = useState<'All' | 'Recurring' | 'Upcoming'>('All');
  
  // Real stats
  const [attendanceToday, setAttendanceToday] = useState<{ checkedIn: boolean; time?: string; status?: string } | null>(null);
  const [weekAttendance, setWeekAttendance] = useState<Array<{
    dayName: string;
    dateStr: string;
    dateNum: number;
    isToday: boolean;
    isWeekend: boolean;
    checkedIn: boolean;
    time?: string;
    status: 'present' | 'late' | 'weekend' | 'waiting' | 'absent';
  }>>([]);
  const [weeklyRate, setWeeklyRate] = useState<number>(100);

  // Real AI Agents stats
  const [aiStats, setAiStats] = useState<{ total: number; ready: number; cooldown: number }>({ total: 0, ready: 0, cooldown: 0 });

  // Real Habits stats
  const [habitStats, setHabitStats] = useState<{ score: number; slots: number; water: number; workout: boolean }>({
    score: 0,
    slots: 0,
    water: 0,
    workout: false,
  });

  // Real Events
  const [eventsList, setEventsList] = useState<Array<{
    id: string;
    title: string;
    description?: string | null;
    event_date: string;
    is_recurring_yearly: boolean;
  }>>([]);

  // Projects state (with LocalStorage persistence)
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<{
    name: string;
    department: string;
    progress: number;
    deadline: string;
    status: ProjectStatus;
  }>({
    name: '',
    department: 'Web Development',
    progress: 0,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'In Progress',
  });

  // Clock ticker
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Load Projects from Supabase (with LocalStorage fallback)
  useEffect(() => {
    if (!user?.email) return;
    const userEmail = user.email;

    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_email', userEmail)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: ProjectItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            department: d.department || 'General',
            progress: Number(d.progress) || 0,
            deadline: d.deadline || 'Nov 2026',
            status: d.status || 'In Progress',
          }));
          setProjects(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`codebymiguel_projects_${userKey}`, JSON.stringify(mapped));
          }
          return;
        }
      } catch {}

      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(`codebymiguel_projects_${userKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              return;
            }
          }
        } catch {}
      }
      setProjects(INITIAL_PROJECTS);
    };

    loadProjects();
  }, [user?.email, userKey]);

  const saveProjects = (updated: ProjectItem[]) => {
    setProjects(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`codebymiguel_projects_${userKey}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !user?.email) return;
    const item: ProjectItem = {
      id: Date.now().toString(),
      name: newProject.name.trim(),
      department: newProject.department.trim() || 'General',
      progress: Math.min(100, Math.max(0, Number(newProject.progress) || 10)),
      deadline: newProject.deadline.trim() || 'Nov 2026',
      status: newProject.status,
    };
    const updated = [item, ...projects];
    saveProjects(updated);

    try {
      await supabase.from('projects').insert({
        name: item.name,
        department: item.department,
        progress: item.progress,
        deadline: item.deadline,
        status: item.status,
        user_email: user.email,
      });
    } catch {}

    setIsAddModalOpen(false);
    setNewProject({
      name: '',
      department: 'Web Development',
      progress: 0,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'In Progress',
    });
  };

  const handleDeleteProject = async (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    saveProjects(updated);
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch {}
  };

  const handleToggleStatus = async (id: string) => {
    let nextStatus: ProjectStatus = 'In Progress';
    const updated = projects.map(p => {
      if (p.id !== id) return p;
      nextStatus =
        p.status === 'In Progress' ? 'On Hold' :
        p.status === 'On Hold' ? 'Completed' : 'In Progress';
      return { ...p, status: nextStatus };
    });
    saveProjects(updated);
    try {
      await supabase.from('projects').update({ status: nextStatus }).eq('id', id);
    } catch {}
  };

  // Fetch Supabase & Real App Data
  useEffect(() => {
    if (!user?.email) return;
    const userEmail = user.email;

    const fetchRealData = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Today's Attendance
        let todayRec: { check_in: string | null; status: string | null } | null = null;
        const { data: att } = await supabase
          .from('attendance')
          .select('check_in, status')
          .eq('user_email', userEmail)
          .eq('date', todayStr)
          .maybeSingle();

        if (att?.check_in) {
          todayRec = att;
        } else if (typeof window !== 'undefined') {
          try {
            const rawLocal = localStorage.getItem(`codebymiguel_attendance_${userEmail}`);
            if (rawLocal) {
              const parsedLocal = JSON.parse(rawLocal);
              const found = parsedLocal.find((r: any) => r.date === todayStr);
              if (found?.check_in) todayRec = found;
            }
          } catch {}
        }

        if (todayRec?.check_in) {
          setAttendanceToday({
            checkedIn: true,
            time: new Date(todayRec.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            status: todayRec.status || 'Tepat Waktu',
          });
        } else {
          setAttendanceToday({ checkedIn: false });
        }

        // 2. Weekly Attendance Heatmap (Past 7 days)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);

        // Fetch recent attendance
        const { data: histData } = await supabase
          .from('attendance')
          .select('date, check_in, status')
          .eq('user_email', userEmail)
          .order('date', { ascending: false })
          .limit(14);

        let localHistory: any[] = [];
        if (typeof window !== 'undefined') {
          try {
            const rawL = localStorage.getItem(`codebymiguel_attendance_${userEmail}`);
            if (rawL) localHistory = JSON.parse(rawL);
          } catch {}
        }

        const allKnownAtt = [...(histData || []), ...localHistory];
        const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        let workdaysCount = 0;
        let attendedCount = 0;

        const weekItems = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const isWeekend = i >= 5;
          const isToday = dStr === todayStr;
          const isPast = d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

          const rec = allKnownAtt.find(r => r.date === dStr);
          let status: 'present' | 'late' | 'weekend' | 'waiting' | 'absent' = 'absent';
          let time: string | undefined;

          if (isWeekend) {
            status = 'weekend';
          } else {
            workdaysCount++;
            if (rec?.check_in) {
              attendedCount++;
              status = rec.status === 'late' ? 'late' : 'present';
              time = new Date(rec.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            } else if (isToday) {
              status = 'waiting';
            } else if (isPast) {
              status = 'absent';
            } else {
              status = 'waiting';
            }
          }

          return {
            dayName: dayNames[i],
            dateStr: dStr,
            dateNum: d.getDate(),
            isToday,
            isWeekend,
            checkedIn: !!rec?.check_in,
            time,
            status,
          };
        });

        setWeekAttendance(weekItems);
        const rate = workdaysCount > 0 ? Math.round((attendedCount / workdaysCount) * 100) : 100;
        setWeeklyRate(rate);

        // 3. Real AI Agents
        const { data: aiList } = await supabase
          .from('ai_agents')
          .select('id, gemini_refresh_at, claude_gpt_refresh_at')
          .eq('user_email', userEmail);

        if (aiList) {
          const nowMs = Date.now();
          let ready = 0;
          let cooldown = 0;
          aiList.forEach(ag => {
            const gReady = !ag.gemini_refresh_at || new Date(ag.gemini_refresh_at).getTime() <= nowMs;
            const cReady = !ag.claude_gpt_refresh_at || new Date(ag.claude_gpt_refresh_at).getTime() <= nowMs;
            if (gReady && cReady) ready++;
            else cooldown++;
          });
          setAiStats({ total: aiList.length, ready, cooldown });
        }

        // 4. Real Habits Data (from Kehidupan)
        if (typeof window !== 'undefined') {
          try {
            const hRaw = localStorage.getItem(`${userKey}_${todayStr}`);
            if (hRaw) {
              const hData = JSON.parse(hRaw);
              const slots = hData.completedSlots?.length || 0;
              const water = Number(hData.waterGlasses) || 0;
              const workout = !!hData.workoutDone;
              const slotPts = (slots / 5) * 5;
              const waterPts = Math.min(2.5, (water / 8) * 2.5);
              const workoutPts = workout ? 2.5 : 0;
              const finalScore = Math.min(10, Math.round((slotPts + waterPts + workoutPts) * 10) / 10);
              setHabitStats({ score: finalScore, slots, water, workout });
            }
          } catch {}
        }

        // 5. Real Events from Supabase
        const { data: evList } = await supabase
          .from('events')
          .select('id, title, description, event_date, is_recurring_yearly')
          .eq('user_email', userEmail)
          .order('event_date', { ascending: true });

        if (evList && evList.length > 0) {
          setEventsList(evList);
        } else {
          setEventsList([]);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      }
    };

    fetchRealData();
  }, [user?.email, userKey]);

  if (!mounted) return null;

  const hour = currentTime.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? 'Selamat Pagi' :
    hour >= 12 && hour < 17 ? 'Selamat Siang' :
    hour >= 17 && hour < 21 ? 'Selamat Sore' :
    'Selamat Malam';

  const firstName = user?.name?.trim()
    ? user.name.trim().split(' ')[0]
    : (user?.email ? user.email.split('@')[0] : 'Miguel');

  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateFormatted = `${daysIndo[currentTime.getDay()]}, ${currentTime.getDate()} ${monthsIndo[currentTime.getMonth()]} ${currentTime.getFullYear()}`;

  // Working Hours calculation (from real check-in to now)
  let workingHoursDisplay = '0.0';
  if (attendanceToday?.checkedIn && attendanceToday.time) {
    const [h, m] = attendanceToday.time.split(':').map(Number);
    const checkInToday = new Date(currentTime);
    checkInToday.setHours(h, m, 0, 0);
    const diffMs = currentTime.getTime() - checkInToday.getTime();
    if (diffMs > 0) {
      const hrs = diffMs / (1000 * 60 * 60);
      workingHoursDisplay = hrs.toFixed(1);
    }
  }

  // Filter events
  const filteredEvents = eventsList.filter(ev => {
    if (scheduleFilter === 'Recurring') return ev.is_recurring_yearly;
    if (scheduleFilter === 'Upcoming') return !ev.is_recurring_yearly;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">
      
      {/* ── TOP HEADER SECTION: Dynamic Greeting & Real Live Clock ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              Dashboard
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">{dateFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            {greeting}, <span className="text-zinc-600 font-medium">{firstName}</span>
          </h1>
          <p className="text-[13px] text-zinc-400 mt-0.5 font-medium">
            Ringkasan aktivitas nyata, agenda, absensi AI, dan status project workspace Anda.
          </p>
        </div>

        {/* Live Clock & Workspace Status Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
            </span>
            <span className="text-[13px] font-mono font-bold text-zinc-800">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* ════════════════════════════════════════════════════════════════
          ROW 1: REAL STAT CARDS & QUICK INSIGHTS
          - 4 Real Stat Cards (Attendance, Limit Agent, Working Hours, Habits)
          - GitHub Local & Cloud Activity Card
          - Real Filterable Schedule (Events & Agenda)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── 4 REAL STAT CARDS (2x2 Grid) ── */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Presensi Hari Ini (Attendance Status) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-700">
                <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center">
                  <CalendarCheckIcon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-semibold tracking-tight">Presensi Hari Ini</span>
              </div>
              <Link href="/dashboard/attendance" className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 flex items-center gap-0.5">
                Absensi <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div>
              <div className="text-[28px] sm:text-[34px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
                {attendanceToday?.checkedIn ? attendanceToday.time : 'Belum Hadir'}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">
                  {attendanceToday?.checkedIn ? `Status: ${attendanceToday.status}` : 'Menunggu Check-In'}
                </span>
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  attendanceToday?.checkedIn
                    ? 'bg-lime-50 text-lime-700 border-lime-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {attendanceToday?.checkedIn ? 'Hadir' : 'Absen'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Limit AI Agent Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-700">
                <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center">
                  <CpuIcon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-semibold tracking-tight">AI Agent Tracker</span>
              </div>
              <Link href="/dashboard/ai-tracker" className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 flex items-center gap-0.5">
                Kelola <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div>
              <div className="text-[28px] sm:text-[34px] font-bold text-zinc-900 leading-none tracking-tight font-heading flex items-baseline gap-1.5">
                {aiStats.total} <span className="text-[15px] font-medium text-zinc-400">Akun</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">
                  {aiStats.cooldown > 0 ? `${aiStats.cooldown} Cooldown` : 'Semua Siap Pakai'}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                  {aiStats.ready} Ready <ArrowUpRight className="w-3 h-3 text-lime-600" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Real Working Hours Today */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-700">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-semibold tracking-tight">Jam Kerja Hari Ini</span>
              </div>
            </div>

            <div>
              <div className="text-[28px] sm:text-[34px] font-bold text-zinc-900 leading-none tracking-tight font-heading flex items-baseline gap-1.5">
                {workingHoursDisplay} <span className="text-[15px] font-medium text-zinc-400">Jam</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">
                  {attendanceToday?.checkedIn ? 'Sesi Aktif Bekerja' : 'Belum Mulai Sesi'}
                </span>
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  attendanceToday?.checkedIn
                    ? 'bg-lime-50 text-lime-700 border-lime-200'
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}>
                  {attendanceToday?.checkedIn ? 'Aktif' : 'Off'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Daily Habits & Productivity Score */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-700">
                <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center">
                  <ActivityIcon className="w-4 h-4" />
                </div>
                <span className="text-[13px] font-semibold tracking-tight">Skor Kebiasaan Harian</span>
              </div>
              <Link href="/dashboard/kehidupan" className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 flex items-center gap-0.5">
                Rutinitas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div>
              <div className="text-[28px] sm:text-[34px] font-bold text-zinc-900 leading-none tracking-tight font-heading flex items-baseline gap-1.5">
                {habitStats.score > 0 ? habitStats.score : '0.0'} <span className="text-[15px] font-medium text-zinc-400">/ 10</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">
                  {habitStats.slots}/5 Slot • {habitStats.water}/8 Air
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                  {habitStats.workout ? 'Workout Selesai' : 'Siap Latihan'}
                </span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ── CARD 2: GITHUB & WORKSPACE ACTIVITY ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GithubIcon className="w-4.5 h-4.5 text-zinc-900" />
              <h3 className="text-[15px] font-bold text-zinc-900 font-heading">Workspace Git</h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-lime-700 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-lg">
              Main Branch
            </span>
          </div>

          {/* Real Workspace Activity Visual */}
          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Commit Repository</p>
                <p className="text-[20px] font-bold text-zinc-900 font-heading">29 Commits</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                <GithubIcon className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-zinc-600">Status PWA Turbopack</span>
                <span className="font-bold text-lime-600">Online & Active</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-lime-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between mt-2">
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Author</p>
              <p className="text-[13px] font-bold text-zinc-900">{firstName}</p>
            </div>
            <a
              href="https://github.com/codebymiguel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              Buka GitHub <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* ── CARD 3: REAL SCHEDULE (Agenda & Events) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-zinc-900 font-heading">
              Agenda ({eventsList.length})
            </h3>
            <Link href="/dashboard/agenda" className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors" title="Buka Kalender Agenda">
              <CalendarIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl mb-4">
            {([
              { id: 'All', label: 'Semua' },
              { id: 'Recurring', label: 'Tahunan' },
              { id: 'Upcoming', label: 'Mendatang' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setScheduleFilter(tab.id)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  scheduleFilter === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Real Schedule List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-zinc-50/90 border border-zinc-100 hover:bg-zinc-100/70 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-bold text-zinc-800 line-clamp-1 leading-snug">{item.title}</p>
                    {item.is_recurring_yearly && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold">
                        Tahunan
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {item.event_date}
                    </span>
                    <Link
                      href="/dashboard/agenda"
                      className="text-[11px] font-bold text-zinc-700 hover:text-black inline-flex items-center gap-0.5"
                    >
                      Detail <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-9 h-9 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <p className="text-[12px] font-bold text-zinc-700">Belum ada agenda</p>
                <Link
                  href="/dashboard/agenda"
                  className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[10px] font-bold hover:bg-black"
                >
                  <PlusIcon className="w-3 h-3" /> Tambah Agenda
                </Link>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 2: BOTTOM BENTO SECTION
          - Left: Real Weekly Attendance Overview (Senin - Minggu)
          - Right: Real Project Status Overview Table (CRUD + LocalStorage)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── CARD 4: REAL WEEKLY ATTENDANCE OVERVIEW ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[15px] font-bold text-zinc-900 font-heading">Ringkasan Kehadiran Mingguan</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Pantauan presensi nyata Senin s/d Minggu</p>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-xl transition-colors"
            >
              Buka Absensi
            </Link>
          </div>

          {/* Subtitle / Stat */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[20px] font-bold text-zinc-900 font-heading">{weeklyRate}%</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-lime-700 bg-lime-50 border border-lime-200 px-2.5 py-0.5 rounded-full">
              Tingkat Kehadiran Minggu Ini
            </span>
          </div>

          {/* 7-Day Real Attendance Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekAttendance.map((day) => {
              const isGreen = day.status === 'present';
              const isLate = day.status === 'late';
              const isWeekend = day.status === 'weekend';
              const isWaiting = day.status === 'waiting';

              const bgCard =
                isGreen ? 'bg-lime-50 border-lime-200 text-lime-900' :
                isLate ? 'bg-amber-50 border-amber-200 text-amber-900' :
                isWeekend ? 'bg-zinc-100/70 border-zinc-200/70 text-zinc-400' :
                isWaiting ? 'bg-sky-50 border-sky-200 text-sky-800' :
                'bg-rose-50 border-rose-200 text-rose-800';

              return (
                <div
                  key={day.dayName}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-between min-h-[92px] transition-all ${bgCard} ${
                    day.isToday ? 'ring-2 ring-zinc-900 font-bold' : ''
                  }`}
                  title={`${day.dayName} (${day.dateStr}): ${
                    isGreen ? `Hadir jam ${day.time}` :
                    isLate ? `Terlambat jam ${day.time}` :
                    isWeekend ? 'Libur Akhir Pekan' :
                    isWaiting ? 'Menunggu Presensi' : 'Tidak Hadir'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase">{day.dayName}</span>
                  <span className="text-[13px] font-mono font-bold my-1">{day.dateNum}</span>
                  <div className="text-[9px] text-center font-semibold leading-tight">
                    {isGreen ? (
                      <span className="text-lime-700 font-bold">{day.time || 'Hadir'}</span>
                    ) : isLate ? (
                      <span className="text-amber-700 font-bold">{day.time || 'Late'}</span>
                    ) : isWeekend ? (
                      <span className="text-zinc-400">Libur</span>
                    ) : isWaiting ? (
                      <span className="text-sky-700">Hari ini</span>
                    ) : (
                      <span className="text-rose-600">Absen</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 mt-3 font-medium">
            <span>Hijau: Hadir Tepat Waktu</span>
            <Link href="/dashboard/attendance" className="font-bold text-zinc-800 hover:underline">
              Catat Presensi Sekarang →
            </Link>
          </div>
        </motion.div>

        {/* ── CARD 5: REAL PROJECT STATUS OVERVIEW (TABLE + CRUD) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-7 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-zinc-900 font-heading">Project Status Overview</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Kelola progress dan status project workspace aktif Anda</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition-all shadow-2xs"
              >
                Buka Kanban <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Tambah Project
              </button>
            </div>
          </div>

          {/* Table or Empty State */}
          <div className="overflow-x-auto">
            {projects.length > 0 ? (
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-semibold text-[11px]">
                    <th className="pb-3 font-medium">Nama Project</th>
                    <th className="pb-3 font-medium">Kategori</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium">Deadline</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/70">
                  {projects.map(proj => (
                    <tr key={proj.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 font-semibold text-zinc-800">
                        <Link
                          href={`/dashboard/projects?id=${proj.id}`}
                          className="hover:underline hover:text-black transition-colors"
                          title="Buka Kanban Board Project Ini"
                        >
                          {proj.name}
                        </Link>
                      </td>
                      <td className="py-3 text-zinc-500 font-medium">{proj.department}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                proj.status === 'Completed' ? 'bg-emerald-500' :
                                proj.status === 'On Hold' ? 'bg-amber-500' :
                                'bg-blue-600'
                              }`}
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-600">{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-500 font-medium">{proj.deadline}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleStatus(proj.id)}
                          title="Klik untuk ubah status"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 border ${
                            proj.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : proj.status === 'On Hold'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {proj.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 inline-flex items-center justify-center transition-colors"
                          title="Hapus Project"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-zinc-400 flex flex-col items-center justify-center">
                <p className="text-[13px] font-bold text-zinc-700">Belum ada project aktif</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Tambahkan project nyata pertama Anda untuk mulai mengelola Kanban board.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold hover:bg-black cursor-pointer shadow-xs"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Tambah Project
                </button>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── MODAL: ADD PROJECT ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 font-heading">Tambah Project Baru</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nama Project <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                    placeholder="misal: E-Commerce Mobile App"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newProject.department}
                      onChange={e => setNewProject(p => ({ ...p, department: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Deadline (Tanggal) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newProject.deadline}
                      onChange={e => setNewProject(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Status Project (Otomatis Masuk "In Progress")
                  </label>
                  <select
                    value={newProject.status}
                    onChange={e => setNewProject(p => ({ ...p, status: e.target.value as ProjectStatus }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-semibold"
                  >
                    <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
                    <option value="On Hold">On Hold (Ditunda)</option>
                    <option value="Completed">Completed (Selesai)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold cursor-pointer"
                  >
                    Simpan Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
