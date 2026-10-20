'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider';
import toast from 'react-hot-toast';
import ImageCropper from '@/app/components/ImageCropper';

/* ─── Icons ───────────────────────────────────────────────── */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.18-.545-1.9-1.285-3.125-3.235-3.22-3.361-.095-.126-.773-1.03-.773-1.963 0-.934.49-1.393.664-1.583.174-.19.38-.238.506-.238.127 0 .253.001.364.007.119.006.277-.045.434.332.162.389.554 1.353.602 1.452.048.098.08.214.016.34-.064.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.194.198-.083.388.111.19.493.813 1.057 1.315.727.646 1.34.846 1.53.941.19.095.301.079.412-.048.111-.127.476-.555.602-.745.127-.19.254-.158.428-.095.174.063 1.109.523 1.3.618.19.095.317.142.364.222.048.079.048.459-.096.864z" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

/* ─── Tabs ────────────────────────────────────────────────── */
type Tab = 'profile' | 'security';

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profil', icon: UserIcon },
  { id: 'security', label: 'Keamanan & 2FA', icon: ShieldIcon },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  /* Profile states */
  const [form, setForm] = useState({ display_name: '', role: '', avatar_url: '' });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* 2FA states */
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

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

  /* Load 2FA settings */
  useEffect(() => {
    if (!user) return;
    const fetch2FA = async () => {
      try {
        const res = await fetch(`/api/auth/2fa-settings?user=${encodeURIComponent(user.email)}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
          setIs2FAEnabled(json.enabled);
          setUserPhone(json.phone || '');
          setTempPhone(json.phone || '');
        }
      } catch {}
    };
    fetch2FA();
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
    if (error) { toast.error('Gagal menyimpan: ' + error.message); return; }
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
      const { error } = await supabase.storage.from('avatars').upload(fileName, croppedFile, { cacheControl: '3600', upsert: true });
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
      reader.onerror = () => { toast.error('Gagal membaca gambar.', { id: toastId }); setUploading(false); };
      reader.readAsDataURL(croppedFile);
    }
  };

  /* Toggle 2FA */
  const handleToggle2FA = async () => {
    if (!user) return;
    setIsToggling2FA(true);
    const nextState = !is2FAEnabled;
    try {
      const res = await fetch('/api/auth/2fa-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user.email, enabled: nextState, phone: userPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(nextState);
        toast.success(nextState ? 'WhatsApp 2FA diaktifkan!' : 'WhatsApp 2FA dinonaktifkan.');
      } else {
        toast.error(data.message || 'Gagal mengubah pengaturan 2FA.');
      }
    } catch { toast.error('Gagal menghubungi server.'); }
    finally { setIsToggling2FA(false); }
  };

  /* Save phone */
  const handleSavePhone = async () => {
    if (!user || !tempPhone.trim()) { toast.error('Nomor tidak boleh kosong'); return; }
    try {
      const res = await fetch('/api/auth/2fa-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user.email, phone: tempPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUserPhone(tempPhone.trim());
        setIsEditingPhone(false);
        toast.success('Nomor WhatsApp disimpan!');
      } else {
        toast.error(data.message || 'Gagal menyimpan nomor.');
      }
    } catch { toast.error('Gagal menghubungi server.'); }
  };

  const avatarPreview = form.avatar_url && (form.avatar_url.startsWith('http') || form.avatar_url.startsWith('data:'))
    ? form.avatar_url : null;

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-slide-up">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Settings
        </h1>
        <p className="text-sm text-muted mt-1">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── PROFILE TAB ───────────────────────────────────── */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {imageToCrop && (
              <ImageCropper
                imageSrc={imageToCrop}
                onCropDone={handleCropDone}
                onCancel={() => setImageToCrop(null)}
              />
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar Section */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Foto Profil</h2>
                <div className="flex items-center gap-5">
                  {/* Avatar Preview */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{form.display_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-surface hover:bg-surface-hover transition-all">
                      <CameraIcon className="w-4 h-4 text-muted" />
                      <span className="text-foreground">Upload Foto</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-[11px] text-muted">JPG, PNG, WebP. Maks. 5MB</p>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Informasi Akun</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Email (readonly) */}
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
                    <div className="input-field flex items-center text-muted cursor-not-allowed opacity-70">
                      {user?.email}
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Nama Tampilan</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.display_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Nama Anda"
                      required
                    />
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Jabatan / Role</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.role}
                      onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="Contoh: Developer, Admin"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* ─── SECURITY TAB ──────────────────────────────────── */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* WhatsApp 2FA Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    is2FAEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-hover text-muted'
                  }`}>
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-sm font-semibold text-foreground">WhatsApp 2FA</h2>
                      <span className={`badge ${is2FAEnabled ? 'badge-success' : 'badge-neutral'}`}>
                        {is2FAEnabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Tambahkan lapisan keamanan dengan verifikasi OTP via WhatsApp setiap kali login.
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  disabled={isToggling2FA}
                  className="relative shrink-0 cursor-pointer disabled:opacity-50"
                  title={is2FAEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA'}
                >
                  <div className={`toggle-track ${is2FAEnabled ? 'on' : ''}`}>
                    <div className="toggle-thumb" />
                  </div>
                </button>
              </div>

              {/* Phone Number */}
              {is2FAEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 pt-5 border-t border-border/50"
                >
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Nomor WhatsApp
                  </label>
                  {isEditingPhone ? (
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        className="input-field flex-1"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-foreground text-background hover:opacity-90 transition-all cursor-pointer shrink-0"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditingPhone(false); setTempPhone(userPhone); }}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-muted border border-border hover:bg-surface-hover transition-all cursor-pointer shrink-0"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-11 px-4 rounded-xl bg-surface-hover border border-border flex items-center gap-2">
                        <WhatsAppIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm text-foreground font-mono">{userPhone || '—'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsEditingPhone(true); setTempPhone(userPhone); }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer shrink-0"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-muted mt-2">
                    Kode OTP akan dikirim ke nomor ini setiap kali Anda login.
                  </p>
                </motion.div>
              )}
            </div>

            {/* WhatsApp Gateway Link */}
            <div className="card p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">WhatsApp Gateway</p>
                <p className="text-xs text-muted">Hubungkan perangkat WhatsApp untuk layanan OTP.</p>
              </div>
              <a
                href="/dashboard/whatsapp"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-surface hover:bg-surface-hover transition-all shrink-0 text-foreground"
              >
                <span>Buka Gateway</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>

            {/* Account info */}
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Informasi Akun</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-hover rounded-xl">
                  <p className="text-muted mb-1">Email</p>
                  <p className="font-semibold text-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-3 bg-surface-hover rounded-xl">
                  <p className="text-muted mb-1">Role</p>
                  <p className="font-semibold text-foreground">{user?.role || 'Super Admin'}</p>
                </div>
                <div className="p-3 bg-surface-hover rounded-xl">
                  <p className="text-muted mb-1">Status Akun</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Aktif
                  </p>
                </div>
                <div className="p-3 bg-surface-hover rounded-xl">
                  <p className="text-muted mb-1">2FA</p>
                  <p className={`font-semibold ${is2FAEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                    {is2FAEnabled ? 'Aktif' : 'Tidak aktif'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
