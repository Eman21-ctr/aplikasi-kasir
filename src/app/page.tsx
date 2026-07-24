'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Product, Transaction } from '@/types/database';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { store, user, isSuperAdminUser, subscriptionStatus } = useAuth();
  const [todaySales, setTodaySales] = useState<number>(0);
  const [todayTrxCount, setTodayTrxCount] = useState<number>(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!store?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Today's Transactions
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'selesai')
        .gte('created_at', startOfToday.toISOString())
        .order('created_at', { ascending: false });

      if (trxData) {
        const total = trxData.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        setTodaySales(total);
        setTodayTrxCount(trxData.length);
        setRecentTransactions(trxData.slice(0, 5));
      }

      // 2. Fetch Low Stock Products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (prodData) {
        const low = prodData.filter((p) => p.current_stock <= p.min_stock_alert);
        setLowStockProducts(low);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [store?.id]);

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Selamat Datang, {store?.owner_name || 'Pemilik Toko'}</span>
            <span className="text-sm px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20">
              {store?.name || 'KasirPro'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan performa dan aktivitas transaksi usaha Anda hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdminUser && (
            <Link
              href="/admin"
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panel Super Admin</span>
            </Link>
          )}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium px-3 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Banner Tips Pengingat */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-brand-500/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Tips KasirPro Hari Ini</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lakukan pengecekan stok fisik tiap pagi di menu <strong>Stok Opname</strong> agar catatan persediaan selalu presisi.
            </p>
          </div>
        </div>
        <Link
          href="/inventory?tab=opname"
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 hover:underline shrink-0"
        >
          <span>Cek Stok Opname</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Penjualan Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            Rp {todaySales.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Terhitung dari transaksi selesai</span>
          </div>
        </div>

        {/* Today's Transactions Count */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Jumlah Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {todayTrxCount} <span className="text-sm text-slate-400 font-normal">Transaksi</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-2">
            Struk diterbitkan hari ini
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Stok Menipis</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
            <span>{lowStockProducts.length}</span>
            <span className="text-xs text-slate-400 font-normal">Produk di bawah batas minimum</span>
          </div>
          <Link
            href="/inventory?tab=products&filter=low"
            className="text-[11px] text-amber-400 font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
          >
            <span>Restock Barang Sekarang</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Akses Cepat Tombol Pintas */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Akses Cepat Menu
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/pos"
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-brand-500/40 p-4 rounded-2xl transition group flex items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-brand-400 transition">
                Menu Kasir
              </div>
              <div className="text-[10px] text-slate-400">Buat transaksi baru</div>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 p-4 rounded-2xl transition group flex items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                Kelola Stok
              </div>
              <div className="text-[10px] text-slate-400">Stok masuk & opname</div>
            </div>
          </Link>

          <Link
            href="/reports"
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 p-4 rounded-2xl transition group flex items-center gap-3 shadow-sm col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-400 transition">
                Laporan Keuangan
              </div>
              <div className="text-[10px] text-slate-400">Penjualan & laba rugi</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Low Stock Alert List & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stok Menipis Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Daftar Stok Menipis</span>
            </h3>
            <Link
              href="/inventory"
              className="text-xs text-brand-400 font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              ✅ Semua stok produk dalam kondisi aman (di atas batas minimum).
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{prod.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Batas min: {prod.min_stock_alert} {prod.unit || 'pcs'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-xs inline-block">
                      Sisa: {prod.current_stock} {prod.unit || 'pcs'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-400" />
              <span>Transaksi Terakhir Hari Ini</span>
            </h3>
            <Link href="/pos" className="text-xs text-brand-400 font-semibold hover:underline">
              Ke Menu Kasir
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada transaksi penjualan hari ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{trx.transaction_number}</div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      Metode: <span className="text-slate-300 font-medium">{trx.payment_method}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-400">
                      Rp {(Number(trx.total_amount) || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(trx.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
