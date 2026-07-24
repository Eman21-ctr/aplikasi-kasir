-- ============================================================
-- SQL POLICY SUPER ADMIN LINTAS TOKO
-- Jalankan skrip ini di Supabase SQL Editor agar Super Admin (journalwarga@gmail.com)
-- bisa melihat semua toko, me-generate kode aktivasi, dan melakukan perpanjangan.
-- ============================================================

-- 1. Policy Super Admin untuk tabel STORES
drop policy if exists "superadmin_stores_all" on stores;
create policy "superadmin_stores_all" on stores
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );

-- 2. Policy Super Admin untuk tabel ACTIVATION_CODES
drop policy if exists "superadmin_codes_all" on activation_codes;
create policy "superadmin_codes_all" on activation_codes
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  )
  with check (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );

-- 3. Policy Super Admin untuk tabel STORE_USERS
drop policy if exists "superadmin_store_users_all" on store_users;
create policy "superadmin_store_users_all" on store_users
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );

-- 4. Policy Super Admin untuk tabel PRODUCTS, TRANSACTIONS, STOCK_MOVEMENTS
drop policy if exists "superadmin_products_all" on products;
create policy "superadmin_products_all" on products
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );

drop policy if exists "superadmin_transactions_all" on transactions;
create policy "superadmin_transactions_all" on transactions
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );

drop policy if exists "superadmin_stock_movements_all" on stock_movements;
create policy "superadmin_stock_movements_all" on stock_movements
  for all using (
    (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com'
  );
