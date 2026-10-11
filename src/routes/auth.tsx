import { ThemeToggle } from "@/components/ThemeToggle";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AthleteScouts" },
      { name: "description", content: "Sign in or create your AthleteScouts account to build your Opportunity Passport." },
      { property: "og:title", content: "Sign in — AthleteScouts" },
      { property: "og:description", content: "Join the GCC's athlete discovery network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const goNext = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("onboarded").eq("id", userId).maybeSingle();
    navigate({ to: data?.onboarded ? "/feed" : "/onboarding", replace: true });
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) goNext(data.user.id); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s?.user) goNext(s.user.id); });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 const social = async (provider: "google" | "apple") => {
  setBusy(true);
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth` } });
  if (error) { toast.error(error.message ?? "Sign-in failed"); setBusy(false); }
};

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) toast.success("Check your email to confirm your account.");
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-grid px-4 py-10">
      <ThemeToggle className="absolute right-4 top-4" />
      <Toaster />
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 shadow-glow sm:p-8">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-neon"><Crosshair className="h-5 w-5 text-primary-foreground" /></span>
          <span className="font-display text-2xl font-extrabold uppercase">Athlete<span className="text-primary">Scouts</span></span>
        </Link>
        <div className="grid gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => social("google")}>Continue with Google</Button>
          <Button variant="secondary" disabled={busy} onClick={() => social("apple")}>Continue with Apple</Button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or email<span className="h-px flex-1 bg-border" /></div>
        <Tabs defaultValue="in">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="in">Sign in</TabsTrigger><TabsTrigger value="up">Create account</TabsTrigger></TabsList>
          <TabsContent value="in">
            <form onSubmit={signIn} className="mt-4 grid gap-3">
              <div className="grid gap-1.5"><Label htmlFor="e1">Email</Label><Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="p1">Password</Label><Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</Button>
            </form>
          </TabsContent>
          <TabsContent value="up">
            <form onSubmit={signUp} className="mt-4 grid gap-3">
              <div className="grid gap-1.5"><Label htmlFor="n2">Full name</Label><Input id="n2" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="e2">Email</Label><Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="p2">Password</Label><Input id="p2" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
