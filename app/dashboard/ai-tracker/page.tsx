'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

function subscribeLiveTimer(callback: () => void) {
  const t = setInterval(callback, 1000);
  return () => clearInterval(t);
}
function getLiveNowSnapshot() {
  return Date.now();
}
function getServerSnapshot() {
  return 0;
}

/* ─── Clean SVG Action Icons ─────────────────────────────────── */
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function TrashIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CopyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ─── Types ──────────────────────────────────────────────── */
interface AIAgent {
  id: string;
  user_email?: string;
  email_account: string;
  gemini_refresh_at: string | null;
  claude_gpt_refresh_at: string | null;
  created_at?: string;
}

interface CooldownInfo {
  isReady: boolean;
  countdownText: string;
  diffMs: number;
}

/* ─── Helper: Parse Cooldown ─────────────────────────────── */
function parseCooldown(targetStr: string | null, nowMs: number): CooldownInfo {
  if (!targetStr) {
    return { isReady: true, countdownText: 'Ready', diffMs: 0 };
  }
  const targetMs = new Date(targetStr).getTime();
  const diffMs = targetMs - nowMs;

  if (isNaN(targetMs) || diffMs <= 0) {
    return { isReady: true, countdownText: 'Ready', diffMs: 0 };
  }

  const ts = Math.floor(diffMs / 1000);
  const dv = Math.floor(ts / 86400);
  const hv = Math.floor((ts % 86400) / 3600);
  const mv = Math.floor((ts % 3600) / 60);
  const sv = ts % 60;
  const ct = dv > 0 ? `${dv}d ${hv}h` : hv > 0 ? `${hv}h ${mv}m` : `${mv}m ${sv}s`;

  return {
    isReady: false,
    countdownText: ct,
    diffMs,
  };
}

export default function AITrackerPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'cooldown'>('all');
  const nowMs = useSyncExternalStore(subscribeLiveTimer, getLiveNowSnapshot, getServerSnapshot);

  // Form states: Durasi sederhana (jam & menit)
  const [formEmail, setFormEmail] = useState('');
  const [claudeHours, setClaudeHours] = useState<number>(0);
  const [claudeMinutes, setClaudeMinutes] = useState<number>(0);
  const [geminiHours, setGeminiHours] = useState<number>(0);
  const [geminiMinutes, setGeminiMinutes] = useState<number>(0);

  const loadAgents = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Gagal memuat AI agents: ' + error.message);
      } else {
        setAgents(data || []);
      }
    } catch (e) {
      console.warn('Error load AI agents:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      if (!user?.email) {
        return;
      }
      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false });

        if (!active) return;
        if (error) {
          toast.error('Gagal memuat AI agents: ' + error.message);
        } else {
          setAgents(data || []);
        }
      } catch (e) {
        console.warn('Error load AI agents:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      active = false;
    };
  }, [user]);

  const parsedAgents = useMemo(
    () =>
      agents.map((ag) => {
        const claude = parseCooldown(ag.claude_gpt_refresh_at, nowMs);
        const gemini = parseCooldown(ag.gemini_refresh_at, nowMs);
        const isBothReady = claude.isReady && gemini.isReady;
        const isAnyReady = claude.isReady || gemini.isReady;
        const isBothCooldown = !claude.isReady && !gemini.isReady;
        let nextMs = Infinity;
        if (!claude.isReady && claude.diffMs > 0) nextMs = Math.min(nextMs, claude.diffMs);
        if (!gemini.isReady && gemini.diffMs > 0) nextMs = Math.min(nextMs, gemini.diffMs);
        return {
          ...ag,
          claude,
          gemini,
          isBothReady,
          isAnyReady,
          isBothCooldown,
          nextAvailableMs: nextMs === Infinity ? 0 : nextMs,
        };
      }),
    [agents, nowMs]
  );

  const stats = useMemo(() => {
    const total = parsedAgents.length;
    const claudeReady = parsedAgents.filter((a) => a.claude.isReady).length;
    const geminiReady = parsedAgents.filter((a) => a.gemini.isReady).length;
    const allReady = parsedAgents.filter((a) => a.isBothReady).length;
    return { total, claudeReady, geminiReady, allReady };
  }, [parsedAgents]);

  const filteredAgents = useMemo(
    () =>
      parsedAgents.filter((ag) => {
        if (!ag.email_account.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType === 'ready') return ag.isAnyReady;
        if (filterType === 'cooldown') return ag.isBothCooldown;
        return true;
      }),
    [parsedAgents, searchQuery, filterType]
  );

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email disalin!');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const openAddModal = () => {
    setEditingAgent(null);
    setFormEmail('');
    setClaudeHours(0);
    setClaudeMinutes(0);
    setGeminiHours(0);
    setGeminiMinutes(0);
    setIsModalOpen(true);
  };

  const openEditModal = (ag: AIAgent) => {
    setEditingAgent(ag);
    setFormEmail(ag.email_account);

    if (ag.claude_gpt_refresh_at) {
      const diff = new Date(ag.claude_gpt_refresh_at).getTime() - Date.now();
      if (diff > 0) {
        const totalMinutes = Math.floor(diff / 60000);
        setClaudeHours(Math.floor(totalMinutes / 60));
        setClaudeMinutes(totalMinutes % 60);
      } else {
        setClaudeHours(0);
        setClaudeMinutes(0);
      }
    } else {
      setClaudeHours(0);
      setClaudeMinutes(0);
    }

    if (ag.gemini_refresh_at) {
      const diff = new Date(ag.gemini_refresh_at).getTime() - Date.now();
      if (diff > 0) {
        const totalMinutes = Math.floor(diff / 60000);
        setGeminiHours(Math.floor(totalMinutes / 60));
        setGeminiMinutes(totalMinutes % 60);
      } else {
        setGeminiHours(0);
        setGeminiMinutes(0);
      }
    } else {
      setGeminiHours(0);
      setGeminiMinutes(0);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !user?.email) {
      toast.error('Masukkan email akun AI');
      return;
    }

    const claudeMs = (Number(claudeHours) || 0) * 3600000 + (Number(claudeMinutes) || 0) * 60000;
    const claudeISO = claudeMs > 0 ? new Date(Date.now() + claudeMs).toISOString() : null;

    const geminiMs = (Number(geminiHours) || 0) * 3600000 + (Number(geminiMinutes) || 0) * 60000;
    const geminiISO = geminiMs > 0 ? new Date(Date.now() + geminiMs).toISOString() : null;

    const payload = {
      user_email: user.email,
      email_account: formEmail.trim(),
      claude_gpt_refresh_at: claudeISO,
      gemini_refresh_at: geminiISO,
    };

    if (editingAgent) {
      const { error } = await supabase.from('ai_agents').update(payload).eq('id', editingAgent.id);
      if (error) {
        toast.error('Gagal memperbarui akun: ' + error.message);
      } else {
        toast.success('Akun AI berhasil diperbarui!');
        setIsModalOpen(false);
        loadAgents();
      }
    } else {
      const { error } = await supabase.from('ai_agents').insert(payload);
      if (error) {
        toast.error('Gagal menambahkan akun: ' + error.message);
      } else {
        toast.success('Akun AI baru berhasil ditambahkan!');
        setIsModalOpen(false);
        loadAgents();
      }
    }
  };

  const executeDelete = async () => {
    if (!deleteId || !user?.email) return;
    const { error } = await supabase.from('ai_agents').delete().eq('id', deleteId).eq('user_email', user.email);
    if (error) {
      toast.error('Gagal menghapus akun!');
    } else {
      toast.success('Akun AI berhasil dihapus!');
      loadAgents();
    }
    setDeleteId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">

      {/* ── TOP HEADER SECTION: AI Tracker & Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              LIMIT AGENT TRACKER
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">Multi-Model Cooldown</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            Limit Agent Tracker
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5 font-medium">
            Pantau ketersediaan kuota Claude, ChatGPT, dan Google Gemini lintas akun secara akurat.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Akun AI</span>
        </button>
      </motion.div>

      {/* ── 3 BENTO STAT CARDS DENGAN LOGO RESMI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Akun */}
        <div className="bg-white rounded-[24px] p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <img src="/logo/Gmail_icon_(2020).svg" alt="Email" className="w-4 h-4 object-contain" />
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-heading">Total Akun Terdaftar</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 font-heading leading-tight mt-0.5">{stats.total}</p>
            <p className="text-[11px] text-zinc-400 font-medium">{stats.allReady} akun semua model siap</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-700 font-mono font-bold text-lg">
            AI
          </div>
        </div>

        {/* Card 2: Claude & ChatGPT Ready */}
        <div className="bg-white rounded-[24px] p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/logo/Claude_AI_symbol.svg" alt="Claude" className="w-4 h-4 object-contain" />
              <img src="/logo/ChatGPT-Logo.svg" alt="ChatGPT" className="w-4 h-4 object-contain" />
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-heading">Claude & ChatGPT</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 font-heading leading-tight">
              {stats.claudeReady}
              <span className="text-base text-zinc-400 font-normal">/{stats.total}</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Siap digunakan saat ini</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center p-2">
            <img src="/logo/Claude_AI_symbol.svg" alt="Claude" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Card 3: Gemini Ready */}
        <div className="bg-white rounded-[24px] p-5 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/logo/gemini.svg" alt="Gemini" className="w-4 h-4 object-contain" />
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-heading">Google Gemini</p>
            </div>
            <p className="text-[32px] font-bold text-zinc-900 font-heading leading-tight">
              {stats.geminiReady}
              <span className="text-base text-zinc-400 font-normal">/{stats.total}</span>
            </p>
            <p className="text-[11px] text-blue-600 font-medium">Siap digunakan saat ini</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center p-2">
            <img src="/logo/gemini.svg" alt="Gemini" className="w-full h-full object-contain" />
          </div>
        </div>

      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari email atau akun AI..."
            className="w-full h-11 pl-4 pr-9 rounded-2xl bg-white border border-zinc-200/80 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 outline-none transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1.5 p-1 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          {(['all', 'ready', 'cooldown'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                filterType === f
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {f === 'all' ? `Semua (${stats.total})` : f === 'ready' ? 'Ready' : 'Cooldown'}
            </button>
          ))}
        </div>
      </div>

      {/* ── COMPACT AGENT CARDS GRID (Sangat Rapi, Elegan & Hemat Layar) ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-mono">Memuat Akun AI...</p>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAgents.map((ag) => (
              <motion.div
                key={ag.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-[22px] p-4 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between space-y-3"
              >
                {/* Header: Email dengan Logo Gmail & Action Buttons */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-center p-1.5 shrink-0">
                      <img src="/logo/Gmail_icon_(2020).svg" alt="Email" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[12px] font-bold text-zinc-900 truncate font-heading tracking-tight" title={ag.email_account}>
                          {ag.email_account}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(ag.email_account)}
                          className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer shrink-0"
                          title="Salin email"
                        >
                          {copiedEmail === ag.email_account ? (
                            <CheckIcon className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <CopyIcon className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">Google Account</p>
                    </div>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(ag)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Edit Durasi Cooldown"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(ag.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Akun"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2 Bento Rows: Claude/GPT & Gemini */}
                <div className="space-y-2">
                  
                  {/* Claude & ChatGPT Box */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <img src="/logo/Claude_AI_symbol.svg" alt="Claude" className="w-4 h-4 object-contain" />
                        <img src="/logo/ChatGPT-Logo.svg" alt="ChatGPT" className="w-4 h-4 object-contain" />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-700 truncate">Claude / GPT</span>
                    </div>

                    <div>
                      {ag.claude.isReady ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {ag.claude.countdownText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Google Gemini Box */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src="/logo/gemini.svg" alt="Gemini" className="w-4 h-4 object-contain shrink-0" />
                      <span className="text-[11px] font-semibold text-zinc-700 truncate">Gemini Pro</span>
                    </div>

                    <div>
                      {ag.gemini.isReady ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {ag.gemini.countdownText}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white py-14 px-6 text-center rounded-[24px] border border-zinc-200/80 shadow-xs space-y-3">
          <p className="text-sm font-bold text-zinc-800 font-heading">
            {searchQuery ? 'Tidak ada akun AI yang cocok' : 'Belum ada akun AI'}
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Tambahkan akun Claude, ChatGPT, atau Gemini Anda untuk memantau cooldown kuota secara rapi.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Tambah Akun AI
          </button>
        </div>
      )}

      {/* ── SIMPLIFIED ADD / EDIT MODAL DENGAN LOGO RESMI (HANYA DURASI) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    {editingAgent ? 'Edit Durasi Cooldown' : 'Tambah Akun AI'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Isi durasi cooldown kuota jika sedang batas pemakaian
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors cursor-pointer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Email Account */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Email / Label Akun</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                      <img src="/logo/Gmail_icon_(2020).svg" alt="Email" className="w-full h-full object-contain" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="misal: ai.miguel@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                {/* Claude & ChatGPT Duration */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src="/logo/Claude_AI_symbol.svg" alt="Claude" className="w-4 h-4 object-contain" />
                      <img src="/logo/ChatGPT-Logo.svg" alt="ChatGPT" className="w-4 h-4 object-contain" />
                      <span className="text-xs font-bold text-zinc-900 font-heading">Claude & ChatGPT</span>
                    </div>
                    {claudeHours === 0 && claudeMinutes === 0 ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                        Status: Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                        Cooldown {claudeHours}j {claudeMinutes}m
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Durasi Jam</label>
                      <input
                        type="number"
                        min={0}
                        max={72}
                        value={claudeHours}
                        onChange={(e) => setClaudeHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Durasi Menit</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={claudeMinutes}
                        onChange={(e) => setClaudeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">Set 0 Jam 0 Menit untuk status Siap Pakai (Ready).</p>
                </div>

                {/* Gemini Pro Duration */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src="/logo/gemini.svg" alt="Gemini" className="w-4 h-4 object-contain" />
                      <span className="text-xs font-bold text-zinc-900 font-heading">Google Gemini Pro</span>
                    </div>
                    {geminiHours === 0 && geminiMinutes === 0 ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                        Status: Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                        Cooldown {geminiHours}j {geminiMinutes}m
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Durasi Jam</label>
                      <input
                        type="number"
                        min={0}
                        max={72}
                        value={geminiHours}
                        onChange={(e) => setGeminiHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Durasi Menit</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={geminiMinutes}
                        onChange={(e) => setGeminiMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-9 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">Set 0 Jam 0 Menit untuk status Siap Pakai (Ready).</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Akun AI"
        message="Apakah Anda yakin ingin menghapus akun AI ini dari radar cooldown?"
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
}
