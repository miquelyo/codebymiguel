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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
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

// Komponen Kalender Sederhana
function MiniCalendar({ events, onSelectDate }: { events: EventData[], onSelectDate: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  const today = new Date();
  
  return (
    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm glass">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors">
          <ChevronLeftIcon className="w-4 h-4 text-muted" />
        </button>
        <span className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors">
          <ChevronRightIcon className="w-4 h-4 text-muted" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} className="text-[10px] font-bold text-muted uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanksArray.map(b => <div key={`blank-${b}`} className="h-8" />)}
        {daysArray.map(d => {
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
          const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
          
          const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
          const hasEvent = events.some(e => {
            if (e.is_recurring_yearly) {
              const ev = new Date(e.event_date);
              return ev.getDate() === dateObj.getDate() && ev.getMonth() === dateObj.getMonth();
            }
            return e.event_date === dateStr;
          });

          return (
            <button
              key={d}
              onClick={() => onSelectDate(dateObj)}
              className={`
                h-8 text-xs font-medium rounded-full flex items-center justify-center relative transition-all
                ${isToday ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-surface-hover'}
              `}
            >
              {d}
              {hasEvent && !isToday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
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
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'history'>('upcoming');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    is_recurring_yearly: false,
  });

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const todayStr = new Date().toLocaleDateString('en-CA');

    // Auto-update past one-time events to history
    await supabase
      .from('events')
      .update({ is_history: true })
      .eq('user_email', user.email)
      .eq('is_recurring_yearly', false)
      .eq('is_history', false)
      .lt('event_date', todayStr);

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_email', user.email)
      .order('event_date', { ascending: true });

    setEvents(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title || !form.event_date) return;

    const { error } = await supabase.from('events').insert({
      user_email: user.email,
      title: form.title,
      description: form.description,
      event_date: form.event_date,
      is_recurring_yearly: form.is_recurring_yearly,
      is_history: false,
    });

    if (error) {
      toast.error('Gagal menyimpan event: ' + error.message);
      console.error(error);
      return;
    }

    toast.success('Event berhasil ditambahkan!');
    setForm({ title: '', description: '', event_date: '', is_recurring_yearly: false });
    setIsModalOpen(false);
    loadEvents();
  };

  const executeDelete = async () => {
    if(!deleteId) return;
    const { error } = await supabase.from('events').delete().eq('id', deleteId);
    if(error) {
      toast.error('Gagal menghapus event!');
    } else {
      toast.success('Event berhasil dihapus!');
    }
    setDeleteId(null);
    loadEvents();
  };

  const todayObj = new Date();
  todayObj.setHours(0,0,0,0);

  const displayEvents = events.filter(e => {
    if (currentTab === 'history') return e.is_history;
    return !e.is_history;
  });

  return (
    <div className="max-w-6xl space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 bg-card rounded-[24px] border border-border shadow-sm glass relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Scheduler</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Agenda & Events
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Kelola jadwal meeting, interview, hingga hari ulang tahun. Event sekali lewat otomatis masuk ke history!
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all w-full md:w-auto"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Event</span>
        </button>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 w-full order-2 lg:order-1 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-border">
            <button
              onClick={() => setCurrentTab('upcoming')}
              className={`px-4 py-3 text-[14px] font-semibold transition-colors border-b-2 ${currentTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              Akan Datang & Rutin
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`px-4 py-3 text-[14px] font-semibold transition-colors border-b-2 ${currentTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              History (Selesai)
            </button>
          </div>

          {/* List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-10 text-center text-muted">Memuat data...</div>
            ) : displayEvents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted bg-surface border border-border/50 rounded-2xl border-dashed">
                Tidak ada event di kategori ini.
              </div>
            ) : (
              displayEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border p-5 rounded-2xl flex flex-col gap-3 card-glow group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{ev.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-primary">
                          {new Date(ev.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {ev.is_recurring_yearly && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning">
                            Tiap Tahun
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteId(ev.id)}
                      className="p-2 rounded-lg text-muted hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                      title="Hapus"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  {ev.description && (
                    <p className="text-[13px] text-muted leading-relaxed">{ev.description}</p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar / Kalender Mini */}
        <div className="w-full lg:w-[280px] shrink-0 order-1 lg:order-2">
          <MiniCalendar 
            events={events} 
            onSelectDate={(date) => {
              // Format ke YYYY-MM-DD
              const dateStr = date.toLocaleDateString('en-CA');
              setForm(prev => ({ ...prev, event_date: dateStr }));
              setIsModalOpen(true);
            }} 
          />
          <p className="text-[10px] text-muted mt-3 text-center px-4">
            Klik tanggal di kalender untuk menambahkan event secara cepat.
          </p>
        </div>
      </div>

      {/* Modal Tambah */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border"
            >
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Buat Event Baru</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Nama Event / Acara</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    placeholder="Contoh: Meeting Klien, Ulang Tahun, dsb."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Tanggal</label>
                  <input
                    required
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Keterangan (Opsional)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
                    placeholder="Tambahkan detail acara..."
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border bg-surface-hover/50 hover:bg-surface-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_recurring_yearly}
                    onChange={e => setForm({ ...form, is_recurring_yearly: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold">Acara Tahunan (Recurring)</p>
                    <p className="text-xs text-muted">Misal: Ulang tahun, Anniv. (Tidak akan dihapus otomatis)</p>
                  </div>
                </label>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl font-semibold text-muted bg-surface-hover hover:bg-border transition-colors">
                    Batal
                  </button>
                  <button type="submit" className="flex-1 h-11 rounded-xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Event"
        message="Apakah Anda yakin ingin menghapus event ini? Event yang sudah lewat pada tahun sebelumnya akan masuk ke riwayat secara otomatis, namun tindakan penghapusan ini bersifat permanen."
        onCancel={() => setDeleteId(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
}
