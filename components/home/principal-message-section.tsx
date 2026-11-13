'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SITE_CONTENT_KEYS } from '@/lib/site-content-keys';
import { getDefaultPublicSiteContent } from '@/lib/site-content-defaults';

type PrincipalPayload = ReturnType<typeof getDefaultPublicSiteContent>[typeof SITE_CONTENT_KEYS.principal];

export function PrincipalMessageSection() {
  const [data, setData] = useState<PrincipalPayload>(getDefaultPublicSiteContent()[SITE_CONTENT_KEYS.principal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/site-content', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Record<string, unknown>;
        const block = json[SITE_CONTENT_KEYS.principal] as PrincipalPayload | undefined;
        if (!cancelled && block && typeof block === 'object') {
          setData({ ...getDefaultPublicSiteContent()[SITE_CONTENT_KEYS.principal], ...block });
        }
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-[#f2f4ed] py-20 md:py-28">
      <div className="container">
        <div className="grid items-center gap-10 md:grid-cols-[0.92fr_1.08fr] md:gap-16">
          <div>
            <div className="relative mx-auto w-full max-w-lg">
              <div aria-hidden="true" className="absolute -bottom-4 -left-4 h-full w-full rounded-[2rem] border border-primary/20" />
              <img src={data.image || '/placeholder.svg'} alt="Principal of Habsan Achievers Academy" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl shadow-emerald-950/10" />
              <div className="absolute -bottom-2 right-4 rounded-2xl border border-white/60 bg-background/95 px-5 py-4 shadow-lg backdrop-blur sm:-right-8 sm:bottom-7">
                <p className="font-heading text-lg font-semibold text-primary">Growing with purpose</p>
                <p className="mt-1 text-xs text-muted-foreground">A school community that cares</p>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">A word from our leadership</p>
              <div className="flex items-start gap-3">
                <Quote className="mt-1 h-7 w-7 shrink-0 text-primary/45" />
                <h2 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{data.heading}</h2>
              </div>
            </div>
            <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
              <CardContent className="p-6 md:p-8">
                {data.paragraphs.map((p, i) => (
                  <p key={i} className="mb-4 leading-relaxed text-muted-foreground last:mb-6">
                    {p}
                  </p>
                ))}
                <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5">
                  <div>
                    <p className="font-heading text-lg font-semibold">{data.signatureName}</p>
                    <p className="text-sm text-muted-foreground">{data.signatureTitle}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-primary/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
