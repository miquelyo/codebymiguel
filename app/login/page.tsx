'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw]           = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const ok = await login(email, password);
    if (!ok) setError('Email atau password salah. Coba admin@admin.com / admin123');
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-6 h-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left illustration panel ─────────────────────── */}
      <div className="hidden lg:flex w-[46%] relative bg-[#eef0f7] flex-col items-center justify-center px-12 overflow-hidden">
        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right,#c9cde0 1px,transparent 1px),linear-gradient(to bottom,#c9cde0 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* soft blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10 max-w-xs text-center">
          {/* abstract icon cluster */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 gap-2">
              {['#4f63d2','#6b8fa3','#3d8b68','#b97a2c'].map((c, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl opacity-80"
                  style={{ backgroundColor: `${c}22`, border: `1.5px solid ${c}33` }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-5 h-5 rounded-md" style={{ backgroundColor: `${c}55` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-[22px] font-semibold text-foreground/80 leading-snug">
            Kelola bisnis<br />dengan mudah
          </h2>
          <p className="text-[13px] text-muted mt-2 leading-relaxed">
            Dashboard admin yang bersih, cepat, dan<br />mudah digunakan untuk tim Anda.
          </p>
        </div>
      </div>

      {/* ── Right login form ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px] animate-fade-up">
          {/* brand */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GridIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-[15px] text-foreground tracking-tight">AdminPanel</span>
            </div>
            <h1 className="text-[24px] font-semibold text-foreground leading-tight">Selamat datang</h1>
            <p className="text-[13px] text-muted mt-1">Masuk untuk melanjutkan ke dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-foreground/75 mb-1.5">
                Email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@admin.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-lg text-[14px] text-foreground placeholder:text-muted/35
                             focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40
                             transition-shadow duration-150"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-foreground/75 mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-border rounded-lg text-[14px] text-foreground placeholder:text-muted/35
                             focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40
                             transition-shadow duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted transition-colors"
                  aria-label="Toggle password"
                >
                  {showPw
                    ? <EyeOffIcon className="w-4 h-4" />
                    : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 text-[12px] text-danger bg-danger/5 border border-danger/10 rounded-lg px-3 py-2.5 animate-fade-up">
                <AlertIcon className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-[14px] font-medium rounded-lg
                         transition-colors duration-150
                         focus:outline-none focus:ring-2 focus:ring-primary/30
                         flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting
                ? <><Spinner className="w-4 h-4" /><span>Masuk...</span></>
                : 'Masuk'}
            </button>
          </form>

          {/* hint */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-[11.5px] text-muted/60">
              Demo akun&nbsp;
              <span className="font-mono bg-surface-hover rounded px-1 py-0.5 text-foreground/50">admin@admin.com</span>
              &nbsp;/&nbsp;
              <span className="font-mono bg-surface-hover rounded px-1 py-0.5 text-foreground/50">admin123</span>
            </p>
          </div>
        </div>

        <p className="absolute bottom-6 text-[11px] text-muted/40">&copy; 2026 AdminPanel</p>
      </div>
    </div>
  );
}

/* ── Inline icons ─────────────────────────────────────── */
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
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
