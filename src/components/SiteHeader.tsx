import { Link, useNavigate } from "@tanstack/react-router";
import { Crosshair, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const linkCls = "text-muted-foreground transition-colors hover:text-foreground";
const activeCls = { className: "text-primary" };

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 md:flex md:justify-between md:gap-4 md:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-neon shadow-glow"><Crosshair className="h-5 w-5 text-primary-foreground" /></span>
          <span className="truncate font-display text-xl font-extrabold uppercase sm:text-2xl">Athlete<span className="text-primary">Scouts</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/clubs" className={linkCls} activeProps={activeCls}>Clubs</Link>
          <Link to="/pricing" className={linkCls} activeProps={activeCls}>Pricing</Link>
          {user && <Link to="/scoutai" className={linkCls} activeProps={activeCls}>ScoutAI</Link>}
          {user && <Link to="/feed" className={linkCls} activeProps={activeCls}>My Feed</Link>}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline" className="md:hidden"><Link to="/feed"><UserRound className="h-4 w-4" /></Link></Button>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2"><ThemeToggle /><Button asChild size="sm"><Link to="/auth">Sign in</Link></Button></div>
        )}
      </div>
    </header>
  );
}
