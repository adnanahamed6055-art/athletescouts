import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, MessageCircle, MoreHorizontal, Star, Trash2, Heart, Clapperboard, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { Avatar, RoleBadge, displayName, timeAgo, useMediaUrl, type Person } from "@/lib/social";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/app/FollowButton";
import { cn } from "@/lib/utils";
import { RealComments, shareLink } from "@/components/app/Social";

export type FeedPost = Tables<"posts"> & { likes: number; liked: boolean; saved: boolean };

function Body({ text }: { text: string }) {
  return <>{text.split(/(\s+)/).map((w, i) => w.startsWith("#") ? <span key={i} className="font-semibold text-primary">{w}</span> : w)}</>;
}

export function PostCard({ post, author, me, onDeleted }: { post: FeedPost; author?: Person | undefined; me: string; onDeleted?: ((id: string) => void) | undefined }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);
  const [burst, setBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const media = useMediaUrl(post.media_url);
  const navigate = useNavigate();

  const like = async () => {
    const next = !liked;
    setLiked(next); setLikes((n) => n + (next ? 1 : -1));
    if (next) { setBurst(true); setTimeout(() => setBurst(false), 500); }
    const { error } = next
      ? await supabase.from("post_likes").insert({ post_id: post.id, user_id: me })
      : await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me);
    if (error) { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); toast.error(error.message); }
  };
  const save = async () => {
    const next = !saved; setSaved(next);
    const { error } = next
      ? await supabase.from("post_saves").insert({ post_id: post.id, user_id: me })
      : await supabase.from("post_saves").delete().eq("post_id", post.id).eq("user_id", me);
    if (error) { setSaved(!next); toast.error(error.message); } else if (next) toast.success("Saved");
  };
  const remove = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message); else { toast.success("Post deleted"); onDeleted?.(post.id); }
  };

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/30">
      <header className="flex items-center gap-3 p-4">
        <Link to="/u/$id" params={{ id: post.author_id }}><Avatar person={author} size={42} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to="/u/$id" params={{ id: post.author_id }} className="truncate font-bold hover:text-primary">{displayName(author)}</Link>
            <VerifiedBadge userId={post.author_id} />
            <RoleBadge role={author?.role ?? null} />
            {post.is_highlight && <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase text-gold"><Star className="h-3 w-3 fill-current" />Highlight</span>}
          </div>
          <div className="truncate text-xs text-muted-foreground">{[author?.sport, author?.location || author?.region].filter(Boolean).join(" · ")}{author?.sport || author?.location ? " · " : ""}{timeAgo(post.created_at)}</div>
        </div>
        <FollowButton me={me} id={post.author_id} size="xs" />
        {post.author_id === me && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-1.5 hover:bg-secondary" aria-label="Post options"><MoreHorizontal className="h-5 w-5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onClick={remove} className="text-destructive"><Trash2 className="h-4 w-4" />Delete post</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {post.body && <p className="whitespace-pre-line px-4 pb-3 text-[15px] leading-relaxed"><Body text={post.body} /></p>}
      {post.media_url && (
        <div className="relative bg-background" onDoubleClick={() => !liked && like()}>
          {post.media_type === "video" && <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded bg-media-overlay px-2 py-1 text-xs text-media-foreground"><Clapperboard className="h-3 w-3" />Reel</span>}
          {!media ? <div className="aspect-[4/3] animate-pulse bg-muted" />
            : post.media_type === "video" ? <video src={media} controls playsInline loop className="max-h-[640px] aspect-[4/5] w-full object-cover bg-background" />
            : <img src={media} alt="" className="max-h-[640px] w-full object-cover" loading="lazy" />}
        </div>
      )}
      <footer className="flex items-center gap-1 px-2 py-2">
        <Button variant="ghost" type="button" onClick={like} aria-label={liked ? "Unlike post" : "Like post"} aria-pressed={liked} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary", liked ? "text-like" : "text-muted-foreground")}>
          <Heart className={cn("h-5 w-5 transition-transform", liked && "fill-current", burst && "scale-150")} />{likes > 0 && likes}
        </Button>
        <Button variant="ghost" type="button" onClick={() => setCommentsOpen(true)} aria-label="Comments" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
          <MessageCircle className="h-5 w-5" />{commentCount ? commentCount : ""}
        </Button>
        <Button variant="ghost" type="button" onClick={() => shareLink(`/u/${post.author_id}`, "AthleteScouts post")} aria-label="Share" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Send className="h-5 w-5" />
        </Button>
        {post.author_id !== me && (
          <Button variant="ghost" type="button" onClick={() => navigate({ to: "/inbox", search: { with: post.author_id } })} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
            Message
          </Button>
        )}
        <Button variant="ghost" type="button" onClick={save} className={cn("ml-auto rounded-full p-2 hover:bg-secondary", saved ? "text-primary" : "text-muted-foreground")} aria-label="Save" aria-pressed={saved}>
          <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
        </Button>
      </footer>
      <RealComments postId={post.id} me={me} open={commentsOpen} onOpenChange={setCommentsOpen} onCount={setCommentCount} />
    </article>
  );
}

/** Loads posts with like/save state for the current user. */
export async function hydratePosts(rows: Tables<"posts">[], me: string): Promise<FeedPost[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from("post_likes").select("post_id, user_id").in("post_id", ids),
    supabase.from("post_saves").select("post_id").eq("user_id", me).in("post_id", ids),
  ]);
  const savedSet = new Set((saves ?? []).map((s) => s.post_id));
  return rows.map((r) => {
    const l = (likes ?? []).filter((x) => x.post_id === r.id);
    return { ...r, likes: l.length, liked: l.some((x) => x.user_id === me), saved: savedSet.has(r.id) };
  });
}
