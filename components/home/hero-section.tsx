'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SITE_CONTENT_KEYS } from '@/lib/site-content-keys';
import { getDefaultPublicSiteContent, type HeroSlide } from '@/lib/site-content-defaults';

const FALLBACK_SLIDES = getDefaultPublicSiteContent()[SITE_CONTENT_KEYS.hero].slides;

export function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>(FALLBACK_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/site-content', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Record<string, unknown>;
        const key = SITE_CONTENT_KEYS.hero;
        const block = json[key] as { slides?: HeroSlide[] } | undefined;
        const next = block?.slides;
        if (!cancelled && Array.isArray(next) && next.length > 0) {
          setSlides(next);
          setCurrentSlide(0);
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const len = slides.length;
  const safeIndex = len > 0 ? currentSlide % len : 0;

  useEffect(() => {
    if (len < 2) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % len);
    }, 6500);
    return () => clearInterval(timer);
  }, [len]);

  const nextSlide = () => len && setCurrentSlide((prev) => (prev + 1) % len);
  const prevSlide = () => len && setCurrentSlide((prev) => (prev - 1 + len) % len);

  if (len === 0) return null;

  return (
    <section aria-label="Welcome to Habsan Achievers Academy" className="relative min-h-[620px] overflow-hidden bg-emerald-950 md:min-h-[690px]">
      {slides.map((s, index) => (
        <div
          key={`${s.title}-${index}`}
          aria-hidden={index !== safeIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === safeIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={s.image || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06281c]/90 via-[#06281c]/70 to-[#06281c]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06281c]/60 via-transparent to-[#06281c]/10" />
          <div className="relative z-10 flex min-h-[620px] items-center py-20 md:min-h-[690px]">
            <div className="container">
              <div className="max-w-3xl text-white">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm sm:text-sm">
                  <Sparkles className="h-4 w-4 text-lime-300" />
                  Knowledge, discipline &amp; excellence
                </div>
                <h1 className="mb-6 max-w-3xl text-balance font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  {s.title}
                </h1>
                <p className="mb-9 max-w-2xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
                  {s.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-black/10">
                    <Link href="/admissions">Begin your application <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/35 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                    <Link href="/about">Discover Habsan</Link>
                  </Button>
                </div>
                <Link href="/about" className="mt-12 hidden items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white sm:inline-flex">
                  A brighter future begins here <ArrowDown className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {len > 1 && (
        <>
          <div className="absolute bottom-7 right-5 z-20 flex items-center gap-3 sm:bottom-9 sm:right-10">
            <div className="flex items-center gap-2" aria-label={`Slide ${safeIndex + 1} of ${len}`}>
              {slides.map((slide, index) => (
                <button
                  key={`${slide.title}-dot-${index}`}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${index === safeIndex ? 'w-8 bg-lime-300' : 'w-2 bg-white/55 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === safeIndex ? 'true' : undefined}
                />
              ))}
            </div>
            <button type="button" onClick={prevSlide} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Previous slide">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={nextSlide} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Next slide">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 z-20 h-1 bg-lime-300/90 transition-all duration-500" style={{ width: `${((safeIndex + 1) / len) * 100}%` }} />
        </>
      )}
    </section>
  );
}
