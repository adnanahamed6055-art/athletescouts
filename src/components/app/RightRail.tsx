import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, RoleBadge, displayName, loadAllPeople, type Person } from "@/lib/social";
import { FollowButton } from "./FollowButton";

export function RightRail({ me }: { me: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [opps, setOpps] = useState<Tables<"opportunities">[]>([]);
  useEffect(() => {
    loadAllPeople().then((all) => setPeople(all.filter((p) => p.id !== me).sort(() => Math.random() - 0.5).slice(0, 5)));
    supabase.from("opportunities").select("*").gte("deadline", new Date().toISOString().slice(0, 10)).order("deadline").limit(4).then(({ data }) => setOpps(data ?? []));
  }, [me]);
  return (
    <aside className="sticky top-22 hidden h-fit w-72 shrink-0 space-y-6 xl:block">
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Suggested for you</h3>
        {people.length === 0 ? <p className="text-sm text-muted-foreground">Invite teammates to grow your network.</p> : (
          <div className="space-y-3">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Link to="/u/$id" params={{ id: p.id }}><Avatar person={p} size={36} /></Link>
                <Link to="/u/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold hover:text-primary">{displayName(p)}</div>
                  <div className="flex items-center gap-1"><RoleBadge role={p.role} /><span className="truncate text-[11px] text-muted-foreground">{p.sport}</span></div>
                </Link>
                <FollowButton me={me} id={p.id} size="xs" />
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Closing soon</h3>
          <Link to="/opportunities" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        <div className="space-y-3">
          {opps.map((o) => {
            const days = Math.ceil((new Date(o.deadline).getTime() - Date.now()) / 86400000);
            return (
              <Link key={o.id} to="/opportunities" className="block rounded-lg p-2 -m-2 hover:bg-secondary">
                <div className="truncate text-sm font-semibold">{o.title}</div>
                <div className="text-[11px] text-muted-foreground"><span className={days <= 5 ? "font-bold text-gold" : ""}>{days <= 0 ? "Closes today" : `${days}d left`}</span> · {o.sport}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
