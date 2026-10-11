import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export type Profile = Tables<"profiles">;
export type Person = Profile & { role: string | null };

export const ROLE_LABEL: Record<string, string> = { athlete: "Athlete", coach: "Coach", club_manager: "Club", scout: "Scout", admin: "Admin" };
export const ROLE_TONE: Record<string, string> = {
  athlete: "bg-primary/15 text-primary border-primary/40",
  coach: "bg-gold/15 text-gold border-gold/40",
  club_manager: "bg-accent/15 text-accent border-accent/40",
  scout: "bg-destructive/15 text-destructive border-destructive/40",
};

/** Loads profiles + their role for a set of ids. */
export async function loadPeople(ids: string[]): Promise<Record<string, Person>> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return {};
  const [{ data: ps }, { data: rs }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", uniq),
    supabase.from("user_roles").select("user_id, role").in("user_id", uniq),
  ]);
  const roles = new Map((rs ?? []).map((r) => [r.user_id, r.role]));
  return Object.fromEntries((ps ?? []).map((p) => [p.id, { ...p, role: roles.get(p.id) ?? null }]));
}

export async function loadAllPeople(): Promise<Person[]> {
  const [{ data: ps }, { data: rs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("onboarded", true).limit(500),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  const roles = new Map((rs ?? []).map((r) => [r.user_id, r.role]));
  return (ps ?? []).map((p) => ({ ...p, role: roles.get(p.id) ?? null }));
}

export const displayName = (p?: Pick<Profile, "full_name" | "org_name" | "username"> | null) =>
  p?.org_name || p?.full_name || (p?.username ? `@${p.username}` : "New member");

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Files live in a private bucket, so every display needs a short-lived signed link.
const signedCache = new Map<string, { url: string; exp: number }>();
export function useMediaUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    if (/^https?:/.test(path)) return path;
    const c = signedCache.get(path);
    return c && c.exp > Date.now() ? c.url : null;
  });
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    if (/^https?:/.test(path)) { setUrl(path); return; }
    const c = signedCache.get(path);
    if (c && c.exp > Date.now()) { setUrl(c.url); return; }
    let live = true;
    supabase.storage.from("media").createSignedUrl(path, 3600).then(({ data }) => {
      if (!data?.signedUrl || !live) return;
      signedCache.set(path, { url: data.signedUrl, exp: Date.now() + 3500_000 });
      setUrl(data.signedUrl);
    });
    return () => { live = false; };
  }, [path]);
  return url;
}

export async function uploadMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export function Avatar({ person, size = 40, className }: { person?: Pick<Profile, "avatar_url" | "full_name" | "org_name" | "username"> | null | undefined; size?: number; className?: string }) {
  const url = useMediaUrl(person?.avatar_url);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const name = displayName(person);
  const initials = name.replace("@", "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-neon font-display font-bold text-primary-foreground", className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {url && !broken ? <img src={url} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

export function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", ROLE_TONE[role])}>{ROLE_LABEL[role] ?? role}</span>;
}
