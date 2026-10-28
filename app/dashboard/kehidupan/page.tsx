'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
    </svg>
  );
}

function DumbbellIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.8 0l-.7.7a2 2 0 0 1-2.8 0l-2.1-2.1a2 2 0 0 1 0-2.8l.7-.7a2 2 0 0 0 0-2.8L11.5 9.5" />
      <path d="m3 3 1 1a2 2 0 0 0 2.8 0l.7-.7a2 2 0 0 1 2.8 0l2.1 2.1a2 2 0 0 1 0 2.8l-.7.7a2 2 0 0 0 0 2.8l.8.8" />
    </svg>
  );
}

function UtensilsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2v20M2 2v20M6 2v6a4 4 0 0 0 4 4v10M14 2v6a4 4 0 0 1-4 4" />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DropletsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </svg>
  );
}

function PlusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function RotateCcwIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/* ─── Interfaces ─────────────────────────────────────────── */
interface ScheduleSlot {
  id: string;
  timeRange: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  title: string;
  category: 'Morning' | 'Focus' | 'Nutrition' | 'Fitness' | 'Recovery';
  description: string;
}

const DEFAULT_AI_SCHEDULE: ScheduleSlot[] = [
  {
    id: 's1',
    timeRange: '06:00 - 07:00',
    startHour: 6,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
    title: 'Bangun Pagi & Hidrasi Awal',
    category: 'Morning',
    description: 'Minum 500ml air putih, peregangan ringan, cuci muka air dingin, rapikan tempat tidur.',
  },
  {
    id: 's2',
    timeRange: '07:00 - 08:00',
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
    title: 'Sarapan Bergizi & Morning Prep',
    category: 'Nutrition',
    description: 'Konsumsi sarapan kaya protein (telur/oatmeal), hindari gula tinggi agar energi stabil.',
  },
  {
    id: 's3',
    timeRange: '08:00 - 08:30',
    startHour: 8,
    startMinute: 0,
    endHour: 8,
    endMinute: 30,
    title: 'Presensi Disiplin (Check-In) & Agenda',
    category: 'Morning',
    description: 'Buka dashboard Attendance untuk check-in wajah, evaluasi agenda penting hari ini.',
  },
  {
    id: 's4',
    timeRange: '08:30 - 12:00',
    startHour: 8,
    startMinute: 30,
    endHour: 12,
    endMinute: 0,
    title: 'Deep Work Session 1 (Coding & Project)',
    category: 'Focus',
    description: 'Blok waktu fokus tanpa distraksi HP. Bangun proyek, coding fitur, dan selesaikan sprint.',
  },
  {
    id: 's5',
    timeRange: '12:00 - 13:00',
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    title: 'Makan Siang Bersih & Istirahat',
    category: 'Nutrition',
    description: 'Makan siang seimbang (sayur, protein, karbo kompleks), minum air, jeda mata dari layar.',
  },
  {
    id: 's6',
    timeRange: '13:00 - 16:30',
    startHour: 13,
    startMinute: 0,
    endHour: 16,
    endMinute: 30,
    title: 'Deep Work Session 2 (Eksplorasi AI & Riset)',
    category: 'Focus',
    description: 'Eksplorasi teknologi AI terbaru, latihan problem solving, dan pengembangan portofolio.',
  },
  {
    id: 's7',
    timeRange: '16:30 - 17:30',
    startHour: 16,
    startMinute: 30,
    endHour: 17,
    endMinute: 30,
    title: 'Olahraga & Latihan Fisik (Workout)',
    category: 'Fitness',
    description: 'Push-up, pull-up, jogging/cardio 45 menit untuk membakar energi dan merangsang endorfin alami.',
  },
  {
    id: 's8',
    timeRange: '17:30 - 18:30',
    startHour: 17,
    startMinute: 30,
    endHour: 18,
    endMinute: 30,
    title: 'Mandi Segar & Makan Malam Bernutrisi',
    category: 'Nutrition',
    description: 'Mandi air hangat/dingin, makan malam sehat (hindari makan berat lewat jam 20:00).',
  },
  {
    id: 's9',
    timeRange: '18:30 - 21:00',
    startHour: 18,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
    title: 'Personal Growth & Evaluasi Harian',
    category: 'Recovery',
    description: 'Membaca buku, evaluasi jurnal harian, refleksi diri, dan bersyukur atas pencapaian hari ini.',
  },
  {
    id: 's10',
    timeRange: '21:00 - 22:00',
    startHour: 21,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
    title: 'Wind-Down & Screen Detox',
    category: 'Recovery',
    description: 'Matikan notifikasi HP, redupkan lampu kamar, relaksasi pikiran untuk tidur berkualitas 8 jam.',
  },
];

export default function KehidupanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedule' | 'health' | 'habits'>('schedule');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Storage key per user
  const userKey = user?.email ? `cbm_kehidupan_${user.email}` : 'cbm_kehidupan_guest';

  // State: Jadwal Checklist
  const [completedSlots, setCompletedSlots] = useState<string[]>([]);

  // State: Pola Makan & Hidrasi
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [meals, setMeals] = useState<{ breakfast: boolean; lunch: boolean; dinner: boolean }>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  // State: Olahraga
  const [workoutDone, setWorkoutDone] = useState<boolean>(false);
  const [workoutType, setWorkoutType] = useState<string>('Kalistenik (Push-up / Pull-up)');
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(45);

  // State: Habit Freedom (Bebas Pod & Bebas PMO)
  const [podQuitDate, setPodQuitDate] = useState<string>('2026-10-15');
  const [pmoQuitDate, setPmoQuitDate] = useState<string>('2026-10-14');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`${userKey}_${todayStr}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completedSlots) setCompletedSlots(parsed.completedSlots);
        if (parsed.waterGlasses !== undefined) setWaterGlasses(parsed.waterGlasses);
        if (parsed.meals) setMeals(parsed.meals);
        if (parsed.workoutDone !== undefined) setWorkoutDone(parsed.workoutDone);
        if (parsed.workoutType) setWorkoutType(parsed.workoutType);
        if (parsed.workoutMinutes) setWorkoutMinutes(parsed.workoutMinutes);
      }

      // Load persistent habit dates
      const savedHabits = localStorage.getItem(`${userKey}_habit_dates`);
      if (savedHabits) {
        const parsedH = JSON.parse(savedHabits);
        if (parsedH.podQuitDate) setPodQuitDate(parsedH.podQuitDate);
        if (parsedH.pmoQuitDate) setPmoQuitDate(parsedH.pmoQuitDate);
      }
    } catch {
      /* ignore */
    }
  }, [userKey]);

  // Save to LocalStorage
  const saveDailyData = (patch: Record<string, any>) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = JSON.parse(localStorage.getItem(`${userKey}_${todayStr}`) || '{}');
      const updated = {
        ...saved,
        completedSlots,
        waterGlasses,
        meals,
        workoutDone,
        workoutType,
        workoutMinutes,
        ...patch,
      };
      localStorage.setItem(`${userKey}_${todayStr}`, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const toggleSlot = (slotId: string) => {
    const next = completedSlots.includes(slotId)
      ? completedSlots.filter((id) => id !== slotId)
      : [...completedSlots, slotId];
    setCompletedSlots(next);
    saveDailyData({ completedSlots: next });
    if (!completedSlots.includes(slotId)) {
      toast.success('Aktivitas diselesaikan!');
    }
  };

  const handleWaterChange = (delta: number) => {
    const next = Math.max(0, Math.min(12, waterGlasses + delta));
    setWaterGlasses(next);
    saveDailyData({ waterGlasses: next });
  };

  const toggleMeal = (type: 'breakfast' | 'lunch' | 'dinner') => {
    const next = { ...meals, [type]: !meals[type] };
    setMeals(next);
    saveDailyData({ meals: next });
  };

  const toggleWorkout = () => {
    const next = !workoutDone;
    setWorkoutDone(next);
    saveDailyData({ workoutDone: next });
    if (next) toast.success('Luar biasa! Target olahraga hari ini tercapai.');
  };

  // Hitung Hari Bersih (Clean Days)
  const calculateCleanDays = (startDateStr: string) => {
    const start = new Date(startDateStr + 'T00:00:00').getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const podCleanDays = useMemo(() => calculateCleanDays(podQuitDate), [podQuitDate]);
  const pmoCleanDays = useMemo(() => calculateCleanDays(pmoQuitDate), [pmoQuitDate]);

  const resetPodStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    setPodQuitDate(today);
    localStorage.setItem(`${userKey}_habit_dates`, JSON.stringify({ podQuitDate: today, pmoQuitDate }));
    toast('Streak vape direset. Jangan berkecil hati, mulai kembali sekarang!', { icon: '🌱' });
  };

  const resetPmoStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    setPmoQuitDate(today);
    localStorage.setItem(`${userKey}_habit_dates`, JSON.stringify({ podQuitDate, pmoQuitDate: today }));
    toast('Streak NoFap direset. Jadikan pelajaran untuk lebih kuat!', { icon: '🛡️' });
  };

  // Cek apakah slot jam sedang aktif saat ini
  const currentTotalMin = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">

      {/* ── TOP HEADER SECTION: Activity & Habits ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              LIFE & ROUTINE
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">Self-Discipline Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            Aktivitas & Kebiasaan
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5 font-medium max-w-2xl leading-relaxed">
            Rangkaian jadwal aktivitas harian terstruktur AI, kontrol pola makan, olahraga teratur, serta komitmen bebas vape & PMO.
          </p>
        </div>

        {/* 3 Pillar Tabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          {[
            { id: 'schedule', label: 'Jadwal Aktivitas AI', icon: ClockIcon },
            { id: 'health', label: 'Pola Makan & Olahraga', icon: UtensilsIcon },
            { id: 'habits', label: 'Bebas Kebiasaan Buruk', icon: ShieldCheckIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── TAB 1: JADWAL AKTIVITAS AI (TABEL JADWAL) ──────────── */}
      {activeTab === 'schedule' && (
        <motion.div
          key="schedule"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Summary Banner */}
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lime-50 text-lime-600 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-heading">
                  AI Daily Performance Routine
                </h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Dirancang khusus agar Anda tetap produktif, disiplin waktu, dan memiliki energi prima sepanjang hari.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-zinc-500 font-mono">
                {completedSlots.length} dari {DEFAULT_AI_SCHEDULE.length} Selesai
              </span>
              <div className="w-24 sm:w-32 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedSlots.length / DEFAULT_AI_SCHEDULE.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Schedule Table (Modern Bento Design) */}
          <div className="bg-white rounded-[24px] border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Table Header Info Bar */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                  Tabel Aktivitas AI Terstruktur (06:00 – 22:00)
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium sm:hidden">
                ← Geser horizontal untuk melihat kolom lengkap →
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-semibold text-[11px] bg-zinc-50/80 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4 sm:px-5 font-semibold w-40">Jam / Waktu</th>
                    <th className="py-3 px-4 sm:px-5 font-semibold">Aktivitas & Panduan AI</th>
                    <th className="py-3 px-4 sm:px-5 font-semibold w-32">Kategori</th>
                    <th className="py-3 px-4 sm:px-5 font-semibold w-36 text-right">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {DEFAULT_AI_SCHEDULE.map((slot) => {
                    const startTotal = slot.startHour * 60 + slot.startMinute;
                    const endTotal = slot.endHour * 60 + slot.endMinute;
                    const isCurrent = currentTotalMin >= startTotal && currentTotalMin < endTotal;
                    const isDone = completedSlots.includes(slot.id);

                    return (
                      <tr
                        key={slot.id}
                        className={`transition-colors ${
                          isDone
                            ? 'bg-zinc-50/60 hover:bg-zinc-50 text-zinc-400'
                            : isCurrent
                            ? 'bg-lime-50/50 hover:bg-lime-50/70 border-l-4 border-l-lime-500'
                            : 'bg-white hover:bg-zinc-50/60'
                        }`}
                      >
                        {/* Waktu */}
                        <td className="py-3.5 px-4 sm:px-5 align-top">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold ${
                              isCurrent
                                ? 'bg-lime-500 text-white shadow-xs'
                                : isDone
                                ? 'bg-zinc-100 text-zinc-400'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {slot.timeRange}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-lime-700 mt-1.5 uppercase tracking-wider font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-ping" />
                              Sedang Berjalan
                            </span>
                          )}
                        </td>

                        {/* Aktivitas & Panduan AI */}
                        <td className="py-3.5 px-4 sm:px-5 align-top">
                          <h4
                            className={`text-sm font-bold font-heading mb-1 ${
                              isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                            }`}
                          >
                            {slot.title}
                          </h4>
                          <p
                            className={`text-xs leading-relaxed max-w-xl ${
                              isDone ? 'text-zinc-400' : 'text-zinc-500'
                            }`}
                          >
                            {slot.description}
                          </p>
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4 sm:px-5 align-top">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono border ${
                              slot.category === 'Morning'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                : slot.category === 'Focus'
                                ? 'bg-violet-50 text-violet-700 border-violet-200/60'
                                : slot.category === 'Fitness'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                                : slot.category === 'Nutrition'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : 'bg-sky-50 text-sky-700 border-sky-200/60'
                            }`}
                          >
                            {slot.category}
                          </span>
                        </td>

                        {/* Status / Aksi Checklist */}
                        <td className="py-3.5 px-4 sm:px-5 align-top text-right">
                          <button
                            type="button"
                            onClick={() => toggleSlot(slot.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isDone
                                ? 'bg-lime-50 text-lime-700 border border-lime-200 hover:bg-lime-100'
                                : 'bg-zinc-900 text-white hover:bg-black shadow-xs'
                            }`}
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            <span>{isDone ? 'Selesai' : 'Tandai Selesai'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: POLA MAKAN & OLAHRAGA ───────────────────────── */}
      {activeTab === 'health' && (
        <motion.div
          key="health"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {/* CARD 1: POLA MAKAN & HIDRASI AIR */}
          <div className="bg-white rounded-[28px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UtensilsIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    Pola Makan Sehat & Bersih
                  </h3>
                  <p className="text-[11px] text-zinc-400">Nutrisi bersih untuk menjaga energi otak tetap stabil</p>
                </div>
              </div>
            </div>

            {/* 3 Sesi Makan */}
            <div className="space-y-2.5">
              {[
                { key: 'breakfast' as const, title: 'Sarapan Pagi (Breakfast)', sub: 'Telur, oatmeal, buah, tanpa gula berlebih' },
                { key: 'lunch' as const, title: 'Makan Siang Seimbang (Lunch)', sub: 'Sayuran hijau, sumber protein utama, nasi porsi cukup' },
                { key: 'dinner' as const, title: 'Makan Malam Bersih (Dinner)', sub: 'Makanan ringan berprotein, maksimal pukul 19:30' },
              ].map((m) => (
                <div
                  key={m.key}
                  onClick={() => toggleMeal(m.key)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    meals[m.key]
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200 text-zinc-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold font-heading">{m.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{m.sub}</p>
                  </div>
                  <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    meals[m.key] ? 'bg-emerald-600 text-white' : 'border border-zinc-300 bg-white'
                  }`}>
                    {meals[m.key] ? '✓' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Water Tracker */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DropletsIcon className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-zinc-900 font-heading">Target Hidrasi Air Harian</span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-700">
                  {waterGlasses * 250}ml / 2.000ml ({waterGlasses} Gelas)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-sky-100 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500">Target minimal 8 gelas per hari</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleWaterChange(-1)}
                    className="w-7 h-7 rounded-lg bg-white border border-sky-200 flex items-center justify-center text-sky-700 hover:bg-sky-50 transition-colors"
                  >
                    <MinusIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaterChange(1)}
                    className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-colors shadow-xs"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: OLAHRAGA & LATIHAN FISIK */}
          <div className="bg-white rounded-[28px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <DumbbellIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    Olahraga & Latihan Fisik
                  </h3>
                  <p className="text-[11px] text-zinc-400">Bangun kekuatan fisik, postur tegak, dan stamina tubuh</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                workoutDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {workoutDone ? '● Selesai' : 'Belum Latihan'}
              </span>
            </div>

            {/* Workout Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Pilihan Latihan Hari Ini</label>
                <select
                  value={workoutType}
                  onChange={(e) => {
                    setWorkoutType(e.target.value);
                    saveDailyData({ workoutType: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  <option value="Kalistenik (Push-up / Pull-up)">Kalistenik (Push-up, Pull-up, Squats)</option>
                  <option value="Kardio & Jogging 30 Menit">Kardio & Jogging Santai 30 Menit</option>
                  <option value="Home Dumbbell & Core Workout">Home Dumbbell & Core Workout</option>
                  <option value="Stretching & Mobilitas Sendi">Stretching & Mobilitas Sendi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Target Durasi Latihan</label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setWorkoutMinutes(m);
                        saveDailyData({ workoutMinutes: m });
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        workoutMinutes === m
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {m} Menit
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Workout Action Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-900 font-heading">
                    {workoutDone ? 'Latihan Fisik Berhasil Diselesaikan!' : 'Latihan Fisik Menanti Anda'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {workoutDone
                      ? 'Darah terpompa lancar dan metabolisme tubuh telah aktif.'
                      : 'Luangkan waktu di sore hari (16:30 – 17:30) untuk berolahraga.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleWorkout}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  workoutDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-zinc-900 hover:bg-black text-white'
                }`}
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{workoutDone ? 'Batalkan Status Selesai' : 'Tandai Sudah Selesai Olahraga'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 3: BEBAS KEBIASAAN BURUK (HABIT FREEDOM) ──────── */}
      {activeTab === 'habits' && (
        <motion.div
          key="habits"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Motivation Quote */}
          <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-bold text-zinc-900 font-heading">
              Komitmen Bebas Vape & PMO (Pikiran Bersih & Disiplin Sejati)
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-3xl">
              Dopamin instan dari nikotin dan konten pornografi mengikis fokus serta tekad Anda. Membangun kebiasaan bersih ini adalah langkah awal menguasai diri dan menjadi pemenang sejati.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* HABIT 1: BEBAS NGEPOD / VAPE */}
            <div className="bg-white rounded-[28px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    PARU SEHAT & STAMINA
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 font-heading mt-2">
                    Bebas Ngepod / Vape
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-0.5">
                    Membebaskan saluran pernapasan dari nikotin dan ketergantungan
                  </p>
                </div>
              </div>

              {/* Streak Big Number */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hari Bersih Beruntun</p>
                  <p className="text-[36px] font-bold text-zinc-900 font-heading leading-tight mt-0.5">
                    {podCleanDays} <span className="text-base font-normal text-zinc-400">Hari</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    Hemat ~Rp {(podCleanDays * 15000).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                  🛡️
                </div>
              </div>

              {/* Milestone Box */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                <span className="font-bold text-zinc-800 block">Fase Pemulihan Paru:</span>
                <p className="text-zinc-500 text-[11px]">
                  {podCleanDays < 3
                    ? '72 Jam pertama: Nikotin mulai terbuang keluar dari peredaran darah.'
                    : podCleanDays < 14
                    ? '2 Minggu: Sirkulasi darah meningkat pesat dan paru-paru membersihkan residu.'
                    : '1 Bulan+: Kapasitas paru meningkat signifikan, ketergantungan fisik hilang!'}
                </p>
              </div>

              {/* Action Reset */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Mulai sejak: {podQuitDate}</span>
                <button
                  type="button"
                  onClick={resetPodStreak}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                  <span>Reset Streak</span>
                </button>
              </div>
            </div>

            {/* HABIT 2: BEBAS PMO (NOFAP / PIKIRAN JERNIH) */}
            <div className="bg-white rounded-[28px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                    RESET DOPAMIN & FOKUS
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 font-heading mt-2">
                    Bebas PMO (Pikiran Jernih)
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-0.5">
                    Mengembalikan reseptor dopamin alami dan ketajaman mental
                  </p>
                </div>
              </div>

              {/* Streak Big Number */}
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hari Pikiran Jernih</p>
                  <p className="text-[36px] font-bold text-zinc-900 font-heading leading-tight mt-0.5">
                    {pmoCleanDays} <span className="text-base font-normal text-zinc-400">Hari</span>
                  </p>
                  <p className="text-[11px] text-violet-700 font-semibold mt-0.5">
                    Reseptor dopamin pulih bertahap
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
              </div>

              {/* Milestone Box */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                <span className="font-bold text-zinc-800 block">Kondisi Otak & Mental:</span>
                <p className="text-zinc-500 text-[11px]">
                  {pmoCleanDays < 7
                    ? 'Hari 1-7: Mengendalikan lonjakan hasrat impulsif dan godaan visual.'
                    : pmoCleanDays < 30
                    ? 'Hari 8-30: Brain fog (kabut otak) sirna, rasa percaya diri dan fokus meningkat tajam.'
                    : 'Hari 30+: Sistem saraf ter-reboot penuh, energi seksual tersalurkan ke karya nyata.'}
                </p>
              </div>

              {/* Action Reset */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Mulai sejak: {pmoQuitDate}</span>
                <button
                  type="button"
                  onClick={resetPmoStreak}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                  <span>Reset Streak</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
