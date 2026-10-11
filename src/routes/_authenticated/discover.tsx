import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Medal, Search, SlidersHorizontal } from "lucide-react";
import stadiumPhoto from "@/assets/discover-stadium.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { Avatar, ROLE_LABEL, RoleBadge, displayName, loadAllPeople, useMediaUrl, type Person } from "@/lib/social";
import { FollowButton } from "@/components/app/FollowButton";
import { Switch } from "@/components/ui/switch";
import { useVerifiedCoaches } from "@/hooks/useVerifiedCoaches";
import { AGE_GROUPS, QUICK_SPORTS, matchesAge, matchesVerification } from "@/lib/discovery-filters";
import { GCC_REGIONS, SPORTS, ageFrom } from "@/data/platform";
import { cn } from "@/lib/utils";
import { DEMO_CLUBS, DEMO_KIND_LABEL, DEMO_PEOPLE, DEMO_TOURNAMENTS, type DemoKind } from "@/data/demo";
import { DemoClubCard, DemoPersonCard, DemoTag, DemoTournamentCard } from "@/components/app/Demo";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — AthleteScouts" }, { name: "description", content: "Find athletes, coaches, clubs and scouts by sport, position, age and region." }, { property: "og:title", content: "Discover — AthleteScouts" }, { property: "og:description", content: "Find athletes, coaches, clubs and scouts by sport, position, age and region." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Discover,
});

type View = "grid" | "clubs" | "scouts" | "tournaments" | "rankings";
const VIEWS: { id: View; label: string }[] = [{ id: "grid", label: "People" }, { id: "clubs", label: "Clubs" }, { id: "scouts", label: "Scouts" }, { id: "tournaments", label: "Tournaments" }, { id: "rankings", label: "Rankings" }];
const ROLE_TO_DEMO: Record<string, DemoKind> = { athlete: "athlete", coach: "coach", club_manager: "club", scout: "scout" };
const ROLE_FILTERS = ["all", "athlete", "coach", "club_manager", "scout"] as const;

function Discover() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const [view, setView] = useState<View>("grid");
  const [people, setPeople] = useState<Person[]>([]);
  const [followers, setFollowers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<(typeof ROLE_FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("any");
  const [region, setRegion] = useState("any");
  const [age, setAge] = useState("any");
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const verifiedCoaches = useVerifiedCoaches();

  useEffect(() => {
    Promise.all([loadAllPeople(), supabase.from("follows").select("following_id")]).then(([ps, { data }]) => {
      const counts: Record<string, number> = {};
      (data ?? []).forEach((f) => { counts[f.following_id] = (counts[f.following_id] ?? 0) + 1; });
      setPeople(ps.filter((p) => p.id !== me)); setFollowers(counts); setLoading(false);
    });
  }, [me]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();

    return people.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (sport !== "any" && p.sport !== sport && !p.scouting_categories.includes(sport)) return false;
      if (region !== "any" && p.region !== region && !p.location?.includes(region.replace("UAE — ", ""))) return false;
      if (!matchesAge(ageFrom(p.dob), age)) return false;
      if (!matchesVerification(verifiedCoaches.has(p.id), verifiedOnly)) return false;
      if (t && ![p.full_name, p.org_name, p.username, p.position, p.school, p.location].some((v) => v?.toLowerCase().includes(t))) return false;
      return true;
    });
  }, [people, role, q, sport, region, age, verifiedOnly, verifiedCoaches]);

  const demoPeople = useMemo(() => {
    const t = q.trim().toLowerCase();

    return DEMO_PEOPLE.filter((p) => {
      if (role !== "all" && ROLE_TO_DEMO[role] !== p.kind) return false;
      if (sport !== "any" && p.sport !== sport) return false;
      if (region !== "any" && !p.location.toLowerCase().includes(region.replace("UAE — ", "").toLowerCase())) return false;
      if (!matchesAge(p.age, age)) return false;
      if (!matchesVerification(p.verified === true, verifiedOnly)) return false;
      return !t || [p.name, p.position, p.location, p.headline, p.verifiedSchool].some((v) => v?.toLowerCase().includes(t));
    });
  }, [q, role, sport, region, age, verifiedOnly]);

  const demoClubs = useMemo(() => {
    if (role !== "all" && role !== "club_manager") return [];
    if (age !== "any" || verifiedOnly) return [];
    const t = q.trim().toLowerCase();
    return DEMO_CLUBS.filter((c) => (sport === "any" || c.sports.includes(sport)) && (region === "any" || c.location.toLowerCase().includes(region.replace("UAE — ", "").toLowerCase())) && (!t || [c.name, c.location, c.blurb].some((v) => v.toLowerCase().includes(t))));
  }, [q, role, sport, region, age, verifiedOnly]);

  type Entry = { key: string; score: number; node: "real"; p: Person } | { key: string; score: number; node: "demo"; d: (typeof DEMO_PEOPLE)[number] } | { key: string; score: number; node: "club"; c: (typeof DEMO_CLUBS)[number] };
  const everyone = useMemo<Entry[]>(() => [
    ...filtered.map((p) => ({ key: p.id, score: followers[p.id] ?? 0, node: "real" as const, p })),
    ...demoPeople.map((d) => ({ key: d.id, score: d.followers, node: "demo" as const, d })),
    ...demoClubs.map((c) => ({ key: c.id, score: c.members, node: "club" as const, c })),
  ].sort((a, b) => b.score - a.score), [filtered, demoPeople, demoClubs, followers]);


  return (
    <div className="min-w-0 space-y-5">
      <div className="relative overflow-hidden rounded-lg bg-secondary"><img src={stadiumPhoto} alt="Football stadium" width={1536} height={1024} className="h-52 w-full object-cover sm:h-64" /><div className="absolute inset-0 bg-media-overlay" /><div className="absolute inset-x-0 bottom-0 p-5 text-media-foreground sm:p-7"><div className="text-xs font-semibold uppercase">The next generation of sport</div><p className="mt-1 font-display text-3xl font-extrabold uppercase">AthleteScouts</p><div className="mt-2 text-sm">Talent. Teams. Your next chapter.</div></div></div>
      <div className="grid min-w-0 gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Find your next connection</div>
          <h1 className="font-display text-4xl font-extrabold uppercase">Discover</h1>
        </div>
        <div className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
          {VIEWS.map((v) => (
            <Button variant="ghost" key={v.id} type="button" onClick={() => setView(v.id)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all", view === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{v.label}</Button>
          ))}
        </div>
      </div>

      {view === "clubs" || view === "scouts" || view === "tournaments" ? <DemoSection view={view} people={people} me={me} followers={followers} /> : <>
      <section aria-label="Talent discovery filters" className="min-w-0 space-y-3 border-y border-border py-4">
        <div className="flex flex-wrap items-center gap-2"><span className="w-full text-xs font-semibold text-muted-foreground sm:w-16">Sport</span>{QUICK_SPORTS.map((v) => <Button key={v} size="sm" variant={sport === v ? "default" : "outline"} className="rounded-full" aria-pressed={sport === v} onClick={() => setSport(sport === v ? "any" : v)}>{v}</Button>)}</div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-full text-xs font-semibold text-muted-foreground sm:w-16">Age bracket</span>{AGE_GROUPS.filter((g) => ["u14", "u16", "u19"].includes(g.id)).map((g) => <Button key={g.id} size="sm" variant={age === g.id ? "default" : "outline"} className="rounded-full" aria-pressed={age === g.id} onClick={() => setAge(age === g.id ? "any" : g.id)}>{g.label}</Button>)}<label className="flex items-center gap-2 sm:ml-auto"><Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} aria-label="Verified Only" /><span className="text-sm font-semibold">Verified Only</span></label></div>
        {(sport !== "any" || age !== "any" || verifiedOnly || region !== "any" || role !== "all" || q) && <Button size="sm" variant="ghost" onClick={() => { setSport("any"); setAge("any"); setVerifiedOnly(false); setRegion("any"); setRole("all"); setQ(""); }}>Clear filters</Button>}
      </section>
      <div className="flex min-w-0 gap-2">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, position, school…" className="pl-9" /></div>
        <Button variant="ghost" type="button" onClick={() => setShowFilters((s) => !s)} className={cn("flex items-center gap-2 rounded-md border px-3 text-sm font-semibold", showFilters ? "border-primary text-primary" : "border-border")}><SlidersHorizontal className="h-4 w-4" />Filters</Button>
      </div>
      {showFilters && (
        <div className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={sport} onValueChange={setSport}><SelectTrigger aria-label="Sport" className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Any sport</SelectItem>{Array.from(new Set([...SPORTS, ...DEMO_PEOPLE.map((p) => p.sport)])).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={age} onValueChange={setAge}><SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent>{AGE_GROUPS.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent></Select>
          <Select value={region} onValueChange={setRegion}><SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">Any region</SelectItem>{GCC_REGIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
      )}
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {ROLE_FILTERS.map((r) => (
          <Button variant="ghost" key={r} type="button" onClick={() => setRole(r)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all", role === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60")}>
            {r === "all" ? "All" : r === "coach" ? "Coaches" : `${ROLE_LABEL[r]}s`}
          </Button>
        ))}
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : everyone.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No profiles match these filters — try clearing a filter.</div>
        : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
            {everyone.map((e) => e.node === "real" ? <PersonCard key={e.key} p={e.p} me={me} followers={e.score} /> : e.node === "demo" ? <DemoPersonCard key={e.key} p={e.d} /> : <div key={e.key} className="min-w-0"><DemoClubCard c={e.c} /></div>)}
          </div>
        ) : (
          <ol className="space-y-2">
            {everyone.slice(0, 60).map((e, i) => {
              const rank = <span className="grid w-8 shrink-0 place-items-center font-display text-xl font-extrabold">{i === 0 ? <Crown className="h-6 w-6 text-gold" /> : i < 3 ? <Medal className="h-5 w-5 text-gold" /> : i + 1}</span>;
              const cls = cn("flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/60", i < 3 ? "border-gold/40" : "border-border");
              const count = (n: number, label: string) => <div className="shrink-0 text-right"><div className="font-display text-xl font-bold">{n.toLocaleString()}</div><div className="text-[10px] uppercase text-muted-foreground">{label}</div></div>;
              if (e.node === "real") return (
                <li key={e.key}><Link to="/u/$id" params={{ id: e.p.id }} className={cls}>{rank}<Avatar person={e.p} size={44} />
                  <div className="min-w-0 flex-1"><div className="truncate font-bold">{displayName(e.p)}</div><div className="flex items-center gap-2"><RoleBadge role={e.p.role} /><span className="truncate text-xs text-muted-foreground">{e.p.sport}</span></div></div>
                  {count(e.score, e.score === 1 ? "follower" : "followers")}</Link></li>
              );
              const name = e.node === "demo" ? e.d.name : e.c.name;
              const img = e.node === "demo" ? e.d.image : e.c.image;
              const kind = e.node === "demo" ? DEMO_KIND_LABEL[e.d.kind] : "Club";
              const sub = e.node === "demo" ? e.d.sport : e.c.sports.join(", ");
              return (
                <li key={e.key}><div className={cls}>{rank}
                  <img src={img} alt={name} loading="lazy" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover object-top" />
                  <div className="min-w-0 flex-1"><div className="truncate font-bold">{name}</div><div className="flex items-center gap-2"><span className="rounded bg-secondary px-1.5 py-px text-[10px] font-bold uppercase text-primary">{kind}</span><span className="truncate text-xs text-muted-foreground">{sub}</span><DemoTag /></div></div>
                  {count(e.score, e.node === "club" ? "members" : "followers")}</div></li>
              );
            })}
          </ol>
        )}
      </>}
    </div>
  );
}

function PersonCard({ p, me, followers }: { p: Person; me: string; followers: number }) {
  const cover = useMediaUrl(p.cover_url);
  const age = ageFrom(p.dob);
  return (
    <Link to="/u/$id" params={{ id: p.id }} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/60">
      <div className="relative h-20 bg-gradient-neon opacity-90">{cover && <img src={cover} alt="" className="h-full w-full object-cover" />}<span className="absolute left-2 top-2 rounded bg-media-overlay p-0.5"><RoleBadge role={p.role} /></span></div>
      <div className="-mt-8 flex flex-col items-center px-3 pb-4 text-center">
        <span className="rounded-full border-4 border-card"><Avatar person={p} size={60} /></span>
        <div className="mt-1 flex w-full items-center justify-center gap-1 font-bold group-hover:text-primary"><span className="truncate">{displayName(p)}</span><VerifiedBadge userId={p.id} /></div>
        <div className="w-full truncate text-xs text-muted-foreground">{[p.sport, p.position, age != null ? `${age} yrs` : null].filter(Boolean).join(" · ") || p.region || "—"}</div>
        <div className="mb-3 mt-1 text-[11px] text-muted-foreground">{followers} {followers === 1 ? "follower" : "followers"}</div>
        <FollowButton me={me} id={p.id} size="xs" className="w-full" />
      </div>
    </Link>
  );
}

function DemoSection({ view, people, me, followers }: { view: "clubs" | "scouts" | "tournaments"; people: Person[]; me: string; followers: Record<string, number> }) {
  const realRole = view === "clubs" ? "club_manager" : view === "scouts" ? "scout" : null;
  const real = realRole ? people.filter((p) => p.role === realRole) : [];
  const title = { clubs: "Clubs & academies", scouts: "Scouts & recruiters", tournaments: "Tournaments" }[view];
  return (
    <div className="space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
      {view === "clubs" && <div className="grid gap-3 sm:grid-cols-2">{real.map((p) => <PersonCard key={p.id} p={p} me={me} followers={followers[p.id] ?? 0} />)}{DEMO_CLUBS.map((c) => <DemoClubCard key={c.id} c={c} />)}</div>}
      {view === "scouts" && <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">{real.map((p) => <PersonCard key={p.id} p={p} me={me} followers={followers[p.id] ?? 0} />)}{DEMO_PEOPLE.filter((p) => p.kind === "scout").map((p) => <DemoPersonCard key={p.id} p={p} />)}</div>}
      {view === "tournaments" && <div className="grid gap-3 sm:grid-cols-2">{DEMO_TOURNAMENTS.map((t) => <DemoTournamentCard key={t.id} t={t} />)}</div>}
    </div>
  );
}
