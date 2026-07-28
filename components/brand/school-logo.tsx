'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SCHOOL_BRAND } from '@/lib/school-brand';
import { getDefaultSchoolLogoUrl } from '@/lib/school-logo';
import { SITE_CONTENT_KEYS } from '@/lib/site-content-keys';
import { cn } from '@/lib/utils';

type SchoolLogoProps = {
  className?: string;
  /** Pixel height hint for next/image sizing */
  size?: number;
  priority?: boolean;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** Optional explicit logo URL (skips CMS fetch) */
  src?: string;
};

let cachedLogoUrl: string | null = null;
let logoFetchPromise: Promise<string> | null = null;

async function fetchActiveLogoUrl(): Promise<string> {
  if (cachedLogoUrl) return cachedLogoUrl;
  if (!logoFetchPromise) {
    logoFetchPromise = (async () => {
      try {
        const res = await fetch('/api/public/site-content', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        const url = data?.[SITE_CONTENT_KEYS.schoolBranding]?.logoUrl;
        cachedLogoUrl =
          typeof url === 'string' && url.trim() ? url.trim() : getDefaultSchoolLogoUrl();
      } catch {
        cachedLogoUrl = getDefaultSchoolLogoUrl();
      }
      return cachedLogoUrl!;
    })().finally(() => {
      logoFetchPromise = null;
    });
  }
  return logoFetchPromise;
}

/** Call after admin saves a new logo so open tabs pick it up. */
export function invalidateSchoolLogoCache(nextUrl?: string) {
  cachedLogoUrl = nextUrl?.trim() || null;
}

export function SchoolLogo({
  className,
  size = 40,
  priority = false,
  showWordmark = false,
  wordmarkClassName,
  src,
}: SchoolLogoProps) {
  const [logoSrc, setLogoSrc] = useState(src || cachedLogoUrl || SCHOOL_BRAND.logoPath);

  useEffect(() => {
    if (src) {
      setLogoSrc(src);
      return;
    }
    let cancelled = false;
    void fetchActiveLogoUrl().then((url) => {
      if (!cancelled) setLogoSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={logoSrc}
        alt={`${SCHOOL_BRAND.shortName} logo`}
        width={size}
        height={Math.round(size * 1.18)}
        className="h-auto w-auto object-contain"
        style={{ height: size, width: 'auto' }}
        priority={priority}
        unoptimized
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
