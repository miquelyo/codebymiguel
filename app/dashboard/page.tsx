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

/* ─── Mock Data & Types ───────────────────────────────────────── */
interface ProjectItem {
  id: string;
  name: string;
  department: string;
  progress: number;
  deadline: string;
  status: 'On Track' | 'In Progress' | 'Delayed';
}

const INITIAL_PROJECTS: ProjectItem[] = [
  { id: '1', name: 'Portal Update', department: 'Engineering', progress: 85, deadline: 'Jun 28, 2026', status: 'On Track' },
  { id: '2', name: 'Hiring AI System', department: 'HR & People', progress: 60, deadline: 'Jun 20, 2026', status: 'In Progress' },
  { id: '3', name: 'Finance Report', department: 'Finance', progress: 95, deadline: 'Jun 14, 2026', status: 'On Track' },
  { id: '4', name: 'UX Revamp Bento', department: 'Design', progress: 75, deadline: 'Jun 24, 2026', status: 'On Track' },
  { id: '5', name: 'Chatbot AI Setup', department: 'Support', progress: 40, deadline: 'Jul 8, 2026', status: 'Delayed' },
];

// Heatmap Matrix Grid Data (6 rows: 17:00, 15:00, 13:00, 11:00, 09:00, 07:00 x 7 days)
// Intensity levels: 0 (empty), 1 (light), 2 (medium), 3 (high/peak)
const ATTENDANCE_HEATMAP = [
  // 17:00
  [1, 1, 1, 1, 1, 1, 1],
  // 15:00
  [1, 1, 2, 3, 1, 1, 1],
  // 13:00
  [1, 1, 3, 3, 3, 1, 2],
  // 11:00
  [1, 2, 3, 3, 2, 1, 2],
  // 09:00
  [1, 2, 2, 2, 1, 1, 1],
  // 07:00
  [1, 1, 1, 1, 1, 1, 1],
];

// 6x6 GitHub Contribution Dot Matrix
const GITHUB_DOTS = [
  [0, 0, 0, 0, 1, 2],
  [0, 1, 0, 0, 2, 3],
  [0, 1, 0, 0, 2, 2],
  [2, 0, 1, 0, 1, 3],
  [2, 2, 1, 1, 3, 2],
  [2, 3, 2, 2, 3, 2],
];

export default function DashboardPage() {
  const { user } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleFilter, setScheduleFilter] = useState<'All' | 'Meetings' | 'Events'>('All');
  
  // Real stats
  const [attendanceToday, setAttendanceToday] = useState<{ checkedIn: boolean; time?: string } | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [aiAgentsCount, setAiAgentsCount] = useState(0);
  const [eventsList, setEventsList] = useState<Array<{ id: string; title: string; event_date: string; type?: string; time?: string; link?: string }>>([]);

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<{
    name: string;
    department: string;
    progress: number;
    deadline: string;
    status: ProjectItem['status'];
  }>({ name: '', department: 'Engineering', progress: 50, deadline: 'Jul 15, 2026', status: 'In Progress' });

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    if (!user?.email) return () => clearInterval(clockTimer);

    // Load Supabase Data
    const fetchDashboardData = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Attendance
        const { data: att } = await supabase
          .from('attendance')
          .select('check_in')
          .eq('user_email', user.email)
          .eq('date', todayStr)
          .maybeSingle();

        if (att?.check_in) {
          setAttendanceToday({ checkedIn: true, time: new Date(att.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) });
        } else {
          setAttendanceToday({ checkedIn: false });
        }

        // 2. Events / Schedule
        const { data: evList, count: evCount } = await supabase
          .from('events')
          .select('id, title, event_date', { count: 'exact' })
          .eq('user_email', user.email)
          .order('event_date', { ascending: true })
          .limit(5);

        if (evCount !== null) setEventsCount(evCount);
        if (evList && evList.length > 0) {
          setEventsList(evList.map((e, idx) => ({
            id: e.id,
            title: e.title,
            event_date: e.event_date,
            type: idx % 2 === 0 ? 'Meetings' : 'Events',
            time: '09:00 - 10:30',
            link: idx % 2 === 0 ? 'Google Meet' : 'Zoom Meeting',
          })));
        } else {
          // Default mock events if empty
          setEventsList([
            { id: '1', title: 'Interview Candidate - Customer Service', event_date: '26 September, 2026', type: 'Meetings', time: '09:00 - 09:30', link: 'Google Meet' },
            { id: '2', title: 'Town-hall Office - Q3 Roadmap', event_date: '30 September, 2026', type: 'Events', time: '09:30 - 11:30', link: 'Zoom Meeting' },
          ]);
        }

        // 3. AI Agents
        const { count: aiCount } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('user_email', user.email);

        if (aiCount !== null) setAiAgentsCount(aiCount);
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      }
    };

    fetchDashboardData();
    return () => clearInterval(clockTimer);
  }, [user]);

  if (!mounted) return null;

  const hour = currentTime.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? 'Good morning' :
    hour >= 12 && hour < 17 ? 'Good afternoon' :
    hour >= 17 && hour < 21 ? 'Good evening' :
    'Good night';

  const firstName = user?.name?.trim()
    ? user.name.trim().split(' ')[0]
    : (user?.email ? user.email.split('@')[0] : 'Miguel');

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateFormatted = `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    const item: ProjectItem = {
      id: Date.now().toString(),
      name: newProject.name,
      department: newProject.department,
      progress: Number(newProject.progress) || 10,
      deadline: newProject.deadline,
      status: newProject.status,
    };
    setProjects(prev => [item, ...prev]);
    setIsAddModalOpen(false);
    setNewProject({ name: '', department: 'Engineering', progress: 50, deadline: 'Jul 15, 2026', status: 'In Progress' });
  };

  const filteredEvents = eventsList.filter(ev => {
    if (scheduleFilter === 'All') return true;
    return ev.type === scheduleFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">
      
      {/* ── TOP HEADER SECTION: Dashboard Title & Dynamic Greeting ── */}
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
            Here&apos;s an overview of your activity, projects, and schedule today.
          </p>
        </div>

        {/* Live Clock & Quick Status Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
            </span>
            <span className="text-[13px] font-mono font-bold text-zinc-800">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* ════════════════════════════════════════════════════════════════
          ROW 1: TOP BENTO SECTION
          - Col 1: 4 Stat Cards (2x2)
          - Col 2: GitHub Activity (Dot Matrix)
          - Col 3: Schedule (Filterable Events)
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── 4 STAT CARDS (2x2 Grid) ── */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Attendance Rate */}
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
                <span className="text-[13px] font-semibold tracking-tight">Attendance Rate</span>
              </div>
            </div>

            <div>
              <div className="text-[36px] sm:text-[40px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
                {attendanceToday?.checkedIn ? '98%' : '92%'}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">Calendar Check</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                  +2.5% <ArrowUpRight className="w-3 h-3 text-lime-600" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Limit Agent & Tasks (previously Payroll Processed) */}
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
                <span className="text-[13px] font-semibold tracking-tight">Limit Agent & Tasks</span>
              </div>
            </div>

            <div>
              <div className="text-[36px] sm:text-[40px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
                {aiAgentsCount > 0 ? aiAgentsCount * 155 : 1240}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">Tasks Executed</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                  +1.8% <ArrowUpRight className="w-3 h-3 text-lime-600" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Average Working Hours */}
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
                <span className="text-[13px] font-semibold tracking-tight">Average Working Hours</span>
              </div>
            </div>

            <div>
              <div className="text-[36px] sm:text-[40px] font-bold text-zinc-900 leading-none tracking-tight font-heading flex items-baseline gap-1.5">
                7.9 <span className="text-[16px] font-medium text-zinc-400">hrs</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">Per Session Daily</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  -0.4% <ArrowDownRight className="w-3 h-3 text-rose-500" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Productivity / Habits Score (previously Employee Satisfaction) */}
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
                <span className="text-[13px] font-semibold tracking-tight">Productivity Score</span>
              </div>
            </div>

            <div>
              <div className="text-[36px] sm:text-[40px] font-bold text-zinc-900 leading-none tracking-tight font-heading flex items-baseline gap-1.5">
                8.7 <span className="text-[16px] font-medium text-zinc-400">/10</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-zinc-400 font-medium">Habit & Task Performance</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                  +0.6% <ArrowUpRight className="w-3 h-3 text-lime-600" />
                </span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ── CARD 2: GITHUB ACTIVITY (Dot Matrix) ── */}
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
              <h3 className="text-[15px] font-bold text-zinc-900 font-heading">GitHub Activity</h3>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
              Monthly <ChevronDownIcon className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Matrix of round dots (like reference) */}
          <div className="flex items-center justify-center py-2">
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
              {GITHUB_DOTS.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  // Shading: 0: zinc-100, 1: lime-200, 2: lime-400, 3: emerald-500
                  const colorClass =
                    val === 3 ? 'bg-lime-400 shadow-sm shadow-lime-400/30' :
                    val === 2 ? 'bg-lime-500' :
                    val === 1 ? 'bg-lime-200' :
                    'bg-zinc-100';

                  return (
                    <motion.div
                      key={`${rIdx}-${cIdx}`}
                      whileHover={{ scale: 1.25 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${colorClass} transition-colors cursor-pointer`}
                      title={`Activity Level: ${val}`}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between mt-3">
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Total Commits</p>
              <p className="text-[16px] font-bold text-zinc-900 font-heading">1,240</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-zinc-400 font-medium">Streak</p>
              <p className="text-[16px] font-bold text-zinc-900 font-heading">100%</p>
            </div>
          </div>
        </motion.div>

        {/* ── CARD 3: SCHEDULE (Agenda & Events) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-zinc-900 font-heading">
              Schedule ({eventsCount || eventsList.length})
            </h3>
            <Link href="/dashboard/agenda" className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors">
              <CalendarIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl mb-4">
            {(['All', 'Meetings', 'Events'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setScheduleFilter(tab)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  scheduleFilter === tab
                    ? 'bg-white text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Schedule List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {filteredEvents.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100 hover:bg-zinc-100/60 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold text-zinc-800 line-clamp-1 leading-snug">{item.title}</p>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {item.event_date} <span className="text-zinc-300">•</span> {item.time || '09:00 - 10:30'}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 hover:text-black">
                    {item.link || 'Google Meet'} <ArrowRight className="w-3 h-3" />
                  </span>
                  {/* Avatar stack */}
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-violet-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-violet-800">M</div>
                    <div className="w-5 h-5 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-800">Y</div>
                    <div className="w-5 h-5 rounded-full bg-sky-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-sky-800">A</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 2: BOTTOM BENTO SECTION
          - Left: Attendance Overview Heatmap (Hours x Days)
          - Right: Project Status Overview Table
      ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── CARD 4: ATTENDANCE OVERVIEW (HEATMAP) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-bold text-zinc-900 font-heading">Attendance Overview</h3>
            <button className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
              This week <ChevronDownIcon className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Subtitle / Stat */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[16px] font-bold text-zinc-900 font-heading">98%</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-lime-700 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 text-lime-600" /> 2.5% vs last week
            </span>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-1">
            <div className="space-y-1.5 flex-1 flex flex-col justify-center min-w-[280px]">
              {['17:00', '15:00', '13:00', '11:00', '09:00', '07:00'].map((timeLabel, rIdx) => (
                <div key={timeLabel} className="flex items-center gap-2">
                  <span className="w-10 text-[10px] font-medium text-zinc-400 text-right">{timeLabel}</span>
                  <div className="grid grid-cols-7 gap-1.5 flex-1">
                    {ATTENDANCE_HEATMAP[rIdx].map((level, cIdx) => {
                      // Level shading for light mode
                      // 3: White / highlight glow (in light mode: vibrant lime-400 or dark-slate)
                      // Let's use clean modern shades matching light mode aesthetic
                      const cellColor =
                        level === 3 ? 'bg-zinc-900 border border-zinc-900' :
                        level === 2 ? 'bg-zinc-400/80' :
                        level === 1 ? 'bg-zinc-200/90' :
                        'bg-zinc-100';

                      return (
                        <div
                          key={cIdx}
                          className={`h-6 rounded-[6px] ${cellColor} transition-transform hover:scale-105 cursor-pointer`}
                          title={`Jam ${timeLabel} - Intensitas ${level}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Day headers */}
              <div className="flex items-center gap-2 pt-1.5">
                <span className="w-10" />
                <div className="grid grid-cols-7 gap-1.5 flex-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] font-semibold text-zinc-400">{day}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── CARD 5: PROJECT STATUS OVERVIEW (TABLE) ── */}
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
              <p className="text-[11px] text-zinc-400 mt-0.5">Track project completion and department responsibility</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Add Project
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-semibold text-[11px]">
                  <th className="pb-3 font-medium">Project Name</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 font-medium">Deadline</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/70">
                {projects.map(proj => (
                  <tr key={proj.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 font-semibold text-zinc-800">{proj.name}</td>
                    <td className="py-3 text-zinc-500 font-medium">{proj.department}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 max-w-[120px]">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              proj.status === 'Delayed' ? 'bg-rose-500' :
                              proj.status === 'In Progress' ? 'bg-amber-500' :
                              'bg-lime-500'
                            }`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-600">{proj.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-zinc-500 font-medium">{proj.deadline}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'On Track'
                          ? 'bg-lime-50 text-lime-700 border border-lime-200'
                          : proj.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          proj.status === 'On Track' ? 'bg-lime-500' :
                          proj.status === 'In Progress' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

              <form onSubmit={handleAddProject} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nama Project</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                    placeholder="misal: AI Agent Orchestrator"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={newProject.department}
                      onChange={e => setNewProject(p => ({ ...p, department: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newProject.progress}
                      onChange={e => setNewProject(p => ({ ...p, progress: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Deadline</label>
                    <input
                      type="text"
                      value={newProject.deadline}
                      onChange={e => setNewProject(p => ({ ...p, deadline: e.target.value }))}
                      placeholder="e.g. Aug 10, 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Status</label>
                    <select
                      value={newProject.status}
                      onChange={e => setNewProject(p => ({ ...p, status: e.target.value as ProjectItem['status'] }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    >
                      <option value="On Track">On Track</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold"
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
