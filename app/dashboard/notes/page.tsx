'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/app/components/ConfirmModal';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Load notes from local storage on mount
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

  // Save notes to local storage when they change
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
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    
    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setIsAdding(false);
    toast.success('Catatan berhasil disimpan!');
  };

  const executeDelete = () => {
    if(!deleteId) return;
    setNotes(notes.filter(n => n.id !== deleteId));
    setDeleteId(null);
    toast.success('Catatan berhasil dihapus!');
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      {/* ── Page header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.04em' }}>
            Notes
          </h1>
          <p className="text-[14px] text-muted mt-1">
            Simpan catatan penting Anda di sini.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="self-start sm:self-auto bg-foreground text-background font-semibold rounded-xl px-5 py-2.5 text-[13px] hover:shadow-lg transition-all flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <PlusIcon className="w-4 h-4" /> Tambah Catatan
        </button>
      </div>

      {/* ── Add Note Form ─────────────────────────── */}
      {isAdding && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm card-glow animate-fade-up">
          <input
            type="text"
            placeholder="Judul Catatan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[18px] font-bold text-foreground placeholder:text-muted/40 focus:outline-none mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
            autoFocus
          />
          <textarea
            placeholder="Tulis sesuatu di sini..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-[14px] text-foreground placeholder:text-muted/40 focus:outline-none min-h-[120px] resize-y"
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
            <button 
              onClick={() => { setIsAdding(false); setTitle(''); setContent(''); }}
              className="px-4 py-2 text-[13px] font-semibold text-muted hover:text-foreground transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              className="px-5 py-2 text-[13px] font-semibold bg-foreground text-background rounded-lg hover:shadow-md transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* ── Notes Grid ─────────────────────────── */}
      {notes.length === 0 && !isAdding ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center card-glow flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mb-4">
             <NoteIcon className="w-8 h-8 text-muted/50" />
          </div>
          <h3 className="text-[18px] font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Belum ada catatan</h3>
          <p className="text-[13px] text-muted">Klik tombol 'Tambah Catatan' untuk mulai menulis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="text-[15px] font-bold text-foreground leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {note.title}
                </h3>
                <button 
                  onClick={() => setDeleteId(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-all shrink-0 p-1 bg-surface-hover rounded-md hover:text-danger hover:bg-danger/10"
                  title="Hapus"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[13px] text-muted whitespace-pre-wrap line-clamp-6 mb-4 flex-1">
                {note.content}
              </p>
              <div className="text-[11px] font-medium text-muted/50 pt-3 border-t border-border/50">
                {note.date}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Catatan"
        message="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini bersifat permanen."
        onCancel={() => setDeleteId(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
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
