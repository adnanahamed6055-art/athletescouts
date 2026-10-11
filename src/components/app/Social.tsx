import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_PEOPLE, initials } from "@/data/demo";
import { displayName, loadAllPeople, timeAgo, type Person } from "@/lib/social";

/** Shares a link via the native share sheet, falling back to copying it. */
export async function shareLink(path: string, title: string) {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) { await navigator.share({ title, url }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { toast.error("Couldn't copy the link"); }
}

const LINES = ["This is elite 🔥", "Footwork is so clean 👏", "Let's train together next week!", "Huge improvement from last season 💪", "Which academy is this?", "Scouts need to see this 👀", "Proud of you, keep pushing!", "That finish 😮‍💨", "Inspiring work ethic", "See you at the trials 🏆"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Deterministic conversation under a showcase post. */
export function demoComments(postId: string) {
  const h = hash(postId);
  const n = 3 + (h % 4);
  return Array.from({ length: n }, (_, i) => {
    const p = DEMO_PEOPLE[(h + i * 7) % DEMO_PEOPLE.length]!;
    return { id: `${postId}-${i}`, authorId: p.id, name: p.name, image: p.image, body: LINES[(h + i * 3) % LINES.length]!, ago: `${1 + ((h + i) % 9)}h` };
  });
}
export const demoCommentCount = (postId: string) => demoComments(postId).length;

type Line = { id: string; name: string; image?: string | undefined; body: string; ago: string; to?: { demo: string } | { real: string }; mine?: boolean };

function CommentList({ lines, onDelete }: { lines: Line[]; onDelete?: (id: string) => void }) {
  if (!lines.length) return <p className="py-10 text-center text-sm text-muted-foreground">No comments yet. Start the conversation.</p>;
  return <ul className="space-y-4">{lines.map((c) => {
    const avatar = c.image ? <img src={c.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover object-top" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-neon text-xs font-bold text-primary-foreground">{initials(c.name)}</span>;
    const name = c.to && "demo" in c.to ? <Link to="/people/$id" params={{ id: c.to.demo }} className="font-bold hover:underline">{c.name}</Link>
      : c.to && "real" in c.to ? <Link to="/u/$id" params={{ id: c.to.real }} className="font-bold hover:underline">{c.name}</Link> : <span className="font-bold">{c.name}</span>;
    return <li key={c.id} className="flex gap-3">{avatar}<div className="min-w-0 flex-1 text-sm"><p className="break-words">{name} {c.body}</p><span className="text-xs text-muted-foreground">{c.ago}</span></div>{c.mine && onDelete && <button type="button" aria-label="Delete comment" onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}</li>;
  })}</ul>;
}

function Shell({ open, onOpenChange, children, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode; onSubmit: (t: string) => void }) {
  const [text, setText] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex max-h-[85dvh] max-w-md flex-col gap-0 p-0">
    <DialogTitle className="border-b border-border p-4 text-center text-base font-bold">Comments</DialogTitle>
    <DialogDescription className="sr-only">Read and add comments</DialogDescription>
    <div className="min-h-40 flex-1 overflow-y-auto p-4">{children}</div>
    <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (t) { onSubmit(t.slice(0, 500)); setText(""); } }}>
      <input aria-label="Add a comment" maxLength={500} placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm" />
      <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Post comment"><Send /></Button>
    </form>
  </DialogContent></Dialog>;
}

export function DemoComments({ postId, open, onOpenChange, onCount }: { postId: string; open: boolean; onOpenChange: (o: boolean) => void; onCount?: (n: number) => void }) {
  const [mine, setMine] = useState<Line[]>([]);
  const seeded: Line[] = demoComments(postId).map((c) => ({ ...c, to: { demo: c.authorId } }));
  const all = [...seeded, ...mine];
  useEffect(() => { onCount?.(all.length); }, [all.length, onCount]);
  return <Shell open={open} onOpenChange={onOpenChange} onSubmit={(t) => setMine((m) => [...m, { id: String(Date.now()), name: "You", body: t, ago: "now", mine: true }])}>
    <CommentList lines={all} onDelete={(id) => setMine((m) => m.filter((x) => x.id !== id))} />
  </Shell>;
}

export function RealComments({ postId, me, open, onOpenChange, onCount }: { postId: string; me: string; open: boolean; onOpenChange: (o: boolean) => void; onCount?: (n: number) => void }) {
  const [rows, setRows] = useState<{ id: string; user_id: string; body: string; created_at: string }[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const load = async () => {
    const { data } = await supabase.from("post_comments").select("id,user_id,body,created_at").eq("post_id", postId).order("created_at");
    setRows(data ?? []); onCount?.(data?.length ?? 0);
  };
  useEffect(() => { if (open) { void load(); loadAllPeople().then((ps) => setPeople(Object.fromEntries(ps.map((p) => [p.id, p])))); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const lines: Line[] = rows.map((r) => ({ id: r.id, name: displayName(people[r.user_id] ?? null), body: r.body, ago: timeAgo(r.created_at), to: { real: r.user_id }, mine: r.user_id === me }));
  return <Shell open={open} onOpenChange={onOpenChange} onSubmit={async (t) => {
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: me, body: t });
    if (error) toast.error("Couldn't post your comment"); else void load();
  }}>
    <CommentList lines={lines} onDelete={async (id) => { await supabase.from("post_comments").delete().eq("id", id); void load(); }} />
  </Shell>;
}

