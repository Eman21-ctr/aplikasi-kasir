'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bell, LogOut, Store, UserCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, store, storeUser, role, isSuperAdminUser, signOut } = useAuth();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    const checkLowStock = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, current_stock, min_stock_alert')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (data) {
        const count = data.filter((p) => p.current_stock <= p.min_stock_alert).length;
        setLowStockCount(count);
      }
    };
    checkLowStock();
  }, [store?.id]);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
      {/* Brand & Store Name */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group transition">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg border border-brand-400/20 group-hover:scale-105 transition-transform">
            <Store className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight text-white uppercase leading-none">
              {store?.name || 'Kasir'}
            </span>
            <span className="text-[9px] text-slate-400 leading-none mt-0.5">
              {store ? 'UMKM & Warung' : 'Aplikasi POS'}
            </span>
          </div>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        {store && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-3 z-50 text-xs">
                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                  <span>Pusat Notifikasi</span>
                  <span className="text-[10px] text-slate-400">{lowStockCount} peringatan</span>
                </div>
                {lowStockCount > 0 ? (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800/30 text-rose-300">
                    <p className="font-medium">⚠️ Stok Menipis!</p>
                    <p className="text-[11px] text-rose-400 mt-0.5">
                      Ada {lowStockCount} produk yang stoknya berada di bawah batas minimum.
                    </p>
                    <Link
                      href="/inventory?tab=products&filter=low"
                      onClick={() => setShowNotifications(false)}
                      className="inline-block mt-1.5 text-[11px] underline font-semibold text-rose-200"
                    >
                      Lihat Produk Stok Menipis
                    </Link>
                  </div>
                ) : (
                  <p className="text-slate-400 py-2 text-center">Tidak ada notifikasi baru.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Info Badge */}
        {user ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs">
              {isSuperAdminUser ? (
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              ) : (
                storeUser?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {isSuperAdminUser ? 'Super Admin' : storeUser?.name || user.email}
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize flex items-center gap-1">
                {isSuperAdminUser ? (
                  <span className="text-purple-400 font-bold">Pemilik Aplikasi</span>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 text-brand-500" />
                    Role: {role || 'Kasir'}
                  </>
                )}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-md transition ml-1"
              title="Keluar / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow"
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
};
