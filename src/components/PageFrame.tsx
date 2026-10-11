import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { SiteHeader } from "@/components/SiteHeader";

/** Public pages: signed-in members keep the app sidebar; visitors get the site header. */
export function PageFrame({ children }: { children: ReactNode }) {
  // undefined = still checking. Waiting avoids mounting the page twice (which restarted its map requests).
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let done = false;
    const finish = (id: string | null) => { if (!done) { done = true; setUserId(id); } };
    supabase.auth.getSession().then(({ data }) => finish(data.session?.user.id ?? null)).catch(() => finish(null));
    const t = setTimeout(() => finish(null), 2000);
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") setUserId(s?.user.id ?? null); });
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);
  if (userId === undefined) return <SiteHeader />;
  if (userId) return <AppShell me={userId}>{children}</AppShell>;
  return <><SiteHeader />{children}</>;
}
