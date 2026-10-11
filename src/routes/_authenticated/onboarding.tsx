import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AthleteSteps } from "@/components/app/AthleteSteps";
import { GCC_REGIONS, ROLES, SPORTS, type AccountRole } from "@/data/platform";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — AthleteScouts" }, { name: "description", content: "Choose your role and set up your AthleteScouts profile." }, { property: "og:title", content: "Set up your profile — AthleteScouts" }, { property: "og:description", content: "Choose your role and set up your AthleteScouts profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Onboarding,
});

type Form = {
  full_name: string; dob: string; school: string; sport: string; position: string; height_cm: string; weight_kg: string;
  video_links: string[]; org_name: string; region: string; facilities: string; license_no: string; scouting_categories: string[];
};
const empty: Form = { full_name: "", dob: "", school: "", sport: "", position: "", height_cm: "", weight_kg: "", video_links: [], org_name: "", region: "", facilities: "", license_no: "", scouting_categories: [] };

function Onboarding() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<AccountRole | null>(null);
  const [roleLocked, setRoleLocked] = useState(false);
  const [f, setF] = useState<Form>(empty);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      const [{ data: roles }, { data: p }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      const r = roles?.find((x) => x.role !== "admin")?.role as AccountRole | undefined;
      if (r) { setRole(r); setRoleLocked(true); }
      if (p) setF({
        full_name: p.full_name ?? "", dob: p.dob ?? "", school: p.school ?? "", sport: p.sport ?? "", position: p.position ?? "",
        height_cm: p.height_cm?.toString() ?? "", weight_kg: p.weight_kg?.toString() ?? "", video_links: p.video_links ?? [],
        org_name: p.org_name ?? "", region: p.region ?? "", facilities: p.facilities ?? "", license_no: p.license_no ?? "", scouting_categories: p.scouting_categories ?? [],
      });
      setReady(true);
    })();
  }, [user.id]);

  const isAthlete = role === "athlete";
  const isOrg = role === "club_manager" || role === "scout";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setBusy(true);
    if (!roleLocked) {
      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
      if (error) { setBusy(false); { toast.error("Couldn't save your role: " + error.message); return; } }
      setRoleLocked(true);
    }
    const num = (s: string) => (s.trim() ? Number(s) : null);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name || null, dob: f.dob || null, school: f.school || null, sport: f.sport || null, position: f.position || null,
      height_cm: num(f.height_cm), weight_kg: num(f.weight_kg), video_links: f.video_links,
      org_name: f.org_name || null, region: f.region || null, facilities: f.facilities || null, license_no: f.license_no || null,
      scouting_categories: f.scouting_categories, onboarded: true,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved!");
    navigate({ to: role === "athlete" ? "/passport" : "/feed" });
  };

  if (!ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (isAthlete) return <AthleteSteps userId={user.id} roleLocked={roleLocked} onBack={roleLocked ? undefined : () => setRole(null)} />;

  return (
    <div className="min-h-screen">
      
      
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <span className={role ? "text-muted-foreground" : "text-primary"}>1 · Your role</span>
          <span className="h-px w-8 bg-border" />
          <span className={role ? "text-primary" : "text-muted-foreground"}>2 · Your details</span>
        </div>

        {!role ? (
          <>
            <h1 className="font-display text-4xl font-extrabold uppercase sm:text-5xl">Who are you?</h1>
            <p className="mt-2 text-muted-foreground">Pick the role that fits you. You can't change this later.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button key={r.id} type="button" onClick={() => setRole(r.id)}
                  className="rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary hover:shadow-glow">
                  <div className="text-3xl">{r.emoji}</div>
                  <div className="mt-2 font-display text-xl font-bold uppercase">{r.label}</div>
                  <p className="text-sm text-muted-foreground">{r.blurb}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={save} className="space-y-6">
            <div className="flex items-center gap-3">
              {!roleLocked && <Button type="button" size="icon" variant="ghost" onClick={() => setRole(null)} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>}
              <div>
                <h1 className="font-display text-4xl font-extrabold uppercase">{ROLES.find((r) => r.id === role)?.label}</h1>
                <p className="text-sm text-muted-foreground">Tell clubs and scouts about you.</p>
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              <Field label="Full name"><Input required value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
              {isAthlete && <Field label="Date of birth"><Input type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /></Field>}
              {(isAthlete || role === "coach") && <Field label="School / Academy"><Input value={f.school} onChange={(e) => set("school", e.target.value)} /></Field>}
              {(isAthlete || role === "coach") && (
                <Field label="Sport">
                  <Select value={f.sport} onValueChange={(v) => set("sport", v)}>
                    <SelectTrigger><SelectValue placeholder="Choose a sport" /></SelectTrigger>
                    <SelectContent>{SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {isAthlete && <>
                <Field label="Position"><Input placeholder="e.g. Striker" value={f.position} onChange={(e) => set("position", e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height (cm)"><Input type="number" min={80} max={250} value={f.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
                  <Field label="Weight (kg)"><Input type="number" min={20} max={200} value={f.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
                </div>
              </>}
              {isOrg && <>
                <Field label="Organization name"><Input required value={f.org_name} onChange={(e) => set("org_name", e.target.value)} /></Field>
                <Field label="License / registration no."><Input value={f.license_no} onChange={(e) => set("license_no", e.target.value)} /></Field>
              </>}
              {(isOrg || role === "coach") && (
                <Field label="Region">
                  <Select value={f.region} onValueChange={(v) => set("region", v)}>
                    <SelectTrigger><SelectValue placeholder="Choose a region" /></SelectTrigger>
                    <SelectContent>{GCC_REGIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {isOrg && <div className="sm:col-span-2"><Field label="Facility locations"><Textarea placeholder="One per line, e.g. Zayed Sports City, Abu Dhabi" value={f.facilities} onChange={(e) => set("facilities", e.target.value)} /></Field></div>}
            </div>

            {isOrg && (
              <div className="rounded-xl border border-border bg-card p-5">
                <Label>Sports you scout for</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SPORTS.map((s) => {
                    const on = f.scouting_categories.includes(s);
                    return <button key={s} type="button" onClick={() => set("scouting_categories", on ? f.scouting_categories.filter((x) => x !== s) : [...f.scouting_categories, s])}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{s}</button>;
                  })}
                </div>
              </div>
            )}

            {isAthlete && (
              <div className="rounded-xl border border-border bg-card p-5">
                <Label>Highlight video links (YouTube or Vimeo)</Label>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="https://youtube.com/watch?v=..." value={link} onChange={(e) => setLink(e.target.value)} />
                  <Button type="button" variant="secondary" onClick={() => { if (link.trim()) { set("video_links", [...f.video_links, link.trim()]); setLink(""); } }}><Plus className="h-4 w-4" />Add</Button>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {f.video_links.map((v, i) => (
                    <li key={v + i} className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-1.5">
                      <span className="truncate">{v}</span>
                      <button type="button" aria-label="Remove" onClick={() => set("video_links", f.video_links.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">You can add performance stats on your Passport after this step.</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full font-bold" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save & continue</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
