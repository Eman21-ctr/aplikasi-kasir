'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, SUPER_ADMIN_EMAIL } from '@/lib/supabase';
import { Store, ActivationCode } from '@/types/database';
import {
  ShieldCheck,
  Store as StoreIcon,
  Key,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminPage() {
  const { user, isSuperAdminUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all');

  // Generator State
  const [selectedStoreForCode, setSelectedStoreForCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all stores
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeData) setStores(storeData);

      // Fetch all activation codes
      const { data: codeData } = await supabase
        .from('activation_codes')
        .select('*, stores(name, owner_name, email)')
        .order('generated_at', { ascending: false });

      if (codeData) setCodes(codeData);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdminUser) {
      fetchAdminData();
    }
  }, [isSuperAdminUser]);

  // Filtered stores
  const filteredStores = stores.filter((st) => {
    const matchesSearch =
      !searchQuery.trim() ||
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.owner_name && st.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (st.email && st.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || st.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Generate unique activation code format: KASIR-XXXX-YYYY-ZZZZ
  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreForCode) return;
    setGenerating(true);
    setGeneratedCode(null);

    const randChunk = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const codeStr = `KASIR-${randChunk()}-${randChunk()}-${randChunk()}`;

    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .insert({
          store_id: selectedStoreForCode,
          code: codeStr,
          status: 'unused',
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedCode(codeStr);
      fetchAdminData();
    } catch (err: any) {
      alert('Gagal membuat kode aktivasi: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Instant direct activation by Super Admin
  const handleInstantActivateStore = async (storeId: string) => {
    if (!confirm('Aktivasi langsung langganan toko ini selama 1 tahun?')) return;
    try {
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('stores')
        .update({
          subscription_status: 'active',
          activated_at: now.toISOString(),
          expires_at: oneYearLater,
        })
        .eq('id', storeId);

      fetchAdminData();
      alert('Toko berhasil diaktifkan 1 tahun!');
    } catch (err: any) {
      alert('Gagal mengaktifkan toko');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isSuperAdminUser) {
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

  const pendingCount = stores.filter((s) => s.subscription_status === 'pending').length;
  const activeCount = stores.filter((s) => s.subscription_status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-950/90 via-slate-900 to-brand-950/90 border border-brand-500/30 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Dashboard Super Admin
            </h1>
          </div>
          <p className="text-xs text-brand-300/80 mt-1">
            Kelola pendaftaran toko lintas UMKM, generate kode aktivasi 1 tahun, dan perpanjangan langganan.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang Data</span>
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Toko Terdaftar</span>
          <div className="text-2xl font-extrabold text-white mt-1">{stores.length} Toko</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 bg-amber-950/20">
          <span className="text-xs text-amber-300 font-medium">Menunggu Aktivasi</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount} Toko</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 bg-emerald-950/20">
          <span className="text-xs text-emerald-300 font-medium">Toko Aktif</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount} Toko</div>
        </div>
      </div>

      {/* Generator Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <span>Generator Kode Aktivasi 1 Tahun</span>
        </h3>

        <form onSubmit={handleGenerateCode} className="flex flex-col sm:flex-row gap-3">
          <select
            required
            value={selectedStoreForCode}
            onChange={(e) => setSelectedStoreForCode(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="">-- Pilih Toko yang Membayar --</option>
            {stores.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.owner_name || st.email}) - Status: {st.subscription_status}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={generating || !selectedStoreForCode}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Kode Baru</span>
          </button>
        </form>

        {generatedCode && (
          <div className="p-4 bg-brand-950/60 border border-brand-500/40 rounded-xl flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] text-brand-300 font-semibold uppercase">
                Kode Aktivasi Siap Dikirim Ke Pengguna:
              </div>
              <div className="text-lg font-mono font-extrabold text-white tracking-widest mt-0.5">
                {generatedCode}
              </div>
            </div>

            <button
              onClick={() => handleCopyCode(generatedCode)}
              className="bg-brand-700 hover:bg-brand-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Stores List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Daftar Seluruh Toko Terdaftar</span>
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari toko / email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data toko...</div>
        ) : filteredStores.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Tidak ada toko ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama Toko</th>
                  <th className="p-3">Pemilik & Kontak</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Masa Aktif Sampai</th>
                  <th className="p-3 text-right">Aksi Langsung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStores.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-semibold text-white">
                      <div>{st.name}</div>
                      <div className="text-[10px] text-slate-500">ID: {st.id.slice(0, 8)}...</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <div>{st.owner_name || 'Owner'}</div>
                      <div className="text-[10px] text-slate-400">WA: {st.whatsapp_number || '-'}</div>
                      <div className="text-[10px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          st.subscription_status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : st.subscription_status === 'expired'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {st.subscription_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {st.expires_at
                        ? new Date(st.expires_at).toLocaleDateString('id-ID')
                        : 'Belum Aktif'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleInstantActivateStore(st.id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 ml-auto"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Aktivasi 1 Thn</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
