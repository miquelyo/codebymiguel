'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';

// ─── Types ─────────────────────────────────────────────────────
interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  checkout_target: string | null;
  status: 'on_time' | 'late' | null;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Return checkout target based on check-in time.
 *  Rule: checkin + 8h, minimum 15:00 (i.e. if checkin <= 07:00 → 15:00) */
function calcCheckoutTarget(checkInDate: Date): Date {
  const plus8 = new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000);
  // Floor at 15:00 same day
  const floor = new Date(checkInDate);
  floor.setHours(15, 0, 0, 0);
  return plus8 > floor ? plus8 : floor;
}

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Main Component ─────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warn' } | null>(null);
  const notifiedRef = useRef(false);

  // Real-time clock
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch today's attendance + history
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingToday(true);

    const { data: todayData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_email', user.email)
      .eq('date', todayDateString())
      .single();

    const { data: histData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_email', user.email)
      .order('date', { ascending: false })
      .limit(30);

    setToday(todayData ?? null);
    setHistory(histData ?? []);
    setIsLoadingToday(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 8:00 AM notification if not checked in yet
  useEffect(() => {
    if (!now || !user || notifiedRef.current) return;
    const h = now.getHours(), m = now.getMinutes();
    if (h === 8 && m === 0 && !today?.check_in) {
      notifiedRef.current = true;
      showToast('⚠️ Sudah jam 08:00 — jangan lupa absen!', 'warn');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pengingat Absensi', { body: 'Sudah jam 08:00! Segera lakukan absensi.', icon: '/favicon.ico' });
      }
    }
  }, [now, today, user]);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function showToast(msg: string, type: 'success' | 'error' | 'warn') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ─── Check-in ────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!user || !now) return;
    const h = now.getHours(), m = now.getMinutes();
    const totalMin = h * 60 + m;
    const min5am = 5 * 60;
    const min1030am = 10 * 60 + 30;

    if (totalMin < min5am) { showToast('Check-in belum dibuka. Mulai jam 05:00.', 'warn'); return; }
    if (totalMin > min1030am) { showToast('Check-in sudah ditutup. Maksimal jam 10:30.', 'error'); return; }

    const status: 'on_time' | 'late' = totalMin > 8 * 60 + 30 ? 'late' : 'on_time';
    const checkoutTarget = calcCheckoutTarget(now);

    setIsSubmitting(true);
    const { error } = await supabase.from('attendance').insert({
      user_email: user.email,
      date: todayDateString(),
      check_in: now.toISOString(),
      checkout_target: checkoutTarget.toISOString(),
      status,
    });
    setIsSubmitting(false);

    if (error) { showToast('Gagal menyimpan absensi: ' + error.message, 'error'); return; }
    showToast(status === 'late' ? '⚠️ Check-in berhasil — kamu terlambat.' : '✅ Check-in berhasil!', status === 'late' ? 'warn' : 'success');
    fetchData();
  };

  // ─── Check-out ───────────────────────────────────────────────
  const handleCheckOut = async () => {
    if (!user || !now || !today?.id) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now.toISOString() })
      .eq('id', today.id);
    setIsSubmitting(false);

    if (error) { showToast('Gagal menyimpan check-out: ' + error.message, 'error'); return; }
    showToast('👋 Check-out berhasil! Selamat istirahat.', 'success');
    fetchData();
  };

  if (!now) return null;

  // ─── Derived state ───────────────────────────────────────────
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const h = now.getHours(), m = now.getMinutes();
  const totalMin = h * 60 + m;

  const checkedIn   = !!today?.check_in;
  const checkedOut  = !!today?.check_out;
  const checkoutTargetDate = today?.checkout_target ? new Date(today.checkout_target) : null;
  const canCheckOut = checkedIn && !checkedOut && checkoutTargetDate && now >= checkoutTargetDate;

  const canCheckIn = !checkedIn && !isWeekend && totalMin >= 5 * 60 && totalMin <= 10 * 60 + 30;
  const isLateZone = totalMin > 8 * 60 + 30;
  const isClosed   = !checkedIn && totalMin > 10 * 60 + 30;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Absensi Harian</h1>
        <p className="text-[14px] text-muted mt-1">
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium animate-fade-up
          ${toast.type === 'success' ? 'bg-white border-success/20 text-success' : ''}
          ${toast.type === 'error'   ? 'bg-white border-danger/20 text-danger'   : ''}
          ${toast.type === 'warn'    ? 'bg-white border-warning/20 text-warning'  : ''}
        `}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Clock card ──────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-[13px] font-medium text-muted uppercase tracking-wider mb-3">Jam Sekarang</h2>
            <p className="text-5xl font-bold text-foreground font-mono tracking-tight">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>

            {/* Status bar */}
            <div className="mt-4 flex flex-wrap gap-2">
              {isWeekend ? (
                <Badge color="gray">🌴 Hari Libur</Badge>
              ) : isClosed ? (
                <Badge color="red">🔒 Check-in Ditutup (max 10:30)</Badge>
              ) : isLateZone ? (
                <Badge color="orange">⚠️ Zona Terlambat (08:31 - 10:30)</Badge>
              ) : totalMin >= 5 * 60 ? (
                <Badge color="green">✅ Jam Absensi Aktif (05:00–08:30)</Badge>
              ) : (
                <Badge color="gray">⏳ Belum Buka (Mulai 05:00)</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Today's status card ──────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-[13px] font-medium text-muted uppercase tracking-wider mb-4">Status Hari Ini</h2>

          {isLoadingToday ? (
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <Spinner className="w-4 h-4" /> Memuat data...
            </div>
          ) : isWeekend ? (
            <div className="flex flex-col items-center justify-center py-4 text-warning">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-70" />
              <p className="text-[14px] font-medium">Hari Libur</p>
              <p className="text-[12px] opacity-70 mt-1 text-center">Selamat beristirahat!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Check-in row */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-[13px] text-muted">Check-in</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-foreground font-mono">{fmtTime(today?.check_in ?? null)}</span>
                  {today?.status === 'on_time' && <Badge color="green">Tepat Waktu</Badge>}
                  {today?.status === 'late'    && <Badge color="orange">Terlambat</Badge>}
                </div>
              </div>
              {/* Checkout target */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-[13px] text-muted">Target Check-out</span>
                <span className="text-[14px] font-semibold text-foreground font-mono">{fmtTime(today?.checkout_target ?? null)}</span>
              </div>
              {/* Check-out row */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-muted">Check-out</span>
                <span className="text-[14px] font-semibold text-foreground font-mono">{fmtTime(today?.check_out ?? null)}</span>
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                {/* Check-in button */}
                {!checkedIn && !isClosed && (
                  <button
                    onClick={handleCheckIn}
                    disabled={isSubmitting || isWeekend || !canCheckIn && totalMin < 5 * 60}
                    className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed
                               text-white text-[14px] font-medium rounded-xl
                               transition-colors duration-150 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><Spinner className="w-4 h-4" />Memproses...</> : <><FingerPrintIcon className="w-4 h-4" />Check-in Sekarang</>}
                  </button>
                )}
                {!checkedIn && isClosed && (
                  <div className="w-full py-3 bg-danger/5 border border-danger/20 text-danger text-[13px] font-medium rounded-xl text-center">
                    🔒 Check-in sudah ditutup untuk hari ini
                  </div>
                )}

                {/* Checkout button */}
                {checkedIn && !checkedOut && (
                  <div>
                    {canCheckOut ? (
                      <button
                        onClick={handleCheckOut}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-success hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                                   text-white text-[14px] font-medium rounded-xl
                                   transition-opacity duration-150 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <><Spinner className="w-4 h-4" />Memproses...</> : <><LogoutIcon className="w-4 h-4" />Check-out Sekarang</>}
                      </button>
                    ) : (
                      <div className="w-full py-3 bg-surface-hover border border-border text-muted text-[13px] font-medium rounded-xl text-center">
                        ⏳ Check-out tersedia pukul {fmtTime(today?.checkout_target ?? null)}
                      </div>
                    )}
                  </div>
                )}

                {/* Done */}
                {checkedIn && checkedOut && (
                  <div className="w-full py-3 bg-success/10 border border-success/20 text-success text-[13px] font-medium rounded-xl text-center">
                    ✅ Absensi hari ini selesai!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Rules Info ─────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
        <h2 className="text-[13px] font-semibold text-foreground mb-3">📋 Aturan Absensi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          {[
            { label: 'Check-in Dibuka', value: '05:00 – 10:30' },
            { label: 'Tepat Waktu', value: '05:00 – 08:30' },
            { label: 'Terlambat', value: '08:31 – 10:30' },
            { label: 'Durasi Kerja', value: '8 jam (min. s/d 15:00)' },
          ].map(r => (
            <div key={r.label} className="bg-surface-hover rounded-xl p-3">
              <p className="text-muted mb-0.5">{r.label}</p>
              <p className="font-semibold text-foreground">{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── History Table ─────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">Riwayat Absensi</h2>
          <p className="text-[12px] text-muted mt-0.5">30 hari terakhir</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-surface-hover">
                <th className="text-left px-5 py-3 font-medium text-muted">Tanggal</th>
                <th className="text-center px-4 py-3 font-medium text-muted">Check-in</th>
                <th className="text-center px-4 py-3 font-medium text-muted">Check-out</th>
                <th className="text-center px-4 py-3 font-medium text-muted">Durasi</th>
                <th className="text-center px-4 py-3 font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted">Belum ada riwayat absensi.</td>
                </tr>
              ) : (
                history.map((row, i) => {
                  const duration = row.check_in && row.check_out
                    ? (() => {
                        const diff = new Date(row.check_out!).getTime() - new Date(row.check_in!).getTime();
                        const hrs  = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        return `${hrs}j ${mins}m`;
                      })()
                    : '—';

                  return (
                    <tr key={row.id} className={`border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-surface-hover/30'}`}>
                      <td className="px-5 py-3 text-foreground">{fmtDate(row.date)}</td>
                      <td className="px-4 py-3 text-center font-mono text-foreground">{fmtTime(row.check_in)}</td>
                      <td className="px-4 py-3 text-center font-mono text-foreground">{fmtTime(row.check_out)}</td>
                      <td className="px-4 py-3 text-center text-muted">{duration}</td>
                      <td className="px-4 py-3 text-center">
                        {row.status === 'on_time' && <Badge color="green">Tepat Waktu</Badge>}
                        {row.status === 'late'    && <Badge color="orange">Terlambat</Badge>}
                        {!row.status              && <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Small Badge ────────────────────────────────────────────────── */
function Badge({ color, children }: { color: 'green' | 'orange' | 'red' | 'gray'; children: React.ReactNode }) {
  const cls = {
    green:  'bg-success/10 text-success border-success/20',
    orange: 'bg-warning/10 text-warning border-warning/20',
    red:    'bg-danger/10 text-danger border-danger/20',
    gray:   'bg-surface-hover text-muted border-border',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {children}
    </span>
  );
}

/* ── Icons ──────────────────────────────────────────────────────── */
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
function FingerPrintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a1.481 1.481 0 00-4.968 4.478c.035.067.07.134.106.2M9 15.75v3m3-3v3m3-3v3M14.25 12.25h.008v.008h-.008v-.008z" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}
function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
