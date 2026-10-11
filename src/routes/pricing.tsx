import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/PageFrame";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AthleteScouts" },
      { name: "description", content: "AthleteScouts Basic is free. Pro is AED 19/month. Scout Management plans for clubs and recruiters." },
      { property: "og:title", content: "Pricing — AthleteScouts" },
      { property: "og:description", content: "Free for athletes, PRO for AED 19/month, and enterprise plans for scouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PageFrame><Pricing /></PageFrame>,
});

const PLANS = [
  { name: "AthleteScouts Basic", price: "Free", note: "forever", cta: "Get started", features: ["Free profile creation", "Basic directory listing", "Standard video uploads", "Club & venue map"] },
  { name: "AthleteScouts Pro", price: "AED 19", note: "/month", cta: "Go PRO", featured: true, features: ["Premium video hosting", "Highlight-reel pinning on regional scout dashboards", "Profile traffic analytics", "Unlimited ScoutAI questions"] },
  { name: "Scout Management", price: "Custom", note: "for clubs & universities", cta: "Talk to us", features: ["Deep athlete filtering", "Talent-matching alerts", "Bulk messaging", "Scout seat management", "Built for clubs & international recruiters"] },
];

function Pricing() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-center font-display text-5xl font-extrabold uppercase sm:text-6xl">Pick your <span className="text-gradient-neon">level</span></h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Start free. Upgrade when you're ready to stand out.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-transform hover:-translate-y-1 ${p.featured ? "border-primary shadow-glow" : "border-border"}`}>
              {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-0.5 text-xs font-bold uppercase text-gold-foreground">Most popular</span>}
              <div className="font-display text-2xl font-bold uppercase">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1"><span className="font-display text-5xl font-extrabold text-gold">{p.price}</span><span className="text-sm text-muted-foreground">{p.note}</span></div>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}
              </ul>
              <Button asChild className="mt-6" variant={p.featured ? "default" : "outline"}><Link to="/auth">{p.cta}</Link></Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Paid plans launch soon — you won't be charged today.</p>
      </section>
    </div>
  );
}
