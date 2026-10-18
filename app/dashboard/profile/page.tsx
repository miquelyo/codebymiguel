'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ImageCropper from '@/app/components/ImageCropper';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    display_name: '',
    role: '',
    avatar_url: '',
  });

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.name,
        role: user.role,
        avatar_url: user.avatar && user.avatar.length > 2 ? user.avatar : '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const avatarToSave = form.avatar_url.trim() || form.display_name.charAt(0).toUpperCase();

    const { error } = await supabase.from('profiles').upsert({
      email: user.email,
      display_name: form.display_name,
      role: form.role,
      avatar_url: avatarToSave,
    });

    setIsSaving(false);

    if (error) {
      toast.error('Gagal menyimpan profil: ' + error.message);
      return;
    }

    toast.success('Profil berhasil diperbarui!');

    updateUser({
      name: form.display_name,
      role: form.role,
      avatar: avatarToSave,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result?.toString() || null));
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropDone = async (croppedFile: File) => {
    setImageToCrop(null);
    if (!user) return;

    setUploading(true);
    const toastId = toast.loading('Memproses foto profil...');

    // Attempt Supabase storage first, fallback to Base64 data URL
    try {
      const fileName = `${user.email}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, croppedFile, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setForm((prev) => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
        toast.success('Foto profil tersimpan di cloud storage!', { id: toastId });
        setUploading(false);
        return;
      }
      throw error;
    } catch {
      // Fallback: Convert to Base64 Data URL so it NEVER fails with 404
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString() || '';
        setForm((prev) => ({ ...prev, avatar_url: base64 }));
        toast.success('Foto profil berhasil dipasang (Lokal Base64)!', { id: toastId });
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca gambar.', { id: toastId });
        setUploading(false);
      };
      reader.readAsDataURL(croppedFile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-10">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Profil Akun & Kredensial
        </h1>
        <p className="text-muted text-xs sm:text-sm mt-1">
          Kelola informasi identitas, foto profil, dan status keamanan workspace Anda.
        </p>
      </div>

      {/* ── Main Executive Card ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-9 rounded-3xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 mb-8 border-b border-border/60">
          {/* Avatar with hover upload overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500">
              {form.avatar_url && (form.avatar_url.startsWith('http') || form.avatar_url.startsWith('data:')) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                form.display_name ? form.display_name.charAt(0).toUpperCase() : 'U'
              )}
            </div>

            {/* Hover overlay for changing picture */}
            <label className="hidden sm:flex absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-3xl flex-col items-center justify-center cursor-pointer text-white">
              <svg className="w-6 h-6 mb-1 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Ubah Foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>

            {/* Mobile upload button badge */}
            <label className="sm:hidden absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background cursor-pointer active:scale-95 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {form.role || 'Super Admin'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terautentikasi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {form.display_name || user?.name}
            </h2>
            <p className="text-xs text-muted font-mono">{user?.email}</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Email (Login ID)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full h-11 px-4 rounded-xl border border-border bg-surface-hover/70 text-muted cursor-not-allowed text-xs font-mono"
              />
              <p className="text-[10px] text-muted/60 mt-1">Identitas email terikat dengan autentikasi.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Jabatan / Role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Contoh: Principal Engineer / Admin"
                className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Nama Tampilan</label>
            <input
              required
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Security & Session Info Box ──────────────────────────── */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl space-y-4">
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Keamanan & Sesi Kerja
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Proteksi Idle Timeout
            </span>
            <span className="font-bold text-foreground">15 Menit Tidak Aktif</span>
            <p className="text-[10px] text-muted mt-1">Otomatis logout jika ditinggalkan.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Verifikasi Biometrik
            </span>
            <span className="font-bold text-emerald-500">68-Point Mesh AI</span>
            <p className="text-[10px] text-muted mt-1">Algoritma TinyFaceDetector aktif.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/70">
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Enkripsi Sesi
            </span>
            <span className="font-bold text-foreground">SameSite=Lax Cookie</span>
            <p className="text-[10px] text-muted mt-1">Aman dari manipulasi pihak ketiga.</p>
          </div>
        </div>
      </div>

      {/* ── Crop Modal ───────────────────────────────────────────── */}
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropDone={handleCropDone}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </div>
  );
}
