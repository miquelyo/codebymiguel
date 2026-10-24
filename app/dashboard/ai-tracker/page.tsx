'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

/* ─── Types ──────────────────────────────────────────────── */
interface AIAgent {
  id: string; user_email?: string; email_account: string;
  gemini_refresh_at: string | null; claude_gpt_refresh_at: string | null; created_at?: string;
}
interface CooldownInfo { isReady: boolean; countdownText: string; targetDateTimeText: string; progressPercent: number; diffMs: number; }

/* ─── Helpers ────────────────────────────────────────────── */
function parseCooldown(targetStr: string | null, nowMs: number): CooldownInfo {
  if (!targetStr) return { isReady: true, countdownText: 'Siap Pakai', targetDateTimeText: 'Tidak ada batasan', progressPercent: 0, diffMs: 0 };
  const targetMs = new Date(targetStr).getTime(); const diffMs = targetMs - nowMs;
  const fd = new Date(targetStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (isNaN(targetMs) || diffMs <= 0) return { isReady: true, countdownText: 'Siap Pakai', targetDateTimeText: 'Selesai sejak ' + fd, progressPercent: 0, diffMs: 0 };
  const ts = Math.floor(diffMs / 1000); const dv = Math.floor(ts / 86400); const hv = Math.floor((ts % 86400) / 3600); const mv = Math.floor((ts % 3600) / 60); const sv = ts % 60;
  const ct = dv > 0 ? (dv + 'h ' + hv + 'j ' + mv + 'm') : hv > 0 ? (hv + 'j ' + mv + 'm ' + sv + 'd') : (mv + 'm ' + sv + 'd');
  return { isReady: false, countdownText: ct, targetDateTimeText: 'Reset: ' + fd + ' WIB', progressPercent: Math.min(100, Math.max(5, Math.round((diffMs / Math.max(diffMs, 86400000)) * 100))), diffMs };
}
function toLocal(s: string | null): string { if (!s) return ''; const d = new Date(s); return isNaN(d.getTime()) ? '' : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function fromLocal(s: string): string | null { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString(); }

/* ─── StatusPill ─────────────────────────────────────────── */
function StatusPill({ isReady, text }: { isReady: boolean; text?: string }) {
  return (
    <span className={[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold',
      isReady
        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400'
        : 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400',
    ].join(' ')}>
      <span className={['w-1.5 h-1.5 rounded-full', isReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'].join(' ')} />
      {text ?? (isReady ? 'READY' : 'COOLDOWN')}
    </span>
  );
}

/* ─── ModelRow ───────────────────────────────────────────── */
function ModelRow({ label, dotColor, barColor, cooldown, agentId, model, onQuickReset, presets }: {
  label: string; dotColor: string; barColor: string; cooldown: CooldownInfo; agentId: string;
  model: 'claude_gpt' | 'gemini'; onQuickReset: (id: string, m: 'claude_gpt' | 'gemini', h: number) => void; presets: number[];
}) {
  return (
    <div className={['rounded-2xl border transition-all', cooldown.isReady ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface border-border'].join(' ')}>
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={['w-2 h-2 rounded-full', cooldown.isReady ? 'bg-emerald-500 animate-pulse' : dotColor].join(' ')} />
          <span className="text-[13px] font-semibold text-foreground">{label}</span>
        </div>
        <StatusPill isReady={cooldown.isReady} />
      </div>
      <div className="px-4 pb-3">
        {cooldown.isReady ? (
          <span className="text-2xl font-black text-emerald-500 font-mono">✓ Siap Pakai</span>
        ) : (
          <>
            <div className="font-mono font-black text-2xl sm:text-3xl text-foreground tracking-tight">{cooldown.countdownText}</div>
            <p className="text-[11px] text-muted mt-0.5">{cooldown.targetDateTimeText}</p>
            <div className="mt-2.5 h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <motion.div className={['h-full rounded-full', barColor].join(' ')} initial={{ width: 0 }} animate={{ width: cooldown.progressPercent + '%' }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-4 pb-3.5 flex-wrap">
        <span className="text-[10px] text-muted font-semibold mr-1">Set:</span>
        {presets.map((h) => (
          <button key={h} onClick={() => onQuickReset(agentId, model, h)} className="px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-border text-[11px] font-bold text-muted hover:text-foreground cursor-pointer transition-all active:scale-95">
            +{h}j
          </button>
        ))}
        <button onClick={() => onQuickReset(agentId, model, 0)} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-bold text-emerald-500 cursor-pointer transition-all active:scale-95 border border-emerald-500/20">
          ✓ Ready
        </button>
      </div>
    </div>
  );
}

/* ─── ModeSelector ───────────────────────────────────────── */
type CooldownMode = 'ready' | 'preset' | 'custom_duration' | 'datetime';
const MODE_LABELS: Record<CooldownMode, string> = { ready: 'Ready', preset: 'Preset', custom_duration: 'Durasi', datetime: 'Tanggal' };

function ModeSelector({ value, onChange, accentClass }: { value: CooldownMode; onChange: (v: CooldownMode) => void; accentClass: string }) {
  return (
    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-hover/60 text-[11px] font-semibold text-center">
      {(Object.keys(MODE_LABELS) as CooldownMode[]).map((k) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={['py-1.5 rounded-lg transition-all cursor-pointer', value === k ? (k === 'ready' ? 'bg-emerald-500 text-white shadow-sm' : accentClass + ' text-white shadow-sm') : 'text-muted hover:text-foreground'].join(' ')}>
          {MODE_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

/* ─── DurationInputs ─────────────────────────────────────── */
function DurationInputs({ days, hours, minutes, setDays, setHours, setMinutes }: {
  days: number; hours: number; minutes: number;
  setDays: (v: number) => void; setHours: (v: number) => void; setMinutes: (v: number) => void;
}) {
  const fields = [{ label: 'Hari', val: days, set: setDays, max: 30 }, { label: 'Jam', val: hours, set: setHours, max: 23 }, { label: 'Menit', val: minutes, set: setMinutes, max: 59 }];
  return (
    <div className="grid grid-cols-3 gap-2">
      {fields.map(({ label, val, set, max }) => (
        <div key={label}>
          <label className="text-[10px] text-muted block mb-1">{label}</label>
          <input type="number" min={0} max={max} value={val} onChange={(e) => set(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-xs text-foreground font-mono outline-none focus:border-violet-500/60" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AITrackerPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'cooldown'>('all');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [claudeMode, setClaudeMode] = useState<CooldownMode>('ready');
  const [claudeHours, setClaudeHours] = useState(5);
  const [claudeDays, setClaudeDays] = useState(0);
  const [claudeMinutes, setClaudeMinutes] = useState(0);
  const [claudeDatetime, setClaudeDatetime] = useState('');
  const [geminiMode, setGeminiMode] = useState<CooldownMode>('ready');
  const [geminiHours, setGeminiHours] = useState(24);
  const [geminiDays, setGeminiDays] = useState(0);
  const [geminiMinutes, setGeminiMinutes] = useState(0);
  const [geminiDatetime, setGeminiDatetime] = useState('');

  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 1000); return () => clearInterval(t); }, []);

  const loadAgents = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const eq = user?.email || 'yosafatmiquel@gmail.com';
      let q = supabase.from('ai_agents').select('*');
      q = (user?.role === 'Super Admin' || eq === 'yosafatmiquel@gmail.com')
        ? q.or('user_email.eq.' + eq + ',user_email.eq.yosafatmiquel@gmail.com,user_email.is.null')
        : q.or('user_email.eq.' + eq + ',user_email.eq.yosafatmiquel@gmail.com');
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) toast.error('Gagal: ' + error.message);
      else { setAgents(data || []); if (showToast) toast.success('Data diperbarui!'); }
    } catch { /* noop */ } finally { setLoading(false); setIsRefreshing(false); }
  }, [user]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const parsedAgents = useMemo(() => agents.map((ag) => {
    const claude = parseCooldown(ag.claude_gpt_refresh_at, nowMs);
    const gemini = parseCooldown(ag.gemini_refresh_at, nowMs);
    const isBothReady = claude.isReady && gemini.isReady;
    const isAnyReady = claude.isReady || gemini.isReady;
    const isBothCooldown = !claude.isReady && !gemini.isReady;
    let nextMs = Infinity;
    if (!claude.isReady && claude.diffMs > 0) nextMs = Math.min(nextMs, claude.diffMs);
    if (!gemini.isReady && gemini.diffMs > 0) nextMs = Math.min(nextMs, gemini.diffMs);
    return { ...ag, claude, gemini, isBothReady, isAnyReady, isBothCooldown, nextAvailableMs: nextMs === Infinity ? 0 : nextMs };
  }), [agents, nowMs]);

  const stats = useMemo(() => {
    const total = parsedAgents.length;
    const claudeReady = parsedAgents.filter((a) => a.claude.isReady).length;
    const geminiReady = parsedAgents.filter((a) => a.gemini.isReady).length;
    const allReady = parsedAgents.filter((a) => a.isBothReady).length;
    const fastest = parsedAgents.filter((a) => !a.isBothReady && a.nextAvailableMs > 0).sort((a, b) => a.nextAvailableMs - b.nextAvailableMs)[0] || null;
    return { total, claudeReady, geminiReady, allReady, fastest };
  }, [parsedAgents]);

  const filteredAgents = useMemo(() => parsedAgents.filter((ag) => {
    if (!ag.email_account.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType === 'ready') return ag.isAnyReady;
    if (filterType === 'cooldown') return ag.isBothCooldown;
    return true;
  }), [parsedAgents, searchQuery, filterType]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email disalin!');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleQuickReset = async (agentId: string, model: 'claude_gpt' | 'gemini', hours: number) => {
    const target = hours > 0 ? new Date(Date.now() + hours * 3600000).toISOString() : null;
    const updates: Record<string, string | null> = {};
    if (model === 'claude_gpt') updates.claude_gpt_refresh_at = target;
    if (model === 'gemini') updates.gemini_refresh_at = target;
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, ...updates } : a)));
    const { error } = await supabase.from('ai_agents').update(updates).eq('id', agentId);
    if (error) { toast.error('Gagal: ' + error.message); loadAgents(); }
    else toast.success(hours > 0 ? 'Set +' + hours + 'j berhasil!' : 'Direset ke Siap Pakai!');
  };

  const resetForm = () => {
    setFormEmail('');
    setClaudeMode('ready'); setClaudeHours(5); setClaudeDays(0); setClaudeMinutes(0); setClaudeDatetime('');
    setGeminiMode('ready'); setGeminiHours(24); setGeminiDays(0); setGeminiMinutes(0); setGeminiDatetime('');
  };

  const openAddModal = () => { setEditingAgent(null); resetForm(); setIsModalOpen(true); };

  const openEditModal = (ag: AIAgent) => {
    setEditingAgent(ag); setFormEmail(ag.email_account);
    if (!ag.claude_gpt_refresh_at || new Date(ag.claude_gpt_refresh_at).getTime() <= Date.now()) {
      setClaudeMode('ready'); setClaudeHours(5); setClaudeDays(0); setClaudeMinutes(0); setClaudeDatetime('');
    } else { setClaudeMode('datetime'); setClaudeDatetime(toLocal(ag.claude_gpt_refresh_at)); }
    if (!ag.gemini_refresh_at || new Date(ag.gemini_refresh_at).getTime() <= Date.now()) {
      setGeminiMode('ready'); setGeminiHours(24); setGeminiDays(0); setGeminiMinutes(0); setGeminiDatetime('');
    } else { setGeminiMode('datetime'); setGeminiDatetime(toLocal(ag.gemini_refresh_at)); }
    setIsModalOpen(true);
  };

  const getClaudeISO = (): string | null => {
    if (claudeMode === 'ready') return null;
    if (claudeMode === 'preset') return new Date(Date.now() + claudeHours * 3600000).toISOString();
    if (claudeMode === 'datetime') return fromLocal(claudeDatetime);
    const ms = claudeDays * 86400000 + claudeHours * 3600000 + claudeMinutes * 60000;
    return ms <= 0 ? null : new Date(Date.now() + ms).toISOString();
  };
  const getGeminiISO = (): string | null => {
    if (geminiMode === 'ready') return null;
    if (geminiMode === 'preset') return new Date(Date.now() + geminiHours * 3600000).toISOString();
    if (geminiMode === 'datetime') return fromLocal(geminiDatetime);
    const ms = geminiDays * 86400000 + geminiHours * 3600000 + geminiMinutes * 60000;
    return ms <= 0 ? null : new Date(Date.now() + ms).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) { toast.error('Masukkan email atau nama akun'); return; }
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';
    const payload = { email_account: formEmail.trim(), claude_gpt_refresh_at: getClaudeISO(), gemini_refresh_at: getGeminiISO() };
    if (editingAgent) {
      const { error } = await supabase.from('ai_agents').update(payload).eq('id', editingAgent.id);
      if (error) { toast.error('Gagal: ' + error.message); return; }
      toast.success('Akun diperbarui!');
    } else {
      const { error } = await supabase.from('ai_agents').insert({ user_email: userEmail, ...payload });
      if (error) { toast.error('Gagal: ' + error.message); return; }
      toast.success('Akun baru ditambahkan!');
    }
    setIsModalOpen(false); loadAgents();
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('ai_agents').delete().eq('id', deleteId);
    if (error) toast.error('Gagal: ' + error.message);
    else { toast.success('Akun dihapus!'); setAgents((prev) => prev.filter((a) => a.id !== deleteId)); }
    setDeleteId(null);
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-5 sm:space-y-6 pb-12">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-sm shadow-violet-500/50" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-muted">AI Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Agent Tracker
          </h1>
          <p className="text-sm text-muted mt-1">Pantau cooldown Claude, ChatGPT &amp; Gemini secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => loadAgents(true)} disabled={isRefreshing}
            className="h-10 w-10 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-muted hover:text-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50" title="Refresh">
            <svg className={['w-4 h-4', isRefreshing ? 'animate-spin' : ''].join(' ')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button onClick={openAddModal}
            className="h-10 px-5 rounded-2xl font-bold text-sm text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Akun
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Akun</span>
          <span className="text-3xl font-black text-foreground font-mono">{stats.total}</span>
          <span className="text-[11px] text-muted">{stats.allReady} semua ready</span>
        </div>
        <div className="card p-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Claude/GPT</span>
            <span className="w-5 h-5 rounded-lg bg-orange-500/15 flex items-center justify-center text-[9px] font-black text-orange-500">C</span>
          </div>
          <span className="text-3xl font-black text-foreground font-mono">{stats.claudeReady}</span>
          <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: (stats.total > 0 ? (stats.claudeReady / stats.total) * 100 : 0) + '%' }} />
          </div>
          <span className="text-[11px] text-muted">dari {stats.total} ready</span>
        </div>
        <div className="card p-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Gemini</span>
            <span className="w-5 h-5 rounded-lg bg-blue-500/15 flex items-center justify-center text-[9px] font-black text-blue-500">G</span>
          </div>
          <span className="text-3xl font-black text-foreground font-mono">{stats.geminiReady}</span>
          <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: (stats.total > 0 ? (stats.geminiReady / stats.total) * 100 : 0) + '%' }} />
          </div>
          <span className="text-[11px] text-muted">dari {stats.total} ready</span>
        </div>
        <div className="card p-4 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Berikutnya</span>
          {stats.fastest ? (
            <>
              <span className="text-sm font-bold text-foreground truncate">{stats.fastest.email_account.split('@')[0]}</span>
              <span className="text-[11px] font-mono text-violet-500 font-semibold">
                {(() => { const sv = Math.floor(stats.fastest.nextAvailableMs / 1000); const hv = Math.floor(sv / 3600), mv = Math.floor((sv % 3600) / 60), sec = sv % 60; return hv > 0 ? hv + 'j ' + mv + 'm' : mv + 'm ' + sec + 'd'; })()}
              </span>
              <span className="text-[10px] text-muted">menuju ready</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🎉</span>
              <span className="text-sm font-bold text-emerald-500">Semua Siap!</span>
            </>
          )}
        </div>
      </div>

      {/* ── Search & Filter ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari akun..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted/60 focus:border-violet-500/50 outline-none transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted hover:text-foreground rounded-full hover:bg-surface-hover">✕</button>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['all', 'ready', 'cooldown'] as const).map((f) => (
            <button key={f} onClick={() => setFilterType(f)}
              className={['px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                filterType === f
                  ? f === 'all' ? 'bg-foreground text-background shadow-sm' : f === 'ready' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              ].join(' ')}>
              {f === 'all' ? 'Semua (' + stats.total + ')' : f === 'ready' ? '● Ready' : '⏱ Cooldown'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards ────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs text-muted font-mono animate-pulse">Menghubungkan ke AI Radar...</p>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAgents.map((ag, idx) => (
              <motion.div key={ag.id} layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="card rounded-3xl overflow-hidden">

                {/* Card Header */}
                <div className={['px-5 pt-5 pb-4 border-b border-border/60', ag.isBothReady ? 'bg-emerald-500/5' : ''].join(' ')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={['w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shrink-0 shadow-md',
                        ag.isBothReady ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : ag.isAnyReady ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                          : 'bg-gradient-to-br from-violet-600 to-indigo-700'
                      ].join(' ')}>
                        {ag.email_account.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate max-w-[150px] sm:max-w-[220px]" title={ag.email_account}>
                            {ag.email_account}
                          </h3>
                          <button onClick={() => handleCopyEmail(ag.email_account)}
                            className="p-1 rounded-lg text-muted hover:text-violet-500 hover:bg-violet-500/10 transition-all shrink-0" title="Salin email">
                            {copiedEmail === ag.email_account
                              ? <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            }
                          </button>
                        </div>
                        <div className="mt-1">
                          <StatusPill isReady={ag.isBothReady} text={ag.isBothReady ? 'SEMUA READY' : ag.isAnyReady ? '1 READY' : 'COOLDOWN'} />
                        </div>
                      </div>
                    </div>
                    {/* Edit/Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditModal(ag)} title="Edit"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-violet-500 hover:bg-violet-500/10 transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button onClick={() => setDeleteId(ag.id)} title="Hapus"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Model Rows */}
                <div className="p-4 sm:p-5 space-y-3">
                  <ModelRow label="Claude 3.5 / ChatGPT" dotColor="bg-orange-500" barColor="bg-orange-500" cooldown={ag.claude} agentId={ag.id} model="claude_gpt" onQuickReset={handleQuickReset} presets={[3, 5, 8]} />
                  <ModelRow label="Google Gemini 1.5 Pro" dotColor="bg-blue-500" barColor="bg-blue-500" cooldown={ag.gemini} agentId={ag.id} model="gemini" onQuickReset={handleQuickReset} presets={[5, 24, 48]} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card py-16 px-6 flex flex-col items-center text-center rounded-3xl">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center text-3xl mb-4">🤖</div>
          <h4 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {searchQuery ? 'Tidak ditemukan' : 'Belum ada akun AI'}
          </h4>
          <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
            {searchQuery ? 'Tidak ada akun dengan kata kunci "' + searchQuery + '".' : 'Tambahkan akun Claude, GPT, atau Gemini untuk mulai memantau cooldown.'}
          </p>
          {searchQuery
            ? <button onClick={() => { setSearchQuery(''); setFilterType('all'); }} className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-surface-hover transition-colors">Hapus Pencarian</button>
            : <button onClick={openAddModal} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer shadow-md" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>Tambah Akun Pertama</button>
          }
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 48 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-border shadow-2xl z-10 max-h-[92vh] overflow-y-auto">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                    {editingAgent ? '✏️ Edit Akun AI' : '➕ Tambah Akun AI'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Atur waktu cooldown per model</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Email / Nama Akun <span className="text-red-500">*</span></label>
                  <input type="text" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="contoh: claude-work@gmail.com" autoFocus
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground placeholder:text-muted/50 focus:border-violet-500/60 outline-none transition-all" />
                </div>

                {/* Claude Section */}
                <div className="rounded-2xl border border-border bg-surface/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-bold text-foreground">Claude 3.5 / ChatGPT</span>
                    <span className="text-[10px] font-mono text-muted ml-auto">Anthropic</span>
                  </div>
                  <ModeSelector value={claudeMode} onChange={(v) => { setClaudeMode(v); if (v === 'datetime' && !claudeDatetime) setClaudeDatetime(toLocal(new Date(Date.now() + 5 * 3600000).toISOString())); }} accentClass="bg-violet-600" />
                  {claudeMode === 'ready' && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">✓ Akan diatur ke Siap Pakai</div>}
                  {claudeMode === 'preset' && (
                    <div className="flex flex-wrap gap-2">
                      {[1, 3, 5, 8, 24].map((h) => (
                        <button key={h} type="button" onClick={() => setClaudeHours(h)}
                          className={['px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all', claudeHours === h ? 'bg-orange-500 text-white' : 'bg-surface border border-border text-muted hover:text-foreground'].join(' ')}>
                          +{h}j {h === 5 ? '(Claude)' : h === 3 ? '(GPT)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {claudeMode === 'custom_duration' && <DurationInputs days={claudeDays} hours={claudeHours} minutes={claudeMinutes} setDays={setClaudeDays} setHours={setClaudeHours} setMinutes={setClaudeMinutes} />}
                  {claudeMode === 'datetime' && <input type="datetime-local" value={claudeDatetime} onChange={(e) => setClaudeDatetime(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-foreground font-mono outline-none focus:border-violet-500/60" />}
                </div>

                {/* Gemini Section */}
                <div className="rounded-2xl border border-border bg-surface/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-bold text-foreground">Google Gemini 1.5 Pro</span>
                    <span className="text-[10px] font-mono text-muted ml-auto">Google AI</span>
                  </div>
                  <ModeSelector value={geminiMode} onChange={(v) => { setGeminiMode(v); if (v === 'datetime' && !geminiDatetime) setGeminiDatetime(toLocal(new Date(Date.now() + 24 * 3600000).toISOString())); }} accentClass="bg-blue-600" />
                  {geminiMode === 'ready' && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">✓ Akan diatur ke Siap Pakai</div>}
                  {geminiMode === 'preset' && (
                    <div className="flex flex-wrap gap-2">
                      {[1, 5, 24, 48, 72].map((h) => (
                        <button key={h} type="button" onClick={() => setGeminiHours(h)}
                          className={['px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all', geminiHours === h ? 'bg-blue-500 text-white' : 'bg-surface border border-border text-muted hover:text-foreground'].join(' ')}>
                          +{h}j {h === 24 ? '(Daily)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {geminiMode === 'custom_duration' && <DurationInputs days={geminiDays} hours={geminiHours} minutes={geminiMinutes} setDays={setGeminiDays} setHours={setGeminiHours} setMinutes={setGeminiMinutes} />}
                  {geminiMode === 'datetime' && <input type="datetime-local" value={geminiDatetime} onChange={(e) => setGeminiDatetime(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-foreground font-mono outline-none focus:border-violet-500/60" />}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted border border-border hover:bg-surface-hover cursor-pointer transition-all">
                    Batal
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {editingAgent ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={!!deleteId} title="Hapus Akun AI?" message="Data akun dan cooldown-nya akan dihapus permanen." onConfirm={executeDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

