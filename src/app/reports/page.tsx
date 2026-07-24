'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Transaction, Product, StockMovement } from '@/types/database';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  Wallet,
  Calendar,
  Printer,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

type DateFilter = 'today' | '7days' | '30days' | 'all';

export default function ReportsPage() {
  const { store, role, isSuperAdminUser } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'profit' | 'stock' | 'cash'>('sales');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionItems, setTransactionItems] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const isAccessAllowed = isSuperAdminUser || role === 'owner';

  const fetchData = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      // 1. Fetch transactions
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', store.id)
        .eq('status', 'selesai')
        .order('created_at', { ascending: false });

      if (trxData) setTransactions(trxData);

      // 2. Fetch transaction items
      const { data: itemData } = await supabase
        .from('transaction_items')
        .select('*, products(cost_price)')
        .eq('store_id', store.id);

      if (itemData) setTransactionItems(itemData);

      // 3. Fetch products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (prodData) setProducts(prodData);

      // 4. Fetch stock movements
      const { data: moveData } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('store_id', store.id);

      if (moveData) setStockMovements(moveData);
    } catch (err) {
      console.error('Fetch reports data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [store?.id]);

  // Filter transactions by date period
  const filteredTransactions = useMemo(() => {
    if (dateFilter === 'all') return transactions;

    const now = new Date();
    const cutoff = new Date();

    if (dateFilter === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else if (dateFilter === '7days') {
      cutoff.setDate(now.getDate() - 7);
    } else if (dateFilter === '30days') {
      cutoff.setDate(now.getDate() - 30);
    }

    return transactions.filter((t) => new Date(t.created_at) >= cutoff);
  }, [transactions, dateFilter]);

  // Calculate Sales metrics
  const totalSalesRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);
  }, [filteredTransactions]);

  const totalTrxCount = filteredTransactions.length;
  const avgTrxValue = totalTrxCount > 0 ? totalSalesRevenue / totalTrxCount : 0;

  // Calculate Profit & Loss (Revenue - COGS)
  const cogsTotal = useMemo(() => {
    const filteredTrxIds = new Set(filteredTransactions.map((t) => t.id));
    const itemsInPeriod = transactionItems.filter((i) => filteredTrxIds.has(i.transaction_id));

    return itemsInPeriod.reduce((acc, item) => {
      const costPrice = Number((item as any).products?.cost_price) || 0;
      return acc + costPrice * Number(item.quantity);
    }, 0);
  }, [filteredTransactions, transactionItems]);

  const grossProfit = totalSalesRevenue - cogsTotal;

  // Calculate Stock Valuation Metrics
  const stockCostValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.current_stock * p.cost_price, 0);
  }, [products]);

  const stockSellValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.current_stock * p.sell_price, 0);
  }, [products]);

  // Cash flow by payment method
  const cashSales = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.payment_method === 'tunai')
      .reduce((acc, t) => acc + Number(t.total_amount), 0);
  }, [filteredTransactions]);

  const nonCashSales = totalSalesRevenue - cashSales;

  if (!isAccessAllowed) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Akses Dibatasi</h2>
        <p className="text-xs text-slate-400">
          Halaman Laporan Keuangan hanya dapat diakses oleh akun berkategori <strong>Owner</strong>.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Laporan</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis penjualan, laba rugi, nilai aset stok, dan arus kas toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-brand-600 text-white shadow font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === '7days' ? 'bg-brand-600 text-white shadow font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === '30days' ? 'bg-brand-600 text-white shadow font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-brand-600 text-white shadow font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Cetak Laporan"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition ${
            activeReportTab === 'sales'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <span>Penjualan</span>
        </button>

        <button
          onClick={() => setActiveReportTab('profit')}
          className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition ${
            activeReportTab === 'profit'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <span>Laba Rugi</span>
        </button>

        <button
          onClick={() => setActiveReportTab('stock')}
          className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition ${
            activeReportTab === 'stock'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <span>Aset Stok</span>
        </button>

        <button
          onClick={() => setActiveReportTab('cash')}
          className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition ${
            activeReportTab === 'cash'
              ? 'bg-brand-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <span>Laporan Kas</span>
        </button>
      </div>

      {/* REPORT SECTION 1: PENJUALAN */}
      {activeReportTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Total Omset Penjualan</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                Rp {totalSalesRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Jumlah Transaksi</span>
              <div className="text-2xl font-extrabold text-white mt-1">{totalTrxCount} Transaksi</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Rata-Rata Nilai Transaksi</span>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">
                Rp {Math.round(avgTrxValue).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Detailed Sales List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3">
              Daftar Transaksi Periode Terpilih ({filteredTransactions.length})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{t.transaction_number}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleString('id-ID')} • Bayar: {t.payment_method}
                    </div>
                  </div>
                  <div className="font-extrabold text-brand-400 text-xs">
                    Rp {Number(t.total_amount).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORT SECTION 2: LABA RUGI */}
      {activeReportTab === 'profit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Pendapatan Kotor</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                Rp {totalSalesRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Modal Barang Terjual (HPP)</span>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">
                Rp {cogsTotal.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Estimasi Laba Kotor</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                Rp {grossProfit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT SECTION 3: STOK & VALUASI */}
      {activeReportTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Nilai Aset Modal Stok (Harga Beli)</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                Rp {stockCostValue.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Potensi Nilai Jual Stok</span>
              <div className="text-2xl font-extrabold text-brand-400 mt-1">
                Rp {stockSellValue.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT SECTION 4: KAS */}
      {activeReportTab === 'cash' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Pemasukan Kas Tunai</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                Rp {cashSales.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs text-slate-400">Pemasukan Non-Tunai (QRIS & Transfer)</span>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">
                Rp {nonCashSales.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
