'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ImageCropper from '@/app/components/ImageCropper';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CameraIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function LockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ─── Tabs ────────────────────────────────────────────────── */
type Tab = 'profile' | 'security';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profil & Identitas', icon: UserIcon },
  { id: 'security', label: 'Keamanan & Sesi', icon: ShieldIcon },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  /* Profile states */
  const [form, setForm] = useState({ display_name: '', role: '', avatar_url: '' });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* Load user data */
  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.name || '',
        role: user.role || '',
        avatar_url: user.avatar && user.avatar.length > 2 ? user.avatar : '',
      });
    }
  }, [user]);

  /* Save profile */
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

    updateUser({ name: form.display_name, role: form.role, avatar: avatarToSave });
    toast.success('Profil berhasil diperbarui!');
  };

  /* Avatar upload */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
    const toastId = toast.loading('Memproses foto...');

    try {
      const fileName = `${user.email}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, croppedFile, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
        toast.success('Foto profil tersimpan!', { id: toastId });
        setUploading(false);
        return;
      }
      throw error;
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, avatar_url: reader.result?.toString() || '' }));
        toast.success('Foto profil terpasang!', { id: toastId });
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Gagal membaca gambar.', { id: toastId });
        setUploading(false);
      };
      reader.readAsDataURL(croppedFile);
    }
  };

  const avatarPreview =
    form.avatar_url && (form.avatar_url.startsWith('http') || form.avatar_url.startsWith('data:'))
      ? form.avatar_url
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">

      {/* ── TOP HEADER SECTION: Settings ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              SETTINGS & PROFILE
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">Personal Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-zinc-900 font-heading tracking-tight leading-tight">
            Account Settings
          </h1>
          <p className="text-[13px] text-zinc-500 mt-0.5 font-medium">
            Kelola profil pribadi, foto akun, peran jabatan, dan informasi keamanan Anda.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ─── TAB 1: PROFIL & IDENTITAS ─────────────────────── */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {imageToCrop && (
              <ImageCropper
                imageSrc={imageToCrop}
                onCropDone={handleCropDone}
                onCancel={() => setImageToCrop(null)}
              />
            )}

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Photo & Identity Bento Card */}
              <div className="bg-white rounded-[24px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-[22px] overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-2xl shadow-md ring-4 ring-zinc-50">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{form.display_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 rounded-[22px] bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 font-heading">
                      Foto Profil Akun
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-0.5">
                      Foto ini ditampilkan di dashboard dan avatar workspace.
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">Format JPG, PNG, atau WebP (Maks. 5MB)</p>
                  </div>
                </div>

                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-all shadow-2xs">
                    <CameraIcon className="w-4 h-4 text-zinc-600" />
                    <span>Upload Foto Baru</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Form Input Information Bento Card */}
              <div className="bg-white rounded-[24px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    Informasi Profil
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-0.5">
                    Data identitas akun Anda tersimpan aman dan terisolasi secara pribadi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                      Alamat Email (Akun Utama)
                    </label>
                    <div className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[13px] text-zinc-500 font-medium flex items-center justify-between cursor-not-allowed">
                      <span className="truncate">{user?.email}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <CheckIcon className="w-2.5 h-2.5 text-emerald-600" /> Aktif
                      </span>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                      Nama Tampilan
                    </label>
                    <input
                      type="text"
                      required
                      value={form.display_name}
                      onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                      placeholder="Masukkan nama lengkap / panggilan"
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    />
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                      Peran / Jabatan Profesional
                    </label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      placeholder="misal: Fullstack Developer, Product Builder, Solo Founder"
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 text-lime-400" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </motion.div>
        )}

        {/* ─── TAB 2: KEAMANAN & SESI ─────────────────────────── */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Security Systems Grid */}
            <div className="bg-white rounded-[24px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-bold text-zinc-900 font-heading">
                  Sistem & Standar Keamanan
                </h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Protokol enkripsi dan keamanan data pribadi akun Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Proteksi Idle Timeout
                  </span>
                  <p className="text-sm font-bold text-zinc-900">15 Menit Tidak Aktif</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Sesi secara otomatis diamankan dan dikunci jika tidak terdapat aktivitas interaktif di layar.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Enkripsi Cookie & Token
                  </span>
                  <p className="text-sm font-bold text-zinc-900">SameSite=Lax Secure Cookie</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Kebal terhadap ancaman Cross-Site Request Forgery (CSRF) dan pencurian sesi berbasis skrip pihak ketiga.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Isolasi Data Per Pengguna
                  </span>
                  <p className="text-sm font-bold text-zinc-900">Database Row Level Security</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Seluruh catatan presensi, agenda, dan akun AI terisolasi eksklusif pada email Anda sendiri.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono block">
                    Penyimpanan Terdistribusi
                  </span>
                  <p className="text-sm font-bold text-zinc-900">Supabase Cloud + Local Cache</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Data tetap dapat diakses dengan cepat berkat sinkronisasi otomatis cache browser dan cloud.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Summary Bento Card */}
            <div className="bg-white rounded-[24px] p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 font-heading">
                Ringkasan Kredensial Akun
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Email</p>
                  <p className="font-bold text-zinc-900 truncate">{user?.email}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Role Terdaftar</p>
                  <p className="font-bold text-zinc-900 truncate">{user?.role || 'User'}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Status Akun</p>
                  <p className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Terverifikasi
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Tipe Sesi</p>
                  <p className="font-bold text-zinc-900">Enkripsi Sesi Aktif</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
