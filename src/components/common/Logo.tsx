'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light-bg' | 'transparent' | 'dark-bg';
  showText?: boolean;
  href?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light-bg',
  href,
  className,
}) => {
  const heights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-11',
    xl: 'h-14',
  }[size];

  const dimensions = {
    sm: { width: 90, height: 38 },
    md: { width: 120, height: 51 },
    lg: { width: 160, height: 68 },
    xl: { width: 200, height: 85 },
  }[size];

  const containerPadding = {
    sm: 'px-2 py-1 rounded-lg',
    md: 'px-3 py-1.5 rounded-xl',
    lg: 'px-4 py-2 rounded-2xl',
    xl: 'px-5 py-2.5 rounded-2xl',
  }[size];

  const content = (
    <div
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0 select-none',
        variant === 'light-bg' &&
          clsx(
            'bg-white/95 backdrop-blur-md shadow-md shadow-emerald-950/20 border border-slate-200/80',
            containerPadding
          ),
        variant === 'dark-bg' &&
          clsx(
            'bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-800',
            containerPadding
          ),
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="KasirPro Logo"
        width={dimensions.width}
        height={dimensions.height}
        className={clsx('object-contain w-auto', heights)}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 group">
        {content}
      </Link>
    );
  }

  return content;
};

