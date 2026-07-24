'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSuperAdmin } from '@/lib/supabase';
import { Store, StoreUser, SubscriptionStatus, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  store: Store | null;
  storeUser: StoreUser | null;
  role: UserRole | 'superadmin' | null;
  isSuperAdminUser: boolean;
  subscriptionStatus: SubscriptionStatus | 'superadmin';
  daysRemaining: number | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const PUBLIC_PATHS = ['/login', '/register', '/admin/login'];

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  store: null,
  storeUser: null,
  role: null,
  isSuperAdminUser: false,
  subscriptionStatus: 'pending',
  daysRemaining: null,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [storeUser, setStoreUser] = useState<StoreUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdminUser = isSuperAdmin(user?.email);

  const fetchProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setStore(null);
      setStoreUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch store user
      const { data: suData, error: suError } = await supabase
        .from('store_users')
        .select('*')
        .eq('auth_user_id', currentUser.id)
        .maybeSingle();

      if (suError && suError.code !== 'PGRST116') {
        console.error('Error fetching store_user:', suError);
      }

      if (suData) {
        setStoreUser(suData);

        // Fetch Store
        const { data: stData, error: stError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', suData.store_id)
          .maybeSingle();

        if (!stError && stData) {
          setStore(stData);
        }
      } else {
        // Fallback: check if store owner auth_user_id matches directly
        const { data: stData } = await supabase
          .from('stores')
          .select('*')
          .eq('auth_user_id', currentUser.id)
          .maybeSingle();

        if (stData) {
          setStore(stData);
          setStoreUser({
            id: 'owner-' + stData.id,
            store_id: stData.id,
            auth_user_id: currentUser.id,
            name: stData.owner_name || 'Owner',
            role: 'owner',
            created_at: stData.created_at,
          });
        }
      }
    } catch (err) {
      console.error('Auth context fetch profile exception:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      fetchProfile(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);

      if (event === 'SIGNED_OUT' || !session) {
        const isPublic = PUBLIC_PATHS.some(
          (path) => pathname === path || pathname?.startsWith('/admin/login')
        );
        if (!isPublic) {
          router.push('/login');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Automatic Protection Check for non-public paths
  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_PATHS.some(
        (path) => pathname === path || pathname?.startsWith('/admin/login')
      );
      if (!user && !isPublic) {
        router.push('/login');
      }
    }
  }, [isLoading, user, pathname, router]);

  const refreshProfile = async () => {
    setIsLoading(true);
    await fetchProfile(user);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setStore(null);
    setStoreUser(null);
    router.push('/login');
  };

  // Determine active role
  const role: UserRole | 'superadmin' | null = isSuperAdminUser
    ? 'superadmin'
    : storeUser?.role || null;

  // Determine subscription status
  let subscriptionStatus: SubscriptionStatus | 'superadmin' = 'pending';
  let daysRemaining: number | null = null;

  if (isSuperAdminUser) {
    subscriptionStatus = 'superadmin';
  } else if (store) {
    if (store.subscription_status === 'active' && store.expires_at) {
      const now = new Date().getTime();
      const expiry = new Date(store.expires_at).getTime();
      const diffDays = Math.ceil((expiry - now) / (1000 * 3600 * 24));
      daysRemaining = diffDays;
      if (diffDays <= 0) {
        subscriptionStatus = 'expired';
      } else {
        subscriptionStatus = 'active';
      }
    } else {
      subscriptionStatus = store.subscription_status || 'pending';
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        store,
        storeUser,
        role,
        isSuperAdminUser,
        subscriptionStatus,
        daysRemaining,
        isLoading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
