'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ArrowUpRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

const DASHBOARD_MENUS = [
  {
    title: 'Absensi Harian',
    desc: 'Catat jam kedatangan dan pulang dengan batas toleransi keterlambatan otomatis.',
    href: '/dashboard/attendance',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375c0 .621-.504 1.125-1.125 1.125H6.75A1.125 1.125 0 015.625 19.5V10.125c0-.621.504-1.125 1.125-1.125z" />
      </svg>
    ),
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-500/10',
    textColor: 'text-blue-500'
  },
  {
    title: 'Notes & Tugas',
    desc: 'Simpan ide, rancangan, atau catatan tugas dengan editor markdown interaktif.',
    href: '/dashboard/notes',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-500/10',
    textColor: 'text-amber-500'
  },
  {
    title: 'Agenda & Events',
    desc: 'Atur jadwal meeting, interview, hingga hari jadi. Event sekali lewat otomatis terhapus.',
    href: '/dashboard/agenda',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: 'from-emerald-400 to-teal-500',
    bgLight: 'bg-emerald-500/10',
    textColor: 'text-emerald-500'
  },
  {
    title: 'AI Agent Tracker',
    desc: 'Pantau model Claude, GPT, dan Gemini di berbagai akun lengkap dengan timer refresh-nya.',
    href: '/dashboard/ai-tracker',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-500/10',
    textColor: 'text-pink-500'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const currentHour = time.getHours();
  let greeting = 'Selamat Malam';
  if (currentHour < 12) greeting = 'Selamat Pagi';
  else if (currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour < 18) greeting = 'Selamat Sore';

  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 overflow-hidden">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm glass"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-info/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover border border-border mb-4"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Sistem Aktif</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">Miguel</span> 👋
            </h1>
            <p className="text-muted text-base max-w-lg leading-relaxed">
              Selamat datang di pusat kendali workspace Anda. Semua fitur dirancang untuk meningkatkan produktivitas harian Anda.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3 bg-surface border border-border px-5 py-3 rounded-2xl shadow-sm">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Hari Ini</span>
              <span className="text-sm font-semibold text-foreground">{dateStr}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Menus Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="w-2 h-6 rounded-full bg-primary inline-block" />
            Akses Cepat Menu
          </h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {DASHBOARD_MENUS.map((menu, i) => (
            <Link href={menu.href} key={i} className="block group outline-none">
              <motion.div 
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-full bg-card border border-border p-6 rounded-3xl overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-foreground/5 group-focus-visible:ring-2 group-focus-visible:ring-primary"
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-2xl rounded-full transition-transform duration-500 group-hover:scale-150 bg-gradient-to-br ${menu.color}`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${menu.bgLight} ${menu.textColor} shadow-inner`}>
                      {menu.icon}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-muted group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                      <ArrowUpRight />
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                      {menu.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {menu.desc}
                    </p>
                  </div>
                </div>
                
                {/* Bottom Line Accent */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${menu.color} transition-all duration-500`} />
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>

    </div>
  );
}