'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'white' | 'green';
  showText?: boolean;
  href?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'green',
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

  const logoSrc = variant === 'green' ? '/logo.png' : '/logo-white.png';

  const content = (
    <div
      className={clsx(
        'inline-flex items-center justify-center transition-transform hover:scale-105 shrink-0 select-none',
        className
      )}
    >
      <Image
        src={logoSrc}
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


