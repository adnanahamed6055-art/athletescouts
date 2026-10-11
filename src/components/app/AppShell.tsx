import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clapperboard, Crown, ShieldCheck, Bot, Bell, Compass, Crosshair, Home, LogOut, Map as MapIcon, MessageCircle, Search, Settings, Trophy, UserRound, X, Sun, Moon, Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { Avatar, RoleBadge, displayName, loadAllPeople, type Person } from "@/lib/social";
import { resetFollowsCache } from "@/hooks/useFollows";
import { RightRail } from "./RightRail";
import { Button } from "@/components/ui/button";
import { MessagesBar } from "./MessagesBar";
import { getTheme, setTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/reels", label: "Reels", icon: Clapperboard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/opportunities", label: "Opportunities", icon: Trophy },
  { to: "/scoutai", label: "ScoutAI", icon: Bot },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/clubs", label: "Club Map", icon: MapIcon },
  { to: "/verification", label: "Verification", icon: ShieldCheck },
  { to: "/pricing", label: "Pro plan", icon: Crown },
] as const;

export function AppShell({ me, children }: { me: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  useEffect(() => {setDark(getTheme() === "dark");}, []);
  const [unread, setUnread] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mePerson, setMePerson] = useState<Person | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", me).maybeSingle().then(({ data }) => data && setMePerson({ ...data, role: null }));
    supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", me).then(() => {});
    const refresh = async () => {
      const [{ count: n }, { count: m }] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me).eq("read", false).neq("type", "message"),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", me).is("read_at", null),
      ]);
      setUnread(n ?? 0); setUnreadMsgs(m ?? 0);
    };
    refresh();
    const ch = supabase.channel(`shell-${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me]);

  // "/" opens search anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    resetFollowsCache();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  const showRail = !["/inbox", "/clubs", "/scoutai", "/reels"].some((p) => path.startsWith(p));

  return (
    <div className="min-h-screen">
      <Toaster />
      {/* Desktop sidebar */}
      <aside aria-label="Main navigation" className="fixed inset-y-0 left-0 z-30 hidden w-28 flex-col overflow-y-auto border-r border-border bg-background p-3 md:flex md:flex lg:w-28 xl:w-60 xl:p-4">
        <Link to="/feed" aria-label="AthleteScouts feed" className="mb-6 flex shrink-0 items-center justify-center gap-2 xl:justify-start xl:px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary"><Crosshair className="h-5 w-5 text-primary-foreground" /></span>
          <span className="hidden font-display text-xl font-extrabold uppercase xl:inline">AthleteScouts</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} title={n.label} aria-label={n.label} aria-current={isActive(n.to) ? "page" : undefined} className={cn("group relative flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-semibold leading-tight transition-colors xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:py-3 xl:text-sm", isActive(n.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <n.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" /><span className="text-center xl:text-left">{n.label}</span>
              {n.to === "/inbox" && unreadMsgs > 0 && <span className="absolute right-1 top-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">{unreadMsgs}</span>}
            </Link>
          ))}
          <Link to="/notifications" title="Notifications" aria-label="Notifications" aria-current={isActive("/notifications") ? "page" : undefined} className={cn("group relative flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[10px] font-semibold leading-tight xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:py-3 xl:text-sm", isActive("/notifications") ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <Bell className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" /><span className="text-center xl:text-left">Notifications</span>
            {unread > 0 && <span className="absolute right-1 top-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">{unread}</span>}
          </Link>
        </nav>
        <div className="space-y-1 border-t border-border pt-4">
          <Link to="/u/$id" params={{ id: me }} aria-label="My profile" title="My profile" className="flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold leading-tight text-muted-foreground hover:bg-secondary hover:text-foreground xl:flex-row xl:justify-start xl:gap-3 xl:px-2 xl:text-sm">
            <Avatar person={mePerson} size={34} />
            <span className="text-center xl:hidden">Profile</span>
            <div className="hidden min-w-0 xl:block"><div className="truncate text-sm font-bold">{displayName(mePerson)}</div><div className="text-xs text-muted-foreground">View profile</div></div>
          </Link>
          <div className="flex flex-col gap-1 xl:flex-row">
            <Link to="/settings" title="Settings" aria-label="Settings" className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold leading-tight text-muted-foreground hover:bg-secondary hover:text-foreground xl:flex-row xl:justify-start xl:px-3 xl:text-sm"><Settings className="h-4 w-4 shrink-0" /><span className="text-center xl:text-left">Settings</span></Link>
            <Button variant="ghost" size="icon" type="button" onClick={signOut} className="mx-auto text-muted-foreground hover:text-destructive" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="md:pl-28 xl:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-1.5 border-b border-border bg-background/95 px-3 backdrop-blur sm:gap-3 sm:px-4">
          <Link to="/feed" aria-label="Feed" className="shrink-0 md:hidden"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary"><Crosshair className="h-5 w-5 text-primary-foreground" /></span></Link>
          <Button variant="ghost" type="button" onClick={() => setSearchOpen(true)} className="flex h-10 min-w-0 flex-1 justify-start gap-2 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/60 md:max-w-md">
            <Search className="h-4 w-4" /><span className="min-w-0 truncate">Search people, clubs, scouts…</span><kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] md:inline">/</kbd>
          </Button>
          <Button asChild variant="ghost" className="shrink-0 gap-2 px-2" aria-label="ScoutAI"><Link to="/scoutai" title="ScoutAI"><Bot className="h-5 w-5" /><span className="hidden sm:inline">ScoutAI</span></Link></Button>
          <Link to="/notifications" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary md:hidden" aria-label="Notifications">
            <Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />}
          </Link>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => {setTheme(dark ? "light" : "dark");setDark(!dark);}}>{dark ? <Sun /> : <Moon />}</Button>
          <Button asChild variant="ghost" size="icon" className="hidden shrink-0 sm:inline-flex" aria-label="Inbox"><Link to="/inbox"><MessageCircle /></Link></Button>
        </header>

        <div className={cn("mx-auto flex max-w-6xl gap-8 px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:pb-10 md:pt-6", !showRail && "max-w-none")}>
          <main className="min-w-0 flex-1">{children}</main>
          {showRail && <RightRail me={me} />}
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {[NAV[0], NAV[2], NAV[1], NAV[4], NAV[5]].map((n) => {
          const active = isActive(n.to);
          const cls = cn("relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground");
          const inner = <><n.icon className="h-5 w-5" />{n.label}{n.to === "/inbox" && unreadMsgs > 0 && <span className="absolute right-5 top-1.5 h-2 w-2 rounded-full bg-gold" />}</>;
          return <Link key={n.to} to={n.to} aria-current={active ? "page" : undefined} className={cls}>{inner}</Link>;
        })}
        <Button variant="ghost" aria-label="More navigation" onClick={() => setMenuOpen(true)} className="h-auto flex-col gap-0.5 rounded-none py-2.5 text-[10px] text-muted-foreground"><Menu className="h-5 w-5" />More</Button>
      </nav>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle>AthleteScouts</DialogTitle>
          <nav aria-label="More destinations" className="grid grid-cols-2 gap-2">
            {NAV.map((n) => <Button key={n.to} asChild variant={isActive(n.to) ? "secondary" : "ghost"} className="h-12 justify-start" onClick={() => setMenuOpen(false)}><Link to={n.to}><n.icon className="h-5 w-5 shrink-0" />{n.label}</Link></Button>)}
            <Button asChild variant="ghost" className="h-12 justify-start" onClick={() => setMenuOpen(false)}><Link to="/u/$id" params={{ id: me }}><UserRound />My profile</Link></Button>
            <Button asChild variant="ghost" className="h-12 justify-start" onClick={() => setMenuOpen(false)}><Link to="/settings"><Settings />Settings</Link></Button>
            <Button variant="ghost" className="h-12 justify-start" onClick={signOut}><LogOut />Sign out</Button>
          </nav>
        </DialogContent>
      </Dialog>

      {!["/inbox", "/scoutai", "/reels"].some((p) => path.startsWith(p)) && <MessagesBar me={me} />}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} me={me} />
    </div>
  );
}

function SearchDialog({ open, onOpenChange, me }: { open: boolean; onOpenChange: (o: boolean) => void; me: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  useEffect(() => { if (open) loadAllPeople().then(setPeople); else setQ(""); }, [open]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = people.filter((p) => p.id !== me);
    if (!t) return list.slice(0, 12);
    return list.filter((p) => [p.full_name, p.org_name, p.username, p.sport, p.position, p.location, p.region, p.school].some((v) => v?.toLowerCase().includes(t))).slice(0, 30);
  }, [q, people, me]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-5 w-5 text-primary" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, sport, position, school, city…" className="border-0 bg-transparent focus-visible:ring-0" />
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No members match “{q}”.</p> : results.map((p) => (
            <button key={p.id} type="button" onClick={() => { onOpenChange(false); navigate({ to: "/u/$id", params: { id: p.id } }); }}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-secondary">
              <Avatar person={p} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="truncate font-semibold">{displayName(p)}</span><VerifiedBadge userId={p.id} /><RoleBadge role={p.role} /></div>
                <div className="truncate text-xs text-muted-foreground">{[p.sport, p.position, p.location || p.region].filter(Boolean).join(" · ") || "AthleteScouts member"}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
