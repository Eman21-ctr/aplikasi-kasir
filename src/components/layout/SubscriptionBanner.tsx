'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const SubscriptionBanner: React.FC = () => {
  const pathname = usePathname();
  const { user, store, subscriptionStatus, isSuperAdminUser } = useAuth();

  // Banner hanya muncul jika klien sudah mendaftar (login & ada toko) tapi belum diaktifkan & bukan di halaman /pending
  if (!user || !store || isSuperAdminUser || subscriptionStatus !== 'pending' || pathname === '/pending') {
    return null;
  }

  return (
    <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-center gap-2 text-center flex-wrap">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        Akun toko <strong>{store.name || 'Anda'}</strong> berstatus <strong>Menunggu Aktivasi</strong>. Hubungi Admin untuk Aktivasi Toko/Warung Anda.
      </span>
    </div>
  );
};

