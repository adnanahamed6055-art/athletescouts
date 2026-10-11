import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Check, Clock, Dumbbell, MapPin, MessageCircle, Plus, Send, ShieldCheck, Trophy, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_PEOPLE, DEMO_TOURNAMENTS, demoClub } from "@/data/demo";
import { EnrollButton } from "@/components/app/EnrollButton";
import { shareLink } from "@/components/app/Social";

export const Route = createFileRoute("/_authenticated/club/$id")({
  loader: ({ params }) => { const c = demoClub(params.id); if (!c) throw notFound(); return { c }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.c.name} — AthleteScouts` : "Club — AthleteScouts";
    const d = loaderData ? loaderData.c.blurb : "Club profiles, programmes and trials on AthleteScouts.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <p className="p-10 text-center text-muted-foreground">This club doesn't exist.</p>,
  component: ClubPage,
});

const FACILITIES: Record<string, string[]> = {
  Football: ["Full-size grass pitch", "3G training pitch", "Floodlights", "Video analysis room"],
  Cricket: ["Turf nets", "Bowling machines", "Indoor practice hall", "Pavilion"],
  Athletics: ["400m tartan track", "Jumps pits", "Throws area", "Strength room"],
  Basketball: ["FIBA hardwood courts", "Shooting machine", "Strength room", "Recovery zone"],
  Swimming: ["50m Olympic pool", "Dryland gym", "Timing system", "Recovery pool"],
  Padel: ["6 panoramic courts", "Coaching court", "Pro shop", "Lounge"],
};

function ClubPage() {
  const { c } = Route.useLoaderData();
  const [following, setFollowing] = useState(false);
  const sport = c.sports[0] ?? "Football";
  const seed = [...c.id].reduce((h, ch) => h + ch.charCodeAt(0), 0);
  const coaches = DEMO_PEOPLE.filter((p) => p.kind === "coach" && p.sport === sport).slice(0, 4);
  const players = DEMO_PEOPLE.filter((p) => p.kind === "athlete" && p.sport === sport).slice(0, 6);
  const events = DEMO_TOURNAMENTS.filter((t) => t.sport === sport).slice(0, 3);
  const facilities = FACILITIES[sport] ?? ["Training hall", "Strength room", "Changing rooms", "Recovery zone"];
  const programmes = [
    { name: "Foundation (U-8 to U-11)", days: "Mon · Wed", time: "16:00–17:30", fee: `AED ${450 + (seed % 5) * 50} / month` },
    { name: "Development (U-12 to U-15)", days: "Tue · Thu · Sat", time: "17:00–18:45", fee: `AED ${650 + (seed % 5) * 50} / month` },
    { name: "Elite (U-16 to U-19)", days: "Mon–Fri", time: "18:00–20:00", fee: "By selection" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <img src={c.image} alt={`${c.name} venue`} className="aspect-[21/9] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-media-overlay via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-media-foreground"><div className="text-xs font-bold uppercase tracking-wider opacity-90">{c.sports.join(" · ")} · {c.level}</div><h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl">{c.name}</h1></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <EnrollButton type="trial" id={c.id} name={c.name} size="default" />
        <Button variant={following ? "secondary" : "outline"} onClick={() => setFollowing(!following)}>{following ? <Check /> : <Plus />}{following ? "Following" : "Follow"}</Button>
        {coaches[0] && <Button asChild variant="outline"><Link to="/inbox" search={{ with: coaches[0].id }}><MessageCircle />Message coach</Link></Button>}
        <Button variant="ghost" size="icon" aria-label="Share club" onClick={() => shareLink(`/club/${c.id}`, c.name)}><Send /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ i: Users, l: "Members", v: (c.members + Number(following)).toLocaleString() }, { i: Trophy, l: "Open trials", v: String(c.openTrials || 1 + (seed % 3)) }, { i: ShieldCheck, l: "Coaches", v: String(4 + (seed % 9)) }, { i: CalendarDays, l: "Founded", v: String(1995 + (seed % 28)) }].map((s) => <div key={s.l} className="rounded-xl border border-border bg-card p-4"><s.i className="mb-2 h-5 w-5 text-primary" /><div className="font-display text-2xl font-bold">{s.v}</div><div className="text-xs text-muted-foreground">{s.l}</div></div>)}
      </div>

      <section className="space-y-2"><h2 className="text-xl font-bold">About</h2><p className="text-muted-foreground">{c.blurb} Players train in age-grouped squads with regular match play, strength & conditioning and video feedback. Trial days are held monthly — request a spot and the club will confirm your session.</p><p className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 text-primary" />{c.location}</p>{c.unofficial && <p className="text-xs text-muted-foreground">Unofficial showcase — not affiliated with or managed by this club.</p>}</section>

      <section className="space-y-3"><h2 className="text-xl font-bold">Programmes & fees</h2><div className="grid gap-3 sm:grid-cols-3">{programmes.map((p) => <div key={p.name} className="rounded-xl border border-border bg-card p-4 text-sm"><div className="font-semibold">{p.name}</div><div className="mt-2 flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{p.days}</div><div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{p.time}</div><div className="mt-2 flex items-center gap-1.5 font-semibold text-gold"><Wallet className="h-3.5 w-3.5" />{p.fee}</div></div>)}</div></section>

      <section className="space-y-3"><h2 className="text-xl font-bold">Facilities</h2><div className="flex flex-wrap gap-2">{facilities.map((f) => <span key={f} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm"><Dumbbell className="h-3.5 w-3.5 text-primary" />{f}</span>)}</div></section>

      {coaches.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">Coaching staff</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{coaches.map((p) => <Link key={p.id} to="/people/$id" params={{ id: p.id }} className="rounded-xl border border-border bg-card p-3 text-center hover:border-primary/50"><img src={p.image} alt="" className="mx-auto h-16 w-16 rounded-full object-cover object-top" /><div className="mt-2 truncate text-sm font-semibold">{p.name}</div><div className="truncate text-xs text-muted-foreground">{p.headline}</div></Link>)}</div></section>}

      {players.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">Players to watch</h2><div className="scrollbar-none flex gap-4 overflow-x-auto pb-1">{players.map((p) => <Link key={p.id} to="/people/$id" params={{ id: p.id }} className="w-20 shrink-0 text-center"><img src={p.image} alt="" className="mx-auto h-16 w-16 rounded-full object-cover object-top" /><span className="mt-1 block truncate text-xs font-semibold">{p.name}</span></Link>)}</div></section>}

      {events.length > 0 && <section className="space-y-3"><h2 className="text-xl font-bold">Upcoming tournaments</h2><div className="space-y-2">{events.map((t) => <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"><div className="min-w-0"><div className="truncate font-semibold">{t.name}</div><div className="truncate text-xs text-muted-foreground">{t.dates} · {t.location} · {t.fee}</div></div><EnrollButton type="tournament" id={t.id} name={t.name} /></div>)}</div></section>}
    </div>
  );
}
