CREATE OR REPLACE FUNCTION public.can_see_profile(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    _id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = _id AND NOT p.is_private)
    OR EXISTS (SELECT 1 FROM follows f WHERE (f.follower_id = auth.uid() AND f.following_id = _id) OR (f.follower_id = _id AND f.following_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = auth.uid() AND m.recipient_id = _id) OR (m.sender_id = _id AND m.recipient_id = auth.uid()))
  )
$$;

CREATE OR REPLACE FUNCTION public.can_see_post(_post uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM posts p WHERE p.id = _post AND (
    p.author_id = auth.uid()
    OR NOT COALESCE((SELECT is_private FROM profiles WHERE id = p.author_id), false)
    OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.author_id)))
$$;

CREATE OR REPLACE FUNCTION public.media_owner_visible(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  BEGIN owner_id := split_part(_name, '/', 1)::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN public.can_see_profile(owner_id);
END $$;

DROP POLICY IF EXISTS "Members read profiles" ON public.profiles;
CREATE POLICY "Read visible profiles" ON public.profiles FOR SELECT TO authenticated USING (public.can_see_profile(id));

DROP POLICY IF EXISTS "Read follows" ON public.follows;
CREATE POLICY "Read follows of visible profiles" ON public.follows FOR SELECT TO authenticated
  USING (auth.uid() IN (follower_id, following_id) OR (public.can_see_profile(follower_id) AND public.can_see_profile(following_id)));

DROP POLICY IF EXISTS "Read likes" ON public.post_likes;
CREATE POLICY "Read likes on visible posts" ON public.post_likes FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.can_see_post(post_id));

DROP POLICY IF EXISTS "Signed-in members read comments" ON public.post_comments;
CREATE POLICY "Read comments on visible posts" ON public.post_comments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.can_see_post(post_id));

DROP POLICY IF EXISTS "Members read stats" ON public.athlete_stats;
CREATE POLICY "Read stats of visible profiles" ON public.athlete_stats FOR SELECT TO authenticated USING (public.can_see_profile(user_id));

DROP POLICY IF EXISTS "Members read roles" ON public.user_roles;
CREATE POLICY "Read roles of visible profiles" ON public.user_roles FOR SELECT TO authenticated USING (public.can_see_profile(user_id));

DROP POLICY IF EXISTS "Read opportunities" ON public.opportunities;
CREATE POLICY "Read open or own opportunities" ON public.opportunities FOR SELECT TO authenticated USING (
  auth.uid() = created_by OR deadline >= CURRENT_DATE
  OR EXISTS (SELECT 1 FROM applications a WHERE a.opportunity_id = opportunities.id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM saved_opportunities s WHERE s.opportunity_id = opportunities.id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Media read members" ON storage.objects;
CREATE POLICY "Media read own or visible members" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.media_owner_visible(name));