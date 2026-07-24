-- ============================================================
-- FIX STACK DEPTH LIMIT EXCEEDED & REGISTRASI RLS POLICIES
-- Jalankan seluruh skrip ini di Supabase SQL Editor
-- ============================================================

-- 1. SOLUSI UTAMA: Re-create fungsi get_my_store_id() dengan SECURITY DEFINER
-- Ini menghentikan rekursi tak terbatas (infinite recursion) pada RLS store_users
create or replace function get_my_store_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select store_id from store_users where auth_user_id = auth.uid() limit 1;
$$;

-- 2. Kebijakan RLS untuk tabel STORES
alter table stores enable row level security;

drop policy if exists "lihat toko sendiri" on stores;
drop policy if exists "ubah toko sendiri" on stores;
drop policy if exists "tambah toko baru" on stores;
drop policy if exists "superadmin_stores_all" on stores;

create policy "lihat toko sendiri" on stores
  for select using (id = get_my_store_id() or auth_user_id = auth.uid());

create policy "ubah toko sendiri" on stores
  for update using (id = get_my_store_id() or auth_user_id = auth.uid());

create policy "tambah toko baru" on stores
  for insert with check (auth_user_id = auth.uid() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

create policy "superadmin_stores_all" on stores
  for all using ((select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

-- 3. Kebijakan RLS untuk tabel STORE_USERS
alter table store_users enable row level security;

drop policy if exists "lihat user satu toko" on store_users;
drop policy if exists "tambah user satu toko" on store_users;
drop policy if exists "ubah user satu toko" on store_users;
drop policy if exists "superadmin_store_users_all" on store_users;

create policy "lihat user satu toko" on store_users
  for select using (store_id = get_my_store_id() or auth_user_id = auth.uid());

create policy "tambah user satu toko" on store_users
  for insert with check (auth_user_id = auth.uid() or store_id = get_my_store_id());

create policy "ubah user satu toko" on store_users
  for update using (store_id = get_my_store_id() or auth_user_id = auth.uid());

create policy "superadmin_store_users_all" on store_users
  for all using ((select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

-- 4. Kebijakan RLS untuk ACTIVATION_CODES
alter table activation_codes enable row level security;

drop policy if exists "lihat kode aktivasi toko sendiri" on activation_codes;
drop policy if exists "superadmin_codes_all" on activation_codes;

create policy "lihat kode aktivasi toko sendiri" on activation_codes
  for select using (store_id = get_my_store_id() or (select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');

create policy "superadmin_codes_all" on activation_codes
  for all using ((select auth.jwt() ->> 'email') = 'journalwarga@gmail.com')
  with check ((select auth.jwt() ->> 'email') = 'journalwarga@gmail.com');
