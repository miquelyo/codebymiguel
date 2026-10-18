'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring_yearly: boolean;
  is_history: boolean;
}

function formatIndoDate(dateStr: string) {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${d} ${monthNames[m]} ${y}`;
}

function getNextOccurrence(dateStr: string, isRecurringYearly: boolean): {
  nextDate: Date;
  nextDateStr: string;
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
        nextDateStr: dateStr,
        daysRemaining: diff,
        label: 'Terlewat',
        badgeClass: 'bg-surface-hover text-muted border border-border',
        isToday: false,
      };
    }
    if (diff === 0) {
      return {
        nextDate: target,
        nextDateStr: dateStr,
        daysRemaining: 0,
        label: 'Hari ini',
        badgeClass: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 font-bold',
        isToday: true,
      };
    }
    if (diff === 1) {
      return {
        nextDate: target,
        nextDateStr: dateStr,
        daysRemaining: 1,
        label: 'Besok',
        badgeClass: 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/20 font-bold',
        isToday: false,
      };
    }
    return {
      nextDate: target,
      nextDateStr: dateStr,
      daysRemaining: diff,
      label: `${diff} hari lagi`,
      badgeClass: 'bg-primary/10 text-primary border border-primary/20',
      isToday: false,
    };
  }

  // Yearly recurring (Birthday, Anniversary) - NEVER expired!
  const parts = dateStr.split('-');
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const currentYear = today.getFullYear();

  let next = new Date(currentYear, m, d);
  next.setHours(0, 0, 0, 0);

  // If this year's date has passed, next occurrence is in the next year
  if (next.getTime() < today.getTime()) {
    next = new Date(currentYear + 1, m, d);
  }

  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const nextDateStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;

  if (diff === 0) {
    return {
      nextDate: next,
      nextDateStr,
      daysRemaining: 0,
      label: 'Hari Ini! 🎂🎉',
      badgeClass: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold animate-pulse',
      isToday: true,
    };
  }
  if (diff === 1) {
    return {
      nextDate: next,
      nextDateStr,
      daysRemaining: 1,
      label: 'Besok! 🎂',
      badgeClass: 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 font-bold',
      isToday: false,
    };
  }
  return {
    nextDate: next,
    nextDateStr,
    daysRemaining: diff,
    label: `${diff} hari lagi`,
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/25 font-semibold',
    isToday: false,
  };
}

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

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="glass-card p-5 rounded-3xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted mb-2 uppercase tracking-wider">
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
                  ? 'bg-primary text-white shadow-sm'
                  : isToday
                  ? 'border border-primary text-primary font-bold'
                  : 'hover:bg-surface-hover text-foreground/80'
              }`}
            >
              <span>{date.getDate()}</span>
              {hasEvent && (
                <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-primary'}`} />
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
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'all' | 'history'>('upcoming');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    is_recurring_yearly: false,
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';
    const todayStr = new Date().toISOString().split('T')[0];

    // Mark passed NON-RECURRING events as history (recurring events like birthdays are NEVER history!)
    await supabase
      .from('events')
      .update({ is_history: true })
      .or(`user_email.eq.${userEmail},user_email.eq.yosafatmiquel@gmail.com`)
      .eq('is_recurring_yearly', false)
      .eq('is_history', false)
      .lt('event_date', todayStr);

    const { data } = await supabase
      .from('events')
      .select('*')
      .or(`user_email.eq.${userEmail},user_email.eq.yosafatmiquel@gmail.com`)
      .order('event_date', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';

    const { error } = await supabase.from('events').insert({
      user_email: userEmail,
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      is_recurring_yearly: form.is_recurring_yearly,
      is_history: false,
    });

    if (error) {
      toast.error('Gagal menyimpan event: ' + error.message);
      return;
    }

    toast.success('Event berhasil ditambahkan!');
    setForm({ title: '', description: '', event_date: '', is_recurring_yearly: false });
    setIsModalOpen(false);
    loadEvents();
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('events').delete().eq('id', deleteId);
    if (error) {
      toast.error('Gagal menghapus event!');
    } else {
      toast.success('Event berhasil dihapus!');
    }
    setDeleteId(null);
    loadEvents();
  };

  // Filter and sort events
  const filteredEvents = events.filter((e) => {
    if (selectedDate) {
      const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const selectedMonthDay = `${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      return e.is_recurring_yearly ? e.event_date.slice(5) === selectedMonthDay : e.event_date === selectedStr;
    }
    // Recurring events are NEVER history, they belong in 'upcoming' and 'all'
    if (currentTab === 'history') return e.is_history && !e.is_recurring_yearly;
    if (currentTab === 'upcoming') return !e.is_history || e.is_recurring_yearly;
    return true;
  });

  // Sort upcoming events so nearest occurrence appears first
  const displayEvents = [...filteredEvents].sort((a, b) => {
    const occA = getNextOccurrence(a.event_date, a.is_recurring_yearly);
    const occB = getNextOccurrence(b.event_date, b.is_recurring_yearly);
    return occA.nextDate.getTime() - occB.nextDate.getTime();
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Agenda & Kalender
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Jadwal meeting, deadline penting, dan agenda tahunan terintegrasi dengan reminder.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedDate) {
              const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              setForm((prev) => ({ ...prev, event_date: dStr }));
            }
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tambah Agenda Baru</span>
        </button>
      </div>

      {/* ── Main Layout: Calendar Widget + Events Feed ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mini Calendar & Filter Tabs */}
        <div className="lg:col-span-4 space-y-4">
          <MiniCalendar
            events={events}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              if (selectedDate && selectedDate.toDateString() === d.toDateString()) {
                setSelectedDate(null); // toggle off
              } else {
                setSelectedDate(d);
              }
            }}
          />

          {selectedDate && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">
                Filter: {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Quick tab filters */}
          <div className="glass-card p-2 rounded-2xl flex items-center justify-around text-xs">
            {(['upcoming', 'all', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedDate(null);
                  setCurrentTab(t);
                }}
                className={`flex-1 py-2 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                  currentTab === t && !selectedDate
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {t === 'upcoming' ? 'Mendatang' : t === 'all' ? 'Semua' : 'Riwayat'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Events List */}
        <div className="lg:col-span-8 space-y-3.5">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : displayEvents.length > 0 ? (
            displayEvents.map((ev) => {
              const occ = getNextOccurrence(ev.event_date, ev.is_recurring_yearly);
              return (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${occ.badgeClass}`}>
                        {occ.label}
                      </span>
                      {ev.is_recurring_yearly && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Ulang Tahun / Tahunan 🔁
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-muted">
                        {ev.is_recurring_yearly
                          ? `Tiap ${formatIndoDate(ev.event_date).slice(0, -5)} • Berikutnya: ${formatIndoDate(occ.nextDateStr)}`
                          : formatIndoDate(ev.event_date)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setDeleteId(ev.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-danger/10 text-muted hover:text-danger border border-border/60 transition-colors cursor-pointer"
                      title="Hapus Event"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-card py-16 text-center text-muted p-6 flex flex-col items-center justify-center">
              <svg className="w-10 h-10 text-muted/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <h4 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Tidak ada agenda
              </h4>
              <p className="text-xs max-w-sm mb-4">
                Belum ada jadwal yang tersimpan untuk filter saat ini.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Buat Jadwal Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Event Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-card rounded-3xl p-6 sm:p-7 border border-border shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/60">
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Tambah Agenda Baru
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Nama Acara / Agenda</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Sprint Review & Release v2.0"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground placeholder:text-muted/60 focus:border-primary outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Tanggal Acara</label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Deskripsi (Opsional)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Keterangan lokasi, link meeting, atau catatan persiapan..."
                    className="w-full p-3.5 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted/60 focus:border-primary outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-hover/80 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Acara Berulang Tahunan</p>
                    <p className="text-[10px] text-muted">Ulang tahun, peringatan tahunan, dll.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_recurring_yearly}
                    onChange={(e) => setForm({ ...form, is_recurring_yearly: e.target.checked })}
                    className="w-5 h-5 rounded-md accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    Simpan Agenda
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Agenda?"
        message="Agenda ini akan dihapus dari kalender kerja Anda."
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
