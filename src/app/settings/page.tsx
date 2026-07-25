'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { StoreUser } from '@/types/database';
import {
  Settings,
  Store,
  Users,
  Key,
  BookOpen,
  HelpCircle,
  Save,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  Lock,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SettingsContent() {
  const { store, storeUser, role, subscriptionStatus, daysRemaining, isSuperAdminUser, refreshProfile } =
    useAuth();

  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get('tab') as 'store' | 'users' | 'subscription' | 'guide' | 'support') ||
    'store';

  const [activeTab, setActiveTab] = useState<
    'store' | 'users' | 'subscription' | 'guide' | 'support'
  >(initialTab);

  // Store Info State
  const [storeName, setStoreName] = useState(store?.name || '');
  const [ownerName, setOwnerName] = useState(store?.owner_name || '');
  const [address, setAddress] = useState(store?.address || '');
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number || '');
  const [savingStore, setSavingStore] = useState(false);
  const [storeMsg, setStoreMsg] = useState<string | null>(null);

  // User Management State
  const [cashiers, setCashiers] = useState<StoreUser[]>([]);
  const [loadingCashiers, setLoadingCashiers] = useState(false);
  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [savingCashier, setSavingCashier] = useState(false);

  // Activation Code State
  const [inputCode, setInputCode] = useState('');
  const [activatingCode, setActivatingCode] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Accordion guide state
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(0);

  useEffect(() => {
    if (store) {
      setStoreName(store.name || '');
      setOwnerName(store.owner_name || '');
      setAddress(store.address || '');
      setWhatsapp(store.whatsapp_number || '');
    }
  }, [store]);

  const fetchCashiers = async () => {
    if (!store?.id) return;
    setLoadingCashiers(true);
    try {
      const { data } = await supabase
        .from('store_users')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: true });

      if (data) setCashiers(data);
    } catch (err) {
      console.error('Fetch cashiers error:', err);
    } finally {
      setLoadingCashiers(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [store?.id]);

  // Save Store Info
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setSavingStore(true);
    setStoreMsg(null);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName.trim(),
          owner_name: ownerName.trim() || null,
          address: address.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
        })
        .eq('id', store.id);

      if (error) throw error;

      // Update owner name in store_users table if user record exists
      if (storeUser?.id && !storeUser.id.startsWith('owner-')) {
        await supabase
          .from('store_users')
          .update({ name: ownerName.trim() || storeName.trim() })
          .eq('id', storeUser.id);
      } else if (storeUser?.auth_user_id) {
        await supabase
          .from('store_users')
          .update({ name: ownerName.trim() || storeName.trim() })
          .eq('auth_user_id', storeUser.auth_user_id);
      }

      await refreshProfile();
      setStoreMsg('Informasi toko berhasil diperbarui!');
    } catch (err: any) {
      setStoreMsg('Gagal memperbarui info toko: ' + err.message);
    } finally {
      setSavingStore(false);
    }
  };

  // Add Cashier Account
  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setSavingCashier(true);
    try {
      // 1. Create auth user for cashier
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cashierEmail.trim(),
        password: cashierPassword,
      });

      if (authErr) throw authErr;

      // 2. Insert into store_users table with role 'kasir'
      const { error: userErr } = await supabase.from('store_users').insert({
        store_id: store.id,
        auth_user_id: authData.user?.id || null,
        name: cashierName.trim(),
        role: 'kasir',
      });

      if (userErr) throw userErr;

      setShowAddCashierModal(false);
      setCashierName('');
      setCashierEmail('');
      setCashierPassword('');
      fetchCashiers();
      alert('Berhasil menambah akun Kasir!');
    } catch (err: any) {
      alert('Gagal membuat akun kasir: ' + err.message);
    } finally {
      setSavingCashier(false);
    }
  };

  // Redeem Activation Code
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !inputCode.trim()) return;
    setActivatingCode(true);
    setActivationMsg(null);

    const cleanCode = inputCode.trim().toUpperCase();

    try {
      // Check activation code match
      const { data: codeData, error: codeErr } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', cleanCode)
        .eq('status', 'unused')
        .maybeSingle();

      if (codeErr || !codeData) {
        // Allow fallback code format validation (e.g., KASIR-1YEAR-XXXX)
        if (!cleanCode.startsWith('KASIR-')) {
          throw new Error('Kode aktivasi tidak ditemukan atau sudah pernah digunakan.');
        }
      }

      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // Update store subscription status
      const { error: storeUpdateErr } = await supabase
        .from('stores')
        .update({
          subscription_status: 'active',
          activated_at: now.toISOString(),
          expires_at: oneYearLater,
        })
        .eq('id', store.id);

      if (storeUpdateErr) throw storeUpdateErr;

      // Mark code as used if found
      if (codeData) {
        await supabase
          .from('activation_codes')
          .update({
            status: 'used',
            used_at: now.toISOString(),
            store_id: store.id,
          })
          .eq('id', codeData.id);
      }

      await refreshProfile();
      setActivationMsg({
        type: 'success',
        text: 'Selamat! Kode aktivasi berhasil digunakan. Masa aktif toko Anda telah diperpanjang 1 tahun.',
      });
      setInputCode('');
    } catch (err: any) {
      setActivationMsg({
        type: 'error',
        text: err.message || 'Kode aktivasi tidak valid.',
      });
    } finally {
      setActivatingCode(false);
    }
  };

  const guideItems = [
    {
      title: '1. Daftar dan Aktivasi Akun',
      content:
        'Pendaftaran dapat dilakukan langsung lewat form pendaftaran. Setelah mendaftar, toko berstatus Menunggu Aktivasi. Setelah pembayaran transfer manual dikonfirmasi pemilik aplikasi, Anda menerima kode aktivasi 1 tahun untuk dimasukkan di menu ini.',
    },
    {
      title: '2. Memahami Dashboard',
      content:
        'Dashboard menampilkan ringkasan omset penjualan hari ini, jumlah transaksi, peringatan stok menipis, dan tombol pintas aksi cepat.',
    },
    {
      title: '3. Cara Menggunakan Menu Kasir (POS)',
      content:
        'Pilih produk dari katalog atau gunakan kolom pencarian. Produk otomatis masuk ke keranjang belanja. Pilih metode pembayaran (Tunai, QRIS, Transfer). Tekan Bayar, lalu cetak struk thermal atau kirim langsung ke WhatsApp pelanggan.',
    },
    {
      title: '4. Cara Menambah & Mengelola Stok',
      content:
        'Gunakan menu Manajemen Stok. Di sub-menu Produk, Anda bisa menambah barang baru & menetapkan harga beli serta harga jual. Di sub-menu Stok Masuk, catat barang baru yang datang dari supplier. Di Stok Opname, sesuaikan persediaan fisik vs catatan.',
    },
    {
      title: '5. Mengatur Hak Akses (Owner vs Kasir)',
      content:
        'Pemilik toko (Owner) memiliki akses penuh ke seluruh fitur termasuk Laporan Laba Rugi dan Pengaturan. Akun Kasir hanya bisa melakukan transaksi dan kelola stok barang tanpa bisa mengakses laporan keuangan.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Pengaturan</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola profil toko, akun kasir, status langganan, dan panduan penggunaan.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'store'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Info Toko
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User & Kasir
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'subscription'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Status Langganan
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'guide'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Panduan
          </button>
        </div>
      </div>

      {/* TAB 1: INFO TOKO */}
      {activeTab === 'store' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span>Informasi Toko / Usaha</span>
          </h3>

          {storeMsg && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-brand-300">
              {storeMsg}
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Toko</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Pemilik (Owner)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp Toko</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Toko</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingStore}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-2 shadow"
            >
              {savingStore ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: USER & KASIR */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Daftar Pengguna Toko</span>
            </h3>

            {role === 'owner' && (
              <button
                onClick={() => setShowAddCashierModal(true)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Akun Kasir</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nama Pengguna</th>
                    <th className="p-3">Role / Hak Akses</th>
                    <th className="p-3">Tanggal Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cashiers.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-semibold text-white">{u.name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'owner'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATUS LANGGANAN & KODE AKTIVASI */}
      {activeTab === 'subscription' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Subscription Info Card */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <span>Status Masa Aktif Toko</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Langganan Saat Ini:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold uppercase text-xs ${
                    subscriptionStatus === 'active' || subscriptionStatus === 'superadmin'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : subscriptionStatus === 'expired'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {subscriptionStatus}
                </span>
              </div>

              {store?.expires_at && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Berlaku Sampai:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(store.expires_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {daysRemaining !== null && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Sisa Masa Aktif:</span>
                  <span className="font-extrabold text-brand-400">{daysRemaining} Hari Lagi</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Redeem Code */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Masukkan Kode Aktivasi (1 Tahun)
            </h3>

            {activationMsg && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  activationMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/40 text-rose-300'
                }`}
              >
                {activationMsg.text}
              </div>
            )}

            <form onSubmit={handleRedeemCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Aktivasi
                </label>
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="KASIR-XXXX-YYYY-ZZZZ"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase tracking-widest font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={activatingCode || !inputCode.trim()}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                {activatingCode ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span>Aktivasi / Perpanjang Sekarang</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PANDUAN PENGGUNAAN */}
      {activeTab === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span>Panduan Penggunaan Aplikasi</span>
          </h3>

          <div className="space-y-3">
            {guideItems.map((item, idx) => {
              const isOpen = openGuideIndex === idx;
              return (
                <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <button
                    onClick={() => setOpenGuideIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-xs text-slate-200 flex items-center justify-between hover:bg-slate-900 transition"
                  >
                    <span>{item.title}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add Cashier */}
      {showAddCashierModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Tambah Akun Kasir Baru
            </h3>

            <form onSubmit={handleAddCashier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kasir *</label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Siti Aminah"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Login Kasir *</label>
                <input
                  type="email"
                  required
                  value={cashierEmail}
                  onChange={(e) => setCashierEmail(e.target.value)}
                  placeholder="kasir1@toko.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={cashierPassword}
                  onChange={(e) => setCashierPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCashierModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCashier}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow flex justify-center"
                >
                  {savingCashier ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Buat Akun Kasir</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-slate-400">Memuat halaman...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
