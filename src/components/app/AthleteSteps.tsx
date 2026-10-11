import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SPORTS } from "@/data/platform";
import { uploadMedia, useMediaUrl } from "@/lib/social";
import { athleteCompletion } from "@/lib/verification-rules";

const CITIES = ["Abu Dhabi, UAE", "Al Ain, UAE", "Dubai, UAE", "Sharjah, UAE", "Ajman, UAE", "Umm Al Quwain, UAE", "Ras Al Khaimah, UAE", "Fujairah, UAE"];
type F = { avatar_url: string; full_name: string; dob: string; location: string; sport: string; position: string; school: string; bio: string };
const STEPS = ["Photo", "About you", "City", "Sport", "School", "Bio"] as const;

/** Multi-step "Complete Your Athlete Profile" flow; every step saves progress. */
export function AthleteSteps({ userId, roleLocked, onBack }: { userId: string; roleLocked: boolean; onBack?: (() => void) | undefined }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>({ avatar_url: "", full_name: "", dob: "", location: "", sport: "", position: "", school: "", bio: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatar = useMediaUrl(f.avatar_url || null);
  const set = (k: keyof F, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.from("profiles").select("avatar_url,full_name,dob,location,sport,position,school,bio").eq("id", userId).maybeSingle().then(({ data: p }) => {
      if (!p) return;
      const v: F = { avatar_url: p.avatar_url ?? "", full_name: p.full_name ?? "", dob: p.dob ?? "", location: p.location ?? "", sport: p.sport ?? "", position: p.position ?? "", school: p.school ?? "", bio: p.bio ?? "" };
      setF(v);
      const firstMissing = (["avatar_url", "full_name", "location", "sport", "school", "bio"] as const).findIndex((k) => !v[k]);
      setStep(firstMissing === -1 ? 0 : firstMissing);
    });
  }, [userId]);

  const persist = async () => {
    setBusy(true);
    try {
      if (!roleLocked) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "athlete" });
        if (error && !error.message.includes("duplicate")) throw error;
      }
      const c = athleteCompletion(f);
      const { error } = await supabase.from("profiles").update({
        avatar_url: f.avatar_url || null, full_name: f.full_name.trim() || null, dob: f.dob || null, location: f.location || null,
        sport: f.sport || null, position: f.position.trim() || null, school: f.school.trim() || null, bio: f.bio.trim().slice(0, 500) || null,
        onboarded: c.complete,
      }).eq("id", userId);
      if (error) throw error;
      return true;
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save"); return false; } finally { setBusy(false); }
  };

  const next = async () => {
    if (!(await persist())) return;
    if (step < STEPS.length - 1) return setStep(step + 1);
    const c = athleteCompletion(f);
    if (!c.complete) { void toast.message(`Saved — ${c.total - c.done} detail(s) still missing.`); return; }
    toast.success("Profile complete!");
    navigate({ to: "/u/$id", params: { id: userId } });
  };
  const later = async () => { if (await persist()) { toast.success("Progress saved"); navigate({ to: "/feed" }); } };

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return void toast.error("Choose an image under 10 MB.");
    setUploading(true);
    try { set("avatar_url", await uploadMedia(userId, file)); } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setUploading(false); }
  };

  const c = athleteCompletion(f);
  return (
    <div className="mx-auto min-w-0 max-w-xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        {onBack && step === 0 && <Button size="icon" variant="ghost" onClick={onBack} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>}
        <h1 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">Complete your athlete profile</h1>
      </div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Step {step + 1} of {STEPS.length} · {STEPS[step]}</span><span>{c.percent}% complete</span></div>
      <Progress value={c.percent} className="mb-6 h-2" />

      <div className="min-h-64 space-y-4 rounded-2xl border border-border bg-card p-5">
        {step === 0 && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="relative grid h-32 w-32 place-items-center overflow-hidden rounded-full border-2 border-dashed border-primary/60 bg-gradient-to-br from-primary/25 to-accent/20" aria-label="Upload profile photo">
              {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Camera className="h-8 w-8 text-primary" />}
            </button>
            <p className="text-sm text-muted-foreground">A clear face photo helps scouts recognise you at trials.</p>
          </div>
        )}
        {step === 1 && <>
          <div className="grid gap-1.5"><Label>Full name</Label><Input maxLength={80} value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Date of birth</Label><Input type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /><p className="text-xs text-muted-foreground">Used for age brackets (U14, U16, U19). Never shown publicly.</p></div>
        </>}
        {step === 2 && <div className="grid gap-2 sm:grid-cols-2">{CITIES.map((x) => <button key={x} type="button" onClick={() => set("location", x)} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${f.location === x ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/50"}`}>{x}</button>)}</div>}
        {step === 3 && <>
          <div className="grid gap-1.5"><Label>Primary sport</Label><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.sport} onChange={(e) => set("sport", e.target.value)}><option value="">Choose a sport</option>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="grid gap-1.5"><Label>Position / event</Label><Input maxLength={60} placeholder="e.g. Striker, 100m, Fast bowler" value={f.position} onChange={(e) => set("position", e.target.value)} /></div>
        </>}
        {step === 4 && <div className="grid gap-1.5"><Label>School or academy</Label><Input maxLength={120} placeholder="e.g. Abu Dhabi Indian School" value={f.school} onChange={(e) => set("school", e.target.value)} /></div>}
        {step === 5 && <div className="grid gap-1.5"><Label>Short athlete bio</Label><Textarea rows={5} maxLength={500} placeholder="Tell scouts about your playing background, strengths, and goals." value={f.bio} onChange={(e) => set("bio", e.target.value)} /><p className="text-right text-xs text-muted-foreground">{f.bio.length}/500</p></div>}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Back</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={later}>Save & finish later</Button>
          <Button disabled={busy || uploading} onClick={next}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{step === STEPS.length - 1 ? "Finish" : "Continue"}</Button>
        </div>
      </div>
    </div>
  );
}
