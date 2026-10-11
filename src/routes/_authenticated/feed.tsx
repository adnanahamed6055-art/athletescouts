import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X, LayoutGrid, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, displayName, loadPeople, uploadMedia, type Person } from "@/lib/social";
import { useFollows } from "@/hooks/useFollows";
import { PostCard, hydratePosts, type FeedPost } from "@/components/app/PostCard";
import { cn } from "@/lib/utils";
import { DEMO_POSTS } from "@/data/demo";
import { DemoPostCard, DemoTag, DemoStories } from "@/components/app/Demo";
import { GetVerifiedCard } from "@/components/app/AthleteVerification";
import { athleteCompletion } from "@/lib/verification-rules";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Feed & Reels — AthleteScouts" }, { name: "description", content: "Training photos, reels and highlights from your AthleteScouts community." }, { property: "og:title", content: "Feed & Reels — AthleteScouts" }, { property: "og:description", content: "Follow athletes and explore sports highlights." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Feed,
});

const PAGE = 15;

function Feed() {
  const { user } = Route.useRouteContext();
  const me = user.id;
  const { following } = useFollows(me);
  const [tab, setTab] = useState<"all" | "following">("all");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [spotlight, setSpotlight] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);

  const load = useCallback(async (reset: boolean) => {
    setLoading(true);
    let q = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(PAGE);
    if (tab === "following") q = q.in("author_id", [...following, me]);
    const last = reset ? null : posts.at(-1);
    if (last) q = q.lt("created_at", last.created_at);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = await hydratePosts(data, me);
    const ppl = await loadPeople(rows.map((r) => r.author_id));
    setPeople((p) => ({ ...p, ...ppl }));
    setPosts((p) => (reset ? rows : [...p, ...rows]));
    setMore(data.length === PAGE);
    setLoading(false);
  }, [tab, following, me, posts]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(true); }, [tab, tab === "following" ? following.size : 0]);

  useEffect(() => {
    supabase.from("posts").select("author_id").eq("is_highlight", true).order("created_at", { ascending: false }).limit(40).then(async ({ data }) => {
      const ids = [...new Set((data ?? []).map((d) => d.author_id))].slice(0, 12);
      const ppl = await loadPeople(ids);
      setSpotlight(ids.map((i) => ppl[i]).filter((p): p is Person => !!p));
    });
  }, []);

  return (
    <div className="mx-auto max-w-[560px] space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h1 className="min-w-0 font-display text-3xl font-bold uppercase">Your <span className="text-primary">Feed</span></h1><Button asChild variant="ghost" size="icon" aria-label="Messages"><Link to="/inbox"><MessageCircle className="h-5 w-5" /></Link></Button></div>
      <ProfileStatus me={me} />
      <DemoStories />
      {spotlight.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">Scout Spotlight</h2>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {spotlight.map((p) => (
              <Link key={p.id} to="/u/$id" params={{ id: p.id }} search={{ tab: "highlights" }} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <span className="rounded-full bg-gradient-to-tr from-gold to-primary p-[2px]"><span className="block rounded-full bg-background p-[2px]"><Avatar person={p} size={56} /></span></span>
                <span className="w-full truncate text-center text-[11px] font-medium">{displayName(p).split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Composer me={me} onPosted={(p) => { setPosts((x) => [p, ...x]); loadPeople([me]).then((pp) => setPeople((o) => ({ ...o, ...pp }))); }} />

      <div className="flex gap-1 border-b border-border p-1">
        {(["all", "following"] as const).map((t) => (
          <Button variant="ghost" key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={cn("flex-1 rounded-md py-2 text-sm font-bold transition-all", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "all" ? <><LayoutGrid />For you</> : "Following"}
          </Button>
        ))}
      </div>

      {posts.map((p) => <PostCard key={p.id} post={p} author={people[p.author_id]} me={me} onDeleted={(id) => setPosts((x) => x.filter((y) => y.id !== id))} />)}

      {loading && <div className="grid place-items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {!loading && posts.length === 0 && tab === "following" && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="font-display text-2xl font-bold uppercase">{tab === "following" ? "Your following feed is empty" : "Be the first to post"}</div>
          <p className="mt-1 text-sm text-muted-foreground">{tab === "following" ? "Follow athletes, coaches and clubs to see their posts here." : "Share a training session or a highlight above."}</p>
          {tab === "following" && <Button asChild className="mt-4"><Link to="/discover">Discover people</Link></Button>}
        </div>
      )}
      {!loading && more && posts.length > 0 && <Button variant="outline" className="w-full" onClick={() => load(false)}>Load more</Button>}

      {!loading && !more && tab === "all" && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Around the community <DemoTag />
          </div>
          {DEMO_POSTS.map((p) => <DemoPostCard key={p.id} post={p} />)}
        </section>
      )}
    </div>
  );
}

function Composer({ me, onPosted }: { me: string; onPosted: (p: FeedPost) => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mePerson, setMePerson] = useState<Person | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { loadPeople([me]).then((p) => setMePerson(p[me] ?? null)); }, [me]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast.error("Files must be under 50 MB"); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  };
  const submit = async () => {
    if (!text.trim() && !file) return;
    setBusy(true);
    try {
      const media_url = file ? await uploadMedia(me, file) : null;
      const { data, error } = await supabase.from("posts").insert({
        author_id: me, body: text.trim(), media_url, media_type: file?.type.startsWith("video") ? "video" : "image", is_highlight: highlight,
      }).select().single();
      if (error) throw error;
      onPosted({ ...data, likes: 0, liked: false, saved: false });
      setText(""); setFile(null); setPreview(null); setHighlight(false);
      toast.success("Posted!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post");
    } finally { setBusy(false); }
  };

  return (
    <div className="border-b border-border pb-4">
      <div className="flex gap-3">
        <Avatar person={mePerson} size={42} />
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a session, result or highlight… use #hashtags" className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-[15px] focus-visible:ring-0" />
      </div>
      {preview && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
          {file?.type.startsWith("video") ? <video src={preview} className="max-h-80 w-full" controls /> : <img src={preview} alt="" className="max-h-80 w-full object-cover" />}
          <Button variant="ghost" type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute right-2 top-2 rounded-full bg-background/80 p-1" aria-label="Remove"><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input ref={input} type="file" accept="image/*,video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="ghost" size="sm" onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4 text-primary" />Photo / video</Button>
        <Button variant="ghost" type="button" onClick={() => setHighlight((h) => !h)} className={cn("flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors", highlight ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground")}>
          <Star className={cn("h-4 w-4", highlight && "fill-current")} />Highlight
        </Button>
        <Button type="button" size="sm" className="ml-auto font-bold" disabled={busy || (!text.trim() && !file)} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Post</Button>
      </div>
    </div>
  );
}

function ProfileStatus({ me }: { me: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<{ athlete: boolean; percent: number; complete: boolean } | null>(null);
  useEffect(() => {
    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", me),
      supabase.from("profiles").select("avatar_url,full_name,dob,location,sport,position,school,bio,onboarded").eq("id", me).maybeSingle(),
    ]).then(([{ data: roles }, { data: p }]) => {
      const list = (roles ?? []).map((r) => r.role);
      if (list.length === 0) { navigate({ to: "/onboarding", replace: true }); return; }
      const athlete = list.includes("athlete");
      const c = athleteCompletion(p);
      if (athlete && !p?.onboarded && c.done <= 1) { navigate({ to: "/onboarding", replace: true }); return; }
      setState({ athlete, percent: c.percent, complete: c.complete });
    });
  }, [me, navigate]);
  if (!state?.athlete) return null;
  return (
    <div className="space-y-3">
      {!state.complete && (
        <Link to="/onboarding" className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-card px-4 py-3 text-sm hover:border-gold">
          <span className="min-w-0"><span className="font-semibold">Profile incomplete</span> <span className="text-muted-foreground">· {state.percent}% done — finish it so scouts can find you.</span></span>
          <span className="shrink-0 font-semibold text-gold">Continue</span>
        </Link>
      )}
      <GetVerifiedCard me={me} />
    </div>
  );
}
