'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  href,
  className,
}) => {
  const dimensions = {
    sm: { img: 24, box: 'w-7 h-7', text: 'text-sm' },
    md: { img: 32, box: 'w-9 h-9', text: 'text-lg' },
    lg: { img: 48, box: 'w-12 h-12', text: 'text-xl' },
    xl: { img: 64, box: 'w-16 h-16', text: 'text-2xl' },
  }[size];

  const content = (
    <div className={clsx('flex items-center gap-2.5 group', className)}>
      <div
        className={clsx(
          dimensions.box,
          'relative rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-slate-700/50 bg-slate-900 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center'
        )}
      >
        <Image
          src="/logo.png"
          alt="KasirPro Logo"
          width={dimensions.img}
          height={dimensions.img}
          className="object-cover w-full h-full p-0.5 rounded-lg"
          priority
        />
      </div>

      {showText && (
        <span className={clsx('font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent', dimensions.text)}>
          Kasir<span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Pro</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
