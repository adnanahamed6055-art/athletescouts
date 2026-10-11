ALTER TABLE public.profiles
  ADD COLUMN username text UNIQUE,
  ADD COLUMN bio text,
  ADD COLUMN location text,
  ADD COLUMN cover_url text,
  ADD COLUMN is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN show_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN last_seen_at timestamptz;

DROP POLICY "Own profile read" ON public.profiles;
CREATE POLICY "Members read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
DROP POLICY "Own stats all" ON public.athlete_stats;
CREATE POLICY "Members read stats" ON public.athlete_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own stats insert" ON public.athlete_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own stats update" ON public.athlete_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own stats delete" ON public.athlete_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Follow as self" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow as self" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  media_url text,
  media_type text NOT NULL DEFAULT 'image',
  is_highlight boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read posts" ON public.posts FOR SELECT TO authenticated USING (
  auth.uid() = author_id
  OR NOT (SELECT is_private FROM public.profiles WHERE id = author_id)
  OR EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = author_id)
);
CREATE POLICY "Write own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Edit own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Like as self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike as self" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_saves (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saves" ON public.post_saves FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TYPE public.opportunity_kind AS ENUM ('trial','tryout','showcase','camp','tournament');
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_name text NOT NULL,
  title text NOT NULL,
  kind public.opportunity_kind NOT NULL,
  sport text NOT NULL,
  level text NOT NULL DEFAULT 'All levels',
  location text NOT NULL,
  starts_on date NOT NULL,
  deadline date NOT NULL,
  description text NOT NULL DEFAULT '',
  positions text[] NOT NULL DEFAULT '{}',
  spots_total integer NOT NULL DEFAULT 20 CHECK (spots_total > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orgs post opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND (public.has_role(auth.uid(),'club_manager') OR public.has_role(auth.uid(),'coach') OR public.has_role(auth.uid(),'scout'))
);
CREATE POLICY "Edit own opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Delete own opportunities" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.applications (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicant or organiser reads" ON public.applications FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.created_by = auth.uid())
);
CREATE POLICY "Apply as self" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Withdraw as self" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.opportunity_counts()
RETURNS TABLE(opportunity_id uuid, applied integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT opportunity_id, count(*)::int FROM public.applications GROUP BY opportunity_id
$$;
REVOKE EXECUTE ON FUNCTION public.opportunity_counts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.opportunity_counts() TO authenticated;

CREATE TABLE public.saved_opportunities (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved opps" ON public.saved_opportunities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Send as self" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);
CREATE POLICY "Recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);
CREATE INDEX messages_pair_idx ON public.messages(sender_id, recipient_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.notify_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF TG_TABLE_NAME = 'follows' THEN
    INSERT INTO notifications(user_id, actor_id, type) VALUES (NEW.following_id, NEW.follower_id, 'follow');
  ELSIF TG_TABLE_NAME = 'post_likes' THEN
    SELECT author_id INTO target FROM posts WHERE id = NEW.post_id;
    IF target IS NOT NULL AND target <> NEW.user_id THEN
      INSERT INTO notifications(user_id, actor_id, type, entity_id) VALUES (target, NEW.user_id, 'like', NEW.post_id);
    END IF;
  ELSIF TG_TABLE_NAME = 'messages' THEN
    INSERT INTO notifications(user_id, actor_id, type, entity_id) VALUES (NEW.recipient_id, NEW.sender_id, 'message', NEW.id);
  ELSIF TG_TABLE_NAME = 'applications' THEN
    SELECT created_by INTO target FROM opportunities WHERE id = NEW.opportunity_id;
    IF target IS NOT NULL AND target <> NEW.user_id THEN
      INSERT INTO notifications(user_id, actor_id, type, entity_id) VALUES (target, NEW.user_id, 'application', NEW.opportunity_id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER follows_notify AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_event();
CREATE TRIGGER likes_notify AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_event();
CREATE TRIGGER messages_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_event();
CREATE TRIGGER applications_notify AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.notify_event();

CREATE POLICY "Media read members" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Media upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Media delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.opportunities (org_name, title, kind, sport, level, location, starts_on, deadline, description, positions, spots_total) VALUES
('Al Jazira Club Academy','U-16 Striker & Winger Trials','trial','Football','U-16','Mohammed Bin Zayed Stadium, Abu Dhabi', current_date + 21, current_date + 14,'Open trials for U-16 attacking players. Technical drills, small-sided games and a fitness test.', ARRAY['Striker','Winger'], 30),
('Abu Dhabi Indian School','Inter-School Cricket League Selection','tryout','Cricket','High School','ADIS Al Wathba, Abu Dhabi', current_date + 10, current_date + 6,'Selection for the ADIS squad ahead of the inter-school league.', ARRAY['Batter','Bowler','All-Rounder'], 18),
('Dubai Basketball Academy','Elite Guard Development Camp','camp','Basketball','U-18','Al Nasr Club, Dubai', current_date + 30, current_date + 20,'Five-day camp for guards focused on handling, reads and shooting.', ARRAY['Point Guard','Shooting Guard'], 24),
('Sharjah Athletics Federation','Emirates Youth Sprint Showcase','showcase','Athletics','U-20','Sharjah Athletics Stadium', current_date + 25, current_date + 18,'Timed 100m/200m showcase in front of university recruiters.', ARRAY['Sprinter'], 40),
('UAE Swimming Federation','National Age-Group Championships','tournament','Swimming','All levels','Hamdan Sports Complex, Dubai', current_date + 45, current_date + 30,'Age-group championship with national squad scouts in attendance.', ARRAY['Freestyle','Butterfly','Backstroke'], 120),
('Al Wahda FC','Goalkeeper Open Day','tryout','Football','U-14','Al Nahyan Stadium, Abu Dhabi', current_date + 7, current_date + 4,'Open assessment day for young goalkeepers.', ARRAY['Goalkeeper'], 12),
('Abu Dhabi Cricket','Emirates T20 Youth Cup','tournament','Cricket','U-19','Zayed Cricket Stadium, Abu Dhabi', current_date + 35, current_date + 21,'Regional U-19 T20 tournament. Register as a team or individual for the draft.', ARRAY['Batter','Bowler','Wicket-keeper'], 64),
('Palms Sports','Youth BJJ Selection Camp','camp','Martial Arts','U-17','Palms Sports Academy, Abu Dhabi', current_date + 14, current_date + 9,'Selection camp for the UAE youth jiu-jitsu development squad.', ARRAY['Gi','No-Gi'], 20);