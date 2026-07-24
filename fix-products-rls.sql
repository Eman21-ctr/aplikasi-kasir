-- ============================================================
-- FIX RLS PRODUK, STOK, TRANSAKSI & LINK STORE USERS
-- Jalankan skrip ini di Supabase SQL Editor
-- ============================================================

-- 1. Perbarui fungsi get_my_store_id() agar mengecek store_users DAN stores
create or replace function get_my_store_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select store_id from (
    select store_id from store_users where auth_user_id = auth.uid()
    union
    select id as store_id from stores where auth_user_id = auth.uid()
  ) t limit 1;
$$;

-- 2. Pastikan semua toko yang pernah terdaftar otomatis punya entry di store_users
insert into store_users (store_id, auth_user_id, name, role)
select s.id, s.auth_user_id, coalesce(s.owner_name, s.name, 'Owner'), 'owner'
from stores s
where s.auth_user_id is not null
  and not exists (
    select 1 from store_users su where su.store_id = s.id and su.auth_user_id = s.auth_user_id
  );

-- 3. Kebijakan RLS untuk PRODUCTS
alter table products enable row level security;
drop policy if exists "kelola produk satu toko" on products;

create policy "kelola produk satu toko" on products
  for all using (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com')
  with check (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

-- 4. Kebijakan RLS untuk STOCK_MOVEMENTS
alter table stock_movements enable row level security;
drop policy if exists "kelola stok satu toko" on stock_movements;

create policy "kelola stok satu toko" on stock_movements
  for all using (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com')
  with check (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

-- 5. Kebijakan RLS untuk TRANSACTIONS
alter table transactions enable row level security;
drop policy if exists "kelola transaksi satu toko" on transactions;

create policy "kelola transaksi satu toko" on transactions
  for all using (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com')
  with check (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

-- 6. Kebijakan RLS untuk TRANSACTION_ITEMS
alter table transaction_items enable row level security;
drop policy if exists "kelola item transaksi satu toko" on transaction_items;

create policy "kelola item transaksi satu toko" on transaction_items
  for all using (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com')
  with check (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');
