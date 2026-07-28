import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AdvancedResultChecker } from "@/components/results/advanced-result-checker"
import { SCHOOL_BRAND } from "@/lib/school-brand"

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-[radial-gradient(circle_at_top,rgba(20,83,45,0.08),transparent_42%),linear-gradient(180deg,#f4f7f2,#eef2f7)] py-10 sm:py-12">
        <div className="container max-w-5xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              {SCHOOL_BRAND.shortName}
            </p>
            <h1 className="mb-3 font-heading text-3xl font-bold text-emerald-950 sm:text-4xl">
              Check Your Results
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Enter your admission number and PIN to view your end-of-term result with school branding,
              class statistics, and a printable report card.
            </p>
          </div>
          <AdvancedResultChecker />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
