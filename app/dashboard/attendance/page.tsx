'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import FaceScanner from '@/app/components/FaceScanner';
import toast from 'react-hot-toast';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function MapPinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CameraIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
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
function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────────
interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_image: string | null;
  check_out_image: string | null;
  checkout_target: string | null;
  status: 'on_time' | 'late' | 'absent' | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_location: string | null;
  check_in_timezone: string | null;
  check_in_timezone_label: string | null;
}

interface LocationInfo {
  latitude: number;
  longitude: number;
  location: string;
  timezone: string;
  timezoneLabel: string;
}

// ─── Helpers ────────────────────────────────────────────────────
function todayDateString(timeZone?: string) {
  const d = new Date();
  if (!timeZone) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

function fmtTime(iso: string | null, timeZone?: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(iso)).replace(/\./g, ':');
}

function getTimezoneLabel(timeZone: string) {
  if (timeZone === 'Asia/Jakarta') return 'WIB';
  if (timeZone === 'Asia/Makassar') return 'WITA';
  if (timeZone === 'Asia/Jayapura') return 'WIT';
  return 'LOCAL';
}

function getIndonesiaTimezone(longitude: number) {
  if (longitude < 105) return 'Asia/Jakarta';
  if (longitude < 120) return 'Asia/Makassar';
  return 'Asia/Jayapura';
}

async function getLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
    );
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    const city = data.city || data.locality || data.principalSubdivision || 'Lokasi tidak diketahui';
    const province = data.principalSubdivision;
    if (province && city !== province) {
      return `${city}, ${province}`;
    }
    return city;
  } catch {
    return 'Lokasi terdeteksi GPS';
  }
}

function getTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  return {
    hour: Number(parts.find((p) => p.type === 'hour')?.value ?? 0),
    minute: Number(parts.find((p) => p.type === 'minute')?.value ?? 0),
  };
}

function calcCheckoutTarget(checkInDate: Date, timeZone: string): Date {
  const plus8 = new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(checkInDate);
  const y = Number(parts.find((p) => p.type === 'year')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'month')?.value ?? 0);
  const d = Number(parts.find((p) => p.type === 'day')?.value ?? 0);

  const offsetHours =
    timeZone === 'Asia/Jakarta'
      ? 7
      : timeZone === 'Asia/Makassar'
      ? 8
      : timeZone === 'Asia/Jayapura'
      ? 9
      : -new Date(checkInDate).getTimezoneOffset() / 60;

  const floor = new Date(Date.UTC(y, m - 1, d, 15 - offsetHours, 0, 0));
  return plus8 > floor ? plus8 : floor;
}

function calcDuration(cin: string | null, cout: string | null): string {
  if (!cin || !cout) return '—';
  const diff = new Date(cout).getTime() - new Date(cin).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m`;
}

// ─── Seed Data ─────────────────────────────────────────────────
const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'seed-2026-10-09',
    date: '2026-10-09',
    check_in: '2026-10-09T07:45:00+07:00',
    check_out: '2026-10-09T16:15:00+07:00',
    checkout_target: '2026-10-09T15:45:00+07:00',
    status: 'on_time',
    check_in_image: null,
    check_out_image: null,
    check_in_latitude: -7.77,
    check_in_longitude: 110.37,
    check_in_location: 'Sleman, DI Yogyakarta',
    check_in_timezone: 'Asia/Jakarta',
    check_in_timezone_label: 'WIB',
  },
];

function buildFullAttendanceHistory(dbRecords: AttendanceRecord[], userEmail?: string): AttendanceRecord[] {
  const mapByDate = new Map<string, AttendanceRecord>();

  if (userEmail === 'yosafatmiquel@gmail.com') {
    SEED_ATTENDANCE.forEach((rec) => mapByDate.set(rec.date, rec));
  }

  dbRecords.forEach((rec) => mapByDate.set(rec.date, rec));

  if (typeof window !== 'undefined') {
    try {
      const localKey = userEmail ? `codebymiguel_attendance_${userEmail}` : 'codebymiguel_attendance_local';
      const local =
        localStorage.getItem(localKey) ||
        (userEmail === 'yosafatmiquel@gmail.com' ? localStorage.getItem('codebymiguel_attendance_local') : null);
      if (local) {
        const parsed: AttendanceRecord[] = JSON.parse(local);
        parsed.forEach((rec) => mapByDate.set(rec.date, rec));
      }
    } catch {}
  }

  const results: AttendanceRecord[] = [];
  const start = new Date(2026, 9, 9, 0, 0, 0); // 9 Oktober 2026
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let curr = new Date(start);
  while (curr.getTime() <= todayDate.getTime()) {
    const dayOfWeek = curr.getDay();
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (mapByDate.has(dStr)) {
        results.push(mapByDate.get(dStr)!);
      } else {
        const isToday = curr.getTime() === todayDate.getTime();
        results.push({
          id: `absent-${dStr}`,
          date: dStr,
          check_in: null,
          check_out: null,
          check_in_image: null,
          check_out_image: null,
          checkout_target: null,
          status: 'absent',
          check_in_latitude: null,
          check_in_longitude: null,
          check_in_location: isToday ? '— (Belum Hadir)' : '— (Tidak Hadir)',
          check_in_timezone: 'Asia/Jakarta',
          check_in_timezone_label: 'WIB',
        });
      }
    }
    curr.setDate(curr.getDate() + 1);
  }

  return results.sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
}

export default function AttendancePage() {
  const { user } = useAuth();

  const [now, setNow] = useState<Date | null>(null);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerMode, setScannerMode] = useState<'in' | 'out' | 'test' | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  // Clock ticker
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch Attendance records
  const fetchData = useCallback(async () => {
    setIsLoadingToday(true);
    if (!user?.email) {
      setToday(null);
      setHistory([]);
      setIsLoadingToday(false);
      return;
    }
    const userEmail = user.email;
    const activeTz = locationInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = todayDateString(activeTz);

    let sbToday: AttendanceRecord | null = null;
    let sbHistory: AttendanceRecord[] = [];

    try {
      const [{ data: todayData }, { data: histData }] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('user_email', userEmail)
          .eq('date', todayStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('attendance')
          .select('*')
          .eq('user_email', userEmail)
          .order('date', { ascending: false })
          .limit(30),
      ]);
      sbToday = todayData ?? null;
      sbHistory = histData ?? [];
    } catch (e) {
      console.warn('Supabase fetch attendance fallback:', e);
    }

    let localRecords: AttendanceRecord[] = [];
    if (typeof window !== 'undefined') {
      try {
        const userLocalKey = `codebymiguel_attendance_${userEmail}`;
        const raw =
          localStorage.getItem(userLocalKey) ||
          (userEmail === 'yosafatmiquel@gmail.com' ? localStorage.getItem('codebymiguel_attendance_local') : null);
        if (raw) localRecords = JSON.parse(raw);
      } catch {}
    }

    const allKnown = [...sbHistory];
    localRecords.forEach((lr) => {
      if (!allKnown.some((r) => r.date === lr.date)) {
        allKnown.push(lr);
      }
    });

    const activeToday = sbToday || localRecords.find((r) => r.date === todayStr) || null;
    setToday(activeToday);

    const fullHistory = buildFullAttendanceHistory(allKnown, userEmail);
    setHistory(fullHistory);
    setIsLoadingToday(false);
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Geolocation detection
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const timezone = getIndonesiaTimezone(longitude);
        const timezoneLabel = getTimezoneLabel(timezone);
        const location = await getLocationName(latitude, longitude);

        setLocationInfo({
          latitude,
          longitude,
          location,
          timezone,
          timezoneLabel,
        });
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLocationInfo({
          latitude: -6.2,
          longitude: 106.8,
          location: 'Jakarta (Default System)',
          timezone: tz,
          timezoneLabel: getTimezoneLabel(tz),
        });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle Check-in
  const handleCheckIn = async (imageBase64?: string) => {
    if (!now || !locationInfo || !user?.email) return;

    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error('Hari ini libur akhir pekan (Sabtu & Minggu). Tetap santai dan pulihkan energi!');
      return;
    }

    const { hour, minute } = getTimeParts(now, locationInfo.timezone);
    const totalMin = hour * 60 + minute;

    if (totalMin < 5 * 60) {
      toast.error('Check-in dibuka mulai pukul 05:00 pagi.');
      return;
    }

    if (totalMin > 10 * 60) {
      toast.error('Waktu check-in telah berakhir (maksimal pukul 10:00 pagi). Anda dicatat tidak hadir hari ini.');
      return;
    }

    let status: 'on_time' | 'late' = 'on_time';
    if (totalMin > 8 * 60 + 30) {
      status = 'late';
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Memverifikasi presensi biometrik...');
    const userEmail = user.email;

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      date: todayDateString(locationInfo.timezone),
      check_in: now.toISOString(),
      checkout_target: calcCheckoutTarget(now, locationInfo.timezone).toISOString(),
      status,
      check_in_latitude: locationInfo.latitude,
      check_in_longitude: locationInfo.longitude,
      check_in_location: locationInfo.location,
      check_in_timezone: locationInfo.timezone,
      check_in_timezone_label: locationInfo.timezoneLabel,
      check_in_image: imageBase64 || null,
      check_out: null,
      check_out_image: null,
    };

    try {
      const userLocalKey = `codebymiguel_attendance_${userEmail}`;
      const existing = JSON.parse(localStorage.getItem(userLocalKey) || '[]');
      const filtered = existing.filter((r: AttendanceRecord) => r.date !== newRecord.date);
      filtered.unshift(newRecord);
      localStorage.setItem(userLocalKey, JSON.stringify(filtered));
    } catch {}

    try {
      await supabase.from('attendance').insert({
        user_email: userEmail,
        date: newRecord.date,
        check_in: newRecord.check_in,
        checkout_target: newRecord.checkout_target,
        status: newRecord.status,
        check_in_latitude: newRecord.check_in_latitude,
        check_in_longitude: newRecord.check_in_longitude,
        check_in_location: newRecord.check_in_location,
        check_in_timezone: newRecord.check_in_timezone,
        check_in_timezone_label: newRecord.check_in_timezone_label,
        check_in_image: newRecord.check_in_image,
      });
    } catch (e) {
      console.warn('Supabase insert fallback to local cache:', e);
    }

    toast.dismiss(loadingToast);
    toast.success(
      status === 'on_time'
        ? 'Luar biasa! Hadir tepat waktu. Selamat memulai hari produktif!'
        : 'Presensi berhasil dicatat (Terlambat). Tetap semangat hari ini!'
    );
    setIsSubmitting(false);
    setScannerMode(null);
    fetchData();
  };

  // Handle Check-out
  const handleCheckOut = async (imageBase64?: string) => {
    if (!now || !today || !user?.email) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Menyimpan jam kepulangan...');
    const userEmail = user.email;
    const checkoutTime = now.toISOString();

    try {
      const userLocalKey = `codebymiguel_attendance_${userEmail}`;
      const existing = JSON.parse(localStorage.getItem(userLocalKey) || '[]');
      const updated = existing.map((r: AttendanceRecord) => {
        if (r.date === today.date) {
          return { ...r, check_out: checkoutTime, check_out_image: imageBase64 || r.check_out_image };
        }
        return r;
      });
      localStorage.setItem(userLocalKey, JSON.stringify(updated));
    } catch {}

    try {
      await supabase
        .from('attendance')
        .update({
          check_out: checkoutTime,
          check_out_image: imageBase64 || null,
        })
        .eq('user_email', userEmail)
        .eq('date', today.date);
    } catch (e) {
      console.warn('Supabase checkout update fallback:', e);
    }

    toast.dismiss(loadingToast);
    toast.success('Check-out berhasil dicatat. Terima kasih atas kerja kerasmu hari ini!');
    setIsSubmitting(false);
    setScannerMode(null);
    fetchData();
  };

  const tz = locationInfo?.timezone || 'Asia/Jakarta';
  const currentHourMinute = now ? getTimeParts(now, tz) : { hour: 0, minute: 0 };
  const currentTotalMin = currentHourMinute.hour * 60 + currentHourMinute.minute;

  const isBeforeOpening = currentTotalMin < 5 * 60; // sebelum 05:00
  const isLatePeriod = currentTotalMin > 8 * 60 + 30 && currentTotalMin <= 10 * 60; // 08:31 - 10:00 (Terlambat)
  const isCheckInClosed = currentTotalMin > 10 * 60; // lewat 10:00 pagi (Check in ditutup)
  const isWeekend = now ? (now.getDay() === 0 || now.getDay() === 6) : false;
  const canCheckIn = !today?.check_in && !isBeforeOpening && !isCheckInClosed && !isWeekend;

  const todayStrFormatted = now
    ? new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: locationInfo?.timezone,
      }).format(now)
    : 'Memuat tanggal...';

  const currentTimeFormatted = now
    ? new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: locationInfo?.timezone,
      }).format(now).replace(/\./g, ':')
    : '--:--:--';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">

      {/* ── TOP HEADER SECTION: Attendance & Motivation ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              ATTENDANCE
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">{todayStrFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            Attendance & Discipline
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5 font-medium max-w-2xl leading-relaxed">
            Menjaga konsistensi bangun pagi, disiplin waktu, dan ritme produktivitas harian layaknya profesional.
          </p>
        </div>

        {/* Live Clock & GPS Chip + Test Scan Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Dedicated Test Scan Wajah Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setScannerMode('test')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white text-xs sm:text-[13px] font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="Uji coba kamera & deteksi wajah tanpa mengubah absensi"
          >
            <CameraIcon className="w-4 h-4 text-white" />
            <span>Test Scan Wajah</span>
          </motion.button>

          <div className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between sm:justify-start gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
            </span>
            <div className="min-w-0">
              <div className="text-[15px] sm:text-[16px] font-mono font-bold text-zinc-900 leading-none">
                {currentTimeFormatted} <span className="text-[11px] font-sans font-bold text-zinc-400">{locationInfo?.timezoneLabel || 'WIB'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium mt-1">
                <MapPinIcon className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate max-w-[200px]">{locationInfo?.location || 'Mencari sinyal GPS...'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── DUA KARTU AKSI UTAMA (Check-In & Check-Out) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* ACTION CARD 1: CHECK IN */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4 sm:space-y-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-[20px] font-bold text-zinc-900 font-heading">
                Check In
              </h3>
              <p className="text-[11px] sm:text-[12px] text-zinc-400 mt-0.5">
                Scan wajah Anda untuk verifikasi kehadiran hari ini (05:00 – 10:00 WIB).
              </p>
            </div>

            {today?.check_in ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200 shrink-0">
                <CheckCircleIcon className="w-3.5 h-3.5 text-lime-600" /> Sudah Hadir
              </span>
            ) : isCheckInClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                Waktu Berakhir
              </span>
            ) : null}
          </div>

          {/* Status Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold uppercase">Waktu Tercatat</p>
              <p className="text-[18px] sm:text-[20px] font-bold font-mono text-zinc-900 leading-none">
                {today?.check_in ? fmtTime(today.check_in, locationInfo?.timezone) : '--:--'}{' '}
                <span className="text-[11px] sm:text-[12px] font-sans font-medium text-zinc-400">
                  {today?.check_in ? (locationInfo?.timezoneLabel || 'WIB') : ''}
                </span>
              </p>
              {today?.check_in ? (
                <p className="text-[11px] font-semibold text-lime-700 pt-0.5 truncate">
                  • {today.status === 'on_time' ? 'Tepat Waktu' : 'Terlambat'}
                </p>
              ) : isCheckInClosed ? (
                <p className="text-[11px] font-semibold text-rose-600 pt-0.5 truncate">
                  • Waktu Check-In Berakhir (Tidak Hadir)
                </p>
              ) : (
                <p className="text-[11px] font-semibold text-zinc-400 pt-0.5 truncate">
                  • {isLatePeriod ? 'Periode Terlambat (Maksimal 10:00 WIB)' : 'Batas Tepat Waktu: 08:30 WIB'}
                </p>
              )}
            </div>

            {/* Thumbnail preview if photo exists */}
            {today?.check_in_image && (
              <button
                onClick={() => setPreviewImage(today.check_in_image)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                title="Klik untuk lihat foto"
              >
                <img src={today.check_in_image} alt="Biometric Face" className="w-full h-full object-cover" />
              </button>
            )}
          </div>

          {/* Action Button */}
          {!today?.check_in ? (
            canCheckIn ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setScannerMode('in')}
                disabled={isSubmitting}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs sm:text-[13px] font-bold tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CameraIcon className="w-4 h-4 text-lime-400" />
                <span>CHECK IN {isLatePeriod ? '(TERLAMBAT)' : ''}</span>
              </motion.button>
            ) : (
              <div className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-center space-y-0.5 cursor-not-allowed">
                <span className="text-[11px] sm:text-[12px] font-bold text-zinc-400 block tracking-wider uppercase font-mono">
                  CHECK IN DITUTUP
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 block">
                  {isCheckInClosed
                    ? 'Batas waktu check-in (maksimal 10:00 pagi) telah berakhir.'
                    : isBeforeOpening
                    ? 'Check-in dibuka mulai pukul 05:00 pagi.'
                    : isWeekend
                    ? 'Hari ini libur akhir pekan (Sabtu & Minggu).'
                    : 'Check-in tidak aktif.'}
                </span>
              </div>
            )
          ) : (
            <div className="text-center py-2 text-xs font-semibold text-zinc-400 bg-zinc-50 rounded-xl">
              ✓ Anda telah berhasil check-in untuk hari ini.
            </div>
          )}

          {/* Quick test camera button inside card */}
          <button
            type="button"
            onClick={() => setScannerMode('test')}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 text-[11px] font-semibold text-zinc-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CameraIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span>Test Kamera Scan Wajah (Bypass Jam & Status)</span>
          </button>
        </motion.div>

        {/* ACTION CARD 2: CHECK OUT */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4 sm:space-y-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-[20px] font-bold text-zinc-900 font-heading">
                Check Out
              </h3>
              <p className="text-[11px] sm:text-[12px] text-zinc-400 mt-0.5">
                Konfirmasi kepulangan dan evaluasi jam fokus yang telah selesai.
              </p>
            </div>

            {today?.check_out && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
                <CheckCircleIcon className="w-3.5 h-3.5 text-zinc-500" /> Sudah Check-Out
              </span>
            )}
          </div>

          {/* Status Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold uppercase">Waktu Selesai</p>
              <p className="text-[18px] sm:text-[20px] font-bold font-mono text-zinc-900 leading-none">
                {today?.check_out ? fmtTime(today.check_out, locationInfo?.timezone) : '--:--'}{' '}
                <span className="text-[11px] sm:text-[12px] font-sans font-medium text-zinc-400">
                  {today?.check_out ? (locationInfo?.timezoneLabel || 'WIB') : ''}
                </span>
              </p>
              <p className="text-[11px] font-semibold text-zinc-500 pt-0.5 truncate">
                Durasi Kerja: {today?.check_in && today?.check_out ? calcDuration(today.check_in, today.check_out) : 'Menunggu checkout'}
              </p>
            </div>

            {today?.check_out_image && (
              <button
                onClick={() => setPreviewImage(today.check_out_image)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                title="Klik untuk lihat foto"
              >
                <img src={today.check_out_image} alt="Biometric Face" className="w-full h-full object-cover" />
              </button>
            )}
          </div>

          {/* Action Button */}
          {!today?.check_out ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (!today?.check_in) {
                  toast.error('Anda belum check-in hari ini!');
                  return;
                }
                setScannerMode('out');
              }}
              disabled={isSubmitting || !today?.check_in}
              className={`w-full py-3 sm:py-3.5 rounded-2xl text-xs sm:text-[13px] font-bold tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                today?.check_in
                  ? 'bg-zinc-900 hover:bg-black text-white shadow-zinc-900/10'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>{today?.check_in ? 'CHECK OUT' : 'CHECK OUT'}</span>
            </motion.button>
          ) : (
            <div className="text-center py-2 text-xs font-semibold text-zinc-400 bg-zinc-50 rounded-xl">
              ✓ Sesi kerja hari ini telah selesai. Selamat beristirahat!
            </div>
          )}
        </motion.div>

      </div>

      {/* ── ATTENDANCE LOG HISTORY (BENTO TABLE) ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-heading">
              Riwayat Kehadiran & Kedisiplinan
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Log harian hari kerja (Senin – Jumat) yang terverifikasi biometrik
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium sm:hidden">
              ← Geser tabel ke samping →
            </span>
            <span className="text-xs font-bold text-zinc-600 font-mono bg-zinc-100 px-3 py-1 rounded-full shrink-0">
              {history.length} Catatan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-semibold text-[11px] bg-zinc-50/50">
                <th className="py-3 px-3 font-medium min-w-[150px]">Hari & Tanggal</th>
                <th className="py-3 px-3 font-medium w-24">Check-In</th>
                <th className="py-3 px-3 font-medium w-24">Check-Out</th>
                <th className="py-3 px-3 font-medium w-28">Durasi Fokus</th>
                <th className="py-3 px-3 font-medium min-w-[140px]">Lokasi GPS</th>
                <th className="py-3 px-3 font-medium w-20 text-center">Biometrik</th>
                <th className="py-3 px-3 font-medium text-right w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/70">
              {history.map((record) => {
                const dateLabel = new Date(record.date + 'T00:00:00').toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                const isToday = record.date === todayDateString(locationInfo?.timezone);

                return (
                  <tr key={record.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-zinc-800">
                      {dateLabel}{' '}
                      {isToday && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-50 text-lime-700 border border-lime-200 whitespace-nowrap">
                          Hari Ini
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-zinc-700 whitespace-nowrap">
                      {fmtTime(record.check_in, record.check_in_timezone || locationInfo?.timezone)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-500 whitespace-nowrap">
                      {fmtTime(record.check_out, record.check_in_timezone || locationInfo?.timezone)}
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-600 whitespace-nowrap">
                      {calcDuration(record.check_in, record.check_out)}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 font-medium truncate max-w-[180px]">
                      {record.check_in_location || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {record.check_in_image ? (
                        <button
                          onClick={() => setPreviewImage(record.check_in_image)}
                          className="w-7 h-7 mx-auto rounded-lg overflow-hidden border border-zinc-200 hover:ring-2 hover:ring-lime-500 transition-all cursor-pointer block"
                          title="Lihat foto scan wajah"
                        >
                          <img src={record.check_in_image} alt="Scan Wajah" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {record.status === 'on_time' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-50 text-lime-700 border border-lime-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                          Tepat Waktu
                        </span>
                      ) : record.status === 'late' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Terlambat
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isToday
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400'}`} />
                          {isToday ? 'Belum Check-In' : 'Tidak Hadir'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── MODAL: FACE SCANNER ── */}
      <AnimatePresence>
        {scannerMode && (
          <FaceScanner
            title={
              scannerMode === 'in'
                ? 'Biometric Face Check-In'
                : scannerMode === 'out'
                ? 'Biometric Face Check-Out'
                : 'Uji Coba / Test Scan Wajah'
            }
            subtitle={
              scannerMode === 'test'
                ? 'Mode testing: Memeriksa kelurusan & orientasi kamera'
                : 'Posisikan wajah Anda tepat di dalam bingkai scanner'
            }
            onFaceDetected={(_descriptor, imageBase64) => {
              if (scannerMode === 'in') {
                handleCheckIn(imageBase64);
              } else if (scannerMode === 'out') {
                handleCheckOut(imageBase64);
              } else if (scannerMode === 'test') {
                toast.success('Test Scan Berhasil! Wajah berhasil terdeteksi.');
                setPreviewImage(imageBase64);
                setScannerMode(null);
              }
            }}
            onCancel={() => setScannerMode(null)}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: PHOTO PREVIEW ── */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-5 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 font-heading">Foto Verifikasi Wajah</h4>
                <button onClick={() => setPreviewImage(null)} className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-zinc-200 aspect-square">
                <img src={previewImage} alt="Preview Wajah Biometrik" className="w-full h-full object-cover" />
              </div>
              <p className="text-center text-[11px] text-zinc-400 font-medium">
                Terekam saat proses check-in / check-out presensi.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
