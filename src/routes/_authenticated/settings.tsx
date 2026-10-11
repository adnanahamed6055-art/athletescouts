import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { resetFollowsCache } from "@/hooks/useFollows";
import { getTheme, setTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — AthleteScouts" }, { name: "description", content: "Manage your account, privacy and appearance." }, { property: "og:title", content: "Settings — AthleteScouts" }, { property: "og:description", content: "Manage your account, privacy and appearance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [f, setF] = useState({ full_name: "", username: "", bio: "", location: "" });
  const [isPrivate, setIsPrivate] = useState(false);
  const [activity, setActivity] = useState(true);
  const [dark, setDark] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDark(getTheme() === "dark");
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setF({ full_name: data.full_name ?? "", username: data.username ?? "", bio: data.bio ?? "", location: data.location ?? "" });
      setIsPrivate(data.is_private); setActivity(data.show_activity);
    });
  }, [user.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = f.username.trim().toLowerCase();
    if (username && !/^[a-z0-9_.]{3,24}$/.test(username)) { toast.error("Username: 3–24 letters, numbers, dots or underscores"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: f.full_name || null, username: username || null, bio: f.bio || null, location: f.location || null }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "That username is taken" : error.message); return; }
    toast.success("Saved");
  };
  const toggle = async (col: "is_private" | "show_activity", v: boolean) => {
    if (col === "is_private") setIsPrivate(v); else setActivity(v);
    const { error } = await supabase.from("profiles").update(col === "is_private" ? { is_private: v } : { show_activity: v }).eq("id", user.id);
    if (error) toast.error(error.message);
  };
  const signOut = async () => {
    resetFollowsCache();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div><div className="text-xs font-bold uppercase tracking-widest text-primary">Your account</div><h1 className="font-display text-4xl font-extrabold uppercase">Settings</h1></div>

      <form onSubmit={save} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile</h2>
        <div className="grid gap-1.5"><Label>Display name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label>Username</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span><Input className="pl-7" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div></div>
        <div className="grid gap-1.5"><Label>Bio</Label><Textarea maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Striker · ADIS U-16 · Dream big, train harder." /></div>
        <div className="grid gap-1.5"><Label>City</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Abu Dhabi" /></div>
        <div className="flex items-center justify-between pt-1">
          <Link to="/onboarding" className="flex items-center text-sm font-semibold text-primary">Sport & athletic details<ChevronRight className="h-4 w-4" /></Link>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </form>

      <div className="space-y-1 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Privacy</h2>
        <Row label="Private account" hint="Only followers can see your posts."><Switch checked={isPrivate} onCheckedChange={(v) => toggle("is_private", v)} /></Row>
        <Row label="Activity status" hint="Show when you're active in messages."><Switch checked={activity} onCheckedChange={(v) => toggle("show_activity", v)} /></Row>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Appearance</h2>
        <Row label="Dark mode"><Switch checked={dark} onCheckedChange={(v) => { setDark(v); setTheme(v ? "dark" : "light"); }} /></Row>
      </div>

      <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={signOut}>Log out</Button>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-2"><div><div className="text-sm font-semibold">{label}</div>{hint && <div className="text-xs text-muted-foreground">{hint}</div>}</div>{children}</div>;
}
