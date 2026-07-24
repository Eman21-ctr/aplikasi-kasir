'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Product, StockMovement } from '@/types/database';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ClipboardCheck,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  X,
  CheckCircle2,
  Package,
  TrendingUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function InventoryContent() {
  const { store, storeUser } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'products' | 'stockin' | 'opname') || 'products';
  const initialFilter = searchParams.get('filter');

  const [activeTab, setActiveTab] = useState<'products' | 'stockin' | 'opname'>(initialTab);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(initialFilter === 'low');
  const [loading, setLoading] = useState(true);

  // Product Modal (Add/Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodUnit, setProdUnit] = useState('pcs');
  const [prodSku, setProdSku] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState<number>(0);
  const [prodSellPrice, setProdSellPrice] = useState<number>(0);
  const [prodInitialStock, setProdInitialStock] = useState<number>(0);
  const [prodMinAlert, setProdMinAlert] = useState<number>(5);
  const [savingProduct, setSavingProduct] = useState(false);

  // Stock In State
  const [stockInProductId, setStockInProductId] = useState('');
  const [stockInQty, setStockInQty] = useState<number>(0);
  const [stockInCostPrice, setStockInCostPrice] = useState<number>(0);
  const [stockInUpdateSellPrice, setStockInUpdateSellPrice] = useState<boolean>(false);
  const [stockInNewSellPrice, setStockInNewSellPrice] = useState<number>(0);
  const [stockInNote, setStockInNote] = useState('');
  const [savingStockIn, setSavingStockIn] = useState(false);
  const [stockInHistory, setStockInHistory] = useState<StockMovement[]>([]);

  // Stock Opname State
  const [opnameProductId, setOpnameProductId] = useState('');
  const [opnamePhysicalQty, setOpnamePhysicalQty] = useState<number>(0);
  const [opnameNote, setOpnameNote] = useState('');
  const [savingOpname, setSavingOpname] = useState(false);
  const [opnameHistory, setOpnameHistory] = useState<StockMovement[]>([]);

  const fetchProducts = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) setProducts(data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    if (!store?.id) return;
    try {
      const { data } = await supabase
        .from('stock_movements')
        .select('*, products(name, unit), store_users(name)')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (data) {
        setStockInHistory(data.filter((m) => m.type === 'stok_masuk'));
        setOpnameHistory(data.filter((m) => m.type === 'opname'));
      }
    } catch (err) {
      console.error('Fetch movements error:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStockMovements();
  }, [store?.id]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLow = !filterLowStock || p.current_stock <= p.min_stock_alert;

      return matchesQuery && matchesLow;
    });
  }, [products, searchQuery, filterLowStock]);

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('');
    setProdUnit('pcs');
    setProdSku('');
    setProdCostPrice(0);
    setProdSellPrice(0);
    setProdInitialStock(0);
    setProdMinAlert(5);
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category || '');
    setProdUnit(prod.unit || 'pcs');
    setProdSku(prod.sku || '');
    setProdCostPrice(prod.cost_price);
    setProdSellPrice(prod.sell_price);
    setProdInitialStock(prod.current_stock);
    setProdMinAlert(prod.min_stock_alert);
    setShowProductModal(true);
  };

  // Save Product (Insert or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;
    setSavingProduct(true);
    try {
      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({
            name: prodName.trim(),
            category: prodCategory.trim() || null,
            unit: prodUnit.trim() || 'pcs',
            sku: prodSku.trim() || null,
            cost_price: prodCostPrice,
            sell_price: prodSellPrice,
            current_stock: prodInitialStock,
            min_stock_alert: prodMinAlert,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Insert product
        const { data: newProd, error } = await supabase
          .from('products')
          .insert({
            store_id: store.id,
            name: prodName.trim(),
            category: prodCategory.trim() || null,
            unit: prodUnit.trim() || 'pcs',
            sku: prodSku.trim() || null,
            cost_price: prodCostPrice,
            sell_price: prodSellPrice,
            current_stock: prodInitialStock,
            min_stock_alert: prodMinAlert,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Record initial stock movement if stock > 0
        if (prodInitialStock > 0 && newProd) {
          await supabase.from('stock_movements').insert({
            store_id: store.id,
            product_id: newProd.id,
            type: 'stok_masuk',
            quantity_change: prodInitialStock,
            cost_price: prodCostPrice,
            created_by: storeUser?.id || null,
            note: 'Stok Awal Produk Baru',
          });
        }
      }

      setShowProductModal(false);
      fetchProducts();
      fetchStockMovements();
    } catch (err: any) {
      alert('Gagal menyimpan produk: ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Soft Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini dari katalog?')) return;
    try {
      await supabase.from('products').update({ is_active: false }).eq('id', id);
      fetchProducts();
    } catch (err: any) {
      alert('Gagal menghapus produk');
    }
  };

  // Submit Stock In
  const handleSaveStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !stockInProductId || stockInQty <= 0) return;
    setSavingStockIn(true);

    try {
      const selectedProd = products.find((p) => p.id === stockInProductId);
      if (!selectedProd) return;

      const newStock = selectedProd.current_stock + stockInQty;

      // 1. Insert stock movement record
      const { error: moveErr } = await supabase.from('stock_movements').insert({
        store_id: store.id,
        product_id: stockInProductId,
        type: 'stok_masuk',
        quantity_change: stockInQty,
        cost_price: stockInCostPrice || selectedProd.cost_price,
        created_by: storeUser?.id || null,
        note: stockInNote.trim() || 'Stok Masuk Supplier',
      });

      if (moveErr) throw moveErr;

      // 2. Update product stock (and optional sell price)
      const updateData: any = {
        current_stock: newStock,
        cost_price: stockInCostPrice || selectedProd.cost_price,
      };

      if (stockInUpdateSellPrice && stockInNewSellPrice > 0) {
        updateData.sell_price = stockInNewSellPrice;
      }

      await supabase.from('products').update(updateData).eq('id', stockInProductId);

      // Reset Form
      setStockInProductId('');
      setStockInQty(0);
      setStockInCostPrice(0);
      setStockInNote('');
      setStockInUpdateSellPrice(false);

      fetchProducts();
      fetchStockMovements();
      alert('Berhasil mencatat Stok Masuk!');
    } catch (err: any) {
      alert('Gagal mencatat stok masuk: ' + err.message);
    } finally {
      setSavingStockIn(false);
    }
  };

  // Submit Stock Opname
  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !opnameProductId) return;
    setSavingOpname(true);

    try {
      const selectedProd = products.find((p) => p.id === opnameProductId);
      if (!selectedProd) return;

      const diff = opnamePhysicalQty - selectedProd.current_stock;

      // Insert stock movement record
      const { error: moveErr } = await supabase.from('stock_movements').insert({
        store_id: store.id,
        product_id: opnameProductId,
        type: 'opname',
        quantity_change: diff,
        created_by: storeUser?.id || null,
        note:
          opnameNote.trim() ||
          `Opname: Fisik (${opnamePhysicalQty}) vs Catatan (${selectedProd.current_stock})`,
      });

      if (moveErr) throw moveErr;

      // Update product current stock to physical qty
      await supabase
        .from('products')
        .update({ current_stock: opnamePhysicalQty })
        .eq('id', opnameProductId);

      // Reset Form
      setOpnameProductId('');
      setOpnamePhysicalQty(0);
      setOpnameNote('');

      fetchProducts();
      fetchStockMovements();
      alert('Berhasil menyesuaikan Stok Opname!');
    } catch (err: any) {
      alert('Gagal mencatat stok opname: ' + err.message);
    } finally {
      setSavingOpname(false);
    }
  };

  const selectedOpnameProd = products.find((p) => p.id === opnameProductId);

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-400" />
            <span>Manajemen Stok & Produk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola katalog barang, penerimaan stok dari supplier, dan penyesuaian opname.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Katalog Produk
          </button>
          <button
            onClick={() => setActiveTab('stockin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'stockin'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stok Masuk
          </button>
          <button
            onClick={() => setActiveTab('opname')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'opname'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stok Opname
          </button>
        </div>
      </div>

      {/* TAB 1: KATALOG PRODUK */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  filterLowStock
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stok Menipis</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Memuat data produk...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 p-4">
                Belum ada produk yang cocok. Klik &quot;Tambah Produk Baru&quot; untuk memulai.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga Beli</th>
                      <th className="p-3">Harga Jual</th>
                      <th className="p-3">Stok Saat Ini</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((prod) => {
                      const isLow = prod.current_stock <= prod.min_stock_alert;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-850/50 transition">
                          <td className="p-3 font-semibold text-white">
                            <div>{prod.name}</div>
                            {prod.sku && (
                              <div className="text-[10px] text-slate-500">SKU: {prod.sku}</div>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">
                            {prod.category ? (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {prod.category}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-slate-400">
                            Rp {prod.cost_price.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 font-bold text-brand-400">
                            Rp {prod.sell_price.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLow
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {prod.current_stock} {prod.unit || 'pcs'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditModal(prod)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STOK MASUK */}
      {activeTab === 'stockin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Form Record Stock In */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>Pencatatan Stok Masuk</span>
            </h3>

            <form onSubmit={handleSaveStockIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Produk *
                </label>
                <select
                  required
                  value={stockInProductId}
                  onChange={(e) => {
                    setStockInProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) {
                      setStockInCostPrice(p.cost_price);
                      setStockInNewSellPrice(p.sell_price);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jumlah Masuk *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={stockInQty || ''}
                    onChange={(e) => setStockInQty(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga Beli/Modal (Rp)
                  </label>
                  <input
                    type="number"
                    value={stockInCostPrice || ''}
                    onChange={(e) => setStockInCostPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan (Supplier / Nota)
                </label>
                <input
                  type="text"
                  value={stockInNote}
                  onChange={(e) => setStockInNote(e.target.value)}
                  placeholder="Contoh: Toko Grosir Jaya / Nota #102"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Checkbox Ubah Harga Jual */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stockInUpdateSellPrice}
                    onChange={(e) => setStockInUpdateSellPrice(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-500"
                  />
                  <span>Ubah harga jual produk ini secara bersamaan</span>
                </label>

                {stockInUpdateSellPrice && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Harga Jual Baru (Rp)
                    </label>
                    <input
                      type="number"
                      value={stockInNewSellPrice || ''}
                      onChange={(e) => setStockInNewSellPrice(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={savingStockIn || !stockInProductId || stockInQty <= 0}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
              >
                {savingStockIn ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span>Simpan Stok Masuk</span>
                )}
              </button>
            </form>
          </div>

          {/* History Stock In */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 border-b border-slate-800 pb-3">
              Riwayat Stok Masuk
            </h3>

            {stockInHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada riwayat pencatatan stok masuk.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {stockInHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {(item as any).products?.name || 'Produk'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Note: {item.note || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs inline-block">
                        +{item.quantity_change} {(item as any).products?.unit || 'pcs'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STOK OPNAME */}
      {activeTab === 'opname' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Form Record Opname */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
              <span>Form Stok Opname Fisik</span>
            </h3>

            <form onSubmit={handleSaveOpname} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Produk *
                </label>
                <select
                  required
                  value={opnameProductId}
                  onChange={(e) => {
                    setOpnameProductId(e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setOpnamePhysicalQty(p.current_stock);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOpnameProd && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Stok Catatan Sistem:</span>
                    <span className="font-bold text-white">
                      {selectedOpnameProd.current_stock} {selectedOpnameProd.unit}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Stok Fisik Sebenarnya *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={opnamePhysicalQty}
                  onChange={(e) => setOpnamePhysicalQty(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {selectedOpnameProd && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between font-semibold">
                  <span>Selisih Penyesuaian:</span>
                  <span
                    className={
                      opnamePhysicalQty - selectedOpnameProd.current_stock >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  >
                    {opnamePhysicalQty - selectedOpnameProd.current_stock >= 0 ? '+' : ''}
                    {opnamePhysicalQty - selectedOpnameProd.current_stock}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Alasan Alokasi (Opsional)
                </label>
                <input
                  type="text"
                  value={opnameNote}
                  onChange={(e) => setOpnameNote(e.target.value)}
                  placeholder="Contoh: Rusak 2 pcs / Salah hitung sebelumnya"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingOpname || !opnameProductId}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
              >
                {savingOpname ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <span>Simpan Penyesuaian Opname</span>
                )}
              </button>
            </form>
          </div>

          {/* History Opname */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 border-b border-slate-800 pb-3">
              Riwayat Stok Opname
            </h3>

            {opnameHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada riwayat stok opname.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {opnameHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {(item as any).products?.name || 'Produk'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.note || 'Stok Opname'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-xs inline-block ${
                          item.quantity_change >= 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.quantity_change >= 0 ? '+' : ''}
                        {item.quantity_change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Minyak Goreng 1 Liter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategori (Opsional)
                  </label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="Sembako, Minuman, etc."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Satuan *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    placeholder="pcs, kg, liter, bungkus"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SKU / Barcode (Opsional)
                </label>
                <input
                  type="text"
                  value={prodSku}
                  onChange={(e) => setProdSku(e.target.value)}
                  placeholder="Barcode 899..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga Beli / Modal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodSellPrice}
                    onChange={(e) => setProdSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodInitialStock}
                    onChange={(e) => setProdInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batas Alert Stok Menipis *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodMinAlert}
                    onChange={(e) => setProdMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow flex justify-center"
                >
                  {savingProduct ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Simpan Produk</span>
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

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-slate-400">Memuat halaman...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
