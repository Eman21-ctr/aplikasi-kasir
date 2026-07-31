import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lygrxnpwmktjrtssrfaz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Z3J4bnB3bWt0anJ0c3NyZmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Mzk0MTgsImV4cCI6MjEwMDQxNTQxOH0.d3o9mFG4LwBWyRIkr-Oate1nTJ1LqLGyxtdcJjmVjNM';

export const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'journalwarga@gmail.com').toLowerCase();
export const SUPER_ADMIN_WA = process.env.NEXT_PUBLIC_SUPER_ADMIN_WA || '6281234567890';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export async function quickLoginSuperAdmin() {
  const superEmail = SUPER_ADMIN_EMAIL;
  const superPassword = 'Admin123456!';

  // 1. Try signing in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: superEmail,
    password: superPassword,
  });

  if (!error && data.user) {
    return { success: true, user: data.user };
  }

  // 2. If account doesn't exist yet, sign up
  const { data: regData, error: regErr } = await supabase.auth.signUp({
    email: superEmail,
    password: superPassword,
  });

  if (regErr && !regErr.message.includes('already registered')) {
    throw new Error('Pendaftaran Admin: ' + regErr.message);
  }

  // 3. Retry sign in
  const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
    email: superEmail,
    password: superPassword,
  });

  if (retryErr) {
    if (retryErr.message.includes('Email not confirmed')) {
      throw new Error('Konfirmasi Email Dibutuhkan oleh Supabase. Jalankan perintah SQL verifikasi di Supabase SQL Editor atau matikan Confirm Email di Supabase.');
    }
    throw new Error('Login Admin: ' + retryErr.message);
  }

  return { success: true, user: retryData.user };
}
