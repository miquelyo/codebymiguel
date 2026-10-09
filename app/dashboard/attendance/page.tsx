'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import FaceScanner from '@/app/components/FaceScanner';

// ─── Types ──────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_image: string | null;
  check_out_image: string | null;
  checkout_target: string | null;
  status: 'on_time' | 'late' | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_location: string | null;
  check_in_timezone: string | null;
  check_in_timezone_label: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────

function todayDateString(timeZone?: string) {
  const d = new Date();

  if (!timeZone) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
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
  })
    .format(new Date(iso))
    .replace(/\./g, ':');
}

function fmtTimeSeconds(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  })
    .format(date)
    .replace(/\./g, ':');
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

async function getLocationName(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      'Lokasi tidak diketahui';
    const province = data.principalSubdivision;

    if (province && city !== province) {
      return `${city}, ${province}`;
    }

    return city;
  } catch {
    return 'Lokasi tidak diketahui';
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
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      15 - offsetHours,
      0,
      0
    )
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

function calcDuration(
  cin: string | null,
  cout: string | null
): string {
  if (!cin || !cout) return '—';

  const diff =
    new Date(cout).getTime() - new Date(cin).getTime();

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return `${h}j ${m}m`;
}

interface LocationInfo {
  latitude: number;
  longitude: number;
  location: string;
  timezone: string;
  timezoneLabel: string;
}

// ─── Main Component ─────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();

  const [now, setNow] = useState<Date | null>(null);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerMode, setScannerMode] = useState<'in' | 'out' | null>(null);

  const [locationInfo, setLocationInfo] =
    useState<LocationInfo | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] =
    useState<string | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error' | 'warn';
  } | null>(null);

  const notifiedRef = useRef(false);

  // ─── Real-time clock ──────────────────────────────────────────

  useEffect(() => {
    setNow(new Date());

    const t = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(t);
  }, []);

  // ─── Fetch Attendance ─────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoadingToday(true);

    const [{ data: todayData }, { data: histData }] =
      await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('user_email', user.email)
          .eq(
            'date',
            todayDateString(
              locationInfo?.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone
            )
          )
          .single(),

        supabase
          .from('attendance')
          .select('*')
          .eq('user_email', user.email)
          .order('date', { ascending: false })
          .limit(30),
      ]);

    setToday(todayData ?? null);
    setHistory(histData ?? []);
    setIsLoadingToday(false);
  }, [user, locationInfo?.timezone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Detect current location ─────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung lokasi.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
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
      (error) => {
        console.error('Location error:', error);

        setLocationError(
          error.code === 1
            ? 'Izin lokasi ditolak.'
            : 'Lokasi tidak dapat ditemukan.'
        );

        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, []);

  // ─── 08:00 Notification ───────────────────────────────────────

  useEffect(() => {
    if (!now || !user || notifiedRef.current) return;

    const activeTimezone =
      locationInfo?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { hour: h, minute: m } = getTimeParts(
      now,
      activeTimezone
    );

    if (h === 8 && m === 0 && !today?.check_in) {
      notifiedRef.current = true;

      showToast(
        'Sudah jam 08:00 — jangan lupa absen!',
        'warn'
      );
    }
  }, [now, today, user, locationInfo?.timezone]);

  // ─── Browser Notification ─────────────────────────────────────

  useEffect(() => {
    if (
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }
  }, []);

  // ─── Toast ────────────────────────────────────────────────────

  function showToast(
    msg: string,
    type: 'success' | 'error' | 'warn'
  ) {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // ─── Check-in ─────────────────────────────────────────────────

  const handleCheckIn = async (imageBase64?: string) => {
    if (!user || !now) return;

    if (!locationInfo) {
      showToast(
        locationError ||
          'Lokasi belum tersedia. Izinkan akses lokasi terlebih dahulu.',
        'warn'
      );
      return;
    }

    const { hour, minute } = getTimeParts(
      now,
      locationInfo.timezone
    );

    const totalMin = hour * 60 + minute;

    if (totalMin < 5 * 60) {
      showToast(
        'Check-in belum dibuka. Mulai jam 05:00.',
        'warn'
      );
      return;
    }

    if (totalMin > 10 * 60) {
      showToast(
        'Check-in sudah ditutup. Maksimal 10:00.',
        'error'
      );
      return;
    }

    const status: 'on_time' | 'late' = totalMin > 8 * 60 + 30 ? 'late' : 'on_time';

    setIsSubmitting(true);

    const { error } = await supabase
      .from('attendance')
      .insert({
        user_email: user.email,
        date: todayDateString(locationInfo.timezone),
        check_in: now.toISOString(),
        checkout_target: calcCheckoutTarget(
          now,
          locationInfo.timezone
        ).toISOString(),
        status,
        check_in_latitude: locationInfo.latitude,
        check_in_longitude: locationInfo.longitude,
        check_in_location: locationInfo.location,
        check_in_timezone: locationInfo.timezone,
        check_in_timezone_label: locationInfo.timezoneLabel,
        check_in_image: imageBase64 || null,
      });

    setIsSubmitting(false);

    if (error) {
      showToast('Gagal: ' + error.message, 'error');
      return;
    }

    showToast(
      `Check-in berhasil — ${locationInfo.location}`,
      'success'
    );

    fetchData();
  };

  // ─── Check-out ────────────────────────────────────────────────

  const handleCheckOut = async (imageBase64?: string) => {
    if (!user || !now || !today?.id) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('attendance')
      .update({
        check_out: now.toISOString(),
        check_out_image: imageBase64 || null,
      })
      .eq('id', today.id);

    setIsSubmitting(false);

    if (error) {
      showToast('Gagal: ' + error.message, 'error');
      return;
    }

    showToast(
      'Check-out berhasil! Selamat istirahat.',
      'success'
    );

    fetchData();
  };

  if (!now) return null;

  // ─── Derived State ────────────────────────────────────────────

  const activeTimezone =
    locationInfo?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const localDateParts = getDateParts(now, activeTimezone);

  const localDate = new Date(
    `${localDateParts.year}-${String(localDateParts.month).padStart(
      2,
      '0'
    )}-${String(localDateParts.day).padStart(
      2,
      '0'
    )}T12:00:00`
  );

  const dayOfWeek = localDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const localTimeParts = getTimeParts(
    now,
    activeTimezone
  );

  const totalMin =
    localTimeParts.hour * 60 + localTimeParts.minute;

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  const checkoutTargetDate = today?.checkout_target
    ? new Date(today.checkout_target)
    : null;

  const canCheckOut =
    checkedIn &&
    !checkedOut &&
    !!checkoutTargetDate &&
    now >= checkoutTargetDate;

  const isClosed = !checkedIn && totalMin > 10 * 60;

  const dayLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    timeZone: activeTimezone,
  });

  const dateLabel = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: activeTimezone,
  });

  // ─── Work Progress ────────────────────────────────────────────

  let workProgress = 0;

  if (
    checkedIn &&
    today?.check_in &&
    today?.checkout_target &&
    !checkedOut
  ) {
    const start = new Date(today.check_in).getTime();
    const target = new Date(
      today.checkout_target
    ).getTime();
    const current = now.getTime();

    const total = target - start;
    const elapsed = current - start;

    workProgress = Math.min(
      100,
      Math.max(0, (elapsed / total) * 100)
    );
  }

  // ─── Remaining Checkout ───────────────────────────────────────

  let remainingText = '';

  if (
    checkedIn &&
    !checkedOut &&
    checkoutTargetDate &&
    now < checkoutTargetDate
  ) {
    const diff =
      checkoutTargetDate.getTime() - now.getTime();

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(
      (diff % 3600000) / 60000
    );

    if (hours > 0) {
      remainingText = `${hours}j ${minutes}m lagi`;
    } else {
      remainingText = `${minutes}m lagi`;
    }
  }

  return (
    <div className="relative max-w-6xl space-y-6 pb-10">
      {/* Background Decoration */}

      <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-info/5 blur-3xl" />

      <div className="pointer-events-none absolute top-[450px] -left-40 h-72 w-72 rounded-full bg-success/5 blur-3xl" />

      {/* Toast */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed top-5 right-5 z-50 max-w-[calc(100vw-40px)]"
          >
            <div
              className={`
                flex items-center gap-3
                rounded-2xl border
                bg-card/95 backdrop-blur-xl
                px-4 py-3.5
                shadow-2xl
                text-[13px] font-semibold
                ${
                  toast.type === 'success'
                    ? 'border-success/20'
                    : toast.type === 'error'
                      ? 'border-danger/20'
                      : 'border-warning/20'
                }
              `}
            >
              <div
                className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                  ${
                    toast.type === 'success'
                      ? 'bg-success/10 text-success'
                      : toast.type === 'error'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-warning/10 text-warning'
                  }
                `}
              >
                {toast.type === 'success' ? (
                  <CheckIcon className="h-4 w-4" />
                ) : toast.type === 'error' ? (
                  <AlertIcon className="h-4 w-4" />
                ) : (
                  <WarningIcon className="h-4 w-4" />
                )}
              </div>

              <span className="text-foreground">
                {toast.msg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="
          relative overflow-hidden
          rounded-[28px]
          border border-border
          bg-card
          p-6 md:p-8
          shadow-sm
        "
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-info/5 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-success/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background">
                <FingerprintIcon className="h-4 w-4" />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                Attendance
              </span>
            </div>

            <h1
              className="text-3xl font-bold tracking-[-0.045em] text-foreground md:text-4xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Absensi
            </h1>

            <p className="mt-2 text-sm text-muted">
              {dayLabel}, {dateLabel}
            </p>

            <div className="mt-5">
              {isWeekend ? (
                <StatusPill variant="gray">
                  Hari Libur
                </StatusPill>
              ) : checkedOut ? (
                <StatusPill variant="success">
                  Selesai Hari Ini
                </StatusPill>
              ) : checkedIn ? (
                <StatusPill variant="info">
                  Sedang Bekerja
                </StatusPill>
              ) : isClosed ? (
                <StatusPill variant="danger">
                  Check-in Ditutup
                </StatusPill>
              ) : (
                <StatusPill variant="gray">
                  Belum Check-in
                </StatusPill>
              )}
            </div>
          </div>

          {/* Live Clock */}

          <div className="lg:text-right">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Waktu Sekarang
            </p>

            <motion.p
              key={fmtTimeSeconds(now, activeTimezone)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="font-bold text-5xl leading-none tracking-[-0.06em] text-foreground md:text-6xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {fmtTimeSeconds(now, activeTimezone)}
            </motion.p>

            <p className="mt-2 text-xs text-muted">
              Waktu lokal ·{' '}
              {locationInfo?.timezoneLabel || 'LOCAL'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Weekend */}

      {isWeekend && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            relative overflow-hidden
            rounded-[26px]
            border border-border
            bg-card
            p-8 md:p-12
            text-center
            shadow-sm
          "
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover">
            <CalendarIcon className="h-8 w-8 text-foreground" />
          </div>

          <h2
            className="text-2xl font-bold tracking-[-0.04em] text-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Hari Libur
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Tidak ada absensi untuk hari ini. Selamat beristirahat
            dan sampai hari kerja berikutnya.
          </p>
        </motion.div>
      )}

      {/* Today's Attendance */}

      {!isWeekend && !isLoadingToday && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Check In */}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`
                group relative overflow-hidden
                rounded-[24px]
                border
                bg-card
                p-6
                shadow-sm
                transition-all duration-300
                ${
                  checkedIn
                    ? 'border-info/30'
                    : 'border-border hover:-translate-y-0.5 hover:shadow-lg'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Check In
                  </p>

                  <h2
                    className="mt-1 text-lg font-bold tracking-[-0.03em] text-foreground"
                    style={{
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Mulai bekerja
                  </h2>
                </div>

                <div
                  className={`
                    flex h-11 w-11 items-center justify-center rounded-2xl
                    ${
                      checkedIn
                        ? 'bg-info text-white'
                        : 'bg-surface-hover text-foreground'
                    }
                  `}
                >
                  <FingerprintIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-8">
                <p
                  className="text-5xl font-bold tracking-[-0.06em] text-foreground"
                  style={{
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {checkedIn
                    ? fmtTime(
                        today?.check_in ?? null,
                        activeTimezone
                      )
                    : '—:——'}
                </p>

                <p className="mt-2 text-xs text-muted">
                  {checkedIn
                    ? today?.status === 'late'
                      ? 'Check-in terlambat'
                      : 'Check-in tepat waktu'
                    : 'Belum check-in hari ini'}
                </p>
              </div>

              <div className="mt-7">
                {!checkedIn && !isClosed && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -1 }}
                    onClick={() => setScannerMode('in')}
                    disabled={isSubmitting}
                    className="
                      flex w-full items-center justify-center gap-2
                      rounded-2xl
                      bg-info
                      py-3.5
                      text-sm font-semibold text-white
                      shadow-lg shadow-info/10
                      transition-all
                      hover:shadow-info/20
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    style={{
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <FingerprintIcon className="h-4 w-4" />
                        Check In Sekarang
                      </>
                    )}
                  </motion.button>
                )}

                {checkedIn && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-info/20 bg-info/10 py-3.5 text-sm font-semibold text-info">
                    <CheckIcon className="h-4 w-4" />
                    Sudah Check-in
                  </div>
                )}

                {!checkedIn && isClosed && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 py-3.5 text-sm font-semibold text-danger">
                    <AlertIcon className="h-4 w-4" />
                    Check-in Ditutup
                  </div>
                )}
              </div>
            </motion.div>

            {/* Check Out */}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className={`
                group relative overflow-hidden
                rounded-[24px]
                border
                bg-card
                p-6
                shadow-sm
                transition-all duration-300
                ${
                  checkedOut
                    ? 'border-success/30'
                    : checkedIn
                      ? 'border-border hover:-translate-y-0.5 hover:shadow-lg'
                      : 'border-border opacity-70'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Check Out
                  </p>

                  <h2
                    className="mt-1 text-lg font-bold tracking-[-0.03em] text-foreground"
                    style={{
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Selesaikan pekerjaan
                  </h2>
                </div>

                <div
                  className={`
                    flex h-11 w-11 items-center justify-center rounded-2xl
                    ${
                      checkedOut
                        ? 'bg-success text-white'
                        : 'bg-surface-hover text-foreground'
                    }
                  `}
                >
                  <LogoutIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-8">
                <p
                  className="text-5xl font-bold tracking-[-0.06em]"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: checkedOut
                      ? 'var(--foreground)'
                      : 'var(--muted)',
                  }}
                >
                  {checkedOut
                    ? fmtTime(
                        today?.check_out ?? null,
                        activeTimezone
                      )
                    : '—:——'}
                </p>

                <p className="mt-2 text-xs text-muted">
                  {checkedOut
                    ? `Total ${calcDuration(
                        today?.check_in ?? null,
                        today?.check_out ?? null
                      )}`
                    : checkedIn
                      ? remainingText
                        ? `Checkout ${remainingText}`
                        : 'Checkout sudah tersedia'
                      : 'Menunggu Check-in'}
                </p>
              </div>

              {/* Work Progress */}

              {checkedIn && !checkedOut && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted">
                      Progress kerja
                    </span>

                    <span className="font-semibold text-foreground">
                      {Math.round(workProgress)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${workProgress}%`,
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-info"
                    />
                  </div>
                </div>
              )}

              <div className="mt-7">
                {checkedIn && !checkedOut && (
                  canCheckOut ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -1 }}
                      onClick={() => setScannerMode('out')}
                      disabled={isSubmitting}
                      className="
                        flex w-full items-center justify-center gap-2
                        rounded-2xl
                        bg-danger
                        py-3.5
                        text-sm font-semibold text-white
                        shadow-lg shadow-danger/10
                        transition-all
                        hover:shadow-danger/20
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                      style={{
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <LogoutIcon className="h-4 w-4" />
                          Check Out Sekarang
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface-hover px-4 py-3.5 text-center text-sm font-medium text-muted">
                      Check-out tersedia pukul{' '}
                      <span className="font-semibold text-foreground">
                        {fmtTime(
                          today?.checkout_target ?? null,
                          activeTimezone
                        )}
                      </span>
                    </div>
                  )
                )}

                {checkedOut && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-success/20 bg-success/10 py-3.5 text-sm font-semibold text-success">
                    <CheckIcon className="h-4 w-4" />
                    Sudah Check-out
                  </div>
                )}

                {!checkedIn && (
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-center text-sm font-medium text-muted">
                    Menunggu Check-in
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Today's Summary */}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="
              grid grid-cols-2
              gap-px
              overflow-hidden
              rounded-[22px]
              border border-border
              bg-border
            "
          >
            <SummaryItem
              label="Check In"
              value={
                checkedIn
                  ? fmtTime(
                      today?.check_in ?? null,
                      activeTimezone
                    )
                  : '—'
              }
            />

            <SummaryItem
              label="Target Check Out"
              value={
                today?.checkout_target
                  ? fmtTime(
                      today.checkout_target,
                      activeTimezone
                    )
                  : '—'
              }
            />
          </motion.div>
        </>
      )}

      {/* Loading */}

      {isLoadingToday && !isWeekend && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AttendanceSkeleton />
          <AttendanceSkeleton />
        </div>
      )}

      {/* History */}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="
          overflow-hidden
          rounded-[26px]
          border border-border
          bg-card
          shadow-sm
        "
      >
        {/* Header */}

        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-hover">
                <HistoryIcon className="h-4 w-4 text-foreground" />
              </div>

              <div>
                <h2
                  className="text-[17px] font-bold tracking-[-0.03em] text-foreground"
                  style={{
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  Riwayat Absensi
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                  30 hari terakhir
                </p>
              </div>
            </div>
          </div>

          <div className="self-start rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted">
            {history.length} catatan
          </div>
        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-surface">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Tanggal
                </th>

                <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Check In
                </th>

                <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Check Out
                </th>

                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Keterangan
                </th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-16 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover">
                      <CalendarIcon className="h-5 w-5 text-muted" />
                    </div>

                    <p className="mt-3 text-sm font-medium text-foreground">
                      Belum ada riwayat absensi
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Data absensi kamu akan muncul di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: Math.min(i * 0.025, 0.4),
                    }}
                    className="border-t border-border transition-colors hover:bg-surface"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(
                            row.date + 'T00:00:00'
                          ).toLocaleDateString('id-ID', {
                            weekday: 'long',
                          })}
                        </p>

                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(
                            row.date + 'T00:00:00'
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        
                        {row.check_in_latitude && row.check_in_longitude && (
                           <p className="mt-2 text-[10px] text-muted">
                             📍 {row.check_in_latitude.toFixed(5)}, {row.check_in_longitude.toFixed(5)}
                           </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="font-bold tabular text-foreground">
                          {fmtTime(
                            row.check_in,
                            row.check_in_timezone || activeTimezone
                          )}
                        </span>
                        {row.check_in_image && (
                          <img src={row.check_in_image} alt="Check In Face" className="w-10 h-10 rounded-full object-cover border border-border" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="font-bold tabular text-foreground">
                          {fmtTime(
                            row.check_out,
                            row.check_in_timezone || activeTimezone
                          )}
                        </span>
                        {row.check_out_image && (
                          <img src={row.check_out_image} alt="Check Out Face" className="w-10 h-10 rounded-full object-cover border border-border" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <AttendanceStatus
                        status={row.status}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile History */}

        <div className="divide-y divide-border md:hidden">
          {history.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover">
                <CalendarIcon className="h-5 w-5 text-muted" />
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                Belum ada riwayat absensi
              </p>

              <p className="mt-1 text-xs text-muted">
                Data absensi kamu akan muncul di sini.
              </p>
            </div>
          ) : (
            history.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: Math.min(i * 0.025, 0.35),
                }}
                className="px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(
                        row.date + 'T00:00:00'
                      ).toLocaleDateString('id-ID', {
                        weekday: 'long',
                      })}
                    </p>

                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(
                        row.date + 'T00:00:00'
                      ).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    
                    {row.check_in_latitude && row.check_in_longitude && (
                       <p className="mt-1 text-[10px] text-muted">
                         📍 {row.check_in_latitude.toFixed(5)}, {row.check_in_longitude.toFixed(5)}
                       </p>
                    )}
                  </div>

                  <AttendanceStatus
                    status={row.status}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface px-3.5 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted mb-2">
                      Check In
                    </p>
                    <div className="flex items-center gap-3">
                      {row.check_in_image && (
                        <img src={row.check_in_image} alt="In" className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <p className="font-bold tabular text-foreground">
                        {fmtTime(
                          row.check_in,
                          row.check_in_timezone || activeTimezone
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface px-3.5 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted mb-2">
                      Check Out
                    </p>
                    <div className="flex items-center gap-3">
                      {row.check_out_image && (
                        <img src={row.check_out_image} alt="Out" className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <p className="font-bold tabular text-foreground">
                        {fmtTime(
                          row.check_out,
                          row.check_in_timezone || activeTimezone
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      {scannerMode && (
        <FaceScanner
          onCancel={() => setScannerMode(null)}
          onFaceDetected={async (descriptor, imageBase64) => {
            const currentMode = scannerMode;
            setScannerMode(null);
            
            if (currentMode === 'in') {
              await handleCheckIn(imageBase64);
            } else if (currentMode === 'out') {
              await handleCheckOut(imageBase64);
            }
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-5 py-4 md:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>

      <p
        className="mt-1.5 text-lg font-bold tracking-[-0.03em] text-foreground"
        style={{
          fontFamily: 'var(--font-heading)',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function AttendanceStatus({
  status,
}: {
  status: AttendanceRecord['status'];
}) {
  if (status === 'late') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-[11px] font-bold text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Terlambat
      </span>
    );
  }

  if (status === 'on_time') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-[11px] font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Tepat waktu
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-hover px-3 py-1.5 text-[11px] font-bold text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
      Tidak ada keterangan
    </span>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="animate-pulse rounded-[24px] border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-3 w-16 rounded bg-surface-hover" />
          <div className="mt-2 h-5 w-32 rounded bg-surface-hover" />
        </div>

        <div className="h-11 w-11 rounded-2xl bg-surface-hover" />
      </div>

      <div className="mt-8 h-12 w-32 rounded bg-surface-hover" />
      <div className="mt-2 h-3 w-40 rounded bg-surface-hover" />
      <div className="mt-7 h-12 w-full rounded-2xl bg-surface-hover" />
    </div>
  );
}

function StatusPill({
  variant,
  children,
}: {
  variant:
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'gray';
  children: React.ReactNode;
}) {
  const styles = {
    info: 'bg-info/10 text-info border-info/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    gray: 'bg-surface-hover text-muted border-border',
  }[variant];

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full border
        px-3.5 py-1.5
        text-[11px] font-bold
        ${styles}
      `}
    >
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// Icons
// ────────────────────────────────────────────────────────────────

function CalendarIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function FingerprintIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a1.481 1.481 0 00-4.968 4.478c.035.067.07.134.106.2M9 15.75v3m3-3v3m3-3v3M14.25 12.25h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function LogoutIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  );
}

function HistoryIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l2.5 2.5M4.93 4.93A10 10 0 1112 22a9.96 9.96 0 01-7.07-2.93M4.93 4.93H9m-4.07 0V9"
      />
    </svg>
  );
}

function CheckIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function AlertIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0 3h.008M10.29 3.86L2.82 17.25A1.5 1.5 0 004.12 19.5h15.76a1.5 1.5 0 001.3-2.25L13.71 3.86a1.96 1.96 0 00-3.42 0z"
      />
    </svg>
  );
}

function WarningIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3m0 3h.01M5.07 19h13.86c1.15 0 1.87-1.24 1.3-2.24L13.3 4.24a1.48 1.48 0 00-2.6 0L3.77 16.76C3.2 17.76 3.92 19 5.07 19z"
      />
    </svg>
  );
}

function Spinner({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={`${className} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}