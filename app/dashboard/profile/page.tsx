'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.name,
        role: user.role,
        avatar_url: user.avatar.length > 2 ? user.avatar : '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // We update the profiles table
    // Since email is PK, we use upsert
    const avatarToSave = form.avatar_url.trim() || form.display_name.charAt(0).toUpperCase();

    const { error } = await supabase.from('profiles').upsert({
      email: user.email,
      display_name: form.display_name,
      role: form.role,
      avatar_url: avatarToSave,
    });

    if (error) {
      toast.error('Gagal menyimpan profil: ' + error.message);
      return;
    }

    toast.success('Profil berhasil diperbarui!');
    
    // Update local context/cookie
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
      // Reset input
      e.target.value = '';
    }
  };

  const handleCropDone = async (croppedFile: File) => {
    setImageToCrop(null);
    if (!user) return;
    
    setUploading(true);
    const toastId = toast.loading('Mengunggah gambar...');
    
    try {
      const fileName = `${user.email}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, croppedFile, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, avatar_url: publicUrlData.publicUrl }));
      toast.success('Gambar berhasil diunggah!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal mengunggah gambar: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-[24px] border border-border p-6 md:p-8 shadow-sm glass"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden shrink-0"
                 style={{ background: 'var(--gradient-primary)' }}>
              {form.avatar_url && form.avatar_url.startsWith('http') ? (
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                form.display_name ? form.display_name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            {/* Upload Overlay */}
            <label className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer text-white">
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Ubah Foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Pengaturan Profil
            </h1>
            <p className="text-sm text-muted">Sesuaikan identitas dan foto profil yang muncul di dashboard Anda.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Email (Login ID)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface-hover text-muted cursor-not-allowed text-sm"
            />
            <p className="text-[10px] text-muted/60 mt-1">Email tidak dapat diubah karena merupakan akses login.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Nama Tampilan</label>
            <input
              required
              type="text"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              placeholder="Misal: Miguel"
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Jabatan / Role</label>
            <input
              required
              type="text"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="Misal: Founder / Developer"
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">URL Foto Profil (Otomatis terisi jika upload)</label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={e => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
            />
            <p className="text-[10px] text-muted/60 mt-1">Anda juga bisa menempelkan link gambar secara manual.</p>
          </div>

          <div className="pt-4 border-t border-border">
            <button 
              type="submit" 
              disabled={uploading}
              className="w-full h-12 rounded-xl font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper 
            imageSrc={imageToCrop} 
            onCropDone={handleCropDone} 
            onCancel={() => setImageToCrop(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
