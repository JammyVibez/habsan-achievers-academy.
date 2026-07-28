import { SCHOOL_BRAND } from '@/lib/school-brand';
import { SITE_CONTENT_KEYS } from '@/lib/site-content-keys';
import { fetchMergedPublicSiteContent } from '@/lib/site-content-merge';
import { getDefaultPublicSiteContent } from '@/lib/site-content-defaults';

/** Default crest shipped with the app. */
export function getDefaultSchoolLogoUrl(): string {
  return SCHOOL_BRAND.logoPath;
}

export function logoUrlFromSiteContent(
  branding?: { logoUrl?: string } | null,
): string {
  const url = branding?.logoUrl?.trim();
  if (url) return url;
  return getDefaultSchoolLogoUrl();
}

/** Server-side: resolve the active school logo from CMS (or default). */
export async function resolveSchoolLogoUrl(): Promise<string> {
  try {
    const site = await fetchMergedPublicSiteContent();
    return logoUrlFromSiteContent(site[SITE_CONTENT_KEYS.schoolBranding]);
  } catch {
    return getDefaultSchoolLogoUrl();
  }
}

export function absoluteLogoUrl(logoUrl: string, origin?: string): string {
  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:')) return logoUrl;
  const base = (origin ?? '').replace(/\/$/, '');
  if (!base) return logoUrl;
  return `${base}${logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`}`;
}

export function getDefaultBrandingPayload() {
  return getDefaultPublicSiteContent()[SITE_CONTENT_KEYS.schoolBranding];
}
