import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VerificationKind } from "@/lib/verification-rules";

export type AthleteBadge = { kind: VerificationKind; org_name: string; reviewed_at: string | null };
let cache: Map<string, AthleteBadge> | null = null;
let inflight: Promise<Map<string, AthleteBadge>> | null = null;

export function loadAthleteBadges(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = Promise.resolve(supabase.rpc("athlete_verified_badges")).then(({ data }) => {
    cache = new Map((data ?? []).map((r) => [r.user_id, { kind: r.kind as VerificationKind, org_name: r.org_name, reviewed_at: r.reviewed_at }]));
    inflight = null;
    return cache;
  });
  return inflight;
}

/** Approved athlete verification (organisation name, type, date) — never documents or IDs. */
export function useAthleteBadge(userId: string) {
  const [badge, setBadge] = useState<AthleteBadge | null>(cache?.get(userId) ?? null);
  useEffect(() => { loadAthleteBadges().then((m) => setBadge(m.get(userId) ?? null)); }, [userId]);
  return badge;
}
