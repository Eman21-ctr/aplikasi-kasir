'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  ShoppingBag,
  Package,
  BarChart2,
  Settings,
  ShieldAlert,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, role, isSuperAdminUser, subscriptionStatus } = useAuth();

  if (
    !user ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pending' ||
    pathname?.startsWith('/admin/login') ||
    (!isSuperAdminUser && subscriptionStatus === 'pending')
  ) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      roles: ['owner', 'kasir', 'superadmin'],
    },
    {
      name: 'Kasir (POS)',
      href: '/pos',
      icon: ShoppingBag,
      roles: ['owner', 'kasir', 'superadmin'],
    },
    {
      name: 'Manajemen Stok',
      href: '/inventory',
      icon: Package,
      roles: ['owner', 'kasir', 'superadmin'],
    },
    {
      name: 'Laporan',
      href: '/reports',
      icon: BarChart2,
      roles: ['owner', 'superadmin'], // Hidden for kasir
    },
    {
      name: 'Pengaturan',
      href: '/settings',
      icon: Settings,
      roles: ['owner', 'kasir', 'superadmin'],
    },
  ];

  if (isSuperAdminUser) {
    navigationItems.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: ShieldAlert,
      roles: ['superadmin'],
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 p-3 min-h-[calc(100vh-57px)] shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Menu Utama
        </div>
        {navigationItems.map((item) => {
          // Check role permission
          const hasAccess =
            isSuperAdminUser ||
            !item.roles ||
            item.roles.includes(role || 'kasir');

          if (!hasAccess) return null;

          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition group',
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={clsx(
                    'w-4 h-4 transition',
                    isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span>{item.name}</span>
              </div>
              <ChevronRight
                className={clsx(
                  'w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition',
                  isActive ? 'opacity-100 text-brand-400' : 'text-slate-500'
                )}
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <Link
          href="/settings?tab=guide"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition"
        >
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span>Panduan Penggunaan</span>
        </Link>
      </div>
    </aside>
  );
};
