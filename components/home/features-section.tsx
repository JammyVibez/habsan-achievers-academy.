import { GraduationCap, Users, BookOpen, Award, Shield, Sparkles, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: GraduationCap,
    title: "Quality Education",
    description: "Comprehensive curriculum from Pre-Nursery to SS3 following Nigerian educational standards",
  },
  {
    icon: Users,
    title: "Experienced Teachers",
    description: "Dedicated and qualified educators committed to student success and development",
  },
  {
    icon: BookOpen,
    title: "Modern Facilities",
    description: "Well-equipped classrooms, libraries, and laboratories for enhanced learning",
  },
  {
    icon: Award,
    title: "Academic Excellence",
    description: "Proven track record of outstanding performance in WAEC, NECO, and JAMB",
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description: "Secure campus with 24/7 security and comprehensive student welfare programs",
  },
  {
    icon: Sparkles,
    title: "Holistic Development",
    description: "Focus on academics, character, sports, and extracurricular activities",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Habsan difference</p>
          <h2 className="mb-5 font-heading text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            Why Choose HABSAN ACHIEVERS ACADEMY?
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            We provide a nurturing environment where students excel academically and develop into well-rounded
            individuals
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="group rounded-2xl border-border/70 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="relative p-6 md:p-7">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/7 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold tracking-tight md:text-xl">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
                <ArrowUpRight className="absolute right-6 top-7 h-4 w-4 text-primary/0 transition-all group-hover:right-5 group-hover:text-primary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
