'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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
function RepeatIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function HistoryIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
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
function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function ChevronLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
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
function ArrowUpRight({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring_yearly: boolean;
  is_history: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

function getNextOccurrence(dateStr: string, isRecurringYearly: boolean): {
  nextDate: Date;
  daysRemaining: number;
  label: string;
  badgeClass: string;
  isToday: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isRecurringYearly) {
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      return {
        nextDate: target,
        daysRemaining: diff,
        label: 'Terlewat',
        badgeClass: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
        isToday: false,
      };
    }
    if (diff === 0) {
      return {
        nextDate: target,
        daysRemaining: 0,
        label: 'Hari ini',
        badgeClass: 'bg-lime-50 text-lime-700 border border-lime-200 font-bold',
        isToday: true,
      };
    }
    if (diff === 1) {
      return {
        nextDate: target,
        daysRemaining: 1,
        label: 'Besok',
        badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200 font-bold',
        isToday: false,
      };
    }
    return {
      nextDate: target,
      daysRemaining: diff,
      label: `${diff} hari lagi`,
      badgeClass: 'bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium',
      isToday: false,
    };
  }

  // Yearly recurring
  const parts = dateStr.split('-');
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const currentYear = today.getFullYear();

  let next = new Date(currentYear, m, d);
  next.setHours(0, 0, 0, 0);

  if (next.getTime() < today.getTime()) {
    next = new Date(currentYear + 1, m, d);
  }

  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) {
    return {
      nextDate: next,
      daysRemaining: 0,
      label: 'Hari ini (Tahunan)',
      badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200 font-bold',
      isToday: true,
    };
  }
  if (diff === 1) {
    return {
      nextDate: next,
      daysRemaining: 1,
      label: 'Besok (Tahunan)',
      badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200 font-bold',
      isToday: false,
    };
  }
  return {
    nextDate: next,
    daysRemaining: diff,
    label: `${diff} hari lagi`,
    badgeClass: 'bg-violet-50 text-violet-700 border border-violet-200 font-medium',
    isToday: false,
  };
}

/* ── MiniCalendar Bento Component ───────────────────────────── */
function MiniCalendar({
  events,
  selectedDate,
  onSelectDate,
}: {
  events: EventData[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  return (
    <div className="bg-white rounded-[24px] p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 font-heading">
            {MONTH_NAMES[month]}, {year}
          </h4>
          <span className="text-[11px] text-zinc-400 font-medium">Kalender Interaktif</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Bulan sebelumnya"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Bulan berikutnya"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider">
        <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((date, index) => {
          if (!date) return <div key={index} className="h-8" />;
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const monthDayStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const hasEvent = events.some((e) =>
            e.is_recurring_yearly ? e.event_date.slice(5) === monthDayStr : e.event_date === dateStr
          );

          return (
            <button
              key={index}
              onClick={() => onSelectDate(date)}
              className={`h-8 rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-sm font-bold'
                  : isToday
                  ? 'border border-zinc-900 text-zinc-900 font-bold bg-zinc-50'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <span>{date.getDate()}</span>
              {hasEvent && (
                <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-lime-400' : 'bg-lime-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'all' | 'yearly' | 'history'>('upcoming');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpenMobile, setIsCalendarOpenMobile] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    is_recurring_yearly: false,
  });

  const loadEvents = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const userEmail = user.email;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      await supabase
        .from('events')
        .update({ is_history: true })
        .eq('user_email', userEmail)
        .eq('is_recurring_yearly', false)
        .eq('is_history', false)
        .lt('event_date', todayStr);
    } catch {}

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_email', userEmail)
      .order('event_date', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date || !user?.email) {
      toast.error('Harap lengkapi judul dan tanggal acara.');
      return;
    }
    const userEmail = user.email;

    const { error } = await supabase.from('events').insert({
      user_email: userEmail,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      event_date: form.event_date,
      is_recurring_yearly: form.is_recurring_yearly,
      is_history: false,
    });

    if (error) {
      toast.error('Gagal menyimpan event: ' + error.message);
      return;
    }

    toast.success('Agenda baru berhasil ditambahkan!');
    setForm({ title: '', description: '', event_date: '', is_recurring_yearly: false });
    setIsModalOpen(false);
    loadEvents();
  };

  const executeDelete = async () => {
    if (!deleteId || !user?.email) return;
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', deleteId)
      .eq('user_email', user.email);
    if (error) {
      toast.error('Gagal menghapus event!');
    } else {
      toast.success('Event berhasil dihapus!');
    }
    setDeleteId(null);
    loadEvents();
  };

  const filteredEvents = events.filter((e) => {
    if (selectedDate) {
      const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const selectedMonthDay = `${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      return e.is_recurring_yearly ? e.event_date.slice(5) === selectedMonthDay : e.event_date === selectedStr;
    }
    if (currentTab === 'yearly') return e.is_recurring_yearly;
    if (currentTab === 'history') return e.is_history && !e.is_recurring_yearly;
    if (currentTab === 'upcoming') return !e.is_history || e.is_recurring_yearly;
    return true;
  });

  const displayEvents = [...filteredEvents].sort((a, b) => {
    const occA = getNextOccurrence(a.event_date, a.is_recurring_yearly);
    const occB = getNextOccurrence(b.event_date, b.is_recurring_yearly);
    return occA.nextDate.getTime() - occB.nextDate.getTime();
  });

  const totalCount = events.length;
  const upcomingCount = events.filter((e) => !e.is_history || e.is_recurring_yearly).length;
  const yearlyCount = events.filter((e) => e.is_recurring_yearly).length;
  const historyCount = events.filter((e) => e.is_history && !e.is_recurring_yearly).length;

  const today = new Date();
  const daysID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dateFormatted = `${daysID[today.getDay()]}, ${today.getDate()} ${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">

      {/* ── TOP HEADER SECTION: Agenda Title & Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              AGENDA & EVENTS
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">{dateFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            Agenda & Events
          </h1>
          <p className="text-[13px] text-zinc-400 mt-0.5 font-medium">
            Kelola jadwal pertemuan, deadline proyek, target peluncuran, dan acara penting Anda.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (selectedDate) {
                const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                setForm((prev) => ({ ...prev, event_date: dStr }));
              }
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Tambah Agenda Baru</span>
          </button>
        </div>
      </motion.div>

      {/* ── 4 STAT CARDS (Bento Row) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Agenda */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 text-zinc-700 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-zinc-800">Total Agenda</span>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
              {totalCount}
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2.5">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Semua acara</p>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                All
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Upcoming */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 text-zinc-700 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center shrink-0">
              <CalendarCheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-zinc-800">Mendatang</span>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
              {upcomingCount}
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2.5">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Jadwal aktif</p>
              <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-lime-50 text-lime-700 border border-lime-200 shrink-0">
                Active <ArrowUpRight className="w-2.5 h-2.5 text-lime-600" />
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Yearly Recurring */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 text-zinc-700 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <RepeatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-zinc-800">Tahunan</span>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
              {yearlyCount}
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2.5">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Ulang tahun</p>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                Yearly
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: History */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 text-zinc-700 mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
              <HistoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-zinc-800">Riwayat</span>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-900 leading-none tracking-tight font-heading">
              {historyCount}
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2.5">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Selesai</p>
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                Past
              </span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── BENTO MAIN CONTENT (12 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        
        {/* Left Col (4 cols): Mini Calendar & Tabs */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">
          
          {/* Mobile Calendar Toggle Bar */}
          <div className="lg:hidden flex items-center justify-between p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon className="w-4 h-4 text-zinc-600 shrink-0" />
              <span className="text-xs font-bold text-zinc-800 truncate">
                {selectedDate
                  ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Kalender Bulanan'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCalendarOpenMobile(!isCalendarOpenMobile)}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition-colors shrink-0"
            >
              {isCalendarOpenMobile ? 'Tutup Kalender ▲' : 'Buka Kalender ▼'}
            </button>
          </div>

          {/* Calendar Widget (Collapsible on Mobile, Always Visible on Desktop) */}
          <div className={`${isCalendarOpenMobile ? 'block' : 'hidden'} lg:block`}>
            <MiniCalendar
              events={events}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                if (selectedDate && selectedDate.toDateString() === d.toDateString()) {
                  setSelectedDate(null);
                } else {
                  setSelectedDate(d);
                }
              }}
            />
          </div>

          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-[18px] bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-lime-600 block uppercase tracking-wider">Filter Tanggal Aktif</span>
                <span className="font-bold text-zinc-900 text-xs">
                  {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
              >
                Reset
              </button>
            </motion.div>
          )}

          {/* Filter Pills (Horizontal on Mobile, Vertical on Desktop) */}
          <div className="bg-white rounded-[22px] sm:rounded-[24px] p-2 sm:p-3 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <p className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 mb-1">
              Kategori Tampilan
            </p>
            <div className="flex flex-row lg:flex-col overflow-x-auto no-scrollbar gap-1.5">
              {[
                { id: 'upcoming', label: 'Mendatang', fullLabel: 'Jadwal Mendatang', count: upcomingCount },
                { id: 'all', label: 'Semua', fullLabel: 'Semua Agenda', count: totalCount },
                { id: 'yearly', label: 'Tahunan', fullLabel: 'Acara Tahunan', count: yearlyCount },
                { id: 'history', label: 'Riwayat', fullLabel: 'Riwayat Selesai', count: historyCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedDate(null);
                    setCurrentTab(tab.id as any);
                  }}
                  className={`flex-1 lg:flex-initial flex items-center justify-between gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    currentTab === tab.id && !selectedDate
                      ? 'bg-zinc-900 text-white font-bold shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span>
                    <span className="lg:hidden">{tab.label}</span>
                    <span className="hidden lg:inline">{tab.fullLabel}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    currentTab === tab.id && !selectedDate ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col (8 cols): Event Cards Feed */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-zinc-900 font-heading">
              Daftar Agenda ({displayEvents.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Diurutkan jadwal terdekat</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 border border-zinc-200/80 animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 rounded w-1/3" />
                    <div className="h-3 bg-zinc-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayEvents.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 sm:p-12 border border-zinc-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-800 font-heading">Tidak ada agenda</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Belum ada jadwal yang cocok dengan filter yang dipilih. Tambahkan agenda baru untuk mulai mengatur timeline.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-black transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Buat Agenda Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {displayEvents.map((ev) => {
                const occ = getNextOccurrence(ev.event_date, ev.is_recurring_yearly);
                const parts = ev.event_date.split('-');
                const monthShort = MONTH_SHORT[parseInt(parts[1], 10) - 1];
                const dayNum = parseInt(parts[2], 10);
                const yearNum = parts[0];

                return (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Date Block */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-extrabold text-zinc-400 tracking-wider font-mono uppercase">{monthShort}</span>
                        <span className="text-[18px] sm:text-[20px] font-extrabold text-zinc-900 font-heading leading-tight">{dayNum}</span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 leading-snug break-words">{ev.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${occ.badgeClass}`}>
                            {occ.label}
                          </span>
                          {ev.is_recurring_yearly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              <RepeatIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Tahunan
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="text-xs text-zinc-500 line-clamp-2 break-words">{ev.description}</p>
                        )}

                        <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">
                          {ev.is_recurring_yearly ? `Setiap ${dayNum} ${MONTH_NAMES[parseInt(parts[1], 10) - 1]}` : `${dayNum} ${MONTH_NAMES[parseInt(parts[1], 10) - 1]} ${yearNum}`}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end sm:justify-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setDeleteId(ev.id)}
                        className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Agenda"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL: ADD EVENT ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">Tambah Agenda Baru</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Jadwalkan rapat, deadline, atau acara rutin</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Judul Agenda</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="misal: Sprint Review & Demo AI"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Tanggal Acara</label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Deskripsi (Opsional)</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Catatan tambahan, agenda rapat, atau link meeting..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={form.is_recurring_yearly}
                    onChange={(e) => setForm((f) => ({ ...f, is_recurring_yearly: e.target.checked }))}
                    className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300"
                  />
                  <label htmlFor="is_recurring" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                    Ulangi setiap tahun (Acara Tahunan)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Simpan Agenda
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Agenda"
        message="Apakah Anda yakin ingin menghapus agenda ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
}
