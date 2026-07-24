'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import { supabase, SUPER_ADMIN_EMAIL, isSuperAdmin, quickLoginSuperAdmin } from '@/lib/supabase';
import { Logo } from '@/components/common/Logo';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

const ADMIN_SECRET_KEY = 'kasirpro2026';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const secretParam = searchParams.get('key');

  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    const isRemembered = localStorage.getItem('kasirpro_remember_admin') === 'true';
    if (isRemembered) {
      const savedEmail = localStorage.getItem('kasirpro_saved_admin_email') || '';
      const savedPassword = localStorage.getItem('kasirpro_saved_admin_password') || '';
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Verify secret key
  const isAuthorized = secretParam === ADMIN_SECRET_KEY;

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
            <span className="text-2xl font-black text-slate-300">404</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Halaman Tidak Ditemukan</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maaf, halaman yang Anda tuju tidak ditemukan atau URL yang Anda masukkan salah.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (rememberMe) {
      localStorage.setItem('kasirpro_remember_admin', 'true');
      localStorage.setItem('kasirpro_saved_admin_email', email.trim());
      localStorage.setItem('kasirpro_saved_admin_password', password);
    } else {
      localStorage.removeItem('kasirpro_remember_admin');
      localStorage.removeItem('kasirpro_saved_admin_email');
      localStorage.removeItem('kasirpro_saved_admin_password');
    }

    try {
      // Sign out existing session
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (!isSuperAdmin(data.user?.email)) {
        await supabase.auth.signOut();
        throw new Error('Akun ini bukan akun Super Admin. Akses ditolak.');
      }

      setSuccessMsg('Login Super Admin berhasil! Mengalihkan...');
      setTimeout(() => router.push('/admin'), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await quickLoginSuperAdmin();
      setSuccessMsg('Login Super Admin berhasil! Mengalihkan...');
      setTimeout(() => router.push('/admin'), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login otomatis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3.5">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Panel Super Admin</h1>
          <p className="text-xs text-purple-300/80 mt-1">
            Masuk ke dashboard pemilik aplikasi KasirPro
          </p>
        </div>

        {/* Status messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Login Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>⚡ Login Instan Super Admin</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1.5">
            Otomatis masuk dengan akun super admin default
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">Atau Login Manual</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Admin</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="journalwarga@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 py-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="group-hover:text-white transition text-slate-300 text-xs">
                Ingat Email & Password
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <span>Masuk Manual</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-slate-400">Memuat halaman...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
