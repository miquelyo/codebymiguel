'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: 'Kerja' | 'Ide' | 'Pribadi' | 'Penting';
  isPinned?: boolean;
}

const CATEGORIES = [
  { label: 'Semua', value: 'all' },
  { label: 'Kerja', value: 'Kerja', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { label: 'Ide', value: 'Ide', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { label: 'Penting', value: 'Penting', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { label: 'Pribadi', value: 'Pribadi', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Kerja' | 'Ide' | 'Pribadi' | 'Penting'>('Kerja');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load notes
  useEffect(() => {
    const saved = localStorage.getItem('codebymiguel_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notes');
      }
    }
  }, []);

  // Save notes
  useEffect(() => {
    localStorage.setItem('codebymiguel_notes', JSON.stringify(notes));
  }, [notes]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      setIsAdding(false);
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      category,
      isPinned: false,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setIsAdding(false);
    toast.success('Catatan berhasil disimpan!');
  };

  const togglePin = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  };

  const copyNote = (note: Note) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    toast.success('Teks catatan disalin ke clipboard!');
  };

  const executeDelete = () => {
    if (!deleteId) return;
    setNotes(notes.filter((n) => n.id !== deleteId));
    setDeleteId(null);
    toast.success('Catatan berhasil dihapus!');
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
        const matchesSearch =
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      });
  }, [notes, activeCategory, search]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* ── Page Header & Search ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Notes & Tugas
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Ruang kerja cepat untuk ide, checklist tugas, dan dokumentasi harian.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tulis Catatan Baru</span>
        </button>
      </div>

      {/* ── Search & Category Filter Bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl glass-panel">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan berdasarkan judul atau isi..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-transparent text-xs text-foreground placeholder:text-muted/60 outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add Note Modal / Card ─────────────────────────────────── */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-card rounded-3xl p-6 sm:p-7 border border-border shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Catatan Baru
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Kategori</label>
                  <div className="flex gap-2">
                    {(['Kerja', 'Ide', 'Pribadi', 'Penting'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          category === c
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-hover text-muted border-border hover:text-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Judul Catatan</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Rencana Deployment Arsitektur 2026"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border text-sm font-bold text-foreground placeholder:text-muted/60 focus:border-primary outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Isi Catatan</label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tuliskan detail catatan, langkah kerja, atau daftar tugas..."
                    className="w-full p-4 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted/60 focus:border-primary outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Simpan Catatan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Notes Grid ───────────────────────────────────────────── */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 rounded-3xl flex flex-col justify-between group relative overflow-hidden"
            >
              {note.isPinned && (
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="bg-primary text-white text-[9px] font-bold py-0.5 w-16 text-center rotate-45 translate-x-3 -translate-y-1 shadow-sm">
                    PIN
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    note.category === 'Penting'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : note.category === 'Ide'
                      ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                      : note.category === 'Pribadi'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {note.category || 'Kerja'}
                  </span>
                  <span className="text-[10px] text-muted font-mono">{note.date}</span>
                </div>

                <h3 className="text-base font-bold text-foreground mb-2 leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {note.title}
                </h3>
                <p className="text-xs text-muted/90 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
              </div>

              {/* Action Footer */}
              <div className="mt-5 pt-3.5 border-t border-border/50 flex items-center justify-between text-muted">
                <span className="text-[10px] font-mono">
                  {note.content.length} karakter
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(note.id)}
                    title={note.isPinned ? 'Lepas Pin' : 'Sematkan ke Atas'}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors ${
                      note.isPinned ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={note.isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => copyNote(note)}
                    title="Salin Catatan"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setDeleteId(note.id)}
                    title="Hapus Catatan"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card py-16 text-center text-muted flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center text-muted mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Belum ada catatan ditemukan
          </h4>
          <p className="text-xs max-w-sm mb-5">
            {search ? 'Tidak ada catatan yang cocok dengan pencarian Anda.' : 'Mulai catat ide, tugas, atau hal penting dengan menekan tombol di bawah.'}
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Buat Catatan Pertama
          </button>
        </div>
      )}

      {/* ── Confirm Delete Modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Catatan?"
        message="Catatan ini akan dihapus secara permanen dari penyimpanan lokal perangkat Anda."
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
