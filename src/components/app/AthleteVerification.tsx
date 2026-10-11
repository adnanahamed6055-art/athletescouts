import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Camera, Check, Clock, FileText, Loader2, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { VerificationPill } from "@/components/app/VerificationPill";
import { Avatar, displayName, loadPeople, type Person } from "@/lib/social";
import { ageFrom } from "@/data/platform";
import { uploadVerificationDoc } from "@/lib/verification.functions";
import { reviewVerificationWithAI } from "@/lib/verification-ai.functions";
import { loadAthleteBadges } from "@/hooks/useAthleteBadges";
import { DOC_ACCEPT, KIND_LABEL, MAX_DOCS, checkDocMeta, isPending, statusLabel, type VerificationKind, type VerificationStatus } from "@/lib/verification-rules";
import { cn } from "@/lib/utils";

type Req = Tables<"athlete_verifications">;
const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Al Ain"];
const KIND_HELP: Record<VerificationKind, string> = {
  school: "Upload or scan your school ID card.",
  academy: "Academy membership card, team registration card, official letter or coach confirmation.",
  coach: "A signed letter or confirmation from your coach or PE teacher.",
};

const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(f); });

function StatusChip({ req }: { req: Pick<Req, "status" | "kind"> | null }) {
  const s = req?.status as VerificationStatus | undefined;
  const tone = s === "approved" ? "border-verification/60 text-verification" : s === "rejected" ? "border-destructive/60 text-destructive" : s === "more_info" ? "border-gold/60 text-gold" : s ? "border-primary/50 text-primary" : "border-border text-muted-foreground";
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>{s === "approved" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}{statusLabel(s, req?.kind as VerificationKind)}</span>;
}

/** Small card for dashboards: current status plus a link into the flow. */
export function GetVerifiedCard({ me }: { me: string }) {
  const [req, setReq] = useState<Req | null | undefined>(undefined);
  useEffect(() => { supabase.from("athlete_verifications").select("*").eq("user_id", me).order("created_at", { ascending: false }).limit(1).then(({ data }) => setReq(data?.[0] ?? null)); }, [me]);
  if (req === undefined || req?.status === "approved") return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-verification/40 bg-card p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-display text-lg font-bold uppercase"><ShieldCheck className="h-5 w-5 text-verification" />Get verified</div>
        <p className="text-xs text-muted-foreground">Scouts trust school- and academy-verified athletes first.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2"><StatusChip req={req} /><Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/verification">{req ? "View request" : "Start"}</Link></Button></div>
    </div>
  );
}

export function AthleteVerification({ me }: { me: string }) {
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [{ data }, { data: p }] = await Promise.all([
      supabase.from("athlete_verifications").select("*").eq("user_id", me).order("created_at", { ascending: false }),
      supabase.from("profiles").select("dob").eq("id", me).maybeSingle(),
    ]);
    setReqs(data ?? []); setDob(p?.dob ?? null);
  }, [me]);
  useEffect(() => { load(); }, [load]);
  if (!reqs) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const current = reqs[0] ?? null;
  const canSubmit = !current || current.status === "rejected" || current.status === "more_info";
  const withdraw = async (r: Req) => {
    if (!confirm("Withdraw this verification request? Your uploaded documents will be deleted.")) return;
    await supabase.storage.from("verification-docs").remove(r.document_paths);
    const { error } = await supabase.from("athlete_verifications").delete().eq("id", r.id);
    if (error) return void toast.error(error.message);
    toast.success("Request withdrawn"); load();
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-verification">Trust & safety</div>
        <h1 className="font-display text-4xl font-extrabold uppercase">Get verified</h1>
        <p className="mt-1 text-sm text-muted-foreground">Once our team approves your proof, a green shield shows on your profile with your school or academy name. Your documents, ID number and date of birth are never shown publicly.</p>
      </div>
      {current && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0 font-semibold">{KIND_LABEL[current.kind as VerificationKind]} · {current.org_name}</div><StatusChip req={current} /></div>
          {current.status === "approved" && <VerificationPill label={`Verified by ${current.org_name}`} />}
          {current.review_note && <p className="rounded-lg bg-muted p-3 text-sm"><span className="font-semibold">Reviewer note: </span>{current.review_note}</p>}
          <p className="text-xs text-muted-foreground">Submitted {new Date(current.created_at).toLocaleDateString("en-GB")}</p>
          {isPending(current.status as VerificationStatus) && <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => withdraw(current)}><Trash2 className="h-4 w-4" />Withdraw request</Button>}
        </div>
      )}
      {canSubmit && <VerificationWizard me={me} minor={(ageFrom(dob) ?? 0) < 18} onDone={load} replacing={current?.status === "more_info" ? current : null} />}
    </div>
  );
}

function VerificationWizard({ me, minor, onDone, replacing }: { me: string; minor: boolean; onDone: () => void; replacing: Req | null }) {
  const upload = useServerFn(uploadVerificationDoc);
  const aiReview = useServerFn(reviewVerificationWithAI);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<VerificationKind>((replacing?.kind as VerificationKind) ?? "school");
  const [d, setD] = useState({ org_name: replacing?.org_name ?? "", emirate: replacing?.emirate ?? "Abu Dhabi", athlete_ref: replacing?.athlete_ref ?? "", sport: replacing?.sport ?? "", team_grade: replacing?.team_grade ?? "" });
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, MAX_DOCS + 1);
    const err = checkDocMeta(next);
    if (err) return void toast.error(err);
    setFiles(next);
  };
  const submit = async () => {
    const err = checkDocMeta(files);
    if (err) return void toast.error(err);
    if (!consent) return void toast.error("Please confirm the document consent.");
    if (minor && !guardian) return void toast.error("A parent or guardian must agree before you submit.");
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of files) paths.push((await upload({ data: { base64: await toBase64(f) } })).path);
      if (replacing) {
        await supabase.storage.from("verification-docs").remove(replacing.document_paths);
        await supabase.from("athlete_verifications").delete().eq("id", replacing.id);
      }
      const { data: created, error } = await supabase.from("athlete_verifications").insert({ user_id: me, kind, ...d, org_name: d.org_name.trim(), document_paths: paths, guardian_consent: guardian }).select("id").single();
      if (error) { await supabase.storage.from("verification-docs").remove(paths); throw error; }
      // Background admin-only document check; the athlete never waits on or sees it.
      if (created) void aiReview({ data: { verificationId: created.id } }).catch(() => undefined);
      toast.success("Submitted — we'll review it soon.");
      onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't submit"); } finally { setBusy(false); }
  };

  const steps = ["Type", "Details", "Proof"];
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <ol className="grid grid-cols-3 gap-2">{steps.map((s, i) => <li key={s} className={cn("rounded-full border px-2 py-1.5 text-center text-xs font-bold uppercase tracking-wider", i === step ? "border-verification bg-verification-surface text-verification" : i < step ? "border-verification/40 text-verification" : "border-border text-muted-foreground")}>{i + 1} · {s}</li>)}</ol>

      {step === 0 && (
        <div className="grid gap-3">
          {(Object.keys(KIND_LABEL) as VerificationKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={cn("rounded-xl border p-4 text-left transition-colors", kind === k ? "border-verification bg-verification-surface" : "border-border hover:border-verification/50")}>
              <div className="font-semibold">{KIND_LABEL[k]}</div><p className="text-xs text-muted-foreground">{KIND_HELP[k]}</p>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><Label>{kind === "school" ? "School name" : kind === "academy" ? "Academy / club name" : "Coach's school or club"}</Label><Input maxLength={120} placeholder="e.g. Abu Dhabi Indian School" value={d.org_name} onChange={(e) => setD({ ...d, org_name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Emirate</Label><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={d.emirate} onChange={(e) => setD({ ...d, emirate: e.target.value })}>{EMIRATES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="grid gap-1.5"><Label>Student / athlete ID (optional)</Label><Input maxLength={40} value={d.athlete_ref} onChange={(e) => setD({ ...d, athlete_ref: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Sport</Label><Input maxLength={40} value={d.sport} onChange={(e) => setD({ ...d, sport: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Team / grade</Label><Input maxLength={40} placeholder="e.g. U16 · Grade 10" value={d.team_grade} onChange={(e) => setD({ ...d, team_grade: e.target.value })} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{KIND_HELP[kind]} JPG, PNG, HEIC or PDF · up to 10 MB each · max 2 files.</p>
          <input ref={fileRef} type="file" accept={DOC_ACCEPT} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <div className="flex flex-wrap gap-2">
            {kind === "school" && <Button type="button" variant="outline" className="rounded-full md:hidden" onClick={() => camRef.current?.click()} disabled={files.length >= MAX_DOCS}><Camera className="h-4 w-4" />Scan School ID</Button>}
            <Button type="button" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_DOCS}><Upload className="h-4 w-4" />Upload document</Button>
          </div>
          <ul className="space-y-2">{files.map((f, i) => <li key={f.name + i} className="flex min-w-0 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{f.name}</span><span className="shrink-0 text-xs text-muted-foreground">{(f.size / 1048576).toFixed(1)} MB</span><button type="button" aria-label="Remove file" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button></li>)}</ul>
          <label className="flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />I confirm that this document is mine or that I have permission to submit it for verification.</label>
          {minor && <label className="flex items-start gap-2 text-sm"><Checkbox checked={guardian} onCheckedChange={(v) => setGuardian(v === true)} className="mt-0.5" />I'm under 18 and my parent or guardian agrees to this verification request.</label>}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 2
          ? <Button type="button" onClick={() => { if (step === 1 && d.org_name.trim().length < 2) return void toast.error("Enter the organisation name."); setStep(step + 1); }}>Continue</Button>
          : <Button type="button" onClick={submit} disabled={busy || !files.length}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Submit for review</Button>}
      </div>
    </div>
  );
}

/** Admin queue: review proof (private short-lived links) and approve, reject or ask for more info. */
export function AthleteReviewQueue() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const load = useCallback(async () => {
    const { data } = await supabase.from("athlete_verifications").select("*").in("status", ["submitted", "under_review", "more_info"]).order("created_at");
    setReqs(data ?? []);
    setPeople(await loadPeople((data ?? []).map((r) => r.user_id)));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="space-y-3 rounded-2xl border border-gold/40 bg-card p-5">
      <h2 className="font-display text-2xl font-bold uppercase">Athlete verification queue <span className="text-muted-foreground">({reqs.length})</span></h2>
      {reqs.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>}
      {reqs.map((r) => <ReviewItem key={r.id} r={r} person={people[r.user_id]} onDone={() => { load(); loadAthleteBadges(true); }} />)}
    </section>
  );
}

function ReviewItem({ r, person, onDone }: { r: Req; person?: Person | undefined; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("verification-docs").createSignedUrl(path, 120);
    if (error || !data) return void toast.error("Couldn't open document");
    window.open(data.signedUrl, "_blank", "noopener");
  };
  const decide = async (status: VerificationStatus) => {
    if ((status === "rejected" || status === "more_info") && !note.trim()) return void toast.error("Add a note for the athlete.");
    setBusy(true);
    const { error } = await supabase.from("athlete_verifications").update({ status, review_note: note.trim() }).eq("id", r.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(statusLabel(status, r.kind as VerificationKind)); onDone();
  };
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Avatar person={person} size={40} />
        <div className="min-w-0 flex-1"><Link to="/u/$id" params={{ id: r.user_id }} className="block truncate font-semibold hover:underline">{displayName(person)}</Link><div className="text-xs text-muted-foreground">Submitted {new Date(r.created_at).toLocaleString("en-GB")}</div></div>
        <StatusChip req={r} />
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div><dt className="inline text-muted-foreground">Type: </dt><dd className="inline">{KIND_LABEL[r.kind as VerificationKind]}</dd></div>
        <div><dt className="inline text-muted-foreground">Organisation: </dt><dd className="inline break-words">{r.org_name}</dd></div>
        <div><dt className="inline text-muted-foreground">Emirate: </dt><dd className="inline">{r.emirate || "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">ID: </dt><dd className="inline">{r.athlete_ref || "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">Sport: </dt><dd className="inline">{r.sport || "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">Team/grade: </dt><dd className="inline">{r.team_grade || "—"}</dd></div>
        <div><dt className="inline text-muted-foreground">Guardian consent: </dt><dd className="inline">{r.guardian_consent ? "Yes" : "No"}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">{r.document_paths.map((p, i) => <Button key={p} size="sm" variant="outline" className="rounded-full" onClick={() => openDoc(p)}><FileText className="h-4 w-4" />Proof {i + 1}</Button>)}</div>
      <AiReviewPanel verificationId={r.id} />
      <Textarea placeholder="Note to the athlete (required to reject or request more info)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => decide("approved")}><Check className="h-4 w-4" />Approve</Button>
        {r.status === "submitted" && <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("under_review")}>Mark under review</Button>}
        <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("more_info")}>Request more info</Button>
        <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => decide("rejected")}><X className="h-4 w-4" />Reject</Button>
      </div>
    </div>
  );
}

type AiRun = { id: string; status: string; model: string; created_at: string; error: string | null; result: Record<string, unknown> | null };
const MATCH_TONE: Record<string, string> = { match: "text-verification", partial_match: "text-gold", mismatch: "text-destructive", not_found: "text-muted-foreground" };
const mask = (v: unknown) => (typeof v === "string" && v ? (v.length > 4 ? `••••${v.slice(-4)}` : v) : "—");

/** Admin-only collapsible ScoutAI document review. Advisory; never changes the request. */
function AiReviewPanel({ verificationId }: { verificationId: string }) {
  const rerun = useServerFn(reviewVerificationWithAI);
  const [runs, setRuns] = useState<AiRun[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("verification_ai_reviews").select("id, status, model, created_at, error, result").eq("verification_id", verificationId).order("created_at", { ascending: false });
    setRuns((data ?? []) as AiRun[]);
  }, [verificationId]);
  useEffect(() => { load(); }, [load]);
  const latest = runs[0];
  const r = latest?.result ?? null;
  const field = (label: string, v: unknown, m?: unknown) => <div className="min-w-0"><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline break-words">{typeof v === "string" && v ? v : "—"}{typeof m === "string" && <span className={cn("ml-1 text-xs font-semibold", MATCH_TONE[m])}>({m.replace("_", " ")})</span>}</dd></div>;
  return (
    <details className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Scout AI Review {latest ? <span className="font-normal text-muted-foreground">· {latest.status === "done" ? `${String(r?.["confidence"] ?? "")} confidence` : latest.status}</span> : <span className="font-normal text-muted-foreground">· not run</span>}</summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs font-semibold text-gold">AI-assisted review only — admin decision required.</p>
        {!latest && <Button size="sm" variant="outline" onClick={async () => { await rerun({ data: { verificationId } }).catch(() => toast.error("Scout AI couldn't run")); load(); }}>Run Scout AI check</Button>}
        {latest?.status === "running" && <Button size="sm" variant="ghost" onClick={load}><Loader2 className="h-4 w-4 animate-spin" />Checking… refresh</Button>}
        {latest?.status === "failed" && <p className="text-muted-foreground">Scout AI couldn't read this request ({latest.error}). Review it manually.</p>}
        {r && (
          <>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {field("Document", String(r["documentType"] ?? "").replace("_", " "))}
              {field("Readability", r["documentReadability"])}
              {field("Name", r["extractedName"], r["profileNameMatch"])}
              {field("Organisation", r["extractedOrganization"], r["organizationMatch"])}
              {field("ID", mask(r["extractedAthleteReference"]), r["athleteReferenceMatch"])}
              {field("Sport", r["extractedSport"], r["sportMatch"])}
              {field("Team/grade", r["extractedTeamOrGrade"])}
              {field("Expiry/year", r["extractedExpiryOrAcademicYear"])}
            </dl>
            {Array.isArray(r["reviewFlags"]) && (r["reviewFlags"] as string[]).length > 0 && <div className="flex flex-wrap gap-1">{(r["reviewFlags"] as string[]).map((f) => <span key={f} className="rounded-full border border-border px-2 py-0.5 text-xs">{f.replace(/_/g, " ")}</span>)}</div>}
            <p>{String(r["adminSummary"] ?? "")}</p>
          </>
        )}
        {latest && <p className="text-xs text-muted-foreground">Ran {new Date(latest.created_at).toLocaleString("en-GB")} · {latest.model}{runs.length > 1 ? ` · ${runs.length - 1} earlier run(s) kept` : ""}</p>}
      </div>
    </details>
  );
}
