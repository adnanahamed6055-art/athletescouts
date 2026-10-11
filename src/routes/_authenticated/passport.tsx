import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Loader2, Pencil, Plus, ShieldCheck, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { METRICS, ROLES, ageFrom, toEmbedUrl } from "@/data/platform";

export const Route = createFileRoute("/_authenticated/passport")({
  head: () => ({ meta: [{ title: "My Opportunity Passport — AthleteScouts" }, { name: "description", content: "Your verified athletic resume, highlight reels and progress." }, { property: "og:title", content: "My Opportunity Passport — AthleteScouts" }, { property: "og:description", content: "Your verified athletic resume, highlight reels and progress." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Passport,
});

type Stat = Tables<"athlete_stats">;

function Passport() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.from("athlete_stats").select("*").eq("user_id", user.id).order("recorded_on");
    if (error) toast.error(error.message); else setStats(data);
  }, [user.id]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setProfile(p); setRole(r?.[0]?.role ?? null);
      await loadStats();
      setLoading(false);
    })();
  }, [user.id, loadStats]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!profile?.onboarded || !role) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-4xl font-extrabold uppercase">Finish your setup</h1>
          <p className="mt-2 text-muted-foreground">Pick your role and add your details to unlock your Passport.</p>
          <Button asChild className="mt-6"><Link to="/onboarding">Continue setup</Link></Button>
        </div>
      </div>
    );
  }

  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const age = ageFrom(profile.dob);
  const isAthlete = role === "athlete";

  return (
    <div className="min-h-screen">
      
      
      <div className="mx-auto min-w-0 max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card p-6 shadow-glow sm:p-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary">{isAthlete ? "Opportunity Passport" : "Organization Profile"}</div>
              <h1 className="mt-1 font-display text-4xl font-extrabold uppercase sm:text-5xl">{profile.full_name || "Unnamed athlete"}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Chip>{roleLabel}</Chip>
                {profile.sport && <Chip>{profile.sport}</Chip>}
                {profile.position && <Chip>{profile.position}</Chip>}
                {profile.org_name && <Chip>{profile.org_name}</Chip>}
                {profile.region && <Chip>{profile.region}</Chip>}
              </div>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/onboarding"><Pencil className="h-4 w-4" />Edit profile</Link></Button>
          </div>
          {isAthlete && (
            <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Age" value={age != null ? `${age}` : "—"} />
              <Stat label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : "—"} />
              <Stat label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : "—"} />
              <Stat label="School" value={profile.school || "—"} />
            </div>
          )}
        </div>

        {isAthlete ? (
          <Tabs defaultValue="progress" className="mt-8">
            <TabsList className="flex w-full justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="reels">Highlight Reels</TabsTrigger>
              <TabsTrigger value="endorse">Endorsements</TabsTrigger>
            </TabsList>
            <TabsContent value="progress"><ProgressTracker userId={user.id} stats={stats} reload={loadStats} /></TabsContent>
            <TabsContent value="reels"><Reels links={profile.video_links} /></TabsContent>
            <TabsContent value="endorse">
              <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-gold" />
                <div className="mt-2 font-display text-xl font-bold uppercase">Coach verification is coming</div>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Soon your coaches and PE teachers can sign off your stats. Verified numbers get a <BadgeCheck className="inline h-4 w-4 text-primary" /> badge.</p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="font-display text-lg font-bold uppercase">Facilities</div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{profile.facilities || "None added yet."}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="font-display text-lg font-bold uppercase">Scouting for</div>
              <div className="mt-2 flex flex-wrap gap-2">{profile.scouting_categories.length ? profile.scouting_categories.map((s) => <Chip key={s}>{s}</Chip>) : <span className="text-sm text-muted-foreground">Not set.</span>}</div>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card p-5 md:col-span-2 text-sm text-muted-foreground">
              Athlete search, trial posting and your scout dashboard are coming in the next update. Meanwhile, <Link to="/clubs" className="text-primary underline">explore clubs on the map</Link>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">{children}</span>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-border bg-background/50 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div><div className="break-words font-display text-xl font-bold leading-snug">{value}</div></div>;
}

function ProgressTracker({ userId, stats, reload }: { userId: string; stats: Stat[]; reload: () => Promise<void> }) {
  const [metric, setMetric] = useState(METRICS[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const def = METRICS.find((m) => m.id === metric);
  const series = useMemo(() => stats.filter((s) => s.metric === metric).map((s) => ({ ...s, value: Number(s.value) })), [stats, metric]);
  const first = series[0]?.value, last = series.at(-1)?.value;
  const delta = first != null && last != null && series.length > 1 ? last - first : null;
  const improved = delta != null && (def?.lowerIsBetter ? delta < 0 : delta > 0);

  if (!def) return null;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    const { error } = await supabase.from("athlete_stats").insert({ user_id: userId, metric, value: Number(value), unit: def.unit, recorded_on: date });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setValue(""); await reload(); toast.success("Result added");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("athlete_stats").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await reload();
  };

  return (
    <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
      <div className="min-w-0 rounded-lg border border-border bg-card p-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-full min-w-0 sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{METRICS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          {delta != null && (
            <span className={`flex items-center gap-1 text-sm font-bold ${improved ? "text-primary" : "text-destructive"}`}>
              {delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {delta > 0 ? "+" : ""}{delta.toFixed(2).replace(/\.?0+$/, "")} {def.unit} since first entry
            </span>
          )}
        </div>
        <div className="mt-4 h-64">
          {series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="recorded_on" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} reversed={def.lowerIsBetter} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ fill: "var(--gold)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="grid h-full place-items-center text-sm text-muted-foreground">No {def.label} results yet — add your first one.</div>}
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <form onSubmit={add} className="rounded-xl border border-border bg-card p-5">
          <div className="font-display text-lg font-bold uppercase">Add a result</div>
          <div className="mt-3 grid gap-2">
            <Input type="number" step="any" required placeholder={`${def.label}${def.unit ? ` (${def.unit})` : ""}`} value={value} onChange={(e) => setValue(e.target.value)} />
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            <Button type="submit" disabled={busy}><Plus className="h-4 w-4" />Add</Button>
          </div>
        </form>
        <div className="max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-3">
          {series.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No entries.</p> : [...series].reverse().map((s) => (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className="text-muted-foreground">{s.recorded_on}</span>
              <span className="break-words text-right font-bold">{s.value} {s.unit}</span>
              <button type="button" aria-label="Delete" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reels({ links }: { links: string[] }) {
  if (!links.length) return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      No highlight videos yet. <Link to="/onboarding" className="text-primary underline">Add YouTube or Vimeo links</Link>.
    </div>
  );
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {links.map((l, i) => {
        const src = toEmbedUrl(l);
        return (
          <div key={l + i} className="overflow-hidden rounded-xl border border-border bg-card">
            {i === 0 && <div className="bg-gold px-3 py-1 text-xs font-bold uppercase text-gold-foreground">📌 Top play</div>}
            {src ? <iframe src={src} title={`Highlight ${i + 1}`} className="aspect-video w-full" allowFullScreen loading="lazy" />
              : <a href={l} target="_blank" rel="noreferrer" className="block p-4 text-sm text-primary underline">{l}</a>}
          </div>
        );
      })}
    </div>
  );
}
