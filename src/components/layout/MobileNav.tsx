'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, ShoppingBag, Package, BarChart2, Settings, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { role, isSuperAdminUser } = useAuth();

  const items = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Kasir', href: '/pos', icon: ShoppingBag },
    { name: 'Stok', href: '/inventory', icon: Package },
  ];

  if (isSuperAdminUser || role === 'owner') {
    items.push({ name: 'Laporan', href: '/reports', icon: BarChart2 });
  }

  items.push({ name: 'Akun', href: '/settings', icon: Settings });

  if (isSuperAdminUser) {
    items.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition',
              isActive
                ? 'text-brand-400 font-bold bg-brand-500/10'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <item.icon className={clsx('w-5 h-5 mb-0.5', isActive ? 'text-brand-400 scale-110' : 'text-slate-400')} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
