'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Clock, Key, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const SubscriptionBanner: React.FC = () => {
  const { subscriptionStatus, daysRemaining, store, isSuperAdminUser } = useAuth();

  if (isSuperAdminUser) {
    return (
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border-b border-purple-500/30 px-4 py-2 text-xs font-medium text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Mode Super Admin Pemilik Aplikasi — Akses Penuh Lintas Toko & Inisialisasi</span>
        </div>
        <Link
          href="/admin"
          className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
        >
          Ke Dashboard Admin
        </Link>
      </div>
    );
  }

  if (subscriptionStatus === 'pending') {
    return (
      <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Akun toko <strong>{store?.name || 'Anda'}</strong> berstatus <strong>Menunggu Aktivasi</strong>. Transaksi kasir masih terkunci sampai kode aktivasi dimasukkan.
          </span>
        </div>
        <Link
          href="/settings?tab=subscription"
          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          Input Kode Aktivasi
        </Link>
      </div>
    );
  }

  if (subscriptionStatus === 'expired') {
    return (
      <div className="bg-rose-950/90 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Masa aktif langganan toko <strong>{store?.name}</strong> telah berakhir. Data Anda tetap aman, masukkan kode aktivasi perpanjangan untuk mengaktifkan kembali.
          </span>
        </div>
        <Link
          href="/settings?tab=subscription"
          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          Perpanjang Langganan
        </Link>
      </div>
    );
  }

  if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="bg-blue-950/80 border-b border-blue-500/30 px-4 py-2 text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Masa aktif langganan toko Anda tersisa <strong>{daysRemaining} hari lagi</strong>. Jangan lupa perpanjang sebelum kedaluwarsa.
          </span>
        </div>
        <Link
          href="/settings?tab=subscription"
          className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition"
        >
          Cek Status Langganan
        </Link>
      </div>
    );
  }

  return null;
};
