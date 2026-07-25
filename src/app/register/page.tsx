'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, SUPER_ADMIN_EMAIL } from '@/lib/supabase';
import { Logo } from '@/components/common/Logo';
import {
  Store,
  User,
  Phone,
  MapPin,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const isSuperAdminEmail = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

    try {
      // Sign out current session if any to avoid session mixup
      await supabase.auth.signOut();

      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Gagal mendaftarkan akun. Silakan coba lagi.');
      }

      const authUserId = authData.user.id;

      // 2. Insert into stores table
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName.trim(),
          owner_name: ownerName.trim(),
          address: address.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
          email: email.trim(),
          auth_user_id: authUserId,
          subscription_status: isSuperAdminEmail ? 'active' : 'pending',
          activated_at: isSuperAdminEmail ? new Date().toISOString() : null,
          expires_at: isSuperAdminEmail
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10).toISOString()
            : null,
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // 3. Insert owner into store_users table
      const { error: userError } = await supabase.from('store_users').insert({
        store_id: storeData.id,
        auth_user_id: authUserId,
        name: ownerName.trim() || storeName.trim(),
        role: 'owner',
      });

      if (userError) throw userError;

      setSuccessMsg(
        isSuperAdminEmail
          ? 'Akun Super Admin berhasil terdaftar & langsung aktif!'
          : 'Pendaftaran toko berhasil! Akun Anda saat ini berstatus Menunggu Aktivasi.'
      );

      setTimeout(() => {
        if (isSuperAdminEmail) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar. Periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 relative">
      {/* Background glow accents for Register */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-950/30 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3.5">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daftar Toko Baru</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-sm">
            Mulai kelola usaha warung & UMKM Anda secara profesional
          </p>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2.5">
            <span className="shrink-0 text-base">⚠️</span>
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Section 1: Data Toko */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Profil Toko / Usaha
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Toko *</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Toko Kelontong Berkah"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemilik *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="08123456789"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Toko (Opsional)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 45"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Data Login Akun */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Informasi Login Akun
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Utama *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@toko.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                    title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftarkan Toko Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation Box to Login */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-white">Sudah punya akun?</p>
            </div>
            <Link
              href="/login"
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
