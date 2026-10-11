import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Pause, Play, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { DEMO_POSTS, demoPerson, type DemoPost } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoComments, demoCommentCount, shareLink } from "@/components/app/Social";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reels")({
  head: () => ({ meta: [{ title: "Reels — AthleteScouts" }, { name: "description", content: "Swipe through short training clips and highlights from athletes, coaches and clubs." }, { property: "og:title", content: "Reels — AthleteScouts" }, { property: "og:description", content: "Swipe through short training clips and highlights from athletes, coaches and clubs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ReelsPage,
});

function ReelsPage() {
  // Clips first, then photo reels (animated), so the feed opens on motion.
  // Small square thumbnails (d-post-x*) are excluded: they would be upscaled and blurry in a full 9:16 reel.
  const reels = [...DEMO_POSTS.filter((p) => p.video), ...DEMO_POSTS.filter((p) => !p.video && p.image && !p.id.startsWith("d-post-x"))];
  return (
    <div className="-mx-3 -mt-4 sm:mx-auto sm:mt-0 sm:max-w-[440px]">
      <div className="scrollbar-none h-[calc(100dvh-8.5rem-env(safe-area-inset-bottom))] snap-y snap-mandatory overflow-y-auto sm:rounded-lg md:h-[calc(100dvh-6rem)]">
        {reels.map((p) => <Reel key={p.id} post={p} />)}
      </div>
    </div>
  );
}

function Reel({ post }: { post: DemoPost }) {
  const ref = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(() => demoCommentCount(post.id));
  const [failed, setFailed] = useState(false);
  const a = demoPerson(post.authorId);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e && e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (visible && !paused) void v.play().catch(() => undefined); else v.pause();
  }, [visible, paused]);

  const share = () => shareLink(`/people/${post.authorId}`, a?.name ?? "Reel");

  return (
    <div ref={ref} className="relative h-full w-full snap-start snap-always overflow-hidden bg-secondary sm:mx-auto sm:h-auto sm:max-h-full sm:aspect-[9/16] sm:rounded-2xl">
      <button type="button" aria-label={paused ? "Play" : "Pause"} className="absolute inset-0 h-full w-full" onClick={() => setPaused((x) => !x)} onDoubleClick={() => setLiked(true)}>
        {post.video
          ? <video ref={video} src={post.video} poster={post.image} muted={muted} loop playsInline preload="metadata" className="block h-full w-full object-cover object-center" />
          : failed
            ? <span className="grid h-full w-full place-items-center bg-gradient-neon font-display text-3xl font-extrabold uppercase text-media-foreground">{a?.sport ?? "Highlight"}</span>
            : <img src={post.image} alt={post.alt ?? ""} decoding="async" onError={() => setFailed(true)} className={cn("block h-full w-full object-cover object-center", visible && !paused && "reel-kenburns")} />}
      </button>
      {paused && <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-media-overlay text-media-foreground"><Play className="h-8 w-8 fill-current" /></span>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-media-overlay to-transparent" />

      {post.video && <Button size="icon" variant="ghost" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)} className="absolute right-3 top-3 rounded-full bg-media-overlay text-media-foreground hover:bg-media-overlay">{muted ? <VolumeX /> : <Volume2 />}</Button>}

      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-media-foreground">
        <button type="button" aria-pressed={liked} aria-label="Like" onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-1 text-xs font-semibold"><Heart className={cn("h-7 w-7", liked && "fill-like text-like")} />{post.likes + Number(liked)}</button>
        <button type="button" aria-label="Comments" onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1 text-xs font-semibold"><MessageCircle className="h-7 w-7" />{comments}</button>
        <button type="button" aria-label="Share" onClick={share} className="flex flex-col items-center gap-1 text-xs font-semibold"><Send className="h-7 w-7" />Share</button>
        <button type="button" aria-pressed={saved} aria-label={saved ? "Unsave" : "Save"} onClick={() => setSaved((x) => !x)} className="flex flex-col items-center gap-1 text-xs font-semibold"><Bookmark className={cn("h-7 w-7", saved && "fill-current")} />Save</button>
        {post.video && (paused ? <Play className="h-5 w-5 opacity-70" /> : <Pause className="h-5 w-5 opacity-70" />)}
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 pr-16 text-media-foreground">
        <div className="flex items-center gap-2">
          {a?.image ? <img src={a.image} alt="" className="h-9 w-9 rounded-full border-2 border-media-foreground object-cover object-top" /> : <span className="h-9 w-9 rounded-full bg-gradient-neon" />}
          {a ? <Link to="/people/$id" params={{ id: a.id }} className="truncate text-sm font-bold hover:underline">{a.name}</Link> : null}{a?.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
          <Button size="sm" variant="outline" onClick={() => setFollowing((f) => !f)} className="h-7 rounded-md border-media-foreground bg-transparent px-3 text-xs text-media-foreground hover:bg-media-overlay hover:text-media-foreground">{following ? "Following" : "Follow"}</Button>
        </div>
        <p className="line-clamp-2 text-sm">{post.body}</p>
        <div className="text-xs opacity-80">{a?.sport} · {post.ago}</div>
      </div>
      <DemoComments postId={post.id} open={commentsOpen} onOpenChange={setCommentsOpen} onCount={setComments} />
    </div>
  );
}
