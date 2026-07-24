-- ============================================================
-- SQL INISIALISASI & VERIFIKASI AKUN SUPER ADMIN
-- Jalankan skrip ini di Supabase SQL Editor jika tombol login
-- meminta verifikasi email atau gagal autentikasi.
-- ============================================================

-- 1. Buat akun di auth.users (jika belum ada) dan konfirmasi email secara langsung
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'journalwarga@gmail.com',
  crypt('Admin123456!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
where not exists (
  select 1 from auth.users where email = 'journalwarga@gmail.com'
);

-- 2. Pastikan status email_confirmed_at aktif & update password ke Admin123456!
update auth.users 
set 
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  encrypted_password = crypt('Admin123456!', gen_salt('bf'))
where email = 'journalwarga@gmail.com';
