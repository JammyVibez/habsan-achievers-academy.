import { Users, GraduationCap, Award, BookOpen } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Students Enrolled",
  },
  {
    icon: GraduationCap,
    value: "50+",
    label: "Qualified Teachers",
  },
  {
    icon: Award,
    value: "95%",
    label: "Success Rate",
  },
  {
    icon: BookOpen,
    value: "15+",
    label: "Years of Excellence",
  },
]

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-950 py-14 text-primary-foreground md:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(132,204,22,0.12),transparent_45%)]" />
      <div className="container relative">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lime-200">
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
              <div className="mb-1 font-heading text-3xl font-semibold tracking-tight md:text-4xl">{stat.value}</div>
              <div className="text-xs text-primary-foreground/65 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
