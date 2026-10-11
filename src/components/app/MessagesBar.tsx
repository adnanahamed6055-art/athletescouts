import { Link } from "@tanstack/react-router";
import { MessageCircle, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, displayName, loadPeople, type Person } from "@/lib/social";
import { DemoConnection, DemoTag } from "./Demo";
import { DEMO_PEOPLE } from "@/data/demo";

export function MessagesBar({ me }: { me: string }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    supabase.from("follows").select("follower_id").eq("following_id", me).limit(6).then(async ({ data }) => {
      setPeople(Object.values(await loadPeople((data ?? []).map((f) => f.follower_id))));
    });
  }, [me]);
  return <aside className="fixed bottom-5 right-5 z-40 hidden w-72 overflow-hidden rounded-lg border border-border bg-card shadow-glow lg:block">
    <Button variant="ghost" className="h-12 w-full justify-start rounded-none px-4" onClick={() => setOpen(!open)} aria-expanded={open}><MessageCircle /><span className="flex-1 text-left font-bold">Messages</span><ChevronDown className={open ? "rotate-180" : ""} /></Button>
    {open && <div className="max-h-80 overflow-y-auto border-t border-border p-2"><div className="flex justify-between px-2 py-2 text-xs"><span className="font-bold text-muted-foreground">Connections</span><Link to="/inbox" className="text-primary">Open inbox</Link></div>{people.map(p => <Button key={p.id} asChild variant="ghost" className="h-auto w-full justify-start py-3"><Link to="/inbox" search={{with:p.id}}><Avatar person={p} size={34}/><span className="truncate">{displayName(p)}</span></Link></Button>)}<div className="flex items-center gap-2 px-2 pt-3 text-xs text-muted-foreground">Suggested <DemoTag /></div>{DEMO_PEOPLE.filter(p => p.kind === "coach" || p.kind === "scout").slice(0,3).map(p => <DemoConnection key={p.id} p={p} onSelect={() => setOpen(false)}/>)}</div>}
  </aside>;
}