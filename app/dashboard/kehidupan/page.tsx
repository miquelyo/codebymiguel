'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ─── Interfaces ─────────────────────────────────────────── */
interface DailyLog {
  waterGlasses: number;         // 0 - 8+ (each glass = 250ml, target 8 = 2000ml)
  workoutDone: boolean;
  workoutType: string;
  workoutMinutes: number;
  coffeeCups: number;           // Healthy target: max 1 - 2
  wakeTime: string;             // e.g. "05:30"
  targetWakeTime: string;       // e.g. "05:30"
  antiMagerDone: string[];      // ids of micro-tasks completed
  podFreeToday: boolean;        // Checked that user remained clean today
  pmoFreeToday: boolean;        // Checked that user remained clean today
  note: string;
}

interface KehidupanState {
  version: number;
  podQuitDate: string;          // ISO date e.g. "2026-10-24"
  podCostPerDay: number;        // in Rupiah (default 15.000)
  pmoQuitDate: string;          // ISO date e.g. "2026-10-24"
  pmoLongestStreak: number;
  urgesResistedCount: number;
  targetWakeTime: string;       // default "05:30"
  dailyLogs: Record<string, DailyLog>;
}

/* ─── Storage Keys ───────────────────────────────────────── */
const STORAGE_KEY = 'cbm_kehidupan_v2';
const LEGACY_STORAGE_PREFIX = 'cbm_kehidupan_';
const LEGACY_STREAK_KEY = 'cbm_kehidupan_streaks';

/* ─── Helpers ────────────────────────────────────────────── */
function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysClean(startDateIso: string): number {
  if (!startDateIso) return 0;
  const start = new Date(startDateIso + 'T00:00:00');
  const today = new Date(getTodayIso() + 'T00:00:00');
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function getDefaultDailyLog(targetWake = '05:30'): DailyLog {
  return {
    waterGlasses: 0,
    workoutDone: false,
    workoutType: 'Jalan Santai / Workout Rumahan',
    workoutMinutes: 15,
    coffeeCups: 0,
    wakeTime: '',
    targetWakeTime: targetWake,
    antiMagerDone: [],
    podFreeToday: true,
    pmoFreeToday: true,
    note: '',
  };
}

/* ─── Static Milestones & Educational Data ────────────────── */
const POD_MILESTONES = [
  { days: 1, title: '24 Jam Pertama', desc: 'Denyut nadi & kadar oksigen dalam darah mulai kembali ke batas normal.' },
  { days: 3, title: '72 Jam (3 Hari)', desc: 'Nikotin 100% keluar dari darah. Indra perasa & penciuman mulai tajam.' },
  { days: 7, title: '1 Minggu', desc: 'Puncak ketergantungan fisik terlewati! Paru mulai membersihkan sisa residu.' },
  { days: 14, title: '2 Minggu', desc: 'Sirkulasi darah membaik drastis. Nafas terasa lebih lega saat beraktivitas.' },
  { days: 30, title: '1 Bulan Bebas Pod', desc: 'Kapasitas paru meningkat signifikan. Batuk, sesak & ketergantungan lenyap!' },
  { days: 90, title: '3 Bulan (Pembersihan Total)', desc: 'Silia paru pulih normal. Risiko gangguan jantung & pernafasan turun drastis.' },
];

const PMO_MILESTONES = [
  { days: 3, title: 'Hari 1-3: Fase Detoks Awal', desc: 'Menahan lonjakan hasrat impulsif. Otak mulai melepaskan dopamin palsu.' },
  { days: 7, title: 'Hari 7: Lonjakan Energi', desc: 'Kadar testosteron dan vitalitas alami meningkat. Energi fisik lebih kuat.' },
  { days: 14, title: 'Hari 14: Pikiran Jernih', desc: 'Brain fog (kabut otak) berkurang drastis, tatapan mata lebih fokus & percaya diri.' },
  { days: 30, title: 'Hari 30: Reseptor Dopamin Pulih', desc: 'Mulai menikmati hal-hal nyata dalam hidup (kopi, musik, interaksi sosial).' },
  { days: 60, title: 'Hari 60: Kendali Diri Penuh', desc: 'Disiplin mental terbentuk kuat. Energi seksual tersalurkan ke karya positif.' },
  { days: 90, title: 'Hari 90: Otak Ter-reboot (Full Reset)', desc: 'Pemulihan total sistem saraf & harga diri sejati seorang pemenang.' },
];

const ANTI_MAGER_TASKS = [
  { id: 'kasur', label: 'Rapikan tempat tidur', icon: '🛏️', dur: '1 menit', tip: 'Kemenangan pertama di pagi hari yang memberi sinyal sukses ke otak.' },
  { id: 'air', label: 'Minum 1 gelas air putih saat bangun', icon: '💧', dur: '30 detik', tip: 'Mengaktifkan organ pencernaan & metabolisme tubuh seketika.' },
  { id: 'cuci_muka', label: 'Cuci muka dengan air dingin', icon: '🚿', dur: '30 detik', tip: 'Efek kejutan air dingin menstimulasi saraf vagus & mengusir kantuk.' },
  { id: 'jendela', label: 'Buka jendela & hirup nafas segar', icon: '🪟', dur: '1 menit', tip: 'Sinar matahari dan oksigen pagi menekan hormon melatonin.' },
  { id: 'pushup', label: '10x Push-up / Stretching ringan', icon: '⚡', dur: '2 menit', tip: 'Memompa darah ke otak tanpa perlu pergi ke gym.' },
  { id: 'fokus_hp', label: 'Jauhkan HP selama 15 menit pertama', icon: '📵', dur: '15 menit', tip: 'Mencegah lonjakan dopamin murahan yang bikin seharian mager.' },
];

const WORKOUT_PRESETS = [
  { label: 'Jalan Santai / Jogging', icon: '🚶', defMin: 20 },
  { label: 'Push-Up & Senam Kamar', icon: '🏠', defMin: 15 },
  { label: 'Angkat Beban / Gym', icon: '🏋️', defMin: 45 },
  { label: 'Stretching & Fleksibilitas', icon: '🧘', defMin: 10 },
  { label: 'Lari Cepat / Kardio', icon: '🏃', defMin: 25 },
];

/* ─── Main Component ─────────────────────────────────────── */
export default function KehidupanPage() {
  const today = getTodayIso();

  /* State */
  const [data, setData] = useState<KehidupanState>(() => {
    return {
      version: 2,
      podQuitDate: today,
      podCostPerDay: 15000,
      pmoQuitDate: today,
      pmoLongestStreak: 0,
      urgesResistedCount: 0,
      targetWakeTime: '05:30',
      dailyLogs: {
        [today]: getDefaultDailyLog('05:30'),
      },
    };
  });

  const [activeTab, setActiveTab] = useState<'harian' | 'bebas_candu' | 'sos' | 'riwayat'>('harian');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<'pod' | 'pmo' | null>(null);
  const [resetReason, setResetReason] = useState('');
  
  /* SOS Breathing interactive state */
  const [breathPhase, setBreathPhase] = useState<'idle' | 'tarik' | 'tahan' | 'hembus'>('idle');
  const [breathTimer, setBreathTimer] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);

  /* Load from localStorage & handle migration */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: KehidupanState = JSON.parse(raw);
        if (!parsed.dailyLogs) parsed.dailyLogs = {};
        if (!parsed.dailyLogs[today]) {
          parsed.dailyLogs[today] = getDefaultDailyLog(parsed.targetWakeTime || '05:30');
        }
        setData(parsed);
      } else {
        // Try migrating legacy data if any
        let migratedPodDate = today;
        let migratedPmoDate = today;
        const legacyToday = localStorage.getItem(LEGACY_STORAGE_PREFIX + today);
        const legacyStreaks = localStorage.getItem(LEGACY_STREAK_KEY);

        const initialLog = getDefaultDailyLog('05:30');
        if (legacyToday) {
          try {
            const arr = JSON.parse(legacyToday);
            if (Array.isArray(arr)) {
              if (arr.includes('olahraga')) initialLog.workoutDone = true;
              if (arr.includes('minum_air')) initialLog.waterGlasses = 4;
            }
          } catch { /* noop */ }
        }

        const initial: KehidupanState = {
          version: 2,
          podQuitDate: migratedPodDate,
          podCostPerDay: 15000,
          pmoQuitDate: migratedPmoDate,
          pmoLongestStreak: 0,
          urgesResistedCount: 0,
          targetWakeTime: '05:30',
          dailyLogs: {
            [today]: initialLog,
          },
        };
        setData(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Error loading kehidupan data', e);
    }
  }, [today]);

  /* Save state to localStorage helper */
  const persist = useCallback((next: KehidupanState) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // noop
    }
  }, []);

  /* Current Day Log */
  const currentLog: DailyLog = useMemo(() => {
    return data.dailyLogs[today] || getDefaultDailyLog(data.targetWakeTime);
  }, [data.dailyLogs, today, data.targetWakeTime]);

  const updateCurrentLog = useCallback((patch: Partial<DailyLog>) => {
    setData((prev) => {
      const existing = prev.dailyLogs[today] || getDefaultDailyLog(prev.targetWakeTime);
      const updatedLog = { ...existing, ...patch };
      const next: KehidupanState = {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: updatedLog,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* noop */ }
      return next;
    });
  }, [today]);

  /* Calculate Days Clean */
  const podDays = useMemo(() => getDaysClean(data.podQuitDate), [data.podQuitDate]);
  const pmoDays = useMemo(() => getDaysClean(data.pmoQuitDate), [data.pmoQuitDate]);
  const totalMoneySaved = useMemo(() => podDays * (data.podCostPerDay || 15000), [podDays, data.podCostPerDay]);

  /* Calculate Today's Health Score (0 - 100) */
  const healthScore = useMemo(() => {
    let score = 0;
    // 1. Water (up to 25 pts)
    const waterPts = Math.min(25, (currentLog.waterGlasses / 8) * 25);
    score += waterPts;

    // 2. Workout (25 pts)
    if (currentLog.workoutDone) score += 25;

    // 3. Coffee moderation (15 pts: 0-2 cups = full 15 pts, 3 cups = 5 pts, 4+ = 0)
    if (currentLog.coffeeCups <= 2) score += 15;
    else if (currentLog.coffeeCups === 3) score += 5;

    // 4. Wake up logged & on time (15 pts)
    if (currentLog.wakeTime) {
      score += 8;
      if (currentLog.wakeTime <= (currentLog.targetWakeTime || '05:30')) {
        score += 7;
      }
    }

    // 5. Anti-mager micro actions (up to 20 pts: 4 pts each up to 20)
    const magerPts = Math.min(20, (currentLog.antiMagerDone?.length || 0) * 4);
    score += magerPts;

    return Math.round(score);
  }, [currentLog]);

  /* Handlers */
  const handleAddWater = (delta: number) => {
    const nextVal = Math.max(0, Math.min(16, (currentLog.waterGlasses || 0) + delta));
    updateCurrentLog({ waterGlasses: nextVal });
    if (delta > 0) {
      if (nextVal === 8) {
        toast.success('🎉 Target 8 gelas (2.000 ml) tercapai! Tubuhmu berterima kasih!', { icon: '💧' });
      } else {
        toast.success(`Minum air dicatat: ${nextVal} gelas (${nextVal * 250} ml)`, { duration: 1500, id: 'water-toast' });
      }
    }
  };

  const handleCoffeeDelta = (delta: number) => {
    const nextVal = Math.max(0, Math.min(10, (currentLog.coffeeCups || 0) + delta));
    updateCurrentLog({ coffeeCups: nextVal });
    if (delta > 0) {
      if (nextVal <= 2) {
        toast.success(`Ngopi dicatat: ${nextVal} cangkir. Tetap seimbang dengan air putih ya!`, { icon: '☕' });
      } else {
        toast.error(`Perhatian: Sudah ${nextVal} cangkir kopi hari ini! Kafein berlebih memicu dehidrasi. Ganti dengan air es sekarang.`, { duration: 4000 });
      }
    }
  };

  const handleToggleWorkout = () => {
    const nextDone = !currentLog.workoutDone;
    updateCurrentLog({ workoutDone: nextDone });
    if (nextDone) {
      toast.success('🔥 Luar biasa! Olahraga dicatat. Dopamin sehat aktif!', { icon: '🏃' });
    }
  };

  const handleLogCurrentWakeTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    updateCurrentLog({ wakeTime: timeStr });
    if (timeStr <= (currentLog.targetWakeTime || '05:30')) {
      toast.success(`🌅 Bangun pagi juara jam ${timeStr}! Hari penuh energi menantimu!`, { icon: '☀️' });
    } else {
      toast('☀️ Jam bangun dicatat: ' + timeStr + '. Tetap semangat, hari ini kamu bisa selesaikan targetmu!', { icon: '⏰' });
    }
  };

  const handleToggleAntiMager = (id: string) => {
    const exists = currentLog.antiMagerDone?.includes(id);
    const nextArr = exists
      ? currentLog.antiMagerDone.filter((x) => x !== id)
      : [...(currentLog.antiMagerDone || []), id];
    updateCurrentLog({ antiMagerDone: nextArr });
    if (!exists) {
      toast.success('⚡ Satu aksi kecil mengalahkan kemalasan!', { id: 'mager-toast', duration: 1500 });
    }
  };

  /* Reset Streak Modal Confirm */
  const handleConfirmReset = () => {
    if (!showResetModal) return;
    const isPod = showResetModal === 'pod';

    setData((prev) => {
      const next = { ...prev };
      if (isPod) {
        next.podQuitDate = today;
      } else {
        if (pmoDays > next.pmoLongestStreak) {
          next.pmoLongestStreak = pmoDays;
        }
        next.pmoQuitDate = today;
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });

    toast('Streak di-reset. Jangan berkecil hati! Yang terpenting adalah kamu bangkit lagi sekarang tanpa menyerah.', {
      icon: '🛡️',
      duration: 5000,
    });
    setShowResetModal(null);
    setResetReason('');
  };

  /* Urge Defeated Button in SOS */
  const handleDefeatedUrge = () => {
    setData((prev) => {
      const nextCount = (prev.urgesResistedCount || 0) + 1;
      const next = { ...prev, urgesResistedCount: nextCount };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
    toast.success('🏆 JUARA! Kamu berhasil mengalahkan godaan! Otakmu baru saja tumbuh lebih kuat!', {
      icon: '🧠',
      duration: 4000,
    });
  };

  /* Breathing 4-7-8 Controller */
  useEffect(() => {
    if (breathPhase === 'idle') return;

    let timer: NodeJS.Timeout;
    if (breathPhase === 'tarik') {
      timer = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev >= 4) {
            setBreathPhase('tahan');
            return 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (breathPhase === 'tahan') {
      timer = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev >= 7) {
            setBreathPhase('hembus');
            return 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (breathPhase === 'hembus') {
      timer = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev >= 8) {
            setBreathCycle((c) => c + 1);
            setBreathPhase('tarik');
            return 1;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [breathPhase]);

  const toggleBreathing = () => {
    if (breathPhase === 'idle') {
      setBreathPhase('tarik');
      setBreathTimer(1);
      setBreathCycle(1);
    } else {
      setBreathPhase('idle');
      setBreathTimer(0);
    }
  };

  /* Today formatted label */
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* ── Top Header / Hero Banner ─────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 40%, #064e3b 100%)',
        }}
      >
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold">
              <span>🌱 Pusat Hidup Sehat & Anti-Candu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60 font-normal">{todayLabel}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Kendalikan Hidupmu, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">Bukan Kebiasaan Buruk</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Sistem ramah harian untuk mengatasi jarang olahraga, dehidrasi, over-ngopi, bangun kesiangan, mager, serta bebas dari pod dan PMO secara konsisten.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all backdrop-blur-sm border border-white/20 cursor-pointer shadow-sm active:scale-95"
              >
                <span>💡 Cara Kerja Sistem</span>
              </button>

              <button
                onClick={() => setActiveTab('sos')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 animate-pulse"
              >
                <span>🚨 Butuh Bantuan? Lawan Godaan (SOS)</span>
              </button>
            </div>
          </div>

          {/* Health Score Card */}
          <div className="shrink-0 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-5 text-center flex flex-col items-center justify-center min-w-[200px] shadow-lg">
            <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" stroke="rgba(255,255,255,0.15)" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  stroke={healthScore >= 75 ? '#34d399' : healthScore >= 50 ? '#38bdf8' : '#fbbf24'}
                  strokeDasharray="264"
                  strokeDashoffset={264 - (healthScore / 100) * 264}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono">{healthScore}%</span>
                <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Skor Hari Ini</span>
              </div>
            </div>

            <p className="text-xs font-bold text-white mb-0.5">
              {healthScore >= 80 ? '🌟 Sangat Bugar & Disiplin!' : healthScore >= 50 ? '💪 Progres Sangat Bagus!' : '⚡ Yuk Mulai 1 Langkah!'}
            </p>
            <p className="text-[11px] text-white/70">
              {podDays} hari bebas pod • {pmoDays} hari bebas PMO
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        <button
          onClick={() => setActiveTab('harian')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'harian'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <span>💧 Kebiasaan Sehat Harian</span>
          {healthScore > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'harian' ? 'bg-background/20 text-background' : 'bg-surface-hover text-muted'
            }`}>
              {healthScore}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bebas_candu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bebas_candu'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <span>🛡️ Bebas Candu (Pod & PMO)</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full">
            {podDays}d | {pmoDays}d
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sos'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-rose-500 hover:bg-rose-500/10'
          }`}
        >
          <span>🚨 Mode Lawan Godaan (SOS)</span>
          {data.urgesResistedCount > 0 && (
            <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full font-bold">
              {data.urgesResistedCount}x Menang
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'riwayat'
              ? 'bg-foreground text-background shadow-md'
              : 'text-muted hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <span>📈 Evaluasi 7 Hari</span>
        </button>
      </div>

      {/* ── TAB 1: KEBIASAAN SEHAT HARIAN ────────────────────── */}
      {activeTab === 'harian' && (
        <div className="space-y-6">

          {/* Grid: 4 Core Lifestyle Trackers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* 1. Minum Air Putih */}
            <div className="card p-5 sm:p-6 space-y-4 border-cyan-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💧</span>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Minum Air Putih</h2>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Target: 8 gelas / 2.000 ml per hari agar ginjal sehat & kulit bersih.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-cyan-500 font-mono">
                    {currentLog.waterGlasses * 250}
                  </span>
                  <span className="text-xs text-muted font-semibold"> / 2000 ml</span>
                  <p className="text-[10px] font-bold text-cyan-500/80">
                    {Math.round((currentLog.waterGlasses / 8) * 100)}% Tercapai
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-surface-hover rounded-full overflow-hidden border border-border">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (currentLog.waterGlasses / 8) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* 8 Glasses Visual Selector */}
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2 pt-1">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isFilled = idx < currentLog.waterGlasses;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const targetCount = isFilled && idx === currentLog.waterGlasses - 1 ? idx : idx + 1;
                        updateCurrentLog({ waterGlasses: targetCount });
                      }}
                      title={`Gelas ke-${idx + 1} (250 ml)`}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        isFilled
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-sm shadow-cyan-500/20 scale-102'
                          : 'bg-surface hover:bg-surface-hover border-border text-muted/50'
                      }`}
                    >
                      <span className="text-sm">{isFilled ? '🥛' : '▫️'}</span>
                      <span className="text-[9px] font-bold font-mono">
                        {(idx + 1) * 250}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleAddWater(1)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20 active:scale-98"
                >
                  <span>+ 1 Gelas (250 ml)</span>
                </button>
                <button
                  onClick={() => handleAddWater(2)}
                  className="py-2.5 px-3 rounded-xl bg-surface-hover hover:bg-surface border border-border text-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>+ 1 Botol (500 ml)</span>
                </button>
                {currentLog.waterGlasses > 0 && (
                  <button
                    onClick={() => handleAddWater(-1)}
                    className="py-2.5 px-3 rounded-xl bg-surface-hover hover:bg-red-500/10 text-muted hover:text-red-500 border border-border font-bold text-xs transition-colors cursor-pointer"
                    title="Kurangi 1 Gelas"
                  >
                    <span>-1</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Olahraga & Gerak Tubuh */}
            <div className="card p-5 sm:p-6 space-y-4 border-orange-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏃</span>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Olahraga & Gerak Tubuh</h2>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Cukup 15-30 menit per hari untuk menaikkan energi & membuang racun.
                  </p>
                </div>

                <button
                  onClick={handleToggleWorkout}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    currentLog.workoutDone
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                      : 'bg-surface text-muted border-border hover:border-orange-500/50'
                  }`}
                >
                  <span>{currentLog.workoutDone ? '✓ Selesai Hari Ini' : 'Belum Olahraga'}</span>
                </button>
              </div>

              {/* Workout Presets Chips */}
              <div>
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Pilih Jenis Latihan:</p>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_PRESETS.map((preset) => {
                    const isSelected = currentLog.workoutType === preset.label;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          updateCurrentLog({
                            workoutType: preset.label,
                            workoutMinutes: preset.defMin,
                            workoutDone: true,
                          });
                          toast.success(`Latihan dipilih: ${preset.label} (${preset.defMin} menit)`, { id: 'workout-preset' });
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-orange-500 font-bold shadow-sm'
                            : 'bg-surface hover:bg-surface-hover border-border text-muted'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration selector */}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs text-muted font-medium">Durasi Gerak:</span>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => updateCurrentLog({ workoutMinutes: mins, workoutDone: true })}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                        currentLog.workoutMinutes === mins
                          ? 'bg-foreground text-background font-bold border-foreground'
                          : 'bg-surface hover:bg-surface-hover border-border text-muted'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] text-muted flex items-start gap-2">
                <span className="text-orange-500 text-sm">💡</span>
                <span>
                  <strong>Tips Anti-Gagal:</strong> Kalau lagi mager berat, lakukan <strong className="text-foreground">15x push-up atau jalan santai 10 menit</strong> di kamar. Gerakan kecil langsung mengaktifkan dopamin alami!
                </span>
              </div>
            </div>

            {/* 3. Kontrol Kopi (Batasi Kafein) */}
            <div className="card p-5 sm:p-6 space-y-4 border-amber-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">☕</span>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Kontrol Konsumsi Kopi</h2>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Batas aman: Maksimal 1 - 2 cangkir sehari agar jantung tenang & tidur nyenyak.
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-2xl font-black font-mono ${
                    currentLog.coffeeCups <= 2 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {currentLog.coffeeCups}
                  </span>
                  <span className="text-xs text-muted font-semibold"> cangkir</span>
                </div>
              </div>

              {/* Status Message based on intake */}
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                currentLog.coffeeCups === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                  : currentLog.coffeeCups <= 2
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
              }`}>
                <span>{currentLog.coffeeCups <= 2 ? '✓' : '⚠️'}</span>
                <span>
                  {currentLog.coffeeCups === 0 && 'Bagus! Kamu segar alami tanpa kafein.'}
                  {currentLog.coffeeCups === 1 && 'Optimal! 1 cangkir membantu fokus tanpa memicu gelisah.'}
                  {currentLog.coffeeCups === 2 && 'Batas aman harian tercapai. Jadikan ini cangkir terakhir hari ini ya!'}
                  {currentLog.coffeeCups >= 3 && 'Terlalu sering ngopi! Kafein berlebih memicu dehidrasi & asam lambung. Minum 2 gelas air putih sekarang.'}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleCoffeeDelta(1)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20 active:scale-98"
                >
                  <span>+ Catat 1 Cangkir Kopi</span>
                </button>
                {currentLog.coffeeCups > 0 && (
                  <button
                    onClick={() => handleCoffeeDelta(-1)}
                    className="py-2 px-3 rounded-xl bg-surface-hover hover:bg-surface border border-border text-muted font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>- 1 Cangkir</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Konsistensi Jam Bangun & Tidur */}
            <div className="card p-5 sm:p-6 space-y-4 border-indigo-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌅</span>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Jam Bangun & Ritme Tidur</h2>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Bangun pagi teratur mereset jam biologis tubuh & melenyapkan rasa malas.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-muted block">Target Bangun:</span>
                  <input
                    type="time"
                    value={currentLog.targetWakeTime || '05:30'}
                    onChange={(e) => updateCurrentLog({ targetWakeTime: e.target.value })}
                    className="text-xs font-mono font-bold bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
                  />
                </div>
              </div>

              {/* Current Recorded Wake Time */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-hover border border-border">
                <div>
                  <p className="text-[11px] text-muted font-semibold uppercase">Tercatat Bangun Hari Ini:</p>
                  <p className="text-base font-black text-foreground font-mono mt-0.5">
                    {currentLog.wakeTime ? `${currentLog.wakeTime} WIB` : 'Belum Dicatat'}
                  </p>
                </div>

                {currentLog.wakeTime ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    currentLog.wakeTime <= (currentLog.targetWakeTime || '05:30')
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  }`}>
                    {currentLog.wakeTime <= (currentLog.targetWakeTime || '05:30') ? '🌅 Pagi Tepat Waktu!' : '☀️ Kesiangan (Tetap Semangat)'}
                  </span>
                ) : (
                  <button
                    onClick={handleLogCurrentWakeTime}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <span>Saya Bangun Sekarang</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-muted leading-relaxed">
                <span className="font-semibold text-foreground">Penyebab Kesiangan:</span> Seringkali karena main HP larut malam. Coba matikan layar 30 menit sebelum tidur malam ini dan taruh HP minimal 2 meter dari kasurmu!
              </div>
            </div>

          </div>

          {/* ── Anti-Mager / Lawan Malas (Aturan 2 Menit) ───────── */}
          <div className="card p-5 sm:p-6 space-y-4 border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Sistem Anti-Mager & Lawan Rasa Malas
                  </h2>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Gunakan <strong>Aturan 2 Menit</strong>: Lakukan hal yang sangat kecil sehingga otakmu tidak punya alasan untuk menolak.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 shrink-0 self-start sm:self-auto">
                {currentLog.antiMagerDone?.length || 0} / {ANTI_MAGER_TASKS.length} Selesai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {ANTI_MAGER_TASKS.map((task) => {
                const isDone = currentLog.antiMagerDone?.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleToggleAntiMager(task.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 active:scale-98 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-sm shadow-emerald-500/10'
                        : 'bg-surface hover:bg-surface-hover border-border text-muted hover:text-foreground'
                    }`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-500 line-through' : 'text-foreground'}`}>
                          {task.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted shrink-0">{task.dur}</span>
                      </div>
                      <p className="text-[10px] text-muted mt-1 leading-normal line-clamp-2">
                        {task.tip}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border'
                    }`}>
                      {isDone && <span className="text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: BEBAS CANDU (STOP POD & BEBAS PMO) ───────── */}
      {activeTab === 'bebas_candu' && (
        <div className="space-y-6">

          {/* Quick Notice */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-start gap-3">
            <span className="text-2xl shrink-0">🛡️</span>
            <div className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">Selamat atas keputusan beranimu!</strong> Menghilangkan pod dan PMO adalah kunci utama mengembalikan stamina fisik, ketajaman otak, serta hormon testosteron dan dopamin alami yang stabil. Pantau kemajuan pemulihan tubuhmu di bawah ini.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 🚭 POD / VAPE TRACKER */}
            <div className="card p-6 space-y-5 border-emerald-500/25 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚭</span>
                    <h2 className="text-lg font-bold text-foreground">Bebas Pod & Rokok Elektrik</h2>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Memulihkan kapasitas paru, tenggorokan bersih, dan detak jantung sehat.
                  </p>
                </div>

                <button
                  onClick={() => setShowResetModal('pod')}
                  className="text-[11px] text-muted hover:text-red-500 font-semibold cursor-pointer transition-colors"
                >
                  Reset Streak
                </button>
              </div>

              {/* Big Streak Counter */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-center">
                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block mb-1">
                  Hari Bersih Saat Ini
                </span>
                <div className="text-5xl font-black text-foreground font-mono">
                  {podDays} <span className="text-xl font-bold text-muted">Hari</span>
                </div>
                <p className="text-xs text-muted mt-2">
                  Sejak {new Date(data.podQuitDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Money Saved Calculator */}
              <div className="p-4 rounded-xl bg-surface-hover border border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted font-semibold">Uang Terselamatkan:</p>
                  <p className="text-lg font-extrabold text-emerald-500 font-mono mt-0.5">
                    Rp {totalMoneySaved.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted">Estimasi Biaya:</span>
                  <p className="text-xs font-bold text-foreground font-mono">
                    Rp {(data.podCostPerDay || 15000).toLocaleString('id-ID')} / hari
                  </p>
                </div>
              </div>

              {/* Health Recovery Milestones */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Tahapan Pemulihan Paru-Paru:</p>
                <div className="space-y-2">
                  {POD_MILESTONES.map((m) => {
                    const achieved = podDays >= m.days;
                    return (
                      <div
                        key={m.days}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                          achieved
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                            : 'bg-surface/50 border-border/60 text-muted opacity-60'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{achieved ? '✅' : '⏳'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${achieved ? 'text-emerald-500' : 'text-foreground'}`}>
                            {m.title}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🧠 PMO / NOFAP TRACKER */}
            <div className="card p-6 space-y-5 border-violet-500/25 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    <h2 className="text-lg font-bold text-foreground">Bebas PMO (Clean Mind)</h2>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Reboot reseptor dopamin otak, hilangkan brain fog, dan kembalikan wibawa diri.
                  </p>
                </div>

                <button
                  onClick={() => setShowResetModal('pmo')}
                  className="text-[11px] text-muted hover:text-red-500 font-semibold cursor-pointer transition-colors"
                >
                  Reset Streak
                </button>
              </div>

              {/* Big Streak Counter */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/20 text-center">
                <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider block mb-1">
                  Hari Bersih Saat Ini
                </span>
                <div className="text-5xl font-black text-foreground font-mono">
                  {pmoDays} <span className="text-xl font-bold text-muted">Hari</span>
                </div>
                <p className="text-xs text-muted mt-2">
                  Rekor Terpanjangmu: <strong className="text-foreground">{Math.max(pmoDays, data.pmoLongestStreak || 0)} Hari</strong> 🏆
                </p>
              </div>

              {/* Rank & Level Badge */}
              <div className="p-4 rounded-xl bg-surface-hover border border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted font-semibold">Tingkat Disiplin Diri:</p>
                  <p className="text-sm font-extrabold text-violet-500 mt-0.5">
                    {pmoDays < 3 && '🌱 Tunas Baru (Detoks Awal)'}
                    {pmoDays >= 3 && pmoDays < 7 && '⚡ Percikan Energi Alami'}
                    {pmoDays >= 7 && pmoDays < 14 && '🛡️ Pejuang Pikiran Fokus'}
                    {pmoDays >= 14 && pmoDays < 30 && '🦁 Jiwa Tangguh & Karismatik'}
                    {pmoDays >= 30 && pmoDays < 90 && '💎 Master Pengendalian Diri'}
                    {pmoDays >= 90 && '👑 Full Reboot (Raja Disiplin)'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sos')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  🚨 Butuh Bantuan?
                </button>
              </div>

              {/* PMO Milestones Roadmap */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Perubahan Otak & Mental:</p>
                <div className="space-y-2">
                  {PMO_MILESTONES.map((m) => {
                    const achieved = pmoDays >= m.days;
                    return (
                      <div
                        key={m.days}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                          achieved
                            ? 'bg-violet-500/10 border-violet-500/30 text-foreground'
                            : 'bg-surface/50 border-border/60 text-muted opacity-60'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{achieved ? '✨' : '🔒'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold ${achieved ? 'text-violet-500' : 'text-foreground'}`}>
                            {m.title}
                          </p>
                          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 3: MODE LAWAN GODAAN (SOS URGE SURFING) ───────── */}
      {activeTab === 'sos' && (
        <div className="space-y-6">

          {/* SOS Banner */}
          <div className="card p-6 sm:p-8 border-rose-500/30 bg-gradient-to-b from-rose-500/10 via-surface to-surface text-center space-y-4">
            <span className="text-4xl animate-bounce inline-block">🚨</span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Lagi Tergoda Mau Pod / PMO? Tahan 2 Menit Saja!
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
              Dorongan impulsif (craving) sebenarnya hanya bertahan <strong className="text-foreground">3-5 menit</strong> di otak. Jika kamu berhasil melewatinya sekarang, gelombangnya akan surut dan kamu menang!
            </p>

            {/* Wins counter badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-xs">
              <span>🏆 Kamu sudah berhasil menolak godaan sebanyak:</span>
              <span className="font-mono text-sm underline">{data.urgesResistedCount || 0} kali</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Latihan Nafas 4-7-8 Beranimasi */}
            <div className="card p-6 text-center space-y-5 border-cyan-500/25">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">🧘 Latihan Pernapasan 4-7-8</h3>
                <p className="text-xs text-muted">
                  Menurunkan denyut nadi dan menghentikan respon impulsif sistem saraf seketika.
                </p>
              </div>

              {/* Animated circle */}
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-cyan-500/30 bg-cyan-500/10"
                    animate={{
                      scale: breathPhase === 'tarik' ? 1.25 : breathPhase === 'tahan' ? 1.25 : breathPhase === 'hembus' ? 0.9 : 1,
                      opacity: breathPhase === 'idle' ? 0.4 : 1,
                    }}
                    transition={{
                      duration: breathPhase === 'tarik' ? 4 : breathPhase === 'tahan' ? 7 : breathPhase === 'hembus' ? 8 : 1,
                      ease: 'easeInOut',
                    }}
                  />
                  
                  <div className="relative flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
                      {breathPhase === 'idle' && 'Siap?'}
                      {breathPhase === 'tarik' && 'Tarik Nafas'}
                      {breathPhase === 'tahan' && 'Tahan Nafas'}
                      {breathPhase === 'hembus' && 'Hembuskan'}
                    </span>
                    <span className="text-4xl font-black text-foreground font-mono my-1">
                      {breathPhase === 'idle' ? '4-7-8' : breathTimer}
                    </span>
                    <span className="text-[10px] text-muted">
                      {breathPhase === 'idle' && 'Klik Mulai di Bawah'}
                      {breathPhase === 'tarik' && 'Tarik lewat hidung (4s)'}
                      {breathPhase === 'tahan' && 'Tahan di dada (7s)'}
                      {breathPhase === 'hembus' && 'Keluarkan perlahan (8s)'}
                    </span>
                  </div>
                </div>

                {breathCycle > 0 && breathPhase !== 'idle' && (
                  <p className="text-xs font-mono text-muted mt-3">Siklus ke-{breathCycle}</p>
                )}
              </div>

              <button
                onClick={toggleBreathing}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                  breathPhase === 'idle'
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
                    : 'bg-surface-hover hover:bg-surface border border-border text-muted hover:text-foreground'
                }`}
              >
                {breathPhase === 'idle' ? 'Mulai Latihan Nafas Sekarang' : 'Hentikan Latihan'}
              </button>
            </div>

            {/* 2. Tindakan Fisik Cepat & Tombol Menang */}
            <div className="space-y-5">
              
              <div className="card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>⚡</span> 3 Aksi Fisik Cepat Pengalih Otak
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-start gap-3">
                    <span className="text-xl">🥛</span>
                    <div>
                      <strong className="text-foreground block">1. Minum 1 gelas air es sekarang</strong>
                      <span className="text-muted">Sensasi dingin langsung mereset reseptor di mulut dan tenggorokan.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-start gap-3">
                    <span className="text-xl">💪</span>
                    <div>
                      <strong className="text-foreground block">2. Lakukan 15 kali push-up atau squat</strong>
                      <span className="text-muted">Mengarahkan aliran darah dari otak impulsif ke otot tubuh.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-hover border border-border flex items-start gap-3">
                    <span className="text-xl">🚶</span>
                    <div>
                      <strong className="text-foreground block">3. Keluar dari ruangan / letakkan HP</strong>
                      <span className="text-muted">Ubah lingkungan fisikmu segera untuk memutus rantai pemicu kebiasaan.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Big Win Button */}
              <div className="card p-6 text-center space-y-3 border-emerald-500/30 bg-emerald-500/5">
                <h4 className="text-sm font-bold text-foreground">
                  Sudah Merasa Lebih Tenang?
                </h4>
                <p className="text-xs text-muted">
                  Klik tombol di bawah untuk mencatat kemenangan mentalmu hari ini.
                </p>
                <button
                  onClick={handleDefeatedUrge}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-98"
                >
                  🏆 Saya Berhasil Melewati Godaan Ini!
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ── TAB 4: EVALUASI & RIWAYAT 7 HARI ─────────────────── */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">

          <div className="card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Konsistensi 7 Hari Terakhir</h2>
              <p className="text-xs text-muted mt-0.5">
                Lihat seberapa konsisten kamu membangun kebiasaan sehat sepekan ini.
              </p>
            </div>

            {/* 7 Days Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, idx) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - idx));
                const iso = d.toISOString().slice(0, 10);
                const log = data.dailyLogs[iso];
                const isToday = iso === today;

                const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                const dayNum = d.getDate();

                // Compute mini score
                let miniScore = 0;
                if (log) {
                  if (log.waterGlasses >= 6) miniScore += 30;
                  if (log.workoutDone) miniScore += 30;
                  if (log.coffeeCups <= 2) miniScore += 20;
                  if ((log.antiMagerDone?.length || 0) >= 3) miniScore += 20;
                }

                return (
                  <div
                    key={iso}
                    className={`p-3.5 rounded-2xl border text-center space-y-2 transition-all ${
                      isToday
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                        : log
                        ? 'border-border bg-surface'
                        : 'border-border/50 bg-surface/30 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block">{dayName}</span>
                      <span className="text-sm font-black text-foreground font-mono">{dayNum}</span>
                    </div>

                    <div className="text-xs font-mono font-bold text-emerald-500">
                      {log ? `${miniScore}%` : '-'}
                    </div>

                    <div className="text-[10px] text-muted space-y-0.5">
                      <p>💧 {log ? `${log.waterGlasses}/8` : '0/8'}</p>
                      <p>🏃 {log?.workoutDone ? '✓' : '—'}</p>
                      <p>☕ {log ? `${log.coffeeCups}c` : '0c'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips Disiplin Jangka Panjang */}
          <div className="card p-6 space-y-3 bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/20">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>📖</span> Kaidah Emas Membentuk Kebiasaan Baru (Atomic Habits)
            </h3>
            <ul className="text-xs text-muted space-y-2 leading-relaxed">
              <li>
                • <strong className="text-foreground">Jangan lewatkan 2 hari berturut-turut:</strong> Kalau kemarin kesiangan atau belum olahraga, pastikan hari ini kamu melakukannya walau cuma 5 menit.
              </li>
              <li>
                • <strong className="text-foreground">Fokus pada sistem, bukan motivasi:</strong> Motivasi cepat hilang. Yang membuat kita konsisten adalah sistem kecil (gelas air disiapkan di meja, baju olahraga disiapkan sebelum tidur).
              </li>
              <li>
                • <strong className="text-foreground">Ganti, jangan cuma hilangkan:</strong> Saat ingin pod atau ngopi, gantilah dengan meneguk air dingin atau permen mint.
              </li>
            </ul>
          </div>

        </div>
      )}

      {/* ── MODAL: PANDUAN & CARA KERJA ──────────────────────── */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-xl w-full p-6 sm:p-7 space-y-5 bg-card border-border shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌱</span>
                  <h3 className="text-lg font-bold text-foreground">Panduan & Cara Kerja Sistem</h3>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="text-muted hover:text-foreground text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-muted leading-relaxed">
                <div className="p-3.5 rounded-xl bg-surface-hover border border-border space-y-1">
                  <h4 className="font-bold text-foreground text-sm">Kenapa Halaman Ini Dirombak?</h4>
                  <p>
                    Sebelumnya halaman ini hanya berisi checklist umum yang kaku. Sekarang sistem ini dirancang khusus untuk memecahkan masalah utamamu: <strong>jarang olahraga, dehidrasi, sering ngopi, bangun tidur berantakan, rasa malas, serta berhenti dari pod dan PMO</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-sm">3 Pilar Cara Kerja:</h4>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>
                      <strong className="text-foreground">Pilar 1: Kebiasaan Sehat Harian</strong> — Cukup catat air putih yang kamu minum, jenis olahraga ringan yang kamu lakukan, batasi kopi max 1-2 cangkir, dan catat jam bangun pagimu.
                    </li>
                    <li>
                      <strong className="text-foreground">Pilar 2: Bebas Candu (Pod & PMO)</strong> — Hitungan streak hari bersih berjalan otomatis. Kamu bisa melihat tahapan pemulihan organ tubuhmu serta uang yang berhasil kamu hemat dari pod.
                    </li>
                    <li>
                      <strong className="text-foreground">Pilar 3: Mode Lawan Godaan (SOS)</strong> — Kapan pun muncul hasrat mendesak untuk pod atau PMO, jangan buka browser atau beli liquid! Buka tab <strong>🚨 SOS</strong>, ikuti latihan nafas 4-7-8, minum air es, dan tahan 2 menit saja.
                    </li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-1">
                  <h4 className="font-bold text-emerald-500">Kunci Sukses:</h4>
                  <p className="text-xs text-muted">
                    Kamu tidak perlu langsung sempurna 100% dalam sehari. Cukup buka halaman ini setiap pagi & malam, centang progresmu, dan rasakan tubuhmu semakin bugar dari hari ke hari!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
              >
                Saya Mengerti, Ayo Mulai!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: RESET STREAK (CONFIRM WITH EMPATHY) ───────── */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full p-6 space-y-4 bg-card border-border shadow-2xl text-center"
            >
              <span className="text-4xl inline-block">🛡️</span>
              <h3 className="text-lg font-bold text-foreground">
                Reset Streak {showResetModal === 'pod' ? 'Bebas Pod' : 'Bebas PMO'}?
              </h3>
              
              <p className="text-xs text-muted leading-relaxed">
                Terkadang kita terpeleset, dan itu adalah bagian dari proses pemulihan. <strong className="text-foreground">Jangan menghukum dirimu sendiri!</strong> Yang terpenting adalah kamu jujur dan siap bangkit kembali detik ini juga.
              </p>

              <div className="text-left space-y-1">
                <label className="text-[11px] font-bold text-muted">Apa yang memicunya? (Opsional untuk evaluasi)</label>
                <input
                  type="text"
                  placeholder="Misal: Lagi stres, begadang, bosan sendirian..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border text-foreground"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowResetModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-hover hover:bg-surface border border-border text-muted font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Reset & Mulai Lagi Lebih Kuat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
