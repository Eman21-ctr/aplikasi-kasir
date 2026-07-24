'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Product, PaymentMethod, Transaction } from '@/types/database';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export default function PosPage() {
  const { store, storeUser, subscriptionStatus, isSuperAdminUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [trxError, setTrxError] = useState<string | null>(null);

  // Receipt Modal state
  const [completedTrx, setCompletedTrx] = useState<{
    trx: Transaction;
    items: CartItem[];
    cashPaid?: number;
    changeAmount?: number;
  } | null>(null);

  // History state
  const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryTrx, setSelectedHistoryTrx] = useState<any | null>(null);

  const fetchProducts = async () => {
    if (!store?.id) return;
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHistory = async () => {
    if (!store?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistoryTransactions(data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [store?.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, store?.id]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * product.sell_price,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          price: product.sell_price,
          subtotal: product.sell_price,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  // Cash change calculations
  const parsedCash = Number(cashAmount) || 0;
  const changeAmount = parsedCash - totalCartAmount;

  // Process Payment
  const handleProcessPayment = async () => {
    if (!store?.id) return;
    if (cart.length === 0) return;

    if (paymentMethod === 'tunai' && parsedCash < totalCartAmount) {
      setTrxError('Jumlah uang tunai kurang dari total belanja.');
      return;
    }

    setProcessingTransaction(true);
    setTrxError(null);

    try {
      // Generate transaction number TRX-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const trxNum = `TRX-${dateStr}-${randomCode}`;

      // 1. Insert transaction header
      const { data: trxData, error: trxErr } = await supabase
        .from('transactions')
        .insert({
          store_id: store.id,
          transaction_number: trxNum,
          cashier_id: storeUser?.id || null,
          payment_method: paymentMethod,
          total_amount: totalCartAmount,
          status: 'selesai',
        })
        .select()
        .single();

      if (trxErr) throw trxErr;

      // 2. Insert transaction items
      const itemsToInsert = cart.map((item) => ({
        store_id: store.id,
        transaction_id: trxData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_at_sale: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      // 3. Update stock levels & record stock movements
      for (const item of cart) {
        const newStock = Math.max(0, item.product.current_stock - item.quantity);

        // Update products
        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', item.product.id);

        // Record stock_movements
        await supabase.from('stock_movements').insert({
          store_id: store.id,
          product_id: item.product.id,
          type: 'penjualan',
          quantity_change: -item.quantity,
          created_by: storeUser?.id || null,
          note: `Penjualan ${trxNum}`,
        });
      }

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      // Open Receipt Modal
      setCompletedTrx({
        trx: trxData,
        items: [...cart],
        cashPaid: paymentMethod === 'tunai' ? parsedCash : totalCartAmount,
        changeAmount: paymentMethod === 'tunai' ? changeAmount : 0,
      });

      setShowPaymentModal(false);
      clearCart();
      setCashAmount('');
      fetchProducts(); // Refresh local stock counts
    } catch (err: any) {
      setTrxError(err.message || 'Gagal memproses transaksi. Coba lagi.');
    } finally {
      setProcessingTransaction(false);
    }
  };

  // WhatsApp receipt generator
  const getWhatsAppShareLink = (trx: Transaction, items: any[], cashPaid?: number, change?: number) => {
    let text = `*STRUK PENJUALAN - ${store?.name || 'Kasir'}*\n`;
    text += `No: ${trx.transaction_number}\n`;
    text += `Tanggal: ${new Date(trx.created_at).toLocaleString('id-ID')}\n`;
    text += `Metode Bayar: ${trx.payment_method.toUpperCase()}\n`;
    text += `--------------------------------\n`;

    items.forEach((item) => {
      text += `${item.product_name || item.product?.name} x${item.quantity} = Rp ${(
        item.subtotal || item.quantity * item.price_at_sale
      ).toLocaleString('id-ID')}\n`;
    });

    text += `--------------------------------\n`;
    text += `*TOTAL: Rp ${Number(trx.total_amount).toLocaleString('id-ID')}*\n`;
    if (trx.payment_method === 'tunai' && cashPaid) {
      text += `Bayar: Rp ${cashPaid.toLocaleString('id-ID')}\n`;
      text += `Kembali: Rp ${(change || 0).toLocaleString('id-ID')}\n`;
    }
    text += `\nTerima kasih telah berbelanja! 🙏`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const isBlocked =
    !isSuperAdminUser && (subscriptionStatus === 'pending' || subscriptionStatus === 'expired');

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Kasir Penjualan (POS)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilih produk, atur keranjang, dan cetak struk transaksi.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full">
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full text-center py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pos'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kasir Aktif
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-center py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Riwayat Transaksi
          </button>
        </div>
      </div>

      {isBlocked && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold">Fitur Kasir Terkunci</p>
            <p className="text-[11px] text-amber-300/80">
              Akun toko Anda berstatus <strong>{subscriptionStatus}</strong>. Masukkan kode aktivasi
              di menu Pengaturan untuk membuka transaksi.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'pos' ? (
        /* POS Layout: Left Product Selector, Right Cart */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Search & Product Catalog (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk berdasarkan nama, SKU, atau kategori..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                <span>Memuat katalog produk...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 p-6">
                Tidak ada produk ditemukan. Tambahkan produk di menu <strong>Manajemen Stok</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[62vh] overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock_alert;
                  const isOutOfStock = product.current_stock <= 0;

                  return (
                    <button
                      key={product.id}
                      disabled={isOutOfStock || isBlocked}
                      onClick={() => addToCart(product)}
                      className={`text-left p-3 rounded-2xl border transition flex flex-col justify-between relative group ${
                        isOutOfStock
                          ? 'bg-slate-950/60 border-slate-850 opacity-50 cursor-not-allowed'
                          : 'bg-slate-900 border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-850 shadow-sm active:scale-95'
                      }`}
                    >
                      <div>
                        {product.category && (
                          <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider">
                            {product.category}
                          </span>
                        )}
                        <h4 className="text-xs font-semibold text-white line-clamp-2 mt-0.5 leading-snug">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="font-extrabold text-xs text-brand-400">
                          Rp {product.sell_price.toLocaleString('id-ID')}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          Stok: {product.current_stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Cart & Summary (5 cols on lg) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[500px] shadow-sm">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-brand-400" />
                  <h3 className="text-xs font-bold text-white">Keranjang Belanja</h3>
                  <span className="text-[10px] bg-brand-500/20 text-brand-400 font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((a, b) => a + b.quantity, 0)} item
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30 stroke-[1.5]" />
                  <p>Keranjang masih kosong.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Ketuk item di sebelah kiri untuk menambah ke keranjang.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 my-3 max-h-[380px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-slate-200 line-clamp-1">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          @ Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Quantity Selector Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-l-lg transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-r-lg transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="w-20 text-right font-bold text-brand-400 text-xs">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary Footer & Pay Button */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Total Pembayaran</span>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Rp {totalCartAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                disabled={cart.length === 0 || isBlocked}
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4 stroke-[2.5]" />
                <span>BAYAR SEKARANG (Rp {totalCartAmount.toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Riwayat Penjualan Toko</span>
            </h3>
            <button
              onClick={fetchHistory}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
          ) : historyTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Belum ada riwayat transaksi.</div>
          ) : (
            <div className="space-y-3">
              {historyTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{trx.transaction_number}</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-semibold uppercase border border-brand-500/20">
                        {trx.payment_method}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Waktu: {new Date(trx.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-brand-400">
                        Rp {Number(trx.total_amount).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {(trx as any).transaction_items?.length || 0} item
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setCompletedTrx({
                          trx,
                          items: (trx as any).transaction_items || [],
                        })
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Struk</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-400" />
                <span>Pilih Metode Pembayaran</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {trxError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs">
                {trxError}
              </div>
            )}

            {/* Total Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Total Tagihan</span>
              <div className="text-2xl font-extrabold text-white mt-0.5">
                Rp {totalCartAmount.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tunai')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'tunai'
                      ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'qris'
                      ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'transfer'
                      ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Tunai Calculator */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Quick Nominal Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashAmount(totalCartAmount.toString())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setCashAmount(nom.toString())}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200"
                    >
                      {nom / 1000}rb
                    </button>
                  ))}
                </div>

                {/* Change Calculator */}
                {parsedCash >= totalCartAmount && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 flex items-center justify-between text-xs font-semibold">
                    <span>Kembalian</span>
                    <span className="text-base font-extrabold text-white">
                      Rp {changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingTransaction}
                onClick={handleProcessPayment}
                className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow"
              >
                {processingTransaction ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span>Selesaikan Bayar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Transaction Receipt Modal */}
      {completedTrx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Transaksi Selesai</span>
              </h3>
              <button
                onClick={() => setCompletedTrx(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper Layout */}
            <div
              id="thermal-receipt-modal"
              className="bg-white text-black p-4 rounded-xl font-mono text-[11px] leading-tight space-y-2 shadow-inner"
            >
              <div className="text-center">
                <h2 className="font-bold text-sm uppercase">{store?.name || 'KASIR'}</h2>
                <p className="text-[10px]">{store?.address || 'Alamat Toko'}</p>
                <p className="text-[10px]">WA: {store?.whatsapp_number || '-'}</p>
              </div>

              <div className="border-b border-dashed border-gray-400 py-1">
                <div>No: {completedTrx.trx.transaction_number}</div>
                <div>Tgl: {new Date(completedTrx.trx.created_at).toLocaleString('id-ID')}</div>
                <div>Bayar: {completedTrx.trx.payment_method.toUpperCase()}</div>
              </div>

              <div className="space-y-1 py-1">
                {completedTrx.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.product_name || item.product?.name} x{item.quantity}
                    </span>
                    <span>
                      Rp {(item.subtotal || item.quantity * item.price_at_sale).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-1 space-y-0.5 font-bold">
                <div className="flex justify-between text-xs">
                  <span>TOTAL:</span>
                  <span>Rp {Number(completedTrx.trx.total_amount).toLocaleString('id-ID')}</span>
                </div>
                {completedTrx.trx.payment_method === 'tunai' && completedTrx.cashPaid && (
                  <>
                    <div className="flex justify-between text-[10px] font-normal">
                      <span>BAYAR TUNAI:</span>
                      <span>Rp {completedTrx.cashPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-normal">
                      <span>KEMBALI:</span>
                      <span>Rp {(completedTrx.changeAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-[9px] pt-2 border-t border-dashed border-gray-400">
                Terima kasih atas kunjungan Anda!
              </div>
            </div>

            {/* Actions: Print & WhatsApp */}
            <div className="space-y-2 no-print">
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-brand-400" />
                <span>Cetak Thermal Struk</span>
              </button>

              <a
                href={getWhatsAppShareLink(
                  completedTrx.trx,
                  completedTrx.items,
                  completedTrx.cashPaid,
                  completedTrx.changeAmount
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Struk via WhatsApp</span>
              </a>

              <button
                onClick={() => setCompletedTrx(null)}
                className="w-full py-2 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
              >
                Tutup Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
