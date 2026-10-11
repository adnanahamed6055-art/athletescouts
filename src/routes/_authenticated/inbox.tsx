import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, Send, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, RoleBadge, displayName, loadPeople, timeAgo, type Person } from "@/lib/social";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/app/FollowButton";
import { DemoConnection, DemoThread, DemoTag } from "@/components/app/Demo";
import { DEMO_CHATS, DEMO_PEOPLE, demoPerson } from "@/data/demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: (s: Record<string, unknown>): { with?: string } => (typeof s["with"] === "string" ? { with: s["with"] } : {}),
  head: () => ({ meta: [{ title: "Inbox — AthleteScouts" }, { name: "description", content: "Direct messages with athletes, coaches, clubs and scouts." }, { property: "og:title", content: "Inbox — AthleteScouts" }, { property: "og:description", content: "Direct messages with athletes, coaches, clubs and scouts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Inbox,
});

type Msg = Tables<"messages">;

function Inbox() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const { with: other } = Route.useSearch();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chats" | "followers" | "following">("chats");
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState<Person[]>([]);
  useEffect(() => {
    const load = async () => {
      if (tab === "chats") {setConnections([]);return;}
      const {data} = await supabase.from("follows").select("follower_id,following_id").eq(tab === "followers" ? "following_id" : "follower_id",me);
      setConnections(Object.values(await loadPeople((data ?? []).map(f => tab === "followers" ? f.follower_id : f.following_id))));
    };load();
  },[tab,me]);

  useEffect(() => {
    supabase.from("messages").select("*").or(`sender_id.eq.${me},recipient_id.eq.${me}`).order("created_at").limit(2000).then(async ({ data, error }) => {
      if (error) toast.error(error.message);
      const rows = data ?? [];
      setMsgs(rows);
      setPeople(await loadPeople([...rows.flatMap((m) => [m.sender_id, m.recipient_id]), ...(other && !other.startsWith("d-") ? [other] : [])]));
      setLoading(false);
    });
    const ch = supabase.channel(`inbox-${me}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` }, async (p) => {
        const m = p.new as Msg;
        setMsgs((x) => (x.some((y) => y.id === m.id) ? x : [...x, m]));
        const pp = await loadPeople([m.sender_id]); setPeople((o) => ({ ...pp, ...o }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    if (other && !other.startsWith("d-") && !people[other]) loadPeople([other]).then((pp) => setPeople((o) => ({ ...o, ...pp })));
  }, [other, people]);

  const threads = useMemo(() => {
    const map = new Map<string, { last: Msg; unread: number }>();
    for (const m of msgs) {
      const o = m.sender_id === me ? m.recipient_id : m.sender_id;
      const t = map.get(o) ?? { last: m, unread: 0 };
      t.last = m;
      if (m.recipient_id === me && !m.read_at) t.unread++;
      map.set(o, t);
    }
    return [...map.entries()].sort((a, b) => b[1].last.created_at.localeCompare(a[1].last.created_at));
  }, [msgs, me]);

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl overflow-hidden rounded-lg border border-border bg-card lg:h-[calc(100vh-7rem)]">
      <aside className={cn("w-full shrink-0 border-r border-border md:w-80", other && "hidden md:block")}>
        <div className="border-b border-border p-4"><div className="text-xs font-bold uppercase tracking-widest text-primary">Messages</div><h1 className="font-display text-3xl font-extrabold uppercase">Inbox</h1></div>
        <div className="flex border-b border-border p-1">{(["chats","followers","following"] as const).map(t => <Button key={t} variant="ghost" size="sm" className={cn("flex-1 capitalize",tab===t && "text-primary bg-primary/10")} onClick={() => setTab(t)}>{t}</Button>)}</div>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2"><Search className="h-4 w-4 text-muted-foreground"/><input aria-label="Search connections" placeholder="Search connections…" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none" /></div>
        <div className="h-[calc(100%_-_10.5rem)] overflow-y-auto">
          {tab !== "chats" && connections.filter(p => displayName(p).toLowerCase().includes(query.toLowerCase())).map(p => <div key={p.id} className="flex items-center gap-2 p-3"><Link to="/inbox" search={{with:p.id}} className="flex min-w-0 flex-1 items-center gap-2"><Avatar person={p} size={38}/><span className="truncate text-sm font-bold">{displayName(p)}</span></Link><FollowButton me={me} id={p.id} size="xs"/></div>)}
          {tab === "chats" && <>
          {loading ? <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            : threads.length === 0 ? null
            : threads.filter(([id]) => displayName(people[id]).toLowerCase().includes(query.toLowerCase())).map(([id, t]) => (
              <Button asChild variant="ghost" key={id}><Link to="/inbox" search={{with:id}}
                className={cn("flex w-full items-center gap-3 border-b border-border/50 h-auto rounded-none p-3 text-left transition-colors hover:bg-secondary", other === id && "bg-primary/10")}>
                <Avatar person={people[id]} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><span className={cn("truncate text-sm", t.unread ? "font-extrabold" : "font-semibold")}>{displayName(people[id])}</span><span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(t.last.created_at)}</span></div>
                  <div className={cn("truncate text-xs", t.unread ? "text-foreground" : "text-muted-foreground")}>{t.last.sender_id === me && "You: "}{t.last.body}</div>
                </div>
                {t.unread > 0 && <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">{t.unread}</span>}
              </Link></Button>
            ))}
          </>}
          {tab === "chats" && Object.entries(DEMO_CHATS).map(([id, lines]) => { const p = demoPerson(id); const last = lines[lines.length - 1]; if (!p || !last || !p.name.toLowerCase().includes(query.toLowerCase())) return null; return (
            <Button asChild variant="ghost" key={id}><Link to="/inbox" search={{ with: id }} className={cn("flex h-auto w-full items-center gap-3 rounded-none border-b border-border/50 p-3 text-left hover:bg-secondary", other === id && "bg-primary/10")}>
              <img src={p.image} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover object-top" />
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={cn("truncate text-sm", last.from === "them" ? "font-extrabold" : "font-semibold")}>{p.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{last.at}</span></div><div className={cn("truncate text-xs", last.from === "them" ? "text-foreground" : "text-muted-foreground")}>{last.from === "me" && "You: "}{last.text}</div></div>
              {last.from === "them" && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
            </Link></Button>); })}
          <div className="flex items-center gap-2 border-t border-border px-4 pt-4 text-xs font-bold text-muted-foreground">Suggested <DemoTag /></div>
          {DEMO_PEOPLE.filter(p => (tab === "chats" ? p.kind === "coach" || p.kind === "scout" : p.kind === "athlete") && p.name.toLowerCase().includes(query.toLowerCase())).slice(0,5).map(p => <DemoConnection key={p.id} p={p}/>)}
        </div>
      </aside>
      <section className={cn("min-w-0 flex-1", !other && "hidden md:block")}>
        {other?.startsWith("d-") ? <DemoThread key={other} id={other}/> : other ? <Thread me={me} other={other} person={people[other]} msgs={msgs.filter((m) => (m.sender_id === other && m.recipient_id === me) || (m.sender_id === me && m.recipient_id === other))} onSent={(m) => setMsgs((x) => [...x, m])} onRead={(ids) => setMsgs((x) => x.map((m) => (ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m)))} />
          : <div className="grid h-full place-items-center text-center text-muted-foreground"><div><MessageCircle className="mx-auto mb-2 h-10 w-10 text-primary" />Select a conversation</div></div>}
      </section>
    </div>
  );
}

function Thread({ me, other, person, msgs, onSent, onRead }: { me: string; other: string; person?: Person | undefined; msgs: Msg[]; onSent: (m: Msg) => void; onRead: (ids: string[]) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);
  useEffect(() => { inputRef.current?.focus(); }, [other]);
  useEffect(() => {
    const unread = msgs.filter((m) => m.recipient_id === me && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    onRead(unread);
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {
      supabase.from("notifications").update({ read: true }).eq("user_id", me).eq("type", "message").eq("actor_id", other).then(() => {});
    });
  }, [msgs, me, other, onRead]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    const { data, error } = await supabase.from("messages").insert({ sender_id: me, recipient_id: other, body }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onSent(data); setText(""); inputRef.current?.focus();
  };
  const online = person?.show_activity && person.last_seen_at && Date.now() - new Date(person.last_seen_at).getTime() < 10 * 60_000;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border p-3">
        <Link to="/inbox" className="rounded-full p-1.5 hover:bg-secondary md:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/u/$id" params={{ id: other }} className="flex min-w-0 items-center gap-3">
          <span className="relative"><Avatar person={person} size={40} />{online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />}</span>
          <div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate font-bold">{displayName(person)}</span><RoleBadge role={person?.role ?? null} /></div><div className="text-xs text-muted-foreground">{online ? "Active now" : person?.sport ?? ""}</div></div>
        </Link>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Say hello to {displayName(person)} 👋</p>}
        {msgs.map((m, i) => {
          const mine = m.sender_id === me;
          const lastMine = mine && !msgs.slice(i + 1).some((x) => x.sender_id === me);
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div className={cn("max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>{m.body}</div>
              {lastMine && <span className="mt-0.5 text-[10px] text-muted-foreground">{m.read_at ? "Seen" : "Sent"} · {timeAgo(m.created_at)}</span>}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={4000}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
        <Button type="submit" disabled={busy || !text.trim()} className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-50" aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
