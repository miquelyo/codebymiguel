'use client';

import { useState, useEffect, useRef, Suspense, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function LoginContent() {
  const { user, login, register, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isIdleTimeout = searchParams.get('reason') === 'idle';

  // Jika sudah memiliki sesi login aktif, langsung alihkan ke dashboard
  useEffect(() => {
    if (user) {
      window.location.replace('/dashboard');
    }
  }, [user]);

  // Mode: login or register
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Prefill last user (default 'Miguel') and auto-focus password (desktop only)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('codebymiguel_last_user');
      setEmail(savedUser || 'Miguel');
    } catch {
      setEmail('Miguel');
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
        passwordRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ─── Register Submit ───────────────────────────────────────────
  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nameVal = ((form.elements.namedItem('name') as HTMLInputElement)?.value || fullName).trim();
    const emailVal = ((form.elements.namedItem('username') as HTMLInputElement)?.value || email).trim();
    const passVal = ((form.elements.namedItem('password') as HTMLInputElement)?.value || password).trim();

    if (!emailVal || !passVal) {
      setError('Harap lengkapi email dan password.');
      return;
    }
    if (!emailVal.includes('@')) {
      setError('Pendaftaran memerlukan alamat email yang valid.');
      return;
    }
    if (passVal.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await register(emailVal, passVal, nameVal);
      if (res.success) {
        toast.success('Akun baru berhasil didaftarkan! Silakan masuk.');
        setMode('login');
        setError('');
      } else {
        setError(res.error || 'Gagal mendaftar akun.');
      }
    } catch {
      setError('Terjadi kendala saat mendaftarkan akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Login Submit ──────────────────────────────────────────────
  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const userVal = ((form.elements.namedItem('username') as HTMLInputElement)?.value || email).trim();
    const passVal = ((form.elements.namedItem('password') as HTMLInputElement)?.value || password).trim();

    if (!userVal || !passVal) {
      setError('Harap isi username atau email dan password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const ok = await login(userVal, passVal);
      if (!ok) {
        setError('Email/Username atau password salah. Pastikan akun sudah terdaftar.');
        setIsSubmitting(false);
        return;
      }
      try {
        localStorage.setItem('codebymiguel_last_user', userVal);
      } catch {}
      toast.success('Login berhasil! Membuka dashboard...');
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      }
    } catch (err) {
      console.error('Error during login request:', err);
      setError('Terjadi kendala saat menghubungi server autentikasi.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-zinc-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Light Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Subtle soft neutral ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-zinc-200/40 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[500px] h-[500px] rounded-full bg-zinc-200/40 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto">
        {/* Centered Clean Light Card */}
        <div className="w-full">
          <div className="bg-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] border border-zinc-200/80">
            {/* Top decorative hairline */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-200 via-zinc-900 to-zinc-200" />

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

            {/* Tabs Masuk / Daftar */}
            <div className="flex rounded-xl bg-zinc-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <form onSubmit={mode === 'login' ? handleCredentialsSubmit : handleRegisterSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="register-name" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="login-username" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  {mode === 'login' ? 'Email atau Username' : 'Alamat Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <input
                    id="login-username"
                    name="username"
                    type={mode === 'register' ? 'email' : 'text'}
                    autoComplete={mode === 'register' ? 'email' : 'username'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                    placeholder={mode === 'login' ? 'Username atau email' : 'nama@contoh.com'}
                    aria-label="Username atau email"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    ref={passwordRef}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                    placeholder="••••••••"
                    aria-label="Password akun"
                    className="w-full h-12 pl-10 pr-11 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Sembunyikan password' : 'Lihat password'}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-900/15 active:scale-[0.99] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4.5 h-4.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{mode === 'login' ? 'Signing in...' : 'Mendaftarkan...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign in' : 'Daftar Akun Baru'}</span>
                    <svg
                      className="w-4 h-4 text-white transition-transform"
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
          </div>
        </div>
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
