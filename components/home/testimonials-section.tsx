import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Mrs. Aisha Mohammed",
    role: "Parent",
    content:
      "HABSAN ACHIEVERS ACADEMY has been a blessing to our family. My children have grown academically and morally. The teachers are dedicated and caring.",
    rating: 5,
  },
  {
    name: "Mr. Chukwudi Okafor",
    role: "Parent",
    content:
      "The quality of education here is exceptional. My daughter improved significantly in her studies and gained confidence. I highly recommend this school.",
    rating: 5,
  },
  {
    name: "Mrs. Fatima Bello",
    role: "Parent",
    content:
      "A wonderful school with excellent facilities and a safe environment. The staff truly care about each child's development and success.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Habsan community</p>
          <h2 className="mb-5 font-heading text-3xl font-semibold tracking-tight text-balance md:text-5xl">What Parents Say About Us</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            Hear from parents who have entrusted their children's education to us
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="rounded-2xl border-border/70 bg-[#f8f8f3] shadow-sm">
              <CardContent className="p-6 md:p-7">
                <div className="mb-5 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 min-h-28 leading-relaxed text-foreground/80">"{testimonial.content}"</p>
                <div>
                  <p className="font-heading font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
