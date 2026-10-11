import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, MessageCircle, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLACEHOLDER } from "@/lib/verification-rules";
import { cn } from "@/lib/utils";

export type ProfileHeaderProps = {
  name?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  coverUrl?: string | null | undefined;
  roleLabel?: ReactNode;
  sport?: string | null | undefined;
  position?: string | null | undefined;
  extraLine?: string | null | undefined;
  bio?: string | null | undefined;
  location?: string | null | undefined;
  posts: number;
  followers: number;
  following: number;
  isMe: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  badge?: ReactNode;
  chips?: ReactNode;
  coverAction?: ReactNode;
  avatarAction?: ReactNode;
};

const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "AS";

/** One header for every profile — showcase or real member — with polished fallbacks for missing details. */
export function ProfileHeader(p: ProfileHeaderProps) {
  const realName = p.name?.trim();
  const sportLine = [p.sport, p.position].filter(Boolean).join(" · ");
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[3/1] min-h-28 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/35 via-card to-gold/25">
        {p.coverUrl && <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />}
        {!p.coverUrl && <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/80 to-transparent" aria-hidden />
        {p.coverAction}
      </div>
      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14">
          <div className="relative shrink-0 rounded-full border-4 border-card bg-card">
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt={realName ?? "Profile photo"} className="h-24 w-24 rounded-full object-cover object-top sm:h-28 sm:w-28" />
              : <span className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-accent/70 font-display text-3xl font-extrabold text-primary-foreground sm:h-28 sm:w-28" aria-label="No profile photo">{initialsOf(realName ?? "")}</span>}
            {p.avatarAction}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {p.isMe ? (
              <Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/onboarding"><Pencil className="h-4 w-4" />Edit profile</Link></Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className={cn("rounded-full font-bold", p.isFollowing ? "text-muted-foreground" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground")} onClick={p.onFollow}>{p.isFollowing ? "Following" : "Follow"}</Button>
                {p.onMessage && <Button variant="outline" size="sm" className="rounded-full" onClick={p.onMessage}><MessageCircle className="h-4 w-4" />Message</Button>}
              </>
            )}
            {p.onShare && <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Share profile" onClick={p.onShare}><Send className="h-4 w-4" /></Button>}
          </div>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <h1 className={cn("min-w-0 break-words font-display text-2xl font-extrabold uppercase sm:text-3xl", !realName && "text-muted-foreground")}>{realName || PLACEHOLDER.name}</h1>
          {p.roleLabel}
        </div>
        {p.badge && <div className="mt-2">{p.badge}</div>}
        <p className={cn("mt-1 text-sm font-semibold", !sportLine && "font-normal italic text-muted-foreground")}>{sportLine || PLACEHOLDER.sport}{sportLine && p.extraLine ? ` · ${p.extraLine}` : ""}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{p.location?.trim() || PLACEHOLDER.location}</p>

        <div className="mt-4 grid grid-cols-3 border-y border-border py-3 text-center">
          {([["Posts", p.posts], ["Followers", p.followers], ["Following", p.following]] as const).map(([l, v]) => (
            <div key={l} className="min-w-0"><div className="font-display text-xl font-bold">{(v ?? 0).toLocaleString()}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div></div>
          ))}
        </div>

        <p className={cn("mt-3 whitespace-pre-line text-sm", !p.bio?.trim() && "italic text-muted-foreground")}>{p.bio?.trim() || PLACEHOLDER.bio}</p>
        {p.chips && <div className="mt-3 flex flex-wrap gap-2 text-xs">{p.chips}</div>}
      </div>
    </section>
  );
}
