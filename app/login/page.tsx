'use client';

import { useState, useEffect, useRef, Suspense, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function LoginContent() {
  const { login, validateCredentials, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isIdleTimeout = searchParams.get('reason') === 'idle';

  // Step 1: credentials, Step 2: 2fa (WhatsApp OTP)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // 2FA WhatsApp states
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Prefill last user (default 'Miguel') and auto-focus password
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('codebymiguel_last_user');
      setEmail(savedUser || 'Miguel');
    } catch {
      setEmail('Miguel');
    }

    const timer = setTimeout(() => {
      passwordRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // ─── Step 1 Submit: Check Password & Send WhatsApp OTP ─────────
  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Harap isi username dan password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 1. Validasi kredensial terlebih dahulu
      const isValid = await validateCredentials(email, password);
      if (!isValid) {
        setError('Email/Username atau password salah. Pastikan akun sudah terdaftar.');
        setIsSubmitting(false);
        return;
      }

      // 2. Cek apakah user ini mengaktifkan Verifikasi WhatsApp (2FA)
      try {
        const checkRes = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check', identifier: email.trim() }),
        });
        const checkData = await checkRes.json();

        // Jika user memilih untuk TIDAK menggunakan verifikasi WhatsApp (2FA OFF)
        if (checkData.success && checkData.enabled === false) {
          toast.success('Login berhasil! Membuka dashboard...');
          try {
            localStorage.setItem('codebymiguel_last_user', email.trim());
          } catch {}
          await login(email.trim(), password);
          return;
        }
      } catch (checkErr) {
        console.warn('Fallback ke login langsung:', checkErr);
        try {
          localStorage.setItem('codebymiguel_last_user', email.trim());
        } catch {}
        await login(email.trim(), password);
        return;
      }

      // Jika 2FA Aktif (2FA ON) -> Kirim kode OTP ke WhatsApp
      const sendRes = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier: email.trim() }),
      });
      const sendData = await sendRes.json();

      if (sendData.success) {
        setMaskedPhone(sendData.maskedPhone || 'WhatsApp Anda');
        toast.success('Kode OTP berhasil dikirim ke WhatsApp Anda!');
        setStep('2fa');
        setResendCountdown(60);
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 200);
      } else {
        // Jika gateway offline, jangan kunci user di luar! Masuk langsung dengan kredensial yang valid
        console.warn('WhatsApp gateway offline:', sendData.message);
        toast('Gateway WhatsApp offline. Masuk dengan verifikasi password...', { icon: '⚠️' });
        try {
          localStorage.setItem('codebymiguel_last_user', email.trim());
        } catch {}
        await login(email.trim(), password);
        return;
      }
    } catch (err) {
      console.error('Error during login request:', err);
      setError('Terjadi kendala saat menghubungi server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step 2 Submit: Verify OTP & Complete Login ────────────────
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      setError('Harap masukkan 6-digit kode OTP.');
      return;
    }

    setError('');
    setIsVerifyingOtp(true);

    try {
      const verifyRes = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          identifier: email.trim(),
          code: cleanCode,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setError(verifyData.message || 'Kode OTP tidak sesuai.');
        setIsVerifyingOtp(false);
        return;
      }

      // 3. OTP Valid -> Buat sesi dan redirect ke dashboard
      const ok = await login(email, password);
      if (ok) {
        try {
          localStorage.setItem('codebymiguel_last_user', email.trim());
        } catch {}
        toast.success('Verifikasi 2FA WhatsApp berhasil!');
      } else {
        setError('Gagal menyelesaikan otentikasi sesi.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Terjadi kendala jaringan saat memverifikasi OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ─── Resend OTP Handler ─────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setError('');
    const loadingToast = toast.loading('Mengirim ulang kode ke WhatsApp...');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier: email.trim() }),
      });
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('Kode OTP baru telah dikirim ke WhatsApp!');
        setResendCountdown(60);
        setOtpCode('');
        otpInputRef.current?.focus();
      } else {
        toast.error(data.message || 'Gagal mengirim ulang kode.');
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Gagal menghubungi server.');
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;
  const isOtpValid = otpCode.trim().length === 6;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/10 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">Memverifikasi Sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-zinc-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Light Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Subtle soft neutral ambient glow (No blue) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-zinc-200/40 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[500px] h-[500px] rounded-full bg-zinc-200/40 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto">
        {/* Centered Clean Light Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] border border-zinc-200/80">
            {/* Top decorative hairline */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 ${
              step === '2fa'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                : 'bg-gradient-to-r from-zinc-200 via-zinc-900 to-zinc-200'
            }`} />

            {/* Idle Timeout Warning */}
            <AnimatePresence>
              {isIdleTimeout && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5"
                >
                  <svg className="w-4.5 h-4.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>Sesi Anda berakhir otomatis karena tidak aktif selama 15 menit.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5"
                >
                  <svg className="w-4.5 h-4.5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── STEP 1: CREDENTIALS ─────────────────────────────── */}
            {step === 'credentials' && (
              <motion.div
                key="step-credentials"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                {/* 3D Black </> Brand Logo Header */}
                <div className="flex flex-col items-center text-center mb-7">
                  <div className="relative mb-3.5">
                    {/* 3D Floor Shadow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-zinc-900/15 blur-sm rounded-full pointer-events-none" />

                    {/* 3D Black Tile */}
                    <div
                      className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-black flex items-center justify-center border border-zinc-700/80 transition-transform duration-300 hover:scale-105"
                      style={{
                        boxShadow:
                          '0 12px 24px -4px rgba(0,0,0,0.25), 0 6px 12px -2px rgba(0,0,0,0.15), inset 0 1.5px 1.5px 0 rgba(255,255,255,0.4), inset 0 -3px 4px 0 rgba(0,0,0,0.7)',
                      }}
                    >
                      {/* Specular 3D Gloss Highlight */}
                      <div className="absolute top-0 inset-x-0 h-[48%] rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                      {/* 3D </> Symbol */}
                      <svg
                        className="w-8 h-8 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.4}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-zinc-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    CodebyMiguel
                  </h1>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Email atau Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Username atau email"
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        ref={passwordRef}
                        type={showPw ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 pl-10 pr-11 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                      >
                        {showPw ? (
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button (Gray when empty, Black when filled) */}
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 ${
                      isFormValid && !isSubmitting
                        ? 'bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-900/15 active:scale-[0.99] cursor-pointer'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200/80 shadow-none'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4.5 h-4.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isFormValid ? 'text-white' : 'text-zinc-400'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.4}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 2: WHATSAPP 2FA OTP ───────────────────────── */}
            {step === '2fa' && (
              <motion.div
                key="step-2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header 2FA */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm mb-3">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.18-.545-1.9-1.285-3.125-3.235-3.22-3.361-.095-.126-.773-1.03-.773-1.963 0-.934.49-1.393.664-1.583.174-.19.38-.238.506-.238.127 0 .253.001.364.007.119.006.277-.045.434.332.162.389.554 1.353.602 1.452.048.098.08.214.016.34-.064.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.194.198-.083.388.111.19.493.813 1.057 1.315.727.646 1.34.846 1.53.941.19.095.301.079.412-.048.111-.127.476-.555.602-.745.127-.19.254-.158.428-.095.174.063 1.109.523 1.3.618.19.095.317.142.364.222.048.079.048.459-.096.864z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verifikasi 2FA</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    Autentikasi WhatsApp
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Kode dikirim ke <span className="font-semibold text-zinc-800 font-mono">{maskedPhone}</span>
                  </p>
                </div>

                {/* Form OTP Input */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-2 text-center">
                      Masukkan 6-Digit Kode OTP
                    </label>
                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                      }}
                      placeholder="••••••"
                      className="w-full h-14 text-center tracking-[0.45em] text-2xl font-mono font-bold rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400 transition-all outline-none"
                    />
                  </div>

                  {/* Submit Button (Gray when <6 digits, Black when 6 digits) */}
                  <button
                    type="submit"
                    disabled={!isOtpValid || isVerifyingOtp}
                    className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 ${
                      isOtpValid && !isVerifyingOtp
                        ? 'bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-900/15 active:scale-[0.99] cursor-pointer'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-200/80 shadow-none'
                    }`}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <svg className="w-4.5 h-4.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Memverifikasi Kode OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Verifikasi & Masuk</span>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Resend & Back actions */}
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError('');
                      setOtpCode('');
                    }}
                    className="text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Ganti Akun</span>
                  </button>

                  {resendCountdown > 0 ? (
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Kirim ulang dalam <strong className="text-zinc-700">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer transition-colors"
                    >
                      Kirim Ulang Kode
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}