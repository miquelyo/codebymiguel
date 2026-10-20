'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

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
  statusBadge: string;
  countdownText: string;
  targetDateTimeText: string;
  progressPercent: number; // 0 (ready) to 100 (in cooldown)
  diffMs: number;
}

// ─── Helpers: Time Formatting & Calculations ──────────────────────────────
function parseCooldown(targetStr: string | null, nowMs: number): CooldownInfo {
  if (!targetStr) {
    return {
      isReady: true,
      statusBadge: 'READY',
      countdownText: 'Siap Pakai',
      targetDateTimeText: 'Tidak ada batasan waktu',
      progressPercent: 0,
      diffMs: 0,
    };
  }

  const targetMs = new Date(targetStr).getTime();
  const diffMs = targetMs - nowMs;

  const targetDate = new Date(targetStr);
  const formattedDate = targetDate.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isNaN(targetMs) || diffMs <= 0) {
    return {
      isReady: true,
      statusBadge: 'READY',
      countdownText: 'Siap Pakai (Selesai)',
      targetDateTimeText: `Cooldown selesai sejak ${formattedDate}`,
      progressPercent: 0,
      diffMs: 0,
    };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} hr`);
  if (hours > 0 || days > 0) parts.push(`${hours} jam`);
  parts.push(`${minutes} mnt`);
  if (days === 0 && hours < 6) {
    parts.push(`${seconds} dtk`);
  }

  // Progress relative to 24h baseline (or actual diff if longer)
  const maxRef = Math.max(diffMs, 24 * 60 * 60 * 1000);
  const progressPercent = Math.min(100, Math.max(10, Math.round((diffMs / maxRef) * 100)));

  return {
    isReady: false,
    statusBadge: 'COOLDOWN',
    countdownText: parts.join(' '),
    targetDateTimeText: `Reset: ${formattedDate} WIB`,
    progressPercent,
    diffMs,
  };
}

// Convert UTC target string to ISO local datetime string for <input type="datetime-local" />
function toLocalDatetimeInput(targetStr: string | null): string {
  if (!targetStr) return '';
  const d = new Date(targetStr);
  if (isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localTime = new Date(d.getTime() - tzOffset);
  return localTime.toISOString().slice(0, 16);
}

// Convert local datetime string to UTC ISO string
function fromLocalDatetimeInput(localStr: string): string | null {
  if (!localStr) return null;
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AITrackerPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'cooldown' | 'claude_ready' | 'gemini_ready'>('all');

  // Real-time ticker: updates every second for countdown and clock precision
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Form State
  const [formEmail, setFormEmail] = useState('');
  // Model 1: Claude & GPT
  const [claudeMode, setClaudeMode] = useState<'ready' | 'preset' | 'custom_duration' | 'datetime'>('ready');
  const [claudeHours, setClaudeHours] = useState(5);
  const [claudeDays, setClaudeDays] = useState(0);
  const [claudeMinutes, setClaudeMinutes] = useState(0);
  const [claudeDatetime, setClaudeDatetime] = useState('');

  // Model 2: Google Gemini
  const [geminiMode, setGeminiMode] = useState<'ready' | 'preset' | 'custom_duration' | 'datetime'>('ready');
  const [geminiHours, setGeminiHours] = useState(24);
  const [geminiDays, setGeminiDays] = useState(0);
  const [geminiMinutes, setGeminiMinutes] = useState(0);
  const [geminiDatetime, setGeminiDatetime] = useState('');

  // Load all agents from Supabase
  const loadAgents = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const emailToQuery = user?.email || 'yosafatmiquel@gmail.com';

      // Select all records for the admin/workspace
      let query = supabase.from('ai_agents').select('*');
      if (user?.role === 'Super Admin' || emailToQuery === 'yosafatmiquel@gmail.com') {
        query = query.or(`user_email.eq.${emailToQuery},user_email.eq.yosafatmiquel@gmail.com,user_email.is.null`);
      } else {
        query = query.or(`user_email.eq.${emailToQuery},user_email.eq.yosafatmiquel@gmail.com`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading AI agents:', error);
        toast.error('Gagal mengambil data AI Tracker: ' + error.message);
      } else {
        setAgents(data || []);
        if (showToast) toast.success('Data AI Agent berhasil diperbarui!');
      }
    } catch (err) {
      console.error('Unexpected error loading AI agents:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Compute live parsed statuses for all agents
  const parsedAgents = useMemo(() => {
    return agents.map((ag) => {
      const claude = parseCooldown(ag.claude_gpt_refresh_at, nowMs);
      const gemini = parseCooldown(ag.gemini_refresh_at, nowMs);
      const isAnyReady = claude.isReady || gemini.isReady;
      const isBothReady = claude.isReady && gemini.isReady;
      const isBothCooldown = !claude.isReady && !gemini.isReady;

      // Smallest non-zero diff among cooldowns
      let nextAvailableMs = Infinity;
      if (!claude.isReady && claude.diffMs > 0) nextAvailableMs = Math.min(nextAvailableMs, claude.diffMs);
      if (!gemini.isReady && gemini.diffMs > 0) nextAvailableMs = Math.min(nextAvailableMs, gemini.diffMs);

      return {
        ...ag,
        claude,
        gemini,
        isAnyReady,
        isBothReady,
        isBothCooldown,
        nextAvailableMs: nextAvailableMs === Infinity ? 0 : nextAvailableMs,
      };
    });
  }, [agents, nowMs]);

  // Global Radar Statistics
  const stats = useMemo(() => {
    const total = parsedAgents.length;
    const claudeReadyCount = parsedAgents.filter((a) => a.claude.isReady).length;
    const geminiReadyCount = parsedAgents.filter((a) => a.gemini.isReady).length;
    const allReadyCount = parsedAgents.filter((a) => a.isBothReady).length;
    const cooldownCount = parsedAgents.filter((a) => a.isBothCooldown).length;

    // Find the account with the fastest upcoming cooldown
    const cooldownItems = parsedAgents.filter((a) => !a.isBothReady && a.nextAvailableMs > 0);
    cooldownItems.sort((a, b) => a.nextAvailableMs - b.nextAvailableMs);
    const fastest = cooldownItems[0] || null;

    let fastestText = 'Semua akun siap digunakan';
    if (fastest) {
      const totalSec = Math.floor(fastest.nextAvailableMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      fastestText = `${fastest.email_account.split('@')[0]} siap dlm ${h > 0 ? `${h}j ` : ''}${m}m ${s}s`;
    }

    return {
      total,
      claudeReadyCount,
      geminiReadyCount,
      allReadyCount,
      cooldownCount,
      fastestAccount: fastest,
      fastestText,
    };
  }, [parsedAgents]);

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return parsedAgents.filter((ag) => {
      // Search
      const matchSearch =
        ag.email_account.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Filter
      if (filterType === 'ready') return ag.claude.isReady || ag.gemini.isReady;
      if (filterType === 'cooldown') return !ag.claude.isReady || !ag.gemini.isReady;
      if (filterType === 'claude_ready') return ag.claude.isReady;
      if (filterType === 'gemini_ready') return ag.gemini.isReady;
      return true;
    });
  }, [parsedAgents, searchQuery, filterType]);

  // Copy email helper
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success(`Email disalin: ${email}`);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Quick Reset Handler (Sets time or resets to Ready)
  const handleQuickReset = async (
    agentId: string,
    model: 'claude_gpt' | 'gemini',
    hours: number
  ) => {
    const target = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
    const updates: Record<string, string | null> = {};
    if (model === 'claude_gpt') updates.claude_gpt_refresh_at = target;
    if (model === 'gemini') updates.gemini_refresh_at = target;

    // Optimistic update in UI
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, ...updates } : a))
    );

    const { error } = await supabase.from('ai_agents').update(updates).eq('id', agentId);
    if (error) {
      toast.error('Gagal memperbarui: ' + error.message);
      loadAgents();
    } else {
      const label = model === 'claude_gpt' ? 'Claude / GPT' : 'Gemini Pro';
      toast.success(
        hours > 0 ? `${label} diatur ke ${hours} jam dari sekarang!` : `${label} direset ke Siap Pakai!`
      );
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingAgent(null);
    setFormEmail('');
    setClaudeMode('ready');
    setClaudeHours(5);
    setClaudeDays(0);
    setClaudeMinutes(0);
    setClaudeDatetime('');

    setGeminiMode('ready');
    setGeminiHours(24);
    setGeminiDays(0);
    setGeminiMinutes(0);
    setGeminiDatetime('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (ag: AIAgent) => {
    setEditingAgent(ag);
    setFormEmail(ag.email_account);

    // Initialize Claude settings
    if (!ag.claude_gpt_refresh_at || new Date(ag.claude_gpt_refresh_at).getTime() <= Date.now()) {
      setClaudeMode('ready');
      setClaudeHours(5);
      setClaudeDays(0);
      setClaudeMinutes(0);
      setClaudeDatetime('');
    } else {
      setClaudeMode('datetime');
      setClaudeDatetime(toLocalDatetimeInput(ag.claude_gpt_refresh_at));
      const diffMs = new Date(ag.claude_gpt_refresh_at).getTime() - Date.now();
      const totalMins = Math.max(0, Math.round(diffMs / 60000));
      setClaudeDays(Math.floor(totalMins / 1440));
      setClaudeHours(Math.floor((totalMins % 1440) / 60));
      setClaudeMinutes(totalMins % 60);
    }

    // Initialize Gemini settings
    if (!ag.gemini_refresh_at || new Date(ag.gemini_refresh_at).getTime() <= Date.now()) {
      setGeminiMode('ready');
      setGeminiHours(24);
      setGeminiDays(0);
      setGeminiMinutes(0);
      setGeminiDatetime('');
    } else {
      setGeminiMode('datetime');
      setGeminiDatetime(toLocalDatetimeInput(ag.gemini_refresh_at));
      const diffMs = new Date(ag.gemini_refresh_at).getTime() - Date.now();
      const totalMins = Math.max(0, Math.round(diffMs / 60000));
      setGeminiDays(Math.floor(totalMins / 1440));
      setGeminiHours(Math.floor((totalMins % 1440) / 60));
      setGeminiMinutes(totalMins % 60);
    }

    setIsModalOpen(true);
  };

  // Compute final ISO target for Claude from modal form
  const getClaudeTargetISO = (): string | null => {
    if (claudeMode === 'ready') return null;
    if (claudeMode === 'preset') {
      return new Date(Date.now() + claudeHours * 3600 * 1000).toISOString();
    }
    if (claudeMode === 'datetime') {
      return fromLocalDatetimeInput(claudeDatetime);
    }
    if (claudeMode === 'custom_duration') {
      const ms = claudeDays * 86400000 + claudeHours * 3600000 + claudeMinutes * 60000;
      if (ms <= 0) return null;
      return new Date(Date.now() + ms).toISOString();
    }
    return null;
  };

  // Compute final ISO target for Gemini from modal form
  const getGeminiTargetISO = (): string | null => {
    if (geminiMode === 'ready') return null;
    if (geminiMode === 'preset') {
      return new Date(Date.now() + geminiHours * 3600 * 1000).toISOString();
    }
    if (geminiMode === 'datetime') {
      return fromLocalDatetimeInput(geminiDatetime);
    }
    if (geminiMode === 'custom_duration') {
      const ms = geminiDays * 86400000 + geminiHours * 3600000 + geminiMinutes * 60000;
      if (ms <= 0) return null;
      return new Date(Date.now() + ms).toISOString();
    }
    return null;
  };

  // Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      toast.error('Mohon masukkan email atau nama akun');
      return;
    }

    const userEmail = user?.email || 'yosafatmiquel@gmail.com';
    const claudeTarget = getClaudeTargetISO();
    const geminiTarget = getGeminiTargetISO();

    if (editingAgent) {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          email_account: formEmail.trim(),
          claude_gpt_refresh_at: claudeTarget,
          gemini_refresh_at: geminiTarget,
        })
        .eq('id', editingAgent.id);

      if (error) {
        toast.error('Gagal memperbarui akun: ' + error.message);
        return;
      }
      toast.success('Akun AI berhasil diperbarui!');
    } else {
      const { error } = await supabase.from('ai_agents').insert({
        user_email: userEmail,
        email_account: formEmail.trim(),
        claude_gpt_refresh_at: claudeTarget,
        gemini_refresh_at: geminiTarget,
      });

      if (error) {
        toast.error('Gagal menambahkan akun: ' + error.message);
        return;
      }
      toast.success('Akun AI baru berhasil ditambahkan!');
    }

    setIsModalOpen(false);
    loadAgents();
  };

  // Execute Delete
  const executeDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('ai_agents').delete().eq('id', deleteId);
    if (error) {
      toast.error('Gagal menghapus akun: ' + error.message);
    } else {
      toast.success('Akun AI berhasil dihapus!');
      setAgents((prev) => prev.filter((a) => a.id !== deleteId));
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── Top Header & Title ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-primary">
              AI Command Radar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Agent Tracker
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Pantau limit akun Claude 3.5 Sonnet, GPT-4o, dan Google Gemini Pro secara presisi real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadAgents(true)}
            disabled={isRefreshing}
            className="h-10 px-3.5 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-xs font-bold text-foreground flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
            title="Sinkronisasi Data"
          >
            <svg
              className={`w-4 h-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="h-10 px-4 sm:px-5 rounded-2xl font-bold text-xs text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* ── Control Center Stats Bento ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Stat 1: Total Akun */}
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Akun AI</span>
            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              AI
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">{stats.total}</div>
            <p className="text-[10px] sm:text-[11px] text-muted mt-0.5 truncate">
              {stats.allReadyCount} Akun 100% Siap Pakai
            </p>
          </div>
        </div>

        {/* Stat 2: Claude / GPT Ready */}
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Claude / GPT</span>
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
              CL
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {stats.claudeReadyCount}
              </span>
              <span className="text-xs text-muted font-semibold">/ {stats.total} Ready</span>
            </div>
            <div className="w-full bg-surface-hover rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.claudeReadyCount / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat 3: Gemini Ready */}
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Gemini Pro</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
              GEM
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                {stats.geminiReadyCount}
              </span>
              <span className="text-xs text-muted font-semibold">/ {stats.total} Ready</span>
            </div>
            <div className="w-full bg-surface-hover rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.geminiReadyCount / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat 4: Fastest Cooldown */}
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Next In Queue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-foreground truncate">
              {stats.fastestAccount ? stats.fastestAccount.email_account : 'Semua Siap'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-500 font-mono mt-0.5 truncate font-semibold">
              {stats.fastestText}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari email / identitas akun..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:border-primary outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterType === 'all'
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setFilterType('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterType === 'ready'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ada Yang Ready</span>
          </button>
          <button
            onClick={() => setFilterType('cooldown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterType === 'cooldown'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Cooldown ({stats.cooldownCount})</span>
          </button>
          <button
            onClick={() => setFilterType('claude_ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterType === 'claude_ready'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'
            }`}
          >
            Claude Ready ({stats.claudeReadyCount})
          </button>
          <button
            onClick={() => setFilterType('gemini_ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterType === 'gemini_ready'
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25'
                : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border'
            }`}
          >
            Gemini Ready ({stats.geminiReadyCount})
          </button>
        </div>
      </div>

      {/* ── Main AI Accounts Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-muted font-mono animate-pulse">Menghubungkan ke Supabase AI Radar...</p>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAgents.map((ag) => {
            const isCopied = copiedEmail === ag.email_account;

            return (
              <motion.div
                key={ag.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between group relative overflow-hidden transition-all duration-300"
              >
                {/* Card Top: Identity Header */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4 pb-3.5 border-b border-border/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0 ring-2 ring-primary/20">
                        AI
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="text-sm sm:text-base font-bold text-foreground truncate"
                            style={{ fontFamily: 'var(--font-heading)' }}
                            title={ag.email_account}
                          >
                            {ag.email_account}
                          </h3>
                          <button
                            onClick={() => handleCopyEmail(ag.email_account)}
                            className="p-1 rounded-md text-muted hover:text-primary hover:bg-surface-hover transition-colors shrink-0"
                            title="Salin email akun"
                          >
                            {isCopied ? (
                              <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ag.isBothReady
                                ? 'bg-emerald-500'
                                : ag.isAnyReady
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {ag.isBothReady
                              ? 'Kedua Model Ready'
                              : ag.isAnyReady
                              ? '1 Model Ready'
                              : 'Semua Model Cooldown'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(ag)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer border border-transparent hover:border-border"
                        title="Edit Waktu Limit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(ag.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-danger/10 text-muted hover:text-danger transition-colors cursor-pointer border border-transparent hover:border-danger/20"
                        title="Hapus Akun"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Model 1: Anthropic Claude 3.5 & ChatGPT */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-surface/70 border border-border/80 hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                          <span className="text-xs font-bold text-foreground">Claude 3.5 / ChatGPT</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            ag.claude.isReady
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                              : 'bg-orange-500/15 text-orange-500 border-orange-500/25'
                          }`}
                        >
                          {ag.claude.statusBadge}
                        </span>
                      </div>

                      {/* Timer & Date Display */}
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <div className="font-mono font-extrabold text-foreground text-sm tracking-tight">
                            {ag.claude.countdownText}
                          </div>
                          <p className="text-[10px] text-muted font-medium mt-0.5">
                            {ag.claude.targetDateTimeText}
                          </p>
                        </div>

                        {/* Quick Action Presets */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                          <button
                            onClick={() => handleQuickReset(ag.id, 'claude_gpt', 3)}
                            className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-bold text-muted hover:text-foreground cursor-pointer transition-colors"
                            title="Set limit 3 jam (Siklus GPT-4o)"
                          >
                            +3j
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'claude_gpt', 5)}
                            className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-bold text-muted hover:text-foreground cursor-pointer transition-colors"
                            title="Set limit 5 jam (Siklus Claude 3.5)"
                          >
                            +5j
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'claude_gpt', 0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold text-emerald-500 cursor-pointer transition-colors border border-emerald-500/20"
                            title="Reset langsung ke Siap Pakai"
                          >
                            Ready
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Model 2: Google Gemini 1.5 Pro */}
                    <div className="p-3.5 rounded-2xl bg-surface/70 border border-border/80 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                          <span className="text-xs font-bold text-foreground">Google Gemini 1.5 Pro</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            ag.gemini.isReady
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                              : 'bg-blue-500/15 text-blue-500 border-blue-500/25'
                          }`}
                        >
                          {ag.gemini.statusBadge}
                        </span>
                      </div>

                      {/* Timer & Date Display */}
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div>
                          <div className="font-mono font-extrabold text-foreground text-sm tracking-tight">
                            {ag.gemini.countdownText}
                          </div>
                          <p className="text-[10px] text-muted font-medium mt-0.5">
                            {ag.gemini.targetDateTimeText}
                          </p>
                        </div>

                        {/* Quick Action Presets */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                          <button
                            onClick={() => handleQuickReset(ag.id, 'gemini', 5)}
                            className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-bold text-muted hover:text-foreground cursor-pointer transition-colors"
                            title="Set limit 5 jam"
                          >
                            +5j
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'gemini', 24)}
                            className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-bold text-muted hover:text-foreground cursor-pointer transition-colors"
                            title="Set limit 24 jam (Kuota Harian Gemini)"
                          >
                            +24j
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'gemini', 0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold text-emerald-500 cursor-pointer transition-colors border border-emerald-500/20"
                            title="Reset langsung ke Siap Pakai"
                          >
                            Ready
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Quick Custom Edit Trigger */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted">
                  <span className="font-mono text-[10px]">
                    ID: {ag.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => openEditModal(ag)}
                    className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Atur Tanggal Spesifik</span>
                    <span>→</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card py-16 text-center text-muted p-6 flex flex-col items-center justify-center rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-2xl mb-3 shadow-inner">
            🤖
          </div>
          <h4 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {searchQuery ? 'Tidak ada akun yang sesuai pencarian' : 'Belum ada akun AI yang dilacak'}
          </h4>
          <p className="text-xs max-w-sm mb-5 text-muted leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan akun dengan kata kunci "${searchQuery}". Coba ubah filter atau kata kunci.`
              : 'Tambahkan akun Claude, GPT, atau Gemini Anda untuk memantau waktu reset limit cooldown coding Anda.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-foreground hover:bg-surface-hover transition-colors"
            >
              Hapus Filter Pencarian
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Tambah Akun Pertama
            </button>
          )}
        </div>
      )}

      {/* ── Comprehensive Add / Edit Modal ───────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-card rounded-3xl p-5 sm:p-7 border border-border shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/60">
                <div>
                  <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                    {editingAgent ? 'Edit Status & Limit Akun AI' : 'Tambah Akun AI Baru'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Atur tanggal/waktu cooldown atau gunakan preset cepat.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email / Identitas */}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">
                    Identitas / Email Akun AI <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: dev-work@company.com atau Claude Pro #1"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground placeholder:text-muted/60 focus:border-primary outline-none transition-all"
                    autoFocus
                  />
                </div>

                {/* Section 1: Claude 3.5 & ChatGPT Configuration */}
                <div className="p-4 rounded-2xl bg-surface/80 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Cooldown Claude 3.5 / ChatGPT
                    </span>
                    <span className="text-[10px] font-mono text-muted">Anthropic Limit</span>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-surface-hover/80 rounded-xl text-[11px] font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => setClaudeMode('ready')}
                      className={`py-1.5 rounded-lg transition-all ${
                        claudeMode === 'ready'
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClaudeMode('preset');
                        setClaudeHours(5);
                      }}
                      className={`py-1.5 rounded-lg transition-all ${
                        claudeMode === 'preset'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaudeMode('custom_duration')}
                      className={`py-1.5 rounded-lg transition-all ${
                        claudeMode === 'custom_duration'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Durasi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClaudeMode('datetime');
                        if (!claudeDatetime) {
                          setClaudeDatetime(toLocalDatetimeInput(new Date(Date.now() + 5 * 3600000).toISOString()));
                        }
                      }}
                      className={`py-1.5 rounded-lg transition-all ${
                        claudeMode === 'datetime'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Tanggal
                    </button>
                  </div>

                  {/* Mode Content */}
                  {claudeMode === 'ready' && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold text-center">
                      ✓ Status akan diatur ke Siap Pakai (Tanpa Cooldown)
                    </div>
                  )}

                  {claudeMode === 'preset' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[1, 3, 5, 8, 24].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setClaudeHours(h)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            claudeHours === h
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-surface border border-border text-muted hover:text-foreground'
                          }`}
                        >
                          +{h} Jam {h === 5 ? '(Claude)' : h === 3 ? '(GPT)' : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {claudeMode === 'custom_duration' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Hari</label>
                        <input
                          type="number"
                          min={0}
                          value={claudeDays}
                          onChange={(e) => setClaudeDays(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Jam</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={claudeHours}
                          onChange={(e) => setClaudeHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Menit</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={claudeMinutes}
                          onChange={(e) => setClaudeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {claudeMode === 'datetime' && (
                    <div className="pt-1">
                      <label className="text-[10px] text-muted block mb-1">
                        Pilih Tanggal & Waktu Reset Spesifik
                      </label>
                      <input
                        type="datetime-local"
                        value={claudeDatetime}
                        onChange={(e) => setClaudeDatetime(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Section 2: Google Gemini Configuration */}
                <div className="p-4 rounded-2xl bg-surface/80 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Cooldown Google Gemini Pro
                    </span>
                    <span className="text-[10px] font-mono text-muted">Google AI Studio</span>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-surface-hover/80 rounded-xl text-[11px] font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => setGeminiMode('ready')}
                      className={`py-1.5 rounded-lg transition-all ${
                        geminiMode === 'ready'
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiMode('preset');
                        setGeminiHours(24);
                      }}
                      className={`py-1.5 rounded-lg transition-all ${
                        geminiMode === 'preset'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeminiMode('custom_duration')}
                      className={`py-1.5 rounded-lg transition-all ${
                        geminiMode === 'custom_duration'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Durasi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiMode('datetime');
                        if (!geminiDatetime) {
                          setGeminiDatetime(toLocalDatetimeInput(new Date(Date.now() + 24 * 3600000).toISOString()));
                        }
                      }}
                      className={`py-1.5 rounded-lg transition-all ${
                        geminiMode === 'datetime'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Tanggal
                    </button>
                  </div>

                  {/* Mode Content */}
                  {geminiMode === 'ready' && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold text-center">
                      ✓ Status akan diatur ke Siap Pakai (Tanpa Cooldown)
                    </div>
                  )}

                  {geminiMode === 'preset' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[1, 5, 24, 48, 72].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setGeminiHours(h)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            geminiHours === h
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-surface border border-border text-muted hover:text-foreground'
                          }`}
                        >
                          +{h} Jam {h === 24 ? '(Daily Quota)' : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {geminiMode === 'custom_duration' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Hari</label>
                        <input
                          type="number"
                          min={0}
                          value={geminiDays}
                          onChange={(e) => setGeminiDays(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Jam</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={geminiHours}
                          onChange={(e) => setGeminiHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted block mb-1">Menit</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={geminiMinutes}
                          onChange={(e) => setGeminiMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {geminiMode === 'datetime' && (
                    <div className="pt-1">
                      <label className="text-[10px] text-muted block mb-1">
                        Pilih Tanggal & Waktu Reset Spesifik
                      </label>
                      <input
                        type="datetime-local"
                        value={geminiDatetime}
                        onChange={(e) => setGeminiDatetime(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {editingAgent ? 'Simpan Perubahan' : 'Tambah Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Akun AI Tracker?"
        message="Akun AI dan data limit cooldown-nya akan dihapus permanen dari Supabase."
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
