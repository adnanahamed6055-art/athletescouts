import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cache: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;
const listeners = new Set<(s: Set<string>) => void>();

export function loadVerifiedCoaches(force = false): Promise<Set<string>> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = Promise.resolve(supabase.rpc("verified_coach_ids")).then(({ data }) => {
    cache = new Set((data ?? []).map((r) => r.user_id));
    inflight = null;
    listeners.forEach((l) => l(cache!));
    return cache;
  });
  return inflight;
}

/** Set of user ids whose coach verification has been approved. */
export function useVerifiedCoaches() {
  const [set, setSet] = useState<Set<string>>(cache ?? new Set());
  useEffect(() => {
    listeners.add(setSet);
    loadVerifiedCoaches().then(setSet);
    return () => { listeners.delete(setSet); };
  }, []);
  return set;
}
