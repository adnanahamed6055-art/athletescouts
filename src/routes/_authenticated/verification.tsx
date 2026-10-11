import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Clock, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, displayName, loadPeople, type Person } from "@/lib/social";
import { AthleteReviewQueue, AthleteVerification } from "@/components/app/AthleteVerification";
import { loadVerifiedCoaches } from "@/hooks/useVerifiedCoaches";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({ meta: [
    { title: "Get Verified — AthleteScouts" },
    { name: "description", content: "Verified coaches carry a trusted badge so athletes and clubs know who they're dealing with." },
    { property: "og:title", content: "Get Verified — AthleteScouts" },
    { property: "og:description", content: "Get your coaching credentials verified on AthleteScouts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VerificationPage,
});

type Req = Tables<"coach_verifications">;

function VerificationPage() {
  const { user } = Route.useRouteContext();
  const [roles, setRoles] = useState<string[] | null>(null);
  useEffect(() => {
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => setRoles((data ?? []).map((r) => r.role)));
  }, [user.id]);
  if (!roles) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (roles.includes("athlete")) return <div className="mx-auto min-w-0 max-w-2xl"><AthleteVerification me={user.id} /></div>;
  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-6">
      {roles.includes("admin") && <AthleteReviewQueue />}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Trust & safety</div>
        <h1 className="font-display text-4xl font-extrabold uppercase">Coach verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verified coaches show a <BadgeCheck className="inline h-4 w-4 text-primary" /> tick on their profile, posts and in search, so athletes, parents and clubs know their credentials were checked.</p>
      </div>
      {roles.includes("admin") && <ReviewQueue me={user.id} />}
      {roles.includes("coach") ? <CoachForm me={user.id} /> : !roles.includes("admin") && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Verification is for coaches and school PE staff. Look for the <BadgeCheck className="inline h-4 w-4 text-primary" /> tick when choosing who to train with — find coaches on <Link to="/discover" className="font-semibold text-primary">Discover</Link>.
        </div>
      )}
    </div>
  );
}

function CoachForm({ me }: { me: string }) {
  const [req, setReq] = useState<Req | null | undefined>(undefined);
  const [f, setF] = useState({ license_no: "", issuing_body: "", organisation: "", note: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from("coach_verifications").select("*").eq("user_id", me).maybeSingle().then(({ data }) => {
      setReq(data);
      if (data) setF({ license_no: data.license_no, issuing_body: data.issuing_body, organisation: data.organisation, note: data.note });
    });
  }, [me]);
  if (req === undefined) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  const submit = async () => {
    if (!f.license_no.trim() || !f.issuing_body.trim()) { toast.error("Licence number and issuing body are required"); return; }
    setBusy(true);
    const row = { user_id: me, license_no: f.license_no.trim(), issuing_body: f.issuing_body.trim(), organisation: f.organisation.trim(), note: f.note.trim(), status: "pending", review_note: "", reviewed_by: null, reviewed_at: null };
    const { data, error } = req
      ? await supabase.from("coach_verifications").update(row).eq("user_id", me).select().single()
      : await supabase.from("coach_verifications").insert(row).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setReq(data); toast.success("Submitted for review");
  };

  if (req?.status === "approved") return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
      <BadgeCheck className="h-8 w-8 text-primary" />
      <div><div className="font-bold">You're a verified coach</div><div className="text-sm text-muted-foreground">{req.issuing_body} · licence {req.license_no}</div></div>
    </div>
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      {req?.status === "pending" && <div className="flex items-center gap-2 rounded-lg bg-gold/10 p-3 text-sm text-gold"><Clock className="h-4 w-4" />Under review — we'll notify you once checked. You can update details below.</div>}
      {req?.status === "rejected" && <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"><XCircle className="mt-0.5 h-4 w-4" /><div>Not approved{req.review_note ? `: ${req.review_note}` : ""}. Update your details and resubmit.</div></div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">Licence / certificate no.*<Input value={f.license_no} onChange={(e) => setF({ ...f, license_no: e.target.value })} placeholder="e.g. UEFA-B 123456" /></label>
        <label className="space-y-1 text-sm font-semibold">Issuing body*<Input value={f.issuing_body} onChange={(e) => setF({ ...f, issuing_body: e.target.value })} placeholder="e.g. UAE FA, ECB, World Athletics" /></label>
      </div>
      <label className="block space-y-1 text-sm font-semibold">School / club you coach at<Input value={f.organisation} onChange={(e) => setF({ ...f, organisation: e.target.value })} /></label>
      <label className="block space-y-1 text-sm font-semibold">Anything that helps us verify (link to registry, referee contact)<Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      <Button onClick={submit} disabled={busy} className="font-bold">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{req ? "Update & resubmit" : "Request verification"}</Button>
    </div>
  );
}

function ReviewQueue({ me }: { me: string }) {
  const [rows, setRows] = useState<Req[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = async () => {
    const { data } = await supabase.from("coach_verifications").select("*").eq("status", "pending").order("created_at");
    setRows(data ?? []);
    setPeople(await loadPeople((data ?? []).map((r) => r.user_id)));
  };
  useEffect(() => { load(); }, []);
  const decide = async (r: Req, status: "approved" | "rejected") => {
    const { error } = await supabase.from("coach_verifications").update({ status, review_note: notes[r.id] ?? "", reviewed_by: me, reviewed_at: new Date().toISOString() }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Coach verified" : "Request declined");
    loadVerifiedCoaches(true); load();
  };
  return (
    <section className="space-y-3 rounded-2xl border border-gold/40 bg-card p-5">
      <h2 className="font-display text-xl font-bold uppercase">Review queue ({rows.length})</h2>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
      {rows.map((r) => (
        <div key={r.id} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center gap-3"><Avatar person={people[r.user_id]} size={36} /><Link to="/u/$id" params={{ id: r.user_id }} className="font-bold hover:text-primary">{displayName(people[r.user_id])}</Link></div>
          <div className="text-sm"><b>{r.issuing_body}</b> · {r.license_no}{r.organisation && ` · ${r.organisation}`}</div>
          {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
          <Input placeholder="Note to coach (optional)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
          <div className="flex gap-2"><Button size="sm" onClick={() => decide(r, "approved")}><BadgeCheck className="h-4 w-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => decide(r, "rejected")}>Decline</Button></div>
        </div>
      ))}
    </section>
  );
}
