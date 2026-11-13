"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { SchoolLogo } from "@/components/brand/school-logo"

const primaryLinks = [
  { href: "/about", label: "Our School" },
  { href: "/admissions", label: "Admissions" },
  { href: "/results", label: "Results" },
  { href: "/contact", label: "Contact" },
]

const exploreLinks = [
  { href: "/our-story", label: "Our Story" },
  { href: "/gallery", label: "School Life" },
  { href: "/e-learning", label: "E-Learning" },
  { href: "/marketplace", label: "Marketplace" },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-950/10 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Habsan Achievers Academy home" onClick={closeMobileMenu}>
          <SchoolLogo size={48} priority showWordmark />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-primary/5 hover:text-primary xl:px-4 xl:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-primary/5 hover:text-primary xl:px-4 xl:text-sm">
              Explore <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-border/70 bg-background p-2 shadow-xl shadow-emerald-950/10">
              {exploreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-primary/5 hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-4">
            <Link href="/login">Portal login</Link>
          </Button>
          <Button asChild size="sm" className="h-10 rounded-full px-5 shadow-md shadow-primary/15">
            <Link href="/admissions">Apply to Habsan <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-border/70 bg-background px-5 pb-5 pt-3 shadow-lg shadow-emerald-950/5 lg:hidden">
          <div className="mx-auto flex max-w-lg flex-col">
            {[{ href: "/about", label: "Our School" }, ...exploreLinks, ...primaryLinks.slice(1)].map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMobileMenu} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/5 hover:text-primary">
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login" onClick={closeMobileMenu}>Portal login</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/admissions" onClick={closeMobileMenu}>Apply now</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
