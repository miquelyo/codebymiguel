'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import { useSearchParams } from 'next/navigation';

// Wrapped in Suspense below because useSearchParams() requires it for static prerendering
function LoginContent() {
  const { login, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isIdleTimeout = searchParams.get('reason') === 'idle';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setIsSubmitting(true);

    const ok = await login(email, password);

    if (!ok) {
      setError(
        'Email atau password salah. Pastikan akun sudah terdaftar di sistem.'
      );
    }

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] relative overflow-hidden">
      {/* Background animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -30, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-blue-200/40 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -70, 30, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.92, 1.08, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-purple-200/30 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 50, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 w-[280px] h-[280px] rounded-full bg-cyan-100/40 blur-3xl"
        />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <div className="relative z-10 min-h-screen flex">

        {/* =====================================================
            LEFT PANEL
        ====================================================== */}
        <section className="hidden lg:flex w-[52%] min-h-screen p-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full overflow-hidden rounded-[32px] bg-[#111111] text-white flex flex-col justify-between p-12"
          >
            {/* Moving glow */}
            <motion.div
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 50, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-[400px] h-[400px] rounded-full bg-white/10 blur-[100px] -top-40 -right-20"
            />

            <motion.div
              animate={{
                x: [0, -80, 40, 0],
                y: [0, 50, -40, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[100px] -bottom-40 -left-20"
            />

            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />

            {/* Logo */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg"
                >
                  <CodeIcon className="w-5 h-5" />
                </motion.div>

                <span className="font-semibold text-lg tracking-tight">
                  MiguelCode
                </span>
              </motion.div>
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p className="text-sm text-white/40 mb-5">
                  PERSONAL WORKSPACE
                </p>

                <h2 className="text-5xl xl:text-6xl font-semibold tracking-[-0.06em] leading-[0.95]">
                  Your ideas.
                  <br />
                  Your workspace.
                  <br />
                  <span className="text-white/40">Your system.</span>
                </h2>

                <p className="mt-7 text-sm leading-relaxed text-white/45 max-w-md">
                  Satu ruang untuk mengatur project, task,
                  dokumen, keuangan, dan berbagai aktivitas
                  personal kamu.
                </p>
              </motion.div>

              {/* Floating cards */}
              <div className="relative mt-12 h-24">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute left-0 top-0 px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <ChartIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-[11px] text-white/40">
                        Workspace
                      </p>
                      <p className="text-sm font-medium">
                        Everything organized
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 8, 0],
                    rotate: [0, -1, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute left-44 top-12 px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <SparkleIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-[11px] text-white/40">
                        Productivity
                      </p>
                      <p className="text-sm font-medium">
                        Stay focused
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between text-xs text-white/30">
              <span>© 2026 MiguelCode</span>
              <span>Personal Operating System</span>
            </div>
          </motion.div>
        </section>

        {/* =====================================================
            RIGHT LOGIN
        ====================================================== */}
        <section className="flex-1 min-h-screen flex items-center justify-center px-5 sm:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-[420px]"
          >

            {/* Mobile logo */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex lg:hidden items-center gap-3 mb-12"
            >
              <div className="w-10 h-10 rounded-xl bg-[#111] text-white flex items-center justify-center">
                <CodeIcon className="w-5 h-5" />
              </div>

              <span className="font-semibold text-[17px] tracking-tight">
                MiguelCode
              </span>
            </motion.div>

            {/* Login Card */}
            <div className="relative">

              {/* Small floating decoration */}
              <motion.div
                animate={{
                  y: [0, -7, 0],
                  rotate: [0, 3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-6 -right-4 hidden sm:flex w-12 h-12 rounded-2xl bg-white/80 border border-white shadow-lg backdrop-blur-xl items-center justify-center"
              >
                <SparkleIcon className="w-5 h-5 text-gray-500" />
              </motion.div>

              <div className="bg-white/75 backdrop-blur-2xl border border-white rounded-[28px] shadow-[0_20px_70px_rgba(0,0,0,0.08)] p-7 sm:p-9">

                {/* Heading */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8"
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase mb-3">
                    Welcome back
                  </p>

                  <h1 className="text-[32px] sm:text-[36px] font-semibold tracking-[-0.05em] text-gray-900 leading-tight">
                    Selamat datang.
                  </h1>

                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    Masuk untuk melanjutkan ke
                    workspace MiguelCode.
                  </p>
                </motion.div>

                {isIdleTimeout && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
                  >
                    <span className="text-lg leading-none">⏰</span>
                    <p>Sesi Anda telah berakhir karena tidak aktif selama 15 menit. Silakan login kembali.</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label
                      htmlFor="email"
                      className="block text-[13px] font-medium text-gray-700 mb-2"
                    >
                      Email atau Username
                    </label>

                    <div className="relative group">
                      <MailIcon
                        className="
                          absolute left-4 top-1/2 -translate-y-1/2
                          w-[17px] h-[17px]
                          text-gray-400
                          group-focus-within:text-gray-900
                          transition-colors
                        "
                      />

                      <input
                        id="email"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com / username"
                        required
                        autoComplete="email"
                        className="
                          w-full
                          h-[52px]
                          pl-11 pr-4
                          rounded-2xl
                          bg-gray-50/80
                          border border-gray-200
                          text-[14px]
                          text-gray-900
                          placeholder:text-gray-400
                          outline-none
                          transition-all duration-200
                          focus:bg-white
                          focus:border-gray-900
                          focus:ring-4
                          focus:ring-gray-900/5
                          hover:border-gray-300
                        "
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48 }}
                  >
                    <label
                      htmlFor="password"
                      className="block text-[13px] font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>

                    <div className="relative group">
                      <LockIcon
                        className="
                          absolute left-4 top-1/2 -translate-y-1/2
                          w-[17px] h-[17px]
                          text-gray-400
                          group-focus-within:text-gray-900
                          transition-colors
                        "
                      />

                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="
                          w-full
                          h-[52px]
                          pl-11 pr-12
                          rounded-2xl
                          bg-gray-50/80
                          border border-gray-200
                          text-[14px]
                          text-gray-900
                          placeholder:text-gray-400
                          outline-none
                          transition-all duration-200
                          focus:bg-white
                          focus:border-gray-900
                          focus:ring-4
                          focus:ring-gray-900/5
                          hover:border-gray-300
                        "
                      />

                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="
                          absolute right-4 top-1/2
                          -translate-y-1/2
                          text-gray-400
                          hover:text-gray-900
                          transition-colors
                        "
                        aria-label="Toggle password"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {showPw ? (
                            <motion.div
                              key="hide"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                            >
                              <EyeOffIcon className="w-[17px] h-[17px]" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="show"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                            >
                              <EyeIcon className="w-[17px] h-[17px]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </motion.div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        className="
                          flex gap-3
                          text-[12px]
                          text-red-700
                          bg-red-50
                          border border-red-100
                          rounded-2xl
                          px-4 py-3
                          overflow-hidden
                        "
                      >
                        <AlertIcon className="w-4 h-4 shrink-0 mt-px" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    whileHover={{
                      scale: 1.01,
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full
                      h-[52px]
                      rounded-2xl
                      bg-[#111]
                      text-white
                      text-[14px]
                      font-semibold
                      flex items-center justify-center gap-2
                      shadow-lg
                      shadow-black/10
                      transition-opacity
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      mt-2
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <Spinner className="w-4 h-4" />
                        </motion.div>

                        <span>Masuk...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke workspace</span>
                        <ArrowIcon className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Security note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-7 flex items-center justify-center gap-2 text-[11px] text-gray-400"
                >
                  <ShieldIcon className="w-3.5 h-3.5" />
                  <span>Your workspace is private</span>
                </motion.div>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-center text-[11px] text-gray-400 mt-7">
              © 2026 MiguelCode
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   ICONS
============================================================ */

function CodeIcon({ className }: { className?: string }) {
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
        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.45 10.45 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498m-15.837-5.77L3 3m3.228 3.228l11.544 11.544M17.772 17.772L21 21"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-6-6l6 6-6 6"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4"
      />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l1.4 5.1a5 5 0 003.5 3.5L22 13l-5.1 1.4a5 5 0 00-3.5 3.5L12 23l-1.4-5.1a5 5 0 00-3.5-3.5L2 13l5.1-1.4a5 5 0 003.5-3.5L12 3z"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
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
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M21 12a9 9 0 00-9-9v3a6 6 0 016 6h3z"
      />
    </svg>
  );
}