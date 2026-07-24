'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSuperAdmin } from '@/lib/supabase';
import { Logo } from '@/components/common/Logo';
import { LogIn, Mail, Lock, CheckCircle2, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    const isRemembered = localStorage.getItem('kasirpro_remember_login') === 'true';
    if (isRemembered) {
      const savedEmail = localStorage.getItem('kasirpro_saved_email') || '';
      const savedPassword = localStorage.getItem('kasirpro_saved_password') || '';
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Save or clear remembered credentials
    if (rememberMe) {
      localStorage.setItem('kasirpro_remember_login', 'true');
      localStorage.setItem('kasirpro_saved_email', email.trim());
      localStorage.setItem('kasirpro_saved_password', password);
    } else {
      localStorage.removeItem('kasirpro_remember_login');
      localStorage.removeItem('kasirpro_saved_email');
      localStorage.removeItem('kasirpro_saved_password');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        if (isSuperAdmin(data.user.email)) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Email atau kata sandi tidak cocok. Periksa kembali data login Anda.');
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMsg('Akun Anda belum dikonfirmasi. Hubungi pemilik aplikasi untuk bantuan.');
      } else {
        setErrorMsg(err.message || 'Gagal masuk. Periksa email & kata sandi Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 relative">
      {/* Background glow accents for Login */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-950/30 relative overflow-hidden">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Category Pill */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            Portal Masuk Akun Toko
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3.5">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Masuk ke KasirPro</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs">
            Kelola transaksi kasir, stok barang, dan laporan penjualan toko Anda.
          </p>
        </div>

        {/* Status messages */}
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Registrasi Toko
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email-toko.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Kata Sandi</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-300 py-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="group-hover:text-white transition text-slate-300 text-xs">
                Ingat Email & Password
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-[0.99]"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Ke Akun</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation Box to Register */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-white">Belum punya akun toko?</p>
              <p className="text-[11px] text-slate-400">Daftarkan usaha Anda gratis</p>
            </div>
            <Link
              href="/register"
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <span>Daftar Toko</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
