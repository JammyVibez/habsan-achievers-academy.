'use client';

import Image from 'next/image';
import { SCHOOL_BRAND } from '@/lib/school-brand';
import { cn } from '@/lib/utils';

type SchoolLogoProps = {
  className?: string;
  /** Pixel height hint for next/image sizing */
  size?: number;
  priority?: boolean;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function SchoolLogo({
  className,
  size = 40,
  priority = false,
  showWordmark = false,
  wordmarkClassName,
}: SchoolLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={SCHOOL_BRAND.logoPath}
        alt={`${SCHOOL_BRAND.shortName} logo`}
        width={size}
        height={Math.round(size * 1.18)}
        className="h-auto w-auto object-contain"
        style={{ height: size, width: 'auto' }}
        priority={priority}
      />
      {showWordmark ? (
        <span className={cn('text-left leading-tight', wordmarkClassName)}>
          <span className="block font-heading text-sm font-bold sm:text-base">HABSAN ACHIEVERS</span>
          <span className="block text-[10px] text-muted-foreground sm:text-xs">ACADEMY GAJIRI</span>
        </span>
      ) : null}
    </span>
  );
}
