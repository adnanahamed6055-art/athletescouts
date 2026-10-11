import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Calendar, MapPin, Star, Trophy, Users, Heart, Bookmark, Clapperboard, Send, Check, Plus, ChevronLeft, ChevronRight, Pause, Play, X, MessageCircle } from "lucide-react";
import { DEMO_CHATS, DEMO_POSTS, DEMO_KIND_LABEL, demoPerson, type DemoChatLine, initials, type DemoClub, type DemoPerson, type DemoPost, type DemoTournament } from "@/data/demo";
import { VerificationPill } from "@/components/app/VerificationPill";
import { EnrollButton } from "@/components/app/EnrollButton";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DemoComments, demoCommentCount, shareLink } from "@/components/app/Social";

/** Screen-reader-only marker for showcase content (kept accessible, not shown visually). */
export function DemoTag(_: { className?: string }) {
  return <span className="sr-only">Showcase profile</span>;
}

export function DemoAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.36 }} className="grid shrink-0 place-items-center rounded-full bg-gradient-neon font-display font-bold text-primary-foreground">
      {initials(name)}
    </span>
  );
}

export function DemoPersonCard({ p }: { p: DemoPerson }) {
  const [following, setFollowing] = useState(false);
  return <article className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
    <Link to="/people/$id" params={{ id: p.id }} className="relative block aspect-[4/3] overflow-hidden bg-secondary"><img src={p.image} alt={p.name} width={384} height={384} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" /><span className="absolute left-2 top-2 rounded bg-media-overlay px-2 py-1 text-[10px] font-bold uppercase text-media-foreground">{DEMO_KIND_LABEL[p.kind]}</span><DemoTag className="absolute right-2 top-2 bg-media-overlay" /></Link>
    <div className="min-w-0 space-y-2 p-3">{p.verified && <VerificationPill label={p.verifiedSchool ? "School verified" : "Verified coach"} />}<h3 className="break-words font-display text-xl font-bold leading-tight"><Link to="/people/$id" params={{ id: p.id }} className="hover:underline">{p.name}</Link></h3><div className="text-xs font-semibold text-primary">{p.sport}{p.position ? ` · ${p.position}` : ""}</div><p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{p.headline}</p><div className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{p.location}</div><div className="grid grid-cols-1 items-center gap-2 border-t border-border pt-2 sm:grid-cols-[minmax(0,1fr)_auto]"><span className="text-xs text-muted-foreground">{p.followers.toLocaleString()} followers</span><Button size="sm" variant={following ? "secondary" : "outline"} aria-pressed={following} onClick={() => setFollowing(!following)}>{following ? <Check /> : <Plus />}{following ? "Following" : "Follow"}</Button></div></div>
  </article>;
}

export function DemoClubCard({ c }: { c: DemoClub }) {
  const [open, setOpen] = useState(false);
  return <><article className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"><div className="relative aspect-[16/9] overflow-hidden"><img src={c.image} alt={`${c.name} illustrative training venue`} width={768} height={432} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded bg-media-overlay px-2 py-1 text-xs font-bold text-media-foreground">{c.sports.join(" · ")}</span><DemoTag className="absolute right-3 top-3 bg-media-overlay" /></div><div className="space-y-3 p-4"><h3 className="font-display text-2xl font-bold"><Link to="/club/$id" params={{ id: c.id }} className="hover:underline">{c.name}</Link></h3><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{c.location}</div><p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{c.blurb}</p><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-3"><span className="text-xs text-muted-foreground">{c.level}</span><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link to="/club/$id" params={{ id: c.id }}>View<ChevronRight /></Link></Button><EnrollButton type="trial" id={c.id} name={c.name} /></div></div></div></article><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle className="font-display text-3xl">{c.name}</DialogTitle><DialogDescription>{c.unofficial ? "Unofficial club showcase — not affiliated with or managed by this club. " : ""}Photography is illustrative.</DialogDescription><img src={c.image} alt="Illustrative sports venue" width={768} height={432} className="aspect-video w-full rounded-md object-cover" /><p>{c.blurb}</p><div className="text-sm text-muted-foreground">{c.location} · {c.sports.join(" / ")} · {c.level}</div><EnrollButton type="trial" id={c.id} name={c.name} size="default" className="w-full" /></DialogContent></Dialog></>;
}

export function DemoTournamentCard({ t }: { t: DemoTournament }) {
  const [open, setOpen] = useState(false);
  return <><article className="group overflow-hidden rounded-lg border border-border bg-card"><div className="relative aspect-[16/9] overflow-hidden"><img src={t.image} alt={`${t.sport} tournament illustration`} width={768} height={432} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute bottom-3 left-3 rounded bg-media-overlay px-2 py-1 text-xs font-bold text-media-foreground">{t.sport} · {t.ageGroup}</span><DemoTag className="absolute right-3 top-3 bg-media-overlay" /></div><div className="space-y-3 p-4"><h3 className="font-display text-2xl font-bold leading-tight">{t.name}</h3><div className="flex items-center gap-2 text-xs text-primary"><Calendar className="h-3.5 w-3.5" />{t.dates}</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{t.location}</div><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-3"><span className="text-xs font-semibold">{t.format}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setOpen(true)}>Details<ChevronRight /></Button><EnrollButton type="tournament" id={t.id} name={t.name} /></div></div></div></article><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle className="font-display text-3xl">{t.name}</DialogTitle><DialogDescription>{t.sport} · {t.ageGroup}</DialogDescription><img src={t.image} alt={`${t.sport} illustration`} width={768} height={432} className="aspect-video w-full rounded-md object-cover" /><div className="space-y-2 text-sm"><p>{t.dates} · {t.location}</p><p>{t.ageGroup} · {t.format} · {t.teams || "Individual"} teams / entries</p><p>Entry: {t.fee} · Deadline: {t.deadline}</p></div><EnrollButton type="tournament" id={t.id} name={t.name} size="default" className="w-full" /></DialogContent></Dialog></>;
}

export function DemoPostCard({ post }: { post: DemoPost }) {
  const a = demoPerson(post.authorId);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(() => demoCommentCount(post.id));
  if (!a) return null;
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card" aria-label={`Post by ${a.name}`}>
      <header className="flex items-center gap-3 p-4">
        <Link to="/people/$id" params={{ id: a.id }} className="shrink-0">{a.image ? <img src={a.image} alt="" className="h-[38px] w-[38px] rounded-full object-cover object-top" /> : <DemoAvatar name={a.name} size={38} />}</Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5"><Link to="/people/$id" params={{ id: a.id }} className="font-bold text-sm hover:underline">{a.name}</Link>{a.verified && <BadgeCheck className="h-4 w-4 text-primary" />}<DemoTag /></div>
          <div className="truncate text-xs text-muted-foreground">{a.location} · {post.ago}</div>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-primary" onClick={() => setFollowing(!following)} aria-label={following ? `Unfollow ${a.name} demo` : `Follow ${a.name} demo`}>{following ? <Check /> : <Plus />}{following ? "Following" : "Follow"}</Button>
      </header>
      {post.image && <div className="relative bg-background" onDoubleClick={() => setLiked(true)}>
        {post.video ? <video poster={post.image} src={post.video} controls playsInline loop muted preload="metadata" className="aspect-[4/5] max-h-[640px] w-full object-cover" /> : <img src={post.image} alt={post.alt ?? "Demo sports training"} width={1024} height={1280} loading="lazy" className="aspect-[4/5] max-h-[640px] w-full object-cover" />}
        {post.video && <span className="absolute left-3 top-3 flex items-center gap-1 rounded bg-media-overlay px-2 py-1 text-xs font-bold text-media-foreground"><Clapperboard className="h-3.5 w-3.5" />Reel</span>}
        {post.highlight && <span className="absolute right-3 top-3 flex items-center gap-1 rounded bg-media-overlay px-2 py-1 text-xs font-bold text-media-foreground"><Star className="h-3.5 w-3.5" />Highlight</span>}
      </div>}
      <footer className="flex items-center gap-1 px-2 pt-2">
        <Button variant="ghost" size="icon" aria-label={liked ? "Unlike demo post" : "Like demo post"} aria-pressed={liked} onClick={() => setLiked(!liked)} className={liked ? "text-like" : "text-foreground"}><Heart className={cn("!h-6 !w-6", liked && "fill-current")} /></Button>
        <Button variant="ghost" size="icon" aria-label="Comments" onClick={() => setCommentsOpen(true)}><MessageCircle className="!h-6 !w-6" /></Button>
        <Button variant="ghost" size="icon" aria-label="Share" onClick={() => shareLink(`/people/${a.id}`, `${a.name} on AthleteScouts`)}><Send className="!h-5 !w-5" /></Button>
        <Button variant="ghost" size="icon" className="ml-auto" aria-label={saved ? "Unsave post" : "Save post"} aria-pressed={saved} onClick={() => setSaved(!saved)}><Bookmark className={cn("!h-5 !w-5", saved && "fill-current text-primary")} /></Button>
      </footer>
      <div className="px-4 pb-4"><div className="mb-1 text-sm font-bold">{post.likes + Number(liked)} likes</div><p className="whitespace-pre-line text-sm leading-relaxed"><span className="mr-1 font-bold">{a.name}</span>{post.body.split(/(\s+)/).map((w, i) => w.startsWith("#") ? <span key={i} className="text-primary">{w}</span> : w)}</p><button type="button" onClick={() => setCommentsOpen(true)} className="mt-1 text-sm text-muted-foreground">View all {comments} comments</button></div>
      <DemoComments postId={post.id} open={commentsOpen} onOpenChange={setCommentsOpen} onCount={setComments} />
    </article>
  );
}

const STORY_POSTS = DEMO_POSTS.filter((p) => p.image);

export function DemoStories() {
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  return <section aria-label="Community stories">
    <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">Stories</h2><DemoTag /></div>
    <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
      {STORY_POSTS.map((post, i) => {
        const person = demoPerson(post.authorId);
        if (!person) return null;
        return <Button key={post.id} variant="ghost" className="h-auto w-16 shrink-0 flex-col gap-1.5 p-0 hover:bg-transparent" aria-label={`Watch ${person.name}'s demo story`} onClick={() => { setActive(i); setSeen((s) => new Set([...s, post.id])); }}>
          <span className={cn("block rounded-full p-[2.5px]", seen.has(post.id) ? "bg-border" : "bg-gradient-neon")}><img src={post.image} alt="" className="h-14 w-14 rounded-full border-2 border-background object-cover" /></span>
          <span className="w-full truncate text-center text-xs font-medium">{person.name.split(" ")[0]}</span>
        </Button>;
      })}
    </div>
    <DemoMediaViewer posts={STORY_POSTS} active={active} onActive={(i) => {setActive(i); const p = i === null ? null : STORY_POSTS[i]; if (p) setSeen((s) => new Set([...s, p.id]));}} mode="story" />
  </section>;
}

export function DemoReels() {
  const posts = DEMO_POSTS.filter((p) => p.video);
  const [active, setActive] = useState<number | null>(null);
  return <section className="space-y-3" aria-label="Demo reels">
    <div className="flex items-center gap-2"><h2 className="text-sm font-bold">Around the track</h2><DemoTag /></div>
    <div className="grid grid-cols-2 gap-3">{posts.map((post, i) => <Button key={post.id} variant="ghost" className="relative h-auto overflow-hidden rounded-lg p-0" aria-label={`Watch ${demoPerson(post.authorId)?.name}'s demo reel`} onClick={() => setActive(i)}>
      <img src={post.image} alt={post.alt} className="aspect-[9/16] w-full object-cover" />
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-media-overlay p-3 text-media-foreground"><Play className="h-4 w-4 fill-current" /><span className="truncate text-sm font-bold">{demoPerson(post.authorId)?.name}</span></span>
    </Button>)}</div>
    <DemoMediaViewer posts={posts} active={active} onActive={setActive} mode="reel" />
  </section>;
}

function DemoMediaViewer({ posts, active, onActive, mode }: { posts: DemoPost[]; active: number | null; onActive: (i: number | null) => void; mode: "story" | "reel" }) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const post = active === null ? undefined : posts[active];
  const person = post ? demoPerson(post.authorId) : undefined;
  const move = (direction: number) => {
    if (active === null) return;
    const next = active + direction;
    if (next >= posts.length) onActive(null);
    else if (next >= 0) onActive(next);
  };
  useEffect(() => {setProgress(0); setPaused(false);}, [active]);
  useEffect(() => {
    if (active === null || paused || mode !== "story") return;
    const timer = window.setInterval(() => setProgress((n) => Math.min(100, n + 2)), 100);
    return () => window.clearInterval(timer);
  }, [active, paused, mode]);
  useEffect(() => {
    if (progress < 100 || active === null) return;
    onActive(active + 1 < posts.length ? active + 1 : null);
  }, [progress, active, posts.length, onActive]);
  const toggle = (values: Set<string>, id: string) => {const next = new Set(values); if (next.has(id)) next.delete(id); else next.add(id); return next;};
  return <Dialog open={active !== null} onOpenChange={(open) => {if (!open) onActive(null);}}>
    <DialogContent className="h-[min(850px,100dvh)] w-full max-w-[480px] rounded-none sm:rounded-lg gap-0 overflow-hidden border-0 bg-background p-0 [&>button]:hidden" onKeyDown={(e) => {if (e.key === "ArrowRight" || e.key === "ArrowDown") {e.preventDefault();move(1);} if (e.key === "ArrowLeft" || e.key === "ArrowUp") {e.preventDefault();move(-1);}}}>
      <DialogTitle className="sr-only">{person?.name} — demo {mode}</DialogTitle><DialogDescription className="sr-only">Fictional community {mode}</DialogDescription>
      {post && person && <div className="relative h-full min-h-0 touch-none" onTouchStart={(e) => {e.currentTarget.dataset['swipeY'] = String((mode === "story" ? e.touches[0]?.clientX : e.touches[0]?.clientY) ?? 0);}} onTouchEnd={(e) => {const delta = Number(e.currentTarget.dataset['swipeY']) - ((mode === "story" ? e.changedTouches[0]?.clientX : e.changedTouches[0]?.clientY) ?? 0); if (Math.abs(delta) > 60) move(delta > 0 ? 1 : -1);}}>
        {mode === "reel" && post.video ? <video key={post.id} src={post.video} poster={post.image} autoPlay muted playsInline loop controls className="h-full w-full object-contain" /> : <img src={post.image} alt={post.alt} className="h-full w-full object-cover" />}
        <div className="absolute inset-x-0 top-0 bg-media-overlay px-3 pb-3 pt-2 text-media-foreground">
          {mode === "story" && <div className="mb-3 grid gap-1" style={{gridTemplateColumns: `repeat(${posts.length}, minmax(0, 1fr))`}}>{posts.map((p, i) => <progress key={p.id} max={100} value={i < (active ?? 0) ? 100 : i === active ? progress : 0} className="story-progress h-1 w-full" />)}</div>}
          <div className="flex items-center gap-2"><DemoAvatar name={person.name} size={32} /><Link to="/people/$id" params={{ id: person.id }} className="min-w-0 flex-1 truncate text-sm font-bold hover:underline">{person.name}</Link><DemoTag />
            {mode === "story" && <Button variant="ghost" size="icon" className="text-media-foreground" aria-label={paused ? "Resume story" : "Pause story"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>}
            <Button variant="ghost" size="icon" className="text-media-foreground" aria-label="Close viewer" onClick={() => onActive(null)}><X /></Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 bg-media-overlay text-media-foreground" aria-label="Previous" disabled={active === 0} onClick={() => move(-1)}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 bg-media-overlay text-media-foreground" aria-label="Next" onClick={() => move(1)}><ChevronRight /></Button>
        <div className="absolute inset-x-0 bottom-14 space-y-2 bg-media-overlay p-4 text-media-foreground">
          <div className="flex items-center gap-2"><span className="flex-1 text-sm font-bold">{person.sport}</span><Button variant="ghost" size="sm" className="text-media-foreground" aria-pressed={following.has(person.id)} onClick={() => setFollowing(toggle(following, person.id))}>{following.has(person.id) ? <Check /> : <Plus />}{following.has(person.id) ? "Following" : "Follow"}</Button><Button variant="ghost" size="icon" aria-label="Like demo media" aria-pressed={liked.has(post.id)} className={liked.has(post.id) ? "text-like" : "text-media-foreground"} onClick={() => setLiked(toggle(liked, post.id))}><Heart className={liked.has(post.id) ? "fill-current" : ""} /></Button><Button variant="ghost" size="icon" aria-label="Share" className="text-media-foreground" onClick={() => shareLink(`/people/${person.id}`, person.name)}><Send /></Button></div>
          <p className="line-clamp-3 text-sm">{post.body}</p>
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}

export function DemoConnection({ p, onSelect }: { p: DemoPerson; onSelect?: () => void }) {
  return <Button asChild variant="ghost" className="h-auto w-full justify-start gap-3 py-3" onClick={onSelect}><Link to="/inbox" search={{ with: p.id }}><DemoAvatar name={p.name} size={38} /><span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold">{p.name}</span><span className="block text-xs text-muted-foreground">{p.sport} · {DEMO_KIND_LABEL[p.kind]}</span></span><DemoTag /></Link></Button>;
}

export function DemoThread({ id }: { id: string }) {
  const p = demoPerson(id);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<DemoChatLine[]>(() => DEMO_CHATS[id] ?? [{ from: "them", text: `Hey! Great to connect. How is your ${p?.sport.toLowerCase() ?? ""} training going?`, at: "Today" }]);
  if (!p) return null;
  return <div className="flex h-full flex-col">
    <header className="flex items-center gap-3 border-b border-border p-4"><Button asChild variant="ghost" size="sm" className="md:hidden"><Link to="/inbox">Back</Link></Button><Link to="/people/$id" params={{ id: p.id }} className="flex min-w-0 flex-1 items-center gap-3"><img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top" /><span className="min-w-0"><span className="block truncate font-bold">{p.name}</span><span className="block text-xs text-muted-foreground">{DEMO_KIND_LABEL[p.kind]} · {p.sport}</span></span></Link></header>
    <div className="flex-1 space-y-2 overflow-y-auto p-4">{messages.map((m, i) => <div key={i} className={cn("max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm", m.from === "me" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary")}>{m.text}<span className="mt-0.5 block text-[10px] opacity-70">{m.at}</span></div>)}</div>
    <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { setMessages([...messages, { from: "me", text: text.trim(), at: "now" }]); setText(""); } }}><input aria-label="Message" placeholder="Message…" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm" /><Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send message"><Send /></Button></form>
  </div>;
}
