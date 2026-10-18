'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import FaceScanner from '@/app/components/FaceScanner';
import toast from 'react-hot-toast';

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

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === 'year')?.value ?? 0),
    month: Number(parts.find((p) => p.type === 'month')?.value ?? 0),
    day: Number(parts.find((p) => p.type === 'day')?.value ?? 0),
    weekday: parts.find((p) => p.type === 'weekday')?.value ?? '',
  };
}

function calcCheckoutTarget(checkInDate: Date, timeZone: string): Date {
  const plus8 = new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000);
  const parts = getDateParts(checkInDate, timeZone);
  const offsetHours =
    timeZone === 'Asia/Jakarta'
      ? 7
      : timeZone === 'Asia/Makassar'
      ? 8
      : timeZone === 'Asia/Jayapura'
      ? 9
      : -new Date(checkInDate).getTimezoneOffset() / 60;

  const floor = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 15 - offsetHours, 0, 0)
  );
  return plus8 > floor ? plus8 : floor;
}

function fmtDate(dateStr: string, timeZone?: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  });
}

function calcDuration(cin: string | null, cout: string | null): string {
  if (!cin || !cout) return '—';
  const diff = new Date(cout).getTime() - new Date(cin).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m`;
}

// ─── Seed Data (Mulai Presensi 9 Oktober 2026 - Jumat) ─────────
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

// ─── Generator Riwayat Hari Kerja (Senin–Jumat) ────────────────
function buildFullAttendanceHistory(dbRecords: AttendanceRecord[]): AttendanceRecord[] {
  const mapByDate = new Map<string, AttendanceRecord>();

  // 1. Seed attendance
  SEED_ATTENDANCE.forEach((rec) => mapByDate.set(rec.date, rec));

  // 2. DB records
  dbRecords.forEach((rec) => mapByDate.set(rec.date, rec));

  // 3. LocalStorage records
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('codebymiguel_attendance_local');
      if (local) {
        const parsed: AttendanceRecord[] = JSON.parse(local);
        parsed.forEach((rec) => mapByDate.set(rec.date, rec));
      }
    } catch {}
  }

  // 4. Generate all workdays from 2026-10-09 up to today
  const results: AttendanceRecord[] = [];
  const start = new Date(2026, 9, 9, 0, 0, 0); // 9 Oktober 2026 (Jumat)
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let curr = new Date(start);
  while (curr.getTime() <= todayDate.getTime()) {
    const dayOfWeek = curr.getDay(); // 0: Sunday, 6: Saturday
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;

    // STRICT: Hari Sabtu & Minggu memang libur, JANGAN dimasukkan ke riwayat!
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (mapByDate.has(dStr)) {
        results.push(mapByDate.get(dStr)!);
      } else if (curr.getTime() < todayDate.getTime()) {
        // Hari kerja masa lalu yang tidak ada rekaman absensi -> "Tidak Absen"
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
          check_in_location: '— (Tidak Hadir)',
          check_in_timezone: 'Asia/Jakarta',
          check_in_timezone_label: 'WIB',
        });
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  // Urutkan tanggal terbaru paling atas
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
  const [locationError, setLocationError] = useState<string | null>(null);

  // Clock ticker
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch Attendance records
  const fetchData = useCallback(async () => {
    setIsLoadingToday(true);
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';
    const activeTz = locationInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayStr = todayDateString(activeTz);

    let sbToday: AttendanceRecord | null = null;
    let sbHistory: AttendanceRecord[] = [];

    try {
      const [{ data: todayData }, { data: histData }] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .or(`user_email.eq.${userEmail},user_email.eq.yosafatmiquel@gmail.com`)
          .eq('date', todayStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('attendance')
          .select('*')
          .or(`user_email.eq.${userEmail},user_email.eq.yosafatmiquel@gmail.com`)
          .order('date', { ascending: false })
          .limit(30),
      ]);
      sbToday = todayData ?? null;
      sbHistory = histData ?? [];
    } catch (e) {
      console.warn('Supabase fetch attendance fallback:', e);
    }

    // Local storage cache read
    let localRecords: AttendanceRecord[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('codebymiguel_attendance_local');
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

    // Build full history with absent tracking for workdays
    const fullHistory = buildFullAttendanceHistory(allKnown);
    setHistory(fullHistory);
    setIsLoadingToday(false);
  }, [user, locationInfo?.timezone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Geolocation detection
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung akses GPS.');
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
        setLocationError(null);
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationError(err.code === 1 ? 'Akses GPS ditolak.' : 'GPS sedang offline.');
        // Fallback info
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
    if (!now) return;

    if (!locationInfo) {
      toast.error('Lokasi belum siap. Mohon izinkan akses GPS.');
      return;
    }

    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error('Hari ini libur akhir pekan (Sabtu & Minggu). Tidak ada presensi.');
      return;
    }

    const { hour, minute } = getTimeParts(now, locationInfo.timezone);
    const totalMin = hour * 60 + minute;

    if (totalMin < 5 * 60) {
      toast.error('Check-in belum dibuka. Jam operasional mulai pukul 05:00 WIB.');
      return;
    }

    let status: 'on_time' | 'late' = 'on_time';
    if (totalMin > 10 * 60 + 30) {
      status = 'late';
      toast('Check-in di luar jam kerja (lewat 10:30 WIB) dicatat sebagai Terlambat.', { icon: '⚠️' });
    } else if (totalMin > 8 * 60 + 30) {
      status = 'late';
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Memproses check-in biometrik...');
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';

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

    // Save to local storage cache immediately
    try {
      const existing = JSON.parse(localStorage.getItem('codebymiguel_attendance_local') || '[]');
      const filtered = existing.filter((r: AttendanceRecord) => r.date !== newRecord.date);
      filtered.unshift(newRecord);
      localStorage.setItem('codebymiguel_attendance_local', JSON.stringify(filtered));
    } catch {}

    // Attempt Supabase insert
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
      console.warn('Supabase insert note:', e);
    }

    setIsSubmitting(false);
    toast.dismiss(loadingToast);

    toast.success(status === 'late' ? `Check-in berhasil (Terlambat) di ${locationInfo.location}` : `Check-in berhasil! Selamat bekerja (${locationInfo.location})`);
    setScannerMode(null);
    fetchData();
  };

  // Handle Check-out
  const handleCheckOut = async (imageBase64?: string) => {
    if (!now || !today?.id) {
      toast.error('Anda belum check-in hari ini!');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Memproses checkout biometrik...');
    const updatedCheckout = now.toISOString();

    // Update local storage
    try {
      const existing = JSON.parse(localStorage.getItem('codebymiguel_attendance_local') || '[]');
      const updated = existing.map((r: AttendanceRecord) => {
        if (r.id === today.id || r.date === today.date) {
          return { ...r, check_out: updatedCheckout, check_out_image: imageBase64 || null };
        }
        return r;
      });
      localStorage.setItem('codebymiguel_attendance_local', JSON.stringify(updated));
    } catch {}

    // Attempt Supabase update
    try {
      await supabase
        .from('attendance')
        .update({
          check_out: updatedCheckout,
          check_out_image: imageBase64 || null,
        })
        .eq('id', today.id);
    } catch (e) {
      console.warn('Supabase update note:', e);
    }

    setIsSubmitting(false);
    toast.dismiss(loadingToast);

    toast.success('Check-out berhasil! Terima kasih atas dedikasi Anda hari ini.');
    setScannerMode(null);
    fetchData();
  };

  // Scanner callback
  const handleFaceDetected = (descriptor: Float32Array, imageBase64: string) => {
    if (scannerMode === 'in') {
      handleCheckIn(imageBase64);
    } else if (scannerMode === 'out') {
      handleCheckOut(imageBase64);
    } else if (scannerMode === 'test') {
      toast.success('Wajah berhasil diverifikasi oleh AI!');
      setScannerMode(null);
    }
  };

  if (!now) return null;

  const activeTimezone = locationInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;
  const checkoutTargetDate = today?.checkout_target ? new Date(today.checkout_target) : null;
  const canCheckOut = checkedIn && !checkedOut && !!checkoutTargetDate && now >= checkoutTargetDate;

  // Shift progress calculation
  let workProgress = 0;
  let remainingText = '';
  if (checkedIn && today?.check_in && today?.checkout_target) {
    const start = new Date(today.check_in).getTime();
    const target = new Date(today.checkout_target).getTime();
    const current = now.getTime();
    const total = target - start;
    const elapsed = current - start;
    workProgress = checkedOut ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));

    if (!checkedOut && checkoutTargetDate && now < checkoutTargetDate) {
      const diff = checkoutTargetDate.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      remainingText = h > 0 ? `${h} jam ${m} mnt lagi` : `${m} menit lagi`;
    }
  }

  // Stats calculation
  const attendedRecords = history.filter((h) => h.status === 'on_time' || h.status === 'late');
  const totalAttendedCount = attendedRecords.length;
  const absentCount = history.filter((h) => h.status === 'absent').length;
  const onTimeCount = history.filter((h) => h.status === 'on_time').length;
  const lateCount = history.filter((h) => h.status === 'late').length;
  const onTimePercentage = totalAttendedCount > 0 ? Math.round((onTimeCount / totalAttendedCount) * 100) : 100;

  // Time window rules calculation
  const { hour, minute } = now ? getTimeParts(now, activeTimezone) : { hour: 0, minute: 0 };
  const totalMin = hour * 60 + minute;
  const isWeekend = now ? now.getDay() === 0 || now.getDay() === 6 : false;

  const isBeforeOpen = totalMin < 5 * 60;
  const isOnTimeWindow = totalMin >= 5 * 60 && totalMin <= 8 * 60 + 30;
  const isLateWindow = totalMin > 8 * 60 + 30 && totalMin <= 10 * 60 + 30;
  const isAfterClosed = totalMin > 10 * 60 + 30;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Top Hero Card: Biometric Status & Info ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl glass-panel p-4.5 sm:p-6 lg:p-8 border border-border/80 shadow-2xl"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                isWeekend
                  ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400'
                  : 'bg-surface-hover border-border text-muted'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isWeekend
                    ? 'bg-indigo-400'
                    : checkedIn
                    ? (checkedOut ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse')
                    : 'bg-amber-500'
                }`} />
                {isWeekend
                  ? 'Hari Libur (Weekend)'
                  : checkedIn
                  ? (checkedOut ? 'Presensi Selesai' : 'Sedang Bertugas')
                  : 'Belum Presensi'}
              </span>

              {/* Operational Window Status Pill */}
              {isWeekend ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-[11px] font-bold text-indigo-400">
                  🌴 Hari Libur
                </span>
              ) : (
                <>
                  {isBeforeOpen && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-hover border border-border text-[11px] font-bold text-muted">
                      ⏳ Belum Buka (Mulai 05:00 WIB)
                    </span>
                  )}
                  {isOnTimeWindow && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-bold text-emerald-500 animate-pulse">
                      ✅ Jam Absensi Aktif (05:00–08:30 Tepat Waktu)
                    </span>
                  )}
                  {isLateWindow && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[11px] font-bold text-amber-500">
                      ⚠️ Zona Terlambat (08:31–10:30 WIB)
                    </span>
                  )}
                  {isAfterClosed && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/25 text-[11px] font-bold text-rose-500">
                      🔒 Check-in Ditutup (Maks 10:30 WIB)
                    </span>
                  )}
                </>
              )}

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-semibold text-cyan-500 font-mono">
                {locationInfo?.timezoneLabel || 'WIB'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Presensi Wajah AI
              </h1>
              <span className="text-xl sm:text-2xl font-black font-mono text-primary">
                {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
              </span>
            </div>

            <p className="text-muted text-xs sm:text-sm max-w-xl leading-relaxed">
              Catat jam masuk dan kepulangan menggunakan verifikasi biometrik kamera serta lokasi GPS real-time.
            </p>

            {/* GPS Location Chip */}
            <div className="flex items-center gap-2 text-xs text-muted pt-1">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <span className="font-medium text-foreground truncate max-w-[260px] sm:max-w-md" title={locationInfo?.location || ''}>
                {isGettingLocation ? 'Mendeteksi titik koordinat GPS...' : locationInfo?.location || 'Lokasi Terdaftar'}
              </span>
            </div>
          </div>

          {/* Status Indicator Widget on Hero Right */}
          <div className="shrink-0 flex items-center">
            {isWeekend ? (
              <div className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                <span className="text-2xl">🌴</span>
                <div>
                  <p className="text-xs font-bold text-foreground">Libur Akhir Pekan</p>
                  <p className="text-[11px] text-muted">Tidak ada jadwal presensi</p>
                </div>
              </div>
            ) : checkedIn ? (
              <div className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <span className="text-2xl">{checkedOut ? '🎉' : '💼'}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{checkedOut ? 'Tugas Selesai' : 'Sedang Bertugas'}</p>
                  <p className="text-[11px] text-muted">
                    {checkedOut ? 'Check-out berhasil dicatat' : `Masuk ${fmtTime(today?.check_in ?? null, activeTimezone)}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-surface-hover/80 border border-border flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs font-bold text-foreground">Presensi Kerja</p>
                  <p className="text-[11px] text-muted">Klik Presensi Masuk di bawah</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shift Progress bar if checked in */}
        {checkedIn && (
          <div className="mt-5 pt-4 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Progress Kerja: {Math.round(workProgress)}%
              </span>
              <span className="text-muted font-medium">
                {checkedOut ? 'Selesai 100%' : remainingText ? remainingText : 'Siap Checkout'}
              </span>
            </div>
            <div className="w-full bg-border/40 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${workProgress}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Notifikasi Hari Libur (Sabtu & Minggu) ───────────── */}
      {isWeekend && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0">
              🌴
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Hari Ini Libur Akhir Pekan ({now.toLocaleDateString('id-ID', { weekday: 'long' })})
              </h4>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                Presensi kerja tidak berlaku pada hari Sabtu dan Minggu. Selamat beristirahat dan menikmati akhir pekan!
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 whitespace-nowrap self-end sm:self-auto">
            Hari Libur
          </span>
        </motion.div>
      )}

      {/* ── Status Presensi Hari Ini: Check-in & Check-out ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Info Card */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-border/80 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-base">
                📥
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Check-in (Masuk)
                </h3>
                <p className="text-[11px] text-muted">Jadwal: 05:00 – 10:30 WIB</p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isWeekend
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : checkedIn
                ? today?.status === 'on_time'
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                : 'bg-surface-hover text-muted border border-border'
            }`}>
              {isWeekend ? '🌴 Hari Libur' : checkedIn ? (today?.status === 'on_time' ? 'Tepat Waktu' : 'Terlambat') : 'Belum Check-in'}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                {isWeekend && !checkedIn ? '— : —' : fmtTime(today?.check_in ?? null, activeTimezone)}
              </p>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                {isWeekend
                  ? 'Hari libur akhir pekan (Sabtu & Minggu). Tidak ada presensi.'
                  : checkedIn
                  ? `Tercatat di ${today?.check_in_location || 'GPS Terdaftar'}`
                  : 'Waktu check-in resmi: 05:00 - 10:30 WIB'}
              </p>
            </div>

            {isWeekend ? (
              <button
                disabled
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border/70 text-muted cursor-not-allowed opacity-60 flex items-center justify-center gap-1.5"
              >
                <span>🌴 Hari Libur (Non-Aktif)</span>
              </button>
            ) : !checkedIn ? (
              <button
                onClick={() => setScannerMode('in')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <span>Presensi Masuk</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Check-out Info Card */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-border/80 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-base">
                📤
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Check-out (Pulang)
                </h3>
                <p className="text-[11px] text-muted">Min. 8 jam kerja (s/d min. 15:00 WIB)</p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isWeekend && !checkedIn
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : checkedOut
                ? 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                : canCheckOut
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 animate-pulse'
                : 'bg-surface-hover text-muted border border-border'
            }`}>
              {isWeekend && !checkedIn ? '🌴 Hari Libur' : checkedOut ? 'Selesai' : canCheckOut ? 'Siap Checkout' : 'Terkunci'}
            </span>
          </div>

          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                  {isWeekend && !checkedIn ? '— : —' : fmtTime(today?.check_out ?? null, activeTimezone)}
                </p>
                {today?.checkout_target && (
                  <span className="text-xs font-mono text-muted">
                    (Target: {fmtTime(today.checkout_target, activeTimezone)})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                {isWeekend && !checkedIn
                  ? 'Tidak ada jam kerja aktif di hari libur.'
                  : checkedOut
                  ? `Total durasi kerja hari ini: ${calcDuration(today?.check_in ?? null, today?.check_out ?? null)}`
                  : checkedIn
                  ? (canCheckOut
                    ? 'Target 8 jam kerja telah terpenuhi. Silakan lakukan check-out!'
                    : `Sisa waktu shift: ${remainingText || 'Menuju target checkout'}`)
                  : 'Target checkout aktif otomatis setelah presensi masuk'}
              </p>
            </div>

            {checkedIn && !checkedOut && (
              <button
                onClick={() => setScannerMode('out')}
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  canCheckOut
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:scale-105 active:scale-95 shadow-emerald-500/25'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                }`}
              >
                <span>{canCheckOut ? 'Presensi Pulang' : 'Pulang Lebih Awal'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 KPI Stats Banner ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="glass-card p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-muted mb-1 truncate">Kehadiran Bulan Ini</p>
            <p className="text-lg sm:text-2xl font-extrabold text-foreground font-mono truncate">
              {totalAttendedCount} <span className="text-xs font-normal text-muted">Hari</span>
            </p>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-500 truncate max-w-full">
              Tercatat Hadir
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-muted mb-1 truncate">Tidak Absen</p>
            <p className="text-lg sm:text-2xl font-extrabold text-rose-500 font-mono truncate">
              {absentCount} <span className="text-xs font-normal text-muted">Hari</span>
            </p>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-500/10 text-rose-500 truncate max-w-full">
              Hari Kerja Alpa
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-muted mb-1 truncate">Tepat Waktu</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-500 font-mono truncate">
              {onTimePercentage}%
            </p>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-500 truncate max-w-full">
              {onTimeCount}x Tepat Waktu
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-muted mb-1 truncate">Terlambat</p>
            <p className="text-lg sm:text-2xl font-extrabold text-amber-500 font-mono truncate">
              {lateCount} <span className="text-xs font-normal text-muted">Kali</span>
            </p>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-surface-hover text-muted truncate max-w-full">
              Toleransi 08:30
            </span>
          </div>
        </div>
      </div>

      {/* ── Attendance Log Table / Cards ────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Riwayat Presensi
            </h3>
            <p className="text-muted text-xs mt-0.5">Catatan log kehadiran biometrik hari kerja (Senin–Jumat)</p>
          </div>
          <button
            onClick={fetchData}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-surface-hover hover:bg-border/60 text-xs font-semibold text-muted hover:text-foreground border border-border/80 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Segarkan</span>
          </button>
        </div>

        {history.length > 0 ? (
          <>
            {/* ── Mobile View: Dedicated Responsive Cards (< md) ── */}
            <div className="md:hidden space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface/70 border border-border/70 space-y-3 shadow-xs"
                >
                  {/* Top Bar: Date + Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                    <span className="text-xs font-bold text-foreground">
                      {fmtDate(item.date, activeTimezone)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'on_time'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : item.status === 'late'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : item.status === 'absent'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                          : 'bg-surface-hover text-muted'
                      }`}
                    >
                      {item.status === 'on_time' ? 'Tepat Waktu' : item.status === 'late' ? 'Terlambat' : item.status === 'absent' ? 'Tidak Absen' : '—'}
                    </span>
                  </div>

                  {/* Body: Snapshot + Times Grid */}
                  <div className="flex items-center gap-3">
                    {/* Face thumbnail */}
                    {item.status === 'absent' ? (
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0">
                        <span className="text-xs font-bold">❌</span>
                        <span className="text-[9px] font-bold mt-0.5">Alpa</span>
                      </div>
                    ) : item.check_in_image ? (
                      <button
                        onClick={() => setPreviewImage(item.check_in_image)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-border shadow-xs hover:scale-105 transition-transform shrink-0 relative group cursor-pointer"
                        title="Klik untuk perbesar"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.check_in_image} alt="Face Snapshot" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border/60 flex items-center justify-center text-muted text-xs shrink-0 font-medium">
                        AI
                      </div>
                    )}

                    {/* Check In / Out Details */}
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center bg-surface-hover/50 p-2 rounded-xl border border-border/40">
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Masuk</span>
                        <span className="text-xs font-mono font-bold text-foreground">
                          {item.status === 'absent' ? '—' : fmtTime(item.check_in, activeTimezone)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Pulang</span>
                        <span className="text-xs font-mono font-bold text-foreground">
                          {item.status === 'absent' ? '—' : fmtTime(item.check_out, activeTimezone)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-semibold">Durasi</span>
                        <span className="text-xs font-mono font-bold text-primary">
                          {item.status === 'absent' ? '—' : calcDuration(item.check_in, item.check_out)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location footer */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted pt-1">
                    {item.status === 'absent' ? (
                      <span className="text-rose-400 text-[11px]">Tidak ada catatan presensi pada hari kerja ini</span>
                    ) : item.check_in_location ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="truncate">{item.check_in_location}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop View: Structured 7-Column Table (>= md) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Wajah AI</th>
                    <th className="py-3 px-3">Masuk</th>
                    <th className="py-3 px-3">Pulang</th>
                    <th className="py-3 px-3">Durasi</th>
                    <th className="py-3 px-3">Lokasi GPS</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-foreground whitespace-nowrap">
                        {fmtDate(item.date, activeTimezone)}
                      </td>

                      {/* Snapshot Thumbnail */}
                      <td className="py-3.5 px-3">
                        {item.status === 'absent' ? (
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xs font-bold" title="Tidak Hadir">
                            ❌
                          </div>
                        ) : item.check_in_image ? (
                          <button
                            onClick={() => setPreviewImage(item.check_in_image)}
                            className="w-8 h-8 rounded-lg overflow-hidden border border-border hover:scale-110 transition-transform cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.check_in_image} alt="Face Snapshot" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-muted text-[10px]">
                            —
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-foreground whitespace-nowrap">
                        {item.status === 'absent' ? '—' : fmtTime(item.check_in, activeTimezone)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-foreground whitespace-nowrap">
                        {item.status === 'absent' ? '—' : fmtTime(item.check_out, activeTimezone)}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-muted whitespace-nowrap">
                        {item.status === 'absent' ? '—' : calcDuration(item.check_in, item.check_out)}
                      </td>

                      <td className="py-3.5 px-3 text-muted max-w-[200px] truncate" title={item.check_in_location || ''}>
                        {item.status === 'absent' ? '—' : item.check_in_location || '—'}
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'on_time'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : item.status === 'late'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : item.status === 'absent'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-surface-hover text-muted'
                        }`}>
                          {item.status === 'on_time'
                            ? 'Tepat Waktu'
                            : item.status === 'late'
                            ? 'Terlambat'
                            : item.status === 'absent'
                            ? 'Tidak Absen'
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted text-xs flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Belum ada rekaman presensi. Lakukan check-in pertama Anda hari ini!</span>
          </div>
        )}
      </div>

      {/* ── Face Scanner Modal ──────────────────────────────────── */}
      {scannerMode && (
        <FaceScanner
          onFaceDetected={handleFaceDetected}
          onCancel={() => setScannerMode(null)}
        />
      )}

      {/* ── Photo Lightbox Modal ────────────────────────────────── */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setPreviewImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-sm w-full bg-card rounded-3xl p-5 border border-border shadow-2xl z-10"
            >
              <h4 className="text-sm font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Tangkapan Biometrik Wajah
              </h4>
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImage} alt="Preview Wajah" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-full h-10 rounded-xl bg-surface-hover text-xs font-bold text-foreground hover:bg-border transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}