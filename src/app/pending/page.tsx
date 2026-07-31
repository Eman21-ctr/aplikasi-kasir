'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/common/Logo';
import { SUPER_ADMIN_WA } from '@/lib/supabase';
import {
  Clock,
  MessageCircle,
  RefreshCw,
  LogOut,
  Store,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function PendingPage() {
  const router = useRouter();
  const { user, store, subscriptionStatus, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Formatting WhatsApp number (remove non-digits, ensure starts with 62 if 08)
  const formatWaNumber = (num: string) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  const superAdminWaNumber = formatWaNumber(SUPER_ADMIN_WA);
  const displayWaNumber = SUPER_ADMIN_WA.startsWith('0')
    ? SUPER_ADMIN_WA
    : '+' + SUPER_ADMIN_WA;

  const waMessage = `Halo Super Admin KasirPro, akun toko saya *${
    store?.name || 'Toko Baru'
  }* dengan email (${
    user?.email || '-'
  }) baru saja terdaftar dan membutuhkan aktivasi akun. Mohon dibantu untuk proses aktivasinya. Terima kasih!`;

  const waUrl = `https://wa.me/${superAdminWaNumber}?text=${encodeURIComponent(waMessage)}`;

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckMsg(null);
    try {
      await refreshProfile();
      if (subscriptionStatus === 'active') {
        setCheckMsg({
          type: 'success',
          text: 'Selamat! Akun Anda telah diaktifkan. Mengalihkan ke Dashboard...',
        });
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        setCheckMsg({
          type: 'info',
          text: 'Status akun Anda masih Menunggu Aktivasi. Silakan hubungi Super Admin via WhatsApp.',
        });
      }
    } catch (err) {
      setCheckMsg({
        type: 'info',
        text: 'Gagal memperbarui status. Silakan coba beberapa saat lagi.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 relative">
      {/* Background glow accent for Pending status card */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-950/20 relative overflow-hidden text-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <Logo size="lg" variant="green" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Akun Menunggu Aktivasi
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs">
            Pendaftaran berhasil! Akun toko Anda saat ini belum diaktifkan oleh Super Admin.
          </p>
        </div>

        {/* Status Toast Message */}
        {checkMsg && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 text-left transition ${
              checkMsg.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/70 border border-amber-800/60 text-amber-300'
            }`}
          >
            {checkMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="leading-tight">{checkMsg.text}</span>
          </div>
        )}

        {/* Store & Account Details Box */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2.5 mb-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-medium">Status Langganan</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Menunggu Aktivasi
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 pt-0.5">
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Toko:</span>
            <span className="font-bold text-white truncate">{store?.name || 'Toko Anda'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Pemilik:</span>
            <span className="font-semibold text-slate-200 truncate">
              {store?.owner_name || 'Pemilik'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Email:</span>
            <span className="font-medium text-slate-300 truncate">{user?.email || '-'}</span>
          </div>
        </div>

        {/* Primary CTA: WhatsApp Super Admin */}
        <div className="space-y-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] group"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 stroke-[2.5]" />
            <span>Hubungi Super Admin via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition" />
          </a>

          <p className="text-[11px] text-slate-400">
            No. WA Super Admin:{' '}
            <span className="text-emerald-400 font-bold tracking-wide">{displayWaNumber}</span>
          </p>
        </div>

        {/* Secondary Action Controls */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Memeriksa...' : 'Cek Status'}</span>
          </button>

          <button
            onClick={signOut}
            className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
