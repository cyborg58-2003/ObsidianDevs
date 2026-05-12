import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, CalendarCheck, MessageSquare, Search, Shield, Sparkles, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { DOCTORS, SPECIALTIES } from "@/data/doctors";
import { DoctorCard } from "@/components/DoctorCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Doctor Connect AI — Find & Book Trusted Doctors" },
      { name: "description", content: "Describe a symptom and our AI suggests the right specialist. Book online or in-person consultations with verified doctors in seconds." },
      { property: "og:title", content: "Smart Doctor Connect AI" },
      { property: "og:description", content: "AI-assisted doctor discovery, booking, and chat for patients." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const featured = DOCTORS.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-soft" />
        <div className="absolute -right-32 -top-32 -z-10 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-24 top-40 -z-10 h-[320px] w-[320px] rounded-full bg-ai/15 blur-3xl" />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-ai" />
              AI-assisted symptom matching
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              The smartest way to <span className="bg-gradient-hero bg-clip-text text-transparent">find your doctor</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Describe what you're feeling. Our AI maps it to the right specialty, surfaces verified doctors, and books your consultation — online or in-person.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/search">
                  <Search className="h-4 w-4" />
                  Find a doctor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">Create account</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">
              <Stat value="500+" label="Verified doctors" />
              <Stat value="10" label="Specialties" />
              <Stat value="24/7" label="AI assistant" />
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Brain className="h-4 w-4 text-ai" /> AI Suggestion
                </div>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Live</span>
              </div>
              <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                <span className="text-muted-foreground">"I have </span>
                <span className="font-medium">chest pain</span>
                <span className="text-muted-foreground"> when climbing stairs"</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-ai/20 bg-ai/5 p-3">
                <Sparkles className="h-4 w-4 text-ai" />
                <span className="text-sm">Try a <strong>Cardiologist</strong></span>
              </div>

              <div className="mt-5 space-y-3">
                {featured.slice(0, 2).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold text-primary-foreground" style={{ backgroundColor: d.color }}>
                      {d.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.specialty} · {d.city}</div>
                    </div>
                    <div className="text-xs font-semibold text-primary">PKR {d.fee}</div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-primary-glow/40 blur-2xl" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">From symptom to specialist in three steps</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">No phone trees. No guessing which kind of doctor you need.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Step icon={<Brain className="h-5 w-5" />} title="Describe your symptom" body="Type how you feel. Our AI maps it to the right specialty instantly." n={1} />
            <Step icon={<Stethoscope className="h-5 w-5" />} title="Pick the right doctor" body="Filter by city, fee, rating, and consultation type — online or in-person." n={2} />
            <Step icon={<CalendarCheck className="h-5 w-5" />} title="Book and chat" body="Reserve a slot and message your doctor before the appointment." n={3} />
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="border-t border-border/60 bg-gradient-soft py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Browse by specialty</h2>
              <p className="mt-2 text-muted-foreground">Ten core specialties. More coming soon.</p>
            </div>
            <Button asChild variant="ghost"><Link to="/search">View all <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {SPECIALTIES.map((s) => (
              <Link key={s} to="/search" search={{ specialty: s }} className="group rounded-xl border border-border/60 bg-card p-4 text-center text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="h-4 w-4" />
                </div>
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured doctors */}
      <section className="border-t border-border/60 bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Top-rated this week</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked by patient reviews.</p>
            </div>
            <Button asChild variant="ghost"><Link to="/search">See all doctors <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featured.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border/60 bg-gradient-soft py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          <Trust icon={<Shield className="h-5 w-5" />} title="Verified doctors only" body="Every doctor is credential-verified before joining." />
          <Trust icon={<Video className="h-5 w-5" />} title="Online or in-person" body="Choose video consults from home or visit the clinic." />
          <Trust icon={<MessageSquare className="h-5 w-5" />} title="Chat before you book" body="Ask quick questions and confirm fit before paying." />
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Smart Doctor Connect AI · MTM AI Hackathon</div>
          <div className="flex items-center gap-4">
            <Link to="/search">Find a doctor</Link>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold md:text-3xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Step({ icon, title, body, n }: { icon: React.ReactNode; title: string; body: string; n: number }) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft">
      <div className="absolute -right-3 -top-3 font-display text-7xl font-bold text-primary/5">{n}</div>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
