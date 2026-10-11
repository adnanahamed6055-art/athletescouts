import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, Loader2, Lock, Ruler, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { RoleBadge, loadPeople, uploadMedia, useMediaUrl, type Person } from "@/lib/social";
import { ProfileHeader } from "@/components/app/ProfileHeader";
import { AthleteBadgePill } from "@/components/app/VerifiedBadge";
import { PostCard, hydratePosts, type FeedPost } from "@/components/app/PostCard";
import { useFollows } from "@/hooks/useFollows";
import { METRICS, ageFrom, toEmbedUrl } from "@/data/platform";
import { cn } from "@/lib/utils";

type Tab = "posts" | "highlights" | "passport" | "saved";
export const Route = createFileRoute("/_authenticated/u/$id")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (["posts", "highlights", "passport", "saved"].includes(s["tab"] as string) ? { tab: s["tab"] as Tab } : {}),
  head: () => ({ meta: [{ title: "Profile — AthleteScouts" }, { name: "description", content: "Athlete, coach, club and scout profiles on AthleteScouts." }, { property: "og:title", content: "Profile — AthleteScouts" }, { property: "og:description", content: "Athlete, coach, club and scout profiles on AthleteScouts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const { id } = Route.useParams();
  const { tab = "posts" } = Route.useSearch();
  const navigate = useNavigate();
  const isMe = id === me;
  const { following, toggle } = useFollows(me);
  const [person, setPerson] = useState<Person | null>(null);
  const [counts, setCounts] = useState({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [saved, setSaved] = useState<FeedPost[]>([]);
  const [savedAuthors, setSavedAuthors] = useState<Record<string, Person>>({});
  const [stats, setStats] = useState<Tables<"athlete_stats">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const [ppl, { count: fr }, { count: fg }, { data: ps, count: pc }, { data: st }] = await Promise.all([
        loadPeople([id]),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
        supabase.from("posts").select("*", { count: "exact" }).eq("author_id", id).order("created_at", { ascending: false }).limit(60),
        supabase.from("athlete_stats").select("*").eq("user_id", id).order("recorded_on"),
      ]);
      setPerson(ppl[id] ?? null);
      setCounts({ posts: pc ?? 0, followers: fr ?? 0, following: fg ?? 0 });
      setPosts(await hydratePosts(ps ?? [], me));
      setStats(st ?? []);
      setLoading(false);
    })();
  }, [id, me]);

  // keep follower count in step with the Follow button
  const prevFollow = useRef<boolean | null>(null);
  useEffect(() => {
    const now = following.has(id);
    if (prevFollow.current !== null && prevFollow.current !== now) setCounts((c) => ({ ...c, followers: c.followers + (now ? 1 : -1) }));
    prevFollow.current = now;
  }, [following, id]);

  useEffect(() => {
    if (tab !== "saved" || !isMe) return;
    supabase.from("post_saves").select("post_id").eq("user_id", me).order("created_at", { ascending: false }).then(async ({ data }) => {
      const ids = (data ?? []).map((d) => d.post_id);
      if (!ids.length) { setSaved([]); return; }
      const { data: ps } = await supabase.from("posts").select("*").in("id", ids);
      const h = await hydratePosts(ps ?? [], me);
      setSaved(h); setSavedAuthors(await loadPeople(h.map((p) => p.author_id)));
    });
  }, [tab, isMe, me]);

  const avatarUrl = useMediaUrl(person?.avatar_url);
  const coverUrl = useMediaUrl(person?.cover_url);

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!person) return <div className="py-24 text-center text-muted-foreground">This member doesn't exist.</div>;

  const locked = person.is_private && !isMe && !following.has(id);
  const age = ageFrom(person.dob);
  const isAthlete = person.role === "athlete";
  const tabs: Tab[] = ["posts", "highlights", ...(isAthlete ? (["passport"] as Tab[]) : []), ...(isMe ? (["saved"] as Tab[]) : [])];
  const setTab = (t: Tab) => navigate({ to: "/u/$id", params: { id }, search: { tab: t }, replace: true });
  const highlights = posts.filter((p) => p.is_highlight);

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-5">
      <ProfileHeader
        name={person.full_name || person.org_name}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        roleLabel={<><RoleBadge role={person.role} />{person.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}</>}
        sport={person.sport}
        position={person.position}
        extraLine={age != null ? `Age ${age}` : null}
        bio={person.bio}
        location={person.location || person.region}
        posts={counts.posts}
        followers={counts.followers}
        following={counts.following}
        isMe={isMe}
        isFollowing={following.has(id)}
        onFollow={() => toggle(id)}
        onMessage={() => navigate({ to: "/inbox", search: { with: id } })}
        badge={<><AthleteBadgePill userId={person.id} /><VerifiedBadge userId={person.id} label /></>}
        chips={<>
          {person.username && <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">@{person.username}</span>}
          {[person.school, person.height_cm ? `${person.height_cm} cm` : null].filter(Boolean).map((t) => <span key={t} className="rounded-full border border-border px-2.5 py-1">{t}</span>)}
          {person.scouting_categories.map((s) => <span key={s} className="rounded-full border border-primary/40 px-2.5 py-1 text-primary">Scouting {s}</span>)}
        </>}
        coverAction={isMe ? <MediaButton person={person} field="cover_url" onChange={(v) => setPerson({ ...person, cover_url: v })} /> : null}
        avatarAction={isMe ? <MediaButton person={person} field="avatar_url" onChange={(v) => setPerson({ ...person, avatar_url: v })} /> : null}
      />

      {locked ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><div className="font-display text-xl font-bold uppercase">This account is private</div><p className="text-sm text-muted-foreground">Follow to see their posts.</p></div>
      ) : (
        <>
          <div className="flex gap-1 rounded-full border border-border bg-card p-1">
            {tabs.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("flex-1 rounded-full py-2 text-sm font-bold capitalize transition-all", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{t}</button>)}
          </div>
          {tab === "posts" && (posts.length ? posts.map((p) => <PostCard key={p.id} post={p} author={person} me={me} onDeleted={(pid) => setPosts((x) => x.filter((y) => y.id !== pid))} />) : <Empty text={isMe ? "Share your first post from the Feed." : "No posts yet."} />)}
          {tab === "highlights" && (
            <>
              {person.video_links.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {person.video_links.map((l, i) => { const src = toEmbedUrl(l); return src ? <iframe key={l + i} src={src} title={`Reel ${i + 1}`} className="aspect-video w-full rounded-xl border border-border" allowFullScreen loading="lazy" /> : null; })}
                </div>
              )}
              {highlights.length ? highlights.map((p) => <PostCard key={p.id} post={p} author={person} me={me} />) : person.video_links.length === 0 && <Empty text="No highlights pinned yet." icon={<Star className="mx-auto mb-2 h-8 w-8 text-gold" />} />}
            </>
          )}
          {tab === "passport" && <PassportSummary stats={stats} isMe={isMe} />}
          {tab === "saved" && (saved.length ? saved.map((p) => <PostCard key={p.id} post={p} author={savedAuthors[p.author_id]} me={me} />) : <Empty text="Posts you save will appear here." />)}
        </>
      )}
    </div>
  );
}

function Empty({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{icon}{text}</div>;
}

function PassportSummary({ stats, isMe }: { stats: Tables<"athlete_stats">[]; isMe: boolean }) {
  const latest = METRICS.map((m) => {
    const s = stats.filter((x) => x.metric === m.id);
    return { m, last: s.at(-1), first: s[0], n: s.length };
  }).filter((x) => x.last);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-card p-4">
        <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /><span className="font-display text-lg font-bold uppercase">Opportunity Passport</span></div>
        {isMe && <Button asChild size="sm" variant="outline"><Link to="/passport"><Ruler className="h-4 w-4" />Log results</Link></Button>}
      </div>
      {latest.length === 0 ? <Empty text={isMe ? "Log your first performance result." : "No performance data yet."} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {latest.map(({ m, last, first, n }) => {
            if (!last) return null;
            const d = n > 1 && first ? Number(last.value) - Number(first.value) : 0;
            const good = m.lowerIsBetter ? d < 0 : d > 0;
            return (
              <div key={m.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="break-words font-display text-3xl font-extrabold">{Number(last.value)}<span className="ml-1 text-sm text-muted-foreground">{m.unit}</span></div>
                {n > 1 && <div className={cn("text-xs font-bold", good ? "text-primary" : "text-destructive")}>{d > 0 ? "+" : ""}{d.toFixed(2).replace(/\.?0+$/, "")} over {n} entries</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MediaButton({ person, field, onChange }: { person: Person; field: "cover_url" | "avatar_url"; onChange: (path: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const path = await uploadMedia(person.id, f);
      const { error } = await supabase.from("profiles").update(field === "cover_url" ? { cover_url: path } : { avatar_url: path }).eq("id", person.id);
      if (error) throw error;
      onChange(path);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); }
  };
  const cover = field === "cover_url";
  return <>
    <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    <button type="button" onClick={() => input.current?.click()} aria-label={cover ? "Change cover" : "Change photo"}
      className={cover ? "absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/70 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-background" : "absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{cover && "Cover"}
    </button>
  </>;
}
