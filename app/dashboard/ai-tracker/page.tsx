'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';

interface AIAgent {
  id: string;
  email_account: string;
  gemini_refresh_at: string | null;
  claude_gpt_refresh_at: string | null;
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Fungsi pembantu untuk memformat waktu tersisa
function getRemainingTimeStatus(targetDateStr: string | null) {
  if (!targetDateStr) return { isAvailable: true, text: 'Tersedia' };
  
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { isAvailable: true, text: 'Tersedia' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let text = '';
  if (days > 0) text += `${days}hr `;
  if (hours > 0) text += `${hours}j `;
  if (days === 0 && hours === 0) text += `${mins}m`;
  
  return { isAvailable: false, text: text.trim() + ' lagi' };
}

export default function AITrackerPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Ticker untuk update UI countdown tiap menit
  const [, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const [form, setForm] = useState({
    email_account: '',
    gemini_days: 0,
    gemini_hours: 0,
    claude_gpt_days: 0,
    claude_gpt_hours: 0,
  });

  const loadAgents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });
    setAgents(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Kalkulasi future timestamp
    const getFutureTime = (days: number, hours: number) => {
      if (days === 0 && hours === 0) return null;
      const ms = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000);
      return new Date(Date.now() + ms).toISOString();
    };

    const geminiTarget = getFutureTime(form.gemini_days, form.gemini_hours);
    const claudeGptTarget = getFutureTime(form.claude_gpt_days, form.claude_gpt_hours);

    if (editingId) {
      const { error } = await supabase.from('ai_agents').update({
        email_account: form.email_account,
        gemini_refresh_at: geminiTarget,
        claude_gpt_refresh_at: claudeGptTarget,
      }).eq('id', editingId);
      
      if (error) {
        alert('Gagal update: ' + error.message);
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase.from('ai_agents').insert({
        user_email: user.email,
        email_account: form.email_account,
        gemini_refresh_at: geminiTarget,
        claude_gpt_refresh_at: claudeGptTarget,
      });

      if (error) {
        alert('Gagal menyimpan: ' + error.message);
        console.error(error);
        return;
      }
    }

    setForm({ email_account: '', gemini_days: 0, gemini_hours: 0, claude_gpt_days: 0, claude_gpt_hours: 0 });
    setEditingId(null);
    setIsModalOpen(false);
    loadAgents();
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

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus akun ini?')) return;
    await supabase.from('ai_agents').delete().eq('id', id);
    loadAgents();
  };

  const openNew = () => {
    setForm({ email_account: '', gemini_days: 0, gemini_hours: 0, claude_gpt_days: 0, claude_gpt_hours: 0 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl space-y-6 pb-10 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 bg-card rounded-[24px] border border-border shadow-sm glass relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <SparklesIcon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-info">Monitoring</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Agent Tracker
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Pantau limit akun AI Anda. Masukkan berapa lama lagi limit akan di-refresh, sistem akan otomatis menghitung mundur!
          </p>
        </div>
        
        <button
          onClick={openNew}
          className="relative z-10 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-info/30 hover:-translate-y-0.5 transition-all w-full md:w-auto"
          style={{ background: 'var(--info)' }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Akun</span>
        </button>
      </motion.div>

      <div className="bg-card rounded-[24px] border border-border shadow-sm overflow-x-auto relative">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface-hover/50">
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Email Akun</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">Limit Gemini</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">Limit Claude & GPT</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted">Memuat data...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted">Belum ada data AI Agent.</td></tr>
            ) : (
              agents.map((ag) => {
                const geminiStatus = getRemainingTimeStatus(ag.gemini_refresh_at);
                const claudeGptStatus = getRemainingTimeStatus(ag.claude_gpt_refresh_at);

                return (
                  <tr key={ag.id} className="hover:bg-surface-hover/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground text-sm">{ag.email_account}</span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors
                        ${geminiStatus.isAvailable ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}
                      >
                        {geminiStatus.isAvailable ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                        {geminiStatus.text}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors
                        ${claudeGptStatus.isAvailable ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}
                      >
                        {claudeGptStatus.isAvailable ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                        {claudeGptStatus.text}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEdit(ag)} className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-lg transition-colors" title="Setel Ulang Waktu">
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ag.id)} className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Hapus Akun">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card rounded-3xl p-6 shadow-2xl border border-border"
            >
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {editingId ? 'Ubah Status Limit' : 'Tambah AI Agent'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Email Akun</label>
                  <input
                    required
                    type="email"
                    value={form.email_account}
                    onChange={e => setForm({ ...form, email_account: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-surface focus:border-info focus:ring-1 focus:ring-info text-sm"
                    placeholder="Contoh: user@gmail.com"
                    readOnly={!!editingId}
                  />
                  {editingId && <p className="text-[10px] text-muted mt-1">Anda sedang mengatur ulang waktu cooldown untuk akun ini.</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 border border-border p-4 rounded-2xl bg-surface-hover/30">
                    <p className="text-xs font-bold text-foreground">Gemini Cooldown</p>
                    <p className="text-[10px] text-muted">Isi 0 jika sedang tersedia.</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-muted mb-1">Hari</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={form.gemini_days}
                          onChange={e => setForm({ ...form, gemini_days: Number(e.target.value) })}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-surface focus:border-info text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-muted mb-1">Jam</label>
                        <input
                          required
                          type="number"
                          min="0"
                          max="23"
                          value={form.gemini_hours}
                          onChange={e => setForm({ ...form, gemini_hours: Number(e.target.value) })}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-surface focus:border-info text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border border-border p-4 rounded-2xl bg-surface-hover/30">
                    <p className="text-xs font-bold text-foreground">Claude/GPT Cooldown</p>
                    <p className="text-[10px] text-muted">Isi 0 jika sedang tersedia.</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-muted mb-1">Hari</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={form.claude_gpt_days}
                          onChange={e => setForm({ ...form, claude_gpt_days: Number(e.target.value) })}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-surface focus:border-info text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-muted mb-1">Jam</label>
                        <input
                          required
                          type="number"
                          min="0"
                          max="23"
                          value={form.claude_gpt_hours}
                          onChange={e => setForm({ ...form, claude_gpt_hours: Number(e.target.value) })}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-surface focus:border-info text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-xl font-semibold text-muted bg-surface-hover hover:bg-border transition-colors">
                    Batal
                  </button>
                  <button type="submit" className="flex-1 h-11 rounded-xl font-semibold text-white bg-info hover:bg-info/90 shadow-lg shadow-info/20 transition-all">
                    Simpan & Hitung Mundur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
