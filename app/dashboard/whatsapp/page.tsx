'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/components/AuthProvider';

interface GatewayStatus {
  running: boolean;
  status: 'initializing' | 'connecting' | 'scan_qr' | 'connected' | 'disconnected' | 'offline';
  user?: string | null;
  hasQr?: boolean;
  qrDataUrl?: string | null;
  targetPhone?: string;
  message?: string;
}

export default function WhatsAppGatewayPage() {
  const { user } = useAuth();
  const [data, setData] = useState<GatewayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 2FA User Configuration states
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [userPhone, setUserPhone] = useState('081214412001');
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  const userKey = user?.email || 'miguel';

  const fetch2FASettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/2fa-settings?user=${encodeURIComponent(userKey)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setIs2FAEnabled(json.enabled);
        setUserPhone(json.phone || '081214412001');
        setTempPhone(json.phone || '081214412001');
      }
    } catch (e) {
      // ignore
    }
  }, [userKey]);

  useEffect(() => {
    fetch2FASettings();
  }, [fetch2FASettings]);

  const handleToggle2FA = async () => {
    setIsToggling2FA(true);
    const nextState = !is2FAEnabled;
    try {
      const res = await fetch('/api/auth/2fa-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userKey,
          enabled: nextState,
          phone: userPhone,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setIs2FAEnabled(nextState);
        toast.success(
          nextState
            ? 'Verifikasi WhatsApp (2FA) diaktifkan! Setiap login akan meminta kode OTP.'
            : 'Verifikasi WhatsApp (2FA) dinonaktifkan! Anda bisa login langsung tanpa kode OTP.'
        );
      } else {
        toast.error(resData.message || 'Gagal mengubah pengaturan 2FA.');
      }
    } catch {
      toast.error('Gagal menghubungi server.');
    } finally {
      setIsToggling2FA(false);
    }
  };

  const handleSavePhone = async () => {
    if (!tempPhone.trim()) {
      toast.error('Nomor WhatsApp tidak boleh kosong');
      return;
    }
    try {
      const res = await fetch('/api/auth/2fa-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userKey,
          phone: tempPhone.trim(),
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setUserPhone(tempPhone.trim());
        setIsEditingPhone(false);
        toast.success('Nomor WhatsApp tujuan OTP berhasil disimpan!');
      } else {
        toast.error(resData.message || 'Gagal menyimpan nomor.');
      }
    } catch {
      toast.error('Gagal menghubungi server.');
    }
  };

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp', { cache: 'no-store' });
      const json: GatewayStatus = await res.json();
      setData(json);
    } catch (err) {
      setData({
        running: false,
        status: 'offline',
        message: 'Gagal menghubungi server WhatsApp internal.',
      });
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Polling every 4 seconds to detect QR scan completion automatically
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Send Test Message
  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        toast.success('Pesan uji coba berhasil dikirim ke WhatsApp Anda! 🚀', { duration: 5000 });
      } else {
        toast.error(resData.message || 'Gagal mengirim pesan uji coba.');
      }
    } catch (err: any) {
      toast.error('Koneksi terputus saat mencoba mengirim pesan.');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Logout / Reset Session
  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp ini? Anda harus melakukan scan QR ulang setelahnya.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Koneksi telah diputus. Silakan scan QR baru.');
        fetchStatus();
      } else {
        toast.error(resData.message || 'Gagal memutus sesi WhatsApp.');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat mereset sesi.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wider uppercase border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Baileys Protocol • 100% Free & Unlimited
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">WhatsApp 2FA Gateway</h1>
            <p className="text-white/80 max-w-xl text-sm leading-relaxed">
              Hubungkan WhatsApp Anda secara mandiri menggunakan protokol Baileys. Tanpa batasan kuota pesan, tanpa biaya langganan, dan sesi tersimpan permanen di server lokal.
            </p>
          </div>

          <button
            onClick={() => fetchStatus()}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-semibold border border-white/25 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Status
          </button>
        </div>
      </div>

      {/* ─── 2FA OTP User Toggle Card (ON / OFF SWITCH) ─── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${is2FAEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Verifikasi Login WhatsApp (2FA OTP)
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              is2FAEnabled 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
            }`}>
              {is2FAEnabled ? 'Aktif (ON)' : 'Nonaktif (OFF)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            {is2FAEnabled
              ? 'Status: AKTIF. Setiap kali login, sistem akan meminta 6-digit kode OTP yang dikirimkan ke WhatsApp Anda.'
              : 'Status: NONAKTIF. Anda dapat langsung masuk ke dashboard hanya dengan username & password tanpa kode OTP.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Nomor WhatsApp Penerima:</span>
            {isEditingPhone ? (
              <div className="inline-flex items-center gap-2">
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="h-8 px-3 rounded-lg border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempPhone(userPhone);
                    setIsEditingPhone(false);
                  }}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2">
                <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {userPhone}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Ubah Nomor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Big Switch Button */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {is2FAEnabled ? 'Matikan 2FA' : 'Hidupkan 2FA'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={is2FAEnabled}
            disabled={isToggling2FA}
            onClick={handleToggle2FA}
            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              is2FAEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                is2FAEnabled ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Status & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Status & Connection Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
              <span>Status Koneksi WhatsApp</span>
              {data?.status === 'connected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Terhubung (Aktif)
                </span>
              )}
              {data?.status === 'scan_qr' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Menunggu Scan QR
                </span>
              )}
              {data?.status === 'offline' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Offline
                </span>
              )}
            </h2>

            {/* Condition 1: CONNECTED */}
            {data?.status === 'connected' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      WhatsApp Berhasil Tersambung
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Nomor Tujuan Admin:{' '}
                      <strong className="font-mono text-emerald-900 dark:text-emerald-200">
                        {data.targetPhone || '081214412001'}
                      </strong>
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 pt-1">
                      Setiap kali Anda masuk lewat halaman Login, kode OTP 6-digit akan langsung dikirimkan ke nomor ini dalam waktu kurang dari 2 detik.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSendingTest ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Mengirim Pesan Tes...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Kirim Pesan Tes ke HP Saya
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 font-medium text-sm transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800"
                  >
                    {isResetting ? 'Memutuskan...' : 'Putus / Ganti Akun'}
                  </button>
                </div>
              </div>
            )}

            {/* Condition 2: SCAN QR REQUIRED */}
            {data?.status === 'scan_qr' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                    ⚠️ Silakan pindai (scan) QR Code di sebelah kanan menggunakan aplikasi WhatsApp di ponsel Anda.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Cara Menghubungkan:
                  </h3>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                    <li>Buka aplikasi <strong>WhatsApp</strong> di smartphone Anda.</li>
                    <li>
                      Ketuk <strong>Menu Titik Tiga (Android)</strong> atau tab <strong>Pengaturan (iPhone)</strong>.
                    </li>
                    <li>
                      Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.
                    </li>
                    <li>
                      Ketuk <strong>Tautkan Perangkat (Link a Device)</strong>.
                    </li>
                    <li>Arahkan kamera HP ke QR Code yang ditampilkan.</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Setelah scan 1 kali, sesi akan diingat otomatis selamanya di folder aman lokal.</span>
                </div>
              </div>
            )}

            {/* Condition 3: OFFLINE */}
            {data?.status === 'offline' && (
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                      Layanan WhatsApp Gateway Belum Aktif
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-400">
                      Jalankan perintah berikut di terminal proyek Anda untuk menyalakan gateway Baileys:
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                    <code>npm run wa</code>
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm run wa');
                      toast.success('Perintah disalin ke clipboard!');
                    }}
                    className="absolute right-3 top-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
                  >
                    Salin
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                Rp 0
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">100% Gratis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tanpa biaya langganan bulanan atau biaya per pesan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                ∞
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Unlimited OTP</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bebas kirim kode OTP sepuasnya tanpa kuota kadaluarsa.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                🔒
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sesi Permanen</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan 1x saja, sesi tersimpan rapi di folder multi-file auth.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code Visual Display */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[460px]">
            {data?.status === 'scan_qr' && data.qrDataUrl ? (
              <div className="space-y-5 animate-fade-in flex flex-col items-center">
                <div className="relative p-4 rounded-3xl bg-white shadow-xl border-4 border-emerald-500/30">
                  <img
                    src={data.qrDataUrl}
                    alt="Scan WhatsApp QR"
                    className="w-64 h-64 object-contain rounded-2xl"
                  />
                  <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Arahkan Kamera WhatsApp ke Sini
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    QR Code berganti otomatis secara berkala sesuai standar enkripsi WhatsApp.
                  </p>
                </div>
              </div>
            ) : data?.status === 'connected' ? (
              <div className="space-y-4 py-8 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-4 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    WhatsApp Siap Digunakan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Perangkat WhatsApp Anda sudah tertaut. Anda dapat langsung mencoba login dengan 2FA WhatsApp.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-12 flex flex-col items-center text-slate-400">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    QR Code Tidak Aktif
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Nyalakan gateway Baileys dengan <code>npm run wa</code> untuk memunculkan QR Code pemindaian.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
