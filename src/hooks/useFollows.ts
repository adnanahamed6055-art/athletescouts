import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

let cache: Set<string> | null = null;
const listeners = new Set<(s: Set<string>) => void>();
const emit = (s: Set<string>) => { cache = s; listeners.forEach((l) => l(s)); };

/** Shared "who I follow" set so every Follow button stays in sync. */
export function useFollows(me: string) {
  const [following, setFollowing] = useState<Set<string>>(cache ?? new Set());
  useEffect(() => {
    listeners.add(setFollowing);
    if (!cache) {
      supabase.from("follows").select("following_id").eq("follower_id", me).then(({ data }) => emit(new Set((data ?? []).map((r) => r.following_id))));
    }
    return () => { listeners.delete(setFollowing); };
  }, [me]);

  const toggle = useCallback(async (id: string) => {
    const was = (cache ?? new Set()).has(id);
    const next = new Set(cache ?? []);
    if (was) next.delete(id); else next.add(id);
    emit(next);
    const { error } = was
      ? await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", id)
      : await supabase.from("follows").insert({ follower_id: me, following_id: id });
    if (error) {
      const back = new Set(cache ?? []);
      if (was) back.add(id); else back.delete(id);
      emit(back);
      toast.error(error.message);
    }
  }, [me]);

  return { following, toggle };
}

export function resetFollowsCache() { cache = null; }
