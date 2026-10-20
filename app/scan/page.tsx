'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface GatewayStatus {
  running: boolean;
  status: 'initializing' | 'connecting' | 'scan_qr' | 'connected' | 'disconnected' | 'offline';
  user?: string | null;
  hasQr?: boolean;
  qrDataUrl?: string | null;
  targetPhone?: string;
  message?: string;
}

export default function PublicScanPage() {
  const [data, setData] = useState<GatewayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp', { cache: 'no-store' });
      const json: GatewayStatus = await res.json();
      setData(json);
    } catch {
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
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Baileys Gateway Setup
          </div>
          <h1 className="text-2xl font-extrabold text-white">Tautkan WhatsApp</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scan QR Code ini untuk menghubungkan nomor WhatsApp Anda. Setelah tersambung, Anda bisa langsung masuk ke sistem.
          </p>
        </div>

        {/* QR Display or Connected State */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
          {data?.status === 'connected' ? (
            <div className="py-6 space-y-4 animate-fade-in flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">WhatsApp Berhasil Terhubung!</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  Sesi tersimpan secara permanen.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 mt-2"
              >
                <span>Buka Halaman Login</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          ) : data?.qrDataUrl ? (
            <div className="space-y-4 flex flex-col items-center animate-fade-in">
              <div className="relative p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/40">
                <img
                  src={data.qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-400 animate-pulse">
                QR Code diperbarui otomatis. Arahkan kamera HP ke layar ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-10 flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs">Memuat QR Code dari server gateway...</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="text-left bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <h4 className="text-xs font-bold text-slate-300">Langkah Scan dari HP:</h4>
          <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed">
            <li>Buka <strong>WhatsApp</strong> di smartphone Anda.</li>
            <li>Ketuk <strong>Titik Tiga / Pengaturan</strong> &gt; <strong>Perangkat Tertaut</strong>.</li>
            <li>Ketuk <strong>Tautkan Perangkat</strong> dan scan QR di atas.</li>
          </ol>
        </div>

        {/* Footer Link */}
        <div className="pt-2">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-white transition-colors underline font-medium"
          >
            ← Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </main>
  );
}
