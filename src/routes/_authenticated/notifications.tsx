import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Loader2, MessageCircle, Trophy, UserPlus, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, displayName, loadPeople, timeAgo, type Person } from "@/lib/social";
import { FollowButton } from "@/components/app/FollowButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — AthleteScouts" }, { name: "description", content: "Follows, reactions, messages and applications." }, { property: "og:title", content: "Notifications — AthleteScouts" }, { property: "og:description", content: "Follows, reactions, messages and applications." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Notifications,
});

const TEXT: Record<string, { t: string; icon: typeof Bell; tone: string }> = {
  follow: { t: "started following you", icon: UserPlus, tone: "text-primary" },
  like: { t: "reacted ⚡ to your post", icon: Zap, tone: "text-gold" },
  message: { t: "sent you a message", icon: MessageCircle, tone: "text-accent" },
  application: { t: "applied to your opportunity", icon: Trophy, tone: "text-gold" },
  application_shortlisted: { t: "shortlisted your application", icon: Trophy, tone: "text-primary" },
  application_accepted: { t: "accepted your application 🎉", icon: Trophy, tone: "text-primary" },
  application_declined: { t: "reviewed your application — not selected this time", icon: Trophy, tone: "text-muted-foreground" },
  application_submitted: { t: "moved your application back to review", icon: Trophy, tone: "text-muted-foreground" },
};

function Notifications() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const [items, setItems] = useState<Tables<"notifications">[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("notifications").select("*").eq("user_id", me).order("created_at", { ascending: false }).limit(100).then(async ({ data }) => {
      setItems(data ?? []);
      setPeople(await loadPeople((data ?? []).map((n) => n.actor_id ?? "")));
      setLoading(false);
    });
  }, [me]);

  const markAll = async () => {
    setItems((x) => x.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", me).eq("read", false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-end justify-between">
        <div><div className="text-xs font-bold uppercase tracking-widest text-primary">Activity</div><h1 className="font-display text-4xl font-extrabold uppercase">Notifications</h1></div>
        {items.some((n) => !n.read) && <button type="button" onClick={markAll} className="text-sm font-semibold text-primary hover:underline">Mark all read</button>}
      </div>
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : items.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-8 w-8 text-primary" />You're all caught up.</div>
        : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {items.map((n) => {
              const meta = TEXT[n.type] ?? { t: n.type, icon: Bell, tone: "" };
              const actor = n.actor_id ? people[n.actor_id] : undefined;
              const href = n.type === "message" && n.actor_id ? { to: "/inbox" as const, search: { with: n.actor_id } } : n.type.startsWith("application") ? { to: "/opportunities" as const } : n.actor_id ? { to: "/u/$id" as const, params: { id: n.actor_id } } : { to: "/feed" as const };
              return (
                <li key={n.id} className={cn("flex items-center gap-3 border-b border-border/60 p-3 last:border-0", !n.read && "bg-primary/5")}>
                  <span className="relative"><Avatar person={actor} size={44} /><span className={cn("absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-card", meta.tone)}><meta.icon className="h-3.5 w-3.5" /></span></span>
                  <Link {...href} className="min-w-0 flex-1 text-sm">
                    <span className="font-bold">{displayName(actor)}</span> <span className="text-muted-foreground">{meta.t}</span>
                    <div className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
                  </Link>
                  {n.type === "follow" && n.actor_id && <FollowButton me={me} id={n.actor_id} size="xs" />}
                  {!n.read && <span className="h-2 w-2 rounded-full bg-gold" />}
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}
