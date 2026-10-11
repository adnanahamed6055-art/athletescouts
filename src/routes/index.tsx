import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Bot, CalendarDays, Map as MapIcon, ShieldCheck, Trophy, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { ROLES } from "@/data/platform";
import heroPhoto from "@/assets/discover-stadium.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AthleteScouts — From Talent to Opportunity" },
      { name: "description", content: "The GCC sports-tech network connecting student-athletes with clubs, academies, scouts and tournaments." },
      { property: "og:title", content: "AthleteScouts — From Talent to Opportunity" },
      { property: "og:description", content: "Build your Opportunity Passport and get discovered by clubs and scouts across the GCC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

// Sample figures until real platform totals exist.
const COUNTERS = [
  { label: "Verified Athletes", value: 12480 },
  { label: "Partner Clubs", value: 640 },
  { label: "Active Trials", value: 87 },
  { label: "Scholarships Secured", value: 315 },
];

function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString("en-US")}</>;
}

const FLOW = [
  { t: "Athlete", d: "Builds a robust profile with metrics & highlight reels." },
  { t: "Verification", d: "Coaches and schools authenticate the credentials." },
  { t: "Matching", d: "Smart filtering sorts by age, sport & position." },
  { t: "Opportunity", d: "Direct pathways to trials, clubs & scholarships." },
];

const PHASES = [
  { t: "Local Launch", d: "Pilot with Abu Dhabi Indian School (ADIS) and local inter-school football & cricket leagues." },
  { t: "Trust & Validation", d: "Partner with accredited PE departments and certified academy coaches to issue secure verification keys." },
  { t: "Macro Expansion", d: "Scale to basketball, athletics, swimming and more across the whole GCC." },
];

const FEATURES = [
  { icon: BadgeCheck, title: "Opportunity Passport", text: "Your verified athletic resume — stats, endorsements and progress in one link." },
  { icon: Video, title: "Highlight Reel Hub", text: "Pin your best plays so scouts see them first." },
  { icon: MapIcon, title: "Club & Venue Map", text: "Find training grounds, academies and stadiums near you.", to: "/clubs" as const },
  { icon: Bot, title: "ScoutAI", text: "Ask in plain words for clubs, trials and tournaments." },
  { icon: CalendarDays, title: "Trials & Tournaments", text: "One-tap registration for tryouts and regional events." },
  { icon: ShieldCheck, title: "Trust & Verification", text: "Coaches and PE teachers sign off on your stats." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-border">
        <img src={heroPhoto} alt="" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">🇦🇪 Aligned with UAE National Sports Strategy 2031</span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">GCC Sports Networks</span>
          </div>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-7xl md:text-8xl">
            From Talent <br /> to <span className="text-gradient-neon">Opportunity</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The GCC's sports-tech network connecting student-athletes with professional clubs, academies, scouts and tournaments.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-bold shadow-glow"><Link to="/auth">Build My Passport <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/clubs">Explore Clubs</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-12 md:grid-cols-4">
        {COUNTERS.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary/60">
            <div className="font-display text-4xl font-extrabold text-primary sm:text-5xl"><Counter to={c.value} /></div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-destructive">The problem</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Talent gets lost in the noise</h2>
            <p className="mt-3 text-sm text-muted-foreground">Young athletes' metrics, match videos, coach recommendations and certificates are scattered across messaging apps and social feeds. Clubs and scouts can't find talent by age, position or physical profile — so elite potential goes undiscovered.</p>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-glow">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Our solution</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">The Opportunity Passport</h2>
            <p className="mt-3 text-sm text-muted-foreground">One standardized, secure profile per athlete — verified metrics, certified stats and coach endorsements, discoverable by scouts, clubs and academies.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <div key={f.t} className="relative rounded-xl border border-border bg-card p-5">
              <div className="font-display text-4xl font-extrabold text-gold">0{i + 1}</div>
              <div className="mt-1 font-display text-xl font-bold uppercase">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40 py-14">
        <blockquote className="mx-auto max-w-4xl px-4 text-center font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
          "We don't just help athletes get discovered. We use <span className="text-primary">structured data</span> to ensure the right <span className="text-gold">career-defining opportunity</span> proactively finds the right athlete."
        </blockquote>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-6 font-display text-3xl font-extrabold uppercase">Built for every role</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <Link key={r.id} to="/auth" className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/60">
              <div className="text-3xl">{r.emoji}</div>
              <div className="mt-3 font-display text-xl font-bold uppercase group-hover:text-primary">{r.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-6 font-display text-3xl font-extrabold uppercase">The platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const body = (
              <div className="h-full rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/60">
                <div className="flex items-center justify-between">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-3 font-display text-xl font-bold uppercase">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            );
            return f.to ? <Link key={f.title} to={f.to}>{body}</Link> : <div key={f.title}>{body}</div>;
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gold/40 bg-card p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gold">Strategic alignment</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Built for the UAE vision</h2>
            <p className="mt-3 text-sm text-muted-foreground">AthleteScouts accelerates the <b className="text-foreground">UAE National Sports Strategy 2031</b> — professionalizing youth sport and early talent identification in schools — and supports Abu Dhabi's <b className="text-foreground">Sports for All</b> policy by lowering barriers to elite networking for every young athlete.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Roadmap</div>
            <ol className="mt-3 space-y-4">
              {PHASES.map((p, i) => (
                <li key={p.t} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary font-display font-bold text-primary">{i + 1}</span>
                  <div><div className="font-display text-lg font-bold uppercase">{p.t}</div><p className="text-sm text-muted-foreground">{p.d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Trophy className="mx-auto mb-2 h-5 w-5 text-gold" /> © {new Date().getFullYear()} AthleteScouts · <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
      </footer>
    </div>
  );
}
