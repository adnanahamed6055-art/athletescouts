import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, CalendarDays, CalendarPlus, Check, Loader2, MapPin, Plus, Trophy, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";
import { SPORTS } from "@/data/platform";
import { APPLICATION_STATUSES, STATUS_LABEL, canManageOpportunity, isApplicationStatus, validRegistrationUrl, type ApplicationStatus } from "@/lib/tournaments";
import { Avatar, displayName, loadPeople, type Person } from "@/lib/social";
import { Users } from "lucide-react";
import { DEMO_CLUBS, DEMO_TOURNAMENTS } from "@/data/demo";
import { DemoClubCard, DemoTournamentCard } from "@/components/app/Demo";
import { useEnrollments } from "@/components/app/EnrollButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ title: "Trials & Tournaments — AthleteScouts" }, { name: "description", content: "Open trials, tryouts, showcases, camps and tournaments across the UAE and GCC." }, { property: "og:title", content: "Trials & Tournaments — AthleteScouts" }, { property: "og:description", content: "Open trials, tryouts, showcases, camps and tournaments across the UAE and GCC." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Opportunities,
});

type Kind = Database["public"]["Enums"]["opportunity_kind"];
type Opp = Tables<"opportunities">;
const KINDS: { id: Kind | "all" | "saved" | "applied" | "managed"; label: string }[] = [
  { id: "all", label: "All" }, { id: "trial", label: "Trials" }, { id: "tryout", label: "Tryouts" }, { id: "showcase", label: "Showcases" },
  { id: "camp", label: "Camps" }, { id: "tournament", label: "Tournaments" }, { id: "applied", label: "My applications" }, { id: "saved", label: "Saved" }, { id: "managed", label: "My events" },
];
const KIND_TONE: Record<Kind, string> = {
  trial: "bg-primary/15 text-primary", tryout: "bg-accent/15 text-accent", showcase: "bg-gold/15 text-gold", camp: "bg-chart-5/15 text-chart-5", tournament: "bg-destructive/15 text-destructive",
};
const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function icsFor(o: Opp) {
  const d = o.starts_on.replace(/-/g, "");
  const end = new Date(o.starts_on); end.setDate(end.getDate() + 1);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AthleteScouts//EN", "BEGIN:VEVENT", `UID:${o.id}@athletescouts`, `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`, `SUMMARY:${o.title} (${o.org_name})`, `LOCATION:${o.location}`, `DESCRIPTION:${o.description.replace(/\n/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${o.title.replace(/[^\w]+/g, "-")}.ics`;
  a.click();
}

function Opportunities() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const [opps, setOpps] = useState<Opp[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [sport, setSport] = useState("any");
  const [canPost, setCanPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState<Opp | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<Record<string, { status: string; note: string }>>({});
  const [reviewing, setReviewing] = useState<Opp | null>(null);

  const load = async () => {
    const [{ data: o }, { data: c }, { data: a }, { data: s }, { data: r }] = await Promise.all([
      supabase.from("opportunities").select("*").order("deadline"),
      supabase.rpc("opportunity_counts"),
      supabase.from("applications").select("opportunity_id,status,organiser_note").eq("user_id", me),
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", me),
      supabase.from("user_roles").select("role").eq("user_id", me),
    ]);
    setOpps(o ?? []);
    setCounts(Object.fromEntries((c ?? []).map((x) => [x.opportunity_id, x.applied])));
    setApplied(new Set((a ?? []).map((x) => x.opportunity_id)));
    setMyStatus(Object.fromEntries((a ?? []).map((x) => [x.opportunity_id, { status: x.status, note: x.organiser_note }])));
    setSaved(new Set((s ?? []).map((x) => x.opportunity_id)));
    setCanPost((r ?? []).some((x) => ["coach", "club_manager", "scout"].includes(x.role)));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [me]);

  const shown = useMemo(() => opps.filter((o) => {
    if (kind === "managed") return o.created_by === me;
    if (o.deadline < new Date().toISOString().slice(0, 10)) return false;
    if (kind === "applied" && !applied.has(o.id)) return false;
    if (kind === "saved" && !saved.has(o.id)) return false;
    if (kind !== "all" && kind !== "applied" && kind !== "saved" && o.kind !== kind) return false;
    if (sport !== "any" && o.sport !== sport) return false;
    return true;
  }), [opps, kind, sport, applied, saved, me]);

  const apply = async (o: Opp) => {
    const was = applied.has(o.id);
    const next = new Set(applied); if (was) next.delete(o.id); else next.add(o.id);
    setApplied(next); setCounts((c) => ({ ...c, [o.id]: (c[o.id] ?? 0) + (was ? -1 : 1) }));
    const { error } = was
      ? await supabase.from("applications").delete().eq("opportunity_id", o.id).eq("user_id", me)
      : await supabase.from("applications").insert({ opportunity_id: o.id, user_id: me });
    if (error) { toast.error(error.message); load(); return; }
    if (was) toast("Application withdrawn");
    else toast.success("Application submitted! Good luck 🍀", { action: { label: "Add to calendar", onClick: () => icsFor(o) } });
  };
  const toggleSave = async (o: Opp) => {
    const was = saved.has(o.id);
    const next = new Set(saved); if (was) next.delete(o.id); else next.add(o.id); setSaved(next);
    const { error } = was
      ? await supabase.from("saved_opportunities").delete().eq("opportunity_id", o.id).eq("user_id", me)
      : await supabase.from("saved_opportunities").insert({ opportunity_id: o.id, user_id: me });
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async (o: Opp) => {
    if (!canManageOpportunity(me, o.created_by) || !window.confirm(`Delete ${o.title}? This also removes its applications.`)) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", o.id).eq("created_by", me);
    if(error) toast.error(error.message); else {toast.success("Event deleted"); await load();}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Trials · Tryouts · Tournaments</div>
          <h1 className="font-display text-4xl font-extrabold uppercase">Opportunities</h1>
        </div>
        <div className="flex gap-2">
          <Select value={sport} onValueChange={setSport}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="any">All sports</SelectItem>{SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          {canPost && <Button onClick={() => setPosting(true)}><Plus className="h-4 w-4" />Post</Button>}
        </div>
      </div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {KINDS.map((k) => (
          <Button variant="ghost" key={k.id} type="button" onClick={() => setKind(k.id)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all", kind === k.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60")}>
            {k.label}{k.id === "applied" && applied.size > 0 && ` (${applied.size})`}
          </Button>
        ))}
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : shown.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"><Trophy className="mx-auto mb-2 h-8 w-8 text-gold" />Nothing here yet.</div>
        : (
          <div className="grid gap-4 md:grid-cols-2">
            {shown.map((o) => {
              const taken = counts[o.id] ?? 0;
              const left = Math.max(0, o.spots_total - taken);
              const days = Math.ceil((new Date(o.deadline).getTime() - Date.now()) / 86400000);
              const isApplied = applied.has(o.id);
              return (
                <article key={o.id} className={cn("flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5", isApplied ? "border-primary/60" : "border-border hover:border-primary/40")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-muted-foreground">{o.org_name}</div>
                      <h3 className="font-display text-xl font-bold uppercase leading-tight">{o.title}</h3>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", KIND_TONE[o.kind])}>{o.kind}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmt(o.starts_on)}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{o.location}</span>
                    <span>{o.sport} · {o.level}</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm">{o.description}</p>
                  {o.positions.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{o.positions.map((p) => <span key={p} className="rounded-md bg-secondary px-2 py-0.5 text-[11px]">{p}</span>)}</div>}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[11px]"><span className={left <= 5 ? "font-bold text-gold" : "text-muted-foreground"}>{left} spots left</span><span className={days <= 5 ? "font-bold text-gold" : "text-muted-foreground"}>Closes {fmt(o.deadline)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-neon transition-all" style={{ width: `${Math.min(100, (taken / o.spots_total) * 100)}%` }} /></div>
                  </div>
                  {o.registration_url && <Button asChild variant="outline" className="mt-4"><a href={o.registration_url} target="_blank" rel="noopener noreferrer">Registration website<ExternalLink /></a></Button>}
                  {isApplied && myStatus[o.id] && <div className={cn("mt-3 rounded-lg border p-2.5 text-xs", myStatus[o.id]!.status === "accepted" ? "border-primary/50 bg-primary/10" : myStatus[o.id]!.status === "declined" ? "border-destructive/40 bg-destructive/10" : "border-border bg-secondary")}><b>Status:</b> {isApplicationStatus(myStatus[o.id]!.status) ? STATUS_LABEL[myStatus[o.id]!.status as ApplicationStatus] : myStatus[o.id]!.status}{myStatus[o.id]!.note && <span className="mt-1 block text-muted-foreground">“{myStatus[o.id]!.note}”</span>}</div>}
                  {canManageOpportunity(me, o.created_by) && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => setReviewing(o)}><Users />Applicants ({taken})</Button><Button variant="outline" size="sm" onClick={() => {setEditing(o);setPosting(true);}}><Pencil />Edit</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(o)}><Trash2 />Delete</Button></div>}
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 font-bold" variant={isApplied ? "secondary" : "default"} disabled={!isApplied && left === 0} onClick={() => apply(o)}>
                      {isApplied ? <><Check className="h-4 w-4 text-primary" />Applied · Withdraw</> : left === 0 ? "Full" : "Apply now"}
                    </Button>
                    {isApplied && <Button variant="outline" size="icon" onClick={() => icsFor(o)} aria-label="Add to calendar"><CalendarPlus className="h-4 w-4" /></Button>}
                    <Button variant="outline" size="icon" onClick={() => toggleSave(o)} aria-label="Save"><Bookmark className={cn("h-4 w-4", saved.has(o.id) && "fill-primary text-primary")} /></Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      {kind === "applied" && <MyEntries />}
      {(kind === "all" || kind === "tournament") && <section className="space-y-3"><h2 className="font-display text-2xl font-bold">Upcoming tournaments</h2><div className="grid gap-4 md:grid-cols-2">{DEMO_TOURNAMENTS.filter((t) => sport === "any" || t.sport === sport).map((t) => <DemoTournamentCard key={t.id} t={t} />)}</div></section>}
      <ApplicantsDialog opp={reviewing} onOpenChange={(v) => { if (!v) setReviewing(null); }} />
      <PostDialog open={posting} onOpenChange={(v) => {setPosting(v); if(!v) setEditing(null);}} me={me} onCreated={load} existing={editing} />
    </div>
  );
}

function PostDialog({ open, onOpenChange, me, onCreated, existing }: { open: boolean; onOpenChange: (o: boolean) => void; me: string; onCreated: () => void; existing: Opp | null }) {
  const empty = { org_name: "", title: "", kind: "tournament" as Kind, sport: "Football", level: "", location: "", starts_on: "", deadline: "", description: "", positions: "", spots_total: "20", registration_url: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; if(existing) {setF({ ...existing, positions: existing.positions.join(", "), spots_total: String(existing.spots_total), registration_url: existing.registration_url ?? "" }); return;} setF(empty); supabase.from("profiles").select("org_name, full_name").eq("id", me).maybeSingle().then(({ data }) => setF((x) => ({ ...x, org_name: data?.org_name || data?.full_name || "" }))); }, [open, me, existing]);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.deadline > f.starts_on) { toast.error("The deadline must be on or before the start date"); return; }
    if (!validRegistrationUrl(f.registration_url)) { toast.error("Use a complete https:// registration link"); return; }
    setBusy(true);
    const values = {
      created_by: me, org_name: f.org_name, title: f.title, kind: f.kind, sport: f.sport, level: f.level || "All levels", location: f.location,
      starts_on: f.starts_on, deadline: f.deadline, description: f.description, positions: f.positions.split(",").map((s) => s.trim()).filter(Boolean), spots_total: Number(f.spots_total) || 20, registration_url: f.registration_url.trim() || null,
    };
    const { error } = existing
      ? await supabase.from("opportunities").update(values).eq("id", existing.id).eq("created_by", me)
      : await supabase.from("opportunities").insert(values);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(existing ? "Event updated" : "Opportunity posted"); onOpenChange(false); onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">{existing ? "Edit event" : "Create an event"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><Label>Title</Label><Input required value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="U-16 Striker Trials" /></div>
          <div className="grid gap-1.5"><Label>Organisation</Label><Input required value={f.org_name} onChange={(e) => set("org_name", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Type</Label><Select value={f.kind} onValueChange={(v) => set("kind", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{KINDS.slice(1, 6).map((k) => <SelectItem key={k.id} value={k.id}>{k.label.slice(0, -1)}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Sport</Label><Select value={f.sport} onValueChange={(v) => set("sport", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Level / age group</Label><Input value={f.level} onChange={(e) => set("level", e.target.value)} placeholder="U-16" /></div>
          <div className="grid gap-1.5 sm:col-span-2"><Label>Location</Label><Input required value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Start date</Label><Input type="date" required value={f.starts_on} onChange={(e) => set("starts_on", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Apply by</Label><Input type="date" required value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Positions (comma separated)</Label><Input value={f.positions} onChange={(e) => set("positions", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Spots</Label><Input type="number" min={1} value={f.spots_total} onChange={(e) => set("spots_total", e.target.value)} /></div>
          <div className="grid gap-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-1.5 sm:col-span-2"><Label>Registration link</Label><Input aria-label="Registration link" type="url" placeholder="https://your-club.com/register" value={f.registration_url} onChange={(e) => set("registration_url", e.target.value)} /></div>
          <Button type="submit" className="sm:col-span-2" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{existing ? "Save changes" : "Publish"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MyEntries() {
  const { data } = useEnrollments();
  const tours = DEMO_TOURNAMENTS.filter((t) => data?.has(`tournament:${t.id}`));
  const clubs = DEMO_CLUBS.filter((c) => data?.has(`trial:${c.id}`));
  if (!tours.length && !clubs.length) return null;
  return <section className="space-y-3"><h2 className="font-display text-2xl font-bold">Tournament entries & trial requests</h2><div className="grid gap-4 md:grid-cols-2">{tours.map((t) => <DemoTournamentCard key={t.id} t={t} />)}{clubs.map((c) => <DemoClubCard key={c.id} c={c} />)}</div></section>;
}

type Applicant = { user_id: string; status: string; organiser_note: string; created_at: string };
function ApplicantsDialog({ opp, onOpenChange }: { opp: Opp | null; onOpenChange: (o: boolean) => void }) {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!opp) return;
    setLoading(true);
    supabase.from("applications").select("user_id,status,organiser_note,created_at").eq("opportunity_id", opp.id).order("created_at").then(async ({ data, error }) => {
      if (error) toast.error(error.message);
      const r = data ?? [];
      setRows(r); setNotes(Object.fromEntries(r.map((x) => [x.user_id, x.organiser_note])));
      setPeople(await loadPeople(r.map((x) => x.user_id)));
      setLoading(false);
    });
  }, [opp]);
  const update = async (userId: string, status: ApplicationStatus) => {
    if (!opp) return;
    const note = (notes[userId] ?? "").slice(0, 500);
    const { error } = await supabase.from("applications").update({ status, organiser_note: note }).eq("opportunity_id", opp.id).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    setRows((r) => r.map((x) => (x.user_id === userId ? { ...x, status, organiser_note: note } : x)));
    toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()} — the athlete has been notified`);
  };
  return (
    <Dialog open={!!opp} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">Applicants · {opp?.title}</DialogTitle></DialogHeader>
        {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No applications yet.</p> : (
          <ul className="space-y-3">{rows.map((r) => (
            <li key={r.user_id} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center gap-3"><Avatar person={people[r.user_id] ?? null} size={40} /><div className="min-w-0 flex-1"><div className="truncate font-semibold">{displayName(people[r.user_id] ?? null)}</div><div className="truncate text-xs text-muted-foreground">{[people[r.user_id]?.sport, people[r.user_id]?.position, people[r.user_id]?.location].filter(Boolean).join(" · ") || "Athlete"}</div></div><span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{isApplicationStatus(r.status) ? STATUS_LABEL[r.status] : r.status}</span></div>
              <Input maxLength={500} placeholder="Note to the athlete (optional)" value={notes[r.user_id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.user_id]: e.target.value }))} />
              <div className="flex flex-wrap gap-2">{APPLICATION_STATUSES.filter((s) => s !== "submitted").map((s) => <Button key={s} size="sm" variant={r.status === s ? "default" : "outline"} onClick={() => update(r.user_id, s)}>{STATUS_LABEL[s]}</Button>)}</div>
            </li>))}</ul>)}
      </DialogContent>
    </Dialog>
  );
}
