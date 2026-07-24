-- ============================================================
-- SKEMA DATABASE APLIKASI KASIR — siap dijalankan di Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. STORES
-- ============================================================
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  address text,
  whatsapp_number text,
  email text,
  auth_user_id uuid references auth.users(id),
  subscription_status text not null default 'pending'
    check (subscription_status in ('pending', 'active', 'expired')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. STORE_USERS (Owner dan Kasir)
-- ============================================================
create table store_users (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  auth_user_id uuid references auth.users(id),
  name text not null,
  role text not null check (role in ('owner', 'kasir')),
  created_at timestamptz not null default now()
);

create index idx_store_users_store_id on store_users(store_id);
create index idx_store_users_auth_user_id on store_users(auth_user_id);

-- ============================================================
-- 3. ACTIVATION_CODES
-- ============================================================
create table activation_codes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  code text not null unique,
  status text not null default 'unused' check (status in ('unused', 'used', 'void')),
  generated_at timestamptz not null default now(),
  used_at timestamptz,
  valid_until timestamptz
);

create index idx_activation_codes_store_id on activation_codes(store_id);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  category text,
  unit text,
  sku text,
  cost_price numeric not null default 0,
  sell_price numeric not null default 0,
  current_stock integer not null default 0,
  min_stock_alert integer not null default 5,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_products_store_id on products(store_id);

-- ============================================================
-- 5. STOCK_MOVEMENTS
-- ============================================================
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  type text not null check (type in ('stok_masuk', 'opname', 'penjualan')),
  quantity_change integer not null,
  cost_price numeric,
  note text,
  created_by uuid references store_users(id),
  created_at timestamptz not null default now()
);

create index idx_stock_movements_store_id on stock_movements(store_id);
create index idx_stock_movements_product_id on stock_movements(product_id);

-- ============================================================
-- 6. TRANSACTIONS
-- ============================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  transaction_number text not null,
  cashier_id uuid references store_users(id),
  payment_method text not null check (payment_method in ('tunai', 'qris', 'transfer')),
  total_amount numeric not null default 0,
  status text not null default 'selesai' check (status in ('selesai', 'dibatalkan')),
  created_at timestamptz not null default now()
);

create index idx_transactions_store_id on transactions(store_id);

-- ============================================================
-- 7. TRANSACTION_ITEMS
-- store_id ditambahkan di sini (walau tidak ada di dokumen md) supaya
-- aturan keamanan datanya lebih sederhana dan cepat dicek oleh database.
-- ============================================================
create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  transaction_id uuid not null references transactions(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity integer not null,
  price_at_sale numeric not null,
  subtotal numeric not null
);

create index idx_transaction_items_store_id on transaction_items(store_id);
create index idx_transaction_items_transaction_id on transaction_items(transaction_id);

-- ============================================================
-- FUNGSI BANTUAN: mengambil store_id milik user yang sedang login
-- ============================================================
create or replace function get_my_store_id()
returns uuid
language sql
stable
as $$
  select store_id from store_users where auth_user_id = auth.uid() limit 1
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Semua tabel hanya bisa diakses oleh user yang store_id-nya cocok
-- ============================================================

alter table stores enable row level security;
create policy "lihat toko sendiri" on stores
  for select using (id = get_my_store_id());
create policy "ubah toko sendiri" on stores
  for update using (id = get_my_store_id());

alter table store_users enable row level security;
create policy "lihat user satu toko" on store_users
  for select using (store_id = get_my_store_id());
create policy "tambah user satu toko" on store_users
  for insert with check (store_id = get_my_store_id());
create policy "ubah user satu toko" on store_users
  for update using (store_id = get_my_store_id());

alter table activation_codes enable row level security;
create policy "lihat kode aktivasi toko sendiri" on activation_codes
  for select using (store_id = get_my_store_id());
-- catatan: insert/update kode aktivasi sengaja TIDAK dibuka untuk user biasa.
-- itu hanya bisa dilakukan lewat service role (dashboard admin kamu).

alter table products enable row level security;
create policy "kelola produk satu toko" on products
  for all using (store_id = get_my_store_id())
  with check (store_id = get_my_store_id());

alter table stock_movements enable row level security;
create policy "kelola stok satu toko" on stock_movements
  for all using (store_id = get_my_store_id())
  with check (store_id = get_my_store_id());

alter table transactions enable row level security;
create policy "kelola transaksi satu toko" on transactions
  for all using (store_id = get_my_store_id())
  with check (store_id = get_my_store_id());

alter table transaction_items enable row level security;
create policy "kelola item transaksi satu toko" on transaction_items
  for all using (store_id = get_my_store_id())
  with check (store_id = get_my_store_id());
