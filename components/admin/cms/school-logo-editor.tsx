'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { AdminMediaUploadField } from '@/components/admin/admin-media-upload-field';
import { invalidateSchoolLogoCache } from '@/components/brand/school-logo';
import { fetchPublicSiteContent, saveSiteContentBlock, SITE_CONTENT_KEYS } from '@/lib/cms-client';
import { getDefaultPublicSiteContent } from '@/lib/site-content-defaults';
import { getDefaultSchoolLogoUrl } from '@/lib/school-logo';

export function SchoolLogoEditor() {
  const defaults = getDefaultPublicSiteContent()[SITE_CONTENT_KEYS.schoolBranding];
  const [logoUrl, setLogoUrl] = useState(defaults.logoUrl);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const site = await fetchPublicSiteContent();
        if (cancelled) return;
        const next = site[SITE_CONTENT_KEYS.schoolBranding]?.logoUrl?.trim();
        setLogoUrl(next || defaults.logoUrl);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [defaults.logoUrl]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const trimmed = logoUrl.trim() || getDefaultSchoolLogoUrl();
      await saveSiteContentBlock(SITE_CONTENT_KEYS.schoolBranding, { logoUrl: trimmed });
      invalidateSchoolLogoCache(trimmed);
      setLogoUrl(trimmed);
      setMessage('School logo saved. It will appear across the website, portals, ID cards, and report cards.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    setLogoUrl(getDefaultSchoolLogoUrl());
    setMessage('Reset to default crest. Click Save to apply.');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>School logo</CardTitle>
          <CardDescription>
            Upload the official crest. It is used in the header, footer, login, dashboards, ID cards, result
            checker, and printable report cards.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={resetToDefault} disabled={loading || saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Default
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={loading || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save logo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-lg border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl || getDefaultSchoolLogoUrl()} alt="School logo preview" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1 space-y-3">
            <AdminMediaUploadField
              id="school-logo-upload"
              label="Upload logo image"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              disabled={loading || saving}
              onUploaded={(url) => {
                setLogoUrl(url);
                setMessage('Logo uploaded. Click Save logo to publish it everywhere.');
              }}
            />
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/school-logo.png or https://…"
                disabled={loading || saving}
              />
              <p className="text-xs text-muted-foreground">
                Prefer a PNG with transparent background. After saving, refresh open pages to see the new crest.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
