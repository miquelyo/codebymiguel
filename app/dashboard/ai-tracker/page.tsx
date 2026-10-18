'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

interface AIAgent {
  id: string;
  email_account: string;
  gemini_refresh_at: string | null;
  claude_gpt_refresh_at: string | null;
}

function formatRemaining(targetStr: string | null) {
  if (!targetStr) return { isReady: true, text: 'Ready (Siap Pakai)', percent: 100 };
  const target = new Date(targetStr).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { isReady: true, text: 'Ready (Selesai Cooldown)', percent: 100 };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const text = hours > 0 ? `${hours}j ${minutes}m ${seconds}d` : `${minutes}m ${seconds}d`;
  // calculate approx percent assuming max 24h
  const percent = Math.max(0, Math.min(100, Math.round((diff / (24 * 60 * 60 * 1000)) * 100)));
  return { isReady: false, text, percent };
}

export default function AITrackerPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, setTicker] = useState(0);

  const [form, setForm] = useState({
    email_account: '',
    gemini_days: 0,
    gemini_hours: 0,
    claude_gpt_days: 0,
    claude_gpt_hours: 0,
  });

  // 1-second ticker for smooth countdown
  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const emailToQuery = user?.email || 'yosafatmiquel@gmail.com';
    const { data } = await supabase
      .from('ai_agents')
      .select('*')
      .or(`user_email.eq.${emailToQuery},user_email.eq.yosafatmiquel@gmail.com`)
      .order('created_at', { ascending: false });
    setAgents(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userEmail = user?.email || 'yosafatmiquel@gmail.com';

    const getFutureTime = (days: number, hours: number) => {
      if (days === 0 && hours === 0) return null;
      const ms = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
      return new Date(Date.now() + ms).toISOString();
    };

    const geminiTarget = getFutureTime(form.gemini_days, form.gemini_hours);
    const claudeGptTarget = getFutureTime(form.claude_gpt_days, form.claude_gpt_hours);

    if (editingId) {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          email_account: form.email_account,
          gemini_refresh_at: geminiTarget,
          claude_gpt_refresh_at: claudeGptTarget,
        })
        .eq('id', editingId);

      if (error) {
        toast.error('Gagal memperbarui: ' + error.message);
        return;
      }
      toast.success('Limit AI berhasil diperbarui!');
    } else {
      const { error } = await supabase.from('ai_agents').insert({
        user_email: userEmail,
        email_account: form.email_account,
        gemini_refresh_at: geminiTarget,
        claude_gpt_refresh_at: claudeGptTarget,
      });

      if (error) {
        toast.error('Gagal menambahkan akun: ' + error.message);
        return;
      }
      toast.success('Akun AI baru berhasil ditambahkan!');
    }

    setForm({ email_account: '', gemini_days: 0, gemini_hours: 0, claude_gpt_days: 0, claude_gpt_hours: 0 });
    setEditingId(null);
    setIsModalOpen(false);
    loadAgents();
  };

  const handleQuickReset = async (agentId: string, type: 'gemini' | 'claude_gpt' | 'both', hours: number) => {
    const target = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
    const updates: Record<string, string | null> = {};
    if (type === 'gemini' || type === 'both') updates.gemini_refresh_at = target;
    if (type === 'claude_gpt' || type === 'both') updates.claude_gpt_refresh_at = target;

    const { error } = await supabase.from('ai_agents').update(updates).eq('id', agentId);
    if (error) {
      toast.error('Gagal reset timer: ' + error.message);
    } else {
      toast.success(hours > 0 ? `Timer diatur ${hours} jam dari sekarang!` : 'Status direset ke Ready!');
      loadAgents();
    }
  };

  const handleEdit = (ag: AIAgent) => {
    const getRemaining = (targetStr: string | null) => {
      if (!targetStr) return { days: 0, hours: 0 };
      const diff = new Date(targetStr).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0 };
      const totalHours = Math.round(diff / (1000 * 60 * 60));
      return {
        days: Math.floor(totalHours / 24),
        hours: totalHours % 24,
      };
    };

    const geminiRem = getRemaining(ag.gemini_refresh_at);
    const claudeRem = getRemaining(ag.claude_gpt_refresh_at);

    setForm({
      email_account: ag.email_account,
      gemini_days: geminiRem.days,
      gemini_hours: geminiRem.hours,
      claude_gpt_days: claudeRem.days,
      claude_gpt_hours: claudeRem.hours,
    });
    setEditingId(ag.id);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('ai_agents').delete().eq('id', deleteId);
    if (error) {
      toast.error('Gagal menghapus akun AI!');
    } else {
      toast.success('Akun AI berhasil dihapus!');
    }
    setDeleteId(null);
    loadAgents();
  };

  const openNew = () => {
    setForm({ email_account: '', gemini_days: 0, gemini_hours: 0, claude_gpt_days: 0, claude_gpt_hours: 0 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Agent Tracker
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Monitor countdown rate limit Claude 3.5, GPT-4o, dan Gemini di berbagai akun coding Anda.
          </p>
        </div>

        <button
          onClick={openNew}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tambah Akun AI Baru</span>
        </button>
      </div>

      {/* ── Account Cards Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {agents.map((ag) => {
            const claudeInfo = formatRemaining(ag.claude_gpt_refresh_at);
            const geminiInfo = formatRemaining(ag.gemini_refresh_at);

            return (
              <motion.div
                key={ag.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Account Header */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        AI
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                          {ag.email_account}
                        </h3>
                        <p className="text-[11px] text-muted font-mono">Multi-Model Account</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(ag)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Limit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(ag.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/10 text-muted hover:text-danger transition-colors cursor-pointer"
                        title="Hapus Akun"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Two Model Progress Blocks */}
                  <div className="space-y-4">
                    {/* Claude / GPT */}
                    <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-xs font-bold text-foreground">Claude 3.5 / ChatGPT</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          claudeInfo.isReady
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            : 'bg-orange-500/15 text-orange-500 border border-orange-500/20'
                        }`}>
                          {claudeInfo.isReady ? 'READY' : 'COOLDOWN'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="font-mono font-bold text-foreground text-xs sm:text-sm">{claudeInfo.text}</span>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            onClick={() => handleQuickReset(ag.id, 'claude_gpt', 5)}
                            className="px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-semibold text-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            Set 5 Jam
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'claude_gpt', 0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-semibold text-emerald-500 cursor-pointer transition-colors"
                          >
                            Reset Ready
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gemini */}
                    <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-foreground">Google Gemini 1.5 Pro</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          geminiInfo.isReady
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            : 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                        }`}>
                          {geminiInfo.isReady ? 'READY' : 'COOLDOWN'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="font-mono font-bold text-foreground text-xs sm:text-sm">{geminiInfo.text}</span>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            onClick={() => handleQuickReset(ag.id, 'gemini', 24)}
                            className="px-2.5 py-1 rounded-lg bg-surface-hover hover:bg-border text-[10px] font-semibold text-muted hover:text-foreground cursor-pointer transition-colors"
                          >
                            Set 24 Jam
                          </button>
                          <button
                            onClick={() => handleQuickReset(ag.id, 'gemini', 0)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-semibold text-emerald-500 cursor-pointer transition-colors"
                          >
                            Reset Ready
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card py-16 text-center text-muted p-6 flex flex-col items-center justify-center">
          <svg className="w-10 h-10 text-muted/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h4 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Belum ada akun AI yang dilacak
          </h4>
          <p className="text-xs max-w-sm mb-4">
            Tambahkan akun Claude, GPT, atau Gemini Anda untuk memantau waktu reset limit.
          </p>
          <button
            onClick={openNew}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Tambah Akun Pertama
          </button>
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-card rounded-3xl p-6 sm:p-7 border border-border shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/60">
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {editingId ? 'Edit Akun AI Tracker' : 'Tambah Akun AI Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Identitas / Email Akun</label>
                  <input
                    type="text"
                    required
                    value={form.email_account}
                    onChange={(e) => setForm({ ...form, email_account: e.target.value })}
                    placeholder="Contoh: dev-work@company.com atau Claude Pro #1"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground placeholder:text-muted/60 focus:border-primary outline-none"
                    autoFocus
                  />
                </div>

                {/* Claude / GPT Cooldown config */}
                <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Cooldown Claude / GPT-4o
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted block mb-1">Hari</label>
                      <input
                        type="number"
                        min={0}
                        value={form.claude_gpt_days}
                        onChange={(e) => setForm({ ...form, claude_gpt_days: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted block mb-1">Jam</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={form.claude_gpt_hours}
                        onChange={(e) => setForm({ ...form, claude_gpt_hours: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Gemini Cooldown config */}
                <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Cooldown Google Gemini
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted block mb-1">Hari</label>
                      <input
                        type="number"
                        min={0}
                        value={form.gemini_days}
                        onChange={(e) => setForm({ ...form, gemini_days: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted block mb-1">Jam</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={form.gemini_hours}
                        onChange={(e) => setForm({ ...form, gemini_hours: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    Simpan Akun
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
        title="Hapus Akun AI?"
        message="Akun AI dan data limit timer-nya akan dihapus permanen."
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
